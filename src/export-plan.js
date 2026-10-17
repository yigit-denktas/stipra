/* Shared physical export geometry and separation of proof offsets from masters. MIT. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./screening.js'));else root.StipraExportPlan=factory(root.StipraScreen);})(typeof globalThis!=='undefined'?globalThis:this,function(Screen){
  'use strict';
  function validate(dpi,marksMm){
    if(!Number.isFinite(dpi)||dpi<72||dpi>1200)throw Error('print: DPI must be between 72 and 1200');
    if(!Number.isFinite(marksMm)||marksMm<0||marksMm>15)throw Error('print: marks-mm must be 0..15');
  }
  function printIntent(w,h,dpi,marksMm){
    validate(dpi,marksMm);
    return {dpi,sourcePixels:{width:w,height:h},origin:{x:0,y:0},trimPixels:{x:0,y:0,width:w,height:h},
      trimMm:{width:Number((w*25.4/dpi).toFixed(4)),height:Number((h*25.4/dpi).toFixed(4))},resampled:false,registration:{x:0,y:0,rotate:0},marksMm,profile:null};
  }
  function screenConfigs(raw,ids){
    const proof=Screen.config(raw||{version:1},ids);
    const production={version:1,seed:proof.seed,default:{...proof.default,registration:{x:0,y:0,rotate:0}},plates:{}};
    for(const id of ids)production.plates[id]={...proof.plates[id],registration:{x:0,y:0,rotate:0}};
    return {proof,production};
  }
  return {validate,printIntent,screenConfigs};
});
