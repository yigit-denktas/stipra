import {captureCanvas} from '@stipra/canvas';
import {coverageFromRGBA} from './dist/index.mjs';
/** Captures named source regions on one backing and logical frame without assigning inks. */
export function captureRegions({regions}){
  if(!Array.isArray(regions)||!regions.length||regions.length>64)throw Error('Provide 1..64 region canvases');
  let width,height,logical;const output=[];
  for(const r of regions){
    const shot=captureCanvas(r.source);
    if(shot.input.width*shot.input.height*regions.length>64*1024*1024)throw Error('Region coverage exceeds 64 MiB');
    if(!output.length){width=shot.input.width;height=shot.input.height;logical=shot.metadata.logical;}
    if(shot.input.width!==width||shot.input.height!==height||shot.metadata.logical.width!==logical.width||shot.metadata.logical.height!==logical.height)throw Error('Region frames differ; no implicit resampling');
    output.push({id:r.id,name:r.name,role:'coverage',provenance:structuredClone(r.provenance),coverage:coverageFromRGBA(shot.input.rgba,r.polarity)});
  }
  return {width,height,regions:output};
}
