# Stiprā print package · CLI v1

**Status:** a real Node CLI implementation of aligned **raster** ink masters, an orientation-aware A4 HTML/PDF inspection sheet and a single ZIP with provenance. Physical press calibration and owner image *visual approval* remain open. [See the three-image release gate](PRINT-PACKAGE-ACCEPTANCE.md).

## One print from one local photograph

Run after `npm install` with Node 20 or newer:

```sh
node bin/stipra.js package \
  --input /private/path/artwork.jpg \
  --config examples/recipes/owner-A-sculpture-inks.json \
  --screen examples/recipes/owner-A-sculpture-screens.json \
  --dpi 300 \
  --marks-mm 5 \
  --out out/sculpture.zip
```

This creates a **new ZIP** and refuses to replace one that already exists. It never sends your image to Stiprā's website or an API. The source bytes are carried inside the private ZIP, so do **not** publish the ZIP unless you have redistribution rights for the photo and any depicted artwork. The owner-provided photographs are **not** in this public repository.

For exact owner fixture reproduction, use `--expected-sha256 <64-char-hash>` with the value recorded in [the fixture catalog](../tests/fixtures/owner-photo-fixtures.json).

### All three private owner inputs

Put the three original files in a local folder with their exact names, then:

```sh
node scripts/owner-photo-batch.js \
  --sources /private/photos \
  --out /private/review-zips \
  --dpi 300
```

The batch checks **all three original SHA-256 fingerprints first**, then writes three distinct ZIPs. It fails on a changed original, missing file, unsupported geometry or existing output. Use a new output directory on each pass; neither the images nor their generated packages belong in public Git or Pages assets.

The same engine also supports [two-ink](../examples/recipes/spot-photo.json) and [four-color CMYK](../examples/recipes/cmyk-photo.json) recipes. The A/B/C fixture recipes are **experimental starting points**, not automatically tuned Stiprā Styles (#34).

## Inside the ZIP

```text
source/original.jpg                exact original bytes (extension depends on input)
source/normalized.png             normalized oriented pixels
proof/composite.png              approximate digital overprint
proof/paper.png                  paper-only image; never a physical ink
plates/ink-01-<id>.png           unscreened grayscale, source frame
screened/ink-01-<id>.png         zero-shift screened grayscale master
plates/marked-01-<id>.png        optional derivative with registration marks outside trim
report/separation-sheet.html     readable responsive reference sheet
report/separation-sheet.pdf      A4; portrait for tall sources, landscape otherwise
recipe/inks.json                normalized spot or CMYK separation
recipe/screens.json             nominally aligned production-screening recipe
recipe/proof-screens.json       optional simulated offsets in proof only
manifest.json                   physical print intent, original hash, per-file hashes
```

Repeat the per-ink paths for each real physical pass; the ZIP always includes a **separate** raster plate for every ink, and no “paper plate.” All source-frame plates share the exact native pixel width, height, origin and trim. An exported plate value **white means zero coverage**, **black means full ink**. A colored or paper image is only a preview.

### Size, marks and physical honesty

- `--dpi 300` (accepted 72–1200): declares the print scale; `trimMm` is derived from the **unchanged native pixel grid**. The exporter embeds corresponding PNG `pHYs` pixels-per-metre metadata so print software can interpret the scale. It **does not upscale**.
- `--marks-mm 5` adds extra white margin around the print rectangle and crosshair registration marks **outside the trim**, in *separately named marked masters*. The default `0` omits those derivatives. Unmarked masters always remain the source size.
- `recipe/screens.json` forces **zero production registration shift** for all plates. `recipe/proof-screens.json` retains artist-specified simulated offsets for the composite only. This prevents decorative registration defects being silently baked into print masters.
- The PDF switches A4 orientation with the artwork (portrait photographs no longer sit in wide empty landscape slots). It uses flat IBM Plex typography, subtle procedural paper texture and QR linking to public CLI guidance. The PDF also embeds exact normalized ink/screen/proof JSON as downloadable PDF attachments. Its visible settings include screen angle/pitch, seed, per-ink coverage and source fingerprint. The paper stock is selected deterministically from sampled source colors, or override with `--paper recipe|rag|chalk|linen|clay`.
- The A4 PDF/HTML is an **inspection sheet**, not a stencil master or native-size paper sheet. The images inside report cards are intentionally fitted for comparison. Their source geometry/aspect ratio must remain unchanged and actual native dimensions are labeled.
- Screen pitch is currently specified **in pixels**. A recipe at a different physical DPI changes effective LPI; that is **not** a calibrated halftone screen. There is no ICC conversion, measured dot gain, paper/press characterization, trapping or hardware print verification.
- The source's embedded ICC/probe metadata and assumptions remain in the manifest, but original JPEG ICC profiles are **not** necessarily color-managed into a measured physical spot-ink simulation. Keep originals.

### Quality and verification

```sh
npm test
node --test tests/print-package.test.js
```

Node CI covers source-file byte identity, ZIP file SHA-256, full-frame ink alignment, embedded output DPI, optional marks outside trim, distinct physical masks, print-page MediaBox, three-ink support, portrait scaling, optional proof-only registration and fail-closed overwrite behavior. Existing real browser import and separation smoke tests continue to run.

**The owner's three photographs require private visual and physical QA:** sculpture ridges and cavities; forest stumps, antlers, distant installation and density; beach horizon, smooth gradient and two seated figures. A synthetic CI pass does not certify that those tests passed. Review [A/B/C acceptance matrix](PRINT-PACKAGE-ACCEPTANCE.md) and record `PASS / FAIL / NOT RUN` for each.

For large files, rendering can consume substantial time and memory: decoded source RGBA, independent per-ink coverage buffers, and encoded PNG/PDF assets coexist in memory. Batch jobs run sequentially; production stream-based export and size benchmarking are future work.

## Libraries and reuse

This feature uses the **same** Stiprā separation/screening modules as the browser preview. For packaging and PDF structure it reuses [JSZip](https://stuk.github.io/jszip/) under its **MIT alternative** and [pdf-lib](https://pdf-lib.js.org/) under MIT, not another custom ZIP/PDF codec or any p5.riso source. See [project licensing notes](LICENSING.md) and [architecture](ARCHITECTURE.md).

**Decision:** pass the three owner-image digital validation gates and real printer checks before describing Stiprā output as “press ready.”
