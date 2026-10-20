'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {PDFDocument,PDFName,PDFArray,PDFRawStream,decodePDFRawStream}=require('pdf-lib');
const {Canvas}=require('skia-canvas');
const crypto=require('node:crypto');
const Report=require('../src/report-layout.js');
function sample(w,h,color='#444444'){const c=new Canvas(w,h),x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,w,h);return c.toBufferSync('png');}
function attachments(pdf){
  const names=pdf.catalog.lookup(PDFName.of('Names')).lookup(PDFName.of('EmbeddedFiles')).lookup(PDFName.of('Names'),PDFArray),out={};
  for(let i=0;i<names.size();i+=2){
    const name=names.get(i).decodeText(),spec=pdf.context.lookup(names.get(i+1));
    const raw=spec.lookup(PDFName.of('EF')).lookup(PDFName.of('F'),PDFRawStream);
    out[name]=JSON.parse(Buffer.from(decodePDFRawStream(raw).decode()).toString());
  }
  return out;
}
function setup(count,portrait=false){
  const bytes=sample(portrait?50:100,portrait?100:50);
  const settings=Array.from({length:count},(_,i)=>({name:i===count-1?'last ink with a deliberately long descriptive name for wrapping':'ink '+i,color:'#006043',source:'darkness',coverage:.35,mode:i?'dots':'solid',pitch:6,angle:22}));
  const cards=[{name:'Original',bytes},{name:'Proof',bytes},{name:'Paper / substrate',bytes:sample(portrait?50:100,portrait?100:50,'#f5eee2'),note:'not a physical ink'},...settings.map(s=>({name:s.name,ink:s.color,bytes}))];
  const info={width:portrait?50:100,height:portrait?100:50,dpi:300,trim:{width:50,height:100},orientation:portrait?'portrait':'landscape',paper:{name:'warm rag',hex:'#f5eee2'},seed:42,name:'a long owner photograph source filename to retain in the reproduction metadata.png',sha:'abcdef0123456789'.repeat(4),settings,inkRecipe:{version:1,inks:settings.map((s,i)=>({id:'ink'+i,gain:.5,gamma:1}))},screenRecipe:{version:1,seed:42},proofRecipe:{version:1,seed:42}};
  return {cards,info};
}
test('real 2/3/4/8-ink PDFs paginate every plate and setting with readable font sizes and bounded geometry',async()=>{
  for(const count of [2,3,4,8])for(const portrait of [false,true]){
    const {cards,info}=setup(count,portrait),pdf=await PDFDocument.load(await Report.pdfReport(cards,info));
    const embedded=attachments(pdf),audit=embedded['report-layout.json'];
    assert.equal(audit.pages.length,pdf.getPageCount());
    const text=audit.pages.flatMap(p=>p.text),values=text.map(t=>t.text).join('\n');
    assert.ok(text.every(t=>t.size>=9));
    assert.ok(values.includes(info.sha));
    assert.match(values,/50.0 LPI/);assert.match(values,/solid \/ screen off/);
    for(let i=0;i<count;i++)assert.ok(values.includes(String(i+1).padStart(2,'0')+' / '));
    const images=audit.pages.flatMap(p=>p.images);
    assert.equal(images.length,count+3);
    assert.deepEqual(images.map(im=>[im.name,im.note,im.ink]),cards.map(c=>[c.name,c.note||'',c.ink||null]));
    for(const c of cards)assert.ok(values.replace(/\s+/g,' ').includes(c.name),'PDF caption missing: '+c.name);
    assert.equal(audit.layoutVersion,Report.LAYOUT_VERSION);
    for(const im of images){
      assert.ok(Math.abs(im.width/im.height-im.sourceWidth/im.sourceHeight)<1e-9);
      assert.ok(im.y>=76-1e-5&&im.x>=34-1e-5);
    }
    const content=pdf.getPages().map(page=>{
      const raw=page.node.lookup(PDFName.of('Contents'));
      const streams=raw instanceof PDFArray?raw.asArray().map(v=>pdf.context.lookup(v)):[raw];
      return streams.map(s=>Buffer.from(decodePDFRawStream(s).decode()).toString()).join('\n');
    }).join('\n');
    const actualSizes=[...content.matchAll(/\/(?:\S+)\s+([\d.]+)\s+Tf/g)].map(x=>Number(x[1]));
    assert.ok(actualSizes.length>20);assert.ok(actualSizes.every(n=>n>=9));
    assert.equal(embedded['replay.json'].sourceSHA256,info.sha);
    assert.ok(pdf.getPages().some(p=>p.node.has(PDFName.of('Annots'))));
  }
});
test('repeated report builds are byte-stable and do not alter supplied artwork or metadata',async()=>{
  const {cards,info}=setup(3),before=JSON.stringify(info),hashes=cards.map(c=>crypto.createHash('sha256').update(c.bytes).digest('hex'));
  const a=await Report.pdfReport(cards,info),b=await Report.pdfReport(cards,info);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(info),before);
  assert.deepEqual(cards.map(c=>crypto.createHash('sha256').update(c.bytes).digest('hex')),hashes);
});
test('screen labels expose physical LPI for dots and mark unscreened passes off',()=>{
  assert.equal(Report.screenDescription({mode:'dots',pitch:6,angle:22},300),'dots / 50.0 LPI / 6 px / 22°');
  assert.equal(Report.screenDescription({mode:'solid',pitch:6,angle:22},300),'solid / screen off');
  const {cards,info}=setup(2),html=Report.htmlReport(cards,info).toString();
  assert.match(html,/50.0 LPI/);assert.match(html,/screen off/);
});

test('default embedded Plex fonts contain actual outlined lowercase macron glyphs',()=>{
  const fontkit=require('fontkit');
  for(const [family,weight] of [['ibm-plex-sans',400],['ibm-plex-sans',700],['ibm-plex-mono',400]]){
    const font=fontkit.create(Report.truetype(family,weight)),glyph=font.glyphForCodePoint(0x101);
    assert.ok(glyph.id>0);assert.ok(glyph.path.commands.length>0);
    assert.ok(font.layout('stiprā').glyphs.every(g=>g.id>0));
  }
});
test('experimental forest key uses two genuine brand inks and retains tonal ordering',()=>{
  const Sep=require('../src/separation.js'),recipe=require('../examples/recipes/forest-key-two-ink.json');
  const image={width:3,height:1,rgba:new Uint8Array([255,255,255,255,128,128,128,255,0,0,0,255])};
  const r=Sep.separate(image,recipe);
  assert.equal(r.masks.length,2);
  assert.deepEqual(r.masks.map(m=>m.color),['#006043','#e2a523']);
  assert.equal(r.masks[0].coverage[0],0);
  assert.ok(r.masks[0].coverage[1]>0&&r.masks[0].coverage[1]<r.masks[0].coverage[2]);
  assert.equal(r.masks[0].coverage[2],255);
});

test('HTML and PDF retain identical inspection image identities, order and complete captions',async()=>{
  for(const portrait of [false,true]){
    const {cards,info}=setup(3,portrait);
    cards[3].name='A deliberately extended ink caption that must wrap completely without losing its final words';
    cards[3].note='35.0% coverage; dots 6px @ 22deg';
    const html=Report.htmlReport(cards,info).toString();
    const pdf=await PDFDocument.load(await Report.pdfReport(cards,info)),audit=attachments(pdf)['report-layout.json'];
    const hashes=cards.map(c=>crypto.createHash('sha256').update(c.bytes).digest('hex'));
    assert.deepEqual([...html.matchAll(/<figure data-sha256="([a-f0-9]{64})"/g)].map(m=>m[1]),hashes);
    assert.deepEqual(audit.pages.flatMap(p=>p.images).map(im=>im.sha256),hashes);
    const texts=audit.pages.flatMap(p=>p.text).map(t=>t.text).join(' ').replace(/\s+/g,' ');
    for(const card of cards){
      assert.ok(html.includes(card.name));assert.ok(texts.includes(card.name));
      if(card.note){assert.ok(html.includes(card.note));assert.ok(texts.includes(card.note));}
    }
    for(const p of pdf.getPages()){
      const [w,h]=Report.A4[info.orientation];assert.equal(p.getWidth(),w);assert.equal(p.getHeight(),h);
    }
    // Card-caption text stays above the footer/QR band, even with a long caption.
    for(const p of audit.pages)for(const im of p.images){
      const caption=p.text.filter(t=>t.x>=im.x-1&&t.y<im.y&&t.y>57);
      assert.ok(caption.every(t=>t.y>=94));
    }
  }
});
test('ratio-aware A4 contract uses portrait only beyond the existing 1.08 height ratio',()=>{
  for(const [w,h,expected] of [[805,644,'landscape'],[2048,1365,'landscape'],[1152,2048,'portrait'],[100,100,'landscape'],[100,108,'landscape'],[100,109,'portrait']])
    assert.equal(Report.orientation(w,h),expected);
});

test('compact four-ink inspection keeps substrate and every caption on two pages',async()=>{
  for(const portrait of [false,true]){
    const {cards,info}=setup(4,portrait);
    info.settings[3].name='Black';cards[6].name='Black';
    for(const c of cards.filter(c=>c.ink))c.note='35.0% coverage; dots 6px @ 22deg';
    const pdf=await PDFDocument.load(await Report.pdfReport(cards,info));
    assert.equal(pdf.getPageCount(),2,'do not orphan plates or diagnostics onto an extra page');
    const audit=attachments(pdf)['report-layout.json'];
    assert.equal(audit.pages[0].images.length,7);
    assert.ok(audit.pages[0].images.some(im=>im.name==='Paper / substrate'));
    assert.ok(audit.pages[0].text.some(t=>t.text==='Black'));
  }
});
