/* Stiprā v1 print package. Image, ink, paper and printing geometry stay independent. MIT. */
'use strict';
const crypto=require('node:crypto'),{Canvas,loadImage}=require('skia-canvas');
const {PDFDocument,StandardFonts,rgb}=require('pdf-lib'),JSZip=require('jszip');
const Sep=require('./separation.js'),Screen=require('./screening.js');
const A4=[841.88976,595.27559],FIXED=new Date('2000-01-01T00:00:00Z');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=x=>Buffer.from(JSON.stringify(x,null,2)+'\n');
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const clean=x=>String(x).replace(/[^a-z0-9_-]/gi,'-');
const xml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(dpi,marksMm){
  if(!Number.isFinite(dpi)||dpi<72||dpi>1200)throw Error('print: DPI must be between 72 and 1200');
  if(!Number.isFinite(marksMm)||marksMm<0||marksMm>15)throw Error('print: marks-mm must be 0..15');
}
function printIntent(w,h,dpi,marksMm){
  validate(dpi,marksMm);
  return {dpi,sourcePixels:{width:w,height:h},origin:{x:0,y:0},
    trimPixels:{x:0,y:0,width:w,height:h},
    trimMm:{width:Number((w*25.4/dpi).toFixed(4)),height:Number((h*25.4/dpi).toFixed(4))},
    resampled:false,registration:{x:0,y:0,rotate:0},marksMm,profile:null};
}
async function png(rgba,w,h){
  const c=new Canvas(w,h),ctx=c.getContext('2d'),data=ctx.createImageData(w,h);
  data.data.set(rgba);ctx.putImageData(data,0,0);
  return Buffer.from(await c.toBuffer('png'));
}
function paperRGBA(w,h,hex){
  const [r,g,b]=color(hex).map(x=>Math.round(x*255)),pixels=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=255;}
  return pixels;
}
function screenConfigs(raw,ids){
  const proof=Screen.config(raw||{version:1},ids);
  const production={version:1,seed:proof.seed,default:{...proof.default,registration:{x:0,y:0,rotate:0}},plates:{}};
  for(const id of ids)production.plates[id]={...proof.plates[id],registration:{x:0,y:0,rotate:0}};
  return {proof,production};
}
async function marked(pngBytes,w,h,pad){
  if(!pad)return pngBytes;
  const img=await loadImage(pngBytes),c=new Canvas(w+2*pad,h+2*pad),ctx=c.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,pad,pad);
  ctx.strokeStyle='#000';ctx.lineWidth=1;
  for(const x of [pad,pad+w])for(const y of [pad,pad+h]){
    const sx=x===pad?-1:1,sy=y===pad?-1:1;
    ctx.beginPath();ctx.moveTo(x+sx*2,y);ctx.lineTo(x+sx*Math.max(5,pad*.6),y);
    ctx.moveTo(x,y+sy*2);ctx.lineTo(x,y+sy*Math.max(5,pad*.6));ctx.stroke();
  }
  return Buffer.from(await c.toBuffer('png'));
}
function htmlReport(cards,meta){
  const panel=c=>'<figure><div class="image"><img alt="'+xml(c.name)+'" src="data:image/png;base64,'+
    c.bytes.toString('base64')+'"></div><figcaption><strong>'+xml(c.name)+'</strong>'+
    (c.ink?'<span class="swatch" style="background:'+c.ink+'"></span>':'')+
    '<small>'+xml(c.note||'')+'</small></figcaption></figure>';
  return Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Stiprā · separation sheet</title><style>'+
    '*{box-sizing:border-box}body{margin:0;background:#eeeae2;color:#292824;font:14px system-ui,sans-serif}'+
    'main{max-width:1100px;margin:auto;padding:18px}h1{font-size:38px;letter-spacing:-.06em;margin:0}h2{margin:18px 0 9px}'+
    '.hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}'+
    '.plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}'+
    'figure{margin:0;min-width:0;background:#fff;border:1px solid #d2d0ca;border-radius:5px;overflow:hidden}'+
    '.image{height:260px;display:grid;place-items:center;padding:9px}.plates .image{height:160px}'+
    'img{display:block;object-fit:contain;max-width:100%;max-height:100%}figcaption{display:flex;align-items:center;gap:8px;padding:10px;flex-wrap:wrap}'+
    'small{margin-left:auto;color:#666}.swatch{width:13px;height:13px;border:1px solid #aaa;border-radius:50%}'+
    'footer{margin-top:18px;border-top:1px solid #bbb;padding-top:12px;color:#555;overflow-wrap:anywhere}'+
    '@media(max-width:650px){.hero{grid-template-columns:1fr}}@page{size:A4 landscape;margin:10mm}'+
    '@media print{body{background:white;font-size:10px}main{padding:0}h1{font-size:22px}'+
    '.image{height:73mm}.plates .image{height:37mm}.plates{grid-template-columns:repeat(4,minmax(0,1fr))}'+
    'figure{break-inside:avoid}}'+
    '</style></head><body><main><h1>Stiprā / ink study</h1><p>'+xml(meta.name)+
    ' · '+meta.width+' × '+meta.height+' px · '+meta.dpi+' DPI · '+meta.trim.width+' × '+meta.trim.height+
    ' mm · '+meta.inks+' inks</p><h2>Artwork & overprint</h2><section class="hero">'+
    cards.slice(0,2).map(panel).join('')+'</section><h2>Each layer</h2><section class="plates">'+
    cards.slice(2).map(panel).join('')+'</section><footer>Digital approximation, not press-calibrated. '+
    'The paper is not an ink plate. All masters share one source pixel grid. Source SHA-256 '+meta.sha+
    '. Screen seed '+meta.seed+'.</footer></main></body></html>');
}
async function pdfReport(cards,meta){
  const pdf=await PDFDocument.create({updateMetadata:false});
  pdf.setTitle('Stipra - separation study');pdf.setCreator('Stipra print-package v1');
  pdf.setCreationDate(FIXED);pdf.setModificationDate(FIXED);
  const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const blocks=[];for(let i=2;i<cards.length;i+=4)blocks.push(cards.slice(i,i+4));
  const cache=new Map();
  async function embed(card){if(!cache.has(card.name))cache.set(card.name,await pdf.embedPng(card.bytes));return cache.get(card.name);}
  async function drawCard(page,card,x,y,w,h){
    page.drawRectangle({x,y,width:w,height:h,color:rgb(1,1,1),borderColor:rgb(.83,.83,.81),borderWidth:.6});
    const img=await embed(card),scale=Math.min((w-16)/img.width,(h-38)/img.height);
    const iw=img.width*scale,ih=img.height*scale;
    page.drawImage(img,{x:x+(w-iw)/2,y:y+28+(h-35-ih)/2,width:iw,height:ih});
    page.drawLine({start:{x,y:y+24},end:{x:x+w,y:y+24},thickness:.5,color:rgb(.84,.84,.82)});
    page.drawText(card.name.replace(/[^\x20-\x7e]/g,'?'),{x:x+7,y:y+8,size:9,font:bold,color:rgb(.13,.13,.13),maxWidth:w-14});
    if(card.ink){const [r,g,b]=color(card.ink);page.drawRectangle({x:x+w-21,y:y+8,width:11,height:9,color:rgb(r,g,b)});}
  }
  for(let i=0;i<Math.max(1,blocks.length);i++){
    const page=pdf.addPage(A4);page.drawRectangle({x:0,y:0,width:A4[0],height:A4[1],color:rgb(.974,.969,.956)});
    page.drawText('STIPRA / PRINT SEPARATION',{x:28,y:550,size:19,font:bold,color:rgb(.15,.15,.15)});
    page.drawText(meta.width+' x '+meta.height+' px  |  '+meta.dpi+' DPI  |  '+meta.trim.width+' x '+meta.trim.height+' mm  |  '+meta.inks+' inks',
      {x:28,y:526,size:9,font,color:rgb(.36,.36,.36)});
    if(i===0){
      const w=(A4[0]-70)/2;
      await drawCard(page,cards[0],28,286,w,224);
      await drawCard(page,cards[1],42+w,286,w,224);
    }else page.drawText('INK PLATES - CONTINUED',{x:28,y:452,size:13,font:bold});
    const row=blocks[i]||[],gap=8,width=(A4[0]-56-gap*3)/4,height=i===0?167:230;
    for(let j=0;j<row.length;j++)await drawCard(page,row[j],28+j*(width+gap),i===0?97:218,width,height);
    page.drawLine({start:{x:28,y:77},end:{x:A4[0]-28,y:77},thickness:.6,color:rgb(.65,.65,.65)});
    page.drawText('DIGITAL PROOF ONLY - physical ink, substrate and registration not calibrated.',{x:28,y:60,size:9,font:bold});
    page.drawText('Original SHA256 '+meta.sha,{x:28,y:44,size:8,font});
    page.drawText('Paper is not an ink. Report is not a stencil master.',{x:28,y:30,size:8,font});
  }
  return Buffer.from(await pdf.save({useObjectStreams:false}));
}
async function generate({originalBytes,asset,inkRecipe,screenRecipe=null,dpi=300,marksMm=0}){
  validate(dpi,marksMm);
  if(!Buffer.isBuffer(originalBytes)||!originalBytes.length)throw Error('print: original bytes required');
  const {width:w,height:h}=asset.metadata.oriented;
  const sep=Sep.separate({width:w,height:h,rgba:asset.rgba},inkRecipe);
  const configs=screenConfigs(screenRecipe,sep.masks.map(m=>m.id));
  const screened=Screen.apply(sep,configs.production),proofScreen=Screen.apply(sep,configs.proof);
  const print=printIntent(w,h,dpi,marksMm),pad=Math.round(dpi*marksMm/25.4);
  const parts=new Map(),add=(name,data)=>{
    if(!/^[a-z0-9/_-]+\.(?:jpg|png|txt|json|html|pdf)$/i.test(name)||name.includes('..')||parts.has(name))
      throw Error('print: invalid or repeated path '+name);
    parts.set(name,Buffer.from(data));
  };
  const ext=asset.metadata.format==='jpeg'?'jpg':asset.metadata.format;
  add('source/original.'+(ext==='svg'?'txt':ext),originalBytes);
  const original=await png(asset.rgba,w,h),proof=await png(proofScreen.preview,w,h);
  add('source/normalized.png',original);add('proof/composite.png',proof);
  const paper=await png(paperRGBA(w,h,sep.recipe.paper),w,h);add('proof/paper.png',paper);
  const cards=[{name:'Original',bytes:original},{name:'Simulated overprint',bytes:proof},
    {name:'Paper / substrate',bytes:paper,note:'not a physical ink'}],inks=[];
  for(let i=0;i<sep.masks.length;i++){
    const ink=sep.masks[i],s=screened.masks[i],name=String(i+1).padStart(2,'0')+'-'+clean(ink.id);
    const mono=await png(Sep.plateRGBA(ink.coverage),w,h),scr=await png(Sep.plateRGBA(s.coverage),w,h);
    add('plates/ink-'+name+'.png',mono);add('screened/ink-'+name+'.png',scr);
    if(pad)add('plates/marked-'+name+'.png',await marked(scr,w,h,pad));
    cards.push({name:ink.name,bytes:scr,ink:ink.color,note:'full-frame grayscale'});
    inks.push({id:ink.id,name:ink.name,color:ink.color,source:ink.source,
      meanCoverage:sep.stats.inks[i].meanCoverage,screenedMeanCoverage:screened.stats.inks[i].meanCoverage,
      plate:'plates/ink-'+name+'.png',screened:'screened/ink-'+name+'.png',
      marked:pad?'plates/marked-'+name+'.png':null,registration:{x:0,y:0,rotate:0}});
  }
  const info={width:w,height:h,trim:print.trimMm,dpi,inks:inks.length,seed:configs.proof.seed,
    sha:digest(originalBytes),name:asset.metadata.sourceName};
  add('report/separation-sheet.html',htmlReport(cards,info));
  add('report/separation-sheet.pdf',await pdfReport(cards,info));
  add('recipe/inks.json',json(sep.recipe));add('recipe/screens.json',json(configs.production));
  add('recipe/proof-screens.json',json(configs.proof));
  const manifest={contract:'stipra-print-package-v1',displayName:'Stiprā',
    source:{...asset.metadata,sha256:info.sha},output:print,
    mode:sep.recipe.mode,paper:sep.recipe.paper,inks,
    screen:{seed:configs.proof.seed,proofOnlyRegistration:true,
      productionRecipe:'recipe/screens.json',proofRecipe:'recipe/proof-screens.json'},
    report:{pdf:'report/separation-sheet.pdf',html:'report/separation-sheet.html',widthMm:297,heightMm:210,orientation:'landscape',inspectionOnly:true},
    files:[...parts].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>({path:name,bytes:data.length,sha256:digest(data)})),
    uncalibrated:true,notes:['Digital RGB overprint is not a calibrated press proof.',
      'Production plates always use zero registration offset.','Native pixel dimensions are preserved; no resizing performed.']};
  add('manifest.json',json(manifest));
  const zip=new JSZip();
  for(const [name,data] of [...parts].sort(([a],[b])=>a.localeCompare(b)))
    zip.file(name,data,{date:FIXED,createFolders:false,compression:'DEFLATE'});
  const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',
    compressionOptions:{level:6},platform:'UNIX'});
  return {zip:bytes,manifest,parts};
}
module.exports={generate,printIntent,validate,screenConfigs,A4};