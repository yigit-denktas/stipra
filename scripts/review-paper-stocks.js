#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Canvas,loadImage}=require('skia-canvas');
const Paper=require('../src/report-paper.js');
async function run(out){
  if(!out)throw Error('provide a new output PNG path');
  if(fs.existsSync(out))throw Error('refusing overwrite');
  const columns=3,w=480,h=310,rows=Math.ceil(Object.keys(Paper.STOCKS).length/columns);
  const c=new Canvas(w*columns,h*rows+60),ctx=c.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.font='22px sans-serif';ctx.fillStyle='#20251f';ctx.fillText('stiprā / simulated paper stocks',20,36);
  for(const [i,[id,stock]] of Object.entries(Paper.STOCKS).entries()){
    const x=(i%columns)*w,y=Math.floor(i/columns)*h+60;
    const texture=await Paper.tile(stock,42,{width:w*2,height:h*2,inks:['#006043','#ff665d','#0d4dad'],style:'speckled'});
    const im=await loadImage(texture);ctx.drawImage(im,x+10,y+10,w-20,h-20);
    ctx.fillStyle='#20251f';ctx.font='22px sans-serif';ctx.fillText(stock.name,x+30,y+60);
    ctx.font='16px monospace';ctx.fillText(id+' / '+stock.hex,x+30,y+90);
    ctx.fillText('144 dpi / seed 42 / presentation only',x+30,y+125);
  }
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,Buffer.from(await c.toBuffer('png')));
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
