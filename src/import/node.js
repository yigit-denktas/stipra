/* Node adapter: process only bytes from local paths, never remote URLs. MIT. */
'use strict';
const Import=require('./asset.js');
const {DOMParser}=require('@xmldom/xmldom');
async function ingestLocalBytes(bytes,sourceName='unnamed'){
  const {Canvas,loadImage}=require('skia-canvas');
  return Import.ingest(bytes,{
    decoder:'skia-canvas',
    canvas:(w,h)=>new Canvas(w,h),
    decode:async (data)=>loadImage(Buffer.from(data))
  },{DOMParserCtor:DOMParser,sourceName});
}
module.exports={ingestLocalBytes};
