/* Stipra image separation v1. Independent, dependency-free spot/CMYK coverage maps. MIT.
 * Masks are physical ink amounts (0 no ink, 255 full ink), not tinted previews.
 * No p5.riso source or algorithm has been copied or translated.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StipraSeparation=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ID=/^[a-z][a-z0-9_-]{0,63}$/, HEX=/^#[0-9a-f]{6}$/i;
  const SOURCES=new Set(['red','green','blue','luminance','darkness','match','cyan','magenta','yellow','black']);
  const clamp=n=>Math.min(1,Math.max(0,n));
  const fail=(where,why)=>{throw new TypeError('separation.'+where+': '+why);};
  function shape(o,name,keys){
    if(!o||typeof o!=='object'||Array.isArray(o))fail(name,'expected object');
    for(const key of Object.keys(o))if(!keys.includes(key))fail(name+'.'+key,'unknown setting');
  }
  function num(v,field,min,max){
    if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(field,'expected finite number '+min+'..'+max);
    return v;
  }
  function color(s,field){
    if(typeof s!=='string'||!HEX.test(s))fail(field,'expected #RRGGBB');
    return s.toLowerCase();
  }
  const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  function validate(config){
    shape(config,'recipe',['version','mode','paper','inks','blackHold']);
    if(config.version!==1)fail('recipe.version','only version 1 supported');
    if(!['spot','cmyk'].includes(config.mode))fail('recipe.mode','expected spot or cmyk');
    if(!Array.isArray(config.inks)||config.inks.length<2||config.inks.length>8)fail('recipe.inks','expected 2..8 inks');
    if(config.mode==='cmyk'&&config.inks.length!==4)fail('recipe.inks','CMYK requires four inks');
    const ids=new Set();
    const inks=config.inks.map((raw,i)=>{
      const p='recipe.inks['+i+']';
      shape(raw,p,['id','name','color','source','target','tolerance','threshold','gain','gamma','invert']);
      if(typeof raw.id!=='string'||!ID.test(raw.id)||ids.has(raw.id))fail(p+'.id','expected unique lowercase ink id');
      ids.add(raw.id);
      if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>100)fail(p+'.name','expected nonempty name (max 100)');
      const source=raw.source,expected=config.mode==='cmyk'?['cyan','magenta','yellow','black'][i]:null;
      if(!SOURCES.has(source))fail(p+'.source','unsupported coverage source');
      if(expected&&source!==expected)fail(p+'.source','CMYK order must be cyan, magenta, yellow, black');
      if(source==='match'&&raw.target===undefined)fail(p+'.target','match requires a literal target color');
      if(source!=='match'&&(raw.target!==undefined||raw.tolerance!==undefined))fail(p,'target and tolerance are only valid for match source');
      return {id:raw.id,name:raw.name.trim(),color:color(raw.color,p+'.color'),source,
        ...(source==='match'?{target:color(raw.target,p+'.target'),tolerance:num(raw.tolerance??0.6,p+'.tolerance',0.01,1)}:{}),
        threshold:num(raw.threshold??0,p+'.threshold',0,0.99),
        gain:num(raw.gain??1,p+'.gain',0,4),
        gamma:num(raw.gamma??1,p+'.gamma',0.1,5),
        invert:raw.invert===undefined?false:typeof raw.invert==='boolean'?raw.invert:fail(p+'.invert','expected boolean')};
    });
    const hold=config.blackHold;
    let blackHold=null;
    if(hold!==undefined){
      if(config.mode!=='spot')fail('recipe.blackHold','reserved for spot inks; CMYK black already preserves pure black');
      shape(hold,'recipe.blackHold',['inkId','threshold']);
      if(!ids.has(hold.inkId))fail('recipe.blackHold.inkId','must refer to an existing spot ink');
      blackHold={inkId:hold.inkId,threshold:num(hold.threshold??0.08,'recipe.blackHold.threshold',0,0.5)};
    }
    return {version:1,mode:config.mode,paper:color(config.paper??'#ffffff','recipe.paper'),inks,...(blackHold?{blackHold}:{})};
  }
  function cmyk(r,g,b){
    const k=1-Math.max(r,g,b),remaining=1-k;
    // Do not divide by zero for RGB (0,0,0). Pure black is K only.
    if(remaining<=1e-12)return [0,0,0,1];
    return [(1-r-k)/remaining,(1-g-k)/remaining,(1-b-k)/remaining,k].map(clamp);
  }
  function luminance(r,g,b){
    // linear-light relative luminance for darkness detection and tonal masks
    const toLinear=v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
    return 0.2126*toLinear(r)+0.7152*toLinear(g)+0.0722*toLinear(b);
  }
  function sourceValue(ink,r,g,b,lum,cmykChannels){
    switch(ink.source){
      case 'red':return r;
      case 'green':return g;
      case 'blue':return b;
      case 'luminance':return lum;
      case 'darkness':return 1-lum;
      case 'cyan':return cmykChannels[0];
      case 'magenta':return cmykChannels[1];
      case 'yellow':return cmykChannels[2];
      case 'black':return cmykChannels[3];
      case 'match':{
        const t=rgb(ink.target).map(x=>x/255);
        const d=Math.hypot(r-t[0],g-t[1],b-t[2])/Math.sqrt(3);
        return clamp(1-d/ink.tolerance);
      }
    }
    throw Error('Unsupported source');
  }
  function transform(v,ink){
    if(ink.invert)v=1-v;
    const afterThreshold=clamp((v-ink.threshold)/(1-ink.threshold));
    return clamp(afterThreshold**ink.gamma*ink.gain);
  }
  function validInput(input){
    shape(input,'input',['width','height','rgba']);
    const {width,height,rgba}=input;
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>20000||height>20000||width*height>24000000)
      fail('input','invalid dimensions (max 24 megapixels)');
    if(!(rgba instanceof Uint8Array)&&!(rgba instanceof Uint8ClampedArray))
      fail('input.rgba','expected RGBA Uint8Array');
    if(rgba.length!==width*height*4)fail('input.rgba','length does not match image dimensions');
  }
  function separate(input,rawConfig){
    validInput(input);
    const recipe=validate(rawConfig);
    const {width,height,rgba}=input,n=width*height;
    const masks=recipe.inks.map(ink=>({...ink,coverage:new Uint8Array(n)}));
    const inkRGB=masks.map(p=>rgb(p.color));
    const paper=rgb(recipe.paper),preview=new Uint8ClampedArray(n*4),amount=new Float64Array(masks.length);
    let painted=0,validAlpha=0;
    const perPlate=new Float64Array(masks.length);
    for(let p=0;p<n;p++){
      const q=p*4,alpha=rgba[q+3]/255,r=rgba[q]/255,g=rgba[q+1]/255,b=rgba[q+2]/255;
      const lum=luminance(r,g,b),channels=cmyk(r,g,b);
      const black=recipe.blackHold&&lum<=recipe.blackHold.threshold;
      if(alpha>0)validAlpha++;
      for(let i=0;i<masks.length;i++){
        const ink=masks[i];
        let v=black?(ink.id===recipe.blackHold.inkId?1:0):transform(sourceValue(ink,r,g,b,lum,channels),ink);
        const coverage=Math.round(clamp(v)*alpha*255);
        ink.coverage[p]=coverage;
        perPlate[i]+=coverage/255;
      }
      let cr=paper[0],cg=paper[1],cb=paper[2];
      for(let i=0;i<masks.length;i++){
        const v=masks[i].coverage[p]/255,ink=inkRGB[i];
        // Digital multiply approximation of translucent spot ink on paper.
        cr*=1-v+v*ink[0]/255;
        cg*=1-v+v*ink[1]/255;
        cb*=1-v+v*ink[2]/255;
      }
      preview[q]=Math.round(cr);preview[q+1]=Math.round(cg);preview[q+2]=Math.round(cb);preview[q+3]=255;
      if(masks.some(ink=>ink.coverage[p]>0))painted++;
    }
    return {contract:'stipra-separation-v1',width,height,recipe,masks,preview,
      stats:{pixels:n,nontransparentPixels:validAlpha,printedPixels:painted,
        inks:masks.map((plate,i)=>({id:plate.id,meanCoverage:perPlate[i]/n,inkedPixels:plate.coverage.reduce((c,x)=>c+(x>0),0)}))},
      warning:'Digital overprint and RGB-to-ink mapping are approximations; these masks are continuous-tone estimates, not screened or press-calibrated production masters.'};
  }
  function plateRGBA(mask){
    if(!(mask instanceof Uint8Array))fail('mask','expected Uint8Array');
    const out=new Uint8ClampedArray(mask.length*4);
    for(let i=0;i<mask.length;i++){const v=255-mask[i],p=i*4;out[p]=v;out[p+1]=v;out[p+2]=v;out[p+3]=255;}
    return out;
  }
  return {validate,separate,cmyk,luminance,plateRGBA};
});
