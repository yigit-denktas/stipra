/* View-only ink inspection. It never modifies recipes or production coverage. MIT. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./screening'));else root.StipraInspection=factory(root.StipraScreen);})(typeof globalThis!=='undefined'?globalThis:this,function(Screen){
  'use strict';
  /** Composes selected inks for inspection; transparent paper uses straight-alpha RGB. */
  function preview(result,paper,{solo=null,muted=[],substrate=true,paperOnly=false}={}){
    const ids=new Set(result.masks.map(x=>x.id));
    if(solo!==null&&!ids.has(solo)||!Array.isArray(muted)||muted.some(id=>!ids.has(id)))throw Error('Unknown inspection ink');
    const hidden=new Set(muted),masks=paperOnly?[]:result.masks.filter(m=>(solo===null||m.id===solo)&&!hidden.has(m.id));
    const rgba=Screen.preview(masks,result.width,result.height,substrate?paper:'#ffffff');
    if(!substrate)for(let p=0;p<result.width*result.height;p++){
      let empty=1;for(const mask of masks)empty*=1-mask.coverage[p]/255;const alpha=1-empty,q=p*4;
      for(let c=0;c<3;c++)rgba[q+c]=alpha?Math.max(0,Math.min(255,Math.round((rgba[q+c]-255*empty)/alpha))):0;
      rgba[q+3]=Math.round(alpha*255);
    }
    return rgba;
  }
  return {preview};
});
