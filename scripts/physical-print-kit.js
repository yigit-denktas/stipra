#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas}=require('skia-canvas'),{PDFDocument,rgb}=require('pdf-lib'),fontkit=require('fontkit');
const Package=require('../src/print-package'),Styles=require('../src/styles'),Report=require('../src/report-layout'),{ingestLocalBytes}=require('../src/import/node');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(out){
  if(!out)throw Error('usage: node scripts/physical-print-kit.js NEW_OUTPUT');out=path.resolve(out);if(fs.existsSync(out))throw Error('refusing to overwrite check kit');fs.mkdirSync(out,{recursive:true});
  const c=new Canvas(1200,900),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1200,900);
  const gradient=ctx.createLinearGradient(0,0,1200,0);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(1,'#000000');ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,260);
  for(let i=0;i<12;i++){ctx.fillStyle=['#006043','#ff665d','#0d4dad','#e2a523'][i%4];ctx.globalAlpha=(i%3+1)/3;ctx.fillRect(i*100,310,90,200);}ctx.globalAlpha=1;
  ctx.fillStyle='black';for(let i=0;i<7;i++)ctx.fillRect(35,580+i*34,1100,[1,2,3,4,6,8,12][i]);
  const original=Package.physicalPNG(Buffer.from(await c.toBuffer('png')),300);fs.writeFileSync(path.join(out,'authored-print-fixture.png'),original);
  const asset=await ingestLocalBytes(original,'authored-print-fixture.png');
  const verification=[];
  for(const variant of ['forest-contrast','coast-duotone']){const style=Styles.resolve('editorial-halftone',{variant,dpi:300,seed:42});const result=await Package.generate({originalBytes:original,asset,inkRecipe:style.inkRecipe,screenRecipe:style.screenRecipe,style,dpi:300,paper:'recipe'});const {manifest,...checked}=await require('../src/verify-package').verify(result.zip);if(!checked.embeddedFontsVerified||checked.frame.width!==1200||checked.frame.height!==900||checked.frame.dpi!==300)throw Error('Print kit digital verification failed');verification.push({variant,...checked});fs.writeFileSync(path.join(out,variant+'-print-package.zip'),result.zip);}
  fs.writeFileSync(path.join(out,'digital-verification.json'),JSON.stringify({physicalPrintVerified:false,packages:verification},null,2)+'\n');
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(Report.truetype('ibm-plex-sans')),bold=await pdf.embedFont(Report.truetype('ibm-plex-sans',700)),mono=await pdf.embedFont(Report.truetype('ibm-plex-mono'));
  const p=pdf.addPage([841.88976,595.27559]),green=rgb(0,96/255,67/255),black=rgb(.12,.15,.13),mm=72/25.4;
  const text=(s,x,y,size=10,f=font)=>p.drawText(s,{x,y,size,font:f,color:black});
  p.drawText('stiprā',{x:34,y:540,size:30,font:bold,color:green});text('physical scale / legibility check',160,548,16,bold);text('A4 LANDSCAPE / ACTUAL SIZE 100% / NOT A CALIBRATED INK PROOF',34,512,10,mono);
  p.drawLine({start:{x:34,y:500},end:{x:808,y:500},thickness:1,color:green});
  text('01 / MEASURE BOTH RULES: 100 mm',50,471,11,bold);
  p.drawLine({start:{x:50,y:443},end:{x:50+100*mm,y:443},thickness:.6,color:black});
  for(let i=0;i<=10;i++){const x=50+i*10*mm;p.drawLine({start:{x,y:438},end:{x,y:449},thickness:.6,color:black});text(String(i*10),x-3,424,9,mono);}
  const vx=750,vy=120;p.drawLine({start:{x:vx,y:vy},end:{x:vx,y:vy+100*mm},thickness:.6,color:black});
  for(let i=0;i<=10;i++){const y=vy+i*10*mm;p.drawLine({start:{x:vx-5,y},end:{x:vx+6,y},thickness:.6,color:black});text(String(i*10),vx+12,y-3,9,mono);}
  text('100 mm',716,420,10,mono);p.drawRectangle({x:500,y:272,width:50*mm,height:50*mm,borderWidth:.6,borderColor:black});text('50 × 50 mm',510,250,10,mono);
  text('02 / LETTERING AT PRINT SIZE',50,381,11,bold);for(const [i,size] of [8,9,10,12].entries())text(size+' pt / stiprā · 0123456789 · fine detail',50,355-i*22,size,i===1?mono:font);
  text('03 / LINE WIDTH (points)',50,245,11,bold);for(const [i,width] of [.1,.25,.5,.75,1].entries()){const y=223-i*18;p.drawLine({start:{x:50,y},end:{x:360,y},thickness:width,color:black});text(String(width),375,y-3,9,mono);}
  text('04 / NOMINAL GRAYSCALE',50,105,11,bold);for(let i=0;i<=10;i++){p.drawRectangle({x:50+i*43,y:64,width:40,height:27,color:rgb(1-i/10,1-i/10,1-i/10)});text(String(i*10)+'%',50+i*43,49,8,mono);}
  text('Print at actual size. Disable fit, shrink,',500,213,9);text('borderless enlargement and image enhancement.',500,198,9);text('Record ruler readings and printer/stock settings.',500,183,9);text('The fixture masters should span 101.6 × 76.2 mm.',500,168,9);text('Home printing checks geometry, not spot-ink calibration.',500,153,9);
  pdf.setCreationDate(new Date('2000-01-01'));pdf.setModificationDate(new Date('2000-01-01'));fs.writeFileSync(path.join(out,'scale-and-legibility.pdf'),await pdf.save());
  fs.writeFileSync(path.join(out,'print-observations.json'),JSON.stringify({contract:'stipra-physical-observation-v1',status:'not-run',operator:null,date:null,printer:null,driver:null,paperStock:null,printScalePercent:null,horizontal100mmMeasured:null,vertical100mmMeasured:null,masterWidthMmMeasured:null,masterHeightMmMeasured:null,legibilityNotes:null,registrationNotes:null,screeningAndInkNotes:null,evidenceFiles:[],ownerApproved:false,physicalInkCalibrated:false},null,2)+'\n');
  fs.copyFileSync(path.join(__dirname,'../docs/PHYSICAL-PRINT-CHECK.md'),path.join(out,'READ-ME.md'));
  const files=fs.readdirSync(out).sort().map(name=>{const b=fs.readFileSync(path.join(out,name));return {path:name,bytes:b.length,sha256:hash(b)};});
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({contract:'stipra-physical-print-kit-v1',authoredFixture:true,ownerPhotosIncluded:false,physicalPrintVerified:false,sourcePixels:{width:1200,height:900},dpi:300,widthMm:101.6,heightMm:76.2,vectorRulersMm:100,files},null,2)+'\n');
  console.log(JSON.stringify({out,files:files.length,physicalPrintVerified:false}));
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});module.exports={run};
