'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {verify}=require('../scripts/fontkit-evidence');
test('replacement source inventory rejects changed code, source and dependency metadata',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'stipra-fontkit-source-')),dir=path.join(root,'node_modules/fontkit');
  fs.cpSync(path.join(__dirname,'../node_modules/fontkit'),dir,{recursive:true});
  try{
    const checked=verify(root);assert.equal(checked.modules.length,3);assert.ok(checked.modules.every(x=>x.sourceFiles.length>=111));
    const code=path.join(dir,'dist/browser.cjs'),original=fs.readFileSync(code);fs.appendFileSync(code,' ');assert.throws(()=>verify(root),/module\/map changed/);fs.writeFileSync(code,original);
    const source=path.join(dir,'src/index.js'),before=fs.readFileSync(source);fs.appendFileSync(source,' ');assert.throws(()=>verify(root),/map\/source mismatch/);fs.writeFileSync(source,before);
    const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));pkg.dependencies.unknown='1.0.0';fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify(pkg));assert.throws(()=>verify(root),/version\/dependencies differ/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
