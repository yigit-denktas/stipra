#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{hash}=require('./artifact-evidence');
const fail=message=>{throw Error('print observations: '+message);};
/** Checks an operator record and local evidence bytes; it cannot authenticate a physical print. */
function validate(record,root){
  if(record.contract!=='stipra-physical-observation-v1'||record.status!=='recorded')fail('requires a recorded operator observation; not-run is not acceptance');
  for(const key of ['operator','printer','driver','paperStock','legibilityNotes','registrationNotes','screeningAndInkNotes'])
    if(typeof record[key]!=='string'||!record[key].trim()||record[key].length>4000)fail('missing or invalid '+key);
  if(typeof record.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(record.date)||!Number.isFinite(Date.parse(record.date))||new Date(record.date).toISOString().slice(0,10)!==record.date)fail('date must be an actual YYYY-MM-DD date');
  if(record.printScalePercent!==100)fail('record the actual 100% print scale');
  const targets={horizontal100mmMeasured:100,vertical100mmMeasured:100,masterWidthMmMeasured:101.6,masterHeightMmMeasured:76.2};
  const measurements=Object.entries(targets).map(([field,expectedMm])=>{
    const measuredMm=record[field];if(!Number.isFinite(measuredMm)||measuredMm<=0)fail('missing measured value '+field);
    return {field,expectedMm,measuredMm,errorMm:Math.round((measuredMm-expectedMm)*1e6)/1e6,withinProposedTolerance:Math.abs(measuredMm-expectedMm)<=.500000001};
  });
  if(!Array.isArray(record.evidenceFiles)||record.evidenceFiles.length<1||record.evidenceFiles.length>16)fail('provide 1..16 local evidence files with hashes');
  const seen=new Set(),base=fs.realpathSync(root);let total=0;
  const evidence=record.evidenceFiles.map(item=>{
    if(!item||typeof item.path!=='string'||!/^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(item.path)||seen.has(item.path)||!/^[a-f0-9]{64}$/.test(item.sha256))fail('invalid, duplicate or unsafe evidence path/hash');
    seen.add(item.path);const file=path.join(base,item.path),real=fs.realpathSync(file);
    if(!real.startsWith(base+path.sep))fail('evidence resolves outside the record directory');
    const stat=fs.statSync(real);total+=stat.size;if(!stat.isFile()||total>64*1024*1024)fail('evidence must be files within 64 MiB');
    const bytes=fs.readFileSync(real);if(hash(bytes)!==item.sha256)fail('evidence hash mismatch: '+item.path);
    return {path:item.path,bytes:bytes.length,sha256:item.sha256};
  });
  return {contract:'stipra-physical-record-check-v1',status:'operator-record-requires-review',measurements,
    proposedToleranceMm:.5,geometryWithinProposedTolerance:measurements.every(x=>x.withinProposedTolerance),evidence,
    physicalPrintAuthenticated:false,physicalInkCalibrated:false,
    scope:'Completeness, declared measurements and file integrity only. Operator identity, actual printing, ink appearance and owner approval require human review.'};
}
function check(file){
  if(!file)fail('usage: node scripts/check-print-observations.js /private/kit/print-observations.json');
  if(fs.statSync(file).size>65536)fail('record exceeds 64 KiB');
  return validate(JSON.parse(fs.readFileSync(file,'utf8')),path.dirname(path.resolve(file)));
}
if(require.main===module){try{console.log(JSON.stringify(check(process.argv[2]),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={validate,check};
