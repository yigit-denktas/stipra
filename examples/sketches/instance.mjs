import {renderCanvasLayers,drawProof} from './assets/canvas.mjs';
import {show} from './ui.mjs';
new p5(p=>{
  let layers,main,frame=0;
  p.setup=()=>{
    p.pixelDensity(1);main=p.createCanvas(288,216);main.parent('proof');
    layers=Array.from({length:3},()=>p.createGraphics(288,216));p.noLoop();
    document.querySelector('#next').onclick=()=>{frame++;p.redraw();};
  };
  p.draw=()=>{
    for(const layer of layers){layer.clear();layer.noStroke();layer.fill(0);}
    layers[0].ellipse(112+frame%6*3,103,146,152);
    layers[1].rect(86,65,151,101);
    layers[2].textSize(31);layers[2].textStyle(p.BOLD);layers[2].text('stiprā',89,192);
    const colors=['#006043','#FF665D','#0D4DAD'],names=['Green shape','Coral counterform','Blue solid lettering'];
    const rendered=renderCanvasLayers({paper:'#f5eee2',inks:layers.map((source,i)=>({id:'ink-'+i,name:names[i],color:colors[i],source,polarity:'alpha'}))},
      {dpi:300,seed:42,screenRecipe:{version:1,seed:42,default:{mode:'dots',pitch:6,angle:23},plates:{'ink-2':{mode:'solid'}}}});
    p.clear();drawProof(rendered,main);
    const composite=document.createElement('canvas');composite.width=288;composite.height=216;
    for(const layer of layers)composite.getContext('2d').drawImage(layer.canvas,0,0);
    show(rendered,composite,frame);
  };
});
