#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const JSZip=require('jszip'),Core=require('../src/sdk'),Package=require('../src/print-package'),{ingestLocalBytes}=require('../src/import/node');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function decoded(zip,file){return ingestLocalBytes(await zip.file(file).async('nodebuffer'));}
async function fingerprint(result){return {recipe:result.recipe,plates:result.plates.map(p=>({id:p.id,coverage:hash(p.coverage),screened:hash(p.screened)})),proof:hash(result.proof.rgba)};}
async function verifyPackage(bytes,expected){
  const zip=await JSZip.loadAsync(bytes),manifest=JSON.parse(await zip.file('manifest.json').async('string'));
  const screens=JSON.parse(await zip.file('recipe/screens.json').async('string')),proofScreens=JSON.parse(await zip.file('recipe/proof-screens.json').async('string'));
  assert.deepEqual(screens,expected.recipe.screens);assert.deepEqual(proofScreens,expected.recipe.proofScreens);
  assert.equal(manifest.output.dpi,expected.recipe.dpi);assert.deepEqual(manifest.output.sourcePixels,expected.geometry.sourcePixels);assert.deepEqual(manifest.output.origin,{x:0,y:0});
  assert.equal(manifest.inks.length,expected.plates.length);
  for(const [i,ink] of manifest.inks.entries()){
    assert.equal(ink.id,expected.plates[i].id);
    for(const [file,wanted] of [[ink.plate,expected.plates[i].coverage],[ink.screened,expected.plates[i].screened]]){
      const asset=await decoded(zip,file);assert.deepEqual(asset.metadata.oriented,expected.geometry.sourcePixels);
      const coverage=Uint8Array.from({length:asset.rgba.length/4},(_,p)=>255-asset.rgba[p*4]);assert.deepEqual(coverage,wanted,file);
      for(let p=0;p<asset.rgba.length;p+=4)assert.ok(asset.rgba[p]===asset.rgba[p+1]&&asset.rgba[p]===asset.rgba[p+2]&&asset.rgba[p+3]===255,'non-grayscale master');
    }
  }
  const proof=await decoded(zip,'proof/composite.png');assert.deepEqual(proof.rgba,expected.proof.rgba);
  for(const entry of manifest.files)assert.equal(hash(await zip.file(entry.path).async('nodebuffer')),entry.sha256,entry.path);
  assert.ok(zip.file('recipe/inks.json'));assert.ok(zip.file('report/separation-sheet.pdf'));assert.ok(manifest.source.sha256);
  assert.ok((await zip.file(manifest.report.fontLicense).async('string')).includes('SIL OPEN FONT LICENSE'));
  return {zip,manifest};
}
async function run(file='out/alpha-validation/browser-evidence.json'){
  const evidence=JSON.parse(fs.readFileSync(file)),out=path.dirname(path.resolve(file)),F=await import('../examples/alpha/fixture.mjs'),rows=[];
  assert.equal(evidence.contract,'stipra-alpha-browser-v1');
  assert.deepEqual(evidence.parity.map(x=>x.id),['blue-pink','warm-third','process-cmyk','authored-2','authored-3','studio-warm-third']);
  for(const item of evidence.parity){
    const bytes=Buffer.from(item.zipBase64,'base64'),zip=await JSZip.loadAsync(bytes),inkRecipe=JSON.parse(await zip.file('recipe/inks.json').async('string')),screens=JSON.parse(await zip.file('recipe/proof-screens.json').async('string')),manifest=JSON.parse(await zip.file('manifest.json').async('string'));
    let input,expected,node;
    if(item.kind==='image'){
      const source=await zip.file('source/original.png').async('nodebuffer'),asset=await ingestLocalBytes(source);
      input={width:asset.metadata.oriented.width,height:asset.metadata.oriented.height,rgba:asset.rgba,colorSpace:'srgb'};
      assert.deepEqual(input.rgba,F.image().rgba,'normalized original pixels differ across browser and CLI');
      expected=Core.renderImage(input,{inkRecipe,screenRecipe:screens,dpi:manifest.output.dpi});
      const prefix=path.join(out,item.id);fs.writeFileSync(prefix+'.png',source);fs.writeFileSync(prefix+'-inks.json',JSON.stringify(inkRecipe));fs.writeFileSync(prefix+'-screens.json',JSON.stringify(screens));
      const dest=prefix+'-cli.zip';if(fs.existsSync(dest))fs.unlinkSync(dest);
      cp.execFileSync(process.execPath,['bin/stipra.js','package','--input',prefix+'.png','--config',prefix+'-inks.json','--screen',prefix+'-screens.json','--dpi',String(manifest.output.dpi),'--paper','recipe','--out',dest],{cwd:path.resolve(__dirname,'..'),stdio:'pipe'});
      node=fs.readFileSync(dest);
    }else{
      const opts=await require('./reproduce-layers').readSnapshot(bytes);input=opts.input;expected=Core.renderLayers(input,{screenRecipe:opts.screenRecipe,dpi:opts.dpi});
      const src=path.join(out,item.id+'-browser.zip'),dest=path.join(out,item.id+'-cli.zip');fs.writeFileSync(src,bytes);if(fs.existsSync(dest))fs.unlinkSync(dest);
      cp.execFileSync(process.execPath,['scripts/reproduce-layers.js',src,dest],{cwd:path.resolve(__dirname,'..'),stdio:'pipe'});node=fs.readFileSync(dest);
      const original=F.layers(97,61,item.id==='authored-2'?2:3);for(let i=0;i<input.inks.length;i++)assert.deepEqual(input.inks[i].coverage,original.inks[i].coverage);
    }
    const fp=await fingerprint(expected);assert.deepEqual(fp.plates,item.expected.plates,'browser SDK/Node coverage or screen mismatch');assert.equal(fp.proof,item.expected.proof);
    assert.deepEqual(fp.recipe.inks,item.expected.recipe.inks);assert.deepEqual(fp.recipe.screens,item.expected.recipe.screens);assert.deepEqual(fp.recipe.proofScreens,item.expected.recipe.proofScreens);
    await verifyPackage(bytes,expected);await verifyPackage(node,expected);
    const generated=item.kind==='image'?await Package.generate({originalBytes:await zip.file('source/original.png').async('nodebuffer'),asset:await ingestLocalBytes(await zip.file('source/original.png').async('nodebuffer')),inkRecipe,screenRecipe:screens,dpi:manifest.output.dpi,paper:'recipe'}):await Package.generateLayers(await require('./reproduce-layers').readSnapshot(bytes));
    await verifyPackage(generated.zip,expected);
    fs.writeFileSync(path.join(out,item.id+'-browser.zip'),bytes);
    rows.push({id:item.id,kind:item.kind,inks:expected.plates.length,dpi:manifest.output.dpi,geometry:expected.geometry,plates:fp.plates,proof:fp.proof,checks:{browserCore:true,nodeCore:true,browserPackage:true,nodePackage:true,actualCli:true,decodedMasterEquality:true,proofPixelEquality:true,fileHashes:true},browserExportMs:item.exportMs});
  }
  const report={contract:'stipra-alpha-parity-v1',comparison:'decoded coverage, grayscale masters and proof pixels; PNG/PDF/ZIP serialization bytes may differ',cases:rows};
  fs.writeFileSync(path.join(out,'parity-report.json'),JSON.stringify(report,null,2)+'\n');
  const sanitized={...evidence,parity:evidence.parity.map(({zipBase64,...item})=>item)};
  fs.writeFileSync(path.join(out,'browser-benchmark.json'),JSON.stringify(sanitized,null,2)+'\n');console.log(JSON.stringify({status:'ALPHA_PARITY_PASS',cases:rows.length}));console.log('ALPHA_BROWSER_EVIDENCE '+JSON.stringify(sanitized));return report;
}
if(require.main===module)run(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run,verifyPackage};
