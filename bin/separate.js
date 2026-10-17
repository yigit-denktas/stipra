#!/usr/bin/env node
/* Local, deterministic image -> continuous-tone spot/CMYK mask extraction. MIT. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas}=require('skia-canvas');
const {ingestLocalBytes}=require('../src/import/node.js');
const {validate,separate,plateRGBA}=require('../src/separation.js');
const Screen=require('../src/screening.js');
const Probe=require('../src/import/probe.js');

function args(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const name=argv[i],value=argv[i+1];
    if(!['--input','--config','--screen','--out'].includes(name)||!value||value.startsWith('--')||name in out)
      throw Error('Expected --input IMAGE --config RECIPE.json [--screen SCREEN.json] [--out DIR]; unexpected argument '+name);
    out[name]=argv[++i];
  }
  if(!out['--input']||!out['--config'])throw Error('Missing --input IMAGE or --config RECIPE.json');
  return out;
}
async function png(rgba,width,height){
  const c=new Canvas(width,height),ctx=c.getContext('2d'),pixels=ctx.createImageData(width,height);
  pixels.data.set(rgba);ctx.putImageData(pixels,0,0);
  return c.toBuffer('png');
}
async function run(argv,{quiet=false}={}){
  const opts=args(argv),inputPath=path.resolve(opts['--input']),configPath=path.resolve(opts['--config']);
  const out=path.resolve(opts['--out']||'out/separation');
  if(fs.statSync(inputPath).size>Probe.MAX_BYTES)throw Error('16 MiB input file budget exceeded');
  const bytes=fs.readFileSync(inputPath);
  const recipe=validate(JSON.parse(fs.readFileSync(configPath,'utf8')));
  const screenPath=opts['--screen']?path.resolve(opts['--screen']):null;
  const screenRecipe=screenPath?JSON.parse(fs.readFileSync(screenPath,'utf8')):null;
  const asset=await ingestLocalBytes(bytes,path.basename(inputPath));
  const separated=separate({width:asset.metadata.oriented.width,height:asset.metadata.oriented.height,rgba:asset.rgba},recipe);
  const screened=screenRecipe?Screen.apply(separated,screenRecipe):null;
  const originalExt=asset.metadata.format==='jpeg'?'jpg':asset.metadata.format;
  const originalName=asset.metadata.format==='svg'?'source-original.svg.txt':'source-original.'+originalExt;
  const fileNames=[originalName,'source-normalized.png','preview-composite.png','recipe.normalized.json','separation-manifest.json',
    ...separated.masks.map(m=>'plate-'+m.id+'.png'),
    ...(screened?['screen-recipe.normalized.json','screened-preview.png',
      ...screened.masks.map(m=>'screened-'+m.id+'-plate.png')]:[])];
  for(const name of fileNames){
    const target=path.resolve(out,name);
    if(target===inputPath||target===configPath||target===screenPath)throw Error('Refusing to overwrite input or recipe');
    if(fs.existsSync(target))throw Error('Refusing to overwrite existing file: '+target);
  }
  const w=separated.width,h=separated.height;
  const assets=await Promise.all([
    png(asset.rgba,w,h),png(separated.preview,w,h),
    ...separated.masks.map(m=>png(plateRGBA(m.coverage),w,h)),
    ...(screened?[png(screened.preview,w,h),...screened.masks.map(m=>png(plateRGBA(m.coverage),w,h))]:[])
  ]);
  const manifest={
    contract:separated.contract,origin:{x:0,y:0},width:w,height:h,
    source:{...asset.metadata,sha256:crypto.createHash('sha256').update(bytes).digest('hex')},
    mode:recipe.mode,paper:recipe.paper,recipe:'recipe.normalized.json',
    inks:separated.stats.inks.map((stat,i)=>({...stat,name:recipe.inks[i].name,
      color:recipe.inks[i].color,source:recipe.inks[i].source,plate:'plate-'+stat.id+'.png'})),
    assets:fileNames,preview:'preview-composite.png',
    note:separated.warning,
    screening:screened?{contract:screened.contract,recipe:'screen-recipe.normalized.json',preview:'screened-preview.png',
      inks:screened.stats.inks.map((stat,i)=>({...stat,settings:screened.masks[i].screen,
        plate:'screened-'+stat.id+'-plate.png'})),note:screened.warning}:'none (continuous-tone grayscale masks only)',calibrated:false
  };
  fs.mkdirSync(out,{recursive:true});
  const write=(name,data)=>fs.writeFileSync(path.join(out,name),data,{flag:'wx'});
  write(originalName,bytes);
  write('source-normalized.png',assets[0]);
  write('preview-composite.png',assets[1]);
  write('recipe.normalized.json',JSON.stringify(recipe,null,2)+'\n');
  for(let i=0;i<separated.masks.length;i++)write('plate-'+separated.masks[i].id+'.png',assets[2+i]);
  if(screened){
    write('screen-recipe.normalized.json',JSON.stringify(screened.recipe,null,2)+'\n');
    write('screened-preview.png',assets[2+separated.masks.length]);
    for(let i=0;i<screened.masks.length;i++)
      write('screened-'+screened.masks[i].id+'-plate.png',assets[3+separated.masks.length+i]);
  }
  write('separation-manifest.json',JSON.stringify(manifest,null,2)+'\n');
  if(!quiet)process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error('stipra separate: '+e.message);process.exitCode=1;});
module.exports={run,args,png};
