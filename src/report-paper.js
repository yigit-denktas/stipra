/* Deterministic paper stocks for Stiprā proof and report presentation. MIT. */
'use strict';
const {Canvas}=require('skia-canvas');
const STOCKS={
  rag:{name:'Warm rag',hex:'#f5eee2'},
  chalk:{name:'Cool chalk',hex:'#edf1eb'},
  linen:{name:'Natural linen',hex:'#f1e7d5'},
  clay:{name:'Soft clay',hex:'#eee3d8'}
};
function select(rgba,recipe,requested='auto'){
  if(!['auto','recipe',...Object.keys(STOCKS)].includes(requested))
    throw Error('paper: expected auto, recipe, rag, chalk, linen, clay');
  if(requested==='recipe')return {id:'recipe',name:'Recipe substrate',hex:recipe,reason:'explicit ink recipe'};
  if(requested!=='auto')return {id:requested,...STOCKS[requested],reason:'explicit print stock'};
  let red=0,green=0,blue=0,lum=0,n=0;
  const step=Math.max(1,Math.round(rgba.length/4/3000));
  for(let p=0;p<rgba.length/4;p+=step){
    const k=4*p;if(rgba[k+3]<128)continue;
    const [r,g,b]=[rgba[k],rgba[k+1],rgba[k+2]];
    red+=Math.max(0,r-(g+b)/2);green+=Math.max(0,g-(r+b)/2);
    blue+=Math.max(0,b-(r+g)/2);lum+=(r+g+b)/3;n++;
  }
  let id='rag',reason='balanced tones';
  if(n===0){reason='transparent art; neutral default';}
  else if(lum/n<75){id='chalk';reason='dark image balanced with light chalk';}
  else if(green>blue+8*n&&green>red+8*n){id='linen';reason='green-led photograph balanced with warm linen';}
  else if(red>green+8*n){id='chalk';reason='warm-led photograph balanced with cool chalk';}
  else if(lum/n>200){id='clay';reason='high-key image balanced with soft clay';}
  else if(blue>green+8*n){reason='blue-led image balanced with warm rag';}
  return {id,...STOCKS[id],reason};
}
async function tile(stock,seed=142){
  const size=448,c=new Canvas(size,size),ctx=c.getContext('2d'),c0=stock.hex;
  ctx.fillStyle=c0;ctx.fillRect(0,0,size,size);
  let state=(seed^0x29bfe31d)>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let i=0;i<12000;i++){
    const light=rand()>.5,opacity=light?.035+rand()*.065:.018+rand()*.04;
    ctx.fillStyle=light?'rgba(255,255,255,'+opacity+')':'rgba(62,56,42,'+opacity+')';
    const x=rand()*size,y=rand()*size,s=rand()>.90?1.3:.52;
    ctx.fillRect(x,y,s,s);
  }
  for(let i=0;i<430;i++){
    const x=rand()*size,y=rand()*size;
    ctx.strokeStyle='rgba(62,56,42,'+(.015+rand()*.02)+')';
    ctx.lineWidth=.3;ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+rand()*7-3.5,y+rand()*2-1);ctx.stroke();
  }
  return Buffer.from(await c.toBuffer('png'));
}
module.exports={STOCKS,select,tile};
