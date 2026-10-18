'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
test('roadmap CSS has one current implementation, not old v3 styles and override layers',()=>{
 const css=read('web/stipra/roadmap.css');
 const original=read('tests/fixtures/roadmap-before-good-css.css');
 assert.ok(css.length<original.length*0.65,'Consolidation should remove obsolete cascade layers');
 assert.doesNotMatch(css,/Roadmap v3:|Taste pass:|Impeccable Read-mode refinement:/);
 for(const obsolete of ['.r-topline','.r-snapshot','.r-journal-entry','.r-initiative','.r-display','.r-compact-list']){
   assert.ok(!css.includes(obsolete),'Legacy selector remains: '+obsolete);
 }
 for(const needed of ['.r-head','.r-overview','.r-priority','.r-release','.r-record','.r-section-head','.r-search']){
   assert.ok(css.includes(needed),'Current component missing: '+needed);
 }
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/summary::after/);
 assert.match(css,/focus-visible/);
});
test('responsive rules stay intentional and visual test fixture remains available',()=>{
 const css=read('web/stipra/roadmap.css');
 const queries=[...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map(x=>Number(x[1]));
 assert.deepEqual(queries,[700,480,360]);
 assert.ok(fs.existsSync(path.join(root,'scripts/verify-roadmap-css-visual.js')));
 assert.ok(fs.existsSync(path.join(root,'.agents/skills/good-css/SKILL.md')));
});
