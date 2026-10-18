'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {evaluate,gate}=require('../scripts/check-release-artifact');
const ROOT=path.resolve(__dirname,'..');
test('artifact gates reject missing evidence, unknown classes and unresolved bundle findings',()=>{
  const browser={contract:'stipra-browser-export-audit-v1',status:'checked',findings:[],artifactEvidence:[],fontkitSource:{status:'source-inventory-checked'},inputs:[{path:'src/test.js'}],outputs:[{path:'test.js'}]};
  assert.equal(evaluate('browser',browser).status,'checked');
  for(const change of [{contract:'wrong'},{status:'review-required'},{findings:[{kind:'incomplete-notice'}]},
    {artifactEvidence:[{identity:'matches-record',distribution:'review-required'}]},
    {fontkitSource:{status:'unknown'}},{inputs:[]},{outputs:[]},{findings:undefined},
    {inputs:[{path:'node_modules/skia-canvas/lib/skia.node'}]}])assert.throws(()=>evaluate('browser',{...browser,...change}));
  for(const artifact of ['lean','browser','native'])assert.throws(()=>evaluate(artifact,{}));
  assert.throws(()=>evaluate('container',browser),/Choose an artifact/);
  const lean={contract:'stipra-library-candidate-v1',status:'verified-packed-candidate',packages:['core','canvas','inputs'].map(name=>({name:'@yigit-denktas/stipra-'+name})),checks:{publicExports:true,esmCjsParity:true,canvasRegionCore:true,sourceUnchanged:true,regionReplay:true,offlineInstall:true,lifecycleScriptsDisabled:true,typescriptPublicExports:true}};
  assert.equal(evaluate('lean',lean).status,'checked');
  assert.throws(()=>evaluate('lean',{...lean,checks:{...lean.checks,offlineInstall:false}}));
  assert.throws(()=>evaluate('lean',{...lean,packages:lean.packages.slice(1)}));
  assert.throws(()=>evaluate('native',{contract:'stipra-dependency-audit-v1',status:'checked',findings:[]}));
});
test('native artifact gate replaces stale passing evidence with the unresolved notice block',async()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-native-gate-'));
  try{
    fs.mkdirSync(path.join(out,'release-gates'));
    fs.writeFileSync(path.join(out,'release-gates/native.json'),JSON.stringify({status:'checked'}));
    const report=await gate('native',out);
    assert.equal(report.status,'blocked');assert.equal(report.findings.length,1);
    assert.equal(report.findings[0].kind,'native-transitive-review');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'release-gates/native.json'))),report);
    const run=cp.spawnSync(process.execPath,[path.join(ROOT,'scripts/check-release-artifact.js'),'native'],{encoding:'utf8'});
    assert.equal(run.status,1);assert.equal(JSON.parse(run.stdout).status,'blocked');
    for(const args of [[],['unknown'],['lean','--ignore-findings']]){
      const invalid=cp.spawnSync(process.execPath,[path.join(ROOT,'scripts/check-release-artifact.js'),...args],{encoding:'utf8'});
      assert.equal(invalid.status,1);assert.match(invalid.stderr,/Usage:/);
    }
  }finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('Windows-style Git checkout preserves pinned notice bytes and still rejects tampering',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-notice-checkout-')),repo=path.join(temp,'repo'),checkout=path.join(temp,'checkout');
  const files=['.gitattributes','scripts/license-audit.js','licenses/third-party/MIT-terms.txt','licenses/third-party/supplements.json'];
  const git=args=>cp.execFileSync('git',['-c','core.autocrlf=true','-c','core.safecrlf=false',...args],{cwd:repo,stdio:'pipe'});
  try{
    fs.mkdirSync(repo);git(['init','--quiet']);
    for(const file of files){fs.mkdirSync(path.dirname(path.join(repo,file)),{recursive:true});fs.copyFileSync(path.join(ROOT,file),path.join(repo,file));}
    fs.writeFileSync(path.join(repo,'control.txt'),'Checkout control\n');
    git(['add','--',...files,'control.txt']);git(['checkout-index','--all','--force','--prefix='+checkout+'/']);
    assert.equal(fs.readFileSync(path.join(checkout,'control.txt'),'utf8'),'Checkout control\r\n');
    const terms=path.join(checkout,'licenses/third-party/MIT-terms.txt'),original=fs.readFileSync(path.join(ROOT,'licenses/third-party/MIT-terms.txt'));
    assert.deepEqual(fs.readFileSync(terms),original,'LF checkout must preserve exact pinned bytes');
    const {notices}=require(path.join(checkout,'scripts/license-audit.js'));
    assert.ok(notices(path.join(ROOT,'node_modules/dijkstrajs')).sources.some(x=>x.name.includes('Stipra supplement')));
    fs.writeFileSync(terms,original.toString().replace(/\n/g,'\r\n'));
    assert.throws(()=>notices(path.join(ROOT,'node_modules/dijkstrajs')),/Supplement terms changed/);
    fs.writeFileSync(terms,Buffer.concat([original,Buffer.from('changed')]));
    assert.throws(()=>notices(path.join(ROOT,'node_modules/dijkstrajs')),/Supplement terms changed/);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('a failed fresh check replaces a stale gate result with an error and exits nonzero',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-broken-gate-'));
  try{
    fs.mkdirSync(path.join(temp,'scripts'));fs.mkdirSync(path.join(temp,'out/release-gates'),{recursive:true});
    for(const file of ['check-release-artifact.js','artifact-evidence.js'])fs.copyFileSync(path.join(ROOT,'scripts',file),path.join(temp,'scripts',file));
    const reportFile=path.join(temp,'out/release-gates/lean.json');
    fs.writeFileSync(reportFile,JSON.stringify({status:'checked',evidence:{sha256:'stale'}}));
    const run=cp.spawnSync(process.execPath,[path.join(temp,'scripts/check-release-artifact.js'),'lean'],{encoding:'utf8'});
    assert.equal(run.status,1);
    const report=JSON.parse(fs.readFileSync(reportFile));
    assert.equal(report.status,'error');assert.match(report.error,/Cannot find module/);
    assert.equal(report.evidence,undefined);assert.equal(JSON.parse(run.stdout).status,'error');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
