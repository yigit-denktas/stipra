'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/owner-recipe-review');

test('metric definitions and ROI coordinates are explicit',()=>{
  assert.deepEqual(M.ROIS,{
    A:{ridges:[250,150,300,300]},
    B:{display:[650,220,600,430]},
    C:{figures:[470,1250,240,200]},
  });
  assert.match(M.DEFINITIONS.gray,/\.2126 R/);
  const pixel=new Uint8Array([255,0,0,255]);
  assert.equal(M.gray(pixel,1,1)[0],255*.2126);
});

test('Pearson and ROI helpers reject invalid input',()=>{
  assert.equal(M.pearson(Float64Array.from([1,2,3]),Float64Array.from([2,4,6])),1);
  assert.throws(()=>M.region(new Uint8Array(4),1,1,[0,0,2,1]),/ROI outside/);
});

test('tone means and gradients use declared units, including singleton ROIs',()=>{
  const image=values=>({width:2,height:2,rgba:Uint8Array.from(values.flatMap(v=>[v,v,v,255]))});
  const black=image([0,0,0,0]),white=image([255,255,255,255]),steps=image([0,255,0,255]);
  const dark=M.stats(black,black,[0,0,2,2]),light=M.stats(white,white,[0,0,2,2]);
  assert.equal(dark.sourceTone,1);assert.equal(dark.proofTone,1);
  assert.equal(light.sourceTone,0);assert.equal(light.proofTone,0);
  const measured=M.stats(steps,steps,[0,0,2,2]);
  assert.equal(measured.sourceTone,.5);assert.equal(measured.sourceGradient,1);
  assert.equal(measured.proofGradient,1);assert.equal(measured.sourceStd,127.5);
  const singleton=M.stats(white,white,[0,0,1,1]);
  assert.equal(singleton.sourceGradient,0);assert.equal(singleton.proofGradient,0);
  assert.equal(singleton.rawCorrelation,null,'a constant ROI has no defined Pearson r');
});
