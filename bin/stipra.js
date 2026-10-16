#!/usr/bin/env node
/* Stipra CLI foundation — Prehnite v8 adapter (MIT). */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const Engine=require('../examples/prehnite-v8/src/engine.js');
function parse(args){
 const o={_:[]};
 for(let i=0;i<args.length;i++){
  const a=args[i];
  if(!a.startsWith('--')){o._.push(a);continue;}
  const pos=a.indexOf('=');
  if(pos!==-1){o[a.slice(2,pos)]=a.slice(pos+1);continue;}
  const key=a.slice(2);
  o[key]=args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true;
 }
 return o;
}
function help(){
 process.stdout.write([
  'stipra · programmable printmaking studio',
  '',
  'Working Prehnite v8 case-study commands:',
  '  stipra presets',
  '  stipra render --preset 01 --format png,svg,webp,jpg --plates --out out',
  '  stipra render --preset all --format png --out out',
  '  stipra render --config recipe.json --seed 42 --format svg',
  '',
  'Options: --preset 01..06|all, --config JSON, --seed INTEGER,',
  '         --format png,svg,jpg,webp, --scale 1..3, --plates, --out DIR',
  '',
  'Planned for v0.9: import, separate, sheet, compare, batch.',
  ''
 ].join('\n'));
}
function formats(value){
 const result=[...new Set(String(value||'png').split(',').map(x=>x.trim().toLowerCase().replace('jpeg','jpg')))];
 for(const f of result)if(!['png','svg','webp','jpg'].includes(f))throw Error('Unsupported format: '+f);
 return result;
}
function renderOne(id,opts){
 const {Canvas,Path2D}=require('skia-canvas');
 global.Path2D=Path2D;
 const cfg=opts.config?Engine.validate(JSON.parse(fs.readFileSync(opts.config,'utf8'))):Engine.preset(id);
 if(opts.seed!==undefined){
  const n=Number(opts.seed);if(!Number.isSafeInteger(n)||n<=0)throw Error('--seed must be a positive integer');
  cfg.seed=n;
 }
 const scale=Number(opts.scale||1);
 if(!Number.isInteger(scale)||scale<1||scale>3)throw Error('--scale must be 1..3');
 const out=path.resolve(opts.out||'out');fs.mkdirSync(out,{recursive:true});
 const scene=Engine.build(cfg),slug='prehnite-'+cfg.variant,assets=[];
 let can;
 const factory=(w,h)=>new Canvas(w,h);
 for(const format of formats(opts.format)){
  const filename=format==='svg'?slug+'.svg':slug+'-'+(Engine.W*scale)+'x'+(Engine.H*scale)+'.'+format;
  let data;
  if(format==='svg')data=Engine.svg(scene);
  else{
   if(!can)can=Engine.render(scene,factory,scale);
   data=can.toBufferSync(format);
  }
  fs.writeFileSync(path.join(out,filename),data);assets.push(filename);
 }
 if(opts.plates){
  const roles=cfg.variant==='03'?['primary','accent','third']:['primary','accent'];
  for(const role of roles){
   const filename=slug+'-'+role+'-plate.svg';
   fs.writeFileSync(path.join(out,filename),Engine.svgPlateExport(scene,role));assets.push(filename);
   const p=Engine.renderPlate(scene,role,factory,scale);
   const mono=new Canvas(p.width,p.height),ctx=mono.getContext('2d');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,p.width,p.height);ctx.drawImage(p,0,0);
   const raster=slug+'-'+role+'-coverage.png';
   fs.writeFileSync(path.join(out,raster),mono.toBufferSync('png'));assets.push(raster);
  }
 }
 const manifest={generator:'stipra/prehnite-v8',preset:cfg.variant,seed:cfg.seed,
  dimensions:{width:Engine.W,height:Engine.H,scale},
  inks:cfg.palette,assets,notes:'Digital plate simulation, not press calibrated.'};
 fs.writeFileSync(path.join(out,slug+'-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
async function main(){
 const opts=parse(process.argv.slice(2)),cmd=opts._[0];
 if(!cmd||opts.help||cmd==='help'){help();return;}
 if(cmd==='presets'){console.log(JSON.stringify(Engine.listPresets(),null,2));return;}
 if(cmd==='render'){
  const preset=String(opts.preset||'01');
  if(preset==='all'&&opts.config)throw Error('--config cannot be combined with --preset all');
  const ids=preset==='all'?Object.keys(Engine.PALETTES):[preset];
  for(const id of ids)if(!Engine.PALETTES[id]&&!opts.config)throw Error('Unknown preset: '+id);
  const outputs=ids.map(id=>renderOne(id,opts));
  console.log(JSON.stringify(outputs,null,2));return;
 }
 if(['import','separate','sheet','compare','batch'].includes(cmd))
  throw Error('Command '+cmd+' is planned for v0.9, not implemented in this foundation.');
 throw Error('Unknown command '+cmd);
}
main().catch(e=>{console.error('stipra: '+e.message);process.exitCode=1;});
