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
  const EDITORIAL_VARIANTS={
    'tonal-key':{version:1,name:'Tonal key / two inks',
      description:'A continuous-tone green key carries structure; yellow adds a screened chromatic pass without filling neutral shadows.',
      goodFor:['documentary landscapes','textured objects with a usable RGB shadow range'],
      avoid:['neutral color reproduction','fine pale details without a print-size review'],
      paper:'#f5eee2',lpi:50,
      inks:[{id:'key',name:'Green tonal key',color:'#006043',source:'black',gain:1.15,gamma:1.1},
        {id:'accent',name:'Golden yellow',color:'#e2a523',source:'yellow',gain:.45,gamma:1.15}],
      screen:{default:{mode:'dots',angle:22,jitter:0,dotScale:1},plates:{key:{mode:'solid'},accent:{angle:-15}}}},
    'warm-third':{version:1,name:'Tonal key / selective third ink',
      description:'The same green key and yellow pass, plus a localized neutral-material mask tinted coral. Compare with two inks before accepting the extra pass.',
      goodFor:['neutral bark or stone amid saturated vegetation','editorial scenes with localized warm material'],
      avoid:['scenes without neutral material','skin-tone fidelity','assuming a third ink automatically adds depth'],
      paper:'#f5eee2',lpi:50,
      inks:[{id:'key',name:'Green tonal key',color:'#006043',source:'black',gain:1.15,gamma:1.1},
        {id:'accent',name:'Golden yellow',color:'#e2a523',source:'yellow',gain:.45,gamma:1.15},
        {id:'warm',name:'Coral neutral-material accent',color:'#ff665d',source:'match',target:'#a3a3a3',tolerance:.14,threshold:.3,gain:.5,gamma:1.4}],
      screen:{default:{mode:'dots',angle:22,jitter:0,dotScale:1},plates:{key:{mode:'solid'},accent:{angle:-15},warm:{angle:45}}}}
  };
  const REFERENCES={
    'dizzy-profiles':{title:'Dizzy Ink / Risograph profiles',url:'https://risograph.co.uk/04-risograph-profiles'},
    'exploriso-channels':{title:'Exploriso / Ad hoc separation of colour channels',url:'https://en.exploriso.info/exploriso/colour/separations/ad-hoc-separation-of-colour-channels/'},
    'exploriso-gcr':{title:'Exploriso / Custom CMYK and GCR',url:'https://en.exploriso.info/exploriso/colour/separations/convert-via-custom-cmyk-and-gcr/'},
    'ambi-process':{title:'Ambipress / CMYK simulation and ink swatches',url:'https://www.ambi-press.com/guia/'}
  };
  const VARIANTS={
    'portrait-duotone':{
      'blue-pink':{version:1,name:'Blue / fluorescent pink',references:['dizzy-profiles','exploriso-channels','ambi-process'],
        description:'Complementary channel duotone: blue carries red-channel density; pink carries green-channel density. Independent gray removal reduces neutral overlap.',
        goodFor:['photographic duotones','cool scenes with warm accents'],avoid:['accurate skin reproduction','fluorescent ink prediction','neutral shadows without overlap review'],paper:'#fffaf0',lpi:45,
        inks:[{id:'blue',name:'Blue / screen approximation',color:'#0078bf',source:'cyan-density',grayRemoval:.15,gain:.9,gamma:1},
          {id:'pink',name:'Fluorescent pink / screen approximation',color:'#ff48b0',source:'magenta-density',grayRemoval:.65,gain:.75,gamma:1.1}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{blue:{angle:15},pink:{angle:75}}}},
      'teal-orange':{version:1,name:'Teal / orange',references:['dizzy-profiles','exploriso-channels','ambi-process'],
        description:'Cool red-channel density against warm blue-channel density. A two-channel interpretation of the published teal/orange pairing, not an imported ICC profile.',
        goodFor:['warm/cool landscapes','two-pass photographic posters'],avoid:['neutral color fidelity','assuming preview colors match physical inks'],paper:'#fffaf0',lpi:45,
        inks:[{id:'teal',name:'Light teal / screen approximation',color:'#009da5',source:'cyan-density',grayRemoval:.15,gain:.95,gamma:1},
          {id:'orange',name:'Fluorescent orange / screen approximation',color:'#ff7477',source:'yellow-density',grayRemoval:.6,gain:.75,gamma:1.1}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{teal:{angle:15},orange:{angle:75}}}}
    },
    'editorial-halftone':{...EDITORIAL_VARIANTS,
      'forest-depth':{version:1,name:'Open shadows / two inks',references:['exploriso-gcr'],
        description:'An unclipped photographic green key opens dark texture; a gray-removed yellow pass colors foliage without filling neutral bark. Compare with the earlier tonal key.',
        goodFor:['dense documentary landscapes','textured objects with dark backgrounds'],avoid:['neutral color fidelity','assuming lower coverage alone proves depth'],paper:'#f5eee2',lpi:50,
        inks:[{id:'key',name:'Green photographic key',color:'#006043',source:'tone',gain:.92,gamma:1.05},
          {id:'accent',name:'Golden yellow chroma',color:'#e2a523',source:'yellow-density',grayRemoval:1,gain:.65,gamma:1.05}],
        screen:{default:{mode:'dots',angle:22,jitter:0,dotScale:1},plates:{key:{mode:'solid'},accent:{angle:-15}}}},
      'forest-contrast':{version:1,name:'Anchored shadows / two inks',references:['exploriso-gcr'],
        description:'The photographic green key reaches deeper shadows while opening middle tones; the same yellow chroma pass preserves the earlier two-ink material separation. Compare dark texture at native and physical size.',
        goodFor:['dark documentary landscapes needing a stronger background anchor','textured neutral objects amid foliage'],avoid:['assuming stronger contrast preserves every shadow detail','neutral color fidelity'],paper:'#f5eee2',lpi:50,
        inks:[{id:'key',name:'Green contrast key',color:'#006043',source:'tone',gain:1.1,gamma:1.3},
          {id:'accent',name:'Golden yellow chroma',color:'#e2a523',source:'yellow-density',grayRemoval:1,gain:.65,gamma:1.05}],
        screen:{default:{mode:'dots',angle:22,jitter:0,dotScale:1},plates:{key:{mode:'solid'},accent:{angle:-15}}}},
      'forest-balanced':{version:1,name:'Detailed shadows / two inks',references:['exploriso-gcr'],
        description:'A unit-gain photographic green key anchors deep shadows without the broad gain clipping of forest-contrast. The yellow chroma pass is unchanged; inspect the remaining quantization and foliage detail.',
        goodFor:['dense landscapes with useful shadow gradation','light neutral objects against dark foliage'],avoid:['neutral color fidelity','assuming unclipped masks recover detail absent from the source'],paper:'#f5eee2',lpi:50,
        inks:[{id:'key',name:'Green detailed-shadow key',color:'#006043',source:'tone',gain:1,gamma:1.3},
          {id:'accent',name:'Golden yellow chroma',color:'#e2a523',source:'yellow-density',grayRemoval:1,gain:.65,gamma:1.05}],
        screen:{default:{mode:'dots',angle:22,jitter:0,dotScale:1},plates:{key:{mode:'solid'},accent:{angle:-15}}}},
      'coast-tonal':{version:1,name:'Cool tonal detail / two inks',references:['dizzy-profiles','exploriso-gcr'],
        description:'A photographic blue key separates dark marks from saturated blue water more clearly than red-channel density alone. The coral pass is unchanged; expect a paler sky than coast-duotone.',
        goodFor:['cool landscapes with small dark silhouettes','blue water and tonal detail'],avoid:['exact color reproduction','expecting automatic figure detection or preservation at any print size'],paper:'#faf8f2',lpi:50,
        inks:[{id:'blue',name:'Stiprā blue tonal key',color:'#0d4dad',source:'tone',gain:1,gamma:.9},
          {id:'warm',name:'Stiprā coral chroma',color:'#ff665d',source:'yellow-density',grayRemoval:.65,gain:.65,gamma:1.2}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{blue:{mode:'solid'},warm:{angle:75}}}},
      'coast-duotone':{version:1,name:'Cool atmosphere / two inks',references:['dizzy-profiles','exploriso-gcr'],
        description:'A blue red-channel-density pass retains pale cool atmosphere; a partially gray-removed coral pass warms material while leaving neutral shadows largely to blue.',
        goodFor:['blue skies and water','cool landscapes with small warm details'],avoid:['exact color reproduction','uniform warm scenes','tiny figures without a detail review'],paper:'#faf8f2',lpi:50,
        inks:[{id:'blue',name:'Stiprā blue atmosphere',color:'#0d4dad',source:'cyan-density',grayRemoval:0,gain:.95,gamma:.95},
          {id:'warm',name:'Stiprā coral chroma',color:'#ff665d',source:'yellow-density',grayRemoval:.65,gain:.65,gamma:1.2}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{blue:{mode:'solid'},warm:{angle:75}}}}
    },
    'bold-spot-poster':{
      'process-cmy':{version:1,name:'Faux process / three inks',references:['exploriso-channels','ambi-process'],
        description:'Unnormalized complementary RGB densities assigned blue, fluorescent pink and yellow. Neutral shadows require all three passes; inspect their overlap.',
        goodFor:['full-color illustrations','three-pass photo experiments'],avoid:['neutral dense shadows','calibrated CMYK expectations'],paper:'#fffdf5',lpi:45,
        inks:[{id:'blue',name:'Blue / screen approximation',color:'#0078bf',source:'cyan-density',gain:.9,gamma:1},
          {id:'pink',name:'Fluorescent pink / screen approximation',color:'#ff48b0',source:'magenta-density',gain:.85,gamma:1},
          {id:'yellow',name:'Yellow / screen approximation',color:'#ffe800',source:'yellow-density',gain:.9,gamma:1}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{blue:{angle:15},pink:{angle:75},yellow:{angle:0}}}},
      'process-cmyk':{version:1,name:'Faux process / four inks',references:['ambi-process','exploriso-gcr'],
        description:'Blue, fluorescent pink, yellow and a separate black key. Full gray removal reduces neutral overlap; this is simple RGB arithmetic, not a calibrated CMYK conversion.',
        goodFor:['photographs needing a distinct black key','four-pass illustrations'],avoid:['assuming an extra ink is always useful','ICC or fluorescent color accuracy'],paper:'#fffdf5',lpi:45,
        inks:[{id:'blue',name:'Blue / screen approximation',color:'#0078bf',source:'cyan-density',grayRemoval:1,gain:.9,gamma:1},
          {id:'pink',name:'Fluorescent pink / screen approximation',color:'#ff48b0',source:'magenta-density',grayRemoval:1,gain:.85,gamma:1},
          {id:'yellow',name:'Yellow / screen approximation',color:'#ffe800',source:'yellow-density',grayRemoval:1,gain:.9,gamma:1},
          {id:'key',name:'Black key',color:'#000000',source:'black',gain:.9,gamma:1}],
        screen:{default:{mode:'dots',angle:15,jitter:0,dotScale:1},plates:{blue:{angle:15},pink:{angle:75},yellow:{angle:0},key:{angle:45}}}}
    }
  };
  const byId=new Map(CATALOG.map(x=>[x.id,x]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const fail=msg=>{throw new TypeError('styles: '+msg);};
  function get(id){const style=byId.get(id);if(!style)fail('unknown style '+String(id));return style;}
  function list(){return CATALOG.map(x=>({id:x.id,name:x.name,version:x.version,intent:x.intent,
    description:x.description,goodFor:[...x.goodFor],avoid:[...x.avoid],lpi:x.lpi,
    variants:Object.entries(VARIANTS[x.id]??{}).map(([id,v])=>({id,name:v.name,version:v.version})),
    inks:x.inks.map(y=>({id:y.id,name:y.name,color:y.color}))}));}
  function explain(id){return {...clone(get(id)),variants:clone(VARIANTS[id]??{}),references:clone(REFERENCES)};}
  const number=(x,lo,hi,name)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail(name+' must be '+lo+'..'+hi);return x;};
  function resolve(id,options={}){
    if(!options||Array.isArray(options)||typeof options!=='object')fail('options expected an object');
    const allowed=['dpi','seed','paper','strength','colors','variant','lpi','screening'];
    for(const key of Object.keys(options))if(!allowed.includes(key))fail('unknown option '+key);
    const base=get(id),variant=options.variant??'default';
    if(typeof variant!=='string')fail('variant must be a string');
    if(variant!=='default'&&!Object.prototype.hasOwnProperty.call(VARIANTS[id]??{},variant))fail('unknown variant '+variant+' for '+id);
    const style=variant==='default'?base:{...base,...VARIANTS[id][variant]},dpi=number(options.dpi??300,72,1200,'dpi');
    const screening=options.screening??'authored';
    if(!['authored','unscreened'].includes(screening))fail('screening must be authored or unscreened');
    const lpi=number(options.lpi??style.lpi,5,150,'lpi');
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
    const nativePitch=dpi/lpi,clampedPitch=Math.min(128,Math.max(4,nativePitch));
    if(screening==='authored'&&clampedPitch!==nativePitch)warnings.push('Requested LPI exceeds current raster screen pitch bounds at selected DPI; effective LPI differs.');
    const pitch=Number(clampedPitch.toFixed(5));
    const {default:main,plates}=style.screen;
    const treatment=settings=>screening==='unscreened'?{...settings,mode:'solid'}:settings;
    const screenRecipe=Screen.config({version:1,seed,default:{...treatment(main),pitch},
      plates:Object.fromEntries(Object.entries(plates).map(([plate,settings])=>[plate,{...treatment(settings),pitch}]))},
      inkRecipe.inks.map(ink=>ink.id));
    return {contract:'stipra-style-resolution-v1',
      style:{id:style.id,name:style.name,version:base.version,variant,variantVersion:variant==='default'?null:style.version,intent:style.intent,
        goodFor:[...style.goodFor],avoid:[...style.avoid],description:style.description,references:(style.references??[]).map(key=>({...REFERENCES[key],id:key})),
        calibration:'experimental RGB approximation; no external profiles or artwork included'},
      dpi,seed,screening,targetLpi:lpi,effectiveLpi:screening==='unscreened'?null:Number((dpi/pitch).toFixed(5)),
      strength,inkRecipe,screenRecipe,
      physicalScreens:inkRecipe.inks.map(ink=>{
        const p=screenRecipe.plates[ink.id],screened=!['solid','paper'].includes(p.mode);
        return {id:ink.id,mode:p.mode,targetLpi:screened?lpi:null,
          effectiveLpi:screened?Number((dpi/p.pitch).toFixed(5)):null,pitchPx:screened?p.pitch:null};
      }),warnings};
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
