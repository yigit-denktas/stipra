#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ingestLocalBytes}=require('../src/import/node.js');
const Print=require('../src/print-package.js'),Paper=require('../src/report-paper.js');
const catalog=require('../tests/fixtures/owner-photo-fixtures.json');
const ROOT=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function run(argv){
  const options={};
  for(let i=0;i<argv.length;i+=2){
    if(!['--sources','--recipes','--out'].includes(argv[i])||!argv[i+1]||options[argv[i]])throw Error('usage: --sources PRIVATE --recipes PRIOR_COMPARISON_OUTPUT --out PRIVATE');
    options[argv[i]]=path.resolve(argv[i+1]);
  }
  if(Object.keys(options).length!==3)throw Error('sources, prior recipes and output are required');
  for(const key of ['--sources','--out'])if(options[key]===ROOT||options[key].startsWith(ROOT+path.sep))throw Error('owner sources and reports must remain outside the repository');
  const inputs=catalog.fixtures.map(f=>{
    const bytes=fs.readFileSync(path.join(options['--sources'],f.originalFile));
    if(sha(bytes)!==f.sha256)throw Error('original hash mismatch: '+f.id);
    const recipe=JSON.parse(fs.readFileSync(path.join(options['--recipes'],f.id.toLowerCase(),'recipe.json')));
    if(recipe.sourceSha256!==f.sha256)throw Error('recipe source mismatch: '+f.id);
    const filename='stipra-editorial-report-'+f.id.toLowerCase()+'.pdf';
    if(fs.existsSync(path.join(options['--out'],filename)))throw Error('refusing to overwrite: '+filename);
    return {f,bytes,recipe,filename};
  });
  fs.mkdirSync(options['--out'],{recursive:true});
  const entries=[];
  for(const {f,bytes,recipe,filename} of inputs){
    const asset=await ingestLocalBytes(bytes,f.originalFile);
    const stock=Object.entries(Paper.STOCKS).find(([,v])=>v.hex.toLowerCase()===recipe.inks.paper.toLowerCase())?.[0]||'recipe';
    const p=await Print.generate({originalBytes:bytes,asset,inkRecipe:recipe.inks,screenRecipe:recipe.screens,dpi:recipe.effectiveDpi,paper:stock});
    fs.writeFileSync(path.join(options['--out'],filename),p.parts.get('report/separation-sheet.pdf'));
    for(const [name,data] of p.parts)if(name.startsWith('recipe/')||name==='manifest.json'||name==='report/diagnostics.json'){
      const target=path.join(options['--out'],f.id.toLowerCase(),name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);
    }
    entries.push({fixture:f.id,filename,sourceSha256:f.sha256,pdfSha256:sha(p.parts.get('report/separation-sheet.pdf')),master:p.manifest.output,files:p.manifest.files});
  }
  fs.writeFileSync(path.join(options['--out'],'review-manifest.json'),JSON.stringify({contract:'stipra-editorial-review-v1',uncalibrated:true,ownerApproved:false,entries},null,2)+'\n');
  console.log(JSON.stringify({reports:entries.length,output:options['--out']}));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
