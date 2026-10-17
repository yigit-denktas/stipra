#!/usr/bin/env node
/* Local-only owner fixture runner. Never uploads photographs to GitHub/CI. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ingestLocalBytes}=require('../src/import/node.js');
const Prepress=require('../src/print-package.js');
const dataset=require('../tests/fixtures/owner-photo-fixtures.json');
const kind={A:'sculpture',B:'forest',C:'beach'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(argv){
  const out={},opts=new Set(['--sources','--out','--dpi','--marks-mm','--paper']);
  for(let i=0;i<argv.length;i++){
    const key=argv[i],value=argv[i+1];
    if(!opts.has(key)||!value||key in out||value.startsWith('--'))
      throw Error('Usage: node scripts/owner-photo-batch.js --sources PRIVATE_DIR --out PRIVATE_DIR [--dpi 300] [--marks-mm 0]');
    out[key]=argv[++i];
  }
  if(!out['--sources']||!out['--out'])throw Error('Missing --sources or --out');
  const sourceDir=path.resolve(out['--sources']),target=path.resolve(out['--out']);
  const dpi=out['--dpi']===undefined?300:Number(out['--dpi']);
  const marksMm=out['--marks-mm']===undefined?0:Number(out['--marks-mm']);
  Prepress.validate(dpi,marksMm);
  // Preflight all three sources and all outputs *before* rendering any package.
  const inputs=dataset.fixtures.map(f=>{
    const file=path.resolve(sourceDir,f.originalFile),bytes=fs.readFileSync(file);
    if(sha(bytes)!==f.sha256)throw Error('Owner original fingerprint mismatch for '+f.id+': '+file);
    const output=path.join(target,'stipra-owner-'+f.id+'-print.zip');
    if(fs.existsSync(output))throw Error('Refusing overwrite: '+output);
    return {f,bytes,output};
  });
  fs.mkdirSync(target,{recursive:true});
  const completed=[];
  for(const {f,bytes,output} of inputs){
    const stem='owner-'+f.id+'-'+kind[f.id],read=part=>JSON.parse(
      fs.readFileSync(path.join(__dirname,'../examples/recipes/'+stem+'-'+part+'.json'),'utf8'));
    const asset=await ingestLocalBytes(bytes,f.originalFile);
    if(asset.metadata.oriented.width!==f.widthPx||asset.metadata.oriented.height!==f.heightPx)
      throw Error('Unexpected image geometry for '+f.id);
    const p=await Prepress.generate({originalBytes:bytes,asset,inkRecipe:read('inks'),screenRecipe:read('screens'),dpi,marksMm,paper:out['--paper']||'auto'});
    if(p.manifest.inks.length!==f.plannedInks)throw Error('Unexpected ink count for '+f.id);
    fs.writeFileSync(output,p.zip,{flag:'wx'});
    completed.push({fixture:f.id,filename:output,bytes:p.zip.length,sourceSha256:f.sha256,
      printMm:p.manifest.output.trimMm,inkCount:p.manifest.inks.length,
      state:'DIGITAL_PACKAGE_GENERATED_REQUIRES_VISUAL_REVIEW'});
  }
  process.stdout.write(JSON.stringify({contract:'stipra-owner-private-run-v1',
    status:'3_DIGITAL_PACKAGES_GENERATED_VISUAL_AND_PHYSICAL_REVIEW_PENDING',packages:completed},null,2)+'\n');
  return completed;
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error('stipra owner fixtures: '+e.message);process.exitCode=1;});
module.exports={run};
