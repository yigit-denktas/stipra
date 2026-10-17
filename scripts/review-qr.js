#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {PDFDocument,rgb}=require('pdf-lib'),fontkit=require('@pdf-lib/fontkit');
const {Canvas,loadImage}=require('skia-canvas');
const QR=require('../src/report-qr.js'),{truetype}=require('../src/report-fonts.js');
async function run(out){
  out=path.resolve(out);if(fs.existsSync(out))throw Error('refusing to overwrite QR specimens');fs.mkdirSync(out,{recursive:true});
  const pdf=await PDFDocument.create({updateMetadata:false});pdf.registerFontkit(fontkit);const font=await pdf.embedFont(truetype('ibm-plex-sans',400));const page=pdf.addPage([595.27559,841.88976]);
  pdf.setCreationDate(new Date('2000-01-01'));pdf.setModificationDate(new Date('2000-01-01'));
  page.drawRectangle({x:0,y:0,width:595.27559,height:841.88976,color:rgb(.961,.933,.886)});
  const text=(s,x,y,size=11)=>page.drawText(s,{x,y,size,font,color:rgb(0,.376,.263)});
  text('stiprā / branded QR specimens',34,795,23);text('Three treatments / same public reproduction guide',34,770);
  const records=[];
  for(const [row,style] of QR.STYLES.entries()){
    const options={style,ink:'#0d4dad'},png=await QR.png(options),svg=QR.svg(options);fs.writeFileSync(path.join(out,style+'.png'),png);fs.writeFileSync(path.join(out,style+'.svg'),svg);
    text(style,34,720-row*210,14);
    for(const [col,mm] of [20,25.4,32].entries()){
      const size=mm*72/25.4,x=40+col*175,y=575-row*210;
      page.drawImage(await pdf.embedPng(png),{x,y,width:size,height:size});text(mm+' mm',x,y-20);
      records.push({style,mm,boxPt:{x,y,width:size,height:size}});
    }
  }
  text('Vector wordmark: IBM Plex Sans Bold / real lowercase ā',34,54,10);text('High error correction / four-module quiet zone / scan tests required',34,38,10);
  const bytes=await pdf.save({useObjectStreams:false});fs.writeFileSync(path.join(out,'stipra-qr-specimens.pdf'),bytes);
  fs.writeFileSync(path.join(out,'qr-specimens.json'),JSON.stringify({guide:QR.GUIDE,errorCorrection:'H',quietZoneModules:4,records,pdfSha256:crypto.createHash('sha256').update(bytes).digest('hex'),physicalPhoneTest:false},null,2)+'\n');
  const Report=require('../src/report-layout.js'),Sep=require('../src/separation.js'),Screen=require('../src/screening.js');
  const art=new Canvas(320,200),ac=art.getContext('2d');ac.fillStyle='#ffffff';ac.fillRect(0,0,320,200);ac.fillStyle='#336677';ac.fillRect(45,35,130,120);ac.fillStyle='#dbaa30';ac.fillRect(135,90,140,70);
  const recipe={version:1,mode:'spot',paper:'#f5eee2',inks:[{id:'key',name:'Green key',color:'#006043',source:'black'},{id:'yellow',name:'Yellow',color:'#e2a523',source:'yellow'}]};
  const sep=Sep.separate({width:320,height:200,rgba:ac.getImageData(0,0,320,200).data},recipe),screen=Screen.apply(sep,{version:1,seed:42,default:{mode:'dots',pitch:6}});
  async function raster(data){const c=new Canvas(320,200),ctx=c.getContext('2d'),i=ctx.createImageData(320,200);i.data.set(data);ctx.putImageData(i,0,0);return Buffer.from(await c.toBuffer('png'));}
  const cards=[{name:'Authored source',bytes:Buffer.from(await art.toBuffer('png'))},{name:'Digital proof',bytes:await raster(screen.preview)},...screen.masks.map(m=>({name:m.name,ink:m.color,bytes:null}))];
  for(let i=0;i<screen.masks.length;i++)cards[i+2].bytes=await raster(Sep.plateRGBA(screen.masks[i].coverage));
  const settings=screen.masks.map(m=>({...m,...m.screen,coverage:.3}));
  const report=await Report.pdfReport(cards,{width:320,height:200,dpi:300,trim:{width:27.0933,height:16.9333},orientation:'landscape',paper:{name:'Warm rag',hex:'#f5eee2'},seed:42,name:'authored-geometry.png',sha:crypto.createHash('sha256').update(cards[0].bytes).digest('hex'),settings,inkRecipe:sep.recipe,screenRecipe:screen.recipe,proofRecipe:screen.recipe});
  fs.writeFileSync(path.join(out,'stipra-qr-report.pdf'),report);
  const c=new Canvas(1500,620),ctx=c.getContext('2d');ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,1500,620);ctx.fillStyle='#006043';ctx.font='24px sans-serif';
  for(const [i,style] of QR.STYLES.entries()){ctx.fillText(style,35+i*500,45);ctx.drawImage(await loadImage(path.join(out,style+'.png')),35+i*500,75,430,430);}
  ctx.font='20px sans-serif';ctx.fillText('stiprā / authentic wordmark / public guide / three treatments',35,565);fs.writeFileSync(path.join(out,'stipra-qr-preview.png'),Buffer.from(await c.toBuffer('png')));
  console.log(JSON.stringify({out,pdf:'stipra-qr-specimens.pdf',cases:records.length}));
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e.stack);process.exitCode=1;});module.exports={run};
