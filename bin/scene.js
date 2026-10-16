#!/usr/bin/env node
/* Dependency-free Stipra v1 recipe CLI. Existing `stipra render` stays Prehnite-only. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/core.js');
function run(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (!['--config', '--out'].includes(argv[i]) || !argv[i+1] || argv[i+1].startsWith('--'))
      throw Error(`Expected --config FILE and optional --out DIR; unexpected argument '${argv[i]}'`);
    if (Object.hasOwn(opts, argv[i])) throw Error(`Duplicate ${argv[i]}`);
    opts[argv[i]] = argv[++i];
  }
  if (!opts['--config']) throw Error('Missing --config recipe.json');
  const recipe = JSON.parse(fs.readFileSync(path.resolve(opts['--config']), 'utf8'));
  const scene = core.resolveRecipe(recipe);
  const out = path.resolve(opts['--out'] || 'out');
  fs.mkdirSync(out, {recursive: true});
  const assets = ['scene-composite.svg', ...scene.plates.map(p => `${p.id}-plate.svg`), 'recipe.normalized.json'];
  fs.writeFileSync(path.join(out, assets[0]), core.renderSvg(scene));
  scene.plates.forEach((p, i) => fs.writeFileSync(path.join(out, assets[i+1]), core.renderSvg(scene, {plateId:p.id})));
  fs.writeFileSync(path.join(out, 'recipe.normalized.json'), core.canonicalRecipe(recipe));
  const manifest = {generator:'stipra/scene-v1', sceneVersion:scene.version, canvas:scene.canvas,
    substrate:scene.substrate, inks:scene.plates.map(p => ({plateId:p.id, inkId:p.inkId, color:p.ink.color, role:p.role, offset:p.offset})),
    seeds:scene.seeds, provenance:scene.provenance, assets, notice:'Uncalibrated solid vector preview; no raster image import or halftone screening.'};
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
  process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if (require.main === module) {
  try { run(process.argv.slice(2)); } catch (e) { console.error('stipra scene: '+e.message); process.exitCode=1; }
}
module.exports = {run};
