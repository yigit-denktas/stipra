'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {Canvas}=require('skia-canvas'),JSZip=require('jszip'),{verify}=require('../src/verify-package');
const ROOT=path.resolve(__dirname,'..'),CLI=path.join(ROOT,'bin/stipra.js'),hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-workflow-')),c=new Canvas(32,24),ctx=c.getContext('2d');
  ctx.fillStyle='#0D4DAD';ctx.fillRect(0,0,16,24);ctx.fillStyle='#FF665D';ctx.fillRect(7,8,25,12);ctx.fillStyle='rgba(226,165,35,.5)';ctx.fillRect(20,0,6,8);
  fs.writeFileSync(path.join(dir,'source.png'),c.toBufferSync('png'));return dir;
}
function cli(args){const r=cp.spawnSync(process.execPath,[CLI,...args,'--json'],{cwd:ROOT,encoding:'utf8',timeout:90000,maxBuffer:1024*1024});if(r.error)throw r.error;return {...r,body:JSON.parse(r.stdout)};}
function plan(dir,name,value){const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(value));return file;}
test('compare and batch share reproducible packages, proof exports and verified reports',async()=>{
  const dir=fixture();
  try{
    const spec={version:1,dpi:300,paper:'rag',exports:{formats:['png','jpg','webp','svg'],scale:2,alpha:'source',vectorPlates:true},variants:[{id:'two',style:'editorial-halftone',styleVariant:'tonal-key',seed:142},{id:'three',style:'editorial-halftone',styleVariant:'warm-third',seed:142}]};
    const config=plan(dir,'compare.json',spec),out=path.join(dir,'compare');
    const r=cli(['compare','--input',path.join(dir,'source.png'),'--config',config,'--out',out]);assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(r.body.status,'ok');
    const jobs=r.body.result.jobs;assert.equal(jobs.length,2);assert.deepEqual(jobs.map(j=>j.inks),[2,3]);assert.equal(jobs[0].sourceSha256,jobs[1].sourceSha256);
    for(const j of jobs){
      const data=fs.readFileSync(path.join(out,j.package)),v=await verify(data);assert.equal(v.status,'VERIFIED_DIGITAL_NOT_PHYSICALLY_VALIDATED');assert.equal(v.manifest.exports.proofs.length,4);
      assert.equal(v.frame.width,32);assert.equal(v.manifest.exports.proofs[0].width,64);assert.equal(v.manifest.output.resampled,false);
      const z=await JSZip.loadAsync(data);for(const ink of v.manifest.inks)assert.ok(z.file(ink.vector));
      assert.match(fs.readFileSync(path.join(out,'index.html'),'utf8'),/No automatic aesthetic winner/);
    }
    const original=hash(fs.readFileSync(path.join(out,'two.zip'))),again=cli(['compare','--input',path.join(dir,'source.png'),'--config',config,'--out',out]);assert.notEqual(again.status,0);assert.equal(hash(fs.readFileSync(path.join(out,'two.zip'))),original);
    const batchSpec={version:1,jobs:spec.variants.map(v=>({...v,input:'source.png',dpi:300,paper:'rag',exports:spec.exports}))},batch=path.join(dir,'batch');
    const b=cli(['batch','--config',plan(dir,'batch.json',batchSpec),'--out',batch]);assert.equal(b.status,0,b.stdout);assert.deepEqual(b.body.result.jobs.map(x=>x.packageSha256),jobs.map(x=>x.packageSha256));
    const sheet=cli(['sheet','--input',path.join(out,'two.zip'),'--out',path.join(dir,'sheet')]);assert.equal(sheet.status,0,sheet.stdout);assert.ok(fs.readFileSync(path.join(dir,'sheet/separation-sheet.pdf')).length>1000);
    const inspect=cli(['verify','--input',path.join(out,'two.zip')]);assert.equal(inspect.status,0);assert.equal(inspect.body.result.packageSha256,jobs[0].packageSha256);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('CLI rejects unsafe or invalid plans before output and reports runtime job failures individually',()=>{
  const dir=fixture();
  try{
    const base={id:'good',input:'source.png',style:'clean-linework'};
    const cases=[{version:2,jobs:[base]},{version:1,jobs:[base,base]},{version:1,jobs:[{...base,id:'../escape'}]},{version:1,jobs:[{...base,input:'https://example.com/a.png'}]},{version:1,jobs:[{...base,execute:'echo nope'}]}];
    for(let i=0;i<cases.length;i++){const out=path.join(dir,'invalid'+i),r=cli(['batch','--config',plan(dir,'bad'+i+'.json',cases[i]),'--out',out]);assert.notEqual(r.status,0);assert.equal(r.body.status,'error');assert.equal(fs.existsSync(out),false);}
    const spec={version:1,jobs:[base,{...base,id:'too-many-runs',exports:{formats:['svg'],vectorPlates:true}}]};
    // A valid job can exceed the vector complexity budget during rendering.
    const checker=new Canvas(600,500),ctx=checker.getContext('2d'),image=ctx.createImageData(600,500);
    for(let y=0;y<500;y++)for(let x=0;x<600;x++){const value=(x+y)%2?255:0;image.data.set([value,value,value,255],(y*600+x)*4);}ctx.putImageData(image,0,0);
    fs.writeFileSync(path.join(dir,'checker.png'),checker.toBufferSync('png'));
    spec.jobs[1]={...base,id:'complex',input:'checker.png',exports:{formats:['svg']}};
    const out=path.join(dir,'partial'),r=cli(['batch','--config',plan(dir,'partial.json',spec),'--out',out]);
    assert.equal(r.status,1,r.stdout);assert.equal(r.body.status,'partial');assert.deepEqual(r.body.result.jobs.map(j=>j.status),['ok','error']);assert.ok(fs.existsSync(path.join(out,'good.zip')));
    assert.equal(cli(['no-such-command']).body.status,'error');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('verification rejects byte tampering, unlisted entries and false master metadata',async()=>{
  const dir=fixture();
  try{
    const out=path.join(dir,'batch'),r=cli(['batch','--config',plan(dir,'jobs.json',{version:1,jobs:[{id:'base',input:'source.png',style:'clean-linework'}]}),'--out',out]);assert.equal(r.status,0,r.stdout);
    const bytes=fs.readFileSync(path.join(out,'base.zip'));
    for(const kind of ['bytes','unlisted','coverage','origin']){
      const zip=await JSZip.loadAsync(bytes),m=JSON.parse(await zip.file('manifest.json').async('string'));
      if(kind==='bytes')zip.file(m.inks[0].plate,Buffer.from('bad'));
      if(kind==='unlisted')zip.file('unexpected.bin',Buffer.from([1]));
      if(kind==='coverage')m.inks[0].meanCoverage=.123456;
      if(kind==='origin')m.output.origin.x=1;
      zip.file('manifest.json',JSON.stringify(m));await assert.rejects(()=>verifyZip(zip));
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
async function verifyZip(zip){return verify(await zip.generateAsync({type:'nodebuffer'}));}
