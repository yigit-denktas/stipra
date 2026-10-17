#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function stage(source=path.join(ROOT,'dist/stipra'),target=path.join(ROOT,'dist-github')){
  source=path.resolve(source);target=path.resolve(target);
  if(target===ROOT||source===target||ROOT.startsWith(target+path.sep)||source.startsWith(target+path.sep))throw Error('unsafe GitHub Pages output');
  if(!fs.existsSync(path.join(source,'index.html'))||!fs.existsSync(path.join(source,'guide/index.html')))throw Error('run npm run build:pages first');
  fs.rmSync(target,{recursive:true,force:true});fs.cpSync(source,target,{recursive:true});fs.writeFileSync(path.join(target,'.nojekyll'),'');
  return {dir:target,app:'https://yigit-denktas.github.io/stipra/',primary:'https://apps.yigitdenktas.com/stipra/'};
}
if(require.main===module)console.log(JSON.stringify(stage()));module.exports={stage};
