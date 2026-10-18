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
const widths=[320,390,768,1440],states=['','?q=ink','#cap-INK-01'];
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
 try{
  for(const w of widths)for(const [idx,state]of states.entries()){
   const images=[];
   for(const variant of ['before','after']){
    const file=path.join(out,w+'-'+idx+'-'+variant+'.png');
    const url='http://127.0.0.1:'+server.address().port+'/'+variant+'/roadmap/index.html'+state;
    const args=['--headless','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars','--force-device-scale-factor=1','--window-size='+w+',1100','--virtual-time-budget=2200','--screenshot='+file,url];
    const result=await new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.on('data',x=>stderr=(stderr+x.toString()).slice(-800));p.on('error',reject);p.on('close',code=>resolve({code,stderr}));});
    if(result.code!==0||!fs.existsSync(file))throw Error('Chromium screenshot failed: '+w+' '+variant+' '+result.stderr);
    images.push(fs.readFileSync(file));
   }
   const identical=images[0].equals(images[1]);results.push({width:w,state:state||'default',pixelExact:identical});
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({checked:results.length,identical:results.filter(x=>x.pixelExact).length,results},null,2));
  if(results.some(x=>!x.pixelExact))throw Error('CSS visual differences: compare the before/after PNG files in '+out);
 }finally{await new Promise(resolve=>server.close(resolve));}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1});
