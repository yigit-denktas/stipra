#!/usr/bin/env node
/* Dependency-free real browser smoke runner for a local, sandboxed HTTP server. */
'use strict';
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function chrome(){
 const candidates=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium','chromium-browser'].filter(Boolean);
 for(const candidate of candidates){
   try{
     const p=spawnSync(candidate,['--version'],{encoding:'utf8',timeout:5000});
     if(p.status===0)return candidate;
   }catch{}
 }
 throw Error('Chrome/Chromium executable not found; set CHROME_BIN (this smoke test must run in a real browser)');
}
function contentType(name){
 if(name.endsWith('.js'))return 'text/javascript; charset=utf-8';
 if(name.endsWith('.html'))return 'text/html; charset=utf-8';
 return 'application/octet-stream';
}
async function run(){
 const bin=chrome();
 const server=http.createServer((req,res)=>{
   try{
     const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
     const file=path.resolve(root,'.'+pathname);
     if(!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
     if(!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
     res.setHeader('Content-Type',contentType(file));
     fs.createReadStream(file).pipe(res);
   }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/examples/import-studio/browser-smoke.html';
 try{
   const result=await new Promise((resolve,reject)=>{
     const args=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--virtual-time-budget=12000','--dump-dom',url];
     const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});
     let stdout='',stderr='',timedOut=false;
     const timeout=setTimeout(()=>{timedOut=true;child.kill('SIGKILL');},45000);
     child.stdout.on('data',data=>{stdout+=data.toString();});
     child.stderr.on('data',data=>{stderr+=data.toString();});
     child.on('error',err=>{clearTimeout(timeout);reject(err);});
     child.on('close',code=>{
       clearTimeout(timeout);
       if(timedOut)return reject(Error('Browser smoke timed out'));
       if(code!==0)return reject(Error('Chrome failed (exit '+code+'): '+stderr.slice(-2500)));
       resolve(stdout);
     });
   });
   const output=result.match(/<output id="out">([^<]*)<\/output>/)?.[1]||'output missing';
   if(!/<body[^>]*data-smoke="pass"/.test(result)||output!=='BROWSER_SMOKE_PASS')
     throw Error('Browser smoke failed: '+output);
   process.stdout.write('Chromium browser import smoke: PASS (SVG drop, PNG alpha, unsafe SVG rejection)\n');
 }finally{server.close();}
}
if(require.main===module)run().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={run};
