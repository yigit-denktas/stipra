#!/usr/bin/env node
'use strict';
/* Pixel-exact before/after CSS screenshots. Requires built dist/stipra,
   Chromium, and the committed pre-refactor fixture. No npm dependencies. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn,spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist/stipra');
const fixture=path.join(root,'tests/fixtures/roadmap-before-good-css.css');
const out=path.join(root,'out/roadmap-css-visual');
const widths=[320,390,768,1440],states=['','?q=ink','#cap-INK-01','?expanded=1'];
function chrome(){for(const b of [process.env.CHROME_BIN,'chromium','google-chrome','google-chrome-stable'].filter(Boolean)){
 const p=spawnSync(b,['--version'],{encoding:'utf8',timeout:5000});if(p.status===0)return b;
}throw Error('Chromium unavailable: set CHROME_BIN');}
async function run(){
 assert.ok(fs.existsSync(path.join(dist,'roadmap/index.html')),'Run npm run build:pages first');
 assert.ok(fs.existsSync(fixture),'Missing original CSS fixture');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),parts=decodeURIComponent(url.pathname).split('/');
  const variant=parts[1];if(!['before','after'].includes(variant)){res.writeHead(404).end();return;}
  const name=parts.slice(2).join('/'),file=variant==='before'&&name==='roadmap/roadmap.css'?fixture:path.resolve(dist,name);
  if(!file.startsWith(dist+path.sep)&&file!==fixture){res.writeHead(403).end();return;}
  const types={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
  fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
 }catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const bin=chrome(),results=[];
 const child=spawn(bin,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-pipe','about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
 let pending=new Map(),serial=0,stream='',sessionId,stderr='';
 child.stderr.on('data',x=>stderr=(stderr+x.toString()).slice(-1000));
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});
 child.stdio[4].on('data',chunk=>{stream+=chunk.toString();let n;while((n=stream.indexOf('\0'))>=0){const raw=stream.slice(0,n);stream=stream.slice(n+1);if(!raw)continue;const x=JSON.parse(raw),p=pending.get(x.id);if(p){pending.delete(x.id);x.error?p.reject(Error(x.error.message)):p.resolve(x.result);}}});
 child.on('exit',code=>{for(const p of pending.values())p.reject(Error('Chrome exit '+code+' '+stderr));pending.clear();});
 try{
  const {targetId}=await call('Target.createTarget',{url:'about:blank'});
  sessionId=(await call('Target.attachToTarget',{targetId,flatten:true})).sessionId;
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});

  for(const w of widths)for(const [idx,state]of states.entries()){
   const images=[];
   for(const variant of ['before','after']){
    const file=path.join(out,w+'-'+idx+'-'+variant+'.png');
    const url='http://127.0.0.1:'+server.address().port+'/'+variant+'/roadmap/index.html'+state;
    await call('Emulation.setDeviceMetricsOverride',{width:w,height:1100,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url});
    for(let attempt=0;attempt<100;attempt++){
     const check=await call('Runtime.evaluate',{expression:'document.readyState==="complete"&&document.fonts.status==="loaded"&&!!document.querySelector(".r-site")',returnByValue:true});
     if(check.result.value)break;
     if(attempt===99)throw Error('Page never finished loading '+url);
     await new Promise(resolve=>setTimeout(resolve,50));
    }
    if(state==='?q=ink')await call('Runtime.evaluate',{expression:'document.querySelector(".r-search")?.scrollIntoView({block:"start"})'});
    if(state==='?expanded=1')await call('Runtime.evaluate',{expression:'(()=>{const area=document.querySelector(".r-area");if(area){area.open=true;area.querySelector(".r-record details")?.setAttribute("open","");area.scrollIntoView({block:"start"});}return !!area})()',returnByValue:true});
    if(state.startsWith('#')){
     const checked=await call('Runtime.evaluate',{expression:'document.getElementById("cap-INK-01")?.closest("details")?.open',returnByValue:true});
     assert.equal(checked.result.value,true,'Incoming deep link should open its disclosure');
    }
    const overflow=await call('Runtime.evaluate',{expression:'document.documentElement.scrollWidth > innerWidth',returnByValue:true});
    assert.equal(overflow.result.value,false,'Unexpected horizontal overflow at '+w+' '+state);
    const png=Buffer.from((await call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64');
    fs.writeFileSync(file,png);images.push(png);
   }
   const identical=images[0].equals(images[1]);results.push({width:w,state:state||'default',pixelExact:identical});
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({checked:results.length,identical:results.filter(x=>x.pixelExact).length,results},null,2));
  if(results.some(x=>!x.pixelExact))throw Error('CSS visual differences: compare the before/after PNG files in '+out);
 }finally{child.kill();await new Promise(resolve=>server.close(resolve));}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1});
