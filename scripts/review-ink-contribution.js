#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Canvas,loadImage}=require('skia-canvas'),{hash}=require('./artifact-evidence');
const {ingestLocalBytes}=require('../src/import/node'),Styles=require('../src/styles'),Sep=require('../src/separation'),Screen=require('../src/screening');
const ROOT=path.resolve(__dirname,'..'),fixture=require('../tests/fixtures/owner-photo-fixtures.json').fixtures.find(x=>x.id==='B');
const regions=[{id:'full',x:0,y:0,width:2048,height:1365},{id:'foliage',x:650,y:50,width:600,height:450},{id:'stumps',x:1100,y:650,width:550,height:600},{id:'antlers',x:290,y:850,width:400,height:400}];
async function png(rgba,w,h){const c=new Canvas(w,h),ctx=c.getContext('2d'),im=ctx.createImageData(w,h);im.data.set(rgba);ctx.putImageData(im,0,0);return c.toBuffer('png');}
function difference(a,b,w,region){
  let total=0,changed=0;
  for(let y=region.y;y<region.y+region.height;y++)for(let x=region.x;x<region.x+region.width;x++){
    const q=(y*w+x)*4,d=[0,1,2].map(i=>Math.abs(a[q+i]-b[q+i]));total+=d[0]+d[1]+d[2];if(Math.max(...d)>1)changed++;
  }
  const pixels=region.width*region.height;
  return {region:region.id,meanAbsChannelDelta8Bit:+(total/(3*pixels)).toFixed(6),changedPixelFraction:+(changed/pixels).toFixed(6)};
}
/** Compares frozen two-/three-ink proofs privately, measuring rather than declaring artistic usefulness. */
async function run(argv){
  const opts={};for(let i=0;i<argv.length;i+=2){if(!['--sources','--out'].includes(argv[i])||!argv[i+1]||opts[argv[i]])throw Error('usage: --sources PRIVATE_ORIGINALS --out NEW_PRIVATE_DIRECTORY');opts[argv[i]]=path.resolve(argv[i+1]);}
  if(!opts['--sources']||!opts['--out'])throw Error('sources and out required');
  const inside=p=>p===ROOT||p.startsWith(ROOT+path.sep),source=fs.realpathSync(path.join(opts['--sources'],fixture.originalFile)),out=path.join(fs.realpathSync(path.dirname(opts['--out'])),path.basename(opts['--out']));
  if(inside(source)||inside(out))throw Error('Owner images and proofs must remain outside repository');if(fs.existsSync(out))throw Error('Refusing to overwrite private study');
  const original=fs.readFileSync(source);assert.equal(hash(original),fixture.sha256,'Owner forest fingerprint mismatch');
  const asset=await ingestLocalBytes(original,fixture.originalFile),{width:w,height:h}=asset.metadata.oriented;assert.equal(w,2048);assert.equal(h,1365);
  fs.mkdirSync(out);const records=[],cases=[{id:'source',bytes:await png(asset.rgba,w,h)}];let baseline;
  for(const variant of ['tonal-key','warm-third','forest-depth','forest-contrast']){
    const style=Styles.resolve('editorial-halftone',{variant,dpi:300,seed:42}),separated=Sep.separate({width:w,height:h,rgba:asset.rgba},style.inkRecipe),result=Screen.apply(separated,style.screenRecipe);
    if(variant==='tonal-key')baseline=result;
    if(variant==='warm-third')for(let i=0;i<2;i++)assert.deepEqual(result.masks[i].coverage,baseline.masks[i].coverage,'Two common plates must remain identical');
    const bytes=await png(result.preview,w,h);fs.writeFileSync(path.join(out,variant+'.png'),bytes);cases.push({id:variant,bytes});
    records.push({variant,style,proofSha256:hash(bytes),inks:result.masks.map(mask=>{
      const omitted=Screen.preview(result.masks.filter(x=>x.id!==mask.id),w,h,style.inkRecipe.paper);
      return {id:mask.id,color:mask.color,screenedCoverage:mask.coverage.reduce((a,b)=>a+b,0)/(255*w*h),fullCoverageFraction:mask.coverage.reduce((n,v)=>n+(v===255),0)/(w*h),regions:regions.map(region=>difference(result.preview,omitted,w,region))};
    })});
  }
  const tw=480,th=Math.round(tw*h/w),c=new Canvas(cases.length*(tw+16)+16,th+70),ctx=c.getContext('2d');ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,c.width,c.height);ctx.font='16px sans-serif';ctx.fillStyle='#20251f';
  for(const [i,item] of cases.entries()){ctx.fillText(item.id,16+i*(tw+16),24);ctx.drawImage(await loadImage(item.bytes),16+i*(tw+16),38,tw,th);}fs.writeFileSync(path.join(out,'comparison.png'),await c.toBuffer('png'));
  const report={contract:'stipra-ink-contribution-study-v1',sourceSha256:fixture.sha256,width:w,height:h,dpi:300,seed:42,commonTwoPlatesIdentical:true,regions,records,metric:'Mean absolute encoded RGB channel difference when one pass is omitted; changed means any channel differs by >1/255. Digital multiply proof only, not perceptual Delta E or physical ink value.',ownerApproved:false,physicalPrintVerified:false};
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(records.map(x=>({variant:x.variant,inks:x.inks.map(i=>({id:i.id,coverage:i.screenedCoverage,full:i.regions[0]}))}))));return report;
}
if(require.main===module)run(process.argv.slice(2)).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={run,difference};
