'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const Styles=require('../src/styles.js'),Sep=require('../src/separation.js'),Screen=require('../src/screening.js');
const ROOT=path.resolve(__dirname,'..');
const EXPECTED=['portrait-duotone','editorial-halftone','bold-spot-poster','clean-linework'];
function pixels(w=48,h=48){
  const rgba=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=(y*w+x)*4;
    rgba[k]=Math.round(x/w*255);
    rgba[k+1]=Math.round(y/h*255);
    rgba[k+2]=Math.round((1-(x+y)/(w+h))*255);
    rgba[k+3]=255;
  }
  return {width:w,height:h,rgba};
}
test('exactly four initial styles, each with intent, suitable and unsuitable inputs',()=>{
  const names=Styles.list();
  assert.deepEqual(names.map(x=>x.id),EXPECTED);
  for(const item of names){
    assert.match(item.name,/\S/);assert.match(item.description,/\S/);
    assert.ok(item.goodFor.length>1);assert.ok(item.avoid.length>1);
    assert.ok(item.inks.length>=2);assert.ok(item.lpi>0);
    const e=Styles.explain(item.id);
    assert.equal(e.version,1);
    assert.ok(e.screen.default&&e.screen.plates);
  }
  assert.throws(()=>Styles.explain('not-a-style'),/unknown/);
});
test('browser UMD and Node require resolve bit-for-bit matching settings',()=>{
  const source=fs.readFileSync(path.join(ROOT,'src/styles.js'),'utf8');
  const context={StipraSeparation:Sep,StipraScreen:Screen};
  vm.runInNewContext(source,context,{filename:'styles.js'});
  const browser=context.StipraStyles;
  assert.equal(typeof browser.resolve,'function');
  for(const id of EXPECTED){
    const node=Styles.resolve(id,{dpi:300,seed:87});
    const client=browser.resolve(id,{dpi:300,seed:87});
    assert.equal(JSON.stringify(client),JSON.stringify(node));
    assert.deepEqual(Sep.validate(node.inkRecipe),node.inkRecipe);
    assert.deepEqual(Screen.config(node.screenRecipe,node.inkRecipe.inks.map(ink=>ink.id)),node.screenRecipe);
  }
});
test('DPI changes pixel pitch, preserving desired physical halftone frequency where supported',()=>{
  for(const id of EXPECTED){
    const a=Styles.resolve(id,{dpi:300}),b=Styles.resolve(id,{dpi:600});
    assert.equal(a.style.id,id);assert.equal(b.style.id,id);
    assert.equal(a.targetLpi,b.targetLpi);
    assert.ok(Math.abs(a.effectiveLpi-b.effectiveLpi)<.02);
    assert.ok(Math.abs(b.screenRecipe.default.pitch-2*a.screenRecipe.default.pitch)<.02);
    assert.equal(a.screenRecipe.plates[a.inkRecipe.inks[0].id].registration.x,0);
  }
  const low=Styles.resolve('clean-linework',{dpi:72});
  assert.notEqual(low.effectiveLpi,low.targetLpi);
  assert.ok(low.warnings.some(x=>/pitch bounds/i.test(x)));
});
test('normalized style plates actually render, preserve alpha and create distinct masks',()=>{
  const input=pixels();
  for(const id of EXPECTED){
    const r=Styles.resolve(id,{dpi:300});
    const sep=Sep.separate(input,r.inkRecipe);
    const screened=Screen.apply(sep,r.screenRecipe);
    assert.equal(screened.masks.length,r.inkRecipe.inks.length);
    assert.equal(screened.width,input.width);assert.equal(screened.height,input.height);
    for(const mask of screened.masks)assert.equal(mask.coverage.length,48*48);
    assert.notDeepEqual(sep.masks[0].coverage,sep.masks[1].coverage,'all plates duplicated for '+id);
    const copy=Styles.resolve(id,{dpi:300});
    assert.equal(JSON.stringify(copy),JSON.stringify(r));
  }
});
test('palette override and strength validated; suggestions use explicit human intent only',()=>{
  const r=Styles.resolve('editorial-halftone',{dpi:300,colors:{accent:'#336677'},strength:.7});
  assert.equal(r.inkRecipe.inks[1].color,'#336677');
  assert.ok(r.inkRecipe.inks[1].gain<.38);
  assert.throws(()=>Styles.resolve('editorial-halftone',{colors:{fake:'#aabbcc'}}),/unknown ink/);
  assert.throws(()=>Styles.resolve('portrait-duotone',{dpi:20}),/dpi/);
  assert.throws(()=>Styles.resolve('portrait-duotone',{unknown:true}),/unknown option/);
  assert.equal(Styles.suggest({intent:'portrait'})[0].id,'portrait-duotone');
  assert.equal(Styles.suggest({intent:'poster'})[0].id,'bold-spot-poster');
  assert.equal(Styles.suggest({intent:'linework',hasFineText:true})[0].id,'clean-linework');
  assert.match(Styles.suggest({intent:'linework',hasFineText:true})[0].warning,/Fine text/);
});
test('agent CLI prints discoverable and explainable style identifiers',()=>{
  const cmd=path.join(ROOT,'bin/stipra.js');
  const list=JSON.parse(cp.execFileSync(process.execPath,[cmd,'styles','list'],{encoding:'utf8'}));
  assert.deepEqual(list.map(s=>s.id),EXPECTED);
  const explanation=JSON.parse(cp.execFileSync(process.execPath,[cmd,'styles','explain','clean-linework'],{encoding:'utf8'}));
  assert.equal(explanation.id,'clean-linework');
  const recommendations=JSON.parse(cp.execFileSync(process.execPath,[cmd,'styles','suggest','--intent','editorial'],{encoding:'utf8'}));
  assert.equal(recommendations[0].id,'editorial-halftone');
});
test('browser source exposes initial Styles without hiding manual advanced controls',()=>{
  const html=fs.readFileSync(path.join(ROOT,'web/stipra/index.html'),'utf8');
  const app=fs.readFileSync(path.join(ROOT,'web/stipra/app.js'),'utf8');
  assert.match(html,/src="\.\.\/\.\.\/src\/styles\.js"/);
  assert.match(html,/id="style"/);
  for(const id of EXPECTED)assert.ok(html.includes('value="'+id+'"'));
  assert.match(app,/StipraStyles\.resolve/);
  assert.match(html,/id="screen-settings"/);
});

test('editorial variants isolate a neutral tonal key and warm material instead of duplicating color masks',()=>{
  const rgba=new Uint8ClampedArray([0,0,0,255,163,163,163,255,50,150,40,255,255,255,255,255]);
  const r=Styles.resolve('editorial-halftone',{variant:'warm-third',dpi:300});
  const sep=Sep.separate({width:4,height:1,rgba},r.inkRecipe);
  assert.ok(sep.masks[2].coverage[1]>sep.masks[2].coverage[2]);
  assert.equal(sep.masks[2].coverage[0],0);
  assert.equal(sep.masks[2].coverage[3],0);
  assert.equal(r.physicalScreens[0].effectiveLpi,null);
  assert.equal(r.physicalScreens[1].effectiveLpi,50);
  assert.equal(r.style.variantVersion,1);
  assert.throws(()=>Styles.resolve('clean-linework',{variant:'tonal-key'}),/variant/);
  assert.throws(()=>Styles.resolve('editorial-halftone',{variant:['tonal-key']}),/variant/);
  assert.throws(()=>Styles.resolve('editorial-halftone',{variant:'__proto__'}),/variant/);
  assert.throws(()=>Styles.resolve('editorial-halftone',{lpi:0}),/lpi/);
  assert.throws(()=>Styles.resolve('editorial-halftone',{screening:'fake'}),/screening/);
});
test('browser and CLI module render identical variant masks with physical and unscreened overrides',()=>{
  const context={StipraSeparation:Sep,StipraScreen:Screen};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'src/styles.js'),'utf8'),context);
  for(const variant of ['default','tonal-key','warm-third'])for(const dpi of [150,300,600]){
    const options={variant,dpi,lpi:35,screening:'authored',seed:42};
    const r=Styles.resolve('editorial-halftone',options),b=context.StipraStyles.resolve('editorial-halftone',options);
    assert.equal(JSON.stringify(r),JSON.stringify(b));
    const input=pixels();
    assert.deepEqual(Screen.apply(Sep.separate(input,r.inkRecipe),r.screenRecipe).preview,
      Screen.apply(Sep.separate(input,b.inkRecipe),b.screenRecipe).preview);
    assert.ok(Math.abs(r.physicalScreens[1].effectiveLpi-35)<.001);
    const raw=Styles.resolve('editorial-halftone',{...options,screening:'unscreened'});
    assert.ok(raw.physicalScreens.every(p=>p.effectiveLpi===null));assert.equal(raw.effectiveLpi,null);
    const sep=Sep.separate(input,raw.inkRecipe),screened=Screen.apply(sep,raw.screenRecipe);
    sep.masks.forEach((m,i)=>assert.deepEqual(m.coverage,screened.masks[i].coverage));
  }
});
test('package CLI rejects detached style controls and accepts physical variant settings',()=>{
  const {args}=require('../bin/package.js');
  assert.throws(()=>args(['--input','x.png','--config','x.json','--out','x.zip','--lpi','50']),/require --style/);
  const parsed=args(['--input','x.png','--style','editorial-halftone','--out','x.zip','--style-variant','tonal-key','--lpi','40']);
  assert.equal(parsed['--style-variant'],'tonal-key');assert.equal(parsed['--lpi'],'40');
});
test('real package CLI preserves default and new variant recipes, source and browser-equivalent proof pixels',async()=>{
  const os=require('node:os'),{Canvas,loadImage}=require('skia-canvas'),JSZip=require('jszip');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-style-parity-'));
  try{
    const c=new Canvas(48,48),ctx=c.getContext('2d');ctx.fillStyle='#a3a3a3';ctx.fillRect(0,0,48,48);
    ctx.fillStyle='#2876bc';ctx.fillRect(0,0,24,48);
    const original=Buffer.from(await c.toBuffer('png')),file=path.join(dir,'input.png'),out=path.join(dir,'result.zip');fs.writeFileSync(file,original);
    const pixels=ctx.getImageData(0,0,48,48).data;
    for(const [id,variant] of [['editorial-halftone','warm-third'],['editorial-halftone','forest-depth'],['editorial-halftone','coast-duotone'],['portrait-duotone','blue-pink'],['bold-spot-poster','process-cmyk']]){
    cp.execFileSync(process.execPath,[path.join(ROOT,'bin/stipra.js'),'package','--input',file,'--style',id,'--style-variant',variant,'--dpi','600','--lpi','50','--seed','42','--out',out]);
    const zip=await JSZip.loadAsync(fs.readFileSync(out)),manifest=JSON.parse(await zip.file('manifest.json').async('string'));
    const style=Styles.resolve(id,{variant,dpi:600,lpi:50,seed:42});
    assert.equal(manifest.paper,style.inkRecipe.paper);assert.equal(manifest.style.variant,variant);
    assert.deepEqual(await zip.file('source/original.png').async('nodebuffer'),original);
    assert.deepEqual(JSON.parse(await zip.file('recipe/style.json').async('string')),style);
    const expected=Screen.apply(Sep.separate({width:48,height:48,rgba:pixels},style.inkRecipe),style.screenRecipe);
    const decoded=await loadImage(await zip.file('proof/composite.png').async('nodebuffer'));ctx.drawImage(decoded,0,0);
    assert.deepEqual(ctx.getImageData(0,0,48,48).data,expected.preview);
    assert.ok(JSON.parse(await zip.file('report/diagnostics.json').async('string')).suitability);
    fs.unlinkSync(out);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('attributed variants retain versioned identity and agree in full browser and Node engines',()=>{
  const context=vm.createContext({Uint8Array,Uint8ClampedArray,Float64Array,Math,Set,Map,TypeError});
  for(const name of ['separation','screening','styles'])vm.runInContext(fs.readFileSync(path.join(ROOT,'src',name+'.js'),'utf8'),context);
  const input=pixels(24,24);input.rgba[3]=0;
  let count=0;
  for(const id of EXPECTED){
    for(const variant of Object.keys(Styles.explain(id).variants)){
      count++;
      for(const dpi of [150,300,600]){
        const opts={variant,dpi,seed:42,lpi:35};
        const node=Styles.resolve(id,opts),browser=context.StipraStyles.resolve(id,opts);
        assert.equal(JSON.stringify(node),JSON.stringify(browser));
        const a=Screen.apply(Sep.separate(input,node.inkRecipe),node.screenRecipe);
        const b=context.StipraScreen.apply(context.StipraSeparation.separate(input,browser.inkRecipe),browser.screenRecipe);
        assert.deepEqual(Array.from(a.preview),Array.from(b.preview));
        a.masks.forEach((m,i)=>{assert.deepEqual(Array.from(m.coverage),Array.from(b.masks[i].coverage));assert.equal(m.coverage[0],0);});
        assert.ok(node.style.variantVersion>=1);
        assert.ok(node.physicalScreens.filter(p=>p.mode!=='solid').every(p=>Math.abs(p.effectiveLpi-35)<.001));
        if(!['tonal-key','warm-third'].includes(variant))assert.ok(node.style.references.every(ref=>/^https:\/\//.test(ref.url))&&node.style.references.length>0);
      }
    }
  }
  assert.equal(count,9);
});

test('four defaults and earlier editorial variants retain their saved ink and screen recipes',()=>{
  const baseline=require('./fixtures/style-v1-baselines.json'),crypto=require('node:crypto');
  for(const row of baseline.records){
    const r=Styles.resolve(row.id,{variant:row.variant,dpi:baseline.dpi,seed:baseline.seed});
    assert.equal(crypto.createHash('sha256').update(JSON.stringify({inkRecipe:r.inkRecipe,screenRecipe:r.screenRecipe})).digest('hex'),row.sha256,row.id+'/'+row.variant);
  }
});

test('focused photo variants avoid clipped keys and restrict warm density in a cool sky',()=>{
  const input={width:4,height:1,rgba:Uint8Array.from([10,20,10,255,30,50,30,255,90,150,220,255,255,255,255,255])};
  const forest=Sep.separate(input,Styles.resolve('editorial-halftone',{variant:'forest-depth'}).inkRecipe);
  assert.ok(forest.masks[0].coverage[0]<235);
  assert.ok(forest.masks[0].coverage[1]<forest.masks[0].coverage[0]);
  const contrast=Sep.separate(input,Styles.resolve('editorial-halftone',{variant:'forest-contrast'}).inkRecipe);
  assert.ok(contrast.masks[0].coverage[0]>forest.masks[0].coverage[0],'contrast candidate anchors the deepest shadow');
  assert.ok(contrast.masks[0].coverage[1]<contrast.masks[0].coverage[0]);
  assert.deepEqual(contrast.masks[1].coverage,forest.masks[1].coverage,'chroma pass is held constant');
  assert.equal(contrast.masks[0].coverage[3],0);
  const coast=Sep.separate(input,Styles.resolve('editorial-halftone',{variant:'coast-duotone'}).inkRecipe);
  assert.ok(coast.masks[0].coverage[2]>100);
  assert.ok(coast.masks[1].coverage[2]<10);
  assert.ok(coast.masks.every(p=>p.coverage[3]===0));
});
