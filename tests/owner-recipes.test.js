'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const fixtures=require('./fixtures/owner-photo-fixtures.json').fixtures;
const kind={A:'sculpture',B:'forest',C:'beach'};
const read=(id,part)=>JSON.parse(fs.readFileSync(path.join(root,'examples/recipes/owner-'+id+'-'+kind[id]+'-'+part+'.json'),'utf8'));

test('owner batch recipes retain 2/3/2 distinct inks and the legacy recipe substrates',()=>{
  const paper={A:'#fff9f0',B:'#faf5e5',C:'#fbf8ed'};
  for(const f of fixtures){
    const inks=read(f.id,'inks'),screens=read(f.id,'screens');
    assert.equal(inks.inks.length,f.plannedInks);
    assert.equal(new Set(inks.inks.map(i=>i.id)).size,f.plannedInks);
    assert.equal(inks.paper,paper[f.id]);
    assert.equal(screens.version,1);
    assert.equal(screens.seed,42);
    assert.doesNotMatch(JSON.stringify(inks)+JSON.stringify(screens),/\.(?:jpe?g|png)|IMG_/i);
  }
});

test('B keeps a compliant three-ink forest-balanced key plus chromatic and earth passes',()=>{
  const inks=read('B','inks'),screens=read('B','screens');
  assert.deepEqual(inks.inks.map(i=>i.id),['key','accent','earth']);
  assert.equal(inks.inks[0].source,'tone');
  assert.equal(inks.inks[0].gain,1);
  assert.equal(inks.inks[0].gamma,1.3);
  assert.equal(inks.inks[1].source,'yellow-density');
  assert.equal(inks.inks[1].grayRemoval,1);
  assert.equal(inks.inks[2].source,'match');
  assert.equal(inks.inks[2].target,'#a3a3a3');
  assert.equal(inks.inks[2].tolerance,.14);
  assert.equal(inks.inks[2].threshold,.3);
  assert.equal(inks.inks[2].gain,.5);
  assert.equal(inks.inks[2].gamma,1.4);
  assert.equal(screens.plates.key.mode,'solid');
  assert.equal(screens.plates.accent.mode,'dots');
  assert.equal(screens.plates.earth.mode,'dots');
});

test('A uses a continuous tonal key to avoid dot aliasing and C adopts the coast-tonal masks',()=>{
  const aInks=read('A','inks'),aScreens=read('A','screens');
  assert.equal(aInks.inks[0].source,'tone');
  assert.equal(aScreens.plates.slate.mode,'solid');
  assert.equal(aScreens.plates.ivory.mode,'solid');
  const cInks=read('C','inks'),cScreens=read('C','screens');
  assert.deepEqual(cInks.inks.map(i=>i.id),['blue','warm']);
  assert.equal(cInks.inks[0].source,'tone');
  assert.equal(cInks.inks[1].source,'yellow-density');
  assert.equal(cInks.inks[1].grayRemoval,.65);
  assert.equal(cScreens.plates.blue.mode,'solid');
  assert.equal(cScreens.plates.warm.mode,'dots');
});

test('owner batch runner rejects a mismatched fingerprint before creating the output directory',async()=>{
  const Runner=require('../scripts/owner-photo-batch');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-owner-runner-'));
  try{
    const sources=path.join(tmp,'sources'),target=path.join(tmp,'out');
    fs.mkdirSync(sources);
    fs.writeFileSync(path.join(sources,fixtures[0].originalFile),'not an owner photograph');
    await assert.rejects(()=>Runner.run(['--sources',sources,'--out',target]),/fingerprint mismatch/);
    assert.equal(fs.existsSync(target),false);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
