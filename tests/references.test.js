'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const docs=['README.md','ROADMAP.md','docs/references/README.md',
  'docs/references/DIZZY-INK.md','docs/references/DIZZY-INK-VISUALS.md','docs/PRINT-DESIGN-RULES.md'];
test('original Risograph field reference, research attribution and source links are present',()=>{
  const reading=fs.readFileSync(path.join(root,'docs/references/DIZZY-INK.md'),'utf8');
  const portal=fs.readFileSync(path.join(root,'docs/references/README.md'),'utf8');
  const rules=fs.readFileSync(path.join(root,'docs/PRINT-DESIGN-RULES.md'),'utf8');
  for(const id of ['01-quick-history','02-introduction','03-your-files','04-risograph-profiles',
    '05-density','06-ink-overlays','07-drying-time','08-imperfections','09-printable-area','10-riso-proof-tool']){
    assert.ok(reading.includes('https://risograph.co.uk/'+id),'missing referenced chapter '+id);
  }
  for(let i=1;i<=10;i++)assert.match(rules,new RegExp('### R'+String(i).padStart(2,'0')+'\\b'));
  for(const body of [reading,portal,rules]){
    assert.match(body,/Dizzy Ink/);
    assert.match(body,/not|source|copyright|reference/i);
  }
  assert.match(rules,/proof-only/i);
  assert.match(rules,/25\.4/);
  assert.match(rules,/not yet a built-in rule engine/i);
});
test('all reference portal and README relative links resolve within the repository',()=>{
  for(const file of docs){
    const abs=path.join(root,file),body=fs.readFileSync(abs,'utf8');
    for(const [,target] of body.matchAll(/\]\(([^)]+)\)/g)){
      if(/^(?:https?:|mailto:|#)/.test(target))continue;
      const resolved=path.resolve(path.dirname(abs),decodeURIComponent(target.split('#')[0]));
      assert.ok(resolved.startsWith(root+path.sep),'link escapes repo in '+file+': '+target);
      assert.ok(fs.existsSync(resolved),'broken link in '+file+': '+target);
    }
  }
});
test('reference docs are original linked notes, never bundled third-party website source or visual assets',()=>{
  for(const file of docs.filter(p=>p.startsWith('docs/'))){
    const body=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(body,/!\[[^\]]*\]\(https?:\/\/risograph\.co\.uk/i);
    assert.doesNotMatch(body,/<(?:script|iframe|img)[\s>]/i);
  }
});

test('Dizzy Ink visual reference describes four source images without embedding third-party art',()=>{
  const visuals=fs.readFileSync(path.join(root,'docs/references/DIZZY-INK-VISUALS.md'),'utf8');
  const portal=fs.readFileSync(path.join(root,'docs/references/README.md'),'utf8');
  const design=fs.readFileSync(path.join(root,'DESIGN.md'),'utf8');
  assert.match(visuals, /https:\/\/www\.dizzyink\.co\.uk\/guide-to-risograph/);
  for(const filename of ['How-Riso-Works1.jpg','Mixing-Inks.jpg','Full-Colour-CMYK.jpg','DizzyInk-RisoSwatch.jpg'])
    assert.ok(visuals.includes(filename),'Missing link to original visual reference: '+filename);
  assert.match(visuals,/not.*copy|do not.*copy|not.*reproduc|do not.*reproduc/i);
  assert.match(portal, /\]\(DIZZY-INK-VISUALS\.md\)/);
  assert.match(design, /\]\(docs\/references\/DIZZY-INK-VISUALS\.md\)/);
  assert.doesNotMatch(visuals,/!\[[^\]]*]\(https?:\/\//);
  assert.doesNotMatch(visuals,/<(?:img|iframe|script)\b/i);
});
