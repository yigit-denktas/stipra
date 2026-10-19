"""One canonical evidence record. Metrics are digital, not artist/press acceptance."""
import sys,json,hashlib,re,platform,subprocess,zlib,xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np,scipy,PIL,reportlab
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/reconstruction-study';EVIDENCE=ROOT/'docs/evidence/reconstruction-study-01.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def decoded(p):
 im=Image.open(p).convert('RGBA');return {'width':im.width,'height':im.height,'mode':'RGBA8','sha256':hashlib.sha256(f'{im.width}x{im.height}:RGBA8\n'.encode()+im.tobytes()).hexdigest()}
def blocks(a):return np.array([a[y0:y1,x0:x1].mean()for y0,y1 in zip(np.linspace(0,a.shape[0],17,dtype=int)[:-1],np.linspace(0,a.shape[0],17,dtype=int)[1:])for x0,x1 in zip(np.linspace(0,a.shape[1],17,dtype=int)[:-1],np.linspace(0,a.shape[1],17,dtype=int)[1:])])
def geometry(p):
 root=ET.parse(p).getroot();circles=list(root.iter('{http://www.w3.org/2000/svg}circle'));paths=list(root.iter('{http://www.w3.org/2000/svg}path'));segments=0;length=0
 for node in paths:
  tokens=re.findall(r'[MLZmlz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',node.get('d',''));cmd='';last=None;first=None;i=0
  while i<len(tokens):
   if tokens[i]in'MLZmlz':
    cmd=tokens[i];i+=1
    if cmd.upper()=='Z':
     if last is not None and first is not None:length+=float(np.linalg.norm(last-first));segments+=1
     last=first;continue
   if i+1>=len(tokens):break
   pt=np.array([float(tokens[i]),float(tokens[i+1])]);i+=2
   if cmd.islower() and last is not None:pt+=last
   if cmd.upper()=='M':first=pt;cmd='L'if cmd=='M'else'l'
   elif last is not None:length+=float(np.linalg.norm(pt-last));segments+=1
   last=pt
 return {'elements':len(circles)+len(paths),'circles':len(circles),'paths':len(paths),'lineSegments':segments,'pathLengthSourcePx':length,'svgBytes':p.stat().st_size,'lengthScope':'M/L/Z polylines including closes; circles reported separately, no circumference added'}
def main():
 old=json.loads(EVIDENCE.read_text());data=json.loads((OUT/'generation.json').read_text());render=json.loads((OUT/'render-metrics.json').read_text())
 data['revision']='coverage-controlled-v2';data['rights']=old['rights'];data['environment']={'python':platform.python_version(),'platform':platform.platform(),'zlibRuntime':zlib.ZLIB_RUNTIME_VERSION,'numpy':np.__version__,'scipy':scipy.__version__,'Pillow':PIL.__version__,'ReportLab':reportlab.Version,'vtracerBinding':'0.6.15','node':render['node'],'skiaCanvas':render['skiaCanvas'],'sourceBaselineCommit':'29cb4fe1132c07adf1f5c0f67ab3d11596af2561','scriptsSha256':{p.name:sha(p)for p in sorted((ROOT/'examples/reconstruction-study').glob('*'))if p.is_file()and p.suffix in ['.py','.cjs']}}
 data['reproducibility']={'scope':'Same frozen points and environment checked; cross-build exact geometry is not independently verified. Encoder byte identity is not pixel identity. Runtime measurements vary.','decodedPixelHash':'SHA-256 of UTF-8 WIDTHxHEIGHT:RGBA8 + newline followed by Pillow-converted row-major RGBA8 bytes','frozenPoints':'Committed rounded five-decimal points bypass floating CDF/RNG sampling differences during replay. Cell assignment still uses the recorded SciPy build.','priorRepeatClaim':'v1 repeatGeometryAndRasterHashesIdentical meant same-machine/build only; superseded by this scoped record.'}
 replay=OUT/'replay-check.json'
 if replay.exists():
  check=json.loads(replay.read_text())
  for name,item in check['artifacts'].items():
   p=OUT/name
   assert (decoded(p)['sha256']if p.suffix=='.png'else sha(p))==item,'Stale replay evidence: '+name
  data['reproducibility']['sameEnvironmentReplay']={'matchedArtifacts':len(check['artifacts']),'allEqual':True,'scope':'SVG bytes and canonical decoded RGBA8 hashes only; encoder bytes, timings and PDF bytes excluded.'}
 data['acceptance']={'coverageToleranceAbsolute':.005,'humanBlindRankings':0,'physicalPrints':False,'independentCrossBuildReplay':False,'decisionGrade':False,'note':'Coverage controlled, geometry complexity disclosed rather than matched. Digital tone metrics do not measure artistic usefulness.'}
 for fixture in data['fixtures']:
  folder=OUT/fixture['id'];source=np.asarray(Image.open(folder/'source-luminance.png'),dtype=float);target=blocks(source);palette=fixture['vtracer']['palette'];fixture['metrics']={}
  for method in ['baseline','01-weighted-stipple','02-directional-hatch','03-continuous-route','04-vector-regions','05-dither','06-hybrid']:
   p=folder/(method+'.png');a=np.asarray(Image.open(p).convert('L'),dtype=float);stat={'coverage':float((1-a/255).mean()),'coverageError':float((source.mean()-a.mean())/255),'blockRmse8bit':float(np.sqrt(np.mean((blocks(a)-target)**2))),'inkedPixelsBelow128':int((a<128).sum()),'pixelCount':a.size,'encodedBytes':p.stat().st_size}
   svg=folder/(method+'.svg')
   if svg.exists():stat.update(geometry(svg))
   entry=next((x for x in render['metrics']if x['fixture']==fixture['id']and x['method']==method),{})
   stat.update({k:v for k,v in entry.items()if k not in ['fixture','method','coverage','coverageError']});stat['generationMilliseconds']=fixture['methodGenerationSeconds'].get(method,0)*1000
   if method=='05-dither':stat['role']='unconstrained raster tonal reference; complexity not matched'
   if method=='baseline':stat['role']='single black authored Pillow-L darkness mask through existing Core.renderLayers; solid, continuous-tone reference'
   fixture['metrics'][method]=stat
  q=np.asarray(Image.open(folder/'quantized.png').convert('L'));a=np.asarray(Image.open(folder/'04-vector-regions.png').convert('L'));nearest=np.argmin(np.abs(a[:,:,None].astype(float)-np.array(palette)),axis=2)
  before=[float((q==p).mean())for p in palette];after=[float((nearest==i).mean())for i in range(len(palette))]
  fills=sorted(set(int(x[0:2],16)for x in re.findall(r'fill="#([0-9a-fA-F]{6})"',(folder/'04-vector-regions.svg').read_text())))
  fixture['vtracer'].update({'upstreamTagCommit':'fd9cdb08e622f237eb05be553a020ddc9e4c47a1','rustCrateVersion':'0.6.12','bannerSource':'cmdapp/src/svg.rs uses CARGO_PKG_VERSION; crate/package version split verified at upstream tag','svgFillLevels':fills,'inputBandFractions':before,'renderedNearestBandFractions':after,'bandFractionL1':sum(abs(x-y)for x,y in zip(before,after)),'allFourBandsRetained':len(fills)==4 and all(x>.01 for x in after),'antialiasing':'Rendered edges may add intermediate values; SVG fills exactly match the input palette.'})
  if not fixture['vtracer']['allFourBandsRetained']:raise ValueError('VTracer lost tone bands: '+fixture['id'])
  for method in ['01-weighted-stipple','02-directional-hatch','03-continuous-route','06-hybrid']:
   if abs(fixture['metrics'][method]['coverageError'])>.005:raise ValueError('Coverage budget failed: '+method)
  fixture['artifacts']={str(p.relative_to(OUT)):{'sha256':sha(p),**({'decodedPixels':decoded(p)}if p.suffix=='.png'else{})}for p in sorted(folder.iterdir())if p.suffix in ['.png','.svg','.json']}
 # PDF is hashed after the report step; not included recursively inside itself.
 data['reportArtifacts']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size,**({'decodedPixels':decoded(p)}if p.suffix=='.png'else{})}for p in sorted(OUT.iterdir())if p.name in ['reconstruction-study-01.pdf','portrait-comparison.png','architecture-comparison.png']}
 data['contextOnly']='baseline-two-ink-context.png retains the v1 solid green/coral proof and its full recipe; excluded from monochrome metrics and main comparison.'
 EVIDENCE.write_text(json.dumps(data,indent=2)+'\n');print('Canonical evidence and coverage / four-band guards passed.')
if __name__=='__main__':main()
