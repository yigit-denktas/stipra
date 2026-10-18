'use strict';
/* Roadmap presentation uses one versioned product record. Implementation, acceptance,
 * and publication are deliberately independent. No issue-close == release inference. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>`<a href="${esc(url)}">${esc(label)}</a>`;
const byId=items=>new Map(items.map(item=>[item.id,item]));
function validate(history,ledger){
 if(history.contract!=='stipra-product-history-v1')throw Error('Unsupported product history');
 const ids=new Set(),issueIds=new Set(ledger.tasks.map(t=>t.issue));
 for(const c of history.capabilities){
  if(!/^[A-Z]{2,4}-\d\d$/.test(c.id)||ids.has(c.id))throw Error('Invalid/duplicate capability id '+c.id);
  ids.add(c.id);
  if(!['implemented','in-progress','planned'].includes(c.implementation))throw Error('Invalid implementation '+c.id);
  if(!['digital-evidence','pending','not-evaluated'].includes(c.acceptance))throw Error('Invalid acceptance '+c.id);
  if(c.issues.some(n=>!issueIds.has(n)))throw Error('Unknown issue in '+c.id);
 }
 for(const c of history.capabilities){if(c.dependsOn.some(id=>!ids.has(id)))throw Error('Unknown capability dependency '+c.id);}
 const milestones=new Set();
 for(const item of history.initiatives){
  if(milestones.has(item.id))throw Error('Duplicate initiative');milestones.add(item.id);
  if(!['now','next'].includes(item.priority)||item.capabilities.some(id=>!ids.has(id)))throw Error('Invalid initiative '+item.id);
 }
 const tags=new Set();
 for(const rel of history.releases){
  if(!/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(rel.tag)||tags.has(rel.tag))throw Error('Invalid/duplicate release tag');tags.add(rel.tag);
  if(!/^\d{4}-\d\d-\d\dT/.test(rel.publishedAt)||!/^https:\/\//.test(rel.url)||!Array.isArray(rel.capabilityIds)||rel.capabilityIds.some(id=>!ids.has(id)))throw Error('Invalid published release '+rel.tag);
 }
 return {ids,byId:byId(history.capabilities)};
}
function render(history,ledger,changelog){
 const {byId:lookup}=validate(history,ledger);
 const status={implemented:'Implemented','in-progress':'In progress',planned:'Planned'};
 const ordered=history.releases.slice().sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 const newest=ordered[0];
 function source(c){return `<details class="r-evidence"><summary>Evidence and dependencies</summary><p>Implementation: ${esc(status[c.implementation])} · Acceptance: ${esc(c.acceptance.replaceAll('-',' '))}</p>${c.issues.length?`<p>Source issues: ${c.issues.map(n=>link(ledger.repository+'/issues/'+n,'#'+n)).join(' · ')}</p>`:''}${c.dependsOn.length?`<p>Depends on: ${c.dependsOn.map(esc).join(', ')}</p>`:''}</details>`;}
 function item(c,anchor=false){return `<li${anchor?' id="cap-'+esc(c.id)+'"':''} class="r-cap"><div class="r-cap-head"><span class="r-id">${esc(c.id)}</span><span class="r-status r-status--${esc(c.implementation)}">${esc(status[c.implementation])}</span></div><p class="r-cap-title">${esc(c.title)}</p><p class="r-subtle">${esc(c.detail)}</p>${source(c)}</li>`;}
 function initiative(t,i){return `<article class="r-initiative"><span class="r-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><details><summary>See the work · ${t.capabilities.length} capabilities</summary><ul class="r-compact-list">${t.capabilities.map(id=>item(lookup.get(id))).join('')}</ul></details></div></article>`;}
 const now=history.initiatives.filter(x=>x.priority==='now');
 const next=history.initiatives.filter(x=>x.priority==='next');
 const archived=[...new Set(history.capabilities.map(c=>c.area))].map(area=>{
  const cs=history.capabilities.filter(c=>c.area===area);
  return `<details class="r-area"><summary><span>${esc(area)}</span><span class="r-area-count">${cs.length} records</span></summary><ul class="r-compact-list">${cs.map(c=>item(c,true)).join('')}</ul></details>`;
 }).join('');
 const published=ordered.length?ordered.map(rel=>`<article class="r-release"><div class="r-release-date"><time datetime="${esc(rel.publishedAt)}">${esc(rel.publishedAt.slice(0,10))}</time><span class="r-status">Published</span></div><h3>${link(rel.url,rel.tag)}</h3>${rel.summary?`<p>${esc(rel.summary)}</p>`:''}${rel.capabilityIds.length?`<p class="r-subtle">Included: ${rel.capabilityIds.map(id=>`<a href="#cap-${esc(id)}">${esc(id)}</a>`).join(', ')}</p>`:`<p class="r-subtle">No capability mapping was declared for this release.</p>`}</article>`).join(''):'<p class="r-unpublished">No published release is recorded yet. Completed code and dated changes below are development history, not shipped versions.</p>';
 const journal=changelog.entries.slice(0,12).map((e,i)=>`<article class="r-journal-entry"><time datetime="${esc(e.date)}">${esc(e.date)}</time><div><h3>${esc(e.title)}</h3><p>${esc(e.changes[0]||'')}</p><details><summary>Read all changes and source references</summary><ul>${e.changes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${e.issues?.length?`<p>Source issues: ${e.issues.map(n=>link(ledger.repository+'/issues/'+n,'#'+n)).join(' · ')}</p>`:''}</details></div></article>`).join('');
 const count={implemented:0,'in-progress':0,planned:0};history.capabilities.forEach(x=>count[x.implementation]++);
 return `<div class="r-site">
 <div class="r-topline"><span>STIPRĀ / DEVELOPMENT</span><span>LIVE PRODUCT RECORD</span></div>
 <p class="r-kicker">A tool in the making</p><h2 class="r-display">From image to ink<span class="r-dot">.</span><br>And beyond.</h2>
 <p class="r-intro">A programmable printmaking studio and creative-coding library. Here is what exists, what is being tested, and what comes next.</p>
 <nav class="r-jump" aria-label="Roadmap sections"><a href="#now">In progress</a><a href="#releases">Releases</a><a href="#journal">Development history</a><a href="#next">Next</a><a href="#records">Full record</a></nav>
 <div class="r-snapshot" aria-label="Roadmap status"><div><span class="r-meta">Working build</span><strong>${esc(history.workingBuild.label)}</strong><small>Owner-reported · unpublished</small></div><div><span class="r-meta">Published releases</span><strong>${ordered.length?esc(newest.tag):'—'}</strong><small>${newest?esc(newest.publishedAt.slice(0,10)):'No verified public version'}</small></div><div><span class="r-meta">Development</span><strong>${now.length} priorities</strong><small>${count.implemented} implemented · ${count['in-progress']} active · ${count.planned} planned</small></div></div>
 <section id="now" class="r-section"><div class="r-section-heading"><span class="r-section-tag">01 / NOW</span><h2>What we are working on.</h2><p>The current priorities. These can advance in parallel; they are not successive version promises.</p></div><div class="r-initiatives">${now.map(initiative).join('')}</div></section>
 <section id="releases" class="r-section"><div class="r-section-heading"><span class="r-section-tag">02 / SHIPPED</span><h2>Released versions.</h2><p>Only published release events appear here. The working build below is not a publication.</p></div>${published}<div class="r-working"><span class="r-meta">Working build · not published</span><h3>${esc(history.workingBuild.label)}</h3><p>${esc(history.workingBuild.note)}</p></div></section>
 <section id="journal" class="r-section"><div class="r-section-heading"><span class="r-section-tag">03 / HISTORY</span><h2>The work, as it happened.</h2><p>Dated changes from the development changelog. They may precede a formal release.</p></div><div class="r-journal">${journal}</div><p class="r-source-link">${link('../changelog/','Read the full changelog →')}</p></section>
 <section id="next" class="r-section"><div class="r-section-heading"><span class="r-section-tag">04 / AHEAD</span><h2>Where this could go.</h2><p>Initiatives are named by intention, not by invented future version numbers or delivery dates.</p></div><div class="r-initiatives">${next.map(initiative).join('')}</div></section>
 <section id="records" class="r-section"><div class="r-section-heading"><span class="r-section-tag">05 / REFERENCE</span><h2>Every capability, traceable.</h2><p>Stable IDs survive reordering. Implementation, acceptance, and publication remain different facts. Sources stay one click away rather than filling the main narrative.</p></div><div class="r-area-list">${archived}</div><p class="r-source-link">${link('./history.json','Read the machine-readable product record →')}</p></section>
 <div class="r-end"><span>THE NEXT IMPRESSION IS NEVER THE LAST.</span><span>STIPRĀ / ${esc(history.asOf)}</span></div>
 </div>`;
}
module.exports={render,validate};
