'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {Canvas,loadImage}=require('skia-canvas'),Print=require('../src/print-package'),{svgSamples}=require('../src/vector-samples'),Sep=require('../src/separation'),Screen=require('../src/screening');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
async function fixture(){return import(pathToFileURL(path.resolve(__dirname,'../examples/workflows/fixture.mjs')).href);}
async function decode(bytes,w,h){if(bytes.toString('utf8',0,4)==='<svg')bytes=Buffer.from(bytes.toString().replace(/width="[^"]+" height="[^"]+"/,'width="'+w+'" height="'+h+'"'));const image=await loadImage(bytes),c=new Canvas(w,h),x=c.getContext('2d');x.drawImage(image,0,0,w,h);return x.getImageData(0,0,w,h).data;}
test('pure SVG paths preserve binary and grayscale masks at native and scaled sizes',async()=>{
  const coverage=new Uint8Array([0,1,128,255,64,192,254,0,255,128,32,16]),rgba=Sep.plateRGBA(coverage),svg=svgSamples(rgba,4,3,{dpi:300});
  assert.equal(svg.embeddedRaster,false);assert.doesNotMatch(svg.text,/<image\b|data:/);assert.match(svg.text,/width="0.338667mm"/);
  const native=await decode(Buffer.from(svg.text),4,3);assert.deepEqual(new Uint8ClampedArray(native),rgba);
  const large=await decode(Buffer.from(svg.text),8,6);for(let y=0;y<6;y++)for(let x=0;x<8;x++)assert.equal(large[(y*8+x)*4],rgba[(Math.floor(y/2)*4+Math.floor(x/2))*4]);
  assert.throws(()=>svgSamples(rgba,4,3,{maxRuns:2}),/sampled runs/);
});
test('2/3/4 ink odd-size fixtures match saved engine goldens and decoded vector masters',async()=>{
  const F=await fixture(),saved=require('./fixtures/export-goldens.json');
  for(const count of [2,3,4]){
    const input=F.artwork(count===3?33:49,count===3?49:33),inkRecipe=Sep.validate(F.recipe(count)),sep=Sep.separate({width:input.width,height:input.height,rgba:input.rgba},inkRecipe),configs=Print.screenConfigs(F.screen,sep.masks.map(x=>x.id)),screen=Screen.apply(sep,configs.production);
    assert.deepEqual(screen.masks.map((m,i)=>({id:m.id,continuous:hash(sep.masks[i].coverage),screened:hash(m.coverage)})),saved[count]);
    for(const mask of screen.masks){const rgba=Sep.plateRGBA(mask.coverage),vector=svgSamples(rgba,input.width,input.height);assert.deepEqual(new Uint8ClampedArray(await decode(Buffer.from(vector.text),input.width,input.height)),rgba);}
  }
});
test('optional proof formats preserve native masters and expose lossy/alpha/scale semantics',async()=>{
  const F=await fixture(),input=F.artwork(49,50),c=new Canvas(input.width,input.height),ctx=c.getContext('2d'),p=ctx.createImageData(input.width,input.height);p.data.set(input.rgba);ctx.putImageData(p,0,0);
  const originalBytes=c.toBufferSync('png'),asset=await require('../src/import/node').ingestLocalBytes(originalBytes,'procedural.png'),base={originalBytes,asset,inkRecipe:F.recipe(2),screenRecipe:F.screen,dpi:300,marksMm:2,paper:'recipe'};
  const a=await Print.generate(base),b=await Print.generate({...base,exports:{formats:['png','jpg','webp','svg'],scale:2,alpha:'source',vectorPlates:true}});
  for(const ink of a.manifest.inks)for(const name of [ink.plate,ink.screened,ink.marked])assert.deepEqual(a.parts.get(name),b.parts.get(name));
  for(const name of ['proof/composite.png','report/separation-sheet.pdf'])assert.deepEqual(a.parts.get(name),b.parts.get(name));
  const v=await require('../src/verify-package').verify(b.zip);assert.equal(v.inks,2);
  const png=await decode(b.parts.get('exports/proof.png'),98,100),jpg=await decode(b.parts.get('exports/proof.jpg'),98,100);assert.equal(png[3],0);assert.equal(jpg[3],255);
  assert.equal(b.manifest.exports.proofs.find(x=>x.format==='jpg').alpha,'flattened-to-paper');
  assert.equal(b.manifest.exports.proofs.find(x=>x.format==='png').effectiveDpi,600);
});
