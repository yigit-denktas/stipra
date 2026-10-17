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
test('explicit paper seeds change substrate without changing any native plate or geometry',()=>{
 for(const {id} of E.listPresets()){
  const original=E.preset(id),a=E.build(original),c=E.validate({...original,paperSeed:1234567}),b=E.build(c);
  assert.equal(c.paperSeed,1234567);assert.deepEqual(a.polys,b.polys);assert.deepEqual(a.plates,b.plates);
  assert.notEqual(E.svg(a),E.svg(b));
  for(const role of Object.keys(a.plates))assert.equal(E.svgPlateExport(a,role),E.svgPlateExport(b,role));
 }
});
test('zero-softness facets share the same straight sampled edge in either traversal direction',()=>{
 const c=E.validate({...E.preset('01'),softness:0}),scene=E.build(c),edges=new Map();let shared=0;
 for(const [name,keys] of Object.entries(E.FACETS)){
  const points=[...scene.polys[name].matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);let at=0;
  for(let i=0;i<keys.length;i++){
   const from=keys[i],to=keys[(i+1)%keys.length],a=E.geomPoint(from,c),b=E.geomPoint(to,c),length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(2,Math.ceil(length/5));
   const segment=points.slice(at,at+count+1);assert.equal(segment.length,count+1);at+=count;
   for(const p of segment)assert.ok(Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/length<.008,'edge must remain straight');
   const key=[from,to].sort().join('/'),canonical=from<to?segment:segment.slice().reverse();
   if(edges.has(key)){const previous=edges.get(key);assert.equal(previous.length,canonical.length);previous.forEach((p,j)=>assert.ok(Math.hypot(p[0]-canonical[j][0],p[1]-canonical[j][1])<.015));shared++;}else edges.set(key,canonical);
  }
  assert.equal(at,points.length-1);
 }
 assert.ok(shared>=5,'exercise genuine adjacent facets');
});
