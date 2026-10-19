/* Original editorial artwork: a quiet morning, drawn as two deliberate ink passes.
 * Host drawing/PNG/PDF/ZIP stay outside the lean core. No photographs or fonts.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Canvas}=require('skia-canvas');
const WIDTH=1440,HEIGHT=1800,DPI=300,SEED=193;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

// Canvas 2D drawing only; these functions can also receive a p5.Graphics drawingContext.
function green(c){
 c.lineCap='round';c.lineJoin='round';
 const line=(pts,w=2)=>{c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 // Window frame, with its bottom opening into the table rather than a boxed panel.
 c.lineWidth=6;c.beginPath();c.moveTo(55,355);c.lineTo(55,170);c.bezierCurveTo(55,45,323,45,323,170);c.lineTo(323,305);c.stroke();
 line([[67,335],[67,172]],1.2);line([[187,77],[187,325]],3);
 line([[57,226],[322,226]],3);line([[46,355],[226,325],[377,365]],4);
 // Distant curved landscape: open paper is intentional sky.
 c.lineWidth=1.6;c.beginPath();c.moveTo(72,286);c.bezierCurveTo(125,250,166,278,178,260);c.stroke();
 c.beginPath();c.moveTo(199,290);c.bezierCurveTo(228,260,256,280,309,246);c.stroke();
 for(let i=0;i<8;i++)line([[81+i*12,299+i%3*3],[91+i*12,290+i%3*3]],.8);
 // Plant: individual leaves and branching stems.
 line([[101,436],[109,283],[82,239]],3);
 line([[108,363],[143,307],[151,266]],2);
 for(const [x,y,a]of [[91,267,-.8],[109,309,.7],[112,344,-.6],[143,301,.4],[95,391,-.8]]){
  c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-29,-31,-17,-60,0,-67);c.bezierCurveTo(18,-41,21,-14,0,0);c.fill();c.restore();
 }
 // Small pot, distinct from the table shadow.
 c.lineWidth=3;c.beginPath();c.moveTo(76,417);c.lineTo(84,466);c.quadraticCurveTo(106,480,130,465);c.lineTo(140,417);c.closePath();c.stroke();
 line([[77,427],[137,427]],1.1);
 for(let i=0;i<6;i++)line([[89+i*7,435],[93+i*5,461]],.8);
 // Folded newspaper: no miniature fake text. Marks represent editorial rhythm.
 const paper=[[152,397],[273,369],[386,436],[249,481]];
 line([...paper,paper[0]],2);line([[215,382],[312,460]],1.1);
 line([[172,402],[199,396],[228,416],[198,425],[172,402]],1.3);
 for(let i=0;i<5;i++)line([[206+i*4,431+i*5],[235+i*4,421+i*5]],.8);
 for(let i=0;i<7;i++)line([[243+i*6,388+i*4],[285+i*6,411+i*4]],i===0?3:1);
 // Mug rim and handle; the cup body belongs to the coral pass.
 c.lineWidth=2;c.beginPath();c.ellipse(338,337,36,12,0,0,Math.PI*2);c.stroke();
 c.beginPath();c.ellipse(338,338,26,6,0,Math.PI,Math.PI*2);c.stroke();
 c.lineWidth=4;c.beginPath();c.moveTo(373,349);c.bezierCurveTo(418,330,410,391,375,386);c.stroke();
 // A few short table-grain lines; the substrate remains a separate layer.
 for(const [x,y,n]of [[56,500,47],[286,505,77],[196,532,111],[354,478,27]])line([[x,y],[x+n,y-9]],.8);
}
function coral(c){
 c.save();c.globalAlpha=.22;c.beginPath();c.moveTo(200,235);c.lineTo(309,235);c.lineTo(412,505);c.lineTo(270,534);c.closePath();c.fill();c.restore();
 c.beginPath();c.arc(253,164,41,0,Math.PI*2);c.fill();
 // Cup overlaps the light beam; hollow rim remains paper.
 c.beginPath();c.moveTo(301,340);c.lineTo(306,392);c.bezierCurveTo(311,421,364,421,371,392);c.lineTo(375,340);c.bezierCurveTo(358,355,318,355,301,340);c.fill();
 c.save();c.globalAlpha=.3;c.beginPath();c.ellipse(343,420,49,9,-.18,0,Math.PI*2);c.fill();c.restore();
}
function artwork(){
 return [green,coral].map(draw=>{const canvas=new Canvas(WIDTH,HEIGHT),c=canvas.getContext('2d');
  c.scale(3,3);c.fillStyle=c.strokeStyle='#ffffff';draw(c);
  const rgba=c.getImageData(0,0,WIDTH,HEIGHT).data;
  return Uint8Array.from({length:WIDTH*HEIGHT},(_,i)=>rgba[i*4+3]);
 });
}
async function run(outDir,corePath){
 if(!outDir)throw Error('Usage: node examples/creative-use/morning-window.cjs NEW-OUTPUT-DIRECTORY [CORE-CJS-PATH]');
 const out=path.resolve(outDir);if(fs.existsSync(out))throw Error('Refusing to overwrite output directory');
 const Core=require(corePath?path.resolve(corePath):'../../packages/core/dist/index.cjs');
 const coverage=artwork(),input={width:WIDTH,height:HEIGHT,paper:'#fff8ec',inks:[
  {id:'green',name:'Window / plant / newspaper',color:'#006043',coverage:coverage[0]},
  {id:'coral',name:'Morning light / cup',color:'#FF665D',coverage:coverage[1]}]};
 const options={dpi:DPI,seed:SEED,screenRecipe:{version:1,seed:SEED,default:{mode:'solid'},plates:{coral:{mode:'hybrid',pitch:DPI/40,angle:22,solidThreshold:.9}}}};
 const start=performance.now(),result=Core.renderLayers(input,options),renderMs=performance.now()-start;
 const repeat=Core.renderLayers(input,options);
 if(!result.plates.every((p,i)=>hash(p.screened)===hash(repeat.plates[i].screened)))throw Error('Nondeterministic masks');
 const pack=await require('../../src/print-package').generateLayers({input,screenRecipe:options.screenRecipe,dpi:DPI});
 const zip=await require('jszip').loadAsync(pack.zip),{ingestLocalBytes}=require('../../src/import/node');
 const proof=await ingestLocalBytes(await zip.file('proof/composite.png').async('nodebuffer'));
 if(hash(proof.rgba)!==hash(result.proof.rgba))throw Error('Published-core/exporter proof mismatch');
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'morning-window.zip'),pack.zip);
 for(const name of ['proof/composite.png','report/separation-sheet.pdf'])fs.writeFileSync(path.join(out,path.basename(name)),await zip.file(name).async('nodebuffer'));
 const evidence={contract:'stipra-creative-use-v1',artwork:'Morning window',authorship:'Original procedural editorial illustration; no owner photographs or third-party artwork',
  coreEntry:corePath?'explicit published-package consumer':'repository build',pixels:[WIDTH,HEIGHT],dpi:DPI,seed:SEED,renderMs,
  repeatMasksIdentical:true,coreMatchesExporter:true,packageSha256:hash(pack.zip),
  plates:result.plates.map(p=>({id:p.id,coverageSha256:hash(p.coverage),screenedSha256:hash(p.screened)})),
  diagnostics:result.diagnostics,acceptance:'Agent-authored digital trial; owner, independent artist and physical acceptance not established'};
 fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');return evidence;
}
if(require.main===module)run(...process.argv.slice(2)).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={artwork,green,coral,run};
