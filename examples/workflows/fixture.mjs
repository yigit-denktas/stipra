export function artwork(width=49,height=33){
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=(y*width+x)*4,band=Math.floor(x*4/width),v=Math.floor(y*4/height)*64;
    const color=[[0,0,255],[255,0,0],[0,255,0],[255,255,0]][band];
    rgba.set(y<height/2?color:[v,v,v],p);rgba[p+3]=x<3?0:x<6?128:255;
    if(x>=10&&x<13&&y>=4&&y<height-4)rgba.set([0,0,0,255],p);
    if(y===height-3&&x>=8)rgba.set([0,0,0,255],p);
  }
  return {width,height,rgba,colorSpace:'srgb'};
}
export function recipe(count){
  return count===4?{version:1,mode:'cmyk',paper:'#f5eee2',inks:['cyan','magenta','yellow','black'].map((source,i)=>({id:source,name:source,color:['#006043','#FF665D','#E2A523','#0D4DAD'][i],source}))}:
    {version:1,mode:'spot',paper:'#f5eee2',inks:[{id:'key',name:'Green key',color:'#006043',source:'darkness'},{id:'warm',name:'Coral',color:'#FF665D',source:'red'},...(count===3?[{id:'blue',name:'Blue',color:'#0D4DAD',source:'blue'}]:[])]};
}
export const screen={version:1,seed:142,default:{mode:'dots',pitch:6,angle:25,jitter:.03,registration:{x:2,y:-1,rotate:0}}};
