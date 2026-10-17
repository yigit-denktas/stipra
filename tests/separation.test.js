'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const vm=require('node:vm');
const {Canvas}=require('skia-canvas');
const Separation=require('../src/separation.js');
const pngInfo=require('../src/import/probe.js').inspect;
const SPOT=require('../examples/recipes/spot-photo.json');
const CMYK=require('../examples/recipes/cmyk-photo.json');

function pixels(...rgba){return {width:rgba.length,height:1,rgba:Uint8Array.from(rgba.flat())};}
function plate(result,id){return result.masks.find(m=>m.id===id).coverage;}
function sampleCanvas(){
  const c=new Canvas(4,2),ctx=c.getContext('2d');
  ctx.clearRect(0,0,4,2);
  ctx.fillStyle='#ff0000';ctx.fillRect(0,0,1,1);
  ctx.fillStyle='#00ffff';ctx.fillRect(1,0,1,1);
  ctx.fillStyle='#000000';ctx.fillRect(2,0,1,1);
  ctx.fillStyle='#ffffff';ctx.fillRect(3,0,1,1);
  ctx.fillStyle='#2365a5';ctx.fillRect(0,1,1,1);
  ctx.fillStyle='#e65e4b';ctx.fillRect(1,1,1,1);
  return c;
}
test('CMYK math handles white, RGB primaries and pure black without NaN',()=>{
  assert.deepEqual(Separation.cmyk(0,0,0),[0,0,0,1]);
  assert.deepEqual(Separation.cmyk(1,1,1),[0,0,0,0]);
  assert.deepEqual(Separation.cmyk(1,0,0),[0,1,1,0]);
  assert.deepEqual(Separation.cmyk(0,1,1),[1,0,0,0]);
  assert.deepEqual(Separation.cmyk(0,0,1),[1,1,0,0]);
  assert.deepEqual(Separation.cmyk(0.5,0.5,0.5),[0,0,0,0.5]);
});
test('CMYK yields separate true pixel masks, not four recolored copies',()=>{
  const input=pixels([0,255,255,255],[255,0,255,255],[255,255,0,255],[0,0,0,255],[255,255,255,255],[255,0,0,0]);
  const result=Separation.separate(input,CMYK);
  assert.deepEqual(Array.from(plate(result,'cyan')),[255,0,0,0,0,0]);
  assert.deepEqual(Array.from(plate(result,'magenta')),[0,255,0,0,0,0]);
  assert.deepEqual(Array.from(plate(result,'yellow')),[0,0,255,0,0,0]);
  assert.deepEqual(Array.from(plate(result,'black')),[0,0,0,255,0,0]);
  assert.equal(result.preview.length,input.rgba.length);
  assert.equal(result.stats.pixels,6);
  assert.equal(result.stats.printedPixels,4);
  assert.deepEqual(Array.from(input.rgba.slice(-4)),[255,0,0,0], 'original alpha remains untouched');
});
test('spot color matching, gamma, gain and threshold edit actual plate coverage',()=>{
  const config=Separation.validate(SPOT);
  const input=pixels([230,94,75,255],[35,101,165,255],[255,255,255,255],[0,0,0,255],[230,94,75,128]);
  const original=Separation.separate(input,config);
  const coral=plate(original,'coral'),blue=plate(original,'blue');
  assert.equal(coral[0],255);
  assert.equal(blue[1],255);
  assert.equal(coral[2],0);
  assert.equal(blue[2],0);
  assert.equal(coral[3],0);
  assert.equal(blue[3],255,'black hold reserves fully black marks for the blue plate');
  assert.ok(coral[4]>=126&&coral[4]<=129,'half opacity masks are not composited against white');
  const edited=JSON.parse(JSON.stringify(SPOT));
  edited.inks[0].gain=0.25;
  assert.notDeepEqual(Array.from(plate(Separation.separate(input,edited),'coral')),Array.from(coral));
  edited.inks[0].threshold=0.98;
  assert.equal(Separation.validate(edited).inks[0].threshold,0.98);
});
test('spot inks can intentionally overlap on the same original pixel',()=>{
  const recipe={version:1,mode:'spot',paper:'#fefdf8',inks:[
    {id:'blue',name:'Blue',color:'#2365a5',source:'darkness'},
    {id:'coral',name:'Coral',color:'#e65e4b',source:'darkness',gain:0.5}
  ]};
  const result=Separation.separate(pixels([128,128,128,255]),recipe);
  assert.ok(plate(result,'blue')[0]>0);
  assert.ok(plate(result,'coral')[0]>0);
  assert.notEqual(plate(result,'blue')[0],plate(result,'coral')[0]);
  assert.equal(result.recipe.paper,'#fefdf8');
  assert.equal(result.masks.length,2,'paper must not be an ink plate');
});
test('transparent pixels stay uninked; plate PNG conversion uses white = no ink',()=>{
  const result=Separation.separate(pixels([0,0,0,0],[0,0,0,255]),CMYK);
  for(const mask of result.masks)assert.equal(mask.coverage[0],0);
  assert.deepEqual(Array.from(Separation.plateRGBA(plate(result,'black'))),[255,255,255,255,0,0,0,255]);
});
test('strict recipe and pixel validation prevents silent edits and unsupported inputs',()=>{
  assert.throws(()=>Separation.validate({...CMYK,mode:'magical'}),/recipe.mode/);
  assert.throws(()=>Separation.validate({...CMYK,inks:CMYK.inks.slice(0,2)}),/CMYK requires/);
  assert.throws(()=>Separation.validate({...SPOT,inks:[SPOT.inks[0],SPOT.inks[0]]}),/duplicate|unique/);
  assert.throws(()=>Separation.validate({...SPOT,unknown:'bad'}),/unknown setting/);
  assert.throws(()=>Separation.validate({...SPOT,inks:SPOT.inks.map((i,j)=>j?{...i,source:'script'}:i)}),/unsupported coverage/);
  assert.throws(()=>Separation.validate({...SPOT,blackHold:{inkId:'nonexistent'}}),/existing spot/);
  assert.throws(()=>Separation.separate({width:3,height:1,rgba:Uint8Array.of(1,2,3,4)},SPOT),/length does not match/);
  assert.throws(()=>Separation.separate({width:24000,height:24000,rgba:new Uint8Array(4)},SPOT),/dimensions/);
});
test('browser global and Node produce identical recipes, masks, stats and previews',()=>{
  const context=vm.createContext({Uint8Array,Uint8ClampedArray,Float64Array,Math,Set,TypeError});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/separation.js'),'utf8'),context);
  const input=pixels([230,94,75,255],[35,101,165,255],[0,0,0,255],[255,255,255,0]);
  const native=Separation.separate(input,SPOT),browser=context.StipraSeparation.separate(input,SPOT);
  assert.equal(JSON.stringify(browser.recipe),JSON.stringify(native.recipe));
  assert.equal(JSON.stringify(browser.stats),JSON.stringify(native.stats));
  assert.deepEqual(Array.from(browser.preview),Array.from(native.preview));
  for(let i=0;i<native.masks.length;i++)
    assert.deepEqual(Array.from(browser.masks[i].coverage),Array.from(native.masks[i].coverage));
});
test('real CLI writes full-frame source, masks, preview and manifest; rejects overwrites',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-separate-'));
  const from=path.join(dir,'fixture.png'),to=path.join(dir,'spot'),cmykTo=path.join(dir,'cmyk');
  const repo=path.resolve(__dirname,'..'),entry=path.join(repo,'bin/stipra.js');
  try{
    const original=sampleCanvas().toBufferSync('png');
    fs.writeFileSync(from,original);
    function run(config,out){
      return JSON.parse(cp.execFileSync(process.execPath,[entry,'separate','--input',from,'--config',path.join(repo,'examples/recipes/'+config),'--out',out],{encoding:'utf8'}));
    }
    const manifest=run('spot-photo.json',to);
    assert.equal(manifest.contract,'stipra-separation-v1');
    assert.equal(manifest.mode,'spot');
    assert.deepEqual([manifest.width,manifest.height],[4,2]);
    assert.equal(manifest.inks.length,2);
    assert.deepEqual(fs.readFileSync(path.join(to,'source-original.png')),original);
    for(const ink of manifest.inks){
      const plate=fs.readFileSync(path.join(to,ink.plate)),info=pngInfo(plate);
      assert.deepEqual([info.width,info.height],[4,2]);
    }
    assert.equal(manifest.assets.length,7);
    assert.deepEqual([pngInfo(fs.readFileSync(path.join(to,'preview-composite.png'))).width, pngInfo(fs.readFileSync(path.join(to,'preview-composite.png'))).height],[4,2]);
    assert.throws(()=>run('spot-photo.json',to),/Command failed/);
    const four=run('cmyk-photo.json',cmykTo);
    assert.equal(four.inks.length,4);
    assert.equal(four.assets.length,9);
    assert.equal(four.source.oriented.width,4);
  }finally{fs.rmSync(dir,{force:true,recursive:true});}
});

test('photographic tone opens encoded midtones and density channels remove gray without normalizing chroma',()=>{
  const recipe={version:1,mode:'spot',paper:'#ffffff',inks:[
    {id:'tone',name:'Tone',color:'#006043',source:'tone'},
    {id:'chroma',name:'Yellow chroma',color:'#e2a523',source:'yellow-density',grayRemoval:1}]};
  const result=Separation.separate(pixels([128,128,128,255],[51,153,26,255],[0,0,0,255],[255,255,255,255],[51,153,26,0]),recipe);
  assert.deepEqual(Array.from(plate(result,'tone')),[127,133,255,0,0]);
  assert.deepEqual(Array.from(plate(result,'chroma')),[0,127,0,0,0]);
  const raw={...recipe,inks:recipe.inks.map(i=>i.id==='chroma'?{...i,grayRemoval:0}:i)};
  assert.deepEqual(Array.from(plate(Separation.separate(pixels([128,128,128,255],[0,0,0,255]),raw),'chroma')),[127,255]);
  for(const grayRemoval of [-1,2,NaN,'1'])assert.throws(()=>Separation.validate({...recipe,inks:[recipe.inks[0],{...recipe.inks[1],grayRemoval}]}),/grayRemoval/);
  assert.throws(()=>Separation.validate({...recipe,inks:[{...recipe.inks[0],grayRemoval:1},recipe.inks[1]]}),/only valid/);
  assert.deepEqual(Separation.validate(Separation.validate(recipe)),Separation.validate(recipe));
});
