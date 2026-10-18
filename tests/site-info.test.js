'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Info=require('../scripts/build-site-info'),ledger=require('../docs/data/delivery-ledger.json');
test('delivery ledger preserves original denominator and rejects dependency gaps/cycles',()=>{
  assert.equal(Info.validate().originalClosed,9);
  const missing=structuredClone(ledger);missing.tasks[0].dependsOn=[999];assert.throws(()=>Info.validate(missing),/Missing prerequisite/);
  const cycle=structuredClone(ledger);cycle.tasks[0].dependsOn=[2];assert.throws(()=>Info.validate(cycle),/cycle/);
  for(const id of [3,4,10,17,28,31,46,57,75])assert.equal(ledger.tasks.find(t=>t.issue===id).optional,true);
  for(const id of [83,84,85,86])assert.equal(ledger.tasks.find(t=>t.issue===id).trackerState,'closed');
  assert.ok(ledger.tasks.find(t=>t.issue===14).note.includes('one native'));
});
test('information pages and all navigation use valid relative destinations on either host',()=>{
  const stage=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-site-info-'));
  try{
    for(const [route]of Info.ROUTES){if(['roadmap/','changelog/','sitemap/'].includes(route))continue;const file=path.join(stage,route.endsWith('.html')?route:route+'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'<!doctype html><html><body><main><h1>Destination</h1></main></body></html>');}
    Info.build(stage);Info.build(stage);
    for(const [route]of Info.ROUTES){const file=path.join(stage,route.endsWith('.html')?route:route+'index.html'),html=fs.readFileSync(file,'utf8');assert.equal((html.match(/class="site-nav"/g)||[]).length,1);assert.equal((html.match(/class="skip-link"/g)||[]).length,1);assert.match(html,/<main id="main-content" tabindex="-1"/);
      for(const [,href]of html.matchAll(/href="([^"]+)"/g)){if(/^(?:https:|#)/.test(href)||href.endsWith('shared.css'))continue;const resolved=path.resolve(path.dirname(file),href),target=href.endsWith('/')?path.join(resolved,'index.html'):resolved;assert.ok(fs.existsSync(target),'Broken destination '+route+' → '+href);assert.ok(target.startsWith(stage+path.sep));}
    }
    const xml=fs.readFileSync(path.join(stage,'sitemap.xml'),'utf8');assert.equal((xml.match(/<loc>/g)||[]).length,Info.ROUTES.length);assert.ok(!xml.includes('github.io'));
    const changes=fs.readFileSync(path.join(stage,'changelog/index.html'),'utf8');assert.match(changes,/no npm package release/);assert.match(changes,/PR #89/);
    const roadmap=fs.readFileSync(path.join(stage,'roadmap/index.html'),'utf8');assert.match(roadmap,/In progress/);assert.match(roadmap,/Shipped versions/);assert.match(roadmap,/Find a capability/);
    for(const name of ['history.json','search-index.js','roadmap-search.js','roadmap.css'])assert.ok(fs.existsSync(path.join(stage,'roadmap',name)),name);
    assert.match(roadmap,/<script defer src="\.\/search-index\.js"><\/script>/);
    assert.match(roadmap,/<script defer src="\.\/roadmap-search\.js"><\/script>/);
  }finally{fs.rmSync(stage,{recursive:true,force:true});}
});
