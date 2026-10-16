#!/usr/bin/env node
/* Build the real browser application for Cloudflare Pages. No generated site in Git.
 * Keep one source page at web/stipra; publish only the paths under dist/stipra.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const SOURCES=[
  ['web/stipra/app.js','app.js'],
  ['src/import/svg.js','svg.js'],
  ['src/import/probe.js','probe.js'],
  ['src/import/asset.js','asset.js'],
  ['src/separation.js','separation.js'],
  ['src/screening.js','screening.js']
];
const REWRITE={
  '../../src/import/svg.js':'./assets/svg.js',
  '../../src/import/probe.js':'./assets/probe.js',
  '../../src/import/asset.js':'./assets/asset.js',
  '../../src/separation.js':'./assets/separation.js',
  '../../src/screening.js':'./assets/screening.js',
  'src="app.js"':'src="./assets/app.js"'
};
function build(outRoot=path.join(ROOT,'dist')){
  const target=path.resolve(outRoot),stage=path.join(target,'stipra'),assets=path.join(stage,'assets');
  // Avoid deleting arbitrary external directories.
  if(target===ROOT||ROOT.startsWith(target+path.sep))throw Error('Pages target must not be the repository root or its parent');
  fs.rmSync(target,{recursive:true,force:true});
  fs.mkdirSync(assets,{recursive:true});
  const source=fs.readFileSync(path.join(ROOT,'web/stipra/index.html'),'utf8');
  let html=source;
  for(const [original,replacement] of Object.entries(REWRITE)){
    if(!html.includes(original))throw Error('Missing expected source script: '+original);
    html=html.replace(original,replacement);
  }
  const scriptTags=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]);
  if(scriptTags.length!==SOURCES.length||scriptTags.some(src=>!src.startsWith('./assets/')))
    throw Error('Pages build must resolve all scripts within /stipra/assets/');
  fs.writeFileSync(path.join(stage,'index.html'),html);
  for(const [src,dst] of SOURCES){
    const data=fs.readFileSync(path.join(ROOT,src));
    fs.writeFileSync(path.join(assets,dst),data);
  }
  // Relative subpath deployment; / can be reserved for other apps later.
  fs.writeFileSync(path.join(target,'_redirects'),'/ /stipra/ 302\n');
  // No arbitrary JS from uploaded SVGs; no third-party connections.
  fs.writeFileSync(path.join(target,'_headers'),
    '/stipra/*\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' blob: data:; connect-src \'none\'; object-src \'none\'; frame-ancestors \'self\'; base-uri \'none\'; form-action \'none\'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n');
  const generated=[path.join(stage,'index.html'),...SOURCES.map(([,dst])=>path.join(assets,dst))];
  if(generated.some(file=>!fs.statSync(file).size))throw Error('Pages build emitted an empty file');
  return {dir:target,app:'/stipra/',files:generated.map(f=>path.relative(target,f))};
}
if(require.main===module){
 try{const output=build();process.stdout.write(JSON.stringify(output,null,2)+'\n');}
 catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={build,SOURCES,REWRITE};
