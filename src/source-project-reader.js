'use strict';
const crypto=require('node:crypto'),{freezeProject}=require('./source-project');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
/** Verifies sidecar byte identity and snapshot linkage without interpreting or executing source files. */
async function readProject(archive,manifest,width,height){
  if(!manifest.sourceProject)return null;
  const ref=manifest.sourceProject;if(ref.path!=='source/project.json')throw Error('Invalid project descriptor path');
  const bytes=await archive.read(ref.path,128*1024);if(hash(bytes)!==ref.sha256)throw Error('Project descriptor hash mismatch');
  const project=JSON.parse(bytes);
  if(project.contract!=='stipra-source-project-v1'||project.snapshotSha256!==manifest.source.sha256||!Array.isArray(project.artifacts)||project.artifacts.length>32)throw Error('Invalid project linkage');
  const artifacts=[];
  for(const a of project.artifacts){
    if(a.path!=='source/project/files/'+a.id+'.bin')throw Error('Invalid project artifact path');
    const data=await archive.read(a.path,16*1024*1024);if(data.length!==a.bytes||hash(data)!==a.sha256)throw Error('Project artifact hash mismatch');
    const {path,sha256,bytes,...rest}=a;artifacts.push({...rest,bytes:new Uint8Array(data)});
  }
  return freezeProject({version:project.version,frame:project.frame,artifacts,relationships:project.relationships},width,height);
}
module.exports={readProject};
