# Stiprā · geometry-first identity study

**Status: three alternatives for owner review, not an approved replacement for the original dotmark.** Your existing [five-row SVG logo](../logo_for_Readme.svg) remains unchanged in the README.

The previous logo looked like a halftone illustration vaguely suggesting S: fragmented negative space, conflicting dot sizes, excessive right-side dark/coral weight, and a silhouette dependent on its palette. Instead of patching the colors, this study rebuilds the **form first** and makes the screen a reproducible print system.

## See the new candidates

| Variant | Live vector preview | What is being tested |
| --- | --- | --- |
| **0 · Black silhouette** | [Monochrome shape](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-silhouette.svg) | Does the S work as a solid at 24px, on signage and without any screen? |
| **A · Strict geometric halftone** | [Matrix S](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-matrix.svg) | Fixed dot spacing, constant interior size and crisp boundary progression |
| **C · Parametric matrix** | [Weighted S](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-density.svg) | Same centers; dot radius varies deterministically with silhouette clearance and a gentle centering weight |
| **C + B · Real two-ink overprint** | [Ink-separated mark](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-overprint.svg) | The same controlled dots change from teal to coral along the S, with a deliberate narrow shared region printing in both inks |

**My working recommendation:** compare the black silhouette first, then the parametric matrix against the two-color overprint. Do not select a pretty color rendering if the shape itself is weak.

The [two spot-ink masters](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-teal.svg) ([coral master](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-coral.svg)) and [normalized recipe](https://apps.yigitdenktas.com/stipra/brand/stipra-mark.recipe.json) are generated through Stiprā's actual `src/core.js` vector scene resolver, **not hand-crafted screenshot approximations**.

## Construction rules

1. **Solid S first.** Three cubic Bézier segments describe one continuous centerline. A constant-width band of 82 coordinate units is sampled into strongly overlapping geometric circles, producing a smooth round-capped solid silhouette **without offset-polygon cusps**. No random noise, accidental fragments or color rules are involved.
2. **One fixed dot matrix.** Lattice pitch **11.8 coordinate units**, identical dot centers in all variants. No stochastic speckling, per-color scatter or offset. The interior is clipped to the *actual path-distance bound*; dot radii reduce smoothly at the outline.
3. **Quantified optical balance.** Sum circle areas (πr²) to measure the printed mark's centroid and left/right mass. The generator rejects candidate output if the centroid drifts more than 12 units from the canvas center or left/right ink area differs by over 10%. That diagnostic is *not* a substitute for a designer's eye.
4. **Color follows the letter.** The spot assignment follows *progress along the S's centerline*, not raw canvas x-position. Teal prints through the upper portion, coral through the lower; only the middle **42–58%** ribbon interval belongs to **both** physical inks. There is no decorative third-black dot pass: darks appear through meaningful ink overlap.
5. **An independent monochrome fallback.** Both the filled outline and the all-black parametric matrix are separately generated; the smallest deployment (e.g. a 24px icon) should use whichever survives legibility testing. A halftone treatment is *not compulsory* everywhere a logo is used.
6. **Same artifact system.** Stiprā v1 scene recipes generate a composite, two identical-origin grayscale plate SVGs and monochrome/alternative studies, with SHA-256 manifest and determinism tests. Black and colored choices are both faithful to their recipes.

These are **design proposals**. The generator's mass and symmetry limits are meaningful automated safeguards, not claims that aesthetics are objectively solved.

## Reproduce and inspect

```sh
npm install
npm run build:mark
```

Files are built under ignored `dist/brand/` and deployed to [Stiprā Pages](https://apps.yigitdenktas.com/stipra/brand/stipra-mark.svg) without adding generated SVGs as hand-maintained repository assets. The generator source is [scripts/generate-stipra-mark.js](../scripts/generate-stipra-mark.js); regression tests are [tests/brand.test.js](../tests/brand.test.js).

Evaluate at **24, 48, 96 and 480 pixels**, with one ink and two inks, on white and warm paper. Prefer a family of optical sizes (e.g. solid icon at 24px and screen-based logo at 96px+) over a single unnecessarily complex asset. Compare same-sized prints on actual paper before signing off the brand.

## Current decision

The old overprint ribbon candidate is rejected as the leading direction due to the owner's balance feedback. The new **C + B** candidate is *the recommended study*, not a brand approval. Do not replace the user-provided `logo_for_Readme.svg` unless the owner selects an alternative.

Related: [#46 brand](https://github.com/yigit-denktas/stipra/issues/46), [#31 UI identity](https://github.com/yigit-denktas/stipra/issues/31), [#34 Styles](https://github.com/yigit-denktas/stipra/issues/34). No Dizzy Ink or other third-party artwork is copied; this geometry is original MIT-authored output.
