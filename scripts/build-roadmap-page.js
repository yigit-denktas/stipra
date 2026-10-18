'use strict';
/* One immutable capability registry. Changes, acceptance and release publication are separate. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>'<a href="'+esc(url)+'">'+esc(label)+'</a>';
const typeLabels={added:'Added',improved:'Improved',fixed:'Fixed',verified:'Verified',research:'Researched',deprecated:'Deprecated',removed:'Removed'};
const recordLabels={feature:'Feature',validation:'Validation',operations:'Operations',research:'Research'};
function validate(h,ledger,changelog){
 if(h.contract!=='stipra-product-history-v2')throw Error('Unsupported product history');
 const ids=new Set(),issues=new Set(ledger.tasks.map(t=>t.issue));
 for(const c of h.capabilities){
  if(!/^[A-Z]{2,4}-\d\d$/.test(c.id)||ids.has(c.id))throw Error('Invalid/duplicate capability id '+c.id);ids.add(c.id);
  if(!recordLabels[c.recordType])throw Error('Invalid record type '+c.id);
  if(!['implemented','in-progress','planned'].includes(c.implementation))throw Error('Invalid implementation '+c.id);
  if(!['digital-evidence','pending','not-evaluated'].includes(c.acceptance))throw Error('Invalid acceptance '+c.id);
  if(!Array.isArray(c.issues)||c.issues.some(n=>!issues.has(n)))throw Error('Unknown issue '+c.id);
 }
 const byId=new Map(h.capabilities.map(c=>[c.id,c]));
 for(const c of h.capabilities)if(!Array.isArray(c.dependsOn)||c.dependsOn.some(id=>!ids.has(id)))throw Error('Unknown dependency '+c.id);
 const initiativeIds=new Set();for(const i of h.initiatives){if(initiativeIds.has(i.id)||!['now','next'].includes(i.priority)||i.capabilities.some(id=>!ids.has(id)))throw Error('Invalid initiative '+i.id);initiativeIds.add(i.id);}
 const releases=new Map();for(const r of h.releases){
  if(!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(r.tag)||releases.has(r.tag))throw Error('Invalid/duplicate release '+r.tag);
  if(!/^\d{4}-\d\d-\d\dT/.test(r.publishedAt)||!/^https:\/\/github\.com\//.test(r.url)||!Array.isArray(r.capabilityIds)||r.capabilityIds.some(id=>!ids.has(id)))throw Error('Invalid publication '+r.tag);
  releases.set(r.tag,r);
 }
 const changes=new Set(),sourceTitles=new Set((changelog?.entries||[]).map(e=>e.title));
 if(!Array.isArray(h.events))throw Error('Missing change events');
 for(const e of h.events){
  if(!/^[A-Z][A-Z0-9-]{2,70}$/.test(e.id)||changes.has(e.id))throw Error('Duplicate or malformed change '+e.id);changes.add(e.id);
  if(!typeLabels[e.type]||!['development','release'].includes(e.stage)||!ids.has(e.capabilityId)||!e.title||!/^\d{4}-\d\d-\d\d$/.test(e.date))throw Error('Invalid change '+e.id);
  if(e.stage==='release'){const r=releases.get(e.releaseTag);if(!r||!r.capabilityIds.includes(e.capabilityId)||e.date!==r.publishedAt.slice(0,10))throw Error('Release change mismatch '+e.id);}
  else if(e.releaseTag||!sourceTitles.has(e.sourceTitle))throw Error('Development change missing changelog evidence '+e.id);
 }
 return {ids,byId,releases};
}
const chronological=events=>events.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
function buildIndex(h,ledger,changelog){
 const {byId}=validate(h,ledger,changelog),es=chronological(h.events);
 const rels=new Map(h.releases.map(r=>[r.tag,r])),index=[];
 for(const r of h.releases)index.push({kind:'release',id:'release-'+r.tag,label:r.tag+' — '+(r.summary||'Release'),text:[r.tag,r.summary,r.publishedAt,...es.filter(e=>e.releaseTag===r.tag).map(e=>e.title)].join(' '),href:'#release-'+r.tag});
 for(const c of h.capabilities){const ce=es.filter(e=>e.capabilityId===c.id);const rr=ce.filter(e=>e.releaseTag).map(e=>rels.get(e.releaseTag)).filter(Boolean);
  index.push({kind:c.recordType,id:'cap-'+c.id,label:c.title,text:[c.id,c.title,c.detail,c.area,c.recordType,c.implementation,...ce.map(e=>e.title),...rr.map(r=>r.tag+' '+r.summary)].join(' '),href:'#cap-'+c.id});}
 for(const e of es)index.push({kind:'change',id:'change-'+e.id,label:typeLabels[e.type]+': '+e.title,text:[e.title,e.type,e.date,e.releaseTag||'',e.sourceTitle||'',e.capabilityId,rels.get(e.releaseTag)?.summary||''].join(' '),href:'#change-'+e.id});
 for(const i of h.initiatives)index.push({kind:'initiative',id:'initiative-'+i.id,label:i.title,text:[i.title,i.description,...i.capabilities.map(id=>byId.get(id).title)].join(' '),href:'#initiative-'+i.id});
 return index;
}
function render(h,ledger,changelog){
 const {byId}=validate(h,ledger,changelog),es=chronological(h.events),releases=h.releases.slice().sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 const evFor=id=>es.filter(e=>e.capabilityId===id);
 const showEvent=e=>'<li class="r-change" id="change-'+esc(e.id)+'"><span class="r-change-type">'+typeLabels[e.type]+'</span><div>'+link('#cap-'+e.capabilityId,e.title)+'<small>'+esc(e.date)+(e.releaseTag?' · '+esc(e.releaseTag):' · Development')+'</small></div></li>';
 const initiative=i=>'<article class="r-priority" id="initiative-'+esc(i.id)+'"><div class="r-label">'+(i.priority==='now'?'Active':'Exploring')+'</div><div><h3>'+esc(i.title)+'</h3><p>'+esc(i.description)+'</p><details><summary>Included work ('+i.capabilities.length+')</summary><ul>'+i.capabilities.map(id=>'<li>'+link('#cap-'+id,byId.get(id).title.replace(/\.$/,''))+'</li>').join('')+'</ul></details></div></article>';
 function record(c){
  const history=evFor(c.id);
  return '<li class="r-record" id="cap-'+esc(c.id)+'"><div class="r-record-head"><span>'+esc(c.id)+' · '+recordLabels[c.recordType]+'</span><span>'+esc(c.implementation.replace('-',' '))+'</span></div><h3>'+esc(c.title)+'</h3><p>'+esc(c.detail)+'</p><details><summary>History ('+history.length+') and sources</summary><ol class="r-record-history">'+(history.length?history.map(e=>'<li><time datetime="'+esc(e.date)+'">'+esc(e.date)+'</time> · '+typeLabels[e.type]+' — '+esc(e.title)+(e.releaseTag?' · '+link('#release-'+e.releaseTag,e.releaseTag):'')+'</li>').join(''):'<li>No individual change recorded yet.</li>')+'</ol><p>Acceptance: '+esc(c.acceptance.replaceAll('-',' '))+'. '+(c.issues.length?'Sources: '+c.issues.map(n=>link(ledger.repository+'/issues/'+n,'Issue '+n)).join(' · '):'No linked issue yet.')+'</p>'+(c.dependsOn.length?'<p>Related capabilities: '+c.dependsOn.map(id=>link('#cap-'+id,id)).join(' · ')+'</p>':'')+'</details></li>';
 }
 const latest=releases[0],now=h.initiatives.filter(i=>i.priority==='now'),next=h.initiatives.filter(i=>i.priority==='next');
 const areas=[...new Set(h.capabilities.map(c=>c.area))];
 const overview='<div class="r-overview"><div><span>Working build</span><strong>'+esc(h.workingBuild.label)+'</strong><small>Not a published release</small></div><div><span>Latest published</span><strong>'+(latest?link('#release-'+latest.tag,latest.tag):'None yet')+'</strong><small>'+(latest?esc(latest.publishedAt.slice(0,10)):'Publication not verified')+'</small></div><div><span>Current focus</span><strong>'+now.length+' priorities</strong><small>Independent workstreams</small></div></div>';
 const section=(id,num,label,body)=>'<section id="'+id+'" class="r-section"><div class="r-section-head"><span>'+num+'</span><h2>'+label+'</h2></div>'+body+'</section>';
 const priorities='<div class="r-priorities">'+now.map(initiative).join('')+'</div>';
 const published=releases.length?releases.map(r=>{const events=es.filter(e=>e.releaseTag===r.tag);return '<article class="r-release" id="release-'+esc(r.tag)+'"><time datetime="'+esc(r.publishedAt)+'">'+esc(r.publishedAt.slice(0,10))+'</time><div><h3>'+link(r.url,r.tag)+' <span>'+esc(r.summary||'Release')+'</span></h3><p>'+(events.length?events.length+' documented changes':'No change details declared')+'</p><details><summary>Read changes</summary><ul class="r-changes">'+(events.length?events.map(showEvent).join(''):'<li>Find details in the linked release notes.</li>')+'</ul></details></div></article>'}).join(''):'<p class="r-empty">No published releases recorded. The working build '+esc(h.workingBuild.label)+' has no verified publication date.</p>';
 const history='<p class="r-explain">Changes in the codebase are not automatically published releases.</p><ul class="r-changes">'+es.filter(e=>e.stage==='development').slice(0,8).map(showEvent).join('')+'</ul><p>'+link('../changelog/','Full development changelog →')+'</p>';
 const features='<p class="r-explain">Select an area to see its capabilities, changes, acceptance state and sources.</p><div class="r-areas">'+areas.map(area=>{const items=h.capabilities.filter(c=>c.area===area);return '<details class="r-area"><summary>'+esc(area)+' <small>'+items.length+' records</small></summary><ul class="r-records">'+items.map(record).join('')+'</ul></details>'}).join('')+'</div>';
 const future='<p class="r-explain">Directions, not scheduled releases.</p><div class="r-priorities">'+next.map(initiative).join('')+'</div>';
 return '<div class="r-site"><p class="r-eyebrow">STIPRĀ / ROADMAP & RELEASES</p><div class="r-head"><h2>What’s new.<br>What’s next.</h2><p>What Stiprā can do, what changed, and what we’re working on.</p></div><nav class="r-jump" aria-label="Roadmap sections"><a href="#now">Now</a><a href="#releases">Releases</a><a href="#changes">Changes</a><a href="#features">Features</a><a href="#next">Next</a></nav><form class="r-search" role="search"><label for="r-query">Find a feature or change</label><input id="r-query" type="search" autocomplete="off" placeholder="Try ink masks, vector, 1.2.0…" aria-controls="r-results"><button type="reset" id="r-reset">Clear</button></form><section id="r-results" hidden aria-label="Search results"><p id="r-result-count" role="status" aria-live="polite"></p><ul id="r-result-list"></ul></section>'
 +overview+section('now','01 / NOW','In progress',priorities)+section('releases','02 / RELEASES','Shipped versions',published)+section('changes','03 / HISTORY','Recent development',history)+section('features','04 / FEATURES','Find a capability',features)+section('next','05 / NEXT','Ideas worth exploring',future)
 +'<footer class="r-footer"><span>'+h.capabilities.length+' product records · '+es.length+' documented changes</span><span>'+link('./history.json','Machine-readable history →')+'</span></footer></div>';
}
module.exports={render,validate,buildIndex};
