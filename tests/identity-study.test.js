'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Brand=require('../scripts/build-identity-study.js');
const {DEST,FONTS,gitBlobHash}=require('../scripts/cache-paper-mono.js');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'dist/stipra/identity');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('identity chooses 3 authentic complete typefaces and canonical owner swatches',()=>{
  assert.deepEqual(Brand.CANDIDATES.map(x=>x.id),
    ['ibm-plex-sans-bold','paper-mono-regular','paper-mono-semibold']);
  assert.deepEqual(Brand.palette(),{
    green:'#006043',coral:'#ff665d',blue:'#0d4dad',yellow:'#e2a523'});
  assert.ok(fs.readFileSync(path.join(ROOT,'README.md'),'utf8').includes('src="logo_for_Readme.svg"'));
});
test('generated identities have real outlines, single macron ink and bit-exact owner dotmark',t=>{
  if(!fs.existsSync(DIR)){t.skip('run npm run build:pages');return;}
  assert.deepEqual(fs.readFileSync(path.join(DIR,'dotmark.svg')),fs.readFileSync(path.join(ROOT,'logo_for_Readme.svg')));
  const page=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
  for(const item of Brand.CANDIDATES){
    assert.match(page,new RegExp(item.id));
    for(const mode of ['black','macron']){
      const svg=fs.readFileSync(path.join(DIR,item.id+'-'+mode+'.svg'),'utf8');
      assert.match(svg,/stiprā/);
      assert.match(svg,/<path\b/);
      assert.doesNotMatch(svg,/<text\b|<image\b|data:font|@font-face/);
      if(mode==='macron'){
        assert.match(svg,/clipPathUnits="userSpaceOnUse"/);
        assert.match(svg,/clip-path="url\(#macron-5\)"/);
        assert.match(svg,/#006043/);
        assert.match(svg,/#ff665d/);
        assert.doesNotMatch(svg,/fill="#0d4dad"|fill="#e2a523"/);
      }else{
        assert.match(svg,/#242923/);
        assert.doesNotMatch(svg,/#ff665d/);
      }
    }
  }
  const names=fs.readdirSync(DIR);
  assert.equal(names.filter(x=>x.endsWith('.svg')).length,7);
  assert.equal(names.filter(x=>/\.ttf|\.woff|\.otf/i.test(x)).length,0);
  assert.ok(page.includes('24 px')&&page.includes('48 px')&&page.includes('96 px'));
});
test('authentic OFL intermediate Paper Mono SemiBold exists, pinned by source SHA',t=>{
  const p=path.join(DEST,FONTS.semiBold.name);
  if(!fs.existsSync(p)){t.skip('font cache not built');return;}
  assert.equal(gitBlobHash(fs.readFileSync(p)),FONTS.semiBold.blob);
});
test('identity build does not create image-generation assets or replace original mark',()=>{
  const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
  const original=fs.readFileSync(path.join(ROOT,'logo_for_Readme.svg'));
  assert.equal(hash(original),'398df06f1d56e0bde1534b73848e44fb7f428f2207b999266407fc5c22d4e36f8');
  assert.ok(readme.includes('logo_for_Readme.svg'));
});
