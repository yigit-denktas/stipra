'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Canvas}=require('skia-canvas');
const {DOMParser}=require('@xmldom/xmldom');
const Probe=require('../src/import/probe.js');
const SVG=require('../src/import/svg.js');
const {ingestLocalBytes}=require('../src/import/node.js');
const Shared=require('../src/import/asset.js');
const makeCanvas=(w,h)=>new Canvas(w,h);
function fixture(w=4,h=3){
  const c=makeCanvas(w,h),ctx=c.getContext('2d');
  ctx.fillStyle='rgba(0,0,0,0)';ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#ff0000';ctx.fillRect(0,0,1,1);
  ctx.fillStyle='#0000ff';ctx.fillRect(w-1,h-1,1,1);
  return c;
}
function exifOrientation(jpg,n){
  // EXIF APP1 TIFF little-endian, 1 IFD0 tag. Do not change source file.
  const header=Buffer.from([
    0xff,0xe1,0,0,
    0x45,0x78,0x69,0x66,0,0,
    0x49,0x49,0x2a,0,8,0,0,0,
    1,0,0x12,1,3,0,1,0,0,0,n,0,0,0,0,0,0,0
  ]);
  header.writeUInt16BE(header.length-2,2);
  return Buffer.concat([jpg.subarray(0,2),header,jpg.subarray(2)]);
}
function px(image,x,y){
  const {rgba,metadata}=image,w=metadata.oriented.width;
  return [...rgba.subarray((y*w+x)*4,(y*w+x)*4+4)];
}
test('translucent PNG import preserves the exact full-frame grid and transparent pixels',async()=>{
  const data=fixture().toBufferSync('png');
  const info=Probe.inspect(data);
  assert.equal(info.format,'png');assert.equal(info.hasAlpha,true);
  assert.deepEqual(info.layout.trim,{x:0,y:0,width:4,height:3});
  const image=await ingestLocalBytes(data,'alpha.png');
  assert.deepEqual(image.metadata.intrinsic,{width:4,height:3});
  assert.deepEqual(image.metadata.oriented,{width:4,height:3});
  assert.deepEqual(px(image,0,0).slice(0,3),[255,0,0]);
  assert.equal(px(image,1,1)[3],0);
  assert.deepEqual(px(image,3,2).slice(0,3),[0,0,255]);
  assert.equal(image.rgba.length,4*3*4);
});

test('EXIF orientation 6 is applied exactly once and the original JPEG remains unchanged',async()=>{
  const base=fixture(5,3).toBufferSync('jpg',{quality:1});
  const exif=exifOrientation(base,6),before=Buffer.from(exif);
  const info=Probe.inspect(exif);
  assert.equal(info.orientation,6);
  assert.deepEqual([info.displayWidth,info.displayHeight],[3,5]);
  const neutral=Probe.orientationNeutralBytes(exif,info);
  assert.equal(Probe.inspect(neutral).orientation,1);
  assert.deepEqual(exif,before);
  const image=await ingestLocalBytes(exif,'rotated.jpg');
  assert.deepEqual(image.metadata.oriented,{width:3,height:5});
  // Top-left pixel moves to rightmost pixel of top row for clockwise rotation.
  const red=px(image,2,0),blue=px(image,0,4);
  assert.ok(red[0]>red[2], 'red sample rotated to (2,0)');
  assert.ok(blue[2]>blue[0], 'blue sample rotated to (0,4)');
});
test('WebP decoder preserves transparency and alpha-inclusive shape',async()=>{
  const data=fixture(6,4).toBufferSync('webp');
  const info=Probe.inspect(data);
  assert.equal(info.format,'webp');
  assert.equal(info.width,6);assert.equal(info.height,4);
  assert.equal(info.hasAlpha,true);
  const image=await ingestLocalBytes(data,'transparent.webp');
  assert.equal(image.rgba.length,96);
  assert.ok(px(image,0,0)[3]>0);
  assert.equal(px(image,2,2)[3],0);
});
test('simple structured SVG retains viewBox, explicit dimensions and transparency after sanitization',async()=>{
  const source='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 240 120"><g transform="translate(12 0)"><rect x="0" y="0" width="30" height="30" fill="#123abc"/></g><path d="M10 10L70 10L40 50Z" fill="#ff0000"/></svg>';
  const bytes=Buffer.from(source);
  const valid=SVG.parse(source,DOMParser);
  assert.match(valid.safeMarkup,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.equal(valid.viewBox,'0 0 240 120');
  const info=Probe.inspect(bytes,{DOMParserCtor:DOMParser});
  assert.equal(info.format,'svg');assert.equal(info.width,120);assert.equal(info.height,60);
  const image=await ingestLocalBytes(bytes,'art.svg');
  assert.equal(image.rgba.length,120*60*4);
  assert.equal(image.metadata.viewBox,'0 0 240 120');
  assert.equal(image.metadata.alpha,true);
});
test('unsafe/malformed SVG sources are rejected, rather than echoed or unexpectedly loaded',()=>{
  const wrap=s=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'+s+'</svg>');
  for(const source of [
    wrap('<script>alert(1)</script>'),
    wrap('<foreignObject><iframe/></foreignObject>'),
    wrap('<image href="https://example.com/track.png"/>'),
    wrap('<rect width="10" height="10" onload="alert(1)"/>'),
    wrap('<text>Not safe as outlined geometry</text>'),
    wrap('<filter id="blur"><feGaussianBlur stdDeviation="10"/></filter>'),
    wrap('<style>path{fill:url(https://example.com)}</style>'),
    wrap('<rect width="20" height="20" style="fill:red"/>'),
    Buffer.from('<!DOCTYPE svg [<!ENTITY ext SYSTEM "file:///etc/passwd">]><svg width="10" height="10">&ext;</svg>'),
    Buffer.from('<svg width="10" height="10"><g></svg>')
  ]) assert.throws(()=>Probe.inspect(source,{DOMParserCtor:DOMParser}),/svg:/);
});
test('invalid dimensions, malformed headers and file budgets are enforced before decode',()=>{
  const png=fixture().toBufferSync('png');
  const invalid=Buffer.from(png);invalid.writeUInt32BE(90000,16);
  assert.throws(()=>Probe.inspect(invalid),/dimensions/);
  assert.throws(()=>Probe.inspect(Buffer.alloc(Probe.MAX_BYTES+1)),/16 MiB/);
  assert.throws(()=>Probe.inspect(Buffer.from('GIF89a')),/expected nonempty|unsupported/);
  assert.throws(()=>Probe.inspect(Buffer.from('GIF89a\0\0\0\0\0\0')),/unsupported/);
  assert.throws(()=>Probe.inspect(png.subarray(0,33)),/PNG missing IEND/);
  assert.throws(()=>Probe.inspect(Buffer.from('not an image\x00')),/unsupported/);
});
test('browser-global metadata and orientation contract match Node and platform decoding is injectable',async()=>{
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
  const scope=vm.createContext({Uint8Array,Uint8ClampedArray,TextDecoder,TextEncoder,ArrayBuffer});
  for(const name of ['svg','probe','asset']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/import/'+name+'.js'),'utf8'),scope);
  const data=fixture().toBufferSync('png');
  const nodeMeta=Probe.inspect(data),browserMeta=scope.StipraImportProbe.inspect(data);
  assert.equal(JSON.stringify(browserMeta),JSON.stringify(nodeMeta));
  const result=await Shared.ingest(data,{
    decode:async()=>fixture(),canvas:(w,h)=>{
      const c=makeCanvas(w,h);return c;
    }
  },{sourceName:'mock.png'});
  assert.equal(result.metadata.sourceName,'mock.png');
  assert.equal(result.rgba.length,48);
});
