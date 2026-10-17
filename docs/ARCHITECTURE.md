# Architecture: implemented paths and optional extensions

Updated 17 October 2026. [Structured-artwork decision](STRUCTURED-ARTWORK.md) records the next boundary; [measured alpha evidence](CREATIVE-CODING-ALPHA.md) records runtime and export limits. This describes implemented behavior unless explicitly marked proposed.

## Two rendering paths

**Native vector scenes:** `src/core.js` validates procedural v1 geometry/ink recipes. `bin/scene.js` emits vector scenes and per-ink SVGs from that contract. This retains the supported primitives and transforms. It is distinct from the pixel separation SDK; arbitrary imported SVG is not converted into this schema. See [RECIPE-v1](RECIPE-v1.md).

**Pixels and authored coverage:** `src/sdk/index.js` exposes `renderImage` and `renderLayers` through `@stipra/core`. It wraps the shared separation, screening, Styles, diagnostics and physical export-plan modules. Its input is explicit 8-bit sRGB straight-alpha RGBA or one to eight same-frame 8-bit ink masks. Its owned results include continuous coverage, screened production masks, proof pixels, normalized recipes and diagnostics. The core has no runtime dependencies, DOM, native codecs, fonts, PDF or ZIP imports.

The preserved Prehnite v8 case study remains behind the legacy `render`/`presets` commands. It is not the implementation of the general pixel SDK.

## Input interpretation stays outside the lean core

`src/import/{svg,probe,asset,node}.js` validates supported PNG/JPEG/WebP and a restricted SVG subset, decodes locally, normalizes supported orientation and requests 8-bit sRGB pixels. Original bytes remain separate. Restricted SVG is reconstructed safely and rasterized for the image path; its original is retained as inert text. See [IMPORT](IMPORT.md) and [color policy](COLOR-MANAGEMENT.md).

`@stipra/canvas` captures existing 2D Canvas/p5 sources and authored ink canvases. It records backing/logical dimensions, explicit polarity and alpha behavior, leaves host RNG/drawing state alone, and returns a separate drawable proof. Source snapshots remain owned and exports freeze before loading optional dependencies. WEBGL/WebGPU are unsupported. The bounded draft helper is an example, not a new package API. See [adapter contract](../packages/canvas/README.md).

The browser studio is an image-input host. Authored ink input exists in the SDK/adapter/package writer, not a completed studio layer-import UI.

## Shared production semantics

`src/separation.js` creates continuous-tone coverage from pixels. `src/screening.js` applies explicit screen settings to coverage. `src/styles.js` resolves versioned styles, including physical LPI/DPI. `src/plate-diagnostics.js` measures coverage/overlap and gives contextual guidance. `src/export-plan.js` keeps dimensions and physical origin explicit and removes simulated proof registration from raster production masks.

Paper and proof effects remain separate from production ink coverage. The proof uses an uncalibrated RGB approximation. No physical print calibration is implied by passing the software tests. Raster recipe/coverage parity does not imply arbitrary source-decoder or native-vector parity.

## Heavy export is optional

`src/print-package.js` is the shared image/authored package writer. It preserves the original file or canonical authored snapshot, normalized recipes, source hashes, aligned continuous/screened raster masters, digital proof, diagnostics and reports. `src/browser/export.js` adapts it to browser byte/Canvas APIs; `bin/package.js` and `scripts/reproduce-layers.js` use it through the CLI. Node and browser share production mask/geometry semantics.

PDF reports use `pdf-lib` with separately licensed embedded fonts; ZIPs use JSZip. PDF/ZIP/font/native-codec code is outside lean core and Canvas adapter imports. Browser hosts load the exporter only on an explicit export action. Reports are inspection documents, not the full-resolution production masters. See [package contract](PRINT-PACKAGE-v1.md), [alpha parity](CREATIVE-CODING-ALPHA.md) and the unresolved [distribution audit](DEPENDENCY-AUDIT.md).

## Proposed source-informed adapters

Named object/region masks, depth, disparity, normals and source-project code are different kinds of data. The proposed adapters in [STRUCTURED-ARTWORK](STRUCTURED-ARTWORK.md) would map supported regions into final ink coverage and optionally preserve declared source relationships beside the current snapshot. These are not core fields or implemented native HEIF/RAW/EXR/OpenRaster/C2PA support.

Keep format parsing, precision/tone mapping, metadata validation, inference and authoring runtimes outside the lean core. Reuse compatible host libraries and standards where they solve a demonstrated task. No restricted p5.riso source is included or rewritten; dependency and asset licenses remain separate from Stiprā's MIT code license.
