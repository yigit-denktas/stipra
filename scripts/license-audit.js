#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const ALLOWED=new Set(['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','Zlib','OFL-1.1','0BSD','CC0-1.0','(MIT AND Zlib)','MIT AND Apache-2.0']);
/** Applies the same reviewed license selection to production inventories and browser bundles. */
function licensePolicy(name,declared){
  const selected=name==='brotli'?'MIT AND Apache-2.0':declared==='(MIT OR GPL-3.0-or-later)'?'MIT':declared;
  return {selected,reviewed:ALLOWED.has(selected)};
}
const completeTerms=sources=>sources.some(x=>/Permission is hereby granted|Redistribution and use|SIL OPEN FONT LICENSE|Apache License|ISC License|Permission to use, copy/i.test(x.text));
function notices(dir){
  const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
  const files=fs.readdirSync(dir).filter(n=>/^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i.test(n)&&fs.statSync(path.join(dir,n)).isFile());
  const sources=files.map(name=>({name,text:fs.readFileSync(path.join(dir,name),'utf8')}));
  if(!sources.length){
    const readme=fs.readdirSync(dir).find(n=>/^readme(?:\.|$)/i.test(n));
    const section=readme&&fs.readFileSync(path.join(dir,readme),'utf8').match(/## License[\s\S]*/i)?.[0];
    if(section)sources.push({name:readme+'#license',text:section});
  }
  // Prebundled fontkit includes a Node-derived notice that package metadata omits.
  if(pkg.name==='@pdf-lib/fontkit'){
    const name='dist/fontkit.umd.js',source=fs.readFileSync(path.join(dir,name),'utf8');
    const blocks=[...(source.match(/(?:[ \t]*\/\/[^\n]*\n){2,}/g)||[]),...(source.match(/\/\*[\s\S]*?\*\//g)||[])].filter(b=>/Copyright|Permission is hereby|Licensed under/i.test(b));
    blocks.forEach((text,i)=>sources.push({name:name+'#notice-'+(i+1),text}));
    sources.push({name:'Stipra retained Apache-2.0 terms for embedded Google/Brotli notices',text:fs.readFileSync(path.join(ROOT,'licenses/third-party/Apache-2.0.txt'),'utf8')});
  }
  if(pkg.name==='brotli'){
    for(const name of fs.readdirSync(path.join(dir,'dec')).filter(x=>x.endsWith('.js')).sort()){
      const file='dec/'+name,text=fs.readFileSync(path.join(dir,file),'utf8');
      const blocks=(text.match(/\/\*[\s\S]*?\*\//g)||[]).filter(x=>/Copyright|Licensed under|Permission is hereby/i.test(x));
      blocks.forEach((text,i)=>sources.push({name:file+'#notice-'+(i+1),text}));
    }
    sources.push({name:'Stipra retained Apache-2.0 terms for Google Brotli decoder',text:fs.readFileSync(path.join(ROOT,'licenses/third-party/Apache-2.0.txt'),'utf8')});
  }
  const supplements=JSON.parse(fs.readFileSync(path.join(ROOT,'licenses/third-party/supplements.json'),'utf8')).packages;
  const supplement=supplements.find(x=>x.name===pkg.name&&x.version===pkg.version);
  if(supplement){
    const original=fs.readFileSync(path.join(dir,supplement.publishedEvidence));
    if(hash(original)!==supplement.publishedSha256)throw Error('Published notice changed for '+pkg.name);
    const terms=fs.readFileSync(path.join(ROOT,'licenses/third-party',supplement.terms),'utf8');
    if(hash(terms)!==supplement.termsSha256)throw Error('Supplement terms changed for '+pkg.name);
    sources.push({name:'Stipra supplement: '+supplement.terms,text:supplement.copyright+'\n'+supplement.basis+'\nSource: '+supplement.source+'\n\n'+terms});
  }
  const declared=pkg.license||pkg.licenses?.map(x=>x.type).join(' OR ')||null;
  return {pkg,declared,sources};
}
function audit(out){
  fs.rmSync(path.join(out,'dependency-audit.json'),{force:true});
  fs.rmSync(path.join(out,'THIRD-PARTY-NOTICES.txt'),{force:true});
  const lockBytes=fs.readFileSync(path.join(ROOT,'package-lock.json')),lock=JSON.parse(lockBytes),packages=[],texts=[],findings=[];
  for(const [name,item] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b))){
    if(!name||item.dev)continue;
    const dir=path.join(ROOT,name);
    if(!fs.existsSync(dir))throw Error('Audit requires installed runtime dependency '+name);
    const n=notices(dir);
    if(n.pkg.version!==item.version)throw Error('Installed version differs from lock: '+name);
    const {selected,reviewed}=licensePolicy(n.pkg.name,n.declared);
    if(!reviewed)findings.push({package:n.pkg.name,kind:'license-review',detail:'Unreviewed license expression: '+selected});
    if(!n.sources.length)throw Error('No license evidence: '+name);
    const fullTerms=completeTerms(n.sources);
    if(!fullTerms)findings.push({package:n.pkg.name,kind:'incomplete-notice',detail:'Published package supplies a declaration but incomplete license terms/attribution.'});
    packages.push({path:name,name:n.pkg.name,version:item.version,integrity:item.integrity,declared:n.declared,selected,
      evidence:n.sources.map(x=>({path:x.name,sha256:hash(x.text)})),fullTerms});
    texts.push(n.pkg.name+' '+item.version+' / '+selected+'\n'+n.sources.map(x=>'Source: '+x.name+'\n'+x.text).join('\n'));
  }
  findings.push({package:'skia-canvas',kind:'native-transitive-review',detail:'The npm MIT wrapper notice does not inventory the downloaded native binary and its Rust/Skia/codec dependencies. Verify platform-specific native notices before redistributing a bundled executable.'});
  const fontkitSource=require('./fontkit-evidence').verify();
  const report={contract:'stipra-dependency-audit-v1',lockSha256:hash(lockBytes),scope:'installed production npm dependency graph; static bundle subset has its own emitted notices',
    artifactEvidence:require('./artifact-evidence').verifyArtifacts(),fontkitSource,
    status:findings.length?'review-required':'checked',packages,findings,
    excluded:['Owner artwork and brand permissions are separate from code licensing.','Paper Mono is build-fetched with a separate OFL/provenance record.','p5.js is an optional separately hosted LGPL development dependency; p5.grain is not installed. Core/Canvas/inputs packages exclude the heavy export/native/WASM dependencies.']};
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'dependency-audit.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'THIRD-PARTY-NOTICES.txt'),texts.join('\n\n---\n\n'));
  return report;
}
if(require.main===module){
  try{
    const out=path.resolve(ROOT,'out/license-audit'),report=audit(out);
    console.log(JSON.stringify({status:report.status,packages:report.packages.length,findings:report.findings,out:path.relative(ROOT,out)},null,2));
    if(process.argv.includes('--release-check')&&report.findings.length)process.exitCode=1;
  }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={audit,notices,completeTerms,licensePolicy};
