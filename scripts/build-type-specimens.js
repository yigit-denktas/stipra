#!/usr/bin/env node
/* Genuine type outlines + corresponding A4 PDF specimens: no AI images, no font substitution.
 * Built only with verified Paper Mono v1.000 OFL fonts and IBM Plex OFL dependencies.
 * Neither font files nor owner photographs are included in public artifacts.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),fontkit=require('@pdf-lib/fontkit');
const zlib=require('node:zlib'),{createFont}=require('fonteditor-core');
const {Canvas}=require('skia-canvas');
const {prepare}=require('./cache-paper-mono.js');
const Report=require('../src/report-layout.js');
const OUT='typography';
const W=1200,H=420,WORD='stiprā';
const FONTLABELS={'ibm-plex':'ibm plex','paper-mono':'paper mono'};
const MAIN='#222825',ACCENT='#e7604c',PAPER='#f4eddf';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function plexFont(){
  const data=fs.readFileSync(require.resolve('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff'));
  return Buffer.from(createFont(data,{type:'woff',inflate:b=>zlib.inflateSync(Buffer.from(b))}).write({type:'ttf'}));
}
function actualSvgPath(glyph){
  const part=glyph.path.toSVG();
  // fontkit path.toSVG() returns either serialized SVG path markup or path commands.
  if(/^<path\b/.test(part))return part.replace(/<path\b/,'<path').replace(/fill="[^"]*"/g,'');
  if(/^[Mm]/.test(part))return '<path d="'+escape(part)+'"/>';
  throw Error('cannot render authentic glyph outline for '+glyph.id);
}
function wordmarkSvg(buffer,{accent=false}={}){
  const font=fontkit.create(buffer);
  if(!font.glyphForCodePoint(0x101)?.id)throw Error('font does not contain the ā glyph');
  const layout=font.layout(WORD),sum=layout.positions.reduce((n,p)=>n+p.xAdvance,0);
  if(layout.glyphs.length!==6||sum<=0)throw Error('wrong font layout for lowercase stiprā');
  const scale=Math.min((W-90)/sum,0.31),visible=[];
  let x=0;
  for(let i=0;i<layout.glyphs.length;i++){
    const glyph=layout.glyphs[i],pos=layout.positions[i];
    visible.push('<g transform="translate('+Number((62+(x+pos.xOffset)*scale).toFixed(5))+' '+Number((300-pos.yOffset*scale).toFixed(5))+') scale('+Number(scale.toFixed(8))+' -'+Number(scale.toFixed(8))+')" fill="'+(accent&&i===5?ACCENT:MAIN)+'">'+actualSvgPath(glyph)+'</g>');
    x+=pos.xAdvance;
  }
  return '<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">\n'+
    '<rect width="'+W+'" height="'+H+'" fill="'+PAPER+'"/>\n'+visible.join('\n')+'\n</svg>\n';
}
function makeSource(){
  const w=800,h=500,c=new Canvas(w,h),ctx=c.getContext('2d');
  ctx.fillStyle='#f4eddf';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#217b91';ctx.fillRect(100,75,600,320);
  ctx.fillStyle='#e7604c';ctx.beginPath();ctx.arc(390,250,180,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#232b37';ctx.beginPath();ctx.moveTo(160,430);ctx.lineTo(600,110);ctx.lineTo(590,430);ctx.closePath();ctx.fill();
  const proof=Buffer.from(c.toBufferSync('png'));
  const p=new Canvas(w,h),g=p.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,w,h);
  g.fillStyle='#202020';g.beginPath();g.arc(390,250,180,0,Math.PI*2);g.fill();
  const plate=Buffer.from(p.toBufferSync('png'));
  return {w,h,proof,plate};
}
async function generate(outRoot){
  const fonts=await prepare();
  const dir=path.resolve(outRoot,OUT);fs.mkdirSync(dir,{recursive:true});
  const sample=makeSource(),outputs=[];
  for(const id of ['ibm-plex','paper-mono']){
    const font=id==='ibm-plex'?plexFont():fs.readFileSync(fonts.extraBold);
    for(const mode of ['plain','two-ink']){
      const filename=id+'-'+mode+'.svg',data=wordmarkSvg(font,{accent:mode==='two-ink'});
      fs.writeFileSync(path.join(dir,filename),data);outputs.push(filename);
    }
    const cards=[
      {name:'original',bytes:sample.proof},
      {name:'digital overprint',bytes:sample.proof},
      {name:'paper / substrate',bytes:sample.proof,note:'not an ink'},
      {name:'teal ink',bytes:sample.plate,ink:'#217b91',note:'grayscale pass'},
      {name:'vermilion ink',bytes:sample.plate,ink:ACCENT,note:'grayscale pass'}
    ];
    const pdf=await Report.pdfReport(cards,{
      name:'geometry and overprint',width:sample.w,height:sample.h,dpi:300,
      orientation:'landscape',trim:{width:67.73,height:42.33},
      paper:{name:'warm rag',hex:PAPER},seed:142,
      sha:'9d'.repeat(32),settings:[
        {name:'teal ink',source:'cyan',color:'#217b91',mode:'dots',pitch:7.2,angle:35,coverage:.34},
        {name:'vermilion ink',source:'magenta',color:ACCENT,mode:'dots',pitch:7.2,angle:-35,coverage:.28}
      ],inkRecipe:{version:1,mode:'spot',paper:PAPER},
      screenRecipe:{version:1,seed:142},proofRecipe:{version:1,seed:142},
      typography:{id,lowercase:true,...(id==='paper-mono'?{fontRegular:fonts.regular,fontBold:fonts.extraBold}:{})}
    });
    const pdfname=id+'-print-study.pdf';fs.writeFileSync(path.join(dir,pdfname),pdf);
    outputs.push(pdfname);
  }
  const options=['ibm-plex','paper-mono'].map(id=>'<section><h2>'+FONTLABELS[id]+'</h2>'+
    '<p>plain wordmark</p><img alt="'+id+' plain lowercase stiprā" src="./'+id+'-plain.svg">'+
    '<p>two-ink wordmark</p><img alt="'+id+' two-ink lowercase stiprā" src="./'+id+'-two-ink.svg">'+
    '<p><a href="./'+id+'-print-study.pdf">open a4 print specimen · pdf</a></p></section>').join('\n');
  const page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>stiprā / type study</title><style>*{box-sizing:border-box}body{margin:0;background:#f4eddf;color:#222825;font:16px ui-monospace,monospace}'+
    'main{max-width:1500px;padding:38px;margin:auto}header{border-bottom:2px solid #222825;padding-bottom:16px}h1{font-size:22px;font-weight:600;margin:0}'+
    '.compare{display:grid;grid-template-columns:1fr 1fr;gap:42px}section{min-width:0}section+section{border-left:1px solid #908f89;padding-left:42px}h2{font-size:17px}'+
    'p{font-size:12px}img{display:block;width:100%;height:auto}a{color:#156879}footer{margin-top:42px;border-top:1px solid #222825;padding-top:16px;font-size:12px}'+
    '@media(max-width:720px){.compare{grid-template-columns:1fr}section+section{border:0;padding:0}}'+
    '</style></head><body><main><header><h1>stiprā / a typographic study</h1><p>genuine type outlines · same artwork and layout · lowercase only</p></header>'+
    '<div class="compare">'+options+'</div><footer>paper mono v1.000 and ibm plex · sil open font license 1.1 · art direction pending owner review · the original logo has not been replaced</footer></main></body></html>';
  fs.writeFileSync(path.join(dir,'index.html'),page);
  outputs.push('index.html');
  return {dir,files:outputs.map(file=>path.join(dir,file))};
}
if(require.main===module)generate(process.argv[2]||path.resolve(__dirname,'../dist/stipra'))
  .then(x=>process.stdout.write(JSON.stringify({dir:x.dir,outputs:x.files.length},null,2)+'\n'))
  .catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={generate,wordmarkSvg};
