"""Validate source contracts and optionally inspect the private paired artifacts."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import unittest
from pypdf import PdfReader
from pypdf.generic import ContentStream

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('comparison',ROOT/'scripts/type-comparison.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class SourceContract(unittest.TestCase):
    def test_unchanged_palette_and_opacities(self):
        t=module.tokens()
        self.assertEqual(set(t['colors'].values()),{'#006043','#FF665D','#0D4DAD','#E2A523'})
        self.assertGreater(len(t['dotOpacities']),0)

    def test_originals_have_distinct_full_fingerprints(self):
        fixtures=json.loads((ROOT/'tests/fixtures/owner-photo-fixtures.json').read_text())['fixtures']
        self.assertEqual([f['id'] for f in fixtures],['A','B','C'])
        self.assertEqual(len({f['sha256'] for f in fixtures}),3)
        self.assertTrue(all(len(f['sha256'])==64 for f in fixtures))

    def test_four_font_pins_and_two_finalists(self):
        pins=json.loads((ROOT/'scripts/type-comparison-fonts.json').read_text())
        self.assertTrue(all(name in pins for name in module.FILES))
        self.assertEqual(len(module.FILES),4)
        self.assertEqual(module.WORD,'stipr\u0101')


@unittest.skipUnless(os.environ.get('STIPRA_PRIVATE_OUTPUT'),'private output not provided; no owner assets used in CI')
class PrivateArtifacts(unittest.TestCase):
    def setUp(self):
        self.out=Path(os.environ['STIPRA_PRIVATE_OUTPUT'])
        self.manifest=json.loads((self.out/'reproducibility-manifest.json').read_text())

    @unittest.skipUnless(os.environ.get('STIPRA_REPEAT_OUTPUT'),'second build not provided')
    def test_repeat_build_matches_manifest(self):
        repeat=Path(os.environ['STIPRA_REPEAT_OUTPUT'])
        self.assertEqual((self.out/'reproducibility-manifest.json').read_bytes(),(repeat/'reproducibility-manifest.json').read_bytes())
        for entry in self.manifest['outputs']:
            self.assertEqual((self.out/entry['file']).read_bytes(),(repeat/entry['file']).read_bytes())

    def test_exact_three_pdfs_six_pages_and_geometry(self):
        self.assertEqual(len(list(self.out.glob('*.pdf'))),3)
        for expected in self.manifest['outputs']:
            path=self.out/expected['file'];r=PdfReader(path)
            self.assertEqual(len(r.pages),2)
            self.assertEqual(module.sha(path.read_bytes()),expected['sha256'])
            for p in r.pages:
                for actual,mm in zip([float(p.mediabox.width),float(p.mediabox.height)],expected['pageMm']):
                    self.assertAlmostEqual(actual,mm*module.MM,places=4)

    def test_photos_plates_and_nontext_geometry_identical(self):
        for entry in self.manifest['outputs']:
            r=PdfReader(self.out/entry['file']); draws=[];images=[]
            for p in r.pages:
                inside=False;ops=[]
                for operands,operator in ContentStream(p.get_contents(),r).operations:
                    if operator==b'BT':inside=True
                    if not inside:ops.append((operands,operator))
                    if operator==b'ET':inside=False
                draws.append(ops)
                images.append(sorted((i.image.size,module.sha(i.image.tobytes())) for i in p.images))
            self.assertEqual(draws[0],draws[1]);self.assertEqual(images[0],images[1])
            for box in entry['artworkPlacements']:
                self.assertGreater(box['width'],0)
                self.assertGreater(box['height'],0)

    def test_actual_embedded_font_and_unicode_macron(self):
        for entry in self.manifest['outputs']:
            r=PdfReader(self.out/entry['file'])
            for page,expected in zip(r.pages,['IBMPlexSans-Bold','PaperMono-ExtraBold']):
                used=[]
                for ref in page['/Resources']['/Font'].values():
                    f=ref.get_object();used.append(str(f['/BaseFont']))
                    self.assertIn('/FontFile2',f['/FontDescriptor'])
                    self.assertIn('/ToUnicode',f)
                self.assertTrue(any(expected in name for name in used))
                text=page.extract_text()
                self.assertIn('stiprā',text)
                self.assertEqual(text,text.lower())

    def test_embedded_normalized_recipes_and_public_qr_links(self):
        for entry in self.manifest['outputs']:
            r=PdfReader(self.out/entry['file'])
            self.assertIn('recipe.json',r.attachments)
            data=r.attachments['recipe.json'][0];recipe=json.loads(data)
            self.assertEqual(data,module.canonical(recipe))
            self.assertEqual(module.sha(data),entry['recipeSha256'])
            self.assertFalse(recipe['sourceResampled'])
            self.assertEqual(recipe['screens']['seed'],42)
            for ink in recipe['inks']['inks']:
                self.assertIn(ink['color'].upper(),module.tokens()['colors'].values())
            for page in r.pages:
                links=[a.get_object().get('/A',{}).get('/URI') for a in page['/Annots']]
                self.assertEqual(links,[module.GUIDE])

    def test_native_aspect_and_private_asset_fingerprints(self):
        fixtures=json.loads((ROOT/'tests/fixtures/owner-photo-fixtures.json').read_text())['fixtures']
        for fixture,entry in zip(fixtures,self.manifest['outputs']):
            d=self.out/fixture['id'].lower();recipe=json.loads((d/'recipe.json').read_text())
            self.assertEqual(recipe['sourceSha256'],fixture['sha256'])
            for n,digest in recipe['assets'].items():
                self.assertEqual(module.sha((d/n).read_bytes()),digest)
            for box in entry['artworkPlacements']:
                self.assertAlmostEqual(box['width']/box['height'],fixture['widthPx']/fixture['heightPx'])
                self.assertEqual(module.sha((d/box['name']).read_bytes()),box['sha256'])

if __name__=='__main__':unittest.main()
