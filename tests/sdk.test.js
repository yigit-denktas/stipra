'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const SDK=require('../src/sdk'),Sep=require('../src/separation'),Screen=require('../src/screening'),Plan=require('../src/export-plan'),Styles=require('../src/styles');
function fixture(){
  const width=19,height=11,rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const q=(y*width+x)*4;rgba.set([x*13,y*23,(x+y)*7,(x+y)%4===0?0:(x+y)%4===1?128:255],q);
  }
  return {width,height,rgba,colorSpace:'srgb'};
}
function authored(){return {width:3,height:2,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',coverage:new Uint8Array([255,0,128,0,255,0])}]};}
test('core uses the shared engine byte-for-byte and records physical scale and style versions',()=>{
  const input=fixture(),options={style:{id:'editorial-halftone',variant:'forest-depth',lpi:50},dpi:300,seed:42};
  const a=SDK.renderImage(input,options),b=SDK.renderImage(input,options);
  const style=Styles.resolve('editorial-halftone',{variant:'forest-depth',lpi:50,dpi:300,seed:42});
  const sep=Sep.separate({width:input.width,height:input.height,rgba:input.rgba},style.inkRecipe);
  const direct=Screen.apply(sep,Plan.screenConfigs(style.screenRecipe,sep.masks.map(x=>x.id)).production);
  assert.deepEqual(a,b);assert.equal(a.contract,'stipra-core-v1');
  for(let i=0;i<a.plates.length;i++){
    assert.deepEqual(a.plates[i].coverage,sep.masks[i].coverage);
    assert.deepEqual(a.plates[i].screened,direct.masks[i].coverage);
    assert.equal(a.diagnostics.plates[i].screen.effectiveLpi,direct.masks[i].screen.mode==='solid'?null:50);
  }
  assert.deepEqual(a.proof.rgba,direct.preview);
  assert.equal(a.recipe.style.style.variant,'forest-depth');
  assert.deepEqual(a.geometry.sourcePixels,{width:19,height:11});
  assert.deepEqual(a.geometry.trimPixels,{x:0,y:0,width:19,height:11});
  assert.equal(a.geometry.trimMm.width,Number((19*25.4/300).toFixed(4)));
});
test('alpha attenuates actual coverage; fully transparent pixels never create ink',()=>{
  const input={width:3,height:1,colorSpace:'srgb',rgba:new Uint8Array([0,0,0,0,0,0,0,128,0,0,0,255])};
  const recipe={version:1,mode:'spot',paper:'#ffffff',inks:[{id:'key',name:'Key',color:'#006043',source:'darkness'},{id:'accent',name:'Accent',color:'#ff665d',source:'darkness',gain:0}]};
  const result=SDK.renderImage(input,{inkRecipe:recipe});
  assert.deepEqual([...result.plates[0].coverage],[0,128,255]);
  assert.deepEqual([...result.proof.rgba.slice(0,4)],[255,255,255,255]);
  assert.equal(result.proof.alpha,'opaque');
});
test('authored masks preserve one to eight ink assignments and do not re-separate RGB',()=>{
  const input=authored(),result=SDK.renderLayers(input);
  assert.equal(result.inputKind,'layers');assert.equal(result.recipe.inks.mode,'authored');
  assert.deepEqual(result.plates[0].coverage,input.inks[0].coverage);
  assert.deepEqual(result.plates[0].screened,input.inks[0].coverage);
  assert.deepEqual([...result.proof.rgba.slice(0,4)],[0,96,67,255]);
  assert.equal(result.diagnostics.plates.length,1);
  const many={...input,inks:Array.from({length:8},(_,i)=>({...input.inks[0],id:'ink-'+i}))};
  assert.equal(SDK.renderLayers(many).plates.length,8);
  assert.throws(()=>SDK.renderLayers({...many,inks:[...many.inks,many.inks[0]]}),/one to eight/);
});
test('proof registration never moves production coverage or its shared frame',()=>{
  const input=authored(),raw={version:1,seed:2,default:{mode:'solid',registration:{x:1,y:0,rotate:0}}};
  const before=JSON.stringify(raw),a=SDK.renderLayers(input,{screenRecipe:raw}),b=SDK.renderLayers(input);
  assert.deepEqual(a.plates,b.plates);assert.notDeepEqual(a.proof.rgba,b.proof.rgba);
  assert.deepEqual(a.recipe.screens.plates.green.registration,{x:0,y:0,rotate:0});
  assert.equal(a.recipe.proofScreens.plates.green.registration.x,1);
  assert.deepEqual(a.geometry,b.geometry);assert.equal(JSON.stringify(raw),before);
});
test('render buffers are owned independently and no input or global random state is mutated',()=>{
  const input=authored(),original=input.inks[0].coverage.slice(),random=Math.random;
  Math.random=()=>{throw Error('ambient randomness used');};
  let result;try{result=SDK.renderLayers(input,{screenRecipe:{version:1,seed:99,default:{mode:'dots',pitch:4,jitter:.2}}});}
  finally{Math.random=random;}
  assert.deepEqual(input.inks[0].coverage,original);
  result.proof.rgba.fill(0);assert.deepEqual(input.inks[0].coverage,original);
  result.plates[0].coverage.fill(3);assert.deepEqual(input.inks[0].coverage,original);
  assert.notEqual(result.plates[0].coverage.buffer,result.plates[0].screened.buffer);
  input.inks[0].coverage.fill(88);assert.ok(result.plates[0].screened.every(x=>x!==88));
  const pixels=fixture(),snapshot=pixels.rgba.slice();SDK.renderImage(pixels,{style:{id:'clean-linework'}});assert.deepEqual(pixels.rgba,snapshot);
});
test('foreign realm views and sliced buffers are accepted without exposing unrelated bytes',()=>{
  const foreign=vm.runInNewContext('({width:1,height:1,colorSpace:"srgb",rgba:new Uint8ClampedArray([0,0,0,255])})');
  assert.equal(SDK.renderImage(foreign,{style:{id:'clean-linework'}}).proof.rgba.length,4);
  const input=authored(),large=new Uint8Array([99,255,0,128,0,255,0,99]);input.inks[0].coverage=large.subarray(1,7);
  assert.deepEqual([...SDK.renderLayers(input).plates[0].coverage],[255,0,128,0,255,0]);
});
test('invalid frames, unsupported color, masks and conflicting settings are rejected',()=>{
  const input=fixture(),opts={style:{id:'editorial-halftone'}};
  for(const change of [{width:0},{height:1.5},{width:20001},{width:20000,height:20000},{colorSpace:'display-p3'},{rgba:new Float32Array(input.rgba.length)},{rgba:new Uint8Array(3)}])
    assert.throws(()=>SDK.renderImage({...input,...change},opts));
  assert.throws(()=>SDK.renderImage(input,{...opts,inkRecipe:{}}),/choose style/);
  assert.throws(()=>SDK.renderImage(input,{}),/provide a style/);
  assert.throws(()=>SDK.renderImage(input,{...opts,foo:true}),/unknown field/);
  assert.throws(()=>SDK.renderLayers(authored(),{seed:1,screenRecipe:{version:1,seed:2}}),/conflicts/);
  assert.throws(()=>SDK.renderLayers(authored(),{dpi:20}),/DPI/);
  assert.throws(()=>SDK.renderLayers(authored(),{seed:-1}),/uint32/);
  assert.throws(()=>SDK.renderLayers({...authored(),inks:[{...authored().inks[0],coverage:new Uint8Array(5)}]}),/exact-length/);
  assert.throws(()=>SDK.renderLayers({...authored(),inks:[authored().inks[0],authored().inks[0]]}),/unique/);
  if(typeof SharedArrayBuffer==='function')assert.throws(()=>SDK.renderImage({...input,rgba:new Uint8Array(new SharedArrayBuffer(input.rgba.length))},opts),/non-shared/);
});
