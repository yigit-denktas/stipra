/* Stiprā v1 print package. Image, ink, paper and printing geometry stay independent. MIT. */
'use strict';
const crypto=require('node:crypto'),{Canvas,loadImage}=require('skia-canvas');
const JSZip=require('jszip');
const {freezeProject}=require('./source-project');
const Report=require('./report-layout.js'),Paper=require('./report-paper.js'),Diagnostics=require('./plate-diagnostics.js'),QR=require('./report-qr.js');
const Sep=require('./separation.js'),Screen=require('./screening.js');
const A4=[841.88976,595.27559],FIXED=new Date('2000-01-01T00:00:00Z');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=x=>Buffer.from(JSON.stringify(x,null,2)+'\n');
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const clean=x=>String(x).replace(/[^a-z0-9_-]/gi,'-');
const xml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {validate,printIntent,screenConfigs}=require('./export-plan.js');
// PNG pHYs is physical pixel density: prevent printing software treating a master as 72 DPI.
function physicalPNG(bytes,dpi){
  if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);
  if(bytes.toString('ascii',1,4)!=='PNG'||bytes.toString('ascii',12,16)!=='IHDR')
    throw Error('print: expected PNG encoded by canvas');
  const ppm=Math.round(dpi*1000/25.4),data=Buffer.alloc(9);
  data.writeUInt32BE(ppm,0);data.writeUInt32BE(ppm,4);data[8]=1;
  const type=Buffer.from('pHYs'),payload=Buffer.concat([type,data]);
  let crc=0xffffffff;
  for(const byte of payload){
    crc^=byte;
    for(let k=0;k<8;k++)crc=(crc>>>1)^(crc&1?0xedb88320:0);
  }
  const chunk=Buffer.alloc(21);
  chunk.writeUInt32BE(9,0);payload.copy(chunk,4);chunk.writeUInt32BE((crc^0xffffffff)>>>0,17);
  const chunks=[bytes.subarray(0,33),chunk];
  for(let at=33;at<bytes.length;){
    if(at+12>bytes.length)throw Error('print: truncated PNG chunk');
    const end=at+12+bytes.readUInt32BE(at);if(end>bytes.length)throw Error('print: invalid PNG chunk length');
    if(bytes.toString('ascii',at+4,at+8)!=='pHYs')chunks.push(bytes.subarray(at,end));
    at=end;
  }
  return Buffer.concat(chunks);
}
async function png(rgba,w,h,dpi){
  const c=new Canvas(w,h),ctx=c.getContext('2d'),data=ctx.createImageData(w,h);
  data.data.set(rgba);ctx.putImageData(data,0,0);
  return physicalPNG(Buffer.from(await c.toBuffer('png')),dpi);
}
function paperRGBA(w,h,hex){
  const [r,g,b]=color(hex).map(x=>Math.round(x*255)),pixels=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=255;}
  return pixels;
}
async function marked(pngBytes,w,h,pad,dpi){
  if(!pad)return pngBytes;
  const img=await loadImage(pngBytes),c=new Canvas(w+2*pad,h+2*pad),ctx=c.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,pad,pad);
  ctx.strokeStyle='#000';ctx.lineWidth=1;
  for(const x of [pad,pad+w])for(const y of [pad,pad+h]){
    const sx=x===pad?-1:1,sy=y===pad?-1:1;
    ctx.beginPath();ctx.moveTo(x+sx*2,y);ctx.lineTo(x+sx*Math.max(5,pad*.6),y);
    ctx.moveTo(x,y+sy*2);ctx.lineTo(x,y+sy*Math.max(5,pad*.6));ctx.stroke();
  }
  return physicalPNG(Buffer.from(await c.toBuffer('png')),dpi);
}
async function build({originalBytes,asset,inkRecipe,screenRecipe=null,dpi=300,marksMm=0,paper='auto',style=null,reportTexture='speckled',qrStyle='ink-dots',authored=null,sourceProject=null,exports:exportOptions=null}){
  validate(dpi,marksMm);Paper.textureStyle(reportTexture);
  if(authored&&exportOptions?.alpha==='source')throw Error('Authored layers have no single source alpha; use paper');
  if(!QR.STYLES.includes(qrStyle))throw Error('print: unknown QR style');
  if(!Buffer.isBuffer(originalBytes)||!originalBytes.length)throw Error('print: original bytes required');
  const {width:w,height:h}=asset.metadata.oriented;
  const stock=Paper.select(asset.rgba,inkRecipe.paper||'#ffffff',paper);
  const effectiveRecipe={...inkRecipe,paper:stock.hex};
  const sep=authored?{...authored.separated,recipe:effectiveRecipe}:Sep.separate({width:w,height:h,rgba:asset.rgba},effectiveRecipe);
  const configs=screenConfigs(screenRecipe,sep.masks.map(m=>m.id));
  const screened=Screen.apply(sep,configs.production),proofScreen=Screen.apply(sep,configs.proof);
  const plateDiagnostics=Diagnostics.inspect(screened,{dpi,...(authored?{}:{input:{width:w,height:h,rgba:asset.rgba}})});
  const print=printIntent(w,h,dpi,marksMm),pad=Math.round(dpi*marksMm/25.4);
  if((w+2*pad)*(h+2*pad)>24000000||w+2*pad>20000||h+2*pad>20000)throw Error('Marked sheet exceeds 24 MP / 20000 px budget');
  if(pad)print.markedPixels={width:w+2*pad,height:h+2*pad,trimOrigin:{x:pad,y:pad}};
  const parts=new Map(),add=(name,data)=>{
    if(!/^[a-z0-9/_-]+\.(?:jpg|png|webp|svg|txt|json|html|pdf|bin)$/i.test(name)||name.includes('..')||parts.has(name))
      throw Error('print: invalid or repeated path '+name);
    parts.set(name,Buffer.from(data));
  };
  const ext=asset.metadata.format==='jpeg'?'jpg':asset.metadata.format;
  add('source/original.'+(authored?'json':ext==='svg'?'txt':ext),originalBytes);
  if(authored)for(let i=0;i<sep.masks.length;i++)add(authored.descriptor.inks[i].path,
    await png(Sep.plateRGBA(sep.masks[i].coverage),w,h,dpi));
  const derivatives=exportOptions?await require('./proof-exports').generate({rgba:proofScreen.preview,sourceRGBA:asset.rgba,width:w,height:h,paper:sep.recipe.paper,dpi,options:exportOptions,physicalPNG}):null;
  if(derivatives)for(const file of derivatives.files)add(file.path,file.bytes);
  const original=await png(asset.rgba,w,h,dpi),proof=await png(proofScreen.preview,w,h,dpi);
  add('source/normalized.png',original);add('proof/composite.png',proof);
  const paperImage=await png(paperRGBA(w,h,sep.recipe.paper),w,h,dpi);add('proof/paper.png',paperImage);
  const cards=[{name:authored?'Authored composite':'Original',bytes:original},{name:'Simulated overprint',bytes:proof},
    {name:'Paper / substrate',bytes:paperImage,note:'not a physical ink'}],inks=[];
  for(let i=0;i<sep.masks.length;i++){
    const ink=sep.masks[i],s=screened.masks[i],name=String(i+1).padStart(2,'0')+'-'+clean(ink.id);
    const mono=await png(Sep.plateRGBA(ink.coverage),w,h,dpi),scr=await png(Sep.plateRGBA(s.coverage),w,h,dpi);
    add('plates/ink-'+name+'.png',mono);add('screened/ink-'+name+'.png',scr);
    let vector=null;
    if(derivatives?.settings.vectorPlates){
      vector='screened/ink-'+name+'.svg';
      add(vector,require('./vector-samples').svgSamples(Sep.plateRGBA(s.coverage),w,h,{dpi}).text);
    }
    if(pad)add('plates/marked-'+name+'.png',await marked(scr,w,h,pad,dpi));
    const description=(screened.stats.inks[i].meanCoverage*100).toFixed(1)+'% coverage; '+s.screen.mode+' '+s.screen.pitch+'px @ '+s.screen.angle+'deg';
    cards.push({name:ink.name,bytes:scr,ink:ink.color,note:description});
    inks.push({id:ink.id,name:ink.name,color:ink.color,source:authored?'authored':ink.source,
      meanCoverage:sep.stats.inks[i].meanCoverage,screenedMeanCoverage:screened.stats.inks[i].meanCoverage,
      plate:'plates/ink-'+name+'.png',screened:'screened/ink-'+name+'.png',
      ...(vector?{vector,vectorRepresentation:'sampled-pixel-run-paths'}:{}),marked:pad?'plates/marked-'+name+'.png':null,registration:{x:0,y:0,rotate:0}});
  }
  const info={reportTexture,qrStyle,sourceKind:authored?'authored':'image',width:w,height:h,trim:print.trimMm,dpi,inks:inks.length,seed:configs.proof.seed,
    sha:digest(originalBytes),name:asset.metadata.sourceName,paper:stock,
    orientation:Report.orientation(w,h),inkRecipe:sep.recipe,
    screenRecipe:configs.production,proofRecipe:configs.proof,diagnostics:plateDiagnostics,
    settings:inks.map((ink,i)=>({name:ink.name,color:ink.color,source:ink.source,
      coverage:ink.screenedMeanCoverage,mode:screened.masks[i].screen.mode,
      pitch:screened.masks[i].screen.pitch,angle:screened.masks[i].screen.angle}))};
  info.reportPaperBytes=await Report.paperBackground(info);
  add('report/separation-sheet.html',Report.htmlReport(cards,info));
  add('report/separation-sheet.pdf',await Report.pdfReport(cards,info));
  add('recipe/inks.json',json(sep.recipe));add('recipe/screens.json',json(configs.production));
  add('recipe/proof-screens.json',json(configs.proof));
  add('report/diagnostics.json',json(plateDiagnostics));
  add('licenses/IBM-Plex-OFL.txt',require('./report-fonts.js').license());
  if(style)add('recipe/style.json',json(style));
  let project=null;
  if(sourceProject){
    const artifacts=sourceProject.artifacts.map(({bytes,...a})=>{
      const path='source/project/files/'+a.id+'.bin';add(path,bytes);return {...a,path,bytes:bytes.length,sha256:digest(bytes)};
    });
    const descriptor={contract:'stipra-source-project-v1',version:1,frame:sourceProject.frame,artifacts,relationships:sourceProject.relationships,
      snapshotSha256:info.sha,execution:'inert; never automatically execute source artifacts',origin:'caller-declared; byte hashes do not authenticate origin'};
    const bytes=json(descriptor);add('source/project.json',bytes);
    project={path:'source/project.json',sha256:digest(bytes),artifacts:artifacts.length};
  }
  const manifest={...(project?{sourceProject:project}:{}),contract:'stipra-print-package-v1',displayName:'Stiprā',
    source:{...asset.metadata,sha256:info.sha},output:print,
    ...(derivatives?{exports:{settings:derivatives.settings,proofs:derivatives.metadata,masters:'native-frame, zero registration; no derivative scale applied'}}:{}),
    mode:sep.recipe.mode,paper:sep.recipe.paper,paperSelection:stock,inks,
    diagnostics:{path:'report/diagnostics.json',contract:plateDiagnostics.contract,
      warnings:plateDiagnostics.warnings.length,reviewRequired:plateDiagnostics.warnings.length>0},
    ...(style?{style:{id:style.style.id,version:style.style.version,variant:style.style.variant,variantVersion:style.style.variantVersion,physicalScreens:style.physicalScreens,targetLpi:style.targetLpi,
      effectiveLpi:style.effectiveLpi,warnings:style.warnings,recipe:'recipe/style.json'}}:{}),
    screen:{seed:configs.proof.seed,proofOnlyRegistration:true,
      productionRecipe:'recipe/screens.json',proofRecipe:'recipe/proof-screens.json'},
    report:{pdf:'report/separation-sheet.pdf',html:'report/separation-sheet.html',
      widthMm:info.orientation==='portrait'?210:297,heightMm:info.orientation==='portrait'?297:210,
      orientation:info.orientation,fonts:'IBM Plex Sans / IBM Plex Mono (SIL OFL 1.1)',
      fontLicense:'licenses/IBM-Plex-OFL.txt',embeddedRecipes:true,qrDestination:Report.GUIDE,qr:{style:qrStyle,sizeMm:25.4,errorCorrection:'H',quietZoneModules:4},inspectionOnly:true,minTextPt:9,layoutVersion:5,texture:{style:reportTexture,dpi:144,simulation:true},theme:Paper.theme(stock,info.settings)},
    files:[...parts].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>({path:name,bytes:data.length,sha256:digest(data)})),
    uncalibrated:true,notes:['Digital RGB overprint is not a calibrated press proof.',
      'Production plates always use zero registration offset.',derivatives?'Native masters are preserved; proof derivative scaling is declared in exports metadata.':'Native pixel dimensions are preserved; no resizing performed.']};
  add('manifest.json',json(manifest));
  if(parts.size>256||[...parts.values()].some(b=>b.length>64*1024*1024)||[...parts.values()].reduce((n,b)=>n+b.length,0)>256*1024*1024)throw Error('Print package exceeds bounded archive limits');
  const zip=new JSZip();
  for(const [name,data] of [...parts].sort(([a],[b])=>a.localeCompare(b)))
    zip.file(name,data,{date:FIXED,createFolders:false,compression:'DEFLATE'});
  const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',
    compressionOptions:{level:6},platform:'UNIX'});
  if(bytes.length>64*1024*1024)throw Error('Print ZIP exceeds 64 MiB archive limit');
  return {zip:bytes,manifest,parts};
}
/** Generates the shared image-input package without accepting precomputed mask overrides. */
function generate({originalBytes,asset,inkRecipe,screenRecipe,dpi,marksMm,paper,style,reportTexture,qrStyle,sourceProject,exports:exportOptions}){
  sourceProject=freezeProject(sourceProject,asset.metadata.oriented.width,asset.metadata.oriented.height);
  return build({originalBytes,asset,inkRecipe,screenRecipe,dpi,marksMm,paper,style,reportTexture,qrStyle,sourceProject,exports:exportOptions});
}
/**
 * Archives authored coverages and uses the same proof/master/report writer as image inputs.
 * @param options - The full-frame layer input, screen recipe and optional output settings.
 * @returns The package with lossless source masks, normalized recipes and aligned masters.
 */
async function generateLayers({input,screenRecipe=null,dpi=300,marksMm=0,paper='recipe',reportTexture='speckled',qrStyle='ink-dots',captureMetadata=null,sourceProject=null,exports:exportOptions=null}){
  const {renderLayers}=require('./sdk/index.js');
  const source=renderLayers(input,{dpi}),{width,height}=source.proof;
  sourceProject=freezeProject(sourceProject,width,height);
  const descriptor={contract:'stipra-authored-source-v1',width,height,paper:source.recipe.inks.paper,
    polarity:'print grayscale: white means no ink, black means full ink',
    inks:source.plates.map((ink,i)=>({id:ink.id,name:ink.name,color:ink.color,
      path:'source/layers/ink-'+String(i+1).padStart(2,'0')+'-'+clean(ink.id)+'.png',coverageSha256:digest(ink.coverage)}))};
  const originalBytes=json(descriptor),metadata={contract:'stipra-import-v1',format:'authored-layers',sourceName:'Authored ink layers',
    intrinsic:{width,height},oriented:{width,height},orientation:1,alpha:false,
    profile:{kind:'not-applicable'},pixels:{channels:'RGBA',bitDepth:8,colorSpace:'srgb',orientationApplied:true},
    provenance:{representation:'owned coverage snapshot; no original file bytes implied',sourceLayers:'source/original.json',...(captureMetadata?{capture:captureMetadata}:{})},warnings:[]};
  const separated={width,height,recipe:source.recipe.inks,
    masks:source.plates.map(x=>({id:x.id,name:x.name,color:x.color,coverage:x.coverage,source:'authored'})),
    stats:{inks:source.diagnostics.plates.map(x=>({id:x.id,meanCoverage:x.meanCoverage}))}};
  return build({originalBytes,asset:{metadata,rgba:source.proof.rgba},inkRecipe:source.recipe.inks,screenRecipe,dpi,marksMm,paper,reportTexture,qrStyle,
    authored:{separated,descriptor},sourceProject,exports:exportOptions});
}
module.exports={generate,generateLayers,printIntent,validate,screenConfigs,physicalPNG,A4};
