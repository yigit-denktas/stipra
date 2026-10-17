#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
async function build(){
  const root=path.resolve(__dirname,'..'),pkg=path.join(root,'packages/inputs'),out=path.join(pkg,'dist');fs.mkdirSync(out,{recursive:true});const report=[];
  for(const [format,file]of [['esm','index.mjs'],['cjs','index.cjs']]){
    const result=await require('esbuild').build({absWorkingDir:root,entryPoints:['packages/inputs/entry.mjs'],bundle:true,platform:'browser',format,target:'es2020',minify:true,metafile:true,write:false});
    if(Object.keys(result.metafile.inputs).some(x=>x.includes('node_modules/')))throw Error('Inputs must remain dependency-free');
    const data=Buffer.from(result.outputFiles[0].contents),temp=path.join(out,file+'.'+process.pid+'.tmp');fs.writeFileSync(temp,data);fs.renameSync(temp,path.join(out,file));
    report.push({file,bytes:data.length,gzipBytes:zlib.gzipSync(data).length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
  }
  for(const file of ['index.d.mts','index.d.cts'])fs.copyFileSync(path.join(pkg,'index.d.ts'),path.join(out,file));fs.copyFileSync(path.join(root,'LICENSE'),path.join(pkg,'LICENSE'));
  fs.writeFileSync(path.join(out,'build-report.json'),JSON.stringify({contract:'stipra-inputs-build-v1',builds:report},null,2)+'\n');return report;
}
if(require.main===module)build().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e);process.exitCode=1;});module.exports={build};
