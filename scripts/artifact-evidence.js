'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const activeRecords=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'licenses/third-party/artifact-review.json'))).records.filter(x=>!x.retired);
function platform(){
  return {os:process.platform,arch:process.arch,libc:process.platform==='linux'?(process.report.getReport().header.glibcVersionRuntime?'glibc':'musl'):null};
}
/** Verifies recorded artifact bytes without treating a hash match as provenance clearance. */
function verifyArtifacts(root=ROOT,records=activeRecords()){
  const host=platform(),evidence=[];
  for(const record of records){
    const pkgDir=path.join(root,'node_modules',record.package),pkg=JSON.parse(fs.readFileSync(path.join(pkgDir,'package.json')));
    if(pkg.version!==record.version)throw Error('Artifact review version changed: '+record.package);
    const bytes=fs.readFileSync(path.join(pkgDir,record.artifact)),actual={bytes:bytes.length,sha256:hash(bytes)};
    const applies=!record.platform||Object.entries(record.platform).every(([key,value])=>host[key]===value);
    if(applies&&(actual.bytes!==record.bytes||actual.sha256!==record.sha256))throw Error('Reviewed artifact bytes changed: '+record.package+'/'+record.artifact);
    evidence.push({package:record.package,version:pkg.version,artifact:record.artifact,...actual,
      ...(record.platform?{platform:host}:{}),identity:applies?'matches-record':'unrecorded-platform',distribution:'review-required'});
  }
  return evidence;
}
/** Checks identities only for reviewed artifacts in the resolved bundle input graph. */
function verifyIncludedArtifacts(inputs,root=ROOT,records=activeRecords()){
  const paths=new Set(inputs.map(x=>x.path));
  return verifyArtifacts(root,records.filter(x=>paths.has('node_modules/'+x.package+'/'+x.artifact)));
}
module.exports={verifyArtifacts,verifyIncludedArtifacts,hash};
