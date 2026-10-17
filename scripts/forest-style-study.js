#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../src/import/node.js');
const Sep=require('../src/separation.js'),Screen=require('../src/screening.js'),Diagnostics=require('../src/plate-diagnostics.js');
const Styles=require('../src/styles.js');
const fixture=require('../tests/fixtures/owner-photo-fixtures.json').fixtures.find(f=>f.id==='B');
const ROOT=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function png(data,w,h){const c=new Canvas(w,h),ctx=c.getContext('2d'),im=ctx.createImageData(w,h);im.data.set(data);ctx.putImageData(im,0,0);return Buffer.from(await c.toBuffer('png'));}
async function run(argv){
  const options={};
  for(let i=0;i<argv.length;i+=2){if(!['--input','--baseline','--out'].includes(argv[i])||!argv[i+1])throw Error('usage: --input ORIGINAL_B --baseline PRIOR_B_RECIPE --out PRIVATE');options[argv[i]]=path.resolve(argv[i+1]);}
  if(Object.keys(options).length!==3)throw Error('input, baseline and out required');
  const destination=path.join(fs.realpathSync(path.dirname(options['--out'])),path.basename(options['--out']));
  if(destination===ROOT||destination.startsWith(ROOT+path.sep))throw Error('keep photo-bearing study outside repository');
  if(fs.existsSync(options['--out']))throw Error('refusing to overwrite private study');
  const bytes=fs.readFileSync(options['--input']);if(sha(bytes)!==fixture.sha256)throw Error('original forest fingerprint mismatch');
  const baseline=JSON.parse(fs.readFileSync(options['--baseline']));if(baseline.sourceSha256!==fixture.sha256)throw Error('baseline source mismatch');
  const asset=await ingestLocalBytes(bytes,fixture.originalFile),w=asset.metadata.oriented.width,h=asset.metadata.oriented.height;
  const dpi=baseline.effectiveDpi;
  const cases=[{id:'baseline',inks:baseline.inks,screens:baseline.screens},...['tonal-key','warm-third'].map(variant=>{
    const style=Styles.resolve('editorial-halftone',{dpi,variant,seed:42});
    return {id:variant,inks:style.inkRecipe,screens:style.screenRecipe,style};
  })];
  fs.mkdirSync(options['--out'],{recursive:true});const evidence=[];
  for(const item of cases){
    const sep=Sep.separate({width:w,height:h,rgba:asset.rgba},item.inks),screened=Screen.apply(sep,item.screens);
    const proof=await png(screened.preview,w,h);fs.writeFileSync(path.join(options['--out'],item.id+'.png'),proof);
    const record={id:item.id,sourceSha256:fixture.sha256,dpi,widthMm:w*25.4/dpi,style:item.style??null,targetLpi:item.style?.targetLpi??null,inkRecipe:sep.recipe,screenRecipe:screened.recipe,diagnostics:Diagnostics.inspect(screened,{dpi}),proofSha256:sha(proof),ownerApproved:false};
    for(const mask of screened.masks)fs.writeFileSync(path.join(options['--out'],item.id+'-'+mask.id+'.png'),await png(Sep.plateRGBA(mask.coverage),w,h));
    fs.writeFileSync(path.join(options['--out'],item.id+'.json'),JSON.stringify(record,null,2)+'\n');evidence.push(record);
  }
  const source=await png(asset.rgba,w,h);fs.writeFileSync(path.join(options['--out'],'source.png'),source);
  const cw=630,ch=Math.round(cw*h/w),sheet=new Canvas(4*cw+80, ch+110),ctx=sheet.getContext('2d');
  ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.fillStyle='#20251f';ctx.font='18px sans-serif';
  for(const [i,item] of [{id:'source',label:'source photograph'},{id:'baseline',label:'baseline / 3 inks'},{id:'tonal-key',label:'shared style / 2 inks / tonal key'},{id:'warm-third',label:'shared style / 3 inks / warm accent'}].entries()){
    const image=await loadImage(path.join(options['--out'],item.id+'.png'));ctx.drawImage(image,16+i*(cw+16),48,cw,ch);ctx.fillText(item.label,16+i*(cw+16),30);
  }
  const regions=[{id:'antlers',x:290,y:850,width:400,height:400},{id:'stumps',x:1100,y:650,width:550,height:600},{id:'display',x:730,y:250,width:550,height:400}];
  for(const region of regions){
    const detail=new Canvas(4*(region.width+16)+16,region.height+70),dc=detail.getContext('2d');dc.fillStyle='#f5eee2';dc.fillRect(0,0,detail.width,detail.height);dc.fillStyle='#20251f';dc.font='16px sans-serif';
    for(const [i,id] of ['source','baseline','tonal-key','warm-third'].entries()){
      dc.fillText(id,16+i*(region.width+16),25);dc.drawImage(await loadImage(path.join(options['--out'],id+'.png')),region.x,region.y,region.width,region.height,16+i*(region.width+16),40,region.width,region.height);
    }
    fs.writeFileSync(path.join(options['--out'],'detail-'+region.id+'.png'),Buffer.from(await detail.toBuffer('png')));
  }
  ctx.font='14px sans-serif';ctx.fillText('same original / no crop or resample / provisional digital proofs / not physical print validation',16,ch+80);
  fs.writeFileSync(path.join(options['--out'],'forest-style-comparison.png'),Buffer.from(await sheet.toBuffer('png')));
  fs.writeFileSync(path.join(options['--out'],'study-manifest.json'),JSON.stringify({sourceSha256:fixture.sha256,detailRegions:regions,evidence,environment:{node:process.version,platform:process.platform},physicalPrintVerified:false},null,2)+'\n');
  console.log(JSON.stringify(evidence.map(r=>({id:r.id,plates:r.diagnostics.plates.map(p=>({id:p.id,coverage:p.meanCoverage,lpi:p.screen.effectiveLpi})),overlap:r.diagnostics.overall.overlapTwoPlusFraction}))));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
