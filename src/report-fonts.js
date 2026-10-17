'use strict';
const fs=require('node:fs'),{createFont}=require('fonteditor-core'),zlib=require('node:zlib');
function truetype(family,weight=400){
  const read=subset=>createFont(fs.readFileSync(require.resolve('@fontsource/'+family+'/files/'+family+'-'+subset+'-'+weight+'-normal.woff')),{type:'woff',inflate:bytes=>zlib.inflateSync(Buffer.from(bytes))});
  const base=read('latin'),extra=read('latin-ext').compound2simple();
  const supported=new Set(base.get().glyf.flatMap(g=>g.unicode||[]));
  extra.get().glyf=extra.get().glyf.filter(g=>g.unicode?.some(c=>!supported.has(c)));
  for(const g of extra.get().glyf)g.unicode=g.unicode.filter(c=>!supported.has(c));
  base.merge(extra,{scale:true});
  return Buffer.from(base.write({type:'ttf'}));
}
const license=()=>['sans','mono'].map(family=>'IBM Plex '+family+'\n'+
  fs.readFileSync(require.resolve('@fontsource/ibm-plex-'+family+'/LICENSE'),'utf8')).join('\n\n---\n\n');
module.exports={truetype,license};
