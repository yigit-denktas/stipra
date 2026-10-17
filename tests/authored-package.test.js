'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const JSZip=require('jszip'),Package=require('../src/print-package'),Core=require('../src/sdk'),{ingestLocalBytes}=require('../src/import/node');
function input(){
  const width=31,height=19;
  return {width,height,paper:'#f5eee2',inks:['#006043','#ff665d','#0d4dad'].map((color,i)=>({id:'ink-'+i,name:'Ink '+i,color,
    coverage:Uint8Array.from({length:width*height},(_,p)=>i===2?(p%17===0?255:0):((p*7+i*31)%256))}))};
}
const screenRecipe={version:1,seed:42,default:{mode:'dots',pitch:6,angle:23,registration:{x:2,y:-1}},plates:{'ink-2':{mode:'solid'}}};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('authored source and production masks survive the shared package writer exactly',async()=>{
  const source=input(),before=source.inks.map(x=>x.coverage.slice()),direct=Core.renderLayers(source,{dpi:300,screenRecipe});
  const result=await Package.generateLayers({input:source,dpi:300,screenRecipe,reportTexture:'none'});
  const zip=await JSZip.loadAsync(result.zip),descriptor=JSON.parse(await zip.file('source/original.json').async('string'));
  assert.equal(result.manifest.mode,'authored');assert.equal(descriptor.contract,'stipra-authored-source-v1');
  assert.equal(result.manifest.output.trimMm.width,Number((31*25.4/300).toFixed(4)));
  for(let i=0;i<3;i++){
    assert.deepEqual(source.inks[i].coverage,before[i]);
    assert.equal(descriptor.inks[i].coverageSha256,hash(before[i]));
    for(const [file,expected] of [[descriptor.inks[i].path,before[i]],[result.manifest.inks[i].plate,before[i]],[result.manifest.inks[i].screened,direct.plates[i].screened]]){
      const image=await ingestLocalBytes(await zip.file(file).async('nodebuffer'));
      assert.deepEqual(image.metadata.oriented,{width:31,height:19});
      assert.deepEqual(Uint8Array.from({length:31*19},(_,p)=>255-image.rgba[p*4]),expected);
    }
  }
  assert.deepEqual(direct.plates[2].screened,before[2],'solid lettering pass stays unscreened');
  const proof=await ingestLocalBytes(await zip.file('proof/composite.png').async('nodebuffer'));assert.deepEqual(proof.rgba,direct.proof.rgba);
  for(const file of result.manifest.files)assert.equal(hash(await zip.file(file.path).async('nodebuffer')),file.sha256);
  const replay=await Package.generateLayers(await require('../scripts/reproduce-layers').readSnapshot(result.zip));
  for(const ink of result.manifest.inks)assert.deepEqual(replay.parts.get(ink.screened),result.parts.get(ink.screened));
});
test('paper presentation and proof registration cannot change authored masters',async()=>{
  const source=input(),a=await Package.generateLayers({input:source,screenRecipe,reportTexture:'none'}),b=await Package.generateLayers({input:source,
    screenRecipe:{...screenRecipe,default:{...screenRecipe.default,registration:{x:0,y:0}}},paper:'chalk',reportTexture:'speckled'});
  for(const ink of a.manifest.inks){assert.deepEqual(a.parts.get(ink.plate),b.parts.get(ink.plate));assert.deepEqual(a.parts.get(ink.screened),b.parts.get(ink.screened));}
  assert.notDeepEqual(a.parts.get('proof/composite.png'),b.parts.get('proof/composite.png'));
  const zip=await JSZip.loadAsync(a.zip);zip.file('source/layers/ink-01-ink-0.png',a.parts.get('source/layers/ink-02-ink-1.png'));
  await assert.rejects(require('../scripts/reproduce-layers').readSnapshot(await zip.generateAsync({type:'nodebuffer'})),/coverage hash mismatch/);
});
