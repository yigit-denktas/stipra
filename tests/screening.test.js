'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const {Canvas}=require('skia-canvas');
const Sep=require('../src/separation.js'),Screen=require('../src/screening.js');
const SPOT=require('../examples/recipes/spot-photo.json');
const SCREEN=require('../examples/recipes/screens-spot.json');
function coverage(w,h,value=128){
  const mask=new Uint8Array(w*h);mask.fill(value);return mask;
}
function mean(m){return m.reduce((a,v)=>a+v,0)/(255*m.length);}
function histogram(m){return {blank:m.filter(v=>v===0).length,ink:m.filter(v=>v===255).length};}
function fixture(w=48,h=32){
  const rgba=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;rgba[i]=Math.round(x/(w-1)*255);
    rgba[i+1]=Math.round(y/(h-1)*255);rgba[i+2]=120;
    rgba[i+3]=x<5?0:255;
  }
  return {width:w,height:h,rgba};
}
test('screen settings reject invalid modes, nonfinite pitch, unknown ink, unsafe registration, unknown fields',()=>{
  for(const setting of [{mode:'p5.riso'}, {pitch:0},{angle:Infinity},{jitter:0.31},{registration:{x:200}}, {registration:{scale:5}}, {foo:1}]){
    assert.throws(()=>Screen.validate(setting),/screen\./);
  }
  assert.throws(()=>Screen.config({...SCREEN,plates:{alien:{mode:'dots'}}},['blue','coral']),/unknown field/);
  assert.throws(()=>Screen.config({...SCREEN,seed:2.5},['blue','coral']),/seed/);
  assert.throws(()=>Screen.screenMask(new Uint8Array(4),3,3),/exact full-frame/);
  assert.deepEqual(Object.keys(Screen.config(SCREEN,['blue','coral']).plates),['blue','coral']);
});
test('solid is a byte-for-byte plate copy; paper mode produces zero ink; source remains unchanged',()=>{
  const a=Uint8Array.from([0,64,128,255,128,0,255,44]),before=a.slice();
  const solid=Screen.screenMask(a,4,2,{mode:'solid'});
  const paper=Screen.screenMask(a,4,2,{mode:'paper'});
  assert.deepEqual(solid.coverage,a);
  assert.notEqual(solid.coverage,a);
  assert.deepEqual([...paper.coverage],Array(8).fill(0));
  assert.deepEqual(a,before);
});
test('positive dots, reverse knockouts, line bands and hybrid produce distinct meaningful raster masks',()=>{
  const mid=coverage(64,48,128);
  const common={pitch:12,angle:0,dotScale:1,jitter:0};
  const marks=['dots','reverse','lines','hybrid'].map(mode=>Screen.screenMask(mid,64,48,{...common,mode}).coverage);
  for(const m of marks){
    assert.ok(histogram(m).blank>0,'needs paper holes');
    assert.ok(histogram(m).ink>0,'needs ink marks');
    assert.ok([...m].every(x=>x===0||x===255),'binary screening expected');
    assert.ok(mean(m)>.08&&mean(m)<.92,'nontrivial tone');
  }
  assert.notDeepEqual(marks[0],marks[1]);
  assert.notDeepEqual(marks[1],marks[2]);
  const hybrid=Screen.screenMask(coverage(48,48,255),48,48,{mode:'hybrid',pitch:12,solidThreshold:0.85}).coverage;
  assert.deepEqual(hybrid,coverage(48,48,255),'solid full-tone detail retained');
});
test('zero-support and source alpha holes stay empty unless intentionally shifted by registration',()=>{
  const w=48,h=48,mask=coverage(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<16;x++)mask[y*w+x]=0;
  const result=Screen.screenMask(mask,w,h,{mode:'dots',pitch:8,angle:34,jitter:0.1},7).coverage;
  for(let y=0;y<h;y++)for(let x=0;x<16;x++)assert.equal(result[y*w+x],0);
});
test('different seeds and angles affect ink placement, not original geometry/dimensions',()=>{
  const w=72,h=56,src=coverage(w,h,145),before=src.slice(),screen={mode:'dots',pitch:10,jitter:0.29,angle:20};
  const a=Screen.screenMask(src,w,h,screen,123).coverage,b=Screen.screenMask(src,w,h,screen,123).coverage;
  const c=Screen.screenMask(src,w,h,screen,124).coverage,d=Screen.screenMask(src,w,h,{...screen,angle:70},123).coverage;
  assert.deepEqual(a,b,'same seed and recipe must match');
  assert.notDeepEqual(a,c,'seed should affect placement');
  assert.notDeepEqual(a,d,'angle should affect screen rotation');
  assert.equal(a.length,w*h);
  assert.deepEqual(src,before,'no deformation of source pixels');
});
test('changing dot pitch and scale changes screened coverage; reverse avoids silent inversion of source',()=>{
  const src=coverage(96,64,100);
  const a=Screen.screenMask(src,96,64,{mode:'dots',pitch:6},4).coverage;
  const b=Screen.screenMask(src,96,64,{mode:'dots',pitch:16},4).coverage;
  const c=Screen.screenMask(src,96,64,{mode:'dots',pitch:16,dotScale:0.4},4).coverage;
  assert.notDeepEqual(a,b);
  assert.ok(mean(c)<mean(b));
  const blank=Screen.screenMask(coverage(96,64,0),96,64,{mode:'reverse',pitch:12},4).coverage;
  assert.equal(blank.reduce((sum,n)=>sum+n,0),0,'reverse must not generate ink from white paper');
});
test('registration shifts exactly one ink pass, preserves bounds, source mask and plate count',()=>{
  const a=new Uint8Array(25);a[2*5+2]=255;
  const moved=Screen.screenMask(a,5,5,{mode:'solid',registration:{x:1,y:0,rotate:0}}).coverage;
  assert.equal(moved[2*5+3],255);
  assert.equal(moved[2*5+2],0);
  assert.equal(a[2*5+2],255);
  const rotated=Screen.screenMask(a,5,5,{mode:'solid',registration:{rotate:12}}).coverage;
  assert.equal(rotated.length,25);
  const rightEdge=new Uint8Array(25);rightEdge[2*5+4]=255;
  assert.equal(Screen.screenMask(rightEdge,5,5,{mode:'solid',registration:{x:2}}).coverage.reduce((a,b)=>a+b,0),0,
    'registration outside fixed full-frame plate is clipped rather than changing plate dimensions');
});
test('screening preserves independent 2 spot masks, same canvas and paper exclusion',()=>{
  const separated=Sep.separate(fixture(),SPOT);
  const before=separated.masks.map(m=>m.coverage.slice());
  const screened=Screen.apply(separated,SCREEN);
  assert.equal(screened.contract,'stipra-screen-v1');
  assert.deepEqual([screened.width,screened.height],[48,32]);
  assert.deepEqual(screened.masks.map(m=>m.id),['coral','blue']);
  assert.equal(screened.masks.length,2);
  assert.equal(screened.preview.length,48*32*4);
  assert.deepEqual(separated.masks.map(m=>m.coverage),before,'screening must not modify originals');
  assert.notDeepEqual(screened.masks[0].coverage,before[0]);
  assert.equal(screened.stats.inks.length,2);
});
test('four-color CMYK uses distinct per-ink angles and maintains full-frame masks',()=>{
  const separated=Sep.separate(fixture(),require('../examples/recipes/cmyk-photo.json'));
  const output=Screen.apply(separated,require('../examples/recipes/screens-cmyk.json'));
  assert.equal(output.masks.length,4);
  assert.deepEqual(output.masks.map(m=>m.screen.angle),[15,75,0,45]);
  assert.ok(output.masks.every(m=>m.coverage.length===48*32));
  assert.ok(output.masks.some(m=>histogram(m.coverage).ink>0));
});
test('Node and browser globals produce byte-identical raster screen and preview',()=>{
  const scope=vm.createContext({Uint8Array,Uint8ClampedArray,Float32Array,Float64Array,Uint32Array,Math,Set,TypeError});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/screening.js'),'utf8'),scope);
  const separated=Sep.separate(fixture(),SPOT);
  const actual=Screen.apply(separated,SCREEN),browser=scope.StipraScreen.apply(separated,SCREEN);
  assert.equal(JSON.stringify(actual.recipe),JSON.stringify(browser.recipe));
  assert.deepEqual([...actual.preview],[...browser.preview]);
  for(let i=0;i<actual.masks.length;i++)
    assert.deepEqual([...actual.masks[i].coverage],[...browser.masks[i].coverage]);
});
test('actual CLI emits original + unscreened + screened plates with complete provenance; refuses overwrite',()=>{
  const repo=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-screen-'));
  try{
    const source=path.join(dir,'photo.png'),output=path.join(dir,'out');
    const c=new Canvas(48,32),ctx=c.getContext('2d');
    ctx.fillStyle='#2365a5';ctx.fillRect(0,0,24,32);
    ctx.fillStyle='#e65e4b';ctx.fillRect(24,0,24,32);
    fs.writeFileSync(source,c.toBufferSync('png'));
    const command=[path.join(repo,'bin/stipra.js'),'separate','--input',source,
      '--config',path.join(repo,'examples/recipes/spot-photo.json'),
      '--screen',path.join(repo,'examples/recipes/screens-spot.json'),'--out',output];
    const manifest=JSON.parse(cp.execFileSync(process.execPath,command,{encoding:'utf8'}));
    assert.equal(manifest.width,48);assert.equal(manifest.height,32);
    assert.equal(manifest.screening.contract,'stipra-screen-v1');
    assert.equal(manifest.screening.inks.length,2);
    for(const name of ['screen-recipe.normalized.json','screened-preview.png','screened-blue-plate.png',
      'screened-coral-plate.png','plate-blue.png','plate-coral.png','source-original.png']){
      assert.ok(fs.existsSync(path.join(output,name)),name+' missing');
    }
    const probe=require('../src/import/probe.js');
    for(const name of ['screened-blue-plate.png','screened-coral-plate.png','screened-preview.png']){
      const dimensions=probe.inspect(fs.readFileSync(path.join(output,name)));
      assert.deepEqual([dimensions.width,dimensions.height],[48,32]);
    }
    assert.deepEqual(fs.readFileSync(path.join(output,'source-original.png')),fs.readFileSync(source));
    assert.throws(()=>cp.execFileSync(process.execPath,command,{stdio:'pipe'}),/Command failed/);
    assert.equal(manifest.assets.length,12);
  }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
