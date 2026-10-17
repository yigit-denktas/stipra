# Stipra image import · v0.9 input contract

**Implemented in issue #6:** local PNG, JPEG, WebP and a *restricted* geometric SVG subset can be probed, decoded to a common oriented RGBA pixel grid, inspected in a browser and exported via CLI. This module performs input interpretation. Separation, screening and print-package reports are implemented separately; see [the current architecture](ARCHITECTURE.md).

## Running

```sh
npm install
node bin/stipra.js import --input ./my-image.png --out ./out/import
# Serve the repo locally: python -m http.server 8080
# Open http://localhost:8080/examples/import-studio/
```

Browser: select or drop a local file. The preview canvas is intrinsic full-resolution, styled to *fit* the viewport without altering its image grid. Download the normalized PNG or the human-readable metadata JSON.

CLI output (no image upload, API calls or cloud services):
- `source-original.png`, `source-original.jpg`, or `source-original.webp`: original unmodified bytes.
- `source-original.svg.txt` for SVG: original bytes archived as **non-executable text**, never rendered directly.
- `asset-sanitized.svg` for SVG: only the reconstructed allowlisted SVG.
- `asset-normalized.png`: oriented, full-frame sRGB working bitmap, with alpha where present.
- `asset-manifest.json`: format, intrinsic and oriented size, EXIF orientation, alpha, profile indicator, original file name, SHA-256, local output paths, full-frame default trim, warning and provenance.

## Strict rules and limitations

- File signatures, not extensions, choose the decoder. Maximum 16 MiB file, 20,000 px on either axis and 24 megapixels. Decoders are handed a byte buffer, never a URL. Malformed/truncated images are rejected.
- JPEG and WebP EXIF orientation tags (1–8 where present) are read, neutralized **in a temporary copy**, then applied **once** to the RGBA canvas. The archived original keeps its original EXIF.
- Intrinsic aspect ratio, pixel origin, alpha and original file bytes are retained. Normalized output is always the full oriented source canvas. Since general image files don't define Stipra production trim/bleed, initial trim is explicitly set to the entire image with zero bleed, rather than silently guessing trim.
- The original ICC profile is preserved **in the original file** and its presence recorded, but the RGBA preview is an sRGB working representation; no calibrated ICC conversion/profile round-trip is promised.
- Animated WebP is explicitly unsupported. No upscaling/downscaling, segmentation, arbitrary reference tracing or invented ink plates.
- SVG is parsed using DOMParser (browser) or pinned MIT `@xmldom/xmldom` (Node), and a new SVG is **reconstructed** from a bounded set of shapes, groups, numeric attributes and literal colors. Source HTML/XML is never directly inserted in the page or loaded in the renderer.
- **Allowed SVG elements**: `svg`, `g`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`. The SVG must specify integer pixel `width` and `height`; `viewBox` is preserved. Inherited appearance works through allowlisted `fill`, `stroke`, `opacity`, basic strokes and SVG transforms.
- **Rejected SVG features**: `script`, `foreignObject`, `image`, `text`, `use`, `defs`, gradients, masks, filters, CSS/style rules, external URLs, namespaces, DTDs, entities and embedded fonts. This is an explicit **rejection**, not a claim that the full SVG was safely rasterized or that a visually equivalent font/filter fallback was produced. The previous preview remains unchanged and the error explains the unsupported feature.
- SVG source is limited to 2 MiB, 4,096 elements, depth 32. No regex-based *sanitization*: signatures/DTD regex preflight is supplemental; DOM parsing plus allowlist reconstruction is the actual defense.

## Next: separation and plate input

`src/import/asset.js` exposes `ingest(bytes, platform, options)` returning `{metadata, rgba, canvas}`. These RGBA bytes and origin metadata will be handed explicitly to #7. The generic vector-only `src/core.js` recipe **remains v1 and unchanged**; image assets are not disguised as vector shapes. For a future scene contract with image-backed content, add an explicit versioned schema and migration.

Test with `npm test` (including synthetic transparent PNG, EXIF-oriented JPEG, alpha WebP, safe/hostile SVG, invalid dimensions, byte budgets, malformed inputs, and shared Node/browser-global probing). This is a software test, not a claim of physical printing calibration. Browser drag/drop still requires visual acceptance in target browsers before marking production-ready.

## PNG precision and interpretation boundary

`sourceEncoding.bitDepth` records the PNG source sample depth separately from `pixels.bitDepth: 8`. A 16-bit source produces an explicit precision-reduction warning; preserving original bytes does not preserve those samples in the working buffer.

APNG is rejected until an explicit frame-selection contract exists. Unvalidated cICP, mastering/light-level signals and combined cICP/ICC are rejected before decoding. The only accepted cICP tuple is full-range sRGB `[1,13,0,1]`. This conservative boundary is not complete HDR detection; ICC-only SDR interpretation retains its existing reference tests. Nonidentity PNG eXIf orientation is rejected until a tested normalization path exists; identity orientation is accepted without rewriting the chunk. Authors can provide an orientation-normalized SDR sRGB still from their chosen tool.

The source can contain other metadata that Stiprā has not inspected. Unknown provenance is not verified provenance. [Structured-artwork research](STRUCTURED-ARTWORK.md) and #83–#86 scope richer input adapters; no automatic source reconstruction or third-party upload is implemented.
