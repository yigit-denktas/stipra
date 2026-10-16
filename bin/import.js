#!/usr/bin/env node
/* A local input adapter; distinct from the procedural renderer and color separator. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {ingestLocalBytes}=require('../src/import/node.js');
const Probe=require('../src/import/probe.js');
const SVG=require('../src/import/svg.js');
function args(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(!['--input','--out'].includes(key)||!argv[i+1]||argv[i+1].startsWith('--')||key in out)
      throw Error('Expected --input FILE [--out DIR]; unexpected or duplicate argument '+key);
    out[key]=argv[++i];
  }
  if(!out['--input'])throw Error('Missing --input FILE');
  return out;
}
async function run(argv){
  const opts=args(argv);
  const from=path.resolve(opts['--input']),to=path.resolve(opts['--out']||'out/import');
  const size=fs.statSync(from).size;
  if(size>Probe.MAX_BYTES)throw Error('File exceeds 16 MiB input limit');
  const raw=fs.readFileSync(from);
  const {metadata,canvas}=await ingestLocalBytes(raw,path.basename(from));
  if(path.resolve(to)===path.dirname(from)&&path.basename(from).startsWith('source-original'))
    throw Error('Import output must not overwrite the input source');
  fs.mkdirSync(to,{recursive:true});
  const extension=metadata.format==='jpeg'?'jpg':metadata.format;
  const original=metadata.format==='svg'?'source-original.svg.txt':'source-original.'+extension;
  // SVG source is archived as inert text; only sanitized markup is exported as renderable SVG.
  fs.writeFileSync(path.join(to,original),raw);
  const files=[original,'asset-normalized.png','asset-manifest.json'];
  if(metadata.format==='svg'){
    const safe=SVG.parse(raw.toString('utf8'),require('@xmldom/xmldom').DOMParser);
    fs.writeFileSync(path.join(to,'asset-sanitized.svg'),safe.safeMarkup);
    files.push('asset-sanitized.svg');
  }
  fs.writeFileSync(path.join(to,'asset-normalized.png'),await canvas.toBuffer('png'));
  const manifest={...metadata,sha256:crypto.createHash('sha256').update(raw).digest('hex'),
    assets:files,decoder:'skia-canvas',scope:'Input preparation only; no color separations or press calibration'};
  fs.writeFileSync(path.join(to,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error('stipra import: '+e.message);process.exitCode=1;});
module.exports={run,args};
