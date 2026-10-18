#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),ledger=require('../docs/data/delivery-ledger.json'),changelog=require('../docs/data/changelog.json');
const ProductRoadmap=require('./build-roadmap-page'),productHistory=require('../docs/data/product-history.json');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const issue=n=>`<a href="${ledger.repository}/issues/${n}">#${n}</a>`;
const ROUTES=[['','Studio','Import, separate, inspect and export.'],['guide/','Field guide','Read plates, print settings and reproduction instructions.'],['sketches/','Canvas / p5.js','Use an existing drawing with the lean local alpha.'],['sketches/global.html','p5 global example','A separate p5.js host script.'],['sketches/instance.html','p5 instance example','Instance-mode integration and authored ink layers.'],['regions/','Named regions','Keep foreground, distance and lettering independent.'],['roadmap/','Roadmap','Dependencies, version targets, gates and branch state.'],['changelog/','Changelog','Merged development history and release status.'],['sitemap/','Site map','All primary public destinations.']];
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
function navigation(prefix,current){return '<nav class="site-nav" aria-label="Site navigation">'+ROUTES.filter(([route])=>!route.endsWith('.html')).map(([route,label])=>`<a href="${prefix+route}"${route===current?' aria-current="page"':''}>${escape(label)}</a>`).join('')+'</nav>';}
function page(title,route,body){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>stiprā / ${escape(title)}</title><link rel="canonical" href="${ledger.primary+route}"><link rel="stylesheet" href="../shared.css">${route==='roadmap/'?'<link rel="stylesheet" href="./roadmap.css">':''}</head><body class="doc-page"><header><a class="wordmark" href="../">stiprā</a><p class="eyebrow">Local printmaking / development record</p><h1>${escape(title)}</h1></header><main>${body}</main><footer>Experimental digital effect. Packages remain unpublished; physical print quality and final identity require their own acceptance. <a href="${ledger.repository}">Source and notices</a></footer></body></html>`;}
function roadmap(){return page('Roadmap','roadmap/',ProductRoadmap.render(productHistory,ledger,changelog));}
function changes(){return page('Changelog','changelog/',`<p class="lead">${escape(changelog.releaseStatus)}</p><p>Library package versions, studio milestone targets and recipe versions are separate. See the <a href="../roadmap/">roadmap gates</a> before interpreting a development change as a release.</p>${changelog.entries.map(e=>`<section><p class="eyebrow">${escape(e.date)} / ${escape(e.status)}</p><h2>${escape(e.title)}</h2><ul>${e.changes.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p>${(e.prs||[]).map(n=>`<a href="${ledger.repository}/pull/${n}">PR #${n}</a>`).join(' · ')}${e.issues?.length?' · '+e.issues.map(issue).join(' · '):''}</p></section>`).join('')}`);}
/** Generates static information pages and relative navigation for either subpath host. */
function build(stage){
  validate();stage=path.resolve(stage);for(const [route,html]of [['roadmap',roadmap()],['changelog',changes()],['sitemap',page('Site map','sitemap/',`<p class="lead">Find the studio, instructions and development record.</p><ul class="site-map">${ROUTES.map(([route,label,note])=>`<li><a href="../${route}">${escape(label)}</a><p>${escape(note)}</p></li>`).join('')}</ul><p>Primary host: <a href="${ledger.primary}">${ledger.primary}</a><br>Mirror: <a href="${ledger.mirror}">${ledger.mirror}</a></p><p><a href="../sitemap.xml">Machine-readable sitemap</a> · <a href="${ledger.repository}">Repository / issues / notices</a></p>`)]]){fs.mkdirSync(path.join(stage,route),{recursive:true});fs.writeFileSync(path.join(stage,route,'index.html'),html);}
  fs.copyFileSync(path.join(ROOT,'web/stipra/roadmap.css'),path.join(stage,'roadmap/roadmap.css'));
  fs.writeFileSync(path.join(stage,'roadmap/history.json'),JSON.stringify(productHistory,null,2)+'\n');
  const idx=ProductRoadmap.buildIndex(productHistory,ledger,changelog);
  fs.writeFileSync(path.join(stage,'roadmap/search-index.js'),'window.STIPRA_ROADMAP_INDEX='+JSON.stringify(idx).replace(/</g,'\\u003c')+';\n');
  fs.copyFileSync(path.join(ROOT,'web/stipra/roadmap-search.js'),path.join(stage,'roadmap/roadmap-search.js'));
  const pageFile=path.join(stage,'roadmap/index.html');
  fs.writeFileSync(pageFile,fs.readFileSync(pageFile,'utf8').replace('</body>','<script defer src="./search-index.js"></script><script defer src="./roadmap-search.js"></script></body>'));
  for(const route of ROUTES){const file=path.join(stage,route[0].endsWith('.html')?route[0]:route[0]+'index.html');if(!fs.existsSync(file))throw Error('Missing public destination '+file);let html=fs.readFileSync(file,'utf8');if(!html.includes('class="site-nav"')){const prefix=path.relative(path.dirname(file),stage).split(path.sep).join('/')||'.',nav=navigation(prefix+'/',route[0]);html=html.replace(/(<body\b[^>]*>)/i,'$1'+nav);}
    if(!html.includes('class="skip-link"')){if(!/<main\b/.test(html))throw Error('Missing main destination '+file);html=html.replace(/<main\b/,'<main id="main-content" tabindex="-1"');html=html.replace(/(<body\b[^>]*>)/i,'$1<a class="skip-link" href="#main-content">Skip to content</a>');}fs.writeFileSync(file,html);}
  fs.writeFileSync(path.join(stage,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+ROUTES.map(([route])=>'<url><loc>'+escape(ledger.primary+route)+'</loc></url>').join('')+'</urlset>\n');
  return {routes:ROUTES.map(x=>x[0]),tasks:ledger.tasks.length};
}
module.exports={build,validate,ROUTES,navigation};
