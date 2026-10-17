#!/usr/bin/env node
/* Build the browser app and public guide for static hosting. No generated site in Git.
 * Keep one source page at web/stipra; publish only the paths under dist/stipra.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {generate:generateMark}=require('./generate-stipra-mark.js');
const SOURCES=[
  ['web/stipra/app.js','app.js'],
  ['src/import/svg.js','svg.js'],
  ['src/import/probe.js','probe.js'],
  ['src/import/asset.js','asset.js'],
  ['src/separation.js','separation.js'],
  ['src/screening.js','screening.js'],
  ['src/styles.js','styles.js'],
  ['src/export-plan.js','export-plan.js'],
  ['src/plate-diagnostics.js','plate-diagnostics.js']
];
const REWRITE={
  '../../src/import/svg.js':'./assets/svg.js',
  '../../src/import/probe.js':'./assets/probe.js',
  '../../src/import/asset.js':'./assets/asset.js',
  '../../src/separation.js':'./assets/separation.js',
  '../../src/screening.js':'./assets/screening.js',
  '../../src/styles.js':'./assets/styles.js',
  '../../src/export-plan.js':'./assets/export-plan.js',
  '../../src/plate-diagnostics.js':'./assets/plate-diagnostics.js',
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
  html=html.replace('../../dist/stipra/assets/print-export.js','./assets/print-export.js');
  fs.writeFileSync(path.join(stage,'index.html'),html);
  require('node:child_process').execFileSync(process.execPath,[path.join(ROOT,'scripts/build-browser-export.js'),path.join(assets,'print-export.js')]);
  fs.copyFileSync(path.join(ROOT,'web/stipra/shared.css'),path.join(stage,'shared.css'));
  for(const [src,dst] of SOURCES){
    const data=fs.readFileSync(path.join(ROOT,src));
    fs.writeFileSync(path.join(assets,dst),data);
  }
  const guide=path.join(stage,'guide');fs.mkdirSync(guide,{recursive:true});
  fs.copyFileSync(path.join(ROOT,'web/stipra/guide.html'),path.join(guide,'index.html'));
  const {truetype}=require('../src/report-fonts.js');
  for(const [name,family,weight] of [['plex-regular','ibm-plex-sans',400],['plex-bold','ibm-plex-sans',700],['plex-mono','ibm-plex-mono',400]])
    fs.writeFileSync(path.join(assets,name+'.ttf'),truetype(family,weight));
  for(const family of ['sans','mono'])fs.copyFileSync(require.resolve('@fontsource/ibm-plex-'+family+'/LICENSE'),path.join(assets,'IBM-Plex-'+family+'-OFL.txt'));
  // Owner-review candidate: build from Stiprā scene geometry, not a committed bitmap.
  const brand=generateMark(path.join(stage,'brand'));
  // Relative subpath deployment; / can be reserved for other apps later.
  fs.writeFileSync(path.join(target,'_redirects'),'/ /stipra/ 302\n');
  // No arbitrary JS from uploaded SVGs; no third-party connections.
  fs.writeFileSync(path.join(target,'_headers'),
    '/stipra/*\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' blob: data:; connect-src \'none\'; object-src \'none\'; frame-ancestors \'self\'; base-uri \'none\'; form-action \'none\'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n');
  const generated=[path.join(guide,'index.html'),...['plex-regular','plex-bold','plex-mono'].map(n=>path.join(assets,n+'.ttf')),path.join(stage,'index.html'),...SOURCES.map(([,dst])=>path.join(assets,dst)),
    ...brand.manifest.files.map(file=>path.join(stage,'brand',file.name)),
    path.join(stage,'brand/stipra-mark.manifest.json')];
  if(generated.some(file=>!fs.statSync(file).size))throw Error('Pages build emitted an empty file');
  return {dir:target,app:'/stipra/',files:generated.map(f=>path.relative(target,f))};
}
if(require.main===module){
 try{const output=build();process.stdout.write(JSON.stringify(output,null,2)+'\n');}
 catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={build,SOURCES,REWRITE};
