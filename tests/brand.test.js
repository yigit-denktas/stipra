'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const Brand=require('../scripts/generate-stipra-mark.js'),Core=require('../src/core.js');
const ROOT=path.resolve(__dirname,'..'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('black geometry exists independently of any color as a continuous round-capped Bézier stroke',()=>{
  const s=Brand.sceneRecipe('silhouette'),resolved=Core.resolveRecipe(s);
  assert.equal(resolved.plates.length,1);
  assert.ok(s.layers.length>150&&s.layers.length<220,'dense, continuous geometric stroke');
  assert.ok(s.layers.every(x=>x.geometry.kind==='circle'&&x.geometry.radius===41));
  const centers=s.layers.map(x=>[x.geometry.x,x.geometry.y]);
  for(const [x,y] of centers)assert.ok(x>25&&x<455&&y>25&&y<455,'no overflow');
  for(let i=1;i<centers.length;i++){
    const d=Math.hypot(centers[i][0]-centers[i-1][0],centers[i][1]-centers[i-1][1]);
    assert.ok(d<10,'ribbon discs must overlap substantially without notches or accidental holes');
  }
  assert.match(Core.renderSvg(resolved),/<circle /);
  assert.match(Core.renderSvg(resolved),/fill="#222825"/);
});
test('a rigorously aligned matrix and density variant share exact coordinates, without random speckles',()=>{
  const plain=Brand.dotGrid('matrix'),weighted=Brand.dotGrid('density');
  assert.equal(plain.length,weighted.length);
  assert.ok(plain.length>350&&plain.length<700,'reasonable systematic dot count');
  const keys=x=>x.map(d=>[d.x,d.y,d.row,d.col,d.t]);
  assert.deepEqual(keys(plain),keys(weighted));
  const different=plain.filter((d,i)=>Math.abs(d.radius-weighted[i].radius)>.3);
  assert.ok(different.length>plain.length/3,'density is a designed radius progression, not a recolor');
  for(const dots of [plain,weighted]){
    const set=new Set(dots.map(d=>d.row+':'+d.col));
    assert.equal(set.size,dots.length);
    assert.ok(dots.every(d=>d.radius>=.6&&d.radius<=Brand.CANVAS/100));
    // Dot centers are on the same 11.8px lattice with fixed origin, not random positions.
    assert.ok(dots.every(d=>Math.abs((d.x-52)/11.8-d.col)<.0001));
  }
});
test('monochrome density is optically balanced by measurable area and intentional negative space',()=>{
  const b=Brand.balance(Brand.dotGrid('density'));
  assert.ok(Math.abs(b.centerX-240)<6,'horizontal mass center: '+b.centerX);
  assert.ok(Math.abs(b.centerY-240)<8,'vertical mass center: '+b.centerY);
  assert.ok(b.leftRightRatio>.9&&b.leftRightRatio<1.1,'too much weight on one side');
  assert.ok(b.dotCount>350);
});
test('physical overprint is two deliberate registered spot masks; no random third-black ink decoration',()=>{
  const r=Brand.makeRecipe(),scene=Core.resolveRecipe(r);
  assert.equal(r.inks.length,2);assert.equal(scene.plates.length,2);
  assert.deepEqual(r.inks.map(x=>x.id),['teal','coral']);
  const teal=new Set(r.layers.filter(l=>l.plateId==='teal-master').map(l=>l.id.split('-').slice(1).join('-')));
  const coral=new Set(r.layers.filter(l=>l.plateId==='coral-master').map(l=>l.id.split('-').slice(1).join('-')));
  const shared=[...teal].filter(x=>coral.has(x));
  assert.ok(shared.length>15&&shared.length<150,'controlled real overprint region '+shared.length);
  assert.equal(new Set([...teal,...coral]).size,Brand.dotGrid('overprint').length);
  const svg=Core.renderSvg(scene);
  assert.match(svg,/data-plate="teal-master"/);assert.match(svg,/data-plate="coral-master"/);
  assert.match(svg,/mix-blend-mode:multiply/);
  for(const c of ['#177f8d','#e7604c'])assert.ok(svg.includes(c));
  assert.doesNotMatch(svg,/data-plate="key-master"|<script\b|onload=|xlink:href=/);
  assert.notEqual(Core.renderSvg(scene,{plateId:'teal-master'}),Core.renderSvg(scene,{plateId:'coral-master'}));
  assert.ok(r.layers.every(l=>l.coverage===1));
});
test('public generated assets are repeatable, separated and leave original owner logo untouched',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-logo-v2-'));
  try{
    const out=path.join(root,'preview'),a=Brand.generate(out);
    assert.equal(a.manifest.construction.randomness,0);
    assert.equal(a.manifest.construction.inkLayers,2);
    assert.deepEqual(a.manifest.construction.variants,['silhouette','matrix','density','overprint']);
    assert.match(a.manifest.status,/original.*unchanged/);
    const originalHashes=a.manifest.files.map(item=>{
      const bytes=fs.readFileSync(path.join(out,item.name));
      assert.equal(hash(bytes),item.sha256);
      assert.equal(bytes.length,item.bytes);
      return item.sha256;
    });
    const again=Brand.generate(out);
    assert.deepEqual(again.manifest.files.map(f=>f.sha256),originalHashes);
    for(const variant of ['matrix','density','silhouette','overprint'])
      assert.ok(fs.existsSync(path.join(out,'stipra-mark-'+variant+'.svg')));
    for(const plate of ['teal','coral']){
      const bytes=fs.readFileSync(path.join(out,'stipra-mark-'+plate+'.svg'),'utf8');
      assert.match(bytes,/fill="#000000"/);
      assert.match(bytes,/Uncalibrated preview/);
    }
    const existing=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
    assert.match(existing,/src="logo_for_Readme\.svg"/);
    assert.ok(fs.existsSync(path.join(ROOT,'logo_for_Readme.svg')));
    assert.equal(fs.readFileSync(path.join(out,'stipra-mark.svg'),'utf8'),
      Core.renderSvg(Core.resolveRecipe(Brand.makeRecipe())));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
