'use strict';
const fs=require('node:fs'),path=require('node:path'),{hash}=require('./artifact-evidence');
const ROOT=path.resolve(__dirname,'..');
/** Verifies the replacement's shipped source maps and external dependency inventory. */
function verify(root=ROOT){
  const dir=path.join(root,'node_modules/fontkit'),pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
  const expected=JSON.parse(fs.readFileSync(path.join(ROOT,'licenses/third-party/fontkit-source-inventory.json')));
  if(pkg.version!==expected.version||JSON.stringify(pkg.dependencies)!==JSON.stringify(expected.dependencies))throw Error('Fontkit version/dependencies differ from source review');
  const modules=expected.modules.map(record=>{
    const code=fs.readFileSync(path.join(dir,record.path)),mapBytes=fs.readFileSync(path.join(dir,record.path+'.map'));
    if(hash(code)!==record.sha256||hash(mapBytes)!==record.mapSha256)throw Error('Fontkit module/map changed: '+record.path);
    const map=JSON.parse(mapBytes);
    if(map.sources.length!==record.sources||map.sourcesContent?.length!==map.sources.length)throw Error('Incomplete Fontkit source map');
    const sources=map.sources.map((name,i)=>{
      if(!/^src\/[A-Za-z0-9_./-]+$/.test(name)||name.split('/').includes('..'))throw Error('Foreign or unsafe source in Fontkit map');
      const bytes=fs.readFileSync(path.join(dir,name));
      if(bytes.toString()!==map.sourcesContent[i])throw Error('Fontkit map/source mismatch: '+name);
      return {path:name,sha256:hash(bytes)};
    });
    return {...record,sourceFiles:sources};
  });
  return {package:pkg.name,version:pkg.version,status:'source-inventory-checked',dependencies:pkg.dependencies,modules,
    scope:'Published own-source/map identity and separately resolved dependencies, not a reproducible compiler attestation or a legal opinion.'};
}
module.exports={verify};
