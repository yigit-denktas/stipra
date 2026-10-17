#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../src/import/node.js');
const Sep=require('../src/separation.js'),Screen=require('../src/screening.js'),Styles=require('../src/styles.js'),Diagnostics=require('../src/plate-diagnostics.js');
const fixtures=require('../tests/fixtures/owner-photo-fixtures.json').fixtures;
const ROOT=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function png(data,w,h){const c=new Canvas(w,h),ctx=c.getContext('2d'),im=ctx.createImageData(w,h);im.data.set(data);ctx.putImageData(im,0,0);return Buffer.from(await c.toBuffer('png'));}
async function run(argv){
  const opts={};for(let i=0;i<argv.length;i+=2){if(!['--sources','--out'].includes(argv[i])||!argv[i+1]||opts[argv[i]])throw Error('usage: --sources PRIVATE_ORIGINALS --out NEW_PRIVATE_DIRECTORY');opts[argv[i]]=path.resolve(argv[i+1]);}
  if(Object.keys(opts).length!==2)throw Error('sources and out required');
  const inside=p=>p===ROOT||p.startsWith(ROOT+path.sep);
  const sources=fs.realpathSync(opts['--sources']);
  if(inside(sources)||inside(path.join(fs.realpathSync(path.dirname(opts['--out'])),path.basename(opts['--out']))))throw Error('sources and photo-bearing outputs must remain outside repository');
  if(fs.existsSync(opts['--out']))throw Error('refusing to overwrite study');
  const inputs=[];
  for(const f of fixtures){const file=fs.realpathSync(path.join(sources,f.originalFile));if(inside(file))throw Error('source resolves inside repository');const bytes=fs.readFileSync(file);if(sha(bytes)!==f.sha256)throw Error('fixture fingerprint mismatch '+f.id);const asset=await ingestLocalBytes(bytes,f.originalFile);inputs.push({id:f.id,input:{width:asset.metadata.oriented.width,height:asset.metadata.oriented.height,rgba:asset.rgba},sourceSha256:f.sha256});}
  const fixture=new Canvas(720,480),ctx=fixture.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,720,480);ctx.fillStyle='black';ctx.font='32px sans-serif';ctx.fillText('Stipra line and type study',24,52);
  for(const [i,width] of [1,2,4,8].entries()){ctx.fillRect(24,100+i*50,640,width);ctx.font='18px sans-serif';ctx.fillText(width+' pixel line',24,132+i*50);}
  ctx.fillStyle='#d34e48';ctx.fillRect(24,340,180,100);ctx.fillStyle='#238baa';ctx.fillRect(230,340,180,100);ctx.fillStyle='#e2a523';ctx.fillRect(436,340,180,100);
  const bytes=Buffer.from(await fixture.toBuffer('png')),asset=await ingestLocalBytes(bytes,'authored-linework.png');inputs.push({id:'type',input:{width:720,height:480,rgba:asset.rgba},sourceSha256:sha(bytes)});
  fs.mkdirSync(opts['--out']);fs.writeFileSync(path.join(opts['--out'],'authored-linework.png'),bytes);const records=[];
  for(const item of inputs){
    const {width:w,height:h}=item.input,dpi=300,cases=Styles.list().flatMap(s=>['default',...Object.keys(Styles.explain(s.id).variants)].map(variant=>({id:s.id,variant})));
    fs.writeFileSync(path.join(opts['--out'],item.id+'-source.png'),await png(item.input.rgba,w,h));
    const thumbW=340,thumbH=Math.round(thumbW*h/w),sheet=new Canvas(3*(thumbW+16)+16,Math.ceil(cases.length/3)*(thumbH+55)+16),draw=sheet.getContext('2d');draw.fillStyle='#f5eee2';draw.fillRect(0,0,sheet.width,sheet.height);
    for(const [index,c] of cases.entries()){
      const style=Styles.resolve(c.id,{variant:c.variant,dpi,seed:42});
      const sep=Sep.separate(item.input,style.inkRecipe),screened=Screen.apply(sep,style.screenRecipe),proof=await png(screened.preview,w,h),name=item.id+'-'+c.id+'-'+c.variant;
      fs.writeFileSync(path.join(opts['--out'],name+'.png'),proof);
      for(const mask of screened.masks)fs.writeFileSync(path.join(opts['--out'],name+'-plate-'+mask.id+'.png'),await png(Sep.plateRGBA(mask.coverage),w,h));
      records.push({fixture:item.id,sourceSha256:item.sourceSha256,style,diagnostics:Diagnostics.inspect(screened,{dpi,input:item.input}),proofSha256:sha(proof),file:name+'.png'});
      const x=16+(index%3)*(thumbW+16),y=16+Math.floor(index/3)*(thumbH+55);draw.fillStyle='#20251f';draw.font='14px sans-serif';draw.fillText(c.id+' / '+c.variant,x,y+15);draw.drawImage(await loadImage(proof),x,y+25,thumbW,thumbH);
    }
    fs.writeFileSync(path.join(opts['--out'],item.id+'-styles.png'),Buffer.from(await sheet.toBuffer('png')));
  }
  fs.writeFileSync(path.join(opts['--out'],'manifest.json'),JSON.stringify({contract:'stipra-private-style-review-v1',dpi:300,records,environment:{node:process.version,skia:JSON.parse(fs.readFileSync(path.join(ROOT,'node_modules/skia-canvas/package.json'))).version},physicalPrintVerified:false,ownerApproved:false},null,2)+'\n');
  console.log(JSON.stringify({fixtures:inputs.map(i=>i.id),proofs:records.length,physicalPrintVerified:false}));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
