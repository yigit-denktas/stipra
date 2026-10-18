#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {hash}=require('./artifact-evidence');
const ROOT=path.resolve(__dirname,'..');
const ARTIFACTS=['lean','browser','native'];
const CONTRACTS={lean:'stipra-library-candidate-v1',browser:'stipra-browser-export-audit-v1',native:'stipra-dependency-audit-v1'};
/** Rejects missing or unresolved scope evidence; a binary hash match never clears native notices. */
function evaluate(artifact,evidence){
  assert.ok(ARTIFACTS.includes(artifact),'Choose an artifact: lean, browser or native');
  assert.equal(evidence.contract,CONTRACTS[artifact],'Unexpected artifact evidence contract');
  if(artifact==='lean'){
    assert.equal(evidence.status,'verified-packed-candidate');
    assert.deepEqual(evidence.packages.map(x=>x.name).sort(),['@yigit-denktas/stipra-canvas','@yigit-denktas/stipra-core','@yigit-denktas/stipra-inputs']);
    for(const name of ['publicExports','esmCjsParity','canvasRegionCore','sourceUnchanged','regionReplay','offlineInstall','lifecycleScriptsDisabled','typescriptPublicExports'])assert.equal(evidence.checks[name],true,'Missing consumer check: '+name);
    return {status:'checked',findings:[]};
  }
  assert.ok(Array.isArray(evidence.findings),'Missing artifact findings');
  if(artifact==='browser'){
    assert.equal(evidence.status,'checked','Browser inventory requires review');
    assert.deepEqual(evidence.findings,[],'Browser findings remain');
    assert.deepEqual(evidence.artifactEvidence,[],'Reviewed compiled artifacts require separate clearance');
    assert.equal(evidence.fontkitSource.status,'source-inventory-checked');
    assert.ok(evidence.inputs.length&&evidence.outputs.length,'Missing bundle inputs/outputs');
    assert.ok(!evidence.inputs.some(x=>/node_modules\/(?:skia-canvas|fonteditor-core)\//.test(x.path)),'Native/WASM dependency entered the browser exporter');
    return {status:'checked',findings:[]};
  }
  assert.equal(evidence.status,'review-required','Native inventory unexpectedly cleared; review gate policy before shipping');
  assert.ok(evidence.findings.some(x=>x.package==='skia-canvas'&&x.kind==='native-transitive-review'),'Missing unresolved native notice finding');
  return {status:'blocked',findings:evidence.findings};
}
/** Rebuilds and checks the selected artifact, replacing any previous gate result even on failure. */
async function gate(artifact,out=path.join(ROOT,'out')){
  assert.ok(ARTIFACTS.includes(artifact),'Choose an artifact: lean, browser or native');
  const reportFile=path.join(out,'release-gates',artifact+'.json');
  fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.rmSync(reportFile,{force:true});
  const report={contract:'stipra-artifact-release-gate-v1',artifact,status:'error',scope:{
    lean:'Exact three freshly packed JS tarballs and offline consumer; not registry publication or human/physical acceptance.',
    browser:'Exact IIFE and ESM browser PDF/ZIP exporters and emitted notices; not host p5, site fonts/media or native CLI.',
    native:'Bundled native CLI/executable/container redistributing Skia; notices remain unresolved.'
  }[artifact]};
  try{
    const checks=[];
    if(artifact==='lean'){
      const evidence=await require('./check-library-candidate').candidate(path.join(out,'distribution-audit'));
      checks.push({evidence,file:path.join(out,'distribution-audit/library-candidate.json')});
    }else if(artifact==='browser'){
      for(const [name,format] of [['export.mjs','iife'],['esm/export.mjs','esm']]){
        const file=path.join(out,'browser-distribution',name);
        const evidence=await require('./build-browser-export').build(file,{format});
        checks.push({evidence,file:file+'.audit.json'});
      }
    }else{
      const evidence=require('./license-audit').audit(path.join(out,'release-gates/native-inventory'));
      checks.push({evidence,file:path.join(out,'release-gates/native-inventory/dependency-audit.json')});
    }
    const decisions=checks.map(x=>evaluate(artifact,x.evidence));
    report.status=decisions.every(x=>x.status==='checked')?'checked':'blocked';
    report.findings=decisions.flatMap(x=>x.findings);
    report.evidence=checks.map(x=>({path:path.relative(out,x.file).split(path.sep).join('/'),sha256:hash(fs.readFileSync(x.file))}));
  }catch(error){report.status='error';report.error=error.message;}
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
  return report;
}
if(require.main===module){
  if(process.argv.length!==3||!ARTIFACTS.includes(process.argv[2])){
    console.error('Usage: node scripts/check-release-artifact.js <lean|browser|native>');process.exitCode=1;
  }else gate(process.argv[2]).then(report=>{console.log(JSON.stringify(report,null,2));if(report.status!=='checked')process.exitCode=1;}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={gate,evaluate};
