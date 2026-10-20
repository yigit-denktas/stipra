#!/usr/bin/env node
/* Authored QA geometry, not substitute owner artwork. MIT. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas}=require('skia-canvas');
const {PDFDocument,PDFName,PDFArray,PDFRawStream,decodePDFRawStream}=require('pdf-lib');
const Report=require('../src/report-layout.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function target(w,h,fill,plate=false){
  const canvas=new Canvas(w,h),ctx=canvas.getContext('2d');
  ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=plate?'#000000':'#006043';ctx.lineWidth=2;ctx.strokeRect(2,2,w-4,h-4);
  ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(w-4,h-4);ctx.stroke();
  for(let i=0;i<12;i++){
    ctx.fillStyle=plate?'rgb('+i*20+','+i*20+','+i*20+')':['#006043','#FF665D','#0D4DAD','#E2A523'][i%4];
    ctx.fillRect(8+i*(w-16)/12,h*.6,(w-16)/12,h*.15);
  }
  return canvas.toBufferSync('png');
}
function auditFrom(pdf){
  const names=pdf.catalog.lookup(PDFName.of('Names')).lookup(PDFName.of('EmbeddedFiles')).lookup(PDFName.of('Names'),PDFArray);
  for(let i=0;i<names.size();i+=2)if(names.get(i).decodeText()==='report-layout.json'){
    const spec=pdf.context.lookup(names.get(i+1)),stream=spec.lookup(PDFName.of('EF')).lookup(PDFName.of('F'),PDFRawStream);
    return JSON.parse(Buffer.from(decodePDFRawStream(stream).decode()).toString());
  }
  throw Error('PDF has no layout audit');
}
async function run(argv){
  if(argv.length!==2||argv[0]!=='--out')throw Error('usage: node scripts/review-report-parity.js --out NEW_DIRECTORY');
  const out=path.resolve(argv[1]);
  if(fs.existsSync(out))throw Error('refusing to overwrite existing review directory');
  fs.mkdirSync(out,{recursive:true});
  const records=[];
  for(const count of [2,3,8])for(const portrait of [false,true]){
    const [width,height]=portrait?[180,320]:[320,180],orientation=Report.orientation(width,height);
    const settings=Array.from({length:count},(_,i)=>({name:'Ink '+(i+1),color:['#006043','#FF665D','#0D4DAD','#E2A523'][i%4],source:'darkness',coverage:.35,mode:'dots',pitch:6,angle:i*15}));
    const original=target(width,height,'#edf1eb'),proof=target(width,height,'#f5eee2');
    const paperCanvas=new Canvas(width,height),paperContext=paperCanvas.getContext('2d');paperContext.fillStyle='#f5eee2';paperContext.fillRect(0,0,width,height);
    const cards=[{name:'Original',bytes:original},{name:'Simulated overprint',bytes:proof},
      {name:'Paper / substrate',bytes:paperCanvas.toBufferSync('png'),note:'not a physical ink'},
      ...settings.map(s=>({name:s.name,bytes:target(width,height,'#ffffff',true),ink:s.color,note:'35.0% coverage; dots 6px @ '+s.angle+'deg'}))];
    const info={width,height,orientation,dpi:300,trim:{width:width*25.4/300,height:height*25.4/300},paper:{name:'Warm rag',hex:'#f5eee2'},seed:42,name:'Authored geometry QA target, not a photograph',sha:sha(original),settings,inkRecipe:{version:1,inks:settings.map((s,i)=>({id:'ink'+i,...s}))},screenRecipe:{version:1,seed:42},proofRecipe:{version:1,seed:42}};
    info.reportPaperBytes=await Report.paperBackground(info);
    const pdfBytes=await Report.pdfReport(cards,info),pdf=await PDFDocument.load(pdfBytes),audit=auditFrom(pdf),stem=count+'-ink-'+orientation;
    fs.writeFileSync(path.join(out,stem+'.pdf'),pdfBytes,{flag:'wx'});
    fs.writeFileSync(path.join(out,stem+'.html'),Report.htmlReport(cards,info),{flag:'wx'});
    fs.writeFileSync(path.join(out,stem+'.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx'});
    records.push({case:stem,pages:pdf.getPageCount(),pdfSha256:sha(pdfBytes),layoutVersion:Report.LAYOUT_VERSION});
  }
  fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({scope:'synthetic report QA; no owner/physical acceptance',records},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(records));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
