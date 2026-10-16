/* Prehnite Riso Studio v8 browser interface, MIT. */
(()=>{'use strict';
const E=window.PrehniteEngine, W=E.W,H=E.H,$=id=>document.getElementById(id);
let cfg=E.preset('01'),scene=null,frame=null,reference=null,diagOutput=null,dragKey=null;
const renderCan=$('render'),renderCtx=renderCan.getContext('2d'),overlay=$('vertices'),overlayCtx=overlay.getContext('2d'),makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const sliderSpecs={
 mainSliders:[['dotPitch','Dot grid pitch',3.0,8.5,.1,'px'],['dotSize','Dot radius',55,155,1,'%'],['coverage','Screen coverage',30,110,1,'%'],['jitter','Dot irregularity',0,95,1,'%'],['softness','Facet edge dropout',0,15,.1,'px']],
 geometrySliders:[['crystalScale','Crystal scale',75,125,1,'%'],['crystalX','Crystal horizontal',-100,100,1,'px'],['crystalY','Crystal vertical',-90,90,1,'px'],['wordTracking','Wordmark tracking',-40,35,1,'glyph units'],['wordHeight','Wordmark optical height',.94,1.14,.01,'×'],['tagTracking','Tagline tracking',0,260,5,'glyph units']],
 printSliders:[['registrationX','Accent X shift',-15,15,.1,'px'],['registrationY','Accent Y shift',-15,15,.1,'px'],['paperGrain','Paper fibers and flecks',0,100,1,'%'],['printWear','Plate distress',0,140,1,'%'],['outlineWidth','Crystal outline',0,7,.1,'px'],['inkBleed','Dot ink gain',0,3,.1,'×']]
};
function setStatus(s){$('renderStatus').textContent=s;}
function uiRange(key,label,min,max,step,unit){const wrap=document.createElement('div');wrap.className='range-field';
 const lab=document.createElement('label');lab.textContent=label;const v=document.createElement('output');v.id=key+'-value';lab.append(v);
 const inp=document.createElement('input');inp.type='range';inp.min=min;inp.max=max;inp.step=step;inp.id=key;inp.value=cfg[key];
 inp.addEventListener('input',()=>{cfg[key]=Number(inp.value);v.textContent=inp.value+unit;scheduleRender();});wrap.append(lab,inp);v.textContent=cfg[key]+unit;return wrap;
}
function buildControls(){for(const [group,items] of Object.entries(sliderSpecs)){
 const container=$(group);container.replaceChildren(...items.map(x=>uiRange(...x)));
}const colors=$('colors');colors.replaceChildren();
 for(const role of cfg.variant==='03'?['primary','accent','third','paper']:['primary','accent','paper']){
  const row=document.createElement('div');row.className='color-row';let label=document.createElement('label');label.textContent={primary:'Main ink',accent:'Accent ink',third:'Third ink',paper:'Paper stock'}[role];
  const block=document.createElement('span'),color=document.createElement('input'),hex=document.createElement('code');color.type='color';color.value=cfg.palette[role];hex.textContent=color.value;
  color.addEventListener('input',()=>{cfg.palette[role]=color.value;hex.textContent=color.value;updateLegend();scheduleRender();});block.append(color,hex);row.append(label,block);colors.append(row);
 }
 const facets=$('facets');facets.replaceChildren();
 for(const name of Object.keys(E.FACETS)){
  const row=document.createElement('div');row.className='facet-row';const title=document.createElement('label');title.textContent=name.replaceAll('-',' ');
  const mode=document.createElement('select');for(const value of ['dots','dense','reverse','hybrid','paper'])mode.append(new Option(value,value));mode.value=cfg.facets[name].mode;
  mode.addEventListener('change',()=>{cfg.facets[name].mode=mode.value;scheduleRender();});title.append(mode);row.append(title);
  const inks=document.createElement('div');inks.className='facet-inks';
  for(const role of cfg.variant==='03'?['primary','accent','third']:['primary','accent']){
   const l=document.createElement('label');l.textContent=role;const range=document.createElement('input');range.type='range';range.min=0;range.max=100;range.step=1;
   const val=cfg.facets[name].inks[role]||[0,.48];range.value=Math.round(val[0]*100);
   range.addEventListener('input',()=>{const pct=Number(range.value)/100;const pair=cfg.facets[name].inks[role]||[0,.48];cfg.facets[name].inks[role]=[pct,pair[1]];scheduleRender();});l.append(range);inks.append(l);
  }row.append(inks);facets.append(row);
 }
 const fontPicker=$('wordFont');if(fontPicker){fontPicker.value=cfg.wordFont||'display-black';fontPicker.onchange=()=>{cfg.wordFont=fontPicker.value;scheduleRender();};}
 const paperPicker=$('paperStock');if(paperPicker){paperPicker.value=cfg.paperStock||'Ivory';paperPicker.onchange=()=>{cfg.paperStock=paperPicker.value;
 const stockColor={'Ivory':'#f7efdd','Natural':'#e9e2d5','Blush':'#f9e5df','Warm Gray':'#e9e3dc'}[cfg.paperStock];
 cfg.palette.paper=stockColor;buildControls();scheduleRender();};}
 updateLegend();
}
function updateLegend(){$('plateLegend').replaceChildren(...(cfg.variant==='03'?['primary','accent','third']:['primary','accent']).map(role=>{let b=document.createElement('i');b.className='swatch';b.title=role;b.style.background=cfg.palette[role];return b;}));}
function scheduleRender(){setStatus('Updating…');if(frame!==null)clearTimeout(frame);frame=setTimeout(()=>{frame=null;runRender();},110);}
function runRender(){try{const start=performance.now();scene=E.build(cfg);E.paint(renderCtx,scene,makeCanvas,1);
 $('dotCount').textContent=scene.dotCount.toLocaleString('en-US');setStatus('Rendered in '+Math.round(performance.now()-start)+' ms');drawVertices();if(reference)requestAnimationFrame(compare);
 }catch(err){setStatus('Render failed: '+err.message);console.error(err);}}
function drawVertices(){overlayCtx.clearRect(0,0,W,H);if(!$('editGeometry').checked)return;
 overlayCtx.lineWidth=1.8;overlayCtx.strokeStyle='#e6f4b5';for(const ids of Object.values(E.FACETS)){
  overlayCtx.beginPath();ids.forEach((k,i)=>{const p=E.geomPoint(k,cfg);if(i===0)overlayCtx.moveTo(...p);else overlayCtx.lineTo(...p);});overlayCtx.closePath();overlayCtx.stroke();}
 for(const key of Object.keys(cfg.points)){
  const [x,y]=E.geomPoint(key,cfg);overlayCtx.beginPath();overlayCtx.fillStyle=key===dragKey?'#ff9e81':'#f2eccb';overlayCtx.strokeStyle='#183b29';overlayCtx.lineWidth=3;overlayCtx.arc(x,y,8,0,Math.PI*2);overlayCtx.fill();overlayCtx.stroke();overlayCtx.fillStyle='#173d27';overlayCtx.font='14px monospace';overlayCtx.fillText(key,x+12,y-9);
 }}
function cursorPoint(evt){const r=overlay.getBoundingClientRect();return [(evt.clientX-r.left)*W/r.width,(evt.clientY-r.top)*H/r.height];}
function originalPoint(x,y){const s=cfg.crystalScale/100;return [(x-380-cfg.crystalX)/s+380,(y-390-cfg.crystalY)/s+390];}
overlay.addEventListener('pointerdown',evt=>{if(!$('editGeometry').checked)return;const [x,y]=cursorPoint(evt);let min=35,selected=null;for(const k of Object.keys(cfg.points)){
 const [gx,gy]=E.geomPoint(k,cfg),d=Math.hypot(gx-x,gy-y);if(d<min){selected=k;min=d;}
}if(selected){dragKey=selected;overlay.setPointerCapture(evt.pointerId);drawVertices();evt.preventDefault();}});
overlay.addEventListener('pointermove',evt=>{if(!dragKey)return;const [x,y]=cursorPoint(evt);cfg.points[dragKey]=originalPoint(x,y).map(v=>Math.round(v*10)/10);drawVertices();scheduleRender();});
for(const evt of ['pointerup','pointercancel'])overlay.addEventListener(evt,()=>{dragKey=null;drawVertices();});
$('editGeometry').addEventListener('change',e=>{$('stage').classList.toggle('editing',e.target.checked);drawVertices();});
function switchPreset(id){cfg=E.preset(id);
 // Do not compare a different colorway against the approved 01 artwork by default.
 if(id!=='01'){reference=null;refCtx.clearRect(0,0,W,H);$('metrics').textContent='Upload a matching reference for colorway '+id+' to enable meaningful diagnostics.';$('diagnosticCanvas').getContext('2d').clearRect(0,0,W,H);}
 else loadReference(window.PREHNITE_REFERENCE_DATA||'reference/approved-target.png');
 document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('active',btn.dataset.preset===id));buildControls();scheduleRender();}
document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>switchPreset(btn.dataset.preset)));
$('reroll').addEventListener('click',()=>{cfg.seed=1+Math.floor(Math.random()*1000000000);scheduleRender();});
$('reset').addEventListener('click',()=>switchPreset(cfg.variant));
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
function blobCanvas(canvas,mime,quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Canvas does not support '+mime)),mime,quality));}
async function exportOne(format){try{setStatus('Exporting '+format+'…');const id=cfg.variant;
 if(format==='svg'){save(new Blob([E.svg(scene)],{type:'image/svg+xml'}),`prehnite-${id}-vector.svg`);}
 else{const scale=Number($('exportScale').value),can=E.render(scene,makeCanvas,scale),mime='image/'+(format==='jpeg'?'jpeg':format);
 const blob=await blobCanvas(can,mime,.98);save(blob,`prehnite-${id}-${W*scale}x${H*scale}.${format==='jpeg'?'jpg':format}`);}
 setStatus('Export created.');}catch(e){setStatus(e.message);console.error(e);}}
document.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>exportOne(b.dataset.export)));
async function exportPlate(role){if(role==='third'&&cfg.variant==='01')return;try{const scale=Number($('exportScale').value),plate=E.renderPlate(scene,role,makeCanvas,scale);
 const base=makeCanvas(W*scale,H*scale),ctx=base.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,base.width,base.height);ctx.drawImage(plate,0,0);
 save(await blobCanvas(base,'image/png'),`prehnite-${cfg.variant}-${role}-plate-${scale}x.png`);}catch(e){setStatus(e.message);}}
$('exportPlatePrimary').addEventListener('click',()=>exportPlate('primary'));
$('exportPlateAccent').addEventListener('click',()=>exportPlate('accent'));
$('exportPlateThird').addEventListener('click',()=>exportPlate('third'));
$('exportPlateSVG').addEventListener('click',()=>{for(const role of cfg.variant==='03'?['accent','third','primary']:['accent','primary'])save(new Blob([E.svgPlateExport(scene,role)],{type:'image/svg+xml'}),`prehnite-${cfg.variant}-${role}-separation.svg`);});
$('savePreset').addEventListener('click',()=>save(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}),`prehnite-${cfg.variant}-preset.json`));
$('loadPreset').addEventListener('click',()=>$('presetFile').click());
$('presetFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{cfg=E.validate(JSON.parse(await f.text()));buildControls();scheduleRender();}catch(err){setStatus('Invalid preset: '+err.message);}e.target.value='';});
const refCanvas=makeCanvas(W,H),refCtx=refCanvas.getContext('2d');
function loadReference(src){const img=new Image();img.onload=()=>{refCtx.clearRect(0,0,W,H);refCtx.drawImage(img,0,0,W,H);reference=refCanvas;compare();setStatus('Reference ready');};img.onerror=()=>setStatus('Reference unavailable; upload an image to compare.');img.src=src;}
$('referenceFile').addEventListener('change',e=>{if(!e.target.files?.[0])return;const url=URL.createObjectURL(e.target.files[0]);loadReference(url);setTimeout(()=>URL.revokeObjectURL(url),30000);});
function hsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 if(!d)return [0,0,l];const s=d/(1-Math.abs(2*l-1));let h=0;
 if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;
 return [((h*60)%360+360)%360,s,l];}
function classify(r,g,b,role){const hex=cfg.palette[role],target=hsl(...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
 const [h,s,l]=hsl(r,g,b),d=Math.abs(h-target[0]),dist=Math.min(d,360-d);
 if(target[1]<.25)return l<.40&&s<.4;
 return s>.21 && dist<(role==='primary'?43:38) && l<.83;
}
function imageMask(data,role){const m=new Uint8Array(W*H);for(let i=0,j=0;i<data.length;i+=4,j++)m[j]=classify(data[i],data[i+1],data[i+2],role)?1:0;return m;}
function metricsFor(ref,ren){let inter=0,uni=0,ra=0,rb=0,tx=0,ty,ux=0,uy=0;
 for(let i=0;i<ref.length;i++){
  const a=ref[i],b=ren[i];if(a)ra++;if(b)rb++;if(a&&b)inter++;if(a||b)uni++;
  if(a)tx+=i%W;if(b)ux+=i%W;
 }const grid=12,cw=Math.ceil(W/grid),ch=Math.ceil(H/grid),refc=new Uint8Array(cw*ch),renc=new Uint8Array(cw*ch);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=Math.floor(y/grid)*cw+Math.floor(x/grid);if(ref[i])refc[k]++;if(ren[i])renc[k]++;}
 let ci=0,cu=0;for(let i=0;i<refc.length;i++){let a=refc[i]>1,b=renc[i]>1;if(a&&b)ci++;if(a||b)cu++;}
 return {iou:inter/Math.max(1,uni),coarse:ci/Math.max(1,cu),targetCoverage:ra/(W*H),renderCoverage:rb/(W*H),xshift:(rb?ux/rb:0)-(ra?tx/ra:0)};
}
function compare(){if(!scene||!reference)return;try{const ref=refCtx.getImageData(0,0,W,H).data,ours=renderCtx.getImageData(0,0,W,H).data,roles=['primary','accent'];
 const d=$('diagnosticCanvas'),dc=d.getContext('2d');dc.clearRect(0,0,W,H);const meta=[];
 for(let n=0;n<2;n++){
  const refMask=imageMask(ref,roles[n]),outMask=imageMask(ours,roles[n]),stats=metricsFor(refMask,outMask);meta.push(stats);
  const overlay=makeCanvas(W,H),oc=overlay.getContext('2d'),pixels=oc.createImageData(W,H),a=pixels.data;
  for(let i=0;i<W*H;i++){
   let rgb=refMask[i]&&outMask[i]?[117,26,169]:refMask[i]?[0,214,247]:outMask[i]?[243,24,192]:[243,237,222];
   const j=i*4;a[j]=rgb[0];a[j+1]=rgb[1];a[j+2]=rgb[2];a[j+3]=255;
  }oc.putImageData(pixels,0,0);dc.drawImage(overlay,n*W/2,0,W/2,H);
 }
 diagOutput=d;const wrap=$('metrics');wrap.replaceChildren();
 roles.forEach((role,i)=>{const s=meta[i],el=document.createElement('div');el.className='metric';
 const head=document.createElement('strong');head.textContent=role.toUpperCase()+' · '+(100*s.coarse).toFixed(1)+'% coarse overlap';
 const sub=document.createElement('span');sub.textContent=`Strict ink-dot IoU ${(100*s.iou).toFixed(1)}% · Ref. ink ${(100*s.targetCoverage).toFixed(1)}% · Render ${(100*s.renderCoverage).toFixed(1)}% · Horizontal centroid Δ ${s.xshift.toFixed(1)} px`;
 el.append(head,sub);wrap.append(el);});
 }catch(e){console.error(e);setStatus('Comparison failed: '+e.message);}}
$('recompare').addEventListener('click',compare);
$('exportDiagnostics').addEventListener('click',async()=>{if(!diagOutput)return;save(await blobCanvas(diagOutput,'image/png'),`prehnite-${cfg.variant}-HSL-overlay.png`);});
// A regular project loads the pinned user-provided target from the reference folder.
// The self-contained distribution replaces this variable with an embedded data URL.
loadReference(window.PREHNITE_REFERENCE_DATA||'reference/approved-target.png');
buildControls();runRender();
window.prehniteStudio={getConfig:()=>JSON.parse(JSON.stringify(cfg)),generate:()=>E.build(cfg),render:()=>runRender(),compare,exportSVG:()=>E.svg(scene)};
})();
