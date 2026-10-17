'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),fontkit=require('@pdf-lib/fontkit');
const {PDFDocument}=require('pdf-lib');
const {DEST,FONTS,gitBlobHash}=require('../scripts/cache-paper-mono.js');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT=path.join(ROOT,'dist/stipra/typography');
test('genuine paper mono font sources, real lowercase macron and pinned OFL release',t=>{
  const fontpath=path.join(DEST,FONTS.extraBold.name);
  if(!fs.existsSync(fontpath)){t.skip('Paper Mono cache not prepared; run npm run prepare:paper-mono');return;}
  for(const font of Object.values(FONTS)){
    const bytes=fs.readFileSync(path.join(DEST,font.name));
    assert.equal(gitBlobHash(bytes),font.blob);
    const face=fontkit.create(bytes);
    assert.ok(face.glyphForCodePoint(0x101)?.id,'missing lower-case ā');
    assert.ok(face.layout('stiprā').glyphs.every(g=>g.id!==0));
  }
});
test('both real typography families produce vector wordmarks and matched a4 reports',async t=>{
  if(!fs.existsSync(path.join(OUTPUT,'paper-mono-print-study.pdf'))){
    t.skip('Type proofs not built; run npm run build:pages with verified font cache');return;
  }
  const docs=[];
  for(const id of ['ibm-plex','paper-mono']){
    const plain=fs.readFileSync(path.join(OUTPUT,id+'-plain.svg'),'utf8');
    const ink=fs.readFileSync(path.join(OUTPUT,id+'-two-ink.svg'),'utf8');
    assert.match(plain,/<svg[^>]+width="1200" height="420"/);
    assert.match(plain,/<path /);
    assert.doesNotMatch(plain,/<text|<image|data:font|@font-face/i);
    assert.match(ink,/#e7604c/);
    assert.notEqual(plain,ink);
    docs.push(await PDFDocument.load(fs.readFileSync(path.join(OUTPUT,id+'-print-study.pdf'))));
  }
  assert.equal(docs[0].getPageCount(),docs[1].getPageCount());
  const dims=docs.map(pdf=>[pdf.getPage(0).getWidth(),pdf.getPage(0).getHeight()]);
  assert.deepEqual(dims[0],dims[1]);
  assert.ok(Math.abs(dims[0][0]-841.89)<.1);
  assert.ok(Math.abs(dims[0][1]-595.28)<.1);
  const html=fs.readFileSync(path.join(OUTPUT,'index.html'),'utf8');
  assert.match(html,/stiprā/);
  assert.match(html,/paper mono/);
  assert.match(html,/ibm plex/);
  assert.match(html,/paper-mono-print-study.pdf/);
  assert.match(html,/ibm-plex-print-study.pdf/);
  assert.doesNotMatch(html,/rounded|image generation|uppercase/i);
});
