#!/usr/bin/env node
/* Fetch only the official, git-blob-pinned OFL Paper Mono typefaces into ignored local cache.
 * No fonts are committed to Stiprā or exposed as individual download artifacts.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const DEST=path.resolve(__dirname,'../.cache/stipra-paper-mono');
const BASE='https://raw.githubusercontent.com/paper-design/paper-mono/v1.000/fonts/ttf/';
const PLEX='https://raw.githubusercontent.com/IBM/plex/master/packages/';
const FONTS={
  regular:{name:'PaperMono-Regular.ttf',blob:'6af3a5d15a6b0219005404fabe71fc1fb16541ae'},
  extraBold:{name:'PaperMono-ExtraBold.ttf',blob:'fbc6ee5851529c3e0e6fd83ad92d6cc83f70f383'},
  semiBold:{name:'PaperMono-SemiBold.ttf',blob:'dd74ad4dd025747e1b4e1770709a0afe1a645750'},
  plexRegular:{name:'IBMPlexSans-Regular.ttf',blob:'bd6817d5202895da5ac4fad88de3da71e652881a',url:PLEX+'plex-sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf'},
  plexBold:{name:'IBMPlexSans-Bold.ttf',blob:'1d66b1a2e96d5e33d6f5fa8e81e76b4e5621d240',url:PLEX+'plex-sans/fonts/complete/ttf/IBMPlexSans-Bold.ttf'},
  plexMonoBold:{name:'IBMPlexMono-Bold.ttf',blob:'9a168d21d5f8a951fa1940cf4703926fcccc5ee0',url:PLEX+'plex-mono/fonts/complete/ttf/IBMPlexMono-Bold.ttf'},
  plexMono:{name:'IBMPlexMono-Regular.ttf',blob:'4254c37f20ba57e829a3315fdc91cda4e63589f5',url:PLEX+'plex-mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf'}
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
      contents=await get(font.url||BASE+font.name);
      if(gitBlobHash(contents)!==font.blob)throw Error('typefaces: upstream source blob does not match pinned SHA for '+font.name);
      fs.writeFileSync(dest+'.tmp',contents);fs.renameSync(dest+'.tmp',dest);
    }
    files[key]=dest;
  }
  return files;
}
if(require.main===module)prepare().then(f=>process.stdout.write('paper mono v1.000 verified; local cache prepared\n'))
  .catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare,DEST,FONTS,gitBlobHash};
