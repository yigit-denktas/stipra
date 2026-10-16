# Image separation · coverage contract v1

**Implemented (issue #7):** a deterministic, pure JavaScript mapping from one full-frame **oriented RGBA image** to independent **continuous-tone grayscale coverage masks** (spot inks or CMYK), plus an approximate digital overprint preview and statistics. Source: [src/separation.js](../src/separation.js). Shared unchanged between Node and the browser.

This **does not** simulate halftone dots (#5), produce calibrated real-press ink recipes or replace production-export and registration/trim features (#8). The current masks use source-image pixel alignment (full canvas). Advanced screening, PDF reports and ZIP packages are forthcoming (#5, #9, #12).

## See and edit in the browser

Serve the repo locally (`python -m http.server 8080`) and open [the separation lab](../examples/separation-lab/index.html). Drop your own PNG/JPEG/WebP or supported restricted SVG. Switch between **2 spot inks** and **CMYK**; change the ink color, spot channel/matching target, threshold and strength. Inspect the original, composited proof and full-frame monochrome plates; download the preview, masks and normalized recipe. No accounts, network or model API are required.

The lab is a proof of the core editable-mask model, **not yet** the integrated production studio (#22).

## Agent-safe command-line recipe

```sh
npm install
node bin/stipra.js separate \
  --input ./your-photo.png \
  --config examples/recipes/spot-photo.json \
  --out out/separation-spot

node bin/stipra.js separate \
  --input ./your-photo.png \
  --config examples/recipes/cmyk-photo.json \
  --out out/separation-cmyk
```

This command preserves the input bytes in `source-original.<format>` (original SVG source is archived as inert `.svg.txt`), then writes `source-normalized.png`, `preview-composite.png`, `plate-<id>.png` for each configured ink, `recipe.normalized.json` and `separation-manifest.json`. **An existing output file is never overwritten.** The manifest includes the source asset's original and oriented dimensions, EXIF orientation, alpha, ICC-presence warning, source SHA-256, per-ink average coverage, recipes and file names.

### Recipe schema

```json
{
  "version": 1,
  "mode": "spot",
  "paper": "#ffffff",
  "inks": [
    {
      "id": "blue", "name": "Blue", "color": "#2365a5",
      "source": "darkness", "threshold": 0,
      "gain": 1, "gamma": 1
    },
    {
      "id": "coral", "name": "Coral", "color": "#e65e4b",
      "source": "match", "target": "#e65e4b",
      "tolerance": 0.45, "threshold": 0,
      "gain": 1, "gamma": 1
    }
  ]
}
```

The separation engine accepts 2–8 named spot inks. The ink's `source` can be `red`, `green`, `blue`, `luminance`, `darkness`, `match`, `cyan`, `magenta`, `yellow` or `black`. `match` compares the pixel's sRGB color to a selected target in normalized RGB Euclidean distance, using `tolerance` as the cutoff radius. This is a simple, adjustable channel filter **not** a calibrated perceptual/ink-mixing optimum.

CMYK requires exactly four ink entries with sources `cyan`, `magenta`, `yellow`, `black`, in that order, and is computed from the standard normalized RGB-to-CMYK formula with special handling for pure black. **This is mathematical RGB separation, not an ICC color-managed conversion.** The printed ink preview colors may be replaced without changing the underlying per-channel grayscale data.

Each ink exposes `threshold` (0..0.99), `gain` (0..4), `gamma` (0.1..5), and optional `invert` (boolean). The coverage transfer is `clamp( clamp((source - threshold) / (1 - threshold)) ^ gamma * gain )`, then multiplied by source alpha. Multiple physical plates may have nonzero coverage for the same pixel. A source pixel with alpha 0 contributes **zero ink** to all plates.

Optionally in spot mode:

```json
"blackHold": {"inkId": "blue", "threshold": 0.08}
```

Pixels with *linear-light luminance* at or below 0.08 are routed at full source-alpha coverage to the specified ink and suppressed on other ink plates, allowing intentional **solid black linework** to survive separate screening in #5. This is an opt-in routing rule; it does not detect text, guarantee semantic structure or preserve fine lines during future downsampling.

### Physical versus visual semantics

- `masks[i].coverage` is a `Uint8Array(width × height)` where **0 = no ink, 255 = full ink**. Source geometry/pixel origin do not move and the paper is **never counted as a plate**.
- A rendered grayscale master is **white where no ink is applied** and **black for maximum coverage**, with intermediate values for continuous tone. It is not an SVG tracing of the photograph.
- `preview` is an opaque sRGB buffer using simple RGB multiply-like ink compositing over the chosen paper. It is an **illustrative digital proof, not spectrally measured ink overlap**; original alpha is preserved in the coverage masks, not in the proof background.
- Coverage statistics are per-frame estimates before dot screening, bleed, registration error, dot gain or actual printing. Actual ink and paper costs need physical calibration.
- The separation recipe is independent of the **vector scene v1** document contract; there is no misleading attempt to interpret a photograph as geometric facets.
- The engine is independently authored under MIT from conventional color math and pixel transforms. [p5.riso](https://github.com/antiboredom/p5.riso)'s protected source was **not** incorporated, forked, or translated. See [licensing notes](LICENSING.md).

## API

```js
const separation = require('./src/separation.js');
const recipe = separation.validate(recipeJson);
const result = separation.separate({width, height, rgba}, recipe);
// result.masks[0].coverage: one byte per source pixel
// result.preview: full-size RGBA simulated overprint
// separation.plateRGBA(mask.coverage): black/white grayscale PNG input
```

Runtime invariants are exercised in [separation tests](../tests/separation.test.js): pure black, primaries, alpha, 2–8 spot and four-ink validity, real user-adjustable masks, source preservation, browser/Node parity, full-frame CLI PNGs, and refusal to overwrite existing files. Browser demo smoke tests use real Chromium on CI.
