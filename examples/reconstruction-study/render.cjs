'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../../src/import/node');
const Core=require('../../src/sdk');
async function run(){
 const root=path.resolve(__dirname,'../../out/reconstruction-study');
 for(const name of ['portrait','architecture']){
  const dir=path.join(root,name),source=await ingestLocalBytes(fs.readFileSync(path.join(dir,'source.png')));
  const {width,height}=source.metadata.oriented;
  const result=Core.renderImage({width,height,rgba:source.rgba,colorSpace:'srgb'},{dpi:width/90*25.4,seed:109,
   inkRecipe:{version:1,mode:'spot',paper:'#fff8ec',inks:[{id:'green',name:'Green darkness',color:'#006043',source:'darkness',gain:1,gamma:1},{id:'coral',name:'Coral magenta density',color:'#FF665D',source:'magenta-density',gain:.6,gamma:1}]}});
  const c=new Canvas(width,height),ctx=c.getContext('2d'),pixels=ctx.createImageData(width,height);pixels.data.set(result.proof.rgba);ctx.putImageData(pixels,0,0);
  fs.writeFileSync(path.join(dir,'baseline.png'),await c.toBuffer('png'));
  fs.writeFileSync(path.join(dir,'baseline-recipe.json'),JSON.stringify(result.recipe,null,2)+'\n');
  for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.svg'))){
   const canvas=new Canvas(width,height),x=canvas.getContext('2d');x.fillStyle='#fff8ec';x.fillRect(0,0,width,height);x.drawImage(await loadImage(path.join(dir,f)),0,0,width,height);
   fs.writeFileSync(path.join(dir,f.replace(/svg$/,'png')),await canvas.toBuffer('png'));
  }
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
