'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),{pathToFileURL}=require('node:url'),{runNpm}=require('./npm-cli');
test('optional inputs package installs offline without runtime dependencies and has usable ESM/CJS/types',async()=>{
  await require('../scripts/build-inputs').build();const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-inputs-'));
  try{
    const npm=(...args)=>runNpm(args,{cwd:tmp,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    const [packed]=JSON.parse(npm('pack',path.resolve(__dirname,'../packages/inputs'),'--json','--pack-destination',tmp));
    fs.writeFileSync(path.join(tmp,'package.json'),JSON.stringify({name:'inputs-consumer',version:'1.0.0',private:true}));
    npm('install',path.join(tmp,packed.filename),'--offline','--ignore-scripts','--no-audit','--no-fund');
    const lock=JSON.parse(fs.readFileSync(path.join(tmp,'package-lock.json')));assert.deepEqual(Object.keys(lock.packages),['','node_modules/@yigit-denktas/stipra-inputs']);
    const api=await import(pathToFileURL(path.join(tmp,'node_modules/@yigit-denktas/stipra-inputs/dist/index.mjs')).href);assert.equal(typeof api.mapRegions,'function');assert.equal(typeof require(path.join(tmp,'node_modules/@yigit-denktas/stipra-inputs/dist/index.cjs')).depthCoverage,'function');
    fs.writeFileSync(path.join(tmp,'consumer.mts'),`import {mapRegions,regionProject,type RegionSource} from '@yigit-denktas/stipra-inputs';
const source:RegionSource={width:1,height:1,regions:[{id:'x',name:'X',role:'coverage',coverage:new Uint8Array([128]),provenance:{kind:'authored'}}]};
const m=mapRegions(source,{version:1,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',combine:'max',regions:[{id:'x'}]}]});regionProject(source,m.recipe);`);
    cp.execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--noEmit','--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','consumer.mts'],{cwd:tmp,stdio:'pipe'});
    const out=path.resolve(__dirname,'../out/structured-inputs');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package-report.json'),JSON.stringify({contract:'stipra-inputs-package-v1',bytes:packed.size,unpackedBytes:packed.unpackedSize,files:packed.files.map(x=>x.path),installedPackages:Object.keys(lock.packages).filter(Boolean),esm:true,cjs:true,typescript:true},null,2)+'\n');
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
