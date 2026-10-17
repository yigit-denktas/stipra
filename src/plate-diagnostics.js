/* Stiprā ink-coverage diagnostics v1. Shared browser/Node, no output alteration. MIT.
 * Area/overlap measures are editorial screening diagnostics, never press-safe limits.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StipraDiagnostics=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const fail=s=>{throw new TypeError('diagnostics: '+s);};
  const round=n=>Number(n.toFixed(6));
  function options(raw={}){
    if(!raw||Array.isArray(raw)||typeof raw!=='object')fail('options must be an object');
    const allowed=['activeThreshold','littleUsedMean','denseMean','overlapFraction'];
    for(const key of Object.keys(raw))if(!allowed.includes(key))fail('unknown option '+key);
    const result={activeThreshold:raw.activeThreshold??0.25,littleUsedMean:raw.littleUsedMean??0.025,
      denseMean:raw.denseMean??0.70,overlapFraction:raw.overlapFraction??0.35};
    for(const [key,value] of Object.entries(result))
      if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)
        fail(key+' must be between 0 and 1');
    return result;
  }
  function suitability(input){
    if(!input||!Number.isSafeInteger(input.width)||!Number.isSafeInteger(input.height)||input.width<1||input.height<1||input.width*input.height>24000000||
      !['[object Uint8Array]','[object Uint8ClampedArray]'].includes(Object.prototype.toString.call(input.rgba))||input.rgba.length!==input.width*input.height*4)fail('expected full-frame source RGBA');
    let weight=0,shadows=0,highlights=0,neutral=0,min=1,max=0;
    for(let q=0;q<input.rgba.length;q+=4){
      const a=input.rgba[q+3]/255;if(!a)continue;
      const r=input.rgba[q]/255,g=input.rgba[q+1]/255,b=input.rgba[q+2]/255,t=.2126*r+.7152*g+.0722*b;
      weight+=a;shadows+=a*(t<.25);highlights+=a*(t>.85);neutral+=a*(Math.max(r,g,b)-Math.min(r,g,b)<.04);
      min=Math.min(min,t);max=Math.max(max,t);
    }
    const ratio=n=>round(weight?n/weight:0);
    return {measurement:'alpha-weighted encoded RGB tone; no semantic classification',visiblePixelWeight:round(weight),
      shadowFraction:ratio(shadows),highlightFraction:ratio(highlights),nearNeutralFraction:ratio(neutral),
      tonalRange:round(weight?max-min:0),thresholds:{shadowBelow:.25,highlightAbove:.85,neutralChromaBelow:.04},
      guidance:[...(weight&&shadows/weight>.25?['Dark source: compare an open-shadow key and inspect texture before adding ink.']:[]),
        ...(weight&&highlights/weight>.25?['Many pale tones: inspect unscreened proof and fine detail at print size.']:[]),
        ...(weight&&neutral/weight>.9?['Mostly neutral source: gray-removed color passes may contribute little; compare a tonal duotone.']:[]),
        ...(!weight?['Fully transparent source: no printable image area.']:[])]};
  }
  function inspect(result,{dpi=300,settings={},input=null}={}){
    if(!result||!Number.isSafeInteger(result.width)||!Number.isSafeInteger(result.height)||
        result.width<1||result.height<1||!Array.isArray(result.masks)||
        result.masks.length<1||result.masks.length>8)fail('expected full-frame masks');
    if(!Number.isFinite(dpi)||dpi<72||dpi>1200)fail('dpi must be 72..1200');
    const {width,height,masks}=result,pixels=width*height,opts=options(settings);
    const ids=new Set();
    for(const mask of masks){
      if(!mask||typeof mask.id!=='string'||ids.has(mask.id)||Object.prototype.toString.call(mask.coverage)!=='[object Uint8Array]'||
        mask.coverage.length!==pixels)fail('unique masks must be full-frame Uint8Array');
      ids.add(mask.id);
    }
    const totals=new Array(masks.length).fill(0);
    const active=new Array(masks.length).fill(0),solid=new Array(masks.length).fill(0);
    const pairCounts=masks.map(()=>new Array(masks.length).fill(0));
    let overlap2=0,overlap3=0,highSum=0,inkSum=0,inkedPixels=0;
    const threshold=Math.ceil(opts.activeThreshold*255);
    for(let p=0;p<pixels;p++){
      let additive=0,overlap=0;
      const participating=[];
      for(let i=0;i<masks.length;i++){
        const v=masks[i].coverage[p],t=v/255;
        totals[i]+=t;additive+=t;
        if(v>=217)solid[i]++;
        if(v>0)active[i]++;
        if(v>0&&v>=threshold){participating.push(i);overlap++;}
      }
      inkSum+=additive;
      if(additive>0)inkedPixels++;
      if(overlap>=2)overlap2++;
      if(overlap>=3)overlap3++;
      if(additive>=1.8)highSum++;
      for(let i=0;i<participating.length;i++)
        for(let j=i+1;j<participating.length;j++)
          pairCounts[participating[i]][participating[j]]++;
    }
    const plates=masks.map((mask,i)=>{
      const screen=mask.screen??null;
      const isScreened=screen&&screen.mode!=='solid'&&screen.mode!=='paper';
      return {id:mask.id,name:mask.name||mask.id,
        meanCoverage:round(totals[i]/pixels),
        occupiedFraction:round(active[i]/pixels),
        veryDenseFraction:round(solid[i]/pixels),
        meanWhereOccupied:round(active[i]?totals[i]/active[i]:0),
        additiveInkShare:round(inkSum?totals[i]/inkSum:0),
        screen:screen?{mode:screen.mode,pitchPx:screen.pitch,angleDeg:screen.angle,
          effectiveLpi:isScreened?round(dpi/screen.pitch):null}:null};
    });
    const pairs=[];
    for(let i=0;i<masks.length;i++)for(let j=i+1;j<masks.length;j++)
      pairs.push({inks:[masks[i].id,masks[j].id],
        overlapFraction:round(pairCounts[i][j]/pixels)});
    pairs.sort((a,b)=>b.overlapFraction-a.overlapFraction||a.inks.join('/').localeCompare(b.inks.join('/')));
    if(input&&(input.width!==width||input.height!==height))fail('source grid must match masks');
    const diagnostics={...(input?{suitability:suitability(input)}:{}),contract:'stipra-plate-diagnostics-v1',width,height,dpi,
      measurement:'nominal raster coverage, additive and uncalibrated',
      thresholds:{...opts,heavyCombinedCoverage:1.8,solidPlateCoverage:217/255},
      overall:{inkedFraction:round(inkedPixels/pixels),meanAdditiveCoverage:round(inkSum/pixels),
        overlapTwoPlusFraction:round(overlap2/pixels),
        overlapThreePlusFraction:round(overlap3/pixels),
        heavyCombinedFraction:round(highSum/pixels)},
      plates,pairs,warnings:[]};
    for(const p of plates){
      if(p.meanCoverage<opts.littleUsedMean)
        diagnostics.warnings.push({code:'low-contribution',inkIds:[p.id],
          message:'This pass contributes little average area. Review whether it earns a separate physical ink.'});
      if(p.meanCoverage>opts.denseMean)
        diagnostics.warnings.push({code:'broad-heavy-pass',inkIds:[p.id],
          message:'Large average nominal coverage. Inspect detail and the substrate; this is not a machine safety limit.'});
    }
    if(diagnostics.overall.overlapTwoPlusFraction>opts.overlapFraction)
      diagnostics.warnings.push({code:'extensive-overlap',inkIds:masks.map(x=>x.id),
        message:'Multiple inks overlap across a large area. Inspect contrast and physical overprinting.'});
    return diagnostics;
  }
  return {inspect,options,suitability};
});
