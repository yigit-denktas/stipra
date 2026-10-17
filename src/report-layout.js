/* Stiprā editorial PDF + HTML inspection sheets. Original MIT layout. */
'use strict';
const fs=require('node:fs'),{PDFDocument,rgb}=require('pdf-lib');
const fontkit=require('@pdf-lib/fontkit'),QRCode=require('qrcode');
const {createFont}=require('fonteditor-core');const zlib=require('node:zlib');
const Paper=require('./report-paper.js');
const A4={landscape:[841.88976,595.27559],portrait:[595.27559,841.88976]};
const FIXED=new Date('2000-01-01T00:00:00Z');
const GUIDE='https://github.com/yigit-denktas/stipra/blob/main/docs/PRINT-PACKAGE-v1.md';
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const pdfColor=hex=>rgb(...color(hex));
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toFixed(1);
const fontFile=(family,weight)=>fs.readFileSync(require.resolve('@fontsource/'+family+'/files/'+family+'-latin-'+weight+'-normal.woff'));
const truetype=(family)=>Buffer.from(createFont(fontFile(family,400),{type:'woff',inflate:bytes=>zlib.inflateSync(Buffer.from(bytes))}).write({type:'ttf'}));
function orientation(w,h){return h>w*1.08?'portrait':'landscape';}
function htmlReport(cards,m){
  const font=fontFile('ibm-plex-sans',400).toString('base64'),mono=fontFile('ibm-plex-mono',400).toString('base64');
  const image=c=>'<figure><div class="image"><img alt="'+esc(c.name)+'" src="data:image/png;base64,'+c.bytes.toString('base64')+'"></div><figcaption>'+esc(c.name)+'<small>'+esc(c.note||'')+'</small></figcaption></figure>';
  const rows=m.settings.map((s,i)=>'<tr><td>'+String(i+1).padStart(2,'0')+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.color)+'</td><td>'+esc(s.source)+'</td><td>'+esc(s.mode)+' / '+s.pitch+'px / '+s.angle+'°</td><td>'+fmt(s.coverage*100)+'%</td></tr>').join('');
  return Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stiprā / ink study</title><style>'+
    '@font-face{font-family:Plex;src:url(data:font/woff;base64,'+font+')}@font-face{font-family:Mono;src:url(data:font/woff;base64,'+mono+')}'+
    '*{box-sizing:border-box}body{margin:0;background:'+m.paper.hex+';color:#222722;font:14px Plex,sans-serif}main{max-width:1180px;padding:26px;margin:auto}'+
    'header{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid #26312c;padding-bottom:12px}'+
    'header strong{font-size:38px;letter-spacing:-.06em}header span{font:11px Mono,monospace;text-align:right}h2{font:11px Mono,monospace;text-transform:uppercase;letter-spacing:.12em;margin:20px 0 9px}'+
    '.hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:12px}'+
    'figure{margin:0;min-width:0;border-bottom:1px solid #3b413d;padding-bottom:6px}.image{display:grid;place-items:center;height:'+(m.orientation==='portrait'?'420px':'290px')+'}'+
    'figure img{max-width:100%;max-height:100%;object-fit:contain}.plates .image{height:148px}figcaption{display:flex;justify-content:space-between;gap:8px;margin-top:6px;font:11px Mono,monospace}'+
    'small{color:#565e57}table{border-collapse:collapse;width:100%;font:11px Mono,monospace}td,th{border-top:1px solid #737d76;text-align:left;padding:8px}'+
    'footer{border-top:2px solid #26312c;margin-top:24px;padding-top:10px;font:10px Mono,monospace;overflow-wrap:anywhere}'+
    '@media(max-width:560px){main{padding:13px}.hero{grid-template-columns:1fr}.image{height:300px}header strong{font-size:26px}}'+
    '@page{size:A4 '+m.orientation+';margin:12mm}'+
    '</style></head><body><main><header><strong>Stiprā / ink study</strong><span>'+m.width+'×'+m.height+'px · '+m.dpi+' dpi<br>'+esc(m.paper.name)+' / '+m.orientation+'</span></header>'+
    '<h2>01 / original and proof</h2><section class="hero">'+cards.slice(0,2).map(image).join('')+'</section>'+
    '<h2>02 / physical ink layers + substrate</h2><section class="plates">'+cards.slice(2).map(image).join('')+'</section>'+
    '<h2>03 / exact settings</h2><table><thead><tr><th>#</th><th>Ink</th><th>Preview HEX</th><th>Channel</th><th>Screen</th><th>Coverage</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<footer>Source SHA-256 '+m.sha+' · '+m.trim.width+' × '+m.trim.height+'mm · seed '+m.seed+
    '<p>Digital approximation; not press calibrated. Exact recipe files are in the ZIP and embedded in the PDF. Reproduction requires lawful access to the original image.</p></footer></main></body></html>');
}
async function pdfReport(cards,m){
  const pdf=await PDFDocument.create({updateMetadata:false});
  pdf.registerFontkit(fontkit);
  pdf.setTitle('Stiprā / ink study');pdf.setCreator('Stiprā report-layout v2');
  pdf.setCreationDate(FIXED);pdf.setModificationDate(FIXED);
  const regular=await pdf.embedFont(truetype('ibm-plex-sans'));
  const mono=await pdf.embedFont(truetype('ibm-plex-mono'));
  const dims=A4[m.orientation],[W,H]=dims,margin=29,cw=W-2*margin;
  const [page,...unused]=[pdf.addPage(dims)],paper=await pdf.embedPng(await Paper.tile(m.paper,m.seed));
  const fg=rgb(.14,.17,.15);
  page.drawImage(paper,{x:0,y:0,width:W,height:H});
  const line=(y,x=margin,w=cw,thickness=.6)=>page.drawLine({start:{x,y},end:{x:x+w,y},thickness,color:fg});
  const put=(s,x,y,size=9,font=regular)=>page.drawText(String(s),{x,y,size,font,color:fg});
  function fitText(s,font,size,max){let value=String(s);while(value.length>3&&font.widthOfTextAtSize(value,size)>max)value=value.slice(0,-2)+'…';return value;}
  const imgs=new Map();
  async function drawImage(c,x,y,w,h){
    if(!imgs.has(c.name))imgs.set(c.name,await pdf.embedPng(c.bytes));
    const image=imgs.get(c.name),scale=Math.min(w/image.width,h/image.height);
    const iw=image.width*scale,ih=image.height*scale;
    page.drawImage(image,{x:x+(w-iw)/2,y:y+(h-ih)/2,width:iw,height:ih});
    return {width:iw,height:ih};
  }
  const portrait=m.orientation==='portrait';
  put('PRINT STUDY    /    '+m.orientation.toUpperCase()+' A4',margin,H-29,8,mono);
  put('Stiprā',margin,H-69,32,regular);
  put('/ ink separation',margin+104,H-65,18,regular);
  put(fitText(m.name,mono,8,cw*.68),margin,H-88,8,mono);
  put(m.width+' × '+m.height+' px  /  '+m.dpi+' DPI  /  '+m.trim.width+' × '+m.trim.height+' mm',margin,H-102,8,mono);
  put(m.paper.name.toUpperCase()+'   /   '+m.settings.length+' INKS  /  SEED '+m.seed,margin,H-114,7.5,mono);
  line(H-123,margin,cw,1.25);
  const yLabel=H-139,gap=14,half=(cw-gap)/2;
  put('01  SOURCE',margin,yLabel,8,mono);
  put('02  DIGITAL OVERPRINT',margin+half+gap,yLabel,8,mono);
  const heroHeight=portrait?370:182,heroY=yLabel-10-heroHeight;
  await drawImage(cards[0],margin,heroY,half,heroHeight);
  await drawImage(cards[1],margin+half+gap,heroY,half,heroHeight);
  line(heroY-5,margin,half);line(heroY-5,margin+half+gap,half);
  const plateLabel=heroY-24;
  put('03  INDIVIDUAL PLATES / PAPER IS NOT AN INK',margin,plateLabel,8,mono);
  const sample=cards.slice(2),count=Math.min(4,sample.length),g=11,w=(cw-(count-1)*g)/count;
  const height=portrait?146:90,bottom=plateLabel-11-height;
  for(let i=0;i<count;i++){
    const c=sample[i],x=margin+i*(w+g);
    await drawImage(c,x,bottom+14,w,height-17);
    line(bottom+11,x,w);
    put(fitText(c.name,regular,7.5,w-14),x,bottom+1,7.5,regular);
    if(c.ink)page.drawRectangle({x:x+w-7,y:bottom+2,width:7,height:7,color:rgb(...color(c.ink))});
  }
  const recipeLabel=bottom-19;
  put('04  THE RECIPE / EACH PASS IN ORDER',margin,recipeLabel,8,mono);
  line(recipeLabel-6);
  const rows=m.settings;
  for(let i=0;i<rows.length;i++){
    const s=rows[i],y=recipeLabel-18-i*12;
    const note=(i+1).toString().padStart(2,'0')+' '+s.name.slice(0,13).padEnd(13)+' '+s.color+'  '+s.mode+' '+s.pitch+'px @ '+s.angle+'°  '+fmt(s.coverage*100)+'%';
    put(fitText(note,mono,7.2,cw-70),margin,y,7.2,mono);
  }
  const footerY=portrait?92:64;
  line(footerY+14,margin,cw,1.25);
  put('SOURCE SHA256 '+m.sha.slice(0,32),margin,footerY,7.2,mono);
  put('REPRODUCE / recipes embedded in PDF and saved in ZIP',margin,footerY-14,7.5,mono);
  put('Digital approximation only. Original image required.',margin,footerY-28,7.5,regular);
  const qr=await pdf.embedPng(await QRCode.toBuffer(GUIDE,{margin:0,width:256,errorCorrectionLevel:'M'}));
  const qs=portrait?65:57;
  page.drawImage(qr,{x:W-margin-qs,y:footerY-37,width:qs,height:qs});
  if(sample.length>4){
    const continuation=pdf.addPage(dims);
    continuation.drawImage(paper,{x:0,y:0,width:W,height:H});
    continuation.drawText('STIPRĀ / MORE PLATES',{x:margin,y:H-65,size:22,font:regular,color:fg});
    for(let i=4;i<sample.length;i++){
      const c=sample[i],px=margin+((i-4)%2)*(cw/2),py=H-150-Math.floor((i-4)/2)*230;
      if(!imgs.has(c.name))imgs.set(c.name,await pdf.embedPng(c.bytes));
      const im=imgs.get(c.name),scale=Math.min(190/im.width,175/im.height);
      continuation.drawImage(im,{x:px,y:py-170,width:im.width*scale,height:im.height*scale});
      continuation.drawText(fitText(c.name,regular,10,cw/2-20),{x:px,y:py-185,size:10,font:regular,color:fg});
    }
  }
  // PDF remains a self-contained *recipe* record, not a copy of the owner's source photo.
  for(const [name,recipe] of [['inks.json',m.inkRecipe],['screens.json',m.screenRecipe],['proof-screens.json',m.proofRecipe],['replay.json',{
    sourceSHA256:m.sha,sourceName:m.name,paper:m.paper,dpi:m.dpi,trimMm:m.trim,guide:GUIDE}]])
    await pdf.attach(Buffer.from(JSON.stringify(recipe,null,2)),name,{mimeType:'application/json',description:'Stiprā reproduction settings'});
  return Buffer.from(await pdf.save({useObjectStreams:false}));
}
module.exports={A4,orientation,htmlReport,pdfReport,GUIDE};
