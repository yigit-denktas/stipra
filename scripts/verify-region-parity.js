#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url'),path=require('node:path'),Core=require('../src/sdk'),Print=require('../src/print-package'),{readRegions}=require('./reproduce-regions'),{mapRegions}=require('../src/structured/regions');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(){
  const F=await import(pathToFileURL(path.resolve(__dirname,'../examples/regions/fixture.mjs')).href),evidence=JSON.parse(fs.readFileSync('out/structured-inputs/browser-evidence.json'));
  for(const item of evidence.cases){
    const input=mapRegions(F.forest(97,61),F.mapping(item.count)).input,result=Core.renderLayers(input,F.options),replay=await readRegions(Buffer.from(item.zipBase64,'base64'));
    assert.deepEqual(replay.input,input);assert.equal(item.proof,hash(result.proof.rgba));
    for(let i=0;i<item.plates.length;i++){assert.equal(item.plates[i].coverage,hash(result.plates[i].coverage));assert.equal(item.plates[i].screened,hash(result.plates[i].screened));}
    const exported=await Print.generateLayers(replay),archive=await require('../src/archive').openArchive(Buffer.from(item.zipBase64,'base64'));
    const {ingestLocalBytes}=require('../src/import/node');
    for(const [name,bytes]of exported.parts)if(/^(plates|screened|proof)\/.+\.png$/.test(name)){
      const browser=await ingestLocalBytes(await archive.read(name)),node=await ingestLocalBytes(bytes);assert.deepEqual(browser.rgba,node.rgba,'Browser/Node pixel mismatch '+name);
    }
    const inputPath=`out/structured-inputs/browser-${item.count}.zip`,outputPath=`out/structured-inputs/replayed-${item.count}.zip`;fs.writeFileSync(inputPath,Buffer.from(item.zipBase64,'base64'));fs.rmSync(outputPath,{force:true});await require('./reproduce-regions').run(inputPath,outputPath);
  }
  const report={contract:'stipra-regions-parity-v1',cases:evidence.cases.length,browser:evidence.userAgent,checks:['raw coverage','screened masks','proof pixels','source-project hashes','Node package pixels','CLI replay']};fs.writeFileSync('out/structured-inputs/parity.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module)run().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e);process.exitCode=1;});module.exports={run};
