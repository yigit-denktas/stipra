#!/usr/bin/env node
/* #125 private metric helper: reads already-generated owner ZIPs, writes numbers only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),JSZip=require('jszip');
const {ingestLocalBytes}=require('../src/import/node.js');
const dataset=require('../tests/fixtures/owner-photo-fixtures.json');
const ROIS={
  A:{ridges:[250,150,300,300]},
  B:{display:[650,220,600,430],trunks:[1000,650,700,600],tallTrunk:[1500,250,400,950]},
  C:{figures:[470,1250,240,200]},
};
const DEFINITIONS={
  gray:'encoded-sRGB luma: .2126 R + .7152 G + .0722 B (8-bit channels; alpha ignored)',
  tone:'1 - gray / 255',
  gradient:'mean((I[y+1,x]-I[y,x])^2) + mean((I[y,x+1]-I[y,x])^2), squared tone units; I = 1 - gray/255; missing neighbor axes contribute zero',
  standardDeviation:'population standard deviation of encoded-sRGB gray, in 0..255 gray levels',
  correlation:'Pearson r between source tone and proof tone in the native-pixel ROI',
  blur:'3-pixel-radius separable Gaussian, sigma=1, applied to RGB channels before gray/ROI metrics',
  continuousCoverage:'mean(1 - plateGray/255) over the ROI, using unscreened plates/',
  screenedCoverage:'mean(1 - plateGray/255) over the ROI, using screened/',
  coverage:'both continuous and screened per-ink ROI coverage; full-frame diagnostics are read from report/diagnostics.json',
  roi:'[x, y, width, height] in native source pixels',
};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

function gray(rgba,w,h){
  const out=new Float64Array(w*h);
  for(let i=0,j=0;i<rgba.length;i+=4,j++)out[j]=.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];
  return out;
}
function blurRgba(rgba,w,h){
  const kernelRadius=3,sigma=1,weights=[];
  for(let i=-kernelRadius;i<=kernelRadius;i++)weights.push(Math.exp(-(i*i)/(2*sigma*sigma)));
  const sum=weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++)weights[i]/=sum;
  const pass=(src,out,horizontal)=>{
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<4;c++){
      let value=0;
      for(let k=-kernelRadius;k<=kernelRadius;k++){
        const xx=horizontal?Math.min(w-1,Math.max(0,x+k)):x;
        const yy=horizontal?y:Math.min(h-1,Math.max(0,y+k));
        value+=src[(yy*w+xx)*4+c]*weights[k+kernelRadius];
      }
      out[(y*w+x)*4+c]=Math.round(value);
    }
  };
  const tmp=new Uint8ClampedArray(rgba.length),out=new Uint8ClampedArray(rgba.length);
  pass(rgba,tmp,true);pass(tmp,out,false);return out;
}
function pearson(a,b){
  if(a.length!==b.length)throw Error('Pearson arrays must match');
  let ma=0,mb=0;for(let i=0;i<a.length;i++){ma+=a[i];mb+=b[i];}ma/=a.length;mb/=b.length;
  let cov=0,va=0,vb=0;
  for(let i=0;i<a.length;i++){const da=a[i]-ma,db=b[i]-mb;cov+=da*db;va+=da*da;vb+=db*db;}
  if(!va||!vb)return null;return cov/Math.sqrt(va*vb);
}
function region(rgba,w,h,box){
  const [x,y,width,height]=box;
  if(![x,y,width,height].every(Number.isInteger)||x<0||y<0||width<1||height<1||x+width>w||y+height>h)
    throw Error('ROI outside native frame');
  const g=new Float64Array(width*height);let n=0;
  for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)g[n++]=grayPixel(rgba,(yy*w+xx)*4);
  return {g,width,height,x,y};
}
function grayPixel(rgba,i){return .2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];}
function stats(source,proof,box,blurredSource=null,blurredProof=null){
  const s=region(source.rgba,source.width,source.height,box),p=region(proof.rgba,proof.width,proof.height,box);
  const st=arr=>{
    let mean=0;for(const v of arr.g)mean+=v;mean/=arr.g.length;
    let variance=0;for(const v of arr.g)variance+=(v-mean)**2;variance/=arr.g.length;
    let gx=0,gy=0,cx=0,cy=0;
    for(let y=0;y<arr.height;y++)for(let x=0;x<arr.width;x++){
      if(x+1<arr.width){const d=arr.g[y*arr.width+x+1]-arr.g[y*arr.width+x];gx+=d*d;cx++;}
      if(y+1<arr.height){const d=arr.g[(y+1)*arr.width+x]-arr.g[y*arr.width+x];gy+=d*d;cy++;}
    }
    return {mean:mean/255,std:Math.sqrt(variance),gradient:((cx?gx/cx:0)+(cy?gy/cy:0))/(255*255)};
  };
  const sourceStats=st(s),proofStats=st(p);
  let blurredCorrelation=null;
  if(blurredSource&&blurredProof){
    const bs=region(blurredSource.rgba,blurredSource.width,blurredSource.height,box);
    const bp=region(blurredProof.rgba,blurredProof.width,blurredProof.height,box);
    blurredCorrelation=pearson(bs.g,bp.g);
  }
  return {
    roi:box,
    sourceTone:round(1-sourceStats.mean,4),proofTone:round(1-proofStats.mean,4),
    sourceStd:round(sourceStats.std,2),proofStd:round(proofStats.std,2),
    sourceGradient:round(sourceStats.gradient,8),proofGradient:round(proofStats.gradient,8),
    rawCorrelation:round(pearson(s.g,p.g),4),
    blurredCorrelation:round(blurredCorrelation,4),
  };
}
function round(v,n){return typeof v==='number'?Number(v.toFixed(n)):v;}
async function readPng(zip,entry){
  const bytes=await zip.file(entry).async('nodebuffer'),asset=await ingestLocalBytes(bytes,entry.split('/').pop());
  return {width:asset.metadata.oriented.width,height:asset.metadata.oriented.height,rgba:asset.rgba};
}
async function readPlates(zip,prefix){
  const out={};
  for(const entry of Object.keys(zip.files)){
    if(!entry.startsWith(prefix)||!entry.endsWith('.png'))continue;
    const match=/^ink-\d+-(.+)\.png$/.exec(entry.split('/').pop());
    if(!match)throw Error('Unexpected plate name '+entry);
    out[match[1]]=await readPng(zip,entry);
  }
  return out;
}
async function loadPackage(file,fid){
  const bytes=fs.readFileSync(file),zip=await JSZip.loadAsync(bytes);
  const original=await zip.file('source/original.jpg').async('nodebuffer');
  const diagnostics=JSON.parse(await zip.file('report/diagnostics.json').async('string'));
  const source=await readPng(zip,'source/normalized.png'),proof=await readPng(zip,'proof/composite.png');
  const plates=await readPlates(zip,'plates/'),screened=await readPlates(zip,'screened/');
  const fixture=dataset.fixtures.find(f=>f.id===fid);
  if(sha(original)!==fixture.sha256)throw Error(fid+': source original does not match fixture');
  if(source.width!==fixture.widthPx||source.height!==fixture.heightPx)throw Error(fid+': native frame mismatch');
  return {file,sha256:sha(bytes),originalSha:sha(original),diagnostics,source,proof,plates,screened};
}
function coverage(img,box){
  const r=region(img.rgba,img.width,img.height,box);
  let sum=0;for(const v of r.g)sum+=1-v/255;
  return round(sum/r.g.length,5);
}
function coverageMap(images,box){
  return Object.fromEntries(Object.entries(images).map(([id,img])=>[id,coverage(img,box)]));
}
async function measureFixture(fid,baselineFile,candidateFile){
  const baseline=await loadPackage(baselineFile,fid),candidate=await loadPackage(candidateFile,fid);
  if(baseline.originalSha!==candidate.originalSha)throw Error(fid+': source changed');
  const baselineBlur={width:baseline.source.width,height:baseline.source.height,rgba:blurRgba(baseline.source.rgba,baseline.source.width,baseline.source.height)};
  const candidateBlur={width:candidate.source.width,height:candidate.source.height,rgba:blurRgba(candidate.source.rgba,candidate.source.width,candidate.source.height)};
  const baselineProofBlur={width:baseline.proof.width,height:baseline.proof.height,rgba:blurRgba(baseline.proof.rgba,baseline.proof.width,baseline.proof.height)};
  const candidateProofBlur={width:candidate.proof.width,height:candidate.proof.height,rgba:blurRgba(candidate.proof.rgba,candidate.proof.width,candidate.proof.height)};
  const rois={};
  for(const [name,box] of Object.entries(ROIS[fid]))rois[name]={
    baseline:{...stats(baseline.source,baseline.proof,box,baselineBlur,baselineProofBlur),continuousCoverage:coverageMap(baseline.plates,box),screenedCoverage:coverageMap(baseline.screened,box)},
    candidate:{...stats(candidate.source,candidate.proof,box,candidateBlur,candidateProofBlur),continuousCoverage:coverageMap(candidate.plates,box),screenedCoverage:coverageMap(candidate.screened,box)},
  };
  return {
    source:{sha256:baseline.originalSha,width:baseline.source.width,height:baseline.source.height},
    baseline:{zip:path.basename(baselineFile),sha256:baseline.sha256,inks:baseline.diagnostics.plates.map(p=>({id:p.id,meanCoverage:p.meanCoverage,additiveInkShare:p.additiveInkShare}))},
    candidate:{zip:path.basename(candidateFile),sha256:candidate.sha256,inks:candidate.diagnostics.plates.map(p=>({id:p.id,meanCoverage:p.meanCoverage,additiveInkShare:p.additiveInkShare})),overall:candidate.diagnostics.overall},
    rois,
  };
}
async function main(argv){
  const opts={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i],value=argv[i+1];
    if(!['--baseline','--candidate','--out'].includes(key)||!value||value.startsWith('--'))throw Error('Usage: node scripts/owner-recipe-review.js --baseline DIR --candidate DIR --out FILE');
    opts[key]=value;i++;
  }
  if(!opts['--baseline']||!opts['--candidate']||!opts['--out'])throw Error('Usage: node scripts/owner-recipe-review.js --baseline DIR --candidate DIR --out FILE');
  const result={contract:'stipra-owner-recipe-review-v1',definitions:DEFINITIONS,rois:ROIS,fixtures:{}};
  for(const f of dataset.fixtures){
    const baseline=path.join(opts['--baseline'],'stipra-owner-'+f.id+'-print.zip'),candidate=path.join(opts['--candidate'],'stipra-owner-'+f.id+'-print.zip');
    result.fixtures[f.id]=await measureFixture(f.id,baseline,candidate);
  }
  fs.writeFileSync(opts['--out'],JSON.stringify(result,null,2)+'\n');
  process.stdout.write(JSON.stringify({contract:result.contract,out:opts['--out'],fixtures:Object.keys(result.fixtures)})+'\n');
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error('owner-recipe-review: '+e.message);process.exitCode=1;});
module.exports={ROIS,DEFINITIONS,gray,blurRgba,pearson,region,stats,coverage,coverageMap,measureFixture};
