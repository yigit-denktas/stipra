'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),evidence=require('../docs/evidence/reconstruction-study-01.json');
test('reconstruction evidence retains source identity and frozen site fixtures',()=>{
 assert.equal(evidence.revision,'coverage-controlled-v2');assert.equal(evidence.fixtures.length,2);
 for(const f of evidence.fixtures){
  const bytes=fs.readFileSync(path.join(root,'examples/reconstruction-study/points',f.id+'.json')),points=JSON.parse(bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.pointFixtureSha256);
  assert.equal(points.sourceSha256,f.sourceSha256);assert.equal(points.points.length,3000);assert.equal(points.seed,109);
  for(const p of points.points){assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));}
 }
 assert.equal(evidence.acceptance.humanBlindRankings,0);assert.equal(evidence.acceptance.decisionGrade,false);
 assert.ok(evidence.environment.ReportLab&&evidence.environment.node&&evidence.environment.skiaCanvas);
});
test('reconstruction tone controls cannot regress to sparse marks or merged bands',()=>{
 for(const f of evidence.fixtures){
  for(const key of ['01-weighted-stipple','02-directional-hatch','03-continuous-route','06-hybrid']){
   const m=f.metrics[key];assert.ok(Math.abs(m.coverage-f.targetDarkness)<=.005,key+' coverage');
   assert.ok(m.elements>0&&m.svgBytes>0);assert.ok(Number.isFinite(m.blockRmse8bit));
  }
  const v=f.vtracer;assert.equal(v.palette.length,4);assert.deepEqual(v.svgFillLevels,v.palette);assert.ok(v.flags.layer_difference<=16);assert.ok(v.renderedNearestBandFractions.every(x=>x>.01));assert.equal(v.allFourBandsRetained,true);
  assert.ok(Math.abs(v.renderedNearestBandFractions.reduce((a,b)=>a+b,0)-1)<1e-10);
  assert.match(f.metrics['05-dither'].role,/unconstrained/);assert.match(f.metrics.baseline.role,/solid/);
  for(const [name,item]of Object.entries(f.artifacts))if(name.endsWith('.png')){assert.match(item.decodedPixels.sha256,/^[0-9a-f]{64}$/);assert.equal(item.decodedPixels.mode,'RGBA8');}
 }
 assert.ok(evidence.reportArtifacts['reconstruction-study-01.pdf']);assert.match(evidence.reproducibility.scope,/cross-build.*not independently verified/i);
});
