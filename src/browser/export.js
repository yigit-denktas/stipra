'use strict';
const {Buffer}=require('buffer/');
const Package=require('../print-package.js');
async function generate(options){
  const result=await Package.generate({...options,originalBytes:Buffer.from(options.originalBytes)});
  return {bytes:new Uint8Array(result.zip),manifest:result.manifest};
}
module.exports={generate,physicalPNG:(bytes,dpi)=>new Uint8Array(Package.physicalPNG(Buffer.from(bytes),dpi))};
