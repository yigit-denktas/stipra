const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('README uses the original SVG exactly once, as artwork rather than a flattened banner', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const header = readme.split('\n</div>')[0];
  const original = fs.readFileSync(path.join(root, 'logo_for_Readme.svg'), 'utf8');
  const heading = header.indexOf('<h1>stipra</h1>');
  const subtitle = header.indexOf('A programmable printmaking studio.');
  const image = header.indexOf('src="logo_for_Readme.svg"');
  const explanation = header.indexOf('Stippling + strata: dots organized into layers.');
  const strapline = header.indexOf('Separate the inks. Keep the imperfections.');
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


test('README points readers to real entry points and accurately distinguishes future work', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.indexOf('## Try it') < readme.indexOf('## Where it stands'));
  assert.ok(readme.indexOf('## Where it stands') < readme.indexOf('## Inside the workshop'));
  for (const command of ['node bin/stipra.js presets', 'node bin/stipra.js render', 'node bin/stipra.js scene', 'node bin/stipra.js import']) {
    assert.ok(readme.includes(command), 'README missing working command: ' + command);
  }
  assert.match(readme, /continuous-tone ink masks/i);
  assert.match(readme, /CMYK/i);
  assert.match(readme, /editable.*spot.*CMYK.*separations/i);
  assert.match(readme, /complete.*print package/i);
  assert.match(readme, /\[.*roadmap.*\]\(ROADMAP\.md\)/i);
  for (const [, url] of readme.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#|mailto:)/.test(url)) continue;
    assert.ok(fs.existsSync(path.join(root, url.split('#')[0])), 'README contains a dead local link: ' + url);
  }
});
