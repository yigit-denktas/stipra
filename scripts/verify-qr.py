"""Decode branded specimens after rasterizing their actual physical PDF boxes."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from PIL import Image
import zxingcpp


def verify(directory):
    directory = Path(directory)
    record = json.loads((directory / 'qr-specimens.json').read_text())
    results = []
    for dpi in (150, 300, 600):
        with tempfile.TemporaryDirectory(prefix='stipra-qr-') as tmp:
            output = Path(tmp) / 'page'
            subprocess.run(['pdftoppm', '-r', str(dpi), '-f', '1', '-singlefile', '-png', str(directory / 'stipra-qr-specimens.pdf'), str(output)], check=True, capture_output=True)
            page = Image.open(output.with_suffix('.png')).convert('RGB')
            for case in record['records']:
                b = case['boxPt']
                scale = dpi / 72
                top = (841.88976 - b['y'] - b['height']) * scale
                box = (round(b['x'] * scale), round(top), round((b['x'] + b['width']) * scale), round(top + b['height'] * scale))
                image = page.crop(box)
                for mode in ('color', 'grayscale'):
                    decoded = zxingcpp.read_barcode(image if mode == 'color' else image.convert('L'))
                    if not decoded or decoded.text != record['guide']:
                        raise AssertionError(f"QR decode failed: {case['style']} / {case['mm']} mm / {dpi} DPI / {mode}")
                    results.append({'style': case['style'], 'mm': case['mm'], 'dpi': dpi, 'mode': mode, 'decoded': decoded.text})
    return results


if __name__ == '__main__':
    results = verify(sys.argv[1])
    path = Path(sys.argv[1]) / 'decode-verification.json'
    path.write_text(json.dumps({'checksPassed': len(results), 'decoder': 'zxing-cpp 2.3.0', 'physicalPhoneTest': False, 'results': results}, indent=2) + '\n')
    print(json.dumps({'checksPassed': len(results), 'physicalPhoneTest': False}))
