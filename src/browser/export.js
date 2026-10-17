'use strict';
const {Buffer}=require('buffer/');
const Package=require('../print-package.js');
async function generate(options){
  const result=await Package.generate({...options,originalBytes:Buffer.from(options.originalBytes)});
  return {bytes:new Uint8Array(result.zip),manifest:result.manifest};
}
/** Generates an optional package from an already captured frame and its normalized recipe. */
async function generateSketch({input,recipe,metadata}){
  if(!recipe||recipe.version!==1||!['image','layers'].includes(recipe.kind))throw Error('Sketch export requires a normalized core recipe');
  const dpi=recipe.dpi;
  if(recipe.kind==='layers'){
    const result=await Package.generateLayers({input,screenRecipe:recipe.proofScreens,dpi,captureMetadata:metadata});
    return {bytes:new Uint8Array(result.zip),manifest:result.manifest};
  }
  const {Canvas}=require('./adapters.js'),canvas=new Canvas(input.width,input.height),ctx=canvas.getContext('2d'),pixels=ctx.createImageData(input.width,input.height);
  pixels.data.set(input.rgba);ctx.putImageData(pixels,0,0);
  const originalBytes=Buffer.from(await canvas.toBuffer('png'));
  const asset={rgba:input.rgba,metadata:{contract:'stipra-import-v1',format:'png',sourceName:'Captured sketch frame',
    intrinsic:{width:input.width,height:input.height},oriented:{width:input.width,height:input.height},orientation:1,alpha:true,
    profile:{kind:'unspecified'},pixels:{channels:'RGBA',bitDepth:8,colorSpace:'srgb',orientationApplied:true},
    colorManagement:{policy:'stipra-srgb-v1',decoder:'canvas-capture',workingSpace:'srgb',pressCalibrated:false},
    provenance:{representation:'owned Canvas pixel snapshot; no original file bytes implied',capture:metadata},warnings:[]}};
  return generate({originalBytes,asset,inkRecipe:recipe.inks,screenRecipe:recipe.proofScreens,dpi,paper:'recipe',style:recipe.style});
}
module.exports={generate,generateSketch,physicalPNG:(bytes,dpi)=>new Uint8Array(Package.physicalPNG(Buffer.from(bytes),dpi))};
