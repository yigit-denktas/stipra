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
  let asset=null,result=null,original=null,config=spot(),views=[];
  const freshScreen=()=>({version:1,seed:142,default:{mode:'solid',pitch:12,angle:0,jitter:0,dotScale:1,solidThreshold:0.9},plates:{}});
  let screenConfig=freshScreen();
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
      if(type==='range'){input.min=label==='Match radius'?'0.05':'0';input.max=label==='Threshold'?'0.95':label==='Match radius'?'1':'2';input.step='0.05';}
    }
    input.addEventListener('input',()=>{callback(type==='range'?Number(input.value):input.value);schedule();});
    div.appendChild(input);where.appendChild(div);
    return div;
  };
  function controls(){
    const host=$('inks');host.replaceChildren();
    for(const ink of config.inks){
      const box=document.createElement('section');box.className='ink';box.dataset.ink=ink.id;
      const h=document.createElement('div');h.className='ink-title';h.textContent=ink.name;box.appendChild(h);
      field(box,'Ink color',ink.color,'color',v=>ink.color=v);
      if(config.mode==='spot'){
        field(box,'Source',ink.source,'select',v=>{
          ink.source=v;
          if(v==='match'){ink.target=ink.target||ink.color;ink.tolerance=ink.tolerance||0.45;}
          else {delete ink.target;delete ink.tolerance;}
          controls();
        },[['darkness','Darkness'],['luminance','Brightness'],['red','Red channel'],['green','Green channel'],['blue','Blue channel'],['match','Match a color'],['cyan','CMYK cyan'],['magenta','CMYK magenta'],['yellow','CMYK yellow'],['black','CMYK black']]);
        if(ink.source==='match'){
          field(box,'Match color',ink.target,'color',v=>ink.target=v);
          field(box,'Match radius',ink.tolerance,'range',v=>ink.tolerance=Math.max(0.05,v));
        }
      }
      field(box,'Threshold',ink.threshold||0,'range',v=>ink.threshold=v);
      field(box,'Strength',ink.gain??1,'range',v=>ink.gain=v);
      host.appendChild(box);
    }
  }
  function screenControls(){
    const host=$('screen-inks');host.replaceChildren();
    for(const ink of config.inks){
      const section=document.createElement('section');section.className='ink';
      const heading=document.createElement('div');heading.className='ink-title';heading.textContent=ink.name+' screen';section.appendChild(heading);
      function field(label,name,value,min,max,step){
        const wrap=document.createElement('div');wrap.className='field';
        const el=document.createElement('input'),cap=document.createElement('label');
        el.type='number';el.id='screen-'+ink.id+'-'+name;cap.htmlFor=el.id;cap.textContent=label;
        el.value=String(value);el.min=String(min);el.max=String(max);el.step=String(step);
        el.addEventListener('change',()=>{
          const number=Number(el.value);
          screenConfig.plates[ink.id]??={};
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
        screenConfig.plates[ink.id]??={};
        if(select.value)screenConfig.plates[ink.id].mode=select.value;
        else delete screenConfig.plates[ink.id].mode;
        schedule();
      });
      row.append(label,select);section.appendChild(row);
      const customAngle=screenConfig.plates[ink.id]?.angle??screenConfig.default.angle;
      field('Ink angle (°)','angle',customAngle,-180,180,1);
      field('Registration x (px)','x',screenConfig.plates[ink.id]?.registration?.x??0,-50,50,1);
      field('Registration y (px)','y',screenConfig.plates[ink.id]?.registration?.y??0,-50,50,1);
      host.appendChild(section);
    }
  }
  function canvas(width,height,rgba){
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d'),data=ctx.createImageData(width,height);
    data.data.set(rgba);ctx.putImageData(data,0,0);return c;
  }
  function show(name,raw,detail){
    const figure=document.createElement('figure');figure.className='view';
    const img=canvas(asset.metadata.oriented.width,asset.metadata.oriented.height,raw);
    img.setAttribute('aria-label',name);figure.appendChild(img);
    const caption=document.createElement('figcaption'),strong=document.createElement('strong');
    strong.textContent=name;caption.appendChild(strong);
    if(detail){
      const small=document.createElement('small');small.className='muted';small.textContent=detail;caption.appendChild(small);
    }
    figure.appendChild(caption);$('grid').appendChild(figure);return {canvas:img,name};
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;scheduled=true;
    Promise.resolve().then(()=>{scheduled=false;render();});
  }
  function render(){
    $('paper').value=config.paper;
    $('error').hidden=true;
    if(!asset)return;
    try{
      const w=asset.metadata.oriented.width,h=asset.metadata.oriented.height;
      const baseline=StipraSeparation.separate({width:w,height:h,rgba:asset.rgba},config);
      result=StipraScreen.apply(baseline,screenConfig);
      $('grid').replaceChildren();views=[];
      views.push(show('Original',asset.rgba));
      views.push(show('Simulated overprint',result.preview));
      for(const ink of result.masks){
        const grayscale=StipraSeparation.plateRGBA(ink.coverage);
        const percent=result.stats.inks.find(x=>x.id===ink.id).meanCoverage*100;
        views.push(show(ink.name+' plate',grayscale,percent.toFixed(1)+'% mean ink coverage'));
      }
      $('status').textContent=config.mode.toUpperCase()+' · '+w+' × '+h+' px · '+result.masks.length+' physical ink passes';
      $('meta').textContent=result.warning+' · Screen seed '+result.recipe.seed+'.';
      $('save-preview').disabled=false;$('save-plates').disabled=false;
    }catch(error){
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
    $('status').textContent='Loading your image locally…';$('error').hidden=true;
    try{
      if(file.size>StipraImportProbe.MAX_BYTES)throw Error('16 MiB file limit exceeded');
      const bytes=new Uint8Array(await file.arrayBuffer());
      const imported=await StipraImport.ingest(bytes,{
        canvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},
        decode
      },{sourceName:file.name});
      asset=imported;original=bytes;render();
    }catch(error){
      $('error').textContent=error.message;$('error').hidden=false;
      $('status').textContent='Import rejected; existing separation retained.';
    }
  }
  function save(blob,filename){
    if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  const downloadCanvas=(view,filename)=>view.canvas.toBlob(blob=>save(blob,filename),'image/png');
  $('mode').addEventListener('change',()=>{
    config=$('mode').value==='spot'?spot():cmyk();
    $('paper').value=config.paper;screenConfig=freshScreen();
    try{
      controls();screenControls();
      render(); // A mode switch is a discrete action; do not leave stale plate images queued.
    }catch(error){
      $('status').textContent='Failed to change separation mode.';
      $('error').textContent=error.message;$('error').hidden=false;
    }
  });
  $('paper').addEventListener('input',e=>{config.paper=e.target.value;schedule();});
  $('file').addEventListener('change',e=>load(e.target.files?.[0]));
  const drop=$('drop');
  for(const name of ['dragenter','dragover'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add('over');});
  for(const name of ['dragleave','drop'])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove('over');});
  drop.addEventListener('drop',e=>{if(e.dataTransfer.files.length)load(e.dataTransfer.files[0]);});
  $('save-preview').addEventListener('click',()=>{if(result)downloadCanvas(views[1],'stipra-overprint-preview.png');});
  $('save-plates').addEventListener('click',()=>{if(result)for(let i=2;i<views.length;i++)downloadCanvas(views[i],'stipra-'+result.masks[i-2].id+'-plate.png');});
  $('save-recipe').addEventListener('click',()=>save(new Blob([JSON.stringify(StipraSeparation.validate(config),null,2)+'\n'],{type:'application/json'}),'stipra-separation-recipe.json'));
  $('screen-mode').addEventListener('change',e=>{screenConfig.default.mode=e.target.value;schedule();});
  for(const [id,key] of [['screen-pitch','pitch'],['screen-angle','angle'],['screen-jitter','jitter'],['screen-seed','seed']]){
    $(id).addEventListener('change',e=>{
      if(key==='seed')screenConfig.seed=Number(e.target.value);
      else screenConfig.default[key]=Number(e.target.value);
      schedule();
    });
  }
  $('save-screen-recipe').addEventListener('click',()=>{
    const normalized=StipraScreen.config(screenConfig,config.inks.map(i=>i.id));
    save(new Blob([JSON.stringify(normalized,null,2)+'\n'],{type:'application/json'}),'stipra-screen-recipe.json');
  });
  controls();screenControls();
})();
