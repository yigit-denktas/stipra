#!/usr/bin/env node
'use strict';
const path=require('node:path'),fs=require('node:fs'),esbuild=require('esbuild');
const ROOT=path.resolve(__dirname,'..');
async function build(outfile,{format='iife'}={}){
  fs.rmSync(outfile+'.audit.json',{force:true});
  const {truetype,license}=require('../src/report-fonts.js');
  const fonts={};for(const [family,weight] of [['ibm-plex-sans',400],['ibm-plex-sans',700],['ibm-plex-mono',400]])fonts[family+weight]=truetype(family,weight).toString('base64');
  const svg=fs.readFileSync(path.join(ROOT,'logo_for_Readme.svg'),'utf8');
  const result=await esbuild.build({absWorkingDir:ROOT,metafile:true,legalComments:'linked',entryPoints:[path.join(ROOT,format==='esm'?'src/browser/export-entry.mjs':'src/browser/export.js')],outfile,bundle:true,platform:'browser',format,...(format==='iife'?{globalName:'StipraExport'}:{}),minify:true,
    inject:[path.join(ROOT,'src/browser/buffer.js')],define:{__dirname:'"/"'},plugins:[{name:'export-platform',setup(api){
      api.onResolve({filter:/^(?:node:(?:fs|path|crypto)|skia-canvas|\.\/report-fonts\.js)$/},args=>({path:args.path,namespace:'export-platform'}));
      api.onLoad({filter:/.*/,namespace:'export-platform'},args=>{
        if(args.path==='node:crypto')return {contents:"module.exports={createHash:require('./src/browser/adapters.js').createHash};",resolveDir:ROOT};
        if(args.path==='skia-canvas')return {contents:"module.exports=require('./src/browser/adapters.js');",resolveDir:ROOT};
        if(args.path==='node:path')return {contents:"module.exports={join:(...parts)=>parts.join('/')};"};
        if(args.path==='node:fs')return {contents:'module.exports={readFileSync:(name,encoding)=>{if(!name.endsWith("logo_for_Readme.svg"))throw Error("Unbundled export asset");return '+JSON.stringify(svg)+';}};'};
        return {contents:'const {Buffer}=require("buffer/");const fonts='+JSON.stringify(fonts)+';module.exports={license:()=>'+JSON.stringify(license())+',truetype:(family,weight=400)=>{const data=fonts[family+weight];if(!data)throw Error("Unbundled font");return Buffer.from(data,"base64");}};',resolveDir:ROOT};
      });
    }}]});
  const roots=new Set();
  for(const input of Object.keys(result.metafile.inputs)){
    if(!input.includes('node_modules/'))continue;
    let dir=path.dirname(path.resolve(input));
    while(dir!==path.dirname(dir)&&!fs.existsSync(path.join(dir,'package.json')))dir=path.dirname(dir);
    if(fs.existsSync(path.join(dir,'package.json')))roots.add(dir);
  }
  const notices=[];
  for(const dir of [...roots].sort()){
    const {notices:readNotices,completeTerms,licensePolicy}=require('./license-audit.js');
    const {pkg,declared,sources}=readNotices(dir);
    if(!sources.length||!declared||!completeTerms(sources))throw Error('Missing or incomplete bundled dependency notice: '+pkg.name);
    const {selected,reviewed}=licensePolicy(pkg.name,declared);
    if(!reviewed)throw Error('Unreviewed bundled license expression: '+pkg.name+' / '+selected);
    notices.push(pkg.name+' '+pkg.version+' / '+selected+'\n'+sources.map(x=>'Source: '+x.name+'\n'+x.text).join('\n')+
      '\nAuthor: '+JSON.stringify(pkg.author)+'\nContributors: '+JSON.stringify(pkg.contributors)+'\nRepository: '+JSON.stringify(pkg.repository));
  }
  fs.writeFileSync(path.join(path.dirname(outfile),'export-dependency-notices.txt'),notices.join('\n\n---\n\n'));
  const {hash,verifyIncludedArtifacts}=require('./artifact-evidence');
  const inputs=Object.keys(result.metafile.inputs).sort().map(name=>{
    if(!name.includes('node_modules/'))return {path:name};
    const bytes=fs.readFileSync(path.resolve(ROOT,name));
    return {path:name,bytes:bytes.length,sha256:hash(bytes)};
  });
  if(inputs.some(x=>/node_modules\/(?:skia-canvas|fonteditor-core)\//.test(x.path)))throw Error('Native/WASM dependency entered the browser exporter');
  const included=verifyIncludedArtifacts(inputs);
  const fontkitSource=require('./fontkit-evidence').verify();
  const fontkitInputs=inputs.filter(x=>x.path.startsWith('node_modules/fontkit/dist/'));
  if(!fontkitInputs.length||fontkitInputs.some(x=>!fontkitSource.modules.some(m=>'node_modules/fontkit/'+m.path===x.path&&m.sha256===x.sha256)))throw Error('Browser fontkit entry has no source inventory');
  if(inputs.some(x=>/node_modules\/brotli\/(?:enc|build|compress)/.test(x.path)))throw Error('Unused compiled Brotli encoder entered the browser exporter');
  const outputs=[...Object.keys(result.metafile.outputs).map(name=>path.resolve(ROOT,name)),path.join(path.dirname(outfile),'export-dependency-notices.txt')]
    .map(file=>{const bytes=fs.readFileSync(file);return {path:path.basename(file),bytes:bytes.length,sha256:hash(bytes)};});
  const evidence={contract:'stipra-browser-export-audit-v1',status:included.length?'review-required':'checked',buildTool:'esbuild/'+esbuild.version,
    packages:[...roots].sort().map(dir=>{const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));return {name:pkg.name,version:pkg.version};}),
    inputs,outputs,artifactEvidence:included,fontkitSource,findings:included.map(x=>({package:x.package,kind:'prebundled-review'})),
    scope:'Browser PDF/ZIP exporter only; excludes host p5, site fonts, native CLI, unused Brotli encoder and owner artwork. Own Fontkit sources/maps and actual resolved module notices checked.'};
  fs.writeFileSync(outfile+'.audit.json',JSON.stringify(evidence,null,2)+'\n');
  return evidence;
}

if(require.main===module)build(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={build};
