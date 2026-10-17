// Original procedural artwork: tree silhouettes and a small geometric sign, no photograph.
export function forest(width=240,height=160){
  const names=['distant','foreground','lettering'],masks=names.map(()=>new Uint8Array(width*height));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=y/height,p=y*width+x;
    if(v>.36+.04*Math.sin(u*24))masks[0][p]=Math.round(45+95*v);
    for(let i=0;i<11;i++){
      const cx=.035+i*.095,bottom=.70+(i%3)*.06,half=.017+(i%2)*.007;
      const edge=Math.min(1,Math.max(0,(half-Math.abs(u-cx))*width));
      if(v>.08+(i%4)*.055&&v<bottom)masks[0][p]=Math.max(masks[0][p],Math.round(edge*(110+(i%3)*28)));
    }
    for(const [cx,half,top]of [[.12,.036,.14],[.83,.045,.04],[.59,.025,.22]]){
      if(v>top&&v<.98)masks[1][p]=Math.max(masks[1][p],Math.round(Math.min(1,Math.max(0,(half-Math.abs(u-cx))*width))*225));
    }
    if(v>.82+.025*Math.sin(u*30))masks[1][p]=Math.max(masks[1][p],100);
    if(u>.34&&u<.59&&v>.45&&v<.56){
      const bar=v<.47||v>.54||Math.abs(u-.36)<.009||Math.abs(u-.43)<.009||Math.abs(u-.50)<.009||Math.abs(u-.57)<.009;
      if(bar)masks[2][p]=255;
    }
  }
  return {width,height,regions:names.map((id,i)=>({id,name:['Distant trees','Foreground trunks','Display lettering'][i],role:'coverage',coverage:masks[i],provenance:{kind:'authored',producer:{name:'Stiprā procedural forest',version:'1'},parameters:{width,height}}}))};
}
export function mapping(count=3,combine='max'){
  return {version:1,paper:'#f5efdf',inks:[
    {id:'green',name:'Stiprā green',color:'#006043',combine,regions:[{id:'distant',strength:.65},...(count===2?[{id:'foreground',strength:.95}]:[])]},
    ...(count===3?[{id:'blue',name:'Stiprā blue',color:'#0d4dad',combine,regions:[{id:'foreground',strength:.9}]}]:[]),
    {id:'coral',name:'Stiprā coral',color:'#ff665d',combine:'max',regions:[{id:'lettering'}]}
  ]};
}
export const options={dpi:300,seed:42,screenRecipe:{version:1,seed:42,default:{mode:'dots',pitch:6,angle:22.5}}};
