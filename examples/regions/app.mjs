import {renderLayers,renderImage} from './assets/core.mjs';
import {mapRegions,regionProject} from './assets/inputs.mjs';
import {forest,mapping,options} from './fixture.mjs';
const source=forest(),reference=renderLayers(mapRegions(source,mapping()).input,{dpi:300}),el=id=>document.getElementById(id);let mapped,result;
function paint(canvas,rgba,w=source.width,h=source.height){canvas.width=w;canvas.height=h;const x=canvas.getContext('2d'),p=x.createImageData(w,h);p.data.set(rgba);x.putImageData(p,0,0);}
function update(){
  mapped=mapRegions(source,mapping(Number(el('inks').value),el('combine').value));result=renderLayers(mapped.input,options);
  const flattened=renderImage({width:source.width,height:source.height,colorSpace:'srgb',rgba:reference.proof.rgba},{dpi:300,seed:42,screenRecipe:options.screenRecipe,inkRecipe:{version:1,mode:'spot',paper:mapped.input.paper,inks:mapped.input.inks.map(({coverage,...ink})=>({...ink,source:'match',target:ink.color,tolerance:.65,threshold:.35,gain:1.2}))}});
  paint(el('source'),reference.proof.rgba);paint(el('mapped'),result.proof.rgba);paint(el('flat'),flattened.proof.rgba);
  el('plates').replaceChildren();for(const p of result.plates){const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption'),rgba=new Uint8Array(p.screened.length*4);for(let i=0;i<p.screened.length;i++)rgba.set([255-p.screened[i],255-p.screened[i],255-p.screened[i],255],4*i);paint(canvas,rgba);caption.textContent=p.name+' / '+(result.diagnostics.plates.find(x=>x.id===p.id).meanCoverage*100).toFixed(1)+'%';figure.append(canvas,caption);el('plates').append(figure);}
  el('recipe').textContent=JSON.stringify(mapped.recipe,null,2);el('status').textContent=`${source.width} × ${source.height} pixels / ${result.plates.length} aligned physical inks / unscreened regions, screened once`;
  document.documentElement.dataset.stipraRegionsReady='true';
}
el('inks').onchange=el('combine').onchange=update;
el('export').onclick=async()=>{
  const frozen={input:structuredClone(mapped.input),recipe:structuredClone(result.recipe),metadata:{contract:'stipra-region-example-v1'},sourceProject:el('project').checked?regionProject(source,mapped.recipe):null};
  el('export').disabled=true;try{const {generateSketch}=await import('./assets/print-export.mjs'),pkg=await generateSketch(frozen),url=URL.createObjectURL(new Blob([pkg.bytes],{type:'application/zip'})),a=document.createElement('a');a.href=url;a.download='stipra-regions.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);el('status').textContent+=' / exported';}catch(e){el('status').textContent=e.message;}finally{el('export').disabled=false;}
};update();
