'use strict';
const V=require('./validation');
const MAX_REGIONS=64,MAX_REGION_BYTES=64*1024*1024;
/** Combines declared coverage regions into owned physical ink masks without screening them. */
function mapRegions(source,raw){
  V.object(source,['width','height','regions'],'source');V.dimensions(source.width,source.height);
  const n=source.width*source.height;
  if(!Array.isArray(source.regions)||!source.regions.length||source.regions.length>MAX_REGIONS||source.regions.length*n>MAX_REGION_BYTES)V.fail('provide 1..64 regions within the 64 MiB coverage budget');
  const regions=new Map(),descriptors=[];
  for(const region of source.regions){
    V.object(region,['id','name','role','coverage','provenance'],'region');V.id(region.id);V.text(region.name,'region name');
    if(region.role!=='coverage')V.fail('only explicit coverage regions are accepted; convert depth, IDs and normals separately','unsupported-region-role');
    if(regions.has(region.id))V.fail('duplicate region '+region.id);regions.set(region.id,V.bytes(region.coverage,n));
    descriptors.push({id:region.id,name:region.name,role:'coverage',provenance:V.provenance(region.provenance)});
  }
  V.object(raw,['version','paper','inks'],'mapping');if(raw.version!==1)V.fail('mapping version must be 1');
  if(!Array.isArray(raw.inks)||raw.inks.length<1||raw.inks.length>8)V.fail('map regions to one to eight physical inks');
  const ids=new Set(),paper=V.color(raw.paper),inks=[],recipeInks=[];
  for(const ink of raw.inks){
    V.object(ink,['id','name','color','combine','regions'],'mapping ink');V.id(ink.id);V.text(ink.name,'ink name');
    if(ids.has(ink.id))V.fail('duplicate ink '+ink.id);ids.add(ink.id);
    if(!['max','over'].includes(ink.combine))V.fail('choose max or over explicitly');
    if(!Array.isArray(ink.regions)||!ink.regions.length||ink.regions.length>MAX_REGIONS)V.fail('each ink needs an ordered region list');
    const used=new Set(),terms=ink.regions.map(term=>{
      V.object(term,['id','strength'],'region binding');V.id(term.id);
      if(!regions.has(term.id)||used.has(term.id))V.fail('unknown or repeated region binding '+term.id);used.add(term.id);
      const strength=term.strength??1;if(!Number.isFinite(strength)||strength<0||strength>1)V.fail('region strength must be 0..1');
      return {id:term.id,strength};
    });
    const coverage=new Uint8Array(n);
    for(let p=0;p<n;p++){
      let amount=0;for(const term of terms){const a=regions.get(term.id)[p]/255*term.strength;amount=ink.combine==='max'?Math.max(amount,a):a+amount*(1-a);}
      coverage[p]=Math.round(amount*255);
    }
    const identity={id:ink.id,name:ink.name,color:V.color(ink.color)};inks.push({...identity,coverage});recipeInks.push({...identity,combine:ink.combine,regions:terms});
  }
  return {contract:'stipra-region-result-v1',input:{width:source.width,height:source.height,paper,inks},
    recipe:{version:1,paper,inks:recipeInks},regions:descriptors,
    provenance:{status:'caller-declared; region meaning is not independently verified',sourceFrame:{width:source.width,height:source.height,origin:{x:0,y:0}}}};
}
/** Extracts coverage using explicit opacity or neutral grayscale polarity. */
function coverageFromRGBA(rgba,polarity){
  if(!ArrayBuffer.isView(rgba)||!['[object Uint8Array]','[object Uint8ClampedArray]'].includes(Object.prototype.toString.call(rgba))||rgba.length%4||Object.prototype.toString.call(rgba.buffer)!=='[object ArrayBuffer]')V.fail('RGBA must be a non-shared 8-bit array');
  if(!['alpha','dark-on-light','light-on-dark'].includes(polarity))V.fail('choose coverage polarity explicitly');
  const out=new Uint8Array(rgba.length/4);
  for(let p=0;p<out.length;p++){
    const q=p*4;if(polarity!=='alpha'&&rgba[q+3]&&(rgba[q]!==rgba[q+1]||rgba[q]!==rgba[q+2]))V.fail('visible grayscale coverage must be neutral');
    out[p]=polarity==='alpha'?rgba[q+3]:Math.round((polarity==='dark-on-light'?255-rgba[q]:rgba[q])*rgba[q+3]/255);
  }return out;
}
module.exports={mapRegions,coverageFromRGBA,MAX_REGIONS,MAX_REGION_BYTES};
