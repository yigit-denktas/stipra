'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('../examples/prehnite-v8/src/engine'),{hash}=require('./artifact-evidence');
const ROOT=path.resolve(__dirname,'..'),BASELINE=path.join(ROOT,'tests/fixtures/prehnite-goldens.json');
function snapshots(){
  return E.listPresets().map(({id})=>{
    const scene=E.build(E.preset(id)),files={'composite.svg':E.svg(scene)};
    for(const role of Object.keys(scene.plates))if(scene.plates[role].length)files[role+'-master.svg']=E.svgPlateExport(scene,role);
    return {id,width:scene.width,height:scene.height,files};
  });
}
function digest(scenes){
  return {contract:'stipra-prehnite-goldens-v1',scope:'Exact native vector serialization; not rasterizer, artistic or physical acceptance.',scenes:scenes.map(({files,...meta})=>({...meta,files:Object.fromEntries(Object.entries(files).map(([name,svg])=>[name,{bytes:Buffer.byteLength(svg),sha256:hash(Buffer.from(svg))}]))}))};
}
/** Checks committed vector goldens and emits only original procedural review artwork. */
function check(out=path.join(ROOT,'out/acceptance-goldens')){
  fs.rmSync(path.join(out,'acceptance-goldens.json'),{force:true});
  const scenes=snapshots(),actual=digest(scenes);
  assert.deepEqual(actual,JSON.parse(fs.readFileSync(BASELINE,'utf8')),'Prehnite vector baseline changed; inspect differences before explicitly updating the fixture');
  for(const scene of scenes){const dir=path.join(out,scene.id);fs.mkdirSync(dir,{recursive:true});for(const [name,svg] of Object.entries(scene.files))fs.writeFileSync(path.join(dir,name),svg);}
  fs.writeFileSync(path.join(out,'acceptance-goldens.json'),JSON.stringify({...actual,status:'checked'},null,2)+'\n');
  return actual;
}
if(require.main===module){try{check();console.log('Six saved Prehnite colorways and all active native plates match.');}catch(error){console.error(error);process.exitCode=1;}}
module.exports={snapshots,digest,check};
