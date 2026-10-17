/* Stiprā Styles v1: one deterministic recipe resolver for browser and agent CLI.
 * Opinionated starting points, not a portrait detector or calibrated print profiles. MIT.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)
    module.exports=factory(require('./separation.js'),require('./screening.js'));
  else root.StipraStyles=factory(root.StipraSeparation,root.StipraScreen);
})(typeof globalThis!=='undefined'?globalThis:this,function(Sep,Screen){
  'use strict';
  if(!Sep?.validate||!Screen?.config)throw Error('Stiprā Styles requires the separation and screening engines');
  const CATALOG=[
    {id:'portrait-duotone',version:1,name:'Portrait Duotone',intent:'tonal portrait or object study',
      description:'A restrained dark key and warm highlight accent keep volumetric form more important than color matching.',
      goodFor:['portraits','high-contrast objects','soft tonal studies'],
      avoid:['small typography','hairline patterns prone to moiré','large black backgrounds without density review'],
      paper:'#f5eee2',lpi:42,
      inks:[
        {id:'key',name:'Deep blue key',color:'#24445d',source:'darkness',threshold:.03,gain:.77,gamma:1.08},
        {id:'warm',name:'Warm coral tone',color:'#e78268',source:'luminance',threshold:.13,gain:.39,gamma:2.15}],
      screen:{default:{mode:'dots',angle:23,jitter:0,dotScale:1},
        plates:{key:{mode:'hybrid',angle:42,solidThreshold:.82},warm:{angle:-18}}}},
    {id:'editorial-halftone',version:1,name:'Editorial Halftone',intent:'newspaper photo or editorial illustration',
      description:'One legible dark key and an intentionally subdued cool accent; suitable for compact editorial reproductions.',
      goodFor:['editorial photographs','documentary images','small monochrome-friendly illustrations'],
      avoid:['very thin text unless held in a separate key plate','vivid large-area color fidelity claims'],
      paper:'#f0e8d9',lpi:48,
      inks:[
        {id:'key',name:'Charcoal key',color:'#273138',source:'darkness',threshold:.05,gain:.86,gamma:1.05},
        {id:'accent',name:'Muted cyan accent',color:'#3286a0',source:'cyan',threshold:.06,gain:.38,gamma:1.3}],
      screen:{default:{mode:'dots',angle:18,jitter:0,dotScale:1},
        plates:{key:{mode:'hybrid',angle:35,solidThreshold:.83},accent:{angle:-27}}}},
    {id:'bold-spot-poster',version:1,name:'Bold Spot Poster',intent:'bold photographic poster or flat collage',
      description:'Three separated color families with high contrast and a real shadow key; preserves paper-colored whites.',
      goodFor:['flat collage','silhouettes','illustrated posters'],
      avoid:['smooth skies and delicate gradients','important hairline lettering','muddy all-ink overlap'],
      paper:'#f4eddf',lpi:28,
      inks:[
        {id:'blue',name:'Electric blue',color:'#257cba',source:'cyan',threshold:.18,gain:.95,gamma:.87},
        {id:'coral',name:'Vermilion',color:'#ec6648',source:'magenta',threshold:.15,gain:.81,gamma:.94},
        {id:'key',name:'Deep navy key',color:'#273147',source:'darkness',threshold:.14,gain:.58,gamma:1.22}],
      screen:{default:{mode:'dots',angle:22,jitter:.012,dotScale:1},
        plates:{blue:{angle:15},coral:{angle:-30},key:{mode:'hybrid',angle:48,solidThreshold:.78}}}},
    {id:'clean-linework',version:1,name:'Clean Linework',intent:'diagram, lettering or high-contrast technical drawing',
      description:'Hold a solid near-black key without simulated misregistration; reserve the second ink for controlled cool accents.',
      goodFor:['line art','diagrams','lettering with deliberate spot accents'],
      avoid:['smooth photographic gradients','fine strokes below the output resolution','automatic claims of OCR or vectorization'],
      paper:'#ffffff',lpi:55,
      inks:[
        {id:'key',name:'Dense charcoal line',color:'#252a2d',source:'darkness',threshold:.23,gain:1.08,gamma:.65},
        {id:'accent',name:'Pale blue accent',color:'#6399a3',source:'cyan',threshold:.16,gain:.24,gamma:1.35}],
      blackHold:{inkId:'key',threshold:.07},
      screen:{default:{mode:'solid',angle:0,jitter:0,dotScale:1},
        plates:{key:{mode:'solid'},accent:{mode:'dots',angle:45}}}}
  ];
  const byId=new Map(CATALOG.map(x=>[x.id,x]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const fail=msg=>{throw new TypeError('styles: '+msg);};
  function get(id){const style=byId.get(id);if(!style)fail('unknown style '+String(id));return style;}
  function list(){return CATALOG.map(x=>({id:x.id,name:x.name,version:x.version,intent:x.intent,
    description:x.description,goodFor:[...x.goodFor],avoid:[...x.avoid],lpi:x.lpi,
    inks:x.inks.map(y=>({id:y.id,name:y.name,color:y.color}))}));}
  function explain(id){return clone(get(id));}
  const number=(x,lo,hi,name)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail(name+' must be '+lo+'..'+hi);return x;};
  function resolve(id,options={}){
    if(!options||Array.isArray(options)||typeof options!=='object')fail('options expected an object');
    const allowed=['dpi','seed','paper','strength','colors'];
    for(const key of Object.keys(options))if(!allowed.includes(key))fail('unknown option '+key);
    const style=get(id),dpi=number(options.dpi??300,72,1200,'dpi');
    const seed=number(options.seed??142,0,4294967295,'seed');
    if(!Number.isSafeInteger(seed))fail('seed must be integer');
    const strength=number(options.strength??1,.1,2,'strength');
    const colors=options.colors??{};
    if(!colors||typeof colors!=='object'||Array.isArray(colors))fail('colors must be ink id to HEX map');
    for(const key of Object.keys(colors))if(!style.inks.some(ink=>ink.id===key))fail('unknown ink '+key);
    const inkRecipe=Sep.validate({version:1,mode:'spot',
      paper:options.paper??style.paper,
      inks:style.inks.map(ink=>({...ink,color:colors[ink.id]??ink.color,gain:Math.min(4,Number((ink.gain*strength).toFixed(5)))})),
      ...(style.blackHold?{blackHold:style.blackHold}:{})});
    const warnings=['Digital spot-color overprint is not spectrally calibrated; printing may differ.',
      'This is an experimental art-directed default. Check your actual plate detail and ink overlap before printing.'];
    // A halftone recipe is physically oriented: pitch is derived from output DPI.
    const nativePitch=dpi/style.lpi,clampedPitch=Math.min(128,Math.max(4,nativePitch));
    if(clampedPitch!==nativePitch)warnings.push('Requested LPI exceeds current raster screen pitch bounds at selected DPI; effective LPI differs.');
    const pitch=Number(clampedPitch.toFixed(5));
    const {default:main,plates}=style.screen;
    const screenRecipe=Screen.config({version:1,seed,default:{...main,pitch},
      plates:Object.fromEntries(Object.entries(plates).map(([plate,settings])=>[plate,{...settings,pitch}]))},
      inkRecipe.inks.map(ink=>ink.id));
    return {contract:'stipra-style-resolution-v1',
      style:{id:style.id,name:style.name,version:style.version,intent:style.intent,
        goodFor:[...style.goodFor],avoid:[...style.avoid],description:style.description},
      dpi,seed,targetLpi:style.lpi,effectiveLpi:Number((dpi/pitch).toFixed(5)),
      strength,inkRecipe,screenRecipe,warnings};
  }
  function suggest(options={}){
    const intent=options.intent??'unspecified';
    const groups={
      portrait:['portrait-duotone','editorial-halftone','clean-linework','bold-spot-poster'],
      editorial:['editorial-halftone','portrait-duotone','clean-linework','bold-spot-poster'],
      poster:['bold-spot-poster','editorial-halftone','portrait-duotone','clean-linework'],
      linework:['clean-linework','editorial-halftone','portrait-duotone','bold-spot-poster']
    };
    const ranked=groups[intent]??groups.editorial;
    const advisory=options.hasFineText===true?'Fine text requires special care: preserve a solid key plate and inspect at print size.':null;
    return ranked.map((id,rank)=>({id,rank:rank+1,reason:rank===0&&groups[intent]?
      'Matches the intent explicitly supplied by the user or agent.':'Alternative recipe; compare the same source image.',
      ...(advisory?{warning:advisory}:{})}));
  }
  return {VERSION:1,list,explain,resolve,suggest};
});
