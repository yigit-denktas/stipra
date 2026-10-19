#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),ledger=require('../docs/data/delivery-ledger.json'),changelog=require('../docs/data/changelog.json');
const ProductRoadmap=require('./build-roadmap-page'),productHistory=require('../docs/data/product-history.json');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const issue=n=>`<a href="${ledger.repository}/issues/${n}">#${n}</a>`;
const ROUTES=[['','Studio','Import, separate, inspect and export.'],['guide/','Field guide','Read plates, print settings and reproduction instructions.'],['sketches/','Canvas / p5.js','Use an existing drawing with the lean local alpha.'],['sketches/global.html','p5 global example','A separate p5.js host script.'],['sketches/instance.html','p5 instance example','Instance-mode integration and authored ink layers.'],['regions/','Named regions','Keep foreground, distance and lettering independent.'],['roadmap/','Roadmap','Current work, published versions and capability history.'],['changelog/','Changelog','Merged development history and release status.'],['delivery/','Delivery map','Version targets, prerequisites and acceptance gates.'],['sitemap/','Site map','All primary public destinations.']];
/** Checks a source-backed task DAG without treating research completion as shipped codec support. */
function validate(data=ledger){
  const ids=new Set(data.tasks.map(x=>x.issue));if(ids.size!==data.tasks.length)throw Error('Duplicate delivery task');
  const visited=new Set(),active=new Set(),byId=new Map(data.tasks.map(x=>[x.issue,x]));
  function visit(n){if(active.has(n))throw Error('Dependency cycle '+n);if(visited.has(n))return;if(!ids.has(n))throw Error('Missing prerequisite '+n);active.add(n);for(const dep of byId.get(n).dependsOn)visit(dep);active.delete(n);visited.add(n);}
  for(const n of ids)visit(n);
  for(const m of data.milestones){if(!m.version||!m.exit||m.tasks.some(n=>!ids.has(n)))throw Error('Invalid milestone');}
  if(data.originalV09Issues.length!==14||data.originalV09Issues.some((n,i)=>n!==i+1))throw Error('Original backlog denominator changed');
  return {tasks:ids.size,originalClosed:data.tasks.filter(x=>data.originalV09Issues.includes(x.issue)&&x.trackerState==='closed').length};
}
function navigation(prefix,current){
  const item=([route,label])=>`<a href="${prefix+route}"${route===current?' aria-current="page"':''}>${escape(label)}</a>`;
  const primary=ROUTES.filter(([route])=>['','guide/','roadmap/','changelog/'].includes(route));
  const secondary=ROUTES.filter(([route])=>['sketches/','regions/','delivery/','sitemap/'].includes(route));
  return '<nav class="site-nav" aria-label="Site navigation"><div class="site-nav-primary">'+primary.map(item).join('')+'</div><details class="site-nav-more"><summary>More <span aria-hidden="true">+</span></summary><div>'+secondary.map(item).join('')+'</div></details></nav>';
}
function page(title,route,body){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>stiprā / ${escape(title)}</title><link rel="canonical" href="${ledger.primary+route}"><link rel="stylesheet" href="../shared.css">${route==='roadmap/'?'<link rel="stylesheet" href="./roadmap.css">':''}</head><body class="doc-page"><header><a class="wordmark" href="../">stiprā</a><p class="eyebrow">Local printmaking / development record</p><h1>${escape(title)}</h1></header><main>${body}</main><footer>Published experimental JavaScript alpha; Studio releases, physical print quality and final identity have separate acceptance. <a href="${ledger.repository}">Source and notices</a></footer></body></html>`;}
function roadmap(){return page('Roadmap','roadmap/',ProductRoadmap.render(productHistory,ledger,changelog));}
function delivery(){
  const counts=validate(),milestones=ledger.milestones.map(m=>`<section><p class="eyebrow">${escape(m.state)}</p><h2>${escape(m.version)}</h2><p>${escape(m.exit)}</p><p>Relevant gates: ${m.tasks.map(issue).join(' · ')}</p></section>`).join('');
  function task(t){return `<details id="task-${t.issue}"><summary>#${t.issue} ${escape(t.title)} <span class="task-status">${escape(t.deliveryState)}${t.optional?' / optional':''}</span></summary><p>${issue(t.issue)} · ${escape(t.note)}</p><p>Needs: ${t.dependsOn.length?t.dependsOn.map(issue).join(' · '):'No unfinished prerequisite recorded.'}</p><p>Opens: ${ledger.tasks.filter(x=>x.dependsOn.includes(t.issue)).map(x=>issue(x.issue)).join(' · ')||'Acceptance or optional end of this track.'}</p><p class="small">Tracker snapshot: ${escape(t.trackerState)} · ${t.sourceUpdatedAt?'source updated '+escape(t.sourceUpdatedAt.slice(0,10)):'closure delivered by integration'}</p></details>`;}
  const tracks=[...new Set(['studio','library','identity','delivery',...ledger.tasks.map(t=>t.track)])];
  const groups=tracks.map(track=>{
    const tasks=ledger.tasks.filter(t=>t.track===track),open=tasks.filter(t=>t.trackerState==='open'),closed=tasks.filter(t=>t.trackerState==='closed');
    return `<section><h2>${escape(track[0].toUpperCase()+track.slice(1))} tasks</h2>${open.map(task).join('')}${closed.length?`<details class="foundation"><summary>Implemented foundation / ${closed.length} closed records</summary>${closed.map(task).join('')}</details>`:''}</section>`;
  }).join('');
  return page('Delivery map','delivery/',`<p class="lead">One implementation history, separate acceptance gates.</p><p>${escape(ledger.policy)}</p><p>The original v0.9 backlog has ${counts.originalClosed}/14 closed issues at this snapshot. Optional case-study tasks remain in that denominator. This is issue closure, not an estimate of code completion.</p><p>Native masters, report and bounded export/CLI acceptance in #8/#9/#11/#12 are implemented. Optional analytic vector screens remain separate in #28. “Needs” records the named capability, not a blanket requirement that every checkbox in that umbrella closes first.</p><section><h2>Current sequence</h2><ol>${ledger.nextSequence.map(x=>`<li>${escape(x)}</li>`).join('')}</ol></section>${milestones}<section><h2>Integration and branches</h2>${ledger.branches.map(b=>`<h3><code>${escape(b.name)}</code> / ${escape(b.status)}</h3><p>${escape(b.note)}</p>`).join('')}<p>The <a href="${escape(ledger.nativeTracking.milestone.url)}">native v0.9 milestone</a> contains original issues #1–#14. The existing <a href="${escape(ledger.nativeTracking.project.url)}">private Project</a> has Priority/Area fields and a <a href="${escape(ledger.nativeTracking.backlogView.url)}">saved priority-sorted table</a>. Access is unchanged. The <a href="${escape(ledger.nativeTracking.statusBoard.url)}">status board</a> and all 11 workflow configurations are verified. Done closes the linked issue; acceptance gates stay in review until accepted. Release targets here remain conditional.</p></section>${groups}<p class="small">Snapshot ${ledger.updatedAt}. Source: <a href="${ledger.repository}/blob/main/docs/data/delivery-ledger.json">versioned delivery ledger</a>. Implementation changes and acceptance should update it in the same PR.</p>`);
}
function changes(){
  const entries=changelog.entries.map(e=>{
    const evidence=[...(e.prs||[]).map(n=>`<a href="${ledger.repository}/pull/${n}">PR #${n}</a>`),...(e.issues||[]).map(n=>issue(n))].join(' · ');
    return `<article class="change-entry"><time datetime="${escape(e.date)}">${escape(e.date)}</time><div><p class="change-state">${escape(e.status)}</p><h2>${escape(e.title)}</h2><p class="change-summary">${escape(e.changes[0]||'')}</p><details><summary>Details and sources</summary><ul>${e.changes.slice(1).map(x=>`<li>${escape(x)}</li>`).join('')}</ul>${evidence?'<p class="change-evidence">Evidence: '+evidence+'</p>':''}</details></div></article>`;
  }).join('');
  return page('Changelog','changelog/',`<p class="lead">What changed in Stiprā's development.</p><p class="small">${escape(changelog.releaseStatus)} These entries document development, not public release announcements. <a href="../roadmap/">See current priorities and releases</a>.</p><div class="change-list">${entries}</div>`);
}
/** Generates static information pages and relative navigation for either subpath host. */
function build(stage){
  validate();stage=path.resolve(stage);for(const [route,html]of [['roadmap',roadmap()],['delivery',delivery()],['changelog',changes()],['sitemap',page('Site map','sitemap/',`<p class="lead">Choose where to go. Each destination has a specific job.</p><ul class="site-map">${ROUTES.map(([route,label,note])=>`<li><a href="../${route}">${escape(label)}</a><p>${escape(note)}</p></li>`).join('')}</ul><p>Primary host: <a href="${ledger.primary}">${ledger.primary}</a><br>Mirror: <a href="${ledger.mirror}">${ledger.mirror}</a></p><p><a href="../sitemap.xml">Machine-readable sitemap</a> · <a href="${ledger.repository}">Repository / issues / notices</a></p>`)]]){fs.mkdirSync(path.join(stage,route),{recursive:true});fs.writeFileSync(path.join(stage,route,'index.html'),html);}
  fs.copyFileSync(path.join(ROOT,'web/stipra/roadmap.css'),path.join(stage,'roadmap/roadmap.css'));
  fs.writeFileSync(path.join(stage,'roadmap/history.json'),JSON.stringify(productHistory,null,2)+'\n');
  const idx=ProductRoadmap.buildIndex(productHistory,ledger,changelog);
  fs.writeFileSync(path.join(stage,'roadmap/search-index.js'),'window.STIPRA_ROADMAP_INDEX='+JSON.stringify(idx).replace(/</g,'\\u003c')+';\n');
  fs.copyFileSync(path.join(ROOT,'web/stipra/roadmap-search.js'),path.join(stage,'roadmap/roadmap-search.js'));
  const pageFile=path.join(stage,'roadmap/index.html');
  fs.writeFileSync(pageFile,fs.readFileSync(pageFile,'utf8').replace('</body>','<script defer src="./search-index.js"></script><script defer src="./roadmap-search.js"></script></body>'));
  for(const route of ROUTES){const file=path.join(stage,route[0].endsWith('.html')?route[0]:route[0]+'index.html');if(!fs.existsSync(file))throw Error('Missing public destination '+file);let html=fs.readFileSync(file,'utf8');
    const description=route[2]+' Local-first printmaking; experimental digital proofs.';
    if(!/<meta\s+name=["']description["']/i.test(html))html=html.replace('</head>','<meta name="description" content="'+escape(description)+'"></head>');
    if(!/<link\s+rel=["']canonical["']/i.test(html))html=html.replace('</head>','<link rel="canonical" href="'+escape(ledger.primary+route[0])+'"></head>');
    if(!html.includes('class="site-nav"')){const prefix=path.relative(path.dirname(file),stage).split(path.sep).join('/')||'.',nav=navigation(prefix+'/',route[0]);html=html.replace(/(<body\b[^>]*>)/i,'$1'+nav);}
    if(!html.includes('class="skip-link"')){if(!/<main\b/.test(html))throw Error('Missing main destination '+file);html=html.replace(/<main\b/,'<main id="main-content" tabindex="-1"');html=html.replace(/(<body\b[^>]*>)/i,'$1<a class="skip-link" href="#main-content">Skip to content</a>');}fs.writeFileSync(file,html);}
  fs.writeFileSync(path.join(stage,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+ROUTES.map(([route])=>'<url><loc>'+escape(ledger.primary+route)+'</loc></url>').join('')+'</urlset>\n');
  return {routes:ROUTES.map(x=>x[0]),tasks:ledger.tasks.length};
}
module.exports={build,validate,ROUTES,navigation};
