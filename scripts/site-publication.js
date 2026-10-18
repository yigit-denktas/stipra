'use strict';
const assert=require('node:assert/strict');
const evidence=require('../docs/evidence/npm-alpha-registry-2026-10-18.json');
/** Reads the committed registry verification without inventing an npm publication date or GitHub release. */
function libraryPublication(record=evidence){
  assert.equal(record.contract,'stipra-registry-release-v1');
  assert.equal(record.status,'verified-public-alpha','Library publication is not verified');
  assert.deepEqual(record.packages.map(p=>p.name).sort(),['@yigit-denktas/stipra-canvas','@yigit-denktas/stipra-core','@yigit-denktas/stipra-inputs']);
  const version=record.packages[0].version;
  assert.ok(version&&record.packages.every(p=>p.version===version&&/^[a-f0-9]{64}$/.test(p.sha256)&&p.integrity.startsWith('sha512-')),'Inconsistent registry package evidence');
  for(const name of ['freshRegistryInstall','emptyInitialCache','publicExports','typescriptPublicExports'])assert.equal(record.consumer.checks[name],true,'Missing registry consumer check');
  return {version,checkedAt:record.checkedAt,packages:record.packages.map(p=>p.name),evidence:'docs/evidence/npm-alpha-registry-2026-10-18.json'};
}
module.exports={libraryPublication};
