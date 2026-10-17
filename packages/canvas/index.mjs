import {renderImage,renderLayers} from '@stipra/core';

const sources=new WeakMap();
const fail=(code,message,cause)=>{const e=new Error('stipra canvas: '+message,{cause});e.code=code;throw e;};
function canvasOf(source){
  const canvas=source?.canvas??source?.elt??source?.drawingContext?.canvas??source;
  if(!canvas||typeof canvas.getContext!=='function'||!Number.isSafeInteger(canvas.width)||!Number.isSafeInteger(canvas.height)||canvas.width<1||canvas.height<1)
    fail('invalid-canvas','expected a nonempty canvas, p5 sketch, renderer or p5.Graphics');
  if(canvas.width>20000||canvas.height>20000||canvas.width*canvas.height>24000000)fail('invalid-canvas','frame exceeds the core pixel budget');
  return canvas;
}
function context(canvas){
  const ctx=canvas.getContext('2d',{colorSpace:'srgb',willReadFrequently:true});
  if(!ctx)fail('unsupported-renderer','2D capture only; WEBGL/WebGPU must be transferred explicitly to a 2D canvas');
  return ctx;
}
function makeCanvas(source,width,height){
  const owner=source.ownerDocument??globalThis.document;
  if(!owner?.createElement)fail('missing-dom','a browser document is required to create a drawable proof');
  const canvas=owner.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
}
function presentation(result,capture,sourceCanvases,alpha){
  if(!['source','paper'].includes(alpha))fail('invalid-alpha','alpha must be source or paper');
  const {width,height}=result.proof,canvas=makeCanvas(sourceCanvases[0],width,height),ctx=context(canvas),pixels=ctx.createImageData(width,height);
  pixels.data.set(result.proof.rgba);
  if(alpha==='source')for(let i=0;i<width*height;i++)pixels.data[i*4+3]=capture.alpha[i];
  ctx.putImageData(pixels,0,0);
  const output={result,canvas,capture,presentation:{alpha,logical:{...capture.metadata.logical}}};
  sources.set(output,new Set(sourceCanvases));return output;
}
/**
 * Captures owned sRGB pixels without changing an existing Canvas or p5 drawing.
 * @param source - The canvas, p5 instance, renderer or p5.Graphics to capture.
 * @returns The frozen-frame pixels and explicit logical/backing-size metadata.
 */
export function captureCanvas(source){
  const canvas=canvasOf(source),ctx=context(canvas);
  let image;
  try{image=ctx.getImageData(0,0,canvas.width,canvas.height,{colorSpace:'srgb'});}
  catch(error){fail(error.name==='SecurityError'?'tainted-canvas':'capture-failed',error.name==='SecurityError'?'canvas is tainted by cross-origin artwork; load same-origin or CORS-authorized assets':'pixel readback failed',error);}
  if(image.colorSpace&&image.colorSpace!=='srgb')fail('unsupported-color','readback did not provide sRGB pixels');
  const width=canvas.width,height=canvas.height;
  const logical=source!==canvas&&Number.isFinite(source.width)&&Number.isFinite(source.height)?{width:source.width,height:source.height}:{width,height};
  if(logical.width<=0||logical.height<=0)fail('invalid-canvas','invalid logical dimensions');
  if(Math.abs(width/logical.width-height/logical.height)>1e-9)fail('nonuniform-density','logical dimensions must preserve the backing-pixel aspect ratio');
  const rgba=new Uint8ClampedArray(image.data),alpha=new Uint8Array(width*height);
  for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
  return {kind:'image',input:{width,height,colorSpace:'srgb',rgba},alpha,
    metadata:{contract:'stipra-canvas-capture-v1',renderer:'2d',backing:{width,height},logical,
      pixelDensity:{x:width/logical.width,y:height/logical.height},colorSpace:'srgb'}};
}
/**
 * Renders a captured sketch to a separate drawable canvas and physical ink masks.
 * @param source - The source Canvas or p5 drawing; it is never painted over.
 * @param options - The core style/ink settings and physical DPI.
 * @param view - The presentation alpha choice; source preserves artwork alpha, paper is opaque.
 * @returns The drawable proof, core result and owned source snapshot.
 */
export function renderCanvas(source,options,view={}){
  const capture=captureCanvas(source),result=renderImage(capture.input,options);
  return presentation(result,capture,[canvasOf(source)],view.alpha??'source');
}
/**
 * Captures grayscale or opacity-only ink canvases on one shared frame.
 * @param input - The paper and ink descriptors with explicit coverage polarity.
 * @returns The owned authored masks and logical/backing-size metadata.
 */
export function captureLayers(input){
  if(!input||!Array.isArray(input.inks)||input.inks.length<1||input.inks.length>8)fail('invalid-layers','expected one to eight ink canvases');
  const snapshots=input.inks.map(ink=>captureCanvas(ink.source)),first=snapshots[0],{width,height}=first.input;
  const alpha=new Uint8Array(width*height);
  const inks=input.inks.map((ink,j)=>{
    const shot=snapshots[j],mode=ink.polarity;
    if(!['dark-on-light','light-on-dark','alpha'].includes(mode))fail('invalid-polarity','set dark-on-light, light-on-dark or alpha explicitly');
    if(shot.input.width!==width||shot.input.height!==height||shot.metadata.logical.width!==first.metadata.logical.width||shot.metadata.logical.height!==first.metadata.logical.height)
      fail('layer-frame-mismatch','all ink canvases must share backing and logical dimensions; no layer is resized');
    const coverage=new Uint8Array(width*height),rgba=shot.input.rgba;
    for(let p=0;p<coverage.length;p++){
      const q=p*4;
      if(mode!=='alpha'&&(rgba[q]!==rgba[q+1]||rgba[q]!==rgba[q+2]))fail('non-grayscale-layer','grayscale polarity requires neutral pixels; choose alpha for opacity-only artwork');
      coverage[p]=mode==='alpha'?rgba[q+3]:Math.round((mode==='dark-on-light'?255-rgba[q]:rgba[q])*rgba[q+3]/255);
      alpha[p]=Math.max(alpha[p],coverage[p]);
    }
    return {id:ink.id,name:ink.name,color:ink.color,coverage};
  });
  return {kind:'layers',input:{width,height,paper:input.paper,inks},alpha,metadata:{...first.metadata,polarity:input.inks.map(x=>({id:x.id,polarity:x.polarity}))}};
}
/** Renders authored ink canvases without estimating their masks from a flattened image. */
export function renderCanvasLayers(input,options={},view={}){
  const capture=captureLayers(input),result=renderLayers(capture.input,options);
  return presentation(result,capture,input.inks.map(x=>canvasOf(x.source)),view.alpha??'paper');
}
/**
 * Draws a proof in logical coordinates while preserving the destination drawing state.
 * @param rendered - The proof returned by a render function.
 * @param target - The separate destination Canvas or 2D p5 drawing.
 * @param placement - The optional destination coordinates and logical dimensions.
 */
export function drawProof(rendered,target,placement={}){
  const canvas=canvasOf(target);
  if(sources.get(rendered)?.has(canvas))fail('feedback-target','draw into a separate destination; never feed the proof back into its source');
  const x=placement.x??0,y=placement.y??0,width=placement.width??rendered.presentation.logical.width,height=placement.height??rendered.presentation.logical.height;
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)fail('invalid-placement','placement must use finite coordinates and positive dimensions');
  const ctx=context(canvas);ctx.save();try{ctx.drawImage(rendered.canvas,x,y,width,height);}finally{ctx.restore();}
}
/**
 * Loads the optional exporter only after synchronously freezing the captured source and recipes.
 * @param rendered - The captured/rendered frame to export; later sketch frames do not affect it.
 * @param loadExporter - The explicit async loader for Stiprā's optional export module.
 * @returns The aligned package bytes and manifest.
 */
export async function exportSnapshot(rendered,loadExporter){
  if(typeof loadExporter!=='function')fail('missing-exporter','provide an explicit optional exporter loader');
  const shot=rendered.capture,raw=shot.input;
  const input=shot.kind==='image'?{...raw,rgba:raw.rgba.slice()}:{...raw,inks:raw.inks.map(x=>({...x,coverage:x.coverage.slice()}))};
  const recipe=JSON.parse(JSON.stringify(rendered.result.recipe)),metadata=JSON.parse(JSON.stringify(shot.metadata));
  const exporter=await loadExporter();
  if(typeof exporter.generateSketch!=='function')fail('invalid-exporter','loaded module must expose generateSketch');
  return exporter.generateSketch({input,recipe,metadata});
}
