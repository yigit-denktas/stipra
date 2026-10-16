'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const Core = require('../src/core.js');
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/recipes/spot-shapes.json'), 'utf8'));
const clone = v => JSON.parse(JSON.stringify(v));

test('v1 contract normalizes source without mutating input', () => {
  const before = JSON.stringify(sample);
  const valid = Core.validateRecipe(sample);
  assert.equal(JSON.stringify(sample), before);
  assert.equal(valid.canvas.trim.width, 920);
  assert.equal(valid.canvas.bleed.left, 20);
  assert.equal(valid.plates.length, 3);
  assert.equal(valid.layers.length, 44);
  assert.equal(valid.substrate.color, '#f4efdf');
});

test('browser UMD and Node interpret, serialize and render the same recipe byte-for-byte', () => {
  const sandbox = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/core.js'), 'utf8'), sandbox);
  assert.equal(sandbox.StipraCore.canonicalRecipe(sample), Core.canonicalRecipe(sample));
  assert.equal(JSON.stringify(sandbox.StipraCore.resolveRecipe(sample)), JSON.stringify(Core.resolveRecipe(sample)));
  assert.equal(sandbox.StipraCore.renderSvg(sandbox.StipraCore.resolveRecipe(sample)), Core.renderSvg(Core.resolveRecipe(sample)));
  for (const p of Core.resolveRecipe(sample).plates) {
    assert.equal(sandbox.StipraCore.renderSvg(sandbox.StipraCore.resolveRecipe(sample), {plateId:p.id}), Core.renderSvg(Core.resolveRecipe(sample), {plateId:p.id}));
  }
});

test('all plates keep identical canvas origin; paper is not a plate', () => {
  const scene = Core.resolveRecipe(sample);
  const base = 'width="960" height="560" viewBox="0 0 960 560"';
  const composite = Core.renderSvg(scene);
  assert.ok(composite.includes(base));
  assert.ok(composite.includes('fill="#f4efdf"'));
  assert.equal(scene.plates.length, scene.plates.map(p => p.inkId).filter(Boolean).length);
  for (const plate of scene.plates) {
    const svg = Core.renderSvg(scene, {plateId:plate.id});
    assert.ok(svg.includes(base));
    assert.ok(svg.includes('fill="#ffffff"'));
    assert.ok(svg.includes('fill="#000000"'));
    assert.ok(!svg.includes('fill="#f4efdf"'));
    assert.ok(!svg.includes('data-plate="'+scene.plates.find(p => p.id !== plate.id).id+'"'));
  }
  assert.ok(composite.includes('<clipPath'));
  assert.ok(composite.includes('rotate(-9)'));
  assert.ok(composite.includes('translate(3 -2)'));
});

test('per-system per-layer seeds are repeatable and independently configured', () => {
  const a = Core.resolveRecipe(sample);
  const b = Core.resolveRecipe(sample);
  assert.deepEqual(a, b);
  const altered = clone(sample); altered.seeds.paper += 1;
  const c = Core.resolveRecipe(altered);
  assert.notEqual(a.plates[0].layers[0].seeds.paper, c.plates[0].layers[0].seeds.paper);
  assert.equal(a.plates[0].layers[0].seeds.geometry, c.plates[0].layers[0].seeds.geometry);
  assert.equal(a.plates[0].layers[0].seeds.screen, c.plates[0].layers[0].seeds.screen);
});

test('invalid version, sizes, bleed, ink mappings, layer ids and unimplemented screens are actionable', () => {
  const checks = [
    [v=>v.version=9, /recipe\.version: expected 1/],
    [v=>v.canvas.width=0, /recipe\.canvas\.width:/],
    [v=>v.canvas.bleed.left=25, /recipe\.canvas\.bleed:/],
    [v=>v.plates[1].inkId='forest', /recipe\.plates: each ink/],
    [v=>v.layers[0].plateId='missing', /recipe\.layers\[0\]\.plateId: unknown plate/],
    [v=>v.layers[0].id=v.layers[1].id, /recipe\.layers\[1\]\.id: duplicate/],
    [v=>v.plates[0].screen.mode='halftone', /issue #5/],
    [v=>v.layers[0].geometry.kind='image', /image import is planned/],
    [v=>v.substrate.color='purple', /recipe\.substrate\.color/],
    [v=>v.canvas.extra='unused', /recipe\.canvas\.extra: unknown/],
    [v=>v.layers[0].coverage=NaN, /recipe\.layers\[0\]\.coverage/]
  ];
  for (const [change, message] of checks) {
    const bad = clone(sample); change(bad);
    assert.throws(()=>Core.validateRecipe(bad), message);
  }
});

test('the generic CLI exports a deterministic composite, grayscale plates, normalized recipe and manifest', () => {
  const cwd = path.resolve(__dirname, '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stipra-scene-'));
  try {
    const args = [path.join(cwd,'bin/scene.js'),'--config',path.join(cwd,'examples/recipes/spot-shapes.json'),'--out',tmp];
    const first = execFileSync(process.execPath,args,{encoding:'utf8'});
    const files = fs.readdirSync(tmp).sort();
    assert.deepEqual(files, ['blue-master-plate.svg','coral-master-plate.svg','forest-master-plate.svg','manifest.json','recipe.normalized.json','scene-composite.svg']);
    const before = files.map(f=>fs.readFileSync(path.join(tmp,f),'utf8'));
    assert.equal(first, fs.readFileSync(path.join(tmp,'manifest.json'),'utf8'));
    execFileSync(process.execPath,args);
    files.forEach((f,i)=>assert.equal(fs.readFileSync(path.join(tmp,f),'utf8'),before[i]));
    assert.match(before[4], /"geometry": 314159/);
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
