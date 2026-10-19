"""Coverage-controlled research masks. Not a production renderer or plotter backend."""
import sys,json,hashlib,time,math,re
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from scipy.ndimage import sobel
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'out/reconstruction-python'))
import vtracer
OUT=ROOT/'out/reconstruction-study'
SEED=109
VTRACER={'colormode':'color','mode':'polygon','filter_speckle':4,'color_precision':8,'layer_difference':1}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def digest_text(p):
 # Line-ending independent identity for text fixtures/scripts in an autocrlf checkout.
 return hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()
def svg(path,w,h,marks):
 # Transparent monochrome masks: the host chooses ink/paper. Only proofs add white.
 # Explicit LF and UTF-8 keep SVG bytes portable across Windows and POSIX checkouts.
 path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="90mm" height="{90*h/w:.5f}mm" viewBox="0 0 {w} {h}"><g fill="#000000" stroke="#000000" stroke-linecap="round">'+''.join(marks)+'</g></svg>',encoding='utf-8',newline='\n')
def run(name,source):
 start=time.perf_counter();times={};folder=OUT/name;folder.mkdir(exist_ok=True)
 original=Image.open(source).convert('RGB');im=original.copy();im.thumbnail((600,600),Image.Resampling.LANCZOS);im.save(folder/'source.png')
 im.convert('L').save(folder/'source-luminance.png')
 w,h=im.size;gray=np.asarray(im.convert('L'),dtype=float)/255;density=1-gray
 pointfile=ROOT/'examples/reconstruction-study/points'/f'{name}.json'
 t=time.perf_counter()
 if pointfile.exists():points=np.asarray(json.loads(pointfile.read_text(encoding='utf-8'))['points'],dtype=float)
 else:
  small=im.convert('L').resize((144,round(h/w*144)),Image.Resampling.LANCZOS);d=1-np.asarray(small)/255
  yy,xx=np.indices(d.shape);coords=np.column_stack((xx.ravel()+.5,yy.ravel()+.5));weights=d.ravel()**1.35+.008
  rng=np.random.default_rng(SEED);n=3000;points=coords[rng.choice(len(coords),n,replace=False,p=weights/weights.sum())].copy()
  for _ in range(9):
   labels=cKDTree(points).query(coords)[1];mass=np.bincount(labels,weights,minlength=n)
   for k in range(2):points[:,k]=np.divide(np.bincount(labels,weights*coords[:,k],minlength=n),mass,out=points[:,k],where=mass>0)
  points=np.round(points*w/144,5);pointfile.parent.mkdir(exist_ok=True)
  pointfile.write_text(json.dumps({'sourceSha256':digest(source),'densityGridWidth':144,'seed':SEED,'lloydIterations':9,'points':points.tolist()},separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
 frozen=json.loads(pointfile.read_text(encoding='utf-8'));assert frozen['sourceSha256']==digest(source)
 assert frozen.get('densityGridWidth')==144 and frozen.get('seed')==SEED and frozen.get('lloydIterations')==9
 assert len(points)==3000 and np.all(np.isfinite(points))
 (folder/'points.json').write_bytes(pointfile.read_bytes());n=len(points)
 # Full-resolution cell area times average darkness = sum of cell darkness.
 yy,xx=np.indices(gray.shape);labels=cKDTree(points).query(np.column_stack((xx.ravel()+.5,yy.ravel()+.5)))[1]
 ink_area=np.bincount(labels,density.ravel(),minlength=n)
 marks=[f'<circle cx="{x:.5f}" cy="{y:.5f}" r="{math.sqrt(area/math.pi):.5f}" stroke="none"/>'for(x,y),area in zip(points,ink_area)]
 svg(folder/'01-weighted-stipple.svg',w,h,marks);times['01-weighted-stipple']=time.perf_counter()-t
 t=time.perf_counter();gx=sobel(gray,axis=1);gy=sobel(gray,axis=0);hatch=[];shadow=[]
 for y in range(4,h,8):
  for x in range(4,w,8):
   tone=float(density[max(0,y-4):min(h,y+4),max(0,x-4):min(w,x+4)].mean())
   if tone<=0:continue
   a=math.atan2(gy[y,x],gx[y,x])+math.pi/2;length=8;dx=math.cos(a)*length/2;dy=math.sin(a)*length/2
   # Grid-cell area 64 times local tone / path length. Global overlap calibration follows.
   mark=f'<path d="M{x-dx:.5f},{y-dy:.5f}L{x+dx:.5f},{y+dy:.5f}" fill="none" stroke-width="{8*tone:.5f}"/>'
   hatch.append(mark)
   if gray[y,x]<=.45:shadow.append(mark)
 svg(folder/'02-directional-hatch.svg',w,h,hatch);times['02-directional-hatch']=time.perf_counter()-t
 t=time.perf_counter();remaining=points[::5].copy();route=[remaining[0]];remaining=np.delete(remaining,0,axis=0)
 while len(remaining):
  at=int(np.argmin(np.sum((remaining-route[-1])**2,axis=1)));route.append(remaining[at]);remaining=np.delete(remaining,at,axis=0)
 commands='M'+'L'.join(f'{x:.5f},{y:.5f}'for x,y in route)
 svg(folder/'03-continuous-route.svg',w,h,[f'<path d="{commands}" fill="none" stroke-width="1"/>']);times['03-continuous-route']=time.perf_counter()-t
 t=time.perf_counter();q=im.convert('L').quantize(colors=4).convert('RGB');q.save(folder/'quantized.png');palette=sorted(set(np.asarray(q)[:,:,0].ravel().tolist()))
 path=folder/'04-vector-regions.svg';vtracer.convert_image_to_svg_py(str(folder/'quantized.png'),str(path),**VTRACER)
 s=path.read_text(encoding='utf-8');banner=re.search(r'Generator:([^<\n]+)',s)
 def snap(m):
  rgb=[int(m.group(1)[i:i+2],16)for i in [0,2,4]];value=min(palette,key=lambda p:abs(p-sum(rgb)/3));return 'fill="#'+f'{value:02x}'*3+'"'
 s=re.sub(r'fill="#([0-9a-fA-F]{6})"',snap,s);path.write_text(s,encoding='utf-8',newline='\n');times['04-vector-regions']=time.perf_counter()-t
 t=time.perf_counter();im.convert('L').convert('1',dither=Image.Dither.FLOYDSTEINBERG).convert('L').save(folder/'05-dither.png');times['05-dither']=time.perf_counter()-t
 t=time.perf_counter();highlight=[m for m,(x,y)in zip(marks,points)if gray[min(h-1,int(y)),min(w-1,int(x))]>.45]
 svg(folder/'06-hybrid.svg',w,h,highlight+shadow);times['06-hybrid']=time.perf_counter()-t
 return {'id':name,'sourceBytes':source.stat().st_size,'sourceSha256':digest(source),'originalPixels':list(original.size),'studyPixels':[w,h],'normalization':'full frame; longest edge capped at 600 px; no upscale/crop/stretch','physicalComparison':{'longestEdgeMm':90,'widthMm':90,'heightMm':90*h/w,'dpi':w/90*25.4},'targetDarkness':float(density.mean()),'seed':SEED,'weightedSites':n,'lloydIterations':9,'pointFixtureSha256':digest_text(pointfile),'generationSeconds':time.perf_counter()-start,'methodGenerationSeconds':times,'vtracer':{'bindingPackageVersion':'0.6.15','embeddedGeneratorBanner':banner.group(1).strip()if banner else None,'flags':VTRACER,'palette':palette,'fillSnap':'nearest input grayscale palette; no alpha/gradient conversion'},'hybrid':'actual method-01 circles selected above gray .45 plus actual method-02 directional paths selected at/below gray .45; final shared scale calibrated to target coverage','budget':'same source darkness target, not equal geometry complexity; see measured elements/segments/length/bytes/runtime','pointConstruction':'weighted Lloyd sampling on 144-px luminance grid; frozen rounded point fixture for cross-build replay'}
if __name__=='__main__':
 expected=json.loads((ROOT/'docs/evidence/reconstruction-study-01.json').read_text(encoding='utf-8'))['fixtures']
 for fixture,filename in zip(expected,['astronaut.png','capitol.jpg']):
  if digest(OUT/'sources'/filename)!=fixture['sourceSha256']:raise ValueError('Source SHA-256 mismatch: '+filename)
 records=[run('portrait',OUT/'sources/astronaut.png'),run('architecture',OUT/'sources/capitol.jpg')]
 (OUT/'generation.json').write_text(json.dumps({'contract':'stipra-reconstruction-study-01-v2','fixtures':records},indent=2)+'\n',encoding='utf-8',newline='\n')
 print('Generated two sources, six methods; render.cjs calibrates final mask coverage.')
