'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const cp=require('node:child_process'),JSZip=require('jszip'),{PDFDocument}=require('pdf-lib');
const {Canvas,loadImage}=require('skia-canvas');
const Print=require('../src/print-package.js');
const {ingestLocalBytes}=require('../src/import/node.js');
const Probe=require('../src/import/probe.js');
const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixture=require('./fixtures/owner-photo-fixtures.json');
function sample(w=96,h=64){
  const canvas=new Canvas(w,h),ctx=canvas.getContext('2d');
  ctx.fillStyle='#f1eadc';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#456888';ctx.fillRect(0,0,Math.floor(w/2),h);
  ctx.fillStyle='#1b263e';ctx.fillRect(Math.floor(w/4),Math.floor(h/4),Math.floor(w/3),Math.floor(h/3));
  return canvas.toBufferSync('png');
}
function recipe(id){return JSON.parse(fs.readFileSync(path.join(root,'examples/recipes/owner-'+id+'-'+({A:'sculpture',B:'forest',C:'beach'}[id])+'-inks.json'),'utf8'));}
function screen(id){return JSON.parse(fs.readFileSync(path.join(root,'examples/recipes/owner-'+id+'-'+({A:'sculpture',B:'forest',C:'beach'}[id])+'-screens.json'),'utf8'));}
async function prepare(bytes,ink,screenRecipe,opts={}){
  const asset=await ingestLocalBytes(bytes,'synthetic-test.png');
  return Print.generate({originalBytes:bytes,asset,inkRecipe:ink,screenRecipe,dpi:300,...opts});
}
test('Stiprā print intent never mistakes a report for a native pixel master',()=>{
  assert.deepEqual(Print.printIntent(805,644,300,0).trimPixels,{x:0,y:0,width:805,height:644});
  assert.equal(Print.printIntent(805,644,300,0).trimMm.width,68.1567);
  assert.equal(Print.printIntent(805,644,300,0).trimMm.height,54.5253);
  assert.throws(()=>Print.validate(0,0),/DPI/);
  assert.throws(()=>Print.validate(Infinity,0),/DPI/);
  assert.throws(()=>Print.validate(300,-1),/marks/);
  assert.throws(()=>Print.validate(300,20),/marks/);
});
test('2-ink ZIP contains original bytes, two unique aligned grayscale masters, report and hashed files',async()=>{
  const bytes=sample(),out=await prepare(bytes,recipe('A'),screen('A'));
  assert.equal(out.manifest.inkCount,undefined,'ink count is in ink array');
  assert.equal(out.manifest.inks.length,2);
  const zip=await JSZip.loadAsync(out.zip),names=Object.keys(zip.files).sort();
  assert.equal(names.length,out.manifest.files.length+1);
  for(const item of out.manifest.files){
    const body=await zip.file(item.path).async('nodebuffer');
    assert.equal(hash(body),item.sha256,'SHA mismatch '+item.path);
    assert.equal(body.length,item.bytes);
  }
  assert.deepEqual(await zip.file('source/original.png').async('nodebuffer'),bytes);
  assert.ok(zip.file('recipe/screens.json'));assert.ok(zip.file('recipe/proof-screens.json'));
  const files=out.manifest.inks.flatMap(ink=>[ink.plate,ink.screened]);
  for(const name of files){
    const meta=Probe.inspect(await zip.file(name).async('nodebuffer'));
    assert.equal(meta.width,96);assert.equal(meta.height,64);
    const physical=await zip.file(name).async('nodebuffer');
    assert.equal(physical.toString('ascii',37,41),'pHYs','masters embed actual physical DPI');
    assert.equal(physical.readUInt32BE(41),Math.round(300*1000/25.4));
  }
  assert.notDeepEqual(await zip.file(files[0]).async('nodebuffer'),await zip.file(files[2]).async('nodebuffer'));
  const pdf=await PDFDocument.load(await zip.file('report/separation-sheet.pdf').async('nodebuffer'));
  assert.equal(pdf.getPageCount(),1);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-841.89)<.02);
  assert.ok(Math.abs(pdf.getPage(0).getHeight()-595.28)<.02);
  const html=(await zip.file('report/separation-sheet.html').async('string'));
  for(const ink of out.manifest.inks)assert.ok(html.includes(ink.name));
  assert.match(html,/Digital approximation/);
  assert.ok(html.includes('Paper / substrate'));
});
test('3-ink landscape and 2-ink portrait synthetic fixtures preserve native aspect and paper exclusion',async()=>{
  const inputs=[[ 'B',150,75,3 ],['C',70,130,2]];
  for(const [id,w,h,count] of inputs){
    const bytes=sample(w,h),result=await prepare(bytes,recipe(id),screen(id));
    assert.deepEqual(result.manifest.output.sourcePixels,{width:w,height:h});
    assert.equal(result.manifest.output.resampled,false);
    assert.equal(result.manifest.inks.length,count);
    assert.ok(result.manifest.inks.every(i=>i.registration.x===0&&i.registration.rotate===0));
    assert.equal(result.manifest.report.orientation,h>w?'portrait':'landscape');
    assert.equal(result.manifest.report.widthMm,h>w?210:297);
    assert.equal(result.manifest.report.heightMm,h>w?297:210);
    const zip=await JSZip.loadAsync(result.zip);
    for(const ink of result.manifest.inks){
      const p=Probe.inspect(await zip.file(ink.screened).async('nodebuffer'));
      assert.deepEqual([p.width,p.height],[w,h]);
    }
    assert.equal(result.manifest.inks.some(x=>x.id==='paper'),false);
  }
});
test('proof-only registration never bakes shifts into production screen masters',async()=>{
  const bytes=sample(),base=screen('A'),shifted=JSON.parse(JSON.stringify(base));
  shifted.default.registration={x:4,y:-2,rotate:0};
  const a=await prepare(bytes,recipe('A'),base),b=await prepare(bytes,recipe('A'),shifted);
  const za=await JSZip.loadAsync(a.zip),zb=await JSZip.loadAsync(b.zip);
  for(const ink of a.manifest.inks){
    assert.deepEqual(await za.file(ink.screened).async('nodebuffer'),await zb.file(ink.screened).async('nodebuffer'));
    assert.deepEqual(await za.file(ink.plate).async('nodebuffer'),await zb.file(ink.plate).async('nodebuffer'));
  }
  assert.notDeepEqual(await za.file('proof/composite.png').async('nodebuffer'),
    await zb.file('proof/composite.png').async('nodebuffer'));
  assert.equal(b.manifest.screen.proofOnlyRegistration,true);
});
test('optional registration marks are outside full-frame art and metadata declares enlarged sheet',async()=>{
  const bytes=sample(96,64),a=await prepare(bytes,recipe('A'),screen('A'),{marksMm:5});
  const z=await JSZip.loadAsync(a.zip),ink=a.manifest.inks[0],plain=Probe.inspect(await z.file(ink.plate).async('nodebuffer'));
  const marked=Probe.inspect(await z.file(ink.marked).async('nodebuffer'));
  const pad=Math.round(5*300/25.4);
  assert.deepEqual([plain.width,plain.height],[96,64]);
  assert.deepEqual([marked.width,marked.height],[96+2*pad,64+2*pad]);
  assert.equal(a.manifest.output.trimPixels.x,0);
  assert.equal(a.manifest.output.marksMm,5);
});
test('owner fixture recipes match 2/3/2 planned inks without bundling owner JPEGs',()=>{
  for(const f of fixture.fixtures){
    const i=recipe(f.id),s=screen(f.id);
    assert.equal(i.inks.length,f.plannedInks);
    assert.equal(s.version,1);
    assert.equal(fs.existsSync(path.join(root,'tests/fixtures',f.originalFile)),false);
  }
});
test('CLI export writes one non-overwriting complete ZIP and refuses mismatched owner fingerprint',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-package-'));
  try{
    const input=path.join(tmp,'picture.png'),output=path.join(tmp,'picture.zip');
    fs.writeFileSync(input,sample());
    const main=path.join(root,'bin/stipra.js'),args=['package','--input',input,
      '--config',path.join(root,'examples/recipes/owner-A-sculpture-inks.json'),
      '--screen',path.join(root,'examples/recipes/owner-A-sculpture-screens.json'),
      '--dpi','300','--out',output];
    const info=JSON.parse(cp.execFileSync(process.execPath,[main,...args],{encoding:'utf8'}));
    assert.equal(info.status,'DIGITAL_PACKAGE_GENERATED_NOT_PHYSICALLY_VALIDATED');
    assert.equal(info.inkCount,2);
    assert.ok(fs.statSync(output).size>3000);
    assert.throws(()=>cp.execFileSync(process.execPath,[main,...args],{stdio:'pipe'}),/Command failed/);
    assert.throws(()=>cp.execFileSync(process.execPath,[main,...args.slice(0,-2),
      '--expected-sha256','0'.repeat(64),'--out',path.join(tmp,'bad.zip')],{stdio:'pipe'}),/Command failed/);
    assert.equal(fs.existsSync(path.join(tmp,'bad.zip')),false);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('report style: portrait and landscape A4, exact recipe attachments, no rounded cards',async()=>{
  const configs=[['A',140,90,'landscape',841.89,595.28],['C',90,160,'portrait',595.28,841.89]];
  for(const [id,w,h,expected,pw,ph] of configs){
    const result=await prepare(sample(w,h),recipe(id),screen(id));
    const archive=await JSZip.loadAsync(result.zip);
    const pdfBytes=await archive.file('report/separation-sheet.pdf').async('nodebuffer');
    const pdf=await PDFDocument.load(pdfBytes);
    assert.equal(result.manifest.report.orientation,expected);
    assert.ok(Math.abs(pdf.getPage(0).getWidth()-pw)<.03);
    assert.ok(Math.abs(pdf.getPage(0).getHeight()-ph)<.03);
    assert.equal(result.manifest.report.embeddedRecipes,true);
    assert.equal(result.manifest.report.qrDestination,
      'https://github.com/yigit-denktas/stipra/blob/main/docs/PRINT-PACKAGE-v1.md');
    assert.match(pdfBytes.toString('latin1'),/EmbeddedFiles/);
    for(const name of ['inks.json','screens.json','proof-screens.json','replay.json'])
      assert.ok(pdfBytes.includes(Buffer.from(name)),'missing attached settings '+name);
    const html=await archive.file('report/separation-sheet.html').async('string');
    assert.ok(html.includes('IBM')===false || html.includes('Plex'));
    assert.doesNotMatch(html,/border-radius/);
    assert.match(html,new RegExp('size:A4 '+expected));
    assert.equal(result.manifest.paperSelection.id!==undefined,true);
  }
});
test('paper suggestions change report substrate but never production ink geometry or original bytes',async()=>{
  const data=sample(),i=recipe('A'),screens=screen('A');
  const warm=await prepare(data,i,screens,{paper:'linen'});
  const cold=await prepare(data,i,screens,{paper:'chalk'});
  const wp=await JSZip.loadAsync(warm.zip),cp=await JSZip.loadAsync(cold.zip);
  assert.equal(warm.manifest.paperSelection.id,'linen');
  assert.equal(cold.manifest.paperSelection.id,'chalk');
  assert.notDeepEqual(await wp.file('proof/paper.png').async('nodebuffer'),
    await cp.file('proof/paper.png').async('nodebuffer'));
  assert.deepEqual(await wp.file('source/original.png').async('nodebuffer'),data);
  for(let k=0;k<warm.manifest.inks.length;k++){
    const wi=warm.manifest.inks[k],ci=cold.manifest.inks[k];
    assert.deepEqual(await wp.file(wi.plate).async('nodebuffer'),await cp.file(ci.plate).async('nodebuffer'));
    assert.deepEqual(await wp.file(wi.screened).async('nodebuffer'),await cp.file(ci.screened).async('nodebuffer'));
  }
});
test('paper source heuristic is deterministic, documented and has explicit overrides',()=>{
  const Paper=require('../src/report-paper.js'),px=new Uint8ClampedArray([30,100,220,255,30,70,240,255]);
  assert.deepEqual(Paper.select(px,'#ffffff','auto'),Paper.select(px,'#ffffff','auto'));
  assert.equal(Paper.select(px,'#abcdef','recipe').hex,'#abcdef');
  assert.equal(Paper.select(px,'#ffffff','rag').id,'rag');
  assert.throws(()=>Paper.select(px,'#ffffff','random'),/paper/);
});
