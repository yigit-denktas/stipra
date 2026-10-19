"""Two-source comparison at identical full-frame physical sizes, not press validation."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3,landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
fontroot=Path(__file__).resolve().parents[2]/".cache/stipra-paper-mono"
pdfmetrics.registerFont(TTFont("Plex",str(fontroot/"IBMPlexSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("PlexBold",str(fontroot/"IBMPlexSans-Bold.ttf")))
root=Path(__file__).resolve().parents[2]/'out/reconstruction-study'
methods=[('Original','source.png'),('Single-ink solid reference','baseline.png'),('Cell-area stipple','01-weighted-stipple.png'),('Directional hatching','02-directional-hatch.png'),('Greedy continuous route','03-continuous-route.png'),('VTracer polygon regions','04-vector-regions.png'),('Dither / unconstrained reference','05-dither.png'),('Explicit hybrid composition','06-hybrid.png')]
evidence=json.loads((root.parent.parent/'docs/evidence/reconstruction-study-01.json').read_text(encoding='utf-8'))
replay=evidence.get('reproducibility',{}).get('sameEnvironmentReplay')
pdf=canvas.Canvas(str(root/'reconstruction-study-01.pdf'),pagesize=landscape(A3),invariant=1)
for name,title,credit in [('portrait','Portrait / organic detail','NASA / Eileen Collins; public domain, via scikit-image'),('architecture','Architecture / long horizontal composition','Noclip / Capitol Building Full View; public-domain dedication')]:
 fixture=next(f for f in evidence['fixtures']if f['id']==name)
 pdf.setFillColorRGB(1,.973,.925);pdf.rect(0,0,420*mm,297*mm,fill=1,stroke=0)
 pdf.setFillColorRGB(0,.376,.263);pdf.setFont('PlexBold',18);pdf.drawString(12*mm,282*mm,'stiprā / reconstruction study 01')
 pdf.setFont('Plex',10);pdf.drawString(12*mm,274*mm,title+' | full frame / 90 mm longest edge / monochrome masks / seed 109')
 pdf.setFont('Plex',8);pdf.drawString(12*mm,268*mm,'Target darkness '+f"{fixture['targetDarkness']*100:.1f}%"+' | mark area calibrated within 0.5 percentage point; complexity is reported, not matched.')
 sheet=Image.new('RGB',(1600,1000),'#fff8ec');draw=ImageDraw.Draw(sheet)
 for i,(label,f) in enumerate(methods):
  image=Image.open(root/name/f).convert('RGB');w,h=image.size
  x=(12+(i%4)*99)*mm;y=(145-(i//4)*119)*mm
  pdf.setFont('PlexBold',10);pdf.drawString(x,y+109*mm,label)
  scale=min(90*mm/w,90*mm/h)
  pdf.drawImage(str(root/name/f),x+(90*mm-w*scale)/2,y+15*mm+(90*mm-h*scale)/2,width=w*scale,height=h*scale)
  pdf.setFont('Plex',7.5)
  key=f.removesuffix('.png');metric=fixture['metrics'].get(key)
  if metric:
   pdf.drawString(x,y+7*mm,f"ink {metric['coverage']*100:.1f}% / block RMSE {metric['blockRmse8bit']:.1f} / {metric.get('elements','raster')} marks")
   pdf.drawString(x,y+3*mm,f"SVG {metric.get('svgBytes',0)/1024:.1f} KiB / generation {metric['generationMilliseconds']:.1f} ms")
  else:pdf.drawString(x,y+7*mm,'Color source; metrics use its Pillow L luminance.')
  pdf.drawString(x,y-1*mm,f"{w} x {h} px / {fixture['physicalComparison']['dpi']:.1f} DPI / no crop")
  thumb=image.copy();thumb.thumbnail((370,410));tx=(i%4)*400+(400-thumb.width)//2;ty=(i//4)*500+55+(420-thumb.height)//2
  sheet.paste(thumb,(tx,ty));draw.text(((i%4)*400+12,(i//4)*500+12),label,fill='#006043')
 sheet.save(root/(name+'-comparison.png'))
 pdf.setFont('Plex',8)
 pdf.drawString(12*mm,21*mm,'Stipple: 3000 frozen sites / 9 Lloyd steps on 144 px grid. Hatch: 8 px grid; width from local tone. Hybrid: those same two fields.')
 pdf.drawString(12*mm,17*mm,'VTracer: polygon / precision 8 / layer difference 1 / speckle 4; fills snapped to 4 input grays. Baseline: authored L / solid / no halftone.')
 pdf.drawString(12*mm,13*mm,credit)
 pdf.drawString(12*mm,9*mm,'Coverage-controlled research v2. Dither is an unconstrained raster reference. No human ranking, press calibration or cross-source detail ranking.')
 pdf.showPage()
# Legible numeric budget sheet; image pages retain their full 90 mm panels.
pdf.setFillColorRGB(1,.973,.925);pdf.rect(0,0,420*mm,297*mm,fill=1,stroke=0)
pdf.setFillColorRGB(0,.376,.263);pdf.setFont('PlexBold',18);pdf.drawString(12*mm,282*mm,'stiprā / measured budgets and tone bands')
pdf.setFont('Plex',10);pdf.drawString(12*mm,273*mm,'Coverage is matched for mark methods; element complexity is disclosed. Times are one-run observations, not benchmarks.')
for source_index,fixture in enumerate(evidence['fixtures']):
 y=(257-source_index*119)*mm
 pdf.setFont('PlexBold',12);pdf.drawString(12*mm,y,fixture['id']+' / target '+f"{fixture['targetDarkness']*100:.2f}%"+' / 16 x 16 block tone comparison')
 columns=[12,68,90,114,140,165,188,223,251,286,322]
 heads=['Method','Ink %','Error pp','RMSE','Elements','Segments','Length px','SVG KiB','PNG KiB','Gen ms','Render ms']
 pdf.setFont('PlexBold',9)
 for x,label in zip(columns,heads):pdf.drawString(x*mm,y-9*mm,label)
 for row,(key,m)in enumerate(fixture['metrics'].items()):
  yy=y-(18+row*8)*mm
  values=[key.replace('01-weighted-stipple','Stipple').replace('02-directional-hatch','Hatch').replace('03-continuous-route','Route').replace('04-vector-regions','Regions').replace('05-dither','Dither').replace('06-hybrid','Hybrid'),f"{m['coverage']*100:.2f}",f"{m['coverageError']*100:+.2f}",f"{m['blockRmse8bit']:.2f}",str(m.get('elements','raster')),str(m.get('lineSegments','-')),f"{m['pathLengthSourcePx']:.0f}"if 'pathLengthSourcePx'in m else '-',f"{m.get('svgBytes',0)/1024:.1f}",f"{m['encodedBytes']/1024:.1f}",f"{m['generationMilliseconds']:.1f}",f"{m.get('renderMilliseconds',0):.1f}"]
  pdf.setFont('Plex',9)
  for x,value in zip(columns,values):pdf.drawString(x*mm,yy,value)
 v=fixture['vtracer'];pdf.setFont('Plex',9)
 pdf.drawString(12*mm,y-82*mm,'VTracer levels: '+str(v['palette'])+' / input band %: '+', '.join(f"{x*100:.2f}"for x in v['inputBandFractions']))
 pdf.drawString(12*mm,y-89*mm,'Rendered nearest-band %: '+', '.join(f"{x*100:.2f}"for x in v['renderedNearestBandFractions'])+f" / band L1 {v['bandFractionL1']:.4f} / all four bands retained")
 pdf.drawString(12*mm,y-96*mm,'SVG fills are the four input grays; edge antialiasing adds intermediate pixels. Regions are not globally coverage-normalized.')
 spatial=v.get('spatialBandAgreement')
 if spatial:
  pdf.drawString(12*mm,y-103*mm,f"VTracer spatial band agreement {spatial['pixelBandAgreement']*100:.2f}% / boundary mismatch {spatial['boundaryBandMismatchRate']*100:.2f}% / per-band IoU "+', '.join(f"{k}:{x:.2f}"for k,x in spatial['perBandIoU'].items()))
  worst=max(fixture['metrics'][m]['localTone']['blockSignedErrorPp']['p95']for m in ['01-weighted-stipple','02-directional-hatch','06-hybrid'])
  pdf.drawString(12*mm,y-110*mm,'Local tone residual after global calibration (stipple/hatch/hybrid): 16 x 16 signed block error p05/p95 reported in evidence; the global factor does not guarantee local tone.')
  _ = worst
pdf.setFont('Plex',9);pdf.drawString(12*mm,23*mm,'Baseline: continuous Pillow L darkness through Core.renderLayers, solid/no halftone. Dither: unconstrained raster reference, not an equal-complexity competitor.')
pdf.drawString(12*mm,17*mm,'Length sums M/L/Z polylines, including closes; circles counted separately. Gen excludes render calibration; Render includes calibration and is not a speed comparison.')
if replay:pdf.drawString(12*mm,11*mm,f"Same-environment replay: {replay.get('matchedArtifacts',0)}/{replay.get('comparedArtifacts',32)} SVG/decoded-pixel checks matched; see replay-check.json.")
else:pdf.drawString(12*mm,11*mm,'Same-environment replay: not run for this report; no replay-check.json recorded.')
pdf.drawString(12*mm,7*mm,'No human blind rankings or physical prints. Frozen-point replay does not resample sites; cross-build geometry is not claimed identical.')
pdf.showPage();pdf.save()
