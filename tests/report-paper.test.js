'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadImage,Canvas}=require('skia-canvas');
const Paper=require('../src/report-paper.js'),Print=require('../src/print-package.js');
const {ingestLocalBytes}=require('../src/import/node.js');

test('report theme uses a real chosen ink, with a contrasting neutral fallback for pale inks',()=>{
  const rag=Paper.STOCKS.rag;
  assert.equal(Paper.theme(rag,[{color:'#006043'},{color:'#e2a523'}]).key,'#006043');
  const pale=Paper.theme(rag,[{color:'#e2a523'}]);
  assert.equal(pale.neutralFallback,true);assert.ok(pale.textContrast>=4.5);
  const dark=Paper.theme({hex:'#000000'},[{color:'#101010'}]);
  assert.equal(dark.key,'#ffffff');assert.ok(dark.textContrast>=4.5);
});
test('paper textures are deterministic, bounded, ink-linked and selectable',async()=>{
  const opts={width:160,height:200,inks:['#006043','#ff665d']};
  const a=await Paper.tile(Paper.STOCKS.rose,42,opts),b=await Paper.tile(Paper.STOCKS.rose,42,opts);
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,await Paper.tile(Paper.STOCKS.rose,43,opts));
  assert.notDeepEqual(a,await Paper.tile(Paper.STOCKS.rose,42,{...opts,inks:['#0d4dad']}));
  assert.notDeepEqual(a,await Paper.tile(Paper.STOCKS.rose,42,{...opts,style:'none'}));
  const im=await loadImage(a);assert.equal(im.width,160);assert.equal(im.height,200);
  assert.throws(()=>Paper.textureStyle('press-certified'),/texture/);
  await assert.rejects(()=>Paper.tile(Paper.STOCKS.rag,1,{width:1e8,height:100}),/geometry/);
  for(const id of ['rag','chalk','linen','clay','rose','sage','mist'])assert.equal(Paper.select(new Uint8Array(4),'#ffffff',id).id,id);
});
test('paper texture and annotation styling never alter source, proof or production mask bytes',async()=>{
  const c=new Canvas(20,12),x=c.getContext('2d');x.fillStyle='#557766';x.fillRect(0,0,20,12);
  const bytes=c.toBufferSync('png'),asset=await ingestLocalBytes(bytes,'texture-test.png');
  const options={originalBytes:bytes,asset,paper:'rose',inkRecipe:{version:1,mode:'spot',paper:'#ffffff',inks:[{id:'green',name:'green',color:'#006043',source:'darkness'},{id:'coral',name:'coral',color:'#ff665d',source:'red'}]}};
  const a=await Print.generate({...options,reportTexture:'speckled'}),b=await Print.generate({...options,reportTexture:'none'});
  for(const [name,body] of a.parts)if(!name.startsWith('report/')&&name!=='manifest.json')assert.deepEqual(body,b.parts.get(name),name);
  assert.notDeepEqual(a.parts.get('report/separation-sheet.pdf'),b.parts.get('report/separation-sheet.pdf'));
  assert.deepEqual(a.manifest.inks,b.manifest.inks);
  assert.deepEqual(a.manifest.source,b.manifest.source);
  assert.deepEqual(a.manifest.output,b.manifest.output);
  assert.equal(a.manifest.report.texture.dpi,144);
  assert.equal(a.manifest.report.theme.key,'#006043');
  assert.equal(a.manifest.report.texture.simulation,true);
});
