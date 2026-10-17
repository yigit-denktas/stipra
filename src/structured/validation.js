'use strict';
const fail=(message,code='invalid-structured-input')=>{const error=new TypeError('structured: '+message);error.code=code;throw error;};
function object(value,keys,name){
  if(!value||Object.prototype.toString.call(value)!=='[object Object]')fail(name+' must be an object');
  for(const key of Object.keys(value))if(!keys.includes(key))fail(name+': unknown field '+key);
}
function text(value,name,max=100){if(typeof value!=='string'||!value.trim()||value.length>max)fail(name+' must be nonempty text, at most '+max+' characters');return value;}
function id(value){if(typeof value!=='string'||!/^[a-z][a-z0-9_-]{0,63}$/.test(value))fail('ids must be lowercase identifiers');return value;}
function color(value){if(typeof value!=='string'||!/^#[a-f0-9]{6}$/i.test(value))fail('colors must be #RRGGBB');return value.toLowerCase();}
function dimensions(width,height){if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>20000||height>20000||width*height>24000000)fail('invalid dimensions; maximum 24 megapixels and 20000 per edge');}
function bytes(value,length){if(!ArrayBuffer.isView(value)||Object.prototype.toString.call(value)!=='[object Uint8Array]'||Object.prototype.toString.call(value.buffer)!=='[object ArrayBuffer]'||value.length!==length)fail('coverage must be exact-length Uint8Array with a non-shared buffer');return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);}
function jsonData(value,max=16384){
  function copy(v,depth){
    if(depth>8)fail('metadata nesting exceeds eight levels');
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='string'){if(v.length>4096)fail('metadata string too long');return v;}
    if(typeof v==='number'){if(!Number.isFinite(v))fail('metadata numbers must be finite');return v;}
    if(Array.isArray(v)){if(v.length>256)fail('metadata array too long');return v.map(x=>copy(x,depth+1));}
    if(v&&Object.prototype.toString.call(v)==='[object Object]'){
      const out={};for(const [key,descriptor]of Object.entries(Object.getOwnPropertyDescriptors(v))){
        if(['__proto__','constructor','prototype'].includes(key)||!('value'in descriptor))fail('metadata contains unsafe keys or accessors');
        out[key]=copy(descriptor.value,depth+1);
      }return out;
    }fail('metadata must contain JSON data only');
  }
  const result=copy(value,0);if(new TextEncoder().encode(JSON.stringify(result)).length>max)fail('metadata size budget exceeded');return result;
}
function provenance(value){
  object(value,['kind','producer','parameters'],'provenance');
  if(!['authored','captured','renderer-provided','estimated'].includes(value.kind))fail('declare authored, captured, renderer-provided or estimated provenance');
  if(value.producer!==undefined){object(value.producer,['name','version'],'producer');text(value.producer.name,'producer name');text(value.producer.version,'producer version');}
  return jsonData(value);
}
module.exports={fail,object,text,id,color,dimensions,bytes,jsonData,provenance};
