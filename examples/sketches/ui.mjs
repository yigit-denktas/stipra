import {exportSnapshot} from './assets/canvas.mjs';
export function show(rendered,source,frame){
  document.querySelector('#source').replaceChildren(source);
  const plateArea=document.querySelector('#plates');plateArea.replaceChildren();
  for(const plate of rendered.result.plates){
    const canvas=document.createElement('canvas');canvas.width=rendered.result.proof.width;canvas.height=rendered.result.proof.height;
    const ctx=canvas.getContext('2d'),data=ctx.createImageData(canvas.width,canvas.height);
    for(let i=0;i<plate.screened.length;i++)data.data.set([255-plate.screened[i],255-plate.screened[i],255-plate.screened[i],255],i*4);
    ctx.putImageData(data,0,0);const figure=document.createElement('figure'),caption=document.createElement('figcaption');
    caption.textContent=plate.name+' / '+(rendered.result.diagnostics.plates.find(x=>x.id===plate.id).meanCoverage*100).toFixed(1)+'%';
    figure.append(canvas,caption);plateArea.append(figure);
  }
  document.querySelector('#status').textContent=rendered.capture.metadata.logical.width+' × '+rendered.capture.metadata.logical.height+' logical / '+rendered.result.proof.width+' × '+rendered.result.proof.height+' pixels / '+rendered.result.plates.length+' inks / frame '+frame;
  document.querySelector('#recipe').textContent=JSON.stringify(rendered.result.recipe,null,2);
  document.documentElement.dataset.frame=String(frame);document.documentElement.dataset.stipraSketchReady='true';
  const button=document.querySelector('#export');button.disabled=false;
  button.onclick=async()=>{
    button.disabled=true;const label=button.textContent;button.textContent='Building frozen-frame package…';
    try{
      const result=await exportSnapshot(rendered,()=>import('./assets/print-export.mjs'));
      const url=URL.createObjectURL(new Blob([result.bytes],{type:'application/zip'})),link=document.createElement('a');
      link.href=url;link.download='stipra-sketch-frame-'+frame+'.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),4000);
      document.querySelector('#status').textContent+=' / package exported';
    }catch(e){document.querySelector('#status').textContent=e.message;}
    finally{button.disabled=false;button.textContent=label;}
  };
}
export function imageArt(ctx,width,height,frame=0){
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#0D4DAD';
  for(let i=0;i<7;i++){
    const x=width*(.12+i*.11)+Math.sin(frame*.35+i)*7;
    ctx.beginPath();ctx.ellipse(x,height*.48,width*.08,height*(.20+i*.025),-.45,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#FF665D';ctx.fillRect(width*.12,height*.64,width*.7,height*.1);
  ctx.fillStyle='#E2A523';ctx.beginPath();ctx.arc(width*.72,height*.25,width*.07,0,Math.PI*2);ctx.fill();
}
