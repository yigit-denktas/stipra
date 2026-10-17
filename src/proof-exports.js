'use strict';
const {Canvas}=require('skia-canvas'),{svgSamples}=require('./vector-samples');
/** Normalizes optional proof derivatives; production masters always retain their native frame. */
function settings(raw,width,height){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('exports must be an object');
  for(const key of Object.keys(raw))if(!['formats','scale','alpha','vectorPlates'].includes(key))throw Error('Unknown export setting '+key);
  const formats=raw.formats??['png'],scale=raw.scale??1,alpha=raw.alpha??'paper';
  if(!Array.isArray(formats)||!formats.length||formats.length>4||new Set(formats).size!==formats.length||formats.some(x=>!['png','jpg','webp','svg'].includes(x)))throw Error('Export formats must be unique png, jpg, webp or svg');
  if(!Number.isInteger(scale)||scale<1||scale>3||width*scale>20000||height*scale>20000||width*height*scale*scale>24000000)throw Error('Export scale must be 1..3 within 24 MP / 20000 px');
  if(!['paper','source'].includes(alpha))throw Error('Export alpha must be paper or source');
  if(raw.vectorPlates!==undefined&&typeof raw.vectorPlates!=='boolean')throw Error('vectorPlates must be boolean');
  return {formats:[...formats],scale,alpha,vectorPlates:raw.vectorPlates??false};
}
/** Encodes proof derivatives with explicit alpha and physical-size semantics. */
async function generate({rgba,sourceRGBA,width,height,paper,dpi,options,physicalPNG}){
  const spec=settings(options,width,height),w=width*spec.scale,h=height*spec.scale,pixels=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const from=(Math.floor(y/spec.scale)*width+Math.floor(x/spec.scale))*4,to=(y*w+x)*4;
    pixels.set(rgba.subarray(from,from+4),to);if(spec.alpha==='source')pixels[to+3]=sourceRGBA[from+3];
  }
  const canvas=new Canvas(w,h),ctx=canvas.getContext('2d'),image=ctx.createImageData(w,h);image.data.set(pixels);ctx.putImageData(image,0,0);
  const files=[],metadata=[];
  for(const format of spec.formats){
    const name='exports/proof.'+format;let bytes,representation='raster';
    if(format==='svg'){const vector=svgSamples(pixels,w,h,{dpi:dpi*spec.scale});bytes=Buffer.from(vector.text);representation=vector.representation;}
    else{
      let target=canvas;
      if(format==='jpg'){
        target=new Canvas(w,h);const c=target.getContext('2d');c.fillStyle=paper;c.fillRect(0,0,w,h);c.drawImage(canvas,0,0);
      }
      bytes=Buffer.from(await target.toBuffer(format,{quality:.92}));
      if(format==='png')bytes=physicalPNG(bytes,dpi*spec.scale);
      const valid=format==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):format==='jpg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
      if(!valid)throw Error('Encoder did not produce requested '+format+' format');
    }
    files.push({path:name,bytes});metadata.push({path:name,format,width:w,height:h,scale:spec.scale,effectiveDpi:dpi*spec.scale,
      physicalSize:'same as native trim',resampling:spec.scale===1?'none':'nearest-neighbor pixel replication',representation,
      alpha:format==='jpg'?'flattened-to-paper':spec.alpha==='source'?'source-alpha':'opaque-paper',
      colorSpace:'srgb',profile:'no embedded ICC profile claimed',densityMetadata:format==='png'?'pHYs':format==='svg'?'physical-mm':'not-guaranteed',lossy:['jpg','webp'].includes(format)});
  }
  return {files,metadata,settings:spec};
}
module.exports={settings,generate};
