'use strict';
const {openArchive}=require('./archive'),{loadImage,Canvas}=require('skia-canvas'),{PDFDocument,PDFDict,PDFName,PDFRawStream}=require('pdf-lib');
const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
function frame(w,h){if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1||w>20000||h>20000||w*h>24000000)throw Error('Package frame exceeds bounds');}
function density(bytes,dpi){
  let found=false;
  for(let at=8;at+12<=bytes.length;){
    const size=bytes.readUInt32BE(at),end=at+12+size;if(end>bytes.length)throw Error('Truncated PNG');
    if(bytes.toString('ascii',at+4,at+8)==='pHYs'){
      if(found||size!==9||bytes[at+16]!==1||bytes.readUInt32BE(at+8)!==Math.round(dpi*1000/25.4)||bytes.readUInt32BE(at+12)!==Math.round(dpi*1000/25.4))throw Error('PNG physical density mismatch');found=true;
    }
    at=end;
  }
  if(!found)throw Error('PNG missing physical density');
}
async function pixels(bytes,w,h){
  if(bytes.length<33||bytes.toString('hex',0,8)!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)!==w||bytes.readUInt32BE(20)!==h||bytes[24]!==8)throw Error('PNG master frame/precision mismatch');
  const image=await loadImage(bytes);if(image.width!==w||image.height!==h)throw Error('Decoded PNG frame mismatch');
  const canvas=new Canvas(w,h),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,w,h).data;
}
/** Verifies package hashes and decoded masters; hashes do not authenticate authorship or press quality. */
async function verify(bytes){
  const archive=await openArchive(bytes),read=name=>archive.read(name),manifest=JSON.parse(await archive.read('manifest.json',1024*1024));
  if(manifest.contract!=='stipra-print-package-v1'||!Array.isArray(manifest.files)||manifest.files.length>255)throw Error('Unsupported print manifest');
  const files=new Map();
  for(const file of manifest.files){
    if(!file||typeof file.path!=='string'||file.path==='manifest.json'||files.has(file.path)||!Number.isSafeInteger(file.bytes)||file.bytes<0||!/^[a-f0-9]{64}$/.test(file.sha256))throw Error('Invalid/repeated file record');
    const data=await read(file.path);if(data.length!==file.bytes||hash(data)!==file.sha256)throw Error('Package file hash mismatch: '+file.path);files.set(file.path,file);
  }
  if(archive.names.length!==files.size+1||archive.names.some(name=>name!=='manifest.json'&&!files.has(name)))throw Error('Unlisted package files');
  const source=archive.names.filter(name=>/^source\/original\.[a-z]+$/.test(name));
  if(source.length!==1||hash(await read(source[0]))!==manifest.source?.sha256)throw Error('Original source hash mismatch');
  const output=manifest.output,w=output?.sourcePixels?.width,h=output?.sourcePixels?.height;frame(w,h);
  require('./export-plan').validate(output.dpi,output.marksMm);
  if(!output.registration||['x','y','rotate'].some(key=>output.registration[key]!==0))throw Error('Output production registration must be zero');
  if(output.bleedGenerated===true||output.bleedMm&&Object.values(output.bleedMm).some(value=>value!==0))throw Error('Unsupported generated bleed');
  if(output.resampled!==false||output.origin?.x!==0||output.origin?.y!==0||output.trimPixels?.x!==0||output.trimPixels?.y!==0||output.trimPixels?.width!==w||output.trimPixels?.height!==h||manifest.source?.oriented?.width!==w||manifest.source?.oriented?.height!==h)throw Error('Source/trim origin or dimensions mismatch');
  for(const [key,size]of [['width',w],['height',h]])if(!Number.isFinite(output.trimMm?.[key])||Math.abs(output.trimMm[key]-size*25.4/output.dpi)>.00011)throw Error('Physical trim mismatch');
  const inks=manifest.inks;if(!Array.isArray(inks)||inks.length<1||inks.length>8||new Set(inks.map(x=>x.id)).size!==inks.length)throw Error('Invalid ink list');
  const masterPaths=new Set();
  const recipe=JSON.parse(await read('recipe/inks.json')),production=require('./screening').config(JSON.parse(await read('recipe/screens.json')),inks.map(i=>i.id));
  if(recipe.mode!=='authored')require('./separation').validate(recipe);
  if(recipe.version!==1||!/^#[a-f0-9]{6}$/i.test(recipe.paper)||!Array.isArray(recipe.inks)||recipe.inks.some(i=>typeof i.id!=='string'||!/^[a-z][a-z0-9_-]{0,63}$/.test(i.id)||typeof i.name!=='string'||!i.name.trim()||!/^#[a-f0-9]{6}$/i.test(i.color)))throw Error('Invalid ink identity recipe');
  if(recipe.mode!==manifest.mode||recipe.paper!==manifest.paper||recipe.inks?.length!==inks.length||Object.values(production.plates).some(p=>Object.values(p.registration).some(v=>v!==0)))throw Error('Production recipe metadata mismatch');
  for(const [index,ink]of inks.entries()){
    if(['id','name','color'].some(key=>recipe.inks[index][key]!==ink[key]))throw Error('Ink assignment metadata mismatch');
    for(const name of [ink.plate,ink.screened,...(ink.marked?[ink.marked]:[]),...(ink.vector?[ink.vector]:[])]){if(masterPaths.has(name))throw Error('Ink masters must have distinct file paths');masterPaths.add(name);}
    if(!ink.registration||Object.values(ink.registration).some(x=>x!==0))throw Error('Production registration must be zero');
    let screened;
    for(const [key,mean]of [['plate','meanCoverage'],['screened','screenedMeanCoverage']]){
      if(!files.has(ink[key]))throw Error('Missing ink master');
      const data=await read(ink[key]);density(data,output.dpi);const rgba=await pixels(data,w,h);let sum=0;
      for(let p=0;p<rgba.length;p+=4){if(rgba[p]!==rgba[p+1]||rgba[p]!==rgba[p+2]||rgba[p+3]!==255)throw Error('Master must be opaque grayscale');sum+=255-rgba[p];}
      if(!Number.isFinite(ink[mean])||Math.abs(sum/(255*w*h)-ink[mean])>(manifest.mode==='authored'?5.1e-7:1e-8))throw Error('Master coverage statistic mismatch');
      if(key==='screened')screened=rgba;
    }
    if(ink.vector){
      if(!files.has(ink.vector)||ink.vectorRepresentation!=='sampled-pixel-run-paths')throw Error('Invalid vector representation');
      const svg=(await read(ink.vector)).toString();
      if(!/^<svg\b/.test(svg)||/<(?:image|script|foreignObject)\b|\bon\w+\s*=|href\s*=|url\s*\(|<!/i.test(svg))throw Error('Unsafe or embedded-raster plate SVG');
      const expected=require('./vector-samples').svgSamples(screened,w,h,{dpi:output.dpi}).text;
      if(svg!==expected)throw Error('Vector paths do not represent recorded native master pixels');
    }
    const pad=Math.round(output.dpi*output.marksMm/25.4);
    if(pad){
      if(output.markedPixels?.width!==w+2*pad||output.markedPixels?.height!==h+2*pad||output.markedPixels?.trimOrigin?.x!==pad||output.markedPixels?.trimOrigin?.y!==pad||!files.has(ink.marked))throw Error('Marked master frame mismatch');
      const data=await read(ink.marked);density(data,output.dpi);const marked=await pixels(data,w+2*pad,h+2*pad);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=(y*w+x)*4,b=((y+pad)*(w+2*pad)+x+pad)*4;for(let c=0;c<4;c++)if(screened[a+c]!==marked[b+c])throw Error('Marks altered trim pixels');}
    }else if(ink.marked)throw Error('Unexpected marked master');
  }
  const report=manifest.report;if(report?.inspectionOnly!==true||!files.has(report.pdf)||!files.has(report.html))throw Error('Missing inspection report');
  const orientation=require('./report-layout').orientation(w,h),portrait=orientation==='portrait';
  if(report.widthMm!==(portrait?210:297)||report.heightMm!==(portrait?297:210)||report.orientation!==orientation)throw Error('Expected A4 inspection orientation');
  const pdf=await PDFDocument.load(await read(report.pdf));
  if(pdf.getPageCount()<2||pdf.getPageCount()>16)throw Error('Unexpected inspection page count');
  for(const page of pdf.getPages())if(Math.abs(page.getWidth()-report.widthMm*72/25.4)>.02||Math.abs(page.getHeight()-report.heightMm*72/25.4)>.02)throw Error('Inspection PDF geometry mismatch');
  let embeddedFontsVerified=false;
  if(report.layoutVersion>=7){
    const declared=report.fontAssets;
    if(!Array.isArray(declared)||declared.length!==3||declared.some(x=>!/^[a-f0-9]{64}$/.test(x.sha256))||new Set(declared.map(x=>x.sha256)).size!==3)throw Error('Missing or duplicate report font identities');
    const embedded=[];
    for(const [,object] of pdf.context.enumerateIndirectObjects()){
      if(!(object instanceof PDFDict)||!object.has(PDFName.of('FontFile2')))continue;
      const stream=pdf.context.lookup(object.get(PDFName.of('FontFile2')));
      if(!(stream instanceof PDFRawStream)||stream.dict.get(PDFName.of('Filter'))?.toString()!=='/FlateDecode')throw Error('Unsupported report font stream');
      embedded.push(hash(require('node:zlib').inflateSync(stream.contents,{maxOutputLength:2000000})));
      if(embedded.length>3)throw Error('Unexpected extra report font');
    }
    if(JSON.stringify(embedded.sort())!==JSON.stringify(declared.map(x=>x.sha256).sort()))throw Error('Embedded report font hashes do not match manifest');
    embeddedFontsVerified=true;
  }
  const proofExports=manifest.exports?.proofs??[];
  if(manifest.exports){const spec=require('./proof-exports').settings(manifest.exports.settings,w,h);if(proofExports.length!==spec.formats.length||new Set(proofExports.map(p=>p.format)).size!==proofExports.length||proofExports.some(p=>!spec.formats.includes(p.format)||p.scale!==spec.scale||p.path!=='exports/proof.'+p.format))throw Error('Derivative list does not match export settings');}
  for(const item of proofExports){
    if(!files.has(item.path)||!['png','jpg','webp','svg'].includes(item.format)||!Number.isInteger(item.scale)||item.scale<1||item.scale>3||item.width!==w*item.scale||item.height!==h*item.scale||item.effectiveDpi!==output.dpi*item.scale)throw Error('Proof derivative metadata mismatch');
    frame(item.width,item.height);const data=await read(item.path);
    if(item.format==='svg'){
      const svg=data.toString();if(!svg.includes('viewBox="0 0 '+item.width+' '+item.height+'"')||/<image\b|href\s*=|<script\b|<!|\bon\w+\s*=/i.test(svg))throw Error('Invalid sampled proof SVG');
    }else{
      const valid=item.format==='png'?data.toString('hex',0,8)==='89504e470d0a1a0a':item.format==='jpg'?data[0]===255&&data[1]===216:data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
      if(!valid)throw Error('Proof codec signature mismatch');
      const image=await loadImage(data);if(image.width!==item.width||image.height!==item.height)throw Error('Proof decoded dimensions mismatch');
      if(item.format==='png')density(data,item.effectiveDpi);
    }
  }
  return {contract:'stipra-package-verification-v1',status:'VERIFIED_DIGITAL_NOT_PHYSICALLY_VALIDATED',packageSha256:hash(bytes),
    sourceSha256:manifest.source.sha256,files:files.size,inspectionPages:pdf.getPageCount(),embeddedFontsVerified,frame:{width:w,height:h,origin:{x:0,y:0},dpi:output.dpi},inks:inks.length,
    checks:['file-set, byte lengths and SHA-256','native trim and physical DPI','opaque grayscale masters and measured coverage','zero production registration','marked trim pixel identity','inspection PDF geometry','declared derivative codecs and dimensions'],
    warnings:['Byte hashes are integrity checks, not proof of origin or ownership.','RGB proof and sampled SVG paths are not calibrated physical press output.'],manifest};
}
module.exports={verify};
