"""Same-environment replay check for the reconstruction study.

Snapshots the current `out/reconstruction-study` artifacts, re-runs the Python
generation and Node raster calibration, then compares the same 32 geometry /
decoded-pixel identities that the evaluation claims (5 SVG + 11 PNG per
fixture). Encoder bytes, timings and PDF bytes are excluded by design; the
result is written to `out/reconstruction-study/replay-check.json` and is
consumed by `measure.py`. This is a reproducibility check, not independent
platform validation.
"""
import hashlib,json,platform,shutil,subprocess,sys
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/'examples/reconstruction-study'
OUT=ROOT/'out/reconstruction-study'
REF=OUT.parent/'reconstruction-study-reference'
EVIDENCE=ROOT/'docs/evidence/reconstruction-study-01.json'
SVG='.svg';PNG='.png'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def canonical(p):return p.read_bytes().replace(b'\r\n',b'\n')
def decoded(p):
 im=Image.open(p).convert('RGBA')
 return hashlib.sha256(f'{im.width}x{im.height}:RGBA8\n'.encode()+im.tobytes()).hexdigest()

def snapshot():
 if REF.exists():shutil.rmtree(REF)
 shutil.copytree(OUT,REF,ignore=shutil.ignore_patterns('replay-check.json'))

def rerun():
 subprocess.run([sys.executable,str(HERE/'study.py')],cwd=ROOT,check=True)
 subprocess.run(['node',str(HERE/'render.cjs')],cwd=ROOT,check=True)

def main():
 if not (OUT/'generation.json').exists() or not (OUT/'render-metrics.json').exists():
  raise SystemExit('Run study.py and render.cjs once before replay.py')
 evidence=json.loads(EVIDENCE.read_text(encoding='utf-8'))
 snapshot();rerun()
 compared=[];mismatches=[]
 for fixture in evidence['fixtures']:
  folder=fixture['id']
  for ext,kind in ((SVG,'svg-bytes'),(PNG,'decoded-pixels')):
   names=sorted(p.name for p in (REF/folder).glob('*'+ext))
   for name in names:
    rel=f'{folder}/{name}';ref=REF/rel;cur=OUT/rel
    if not cur.exists():mismatches.append({'artifact':rel,'reason':'missing after replay'});continue
    if ext==SVG:
     equal=canonical(ref)==canonical(cur);current=sha(cur)
    else:
     equal=decoded(ref)==decoded(cur);current=decoded(cur)
    compared.append(rel)
    if not equal:mismatches.append({'artifact':rel,'reason':'value changed during replay'})
    # Values below are the current (regenerated) identities; measure.py re-checks them.
 check={'contract':'stipra-reconstruction-study-01-replay-v1','scope':'Same-environment replay: SVG bytes (CRLF-normalized) and decoded RGBA8 pixels only. Encoder bytes, timings and PDF bytes excluded. Not independent platform validation.',
  'referenceDirectory':str(REF.relative_to(ROOT)),'compared':len(compared),'matched':len(compared)-len(mismatches),'allEqual':not mismatches,'mismatches':mismatches,
  'artifacts':{},'environment':{'python':platform.python_version(),'platform':platform.platform()}}
 for rel in compared:
  p=OUT/rel;check['artifacts'][rel]=decoded(p)if p.suffix==PNG else sha(p)
 (OUT/'replay-check.json').write_text(json.dumps(check,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(f"Replay {check['matched']}/{check['compared']} artifacts match; check written to out/reconstruction-study/replay-check.json")
 if mismatches:
  for item in mismatches[:10]:print(' mismatch:',item)
  raise SystemExit(1)

if __name__=='__main__':main()

