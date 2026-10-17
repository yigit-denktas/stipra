'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Probe=require('../src/import/probe'),{ingestLocalBytes}=require('../src/import/node'),Package=require('../src/print-package');
const {verify}=require('../src/verify-package'),Sep=require('../src/separation'),Styles=require('../src/styles');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=x=>JSON.stringify(x,null,2)+'\n',ID=/^[a-z][a-z0-9_-]{0,47}$/;
function object(raw,keys,name){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(name+' must be an object');
  for(const key of Object.keys(raw))if(!keys.includes(key))throw Error('Unknown '+name+' field '+key);
}
function local(value,base){if(typeof value!=='string'||!value||value.includes('\0')||/^[a-z]+:\/\//i.test(value))throw Error('Expected local file path');return path.resolve(base,value);}
function read(file,max){const stat=fs.statSync(file);if(!stat.isFile()||stat.size>max)throw Error('File exceeds budget: '+path.basename(file));return fs.readFileSync(file);}
function readJSON(file){return JSON.parse(read(file,64*1024));}
function write(file,bytes){fs.writeFileSync(file,bytes,{flag:'wx'});}
function directory(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);}
function options(argv,allowed){const opts={};for(let i=0;i<argv.length;i++){const key=argv[i],value=argv[i+1];if(!allowed.includes(key)||!value||value.startsWith('--')||key in opts)throw Error('Invalid or duplicate argument '+key);opts[key]=value;i++;}return opts;}
/** Resolves inert job specifications before creating any output directory. */
function prepare(raw,base,cache){
  object(raw,['id','input','config','screen','style','styleVariant','dpi','lpi','seed','paper','marksMm','exports'],'job');
  if(typeof raw.id!=='string'||!ID.test(raw.id))throw Error('Job id must be lowercase, start with a letter and contain at most 48 safe characters');
  if(Boolean(raw.config)===Boolean(raw.style))throw Error('Choose exactly one config path or style id');
  if(raw.style&&raw.screen)throw Error('Named style cannot be mixed with a screen file');
  if(!raw.style&&['styleVariant','lpi','seed'].some(key=>raw[key]!==undefined))throw Error('Style options require a named style; explicit screen JSON owns its seed');
  const input=local(raw.input,base);let originalBytes=cache.get(input);
  if(!originalBytes){originalBytes=read(input,Probe.MAX_BYTES);cache.set(input,originalBytes);}
  if([...cache.values()].reduce((sum,b)=>sum+b.length,0)>64*1024*1024)throw Error('Plan exceeds 64 MiB aggregate source budget');
  const probe=Probe.inspect(originalBytes,{DOMParserCtor:require('@xmldom/xmldom').DOMParser}),dpi=raw.dpi??300,marksMm=raw.marksMm??0;
  Package.validate(dpi,marksMm);
  const style=raw.style?Styles.resolve(raw.style,{dpi,...(raw.styleVariant===undefined?{}:{variant:raw.styleVariant}),...(raw.lpi===undefined?{}:{lpi:raw.lpi}),...(raw.seed===undefined?{}:{seed:raw.seed})}):null;
  const inkRecipe=Sep.validate(style?style.inkRecipe:readJSON(local(raw.config,base))),screenRecipe=style?style.screenRecipe:raw.screen?readJSON(local(raw.screen,base)):null;
  require('../src/export-plan').screenConfigs(screenRecipe,inkRecipe.inks.map(x=>x.id));
  if(raw.paper!==undefined)require('../src/report-paper').select(new Uint8Array([255,255,255,255]),inkRecipe.paper,raw.paper);
  const exportOptions=raw.exports===undefined?null:require('../src/proof-exports').settings(raw.exports,probe.displayWidth,probe.displayHeight);
  return {id:raw.id,input,originalBytes,sourceSha256:hash(originalBytes),probe,inkRecipe,screenRecipe,style,dpi,marksMm,paper:raw.paper??(style?'recipe':'auto'),exports:exportOptions};
}
function html(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function contactSheet(records,controlled){
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Stiprā comparison</title><style>body{font:16px system-ui;background:#f5f0e5;color:#172a22;margin:40px;max-width:1200px}h1{border-bottom:3px solid #006043;padding-bottom:16px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{border-top:1px solid;padding-top:12px}img{display:block;width:100%;height:auto}code{overflow-wrap:anywhere}a{color:#006043}</style><h1>stiprā / '+(controlled?'controlled comparison':'batch results')+'</h1><p>Same-frame digital proofs. No automatic aesthetic winner or physical print approval. Keep this image-bearing document private unless redistribution is authorized.</p><main>'+records.map(r=>'<article><h2>'+html(r.id)+'</h2>'+(r.status==='ok'?'<p>Source</p><img alt="Original procedural or supplied source" src="'+r.source+'"><p>Digital proof</p><img alt="Digital ink proof '+html(r.id)+'" src="'+r.proof+'"><p>'+r.inks+' inks · '+r.frame.width+' × '+r.frame.height+' px</p><p><a href="'+r.package+'">Package</a> · <a href="'+r.id+'-verification.json">Verification</a></p><p>Source SHA-256<br><code>'+r.sourceSha256+'</code></p>':'<p>'+html(r.error.message)+'</p>')+'</article>').join('')+'</main></html>';
}
/** Runs sequential local jobs with an explicit per-job result; partial failures remain inspectable. */
async function runPlan(command,argv){
  const opts=options(argv,command==='compare'?['--input','--config','--out']:['--config','--out']);
  if(!opts['--config']||!opts['--out']||(command==='compare'&&!opts['--input']))throw Error(command+' requires --config PLAN.json --out NEW-DIR'+(command==='compare'?' --input IMAGE':''));
  const file=path.resolve(opts['--config']),base=path.dirname(file),plan=readJSON(file),cache=new Map();let specs;
  if(command==='compare'){
    object(plan,['version','variants','dpi','marksMm','paper','exports'],'comparison');
    if(plan.paper&&['auto','recipe'].includes(plan.paper))throw Error('Compare requires one explicit stock id, not auto or recipe paper');
    if(!Array.isArray(plan.variants)||plan.variants.length<2||plan.variants.length>8)throw Error('Compare requires 2..8 variants');
    specs=plan.variants.map(variant=>{object(variant,['id','config','screen','style','styleVariant','lpi','seed'],'variant');return {...variant,input:path.resolve(opts['--input']),dpi:plan.dpi??300,marksMm:plan.marksMm??0,paper:plan.paper??'rag',...(plan.exports===undefined?{}:{exports:plan.exports})};});
  }else{
    object(plan,['version','jobs'],'batch');if(!Array.isArray(plan.jobs)||!plan.jobs.length||plan.jobs.length>16)throw Error('Batch requires 1..16 jobs');specs=plan.jobs;
  }
  if(plan.version!==1)throw Error('Unsupported plan version');
  const jobs=specs.map(raw=>prepare(raw,base,cache));if(new Set(jobs.map(x=>x.id)).size!==jobs.length)throw Error('Duplicate job id');
  if(jobs.reduce((n,j)=>n+j.probe.displayWidth*j.probe.displayHeight,0)>96000000)throw Error('Plan exceeds 96 megapixel work budget');
  const out=path.resolve(opts['--out']);directory(out);
  write(path.join(out,'plan.json'),json(plan));const records=[],controlled=command==='compare';
  const report={contract:'stipra-'+command+'-v1',status:'running',planSha256:hash(Buffer.from(json(plan))),controlledSource:controlled,
    ...(controlled?{controls:{sourceSha256:jobs[0].sourceSha256,frame:{width:jobs[0].probe.displayWidth,height:jobs[0].probe.displayHeight},dpi:jobs[0].dpi,marksMm:jobs[0].marksMm,paper:jobs[0].paper,framing:'complete oriented source, no crop or scale'}}:{}),
    environment:{node:process.version,platform:process.platform,arch:process.arch,skiaCanvas:JSON.parse(read(path.join(path.dirname(require.resolve('skia-canvas')),'../package.json'),64*1024)).version},jobs:records,calibrated:false};
  for(const job of jobs){
    const start=performance.now();
    try{
      const asset=await ingestLocalBytes(job.originalBytes,path.basename(job.input)),result=await Package.generate({...job,asset});
      const checked=await verify(result.zip),packageName=job.id+'.zip';write(path.join(out,packageName),result.zip);
      const {manifest,...verification}=checked;write(path.join(out,job.id+'-verification.json'),json(verification));
      const preview=result.parts.get('proof/composite.png'),proofName=job.id+'-proof.png',sourcePreview=result.parts.get('source/normalized.png'),sourceName=job.id+'-source.png';write(path.join(out,proofName),preview);write(path.join(out,sourceName),sourcePreview);
      records.push({id:job.id,status:'ok',package:packageName,source:sourceName,sourcePreviewSha256:hash(sourcePreview),proof:proofName,proofSha256:hash(preview),packageSha256:hash(result.zip),sourceSha256:job.sourceSha256,frame:checked.frame,inks:checked.inks,
        recipes:{inks:manifest.files.find(x=>x.path==='recipe/inks.json').sha256,screens:manifest.files.find(x=>x.path==='recipe/screens.json').sha256},
        coverage:manifest.inks.map(x=>({id:x.id,name:x.name,color:x.color,continuous:x.meanCoverage,screened:x.screenedMeanCoverage})),style:manifest.style??null,elapsedMs:Number((performance.now()-start).toFixed(2))});
    }catch(error){records.push({id:job.id,status:'error',sourceSha256:job.sourceSha256,error:{code:error.code??'JOB_FAILED',message:error.message}});}
  }
  report.peakProcessRssBytes=process.resourceUsage().maxRSS*1024;
  report.status=records.every(x=>x.status==='ok')?'ok':records.some(x=>x.status==='ok')?'partial':'error';
  write(path.join(out,'workflow-manifest.json'),json(report));write(path.join(out,'index.html'),contactSheet(records,controlled));
  return report;
}
async function inspectPackage(argv){
  const opts=options(argv,['--input']);if(!opts['--input'])throw Error('verify requires --input PACKAGE.zip');
  const {manifest,...report}=await verify(read(path.resolve(opts['--input']),64*1024*1024));return report;
}
async function sheet(argv){
  const opts=options(argv,['--input','--out']);if(!opts['--input']||!opts['--out'])throw Error('sheet requires --input PACKAGE.zip --out NEW-DIR');
  const bytes=read(path.resolve(opts['--input']),64*1024*1024),checked=await verify(bytes),archive=await require('../src/archive').openArchive(bytes),out=path.resolve(opts['--out']);
  directory(out);for(const key of ['html','pdf'])write(path.join(out,'separation-sheet.'+key),await archive.read(checked.manifest.report[key]));
  const {manifest,...verification}=checked;write(path.join(out,'verification.json'),json(verification));return {status:'ok',files:['separation-sheet.html','separation-sheet.pdf','verification.json'],verification};
}
module.exports={runPlan,inspectPackage,sheet,prepare,options};
