'use strict';
const {Buffer}=require('buffer/'),{sha256}=require('@noble/hashes/sha256');
class Canvas {
  constructor(width,height){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    canvas.toBuffer=async(format='png',options={})=>{
      const mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[format];
      if(!mime)throw Error('Unsupported browser encoder '+format);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b&&b.type===mime?resolve(b):reject(Error('Requested browser encoder unavailable: '+format)),mime,options.quality??.92));
      return Buffer.from(await blob.arrayBuffer());
    };
    return canvas;
  }
}
async function loadImage(bytes){
  return new Promise((resolve,reject)=>{
    const data=Buffer.from(bytes),svg=data.toString('utf8',0,100).includes('<svg');
    const url=URL.createObjectURL(new Blob([data],{type:svg?'image/svg+xml':'image/png'})),image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Export image decode failed'));};image.src=url;
  });
}
function createHash(algorithm){
  if(algorithm!=='sha256')throw Error('Unsupported export hash');
  let bytes;return {update(data){bytes=Buffer.from(data);return this;},digest(format){const result=Buffer.from(sha256(bytes));return format==='hex'?result.toString('hex'):result;}};
}
module.exports={Canvas,loadImage,createHash};
