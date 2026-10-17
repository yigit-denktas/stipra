/* Deterministic paper stocks for Stiprā proof and report presentation. MIT. */
'use strict';
const {Canvas}=require('skia-canvas');
const STOCKS={
  rag:{name:'Warm rag',hex:'#f5eee2'},
  chalk:{name:'Cool chalk',hex:'#edf1eb'},
  linen:{name:'Natural linen',hex:'#f1e7d5'},
  clay:{name:'Soft clay',hex:'#eee3d8'},
  rose:{name:'Rose pulp',hex:'#f5e3dc'},
  sage:{name:'Sage stock',hex:'#e7ebdc'},
  mist:{name:'Blue mist',hex:'#e5ebef'}
};
function select(rgba,recipe,requested='auto'){
  if(!['auto','recipe',...Object.keys(STOCKS)].includes(requested))
    throw Error('paper: expected auto, recipe, rag, chalk, linen, clay, rose, sage, mist');
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
function luminance(hex){
  const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function theme(stock,settings=[]){
  const inks=[...new Set(settings.map(s=>s.color?.toLowerCase()).filter(c=>/^#[0-9a-f]{6}$/.test(c)))];
  const contrast=hex=>{const a=luminance(hex),b=luminance(stock.hex);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
  const best=[...inks].sort((a,b)=>contrast(b)-contrast(a))[0];
  const fallback=['#000000','#ffffff'].sort((a,b)=>contrast(b)-contrast(a))[0];
  const key=best&&contrast(best)>=4.5?best:fallback;
  return {key,inks,paper:stock.hex,textContrast:Number(contrast(key).toFixed(3)),neutralFallback:key!==best};
}
function textureStyle(style='speckled'){
  if(!['none','fibre','speckled'].includes(style))throw Error('paper texture: expected none, fibre or speckled');
  return style;
}
async function tile(stock,seed=142,{width=448,height=448,inks=[],style='speckled'}={}){
  textureStyle(style);
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>8000000)throw Error('paper: invalid texture geometry');
  const c=new Canvas(width,height),ctx=c.getContext('2d');
  ctx.fillStyle=stock.hex;ctx.fillRect(0,0,width,height);
  let state=(seed^0x29bfe31d)>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const area=width*height;
  if(style!=='none'){
    const grain=ctx.getImageData(0,0,width,height),base=[1,3,5].map(i=>parseInt(stock.hex.slice(i,i+2),16));
    for(let i=0;i<Math.round(area*.06);i++){
      const x=Math.floor(rand()*width),y=Math.floor(rand()*height),k=4*(y*width+x);
      const delta=(rand()>.5?1:-1)*(2+Math.floor(rand()*10));
      for(let channel=0;channel<3;channel++)grain.data[k+channel]=Math.max(0,Math.min(255,base[channel]+delta));
    }
    ctx.putImageData(grain,0,0);
    for(let i=0;i<Math.round(area*.002);i++){
      const x=rand()*width,y=rand()*height;
      ctx.strokeStyle='rgba(62,56,42,'+(.02+rand()*.04)+')';
      ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*7-3.5,y+rand()*2-1);ctx.stroke();
    }
    const palette=[...new Set(inks.filter(c=>/^#[0-9a-f]{6}$/i.test(c)))];
    if(style==='speckled'&&palette.length){
      for(let i=0;i<Math.round(area*.0015);i++){
        ctx.fillStyle=palette[Math.floor(rand()*palette.length)];ctx.globalAlpha=.24+rand()*.30;
        const x=rand()*width,y=rand()*height,r=.45+rand()*1.25;
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  }
  return Buffer.from(await c.toBuffer('png'));
}
module.exports={STOCKS,select,tile,theme,textureStyle};
