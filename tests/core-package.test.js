'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
test('packed core installs offline with no runtime dependencies and works without browser globals',async()=>{
  const report=await require('../scripts/build-core').build();
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-core-install-'));
  const npm=(...args)=>cp.execFileSync('npm',args,{cwd:temp,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try{
    const [pack]=JSON.parse(npm('pack',path.join(ROOT,'packages/core'),'--json','--pack-destination',temp));
    assert.deepEqual(pack.files.map(x=>x.path).sort(),['LICENSE','README.md','package.json','dist/index.cjs','dist/index.mjs','dist/index.d.cts','dist/index.d.mts'].sort());
    fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({name:'isolated-consumer',version:'1.0.0',private:true}));
    npm('install',path.join(temp,pack.filename),'--offline','--ignore-scripts','--no-audit','--no-fund');
    const lock=JSON.parse(fs.readFileSync(path.join(temp,'package-lock.json'),'utf8'));
    assert.deepEqual(Object.keys(lock.packages).sort(),['','node_modules/@yigit-denktas/stipra-core']);
    const pkg=JSON.parse(fs.readFileSync(path.join(temp,'node_modules/@yigit-denktas/stipra-core/package.json'),'utf8'));
    assert.equal(pkg.dependencies,undefined);assert.equal(pkg.private,false);
    const consumer=path.join(temp,'consumer.mjs');
    fs.writeFileSync(consumer,`import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as esm from '@yigit-denktas/stipra-core';
const cjs=createRequire(import.meta.url)('@yigit-denktas/stipra-core');
const input={width:2,height:1,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',coverage:new Uint8Array([255,0])}]};
assert.deepEqual(esm.renderLayers(input),cjs.renderLayers(input));
assert.deepEqual(Object.keys(esm).sort(),['CONTRACT','VERSION','listStyles','renderImage','renderLayers','resolveStyle'].sort());
const context=vm.createContext({});
const module=new vm.SourceTextModule(readFileSync(new URL('./node_modules/@yigit-denktas/stipra-core/dist/index.mjs',import.meta.url),'utf8'),{context});
await module.link(()=>{throw Error('Unexpected runtime import');});await module.evaluate();
assert.equal(vm.runInContext('typeof document+":"+typeof process+":"+typeof Buffer',context),'undefined:undefined:undefined');
assert.equal(module.namespace.renderLayers(input).proof.rgba[1],96);
`);
    cp.execFileSync(process.execPath,['--experimental-vm-modules',consumer],{cwd:temp,stdio:'pipe'});
    const esmTypes=`import {renderLayers,renderImage,listStyles,resolveStyle} from '@yigit-denktas/stipra-core';
const r=renderLayers({width:1,height:1,paper:'#ffffff',inks:[{id:'key',name:'Key',color:'#006043',coverage:new Uint8Array([255])}]});
const n:number=r.plates[0].screen.pitch;
renderImage({width:1,height:1,colorSpace:'srgb',rgba:new Uint8ClampedArray(4)},{style:{id:'clean-linework'},seed:3});
const styles=listStyles();const resolved=resolveStyle(styles[0].id,{dpi:300,lpi:50});
const mode:'spot'|'cmyk'=resolved.inkRecipe.mode;
`;
    fs.writeFileSync(path.join(temp,'valid.mts'),esmTypes);
    fs.writeFileSync(path.join(temp,'valid.cts'),`import core = require('@yigit-denktas/stipra-core');
const v:string=core.VERSION; const styles=core.listStyles();`);
    const tsc=require.resolve('typescript/bin/tsc');
    const args=['--strict','--noEmit','--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','--lib','ES2020'];
    cp.execFileSync(process.execPath,[tsc,...args,'valid.mts','valid.cts'],{cwd:temp,stdio:'pipe'});
    fs.writeFileSync(path.join(temp,'invalid.mts'),`import {renderImage,renderLayers} from '@yigit-denktas/stipra-core';
renderImage({width:1,height:1,colorSpace:'display-p3',rgba:new Uint8Array(4)},{style:{id:'clean-linework'}});
renderLayers({width:1,height:1,paper:'#fff',inks:[]},{seed:'bad'});`);
    const bad=cp.spawnSync(process.execPath,[tsc,...args,'invalid.mts'],{cwd:temp,encoding:'utf8'});
    assert.notEqual(bad.status,0);assert.match(bad.stdout,/not assignable/);
    for(const build of report.builds){assert.ok(build.gzipBytes<20000);assert.ok(!build.inputs.some(x=>x.includes('node_modules/')));}
    const evidence={...report,tarball:{bytes:pack.size,unpackedBytes:pack.unpackedSize,files:pack.files.map(x=>x.path),integrity:pack.integrity},
      checks:{offlineInstall:true,runtimeDependencies:0,esm:true,cjs:true,noDOM:true,typescriptESM:true,typescriptCJS:true,invalidTypesRejected:true}};
    const out=path.join(ROOT,'out/core-package');fs.mkdirSync(out,{recursive:true});
    fs.copyFileSync(path.join(temp,pack.filename),path.join(out,pack.filename));
    fs.writeFileSync(path.join(out,'package-report.json'),JSON.stringify(evidence,null,2)+'\n');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
