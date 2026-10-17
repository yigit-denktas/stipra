'use strict';
const {mapRegions}=require('./regions');
const encode=x=>new TextEncoder().encode(JSON.stringify(x));
/** Archives owned region snapshots and their mapping, with no dependency on the drawing runtime. */
function regionProject(source,mapping){
  const mapped=mapRegions(source,mapping);
  if(source.regions.length>31)throw Error('Source projects support at most 31 region artifacts');
  const artifactId=i=>'region-'+String(i+1).padStart(2,'0');
  const description={contract:'stipra-region-source-v1',width:source.width,height:source.height,regions:mapped.regions.map((r,i)=>({...r,artifactId:artifactId(i)})),mapping:mapped.recipe};
  const descriptorBytes=encode(description);if(descriptorBytes.length>65536)throw Error('Region descriptor exceeds 64 KiB');
  return {version:1,frame:{width:source.width,height:source.height,origin:{x:0,y:0},transform:[1,0,0,1,0,0]},
    artifacts:[{id:'region-map',name:'regions.json',role:'parameters',mediaType:'application/json',bytes:descriptorBytes},
      ...source.regions.map((r,i)=>({id:artifactId(i),name:r.id+'.coverage',role:'region-coverage',mediaType:'application/octet-stream',bytes:new Uint8Array(r.coverage),provenance:r.provenance}))],
    relationships:source.regions.map((r,i)=>({from:'region-map',to:artifactId(i),kind:'maps'}))};
}
/** Reconstructs ink coverage from an inert, verified project without executing any source code. */
function replayRegions(project){
  const descriptor=project.artifacts.find(x=>x.id==='region-map');if(!descriptor)throw Error('Missing region-map artifact');
  if(descriptor.bytes.length>65536)throw Error('Region descriptor size limit');
  const raw=JSON.parse(new TextDecoder().decode(descriptor.bytes));
  if(raw.contract!=='stipra-region-source-v1'||raw.width!==project.frame.width||raw.height!==project.frame.height)throw Error('Region frame mismatch');
  if(!Array.isArray(raw.regions)||raw.regions.length>64)throw Error('Invalid region list');
  const source={width:raw.width,height:raw.height,regions:raw.regions.map(r=>{
    const artifact=project.artifacts.find(x=>x.id===r.artifactId);if(!artifact)throw Error('Missing region mask '+r.id);
    const {artifactId,...region}=r;return {...region,coverage:artifact.bytes};
  })};return mapRegions(source,raw.mapping);
}
module.exports={regionProject,replayRegions};
