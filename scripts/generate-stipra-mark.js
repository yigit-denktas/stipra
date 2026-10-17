#!/usr/bin/env node
/* Stiprā brand study 02 — geometry first, halftone second.
 * A single sampled Bézier S, finite-width silhouette, deterministic matrix lattice,
 * and a clearly defined two-plate overprint. Generated via the actual v1 scene engine.
 * Not an approved substitute for logo_for_Readme.svg. MIT.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Core=require('../src/core.js');
const NAME='Stiprā / Constructed matrix S';
const VERSION=2,CANVAS=480,RIBBON_RADIUS=41;
const STEP=11.8;
const COLORS={
  dark:{id:'dark',name:'Carbon key',color:'#222825'},
  teal:{id:'teal',name:'Teal',color:'#177f8d'},
  coral:{id:'coral',name:'Vermilion',color:'#e7604c'}
};
const CURVES=[
  [[357,129],[287,74],[159,79],[131,153]],
  [[131,153],[103,235],[373,227],[351,320]],
  [[351,320],[326,420],[185,428],[118,364]]
];
const SHIFT={x:-6,y:-6};
const round=n=>Number(n.toFixed(4));
function cubic(p,t){
  const u=1-t;
  return [0,1].map(i=>u*u*u*p[0][i]+3*u*u*t*p[1][i]+3*u*t*t*p[2][i]+t*t*t*p[3][i]);
}
function pathPoints(){
  const pts=[];
  for(const curve of CURVES)
    for(let i=0;i<=120;i++){
      if(pts.length&&i===0)continue;
      const p=cubic(curve,i/120);
      pts.push([p[0]+SHIFT.x,p[1]+SHIFT.y]);
    }
  return pts;
}
function polygon(){
  const pts=pathPoints(),left=[],right=[];
  for(let i=0;i<pts.length;i++){
    const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];
    const angle=Math.atan2(next[1]-prev[1],next[0]-prev[0]);
    const normal=[-Math.sin(angle),Math.cos(angle)];
    left.push([pts[i][0]+RIBBON_RADIUS*normal[0],pts[i][1]+RIBBON_RADIUS*normal[1]]);
    right.push([pts[i][0]-RIBBON_RADIUS*normal[0],pts[i][1]-RIBBON_RADIUS*normal[1]]);
  }
  function cap(center,tangent,start,finish){
    const list=[];
    for(let i=0;i<=28;i++){
      const a=tangent+start+(finish-start)*i/28;
      list.push([center[0]+RIBBON_RADIUS*Math.cos(a),center[1]+RIBBON_RADIUS*Math.sin(a)]);
    }
    return list;
  }
  function tangent(index,other){
    const a=pts[index],b=pts[other];
    return Math.atan2(b[1]-a[1],b[0]-a[0]);
  }
  // Round caps, no graphical noise. The S must stand alone before any dots.
  const tail=cap(pts[pts.length-1],tangent(pts.length-2,pts.length-1),Math.PI/2,-Math.PI/2);
  const head=cap(pts[0],tangent(0,1),-Math.PI/2,Math.PI/2);
  return [...left,...tail,...right.reverse(),...head].map(pair=>pair.map(round));
}
function dotGrid(variant='density'){
  if(!['matrix','density','overprint'].includes(variant))
    throw new Error('mark: unknown variant '+variant);
  const curve=pathPoints(),dots=[];
  for(let row=0;row<33;row++)for(let col=0;col<33;col++){
    const x=52+col*STEP,y=51+row*STEP;
    let d2=Infinity,index=0;
    for(let i=0;i<curve.length;i++){
      const dx=x-curve[i][0],dy=y-curve[i][1],v=dx*dx+dy*dy;
      if(v<d2){d2=v;index=i;}
    }
    const distance=Math.sqrt(d2);
    if(distance>RIBBON_RADIUS-1.5)continue;
    const edge=Math.min(1,(RIBBON_RADIUS-distance)/6);
    const centerWeight=Math.max(0,1-Math.pow((x-240)/210,2));
    const radius=variant==='matrix'?4.1*edge:
      (2.45+1.9*centerWeight)*edge;
    if(radius<.6)continue;
    dots.push({x:round(x),y:round(y),radius:round(Math.min(STEP*.45,radius)),
      t:round(index/(curve.length-1)),row,col});
  }
  return dots;
}
function balance(dots){
  let weight=0,x=0,y=0,left=0,right=0;
  for(const d of dots){
    const area=Math.PI*d.radius*d.radius;
    weight+=area;x+=d.x*area;y+=d.y*area;
    if(d.x<CANVAS/2)left+=area;else right+=area;
  }
  return {centerX:round(x/weight),centerY:round(y/weight),
    leftArea:round(left),rightArea:round(right),
    leftRightRatio:round(left/right),dotCount:dots.length};
}
function sceneRecipe(variant='overprint'){
  if(!['matrix','density','overprint','silhouette'].includes(variant))
    throw Error('mark: unknown scene variant '+variant);
  const stencil=variant==='silhouette',twoInk=variant==='overprint',
    inks=twoInk?[COLORS.teal,COLORS.coral]:[COLORS.dark];
  const layers=[];
  if(stencil){
    layers.push({id:'silhouette',plateId:'dark-master',geometry:{kind:'polygon',points:polygon()},coverage:1});
  }else{
    for(const [i,dot] of dotGrid(variant).entries()){
      const plates=twoInk?(dot.t<.42?['teal']:dot.t>.58?['coral']:['teal','coral']):['dark'];
      for(const plate of plates)
        layers.push({id:plate+'-'+String(i).padStart(4,'0'),plateId:plate+'-master',
          geometry:{kind:'circle',x:dot.x,y:dot.y,radius:dot.radius},coverage:1});
    }
  }
  return {
    version:1,
    canvas:{width:CANVAS,height:CANVAS,dpi:300,units:'px',
      trim:{x:0,y:0,width:CANVAS,height:CANVAS},bleed:{top:0,right:0,bottom:0,left:0}},
    substrate:{name:'Warm uncoated rag',color:'#f4eddf'},
    inks,plates:inks.map(ink=>({id:ink.id+'-master',inkId:ink.id,
      role:ink.id==='dark'?'key':'spot',offset:{x:0,y:0},screen:{mode:'solid'}})),
    layers,seeds:{geometry:142,screen:142,paper:142,debris:142},
    provenance:{adapter:'stipra/core-v1',source:'Stiprā: constructed Bézier S, fixed-width ribbon and uniform dot lattice',
      notes:'Experimental identity v2 '+variant+'; explicit monochrome silhouette and two registered physical ink passes; no randomness.'}
  };
}
function makeRecipe(){return sceneRecipe('overprint');}
function marks(){return dotGrid('overprint').map(d=>({x:d.x,y:d.y,radius:d.radius}));}
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
function generate(directory){
  const dir=path.resolve(directory),scenes=Object.fromEntries(
    ['silhouette','matrix','density','overprint'].map(k=>[k,Core.resolveRecipe(sceneRecipe(k))]));
  const b=balance(dotGrid('density'));
  if(Math.abs(b.centerX-240)>12||Math.abs(b.centerY-240)>12||b.leftRightRatio<.90||b.leftRightRatio>1.10)
    throw Error('Stiprā mark fails balance gate: '+JSON.stringify(b));
  const composite=Core.renderSvg(scenes.overprint);
  const outputs={
    'stipra-mark.svg':composite, // public preview URL stays stable, original logo is unchanged
    'stipra-mark-teal.svg':Core.renderSvg(scenes.overprint,{plateId:'teal-master'}),
    'stipra-mark-coral.svg':Core.renderSvg(scenes.overprint,{plateId:'coral-master'}),
    'stipra-mark-silhouette.svg':Core.renderSvg(scenes.silhouette),
    'stipra-mark-matrix.svg':Core.renderSvg(scenes.matrix),
    'stipra-mark-density.svg':Core.renderSvg(scenes.density),
    'stipra-mark-overprint.svg':composite,
    'stipra-mark.recipe.json':Core.canonicalRecipe(sceneRecipe('overprint'))
  };
  const manifest={
    label:NAME,generator:'stipra/core-v1',designVersion:VERSION,
    status:'owner-review candidate; original dotmark and README identity unchanged',
    construction:{path:'3 cubic Bézier segments',strokeWidth:RIBBON_RADIUS*2,
      gridPitch:STEP,randomness:0,inkLayers:2,overprintInterval:[.42,.58],
      monochromeDiagnostics:b,variants:['silhouette','matrix','density','overprint']},
    files:Object.entries(outputs).map(([name,content])=>({
      name,bytes:Buffer.byteLength(content),sha256:sha(content)}))
  };
  outputs['stipra-mark.manifest.json']=JSON.stringify(manifest,null,2)+'\n';
  fs.mkdirSync(dir,{recursive:true});
  for(const [file,content] of Object.entries(outputs))fs.writeFileSync(path.join(dir,file),content);
  return {directory:dir,manifest};
}
if(require.main===module){
  const arg=process.argv[2];
  if(process.argv.length>3||arg?.startsWith('--'))
    throw Error('Usage: node scripts/generate-stipra-mark.js [output-directory]');
  process.stdout.write(JSON.stringify(generate(arg||path.join(__dirname,'../dist/brand')),null,2)+'\n');
}
module.exports={NAME,VERSION,CANVAS,COLORS,CURVES,makeRecipe,sceneRecipe,
  generate,dotGrid,balance,polygon,marks};
