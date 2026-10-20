'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');

function git(cwd,args){
  return cp.execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
function copyPackage(dest){
  fs.mkdirSync(path.join(dest,'src'),{recursive:true});
  fs.copyFileSync(path.join(ROOT,'src/build-info.js'),path.join(dest,'src/build-info.js'));
  fs.copyFileSync(path.join(ROOT,'package.json'),path.join(dest,'package.json'));
}
function identity(packageRoot){
  const modulePath=path.join(packageRoot,'src/build-info.js');
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath).resolveIdentity(packageRoot);
}
function repo(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-build-id-'));
  copyPackage(dir);
  git(dir,['init','-q']);git(dir,['config','user.email','test@example.invalid']);git(dir,['config','user.name','Test']);
  git(dir,['add','.']);git(dir,['commit','-qm','initial']);
  return dir;
}

test('clean Git worktree reports the verified commit and no dirtiness',()=>{
  const dir=repo();
  try{
    fs.writeFileSync(path.join(dir,'.gitignore'),'dist/\n');
    git(dir,['add','.gitignore']);git(dir,['commit','-qm','ignore generated output']);
    const id=identity(dir);
    assert.equal(id.commit,git(dir,['rev-parse','HEAD']).toLowerCase());
    assert.equal(id.commitSource,'git');
    assert.equal(id.verified,true);
    assert.equal(id.dirty,false);
    fs.mkdirSync(path.join(dir,'dist'));
    fs.writeFileSync(path.join(dir,'dist/generated.js'),'ignored build output\n');
    assert.equal(identity(dir).dirty,false,'ignored generated files do not create false dirtiness');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('modified tracked source is marked dirty while retaining the base commit',()=>{
  const dir=repo();
  try{
    const before=git(dir,['rev-parse','HEAD']).toLowerCase();
    fs.appendFileSync(path.join(dir,'src/build-info.js'),'\n// dirty fixture\n');
    const id=identity(dir);
    assert.equal(id.commit,before);
    assert.equal(id.commitSource,'git');
    assert.equal(id.verified,true);
    assert.equal(id.dirty,true);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('a linked worktree resolves to its own root and clean commit',()=>{
  const dir=repo(),wt=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-build-wt-'));
  try{
    fs.rmSync(wt,{recursive:true,force:true});
    git(dir,['worktree','add','-q',wt,git(dir,['rev-parse','HEAD'])]);
    const id=identity(wt);
    assert.equal(id.commit,git(wt,['rev-parse','HEAD']).toLowerCase());
    assert.equal(id.commitSource,'git');
    assert.equal(id.verified,true);
    assert.equal(id.dirty,false);
  }finally{fs.rmSync(wt,{recursive:true,force:true});fs.rmSync(dir,{recursive:true,force:true});}
});

test('missing Git metadata reports unknown identity instead of borrowing a parent repo',()=>{
  const bare=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-build-nogit-'));
  const parent=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-build-parent-'));
  try{
    copyPackage(bare);
    assert.deepEqual(identity(bare),{name:'stipra',version:'0.1.0',commit:null,commitSource:'unknown',verified:false,dirty:null});
    fs.mkdirSync(path.join(parent,'vendor'),{recursive:true});
    git(parent,['init','-q']);git(parent,['config','user.email','test@example.invalid']);git(parent,['config','user.name','Test']);
    fs.writeFileSync(path.join(parent,'README.md'),'unrelated application\n');
    copyPackage(path.join(parent,'vendor/stipra'));
    git(parent,['add','.']);git(parent,['commit','-qm','application']);
    assert.deepEqual(identity(path.join(parent,'vendor/stipra')),{name:'stipra',version:'0.1.0',commit:null,commitSource:'unknown',verified:false,dirty:null});
  }finally{fs.rmSync(bare,{recursive:true,force:true});fs.rmSync(parent,{recursive:true,force:true});}
});

test('explicit commit overrides are validated and attributed as unverified claims',()=>{
  const dir=repo(),old=process.env.STIPRA_BUILD_COMMIT;
  try{
    const commit='a'.repeat(40);
    process.env.STIPRA_BUILD_COMMIT=commit;
    const id=identity(dir);
    assert.equal(id.commit,commit);assert.equal(id.commitSource,'environment');assert.equal(id.verified,false);assert.equal(id.dirty,null);
    process.env.STIPRA_BUILD_COMMIT='not-a-commit';
    assert.throws(()=>identity(dir),/40-character commit SHA/);
  }finally{
    if(old===undefined)delete process.env.STIPRA_BUILD_COMMIT;else process.env.STIPRA_BUILD_COMMIT=old;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test('browser bundle and audit consume one frozen build identity',async()=>{
  const dir=fs.mkdtempSync(path.join(ROOT,'.stipra-build-identity-')),out=path.join(dir,'export.js');
  const oldTemp=process.env.TEMP,oldTmp=process.env.TMP;
  try{
    process.env.TEMP=dir;process.env.TMP=dir;
    const expected=require('../src/build-info').resolveIdentity();
    const {build}=require('../scripts/build-browser-export');
    await build(out);
    const audit=JSON.parse(fs.readFileSync(out+'.audit.json','utf8'));
    assert.deepEqual(audit.build,expected);
    if(expected.commit)assert.ok(fs.readFileSync(out,'utf8').includes(expected.commit));
  }finally{
    if(oldTemp===undefined)delete process.env.TEMP;else process.env.TEMP=oldTemp;
    if(oldTmp===undefined)delete process.env.TMP;else process.env.TMP=oldTmp;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
