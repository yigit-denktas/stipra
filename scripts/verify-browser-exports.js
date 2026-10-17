#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'out/export-workflow');
async function run(){
  const evidence=JSON.parse(fs.readFileSync(path.join(OUT,'browser-evidence.json'))),F=await import(pathToFileURL(path.join(ROOT,'examples/workflows/fixture.mjs')).href),cases=[];
  for(const item of evidence.cases){
    const bytes=Buffer.from(item.zipBase64,'base64'),checked=await require('../src/verify-package').verify(bytes),archive=await require('../src/archive').openArchive(bytes);
    const originalBytes=await archive.read('source/original.png'),asset=await require('../src/import/node').ingestLocalBytes(originalBytes,'procedural.png');
    const node=await require('../src/print-package').generate({originalBytes,asset,inkRecipe:F.recipe(item.count),screenRecipe:F.screen,dpi:300,paper:'recipe',exports:checked.manifest.exports.settings});
    for(const [name,data]of node.parts){
      if(/^(?:plates|screened|proof|exports)\/.+\.png$/.test(name)){
        const a=await require('../src/import/node').ingestLocalBytes(await archive.read(name)),b=await require('../src/import/node').ingestLocalBytes(data);assert.deepEqual(a.rgba,b.rgba,'Browser/Node lossless pixels '+name);
      }
      if(name.endsWith('.svg'))assert.equal((await archive.read(name)).toString(),data.toString(),'Browser/Node vector paths '+name);
    }
    fs.writeFileSync(path.join(OUT,'browser-'+item.count+'.zip'),bytes);
    cases.push({inks:item.count,files:checked.files,frame:checked.frame,formats:checked.manifest.exports.proofs.map(p=>p.format),scale:checked.manifest.exports.settings.scale});
  }
  const report={contract:'stipra-browser-export-parity-v1',browser:evidence.userAgent,cases,checks:['decoded lossless PNG pixels','identical sampled SVG paths','all derivative codec signatures and decoded dimensions','native masters and coverage','complete package hashes and metadata'],limits:['JPEG/WebP bytes may differ across encoders; signatures, dimensions and declared lossiness are checked.','Physical prints remain unverified.']};
  fs.writeFileSync(path.join(OUT,'browser-parity.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));return report;
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});module.exports={run};
