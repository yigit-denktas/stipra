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
 if(name.endsWith('.js')||name.endsWith('.mjs'))return 'text/javascript; charset=utf-8';
 if(name.endsWith('.html'))return 'text/html; charset=utf-8';
 if(name.endsWith('.css'))return 'text/css; charset=utf-8';
 if(name.endsWith('.json'))return 'application/json; charset=utf-8';
 if(name.endsWith('.svg'))return 'image/svg+xml';
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
 const page=process.env.STIPRA_SMOKE_PAGE||'examples/import-studio/browser-smoke.html';
 if(!/^(?:examples|web)\/[a-z0-9-]+\/browser-smoke\.html$/.test(page))throw Error('Invalid smoke page path');
 const url='http://127.0.0.1:'+server.address().port+'/'+page;
 try{
   const child=spawn(bin,['--headless','--no-sandbox','--disable-gpu','--enable-precise-memory-info','--disable-dev-shm-usage','--no-first-run','--remote-debugging-pipe','about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
   let serial=0,pending=new Map(),buffer='',stderr='';
   const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
     const id=++serial;pending.set(id,{resolve,reject});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
   });
   child.stderr.on('data',data=>{stderr=(stderr+data).slice(-2500);});
   child.stdio[4].on('data',data=>{
     buffer+=data.toString();let at;
     while((at=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!raw)continue;
       const message=JSON.parse(raw),item=pending.get(message.id);if(item){pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}
     }
   });
   const failure=error=>{for(const item of pending.values())item.reject(error);pending.clear();};
   child.on('error',failure);child.on('exit',code=>failure(Error('Chrome exited '+code+': '+stderr)));
   let timer;
   try{
     const timeout=page==='examples/alpha/browser-smoke.html'?180000:60000;
     const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Browser smoke wall-clock deadline exceeded')),timeout);});
     await Promise.race([deadline,(async()=>{
       const target=await call('Target.createTarget',{url:'about:blank'});
       const {sessionId}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
       await call('Page.enable',{},sessionId);await call('Page.navigate',{url},sessionId);
       for(;;){
         const response=await call('Runtime.evaluate',{expression:'JSON.stringify({state:document.body?.dataset.smoke,output:document.getElementById("out")?.textContent})',returnByValue:true},sessionId);
         const state=JSON.parse(response.result.value||'{}');
         if(state.state==='fail')throw Error('Browser smoke failed: '+state.output);
         if(state.state==='pass'){
           if(state.output!==(process.env.STIPRA_SMOKE_EXPECT||'BROWSER_SMOKE_PASS'))throw Error('Unexpected smoke result: '+state.output);
           if(page==='examples/alpha/browser-smoke.html'){
             const value=await call('Runtime.evaluate',{expression:'document.getElementById("evidence").textContent',returnByValue:true},sessionId);
             const evidence=JSON.parse(value.result.value),dir=path.join(root,'out/alpha-validation');fs.mkdirSync(dir,{recursive:true});
             evidence.environment.repositoryCommit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
             fs.writeFileSync(path.join(dir,'browser-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
           }
           break;
         }
         await new Promise(resolve=>setTimeout(resolve,100));
       }
     })()]);
   }finally{clearTimeout(timer);child.kill('SIGKILL');}
   process.stdout.write('Chromium browser smoke: PASS ('+page+')\n');
 }finally{server.close();}
}
if(require.main===module)run().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={run};
