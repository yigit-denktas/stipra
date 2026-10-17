#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),{readSnapshot}=require('./reproduce-layers'),{replayRegions}=require('../src/structured/project'),Package=require('../src/print-package');
/** Replays named regions and verifies that they reconstruct the archived final physical inks. */
async function readRegions(bytes){
  const snapshot=await readSnapshot(bytes);if(!snapshot.sourceProject)throw Error('No source project');
  const mapped=replayRegions(snapshot.sourceProject);
  if(mapped.input.inks.length!==snapshot.input.inks.length)throw Error('Mapped ink count differs from snapshot');
  for(let i=0;i<mapped.input.inks.length;i++){
    const a=mapped.input.inks[i],b=snapshot.input.inks[i];
    if(a.id!==b.id||a.name!==b.name||a.color!==b.color||!Buffer.from(a.coverage).equals(Buffer.from(b.coverage)))throw Error('Region replay differs from archived ink '+a.id);
  }
  return {...snapshot,input:mapped.input};
}
async function run(input,output){
  if(!input||!output||!output.endsWith('.zip')||fs.existsSync(output))throw Error('Usage: node scripts/reproduce-regions.js INPUT.zip NEW.zip');
  const result=await Package.generateLayers(await readRegions(fs.readFileSync(input)));fs.writeFileSync(output,result.zip,{flag:'wx'});return result.manifest;
}
if(require.main===module)run(...process.argv.slice(2)).then(m=>console.log(JSON.stringify({mode:m.mode,inks:m.inks.length}))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={readRegions,run};
