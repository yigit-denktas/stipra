# plate diagnostics v1

Stiprā's [shared diagnostics](../src/plate-diagnostics.js) measure **actual raster ink coverage**, without modifying image bytes or the printing masters. One implementation serves the browser, the Node CLI and the packaged ZIP. These are **editorial review prompts**, not printer safety certificates.

Each completed `stipra package` ZIP includes `report/diagnostics.json` and a hashed reference from `manifest.json`. The browser also shows a compact readout of overlapping ink area and per-pass effective halftone frequency.

## Measurements

| Field | Meaning |
| --- | --- |
| `plates[].meanCoverage` | Average nominal 0–1 ink coverage across **the complete source pixel rectangle**, including blank pixels |
| `plates[].occupiedFraction` | Pixel fraction having **nonzero** ink amount |
| `plates[].veryDenseFraction` | Fraction of pixels with nominal coverage ≥217/255; descriptive only |
| `plates[].meanWhereOccupied` | Mean coverage conditional on nonzero ink |
| `plates[].additiveInkShare` | Fraction of summed **nominal ink coverage** contributed by this pass; **not physical ink volume** |
| `overall.overlapTwoPlusFraction` | Fraction of full-frame pixels where at least two independent inks individually reach the nominal overlap threshold (default 25%) |
| `overall.overlapThreePlusFraction` | Same, for at least three inks |
| `pairs[].overlapFraction` | Per-pair fraction where both independently exceed the threshold |
| `overall.meanAdditiveCoverage` | Sum of coverage over all plates averaged across source frame; can exceed 1.0 |
| `overall.heavyCombinedFraction` | Area where additive coverage ≥1.8, **not a measured press limit** |
| `plates[].screen.effectiveLpi` | Actual declared output DPI divided by the per-pass screen pitch in pixels; `null` for solid/unscreened passes |

Example: if the green plate covers most of the forest scene and the coral plate has almost no mean contribution, the report should prompt an artist to question whether the third physical pass earns its cost. It must **not** automatically remove coral, infer where antlers are, or mark a specific ink coverage percentage as a universal Risograph fault.

## Warnings and reproducibility

The initial configurable **editorial** thresholds are `littleUsedMean = 2.5%`, `denseMean = 70%`, and `overlapFraction = 35%`. These are diagnostic starting points, not machine-specific prepress tolerances. Their values and the nominal pixel-activation threshold are present in every result. `highCombinedFraction` is an observation about overlapping nominal coverage, **not** a validated overprint danger boundary.

The resolver does not classify image subjects, diagnose moiré, detect lost antler contours or guarantee legibility at 100% scale. Reviewers still need native-size detail crops and physical prints. The [owner-photo acceptance matrix](PRINT-PACKAGE-ACCEPTANCE.md), [forest issue #43](https://github.com/yigit-denktas/stipra/issues/43) and [styles issue #34](https://github.com/yigit-denktas/stipra/issues/34) remain open.

The underlying arrays are treated as read-only; all metrics use integers from the already generated full-frame coverage masks. HTML/PDF proofs remain approximations. Physical paper, spectral mixing, ink absorption, print-run alignment and dot gain are not simulated or certified.

## Developer and agent usage

```javascript
const Diagnostics = require('./src/plate-diagnostics.js');
const result = Diagnostics.inspect(screened, { dpi: 300 });
console.log(result.plates, result.pairs, result.warnings);
```

Run `node --test tests/plate-diagnostics.test.js` or `npm test`. The browser uses `window.StipraDiagnostics` from the same UMD source; there is no second hand-maintained formula.
