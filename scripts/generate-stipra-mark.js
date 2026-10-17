#!/usr/bin/env node
/* Stiprā brand study 01 — built with the repository's actual v1 scene/plate engine.
 * This is an owner's-review candidate, NOT a replacement of logo_for_Readme.svg.
 * No external artwork, generated model image, web fonts or proprietary assets.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Core=require('../src/core.js');
const NAME='Overprint S / stippled ribbon';
const VERSION=1;
const COLORS=[
  {id:'blue',name:'Electric teal',color:'#227e91'},
  {id:'coral',name:'Vermilion',color:'#ee6a4d'},
  {id:'key',name:'Midnight key',color:'#262a3a'}
];
const BEZIERS=[
  [[340,83],[195,19],[85,90],[133,164]],
  [[133,164],[155,223],[371,176],[347,283]],
  [[347,283],[334,347],[175,454],[110,368]]
];
function bezier(a,b,c,d,t){
  const u=1-t;return [0,1].map(i=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]);
}
function points(){
  const out=[];for(const curve of BEZIERS)for(let i=0;i<95;i++)
    out.push(bezier(...curve,i/94));
  return out;
}
function marks(){
  const curve=points(),dots=[[],[],[]];
  for(let row=0;row<35;row++){
    const y=55+row*11;
    for(let col=0;col<35;col++){
      const x=55+col*11;
      let d2=Infinity;
      for(const p of curve)d2=Math.min(d2,(x-p[0])**2+(y-p[1])**2);
      const distance=Math.sqrt(d2);if(distance>52)continue;
      for(let plate=0;plate<2;plate++){
        const lateral=(x-240)*(plate===0?.11:-.1);
        const strength=Math.max(0,1-(Math.max(0,distance+lateral)/57)**1.8);
        if(!strength)continue;
        const n=((row*92821+col*68917+plate*991)**2%101)/101;
        if(n>strength*.9+.11)continue;
        const radius=Number(((1.5+3.4*strength)*(.87+n*.15)).toFixed(2));
        dots[plate].push({x,y,radius});
      }
      if(distance<12&&(row+col)%5===0)dots[2].push({x,y,radius:1.65});
    }
  }
  return dots;
}
function makeRecipe(){
  const layers=[],array=marks();
  COLORS.forEach((ink,i)=>array[i].forEach((p,j)=>layers.push({
    id:ink.id+'-'+String(j).padStart(4,'0'),
    plateId:ink.id+'-master',geometry:{kind:'circle',x:p.x,y:p.y,radius:p.radius},
    coverage:1
  })));
  return {version:VERSION,canvas:{
    width:480,height:480,dpi:300,units:'px',trim:{x:0,y:0,width:480,height:480},
    bleed:{top:0,right:0,bottom:0,left:0}},
    substrate:{name:'Warm uncoated rag',color:'#f4eddf'},
    inks:COLORS,
    plates:COLORS.map(x=>({id:x.id+'-master',inkId:x.id,role:x.id==='key'?'key':'spot',
      offset:{x:0,y:0},screen:{mode:'solid'}})),
    layers,seeds:{geometry:142,screen:142,paper:142,debris:142},
    provenance:{adapter:'stipra/core-v1',source:'original deterministic Bézier stippling and three physical ink passes',
      notes:'Owner-review candidate: 2 overprinted spot ribbons plus a sparse key screen.'}};
}
function generate(directory){
  const dest=path.resolve(directory),recipe=makeRecipe(),scene=Core.resolveRecipe(recipe);
  if(scene.plates.length!==3||recipe.layers.length<750)
    throw Error('Brand scene did not produce three substantial independent plates');
  const outputs={
    'stipra-mark.svg':Core.renderSvg(scene),
    'stipra-mark-blue.svg':Core.renderSvg(scene,{plateId:'blue-master'}),
    'stipra-mark-coral.svg':Core.renderSvg(scene,{plateId:'coral-master'}),
    'stipra-mark-key.svg':Core.renderSvg(scene,{plateId:'key-master'}),
    'stipra-mark.recipe.json':Core.canonicalRecipe(recipe)
  };
  const manifest={
    label:NAME,generator:'stipra/core-v1',version:VERSION,
    status:'proposed; existing owner logo unchanged',
    physicalPasses:COLORS.length,colors:COLORS,sourceSeed:142,
    files:Object.entries(outputs).map(([name,content])=>({
      name,bytes:Buffer.byteLength(content),sha256:crypto.createHash('sha256').update(content).digest('hex')}))
  };
  outputs['stipra-mark.manifest.json']=JSON.stringify(manifest,null,2)+'\n';
  fs.mkdirSync(dest,{recursive:true});
  for(const [name,content] of Object.entries(outputs))
    fs.writeFileSync(path.join(dest,name),content,'utf8');
  return {directory:dest,manifest};
}
if(require.main===module){
  const arg=process.argv[2];
  if(process.argv.length>3||arg?.startsWith('--'))throw Error('Usage: node scripts/generate-stipra-mark.js [output-directory]');
  process.stdout.write(JSON.stringify(generate(arg||path.join(__dirname,'../dist/brand')),null,2)+'\n');
}
module.exports={makeRecipe,generate,marks,NAME,COLORS};
