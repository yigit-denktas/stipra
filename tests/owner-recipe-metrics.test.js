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
