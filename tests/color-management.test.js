'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./fixtures/color-reference.json');
const Probe=require('../src/import/probe'),{ingestLocalBytes}=require('../src/import/node');
const bytes=name=>Buffer.from(fixture.files[name],'base64');
const pixel=(image,x,y)=>Array.from(image.rgba.slice((y*image.metadata.oriented.width+x)*4,(y*image.metadata.oriented.width+x)*4+3));
for(const [input,reference] of [['linear','reference'],['linear-jpeg','jpeg-reference']]){
  test(input+' embedded non-sRGB profile matches independent LittleCMS reference',async()=>{
    const a=await ingestLocalBytes(bytes(input)),b=await ingestLocalBytes(bytes(reference)),raw=await ingestLocalBytes(bytes('untagged'));
    assert.equal(a.metadata.profile.kind,'embedded-icc');
    assert.equal(a.metadata.colorManagement.policy,'stipra-srgb-v1');
    assert.equal(a.metadata.colorManagement.pressCalibrated,false);
    for(const [x,y] of fixture.sampleCoordinates){
      const actual=pixel(a,x,y),expected=pixel(b,x,y);
      actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<=fixture.tolerance8bit,`${input} at ${x},${y}: ${actual} vs ${expected}`));
    }
    assert.ok(pixel(a,8,8)[0]-pixel(raw,8,8)[0]>50,'fixture must detect an ignored profile, not merely tagged sRGB');
  });
}
test('JPEG ICC metadata and segment completeness are checked before decode',()=>{
  const source=bytes('linear-jpeg'),before=Buffer.from(source),info=Probe.inspect(source);
  assert.equal(info.profile.colorSpace,'RGB');assert.ok(info.profile.description);
  assert.ok(info.profile.byteLength>=132);assert.deepEqual(source,before);
  const signature=source.indexOf(Buffer.from('ICC_PROFILE\0'));
  const missing=Buffer.from(source);missing[signature+13]=2;
  assert.throws(()=>Probe.inspect(missing),/incomplete JPEG ICC/);
  const invalid=Buffer.from(source);invalid.fill(0,signature+14+36,signature+14+40);
  assert.throws(()=>Probe.inspect(invalid),/invalid embedded ICC/);
});
test('source bytes, profile metadata and normalization policy survive the exported package',async()=>{
  const Package=require('../src/print-package'),Styles=require('../src/styles'),JSZip=require('jszip');
  const original=bytes('linear-jpeg'),asset=await ingestLocalBytes(original,'synthetic-linear.jpg');
  const style=Styles.resolve('editorial-halftone',{dpi:300});
  const result=await Package.generate({originalBytes:original,asset,inkRecipe:style.inkRecipe,screenRecipe:style.screenRecipe,paper:'recipe'});
  const zip=await JSZip.loadAsync(result.zip);
  assert.deepEqual(await zip.file('source/original.jpg').async('nodebuffer'),original);
  const manifest=JSON.parse(await zip.file('manifest.json').async('string'));
  assert.deepEqual(manifest.source.profile,asset.metadata.profile);
  assert.deepEqual(manifest.source.colorManagement,asset.metadata.colorManagement);
  const fontNotice=await zip.file(manifest.report.fontLicense).async('string');
  assert.match(fontNotice,/SIL OPEN FONT LICENSE/i);
  for(const family of ['sans','mono'])assert.ok(fontNotice.includes(require('node:fs').readFileSync(require.resolve('@fontsource/ibm-plex-'+family+'/LICENSE'),'utf8')));
  const normalized=await ingestLocalBytes(await zip.file('source/normalized.png').async('nodebuffer'));
  for(const [x,y] of fixture.sampleCoordinates)assert.deepEqual(pixel(normalized,x,y),pixel(asset,x,y));
});
