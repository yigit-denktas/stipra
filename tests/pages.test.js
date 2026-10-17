'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build,SOURCES}=require('../scripts/build-pages.js');
const ROOT=path.resolve(__dirname,'..');
test('Cloudflare Pages build emits one self-contained app under /stipra, no duplicate production HTML',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-pages-'));
  try{
    const built=build(out);
    assert.equal(built.app,'/stipra/');
    const html=fs.readFileSync(path.join(out,'stipra/index.html'),'utf8');
    const source=fs.readFileSync(path.join(ROOT,'web/stipra/index.html'),'utf8');
    assert.ok(source.includes('screen-mode')&&html.includes('screen-mode'));
    assert.ok(!html.includes('../../src/'),'published app must resolve its own assets');
    for(const [,name] of SOURCES) {
      assert.ok(html.includes('./assets/'+name),'app must reference '+name);
      assert.ok(fs.existsSync(path.join(out,'stipra/assets',name)));
    }
    assert.equal(fs.existsSync(path.join(out,'stipra/browser-smoke.html')),false,'tests must not be published');
    assert.equal(fs.existsSync(path.join(out,'examples')),false,'no duplicated demo tree');
    assert.equal(fs.existsSync(path.join(out,'index.html')),false,'root should only redirect; no copy of the app');
    assert.match(fs.readFileSync(path.join(out,'_redirects'),'utf8'),/\/ \/stipra\/ 302/);
    assert.match(fs.readFileSync(path.join(out,'_headers'),'utf8'),/connect-src 'none'/);
    const files=fs.readdirSync(path.join(out,'stipra'));
    assert.deepEqual(files.sort(),['assets','brand','guide','index.html','shared.css']);
    assert.ok(fs.existsSync(path.join(out,'stipra/brand/stipra-mark.svg')));
    assert.ok(fs.existsSync(path.join(out,'stipra/brand/stipra-mark-teal.svg')));
    assert.ok(fs.existsSync(path.join(out,'stipra/brand/stipra-mark-coral.svg')));
    assert.ok(fs.existsSync(path.join(out,'stipra/brand/stipra-mark-silhouette.svg')));
    for(const variant of ['matrix','density','overprint'])
      assert.ok(fs.existsSync(path.join(out,'stipra/brand/stipra-mark-'+variant+'.svg')));
  }finally{fs.rmSync(out,{force:true,recursive:true});}
});
test('build copies exact source JS, preserves real script order and is deterministic',()=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-pages-'));
  try{
    const first=build(out);
    const content=first.files.map(n=>fs.readFileSync(path.join(out,n)));
    const second=build(out);
    for(let i=0;i<content.length;i++)assert.deepEqual(content[i],fs.readFileSync(path.join(out,second.files[i])));
    for(const [source,dest] of SOURCES){
      assert.deepEqual(fs.readFileSync(path.join(ROOT,source)),fs.readFileSync(path.join(out,'stipra/assets',dest)));
    }
    const html=fs.readFileSync(path.join(out,'stipra/index.html'),'utf8');
    const tags=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(tags,['./assets/svg.js','./assets/probe.js','./assets/asset.js','./assets/separation.js','./assets/screening.js','./assets/styles.js','./assets/export-plan.js','./assets/plate-diagnostics.js','./assets/app.js']);
  }finally{fs.rmSync(out,{force:true,recursive:true});}
});

test('Stipra layout keeps one source of truth and exposes distinct artwork, plates and inspector',()=>{
  const html=fs.readFileSync(path.join(ROOT,'web/stipra/index.html'),'utf8');
  const js=fs.readFileSync(path.join(ROOT,'web/stipra/app.js'),'utf8');
  assert.match(html,/id="hero"\s+class="hero-grid"/);
  assert.match(html,/id="plates"\s+class="plate-grid"/);
  assert.match(html,/id="inspector"\s+class="inspector"/);
  assert.match(html,/id="diagnostics"/);
  assert.match(js,/StipraDiagnostics\.inspect/);
  assert.match(html,/grid-template-columns:minmax\(0,1fr\) minmax\(280px,318px\)/);
  assert.match(html,/@media\(max-width:680px\)/);
  assert.match(html,/max-width:100%/);
  assert.match(js,/\$\('hero'\)\.replaceChildren\(\)/);
  assert.match(js,/\$\('plates'\)\.replaceChildren\(\)/);
  for(const id of ['file','mode','paper','inks','screen-inks','screen-mode','screen-pitch','screen-angle','screen-jitter','screen-seed','save-preview','save-plates','save-recipe','save-screen-recipe']){
    assert.ok(html.includes('id="'+id+'"'),'Required control missing: '+id);
  }
  assert.match(html,/<details id="screen-settings"/);
  assert.match(js,/document\.createElement\('details'\)/);
});
