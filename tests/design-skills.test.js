'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),names=["design-maturity-review","design-taste-frontend","good-css","impeccable"];
const open=p=>fs.readFileSync(path.join(root,p));
const exists=p=>fs.existsSync(path.join(root,p));
function gitBlob(buf){return crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex')}
test('design skills have canonical files, Claude discovery and local licenses',()=>{
 for(const name of names){
  const base='.agents/skills/'+name,source=base+'/SKILL.md',shim='.claude/skills/'+name+'/SKILL.md';
  assert.ok(exists(source),name+' main SKILL.md absent');
  assert.ok(exists(shim),name+' Claude discovery shim absent');
  assert.match(open(source).toString(),new RegExp('^---\\s*\\nname: '+name+'\\s*\\n'));
  assert.ok(open(shim).toString().includes('../../../.agents/skills/'+name+'/SKILL.md'));
 }
 assert.ok(exists('.agents/skills/good-css/LICENSE'));
 assert.ok(exists('.agents/skills/design-taste-frontend/LICENSE'));
 assert.ok(exists('.agents/skills/impeccable/LICENSE'));
 assert.ok(exists('.agents/skills/design-maturity-review/README-STIPRA.md'));
});
test('design skill local links resolve',()=>{
 for(const name of names){
  const base='.agents/skills/'+name,source=open(base+'/SKILL.md').toString();
  for(const match of source.matchAll(/\]\(([^)]+)\)/g)){
   const link=match[1].split('#')[0];if(!link||/^[a-z]+:\/\//i.test(link)||link.startsWith('mailto:'))continue;
   const full=path.normalize(path.join(base,decodeURIComponent(link)));
   assert.ok(exists(full),name+' broken reference: '+link);
  }
 }
});
test('design skill Impeccable vendor exactly matches pinned upstream Git blobs',()=>{
 const lock=JSON.parse(open('design/skills.lock.json'));
 assert.equal(lock.sourceRevision,'ab524607fdea');
 assert.equal(lock.files.length,62);
 for(const file of lock.files){
  const bytes=open(file.path);
  assert.equal(bytes.length,file.bytes,'unexpected size: '+file.path);
  assert.equal(gitBlob(bytes),file.sha,'upstream SHA mismatch: '+file.path);
 }
});
