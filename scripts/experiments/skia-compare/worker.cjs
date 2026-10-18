'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module');
const {performance}=require('node:perf_hooks');
const [root,version,group,trial='0']=process.argv.slice(2);
if(!root||!['v3','v4'].includes(version))throw Error('Expected experiment root, v3|v4 and case group');
const snapshot=path.join(root,'snapshot'),prefix=path.join(root,'backends',version);
const entry=require.resolve(path.join(prefix,'node_modules/skia-canvas'));
const resolve=Module._resolveFilename;
// Route every production import to one addon; never load both backends together.
Module._resolveFilename=function(request,parent,...rest){
  return request==='skia-canvas'?entry:resolve.call(this,request,parent,...rest);
};
const out=path.join(root,'results',version,group+'-'+trial);fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const input=name=>fs.readFileSync(path.join(root,'inputs',name));
const source=name=>require(path.join(snapshot,'src',name));
const t0=performance.now(),Skia=require(entry),requireMs=performance.now()-t0;
const {Canvas,loadImage,FontLibrary}=Skia;
const records=[];
function save(name,bytes){fs.writeFileSync(path.join(out,name),bytes);return path.relative(root,path.join(out,name));}
function raster(rgba,width,height){
  const c=new Canvas(width,height),ctx=c.getContext('2d'),im=ctx.createImageData(width,height);
  im.data.set(rgba);ctx.putImageData(im,0,0);return c;
}
async function decoded(bytes){
  const im=await loadImage(bytes),c=new Canvas(im.width,im.height),ctx=c.getContext('2d');
  ctx.drawImage(im,0,0);return {width:im.width,height:im.height,rgba:Buffer.from(ctx.getImageData(0,0,im.width,im.height).data)};
}
async function capture(id,bytes,extra={}){
  const d=await decoded(bytes),file=id.replace(/[^a-zA-Z0-9_-]/g,'-');
  records.push({id,width:d.width,height:d.height,encodedSha256:hash(bytes),encodedBytes:bytes.length,
    rgbaSha256:hash(d.rgba),rgbaPath:save(file+'.rgba',d.rgba),imagePath:save(file+(extra.extension||'.png'),bytes),...extra});
}
async function decoding(){
  const Import=source('import/node.js');
  const rejected=new Set(['apng','pq','hlg','displayP3','mastering','lightLevel','rotatedExif','invalidDepth','combinedSignals']);
  for(const name of fs.readdirSync(path.join(root,'inputs')).filter(n=>/\.(png|jpg|webp|svg)$/.test(n)).sort()){
    const expectReject=name==='unsafe.svg'||[...rejected].some(x=>name==='png-boundaries-'+x+'.png');
    const bytes=input(name),before=hash(bytes);
    try{
      const asset=await Import.ingestLocalBytes(bytes,name),{width,height}=asset.metadata.oriented;
      if(expectReject)throw Error('Expected rejection did not occur');
      const file=name.replace(/\W/g,'-'),rgba=Buffer.from(asset.rgba);
      records.push({id:name,width,height,rgbaSha256:hash(rgba),rgbaPath:save(file+'.rgba',rgba),metadata:asset.metadata,sourceUnchanged:hash(bytes)===before,
        imagePath:save(file+'.png',Buffer.from(await raster(rgba,width,height).toBuffer('png')))});
    }catch(error){records.push({id:name,error:error.message,expectedRejection:expectReject,sourceUnchanged:hash(bytes)===before});}
  }
}
async function masks(){
  const SDK=source('sdk/index.js'),Sep=source('separation.js'),Package=source('print-package.js'),Plan=source('export-plan.js');
  for(const [width,height] of [[49,33],[33,49],[49,49],[97,61]])for(const variant of [null,'forest-contrast','coast-duotone']){
    const rgba=new Uint8ClampedArray(input(`rgba-${width}x${height}.bin`));
    const options={dpi:300,seed:142,style:{id:'editorial-halftone',...(variant?{variant}:{})}};
    const a=SDK.renderImage({width,height,rgba,colorSpace:'srgb'},options),id=`${width}x${height}-${variant||'base'}`;
    const pure={proof:hash(a.proof.rgba),plates:a.plates.map(p=>({id:p.id,coverage:hash(p.coverage),screened:hash(p.screened)})),recipe:a.recipe,print:Plan.printIntent(width,height,300,2)};
    records.push({id:id+'-js',pure,sourceUnchanged:hash(rgba)===hash(input(`rgba-${width}x${height}.bin`))});
    for(const p of a.plates){
      const bytes=Package.physicalPNG(Buffer.from(await raster(Sep.plateRGBA(p.screened),width,height).toBuffer('png')),300);
      await capture(id+'-plate-'+p.id,bytes,{kind:'master',print:a.geometry,coverageSha256:hash(p.screened),coveragePath:save(id+'-'+p.id+'.coverage',Buffer.from(p.screened))});
    }
    const proof=raster(a.proof.rgba,width,height);
    for(const format of ['png','jpg','webp']){
      const bytes=Buffer.from(await proof.toBuffer(format,{quality:.92}));
      await capture(id+'-proof-'+format,format==='png'?Package.physicalPNG(bytes,300):bytes,{kind:'proof',extension:'.'+format});
    }
  }
  const width=49,height=33,n=width*height,coverage=Uint8Array.from({length:n},(_,i)=>(i*37)%256);
  const layers=SDK.renderLayers({width,height,paper:'#f5eee2',inks:[{id:'key',name:'Green',color:'#006043',coverage}]},{dpi:300,seed:142,screenRecipe:{version:1,default:{mode:'dots',pitch:6,angle:25}}});
  records.push({id:'authored-layers-js',pure:{proof:hash(layers.proof.rgba),plates:layers.plates.map(p=>({coverage:hash(p.coverage),screened:hash(p.screened)})),recipe:layers.recipe,print:layers.geometry},sourceUnchanged:hash(coverage)===hash(Uint8Array.from({length:n},(_,i)=>(i*37)%256))});
}
async function fonts(){
  const base=path.join(snapshot,'.cache/stipra-paper-mono');
  FontLibrary.use('Trial Sans',[path.join(base,'IBMPlexSans-Regular.ttf'),path.join(base,'IBMPlexSans-Bold.ttf')]);
  FontLibrary.use('Trial Mono',[path.join(base,'IBMPlexMono-Regular.ttf'),path.join(base,'IBMPlexMono-Bold.ttf')]);
  FontLibrary.use('Trial Paper',[path.join(base,'PaperMono-Regular.ttf'),path.join(base,'PaperMono-ExtraBold.ttf')]);
  FontLibrary.use('Regular Only',path.join(base,'IBMPlexSans-Regular.ttf'));
  for(const [family,weight] of [['Trial Sans',400],['Trial Sans',700],['Trial Mono',400],['Trial Mono',700],['Trial Paper',400],['Trial Paper',800],['Regular Only',700]]){
    for(const synthesis of ['default',false]){
      const c=new Canvas(800,170),ctx=c.getContext('2d'),defaultSynthesis=ctx.fontSynthesis;
      if(synthesis!== 'default')ctx.fontSynthesis=synthesis;
      ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,800,170);ctx.fillStyle='#006043';ctx.font=`${weight} 64px "${family}"`;ctx.textBaseline='alphabetic';
      ctx.fillText('stiprā AV fi 0123',20,100);
      const metrics=ctx.measureText('stiprā AV fi 0123');
      const selected=['width','actualBoundingBoxLeft','actualBoundingBoxRight','actualBoundingBoxAscent','actualBoundingBoxDescent','fontBoundingBoxAscent','fontBoundingBoxDescent','emHeightAscent','emHeightDescent'];
      await capture(family.replace(/ /g,'-')+'-'+weight+'-'+synthesis,Buffer.from(await c.toBuffer('png')),
        {kind:'font',defaultSynthesis,synthesis:ctx.fontSynthesis,font:ctx.font,metrics:Object.fromEntries(selected.map(k=>[k,metrics[k]]))});
    }
  }
  const qr=source('report-qr.js'),svg=qr.svg({style:'ink-dots',ink:'#0d4dad'});save('ink-dots.svg',Buffer.from(svg));
  const im=await loadImage(Buffer.from(svg));
  for(const dpi of [150,300,600])for(const mm of [20,25.4,32]){
    const px=Math.round(mm*dpi/25.4),c=new Canvas(px,px);c.getContext('2d').drawImage(im,0,0,px,px);
    await capture(`qr-${dpi}-${mm}`,Buffer.from(await c.toBuffer('png')),{kind:'qr',dpi,mm,url:qr.GUIDE,svgSha256:hash(svg)});
  }
  const fontkit=require(path.join(snapshot,'node_modules/fontkit'));
  records.push({id:'real-font-shaping',pure:['IBMPlexSans-Bold.ttf','PaperMono-ExtraBold.ttf','PaperMono-Regular.ttf'].map(file=>{
    const bytes=fs.readFileSync(path.join(base,file)),font=fontkit.create(bytes),run=font.layout('stiprā');
    if(run.glyphs.length!==6||run.glyphs.some(g=>!g.id))throw Error('Missing real lowercase macron glyph');
    return {file,sha256:hash(bytes),glyphs:run.glyphs.map(g=>g.id),positions:run.positions};
  })});
}
async function reports(){
  const Package=source('print-package.js'),Styles=source('styles.js'),Import=source('import/node.js');
  const Report=source('report-layout.js'),background=Report.paperBackground,pdfReport=Report.pdfReport;
  const controls=path.join(root,'controls');fs.mkdirSync(controls,{recursive:true});
  Report.paperBackground=async m=>{
    const bytes=await background(m);save('paper-'+m.orientation+'.png',bytes);
    const frozen=path.join(controls,'paper-'+m.orientation+'.png');
    if(version==='v3'&&!fs.existsSync(frozen))fs.writeFileSync(frozen,bytes);
    return bytes;
  };
  Report.pdfReport=async(cards,m)=>{
    const fixed=fs.readFileSync(path.join(controls,'paper-'+m.orientation+'.png'));
    const bytes=await pdfReport(cards,{...m,reportPaperBytes:fixed});save('fixed-paper-'+m.orientation+'.pdf',bytes);
    return pdfReport(cards,m);
  };
  for(const [w,h] of [[49,33],[33,49]]){
    const originalBytes=input(`rgba-${w}x${h}.png`),asset=await Import.ingestLocalBytes(originalBytes,'procedural.png');
    const style=Styles.resolve('editorial-halftone',{dpi:300,seed:142});
    const result=await Package.generate({originalBytes,asset,inkRecipe:style.inkRecipe,screenRecipe:style.screenRecipe,dpi:300,paper:'recipe',marksMm:2,exports:{formats:['png','jpg','webp'],vectorPlates:true}});
    const dir=path.join(out,`${w}x${h}`);fs.mkdirSync(dir,{recursive:true});
    for(const [file,bytes] of result.parts){
      if(/\.(pdf|json|svg|png|jpg|webp)$/.test(file)){
        const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
      }
    }
    save(`${w}x${h}.zip`,result.zip);
    records.push({id:`report-${w}x${h}`,manifest:result.manifest,parts:[...result.parts].map(([name,b])=>({name,bytes:b.length,sha256:hash(b)})),artifactDirectory:path.relative(root,dir)});
  }
  const {PDFDocument,rgb}=require(path.join(snapshot,'node_modules/pdf-lib'));
  const qr=source('report-qr.js'),pdf=await PDFDocument.create({updateMetadata:false}),page=pdf.addPage([595.27559,841.88976]),boxes=[];
  page.drawRectangle({x:0,y:0,width:595.27559,height:841.88976,color:rgb(.961,.933,.886)});
  const png=await qr.png({style:'ink-dots',ink:'#0d4dad'}),embed=await pdf.embedPng(png);
  for(const [i,mm] of [20,25.4,32].entries()){
    const pt=mm*72/25.4,b={x:40+i*180,y:600,width:pt,height:pt};page.drawImage(embed,b);boxes.push({mm,...b});
  }
  const bytes=Buffer.from(await pdf.save({useObjectStreams:false}));
  records.push({id:'qr-specimen',pdfPath:save('qr-specimen.pdf',bytes),boxes,url:qr.GUIDE});
}
async function paper(){
  const Paper=source('report-paper.js');
  for(const [width,height] of [[448,448],[1684,1191]])for(const style of ['none','fibre','speckled']){
    const bytes=await Paper.tile({name:'Recipe substrate',hex:'#f0e8d9'},142,{width,height,inks:['#273138','#3286a0'],style});
    await capture(`paper-${width}x${height}-${style}`,bytes,{kind:'paper',style});
  }
}
async function memory(){
  const t1=performance.now(),c=new Canvas(1024,768),ctx=c.getContext('2d'),canvasMs=performance.now()-t1;
  const t2=performance.now();await loadImage(input('rgba-97x61.png'));const decodeMs=performance.now()-t2;
  ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,1024,768);
  const t3=performance.now();await c.toBuffer('png');const encodeMs=performance.now()-t3;
  const samples=[];
  for(let i=0;i<65;i++){
    ctx.fillStyle=['#006043','#ff665d','#0d4dad','#e2a523'][i%4];ctx.fillRect((i*17)%1000,(i*11)%740,20,20);
    const before=performance.now(),bytes=await c.toBuffer('png');
    if(global.gc)global.gc();
    samples.push({i,warmup:i<5,ms:performance.now()-before,bytes:bytes.length,...process.memoryUsage()});
  }
  records.push({id:'memory',requireMs,canvasMs,decodeMs,encodeMs,engine:c.engine,samples,resourceUsage:process.resourceUsage(),gcExposed:!!global.gc});
}
async function main(){
  const cases={decode:decoding,masks,fonts,reports,paper,memory};if(!cases[group])throw Error('Unknown group');
  await cases[group]();
  const native=Object.keys(require.cache).filter(p=>p.endsWith('.node'));
  if(native.length!==1||!native[0].startsWith(prefix+path.sep))throw Error('Backend isolation failed: '+native.join(', '));
  const manifest=JSON.parse(fs.readFileSync(path.join(prefix,'node_modules/skia-canvas/package.json')));
  fs.writeFileSync(path.join(out,'records.json'),JSON.stringify({version:manifest.version,group,trial,node:process.version,platform:process.platform,arch:process.arch,engine:new Canvas(1,1).engine,native:native.map(p=>({path:path.relative(root,p),sha256:hash(fs.readFileSync(p))})),records},null,2)+'\n');
  console.log(JSON.stringify({version,group,trial,cases:records.length}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
