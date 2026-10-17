#!/usr/bin/env node
/* Stiprā identity study: genuine shaped outlines, one accented macron, original dotmark.
 * The brand remains provisional. Paper Mono and IBM Plex fonts are hash-pinned
 * SIL OFL inputs used at build time; no binary font files are published.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),fontkit=require('@pdf-lib/fontkit');
const {prepare}=require('./cache-paper-mono.js');
const ROOT=path.resolve(__dirname,'..'),WORD='stiprā';
const CANDIDATES=[
  {id:'ibm-plex-sans-bold',label:'ibm plex sans / bold',fontKey:'plexBold'},
  {id:'paper-mono-regular',label:'paper mono / regular',fontKey:'regular'},
  {id:'paper-mono-semibold',label:'paper mono / semibold',fontKey:'semiBold'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function palette(){
  const original=fs.readFileSync(path.join(ROOT,'logo_for_Readme.svg'),'utf8');
  const fills=[...new Set([...original.matchAll(/<circle\b[^>]*\bfill="(#[a-f0-9]{6})"/gi)].map(x=>x[1].toLowerCase()))];
  for(const c of ['#006043','#ff665d','#0d4dad','#e2a523'])
    if(!fills.includes(c))throw Error('original dotmark missing official ink '+c);
  return {green:'#006043',coral:'#ff665d',blue:'#0d4dad',yellow:'#e2a523'};
}
function svgOutline(glyph){
  const raw=glyph.path.toSVG();
  if(/^<path\b/.test(raw))return raw.replace(/\sfill="[^"]*"/g,'');
  if(/^[Mm]/.test(raw))return '<path d="'+esc(raw)+'"/>';
  throw Error('unknown font outline data, glyph '+glyph.id);
}
function wordmark(buffer,mode,inks){
  if(!['black','macron'].includes(mode))throw Error('unsupported identity mode');
  const font=fontkit.create(buffer),layout=font.layout(WORD);
  if(layout.glyphs.length!==6||layout.glyphs.some(g=>!g.id)||
     !font.glyphForCodePoint(0x101)?.id)throw Error('font does not shape lowercase stiprā');
  const x=font.layout('x').glyphs[0];
  const xHeight=font.xHeight||x.bbox.maxY;
  if(!(xHeight>100))throw Error('cannot establish the font x-height');
  const targetXHeight=94,scale=targetXHeight/xHeight;
  const advance=layout.positions.reduce((n,p)=>n+p.xAdvance,0);
  const baseline=205,left=(1100-advance*scale)/2;
  if(left<10)throw Error('specimen width overflow; reduce x-height');
  const base=mode==='black'?'#242923':inks.green;
  const coral=inks.coral,groups=[];
  let pen=0;
  for(let i=0;i<layout.glyphs.length;i++){
    const g=layout.glyphs[i],position=layout.positions[i];
    const tx=left+(pen+position.xOffset)*scale,ty=baseline-position.yOffset*scale;
    const pathData=svgOutline(g);
    const start='<g transform="translate('+Number(tx.toFixed(5))+' '+Number(ty.toFixed(5))+') scale('+
      Number(scale.toFixed(8))+' -'+Number(scale.toFixed(8))+')">';
    groups.push(start+'<g fill="'+base+'">'+pathData+'</g>');
    if(mode==='macron'&&i===layout.glyphs.length-1){
      // Only the upper disconnected macron region prints in the second ink;
      // do NOT recolor the whole ā glyph as in the rejected study.
      const cutoff=Number((xHeight+font.unitsPerEm*.023).toFixed(4));
      const id='macron-'+i;
      groups.push('<defs><clipPath id="'+id+'" clipPathUnits="userSpaceOnUse">'+
        '<rect x="'+(-font.unitsPerEm)+'" y="'+cutoff+'" width="'+(font.unitsPerEm*3)+
        '" height="'+font.unitsPerEm+'"/></clipPath></defs>'+
        '<g clip-path="url(#'+id+')" fill="'+coral+'">'+pathData+'</g>');
    }
    groups.push('</g>');
    pen+=position.xAdvance;
  }
  return '<?xml version="1.0" encoding="utf-8"?>\n'+
    '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="280" viewBox="0 0 1100 280">'+
    '<title>stiprā / '+mode+' / real font outlines</title>\n'+groups.join('\n')+'</svg>\n';
}
async function generate(dest){
  const dir=path.resolve(dest),fonts=await prepare(),colors=palette();
  fs.mkdirSync(dir,{recursive:true});
  // Exact unchanged owner-supplied dotmark is used, not a recreation of its dots.
  fs.copyFileSync(path.join(ROOT,'logo_for_Readme.svg'),path.join(dir,'dotmark.svg'));
  const outputs=['dotmark.svg'];
  for(const candidate of CANDIDATES){
    const buf=fs.readFileSync(fonts[candidate.fontKey]);
    for(const mode of ['black','macron']){
      const filename=candidate.id+'-'+mode+'.svg';
      fs.writeFileSync(path.join(dir,filename),wordmark(buf,mode,colors));
      outputs.push(filename);
    }
  }
  const columns=CANDIDATES.map((c,i)=>'<section><div class="eyebrow">0'+(i+1)+' / '+esc(c.label)+'</div>'+
    '<figure><figcaption>solid / one-ink</figcaption><img class="large" src="'+c.id+'-black.svg" alt="'+c.label+' stiprā in monochrome"></figure>'+
    '<figure><figcaption>green word / coral macron only</figcaption><img class="large" src="'+c.id+'-macron.svg" alt="'+c.label+' with a single coral macron"></figure>'+
    '<div class="scale"><span>optical-size checks</span>'+
    [24,48,96].map(px=>'<div><img src="'+c.id+'-macron.svg" width="'+px+'" alt="stiprā at '+px+' pixels"><small>'+px+' px</small></div>').join('')+
    '</div><figure><figcaption>wordmark + original five-row dotmark</figcaption>'+
    '<img class="large" src="'+c.id+'-macron.svg" alt="stiprā"><img class="dots" src="dotmark.svg" alt="original stiprā stippling dots"></figure></section>').join('');
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>stiprā / wordmark study</title><style>*{box-sizing:border-box}body{background:#f5efe5;color:#242923;margin:0;font:14px ui-monospace,monospace}'+
    'main{max-width:1600px;margin:auto;padding:clamp(16px,3vw,48px)}header{border-bottom:2px solid;padding-bottom:20px;margin-bottom:20px}h1{font-size:24px;margin:0 0 9px}'+
    '.intro{max-width:780px;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:25px}'+
    'section{min-width:0;border-top:1px solid;padding-top:12px}figure{margin:15px 0 30px}figcaption,.eyebrow,small{font-size:11px}'+
    'figure img.large{width:100%;height:auto;display:block}.dots{width:100%;max-height:95px;object-fit:contain}.scale{border-top:1px solid #9a988f;padding-top:12px;display:flex;gap:15px;align-items:end;flex-wrap:wrap}.scale>div{display:grid;justify-items:start;gap:10px}'+
    'a{color:#006043}footer{border-top:1px solid;padding-top:13px;margin-top:38px;font-size:12px;line-height:1.7}'+
    '@media(max-width:900px){.grid{grid-template-columns:1fr}}'+
    '</style></head><body><main><header><h1>stiprā / identity in type</h1><p class="intro">'+
    'geometry before texture · one original dotmark · authentic ofl font outlines · no standalone s · no final selection</p></header>'+
    '<div class="grid">'+columns+'</div><footer>font family: ibm plex sans bold / paper mono regular / paper mono semibold'+
    ' · print in monochrome first · green #006043 · coral #ff665d · original dotmark preserved'+
    ' · read the <a href="https://github.com/yigit-denktas/stipra/blob/main/docs/BRAND-IDENTITY-STUDY-v2.md">evaluation protocol</a>'+
    '</footer></main></body></html>';
  fs.writeFileSync(path.join(dir,'index.html'),html);
  outputs.push('index.html');
  return {dir,files:outputs.map(name=>path.join(dir,name))};
}
if(require.main===module)generate(process.argv[2]||path.join(ROOT,'dist/stipra/identity'))
  .then(r=>process.stdout.write(JSON.stringify({dir:r.dir,files:r.files.length},null,2)+'\n'))
  .catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={generate,wordmark,palette,CANDIDATES};
