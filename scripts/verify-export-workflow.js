#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict'),{Canvas}=require('skia-canvas');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'out/export-workflow');
/** Builds rights-cleared procedural artifacts and exercises the public CLI workflow. */
async function run(){
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  const F=await import(pathToFileURL(path.join(ROOT,'examples/workflows/fixture.mjs')).href),jobs=[];
  for(const [count,w,h,scale]of [[2,49,49,1],[3,33,49,2],[4,49,33,3]]){
    const input=F.artwork(w,h),c=new Canvas(w,h),ctx=c.getContext('2d'),p=ctx.createImageData(w,h);p.data.set(input.rgba);ctx.putImageData(p,0,0);
    const name='procedural-'+count;fs.writeFileSync(path.join(OUT,name+'.png'),c.toBufferSync('png'));
    fs.writeFileSync(path.join(OUT,name+'-inks.json'),JSON.stringify(F.recipe(count),null,2)+'\n');
    jobs.push({id:name,input:name+'.png',config:name+'-inks.json',screen:'screens.json',dpi:300,marksMm:count===3?2:0,paper:'rag',exports:{formats:['png','jpg','webp','svg'],scale,alpha:'source',vectorPlates:true}});
  }
  fs.writeFileSync(path.join(OUT,'screens.json'),JSON.stringify(F.screen,null,2)+'\n');
  const plan=path.join(OUT,'batch-plan.json');fs.writeFileSync(plan,JSON.stringify({version:1,jobs},null,2)+'\n');
  const cli=args=>{const result=JSON.parse(cp.execFileSync(process.execPath,[path.join(ROOT,'bin/stipra.js'),...args,'--json'],{cwd:ROOT,encoding:'utf8',maxBuffer:1024*1024}));assert.equal(result.status,'ok');return result.result;};
  const batch=cli(['batch','--config',plan,'--out',path.join(OUT,'batch')]);
  const comparison=cli(['compare','--input',path.join(OUT,'procedural-2.png'),'--config',path.join(ROOT,'examples/workflows/compare.json'),'--out',path.join(OUT,'compare')]);
  for(const job of batch.jobs){const v=cli(['verify','--input',path.join(OUT,'batch',job.package)]);assert.equal(v.packageSha256,job.packageSha256);}
  cli(['sheet','--input',path.join(OUT,'batch',batch.jobs[0].package),'--out',path.join(OUT,'sheet')]);
  const report={contract:'stipra-export-workflow-evidence-v1',source:'Original procedural fixture; no owner artwork',batch,comparison,
    matrix:{inkCounts:[2,3,4],formats:['png','jpg','webp','svg','pdf','zip'],proofScales:[1,2,3],aspectRatios:['square','portrait','landscape'],alpha:'source with explicit JPEG paper flattening',masters:'native zero-registration grayscale; optional sampled-run SVG'},
    limits:['No physical press validation','Sampled SVG paths preserve pixel geometry; analytic screen reconstruction remains #28','Lossy encoder bytes are not expected to match across platforms']};
  fs.writeFileSync(path.join(OUT,'evidence.json'),JSON.stringify(report,null,2)+'\n');return {cases:jobs.length,comparisonVariants:comparison.jobs.length,out:path.relative(ROOT,OUT)};
}
if(require.main===module)run().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;});module.exports={run};
