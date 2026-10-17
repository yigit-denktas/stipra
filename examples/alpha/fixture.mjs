export const imageOptions={style:{id:'editorial-halftone',variant:'warm-third',lpi:40},dpi:300,seed:42};
export const layerOptions={dpi:300,seed:42,screenRecipe:{version:1,seed:42,default:{mode:'dots',pitch:7.5,angle:23,jitter:.1,registration:{x:2,y:-1}},plates:{lettering:{mode:'solid'}}}};
export function image(width=97,height=61){
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const q=(y*width+x)*4,u=x/width,v=y/height;
    const color=u<.13?[0,0,0,0]:u>.85?[255,255,255,128]:u>.5&&u<.65&&v>.4&&v<.65?[163,163,163,255]:v<.3?[Math.round(u*255),Math.round(v*255),180,255]:v>.7?[255,102,93,255]:[13,77,173,255];
    rgba.set(color,q);
  }
  return {width,height,rgba,colorSpace:'srgb'};
}
export function layers(width=97,height=61,count=3){
  const colors=['#006043','#ff665d','#0d4dad'],ids=['shape','counterform','lettering'];
  return {width,height,paper:'#f5eee2',inks:colors.slice(0,count).map((color,i)=>({id:ids[i],name:ids[i],color,
    coverage:Uint8Array.from({length:width*height},(_,p)=>{
      const x=p%width,y=Math.floor(p/width),u=x/width,v=y/height;
      return i===0?((u-.4)**2+(v-.45)**2<.12?Math.round(100+u*140):0):i===1?(u>.3&&u<.85&&v>.25&&v<.65?173:0):(y>height*.8&&y<height*.9&&x%11<5?255:0);
    })}))};
}
export const optionsFor=spec=>spec.kind==='image'?imageOptions:spec.inks===3?layerOptions:{...layerOptions,screenRecipe:{...layerOptions.screenRecipe,plates:{}}};
export const cases=[
  {id:'preview-256-2inks',width:256,height:192,kind:'layers',inks:2,density:1,repeats:5},
  {id:'preview-256-3inks',width:256,height:192,kind:'image',inks:3,density:1,repeats:5},
  {id:'density2-512-3inks',width:512,height:384,kind:'image',inks:3,density:2,repeats:5},
  {id:'final-1024-3inks',width:1024,height:768,kind:'image',inks:3,density:1,repeats:3},
  {id:'final-a4-2inks',width:2480,height:3508,kind:'layers',inks:2,density:1,repeats:1},
];
export const summary=samples=>({samplesMs:samples,minimumMs:Math.min(...samples),medianMs:[...samples].sort((a,b)=>a-b)[Math.floor(samples.length/2)],maximumMs:Math.max(...samples)});
export function ownedBytes(input,result){
  const buffers=new Set();
  function visit(v){if(ArrayBuffer.isView(v))buffers.add(v.buffer);else if(v&&typeof v==='object')for(const x of Object.values(v))visit(x);}
  visit(input);visit(result);return [...buffers].reduce((n,b)=>n+b.byteLength,0);
}
