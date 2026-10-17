#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const Sep=require('../src/separation.js'),Screen=require('../src/screening.js');
const dir=process.argv[2],read=n=>fs.readFileSync(path.join(dir,n));
const q=JSON.parse(read('request.json'));
const separated=Sep.separate({width:q.width,height:q.height,rgba:new Uint8Array(read('source.rgba'))},q.inkRecipe);
const screened=Screen.apply(separated,q.screenRecipe);
fs.writeFileSync(path.join(dir,'proof.rgba'),screened.preview);
for(let j=0;j<screened.masks.length;j++)fs.writeFileSync(path.join(dir,`plate-${j}.gray`),screened.masks[j].coverage);
fs.writeFileSync(path.join(dir,'engine.json'),JSON.stringify({inkRecipe:separated.recipe,screenRecipe:screened.recipe,coverage:screened.stats.inks}));
