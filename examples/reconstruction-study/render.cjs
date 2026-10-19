'use strict';
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../../src/import/node');
const Core=require('../../src/sdk');
const root=path.resolve(__dirname,'../../out/reconstruction-study');
function coverage(pixels){let sum=0;for(let i=0;i<pixels.length;i+=4)sum+=1-(pixels[i]+pixels[i+1]+pixels[i+2])/765;return sum/(pixels.length/4);}
async function raster(svg,width,height){const c=new Canvas(width,height),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,width,height);x.drawImage(await loadImage(Buffer.from(svg)),0,0,width,height);return {c,pixels:x.getImageData(0,0,width,height).data};}
function scaled(svg,factor){return svg.replace(/\b(r|stroke-width)="([\d.]+)"/g,(_,attr,n)=>attr+'="'+(Number(n)*factor).toFixed(5)+'"');}
async function run(){
 const generation=JSON.parse(fs.readFileSync(path.join(root,'generation.json'))),metrics=[];
 for(const fixture of generation.fixtures){
  const dir=path.join(root,fixture.id),source=await ingestLocalBytes(fs.readFileSync(path.join(dir,'source.png')));
  const {width,height}=source.metadata.oriented;
  for(const context of [false,true]){
   const start=performance.now();
   const result=context?Core.renderImage({width,height,rgba:source.rgba,colorSpace:'srgb'},{dpi:width/90*25.4,seed:109,inkRecipe:{version:1,mode:'spot',paper:context?'#fff8ec':'#ffffff',inks:context?[{id:'green',name:'Green darkness',color:'#006043',source:'darkness',gain:1,gamma:1},{id:'coral',name:'Coral magenta density',color:'#FF665D',source:'magenta-density',gain:.6,gamma:1}]:[{id:'key',name:'Single black darkness / solid reference',color:'#000000',source:'darkness',gain:1,gamma:1}]}}):Core.renderLayers({width,height,paper:'#ffffff',inks:[{id:'key',name:'Pillow L darkness / solid reference',color:'#000000',coverage:Uint8Array.from((await ingestLocalBytes(fs.readFileSync(path.join(dir,'source-luminance.png')))).rgba.filter((_,i)=>i%4===0).map(v=>255-v))}]},{dpi:width/90*25.4,seed:109});
   const c=new Canvas(width,height),x=c.getContext('2d'),pixels=x.createImageData(width,height);pixels.data.set(result.proof.rgba);x.putImageData(pixels,0,0);
   const prefix=context?'baseline-two-ink-context':'baseline';
   fs.writeFileSync(path.join(dir,prefix+'.png'),await c.toBuffer('png'));fs.writeFileSync(path.join(dir,prefix+'-recipe.json'),JSON.stringify(result.recipe,null,2)+'\n');
   if(!context)metrics.push({fixture:fixture.id,method:'baseline',coverage:coverage(pixels.data),renderMilliseconds:performance.now()-start,mode:'solid; one black darkness ink on white; continuous-tone context, not halftone'});
  }
  for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.svg'))){
   const start=performance.now(),original=fs.readFileSync(path.join(dir,f),'utf8'),normalize=!f.startsWith('04-');let factor=1,preview;
   if(normalize){let low=0,high=32;
    for(let iteration=0;iteration<18;iteration++){factor=(low+high)/2;preview=await raster(scaled(original,factor),width,height);if(coverage(preview.pixels)<fixture.targetDarkness)low=factor;else high=factor;}
   }
   const final=normalize?scaled(original,factor):original;preview=await raster(final,width,height);const measured=coverage(preview.pixels);
   if(normalize&&Math.abs(measured-fixture.targetDarkness)>.005)throw Error(f+' failed coverage normalization: '+measured);
   fs.writeFileSync(path.join(dir,f),final);fs.writeFileSync(path.join(dir,f.replace(/svg$/,'png')),await preview.c.toBuffer('png'));
   metrics.push({fixture:fixture.id,method:f.replace(/\.svg$/,''),coverage:measured,target:fixture.targetDarkness,coverageError:measured-fixture.targetDarkness,globalMarkScale:factor,normalization:normalize?'18-iteration bisection of circle radius / stroke width at final decoded resolution; overlap and clipping included':'no global normalization: input palette geometry evaluated separately',renderMilliseconds:performance.now()-start});
  }
 }
 fs.writeFileSync(path.join(root,'render-metrics.json'),JSON.stringify({node:process.version,skiaCanvas:JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('skia-canvas')),'../package.json'))).version,metrics},null,2)+'\n');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
