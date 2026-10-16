const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('README uses the original SVG exactly once, as artwork rather than a flattened banner', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const header = readme.split('\n</div>')[0];
  const original = fs.readFileSync(path.join(root, 'logo_for_Readme.svg'), 'utf8');
  const heading = header.indexOf('<h1>Stiprā</h1>');
  const subtitle = header.indexOf('A programmable printmaking studio.');
  const image = header.indexOf('src="logo_for_Readme.svg"');
  const explanation = header.indexOf('stippling</em> + <em>strata');
  const strapline = header.indexOf('Separate the inks. Keep the imperfections.');
  assert.ok(header.includes('Latvian') && header.includes('stiprs') && header.includes('strong'));
  assert.ok(heading >= 0 && heading < subtitle && subtitle < image && image < explanation && explanation < strapline);
  assert.equal((readme.match(/src="logo_for_Readme\.svg"/g) || []).length, 1);
  assert.match(header, /src="logo_for_Readme\.svg"[^>]*width="100%"/);
  assert.equal((original.match(/<circle\b/g) || []).length, 175);
  assert.doesNotMatch(header, /stipra-header\.svg|background:\s*black/i);
  assert.equal(fs.existsSync(path.join(root, 'assets/stipra-header.svg')), false);
});

test('README issues badge is static and links to repository issues without GitHub API token dependency', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /img\.shields\.io\/badge\/issues-v0\.9%20backlog/);
  assert.match(readme, /github\.com\/yigit-denktas\/stipra\/issues/);
  assert.doesNotMatch(readme, /img\.shields\.io\/github\/issues/);
});


test('README is a short human entry point and links to real help for people and agents', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const guide = fs.readFileSync(path.join(root, 'docs/GETTING-STARTED.md'), 'utf8');
  const design = fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8');
  const roadmap = fs.readFileSync(path.join(root, 'ROADMAP.md'), 'utf8');

  assert.ok(readme.length < 5500, 'intro must stay short; move implementation detail to docs');
  assert.ok(readme.indexOf('## Try it') < readme.indexOf('## Where we are'));
  assert.ok(readme.indexOf('## Where we are') < readme.indexOf('## Follow the work'));
  assert.match(readme, /https:\/\/apps\.yigitdenktas\.com\/stipra\//);
  assert.match(readme, /node bin\/stipra\.js separate/);
  assert.ok(readme.includes('examples/recipes/spot-photo.json'));
  assert.ok(readme.includes('examples/recipes/screens-spot.json'));
  assert.match(readme, /spot\/CMYK|spot inks or CMYK/);
  assert.match(readme, /digital approximations/i);
  assert.match(readme, /5 of the original 14 issues completed \(35\.71% by issue count\)/);
  assert.match(roadmap, /5 of the original #1–#14 tasks merged/);
  for(const expected of ['DESIGN.md','ROADMAP.md','AGENTS.md','CONTRIBUTING.md','docs/PRINT-DESIGN-RULES.md','docs/references/README.md','docs/GETTING-STARTED.md'])
    assert.ok(readme.includes(']('+expected+')'), 'missing navigation: '+expected);

  for (const command of ['node bin/stipra.js presets', 'node bin/stipra.js render', 'node bin/stipra.js scene', 'node bin/stipra.js import', 'node bin/stipra.js separate'])
    assert.ok(guide.includes(command), 'moved quickstart missing: '+command);
  assert.match(design, /R01–R10|printmaking rules/i);
  assert.match(design, /not.*implemented|proposed/i);
  assert.match(design, /one central interactive canvas|one central|side-by-side/i);

  for(const file of ['README.md','DESIGN.md','docs/GETTING-STARTED.md']){
    const full = path.join(root, file), body = fs.readFileSync(full, 'utf8');
    for(const [, url] of body.matchAll(/\]\(([^)]+)\)/g)){
      if(/^(?:https?:|#|mailto:)/.test(url)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(full),url.split('#')[0])),
        'broken relative link in '+file+': '+url);
    }
  }
});
