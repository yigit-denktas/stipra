'use strict';
const Sep=require('../separation.js'),Screen=require('../screening.js');
const Styles=require('../styles.js'),Diagnostics=require('../plate-diagnostics.js'),Plan=require('../export-plan.js');
/** The experimental package version; no registry release is implied. */
const VERSION=require('../../packages/core/package.json').version;
const CONTRACT='stipra-core-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=message=>{throw new TypeError('stipra: '+message);};
function object(value,keys,name){
  if(!value||typeof value!=='object'||Array.isArray(value))fail(name+' must be an object');
  for(const key of Object.keys(value))if(!keys.includes(key))fail(name+': unknown field '+key);
}
function dimensions(width,height){
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>20000||height>20000||width*height>24000000)
    fail('dimensions must be positive integers, at most 20000 per edge and 24 megapixels');
}
function bytes(value,length,clamped,name){
  const tag=Object.prototype.toString.call(value);
  if(!ArrayBuffer.isView(value)||!['[object Uint8Array]',...(clamped?['[object Uint8ClampedArray]']:[])].includes(tag)||
    Object.prototype.toString.call(value.buffer)!=='[object ArrayBuffer]'||value.length!==length)
    fail(name+' must be an exact-length 8-bit array backed by a non-shared ArrayBuffer');
  // A local view accepts iframe buffers without copying or transferring ownership.
  return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
}
function options(raw,keys){
  object(raw,keys,'options');
  const dpi=raw.dpi??300;Plan.validate(dpi,0);
  Diagnostics.options(raw.diagnostics??{});
  if(raw.seed!==undefined&&(!Number.isSafeInteger(raw.seed)||raw.seed<0||raw.seed>4294967295))fail('seed must be uint32');
  if(raw.seed!==undefined&&raw.screenRecipe?.seed!==undefined&&raw.seed!==raw.screenRecipe.seed)fail('seed conflicts with screenRecipe.seed');
  return dpi;
}
function screens(raw,seed){
  return {...(raw??{version:1}),...(seed===undefined?{}:{seed})};
}
function finish(input,base,{dpi,screenRecipe,style=null,kind,diagnostics}){
  const {width,height}=base,configs=Plan.screenConfigs(screenRecipe,base.masks.map(m=>m.id));
  const production=Screen.apply(base,configs.production);
  const shifted=Object.values(configs.proof.plates).some(x=>x.registration.x||x.registration.y||x.registration.rotate);
  const proof=shifted?Screen.apply(base,configs.proof):production;
  return {contract:CONTRACT,version:VERSION,inputKind:kind,
    geometry:Plan.printIntent(width,height,dpi,0),
    recipe:{version:1,kind,dpi,inks:clone(base.recipe),screens:clone(configs.production),
      proofScreens:clone(configs.proof),style:style?clone(style):null},
    plates:base.masks.map((m,i)=>({id:m.id,name:m.name,color:m.color,
      coverage:m.coverage.slice(),screened:production.masks[i].coverage.slice(),screen:clone(production.masks[i].screen)})),
    proof:{width,height,colorSpace:'srgb',alpha:'opaque',paper:base.recipe.paper,rgba:proof.preview.slice()},
    diagnostics:Diagnostics.inspect(production,{dpi,settings:diagnostics,...(input?{input}:{})}),
    warnings:[...(style?.warnings??[]),'Proof pixels include opaque paper; production plates contain ink coverage only.',
      'Digital overprint is an uncalibrated RGB approximation.']};
}
/**
 * Separates normalized sRGB pixels using shared Styles or an explicit ink recipe.
 * @param input - The full-frame, straight-alpha RGBA input, borrowed read-only during the call.
 * @param raw - The style or explicit recipes and physical output settings.
 * @returns The owned proof and independent continuous-tone and screened production masks.
 * @throws {Error} If input, recipe fields or settings are unsupported.
 */
function renderImage(input,raw={}){
  object(input,['width','height','rgba','colorSpace'],'input');dimensions(input.width,input.height);
  if(input.colorSpace!=='srgb')fail('input.colorSpace must explicitly be srgb; convert source pixels before rendering');
  const source={width:input.width,height:input.height,rgba:bytes(input.rgba,input.width*input.height*4,true,'rgba')};
  const dpi=options(raw,['style','inkRecipe','screenRecipe','dpi','seed','diagnostics']);
  let style=null,inkRecipe=raw.inkRecipe,screenRecipe=raw.screenRecipe;
  if(raw.style!==undefined){
    if(inkRecipe!==undefined||screenRecipe!==undefined)fail('choose style or explicit recipes, not both');
    object(raw.style,['id','variant','paper','strength','colors','lpi','screening'],'style');
    const {id,...settings}=raw.style;
    style=Styles.resolve(id,{...settings,dpi,...(raw.seed===undefined?{}:{seed:raw.seed})});
    inkRecipe=style.inkRecipe;screenRecipe=style.screenRecipe;
  }else if(inkRecipe===undefined)fail('provide a style or inkRecipe');
  const separated=Sep.separate(source,inkRecipe);
  return finish(source,separated,{dpi,kind:'image',style,screenRecipe:screens(screenRecipe,raw.seed),diagnostics:raw.diagnostics});
}
/**
 * Screens artist-authored coverage without reconstructing it from a composite.
 * @param input - The shared frame, paper and one to eight independently authored ink masks.
 * @param raw - The screen recipe, seed, DPI and diagnostic thresholds.
 * @returns The owned proof and production masks with the original ink assignments.
 * @throws {Error} If masks, dimensions, ink identities or settings are unsupported.
 */
function renderLayers(input,raw={}){
  object(input,['width','height','paper','inks'],'input');dimensions(input.width,input.height);
  const dpi=options(raw,['screenRecipe','dpi','seed','diagnostics']);
  if(typeof input.paper!=='string'||!/^#[0-9a-f]{6}$/i.test(input.paper))fail('paper must be #RRGGBB');
  if(!Array.isArray(input.inks)||input.inks.length<1||input.inks.length>8)fail('provide one to eight inks');
  const ids=new Set(),masks=input.inks.map(ink=>{
    object(ink,['id','name','color','coverage'],'ink');
    if(typeof ink.id!=='string'||!/^[a-z][a-z0-9_-]{0,63}$/.test(ink.id)||ids.has(ink.id))fail('ink ids must be unique lowercase identifiers');
    ids.add(ink.id);
    if(typeof ink.name!=='string'||!ink.name.trim()||ink.name.length>100)fail('ink name must be nonempty, at most 100 characters');
    if(typeof ink.color!=='string'||!/^#[0-9a-f]{6}$/i.test(ink.color))fail('ink color must be #RRGGBB');
    return {id:ink.id,name:ink.name.trim(),color:ink.color.toLowerCase(),
      coverage:bytes(ink.coverage,input.width*input.height,false,'coverage').slice()};
  });
  const recipe={version:1,mode:'authored',paper:input.paper.toLowerCase(),inks:masks.map(({coverage,...ink})=>ink)};
  return finish(null,{width:input.width,height:input.height,recipe,masks},
    {dpi,kind:'layers',screenRecipe:screens(raw.screenRecipe,raw.seed),diagnostics:raw.diagnostics});
}
/** Lists the shared style families and versioned variant identities. */
const listStyles=()=>Styles.list();
/** Resolves a shared style into explicit ink and physical screen recipes. */
const resolveStyle=(id,settings={})=>Styles.resolve(id,settings);
module.exports={VERSION,CONTRACT,renderImage,renderLayers,listStyles,resolveStyle};
