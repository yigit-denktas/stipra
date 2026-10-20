'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),names=["design-maturity-review","design-taste-frontend","good-css","impeccable","awwwards","jury"];
const open=p=>fs.readFileSync(path.join(root,p));
const openText=p=>open(p).toString('utf8').replace(/\r\n/g,'\n');
const gitBlobBytes=p=>cp.execFileSync('git',['cat-file','blob',`HEAD:${p}`],{cwd:root,maxBuffer:64*1024*1024});
const exists=p=>fs.existsSync(path.join(root,p));
function gitBlob(buf){return crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex')}
function isBinary(bytes){return bytes.includes(0);}
function assertVendorContent(name,committed,working){
  if(isBinary(committed))assert.deepEqual(working,committed,name+': binary vendor bytes changed');
  else assert.equal(working.toString('latin1').replace(/\r\n/g,'\n'),committed.toString('latin1').replace(/\r\n/g,'\n'),name+': vendor content changed beyond LF/CRLF');
}
test('design skills have canonical files, Claude discovery and local licenses',()=>{
 for(const name of names){
  const base='.agents/skills/'+name,source=base+'/SKILL.md',shim='.claude/skills/'+name+'/SKILL.md';
  assert.ok(exists(source),name+' main SKILL.md absent');
  assert.ok(exists(shim),name+' Claude discovery shim absent');
  assert.match(openText(source),new RegExp('^---\\s*\\nname: '+name+'\\s*\\n'));
  assert.ok(openText(shim).includes('../../../.agents/skills/'+name+'/SKILL.md'));
 }
 assert.ok(exists('.agents/skills/good-css/LICENSE'));
 assert.ok(exists('.agents/skills/design-taste-frontend/LICENSE'));
 assert.ok(exists('.agents/skills/impeccable/LICENSE'));
 assert.ok(exists('.agents/skills/design-maturity-review/README-STIPRA.md'));
});
test('design skill local links resolve',()=>{
 for(const name of names){
  const base='.agents/skills/'+name,source=openText(base+'/SKILL.md');
  for(const match of source.matchAll(/\]\(([^)]+)\)/g)){
   const link=match[1].split('#')[0];if(!link||/^[a-z]+:\/\//i.test(link)||link.startsWith('mailto:'))continue;
   const full=path.normalize(path.join(base,decodeURIComponent(link)));
   assert.ok(exists(full),name+' broken reference: '+link);
  }
 }
});
test('design skill Impeccable vendor matches committed Git blobs and working tree',()=>{
 const lock=JSON.parse(open('design/skills.lock.json'));
 assert.equal(lock.sourceRevision,'ab524607fdea');
 assert.equal(lock.files.length,62);
 for(const file of lock.files){
  const committed=gitBlobBytes(file.path),working=open(file.path);
  assert.equal(committed.length,file.bytes,'unexpected committed size: '+file.path);
  assert.equal(gitBlob(committed),file.sha,'upstream SHA mismatch: '+file.path);
  assertVendorContent(file.path,committed,working);
 }
});

test('juliobsz skills match committed Git blobs and working tree',()=>{
 const lock=JSON.parse(open('design/juliobsz-skills.lock.json'));
 assert.equal(lock.revision,'f193f6745aae738e9d54a0ca28792822e4777a63');
 assert.equal(lock.files.length,32);
 for(const file of lock.files){
  const committed=gitBlobBytes(file.path),working=open(file.path);
  assert.equal(committed.length,file.bytes,file.path);
  assert.equal(crypto.createHash('sha256').update(committed).digest('hex'),file.sha256,file.path);
  assertVendorContent(file.path,committed,working);
 }
});
test('vendor content regressions accept newline-only changes and reject substantive edits for both inventories',()=>{
 for(const lockFile of ['design/skills.lock.json','design/juliobsz-skills.lock.json']){
  const lock=JSON.parse(open(lockFile));
  const textFile=lock.files.find(file=>{const b=gitBlobBytes(file.path);return !isBinary(b)&&b.includes(10);});
  assert.ok(textFile,lockFile+': no text fixture');
  const committed=gitBlobBytes(textFile.path);
  const crlf=Buffer.from(committed.toString('latin1').replace(/\r\n/g,'\n').replace(/\n/g,'\r\n'),'latin1');
  assert.doesNotThrow(()=>assertVendorContent(textFile.path,committed,crlf),lockFile+': newline-only change rejected');
  const substantive=Buffer.concat([committed,Buffer.from('substantive edit\n')]);
  assert.throws(()=>assertVendorContent(textFile.path,committed,substantive),lockFile+': substantive text edit accepted');
  const binary=Buffer.from([0,1,2,13,10,255]);
  assert.doesNotThrow(()=>assertVendorContent(lockFile+'-binary',binary,Buffer.from(binary)),lockFile+': identical binary rejected');
  const changed=Buffer.from(binary);changed[1]^=1;
  assert.throws(()=>assertVendorContent(lockFile+'-binary',binary,changed),lockFile+': binary edit accepted');
 }
});
