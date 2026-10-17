'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Plan=require('../src/export-plan'),Screen=require('../src/screening'),Package=require('../src/print-package');
test('browser and CLI share physical geometry and keep proof registration out of masters',()=>{
  const context={StipraScreen:Screen};vm.runInNewContext(fs.readFileSync(require.resolve('../src/export-plan'),'utf8'),context);
  const raw={version:1,seed:42,default:{mode:'dots',pitch:6,registration:{x:2,y:-1,rotate:3}},plates:{blue:{registration:{x:4,y:5}}}};
  const before=JSON.stringify(raw),a=Plan.screenConfigs(raw,['blue','warm']),b=context.StipraExportPlan.screenConfigs(raw,['blue','warm']);
  assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(raw),before);
  assert.equal(a.proof.plates.blue.registration.x,4);assert.deepEqual(a.production.plates.blue.registration,{x:0,y:0,rotate:0});
  assert.equal(JSON.stringify(Plan.printIntent(1200,600,300,0)),JSON.stringify(context.StipraExportPlan.printIntent(1200,600,300,0)));
  assert.equal(Plan.printIntent(1200,600,300,0).trimMm.width,101.6);
});
test('PNG density is replaced, never duplicated, across repeated encoding',async()=>{
  const {Canvas}=require('skia-canvas'),c=new Canvas(8,8);const png=Buffer.from(await c.toBuffer('png'));
  const output=Package.physicalPNG(Package.physicalPNG(png,300),600);let count=0;
  for(let at=8;at<output.length;at+=12+output.readUInt32BE(at))if(output.toString('ascii',at+4,at+8)==='pHYs'){count++;assert.equal(output.readUInt32BE(at+8),Math.round(600*1000/25.4));}
  assert.equal(count,1);assert.throws(()=>Package.physicalPNG(Buffer.from('broken'),300),/expected PNG/);
});
test('browser smoke uses wall-clock completion instead of virtual-time dump',()=>{
  const source=fs.readFileSync(require.resolve('../scripts/browser-smoke'),'utf8');assert.ok(source.includes('--remote-debugging-pipe'));assert.ok(!source.includes('--virtual-time-budget'));assert.ok(source.includes("state.state==='pass'"));
});
