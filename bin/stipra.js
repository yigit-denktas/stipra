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
  if(Object.hasOwn(o,key))throw Error('Duplicate --'+key);
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
  'Shared Stiprā Styles (experimental, reproducible starting points):',
  '  stipra styles list',
  '  stipra styles explain portrait-duotone',
  '  stipra styles suggest --intent editorial',
  '  stipra styles resolve editorial-halftone --variant tonal-key --dpi 300 --lpi 50 --seed 42',
  '  stipra package --input photo.jpg --style editorial-halftone --dpi 300 --out out/photo.zip',
  '',
  'Print package: aligned masters, A4 inspection and ZIP:',
  '  stipra package --input artwork.png --config examples/recipes/spot-photo.json --screen examples/recipes/screens-spot.json --dpi 300 --out out/artwork.zip',
  '',
  'Local image import and continuous-tone separation:',
  '  stipra import --input artwork.png --out out/import',
  '  stipra separate --input artwork.png --config examples/recipes/spot-photo.json --out out/separation',
  '  stipra separate --input artwork.png --config examples/recipes/spot-photo.json --screen examples/recipes/screens-spot.json --out out/screened',
  '',
  'Options: --preset 01..06|all, --config JSON, --seed INTEGER,',
  '         --format png,svg,jpg,webp, --scale 1..3, --plates, --out DIR',
  '',
  'Controlled comparisons and local batches:',
  '  stipra compare --input artwork.png --config examples/workflows/compare.json --out out/comparison --json',
  '  stipra batch --config jobs.json --out out/batch --json',
  '  stipra verify --input out/artwork.zip --json',
  '  stipra sheet --input out/artwork.zip --out out/sheet --json',
  'Package derivatives: --formats png,jpg,webp,svg --scale 1..3 --alpha paper|source --vector-plates true',
  '--json wraps results/errors in stipra-cli-result-v1; exits 0 success, 1 partial/I/O, 2 invalid request.',
  'SVG image derivatives use sampled run paths, not reconstructed curves. Physical validation remains open.',
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
 const scene=Engine.build(cfg),slug='prehnite-'+cfg.variant,assets=[],pending=new Map(),save=(name,data)=>pending.set(name,data);
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
  save(filename,data);assets.push(filename);
 }
 if(opts.plates){
  const roles=cfg.variant==='03'?['primary','accent','third']:['primary','accent'];
  for(const role of roles){
   const filename=slug+'-'+role+'-plate.svg';
   save(filename,Engine.svgPlateExport(scene,role));assets.push(filename);
   const p=Engine.renderPlate(scene,role,factory,scale);
   const mono=new Canvas(p.width,p.height),ctx=mono.getContext('2d');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,p.width,p.height);ctx.drawImage(p,0,0);
   const raster=slug+'-'+role+'-coverage.png';
   save(raster,mono.toBufferSync('png'));assets.push(raster);
  }
 }
 const manifest={generator:'stipra/prehnite-v8',preset:cfg.variant,seed:cfg.seed,
  dimensions:{width:Engine.W,height:Engine.H,scale},
  inks:cfg.palette,assets,notes:'Digital plate simulation, not press calibrated.'};
 save(slug+'-manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const [name,data]of pending)if(fs.existsSync(path.join(out,name))&&!fs.readFileSync(path.join(out,name)).equals(Buffer.from(data)))throw Error('Refusing to overwrite changed render output: '+name);
 for(const [name,data]of pending)if(!fs.existsSync(path.join(out,name)))fs.writeFileSync(path.join(out,name),data,{flag:'wx'});
 return manifest;
}
async function main(){
 const argv=process.argv.slice(2),jsonMode=argv.includes('--json');
 if(argv.filter(x=>x==='--json').length>1)throw Error('Duplicate --json');
 const filtered=argv.filter(x=>x!=='--json'),opts=parse(filtered),cmd=opts._[0];
 const emit=result=>{process.stdout.write(JSON.stringify(jsonMode?{contract:'stipra-cli-result-v1',command:cmd,status:result?.status==='partial'||result?.status==='error'?result.status:'ok',result}:result,null,2)+'\n');if(result?.status==='partial'||result?.status==='error')process.exitCode=1;};
 if(!cmd||opts.help||cmd==='help'){help();return;}
 if(cmd==='presets'){if(Object.keys(opts).some(key=>key!=='_')||opts._.length!==1)throw Error('Unexpected presets argument');emit(Engine.listPresets());return;}
 if(cmd==='styles'){
  const styles=require('../src/styles.js'),action=opts._[1]||'list';
  const allowed={list:[],explain:[],resolve:['dpi','seed','variant','screening','lpi'],suggest:['intent','fine-text']}[action];
  if(!allowed||Object.keys(opts).some(key=>key!=='_'&&!allowed.includes(key))||(['explain','resolve'].includes(action)?opts._.length!==3:opts._.length>2))throw Error('Unexpected styles argument');
  if(action==='list')emit(styles.list());
  else if(action==='explain')emit(styles.explain(opts._[2]));
  else if(action==='resolve')emit(styles.resolve(opts._[2],{dpi:Number(opts.dpi??300),seed:Number(opts.seed??142),variant:opts.variant??'default',screening:opts.screening??'authored',...(opts.lpi?{lpi:Number(opts.lpi)}:{})}));
  else if(action==='suggest')emit(styles.suggest({intent:opts.intent,hasFineText:opts['fine-text']==='true'}));
  else throw Error('Unknown styles action '+action);
  return;
 }
 if(cmd==='scene'){const result=await require('./scene.js').run(filtered.slice(1),{quiet:true});emit(result);return;}
 if(cmd==='import'){const result=await require('./import.js').run(filtered.slice(1),{quiet:true});emit(result);return;}
 if(cmd==='separate'){const result=await require('./separate.js').run(filtered.slice(1),{quiet:true});emit(result);return;}
 if(cmd==='package'){const result=await require('./package.js').run(filtered.slice(1),{quiet:true});emit(result);return;}
 if(cmd==='render'){
  for(const key of Object.keys(opts))if(!['_','preset','config','seed','format','scale','plates','out'].includes(key))throw Error('Unknown render option --'+key);
  if(opts._.length!==1)throw Error('Unexpected render argument');
  const preset=String(opts.preset||'01');
  if(preset==='all'&&opts.config)throw Error('--config cannot be combined with --preset all');
  const ids=preset==='all'?Object.keys(Engine.PALETTES):[preset];
  for(const id of ids)if(!Engine.PALETTES[id]&&!opts.config)throw Error('Unknown preset: '+id);
  const outputs=ids.map(id=>renderOne(id,opts));
  emit(outputs);return;
 }
 if(['compare','batch'].includes(cmd)){emit(await require('./workflow').runPlan(cmd,filtered.slice(1)));return;}
 if(cmd==='verify'){emit(await require('./workflow').inspectPackage(filtered.slice(1)));return;}
 if(cmd==='sheet'){emit(await require('./workflow').sheet(filtered.slice(1)));return;}
 throw Error('Unknown command '+cmd);
}
main().catch(e=>{
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify({contract:'stipra-cli-result-v1',command:process.argv[2]??null,status:'error',error:{code:e.code??'INVALID_ARGUMENT',message:e.message}})+'\n');
 else console.error('stipra: '+e.message);
 process.exitCode=['EEXIST','ENOENT','EACCES'].includes(e.code)?1:2;
});
