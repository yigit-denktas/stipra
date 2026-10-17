'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {validate}=require('../scripts/check-print-observations'),{hash}=require('../scripts/artifact-evidence');
test('physical records require actual observations and hashed local evidence without asserting a physical pass',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-observations-'));
  try{
    const bytes=Buffer.from('Synthetic validator fixture, not real print evidence.');fs.writeFileSync(path.join(root,'fixture.txt'),bytes);
    const record={contract:'stipra-physical-observation-v1',status:'recorded',operator:'Synthetic test',date:'2026-10-17',printer:'Test',driver:'Test',paperStock:'Test',printScalePercent:100,horizontal100mmMeasured:100,vertical100mmMeasured:99.8,masterWidthMmMeasured:101.6,masterHeightMmMeasured:76.2,legibilityNotes:'Test only',registrationNotes:'Test only',screeningAndInkNotes:'Test only',evidenceFiles:[{path:'fixture.txt',sha256:hash(bytes)}],ownerApproved:true,physicalInkCalibrated:true};
    const result=validate(record,root);assert.equal(result.geometryWithinProposedTolerance,true);assert.equal(result.physicalInkCalibrated,false);assert.equal(result.physicalPrintAuthenticated,false);
    assert.equal(validate({...record,horizontal100mmMeasured:98},root).geometryWithinProposedTolerance,false);
    for(const mutation of [{status:'not-run'},{operator:null},{date:'2026-02-30'},{printScalePercent:97},{evidenceFiles:[]},{evidenceFiles:[{path:'../fixture.txt',sha256:hash(bytes)}]},{evidenceFiles:[{path:'fixture.txt',sha256:'0'.repeat(64)}]}])assert.throws(()=>validate({...record,...mutation},root));
    const outside=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-outside-'));
    try{fs.writeFileSync(path.join(outside,'external.txt'),bytes);fs.symlinkSync(path.join(outside,'external.txt'),path.join(root,'link.txt'));assert.throws(()=>validate({...record,evidenceFiles:[{path:'link.txt',sha256:hash(bytes)}]},root),/outside/);}finally{fs.rmSync(outside,{recursive:true,force:true});}
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
