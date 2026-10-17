'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Inspect=require('../src/inspection');
test('solo, mute and paper inspection never alter original masks or the full production proof',()=>{
  const result={width:2,height:1,masks:[{id:'green',color:'#006043',coverage:new Uint8Array([128,0])},{id:'coral',color:'#ff665d',coverage:new Uint8Array([0,255])}]},before=result.masks.map(m=>m.coverage.slice());
  const all=Inspect.preview(result,'#f5efdf'),solo=Inspect.preview(result,'#f5efdf',{solo:'green'});
  assert.notDeepEqual(all,solo);assert.deepEqual(solo,Inspect.preview(result,'#f5efdf',{muted:['coral']}));
  const paper=Inspect.preview(result,'#f5efdf',{paperOnly:true});assert.deepEqual([...paper],[245,239,223,255,245,239,223,255]);
  const transparent=Inspect.preview(result,'#f5efdf',{solo:'green',substrate:false});assert.equal(transparent[3],128);assert.equal(transparent[7],0);
  assert.deepEqual(result.masks.map(m=>m.coverage),before);assert.deepEqual(Inspect.preview(result,'#f5efdf'),all);assert.throws(()=>Inspect.preview(result,'#ffffff',{solo:'missing'}),/Unknown/);
});
