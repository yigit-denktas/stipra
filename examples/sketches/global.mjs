import {renderCanvas,drawProof} from './assets/canvas.mjs';
import {show,imageArt} from './ui.mjs';
let art,main,frame=0;
window.setup=()=>{
  pixelDensity(2);main=createCanvas(288,216);main.parent('proof');art=createGraphics(288,216);art.pixelDensity(2);noLoop();
  document.querySelector('#next').onclick=()=>{frame++;redraw();};
};
window.draw=()=>{
  const ctx=art.drawingContext;ctx.save();ctx.setTransform(2,0,0,2,0,0);imageArt(ctx,288,216,frame);ctx.restore();
  const rendered=renderCanvas(art,{style:{id:'portrait-duotone',variant:'blue-pink',lpi:40},dpi:600,seed:42});
  clear();drawProof(rendered,main);show(rendered,art.canvas,frame);
};
