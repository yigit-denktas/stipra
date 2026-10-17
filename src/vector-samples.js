'use strict';
/** Converts sampled pixels to bounded SVG paths without embedding a bitmap or inventing curves. */
function svgSamples(rgba,width,height,{dpi=300,maxRuns=250000}={}){
  if(!(rgba instanceof Uint8Array)&&!(rgba instanceof Uint8ClampedArray))throw Error('SVG samples require owned 8-bit pixels');
  if(!Number.isSafeInteger(maxRuns)||maxRuns<1||maxRuns>250000)throw Error('SVG run budget must be 1..250000');
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>20000||height>20000||width*height>24000000||rgba.length!==width*height*4)throw Error('SVG sample dimensions exceed budget');
  if(!Number.isFinite(dpi)||dpi<=0)throw Error('SVG requires positive DPI');
  const groups=new Map();let runs=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;){
    const at=(y*width+x)*4,r=rgba[at],g=rgba[at+1],b=rgba[at+2],a=rgba[at+3];let end=x+1;
    while(end<width){const p=(y*width+end)*4;if(rgba[p]!==r||rgba[p+1]!==g||rgba[p+2]!==b||rgba[p+3]!==a)break;end++;}
    if(a){
      if(++runs>maxRuns)throw Error('SVG exceeds 250000 sampled runs; choose PNG or a smaller proof');
      const key=[r,g,b,a].join(','),items=groups.get(key)||[];items.push('M'+x+' '+y+'h'+(end-x)+'v1H'+x+'Z');groups.set(key,items);
    }
    x=end;
  }
  const paths=[...groups].map(([key,parts])=>{const [r,g,b,a]=key.split(',').map(Number);return '<path fill="rgb('+r+','+g+','+b+')"'+(a===255?'':' fill-opacity="'+(a/255).toFixed(8)+'"')+' d="'+parts.join('')+'"/>';}).join('');
  const text='<svg xmlns="http://www.w3.org/2000/svg" width="'+(width*25.4/dpi).toFixed(6)+'mm" height="'+(height*25.4/dpi).toFixed(6)+'mm" viewBox="0 0 '+width+' '+height+'" shape-rendering="crispEdges"><desc>Native sampled pixels represented as vector run paths. No analytic curve or halftone reconstruction. Uncalibrated.</desc>'+paths+'</svg>';
  if(text.length>16*1024*1024)throw Error('SVG exceeds 16 MiB text budget');
  return {text,runs,representation:'sampled-pixel-run-paths',embeddedRaster:false};
}
module.exports={svgSamples};
