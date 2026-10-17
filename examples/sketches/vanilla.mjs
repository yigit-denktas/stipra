import {renderCanvas,drawProof} from './assets/canvas.mjs';
import {show,imageArt} from './ui.mjs';
const source=document.createElement('canvas'),target=document.createElement('canvas');
source.width=target.width=288;source.height=target.height=216;
document.querySelector('#proof').append(target);let frame=0;
function draw(){
  imageArt(source.getContext('2d'),288,216,frame);
  const rendered=renderCanvas(source,{style:{id:'portrait-duotone',variant:'blue-pink',lpi:40},dpi:300,seed:42});
  target.getContext('2d').clearRect(0,0,target.width,target.height);drawProof(rendered,target);show(rendered,source,frame);
}
document.querySelector('#next').onclick=()=>{frame++;draw();};draw();
