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
   let serial=0,pending=new Map(),buffer='',stderr='';const externalRequests=[];
   const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
     const id=++serial;pending.set(id,{resolve,reject});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
   });
   child.stderr.on('data',data=>{stderr=(stderr+data).slice(-2500);});
   child.stdio[4].on('data',data=>{
     buffer+=data.toString();let at;
     while((at=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!raw)continue;
       const message=JSON.parse(raw),item=pending.get(message.id);
       if(message.method==='Network.requestWillBeSent'){const requested=message.params.request.url;if(/^https?:/.test(requested)&&new URL(requested).origin!==new URL(url).origin)externalRequests.push(requested);}if(item){pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}
     }
   });
   const failure=error=>{for(const item of pending.values())item.reject(error);pending.clear();};
   child.on('error',failure);child.on('exit',code=>failure(Error('Chrome exited '+code+': '+stderr)));
   let timer;
   try{
     const timeout=['examples/alpha/browser-smoke.html','examples/accessibility/browser-smoke.html'].includes(page)?180000:60000;
     const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Browser smoke wall-clock deadline exceeded')),timeout);});
     await Promise.race([deadline,(async()=>{
       const target=await call('Target.createTarget',{url:'about:blank'});
       const {sessionId}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
       await call('Page.enable',{},sessionId);await call('Network.enable',{},sessionId);await call('Page.navigate',{url},sessionId);
       for(;;){
         const response=await call('Runtime.evaluate',{expression:'JSON.stringify({state:document.body?.dataset.smoke,output:document.getElementById("out")?.textContent})',returnByValue:true},sessionId);
         const state=JSON.parse(response.result.value||'{}');
         if(page==='examples/accessibility/browser-smoke.html'&&['pass','fail'].includes(state.state)){
           const raw=await call('Runtime.evaluate',{expression:'document.getElementById("evidence").textContent',returnByValue:true},sessionId);
           const dir=path.join(root,'out/accessibility');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'audit.json'),raw.result.value+'\n');
         }
         if(state.state==='fail')throw Error('Browser smoke failed: '+state.output);
         if(state.state==='pass'){
           if(state.output!==(process.env.STIPRA_SMOKE_EXPECT||'BROWSER_SMOKE_PASS'))throw Error('Unexpected smoke result: '+state.output);
           if(page==='examples/accessibility/browser-smoke.html'){
             const file=path.join(root,'out/accessibility/audit.json'),audit=JSON.parse(fs.readFileSync(file));audit.keyboard=[];
             try{
               for(const [route] of require('./build-site-info').ROUTES){
                 const destination='/dist/stipra/'+(route.endsWith('.html')?route:route+'index.html');
                 await call('Page.navigate',{url:new URL(destination,url).href},sessionId);
                 for(;;){const ready=await call('Runtime.evaluate',{expression:'location.pathname==='+JSON.stringify(destination)+' && document.readyState==="complete" && Boolean(document.querySelector(".skip-link"))',returnByValue:true},sessionId);if(ready.result.value)break;await new Promise(resolve=>setTimeout(resolve,50));}
                 for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9},sessionId);
                 const focused=await call('Runtime.evaluate',{expression:'JSON.stringify({skip:document.activeElement.matches(".skip-link"),visible:document.activeElement.getBoundingClientRect().top>=0 && document.activeElement.getBoundingClientRect().bottom<=innerHeight})',returnByValue:true},sessionId);
                 const checked=JSON.parse(focused.result.value);if(!checked.skip||!checked.visible)throw Error('First Tab must expose the skip link: '+route);
                 for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13},sessionId);
                 const target=await call('Runtime.evaluate',{expression:'document.activeElement.id==="main-content" && location.hash==="#main-content"',returnByValue:true},sessionId);
                 if(!target.result.value)throw Error('Enter must focus the main content: '+route);
                 audit.keyboard.push({route,firstTabVisible:true,enterFocusesMain:true});
               }
             }catch(error){audit.keyboardError=error.message;throw error;}
             finally{fs.writeFileSync(file,JSON.stringify(audit,null,2)+'\n');}
           }
           if(['examples/alpha/browser-smoke.html','examples/regions/browser-smoke.html','examples/export-validation/browser-smoke.html'].includes(page)){
             const value=await call('Runtime.evaluate',{expression:'document.getElementById("evidence").textContent',returnByValue:true},sessionId);
             const evidence=JSON.parse(value.result.value),dir=path.join(root,page==='examples/regions/browser-smoke.html'?'out/structured-inputs':page==='examples/export-validation/browser-smoke.html'?'out/export-workflow':'out/alpha-validation');fs.mkdirSync(dir,{recursive:true});
             if(evidence.environment)evidence.environment.repositoryCommit=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
             if(page==='examples/regions/browser-smoke.html'){
               await call('Page.navigate',{url:url.replace('/examples/regions/browser-smoke.html','/dist/stipra/regions/index.html')},sessionId);
               await new Promise(resolve=>setTimeout(resolve,1000));
               const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(dir,'regions-desktop.png'),Buffer.from(screenshot.data,'base64'));
               await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
               const mobile=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(dir,'regions-mobile.png'),Buffer.from(mobile.data,'base64'));
             }
             if(page==='examples/export-validation/browser-smoke.html'){
               await call('Page.navigate',{url:url.replace('/examples/export-validation/browser-smoke.html','/out/export-workflow/compare/index.html')},sessionId);
               await new Promise(resolve=>setTimeout(resolve,500));
               const desktop=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(dir,'comparison-desktop.png'),Buffer.from(desktop.data,'base64'));
               await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
               const mobile=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(dir,'comparison-mobile.png'),Buffer.from(mobile.data,'base64'));
             }
             fs.writeFileSync(path.join(dir,'browser-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
           }
           if(page==='web/stipra/browser-smoke.html'){
             if(externalRequests.length)throw Error('Unexpected external processing request');
             const dir=path.join(root,'out/workflow-validation');fs.mkdirSync(dir,{recursive:true});
             fs.writeFileSync(path.join(dir,'browser-checks.json'),JSON.stringify({contract:'stipra-workflow-browser-v1',externalRequests:externalRequests.length,checks:['import and color policy','mask edits','solo/mute/paper/native zoom','2–8 ink setup','keyboard focus and labels','responsive workspace and information pages','marked export pixels, hashes, density and PDF recipes']},null,2)+'\n');
             for(const [name,route]of [['studio','index.html'],['roadmap','roadmap/index.html'],['changelog','changelog/index.html'],['delivery','delivery/index.html'],['sitemap','sitemap/index.html']]){
               await call('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false},sessionId);
               await call('Page.navigate',{url:url.replace('/web/stipra/browser-smoke.html','/dist/stipra/'+route)},sessionId);
               await new Promise(resolve=>setTimeout(resolve,1000));
               if(name==='studio')await call('Runtime.evaluate',{expression:`(async()=>{const canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#006043';ctx.fillRect(30,30,280,220);ctx.fillStyle='#ff665d';ctx.fillRect(180,120,230,140);const blob=await new Promise(r=>canvas.toBlob(r));const transfer=new DataTransfer();transfer.items.add(new File([blob],'procedural-workflow.png',{type:'image/png'}));document.getElementById('drop').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));})()`,awaitPromise:true},sessionId);
               await new Promise(resolve=>setTimeout(resolve,500));
               for(const width of [1280,390]){
                 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390},sessionId);await new Promise(resolve=>setTimeout(resolve,150));
                 const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(dir,name+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
               }
             }
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
