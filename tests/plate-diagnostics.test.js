'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const Diagnostics=require('../src/plate-diagnostics.js');
const root=path.resolve(__dirname,'..');
function make(...arrays){
  const n=arrays[0].length;
  return {width:n,height:1,masks:arrays.map((x,i)=>({id:'ink'+i,name:'ink '+i,
    coverage:Uint8Array.from(x),screen:i===0?{mode:'dots',pitch:6,angle:45}:{mode:'solid',pitch:6,angle:0}}))};
}
test('per-pass and pairwise overlap are measured from exact underlying bytes',()=>{
  const x=make([255,255,0,0],[0,255,255,0]);
  const before=x.masks.map(m=>m.coverage.slice());
  const d=Diagnostics.inspect(x,{dpi:300,settings:{overlapFraction:.2}});
  assert.equal(d.contract,'stipra-plate-diagnostics-v1');
  assert.equal(d.overall.inkedFraction,.75);
  assert.equal(d.overall.meanAdditiveCoverage,1);
  assert.equal(d.overall.overlapTwoPlusFraction,.25);
  assert.equal(d.overall.overlapThreePlusFraction,0);
  assert.equal(d.overall.heavyCombinedFraction,.25);
  assert.equal(d.pairs[0].overlapFraction,.25);
  assert.equal(d.plates[0].meanCoverage,.5);
  assert.equal(d.plates[0].occupiedFraction,.5);
  assert.equal(d.plates[0].veryDenseFraction,.5);
  assert.equal(d.plates[0].additiveInkShare,.5);
  assert.equal(d.plates[0].screen.effectiveLpi,50);
  assert.equal(d.plates[1].screen.effectiveLpi,null);
  assert.ok(d.warnings.some(w=>w.code==='extensive-overlap'));
  assert.deepEqual(x.masks.map(m=>m.coverage),before,'must not alter printable masks');
});
test('three inks expose exact >=3 coverage and near-unused third passes',()=>{
  const x=make([255,255,0,0],[255,0,255,0],[255,0,0,0]);
  const d=Diagnostics.inspect(x);
  assert.equal(d.overall.overlapThreePlusFraction,.25);
  assert.equal(d.overall.overlapTwoPlusFraction,.25);
  assert.deepEqual(d.pairs.map(p=>p.inks.join('/')),['ink0/ink1','ink0/ink2','ink1/ink2']);
  assert.equal(d.pairs[2].overlapFraction,.25);
  assert.equal(d.plates[2].meanCoverage,.25);
});
test('warns on mostly unused and broad heavy pass without pretending it is a press limit',()=>{
  const x=make([255,255,255,255],[0,0,0,1]);
  const d=Diagnostics.inspect(x);
  assert.ok(d.warnings.some(w=>w.code==='broad-heavy-pass'&&w.inkIds[0]==='ink0'));
  assert.ok(d.warnings.some(w=>w.code==='low-contribution'&&w.inkIds[0]==='ink1'));
  assert.equal(d.overall.overlapTwoPlusFraction,0,'trace marks below activation threshold are not meaningful overlap');
  assert.match(d.measurement,/uncalibrated/);
  assert.deepEqual(d.thresholds.activeThreshold,.25);
});
test('all-zero masks and unequal ink strength have finite, honest values',()=>{
  const d=Diagnostics.inspect(make([0,0,0],[0,0,0]),{dpi:600});
  assert.equal(d.overall.inkedFraction,0);
  assert.equal(d.overall.meanAdditiveCoverage,0);
  assert.equal(d.plates[0].additiveInkShare,0);
  assert.ok(Object.values(d.overall).every(Number.isFinite));
  assert.ok(d.warnings.length>=2);
});
test('physical LPI is derived separately from actual plate pitch and output DPI',()=>{
  const masks=make([255,0],[0,255]);masks.masks[0].screen.pitch=5;
  const a=Diagnostics.inspect(masks,{dpi:300}),b=Diagnostics.inspect(masks,{dpi:600});
  assert.equal(a.plates[0].screen.effectiveLpi,60);
  assert.equal(b.plates[0].screen.effectiveLpi,120);
  assert.equal(a.plates[1].screen.effectiveLpi,null);
});
test('rejects malformed configs, mismatched grids, duplicate ids and invalid dpi',()=>{
  assert.throws(()=>Diagnostics.inspect({width:2,height:2,masks:[{id:'a',coverage:new Uint8Array(1)}]}),/full-frame/);
  assert.throws(()=>Diagnostics.inspect(make([1],[2]),{dpi:0}),/dpi/);
  assert.throws(()=>Diagnostics.options({activeThreshold:1.5}),/activeThreshold/);
  assert.throws(()=>Diagnostics.options({unknown:1}),/unknown/);
  const x=make([1],[2]);x.masks[1].id='ink0';
  assert.throws(()=>Diagnostics.inspect(x),/unique/);
});
test('same dependency-free implementation and metrics in browser UMD and Node',()=>{
  const src=fs.readFileSync(path.join(root,'src/plate-diagnostics.js'),'utf8');
  const browser={};vm.runInNewContext(src,browser);
  const input=make([0,150,255],[75,150,0]);
  const native=Diagnostics.inspect(input),client=browser.StipraDiagnostics.inspect(input);
  assert.equal(JSON.stringify(native),JSON.stringify(client));
});

test('suitability measures the source, excludes transparency and offers explicit nonsemantic advice',()=>{
  const input={width:4,height:1,rgba:Uint8ClampedArray.from([0,0,0,255,255,255,255,255,0,255,0,0,128,128,128,255])};
  const d=Diagnostics.suitability(input);
  assert.equal(d.visiblePixelWeight,3);assert.equal(d.shadowFraction,.333333);
  assert.equal(d.highlightFraction,.333333);assert.equal(d.nearNeutralFraction,1);
  assert.equal(d.tonalRange,1);assert.equal(d.guidance.length,3);
  assert.match(d.measurement,/no semantic/);
  assert.deepEqual(Diagnostics.inspect(make([0,100,255,0],[0,0,0,0]),{input}).suitability,d);
  assert.throws(()=>Diagnostics.inspect(make([0],[0]),{input}),/source grid/);
  const transparent={width:1,height:1,rgba:Uint8Array.of(0,0,0,0)};
  assert.equal(Diagnostics.suitability(transparent).tonalRange,0);
  assert.match(Diagnostics.suitability(transparent).guidance[0],/transparent/);
  assert.throws(()=>Diagnostics.suitability({width:1,height:1,rgba:[]}),/RGBA/);
});
