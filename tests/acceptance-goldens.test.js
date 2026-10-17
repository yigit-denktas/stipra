'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {snapshots,digest}=require('../scripts/acceptance-goldens'),Core=require('../src/core');
test('six saved Prehnite vector baselines cover composites and every active plate',()=>{
  const scenes=snapshots(),expected=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/prehnite-goldens.json')));
  assert.deepEqual(digest(scenes),expected);
  assert.deepEqual(scenes.map(s=>s.id),['01','02','03','04','05','06']);
  for(const scene of scenes){
    assert.ok(scene.files['primary-master.svg']);assert.ok(scene.files['accent-master.svg']);
    for(const svg of Object.values(scene.files)){
      assert.match(svg,/width="2020" height="779" viewBox="0 0 2020 779"/);
      assert.doesNotMatch(svg,/<image\b|data:image\//i);
    }
  }
  scenes[0].files['primary-master.svg']+=' ';
  assert.notDeepEqual(digest(scenes),expected);
});
test('generic vector masters are invariant to paper seed and substrate color',()=>{
  const recipe=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/recipes/spot-shapes.json')));
  const a=Core.resolveRecipe(recipe),altered=structuredClone(recipe);
  altered.seeds.paper+=17;altered.substrate.color='#ffffff';
  const b=Core.resolveRecipe(altered);
  assert.notEqual(Core.renderSvg(a),Core.renderSvg(b));
  for(const plate of a.plates)assert.equal(Core.renderSvg(a,{plateId:plate.id}),Core.renderSvg(b,{plateId:plate.id}));
});
