'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),JSZip=require('jszip'),{Canvas}=require('skia-canvas');
const {mapRegions,coverageFromRGBA}=require('../src/structured/regions'),{regionProject,replayRegions}=require('../src/structured/project'),{depthCoverage,labelCoverage}=require('../src/structured/auxiliary');
const {freezeProject}=require('../src/source-project'),{openArchive}=require('../src/archive'),Print=require('../src/print-package'),{readRegions}=require('../scripts/reproduce-regions');
const provenance={kind:'authored',producer:{name:'test procedural artwork',version:'1'}};
const source=()=>({width:2,height:1,regions:[{id:'front',name:'Foreground',role:'coverage',coverage:new Uint8Array([128,255]),provenance},{id:'back',name:'Background',role:'coverage',coverage:new Uint8Array([128,64]),provenance}]});
const mapping=(combine='max')=>({version:1,paper:'#ffffff',inks:[{id:'green',name:'Green',color:'#006043',combine,regions:[{id:'front'},{id:'back'}]}]});
test('regions remain independent from inks; overlap is explicit and fractional',()=>{
  assert.deepEqual([...mapRegions(source(),mapping()).input.inks[0].coverage],[128,255]);
  assert.deepEqual([...mapRegions(source(),mapping('over')).input.inks[0].coverage],[192,255]);
  const s=source(),m=mapping();m.inks.push({...m.inks[0],id:'coral',color:'#ff665d',regions:[{id:'front',strength:.5}]});
  const result=mapRegions(s,m);assert.deepEqual([...result.input.inks[1].coverage],[64,128]);s.regions[0].coverage.fill(0);assert.equal(result.input.inks[1].coverage[1],128);
  assert.throws(()=>mapRegions({...source(),regions:[{...source().regions[0],role:'depth'}]},mapping()),/convert depth/);
  assert.throws(()=>mapRegions(source(),{...mapping(),version:2}),/version/);
  assert.throws(()=>mapRegions(source(),{...mapping(),inks:[{...mapping().inks[0],combine:'add'}]}),/max or over/);
  assert.throws(()=>mapRegions({...source(),regions:[{...source().regions[0],provenance:undefined}]},mapping()),/provenance/);
  assert.throws(()=>coverageFromRGBA(new Uint8Array([255,0,0,255]),'dark-on-light'),/neutral/);
  assert.deepEqual([...coverageFromRGBA(new Uint8Array([255,0,0,0]),'dark-on-light')],[0]);
});
test('region projects preserve mapping and raw coverage without executing sources',()=>{
  const s=source(),m=mapping('over'),p=regionProject(s,m);assert.deepEqual(replayRegions(p).input,mapRegions(s,m).input);
  s.regions[0].coverage.fill(0);assert.equal(replayRegions(p).input.inks[0].coverage[0],192);
  const frozen=freezeProject(p,2,1);p.artifacts[1].bytes.fill(0);assert.equal(frozen.artifacts[1].bytes[0],128);
  assert.throws(()=>freezeProject({...frozen,frame:{...frozen.frame,width:3}},2,1),/frame/);
  assert.throws(()=>freezeProject({...frozen,artifacts:[...frozen.artifacts,frozen.artifacts[0]]},2,1),/duplicate/);
  assert.throws(()=>freezeProject({...frozen,artifacts:[{...frozen.artifacts[0],url:'https://example.com'}]},2,1),/unknown field/);
});
test('optional source sidecars replay exactly; snapshot-only packages remain supported',async()=>{
  const mapped=mapRegions(source(),mapping('over')),project=regionProject(source(),mapping('over'));
  project.artifacts.push({id:'code',name:'source.js',role:'sketch-source',mediaType:'text/javascript',bytes:new TextEncoder().encode('throw Error("NEVER EXECUTE")')});
  const pending=Print.generateLayers({input:mapped.input,sourceProject:project,dpi:300});project.artifacts.at(-1).bytes.fill(0);
  const result=await pending,replay=await readRegions(result.zip),out=await Print.generateLayers(replay);
  assert.equal(result.manifest.sourceProject.artifacts,4);
  assert.deepEqual(out.parts.get('source/project/files/code.bin'),result.parts.get('source/project/files/code.bin'));
  for(const name of ['plates/ink-01-green.png','screened/ink-01-green.png','proof/composite.png'])assert.deepEqual(out.parts.get(name),result.parts.get(name));
  const normal=await Print.generateLayers({input:mapped.input});assert.equal(normal.manifest.sourceProject,undefined);
  const zip=await JSZip.loadAsync(result.zip);zip.file('source/project/files/code.bin','tampered');
  await assert.rejects(readRegions(await zip.generateAsync({type:'nodebuffer'})),/hash mismatch/);
});
test('bounded archive reader rejects traversal, duplicate names, forged sizes and archive budgets',async()=>{
  let zip=new JSZip();zip.file('../secret.txt','bad');await assert.rejects(openArchive(await zip.generateAsync({type:'nodebuffer'})),/Unsafe/);
  zip=new JSZip();zip.file('a.txt','abc');zip.file('b.txt','def');let bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  const altered=Buffer.from(bytes);let at=altered.indexOf(Buffer.from('b.txt'),altered.indexOf(Buffer.from([0x50,0x4b,0x01,0x02])));altered[at]=97;
  await assert.rejects(openArchive(altered),/repeated/);
  bytes=Buffer.from(bytes);at=bytes.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));bytes.writeUInt32LE(1,at+24);
  const archive=await openArchive(bytes);await assert.rejects(archive.read('a.txt'),/exceeds|size/i);
  await assert.rejects(openArchive(Buffer.alloc(64*1024*1024+1)),/size limit/);
});
test('auxiliary masks retain data-window offsets, invalid samples and categorical boundaries',()=>{
  const frame={width:2,height:1,dataWindow:{x:11,y:20},displayWindow:{x:10,y:20,width:4,height:2},orientation:1,provenance:{kind:'renderer-provided'}};
  const result=depthCoverage({...frame,kind:'depth',units:'m',values:new Float32Array([1,3]),invalidValues:[]},{near:1,far:3,ramp:'near'});
  assert.deepEqual([...result.coverage],[0,255,0,0,0,0,0,0]);
  assert.equal(depthCoverage({...frame,kind:'depth',units:'m',values:new Float32Array([NaN,-1]),invalidValues:[-1]},{near:1,far:3,ramp:'near'}).interpretation.invalidSamples,2);
  assert.deepEqual([...depthCoverage({...frame,kind:'disparity',units:'1/m',values:new Float32Array([1,.5]),invalidValues:[]},{near:1,far:.5,ramp:'near'}).coverage],[0,255,0,0,0,0,0,0]);
  assert.throws(()=>depthCoverage({...frame,orientation:6},{near:1,far:3,ramp:'near'}),/orientation/);
  assert.deepEqual([...labelCoverage({...frame,kind:'uint32-labels',units:'categorical',values:new Uint32Array([42,3])},[42]).coverage],[0,255,0,0,0,0,0,0]);
  assert.throws(()=>labelCoverage({...frame,kind:'uint32-labels',units:'categorical',values:new Float32Array([42,3])},[42]),/uint32/);
});
test('OpenRaster selected layers preserve offsets, opacity and fractional edges; unsupported semantics reject',async()=>{
  const {importOpenRaster}=require('../src/adapters/openraster');const c=new Canvas(2,1),x=c.getContext('2d');x.fillStyle='rgba(0,0,0,0.5)';x.fillRect(0,0,2,1);
  const zip=new JSZip();zip.file('mimetype','image/openraster',{compression:'STORE'});zip.file('data/layer.png',await c.toBuffer('png'));
  const xml=blend=>`<image w="4" h="2"><stack><layer name="Canopy" src="data/layer.png" x="1" y="1" opacity="0.5" composite-op="${blend}"/></stack></image>`;
  zip.file('stack.xml',xml('svg:src-over'));
  const opts={layers:[{index:0,id:'canopy',polarity:'alpha'}],provenance};
  const result=await importOpenRaster(await zip.generateAsync({type:'nodebuffer'}),opts);assert.deepEqual([...result.source.regions[0].coverage],[0,0,0,0,0,64,64,0]);
  zip.file('stack.xml',xml('svg:multiply'));await assert.rejects(importOpenRaster(await zip.generateAsync({type:'nodebuffer'}),opts),/blend/);
  zip.file('stack.xml',xml('svg:src-over').replace('x="1"','x="3"'));await assert.rejects(importOpenRaster(await zip.generateAsync({type:'nodebuffer'}),opts),/cropped/);
});
