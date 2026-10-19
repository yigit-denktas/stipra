# Release follow-up and first editorial drawing trial

19 October 2026. Agent-authored work, not independent artist or physical acceptance.

## Publication and live export

[Studio v0.9.0-rc.1](https://github.com/yigit-denktas/stipra/releases/tag/v0.9.0-rc.1) is published as a prerelease at `aec0c23d6cc538e4e00352c66ee9543eba7694cd`. GitHub asset 656722447 is 3,714,250 bytes with SHA-256 `a07cb05d0f14945b69870c6b6fb1e084cf62cb0e10674cfb2caac72eabce32b3`, matching the independently verified browser build. The npm libraries remain alpha.1. There is no native bundle.

The owner supplied the live Studio's downloaded print package: 2,771,434 bytes, SHA-256 `958351a32dec4953e82fe9a7aa26bd58c2eb2246f97aa13de20981552fcb0148`. The actual source matches the public outlined SVG in the candidate archive. All 16 payload hashes pass; native plates remain 1200 × 420 px at 300 DPI with zero offsets. Both A4 landscape report pages render intact, embedded fonts pass the CLI verifier, and JSON-decoded embedded recipes agree with the ZIP. Together with observed import, comparison, adoption and inspection, this completes this specimen's live import-to-download check. It does not authenticate the deployed application bytes.

The release-history bot created commit `401aeef` with the real publication timestamp and six typed release events. It dispatched [Pages run 39281801339](https://github.com/yigit-denktas/stipra/actions/runs/39281801339). Both the API and browser still reported queued at review despite the committed history; deployment completion remains unverified. Do not create a duplicate publication or synthetic history event to resolve that inconsistency.

## Morning window

An original illustration of a window, plant, cup and folded newspaper tests an actual editorial use: a possible Kushluk insert. It is not integrated into Kushluk, copied from a reference image or presented as an approved identity asset. No image generation, photographs or third-party artwork are used.

| Decision | Purpose |
| --- | --- |
| Green `#006043`, unscreened | Retain fine stems, newspaper marks and architectural contours |
| Coral `#FF665D`, hybrid at 40 LPI / 22° | Screen the translucent light beam while keeping solid sun/cup contours |
| 1440 × 1800 px, 300 DPI | Native 121.92 × 152.4 mm artwork; no resampling or invented bleed |
| Two authored masks, seed 193 | Preserve drawing decisions without estimating the inks again from RGB |

The first dots-only treatment roughened the full-coverage contours. The existing hybrid mode improved those edges; no engine default or shared recipe changed. Green and coral contribute approximately 6.4% and 7.4% mean screened coverage; two-ink overlap at the diagnostic threshold is about 0.4%. These describe raster data, not actual ink consumption or aesthetic scores.

The core was installed from npm at `0.1.0-alpha.1` into a clean consumer with scripts disabled: exactly one dependency-free package. Its proof pixels match the repository's shared exporter after decoding. Repeat screen masks are identical. Snapshot replay reproduces decoded proof pixels and all four continuous/screened plate images. The package verifier passes, including its two-page A4 portrait inspection PDF and embedded fonts. Both report pages were rendered and visually reviewed. [Measured record](evidence/creative-use-2026-10-19.json).

## Reproduce

From a trusted repository checkout with Node and its existing dependencies:

```sh
npm ci
npm run prepare:fonts
npm install --prefix out/creative-use/consumer --ignore-scripts --no-audit --no-fund @yigit-denktas/stipra-core@0.1.0-alpha.1
node examples/creative-use/morning-window.cjs out/morning-window out/creative-use/consumer/node_modules/@yigit-denktas/stipra-core/dist/index.cjs
node bin/stipra.js verify --input out/morning-window/morning-window.zip --json
node scripts/reproduce-layers.js out/morning-window/morning-window.zip out/morning-window-replayed.zip
```

The drawing script refuses to overwrite an output directory. The native Canvas host, fonts, PDF and ZIP are development/export dependencies, outside the published core import. The Canvas 2D drawing functions can receive a p5.Graphics drawingContext, but this trial did not execute p5 and makes no new p5 runtime claim. Cross-host encoded file identity is not promised; compare decoded pixels and normalized masks.

## Friction and next decisions

- **Report setup:** the first full export stopped at missing verified fonts. `npm run prepare:fonts` resolved it. Keep this prerequisite explicit; it is not a lean-core requirement.
- **Drawing control:** authored layers preserved every intended ink assignment. Re-separating this drawing from RGB would discard useful information. Keep the layer route visible in examples; a new photo-editor feature is unnecessary.
- **Screen choice:** all-dot screening did not suit every mark. Existing solid/hybrid per-ink choices solved this example; adding another effect is not justified by this trial.
- **Timing:** one native-host render was recorded, not a performance benchmark or animation-rate promise.

Owner review of the illustration, human accessibility, independent artist usefulness and physical printing remain open/deferred. Native component notices remain #14. This trial does not clear those gates or change #70 to accepted.
