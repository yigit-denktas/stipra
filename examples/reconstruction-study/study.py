"""Bounded research, not a production renderer. Pillow/SciPy plus isolated VTracer.
Keeps full source frame; native geometry and raster-only outputs are labelled.
"""
import sys,json,hashlib,time,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy.spatial import cKDTree
from scipy.ndimage import sobel

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'out/reconstruction-python'))
import vtracer
OUT=ROOT/'out/reconstruction-study'
SEED=109
INK='#006043'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def svg(path,w,h,marks):
 path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="90mm" height="{90*h/w:.5f}mm" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="#fff8ec"/><g fill="{INK}" stroke="{INK}" stroke-linecap="round">'+''.join(marks)+'</g></svg>')

def run(name,source):
 folder=OUT/name;folder.mkdir(exist_ok=True)
 original=Image.open(source).convert('RGB');im=original.copy();im.thumbnail((600,600),Image.Resampling.LANCZOS);im.save(folder/'source.png')
 w,h=im.size;gray=np.asarray(im.convert('L'),dtype=float)/255;density=(1-gray)**1.35
 small=im.convert('L').resize((144,round(h/w*144)),Image.Resampling.LANCZOS);d=(1-np.asarray(small)/255)**1.35
 yy,xx=np.indices(d.shape);coords=np.column_stack((xx.ravel()+.5,yy.ravel()+.5));weights=d.ravel()+.008
 rng=np.random.default_rng(SEED);n=3000;points=coords[rng.choice(len(coords),n,replace=False,p=weights/weights.sum())].copy()
 start=time.perf_counter()
 for _ in range(9):
  labels=cKDTree(points).query(coords)[1];mass=np.bincount(labels,weights,minlength=n)
  for k in range(2):points[:,k]=np.divide(np.bincount(labels,weights*coords[:,k],minlength=n),mass,out=points[:,k],where=mass>0)
 points*=w/144
 marks=[]
 for x,y in points:
  tone=density[min(h-1,int(y)),min(w-1,int(x))];r=.2+1.4*math.sqrt(tone)
  marks.append(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="{r:.3f}" stroke="none"/>')
 svg(folder/'01-weighted-stipple.svg',w,h,marks)
 # Local iso-tone direction from the existing SciPy Sobel operator; no invented depth.
 gx=sobel(gray,axis=1);gy=sobel(gray,axis=0);hatch=[]
 for y in range(5,h,8):
  for x in range(5,w,8):
   tone=density[y,x]
   if tone<.12:continue
   a=math.atan2(gy[y,x],gx[y,x])+math.pi/2;length=.5+tone*18
   dx=math.cos(a)*length/2;dy=math.sin(a)*length/2
   hatch.append(f'<path d="M{x-dx:.3f},{y-dy:.3f}L{x+dx:.3f},{y+dy:.3f}" fill="none" stroke-width="{.15+tone*1.8:.3f}"/>')
 svg(folder/'02-directional-hatch.svg',w,h,hatch)
 # Greedy continuous route, explicitly not a solved or optimized TSP.
 remaining=points[::5].copy();route=[remaining[0]];remaining=np.delete(remaining,0,axis=0)
 while len(remaining):
  at=int(np.argmin(np.sum((remaining-route[-1])**2,axis=1)));route.append(remaining[at]);remaining=np.delete(remaining,at,axis=0)
 commands='M'+'L'.join(f'{x:.3f},{y:.3f}'for x,y in route)
 svg(folder/'03-continuous-route.svg',w,h,[f'<path d="{commands}" fill="none" stroke-width=".75"/>'])
 # Real VTracer contour geometry from a four-level grayscale source, not SVG raster runs.
 q=im.convert('L').quantize(colors=4).convert('RGB');q.save(folder/'quantized.png')
 vtracer.convert_image_to_svg_py(str(folder/'quantized.png'),str(folder/'04-vector-regions.svg'),colormode='color',mode='polygon',filter_speckle=4,color_precision=3,layer_difference=32)
 # Pillow's established Floyd-Steinberg implementation, not a new dither engine.
 im.convert('L').convert('1',dither=Image.Dither.FLOYDSTEINBERG).convert('L').save(folder/'05-dither.png')
 # Composite two existing mark vocabularies by an explicit luminance selection.
 highlight=[m for m,(x,y) in zip(marks,points)if gray[min(h-1,int(y)),min(w-1,int(x))]>.45]
 shadow=[]
 for y in range(5,h,8):
  for x in range(5,w,8):
   if gray[y,x]<.45:shadow.append(f'<path d="M{x-2},{y+3}L{x+2},{y-3}" stroke-width=".8"/>')
 svg(folder/'06-hybrid.svg',w,h,highlight+shadow)
 return {'id':name,'sourceBytes':source.stat().st_size,'sourceSha256':digest(source),'originalPixels':list(original.size),'studyPixels':[w,h],
  'normalization':'full frame, longest edge capped at 600 px; research resampling declared; no cropping','seed':SEED,'weightedSites':n,'lloydIterations':9,
  'methodSeconds':time.perf_counter()-start,'files':{p.name:digest(p)for p in sorted(folder.iterdir()) if p.suffix=='.svg' or p.name in ['source.png','05-dither.png','quantized.png']},'physicalComparison':'each panel longest edge 90 mm',
  'representations':['circle geometry','oriented line paths','greedy continuous path, NOT optimized TSP','VTracer polygon regions, 4 grayscale levels','raster only','mixed circles and lines'],
  'limits':['Agent study only; no independent human/artist or physical print evidence','No plotter path optimization or machine-ready stencil claim','All source normalization and parameters fixed across methods']}
if __name__=='__main__':
 expected=json.loads((ROOT/'docs/evidence/reconstruction-study-01.json').read_text())['fixtures']
 for fixture,filename in zip(expected,['astronaut.png','capitol.jpg']):
  source=OUT/'sources'/filename
  if digest(source)!=fixture['sourceSha256']:raise ValueError('Source SHA-256 mismatch: '+filename)
 records=[run('portrait',OUT/'sources/astronaut.png'),run('architecture',OUT/'sources/capitol.jpg')]
 (OUT/'study.json').write_text(json.dumps({'contract':'stipra-reconstruction-study-01','fixtures':records,'vtracerVersion':'0.6.15'},indent=2)+'\n')
 print(json.dumps(records,indent=2))
