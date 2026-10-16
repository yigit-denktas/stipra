'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const spec=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/owner-photo-fixtures.json'),'utf8'));
const doc=fs.readFileSync(path.join(ROOT,'docs/PRINT-PACKAGE-ACCEPTANCE.md'),'utf8');

test('owner acceptance fixture catalog is metadata-only, untested and 3 distinct owner photos',()=>{
  assert.equal(spec.schema,'stipra-owner-fixture-metadata-v1');
  assert.equal(spec.status,'SPECIFICATION_ONLY_NOT_EVALUATED');
  assert.equal(spec.fixtures.length,3);
  assert.deepEqual(spec.fixtures.map(f=>f.id),['A','B','C']);
  assert.deepEqual(spec.fixtures.map(f=>f.plannedInks),[2,3,2]);
  assert.match(spec.rights,/No distribution license confirmed/i);
  for(const f of spec.fixtures){
    assert.match(f.sha256,/^[a-f0-9]{64}$/);
    assert.equal(f.originalFile.endsWith('.jpg'),true);
    assert.ok(f.widthPx>0&&f.heightPx>0);
    assert.ok(f.bytes>0);
    assert.ok(f.risks.length>=3);
    // Metadata doesn't license sharing actual owner images as open-source fixtures.
    assert.equal(fs.existsSync(path.join(ROOT,'tests/fixtures',f.originalFile)),false,
      'owner original must not be committed in public fixtures');
  }
});
test('documented physical print sizes derive from pixels at explicitly declared 300 DPI',()=>{
  assert.equal(spec.target.printDpi,300);
  assert.deepEqual(spec.target.inspectionSheet,{widthMm:297,heightMm:210,orientation:'landscape'});
  for(const f of spec.fixtures){
    assert.equal(f.nativeAt300DpiMm.width,Math.round(f.widthPx*25.4/300*100)/100);
    assert.equal(f.nativeAt300DpiMm.height,Math.round(f.heightPx*25.4/300*100)/100);
    assert.ok(doc.includes(f.originalFile),'acceptance sheet missing source identity '+f.id);
    assert.ok(doc.includes(f.widthPx+' × '+f.heightPx));
  }
  assert.equal(spec.fixtures[1].dpiMetadata[0],72);
  assert.equal(spec.fixtures[2].iccEmbedded,true);
});
test('acceptance matrix records all 11 common and 15 image-specific checks as unchecked',()=>{
  for(let i=1;i<=11;i++)assert.ok(doc.includes('- [ ] **G'+String(i).padStart(2,'0')),'Missing G'+i);
  for(const id of ['A','B','C'])for(let i=1;i<=5;i++)
    assert.ok(doc.includes('- [ ] **'+id+i),'Missing '+id+i);
  assert.match(doc,/NOT YET RUN/);
  assert.match(doc,/0 of 3 owner-photo packages/);
  assert.match(doc,/PDF.+landscape A4|landscape A4.+PDF/);
  assert.match(doc,/source.*SHA-256/i);
  assert.match(doc,/NOT RUN/);
  assert.match(doc,/physical printing is currently \*\*NOT RUN\*\*/i);
});
test('references resolve and no raw owner photo is published in documented catalog',()=>{
  for(const [,target] of doc.matchAll(/\]\(([^)]+)\)/g)){
    if(/^(?:https?:|mailto:|#)/.test(target))continue;
    const resolved=path.resolve(ROOT,'docs',target.split('#')[0]);
    assert.ok(fs.existsSync(resolved),'broken local link: '+target);
  }
  assert.doesNotMatch(doc,/<img\b|!\[[^\]]+\]\((?:https?:\/\/|\/mnt\/data)/i);
});
