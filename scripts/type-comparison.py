#!/usr/bin/env python3
"""Build private, paired owner-photo specimens through the Stipra engine."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
from importlib.metadata import version
import platform
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from PIL import Image, ImageCms, ImageDraw
from fontTools.ttLib import TTFont as FTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
WORD = 'stiprā'
GUIDE = 'https://github.com/yigit-denktas/stipra/blob/main/docs/PRINT-PACKAGE-v1.md'
FILES = ['IBMPlexSans-Bold.ttf', 'IBMPlexMono-Bold.ttf', 'PaperMono-Regular.ttf', 'PaperMono-ExtraBold.ttf']
LABELS = ['ibm plex sans bold', 'ibm plex mono bold', 'paper mono regular', 'paper mono extrabold']
MM = 72 / 25.4
STOCK = '#F5EEE2'
INK = '#20251F'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(obj):
    return (json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False) + '\n').encode()


def tokens():
    raw = (ROOT / 'logo_for_Readme.svg').read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == 'c792b8c24df29c8bc0e59909f810115044095038'
    tree = ET.fromstring(raw)
    colors = sorted(set(re.findall(r'#[0-9a-fA-F]{6}', raw.decode())))
    expected = ['#006043', '#0D4DAD', '#E2A523', '#FF665D']
    assert sorted(c.upper() for c in colors) == expected
    return dict(schema='stipra-brand-tokens-v1', source='logo_for_Readme.svg', sha256=sha(raw),
                colors=dict(zip(['green', 'blue', 'golden yellow', 'coral'], expected)),
                dotOpacities=[e.attrib.get('opacity', '1') for e in tree.iter() if e.tag.endswith('circle')])


def outlines(font, x, baseline, xheight, multi, palette):
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    pen = BoundsPen(glyphs)
    glyphs[cmap[ord('x')]].draw(pen)
    scale = xheight / pen.bounds[3]
    parts = []
    for ch in WORD:
        name = cmap[ord(ch)]
        p = SVGPathPen(glyphs)
        glyphs[name].draw(p)
        color = palette['coral'] if multi and ch == 'ā' else palette['green'] if multi else INK
        parts.append(f'<path fill="{color}" transform="translate({x:.6f} {baseline}) scale({scale:.9f} {-scale:.9f})" d="{p.getCommands()}"/>')
        x += font['hmtx'][name][0] * scale
    return ''.join(parts)


def wordmarks(fontdir, out):
    t = tokens()
    p = t['colors']
    pins=json.loads((ROOT/'scripts/type-comparison-fonts.json').read_text())
    for n in FILES:
        assert sha((fontdir/n).read_bytes())==pins[n]['sha256'], 'unverified font: '+n
    fonts = [FTFont(fontdir / n) for n in FILES]
    for f in fonts:
        assert 0x101 in f.getBestCmap()
    body = [f'<rect width="1600" height="1420" fill="{STOCK}"/>',
            '<text x="55" y="60" font-family="sans-serif" font-size="25">stiprā / four genuine wordmarks</text>',
            '<text x="55" y="90" font-family="sans-serif" font-size="15">equal 66px x-height · shared baselines · native advance widths · green body / coral macron letter</text>']
    for i, f in enumerate(fonts):
        y = 135 + i * 305
        body.append(f'<path d="M55 {y} H1545" stroke="{INK}"/>')
        body.append(f'<text x="55" y="{y+28}" font-family="sans-serif" font-size="20">0{i+1} / {LABELS[i]}</text>')
        body.append(outlines(f, 55, y+145, 66, False, p))
        body.append(outlines(f, 820, y+145, 66, True, p))
        body.append(f'<path d="M55 {y+145} H1545" stroke="#888888" stroke-width="0.4"/>')
        for size, x in [(24,55), (48,340), (96,900)]:
            # The smaller row uses CSS em sizes, so reduced-size behavior remains honest.
            em = f['head'].unitsPerEm
            b = BoundsPen(f.getGlyphSet()); f.getGlyphSet()[f.getBestCmap()[ord('x')]].draw(b)
            body.append(outlines(f, x, y+250, size*b.bounds[3]/em, False, p))
            body.append(f'<text x="{x}" y="{y+278}" font-family="sans-serif" font-size="12">{size}px em</text>')
    for i,c in enumerate(p.values()):
        body.append(f'<rect x="{55+i*370}" y="1380" width="18" height="18" fill="{c}"/><text x="{82+i*370}" y="1394" font-family="sans-serif" font-size="15">{c}</text>')
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1420" viewBox="0 0 1600 1420">'+''.join(body)+'</svg>'
    (out/'stipra-four-wordmarks.svg').write_text(svg)
    subprocess.run(['node', '-e', "const {Canvas,loadImage}=require('skia-canvas'); loadImage(process.argv[1]).then(async image=>{const canvas=new Canvas(1600,1420);canvas.getContext('2d').drawImage(image,0,0);require('node:fs').writeFileSync(process.argv[2],await canvas.toBuffer('png'));}).catch(e=>{console.error(e);process.exitCode=1;})", str(out/'stipra-four-wordmarks.svg'), str(out/'stipra-four-wordmarks.png')], check=True)
    (out/'brand-tokens.json').write_bytes(canonical(t))
    return fonts


def save_png(image, path):
    buffer = io.BytesIO()
    image=image.copy()
    image.info.clear()
    image.save(buffer, format='PNG')
    path.write_bytes(buffer.getvalue())


def freeze(fixture, source, fonts, out, palette):
    raw = source.read_bytes()
    assert sha(raw) == fixture['sha256'], f"original hash mismatch: {fixture['id']}"
    image = Image.open(io.BytesIO(raw))
    assert image.size == (fixture['widthPx'], fixture['heightPx'])
    icc = image.info.get('icc_profile')
    if icc:
        image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.createProfile('sRGB'), outputMode='RGB')
    else:
        image = image.convert('RGB')
    rgba = image.convert('RGBA')
    d = out / fixture['id'].lower(); d.mkdir(exist_ok=True)
    (d/'source.rgba').write_bytes(rgba.tobytes())
    save_png(image, d/'original.png')
    assignment = {
        'A': [('green','darkness',0.88,1.15), ('coral','darkness',0.18,1.0)],
        'B': [('green','darkness',0.7,1.25), ('golden yellow','yellow',0.6,1.1), ('coral','magenta',0.35,1.15)],
        'C': [('blue','cyan',0.8,1.0), ('coral','darkness',0.26,1.2)]}[fixture['id']]
    inks = [{'id': n.replace(' ', '-'), 'name': n, 'color': palette[n], 'source': s, 'gain': g, 'gamma': gamma} for n,s,g,gamma in assignment]
    screens = {'version':1, 'seed':42, 'default':{'mode':'dots','pitch':6,'angle':22,'jitter':0}, 'plates':{}}
    for j, ink in enumerate(inks):
        mode = 'solid' if fixture['id'] in ['A','C'] and j==0 else 'hybrid'
        screens['plates'][ink['id']] = {'mode':mode,'pitch':5 if fixture['id']=='C' else 6,'angle':[22,-15,65][j], 'solidThreshold':0.8}
    ink_recipe=dict(version=1, mode='spot', paper=STOCK, inks=inks)
    if fixture['id']=='C':
        ink_recipe['blackHold']={'inkId':'blue','threshold':0.035}
    request = dict(width=image.width, height=image.height, inkRecipe=ink_recipe, screenRecipe=screens)
    (d/'request.json').write_bytes(canonical(request))
    subprocess.run(['node', str(ROOT/'scripts/type-comparison-engine.js'), str(d)], check=True)
    result = json.loads((d/'engine.json').read_text())
    w,h = image.size
    save_png(Image.frombytes('RGBA', (w,h), (d/'proof.rgba').read_bytes()).convert('RGB'), d/'proof.png')
    for j in range(len(inks)):
        mask = (d/f'plate-{j}.gray').read_bytes()
        save_png(Image.frombytes('L', (w,h), bytes(255-v for v in mask)), d/f'plate-{j}.png')
    width_mm = {'A':82, 'B':118, 'C':75}[fixture['id']]
    recipe = dict(schema='stipra-private-type-comparison-v1', fixture=fixture['id'], sourceSha256=sha(raw),
                  sourcePixels=[w,h], sourceIccSha256=sha(icc) if icc else None,
                  colorHandling='embedded ICC converted to sRGB via LittleCMS' if icc else 'untagged RGB assumed sRGB',
                  normalizedPixelSha256=sha(rgba.tobytes()), sourceResampled=False,
                  physicalMm=[width_mm, width_mm*h/w], effectiveDpi=w*25.4/width_mm,
                  paper={'name':'warm rag','hex':STOCK,'texture':'deterministic simulated fibre; report only','seed':142},
                  inks=result['inkRecipe'], screens=result['screenRecipe'], coverage=result['coverage'],
                  assets={n:sha((d/n).read_bytes()) for n in ['original.png','proof.png']+[f'plate-{j}.png' for j in range(len(inks))]},
                  replay={'command':'python scripts/type-comparison.py --sources PRIVATE_DIR --fonts VERIFIED_FONT_DIR --out PRIVATE_OUTPUT', 'guide':GUIDE, 'requires':'authorized byte-identical original photograph; do not publish images'},
                  uncalibrated=True)
    (d/'recipe.json').write_bytes(canonical(recipe))
    return recipe, d


def texture(out):
    import random
    rng = random.Random(142)
    image = Image.new('RGB', (1240,1754), STOCK)
    draw = ImageDraw.Draw(image)
    for _ in range(170000):
        x,y = rng.randrange(image.width), rng.randrange(image.height)
        base = (245,238,226); delta=rng.choice([-5,-3,-2,2,3])
        draw.point((x,y), fill=tuple(min(255,max(0,v+delta)) for v in base))
    for _ in range(2500):
        x,y=rng.randrange(image.width),rng.randrange(image.height)
        draw.line((x,y,x+rng.randint(1,5),y+rng.randint(-1,1)),fill=(238,231,219),width=1)
    save_png(image, out/'paper-texture.png')


def specimen(fixture, recipe, d, out, fontdir):
    fid = fixture['id']; landscape=fid=='B'; portrait=fid=='C'
    page_mm = (297,210) if landscape else (210,297) if portrait else (210,210)
    W,H = [v*MM for v in page_mm]
    filename=f"stipra-type-comparison-{fid.lower()}-{'landscape' if landscape else 'portrait' if portrait else 'square'}.pdf"
    pdfmetrics.registerFont(TTFont('Helvetica',str(fontdir/FILES[0])))
    pdfmetrics.registerFont(TTFont('Times-Roman',str(fontdir/FILES[0])))
    temp=io.BytesIO(); c=canvas.Canvas(temp, pagesize=(W,H), invariant=1, pageCompression=1)
    c.setTitle('stiprā / paired type comparison / '+fid.lower())
    placements=[]
    def line(y,x=12,end=None,weight=.25):
        c.setStrokeColor(HexColor(INK)); c.setLineWidth(weight*MM); c.line(x*MM,H-y*MM,(end or page_mm[0]-12)*MM,H-y*MM)
    def text(x,y,s,size=8,color=INK):
        c.setFillColor(HexColor(color)); c.setFont(fontname,size); c.drawString(x*MM,H-y*MM,s)
    def image(name,x,y,w):
        path=d/name; im=Image.open(path); h=w*im.height/im.width
        c.drawImage(ImageReader(str(path)), x*MM,H-(y+h)*MM,w*MM,h*MM)
        placements.append(dict(name=name, x=x,y=y,width=w,height=h,sha256=sha(path.read_bytes())))
    for index, fontfile in enumerate([FILES[0], FILES[3]]):
        fontname='specimen'+str(index)
        pdfmetrics.registerFont(TTFont(fontname,str(fontdir/fontfile)))
        c.drawImage(ImageReader(io.BytesIO((out/'paper-texture.png').read_bytes())),0,0,W,H)
        text(12,21,WORD,32,color=recipe['inks']['inks'][0]['color'])
        text(79 if not landscape else 105,14,'type / ink / paper',10)
        text(79 if not landscape else 105,20,f"{fid.lower()} / {fixture['slug']}",8)
        text(79 if not landscape else 105,26,'private owner specimen / provisional',7)
        line(32,weight=.55)
        iw=recipe['physicalMm'][0]
        x2=page_mm[0]-12-iw
        text(12,40,'01 / source photograph',8)
        text(x2,40,'02 / digital overprint',8)
        image('original.png',12,44,iw); image('proof.png',x2,44,iw)
        hero_bottom=44+recipe['physicalMm'][1]
        text(12,hero_bottom+5,f"{fixture['widthPx']} x {fixture['heightPx']} px / complete source",6.7)
        text(x2,hero_bottom+5,f"{recipe['physicalMm'][0]:.2f} x {recipe['physicalMm'][1]:.2f} mm / {recipe['effectiveDpi']:.2f} dpi",6.5)
        py=hero_bottom+13
        line(py-4)
        text(12,py,'03 / grayscale ink plates',8)
        inks=recipe['inks']['inks']; count=len(inks)
        plate_w=35 if fid in ['A','B'] else 19.2
        step=plate_w+(10 if fid=='B' else 5)
        for j,ink in enumerate(inks):
            x=12+j*step
            image(f'plate-{j}.png',x,py+4,plate_w)
            ph=plate_w*fixture['heightPx']/fixture['widthPx']
            text(x,py+ph+9,ink['name'],6.4)
        tx=112 if fid=='A' else 168 if fid=='B' else 79
        text(tx,py,'04 / ink settings',8)
        for j,ink in enumerate(inks):
            y=py+7+j*(10 if fid=='B' else 12)
            c.setFillColor(HexColor(ink['color'])); c.rect(tx*MM,H-(y-.3)*MM,2.6*MM,2.6*MM,fill=1,stroke=0)
            text(tx+4,y,f"{ink['name']} / {ink['color'].lower()}",6.6)
            screen=recipe['screens']['plates'][ink['id']]
            coverage=recipe['coverage'][j]['meanCoverage']*100
            screen_label='solid / screen off' if screen['mode']=='solid' else f"{screen['mode']} / {screen['pitch']}px / {screen['angle']}°"
            text(tx,y+3.6,f"{screen_label} / {coverage:.1f}%",6.0)
            text(tx,y+6.4,f"{ink['source']} / gain {ink['gain']} / gamma {ink['gamma']}",5.7)
        meta=page_mm[1]-35
        line(meta-5,weight=.5)
        text(12,meta,f"warm rag / {STOCK.lower()} / seed 42 / zero registration",7)
        text(12,meta+4,f"source sha-256 / {recipe['sourceSha256']}",5.7)
        text(12,meta+8,'recipe.json embedded / print at 100% / never fit to page',6.4)
        text(12,meta+12,'replay: use public guide + embedded recipe + authorized original',6.0)
        text(12,meta+16,'digital approximation / simulated paper fibre / not press calibrated',6.0)
        text(12,meta+20,f"{LABELS[0] if index==0 else LABELS[3]} / ofl 1.1 / {index+1:02d}",7)
        if recipe['sourceIccSha256']:
            text(12,meta+24,'embedded source icc converted to srgb; profile hash in recipe',5.8)
        else:
            text(12,meta+24,'untagged source assumed srgb / no resampling',5.8)
        qr_x=page_mm[0]-32; qr_y=meta-1; size=19
        widget=qr.QrCodeWidget(GUIDE,barLevel='M'); bounds=widget.getBounds(); scale=size*MM/(bounds[2]-bounds[0])
        drawing=Drawing(size*MM,size*MM,transform=[scale,0,0,scale,0,0]);drawing.add(widget)
        renderPDF.draw(drawing,c,qr_x*MM,H-(qr_y+size)*MM)
        c.linkURL(GUIDE,(qr_x*MM,H-(qr_y+size)*MM,(qr_x+size)*MM,H-qr_y*MM),relative=0)
        text(qr_x,meta+22,'public guide',5.9)
        c.showPage()
    c.save()
    reader=PdfReader(io.BytesIO(temp.getvalue()))
    writer=PdfWriter(); writer.clone_document_from_reader(reader)
    writer.add_attachment('recipe.json',(d/'recipe.json').read_bytes())
    writer.add_attachment('brand-tokens.json',(out/'brand-tokens.json').read_bytes())
    writer.add_metadata({'/Title':'stiprā / '+fid.lower()+' / typography comparison','/CreationDate':'D:20000101000000Z','/ModDate':'D:20000101000000Z'})
    with (out/filename).open('wb') as stream: writer.write(stream)
    half=len(placements)//2; assert placements[:half]==placements[half:]
    return dict(file=filename,sha256=sha((out/filename).read_bytes()),pageMm=page_mm,pages=2,artworkPlacements=placements[:half],recipeSha256=sha((d/'recipe.json').read_bytes()))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources',type=Path,required=True);parser.add_argument('--fonts',type=Path,required=True);parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--wordmarks-only',action='store_true')
    args=parser.parse_args()
    assert not args.out.resolve().is_relative_to(ROOT), 'private output must be outside repository'
    assert not args.sources.resolve().is_relative_to(ROOT), 'private sources must be outside repository'
    args.out.mkdir(parents=True,exist_ok=True)
    wordmarks(args.fonts,args.out)
    if args.wordmarks_only:return
    fixtures=json.loads((ROOT/'tests/fixtures/owner-photo-fixtures.json').read_text())['fixtures']
    t=tokens();texture(args.out); results=[]
    for f in fixtures:
        recipe,d=freeze(f,args.sources/f['originalFile'],args.fonts,args.out,t['colors'])
        results.append(specimen(f,recipe,d,args.out,args.fonts))
    manifest=dict(schema='stipra-type-comparison-manifest-v1',sourceCommit='4b9d57124ee035884d046175997a50a5bdc17a34',
                  brand=t,fonts=[dict(file=n,sha256=sha((args.fonts/n).read_bytes()),family=FTFont(args.fonts/n)['name'].getDebugName(1),version=FTFont(args.fonts/n)['name'].getDebugName(5)) for n in FILES],
                  outputs=results,python=platform.python_version(),dependencies={n:version(n) for n in ['Pillow','fonttools','reportlab','pypdf']},node=subprocess.check_output(['node','--version'],text=True).strip(),
                  engine={str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in [ROOT/'src/separation.js',ROOT/'src/screening.js',ROOT/'scripts/type-comparison.py',ROOT/'scripts/type-comparison-engine.js']},
                  rights='private owner review only; originals and image-bearing artifacts must not be published',physicalPrintVerified=False,brandApproved=False)
    (args.out/'reproducibility-manifest.json').write_bytes(canonical(manifest))
    print(json.dumps(dict(pdfs=len(results),pages=6,output=str(args.out))))

if __name__=='__main__':main()
