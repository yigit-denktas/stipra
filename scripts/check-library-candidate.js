#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {check}=require('./check-distribution'),{hash}=require('./artifact-evidence');
const ROOT=path.resolve(__dirname,'..');
/** Installs the audited tarballs together in an isolated offline consumer, without publishing. */
async function candidate(out=path.join(ROOT,'out/distribution-audit')){
  fs.rmSync(path.join(out,'library-candidate.json'),{force:true});
  const audit=await check(out),temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-candidate-'));
  try{
    const archives=audit.packages.map(pkg=>{
      const file=path.resolve(out,pkg.tarball.file);
      assert.equal(hash(fs.readFileSync(file)),pkg.tarball.sha256);return file;
    });
    fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({name:'stipra-candidate-consumer',version:'1.0.0',private:true}));
    cp.execFileSync('npm',['install',...archives,'--offline','--ignore-scripts','--no-audit','--no-fund'],{cwd:temp,stdio:'pipe'});
    const lock=JSON.parse(fs.readFileSync(path.join(temp,'package-lock.json')));
    const installed=Object.keys(lock.packages).filter(Boolean).sort();
    assert.deepEqual(installed,['node_modules/@stipra/canvas','node_modules/@stipra/core','node_modules/@stipra/inputs']);
    fs.writeFileSync(path.join(temp,'consumer.mjs'),`
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {renderLayers} from '@stipra/core';
import {mapRegions,regionProject,replayRegions} from '@stipra/inputs';
import {captureRegions} from '@stipra/inputs/canvas';
import {captureCanvas} from '@stipra/canvas';
const require=createRequire(import.meta.url);
const width=3,height=1,rgba=new Uint8ClampedArray([0,0,0,255,0,0,0,128,0,0,0,0]);
const source={width,height,getContext:()=>({getImageData:()=>({data:rgba.slice(),colorSpace:'srgb'})})};
assert.deepEqual([...captureCanvas(source).input.rgba],[...rgba]);
const regions=captureRegions({regions:[{id:'drawing',name:'Drawing',source,polarity:'alpha',provenance:{kind:'authored'}}]});
assert.deepEqual([...regions.regions[0].coverage],[255,128,0]);
const mapping={version:1,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',combine:'max',regions:[{id:'drawing'}]}]};
const mapped=mapRegions(regions,mapping),cjs=require('@stipra/inputs').mapRegions(regions,mapping);
assert.deepEqual(mapped,cjs);
const options={seed:42};
const rendered=renderLayers(mapped.input,options);
assert.deepEqual(rendered,require('@stipra/core').renderLayers(cjs.input,options));
assert.deepEqual(replayRegions(regionProject(regions,mapping)).input,mapped.input);
assert.deepEqual([...regions.regions[0].coverage],[255,128,0]);
assert.equal(rendered.proof.width,width);assert.equal(rendered.proof.height,height);
console.log(JSON.stringify({publicExports:true,esmCjsParity:true,canvasRegionCore:true,sourceUnchanged:true,regionReplay:true}));
`);
    const checks=JSON.parse(cp.execFileSync(process.execPath,['consumer.mjs'],{cwd:temp,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
    fs.writeFileSync(path.join(temp,'consumer.mts'),`
import {renderLayers} from '@stipra/core';
import {captureCanvas} from '@stipra/canvas';
import {mapRegions} from '@stipra/inputs';
import {captureRegions} from '@stipra/inputs/canvas';
const source=document.createElement('canvas');captureCanvas(source);
const regions=captureRegions({regions:[{id:'drawing',name:'Drawing',source,polarity:'alpha',provenance:{kind:'authored'}}]});
renderLayers(mapRegions(regions,{version:1,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',combine:'max',regions:[{id:'drawing'}]}]}).input);
`);
    cp.execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--noEmit','--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','consumer.mts'],{cwd:temp,stdio:'pipe'});
    const report={contract:'stipra-library-candidate-v1',status:'verified-private-candidate',node:process.version,
      packages:audit.packages.map(({name,version,tarball})=>({name,version,tarball})),installed,
      checks:{...checks,offlineInstall:true,lifecycleScriptsDisabled:true,typescriptPublicExports:true},
      gates:{registryPublished:false,ownerPublicationDecision:'pending',independentArtistTrial:'not-performed',physicalPrintValidation:'not-performed',
        broadExportDistribution:'review-required: fontkit, native Skia and fonteditor WASM are excluded from these tarballs, not cleared'},
      scope:'Exact tarballs only. Canvas fixture tests capture/region mapping, not browser rendering; real Chromium/p5 checks are separate CI evidence.'};
    fs.writeFileSync(path.join(out,'library-candidate.json'),JSON.stringify(report,null,2)+'\n');return report;
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)candidate().then(r=>console.log(JSON.stringify(r,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={candidate};
