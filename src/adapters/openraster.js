'use strict';
const {DOMParser}=require('@xmldom/xmldom'),{openArchive}=require('../archive'),{ingestLocalBytes}=require('../import/node'),{coverageFromRGBA}=require('../structured/regions'),V=require('../structured/validation');
/** Imports explicitly selected OpenRaster leaf layers; unsupported stacking semantics fail closed. */
async function importOpenRaster(bytes,{layers,provenance}){
  const declared=V.provenance(provenance),archive=await openArchive(bytes);
  if((await archive.read('mimetype',100)).toString()!=='image/openraster')throw Error('Not OpenRaster');
  const xml=(await archive.read('stack.xml',128*1024)).toString();
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('XML declarations are not accepted');
  const doc=new DOMParser({onError:()=>{throw Error('Malformed OpenRaster XML');}}).parseFromString(xml,'application/xml');
  const root=doc.documentElement;if(root.tagName!=='image')throw Error('Missing OpenRaster image');
  const width=Number(root.getAttribute('w')),height=Number(root.getAttribute('h'));V.dimensions(width,height);
  const children=e=>Array.from(e.childNodes).filter(x=>x.nodeType===1),stacks=children(root);
  if(stacks.length!==1||stacks[0].tagName!=='stack'||stacks[0].hasAttribute('opacity')&&Number(stacks[0].getAttribute('opacity'))!==1||stacks[0].hasAttribute('composite-op')&&stacks[0].getAttribute('composite-op')!=='svg:src-over')throw Error('Unsupported root stack');
  const stack=stacks[0];
  if((stack.getAttribute('visibility')||'visible')!=='visible'||['x','y'].some(k=>stack.hasAttribute(k)&&Number(stack.getAttribute(k))!==0))throw Error('Unsupported root stack transform/visibility');
  const nodes=children(stack);if(!nodes.length||nodes.length>64||nodes.some(x=>x.tagName!=='layer'))throw Error('Only a flat leaf-layer stack is supported');
  if(!Array.isArray(layers)||!layers.length||layers.length>31||width*height*layers.length>64*1024*1024)throw Error('Select 1..31 bounded layers');
  const selected=new Set(),regions=[],metadata=[];
  for(const spec of layers){
    V.object(spec,['index','id','polarity'],'selected layer');V.id(spec.id);
    if(!Number.isInteger(spec.index)||spec.index<0||spec.index>=nodes.length||selected.has(spec.index))throw Error('Invalid selected layer index');selected.add(spec.index);
    const layer=nodes[spec.index],blend=layer.getAttribute('composite-op')||'svg:src-over';if(blend!=='svg:src-over')throw Error('Unsupported blend '+blend);
    if((layer.getAttribute('visibility')||'visible')!=='visible')throw Error('Selected layer is hidden');
    const x=layer.hasAttribute('x')?Number(layer.getAttribute('x')):0,y=layer.hasAttribute('y')?Number(layer.getAttribute('y')):0,opacity=layer.hasAttribute('opacity')?Number(layer.getAttribute('opacity')):1;
    if(![x,y].every(Number.isSafeInteger)||!Number.isFinite(opacity)||opacity<0||opacity>1)throw Error('Invalid layer geometry/opacity');
    const path=layer.getAttribute('src');if(!/^data\/[a-zA-Z0-9_-]+\.png$/.test(path))throw Error('Unsafe OpenRaster layer reference');
    const image=await ingestLocalBytes(await archive.read(path,16*1024*1024));
    if(image.metadata.orientation!==1)throw Error('Normalize source orientation explicitly');
    const w=image.metadata.oriented.width,h=image.metadata.oriented.height;
    if(x<0||y<0||x+w>width||y+h>height)throw Error('Layer would be cropped; no implicit clipping');
    const source=coverageFromRGBA(image.rgba,spec.polarity),coverage=new Uint8Array(width*height);
    for(let row=0;row<h;row++)for(let col=0;col<w;col++)coverage[(row+y)*width+col+x]=Math.round(source[row*w+col]*opacity);
    const name=layer.getAttribute('name')||spec.id;regions.push({id:spec.id,name,role:'coverage',coverage,provenance:declared});metadata.push({id:spec.id,index:spec.index,path,x,y,width:w,height:h,opacity,blend,polarity:spec.polarity});
  }
  return {source:{width,height,regions},metadata:{contract:'stipra-openraster-subset-v1',layers:metadata,stackOrder:'XML order; independent selected regions, not a flattened stack',resampled:false}};
}
module.exports={importOpenRaster};
