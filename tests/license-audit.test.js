'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {audit,notices,licensePolicy}=require('../scripts/license-audit');
test('shared license policy selects reviewed alternatives and rejects unknown expressions',()=>{
  assert.deepEqual(licensePolicy('jszip','(MIT OR GPL-3.0-or-later)'),{selected:'MIT',reviewed:true});
  assert.deepEqual(licensePolicy('brotli','MIT'),{selected:'MIT AND Apache-2.0',reviewed:true});
  for(const declared of [null,'GPL-3.0-only','unknown','MIT OR unknown'])assert.equal(licensePolicy('new-dependency',declared).reviewed,false);
});
test('dependency audit preserves alternative licenses and exposes actual distribution gaps',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-licenses-'));
  try{
    const report=audit(out);
    assert.equal(report.status,'review-required');
    assert.equal(report.packages.find(x=>x.name==='jszip').selected,'MIT');
    assert.ok(!report.packages.some(x=>['fonteditor-core','@pdf-lib/fontkit'].includes(x.name)));
    assert.equal(report.fontkitSource.status,'source-inventory-checked');
    assert.equal(report.packages.find(x=>x.name==='brotli').selected,'MIT AND Apache-2.0');
    assert.ok(report.findings.some(x=>x.kind==='native-transitive-review'));
    assert.equal(report.findings.length,1);
    assert.ok(!report.findings.some(x=>x.kind==='incomplete-notice'));
    for(const name of ['dijkstrajs','string-split-by'])assert.ok(report.packages.find(x=>x.name===name).evidence.some(x=>x.path.includes('Stipra supplement')));
    assert.ok(!report.packages.some(x=>/p5\.riso/.test(x.name)));
    const text=fs.readFileSync(path.join(out,'THIRD-PARTY-NOTICES.txt'),'utf8');
    assert.match(text,/Copyright 2013 Google/);assert.match(text,/Apache License/);assert.match(text,/SIL OPEN FONT LICENSE/i);
    const run=require('node:child_process').spawnSync(process.execPath,[path.join(__dirname,'../scripts/license-audit.js'),'--release-check'],{encoding:'utf8'});
    assert.equal(run.status,1,'a completed inventory must not claim release clearance while findings remain');
  }finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('missing notice evidence is not silently invented from the license name',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-no-notice-'));
  try{
    fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'test-missing-notice',version:'1.0.0',license:'MIT'}));
    assert.equal(notices(dir).sources.length,0);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
