#!/usr/bin/env node
/* The Stiprā brand study is authored as an actual Stiprā layered vector scene.
 * It is NOT an imported or AI-generated illustration. Keep original logo intact.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const Core=require('../src/core.js');
const W=440,H=340;
const bezier=[
 [[304,84],[268,22],[118,44],[149,119]],
 [[149,119],[172,175],[281,141],[274,205]],
 [[274,205],[274,288],[154,304],[113,256]]
];
function interpolate(c,t){
 const u=1-t;
 const x=u*u*u*c[0][0]+3*u*u*t*c[1][0]+3*u*t*t*c[2][0]+t*t*t*c[3][0];
 const y=u*u*u*c[0][1]+3*u*u*t*c[1][1]+3*u*t*t*c[2][1]+t*t*t*c[3][1];
 const dx=3*u*u*(c[1][0]-c[0][0])+6*u*t*(c[2][0]-c[1][0])+3*t*t*(c[3][0]-c[2][0]);
 const dy=3*u*u*(c[1][1]-c[0][1])+6*u*t*(c[2][1]-c[1][1])+3*t*t*(c[3][1]-c[2][1]);
 const len=Math.hypot(dx,dy);
 return {x,y,nx:-dy/len,ny:dx/len};
}
function recipe(){
 const layers=[];
 for(let segment=0;segment<bezier.length;segment++){
  for(let i=0;i<=40;i++){
   const p=interpolate(bezier[segment],i/40);
   for(const lane of [-1,0,1]){
    const wave=(segment*41+i)*1.731+lane*.618;
    const radius=5.1+(Math.sin(wave*2.3)+1)*.65;
    const shift=lane*8.2,px=Number((p.x+p.nx*shift).toFixed(3)),py=Number((p.y+p.ny*shift).toFixed(3));
    layers.push({id:'night-'+segment+'-'+i+'-'+(lane+1),plateId:'night-pass',
      geometry:{kind:'circle',x:px,y:py,radius:Number(radius.toFixed(3))},
      coverage:Number((.81+.13*(.5+.5*Math.sin(wave))).toFixed(4))});
    if(lane===1 && segment>0 && i%2===0){
      layers.push({id:'accent-'+segment+'-'+i,plateId:'coral-pass',
        geometry:{kind:'circle',x:Number((px+6).toFixed(3)),y:Number((py-2).toFixed(3)),radius:4.15},
        coverage:.72});
    }
   }
  }
 }
 // Nine discrete overprinted marks refer to the long Latvian vowel ā.
 for(let i=0;i<9;i++)
   layers.push({id:'macron-'+i,plateId:'coral-pass',
     geometry:{kind:'circle',x:181+10*i,y:30,radius:3.3},coverage:.85});
 return {
  version:1,
  canvas:{width:W,height:H,dpi:300,units:'px',
    trim:{x:0,y:0,width:W,height:H},bleed:{top:0,right:0,bottom:0,left:0}},
  substrate:{name:'Uncoated paper',color:'#faf8f1'},
  inks:[{id:'night',name:'Night blue',color:'#214b62'},{id:'coral',name:'Hot coral',color:'#e76350'}],
  plates:[
   {id:'night-pass',inkId:'night',role:'key',offset:{x:0,y:0},screen:{mode:'solid'}},
   {id:'coral-pass',inkId:'coral',role:'accent',offset:{x:0,y:0},screen:{mode:'solid'}}],
  layers,seeds:{geometry:142,screen:142,paper:142,debris:142},
  provenance:{adapter:'stipra-core-v1',source:'Original parametric dotted glyph from three cubic paths',
    notes:'Two independent spot plates in a reproducible vector scene; not an imported SVG or an AI-generated image.'}
 };
}
function render(){
 const scene=Core.resolveRecipe(recipe());
 return {composite:Core.renderSvg(scene),night:Core.renderSvg(scene,{plateId:'night-pass'}),
   coral:Core.renderSvg(scene,{plateId:'coral-pass'}),recipe:Core.canonicalRecipe(recipe())};
}
function write(dir=path.join(__dirname,'../assets')){
 const files=render();fs.mkdirSync(dir,{recursive:true});
 for(const [name,filename] of [['composite','stipra-inkmark.svg'],['night','stipra-inkmark-night.svg'],
  ['coral','stipra-inkmark-coral.svg'],['recipe','stipra-inkmark.recipe.json']])
  fs.writeFileSync(path.join(dir,filename),files[name]);
 return files;
}
if(require.main===module)write();
module.exports={recipe,render,write};
