(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const spot=()=>({version:1,mode:'spot',paper:'#fff8ec',inks:[
    {id:'blue',name:'Blue',color:'#2365a5',source:'darkness',threshold:0,gain:1,gamma:1},
    {id:'coral',name:'Coral',color:'#e65e4b',source:'match',target:'#e65e4b',tolerance:0.45,threshold:0,gain:1,gamma:1}
  ]});
  const cmyk=()=>({version:1,mode:'cmyk',paper:'#ffffff',inks:[
    {id:'cyan',name:'Cyan',color:'#00a7d6',source:'cyan'},
    {id:'magenta',name:'Magenta',color:'#dd277f',source:'magenta'},
    {id:'yellow',name:'Yellow',color:'#f1d52f',source:'yellow'},
    {id:'black',name:'Black',color:'#161616',source:'black'}
  ]});
  let asset=null,result=null,original=null,config=spot(),views=[],styleResolution=null,renderValid=false,loadVersion=0;
  const freshScreen=()=>({version:1,seed:142,default:{mode:'solid',pitch:12,angle:0,jitter:0,dotScale:1,solidThreshold:0.9},plates:{}});
  let screenConfig=freshScreen(),exportBusy=false,importBusy=false;
  let comparisonVersion=0,pendingCandidate=null;
  const inspection={solo:null,muted:new Set()};
  const field=(where,label,value,type,callback,options)=>{
    const div=document.createElement('div');div.className='field';
    const id='control-'+where.dataset.ink+'-'+label.replace(/\W/g,'-');
    const caption=document.createElement('label');caption.htmlFor=id;caption.textContent=label;div.appendChild(caption);
    const input=document.createElement(type==='select'?'select':'input');input.id=id;
    if(type==='select'){
      for(const [key,name] of options){const option=document.createElement('option');option.value=key;option.textContent=name;input.appendChild(option);}
      input.value=value;
    } else {
      input.type=type;input.value=String(value);
      if(type==='range'){input.min=label==='Match radius'?'0.05':label==='Gamma'?'0.1':'0';input.max=label==='Threshold'?'0.95':['Match radius','Gray removal'].includes(label)?'1':label==='Gamma'?'5':'4';input.step='0.01';}
      input.value=String(value);
    }
    input.addEventListener('input',()=>{callback(type==='range'?Number(input.value):input.value);styleResolution=null;schedule();});
    div.appendChild(input);where.appendChild(div);
    return div;
  };
  function controls(){
    const host=$('inks');host.replaceChildren();
    for(const ink of config.inks){
      const box=document.createElement('details');box.className='ink';box.dataset.ink=ink.id;box.id='ink-settings-'+ink.id;
      box.open=ink===config.inks[0];
      const summary=document.createElement('summary');summary.className='ink-title';
      const swatch=document.createElement('span');swatch.className='swatch';swatch.style.backgroundColor=ink.color;
      swatch.setAttribute('aria-hidden','true');
      const h=document.createElement('span');h.textContent=ink.name;
      summary.append(swatch,h);box.appendChild(summary);
      field(box,'Ink color',ink.color,'color',v=>{ink.color=v;swatch.style.backgroundColor=v;});
      if(config.mode==='spot'){
        field(box,'Source',ink.source,'select',v=>{
          ink.source=v;
          if(v==='match'){ink.target=ink.target||ink.color;ink.tolerance=ink.tolerance||0.45;}
          else {delete ink.target;delete ink.tolerance;}
          if(!v.endsWith('-density'))delete ink.grayRemoval;
          controls();
        },[['tone','Photographic tone'],['cyan-density','Red-channel ink density'],['magenta-density','Green-channel ink density'],['yellow-density','Blue-channel ink density'],['darkness','Darkness'],['luminance','Brightness'],['red','Red channel'],['green','Green channel'],['blue','Blue channel'],['match','Match a color'],['cyan','CMYK cyan'],['magenta','CMYK magenta'],['yellow','CMYK yellow'],['black','CMYK black']]);
        if(ink.source.endsWith('-density'))field(box,'Gray removal',ink.grayRemoval??0,'range',v=>ink.grayRemoval=Math.min(1,v));
        if(ink.source==='match'){
          field(box,'Match color',ink.target,'color',v=>ink.target=v);
          field(box,'Match radius',ink.tolerance,'range',v=>ink.tolerance=Math.max(0.05,v));
        }
      }
      field(box,'Threshold',ink.threshold||0,'range',v=>ink.threshold=v);
      field(box,'Strength',ink.gain??1,'range',v=>ink.gain=v);
      field(box,'Gamma',ink.gamma??1,'range',v=>ink.gamma=Math.max(.1,v));
      host.appendChild(box);
    }
    inspectionControls();
  }
  function screenControls(){
    const host=$('screen-inks');host.replaceChildren();
    for(const ink of config.inks){
      const section=document.createElement('details');section.className='ink';section.open=ink===config.inks[0];
      const heading=document.createElement('summary');heading.className='ink-title';heading.textContent=ink.name+' screen';section.appendChild(heading);
      function field(label,name,value,min,max,step){
        const wrap=document.createElement('div');wrap.className='field';
        const el=document.createElement('input'),cap=document.createElement('label');
        el.type='number';el.id='screen-'+ink.id+'-'+name;cap.htmlFor=el.id;cap.textContent=label;
        el.value=String(value);el.min=String(min);el.max=String(max);el.step=String(step);
        el.addEventListener('change',()=>{
          const number=Number(el.value);
          styleResolution=null;screenConfig.plates[ink.id]??={};
          if(name==='x'||name==='y'||name==='rotate'){
            screenConfig.plates[ink.id].registration??={};
            screenConfig.plates[ink.id].registration[name]=number;
          } else screenConfig.plates[ink.id][name]=number;
          schedule();
        });
        wrap.append(cap,el);section.appendChild(wrap);
      }
      const row=document.createElement('div'),label=document.createElement('label'),select=document.createElement('select');
      row.className='field';
      select.id='screen-'+ink.id+'-mode';label.htmlFor=select.id;label.textContent='Mode override';
      for(const [value,name] of [['','Use global'],['solid','Unscreened'],['dots','Dots'],['reverse','Reverse knockout'],['lines','Lines'],['hybrid','Hybrid'],['paper','Suppress ink']]){
        const option=document.createElement('option');option.value=value;option.textContent=name;select.appendChild(option);
      }
      select.value=screenConfig.plates[ink.id]?.mode??'';
      select.addEventListener('change',()=>{
        styleResolution=null;screenConfig.plates[ink.id]??={};
        if(select.value)screenConfig.plates[ink.id].mode=select.value;
        else delete screenConfig.plates[ink.id].mode;
        schedule();
      });
      row.append(label,select);section.appendChild(row);
      const customAngle=screenConfig.plates[ink.id]?.angle??screenConfig.default.angle;
      field('Ink angle (°)','angle',customAngle,-180,180,1);
      field('Ink pitch (px)','pitch',screenConfig.plates[ink.id]?.pitch??screenConfig.default.pitch,4,128,.01);
      field('Mark scale','dotScale',screenConfig.plates[ink.id]?.dotScale??screenConfig.default.dotScale,.1,2,.01);
      field('Hybrid solid threshold','solidThreshold',screenConfig.plates[ink.id]?.solidThreshold??screenConfig.default.solidThreshold,.01,1,.01);
      field('Registration x (px)','x',screenConfig.plates[ink.id]?.registration?.x??0,-50,50,1);
      field('Registration y (px)','y',screenConfig.plates[ink.id]?.registration?.y??0,-50,50,1);
      host.appendChild(section);
    }
  }
  function inspectionControls(){
    const ids=new Set(config.inks.map(x=>x.id));
    if(!ids.has(inspection.solo))inspection.solo=null;
    inspection.muted=new Set([...inspection.muted].filter(id=>ids.has(id)));
    const host=$('ink-visibility');host.replaceChildren();
    for(const ink of config.inks){
      const row=document.createElement('div');row.className='ink-visibility';
      const solo=document.createElement('button');solo.type='button';solo.id='solo-'+ink.id;
      solo.textContent='Solo '+ink.name;solo.setAttribute('aria-pressed',String(inspection.solo===ink.id));
      solo.onclick=()=>{inspection.solo=inspection.solo===ink.id?null:ink.id;if(inspection.solo)inspection.muted.delete(ink.id);inspectionControls();inspectProof();$('solo-'+ink.id).focus();};
      const label=document.createElement('label'),mute=document.createElement('input');mute.type='checkbox';mute.id='mute-'+ink.id;mute.checked=inspection.muted.has(ink.id);
      mute.onchange=()=>{if(mute.checked)inspection.muted.add(ink.id);else inspection.muted.delete(ink.id);inspectProof();};label.append(mute,document.createTextNode(' Mute '+ink.name));row.append(solo,label);host.append(row);
    }
    $('ink-count').value=String(config.inks.length);$('ink-count').disabled=config.mode==='cmyk';
  }
  function inspectProof(){
    if(!result||!views[1])return;
    const full=inspection.solo===null&&inspection.muted.size===0&&$('proof-paper').checked&&!$('paper-only').checked;
    const pixels=full?result.preview:StipraInspection.preview(result,config.paper,{solo:inspection.solo,muted:[...inspection.muted],substrate:$('proof-paper').checked,paperOnly:$('paper-only').checked});
    const ctx=views[1].canvas.getContext('2d'),data=ctx.createImageData(result.width,result.height);data.data.set(pixels);ctx.putImageData(data,0,0);
    views[1].canvas.setAttribute('aria-label',$('paper-only').checked?'Paper only':inspection.solo?'Solo ink inspection':'Simulated overprint inspection');
    $('grid').classList.toggle('native-pixels',$('view-zoom').value==='native');
    const title=views[1].canvas.parentElement.querySelector('figcaption strong');if(title)title.textContent=$('paper-only').checked?'Paper only':inspection.solo?'Solo ink inspection':inspection.muted.size?'Muted ink inspection':'Simulated overprint';
  }
  function canvas(width,height,rgba){
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d'),data=ctx.createImageData(width,height);
    data.data.set(rgba);ctx.putImageData(data,0,0);return c;
  }
  function adjustInk(id){
    const box=$('ink-settings-'+id);
    if(!box)return;
    box.open=true;
    const summary=box.querySelector('summary');
    summary.focus({preventScroll:true});
    summary.scrollIntoView({block:'nearest'});
  }
  function show(name,raw,detail,target,ink=null){
    const figure=document.createElement('figure');figure.tabIndex=0;figure.className=target==='plates'?'view view--plate':'view view--hero';
    const img=canvas(asset.metadata.oriented.width,asset.metadata.oriented.height,raw);
    img.setAttribute('aria-label',name);figure.appendChild(img);
    const caption=document.createElement('figcaption'),strong=document.createElement('strong');
    strong.textContent=name;caption.appendChild(strong);
    if(detail){
      const small=document.createElement('small');small.className='muted';small.textContent=detail;caption.appendChild(small);
    }
    if(ink){
      const adjust=document.createElement('button');adjust.type='button';adjust.className='plate-adjust';
      adjust.textContent='Adjust '+ink.name;adjust.setAttribute('aria-controls','ink-settings-'+ink.id);
      adjust.addEventListener('click',()=>adjustInk(ink.id));caption.appendChild(adjust);
    }
    figure.appendChild(caption);
    $(target==='plates'?'plates':'hero').appendChild(figure);
    return {canvas:img,name};
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;scheduled=true;
    Promise.resolve().then(()=>{scheduled=false;render();});
  }
  function render(){
    clearComparison('Settings changed. Preview again to compare.');
    $('comparison-preview').disabled=true;
    $('recipe-comparison').hidden=!asset;
    $('style-summary').textContent=styleResolution?.style.description||'Manual treatment. Adjust each ink, or compare a candidate before replacing your settings.';
    $('paper').value=config.paper;
    $('error').hidden=true;renderValid=false;
    $('save-preview').disabled=true;$('save-plates').disabled=true;
    if(!asset)return;
    try{
      const geometry=StipraExportPlan.printIntent(asset.metadata.oriented.width,asset.metadata.oriented.height,Number($('style-dpi').value),Number($('marks-mm').value));
      $('print-geometry').textContent=geometry.trimMm.width.toFixed(2)+' × '+geometry.trimMm.height.toFixed(2)+' mm native trim at '+geometry.dpi+' DPI; origin 0,0; '+geometry.marksMm+' mm optional marks outside trim. No bleed is invented; no machine printable-area profile selected.';
      const w=asset.metadata.oriented.width,h=asset.metadata.oriented.height;
      const baseline=StipraSeparation.separate({width:w,height:h,rgba:asset.rgba},config);
      result=StipraScreen.apply(baseline,screenConfig);
      $('hero').replaceChildren();$('plates').replaceChildren();views=[];
      $('empty-state').hidden=true;$('plates-heading').hidden=false;
      $('plate-count').textContent=result.masks.length+' ink '+(result.masks.length===1?'plate':'plates');
      views.push(show('Original',asset.rgba,null,'hero'));
      views.push(show('Simulated overprint',result.preview,null,'hero'));
      for(const ink of result.masks){
        const grayscale=StipraSeparation.plateRGBA(ink.coverage);
        const percent=result.stats.inks.find(x=>x.id===ink.id).meanCoverage*100;
        views.push(show(ink.name+' plate',grayscale,percent.toFixed(1)+'% mean coverage','plates',ink));
      }
      $('status').textContent=config.mode.toUpperCase()+' · '+w+' × '+h+' px · '+result.masks.length+' physical ink passes';
      const diagnostics=StipraDiagnostics.inspect(result,{dpi:Number($('style-dpi').value),input:{width:w,height:h,rgba:asset.rgba}});
      const overlap=(diagnostics.overall.overlapTwoPlusFraction*100).toFixed(1);
      const freqs=diagnostics.plates.filter(p=>p.screen?.effectiveLpi!==null&&p.screen?.effectiveLpi!==undefined)
        .map(p=>p.id+': '+p.screen.effectiveLpi.toFixed(1)+' lpi');
      $('diagnostics').textContent='ink overlap: '+overlap+'% of pixels at ≥25% per ink · '+
        (freqs.length?freqs.join(' / '):'solid coverage')+
        (diagnostics.warnings.length?' · '+diagnostics.warnings.length+' review note(s)':'')+
        ' · advisory, not press calibrated. '+diagnostics.suitability.guidance.join(' ')+
        (diagnostics.warnings.length?' '+diagnostics.warnings.map(w=>w.inkIds.join('/')+': '+w.message).join(' '):'');
      $('diagnostics').hidden=false;
      $('meta').textContent=result.warning+' · Screen seed '+result.recipe.seed+'.';
      inspectionControls();inspectProof();$('inspection').disabled=false;
      renderValid=true;$('comparison-preview').disabled=importBusy;$('save-preview').disabled=false;$('save-plates').disabled=exportBusy;
    }catch(error){
      $('diagnostics').hidden=true;
      $('error').textContent=error.message;$('error').hidden=false;
      $('status').textContent='Separation settings rejected; previous artwork is unchanged.';
    }
  }
  async function decode(bytes,type){
    const blob=new Blob([bytes],{type});
    // Use one reliable browser decode path for every supported local format.
    // Source EXIF orientation is neutralized in a temporary decoding copy.
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(blob),img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Browser cannot decode this file'));};
      img.src=url;
    });
  }
  async function load(file){
    if(!file)return;
    const version=++loadVersion;importBusy=true;clearComparison('Artwork is loading. Preview again when it is ready.');$('comparison-preview').disabled=true;
    $('status').textContent='Loading your image locally…';$('error').hidden=true;$('drop').setAttribute('aria-busy','true');
    try{
      if(file.size>StipraImportProbe.MAX_BYTES)throw Error('16 MiB file limit exceeded');
      const bytes=new Uint8Array(await file.arrayBuffer());
      const imported=await StipraImport.ingest(bytes,{
        decoder:'browser-native-image/canvas-srgb',
        canvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},
        decode
      },{sourceName:file.name});
      if(version!==loadVersion)return;
      asset=imported;original=bytes;render();
    }catch(error){
      if(version!==loadVersion)return;
      $('error').textContent=error.message;$('error').hidden=false;
      $('status').textContent='Import rejected; existing separation retained.';
    }finally{if(version===loadVersion){importBusy=false;$('drop').setAttribute('aria-busy','false');$('comparison-preview').disabled=!renderValid;}}
  }
  function save(blob,filename){
    if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  const downloadCanvas=(view,filename)=>view.canvas.toBlob(blob=>save(blob,filename),'image/png');
  function syncScreenFields(){
    $('screen-mode').value=screenConfig.default.mode;
    $('screen-pitch').value=String(screenConfig.default.pitch);
    $('screen-angle').value=String(screenConfig.default.angle);
    $('screen-jitter').value=String(screenConfig.default.jitter);
    $('screen-seed').value=String(screenConfig.seed);
    $('screen-dot-scale').value=String(screenConfig.default.dotScale);$('screen-solid-threshold').value=String(screenConfig.default.solidThreshold);
  }
  function styleGuidance(style){
    return style.style.description+' Suitable: '+style.style.goodFor.join(', ')+'. Avoid: '+style.style.avoid.join('; ')+'. '+style.physicalScreens.map(p=>p.id+': '+(p.effectiveLpi===null?'unscreened':p.effectiveLpi+' LPI')).join(' · ')+' at '+style.dpi+' DPI. '+style.warnings.join(' ');
  }
  function variantsFor(id){
    const variants=id?StipraStyles.explain(id).variants:{},select=$('style-variant');select.replaceChildren();
    for(const [value,name] of [['default','Original starting recipe'],...Object.entries(variants).map(([key,v])=>[key,v.name])]){
      const option=document.createElement('option');option.value=value;option.textContent=name;select.appendChild(option);
    }
    select.disabled=Object.keys(variants).length===0;
  }
  function clearComparison(message=''){
    comparisonVersion++;pendingCandidate=null;
    const hadPreview=!$('comparison-results').hidden||$('comparison-results').getAttribute('aria-busy')==='true';
    $('comparison-results').hidden=true;$('comparison-results').setAttribute('aria-busy','false');
    $('comparison-current').replaceChildren();$('comparison-candidate').replaceChildren();$('comparison-use').disabled=true;
    $('comparison-status').textContent=hadPreview?message:'';
  }
  function candidateDescription(){
    const [id,variant]=$('comparison-recipe').value.split('/'),base=StipraStyles.explain(id);
    return {id,variant,description:variant==='default'?base.description:base.variants[variant].description};
  }
  for(const family of StipraStyles.list()){
    const group=document.createElement('optgroup');group.label=family.name;
    for(const [variant,name] of [['default','Original starting recipe'],...family.variants.map(v=>[v.id,v.name])]){
      const option=document.createElement('option');option.value=family.id+'/'+variant;option.textContent=name;group.appendChild(option);
    }
    $('comparison-recipe').appendChild(group);
  }
  $('comparison-recipe').value='editorial-halftone/forest-balanced';
  $('comparison-note').textContent=candidateDescription().description;
  $('comparison-recipe').addEventListener('change',()=>{clearComparison('Candidate changed. Preview again.');$('comparison-preview').disabled=!renderValid||importBusy;$('comparison-note').textContent=candidateDescription().description;});
  $('comparison-preview').addEventListener('click',async()=>{
    if(!asset||!renderValid||importBusy)return;
    clearComparison();const version=comparisonVersion;
    $('comparison-status').textContent='Preparing full-proof comparison…';$('comparison-results').setAttribute('aria-busy','true');$('comparison-preview').disabled=true;
    await new Promise(requestAnimationFrame);
    if(version!==comparisonVersion)return;
    try{
      const {id,variant}=candidateDescription(),dpi=Number($('style-dpi').value);
      const candidate=StipraStyles.resolve(id,{variant,dpi,paper:config.paper,seed:screenConfig.seed,screening:$('style-screening').value,...($('style-lpi').value?{lpi:Number($('style-lpi').value)}:{})});
      const {width,height}=result,trial=StipraScreen.apply(StipraSeparation.separate({width,height,rgba:asset.rgba},candidate.inkRecipe),candidate.screenRecipe);
      const current=canvas(width,height,result.preview),proposed=canvas(width,height,trial.preview);
      current.setAttribute('aria-label','Current full proof');proposed.setAttribute('aria-label','Candidate full proof');
      $('comparison-current').replaceChildren(current);$('comparison-candidate').replaceChildren(proposed);
      $('comparison-current-name').textContent=styleResolution?styleResolution.style.name:'Manual edits';$('comparison-candidate-name').textContent=candidate.style.name;
      const frequencies=candidate.physicalScreens.map(p=>p.id+': '+(p.effectiveLpi===null?'unscreened':p.effectiveLpi+' LPI')).join(' · ');
      $('comparison-settings').textContent=width+' × '+height+' px · '+dpi+' DPI · paper '+config.paper+' · seed '+screenConfig.seed+'. Candidate: '+candidate.inkRecipe.inks.length+' inks · '+frequencies+'.';
      pendingCandidate=candidate;$('comparison-results').hidden=false;$('comparison-use').disabled=false;
      $('comparison-status').textContent='Comparison ready. Exports still use your current treatment.';
    }catch(error){$('comparison-status').textContent='Comparison unavailable: '+error.message;}
    finally{if(version===comparisonVersion){$('comparison-preview').disabled=!renderValid||importBusy;$('comparison-results').setAttribute('aria-busy','false');}}
  });
  $('comparison-keep').addEventListener('click',()=>{clearComparison();$('comparison-status').textContent='Current treatment kept. Your edits and exports are unchanged.';$('recipe-comparison').querySelector('summary').focus();});
  $('comparison-use').addEventListener('click',()=>{
    if(!pendingCandidate||!renderValid||importBusy)return;
    const candidate=pendingCandidate;
    config=candidate.inkRecipe;screenConfig=candidate.screenRecipe;styleResolution=candidate;
    $('style').value=candidate.style.id;variantsFor(candidate.style.id);$('style-variant').value=candidate.style.variant;
    $('mode').value=config.mode;$('paper').value=config.paper;
    $('style-note').textContent=styleGuidance(candidate);
    inspection.solo=null;inspection.muted.clear();$('proof-paper').checked=true;$('paper-only').checked=false;
    controls();screenControls();syncScreenFields();render();
    $('comparison-status').textContent='Candidate applied. All inks are shown; exports now use this treatment.';$('recipe-comparison').querySelector('summary').focus();
  });
  document.querySelector('a[href="#recipe-comparison"]').addEventListener('click',event=>{if(!asset){event.preventDefault();$('file').focus();$('status').textContent='Import artwork before comparing recipes.';return;}$('recipe-comparison').open=true;});
  if(location.hash==='#recipe-comparison')$('recipe-comparison').open=true;
  function applyStyle(event){
    const id=$('style').value;
    if(event?.target.id==='style')variantsFor(id);
    if(!id){
      styleResolution=null;$('style-note').textContent='Manual adjustments remain available for every ink.';
      render();return;
    }
    try{
      const style=StipraStyles.resolve(id,{dpi:Number($('style-dpi').value),variant:$('style-variant').value,screening:$('style-screening').value,...($('style-lpi').value?{lpi:Number($('style-lpi').value)}:{})});
      config=style.inkRecipe;screenConfig=style.screenRecipe;styleResolution=style;
      $('mode').value=config.mode;$('paper').value=config.paper;
      $('style-note').textContent=styleGuidance(style);
      controls();screenControls();syncScreenFields();render();
    }catch(error){
      $('error').textContent=error.message;$('error').hidden=false;
      clearComparison('Resolve invalid settings before comparing.');$('comparison-preview').disabled=true;
      $('style').value='';renderValid=false;$('save-preview').disabled=true;$('save-plates').disabled=true;
    }
  }
  for(const id of ['style','style-variant','style-dpi','style-lpi','style-screening'])$(id).addEventListener('change',applyStyle);
  $('mode').addEventListener('change',()=>{
    styleResolution=null;config=$('mode').value==='spot'?spot():cmyk();
    $('paper').value=config.paper;screenConfig=freshScreen();
    $('style').value='';$('style-note').textContent='Manual separation; choose a style to start again.';
    syncScreenFields();
    try{
      controls();screenControls();
      render(); // A mode switch is a discrete action; do not leave stale plate images queued.
    }catch(error){
      $('status').textContent='Failed to change separation mode.';
      $('error').textContent=error.message;$('error').hidden=false;
    }
  });
  for(const id of ['proof-paper','paper-only','view-zoom'])$(id).addEventListener('change',inspectProof);
  $('reset-inspection').onclick=()=>{inspection.solo=null;inspection.muted.clear();$('paper-only').checked=false;inspectionControls();inspectProof();};
  $('marks-mm').addEventListener('change',schedule);
  $('ink-count').addEventListener('change',()=>{
    const count=Number($('ink-count').value);
    if(config.mode!=='spot'||!Number.isInteger(count)||count<2||count>8){$('error').textContent='Choose 2–8 spot inks.';$('error').hidden=false;$('ink-count').value=String(config.inks.length);return;}
    const colors=['#006043','#ff665d','#0d4dad','#e2a523'];
    config.inks=config.inks.slice(0,count);
    while(config.inks.length<count){const n=config.inks.length+1;let id='ink-'+n;while(config.inks.some(x=>x.id===id))id+='x';config.inks.push({id,name:'Ink '+n,color:colors[(n-1)%colors.length],source:'tone',gain:.5,gamma:1,threshold:0});}
    screenConfig.plates=Object.fromEntries(Object.entries(screenConfig.plates).filter(([id])=>config.inks.some(x=>x.id===id)));styleResolution=null;$('style').value='';controls();screenControls();inspectionControls();render();
  });
  $('paper').addEventListener('input',e=>{styleResolution=null;config.paper=e.target.value;schedule();});
  $('file').addEventListener('change',e=>load(e.target.files?.[0]));
  const drop=$('drop');
  for(const name of ['dragenter','dragover'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('over');});
  for(const name of ['dragleave','drop'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('over');});
  drop.addEventListener('drop',e=>{if(e.dataTransfer.files.length)load(e.dataTransfer.files[0]);});
  let exportLibrary;
  function exporter(){
    if(!exportLibrary)exportLibrary=new Promise((resolve,reject)=>{
      if(window.StipraExport)return resolve(window.StipraExport);
      const script=document.createElement('script');script.src=document.documentElement.dataset.exportScript;
      script.onload=()=>resolve(window.StipraExport);script.onerror=()=>{exportLibrary=null;reject(Error('Export tools could not load. Reconnect to load the app assets, then retry.'));};document.head.appendChild(script);
    });
    return exportLibrary;
  }
  async function packageExport(){
    if(!asset||!renderValid)throw Error('Import artwork and resolve invalid settings before exporting.');
    const snapshot={originalBytes:original.slice(),asset,inkRecipe:StipraSeparation.validate(config),screenRecipe:StipraScreen.config(screenConfig,config.inks.map(i=>i.id)),dpi:Number($('style-dpi').value),marksMm:Number($('marks-mm').value),paper:'recipe'};
    if(styleResolution)snapshot.style={...styleResolution,inkRecipe:snapshot.inkRecipe,screenRecipe:snapshot.screenRecipe};
    return (await exporter()).generate(snapshot);
  }
  $('save-preview').addEventListener('click',async()=>{
    if(!renderValid)return;
    const dpi=Number($('style-dpi').value),proof=canvas(result.width,result.height,result.preview);
    const pending=new Promise(resolve=>proof.toBlob(resolve,'image/png'));
    try{const lib=await exporter(),blob=await pending;
      save(new Blob([lib.physicalPNG(new Uint8Array(await blob.arrayBuffer()),dpi)],{type:'image/png'}),'stipra-overprint-preview.png');
    }catch(error){$('error').textContent=error.message;$('error').hidden=false;}
  });
  $('save-plates').addEventListener('click',async()=>{
    if(!renderValid||exportBusy)return;exportBusy=true;
    $('save-plates').disabled=true;$('save-plates').textContent='Preparing package…';
    try{const exported=await packageExport();save(new Blob([exported.bytes],{type:'application/zip'}),'stipra-print-package.zip');$('status').textContent='Print package saved locally. Print masters at 100%; inspect the PDF before printing.';}
    catch(error){$('error').textContent=error.message;$('error').hidden=false;}
    finally{exportBusy=false;$('save-plates').disabled=!renderValid;$('save-plates').textContent='Print package ZIP';}
  });
  $('save-recipe').addEventListener('click',()=>save(new Blob([JSON.stringify(StipraSeparation.validate(config),null,2)+'\n'],{type:'application/json'}),'stipra-separation-recipe.json'));
  $('screen-mode').addEventListener('change',e=>{styleResolution=null;screenConfig.default.mode=e.target.value;screenControls();schedule();});
  for(const [id,key] of [['screen-pitch','pitch'],['screen-angle','angle'],['screen-jitter','jitter'],['screen-dot-scale','dotScale'],['screen-solid-threshold','solidThreshold'],['screen-seed','seed']]){
    $(id).addEventListener('change',e=>{
      styleResolution=null;
      if(key==='seed')screenConfig.seed=Number(e.target.value);
      else screenConfig.default[key]=Number(e.target.value);
      screenControls();schedule();
    });
  }
  $('save-screen-recipe').addEventListener('click',()=>{
    const normalized=StipraExportPlan.screenConfigs(screenConfig,config.inks.map(i=>i.id)).production;
    save(new Blob([JSON.stringify(normalized,null,2)+'\n'],{type:'application/json'}),'stipra-screen-recipe.json');
  });
  controls();screenControls();inspectionControls();syncScreenFields();
  document.documentElement.dataset.stipraReady='true';
})();
