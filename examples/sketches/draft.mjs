import {captureCanvas,renderCanvas,exportSnapshot} from './assets/canvas.mjs';

export function createDraftRenderer({options,maxEdge=384}){
  if(!Number.isInteger(maxEdge)||maxEdge<64||maxEdge>512)throw Error('Draft maxEdge must be 64..512');
  const fixedOptions=JSON.parse(JSON.stringify(options));let cached,priorSource,priorRevision;
  return {
    update(source,revision){
      if(!['number','string'].includes(typeof revision)||typeof revision==='number'&&!Number.isFinite(revision))throw Error('Supply an explicit frame/revision token');
      if(cached&&source===priorSource&&revision===priorRevision)return cached;
      const shot=captureCanvas(source),{width,height}=shot.input;
      const owner=(source.canvas??source.elt??source.drawingContext?.canvas??source).ownerDocument??document;
      const frozen=owner.createElement('canvas');frozen.width=width;frozen.height=height;
      const ctx=frozen.getContext('2d'),pixels=ctx.createImageData(width,height);pixels.data.set(shot.input.rgba);ctx.putImageData(pixels,0,0);
      const scale=Math.min(1,maxEdge/Math.max(width,height)),small=owner.createElement('canvas');
      small.width=Math.max(1,Math.round(width*scale));small.height=Math.max(1,Math.round(height*scale));small.getContext('2d').drawImage(frozen,0,0,small.width,small.height);
      const preview=renderCanvas(small,fixedOptions);let final;
      const renderFinal=()=>final??(final=renderCanvas({canvas:frozen,...shot.metadata.logical},fixedOptions));
      cached={canvas:preview.canvas,logical:{...shot.metadata.logical},resolution:{kind:'draft',source:{width,height},preview:{width:small.width,height:small.height},resampled:scale<1,screenScale:'pixel-pattern approximation; inspect final for physical screening'},
        renderFinal,exportFinal:loadExporter=>exportSnapshot(renderFinal(),loadExporter)};
      priorSource=source;priorRevision=revision;return cached;
    },
    clear(){cached=undefined;priorSource=undefined;priorRevision=undefined;},
  };
}
