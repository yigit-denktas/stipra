'use strict';
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile),VERSION='c2patool 0.28.2';
const POLICY={core:{allowed_network_hosts:[]},verify:{remote_manifest_fetch:false,ocsp_fetch:false,verify_trust:true}};
/** Runs an explicitly supplied local validator with offline settings; it does not establish content truth. */
async function inspectCredentials(bytes,{tool,mediaType='image/png'}={}){
  if(!tool)return {contract:'stipra-credentials-v1',inspection:'not-inspected',binding:'unknown',signerTrust:'unknown'};
  if(!path.isAbsolute(tool)||!(bytes instanceof Uint8Array)||bytes.length>32*1024*1024||!['image/png','image/jpeg'].includes(mediaType))throw Error('Provide an absolute local tool path and bounded PNG/JPEG bytes');
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^C2PA|^HTTP_PROXY$|^HTTPS_PROXY$|^ALL_PROXY$/i.test(key)));
  const version=(await run(tool,['--version'],{env,timeout:5000,maxBuffer:4096})).stdout.trim();if(version!==VERSION)throw Error('Provenance pilot requires '+VERSION);
  const owned=Buffer.from(bytes),dir=await fs.mkdtemp(path.join(os.tmpdir(),'stipra-credentials-'));
  try{
    const input=path.join(dir,mediaType==='image/png'?'asset.png':'asset.jpg'),settings=path.join(dir,'offline.json');await fs.writeFile(input,owned);await fs.writeFile(settings,JSON.stringify(POLICY));
    let stdout='',stderr='',exitCode=0;
    try{({stdout,stderr}=await run(tool,[input,'--settings',settings],{env,timeout:20000,maxBuffer:4*1024*1024}));}
    catch(error){if(error.killed||error.code==='ERR_CHILD_PROCESS_STDIO_MAXBUFFER')throw Error('Credential validator resource limit');stdout=error.stdout||'';stderr=error.stderr||'';exitCode=error.code;}
    let report=null;try{report=JSON.parse(stdout);}catch{}
    const active=report?.validation_results?.activeManifest,success=(active?.success||[]).map(x=>x.code),failure=(active?.failure||[]).map(x=>x.code);
    const absent=!report&&/No claim found/.test(stderr),validHash=success.includes('assertion.dataHash.match')||success.includes('assertion.bmffHash.match');
    const invalidHash=failure.some(x=>/^assertion\.(dataHash|bmffHash)\.mismatch$/.test(x));
    const trusted=success.includes('signingCredential.trusted'),untrusted=failure.includes('signingCredential.untrusted');
    return {contract:'stipra-credentials-v1',inspection:absent?'absent':report?'inspected':'error',
      binding:invalidHash?'invalid':validHash&&success.includes('claimSignature.validated')?'valid':'unknown',
      signerTrust:trusted?'trusted':untrusted?'untrusted':'unknown',tool:version,checkedAt:new Date().toISOString(),
      trustPolicy:'SDK default local trust configuration; no supplied anchors; remote requests denied; revocation freshness not checked',
      policy:POLICY,assetSha256:crypto.createHash('sha256').update(owned).digest('hex'),
      reportSha256:crypto.createHash('sha256').update(stdout).digest('hex'),exitCode,report,
      limitations:['Credentials refer to these original asset bytes, not Stiprā derivatives.','Binding and signer trust do not prove depicted truth, ownership, rights or absence of AI.']};
  }finally{await fs.rm(dir,{recursive:true,force:true});}
}
module.exports={inspectCredentials,POLICY,VERSION};
