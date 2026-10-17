#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../src/import/node.js');
const Sep=require('../src/separation.js'),Screen=require('../src/screening.js'),Diagnostics=require('../src/plate-diagnostics.js');
const fixture=require('../tests/fixtures/owner-photo-fixtures.json').fixtures.find(f=>f.id==='B');
const ROOT=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function png(data,w,h){const c=new Canvas(w,h),ctx=c.getContext('2d'),im=ctx.createImageData(w,h);im.data.set(data);ctx.putImageData(im,0,0);return Buffer.from(await c.toBuffer('png'));}
async function run(argv){
  const options={};
  for(let i=0;i<argv.length;i+=2){if(!['--input','--baseline','--out'].includes(argv[i])||!argv[i+1])throw Error('usage: --input ORIGINAL_B --baseline PRIOR_B_RECIPE --out PRIVATE');options[argv[i]]=path.resolve(argv[i+1]);}
  if(Object.keys(options).length!==3)throw Error('input, baseline and out required');
  if(options['--out']===ROOT||options['--out'].startsWith(ROOT+path.sep))throw Error('keep photo-bearing study outside repository');
  if(fs.existsSync(options['--out']))throw Error('refusing to overwrite private study');
  const bytes=fs.readFileSync(options['--input']);if(sha(bytes)!==fixture.sha256)throw Error('original forest fingerprint mismatch');
  const baseline=JSON.parse(fs.readFileSync(options['--baseline']));if(baseline.sourceSha256!==fixture.sha256)throw Error('baseline source mismatch');
  const asset=await ingestLocalBytes(bytes,fixture.originalFile),w=asset.metadata.oriented.width,h=asset.metadata.oriented.height;
  const recipe=JSON.parse(fs.readFileSync(path.join(ROOT,'examples/recipes/forest-key-two-ink.json'))),dpi=baseline.effectiveDpi;
  const cases=[{id:'baseline',inks:baseline.inks,screens:baseline.screens},{id:'two-ink-key',inks:recipe,screens:{version:1,seed:42,default:{mode:'dots',pitch:dpi/50,angle:22,jitter:0},plates:{green:{mode:'solid'},'golden-yellow':{angle:-15}}}}];
  fs.mkdirSync(options['--out'],{recursive:true});const evidence=[];
  for(const item of cases){
    const sep=Sep.separate({width:w,height:h,rgba:asset.rgba},item.inks),screened=Screen.apply(sep,item.screens);
    const proof=await png(screened.preview,w,h);fs.writeFileSync(path.join(options['--out'],item.id+'.png'),proof);
    const record={id:item.id,sourceSha256:fixture.sha256,dpi,widthMm:w*25.4/dpi,targetLpi:item.id==='two-ink-key'?50:null,inkRecipe:sep.recipe,screenRecipe:screened.recipe,diagnostics:Diagnostics.inspect(screened,{dpi}),proofSha256:sha(proof),ownerApproved:false};
    fs.writeFileSync(path.join(options['--out'],item.id+'.json'),JSON.stringify(record,null,2)+'\n');evidence.push(record);
  }
  const source=await png(asset.rgba,w,h);fs.writeFileSync(path.join(options['--out'],'source.png'),source);
  const cw=630,ch=Math.round(cw*h/w),sheet=new Canvas(3*cw+64, ch+110),ctx=sheet.getContext('2d');
  ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.fillStyle='#20251f';ctx.font='18px sans-serif';
  for(const [i,item] of [{id:'source',label:'source photograph'},{id:'baseline',label:'baseline / 3 inks'},{id:'two-ink-key',label:'experiment / 2 inks / tonal key'}].entries()){
    const image=await loadImage(path.join(options['--out'],item.id+'.png'));ctx.drawImage(image,16+i*(cw+16),48,cw,ch);ctx.fillText(item.label,16+i*(cw+16),30);
  }
  ctx.font='14px sans-serif';ctx.fillText('same original / no crop or resample / provisional digital proofs / not physical print validation',16,ch+80);
  fs.writeFileSync(path.join(options['--out'],'forest-key-comparison.png'),Buffer.from(await sheet.toBuffer('png')));
  console.log(JSON.stringify(evidence.map(r=>({id:r.id,plates:r.diagnostics.plates.map(p=>({id:p.id,coverage:p.meanCoverage,lpi:p.screen.effectiveLpi})),overlap:r.diagnostics.overall.overlapTwoPlusFraction}))));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
