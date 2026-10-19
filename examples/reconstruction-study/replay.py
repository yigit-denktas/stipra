"""Fail-closed same-environment replay of a fixed 32-artifact study inventory."""
import hashlib,json,platform,shutil,subprocess,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];HERE=ROOT/'examples/reconstruction-study';OUT=ROOT/'out/reconstruction-study';REF=OUT.parent/'reconstruction-study-reference'
METHODS=['01-weighted-stipple','02-directional-hatch','03-continuous-route','04-vector-regions','06-hybrid']
PNG_NAMES=[m+'.png'for m in METHODS]+['05-dither.png','baseline.png','baseline-two-ink-context.png','source.png','source-luminance.png','quantized.png']
EXPECTED={f'{source}/{name}'for source in ['portrait','architecture']for name in PNG_NAMES+[m+'.svg'for m in METHODS]}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def decoded(p):
 im=Image.open(p).convert('RGBA');return hashlib.sha256(f'{im.width}x{im.height}:RGBA8\n'.encode()+im.tobytes()).hexdigest()
def identity(p):return decoded(p)if p.suffix=='.png'else sha(p)
def validate_record(check):
 if check.get('allEqual')is not True or check.get('mismatches')!=[]:raise ValueError('Replay did not pass')
 if check.get('matched')!=32 or check.get('compared')!=32 or set(check.get('artifacts',{}))!=EXPECTED:raise ValueError('Replay inventory must contain exactly 32 expected artifacts')
 if any(not isinstance(v,str)or len(v)!=64 or any(c not in '0123456789abcdef'for c in v)for v in check['artifacts'].values()):raise ValueError('Invalid replay digest')
def main():
 record=OUT/'replay-check.json';record.unlink(missing_ok=True)
 for name in EXPECTED:
  if not(OUT/name).is_file():raise SystemExit('Missing reference artifact: '+name)
 if REF.exists():shutil.rmtree(REF)
 REF.mkdir(parents=True)
 for name in EXPECTED:
  target=REF/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OUT/name,target)
 subprocess.run([sys.executable,str(HERE/'study.py')],cwd=ROOT,check=True)
 subprocess.run(['node',str(HERE/'render.cjs')],cwd=ROOT,check=True)
 mismatches=[];artifacts={}
 for name in sorted(EXPECTED):
  p=OUT/name
  if not p.exists():mismatches.append({'artifact':name,'reason':'missing after replay'});continue
  artifacts[name]=identity(p)
  if artifacts[name]!=identity(REF/name):mismatches.append({'artifact':name,'reason':'changed'})
 check={'contract':'stipra-reconstruction-study-01-replay-v2','scope':'Same-environment exact SVG bytes and decoded RGBA8 identities. LF writers normalize generated text. Encoding-only PNG, timings and PDF bytes excluded; no cross-platform equality claim.','referenceDirectory':REF.relative_to(ROOT).as_posix(),'compared':32,'matched':32-len(mismatches),'allEqual':not mismatches,'mismatches':mismatches,'artifacts':artifacts,'environment':{'python':platform.python_version(),'platform':platform.platform()}}
 record.write_text(json.dumps(check,indent=2)+'\n',encoding='utf-8',newline='\n');validate_record(check)
 print('Replay 32/32 exact SVG / decoded-pixel identities passed')
if __name__=='__main__':main()
