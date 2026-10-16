const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../examples/prehnite-v8/src/engine.js');
test('engine exposes six original colorways',()=>{
 assert.deepEqual(E.listPresets().map(x=>x.id),['01','02','03','04','05','06']);
});
test('each scene builds at correct native size with repeatable SVG',()=>{
 for(const id of ['01','02','03','04','05','06']){
  const a=E.build(E.preset(id)),b=E.build(E.preset(id));
  assert.equal(a.width,2020);assert.equal(a.height,779);
  assert.equal(E.svg(a),E.svg(b));
  assert.ok(a.dotCount>0);
 }
});
test('three-color preset keeps its independent ink channel',()=>{
 const c=E.preset('03'),scene=E.build(c);
 assert.ok(scene.plates.third.length>0);
 for(const ink of ['primary','accent','third'])
  assert.match(E.svgPlateExport(scene,ink),/<svg\b/i);
});
test('SVG represents vector geometry, not an embedded raster',()=>{
 const scene=E.build(E.preset('01')),svg=E.svg(scene);
 assert.match(svg,/<path/);assert.doesNotMatch(svg,/data:image\/|<image\b/i);
});
