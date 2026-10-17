'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const Probe=require('../src/import/probe'),Shared=require('../src/import/asset'),{ingestLocalBytes}=require('../src/import/node');
const cases=require('./fixtures/png-boundaries.json');
test('16-bit PNG precision is declared separately from normalized working pixels',async()=>{
  const bytes=Buffer.from(cases.sdr16,'base64'),before=Buffer.from(bytes),probe=Probe.inspect(bytes),asset=await ingestLocalBytes(bytes,'precision.png');
  assert.equal(probe.sourceEncoding.bitDepth,16);assert.equal(asset.metadata.sourceEncoding.bitDepth,16);assert.equal(asset.metadata.pixels.bitDepth,8);
  assert.ok(asset.metadata.warnings.some(s=>s.includes('16-bit')));assert.equal(asset.rgba.length,8);assert.deepEqual(bytes,before);
});
test('unvalidated PNG interpretations are rejected before native decoding',async()=>{
  for(const [name,pattern] of [['apng',/animated PNG/],['pq',/cICP color signal/],['hlg',/cICP color signal/],['displayP3',/cICP color signal/],['mastering',/mastering/],['lightLevel',/light-level/],['rotatedExif',/EXIF orientation/],['invalidDepth',/bit depth/],['combinedSignals',/combined PNG/]]){
    let calls=0;const bytes=Buffer.from(cases[name],'base64'),before=Buffer.from(bytes);
    assert.throws(()=>Probe.inspect(bytes),pattern,name);
    await assert.rejects(Shared.ingest(bytes,{canvas(){throw Error('unexpected canvas');},decode(){calls++;throw Error('unexpected decode');}}),pattern,name);
    assert.equal(calls,0);assert.deepEqual(bytes,before);
  }
});
test('explicit full-range sRGB cICP is retained and identity EXIF needs no rewrite',async()=>{
  const a=await ingestLocalBytes(Buffer.from(cases.srgb,'base64'));
  assert.deepEqual(a.metadata.sourceEncoding.cicp,[1,13,0,1]);assert.equal(a.metadata.pixels.colorSpace,'srgb');
  const bytes=Buffer.from(cases.identityExif,'base64'),info=Probe.inspect(bytes);
  assert.equal(info.sourceEncoding.exifOrientation,1);assert.deepEqual(Probe.orientationNeutralBytes(bytes,info),new Uint8Array(bytes));
});
test('boundary fixtures have valid PNG CRCs and a real compressed scanline',()=>{
  const crc=require('jszip/lib/crc32');
  for(const value of Object.values(cases)){
    const bytes=Buffer.from(value,'base64');const data=[];
    for(let at=8;at<bytes.length;){const length=bytes.readUInt32BE(at);assert.equal(crc(bytes.subarray(at+4,at+8+length))>>>0,bytes.readUInt32BE(at+8+length));if(bytes.toString('ascii',at+4,at+8)==='IDAT')data.push(bytes.subarray(at+8,at+8+length));at+=12+length;}
    assert.ok(zlib.inflateSync(Buffer.concat(data)).length>0);
  }
});
