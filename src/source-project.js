'use strict';
const V=require('./structured/validation');
const ROLES=['sketch-source','parameters','geometry','region-coverage','auxiliary-data','validation-report','reference'];
/** Takes an owned, inert copy of explicitly selected project artifacts before asynchronous export. */
function freezeProject(raw,width,height){
  if(raw==null)return null;
  V.object(raw,['version','frame','artifacts','relationships'],'source project');
  if(raw.version!==1)V.fail('source-project version must be 1');
  const frame=V.jsonData(raw.frame);V.object(frame,['width','height','origin','transform'],'project frame');
  V.dimensions(frame.width,frame.height);
  if(frame.width!==width||frame.height!==height)V.fail('project frame differs from snapshot');
  V.object(frame.origin,['x','y'],'frame origin');
  if(![frame.origin.x,frame.origin.y].every(Number.isSafeInteger)||!Array.isArray(frame.transform)||frame.transform.length!==6||!frame.transform.every(Number.isFinite))V.fail('declare frame origin and six affine coefficients');
  if(!Array.isArray(raw.artifacts)||raw.artifacts.length<1||raw.artifacts.length>32)V.fail('select 1..32 project artifacts');
  let total=0;const ids=new Set();
  const artifacts=raw.artifacts.map(a=>{
    V.object(a,['id','name','role','mediaType','bytes','provenance'],'artifact');V.id(a.id);V.text(a.name,'artifact name',200);
    if(ids.has(a.id)||!ROLES.includes(a.role))V.fail('duplicate artifact ID or unknown role');ids.add(a.id);
    if(typeof a.mediaType!=='string'||!/^[-\w.+]+\/[-\w.+]+$/.test(a.mediaType))V.fail('declare artifact media type');
    if(!(a.bytes instanceof Uint8Array)||a.bytes.length>16*1024*1024)V.fail('artifact exceeds 16 MiB or is not bytes');
    V.bytes(a.bytes,a.bytes.length);total+=a.bytes.length;if(total>32*1024*1024)V.fail('project exceeds 32 MiB');
    return {id:a.id,name:a.name,role:a.role,mediaType:a.mediaType,bytes:new Uint8Array(a.bytes),...(a.provenance?{provenance:V.provenance(a.provenance)}:{})};
  });
  if(!Array.isArray(raw.relationships)||raw.relationships.length>128)V.fail('declare bounded project relationships');
  const relationships=raw.relationships.map(r=>{V.object(r,['from','to','kind'],'relationship');if(!ids.has(r.from)||!ids.has(r.to))V.fail('relationship references unknown artifact');V.id(r.kind);return {...r};});
  const metadata={version:1,frame,artifacts:artifacts.map(({bytes,...a})=>a),relationships};
  if(new TextEncoder().encode(JSON.stringify(metadata)).length>96*1024)V.fail('project metadata exceeds 96 KiB');
  return {version:1,frame,artifacts,relationships};
}
module.exports={freezeProject};
