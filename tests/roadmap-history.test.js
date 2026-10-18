'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const history=require('../docs/data/product-history.json'),ledger=require('../docs/data/delivery-ledger.json'),changelog=require('../docs/data/changelog.json');
const Roadmap=require('../scripts/build-roadmap-page'),Sync=require('../scripts/sync-release-history');
test('roadmap distinguishes code, acceptance and published history',()=>{
 const h=structuredClone(history);const result=Roadmap.validate(h,ledger);assert.equal(result.ids.size,33);
 const html=Roadmap.render(h,ledger,changelog);
 for(const label of ['What we are working on.','Released versions.','The work, as it happened.','Where this could go.','Every capability, traceable.'])assert.ok(html.includes(label));
 assert.match(html,/No published release is recorded yet/);assert.match(html,/Owner-reported/);
 assert.doesNotMatch(html,/PR #\d+/);
 const invalid=structuredClone(h);invalid.capabilities.push({...invalid.capabilities[0]});assert.throws(()=>Roadmap.validate(invalid,ledger),/duplicate capability/);
});
test('published version appears once, with explicit capability IDs and date',()=>{
 const h=structuredClone(history);const event={action:'published',release:{tag_name:'v1.2.3',published_at:'2026-10-18T11:00:00Z',html_url:'https://github.com/yigit-denktas/stipra/releases/tag/v1.2.3',name:'Studio refinement',body:'Capabilities: INK-01, OUT-02'}};
 assert.equal(Sync.synchronize(h,event),true);assert.equal(Sync.synchronize(h,event),false);
 assert.deepEqual(h.releases[0].capabilityIds,['INK-01','OUT-02']);assert.ok(Roadmap.render(h,ledger,changelog).includes('v1.2.3'));
 assert.throws(()=>Sync.synchronize(h,{...event,release:{...event.release,published_at:'2026-10-20T11:00:00Z'}}),/would change/);
});
