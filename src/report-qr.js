'use strict';
const fs=require('node:fs'),path=require('node:path'),QRCode=require('qrcode'),fontkit=require('@pdf-lib/fontkit');
const {Canvas,loadImage}=require('skia-canvas'),{truetype}=require('./report-fonts.js');
const GUIDE='https://apps.yigitdenktas.com/stipra/guide/';
const STYLES=['brand-square','brand-dots','ink-dots'];
function palette(){
  const svg=fs.readFileSync(path.join(__dirname,'../logo_for_Readme.svg'),'utf8');
  const fills=new Set([...svg.matchAll(/fill="(#[0-9a-f]{6})"/gi)].map(m=>m[1].toLowerCase()));
  const colors={green:'#006043',coral:'#ff665d',blue:'#0d4dad',yellow:'#e2a523'};
  if(fills.size!==4||!Object.values(colors).every(c=>fills.has(c)))throw Error('QR palette differs from original owner SVG');
  return colors;
}
function wordmark(bytes,x,y,width,height,color,accent){
  const font=fontkit.create(bytes),run=font.layout('stiprā');
  if(run.glyphs.length!==6||run.glyphs.some(g=>!g.id))throw Error('QR wordmark requires authentic lowercase stiprā glyphs');
  let pen=0;const paths=[];const bounds=run.glyphs.reduce((b,g,i)=>{
    const p=run.positions[i];b.minY=Math.min(b.minY,g.bbox.minY+p.yOffset);b.maxY=Math.max(b.maxY,g.bbox.maxY+p.yOffset);return b;
  },{minY:0,maxY:0});
  const advance=run.positions.reduce((n,p)=>n+p.xAdvance,0),scale=Math.min(width/advance,height/(bounds.maxY-bounds.minY));
  const left=x+(width-advance*scale)/2,baseline=y+(height+(bounds.maxY+bounds.minY)*scale)/2;
  run.glyphs.forEach((g,i)=>{
    const p=run.positions[i],raw=g.path.toSVG(),shape=raw.startsWith('<path')?raw:'<path d="'+raw+'"/>';
    paths.push('<g transform="translate('+(left+(pen+p.xOffset)*scale)+' '+(baseline-p.yOffset*scale)+') scale('+scale+' '+(-scale)+')" fill="'+color+'">'+shape);
    if(i===5){const cutoff=(font.xHeight||font.unitsPerEm*.5)+font.unitsPerEm*.02;
      paths.push('<defs><clipPath id="qr-macron"><rect x="-1000" y="'+cutoff+'" width="4000" height="3000"/></clipPath></defs><g fill="'+accent+'" clip-path="url(#qr-macron)">'+shape+'</g>');}
    paths.push('</g>');pen+=p.xAdvance;
  });return paths.join('');
}
function svg({style='brand-dots',ink='#006043',fontBytes=null,url=GUIDE}={}){
  if(!STYLES.includes(style))throw Error('unknown QR style');
  if(!/^#[0-9a-f]{6}$/i.test(ink))throw Error('QR ink must be #RRGGBB');
  if(url!==GUIDE)throw Error('QR destination must be the public reproduction guide');
  const colors=palette(),fg=style==='ink-dots'?ink:colors.green;
  const lum=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const key=(lum('#ffffff')+.05)/(lum(fg)+.05)>=4.5?fg:colors.green;
  const qr=QRCode.create(url,{errorCorrectionLevel:'H'}),n=qr.modules.size,quiet=4,size=n+2*quiet;
  const box={x:Math.floor(n*.28),y:Math.floor(n/2)-3,w:Math.ceil(n*.44),h:6};
  for(let y=box.y;y<box.y+box.h;y++)for(let x=box.x;x<box.x+box.w;x++)
    if(qr.modules.isReserved(y,x))throw Error('QR wordmark would cover a structural module');
  const modules=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    if(!qr.modules.get(y,x)||(x>=box.x&&x<box.x+box.w&&y>=box.y&&y<box.y+box.h))continue;
    const square=style==='brand-square'||qr.modules.isReserved(y,x);
    modules.push(square?'<rect x="'+(x+quiet)+'" y="'+(y+quiet)+'" width="1" height="1"/>':'<circle cx="'+(x+quiet+.5)+'" cy="'+(y+quiet+.5)+'" r="0.48"/>');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="784" height="784" viewBox="0 0 '+size+' '+size+'"><rect width="'+size+'" height="'+size+'" fill="#ffffff"/><g fill="'+key+'">'+modules.join('')+'</g>'+wordmark(fontBytes||truetype('ibm-plex-sans',700),box.x+quiet+.45,box.y+quiet+.45,box.w-.9,box.h-.9,key,colors.coral)+'</svg>';
}
async function png(options={}){
  const image=await loadImage(Buffer.from(svg(options))),canvas=new Canvas(784,784);canvas.getContext('2d').drawImage(image,0,0,784,784);return Buffer.from(await canvas.toBuffer('png'));
}
module.exports={GUIDE,STYLES,svg,png,palette};
