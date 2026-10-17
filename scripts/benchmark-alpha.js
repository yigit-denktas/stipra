#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),zlib=require('node:zlib');
const Core=require('../src/sdk');
async function run(){
  const F=await import('../examples/alpha/fixture.mjs');
  if(process.argv[2]==='--case'){
    const spec=F.cases[Number(process.argv[3])],input=spec.kind==='image'?F.image(spec.width,spec.height):F.layers(spec.width,spec.height,spec.inks);
    const options=F.optionsFor(spec),render=spec.kind==='image'?Core.renderImage:Core.renderLayers;
    render(input,options);if(global.gc)global.gc();const before=process.memoryUsage(),samples=[];let result;
    for(let i=0;i<spec.repeats;i++){const start=performance.now();result=render(input,options);samples.push(performance.now()-start);}
    console.log(JSON.stringify({...spec,logical:{width:spec.width/spec.density,height:spec.height/spec.density},dpi:options.dpi,
      timing:F.summary(samples),memory:{before,after:process.memoryUsage(),processPeakRssBytes:process.resourceUsage().maxRSS*(process.platform==='darwin'?1:1024),ownedInputOutputBytes:F.ownedBytes(input,result)},recipe:result.recipe}));return;
  }
  const out=path.resolve(process.argv[2]||'out/alpha-validation');fs.mkdirSync(out,{recursive:true});
  const rows=F.cases.map((_,i)=>JSON.parse(cp.execFileSync(process.execPath,['--expose-gc',__filename,'--case',String(i)],{encoding:'utf8',maxBuffer:2e6})));
  const assets=['packages/core/dist/index.mjs','packages/canvas/index.mjs','dist/stipra/sketches/assets/p5.min.js','dist/stipra/sketches/assets/print-export.mjs'].map(file=>{const b=fs.readFileSync(file);return {file,bytes:b.length,gzipBytes:zlib.gzipSync(b).length};});
  const report={contract:'stipra-alpha-benchmark-v1',environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemoryBytes:os.totalmem(),commit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()},method:{warmup:1,clock:'performance.now',isolation:'one fresh process per case',includes:'core separation/screen/composite/diagnostics; input creation excluded',memory:'peak RSS includes Node and allocator; after heap is not peak; owned buffer bytes exclude intermediates and native canvases',thresholds:'No cross-machine timing pass/fail threshold'},fixtureSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../examples/alpha/fixture.mjs'))).digest('hex'),assets,cases:rows};
  fs.writeFileSync(path.join(out,'node-benchmark.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({id:r.id,medianMs:r.timing.medianMs,peakRssMiB:r.memory.processPeakRssBytes/1048576}))));
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run};
