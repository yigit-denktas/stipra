#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process'),{Canvas}=require('skia-canvas');
const {inspectCredentials,POLICY}=require('../src/adapters/provenance');
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function tamper(bytes){
  const chunks=[bytes.subarray(0,8)];let changed=false;
  for(let at=8;at<bytes.length;){const n=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),end=at+n+12;
    if(type==='IDAT'&&!changed){const raw=zlib.inflateSync(bytes.subarray(at+8,end-4));raw[1]^=1;const data=zlib.deflateSync(raw),chunk=Buffer.alloc(data.length+12);chunk.writeUInt32BE(data.length);chunk.write('IDAT',4);data.copy(chunk,8);chunk.writeUInt32BE(crc(chunk.subarray(4,-4)),chunk.length-4);chunks.push(chunk);changed=true;}else chunks.push(bytes.subarray(at,end));at=end;
  }assert.ok(changed);return Buffer.concat(chunks);
}
async function run(tool=process.env.C2PATOOL,out='out/structured-inputs/provenance'){
  if(!tool)throw Error('Set C2PATOOL to the local pinned validator; no automatic download or remote verification');
  tool=path.resolve(tool);fs.mkdirSync(out,{recursive:true});const asset=path.resolve(out,'procedural.png'),settings=path.resolve(out,'offline.json');
  const c=new Canvas(16,16),ctx=c.getContext('2d');ctx.fillStyle='#006043';ctx.fillRect(0,0,16,16);ctx.fillStyle='#ff665d';ctx.fillRect(4,4,4,8);
  const original=Buffer.from(await c.toBuffer('png'));fs.writeFileSync(asset,original);fs.writeFileSync(settings,JSON.stringify(POLICY));
  const signed=path.resolve(out,'signed.png');execFileSync(tool,[asset,'--settings',settings,'-c','{"assertions":[]}','--create','digitalArt','-o',signed,'--force'],{stdio:'pipe',timeout:20000});
  let requests=0;const server=http.createServer((req,res)=>{requests++;res.writeHead(404).end();});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    const remote=path.resolve(out,'remote.png');execFileSync(tool,[asset,'--settings',settings,'-c','{"assertions":[]}','--create','digitalArt','--remote',`http://127.0.0.1:${server.address().port}/manifest.c2pa`,'-o',remote,'--force'],{stdio:'pipe',timeout:20000});
    const bytes=fs.readFileSync(signed),reports={notInspected:await inspectCredentials(original),absent:await inspectCredentials(original,{tool}),signed:await inspectCredentials(bytes,{tool}),tampered:await inspectCredentials(tamper(bytes),{tool}),remote:await inspectCredentials(fs.readFileSync(remote),{tool})};
    assert.equal(reports.notInspected.inspection,'not-inspected');assert.equal(reports.absent.inspection,'absent');assert.equal(reports.signed.binding,'valid');assert.equal(reports.signed.signerTrust,'untrusted');assert.equal(reports.tampered.binding,'invalid');assert.equal(requests,0);
    const evidence={contract:'stipra-provenance-pilot-v1',tool,requests,license:'MIT OR Apache-2.0 (external c2patool; not redistributed)',reports};fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');return {cases:Object.keys(reports).length,requests,signed:reports.signed.binding,tampered:reports.tampered.binding};
  }finally{await new Promise(r=>server.close(r));}
}
if(require.main===module)run().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e);process.exitCode=1;});module.exports={run,tamper};
