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
