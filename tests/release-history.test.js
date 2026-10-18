'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const Sync=require('../scripts/sync-release-history'),Roadmap=require('../scripts/build-roadmap-page');
const history=require('../docs/data/product-history.json'),ledger=require('../docs/data/delivery-ledger.json'),changelog=require('../docs/data/changelog.json');
const {libraryPublication}=require('../scripts/site-publication'),registry=require('../docs/evidence/npm-alpha-registry-2026-10-18.json');
const ROOT=path.resolve(__dirname,'..');
const empty=()=>({...structuredClone(history),releases:[],events:structuredClone(history.events.filter(e=>e.stage==='development'))});
const event=(tag,body='- Improved [INK-01] Synthetic release fixture')=>({action:'published',release:{tag_name:tag,published_at:'2026-10-18T12:00:00Z',html_url:'https://github.com/yigit-denktas/stipra/releases/tag/'+tag,name:'Synthetic release fixture',body,draft:false}});
test('production history validates independently of whether GitHub releases already exist',()=>{
  assert.doesNotThrow(()=>Sync.checkHistory(history));
  const populated=empty();Sync.synchronize(populated,event('v9.0.0'));assert.doesNotThrow(()=>Sync.checkHistory(populated));
});
test('valid prerelease, build metadata and case distinctions keep unique stable event identities',()=>{
  const h=empty();
  for(const tag of ['v1.0.0+build.1','v1.0.0-build.1','v1.0.0-RC.1','v1.0.0-rc.1'])Sync.synchronize(h,event(tag));
  assert.equal(new Set(h.events.map(e=>e.id)).size,h.events.length);
  assert.doesNotThrow(()=>Roadmap.validate(h,ledger,changelog));
  const prior=JSON.stringify(h);assert.equal(Sync.synchronize(h,event('v1.0.0+build.1')),false);assert.equal(JSON.stringify(h),prior);
  assert.throws(()=>Sync.synchronize(h,{...event('v1.0.0+build.1'),release:{...event('v1.0.0+build.1').release,published_at:'2026-10-19T12:00:00Z'}}),/would change/);
});
test('snapshot replay recovers missed releases, ignores drafts and rolls back invalid batches',()=>{
  const h=empty(),a=event('v1.0.0'),b=event('v1.1.0');
  const snapshot=[[a.release,{...event('v2.0.0').release,draft:true}],[b.release,{...event('v3.0.0').release,published_at:null}]];
  assert.equal(Sync.synchronizeAll(h,b,snapshot),true);
  assert.deepEqual(h.releases.map(r=>r.tag).sort(),['v1.0.0','v1.1.0']);
  assert.equal(Sync.synchronizeAll(h,b,snapshot),false);
  const before=JSON.stringify(h);
  assert.throws(()=>Sync.synchronizeAll(h,event('v1.2.0'),[event('v1.3.0','- Added [BAD-99] Invalid').release]),/Unknown release capability/);
  assert.equal(JSON.stringify(h),before,'a failed catch-up must not partially mutate history');
});
test('first publication CLI, render validation and history suite work together on nonempty history',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-publication-'));
  const files=['tests/roadmap-history.test.js','scripts/build-roadmap-page.js','scripts/sync-release-history.js','scripts/site-publication.js',
    'web/stipra/roadmap-search.js','docs/data/product-history.json','docs/data/delivery-ledger.json','docs/data/changelog.json','docs/evidence/npm-alpha-registry-2026-10-18.json'];
  try{
    for(const f of files){fs.mkdirSync(path.dirname(path.join(temp,f)),{recursive:true});fs.copyFileSync(path.join(ROOT,f),path.join(temp,f));}
    const target=path.join(temp,'docs/data/product-history.json'),payload=path.join(temp,'event.json'),snapshot=path.join(temp,'releases.json'),script=path.join(temp,'scripts/sync-release-history.js');
    fs.writeFileSync(target,JSON.stringify(empty()));fs.writeFileSync(payload,JSON.stringify(event('v0.9.0')));
    fs.writeFileSync(snapshot,JSON.stringify([[event('v0.9.0').release,event('v0.8.1').release]]));
    cp.execFileSync(process.execPath,[script,payload,target,snapshot],{stdio:'pipe'});
    assert.equal(JSON.parse(fs.readFileSync(target)).releases.length,2);
    const before=fs.readFileSync(target);
    cp.execFileSync(process.execPath,[script,'--check',target],{stdio:'pipe'});
    cp.execFileSync(process.execPath,['--test',path.join(temp,'tests/roadmap-history.test.js')],{stdio:'pipe'});
    cp.execFileSync(process.execPath,[script,payload,target,snapshot],{stdio:'pipe'});
    assert.deepEqual(fs.readFileSync(target),before);
    fs.writeFileSync(payload,JSON.stringify(event('v1.0.0','- Added [BAD-99] Invalid')));
    assert.throws(()=>cp.execFileSync(process.execPath,[script,payload,target,snapshot],{stdio:'pipe'}));
    assert.deepEqual(fs.readFileSync(target),before,'failed CLI validation must preserve committed bytes');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('library release rendering requires verified registry evidence and keeps GitHub history distinct',()=>{
  const lib=libraryPublication();assert.equal(lib.version,registry.packages[0].version);
  for(const change of [{status:'pending'},{packages:registry.packages.slice(1)},{consumer:{checks:{}}}])assert.throws(()=>libraryPublication({...structuredClone(registry),...change}));
  const h=empty(),html=Roadmap.render(h,ledger,changelog);
  assert.match(html,/Published JavaScript library/);assert.match(html,/No GitHub releases recorded/);assert.match(html,/Registry verification evidence/);
  const found=require('../web/stipra/roadmap-search').search(Roadmap.buildIndex(h,ledger,changelog),lib.version);
  assert.ok(found.some(x=>x.kind==='library-release'));assert.ok(found.some(x=>x.id==='cap-LIB-01'));
});
