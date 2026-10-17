#!/usr/bin/env node
'use strict';
const path=require('node:path'),fs=require('node:fs'),esbuild=require('esbuild');
const ROOT=path.resolve(__dirname,'..');
async function build(outfile){
  const {truetype}=require('../src/report-fonts.js');
  const fonts={};for(const [family,weight] of [['ibm-plex-sans',400],['ibm-plex-sans',700],['ibm-plex-mono',400]])fonts[family+weight]=truetype(family,weight).toString('base64');
  const svg=fs.readFileSync(path.join(ROOT,'logo_for_Readme.svg'),'utf8');
  await esbuild.build({entryPoints:[path.join(ROOT,'src/browser/export.js')],outfile,bundle:true,platform:'browser',format:'iife',globalName:'StipraExport',minify:true,
    inject:[path.join(ROOT,'src/browser/buffer.js')],define:{__dirname:'"/"'},plugins:[{name:'export-platform',setup(api){
      api.onResolve({filter:/^(?:node:(?:fs|path|crypto)|skia-canvas|\.\/report-fonts\.js)$/},args=>({path:args.path,namespace:'export-platform'}));
      api.onLoad({filter:/.*/,namespace:'export-platform'},args=>{
        if(args.path==='node:crypto')return {contents:"module.exports={createHash:require('./src/browser/adapters.js').createHash};",resolveDir:ROOT};
        if(args.path==='skia-canvas')return {contents:"module.exports=require('./src/browser/adapters.js');",resolveDir:ROOT};
        if(args.path==='node:path')return {contents:"module.exports={join:(...parts)=>parts.join('/')};"};
        if(args.path==='node:fs')return {contents:'module.exports={readFileSync:(name,encoding)=>{if(!name.endsWith("logo_for_Readme.svg"))throw Error("Unbundled export asset");return '+JSON.stringify(svg)+';}};'};
        return {contents:'const {Buffer}=require("buffer/");const fonts='+JSON.stringify(fonts)+';module.exports={truetype:(family,weight=400)=>{const data=fonts[family+weight];if(!data)throw Error("Unbundled font");return Buffer.from(data,"base64");}};',resolveDir:ROOT};
      });
    }}]});
}
if(require.main===module)build(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={build};
