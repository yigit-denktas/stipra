/* Common deterministic import contract; platform adapter supplies safe decoded bitmap. MIT. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./probe.js'));
 else root.StipraImport=factory(root.StipraImportProbe);
})(typeof globalThis!=='undefined'?globalThis:this,function(Probe){
 'use strict';
 const mime={png:'image/png',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml'};
 const dimensions=(m)=>({width:m.displayWidth,height:m.displayHeight});
 function orient(ctx,m){
   const w=m.width,h=m.height;
   const matrix={
     1:[1,0,0,1,0,0],2:[-1,0,0,1,w,0],
     3:[-1,0,0,-1,w,h],4:[1,0,0,-1,0,h],
     5:[0,1,1,0,0,0],6:[0,1,-1,0,h,0],
     7:[0,-1,-1,0,h,w],8:[0,-1,1,0,0,w]
   }[m.orientation];
   if(!matrix)throw Error('import: invalid orientation');
   ctx.transform(...matrix);
 }
 function publicMetadata(info, sourceName, decoder='platform-unspecified'){
   const {format,width,height,displayWidth,displayHeight,orientation,hasAlpha,profile,dpi,layout,sourceBytes,warnings,viewBox}=info;
   const metadata={contract:'stipra-import-v1',format,sourceName:sourceName||'unnamed',
     intrinsic:{width,height},oriented:{width:displayWidth,height:displayHeight},orientation,
     alpha:hasAlpha,profile,dpi,layout,sourceBytes,warnings:[...warnings],
     pixels:{channels:'RGBA',bitDepth:8,colorSpace:'srgb',orientationApplied:true},
     colorManagement:{policy:'stipra-srgb-v1',decoder,workingSpace:'srgb',
       sourceProfile:profile.kind,conversion:'decoder-managed-to-srgb',
       untaggedPolicy:'decoder-default; sRGB working output',pressCalibrated:false},
     provenance:{sourceRetainedSeparately:true,aspectRatioPreserved:true,positionPreserved:true}};
   if(viewBox)metadata.viewBox=viewBox;
   return metadata;
 }
 async function ingest(value,platform,opts={}){
   if(!platform||typeof platform.decode!=='function'||typeof platform.canvas!=='function')
     throw Error('import: platform must implement decode and canvas');
   const info=Probe.inspect(value,{DOMParserCtor:opts.DOMParserCtor});
   const neutral=info.safeMarkup!==undefined?new TextEncoder().encode(info.safeMarkup):Probe.orientationNeutralBytes(value,info);
   const bitmap=await platform.decode(neutral,mime[info.format]);
   const actualWidth=bitmap.width, actualHeight=bitmap.height;
   if(actualWidth!==info.width||actualHeight!==info.height)
     throw Error(`import: decoder dimensions ${actualWidth}×${actualHeight} differ from probed ${info.width}×${info.height}; refusing implicit transform`);
   const canvas=platform.canvas(info.displayWidth,info.displayHeight),ctx=canvas.getContext('2d',{colorSpace:'srgb'});
   orient(ctx,info);
   ctx.drawImage(bitmap,0,0,info.width,info.height);
   const pixels=ctx.getImageData(0,0,info.displayWidth,info.displayHeight,{colorSpace:'srgb'});
   if(pixels.colorSpace&&pixels.colorSpace!=='srgb')throw Error('import: decoder did not return sRGB pixels');
   if(pixels.width!==info.displayWidth||pixels.height!==info.displayHeight||pixels.data.length!==info.displayWidth*info.displayHeight*4)
     throw Error('import: decoder yielded unexpected RGBA dimensions');
   if(typeof bitmap.close==='function')bitmap.close();
   return {metadata:publicMetadata(info,opts.sourceName,platform.decoder),rgba:pixels.data,canvas};
 }
 return {ingest,publicMetadata,orient,mime};
});
