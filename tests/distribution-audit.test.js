'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspect}=require('../scripts/check-distribution'),{verifyArtifacts,hash}=require('../scripts/artifact-evidence');
const ROOT=path.resolve(__dirname,'..');
function fixture(source='export const value=1;'){
  const policy={name:'@stipra/test',peers:[],entries:['index.mjs'],files:['LICENSE','README.md','package.json','index.mjs']};
  const files={'LICENSE':fs.readFileSync(path.join(ROOT,'LICENSE')),'README.md':Buffer.from('Test package.'),
    'package.json':Buffer.from(JSON.stringify({name:policy.name,version:'0.1.0-alpha.1',license:'MIT',private:false,publishConfig:{access:'public',registry:'https://registry.npmjs.org/',tag:'alpha'}})),
    'index.mjs':Buffer.from(source)};
  return {files,policy};
}
test('packed import audit rejects hidden imports, unlisted files and runtime dependencies',async()=>{
  const clean=fixture(),report=await inspect(clean.files,clean.policy);
  assert.equal(report.status,'checked');assert.equal(report.files.length,4);
  for(const source of ["import 'skia-canvas';", "export {x} from './missing.mjs';", "export const load=name=>import(name);", "export const load=name=>require(name);"]){
    const f=fixture(source);await assert.rejects(()=>inspect(f.files,f.policy));
  }
  const added=fixture();added.files['payload.wasm']=Buffer.from([0]);await assert.rejects(()=>inspect(added.files,added.policy),/packed files/);
  const dep=fixture();dep.files['package.json']=Buffer.from(JSON.stringify({name:dep.policy.name,version:'0.1.0-alpha.1',license:'MIT',private:false,publishConfig:{access:'public',registry:'https://registry.npmjs.org/',tag:'alpha'},dependencies:{'fonteditor-core':'2.6.3'}}));
  await assert.rejects(()=>inspect(dep.files,dep.policy),/runtime dependencies/);
  const notice=fixture();notice.files.LICENSE=Buffer.from('MIT');await assert.rejects(()=>inspect(notice.files,notice.policy),/MIT notice/);
});
test('packed audit rejects unintended publication identity, registry and tag',async()=>{
  for(const change of [{private:true},{version:'0.1.0'},{name:'other-package'},
    {publishConfig:{access:'public',registry:'https://example.org/',tag:'alpha'}},
    {publishConfig:{access:'public',registry:'https://registry.npmjs.org/',tag:'latest'}}]){
    const f=fixture(),pkg=JSON.parse(f.files['package.json']);
    f.files['package.json']=Buffer.from(JSON.stringify({...pkg,...change}));
    await assert.rejects(()=>inspect(f.files,f.policy));
  }
});
test('artifact identity rejects changed bytes or versions without clearing provenance',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-artifact-')),dir=path.join(root,'node_modules/example');fs.mkdirSync(dir,{recursive:true});
  const original=Buffer.from('unresolved upstream artifact'),record={package:'example',version:'1.0.0',artifact:'bundle.js',bytes:original.length,sha256:hash(original)};
  try{
    fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version:'1.0.0'}));fs.writeFileSync(path.join(dir,'bundle.js'),original);
    const [evidence]=verifyArtifacts(root,[record]);assert.equal(evidence.identity,'matches-record');assert.equal(evidence.distribution,'review-required');
    const [other]=verifyArtifacts(root,[{...record,platform:{os:'unrecorded-test-platform'}}]);assert.equal(other.identity,'unrecorded-platform');assert.equal(other.distribution,'review-required');
    fs.appendFileSync(path.join(dir,'bundle.js'),'changed');assert.throws(()=>verifyArtifacts(root,[record]),/bytes changed/);
    fs.writeFileSync(path.join(dir,'bundle.js'),original);fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version:'2.0.0'}));assert.throws(()=>verifyArtifacts(root,[record]),/version changed/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('browser exporter evidence identifies actual bundled artifacts and emitted notices',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-export-audit-'));
  try{
    const file=path.join(temp,'export.mjs'),report=await require('../scripts/build-browser-export').build(file,{format:'esm'});
    assert.equal(report.status,'checked');assert.equal(report.artifactEvidence.length,0);
    assert.equal(report.fontkitSource.status,'source-inventory-checked');assert.equal(report.findings.length,0);
    assert.ok(report.inputs.some(x=>x.path==='node_modules/fontkit/dist/browser.cjs'));
    assert.ok(!report.inputs.some(x=>/node_modules\/brotli\/(enc|build|compress)/.test(x.path)));
    assert.ok(!report.packages.some(x=>['skia-canvas','fonteditor-core'].includes(x.name)));
    assert.ok(report.inputs.every(x=>!path.isAbsolute(x.path)));
    for(const item of report.outputs)assert.equal(hash(fs.readFileSync(path.join(temp,item.path))),item.sha256);
    assert.ok(report.outputs.some(x=>x.path==='export-dependency-notices.txt'));
    assert.ok(!fs.readFileSync(file+'.audit.json','utf8').includes(ROOT));
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
