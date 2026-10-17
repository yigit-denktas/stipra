#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),ROOT=path.resolve(__dirname,'..');
async function build(target=path.join(ROOT,'dist/stipra/sketches')){
  await require('./build-core.js').build();
  await require('./build-inputs.js').build();
  const out=path.resolve(target),assets=path.join(out,'assets');fs.mkdirSync(assets,{recursive:true});
  for(const name of ['index.html','global.html','instance.html','vanilla.mjs','global.mjs','instance.mjs','ui.mjs','draft.mjs','sketches.css'])
    fs.copyFileSync(path.join(ROOT,'examples/sketches',name),path.join(out,name));
  fs.copyFileSync(path.join(ROOT,'packages/core/dist/index.mjs'),path.join(assets,'core.mjs'));
  const adapter=fs.readFileSync(path.join(ROOT,'packages/canvas/index.mjs'),'utf8');
  if(!adapter.includes("from '@stipra/core'"))throw Error('Missing adapter core import');
  fs.writeFileSync(path.join(assets,'canvas.mjs'),adapter.replace("from '@stipra/core'","from './core.mjs'"));
  fs.copyFileSync(path.join(ROOT,'packages/inputs/dist/index.mjs'),path.join(assets,'inputs.mjs'));
  fs.writeFileSync(path.join(assets,'regions-canvas.mjs'),fs.readFileSync(path.join(ROOT,'packages/inputs/canvas.mjs'),'utf8').replace("from '@stipra/canvas'","from './canvas.mjs'").replace("from './dist/index.mjs'","from './inputs.mjs'"));
  const pkg=JSON.parse(fs.readFileSync(require.resolve('p5/package.json'),'utf8'));
  fs.copyFileSync(require.resolve('p5/lib/p5.min.js'),path.join(assets,'p5.min.js'));
  fs.copyFileSync(require.resolve('p5/license.txt'),path.join(assets,'p5-LGPL-2.1.txt'));
  fs.writeFileSync(path.join(assets,'p5-SOURCE.txt'),`p5.js ${pkg.version}, LGPL-2.1\nUpstream source: https://github.com/processing/p5.js/tree/v${pkg.version}\nThis unmodified p5.min.js is a separate, replaceable host script. Replace it in this assets directory or edit the HTML script reference to use your own build. Stiprā core/canvas code is separately MIT-licensed.\n`);
  fs.copyFileSync(path.join(ROOT,'LICENSE'),path.join(ROOT,'packages/canvas/LICENSE'));
  await require('./build-browser-export.js').build(path.join(assets,'print-export.mjs'),{format:'esm'});
  const regions=path.join(path.dirname(out),'regions');fs.mkdirSync(regions,{recursive:true});
  for(const name of ['index.html','app.mjs','fixture.mjs'])fs.copyFileSync(path.join(ROOT,'examples/regions',name),path.join(regions,name));
  // Reuse the optional exporter and host assets rather than creating another bundle.
  fs.writeFileSync(path.join(regions,'app.mjs'),fs.readFileSync(path.join(regions,'app.mjs'),'utf8').replaceAll("'./assets/","'../sketches/assets/"));
  return {dir:out,p5:pkg.version};
}
if(require.main===module)build(process.argv[2]).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
