/* Stiprā editorial PDF + HTML inspection sheets. Original MIT layout. */
'use strict';
const fs=require('node:fs'),{PDFDocument,rgb}=require('pdf-lib');
const fontkit=require('@pdf-lib/fontkit');
const {truetype}=require('./report-fonts.js');
const QR=require('./report-qr.js');
const Paper=require('./report-paper.js');
const A4={landscape:[841.88976,595.27559],portrait:[595.27559,841.88976]};
const FIXED=new Date('2000-01-01T00:00:00Z');
const GUIDE=QR.GUIDE;
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const pdfColor=hex=>rgb(...color(hex));
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number(v).toFixed(1);
function orientation(w,h){return h>w*1.08?'portrait':'landscape';}
async function paperBackground(m){
  const [width,height]=A4[m.orientation],theme=Paper.theme(m.paper,m.settings);
  return Paper.tile(m.paper,m.seed,{width:Math.ceil(width*2),height:Math.ceil(height*2),inks:theme.inks,style:m.reportTexture||'speckled'});
}
function htmlReport(cards,m){
  const theme=Paper.theme(m.paper,m.settings),background=m.reportPaperBytes?'url(data:image/png;base64,'+m.reportPaperBytes.toString('base64')+')':'none';
  const font=truetype('ibm-plex-sans',400).toString('base64'),mono=truetype('ibm-plex-mono',400).toString('base64'),bold=truetype('ibm-plex-sans',700).toString('base64');
  const image=c=>'<figure><div class="image"><img alt="'+esc(c.name)+'" src="data:image/png;base64,'+c.bytes.toString('base64')+'"></div><figcaption>'+esc(c.name)+'<small>'+esc(c.note||'')+'</small></figcaption></figure>';
  const rows=m.settings.map((s,i)=>'<tr><td>'+String(i+1).padStart(2,'0')+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.color)+'</td><td>'+esc(s.source)+'</td><td>'+esc(screenDescription(s,m.dpi))+'</td><td>'+fmt(s.coverage*100)+'%</td></tr>').join('');
  const diagnostic=m.diagnostics?'<h2>04 / coverage and overlap</h2><p>Two-plus overlap '+fmt(m.diagnostics.overall.overlapTwoPlusFraction*100)+'%. Editorial guidance, not press safety limits.</p><ul>'+m.diagnostics.warnings.map(w=>'<li>'+esc(w.code)+' ['+esc(w.inkIds.join(', '))+']: '+esc(w.message)+'</li>').join('')+'</ul>':'';
  return Buffer.from('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stiprā / ink study</title><style>'+
    '@font-face{font-family:Plex;src:url(data:font/ttf;base64,'+font+')}@font-face{font-family:Mono;src:url(data:font/ttf;base64,'+mono+')}'+
    '@font-face{font-family:Plex;font-weight:700;src:url(data:font/ttf;base64,'+bold+')}'+
    '*{box-sizing:border-box}body{margin:0;background:'+m.paper.hex+';color:'+theme.key+';background-image:'+background+';background-size:100% auto;font:15px Plex,sans-serif}main{max-width:1180px;padding:26px;margin:auto}'+
    'header{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid currentColor;padding-bottom:12px}'+
    'header strong{font-size:38px;letter-spacing:-.06em}header span{font:13px Mono,monospace;text-align:right}h2{font:13px Mono,monospace;text-transform:uppercase;letter-spacing:.12em;margin:20px 0 9px}'+
    '.hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:12px}'+
    'figure{break-inside:avoid;margin:0;min-width:0;border-bottom:1px solid currentColor;padding-bottom:6px}.image{display:grid;place-items:center;height:'+(m.orientation==='portrait'?'420px':'290px')+'}'+
    'figure img{max-width:100%;max-height:100%;object-fit:contain}.plates .image{height:148px}figcaption{display:flex;justify-content:space-between;gap:8px;margin-top:6px;font:13px Mono,monospace}'+
    'small{color:#565e57}table{border-collapse:collapse;width:100%;font:13px Mono,monospace}td,th{border-top:1px solid currentColor;text-align:left;padding:8px}'+
    'footer{border-top:2px solid currentColor;margin-top:24px;padding-top:10px;font:12px Mono,monospace;overflow-wrap:anywhere}'+
    '@media(max-width:560px){main{padding:13px}.hero{grid-template-columns:1fr}.image{height:300px}header strong{font-size:26px}}'+
    '@page{size:A4 '+m.orientation+';margin:12mm}'+
    '</style></head><body><main><header><strong>Stiprā / ink study</strong><span>'+m.width+'×'+m.height+'px · '+m.dpi+' dpi<br>'+esc(m.paper.name)+' / '+m.orientation+'</span></header>'+
    '<h2>01 / original and proof</h2><section class="hero">'+cards.slice(0,2).map(image).join('')+'</section>'+
    '<h2>02 / physical ink layers + substrate</h2><section class="plates">'+cards.slice(2).map(image).join('')+'</section>'+
    '<h2>03 / exact settings</h2><table><thead><tr><th>#</th><th>Ink</th><th>Preview HEX</th><th>Channel</th><th>Screen</th><th>Coverage</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    diagnostic+'<footer>Source SHA-256 '+m.sha+' · '+m.trim.width+' × '+m.trim.height+'mm · seed '+m.seed+
    '<p>Digital approximation; not press calibrated. Exact recipe files are in the ZIP and embedded in the PDF. Reproduction requires lawful access to the original image.</p></footer></main></body></html>');
}
function screenDescription(s,dpi){
  return ['solid','paper'].includes(s.mode)?s.mode+' / screen off':
    s.mode+' / '+fmt(dpi/s.pitch)+' LPI / '+s.pitch+' px / '+s.angle+'°';
}
async function pdfReport(cards,m){
  const pdf=await PDFDocument.create({updateMetadata:false});
  pdf.registerFontkit(fontkit);
  pdf.setTitle('stiprā / ink study');pdf.setCreator('stiprā report-layout v4');
  pdf.setCreationDate(FIXED);pdf.setModificationDate(FIXED);
  const typo=m.typography||null;
  const embed=async(file,family,weight=400)=>pdf.embedFont(file?fs.readFileSync(file):truetype(family,weight));
  const regular=await embed(typo?.fontRegular,'ibm-plex-sans');
  const mono=await embed(typo?.fontMono,'ibm-plex-mono');
  const display=await embed(typo?.fontBold,'ibm-plex-sans',700);
  const label=typo?.fontLabel?await embed(typo.fontLabel):regular;
  const wordmark=typo?.fontWordmark?await embed(typo.fontWordmark):display;
  const dims=A4[m.orientation],[W,H]=dims,margin=34,cw=W-2*margin;
  const theme=Paper.theme(m.paper,m.settings);
  const paper=await pdf.embedPng(m.reportPaperBytes||await paperBackground(m));
  const qr=await pdf.embedPng(await QR.png({style:m.qrStyle||'brand-dots',ink:theme.key,fontBytes:typo?.fontWordmark?fs.readFileSync(typo.fontWordmark):typo?.fontBold?fs.readFileSync(typo.fontBold):null}));
  const fg=pdfColor(theme.key),audit={version:2,minTextPt:9,theme,qr:{style:m.qrStyle||'brand-dots',destination:GUIDE,sizeMm:25.4,errorCorrection:'H',quietZoneModules:4},texture:{style:m.reportTexture||'speckled',dpi:144,seed:m.seed,simulation:true},pages:[]};
  const images=new Map();
  let page,record,y;
  const content=s=>typo?.lowercase?String(s).toLowerCase():String(s);
  function put(s,x,baseline,size=10,font=regular,ink=fg){
    const text=content(s),width=font.widthOfTextAtSize(text,size);
    if(size<9||x<margin-.1||x+width>W-margin+.1||baseline<margin||baseline+size>H-margin+.1)
      throw Error('report text exceeds page bounds: '+text);
    page.drawText(text,{x,y:baseline,size,font,color:ink});
    record.text.push({text,x,y:baseline,width,size,font:font.name});
  }
  function rule(baseline,weight=.6){
    page.drawLine({start:{x:margin,y:baseline},end:{x:W-margin,y:baseline},thickness:weight,color:fg});
  }
  function wrap(s,font,size,width){
    const lines=[];let row='';
    for(const token of content(s).split(/\s+/)){
      if(row&&font.widthOfTextAtSize(row+' '+token,size)>width){lines.push(row);row='';}
      for(const char of token){
        if(font.widthOfTextAtSize(row+char,size)>width){lines.push(row);row='';}
        row+=char;
      }
      row+=' ';
    }
    if(row.trim())lines.push(row.trimEnd());
    return lines;
  }
  function newPage(section){
    page=pdf.addPage(dims);record={section,text:[],images:[]};audit.pages.push(record);
    page.drawImage(paper,{x:0,y:0,width:W,height:H});
    put('stiprā',margin,H-65,30,wordmark);
    const titleX=margin+wordmark.widthOfTextAtSize('stiprā',30)+22;
    put(section,titleX,H-62,12,regular);
    put('SEPARATION SHEET / '+m.orientation.toUpperCase()+' A4',margin,H-88,9,mono);
    for(const [x,cy] of [[17,H-17],[W-17,H-17],[17,17],[W-17,17]]){
      page.drawLine({start:{x:x-5,y:cy},end:{x:x+5,y:cy},thickness:.5,color:fg,opacity:.7});
      page.drawLine({start:{x,y:cy-5},end:{x,y:cy+5},thickness:.5,color:fg,opacity:.7});
    }
    const stockLabel=m.paper.name.toUpperCase()+' / '+m.settings.length+' INKS';
    put(stockLabel,W-margin-mono.widthOfTextAtSize(content(stockLabel),9),H-88,9,mono);
    rule(H-100,1.2);y=H-122;
    page.drawLine({start:{x:margin,y:57},end:{x:W-margin-94,y:57},thickness:.6,color:fg});
    page.drawImage(qr,{x:W-margin-72,y:10,width:72,height:72});
    const {PDFName,PDFString}=require('pdf-lib');
    const annotation=pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[W-margin-72,10,W-margin,82],Border:[0,0,0],A:{S:PDFName.of('URI'),URI:PDFString.of(GUIDE)}}));
    page.node.set(PDFName.of('Annots'),pdf.context.obj([annotation]));
    put('simulated paper / uncalibrated proof / original required for replay',margin,42,9,regular);
  }
  function ensure(height,section='recipe / continued'){
    if(y-height<94)newPage(section);
  }
  function block(s,{size=10,font=regular,width=cw,leading=13}={}){
    const lines=wrap(s,font,size,width);
    ensure(lines.length*leading+6);
    for(const value of lines){put(value,margin,y,size,font);y-=leading;}
    y-=6;
  }
  async function image(c,x,bottom,width,height){
    const key=require('node:crypto').createHash('sha256').update(c.bytes).digest('hex');
    if(!images.has(key))images.set(key,await pdf.embedPng(c.bytes));
    const im=images.get(key),scale=Math.min(width/im.width,height/im.height);
    const iw=im.width*scale,ih=im.height*scale,px=x+(width-iw)/2,py=bottom+(height-ih)/2;
    page.drawImage(im,{x:px,y:py,width:iw,height:ih});
    page.drawRectangle({x:px,y:py,width:iw,height:ih,borderWidth:.6,borderColor:c.ink?pdfColor(c.ink):fg,borderOpacity:.7});
    record.images.push({name:c.name,sha256:key,x:px,y:py,width:iw,height:ih,sourceWidth:im.width,sourceHeight:im.height});
  }
  newPage('source / proof / plates');
  const gap=18,half=(cw-gap)/2,portrait=m.orientation==='portrait';
  function banner(title,x,baseline,width){
    page.drawRectangle({x:x-2,y:baseline-4,width:width+4,height:18,color:fg});
    put(title,x+4,baseline+1,9,mono,pdfColor(m.paper.hex));
  }
  banner('01 / SOURCE PHOTOGRAPH',margin,y,half);
  banner('02 / DIGITAL OVERPRINT',margin+half+gap,y,half);
  const heroH=portrait?330:198,heroBottom=y-12-heroH;
  await image(cards[0],margin,heroBottom,half,heroH);
  await image(cards[1],margin+half+gap,heroBottom,half,heroH);
  y=heroBottom-18;
  put('inspection thumbnails / full frame / not at master scale',margin,y,9,regular);y-=23;
  const plates=cards.slice(2).filter(c=>c.ink);
  for(let offset=0;offset<plates.length;offset+=4){
    if(offset)newPage('individual ink plates / continued');
    put('03 / individual grayscale ink plates',margin,y,11,display);y-=16;
    const row=plates.slice(offset,offset+4),g=14,w=(cw-(row.length-1)*g)/row.length;
    const ph=offset?Math.min(300,y-150):Math.max(65,Math.min(portrait?210:120,y-122));
    for(let i=0;i<row.length;i++){
      const x=margin+i*(w+g),c=row[i];
      await image(c,x,y-ph,w,ph);
      const names=wrap(c.name,label,9,w-15);
      for(let j=0;j<Math.min(3,names.length);j++)put(names[j],x,y-ph-14-j*12,9,label);
      page.drawRectangle({x:x+w-9,y:y-ph-15,width:8,height:8,color:pdfColor(c.ink)});
    }
    y-=ph+55;
  }
  if(y>100)put('paper: '+m.paper.name+' / '+m.paper.hex+' / substrate, not an ink',margin,86,9,regular);
  newPage('recipe / provenance');
  block(m.name,{font:regular,size:11,leading:14});
  block(m.width+' × '+m.height+' px / '+Number(m.dpi).toFixed(2)+' DPI / master '+fmt(m.trim.width)+' × '+fmt(m.trim.height)+' mm',{font:mono,size:9});
  block('paper '+m.paper.name+' '+m.paper.hex+' / seed '+m.seed,{font:regular});
  for(let i=0;i<m.settings.length;i++){
    const s=m.settings[i],ink=m.inkRecipe?.inks?.[i];
    const names=wrap(String(i+1).padStart(2,'0')+' / '+s.name,display,11,cw-20);
    ensure(names.length*14+44);
    rule(y+10);
    for(const name of names){put(name,margin,y,11,display);y-=14;}
    block(s.color+' / '+s.source+(ink?' / gain '+ink.gain+' / gamma '+ink.gamma:''),{font:mono,size:9,leading:12});
    block(screenDescription(s,m.dpi)+' / '+fmt(s.coverage*100)+'% nominal coverage',{font:mono,size:9,leading:12});
  }
  ensure(110,'provenance / replay');
  block('source SHA-256',{font:display,size:11});
  block(m.sha,{font:mono,size:9});
  block('Print masters at 100%. These report images are inspection thumbnails. Production plates retain full dimensions and zero registration.',{size:10});
  block('Recipes are embedded in this PDF and saved in the export ZIP. Reproduction requires authorized possession of the original photograph.',{size:10});
  if(m.diagnostics){
    const d=m.diagnostics;
    ensure(60,'diagnostics / continued');
    block('coverage / overlap diagnostics',{font:display,size:11});
    block('two-plus overlap '+fmt(d.overall.overlapTwoPlusFraction*100)+'% / three-plus '+fmt(d.overall.overlapThreePlusFraction*100)+'%',{font:mono,size:9});
    for(const warning of d.warnings)
      block(warning.code+' ['+warning.inkIds.join(', ')+']: '+warning.message,{size:10});
    block('Editorial diagnostics, not printer safety limits or aesthetic approval.',{size:10});
  }
  for(const [name,recipe] of [['inks.json',m.inkRecipe],['screens.json',m.screenRecipe],['proof-screens.json',m.proofRecipe],['replay.json',{
    sourceSHA256:m.sha,sourceName:m.name,paper:m.paper,dpi:m.dpi,trimMm:m.trim,guide:GUIDE}],['report-layout.json',audit],['diagnostics.json',m.diagnostics]]){
    if(recipe===undefined)continue;
    await pdf.attach(Buffer.from(JSON.stringify(recipe,null,2)),name,{mimeType:'application/json',description:'Stiprā reproduction settings'});
  }
  return Buffer.from(await pdf.save({useObjectStreams:false}));
}

module.exports={A4,orientation,htmlReport,pdfReport,screenDescription,truetype,paperBackground,GUIDE};
