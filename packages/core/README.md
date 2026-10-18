# @yigit-denktas/stipra-core — local experimental alpha

A small, synchronous printmaking engine for existing JavaScript artwork. It reuses Stiprā's separation, screening, shared Styles and diagnostics. The package has **zero runtime dependencies** and includes browser ESM, CommonJS and TypeScript declarations. Version `0.1.0-alpha.1` is published; registry archives and a clean install are verified.

```js
import { renderImage, renderLayers } from '@yigit-denktas/stipra-core';

const result = renderImage({
  width: imageData.width,
  height: imageData.height,
  colorSpace: 'srgb',
  rgba: imageData.data,
}, {
  style: { id: 'editorial-halftone', variant: 'forest-depth', lpi: 50 },
  dpi: 300,
  seed: 42,
});

// Draw these owned pixels through your host's Canvas/p5 integration.
const proofPixels = result.proof.rgba;
const firstProductionMask = result.plates[0].screened;

// Keep an artist's ink decisions without estimating them from RGB again.
const authored = renderLayers({
  width: 2, height: 2, paper: '#ffffff',
  inks: [{ id: 'green', name: 'Stiprā green', color: '#006043',
    coverage: new Uint8Array([255, 0, 128, 255]) }],
}, { dpi: 300, seed: 42 });
```

`renderImage` requires either `style: {id, ...adjustments}` or an explicit `inkRecipe` and optional `screenRecipe`. Mixing them is rejected so style provenance cannot silently drift. `listStyles()` lists families/variants. `resolveStyle(id, options)` returns the same versioned recipe used by the lab/CLI. Style frequency is expressed in LPI and converted using DPI; inspect effective LPI and any pitch-clamping warnings.

`renderLayers` accepts one to eight full-frame `Uint8Array` masks with unique ink IDs. Zero means no ink; 255 means full coverage. Intermediate values are coverage, not inverted print grayscale. Incorporate alpha into authored coverage yourself. Layer order is retained. Default screening is solid; supply a version-one screen recipe for dots/lines/hybrid treatments. Raw screen pitch is in source pixels; diagnostics report its physical frequency at the chosen DPI.

## Ownership, geometry and color

- Inputs are borrowed read-only during the synchronous call. Output buffers are owned and independent of inputs, each other and subsequent renders. Do not modify input memory concurrently. SharedArrayBuffer inputs are rejected. Ordinary typed-array views from another realm are accepted.
- `plates[].coverage` is continuous-tone input coverage; `plates[].screened` is screened production coverage. Both keep identical dimensions and origin. Proof registration affects `proof.rgba` only; it never moves production plates.
- `proof.rgba` is **opaque paper plus simulated ink**, not a transparent texture overlay. Source transparency suppresses ink. Transparent compositing and host adapters belong to follow-up integration work.
- `geometry` records native pixels, complete trim and physical dimensions. Nothing is resized or cropped. DPI defaults to 300 and must be 72–1200. Width/height must be positive integers, at most 20,000 per edge and 24 megapixels total. Large inputs can allocate substantial memory; no frame-rate or streaming guarantee is made.
- Pixel input must explicitly declare `colorSpace: 'srgb'`, with straight-alpha 8-bit RGBA. Host image decoding/ICC normalization is separate. Photos, scans of handmade artwork and generated drawings can all supply these pixels. Raw drawing coordinates and Canvas pixel density are the host's responsibility.
- All randomness is recipe-seeded; Stiprā does not call or seed the artist's global random/noise functions. An explicit `seed` conflicting with `screenRecipe.seed` is rejected. Same normalized pixels/masks, settings, version and engine environment reproduce the masks. Native file decoding and encoding across hosts are not byte-identity guarantees.

`result.recipe` records input kind, normalized ink mapping, production/proof screens, DPI and optional resolved Style provenance. Preserve the original source pixels or authored masks alongside it: JSON settings alone cannot recreate artwork. `diagnostics` measures **production** coverage/overlap and reports warnings; input suitability is present only for image inputs. It is not a semantic classifier or calibrated press model.

The core does not load p5.js, p5.grain, PDF, ZIP, QR, fonts, native codecs, a DOM or a UI. Those remain optional host/export concerns. This API does not decode files, export packages, install a drawing loop or expose a photo editor. p5.grain reuse is planned at the adapter/effect layer when needed.

## Build and local installation

From the repository root:

```sh
npm ci
npm run build:core
npm pack ./packages/core --pack-destination /your/output
```

Install the resulting tarball into your sketch project. `npm run check:core-package` builds, packs, installs offline into a clean temporary project, checks both module entries and TypeScript consumers, and writes a measured package report under `out/core-package/`. There is no registry publication step. Publication uses the npm registry with public access and the `alpha` tag after exact-tarball checks.

MIT applies to the independently authored code included here; the tarball includes its full license. Build-only dependencies and the wider studio/CLI dependency graph are separate. Digital overprint remains an uncalibrated approximation; physical print acceptance is not established by this alpha.
