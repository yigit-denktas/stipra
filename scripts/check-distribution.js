#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {hash}=require('./artifact-evidence'),ROOT=path.resolve(__dirname,'..');
const POLICY={
  core:{name:'@stipra/core',peers:[],entries:['dist/index.mjs','dist/index.cjs'],files:['LICENSE','README.md','package.json','dist/index.mjs','dist/index.cjs','dist/index.d.mts','dist/index.d.cts']},
  canvas:{name:'@stipra/canvas',peers:['@stipra/core'],entries:['index.mjs'],files:['LICENSE','README.md','package.json','index.mjs','index.d.ts']},
  inputs:{name:'@stipra/inputs',peers:['@stipra/canvas'],entries:['dist/index.mjs','dist/index.cjs','canvas.mjs'],files:['LICENSE','README.md','package.json','dist/index.mjs','dist/index.cjs','dist/index.d.mts','dist/index.d.cts','canvas.mjs','canvas.d.mts']}
};
function same(actual,expected,label){
  if(JSON.stringify([...actual].sort())!==JSON.stringify([...expected].sort()))throw Error('Unexpected '+label+': '+JSON.stringify(actual));
}
/** Checks packed files and imports; optional exporter callbacks remain outside this scope. */
async function inspect(files,policy){
  same(Object.keys(files),policy.files,'packed files');
  const pkg=JSON.parse(files['package.json']);
  if(pkg.name!==policy.name||pkg.license!=='MIT'||pkg.private!==true)throw Error('Unexpected package identity/license/private flag');
  for(const key of ['dependencies','optionalDependencies','bundledDependencies','bundleDependencies','scripts'])
    if(pkg[key]&&Object.keys(pkg[key]).length)throw Error('Unexpected runtime dependencies or lifecycle scripts: '+key);
  same(Object.keys(pkg.peerDependencies||{}),policy.peers,'peer dependencies');
  for(const version of Object.values(pkg.peerDependencies||{}))if(version!=='0.1.0-alpha.0')throw Error('Unreviewed peer version');
  if(files.LICENSE.toString()!==fs.readFileSync(path.join(ROOT,'LICENSE'),'utf8'))throw Error('Packed MIT notice differs from repository notice');
  const imports=new Set();
  for(const entry of policy.entries){
    const result=await require('esbuild').build({entryPoints:[entry],bundle:true,
      platform:'browser',format:'esm',write:false,logLevel:'silent',logOverride:{'unsupported-dynamic-import':'warning','unsupported-require-call':'warning'},metafile:true,plugins:[{name:'packed-files',setup(api){
        api.onResolve({filter:/.*/},args=>{
          if(args.kind==='entry-point')return {path:entry,namespace:'packed'};
          if(policy.peers.includes(args.path)){imports.add(args.path);return {path:args.path,external:true};}
          if(!args.path.startsWith('.'))throw Error('Unreviewed packed import: '+args.path);
          const name=path.posix.normalize(path.posix.join(args.importer?path.posix.dirname(args.importer):path.posix.dirname(entry),args.path));
          if(!files[name])throw Error('Missing packed import: '+name);
          return {path:name,namespace:'packed'};
        });
        api.onLoad({filter:/.*/,namespace:'packed'},args=>({contents:files[args.path].toString(),loader:'js'}));
      }}]});
    if(result.warnings.length)throw Error('Unresolved packed import analysis: '+JSON.stringify(result.warnings));
    for(const output of Object.values(result.metafile.outputs))for(const item of output.imports)
      if(!policy.peers.includes(item.path))throw Error('Unexpected emitted import: '+item.path);
  }
  return {name:pkg.name,version:pkg.version,status:'checked',scope:'Exact local packed files and statically resolved runtime imports; no publication or optional exporter/host clearance.',
    license:pkg.license,private:pkg.private,peers:pkg.peerDependencies||{},imports:[...imports].sort(),
    files:Object.entries(files).sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>({path:name,bytes:bytes.length,sha256:hash(bytes)}))};
}
/** Builds and inspects local tarballs without installing or publishing them. Requires system tar. */
async function check(out=path.join(ROOT,'out/distribution-audit')){
  await require('./build-core').build();await require('./build-inputs').build();
  fs.copyFileSync(path.join(ROOT,'LICENSE'),path.join(ROOT,'packages/canvas/LICENSE'));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-distribution-')),packages=[];
  try{
    fs.mkdirSync(out,{recursive:true});
    for(const [name,policy]of Object.entries(POLICY)){
      const [pack]=JSON.parse(cp.execFileSync('npm',['pack',path.join(ROOT,'packages',name),'--json','--ignore-scripts','--offline','--pack-destination',temp],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
      const archive=path.join(temp,pack.filename);
      const names=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:1024*1024}).trim().split('\n');
      same(names,policy.files.map(file=>'package/'+file),'archive entries');
      const files={};
      for(const file of policy.files)files[file]=cp.execFileSync('tar',['-xOzf',archive,'--','package/'+file],{maxBuffer:1024*1024});
      const report=await inspect(files,policy),bytes=fs.readFileSync(archive);
      if(bytes.length!==pack.size)throw Error('Packed size mismatch');
      packages.push({...report,tarball:{file:pack.filename,bytes:bytes.length,sha256:hash(bytes),integrity:pack.integrity}});
      fs.copyFileSync(archive,path.join(out,pack.filename));
    }
    const report={contract:'stipra-lean-distribution-audit-v1',status:'checked',node:process.version,packages,
      exclusions:['Browser PDF/ZIP exporter, native CLI, p5 host and artwork are separate artifacts.','Packages remain private and unpublished; #70 artist/usefulness and publication decisions remain open.']};
    fs.writeFileSync(path.join(out,'distribution-audit.json'),JSON.stringify(report,null,2)+'\n');return report;
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)check().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={check,inspect,POLICY};
