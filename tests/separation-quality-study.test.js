'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {keyStatistics}=require('../scripts/review-separation-quality');
test('key statistics distinguish source-black coverage from collapsed nonblack tones',()=>{
  const input={width:4,height:1,rgba:Uint8Array.from([0,0,0,255,32,32,32,255,128,128,128,255,255,255,255,0])};
  const flat=keyStatistics(input,Uint8Array.from([255,255,128,0]));
  assert.equal(flat.fullCoverageFraction,.5);assert.equal(flat.fullCoverageOnNonblackFraction,.25);assert.equal(flat.occupiedToneLevels,3);
  const graduated=keyStatistics(input,Uint8Array.from([255,223,128,0]));
  assert.equal(graduated.fullCoverageOnNonblackFraction,0);assert.equal(graduated.occupiedToneLevels,4);
  assert.throws(()=>keyStatistics(input,new Uint8Array(3)),/grid/);
});
