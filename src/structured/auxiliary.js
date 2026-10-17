'use strict';
const V=require('./validation');
function grid(raw,kind){
  V.object(raw,['kind','width','height','dataWindow','displayWindow','orientation','units','values','invalidValues','provenance'],kind);V.dimensions(raw.width,raw.height);
  if(raw.orientation!==1)V.fail('auxiliary data must be explicitly orientation-normalized');
  V.object(raw.dataWindow,['x','y'],'dataWindow');V.object(raw.displayWindow,['x','y','width','height'],'displayWindow');
  V.dimensions(raw.displayWindow.width,raw.displayWindow.height);
  if(![raw.dataWindow.x,raw.dataWindow.y,raw.displayWindow.x,raw.displayWindow.y].every(Number.isSafeInteger))V.fail('window origins must be integer pixels');
  const x=raw.dataWindow.x-raw.displayWindow.x,y=raw.dataWindow.y-raw.displayWindow.y;
  if(x<0||y<0||x+raw.width>raw.displayWindow.width||y+raw.height>raw.displayWindow.height)V.fail('data window must fit the display window; no implicit crop');
  if(!ArrayBuffer.isView(raw.values)||Object.prototype.toString.call(raw.values.buffer)!=='[object ArrayBuffer]'||raw.values.length!==raw.width*raw.height)V.fail('auxiliary values must match the data window');
  return {x,y,provenance:V.provenance(raw.provenance)};
}
/** Converts explicitly declared depth or disparity into a same-frame tonal coverage ramp. */
function depthCoverage(raw,rule){
  const frame=grid(raw,'depth data');
  if(!['depth','disparity'].includes(raw.kind)||!['[object Float32Array]','[object Float64Array]'].includes(Object.prototype.toString.call(raw.values)))V.fail('provide typed floating-point depth/disparity data');
  if(raw.units!==(raw.kind==='depth'?'m':'1/m'))V.fail('depth needs m; disparity needs 1/m; no guessed units');
  V.object(rule,['near','far','ramp'],'depth mapping');
  if(![rule.near,rule.far].every(v=>Number.isFinite(v)&&v>0)||!(raw.kind==='depth'?rule.near<rule.far:rule.near>rule.far)||!['near','far'].includes(rule.ramp))V.fail('declare a valid near/far range and near or far ramp');
  if(!Array.isArray(raw.invalidValues)||raw.invalidValues.length>32||raw.invalidValues.some(v=>!Number.isFinite(v)))V.fail('declare finite invalidValues; non-finite samples are always invalid');
  const out=new Uint8Array(raw.displayWindow.width*raw.displayWindow.height);let invalid=0;
  for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){
    const value=raw.values[y*raw.width+x];if(!Number.isFinite(value)||value<=0||raw.invalidValues.includes(value)){invalid++;continue;}
    const t=Math.max(0,Math.min(1,(value-rule.near)/(rule.far-rule.near)));out[(y+frame.y)*raw.displayWindow.width+x+frame.x]=Math.round((rule.ramp==='far'?t:1-t)*255);
  }
  return {width:raw.displayWindow.width,height:raw.displayWindow.height,coverage:out,
    interpretation:{kind:raw.kind,units:raw.units,dataWindow:{...raw.dataWindow,width:raw.width,height:raw.height},displayWindow:{...raw.displayWindow},rule:{...rule},invalidSamples:invalid,resampled:false,provenance:frame.provenance}};
}
/** Selects integer labels without color conversion, interpolation or invented edge coverage. */
function labelCoverage(raw,selected){
  const frame=grid(raw,'label data');
  if(raw.kind!=='uint32-labels'||raw.units!=='categorical'||Object.prototype.toString.call(raw.values)!=='[object Uint32Array]'||!Array.isArray(selected)||!selected.length||selected.length>256||selected.some(v=>!Number.isSafeInteger(v)||v<0||v>4294967295))V.fail('provide uint32 categorical labels and explicit selected IDs');
  if(raw.invalidValues!==undefined)V.fail('categorical labels do not accept depth invalidValues');
  const ids=new Set(selected),out=new Uint8Array(raw.displayWindow.width*raw.displayWindow.height);
  for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(ids.has(raw.values[y*raw.width+x]))out[(y+frame.y)*raw.displayWindow.width+x+frame.x]=255;
  return {width:raw.displayWindow.width,height:raw.displayWindow.height,coverage:out,interpretation:{kind:raw.kind,dataWindow:{...raw.dataWindow,width:raw.width,height:raw.height},displayWindow:{...raw.displayWindow},selected:[...selected],resampled:false,provenance:frame.provenance}};
}
module.exports={depthCoverage,labelCoverage};
