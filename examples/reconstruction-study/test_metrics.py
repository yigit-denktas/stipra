"""Small synthetic regression checks for evidence semantics; no artwork required."""
import json,tempfile,unittest
from pathlib import Path
import numpy as np
from PIL import Image
from measure import tone_metrics,geometry,vtracer_spatial
from replay import EXPECTED,validate_record
class EvidenceTests(unittest.TestCase):
 def test_coverage_error_positive_means_over_inked(self):
  m=tone_metrics(np.zeros((16,16)),np.full((16,16),128.));self.assertGreater(m['coverageError'],0);self.assertGreater(m['localTone']['blockSignedErrorPp']['mean'],0)
 def test_overlap_is_fraction_of_circles_not_pairs(self):
  with tempfile.TemporaryDirectory()as d:
   p=Path(d)/'circles.svg';p.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">'+''.join(f'<circle cx="{x}" cy="10" r="2"/>'for x in [9,9.5,10,10.5])+'</svg>',encoding='utf-8')
   m=geometry(p);self.assertEqual(m['overlappingCircleFraction'],1);self.assertEqual(m['overlappingPairsPerCircle'],1.5)
 def test_boundary_definition_uses_both_sides_of_each_four_neighbour(self):
  with tempfile.TemporaryDirectory()as d:
   folder=Path(d);q=np.array([[0,255],[0,255]],dtype=np.uint8);r=np.zeros((2,2),dtype=np.uint8)
   Image.fromarray(q).save(folder/'quantized.png');Image.fromarray(r).save(folder/'render.png');m=vtracer_spatial(folder,[0,255],folder/'render.png')
   self.assertEqual(m['boundaryPixelCount'],4);self.assertEqual(m['boundaryBandMismatchRate'],.5)
 def test_failed_or_incomplete_replay_cannot_become_passing_evidence(self):
  valid={'allEqual':True,'mismatches':[],'compared':32,'matched':32,'artifacts':dict.fromkeys(EXPECTED,'0'*64)};validate_record(valid)
  for field,value in [('allEqual',False),('matched',31),('compared',31),('artifacts',{})]:
   case={**valid,field:value}
   with self.assertRaises(ValueError):validate_record(case)
if __name__=='__main__':unittest.main()
