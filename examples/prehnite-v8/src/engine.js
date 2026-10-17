/* Prehnite Riso Studio v8 — pure procedural scene/plate/SVG engine, MIT.
   No reference pixels or artwork are used as the generation source. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./font-atlas.js'));
  else root.PrehniteEngine=factory(root.PREHNITE_FONT_ATLAS);
})(typeof self!=='undefined'?self:this,function(FONTS){
'use strict';
const W=2020,H=779;
const P={
 A:[69,548],B:[156,346],C:[279,237],D:[419,138],E:[635,224],F:[703,418],G:[321,631],
 O:[348,417],M:[547,485],J:[285,288],T:[479,313]
};
const FACETS={
 'left-light':['A','B','O'], 'left-shadow':['B','C','J','O'], 'top-shadow':['C','D','O','J'],
 'top-paper':['D','E','O'], 'center-coral':['O','E','M'], 'right-shadow':['E','F','M'],
 'bottom-paper':['O','M','G'],'bottom-shadow':['A','O','G']
};
const OUTER=['A','B','C','D','E','F','G'];
const SEAMS=[['A','O'],['B','O'],['C','O'],['D','O'],['E','O'],['O','M'],['M','G'],['E','M'],['F','M'],['C','J'],['J','O']];
const WORD=[732,204,1194,305],TAG=[746,561,1162,42],RULE=[807,508,1101,8];
const palette01={primary:'#086a48',accent:'#fa635b',third:'#80d8c5',paper:'#f7efdd'};
const PALETTES={
 '01':{name:'Evergreen + Fluorescent Coral / Ivory',primary:'#086a48',accent:'#fa635b',third:'#80d8c5',paper:'#f7efdd',stock:'Ivory'},
 '02':{name:'Midnight Ink + Ochre / Natural',primary:'#0a2348',accent:'#e4a521',third:'#9ec0ad',paper:'#e9e2d5',stock:'Natural'},
 '03':{name:'Cobalt + Mint (Pink Overlap) / Blush',primary:'#0752c5',accent:'#f64f95',third:'#79d8c9',paper:'#f9e5df',stock:'Blush'},
 '04':{name:'Moss Green + Dusty Rose / Natural',primary:'#24553e',accent:'#cd8293',third:'#bed2ac',paper:'#eee7d9',stock:'Natural'},
 '05':{name:'Indigo + Vermilion / Warm Gray',primary:'#292c82',accent:'#f14935',third:'#adc4de',paper:'#e9e3dc',stock:'Warm Gray'},
 '06':{name:'Black + Fluorescent Yellow-Lime / Ivory',primary:'#1a1c1c',accent:'#d5e600',third:'#b7b7a0',paper:'#f6eddc',stock:'Ivory'}
};
const palette03={primary:'#0752c5',accent:'#f64f95',third:'#79d8c9',paper:'#f9e5df'};
const recipe01={
 'left-light':{mode:'dots',inks:{accent:[.67,.37],primary:[.26,.31]}},
 'left-shadow':{mode:'reverse',inks:{primary:[.99,.56]}},
 'top-shadow':{mode:'reverse',inks:{primary:[.99,.56]}},
 'top-paper':{mode:'dots',inks:{accent:[.40,.34],primary:[.32,.29]}},
 'center-coral':{mode:'hybrid',inks:{accent:[.92,.52],primary:[.43,.30]}},
 'right-shadow':{mode:'reverse',inks:{primary:[.97,.58]}},
 'bottom-paper':{mode:'dots',inks:{primary:[.55,.35],accent:[.09,.28]}},
 'bottom-shadow':{mode:'reverse',inks:{primary:[.99,.57]}}
};
const recipe03={
 'left-light':{mode:'dots',inks:{third:[.80,.52],accent:[.41,.40]}},
 'left-shadow':{mode:'reverse',inks:{primary:[.99,.56]}},
 'top-shadow':{mode:'reverse',inks:{primary:[.99,.53]}},
 'top-paper':{mode:'dots',inks:{third:[.81,.52],accent:[.43,.40]}},
 'center-coral':{mode:'dots',inks:{accent:[.84,.56],primary:[.38,.35]}},
 'right-shadow':{mode:'reverse',inks:{primary:[.99,.55]}},
 'bottom-paper':{mode:'dots',inks:{third:[.63,.52],accent:[.63,.42]}},
 'bottom-shadow':{mode:'reverse',inks:{primary:[.99,.55]}}
};
const paletteNames=Object.keys(PALETTES);
const stockNames=['Ivory','Natural','Blush','Warm Gray'];
const clone=x=>JSON.parse(JSON.stringify(x));
const presets={
 '01':{version:7,variant:'01',seed:2217,palette:palette01,points:P,facets:recipe01,
  dotPitch:7.3,dotSize:98,coverage:100,jitter:57,softness:6.3,inkBleed:.4,registrationX:-2.4,registrationY:4.0,
  paperGrain:82,wordTracking:-3,tagTracking:175,wordHeight:1.07,wordFont:'display-bold',paperStock:'Ivory',outlineWidth:3.7,printWear:72,crystalScale:100,crystalX:0,crystalY:0},
 '03':{version:7,variant:'03',seed:4701,palette:palette03,points:P,facets:recipe03,
  dotPitch:7.3,dotSize:98,coverage:100,jitter:53,softness:6.0,inkBleed:.4,registrationX:2.1,registrationY:4.3,
  paperGrain:82,wordTracking:-3,tagTracking:175,wordHeight:1.07,wordFont:'display-bold',paperStock:'Blush',outlineWidth:3.7,printWear:72,crystalScale:100,crystalX:0,crystalY:0}
};
// Presets 02/04/05/06 inherit the established two-ink facet recipe.
for(const id of ['02','04','05','06']){
 const base=clone(presets['01']);base.variant=id;base.seed=2217+parseInt(id)*417;
 base.palette={...PALETTES[id]};base.paperStock=PALETTES[id].stock;
 presets[id]=base;
}
for(const id of paletteNames){presets[id].palette={...PALETTES[id]};presets[id].paperStock=PALETTES[id].stock;}
function preset(id='01'){return clone(presets[id]||presets['01']);}
function listPresets(){return paletteNames.map(id=>({id,name:PALETTES[id].name,inks:clone(PALETTES[id])}));}
function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function rng(seed){let x=(seed>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function rndstr(x,prec=2){return Number(x.toFixed(prec)).toString();}
function geomPoint(k,c){const p=c.points[k],s=c.crystalScale/100;return [(p[0]-380)*s+380+c.crystalX,(p[1]-390)*s+390+c.crystalY];}
function boundsPoly(pts){return {minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))};}
function inside(x,y,pts){let yes=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){
 const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1]+1e-12)+a[0])yes=!yes;
}return yes;}
function distEdge(x,y,pts){let d=1e9;for(let i=0;i<pts.length;i++){
 const p=pts[i],q=pts[(i+1)%pts.length],dx=q[0]-p[0],dy=q[1]-p[1],t=clamp(((x-p[0])*dx+(y-p[1])*dy)/(dx*dx+dy*dy),0,1),ex=p[0]+t*dx-x,ey=p[1]+t*dy-y;d=Math.min(d,Math.hypot(ex,ey));
}return d;}
function segment(a,b,key,c){const rand=rng(hash(key+'-'+c.seed)), len=Math.hypot(b[0]-a[0],b[1]-a[1]);const nx=-(b[1]-a[1])/len,ny=(b[0]-a[0])/len;let out='';
 const count=Math.max(2,Math.ceil(len/5));const phase=rand()*Math.PI*2;const amp=c.softness*.5;
 for(let i=1;i<=count;i++){
  const t=i/count,off=amp*Math.sin(Math.PI*t)*(.6*Math.sin(t*len*.095+phase)+.29*Math.sin(t*len*.21+phase*1.8)+.11*Math.sin(t*len*.64+phase*.68));
  out+='L'+rndstr(a[0]+(b[0]-a[0])*t+nx*off)+','+rndstr(a[1]+(b[1]-a[1])*t+ny*off);
 }return out;
}
function polyPath(ids,c,closed=true){const pts=ids.map(k=>geomPoint(k,c));let s='M'+pts[0].map(x=>rndstr(x)).join(',');for(let i=1;i<ids.length;i++)s+=segment(pts[i-1],pts[i],ids[i-1]+'-'+ids[i],c);if(closed)s+=segment(pts[pts.length-1],pts[0],ids[ids.length-1]+'-'+ids[0],c)+'Z';return s;}
function dotPath(pts,c,which,facet,coverage,radFactor){
 const rand=rng(hash(which+facet)+c.seed), pitch=c.dotPitch, step=pitch, bounds=boundsPoly(pts),angle=(({primary:-13,accent:18,third:42})[which]||0)*Math.PI/180;
 const ca=Math.cos(angle),sa=Math.sin(angle),midx=(bounds.minX+bounds.maxX)/2,midy=(bounds.minY+bounds.maxY)/2;
 const span=Math.hypot(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY)*.69+pitch*2;
 const jitter=pitch*.42*c.jitter/100, factor=c.dotSize/100, edge=c.softness;
 let out='',cnt=0;
 // Circles/ellipses are drawn as SVG arc paths. Same path is used with Canvas Path2D.
 for(let gx=-span;gx<span;gx+=step){for(let gy=-span;gy<span;gy+=step){
  if(rand()>coverage*c.coverage/100)continue;
  const a=gx+(rand()-.5)*jitter*2,b=gy+(rand()-.5)*jitter*2;
  const x=midx+a*ca-b*sa,y=midy+a*sa+b*ca;
  if(!inside(x,y,pts))continue;
  const dist=distEdge(x,y,pts),soft=clamp((dist+.7)/(edge+1.2),.14,1);
  if(rand()>soft)continue;
  const maxr=radFactor*step*factor*(1+c.inkBleed*.07),rx=maxr*(.65+rand()*.53)*(0.68+.32*soft),ry=rx*(.72+rand()*.5);
  if(rx<.18)continue;
  out+='M'+rndstr(x-rx,2)+','+rndstr(y,2)+'a'+rndstr(rx)+','+rndstr(ry)+' 0 1 0 '+rndstr(2*rx)+',0a'+rndstr(rx)+','+rndstr(ry)+' 0 1 0 '+rndstr(-2*rx)+',0Z';cnt++;
 }}return {d:out,count:cnt};
}
function typography(text,kind,box,tracking,fontKey='display-black',yScale=1){
 const atlas=(kind==='word'?FONTS.wordVariants?.[fontKey]||FONTS.word:FONTS.tag),glyphs=atlas.glyphs,chars=Array.from(text),valid=chars.filter(ch=>glyphs[ch]);
 if(valid.length!==chars.length)throw new Error('Unsupported character in text: '+text);
 const adv=chars.reduce((a,ch)=>a+glyphs[ch].a,0);
 const kern=tracking*(chars.length-1);
 // Candidate scale based on natural letter proportions: no horizontal squashing.
 const bb=chars.map(ch=>glyphs[ch].b);
 const low=Math.min(...bb.map(b=>b[1])),high=Math.max(...bb.map(b=>b[3]));
 const glyphH=high-low;const scale=Math.min(box[3]/glyphH,box[2]/Math.max(1,adv+kern));
 const naturalWidth=(adv+kern)*scale;let x=box[0]+(box[2]-naturalWidth)/2;
 const y=box[1]+(box[3]-glyphH*scale*yScale)/2+high*scale*yScale;
 const res=[];for(let i=0;i<chars.length;i++){
  const g=glyphs[chars[i]];if(g.d)res.push({d:g.d,x,y,s:scale,sy:yScale});x+=(g.a+tracking)*scale;
 }return res;
}
function paperScene(c){const rand=rng(c.paperSeed??(c.seed+919)),grain=c.paperGrain/100;const flecks=[],fibers=[],clouds=[];
 for(let i=0;i<Math.round(grain*27000);i++){
  const x=rand()*W,y=rand()*H,r=.12+rand()*1.0;flecks.push([x,y,r,rand()]);
 }
 for(let i=0;i<Math.round(grain*11000);i++){
  let x=rand()*W,y=rand()*H,ln=.8+rand()*7,a=rand()*Math.PI;fibers.push([x,y,x+ln*Math.cos(a),y+ln*Math.sin(a),rand()]);
 }
 for(let i=0;i<Math.round(grain*540);i++){
   clouds.push([rand()*W,rand()*H,9+rand()*72,3+rand()*32,rand()]);
 }
 return {flecks,fibers,clouds};
}
function wearScene(c){
 const rand=rng(hash('wear')+c.seed),paths={};
 for(const role of ['primary','accent','third']){
  const parts=[];
  const count=Math.round((role==='primary'?5600:role==='accent'?3250:400)*(c.printWear??72)/72);
  for(let i=0;i<count;i++){
   const r=rand(),box=r<.68?WORD:r<.83?TAG:[60,135,650,510];
   const x=box[0]+rand()*box[2],y=box[1]+rand()*box[3];
   const radius=(.22+rand()*.76)*(role==='primary'?1:0.8);
   parts.push('M'+rndstr(x-radius)+','+rndstr(y)+'a'+rndstr(radius)+','+rndstr(radius)+' 0 1 0 '+rndstr(2*radius)+',0a'+rndstr(radius)+','+rndstr(radius)+' 0 1 0 '+rndstr(-2*radius)+',0Z');
  }paths[role]=parts.join('');
 }return paths;
}
function build(c){
 const plates={primary:[],accent:[],third:[]};const polys={};let dots=0;
 for(const [name,keys] of Object.entries(FACETS)){
  const pts=keys.map(k=>geomPoint(k,c)),clip=polyPath(keys,c),spec=c.facets[name];polys[name]=clip;
  if(spec.mode==='paper')continue;
  for(const [role,pair] of Object.entries(spec.inks||{})){
    const [coverage,rad]=pair;
    if(spec.mode==='reverse'||(spec.mode==='hybrid'&&role==='accent')){
      // Reverse screen: heavy ink foundation with stochastic PAPER pinholes.
      // These negative dots are actual holes in an individual ink plate.
      const holes=dotPath(pts,c,role,name+'-holes',spec.mode==='hybrid'?.43:.72,spec.mode==='hybrid'?.22:Math.min(.32,rad*.53));
      dots+=holes.count;plates[role].push({kind:'reverse',d:holes.d,clip,facet:name,role});
    }else{
      const data=dotPath(pts,c,role,name,coverage,rad);dots+=data.count;
      plates[role].push({kind:'dots',d:data.d,clip,facet:name});
    }
  }
 }
 const wm=typography('prehnite','word',WORD,c.wordTracking,c.wordFont,c.wordHeight||1);
 const tag=typography('MAKE THE BATCH. KEEP THE BEST.','tag',TAG,c.tagTracking);
 plates.primary.push({kind:'text',glyphs:wm,facet:'wordmark'});
 plates.accent.push({kind:'text',glyphs:wm,facet:'wordmark-underprint'});
 plates.accent.push({kind:'text',glyphs:tag,facet:'tagline'});
 plates.accent.push({kind:'rect',box:RULE,facet:'underline'});
 return {width:W,height:H,c,plates,polys,border:polyPath(OUTER,c),seams:SEAMS.map(line=>polyPath(line,c,false)),paper:paperScene(c),wear:wearScene(c),dotCount:dots};
}
function plateContent(ctx,scene,role){
 for(const item of scene.plates[role]){
  ctx.save(); ctx.fillStyle='#000';
  if(item.kind==='dots'){
   ctx.clip(new Path2D(item.clip));ctx.fill(new Path2D(item.d));
  }else if(item.kind==='reverse'){
   ctx.clip(new Path2D(item.clip));ctx.fill(new Path2D(item.clip));
   ctx.globalCompositeOperation='destination-out';ctx.fill(new Path2D(item.d));
  }else if(item.kind==='text'){
   for(const g of item.glyphs){ctx.save();ctx.translate(g.x,g.y);ctx.scale(g.s,-g.s*(g.sy||1));ctx.fill(new Path2D(g.d));ctx.restore();}
  }else if(item.kind==='rect'){
   const [x,y,w,h]=item.box;ctx.fillRect(x,y,w,h);
  }ctx.restore();
 }
 // Negative space and print loss are removed independently on each ink plate.
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fill(new Path2D(scene.wear[role]));ctx.restore();
 // Negative space is *removed* on every plate, not painted on as a filter.
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=1.8;
 for(const line of scene.seams){ctx.stroke(new Path2D(line));}ctx.restore();
 ctx.save();ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.lineWidth=scene.c.outlineWidth??3.7;
 ctx.stroke(new Path2D(scene.border));ctx.restore();
}
function renderPlate(scene,role,canvasFactory,scale=1){const can=canvasFactory(W*scale,H*scale),ctx=can.getContext('2d');ctx.scale(scale,scale);plateContent(ctx,scene,role);return can;}
function drawPaper(ctx,scene){const c=scene.c,p=scene.paper,grain=c.paperGrain/100;
 ctx.fillStyle=c.palette.paper;ctx.fillRect(0,0,W,H);
 for(const [x,y,rx,ry,q] of p.clouds){ctx.globalAlpha=(.009+q*.020)*grain;ctx.fillStyle=q>.43?'#fffdfa':'#8c6c4a';ctx.beginPath();ctx.ellipse(x,y,rx,ry,q*Math.PI,0,Math.PI*2);ctx.fill();}
 for(const [x,y,r,q] of p.flecks){ctx.globalAlpha=(q>.6?.14:.29)*grain;ctx.fillStyle=q>.65?'#ffffff':'#70583d';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 ctx.lineWidth=.4;for(const [x1,y1,x2,y2,q] of p.fibers){ctx.globalAlpha=(.12+.20*q)*grain;ctx.strokeStyle=q>.42?'#fffefd':'#8b6848';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}ctx.globalAlpha=1;
}
function paint(ctx,scene,canvasFactory,scale=1){ctx.save();ctx.scale(scale,scale);drawPaper(ctx,scene);
 const order=scene.c.variant==='03'?['accent','third','primary']:['accent','primary'];
 for(const role of order){const plate=renderPlate(scene,role,canvasFactory,scale),layer=canvasFactory(W*scale,H*scale),lc=layer.getContext('2d');
   lc.fillStyle=scene.c.palette[role];lc.fillRect(0,0,W*scale,H*scale);
   lc.globalCompositeOperation='destination-in';lc.drawImage(plate,0,0);
   ctx.globalCompositeOperation='multiply';
   ctx.drawImage(layer,role==='accent'?scene.c.registrationX:0,role==='accent'?scene.c.registrationY:0,W,H);
   ctx.globalCompositeOperation='source-over';
 }
 ctx.restore();}
function render(scene,canvasFactory,scale=1){const can=canvasFactory(W*scale,H*scale);paint(can.getContext('2d'),scene,canvasFactory,scale);return can;}
function maskPath(role,scene){
 const seams=scene.seams.map(d=>`<path d="${d}" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round"/>`).join('');
 return `<mask id="knock-${role}" maskUnits="userSpaceOnUse"><rect width="${W}" height="${H}" fill="white"/><path d="${scene.wear[role]}" fill="black"/>${seams}</mask>`;
}
function svgPlate(scene,role,monochrome=false){const arr=[];
 for(const item of scene.plates[role]){
  if(item.kind==='dots')arr.push(`<path d="${item.d}" clip-path="url(#clip-${item.facet})"/>`);
  else if(item.kind==='reverse')arr.push(`<path d="${item.clip}${item.d}" fill-rule="evenodd" clip-path="url(#clip-${item.facet})"/>`);
  else if(item.kind==='text')for(const g of item.glyphs)arr.push(`<path d="${g.d}" transform="translate(${rndstr(g.x)} ${rndstr(g.y)}) scale(${rndstr(g.s,5)} ${rndstr(-g.s*(g.sy||1),5)})"/>`);
  else if(item.kind==='rect')arr.push(`<rect x="${item.box[0]}" y="${item.box[1]}" width="${item.box[2]}" height="${item.box[3]}"/>`);
 }
 arr.push(`<path d="${scene.border}" fill="none" stroke="${monochrome?'black':scene.c.palette[role]}" stroke-width="${scene.c.outlineWidth??3.7}" stroke-linejoin="round"/>`);
 return `<g mask="url(#knock-${role})">${arr.join('')}</g>`;
}
function svg(scene,options={}){
 const c=scene.c;const defs=Object.entries(scene.polys).map(([key,d])=>`<clipPath id="clip-${key}"><path d="${d}"/></clipPath>`).join('');
 const masks=['primary','accent','third'].map(role=>maskPath(role,scene)).join('');
 const reverseMasks=Object.entries(scene.plates).flatMap(([role,items])=>items.filter(i=>i.kind==='reverse').map(i=>`<mask id="reverse-${role}-${i.facet}" maskUnits="userSpaceOnUse"><path d="${i.clip}" fill="white"/><path d="${i.d}" fill="black"/></mask>`)).join('');
 let background=`<rect width="${W}" height="${H}" fill="${c.palette.paper}"/>`;
 if(options.paper!==false){
  // Paper speckle and fibers are fully vector. No embedded bitmaps.
  background+='<g>'+scene.paper.clouds.map(([x,y,rx,ry,q])=>`<ellipse cx="${rndstr(x)}" cy="${rndstr(y)}" rx="${rndstr(rx)}" ry="${rndstr(ry)}" transform="rotate(${rndstr(q*180)} ${rndstr(x)} ${rndstr(y)})" fill="${q>.43?'#fffdfa':'#8c6c4a'}" opacity="${rndstr((.009+q*.020)*c.paperGrain/100,4)}"/>`).join('') +scene.paper.flecks.map(([x,y,r,q])=>`<circle cx="${rndstr(x)}" cy="${rndstr(y)}" r="${rndstr(r)}" fill="${q>.65?'#ffffff':'#70583d'}" opacity="${rndstr((q>.6?.14:.29)*c.paperGrain/100,3)}"/>`).join('')+
  scene.paper.fibers.map(([x1,y1,x2,y2,q])=>`<path d="M${rndstr(x1)},${rndstr(y1)}L${rndstr(x2)},${rndstr(y2)}" stroke="${q>.42?'#fffefd':'#8b6848'}" stroke-width=".4" opacity="${rndstr((.12+.20*q)*c.paperGrain/100,3)}"/>`).join('')+'</g>';
 }
 const order=c.variant==='03'?['accent','third','primary']:['accent','primary'];
 const plates=order.map(role=>`<g fill="${c.palette[role]}" style="mix-blend-mode:multiply" transform="translate(${role==='accent'?c.registrationX:0} ${role==='accent'?c.registrationY:0})">${svgPlate(scene,role)}</g>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>Prehnite Risograph procedural ${c.variant}</title><desc>Independent vector ink plates, procedural halftone and paper; typography is outlined geometry.</desc><defs>${defs}${masks}${reverseMasks}</defs>${background}${plates}</svg>`;
}
function svgPlateExport(scene,role){const clips=Object.entries(scene.polys).map(([key,d])=>`<clipPath id="clip-${key}"><path d="${d}"/></clipPath>`).join('');
 const mask=maskPath(role,scene);
 const reverseMasks=scene.plates[role].filter(i=>i.kind==='reverse').map(i=>`<mask id="reverse-${role}-${i.facet}" maskUnits="userSpaceOnUse"><path d="${i.clip}" fill="white"/><path d="${i.d}" fill="black"/></mask>`).join('');
 // Inks are black for monochrome plate export; paper areas remain transparent.
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${role} plate</title><defs>${clips}${mask}${reverseMasks}</defs><g fill="black">${svgPlate(scene,role,true)}</g></svg>`;
}
function inspectText(){return {wordmark:WORD,tagline:TAG,underline:RULE};}
function validate(input){if(!input||!paletteNames.includes(input.variant))throw new Error('Invalid preset');const c=preset(input.variant);
 const bounds={dotPitch:[3,12],dotSize:[40,165],coverage:[0,120],jitter:[0,100],softness:[0,20],inkBleed:[0,3],
  registrationX:[-20,20],registrationY:[-20,20],paperGrain:[0,120],wordTracking:[-80,80],tagTracking:[0,300],
  crystalScale:[60,140],crystalX:[-180,180],crystalY:[-140,140],outlineWidth:[0,9],printWear:[0,150],wordHeight:[.9,1.18]};
 for(const [key,range] of Object.entries(bounds))if(Number.isFinite(input[key]))c[key]=clamp(Number(input[key]),...range);
 if(Number.isSafeInteger(input.seed))c.seed=clamp(input.seed,1,2147483647);
 if(Number.isSafeInteger(input.paperSeed))c.paperSeed=clamp(input.paperSeed,1,2147483647);
 if(['display-bold','display-black','inter-black'].includes(input.wordFont))c.wordFont=input.wordFont;
 if(stockNames.includes(input.paperStock))c.paperStock=input.paperStock;
 for(const key of ['primary','accent','third','paper'])if(/^#[0-9a-f]{6}$/i.test(input.palette?.[key]||''))c.palette[key]=input.palette[key];
 for(const [k,p] of Object.entries(input.points||{}))if(k in P&&Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))c.points[k]=[clamp(p[0],0,W),clamp(p[1],0,H)];
 for(const [k,fd] of Object.entries(input.facets||{}))if(k in FACETS&&fd&&['dots','dense','reverse','hybrid','paper'].includes(fd.mode)){
  c.facets[k]={mode:fd.mode,inks:{}};
  for(const [role,val] of Object.entries(fd.inks||{}))if(role in c.palette&&role!=='paper'&&Array.isArray(val)&&val.length===2&&val.every(Number.isFinite))c.facets[k].inks[role]=[clamp(val[0],0,1),clamp(val[1],.1,1.2)];
 }
 return c;
}
return {W,H,FACETS,OUTER,SEAMS,preset,listPresets,PALETTES,validate,build,render,renderPlate,paint,svg,svgPlateExport,geomPoint,inspectText};
});
