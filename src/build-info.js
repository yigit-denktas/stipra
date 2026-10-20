'use strict';
/* Identifies the software that generated a package. Browser builds inject the exact commit. */
const pkg=require('../package.json');

function gitCommit(){
  if(typeof process==='undefined'||!process.versions||!process.versions.node)return null;
  try{
    const {execFileSync}=eval('require')('node:child_process');
    return execFileSync('git',['rev-parse','HEAD'],{cwd:__dirname+'/..',encoding:'utf8'}).trim();
  }catch{return null;}
}

const definedCommit=typeof __STIPRA_BUILD_COMMIT__==='string'?__STIPRA_BUILD_COMMIT__:null;
const envCommit=typeof process==='object'&&process.env?process.env.STIPRA_BUILD_COMMIT||null:null;
module.exports=Object.freeze({
  name:'stipra',
  version:typeof __STIPRA_BUILD_VERSION__==='string'?__STIPRA_BUILD_VERSION__:pkg.version,
  commit:definedCommit||envCommit||gitCommit(),
});
