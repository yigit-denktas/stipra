"""Validate evidence and build a complete, non-recursive delivery manifest."""
import json,hashlib,zipfile,re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'out/reconstruction-study'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def posix(p):return p.relative_to(ROOT).as_posix()
def study_source_files():
 # Self-testing archives carry the study's intended requirement files too.
 return [p for p in (ROOT/'examples/reconstruction-study').rglob('*')if p.is_file()and p.suffix in ['.md','.py','.cjs','.json','.txt']]
def main():
 evidence=json.loads((ROOT/'docs/evidence/reconstruction-study-01.json').read_text(encoding='utf-8'));files=set()
 for fixture in evidence['fixtures']:
  for name,entry in fixture['artifacts'].items():
   p=OUT/name;assert sha(p)==entry['sha256'],name
   if p.suffix=='.png':
    im=Image.open(p).convert('RGBA');value=hashlib.sha256(f'{im.width}x{im.height}:RGBA8\n'.encode()+im.tobytes()).hexdigest();assert value==entry['decodedPixels']['sha256'],name
   files.add(p)
  source=OUT/'sources'/('astronaut.png'if fixture['id']=='portrait'else'capitol.jpg');assert sha(source)==fixture['sourceSha256'];files.add(source)
 for name,entry in evidence['reportArtifacts'].items():
  p=OUT/name;assert sha(p)==entry['sha256'],name;files.add(p)
 for name in ['docs/RECONSTRUCTION-STUDY-01.md','docs/evidence/reconstruction-study-01.json','docs/evidence/reconstruction-study-01-v2-original.json','docs/evidence/reconstruction-study-01-delivery.json']:
  files.add(ROOT/name)
 files.update(study_source_files())
 # Validate direct relative Markdown links in the study evaluation; the archive keeps repository layout.
 for match in re.findall(r'\]\(([^)]+)\)',(ROOT/'docs/RECONSTRUCTION-STUDY-01.md').read_text(encoding='utf-8')):
  if not re.match(r'[a-z]+://',match):assert (ROOT/'docs'/match.split('#')[0]).exists(),match
 manifest={'contract':'stipra-study-delivery-v2','evidence':'docs/evidence/reconstruction-study-01.json','files':{posix(p):{'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(files)},'selfHash':'Manifest excludes itself to avoid recursion. Archive bytes are delivery-specific.'}
 intro='# Stiprā reconstruction study 01 — coverage-controlled v2\n\n[Evaluation](docs/RECONSTRUCTION-STUDY-01.md) · [Reproduce in the source repository](examples/reconstruction-study/README.md) · [Canonical evidence](docs/evidence/reconstruction-study-01.json)\n\n[Three-page comparison and budget PDF](out/reconstruction-study/reconstruction-study-01.pdf). Sources are public-domain photographs with retained credits. This archive is research evidence, not a native or library distribution. See MANIFEST.json for every file hash. No artist/physical acceptance claimed.\n'
 manifest['files']['README.md']={'bytes':len(intro.encode()),'sha256':hashlib.sha256(intro.encode()).hexdigest()}
 output=OUT/'stipra-reconstruction-study-01-v2.zip'
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED)as z:
  for p in sorted(files):z.write(p,posix(p))
  z.writestr('README.md',intro);z.writestr('MANIFEST.json',json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
 with zipfile.ZipFile(output)as z:
  assert set(z.namelist())==set(manifest['files'])|{'MANIFEST.json'}
  for name,item in manifest['files'].items():assert hashlib.sha256(z.read(name)).hexdigest()==item['sha256'],name
 print('Verified',len(manifest['files']),'archive members;',output.stat().st_size,'bytes')
if __name__=='__main__':main()
