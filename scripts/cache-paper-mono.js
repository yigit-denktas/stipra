#!/usr/bin/env node
/* Fetch only the official, git-blob-pinned OFL Paper Mono typefaces into ignored local cache.
 * No fonts are committed to Stiprā or exposed as individual download artifacts.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const DEST=path.resolve(__dirname,'../.cache/stipra-paper-mono');
const BASE='https://raw.githubusercontent.com/paper-design/paper-mono/v1.000/fonts/ttf/';
const FONTS={
  regular:{name:'PaperMono-Regular.ttf',blob:'6af3a5d15a6b0219005404fabe71fc1fb16541ae'},
  extraBold:{name:'PaperMono-ExtraBold.ttf',blob:'fbc6ee5851529c3e0e6fd83ad92d6cc83f70f383'}
};
function gitBlobHash(bytes){
  return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
}
function get(url,redirects=0){
  if(redirects>3)throw Error('paper mono: too many redirects');
  return new Promise((resolve,reject)=>{
    https.get(url,{timeout:20000,headers:{'user-agent':'stipra-ofl-font-pinning-v1'}},res=>{
      if([301,302,307,308].includes(res.statusCode)){
        const where=new URL(res.headers.location,url);
        if(!['raw.githubusercontent.com','github.com'].includes(where.hostname)){
          res.resume();reject(Error('paper mono: unexpected font redirect host'));return;
        }
        res.resume();get(where.href,redirects+1).then(resolve,reject);return;
      }
      if(res.statusCode!==200){res.resume();reject(Error('paper mono: HTTP '+res.statusCode));return;}
      const chunks=[];let total=0;
      res.on('data',part=>{total+=part.length;if(total>2e6){res.destroy(Error('oversize font'));return;}chunks.push(part);});
      res.once('end',()=>resolve(Buffer.concat(chunks)));
      res.once('error',reject);
    }).once('timeout',function(){this.destroy(Error('font download timed out'));}).once('error',reject);
  });
}
async function prepare(){
  fs.mkdirSync(DEST,{recursive:true});
  const files={};
  for(const [key,font] of Object.entries(FONTS)){
    const dest=path.join(DEST,font.name);
    let contents=fs.existsSync(dest)?fs.readFileSync(dest):null;
    if(!contents||gitBlobHash(contents)!==font.blob){
      contents=await get(BASE+font.name);
      if(gitBlobHash(contents)!==font.blob)throw Error('paper mono: v1.000 source blob does not match pinned SHA for '+font.name);
      fs.writeFileSync(dest+'.tmp',contents);fs.renameSync(dest+'.tmp',dest);
    }
    files[key]=dest;
  }
  return files;
}
if(require.main===module)prepare().then(f=>process.stdout.write('paper mono v1.000 verified; local cache prepared\n'))
  .catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare,DEST,FONTS,gitBlobHash};
