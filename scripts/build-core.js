#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const esbuild=require('esbuild'),ROOT=path.resolve(__dirname,'..');
function atomic(file,bytes){
  const temp=file+'.'+process.pid+'.'+Date.now().toString(36)+'.tmp';
  fs.writeFileSync(temp,bytes);
  try{fs.renameSync(temp,file);}
  catch(error){
    // Parallel test/build processes may already have produced the same artifact;
    // Windows can reject replacing a file another process is reading.
    if((error.code==='EPERM'||error.code==='EACCES')&&fs.existsSync(file)){
      let same=false;try{same=fs.readFileSync(file).equals(bytes);}catch{}
      if(same){try{fs.rmSync(temp,{force:true});}catch{}return;}
    }
    throw error;
  }
}
async function build(){
  const root=path.join(ROOT,'packages/core'),out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
  const builds=[];
  for(const [format,name,entry] of [['esm','index.mjs','packages/core/entry.mjs'],['cjs','index.cjs','src/sdk/index.js']]){
    const result=await esbuild.build({absWorkingDir:ROOT,entryPoints:[entry],outfile:path.join(out,name),bundle:true,
      platform:'browser',format,target:'es2020',minify:true,legalComments:'inline',metafile:true,write:false});
    const inputs=Object.keys(result.metafile.inputs).sort();
    if(inputs.some(x=>x.includes('node_modules/')))throw Error('Core must not bundle third-party runtime code');
    for(const value of Object.values(result.metafile.outputs))if(value.imports.length)throw Error('Core must be self-contained');
    const bytes=Buffer.from(result.outputFiles[0].contents);atomic(path.join(out,name),bytes);
    builds.push({entry:name,bytes:bytes.length,gzipBytes:zlib.gzipSync(bytes).length,
      sha256:crypto.createHash('sha256').update(bytes).digest('hex'),inputs});
  }
  const types=fs.readFileSync(path.join(root,'index.d.ts'));
  for(const name of ['index.d.mts','index.d.cts'])atomic(path.join(out,name),types);
  atomic(path.join(root,'LICENSE'),fs.readFileSync(path.join(ROOT,'LICENSE')));
  const report={contract:'stipra-core-build-v1',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,
    runtimeDependencies:[],buildTool:'esbuild/'+esbuild.version,builds};
  atomic(path.join(out,'build-report.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
if(require.main===module)build().then(report=>console.log(JSON.stringify(report,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
