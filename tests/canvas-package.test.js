'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),{pathToFileURL}=require('node:url');
const {Canvas}=require('skia-canvas');let adapter,temp;
function canvas(w=4,h=3){
  const c=new Canvas(w,h);c.ownerDocument={createElement:()=>canvas(1,1)};return c;
}
test.before(async()=>{
  await require('../scripts/build-core').build();fs.copyFileSync(path.join(__dirname,'../LICENSE'),path.join(__dirname,'../packages/canvas/LICENSE'));
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-canvas-'));
  const npm=(...args)=>cp.execFileSync('npm',args,{cwd:temp,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const [core]=JSON.parse(npm('pack',path.join(__dirname,'../packages/core'),'--json','--pack-destination',temp));
  const [host]=JSON.parse(npm('pack',path.join(__dirname,'../packages/canvas'),'--json','--pack-destination',temp));
  assert.deepEqual(host.files.map(x=>x.path).sort(),['LICENSE','README.md','index.d.ts','index.mjs','package.json']);
  fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({name:'canvas-consumer',version:'1.0.0',private:true}));
  npm('install',path.join(temp,core.filename),path.join(temp,host.filename),'--offline','--ignore-scripts','--no-audit','--no-fund');
  const lock=JSON.parse(fs.readFileSync(path.join(temp,'package-lock.json')));
  assert.deepEqual(Object.keys(lock.packages).sort(),['','node_modules/@stipra/canvas','node_modules/@stipra/core']);
  adapter=await import(pathToFileURL(path.join(temp,'node_modules/@stipra/canvas/index.mjs')).href);
  fs.writeFileSync(path.join(temp,'consumer.mts'),`import {renderCanvas,renderCanvasLayers,drawProof,exportSnapshot} from '@stipra/canvas';
const a=document.createElement('canvas');const r=renderCanvas(a,{style:{id:'clean-linework'}});drawProof(r,a);
renderCanvasLayers({paper:'#ffffff',inks:[{id:'x',name:'X',color:'#006043',source:a,polarity:'alpha'}]});`);
  cp.execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--strict','--noEmit','--target','ES2020','--module','NodeNext','--moduleResolution','NodeNext','consumer.mts'],{cwd:temp,stdio:'pipe'});
  const out=path.join(__dirname,'../out/canvas-package');fs.mkdirSync(out,{recursive:true});
  fs.copyFileSync(path.join(temp,host.filename),path.join(out,host.filename));
  fs.writeFileSync(path.join(out,'package-report.json'),JSON.stringify({contract:'stipra-canvas-package-v1',
    adapter:{bytes:host.size,unpackedBytes:host.unpackedSize,files:host.files.map(x=>x.path),integrity:host.integrity},
    installedPackages:Object.keys(lock.packages).filter(Boolean),checks:{offlineInstall:true,typescript:true,p5Bundled:false,exporterBundled:false}},null,2)+'\n');
});
test.after(()=>{if(temp)fs.rmSync(temp,{recursive:true,force:true});});
test('canvas adapter preserves density, source alpha and original pixels',()=>{
  const source=canvas(8,6),ctx=source.getContext('2d');ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,4,3);
  const before=ctx.getImageData(0,0,8,6).data.slice(),r=adapter.renderCanvas({canvas:source,width:4,height:3},{style:{id:'clean-linework'}});
  assert.deepEqual(r.capture.metadata.pixelDensity,{x:2,y:2});assert.equal(r.result.proof.width,8);
  assert.deepEqual(ctx.getImageData(0,0,8,6).data,before);
  assert.equal(r.canvas.getContext('2d').getImageData(7,5,1,1).data[3],0);
  assert.ok(r.canvas.getContext('2d').getImageData(0,0,1,1).data[3]>120);
  assert.throws(()=>adapter.drawProof(r,source),e=>e.code==='feedback-target');
  const target=canvas(8,6);adapter.drawProof(r,target);assert.ok(target.getContext('2d').getImageData(0,0,1,1).data[3]>0);
});
test('authored canvas polarity, alpha and mismatched frames are explicit',()=>{
  const a=canvas(),ctx=a.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,4,3);ctx.fillStyle='#000';ctx.fillRect(0,0,1,1);
  const layer={id:'green',name:'Green',color:'#006043',source:a,polarity:'dark-on-light'};
  const captured=adapter.captureLayers({paper:'#fff000',inks:[layer]});assert.equal(captured.input.inks[0].coverage[0],255);assert.equal(captured.input.inks[0].coverage[1],0);
  assert.throws(()=>adapter.captureLayers({paper:'#ffffff',inks:[layer,{...layer,id:'x',source:canvas(5,3)}]}),e=>e.code==='layer-frame-mismatch');
  ctx.fillStyle='#ff0000';ctx.fillRect(0,0,1,1);assert.throws(()=>adapter.captureLayers({paper:'#ffffff',inks:[layer]}),e=>e.code==='non-grayscale-layer');
  assert.equal(adapter.captureLayers({paper:'#ffffff',inks:[{...layer,polarity:'alpha'}]}).input.inks[0].coverage[0],255);
});
test('snapshot export freezes source and recipes before awaiting a lazy loader',async()=>{
  const a=canvas(),ctx=a.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,4,3);
  const rendered=adapter.renderCanvas(a,{style:{id:'clean-linework'},seed:42});let release,called=0;
  const exported=adapter.exportSnapshot(rendered,()=>{called++;return new Promise(resolve=>{release=resolve;});});
  rendered.capture.input.rgba.fill(0);rendered.result.recipe.dpi=600;ctx.clearRect(0,0,4,3);
  release({generateSketch:async data=>{assert.equal(data.input.rgba[3],255);assert.equal(data.recipe.dpi,300);return {bytes:new Uint8Array([1]),manifest:{}};}});
  assert.equal((await exported).bytes[0],1);assert.equal(called,1);
});
test('WEBGL, tainted and unsupported-color canvases fail with actionable errors',()=>{
  assert.throws(()=>adapter.captureCanvas({width:4,height:3,getContext:()=>null}),e=>e.code==='unsupported-renderer');
  assert.throws(()=>adapter.captureCanvas({width:4,height:3,getContext:()=>({getImageData(){const e=new Error();e.name='SecurityError';throw e;}})}),e=>e.code==='tainted-canvas');
  assert.throws(()=>adapter.captureCanvas({width:4,height:3,getContext:()=>({getImageData:()=>({colorSpace:'display-p3'})})}),e=>e.code==='unsupported-color');
});
