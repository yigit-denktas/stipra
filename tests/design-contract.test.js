'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('documented public design tokens match the real browser stylesheet',()=>{
  const contract=get('design/CONTRACT.md');
  const css=get('web/stipra/shared.css');
  const rows=[...contract.matchAll(/^\|\s*`(--[\w-]+)`\s*\|\s*`(#[0-9a-f]{6,8})`\s*\|/gmi)];
  assert.ok(rows.length>=7,'Design contract must document the seven current visual tokens');
  for(const [,name,value] of rows){
    const pattern=new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:\\s*('+value+')(?=[;}]|\\s)');
    assert.match(css,pattern,'Out-of-date design token: '+name+' '+value);
  }
  assert.match(css,/@font-face\s*\{font-family:Plex/,'Real IBM Plex font must remain declared');
  assert.match(css,/a:focus-visible/,'Focusable links must have a visible focus treatment');
});

test('Stiprā design contract is agent-discoverable and distinguishes decisions from evidence',()=>{
  const agents=get('AGENTS.md'),principles=get('DESIGN.md'),index=get('design/README.md');
  const decisions=get('design/DECISIONS.md'),review=get('design/REVIEW.md');
  for(const name of ['CONTRACT.md','PATTERNS.md','DECISIONS.md','REVIEW.md']){
    assert.ok(fs.existsSync(path.join(ROOT,'design',name)),name+' missing');
    assert.ok(index.includes(name),'Design index does not link '+name);
    assert.ok(agents.includes('design/'+name),'Agent instructions do not link '+name);
  }
  assert.match(principles,/design\/CONTRACT\.md/,'Product design brief must link the public contract');
  for(const term of ['Implementation','Acceptance','Publication'])assert.ok(get('design/CONTRACT.md').includes(term));
  for(const id of ['D-002','D-003','D-004','D-009'])assert.ok(decisions.includes(id));
  for(const task of ['Journey A','Journey B','Journey C'])assert.ok(review.includes(task));
  assert.match(review,/Owner acceptance: pending/,'Review must distinguish owner approval from execution');
});
