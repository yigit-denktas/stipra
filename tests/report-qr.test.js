'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const QR=require('../src/report-qr.js'),{stage}=require('../scripts/build-github-pages.js'),{build}=require('../scripts/build-pages.js');
test('branded QR uses actual palette, shaped macron, deterministic output and protected structural modules',async()=>{
  assert.equal(QR.GUIDE,'https://apps.yigitdenktas.com/stipra/guide/');
  for(const style of QR.STYLES){
    const a=QR.svg({style,ink:'#0d4dad'});assert.equal(a,QR.svg({style,ink:'#0d4dad'}));
    assert.match(a,/qr-macron/);assert.match(a,/#ff665d/);assert.match(a,/<path/);assert.doesNotMatch(a,/<text|https?:\/\/(?!www.w3.org)/);
    assert.deepEqual(await QR.png({style}),await QR.png({style}));
  }
  assert.match(QR.svg({style:'ink-dots',ink:'#ffffaa'}),/fill="#006043"/);
  assert.throws(()=>QR.svg({style:'fake'}),/unknown QR/);assert.throws(()=>QR.svg({url:'https://example.com'}),/destination/);
});
test('GitHub mirror stages the same guide/app/assets at project root with no doubled stipra path or private source',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-dual-pages-'));
  try{
    const cloud=path.join(tmp,'cloud'),github=path.join(tmp,'github');build(cloud);stage(path.join(cloud,'stipra'),github);
    assert.equal(fs.existsSync(path.join(github,'stipra')),false);
    for(const n of ['index.html','guide/index.html','assets/app.js','assets/plex-bold.ttf'])assert.deepEqual(fs.readFileSync(path.join(cloud,'stipra',n)),fs.readFileSync(path.join(github,n)));
    assert.ok(fs.existsSync(path.join(github,'.nojekyll')));assert.equal(fs.existsSync(path.join(github,'source')),false);
    const guide=fs.readFileSync(path.join(github,'guide/index.html'),'utf8');
    assert.match(guide,/href="\.\.\/"/);assert.match(guide,/expected-sha256/);assert.match(guide,/--paper recipe/);assert.match(guide,/not full-size printing masters/);
    assert.match(fs.readFileSync(path.join(github,'index.html'),'utf8'),/connect-src 'none'/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
