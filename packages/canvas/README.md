# @stipra/canvas — existing sketches, real ink masks

An optional browser adapter for the private local `@stipra/core` alpha. It accepts plain 2D Canvas, a p5 main canvas/renderer or p5.Graphics, without changing p5's prototypes, drawing loop, random/noise state or global names. It has one peer dependency: the matching local core package. It does not import p5, p5.grain or the PDF/ZIP stack.

```js
import {renderCanvas, drawProof, exportSnapshot} from '@stipra/canvas';

// Within your sketch: art is a separate p5.Graphics source, p is the destination.
const proof = renderCanvas(art, {
  style: {id: 'portrait-duotone', variant: 'blue-pink', lpi: 40},
  dpi: 300,
  seed: 42,
});
drawProof(proof, p);

// Only on an export action, with an explicit loader for the optional exporter.
const archive = await exportSnapshot(proof, () => import('/your/assets/print-export.mjs'));
```

Build the repository examples with `npm run build:pages` and serve `dist/`. Open `/stipra/sketches/` for Canvas, `/stipra/sketches/global.html` for p5 global mode, or `/stipra/sketches/instance.html` for authored passes in instance mode. These are original procedural drawings, with no owner photographs. Click **Draw next frame** to rerender the source; export captures the displayed frame even if the drawing advances while the exporter loads.

The optional ESM export module is built by `scripts/build-sketches.js` into `dist/stipra/sketches/assets/print-export.mjs`. It is a separate, heavier distribution with its own dependency notices. Hosting that module is explicit; the adapter does not fetch an invented endpoint or assume a CDN. The standalone adapter tarball does not include that exporter. Use the generated static examples or build/copy the optional exporter into your own app.

## Capture and display contract

- `captureCanvas(source)` returns owned, 8-bit sRGB straight-alpha pixels and backing/logical-size metadata. It does not resize, crop or modify the source. For a plain canvas, logical dimensions default to its width/height attributes; CSS size is presentation only. A `{canvas, width, height}` host can supply explicit logical dimensions with the same aspect ratio.
- p5 density is inferred from actual backing pixels versus logical dimensions. The compatibility tests exercise densities 1 and 2. **DPI applies to backing pixels**, not CSS/logical coordinates. The density-2 example uses 600 DPI to keep the same physical size as the density-1 example at 300 DPI. No invisible resolution normalization occurs.
- `renderCanvas` returns `.canvas` (drawable), `.result` (core proof, plates, diagnostics and normalized recipe), and `.capture` (owned source snapshot). Later drawing cannot change the captured buffers.
- The default image presentation clips the opaque core proof to the artist's original alpha. This is a compositable artistic preview, with paper color inside the clipped artwork; it is **not an ink-only physical overprint**. `{alpha:'paper'}` displays the opaque paper proof. Presentation alpha never changes production masks or the archived print proof.
- `drawProof` draws in logical coordinates, preserving the target's drawing state. It rejects the captured source canvas as destination. Use a separate source buffer each frame; manually drawing an effect over its own source can still create feedback outside this helper.
- A fixed seed freezes screen randomness. To animate a treatment deliberately, choose the frame's seed explicitly, for example `(baseSeed + frameCount) >>> 0`. The adapter never consumes or reseeds p5's random/noise generators. It does not add another grain implementation; compatible p5.grain reuse remains available when grain is needed.
- 2D renderers are supported. WEBGL/WebGPU capture/destination is explicitly rejected with `unsupported-renderer`; no support for late GPU-frame readback is implied. Transfer to a 2D canvas yourself if appropriate, then capture that canvas. A future GPU integration must demonstrate its frame/color/alpha behavior.
- Tainted canvas readback fails as `tainted-canvas`, with same-origin/CORS guidance. Non-sRGB readback, invalid dimensions, mismatched layer frames, unknown polarity and feedback destinations have actionable `.code` errors. Uploaded artwork is never sent to a service.

## Preserve artist-authored ink assignments

```js
import {renderCanvasLayers} from '@stipra/canvas';

const proof = renderCanvasLayers({
  paper: '#f5eee2',
  inks: [
    {id:'green', name:'Green shape', color:'#006043', source:shapeLayer, polarity:'alpha'},
    {id:'type', name:'Blue lettering', color:'#0D4DAD', source:typeLayer, polarity:'alpha'},
  ],
}, {
  dpi:300, seed:42,
  screenRecipe:{version:1, seed:42, default:{mode:'dots', pitch:6, angle:23},
    plates:{type:{mode:'solid'}}},
});
```

`captureLayers` accepts one to eight source canvases. Every pass must share backing **and logical** dimensions; it never scales one to fit. Choose polarity explicitly:

| Polarity | Coverage |
| --- | --- |
| `dark-on-light` | `(255 − gray) × alpha / 255` |
| `light-on-dark` | `gray × alpha / 255` |
| `alpha` | Source opacity; RGB ignored |

Grayscale modes reject nonneutral visible colors rather than guessing. Core coverage is 0 for no ink, 255 for full ink. For raw `Uint8Array` masks, use core `renderLayers` directly. Authored canvas proofs default to opaque paper; optional source clipping uses the maximum authored coverage at each pixel. This clipping is presentation only. Solid lettering remains solid when its screen mode is `solid`.

## Authored package and replay

The shared exporter uses the same screen/master/report writer for image and authored input. Authored packages contain `source/original.json` (the canonical source descriptor), lossless grayscale source layers with raw coverage SHA-256, unscreened plates, zero-offset screened masters, proof-only registration, paper, PDF/HTML report, normalized recipes and file hashes. These are generated snapshots; no original file bytes are implied for a canvas drawing. White in a source-layer PNG means no ink and black means full coverage.

From the repository/CLI environment:

```sh
node scripts/reproduce-layers.js captured.zip new-output.zip
```

The script checks the source descriptor and reconstructed coverage hashes before calling the same Node package writer. It refuses to overwrite an output. The browser's optional exporter and Node `generateLayers()` share that writer. Cross-host PNG/PDF serialization is not promised byte-identical. Physical print response remains unverified.

## Distribution and compatibility evidence

The adapter is ESM plus TypeScript declarations and MIT text. It is private/unpublished. Clean offline installation installs only adapter and core. Browser CI exercises p5 **1.11.11** and **2.2.2** at density 1/2, real p5 global/instance examples, changing frames, alpha, state preservation, actual tainted canvas rejection and optional image/authored exports. Other versions/renderers are not claimed tested.

The hosted examples use an unmodified, replaceable p5.js 1.11.11 script. Its full LGPL-2.1 text, upstream source tag and replacement instructions are served beside it. p5 is separate from the MIT core/adapter tarballs. The optional full export distribution retains the broader application's unresolved #14 notice/native/WASM audit findings; this work does not declare them cleared.

## Performance and acceptance

See [the measured alpha evaluation](../../docs/CREATIVE-CODING-ALPHA.md) for declared sizes, compatibility, memory limits, export parity and the existing-tool comparison. Rendering is synchronous; cache unchanged proofs and use a bounded draft with an explicit full-resolution final. The optional [draft example](../../examples/sketches/draft.mjs) freezes the original frame, labels draft resampling and never exports the reduced buffer. It is an example helper, not part of this package API.

Optional package derivatives can be requested with `exportSnapshot(rendered, loadExporter, {exports: {formats: ["png", "jpg", "webp", "svg"], scale: 2, alpha: "paper", vectorPlates: true}})`. Settings are frozen before loading; codecs remain in the optional exporter. Native masters stay unchanged. SVG derivatives are sampled run paths, and JPG/WebP are lossy. See [the export contract](../../docs/CLI-WORKFLOWS.md).
