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
methods=[('Original','source.png'),('Existing two-ink baseline','baseline.png'),('Weighted Voronoi stipple','01-weighted-stipple.png'),('Directional hatching','02-directional-hatch.png'),('Greedy continuous route','03-continuous-route.png'),('VTracer polygon regions','04-vector-regions.png'),('Floyd-Steinberg / raster only','05-dither.png'),('Explicit hybrid composition','06-hybrid.png')]
pdf=canvas.Canvas(str(root/'reconstruction-study-01.pdf'),pagesize=landscape(A3))
for name,title,credit in [('portrait','Portrait / organic detail','NASA / Eileen Collins; public domain, via scikit-image'),('architecture','Architecture / long horizontal composition','Noclip / Capitol Building Full View; public-domain dedication')]:
 pdf.setFillColorRGB(1,.973,.925);pdf.rect(0,0,420*mm,297*mm,fill=1,stroke=0)
 pdf.setFillColorRGB(0,.376,.263);pdf.setFont('PlexBold',18);pdf.drawString(12*mm,282*mm,'stiprā / reconstruction study 01')
 pdf.setFont('Plex',10);pdf.drawString(12*mm,274*mm,title+' | same full source frame across every method | seed 109')
 sheet=Image.new('RGB',(1600,1000),'#fff8ec');draw=ImageDraw.Draw(sheet)
 for i,(label,f) in enumerate(methods):
  image=Image.open(root/name/f).convert('RGB');w,h=image.size
  x=(12+(i%4)*99)*mm;y=(145-(i//4)*119)*mm
  pdf.setFont('PlexBold',10);pdf.drawString(x,y+109*mm,label)
  scale=min(90*mm/w,90*mm/h)
  pdf.drawImage(str(root/name/f),x+(90*mm-w*scale)/2,y+(100*mm-h*scale)/2,width=w*scale,height=h*scale)
  pdf.setFont('Plex',8);pdf.drawString(x,y+2*mm,f'{w} x {h} px / longest edge 90 mm / no crop')
  thumb=image.copy();thumb.thumbnail((370,410));tx=(i%4)*400+(400-thumb.width)//2;ty=(i//4)*500+55+(420-thumb.height)//2
  sheet.paste(thumb,(tx,ty));draw.text(((i%4)*400+12,(i//4)*500+12),label,fill='#006043')
 sheet.save(root/(name+'-comparison.png'))
 pdf.setFont('Plex',9);pdf.drawString(12*mm,15*mm,credit)
 pdf.drawString(12*mm,10*mm,'Research previews: reduced source resolution declared. Route is not optimized TSP. No physical/artist acceptance or calibration.')
 pdf.showPage()
pdf.save()
