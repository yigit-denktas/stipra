# Roadmap CSS consolidation — Good CSS review

**Date:** 18 October 2026. **Target:** [Draft PR #98](https://github.com/yigit-denktas/stipra/pull/98).  
**Source:** [vojtaholik/good-css](https://github.com/vojtaholik/good-css), pinned project-scoped copy at `.agents/skills/good-css/`, upstream MIT license included.

## Scope and result

Clean up the accumulation of roadmap v3, v4, Taste Skill and Impeccable CSS **without redesigning** the roadmap or changing actual product-history data, release publication, copy, or Studio behavior.

| Evidence | Previous | Refactored |
| --- | ---: | ---: |
| `web/stipra/roadmap.css` size | 16,746 bytes | 9,214 bytes |
| Parsed selector rules (including media rules) | 168 | 113 |
| Responsive max-width thresholds | 680, 700, 480, 360, 320 | 700, 480, 360 |
| CSS bytes removed | — | 7,532 (45.0%) |

The original stylesheet is preserved **unchanged** in `tests/fixtures/roadmap-before-good-css.css` for visual regression. It is not loaded in production; only the comparison test serves it.

The refactor removed obsolete `r-display`, `r-topline`, `r-snapshot`, `r-journal-entry`, `r-initiative` and other old-layout selectors. It preserved summary markers, reduced-motion behavior, the section reset, current colors, typography, focus outlines, and present-day responsive values. No generic dark theme, arbitrary font changes, or wholesale OKLCH migration was introduced.

## Validation carried out

**Source-level equivalence:** The consolidation algorithm resolved final declarations *for each selector*, respecting media ranges and `!important`, then compared final declarations across 15 widths spanning all existing breakpoints. **Zero mismatches** were found. This is useful static evidence, not a guarantee against interactions between overlapping selectors in real browser cascades.

**Representative browser cross-check:** The previously reviewed standalone roadmap HTML was reconstructed with its original layered styles and an equivalent consolidated set of styles. Chromium rendered both in-memory at 320, 390, 768 and 1440 CSS px in default, search and expanded states: **12 of 12 screenshots were pixel-identical** (0 changed pixels); no horizontal overflow was observed. This verifies the *consolidation technique on a representative preview*, not the exact built PR asset.

**Actual built-page regression:** `scripts/verify-roadmap-css-visual.js` serves the identical built `dist/stipra/roadmap/` page twice, selecting archived original CSS for “before” and current CSS for “after.” It uses Chromium CDP screenshots at four widths with empty-release/default, `?q=ink`, and `#cap-INK-01` states. It fails on any PNG difference and retains both screenshots plus `report.json`. A dedicated `roadmap-visual-regression.yml` workflow builds the page, runs this comparison, and uploads evidence.

**Not yet verified:** This environment blocks Chromium navigation to localhost, so the real built-page comparison could not finish here. GitHub CI on the latest branch commit has not produced a confirmed result. Treat visual parity on the actual build as **pending** until the new workflow succeeds and its images are reviewed.

## Reproduce and inspect

```sh
npm ci
npm run build:pages
node --test tests/roadmap-css.test.js tests/roadmap-history.test.js tests/site-info.test.js
npm run check:roadmap-visual
```

If visual regression fails, inspect `out/roadmap-css-visual/*-before.png` and `*-after.png`, correct the cascade if accidental, and rerun. A deliberate later redesign should explicitly adopt a new baseline in its own reviewed change. Do not make tests advisory simply to secure a green check.

## Why Good CSS did not rewrite everything

Good CSS favors logical properties, responsive sizing, native behaviors and clean interaction states. Those ideas are compatible with Stiprā's editorial layout, but **a behavior-preserving refactor has a narrower goal than full modernization**. Existing hex design tokens are authoritative in `shared.css`; replacing their values with OKLCH can move colors and contrasts. Replacing every breakpoint with intrinsic layout can also change the reading rhythm. Both belong in a separately reviewed design change, if justified.

The new CSS has one responsive range per actual visible transition. The project-scoped skill can guide later improvements, with its source/compatibility constraints reviewed for supported browsers. No external networked npx installer or self-modifying hooks are required for other coding agents to read the pinned skill.

## Exit decision

Do not merge PR #98 on static equivalence alone. Confirm the real built-page browser comparison, normal repository tests, and review the evidence for any intended differences. Manual keyboard, screen reader, artist/printer and actual release-ingestion checks remain separate release gates.
