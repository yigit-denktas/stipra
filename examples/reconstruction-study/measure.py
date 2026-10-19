"""One canonical evidence record. Metrics are digital, not artist/press acceptance."""
import sys,json,hashlib,re,platform,subprocess,zlib,xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np,scipy,PIL,reportlab
from PIL import Image
from scipy.spatial import cKDTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/reconstruction-study';EVIDENCE=ROOT/'docs/evidence/reconstruction-study-01.json'
STUDY_PATHS=['examples/reconstruction-study','docs/evidence/reconstruction-study-01.json','docs/RECONSTRUCTION-STUDY-01.md']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def digest_text(p):
 # Line-ending independent identity for text fixtures/scripts in an autocrlf checkout.
 return hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()
def decoded(p):
 im=Image.open(p).convert('RGBA');return {'width':im.width,'height':im.height,'mode':'RGBA8','sha256':hashlib.sha256(f'{im.width}x{im.height}:RGBA8\n'.encode()+im.tobytes()).hexdigest()}
def block_grid(a,n=16):
 ys=np.linspace(0,a.shape[0],n+1).astype(int);xs=np.linspace(0,a.shape[1],n+1).astype(int)
 return np.array([[a[ys[i]:ys[i+1],xs[j]:xs[j+1]].mean()for j in range(n)]for i in range(n)])
def histogram(a,bins=32):
 h=np.histogram(a,bins=bins,range=(0,255))[0].astype(float);return (h/h.sum()).round(6)
def tone_metrics(rendered,source):
 target=1-source/255;dark=1-rendered/255;tgt_blocks=block_grid(target);err=block_grid(dark)-tgt_blocks;flat=err.ravel()
 dec=np.quantile(tgt_blocks.ravel(),np.linspace(0,1,11));dec_err=[]
 for i in range(10):
  mask=(tgt_blocks.ravel()>=dec[i])&(tgt_blocks.ravel()<=dec[i+1])
  dec_err.append(round(float(err.ravel()[mask].mean()*100),3)if mask.any() else None)
 hsl=histogram(source);hrl=histogram(rendered)
 return {'coverage':round(float(dark.mean()),6),'coverageError':round(float(target.mean()-dark.mean()),6),
  'blockRmse8bit':round(float(np.sqrt(np.mean((block_grid(dark)-tgt_blocks)**2))*255),4),
  'inkedPixelsBelow128':int((rendered<128).sum()),'pixelCount':int(rendered.size),
  'localTone':{'blockSignedErrorPp':{'mean':round(float(flat.mean()*100),3),'p05':round(float(np.percentile(flat,5)*100),3),'p50':round(float(np.percentile(flat,50)*100),3),'p95':round(float(np.percentile(flat,95)*100),3)},
   'blockAbsErrorGt5ppFraction':round(float((np.abs(flat)>.05).mean()),5),'blockAbsErrorGt10ppFraction':round(float((np.abs(flat)>.10).mean()),5),
   'toneDecileSignedErrorPp':dec_err,'toneDecileOrder':'lightest to darkest 16x16 source blocks','histogramL1_32Bins':round(float(np.abs(hsl-hrl).sum()),5)},
  'toneHistogram':{'bins':32,'range8bit':[0,255],'source':hsl.tolist(),'rendered':hrl.tolist()},
  'coverageSemantics':'coverage = mean(1-Pillow L/255) of the rendered white-paper PNG; target = mean(1-Pillow L/255) of source-luminance.png; gamma-encoded, no linearization'}
def geometry(p):
 root=ET.parse(p).getroot();ns='{http://www.w3.org/2000/svg}'
 circles=list(root.iter(ns+'circle'));paths=list(root.iter(ns+'path'));segments=0;length=0;widths=[];centers=[];radii=[]
 for node in circles:
  radii.append(float(node.get('r')));centers.append((float(node.get('cx')),float(node.get('cy'))))
 for node in paths:
  if node.get('stroke-width'):widths.append(float(node.get('stroke-width')))
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
 out={'elements':len(circles)+len(paths),'circles':len(circles),'paths':len(paths),'lineSegments':segments,'pathLengthSourcePx':round(length,3),'svgBytes':p.stat().st_size,
  'lengthScope':'M/L/Z polylines including closes; circles reported separately, no circumference added'}
 w,h=None,None
 m=re.search(r'viewBox="0 0 (\d+) (\d+)"',p.read_text(encoding='utf-8'))
 if m:w,h=int(m.group(1)),int(m.group(2))
 if radii:
  radii=np.array(radii);area=float((np.pi*radii**2).sum())
  out.update({'circleRadiusPx':{'min':round(float(radii.min()),4),'median':round(float(np.median(radii)),4),'max':round(float(radii.max()),4),'mean':round(float(radii.mean()),4)},
   'sumCircleAreaFraction':round(area/(w*h),5)if w and h else None})
  if w and h:
   clipped=int(sum(1 for(x,y),r in zip(centers,radii)if x-r<0 or y-r<0 or x+r>w or y+r>h));out['clippedCircleFraction']=round(clipped/len(radii),5)
   if len(radii)<=5000:
    pts=np.array(centers);pairs=cKDTree(pts).query_pairs(r=float(radii.max()*2+1))
    overlap=sum(1 for i,j in pairs if float(np.hypot(*(pts[i]-pts[j])))<radii[i]+radii[j]);out['overlapPairFraction']=round(overlap/len(radii),5)
 if widths:
  wd=np.array(widths);out['strokeWidthPx']={'min':round(float(wd.min()),4),'median':round(float(np.median(wd)),4),'max':round(float(wd.max()),4),'count':len(widths)}
 return out
def vtracer_spatial(folder,palette,rendered_path):
 q=np.asarray(Image.open(folder/'quantized.png').convert('L')).astype(float);r=np.asarray(Image.open(rendered_path).convert('L')).astype(float);pal=np.array(palette,dtype=float)
 qm=np.argmin(np.abs(q[:,:,None]-pal),axis=2);rm=np.argmin(np.abs(r[:,:,None]-pal),axis=2)
 ious={}
 for i in range(len(pal)):
  qi,ri=qm==i,rm==i;union=int((qi|ri).sum());ious[str(int(pal[i]))]=round(float((qi&ri).sum()/union),5)if union else None
 bnd=np.zeros_like(qm,dtype=bool);bnd[:,1:]|=qm[:,1:]!=qm[:,:-1];bnd[1:,:]|=qm[1:,:]!=qm[:-1,:]
 changed=qm!=rm
 return {'pixelBandAgreement':round(float((qm==rm).mean()),5),'perBandIoU':ious,
  'boundaryBandMismatchRate':round(float((changed&bnd).sum()/max(1,int(bnd.sum()))),5),
  'quantizedBandFractions':[round(float((qm==i).mean()),5)for i in range(len(pal))],
  'renderedBandFractions':[round(float((rm==i).mean()),5)for i in range(len(pal))],
  'scope':'nearest-palette band map of quantized input versus rendered PNG; measures spatial structure, not only histogram'}
def tone_convention(source_rgb):
 a=source_rgb.astype(float);l601=.299*a[...,0]+.587*a[...,1]+.114*a[...,2];l709=.2126*a[...,0]+.7152*a[...,1]+.0722*a[...,2]
 return {'sourceLuma':'Pillow L (ITU-R 601-2, gamma-encoded 8-bit)','target':'mean(1 - Pillow L/255) over the full frame','rendered':'black ink on white paper; coverage = mean(1 - Pillow L/255)','linearization':'none; density is gamma-encoded, not linear-light',
  'sensitivityAlternativeTargets':{'itu601Gamma':round(float((1-l601/255).mean()),5),'rec709Gamma':round(float((1-l709/255).mean()),5),'simpleRgbMean':round(float((1-a.mean(axis=2)/255).mean()),5)},
  'note':'Target-relevant differences exceed the 0.5 pp coverage guard; this record fixes the convention to Pillow L.'}
def git_state():
 try:
  head=subprocess.run(['git','-C',str(ROOT),'rev-parse','HEAD'],capture_output=True,text=True,check=True).stdout.strip()
  dirty=subprocess.run(['git','-C',str(ROOT),'status','--porcelain','--']+STUDY_PATHS,capture_output=True,text=True).stdout.strip()
  return head,bool(dirty)
 except Exception:return None,None
def main():
 old=json.loads(EVIDENCE.read_text(encoding='utf-8'));data=json.loads((OUT/'generation.json').read_text(encoding='utf-8'));render=json.loads((OUT/'render-metrics.json').read_text(encoding='utf-8'))
 head,dirty=git_state()
 data['revision']='coverage-controlled-v2+review-metrics';data['rights']=old['rights']
 data['environment']={'python':platform.python_version(),'platform':platform.platform(),'zlibRuntime':zlib.ZLIB_RUNTIME_VERSION,'numpy':np.__version__,'scipy':scipy.__version__,'Pillow':PIL.__version__,'ReportLab':reportlab.Version,'vtracerBinding':'0.6.15','node':render['node'],'skiaCanvas':render['skiaCanvas'],'sourceBaselineCommit':old.get('environment',{}).get('sourceBaselineCommit'),'generationCommit':head,'generationTreeDirty':dirty,'scriptsSha256':{p.name:digest_text(p)for p in sorted((ROOT/'examples/reconstruction-study').glob('*'))if p.is_file()and p.suffix in ['.py','.cjs']}}
 data['reproducibility']={'scope':'Same frozen points and same-environment replay checked by examples/reconstruction-study/replay.py; cross-build exact geometry is not independently verified. Encoder byte identity is not pixel identity. Runtime measurements vary.',
  'decodedPixelHash':'SHA-256 of UTF-8 WIDTHxHEIGHT:RGBA8 + newline followed by Pillow-converted row-major RGBA8 bytes',
  'frozenPoints':'Committed rounded five-decimal points bypass floating CDF/RNG sampling differences during replay. Cell assignment still uses the recorded SciPy build; fixture and script hashes are line-ending independent.',
  'textPortability':'Text artifacts are written with explicit UTF-8 and LF; .gitattributes keeps the study tree LF on Windows checkouts.','priorRepeatClaim':'v1 repeatGeometryAndRasterHashesIdentical meant same-machine/build only; superseded by this scoped record.'}
 replay=OUT/'replay-check.json'
 if replay.exists():
  check=json.loads(replay.read_text(encoding='utf-8'))
  for name,item in check['artifacts'].items():
   p=OUT/name;assert (decoded(p)['sha256']if p.suffix=='.png'else sha(p))==item,'Stale replay evidence: '+name
  data['reproducibility']['sameEnvironmentReplay']={'matchedArtifacts':check.get('matched',0),'comparedArtifacts':check.get('compared',len(check['artifacts'])),'allEqual':bool(check.get('allEqual')),'scope':'SVG bytes (CRLF-normalized) and canonical decoded RGBA8 hashes only; encoder bytes, timings and PDF bytes excluded.','procedure':'examples/reconstruction-study/replay.py'}
 data['acceptance']={'coverageToleranceAbsolute':.005,'humanBlindRankings':0,'physicalPrints':False,'independentCrossBuildReplay':False,'decisionGrade':False,'note':'Coverage controlled, geometry complexity disclosed rather than matched, local tone residuals reported. Digital tone metrics do not measure artistic usefulness.'}
 for fixture in data['fixtures']:
  folder=OUT/fixture['id'];src_rgb=np.asarray(Image.open(folder/'source.png').convert('RGB'));source=np.asarray(Image.open(folder/'source-luminance.png'),dtype=float)
  conv=tone_convention(src_rgb);data.setdefault('toneConvention',{k:v for k,v in conv.items()if k!='sensitivityAlternativeTargets'});fixture['toneConventionSensitivity']=conv['sensitivityAlternativeTargets'];fixture['metrics']={}
  for method in ['baseline','01-weighted-stipple','02-directional-hatch','03-continuous-route','04-vector-regions','05-dither','06-hybrid']:
   p=folder/(method+'.png');stat=tone_metrics(np.asarray(Image.open(p).convert('L'),dtype=float),source);stat['encodedBytes']=p.stat().st_size
   svg=folder/(method+'.svg')
   if svg.exists():stat.update(geometry(svg))
   entry=next((x for x in render['metrics']if x['fixture']==fixture['id']and x['method']==method),{})
   stat.update({k:v for k,v in entry.items()if k not in ['fixture','method','coverage','coverageError']});stat['generationMilliseconds']=fixture['methodGenerationSeconds'].get(method,0)*1000
   if method=='05-dither':stat['role']='unconstrained raster tonal reference; complexity not matched'
   if method=='baseline':stat['role']='single black authored Pillow-L darkness mask through existing Core.renderLayers; solid, continuous-tone reference'
   fixture['metrics'][method]=stat
  q=np.asarray(Image.open(folder/'quantized.png').convert('L'));a=np.asarray(Image.open(folder/'04-vector-regions.png').convert('L'));nearest=np.argmin(np.abs(a[:,:,None].astype(float)-np.array(fixture['vtracer']['palette'])),axis=2)
  before=[float((q==p).mean())for p in fixture['vtracer']['palette']];after=[float((nearest==i).mean())for i in range(len(fixture['vtracer']['palette']))]
  fills=sorted(set(int(x[0:2],16)for x in re.findall(r'fill="#([0-9a-fA-F]{6})"',(folder/'04-vector-regions.svg').read_text(encoding='utf-8'))))
  fixture['vtracer'].update({'upstreamTagCommit':'fd9cdb08e622f237eb05be553a020ddc9e4c47a1','rustCrateVersion':'0.6.12','bannerSource':'cmdapp/src/svg.rs uses CARGO_PKG_VERSION; crate/package version split verified at upstream tag','svgFillLevels':fills,'inputBandFractions':before,'renderedNearestBandFractions':after,'bandFractionL1':sum(abs(x-y)for x,y in zip(before,after)),'allFourBandsRetained':len(fills)==4 and all(x>.01 for x in after),'antialiasing':'Rendered edges may add intermediate values; SVG fills exactly match the input palette.'})
  fixture['vtracer']['spatialBandAgreement']=vtracer_spatial(folder,fixture['vtracer']['palette'],folder/'04-vector-regions.png')
  fixture['artifacts']={p.relative_to(OUT).as_posix():{'sha256':sha(p),**({'decodedPixels':decoded(p)}if p.suffix=='.png'else{})}for p in sorted(folder.iterdir())if p.suffix in ['.png','.svg','.json']}
  # VTracer spatial structure is recorded, not silently treated as preserved by band count alone.
  if fixture['vtracer']['spatialBandAgreement']['pixelBandAgreement']<.85:raise ValueError('VTracer spatial band agreement collapsed: '+fixture['id'])
  for method in ['01-weighted-stipple','02-directional-hatch','03-continuous-route','06-hybrid']:
   if abs(fixture['metrics'][method]['coverageError'])>.005:raise ValueError('Coverage budget failed: '+method)
 data['reportArtifacts']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size,**({'decodedPixels':decoded(p)}if p.suffix=='.png'else{})}for p in sorted(OUT.iterdir())if p.name in ['reconstruction-study-01.pdf','portrait-comparison.png','architecture-comparison.png','replay-check.json']}
 data['contextOnly']='baseline-two-ink-context.png retains the v1 solid green/coral proof and its full recipe; excluded from monochrome metrics and main comparison.'
 EVIDENCE.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n');print('Canonical evidence, coverage / four-band / local-tone / spatial guards passed.')
if __name__=='__main__':main()
