'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DEST,FONTS,gitBlobHash}=require('../scripts/cache-paper-mono');
function truetype(family,weight=400){
  const key={'ibm-plex-sans':{400:'plexRegular',700:'plexBold'},'ibm-plex-mono':{400:'plexMono',700:'plexMonoBold'}}[family]?.[weight];
  if(!key)throw Error('Unsupported report typeface: '+family+'/'+weight);
  const font=FONTS[key],file=path.join(DEST,font.name);
  if(!fs.existsSync(file))throw Error('Missing verified report fonts; run npm run prepare:fonts once before working offline');
  const bytes=fs.readFileSync(file);
  if(gitBlobHash(bytes)!==font.blob)throw Error('Report font differs from pinned original: '+font.name);
  return bytes;
}
const license=()=>['sans','mono'].map(family=>'IBM Plex '+family+'\n'+
  fs.readFileSync(require.resolve('@fontsource/ibm-plex-'+family+'/LICENSE'),'utf8')).join('\n\n---\n\n');
module.exports={truetype,license};
