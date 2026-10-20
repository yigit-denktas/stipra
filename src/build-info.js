'use strict';
/* Source/build attribution for generated packages. Not an authenticity attestation. */
const path=require('node:path'),fs=require('node:fs');
const pkg=require('../package.json');
const COMMIT=/^[0-9a-f]{40}$/;

function unknown(version){
  return {name:'stipra',version,commit:null,commitSource:'unknown',verified:false,dirty:null};
}
function commit(value,where){
  const normalized=String(value).trim().toLowerCase();
  if(!COMMIT.test(normalized))throw Error(where+': expected a full 40-character commit SHA');
  return normalized;
}
function render(overrides={}){
  return Object.freeze({name:'stipra',version:overrides.version||pkg.version,...overrides});
}

function resolveIdentity(root=path.resolve(__dirname,'..')){
  const version=pkg.version;
  const override=typeof process==='object'&&process.env?process.env.STIPRA_BUILD_COMMIT:undefined;
  if(override!==undefined&&override!==''){
    return render({version,commit:commit(override,'STIPRA_BUILD_COMMIT'),commitSource:'environment',verified:false,dirty:null});
  }
  if(typeof process==='undefined'||!process.versions||!process.versions.node)return unknown(version);
  try{
    const {execFileSync}=eval('require')('node:child_process');
    const realRoot=fs.realpathSync(root);
    const top=fs.realpathSync(execFileSync('git',['-C',root,'rev-parse','--show-toplevel'],{encoding:'utf8'}).trim());
    if(top!==realRoot)return unknown(version);
    const head=commit(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'git HEAD');
    const dirty=execFileSync('git',['-C',root,'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim().length>0;
    return render({version,commit:head,commitSource:'git',verified:true,dirty});
  }catch{
    return unknown(version);
  }
}

const defined=typeof __STIPRA_BUILD_IDENTITY__==='object'?__STIPRA_BUILD_IDENTITY__:null;
const identity=defined?render(defined):resolveIdentity();
module.exports=Object.assign({},identity,{resolveIdentity});
