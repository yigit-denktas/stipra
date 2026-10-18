'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const history=require('../docs/data/product-history.json'),ledger=require('../docs/data/delivery-ledger.json'),changelog=require('../docs/data/changelog.json');
const Roadmap=require('../scripts/build-roadmap-page'),Sync=require('../scripts/sync-release-history'),Search=require('../web/stipra/roadmap-search');
const publication=(tag='v1.2.3',body='- Added [INK-01] Edit each ink independently\n- Improved [INK-01] Save earlier ink states\n- Fixed [OUT-02] Correct an export issue')=>({action:'published',release:{tag_name:tag,published_at:'2026-10-18T11:00:00Z',html_url:'https://github.com/yigit-denktas/stipra/releases/tag/'+tag,name:'Studio refinement',body}});
test('source-backed changes, record types and honest publication status',()=>{
 const h=structuredClone(history),result=Roadmap.validate(h,ledger,changelog);assert.equal(result.ids.size,h.capabilities.length);
 const html=Roadmap.render(h,ledger,changelog);
 for(const label of ['In progress','Shipped versions','Recent development','Find a capability','Ideas worth exploring'])assert.ok(html.includes(label),label);
 assert.match(html,/No published releases recorded/);assert.doesNotMatch(html,/PR #\d+/);assert.equal((html.match(/id="cap-INK-01"/g)||[]).length,1);
 const duplicate=structuredClone(h);duplicate.events.push({...duplicate.events[0]});assert.throws(()=>Roadmap.validate(duplicate,ledger,changelog),/Duplicate/);
 const invented=structuredClone(h);invented.events[0].sourceTitle='Made-up changelog';assert.throws(()=>Roadmap.validate(invented,ledger,changelog),/changelog evidence/);
});
test('one capability has repeated changes across releases without creating duplicate features',()=>{
 const h=structuredClone(history),e=publication();assert.equal(Sync.synchronize(h,e),true);assert.equal(Sync.synchronize(h,e),false);
 assert.deepEqual(h.releases[0].capabilityIds,['INK-01','OUT-02']);
 assert.equal(h.events.filter(x=>x.releaseTag==='v1.2.3'&&x.capabilityId==='INK-01').length,2);
 assert.equal(h.capabilities.filter(x=>x.id==='INK-01').length,1);
 assert.match(Roadmap.render(h,ledger,changelog),/Save earlier ink states/);
 assert.throws(()=>Sync.synchronize(h,{...e,release:{...e.release,published_at:'2026-10-20T11:00:00Z'}}),/would change/);
 const invalid=structuredClone(h);invalid.events.find(x=>x.releaseTag).releaseTag='v99.9.9';assert.throws(()=>Roadmap.validate(invalid,ledger,changelog),/Release change mismatch/);
});
test('issue links in release notes never imply shipped features',()=>{
 const h=structuredClone(history);Sync.synchronize(h,publication('v1.3.0','Fixed #7 and PR #21'));assert.deepEqual(h.releases[0].capabilityIds,[]);
 assert.throws(()=>Sync.synchronize(h,publication('v1.3.1','- Added [BAD-99] Invented')),/Unknown release capability/);
 assert.equal(h.releases.length,1);
});
test('unified search resolves release names, capability changes and initiatives',()=>{
 const h=structuredClone(history);Sync.synchronize(h,publication());const index=Roadmap.buildIndex(h,ledger,changelog);
 const matches=Search.search(index,'Studio refinement');assert.ok(matches.some(x=>x.kind==='release'));assert.ok(matches.some(x=>x.id==='cap-INK-01'));
 assert.ok(Search.search(index,'ink states').some(x=>x.id==='cap-INK-01'));assert.equal(Search.search(index,'impossible-phrase').length,0);
});
test('100 published versions remain browsable and searchable',()=>{
 const h=structuredClone(history);
 for(let i=0;i<100;i++){const tag='v2.'+i+'.0',date=new Date(Date.UTC(2027,0,1+i)).toISOString();
  Sync.synchronize(h,{action:'published',release:{tag_name:tag,published_at:date,html_url:'https://github.com/yigit-denktas/stipra/releases/tag/'+tag,name:'Ink improvement '+i,body:'- Improved [INK-01] Refinement '+i}});
 }
 assert.match(Roadmap.render(h,ledger,changelog),/v2\.99\.0/);
 assert.equal(h.events.filter(x=>x.stage==='release').length,100);
 assert.ok(Search.search(Roadmap.buildIndex(h,ledger,changelog),'Ink improvement 99').some(x=>x.id==='cap-INK-01'));
});
