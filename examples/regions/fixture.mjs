// Original procedural artwork: tree silhouettes and explicit bitmap lettering, no photograph.
export function forest(width=240,height=160){
  const names=['distant','foreground','lettering'],masks=names.map(()=>new Uint8Array(width*height));
  const lettering=['111010001010001','010011001010010','010010101010100','010010011011000','010010001010100','010010001010010','111010001010001'];
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
    if(u>=.34&&u<.62&&v>=.45&&v<.59){
      const col=Math.floor((u-.34)/.28*15),row=Math.floor((v-.45)/.14*7);
      if(lettering[row]?.[col]==='1')masks[2][p]=255;
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
export const options={dpi:300,seed:42,screenRecipe:{version:1,seed:42,default:{mode:'dots',pitch:6,angle:22.5},plates:{coral:{mode:'solid'}}}};
