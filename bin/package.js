#!/usr/bin/env node
/* Stiprā package command: preserve source and produce aligned ink ZIP locally. MIT. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Probe=require('../src/import/probe.js'),{ingestLocalBytes}=require('../src/import/node.js');
const Prepress=require('../src/print-package.js'),Styles=require('../src/styles.js');
function args(argv){
  const o={},names=['--input','--config','--screen','--out','--dpi','--marks-mm','--expected-sha256','--paper','--style','--report-texture','--qr-style'];
  for(let i=0;i<argv.length;i++){
    const name=argv[i],value=argv[i+1];
    if(!names.includes(name)||!value||value.startsWith('--')||name in o)
      throw Error('Expected --input IMAGE --config JSON [--screen JSON] [--dpi 300] [--marks-mm 0] --out FILE.zip');
    o[name]=argv[++i];
  }
  if(!o['--input']||!o['--out']||Boolean(o['--config'])===Boolean(o['--style']))
    throw Error('Specify --input, --out, and exactly one --config JSON or --style ID');
  if(o['--style']&&o['--screen'])throw Error('--screen cannot override a named style; use --config with an explicit screen recipe');
  return o;
}
async function run(argv){
  const opts=args(argv),inputPath=path.resolve(opts['--input']),configPath=opts['--config']?path.resolve(opts['--config']):null;
  const screenPath=opts['--screen']?path.resolve(opts['--screen']):null;
  const out=path.resolve(opts['--out']);
  if(!out.endsWith('.zip'))throw Error('Output must be a .zip filename');
  if([inputPath,configPath,screenPath].includes(out)||fs.existsSync(out))
    throw Error('Refusing to overwrite an input or existing package: '+out);
  if(fs.statSync(inputPath).size>Probe.MAX_BYTES)throw Error('16 MiB source input budget exceeded');
  const bytes=fs.readFileSync(inputPath);
  const sourceHash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(opts['--expected-sha256']&&opts['--expected-sha256']!==sourceHash)
    throw Error('Source SHA-256 does not match expected owner fixture');
  const dpi=opts['--dpi']===undefined?300:Number(opts['--dpi']);
  const style=opts['--style']?Styles.resolve(opts['--style'],{dpi}):null;
  const inkRecipe=style?style.inkRecipe:JSON.parse(fs.readFileSync(configPath,'utf8'));
  const screenRecipe=style?style.screenRecipe:screenPath?JSON.parse(fs.readFileSync(screenPath,'utf8')):null;
  const marksMm=opts['--marks-mm']===undefined?0:Number(opts['--marks-mm']);
  Prepress.validate(dpi,marksMm);
  const asset=await ingestLocalBytes(bytes,path.basename(inputPath));
  const result=await Prepress.generate({originalBytes:bytes,asset,inkRecipe,screenRecipe,dpi,marksMm,paper:opts['--paper']||'auto',style,reportTexture:opts['--report-texture']||'speckled',qrStyle:opts['--qr-style']||'ink-dots'});
  fs.mkdirSync(path.dirname(out),{recursive:true});
  try{fs.writeFileSync(out,result.zip,{flag:'wx'});}
  catch(e){if(fs.existsSync(out))try{fs.unlinkSync(out)}catch{};throw e;}
  const summary={status:'DIGITAL_PACKAGE_GENERATED_NOT_PHYSICALLY_VALIDATED',path:out,
    bytes:result.zip.length,sourceSHA256:sourceHash,sourceDimensions:result.manifest.output.sourcePixels,
    printSizeMm:result.manifest.output.trimMm,inkCount:result.manifest.inks.length,
    assets:result.manifest.files.length+1,paper:result.manifest.paperSelection,
    style:result.manifest.style||null,report:result.manifest.report};
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');
  return summary;
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error('stipra package: '+e.message);process.exitCode=1;});
module.exports={run,args};
