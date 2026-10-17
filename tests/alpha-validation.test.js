'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {Canvas}=require('skia-canvas'),Core=require('../src/sdk'),Package=require('../src/print-package'),JSZip=require('jszip');
function canvas(w,h){const c=new Canvas(w,h);c.ownerDocument={createElement:()=>canvas(1,1)};return c;}
const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
test('bounded draft cache retains its original full-resolution frame for explicit final rendering',async()=>{
  await require('../scripts/build-core').build();
  const adapter=fs.readFileSync(path.join(__dirname,'../packages/canvas/index.mjs'),'utf8').replace('@stipra/core',pathToFileURL(path.join(__dirname,'../packages/core/dist/index.mjs')).href);
  const draft=fs.readFileSync(path.join(__dirname,'../examples/sketches/draft.mjs'),'utf8').replace('./assets/canvas.mjs',dataURL(adapter));
  const {createDraftRenderer}=await import(dataURL(draft)),source=canvas(288,216),ctx=source.getContext('2d');ctx.fillStyle='#006043';ctx.fillRect(40,10,100,150);
  const expected=Core.renderImage({width:288,height:216,colorSpace:'srgb',rgba:ctx.getImageData(0,0,288,216).data},{style:{id:'clean-linework'},seed:42});
  const options={style:{id:'clean-linework'},seed:42},renderer=createDraftRenderer({options,maxEdge:64}),shot=renderer.update(source,'a');options.seed=7;
  assert.deepEqual(shot.resolution.preview,{width:64,height:48});assert.equal(shot.resolution.resampled,true);assert.equal(shot.capture,undefined,'draft must not look like an exportable rendered frame');
  assert.equal(renderer.update(source,'a'),shot);ctx.clearRect(0,0,288,216);
  const final=shot.renderFinal();assert.deepEqual(final.result.proof.rgba,expected.proof.rgba);assert.equal(final.result.recipe.screens.seed,42);assert.equal(shot.renderFinal(),final);
  for(let i=0;i<expected.plates.length;i++)assert.deepEqual(final.result.plates[i].screened,expected.plates[i].screened);
  assert.notEqual(renderer.update(source,'b'),shot);renderer.clear();assert.notEqual(renderer.update(source,'b'),shot);
  assert.throws(()=>renderer.update(source),/revision/);assert.throws(()=>createDraftRenderer({options,maxEdge:0}),/maxEdge/);
  let called=0;const pkg=await shot.exportFinal(async()=>({generateSketch:async x=>{called++;assert.equal(x.input.width,288);assert.equal(x.input.height,216);return {bytes:new Uint8Array([1])};}}));assert.equal(called,1);assert.equal(pkg.bytes[0],1);
});
test('export parity validator rejects a package with a contaminated production master',async()=>{
  const F=await import('../examples/alpha/fixture.mjs'),input=F.layers(),expected=Core.renderLayers(input,F.layerOptions),pkg=await Package.generateLayers({input,...F.layerOptions});
  const {verifyPackage}=require('../scripts/verify-alpha-parity');await verifyPackage(pkg.zip,expected);
  const zip=await JSZip.loadAsync(pkg.zip),ink=pkg.manifest.inks[0];zip.file(ink.screened,await zip.file(ink.plate).async('nodebuffer'));
  await assert.rejects(verifyPackage(await zip.generateAsync({type:'nodebuffer'}),expected));
});
