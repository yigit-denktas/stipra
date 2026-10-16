/* Deterministic full-frame ink screening. MIT. No p5.riso source used.
 * Continuous-tone Uint8Array masks -> dot/line/reverse/hybrid print textures.
 * Geometry belongs to the underlying mask; screens and registration stay separate.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.StipraScreen=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MODES=new Set(['solid','dots','reverse','lines','hybrid','paper']);
  const fail=(at,msg)=>{throw new TypeError('screen.'+at+': '+msg);};
  const clamp=v=>Math.max(0,Math.min(1,v));
  function shape(o,where,keys){
    if(!o||typeof o!=='object'||Array.isArray(o))fail(where,'expected an object');
    for(const key of Object.keys(o))if(!keys.includes(key))fail(where+'.'+key,'unknown field');
  }
  function number(v,at,low,high,integer=false){
    if(typeof v!=='number'||!Number.isFinite(v)||v<low||v>high||(integer&&!Number.isSafeInteger(v)))
      fail(at,'expected finite '+(integer?'integer ':'')+low+'..'+high);
    return v;
  }
  const defaults={mode:'solid',pitch:12,angle:0,dotScale:1,jitter:0,solidThreshold:0.9,
    registration:{x:0,y:0,rotate:0}};
  function validate(raw={}){
    shape(raw,'settings',['mode','pitch','angle','dotScale','jitter','solidThreshold','registration']);
    const mode=raw.mode??defaults.mode;
    if(!MODES.has(mode))fail('settings.mode','expected solid, dots, reverse, lines, hybrid or paper');
    const r=raw.registration??defaults.registration;
    shape(r,'settings.registration',['x','y','rotate']);
    return {mode,pitch:number(raw.pitch??defaults.pitch,'settings.pitch',4,128),
      angle:number(raw.angle??defaults.angle,'settings.angle',-180,180),
      dotScale:number(raw.dotScale??defaults.dotScale,'settings.dotScale',0.1,2),
      jitter:number(raw.jitter??defaults.jitter,'settings.jitter',0,0.3),
      solidThreshold:number(raw.solidThreshold??defaults.solidThreshold,'settings.solidThreshold',0.01,1),
      registration:{x:number(r.x??0,'settings.registration.x',-50,50),
        y:number(r.y??0,'settings.registration.y',-50,50),
        rotate:number(r.rotate??0,'settings.registration.rotate',-15,15)}};
  }
  function config(raw,inkIds){
    shape(raw,'recipe',['version','seed','default','plates']);
    if(raw.version!==1)fail('recipe.version','expected 1');
    const seed=number(raw.seed??1,'recipe.seed',0,4294967295,true);
    const plateSpecs=raw.plates??{};
    shape(plateSpecs,'recipe.plates',inkIds);
    const baseline=validate(raw.default??{});
    return {version:1,seed,default:baseline,plates:Object.fromEntries(inkIds.map(id=>
      [id,validate({...baseline,...(plateSpecs[id]??{}),
        registration:{...baseline.registration,...(plateSpecs[id]?.registration??{})}})]))};
  }
  // Stable spatial hash; no mutable PRNG state and no runtime-dependent randomness.
  function hash(x,y,seed,salt){
    let v=(Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,2246822519)^salt)>>>0;
    v=Math.imul(v^(v>>>13),1274126177)>>>0;v=Math.imul(v^(v>>>16),2246822519)>>>0;
    return ((v^(v>>>13))>>>0)/4294967296;
  }
  function geometry(width,height,settings){
    const a=settings.angle*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),cx=(width-1)/2,cy=(height-1)/2;
    let minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;
    for(const [x,y] of [[-.5,-.5],[width-.5,-.5],[-.5,height-.5],[width-.5,height-.5]]){
      const dx=x-cx,dy=y-cy,u=cos*dx+sin*dy,v=-sin*dx+cos*dy;
      minU=Math.min(minU,u);maxU=Math.max(maxU,u);minV=Math.min(minV,v);maxV=Math.max(maxV,v);
    }
    // One-pixel guard on both sides avoids precision issues at rotated corners.
    const ox=minU-1,oy=minV-1;
    const cols=Math.ceil((maxU-ox+1)/settings.pitch)+1,rows=Math.ceil((maxV-oy+1)/settings.pitch)+1;
    if(cols*rows>3000000)fail('grid','screen grid is too large; use larger pitch');
    function loc(x,y){
      const dx=x-cx,dy=y-cy;
      const u=(cos*dx+sin*dy-ox)/settings.pitch,v=(-sin*dx+cos*dy-oy)/settings.pitch;
      const col=Math.floor(u),row=Math.floor(v);
      return {col,row,cell:row*cols+col,fx:u-col-.5,fy:v-row-.5};
    }
    return {loc,size:cols*rows,cols};
  }
  function applyRegistration(coverage,width,height,r){
    if(!r.x&&!r.y&&!r.rotate)return coverage;
    const dest=new Uint8Array(coverage.length),a=r.rotate*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const cx=(width-1)/2,cy=(height-1)/2;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      // Inverse transform of an ink pass about the shared canvas center, not source geometry.
      const dx=x-cx-r.x,dy=y-cy-r.y;
      const fromX=Math.round(c*dx+s*dy+cx),fromY=Math.round(-s*dx+c*dy+cy);
      if(fromX>=0&&fromX<width&&fromY>=0&&fromY<height)dest[y*width+x]=coverage[fromY*width+fromX];
    }
    return dest;
  }
  function screenMask(mask,width,height,raw={},seed=1){
    if(!(mask instanceof Uint8Array)||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
      width<1||height<1||width>20000||height>20000||width*height>24000000||mask.length!==width*height)
      fail('mask','expected exact full-frame Uint8Array (max 24 megapixels)');
    number(seed,'seed',0,4294967295,true);
    const settings=validate(raw),{mode,pitch,dotScale,jitter,solidThreshold,registration}=settings;
    if(mode==='paper')return {coverage:new Uint8Array(mask.length),settings};
    if(mode==='solid')return {coverage:applyRegistration(mask.slice(),width,height,registration),settings};
    const grid=geometry(width,height,settings),total=grid.size;
    const sums=new Float64Array(total),count=new Uint32Array(total);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const p=y*width+x,k=grid.loc(x,y).cell;
      sums[k]+=mask[p]/255;count[k]++;
    }
    const tones=new Float32Array(total);
    for(let k=0;k<total;k++)tones[k]=count[k]?sums[k]/count[k]:0;
    const out=new Uint8Array(mask.length),scale=pitch*dotScale;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const p=y*width+x,original=mask[p];
      if(!original)continue; // Transparency and blank source pixels never grow new content.
      if(mode==='hybrid'&&original>=solidThreshold*255){out[p]=original;continue;}
      const c=grid.loc(x,y),tone=tones[c.cell];
      if(tone<=0)continue;
      if(tone>=1&&dotScale>=1&&jitter===0){out[p]=255;continue;}
      const jx=(hash(c.col,c.row,seed,0x1a2b3c4d)-.5)*2*jitter;
      const jy=(hash(c.col,c.row,seed,0x4d3c2b1a)-.5)*2*jitter;
      const ux=c.fx-jx,uy=c.fy-jy;
      let covered=false;
      if(mode==='lines'){
        // A constant coverage band, independent of source facet geometry.
        covered=Math.abs(uy)<=Math.min(.5,.5*tone*dotScale);
      }else if(mode==='reverse'){
        // Reverse = solid ink with paper-colored knockout circles. They shrink as coverage rises.
        // The radius reaches the cell corners at zero ink; 100% tone has zero-sized holes.
        covered=Math.hypot(ux,uy)>Math.sqrt(1-tone)*dotScale/Math.SQRT2;
      }else{
        // Ink dots expand monotonically in area; full cells become solid at tone 1.
        covered=Math.hypot(ux,uy)<=Math.sqrt(tone)*dotScale/Math.SQRT2;
      }
      // Binary halftone is deliberate. Sharp edges are gated by the source's support.
      out[p]=covered?255:0;
    }
    return {coverage:applyRegistration(out,width,height,registration),settings};
  }
  function preview(masks,width,height,paper){
    if(typeof paper!=='string'||!/^#[0-9a-f]{6}$/i.test(paper))fail('paper','expected #RRGGBB');
    const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
    const stock=rgb(paper),out=new Uint8ClampedArray(width*height*4);
    const colors=masks.map(m=>rgb(m.color));
    for(let p=0;p<width*height;p++){
      let r=stock[0],g=stock[1],b=stock[2];
      for(let i=0;i<masks.length;i++){
        const t=masks[i].coverage[p]/255,ink=colors[i];
        r*=1-t+t*ink[0]/255;g*=1-t+t*ink[1]/255;b*=1-t+t*ink[2]/255;
      }
      const q=p*4;out[q]=Math.round(r);out[q+1]=Math.round(g);out[q+2]=Math.round(b);out[q+3]=255;
    }
    return out;
  }
  function apply(separated,rawConfig){
    if(!separated||!Array.isArray(separated.masks)||!Number.isSafeInteger(separated.width)||!Number.isSafeInteger(separated.height))
      fail('input','expected a Stipra separation result');
    const {width,height}=separated,inkIds=separated.masks.map(m=>m.id);
    const recipe=config(rawConfig,inkIds);
    const masks=separated.masks.map(m=>{
      const data=screenMask(m.coverage,width,height,recipe.plates[m.id],recipe.seed);
      return {...m,coverage:data.coverage,screen:data.settings};
    });
    const mean=masks.map(m=>m.coverage.reduce((sum,n)=>sum+n,0)/(255*width*height));
    return {contract:'stipra-screen-v1',width,height,recipe,masks,preview:preview(masks,width,height,separated.recipe.paper),
      stats:{pixels:width*height,inks:masks.map((m,i)=>({id:m.id,meanCoverage:mean[i],
        inkedPixels:m.coverage.reduce((n,v)=>n+(v>0),0)}))},
      warning:'Screening is a deterministic digital geometric approximation. No spectral ink mixing, physical dot gain, RIP calibration, or printer-specific trapping is implied.'};
  }
  return {validate,config,screenMask,apply,preview,applyRegistration};
});
