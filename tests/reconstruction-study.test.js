'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),evidence=require('../docs/evidence/reconstruction-study-01.json');
test('reconstruction evidence retains source identity and frozen site fixtures',()=>{
 assert.equal(evidence.revision,'coverage-controlled-v2+review-metrics');assert.equal(evidence.fixtures.length,2);
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

test('review evidence includes complete replay, local tone, spatial definitions and immutable prior recording',()=>{
 const prior=fs.readFileSync(path.join(root,evidence.previousEvidence.path));
 assert.equal(crypto.createHash('sha256').update(prior).digest('hex'),'cc2a9b4178a08f6d0d487844422f79bad69b73e7eaf21d4b9f3d4d703e3a683e');
 const replay=evidence.reproducibility.sameEnvironmentReplay;
 assert.equal(replay.allEqual,true);assert.equal(replay.matchedArtifacts,32);assert.equal(replay.comparedArtifacts,32);assert.ok(evidence.reportArtifacts['replay-check.json']);
 for(const f of evidence.fixtures){
  for(const m of Object.values(f.metrics)){
   assert.equal(m.toneHistogram.source.length,32);assert.equal(m.toneHistogram.rendered.length,32);
   assert.ok(Math.abs(m.coverage-f.targetDarkness-m.coverageError)<.000002);
   assert.equal(m.localTone.toneDecileSignedErrorPp.length,10);
   if(m.circles){assert.ok(m.overlappingCircleFraction>=0&&m.overlappingCircleFraction<=1);assert.ok(m.overlappingPairsPerCircle>=0);}
  }
  assert.match(f.vtracer.spatialBandAgreement.boundaryDefinition,/four-neighbour/);
 }
});
