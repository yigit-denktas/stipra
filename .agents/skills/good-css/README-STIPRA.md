# Good CSS for Stiprā

Source: [vojtaholik/good-css](https://github.com/vojtaholik/good-css), copied from `skills/good-css/` on 18 October 2026.
License: upstream MIT, preserved in [LICENSE](LICENSE). This is a **project-scoped pinned copy**, not proof that `npx skills` executed in the local container.

Apply the skill to CSS work in **all** public pages, but preserve the Stiprā [design contract](../../../design/CONTRACT.md), brand color values, existing IBM Plex faces, semantics, and accepted interactions. Good CSS is guidance, not permission to rewrite every hex color as OKLCH, remove necessary breakpoints, or impose a new visual identity.

## Roadmap consolidation, PR #98

- Saved original v3/v4/Taste/Impeccable CSS as `tests/fixtures/roadmap-before-good-css.css`.
- Removed unused legacy v3 selectors. Preserved the summary disclosure glyph, source text color, section reset and reduced-motion behavior.
- Consolidated responsive declarations for 700px / 480px / 360px thresholds. Kept current values, not a new typography scale.
- Preserved the current Stiprā palette and DOM, so the roadmap still reads like editorial documentation.
- Static comparison of property values per selector across 15 representative widths returned **no differences**; this is not a browser-rendered assertion.
- Added `scripts/verify-roadmap-css-visual.js` and the dedicated workflow. It compares **real built pages** using original versus new CSS at four widths, including default, query and deep-link views, and saves before/after PNGs on failure.

Run from a trusted checkout with Chromium available:

```sh
npm ci
npm run build:pages
node --test tests/roadmap-css.test.js tests/roadmap-history.test.js tests/site-info.test.js
npm run check:roadmap-visual
```

The screenshot check is intentionally pixel-exact; investigate any failure and explicitly update the baseline only for a *reviewed* visual change. A future design redesign should use its own new baseline instead of silently overwriting this one.

**Acceptance boundary:** The browser screenshot comparison had not successfully executed in this environment because Chromium navigation to localhost was blocked; CI run/results must be inspected. Independent keyboard/screen-reader and physical print testing remain separate. Do not claim those gates from static CSS tests.
