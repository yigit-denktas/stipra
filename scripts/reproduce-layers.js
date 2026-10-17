#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),JSZip=require('jszip');
const {ingestLocalBytes}=require('../src/import/node'),Package=require('../src/print-package');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
/** Reconstructs authored masks from a package snapshot and checks their recorded hashes. */
async function readSnapshot(bytes){
  const archive=await require('../src/archive').openArchive(bytes),read=name=>archive.read(name);
  const manifest=JSON.parse(await read('manifest.json')),descriptorBytes=await read('source/original.json'),source=JSON.parse(descriptorBytes);
  if(manifest.mode!=='authored'||source.contract!=='stipra-authored-source-v1'||hash(descriptorBytes)!==manifest.source.sha256)throw Error('Invalid authored snapshot descriptor');
  const inks=[];
  for(const ink of source.inks){
    if(!/^source\/layers\/ink-[a-z0-9_-]+\.png$/.test(ink.path))throw Error('Invalid source-layer path');
    const image=await ingestLocalBytes(await read(ink.path));
    if(image.metadata.oriented.width!==source.width||image.metadata.oriented.height!==source.height)throw Error('Source layer frame mismatch');
    const coverage=new Uint8Array(source.width*source.height);
    for(let i=0;i<coverage.length;i++)coverage[i]=255-image.rgba[i*4];
    if(hash(coverage)!==ink.coverageSha256)throw Error('Source coverage hash mismatch: '+ink.id);
    inks.push({id:ink.id,name:ink.name,color:ink.color,coverage});
  }
  const sourceProject=await require('../src/source-project-reader').readProject(archive,manifest,source.width,source.height);
  return {...(manifest.exports?{exports:manifest.exports.settings}:{}),sourceProject,input:{width:source.width,height:source.height,paper:source.paper,inks},
    screenRecipe:JSON.parse(await read('recipe/proof-screens.json')),dpi:manifest.output.dpi,marksMm:manifest.output.marksMm,
    paper:manifest.paperSelection.id,reportTexture:manifest.report.texture.style,qrStyle:manifest.report.qr.style,
    captureMetadata:manifest.source.provenance.capture??null};
}
async function run(input,output){
  if(!input||!output||!output.endsWith('.zip')||fs.existsSync(output))throw Error('Usage: node scripts/reproduce-layers.js INPUT.zip NEW-OUTPUT.zip (never overwrites)');
  const result=await Package.generateLayers(await readSnapshot(fs.readFileSync(input)));
  fs.writeFileSync(output,result.zip,{flag:'wx'});return result.manifest;
}
if(require.main===module)run(...process.argv.slice(2)).then(m=>console.log(JSON.stringify({mode:m.mode,inks:m.inks.length,dpi:m.output.dpi}))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={readSnapshot,run};
