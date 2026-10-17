#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas,loadImage}=require('skia-canvas');
const {ingestLocalBytes}=require('../src/import/node.js');
const Styles=require('../src/styles.js'),Sep=require('../src/separation.js'),Screen=require('../src/screening.js'),D=require('../src/plate-diagnostics.js');
const fixtures=require('../tests/fixtures/owner-photo-fixtures.json').fixtures;
const ROOT=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function png(data,w,h){const c=new Canvas(w,h),ctx=c.getContext('2d'),i=ctx.createImageData(w,h);i.data.set(data);ctx.putImageData(i,0,0);return Buffer.from(await c.toBuffer('png'));}
async function run(argv){
  const opts={};for(let i=0;i<argv.length;i+=2){if(!['--sources','--out'].includes(argv[i])||!argv[i+1]||opts[argv[i]])throw Error('usage: --sources PRIVATE_ORIGINALS --out NEW_PRIVATE_DIRECTORY');opts[argv[i]]=path.resolve(argv[i+1]);}
  if(Object.keys(opts).length!==2)throw Error('sources and out required');
  const inside=p=>p===ROOT||p.startsWith(ROOT+path.sep),sources=fs.realpathSync(opts['--sources']);
  if(inside(sources)||inside(path.join(fs.realpathSync(path.dirname(opts['--out'])),path.basename(opts['--out']))))throw Error('keep private sources and outputs outside repository');
  if(fs.existsSync(opts['--out']))throw Error('refusing to overwrite study');
  const inputs=[];
  for(const f of fixtures){const file=fs.realpathSync(path.join(sources,f.originalFile));if(inside(file))throw Error('source resolves inside repository');const bytes=fs.readFileSync(file);if(hash(bytes)!==f.sha256)throw Error('source fingerprint mismatch '+f.id);const a=await ingestLocalBytes(bytes,f.originalFile);inputs.push({fixture:f,input:{width:a.metadata.oriented.width,height:a.metadata.oriented.height,rgba:a.rgba},metadata:a.metadata});}
  fs.mkdirSync(opts['--out']);const manifest={contract:'stipra-separation-quality-study-v1',dpi:300,physicalPrintVerified:false,ownerApproved:false,environment:{node:process.version,platform:process.platform},records:[],detailRegions:{
    B:[{id:'foliage',x:650,y:50,width:600,height:450},{id:'stumps',x:1100,y:650,width:550,height:600},{id:'display',x:730,y:250,width:550,height:400},{id:'antlers',x:290,y:850,width:400,height:400}],
    C:[{id:'sky',x:80,y:100,width:900,height:500},{id:'horizon',x:80,y:980,width:900,height:350},{id:'figures',x:530,y:1280,width:330,height:350}],
    A:[{id:'ridges',x:180,y:100,width:450,height:450}]}};
  for(const item of inputs){
    const {fixture:f,input,metadata}=item,{width:w,height:h}=input;
    const variants=f.id==='C'?['tonal-key','coast-duotone']:['tonal-key','forest-depth'];
    const cases=[{name:'source',bytes:await png(input.rgba,w,h)}];
    for(const variant of variants){
      const style=Styles.resolve('editorial-halftone',{variant,dpi:300,seed:42});
      const sep=Sep.separate(input,style.inkRecipe),screened=Screen.apply(sep,style.screenRecipe),name=f.id+'-'+variant;
      const bytes=await png(screened.preview,w,h);cases.push({name:variant,bytes});
      const record={fixture:f.id,sourceSha256:f.sha256,sourceMetadata:metadata,width:w,height:h,widthMm:w*25.4/300,heightMm:h*25.4/300,style,diagnostics:D.inspect(screened,{dpi:300,input}),proofFile:name+'.png',proofSha256:hash(bytes),plateFiles:[]};
      fs.writeFileSync(path.join(opts['--out'],name+'.png'),bytes);
      for(const m of screened.masks){const file=name+'-plate-'+m.id+'.png',plate=await png(Sep.plateRGBA(m.coverage),w,h);fs.writeFileSync(path.join(opts['--out'],file),plate);record.plateFiles.push({id:m.id,file,sha256:hash(plate)});}
      fs.writeFileSync(path.join(opts['--out'],name+'.json'),JSON.stringify(record,null,2)+'\n');manifest.records.push(record);
    }
    const tw=f.id==='C'?340:570,th=Math.round(tw*h/w),sheet=new Canvas(3*(tw+16)+16,th+80),ctx=sheet.getContext('2d');ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='18px sans-serif';ctx.fillStyle='#20251f';
    for(const [i,c] of cases.entries()){const x=16+i*(tw+16);ctx.fillText(c.name,x,28);ctx.drawImage(await loadImage(c.bytes),x,42,tw,th);}
    fs.writeFileSync(path.join(opts['--out'],f.id+'-comparison.png'),Buffer.from(await sheet.toBuffer('png')));
    for(const region of manifest.detailRegions[f.id]){
      const sheet=new Canvas(3*(region.width+16)+16,region.height+65),ctx=sheet.getContext('2d');ctx.fillStyle='#f5eee2';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='16px sans-serif';ctx.fillStyle='#20251f';
      for(const [i,c] of cases.entries()){const x=16+i*(region.width+16);ctx.fillText(c.name+' / native pixels',x,25);ctx.drawImage(await loadImage(c.bytes),region.x,region.y,region.width,region.height,x,40,region.width,region.height);}
      fs.writeFileSync(path.join(opts['--out'],f.id+'-detail-'+region.id+'.png'),Buffer.from(await sheet.toBuffer('png')));
    }
  }
  fs.writeFileSync(path.join(opts['--out'],'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest.records.map(r=>({fixture:r.fixture,variant:r.style.style.variant,coverage:r.diagnostics.plates.map(p=>({id:p.id,mean:p.meanCoverage})),overlap:r.diagnostics.overall.overlapTwoPlusFraction}))));
}
if(require.main===module)run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={run};
