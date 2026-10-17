# Stiprā print package · CLI v1

**Status:** a real Node CLI implementation of aligned **raster** ink masters, an orientation-aware A4 HTML/PDF inspection sheet and a single ZIP with provenance. Physical press calibration and owner image *visual approval* remain open. [See the three-image release gate](PRINT-PACKAGE-ACCEPTANCE.md).

## Named Styles as starting recipes

The same Stiprā style resolver works in browser and Node. For a bundled candidate, use `node bin/stipra.js package --input artwork.png --style editorial-halftone --dpi 300 --out artwork.zip`. This stores the **resolved** style and normalized ink/screen recipes in the ZIP. Use `--config` and `--screen` instead if you need exact hand-authored masks and screen settings; the CLI intentionally rejects mixing `--style` with a separate `--screen`. Four styles are [documented here](STYLES-v1.md). They are **not** printer-certified presets.

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

### Plate diagnostics and editorial review

The package includes [`report/diagnostics.json`](PLATE-DIAGNOSTICS-v1.md), containing mean ink contribution, per-pair overlap, heavily combined nominal coverage, and the **effective LPI of each screened ink at the chosen output DPI**. The same read-only math powers a small browser report. Advisory warnings flag low contribution and dense/overlapping passes: **not** validated machine safety limits or a substitute for viewing real output.

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


## Report typography and pagination

The canonical report uses IBM Plex Sans Bold for the provisional wordmark and headings, Plex Sans Regular for prose and labels, and Plex Mono Regular for measurements. Technical PDF text is at least 9pt. Latin Extended glyphs, including `ā`, are merged from the authentic font subsets; no font substitution or fabricated lettering is used. This report choice does not approve a final brand identity.

PDFs separate the source/proof/plates from recipe and provenance pages. Additional plates and long settings continue onto further pages instead of shrinking type. All 2–8 physical ink passes are retained. Paper is described as the substrate, not another physical pass. Inspection thumbnails preserve aspect ratio and are explicitly distinguished from full-resolution production masters.

Every page links its QR to the public reproduction guide. The complete source SHA-256, normalized recipe attachments, actual DPI, master dimensions and effective LPI are retained. Solid passes state **screen off**. Available coverage/overlap warnings from `src/plate-diagnostics.js` appear in both report formats; these are editorial diagnostics, not press safety limits. The PDF also embeds `report-layout.json`, an audit of text sizes, coordinates and image rectangles.

To regenerate private production reports from the frozen #55 comparison recipes:

```sh
node scripts/review-owner-reports.js \
  --sources /private/originals \
  --recipes /private/prior-comparison-output \
  --out /private/new-report-review
```

This refuses source or output locations inside the repository and checks all three original photo hashes before rendering. It uses the canonical Node importer and print-package engine, not the separate Python comparison renderer. Import/ICC differences remain tracked in #44; this report change does not claim to resolve them. These are A4 production inspection reports, separate from the square/landscape/portrait typography study in #55.

## Ink-linked report annotations and simulated stocks

Report annotation text and rules use the darkest readable ink from the actual resolved separation. Where all chosen inks are too pale, a contrasting neutral key keeps technical labels readable. Colored bars, rectangular frames, stock labels and small sheet guides are presentation annotations; the wordmark stays lowercase `stiprā`. Sheet guides are not production registration marks.

The background combines seeded micrograin, short fibres and sparse colored speckles drawn from the selected ink palette. The PDF texture raster uses **144 pixels per physical inch** for consistent dot/fibre scale across A4 orientations. This is a procedural material simulation, not a scanned stock or a calibrated press prediction. No extra graphics library is used beyond the existing Canvas renderer.

Paper options are `rag` (Warm Rag), `chalk` (Cool Chalk), `linen` (Natural Linen), `clay` (Soft Clay), `rose` (Rose Pulp), `sage` (Sage Stock), and `mist` (Blue Mist). The additional paper colors are supporting materials, not changes to the four Stiprā brand swatches. Automatic paper selection keeps its existing decisions; the new stocks are explicit choices.

```sh
node bin/stipra.js package --input artwork.jpg \
  --config inks.json --screen screens.json \
  --paper rose --report-texture speckled --out private-print.zip
```

`--report-texture` accepts `speckled` (default), `fibre`, or `none`. It changes only report presentation. Source bytes, normalized separation/screen recipes, proof pixels and physical ink plates are unaffected by the texture setting. By contrast, choosing a different `--paper` intentionally changes the simulated substrate color and records it in the ink recipe.

Generate a photo-free stock preview with `node scripts/review-paper-stocks.js /private/new-paper-stocks.png`. Private owner-photo PDF review still uses `scripts/review-owner-reports.js`. Do not commit the reference screenshot, owner photographs or image-bearing PDFs.

### Branded QR codes and public instructions

The canonical report QR opens the [public reproduction guide](https://apps.yigitdenktas.com/stipra/guide/), not a private job or raw Markdown file. It uses the actual lowercase `stiprā` wordmark, shaped from the report wordmark font, with a coral macron. The original SVG palette is checked before rendering.

`--qr-style brand-dots` is the default; `brand-square` and `ink-dots` are explicit alternatives. The last uses the report's readable theme ink, falling back to original green for pale colors. The QR has high error correction, a four-module clear margin and a clean white field, printed at 25.4 mm square. It is presentation only and never changes production masks. Named colors remain screen approximations.

`node scripts/review-qr.js /private/new-qr-review` creates a photo-free PDF/SVG/PNG comparison at 20, 25.4 and 32 mm. Install `zxing-cpp==2.3.0` and Pillow, plus Poppler's `pdftoppm`, then run `python scripts/verify-qr.py /private/new-qr-review`. It decodes actual PDF boxes at 150/300/600 DPI in color and grayscale. Passing these digital tests does not replace a phone scan of a physical print.
