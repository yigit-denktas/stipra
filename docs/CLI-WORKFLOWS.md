# Compare, batch, export and verify

The CLI uses the existing local import, shared Styles and print-package writer. It does not run plan-provided code, start p5 sketches, contact external services or choose an aesthetic winner. Image-bearing outputs remain private unless the source owner permits redistribution.

```sh
npm ci
node bin/stipra.js compare --input artwork.png --config examples/workflows/compare.json --out out/comparison --json
node bin/stipra.js batch --config jobs.json --out out/batch --json
node bin/stipra.js verify --input out/batch/poster.zip --json
node bin/stipra.js sheet --input out/batch/poster.zip --out out/sheet --json
```

Use a fresh output directory for compare, batch and sheet. Existing directories are refused, including empty ones. Package files use exclusive creation. Legacy scene/render commands permit an identical repeat without rewriting files, and refuse changed existing outputs. The source and recipe are never overwritten. Disk exhaustion or interruption may leave incomplete outputs; a package file alone is not evidence that a job completed. Check the final workflow manifest and verification result. There is no automatic resume or concurrent job execution.

## Plans

Plans are inert JSON, version 1, at most 64 KiB. Paths in a plan resolve relative to the plan file; compare's command-line input resolves relative to the shell working directory. Inputs must be local files, each within the existing 16 MiB / 24 megapixel import limits. The plan permits at most 64 MiB of distinct source bytes and 96 megapixels of aggregate job work.

A batch contains 1–16 jobs. Each job has a unique lowercase `id` of at most 48 letters/digits/underscores/hyphens, starting with a letter, and exactly one recipe file or named style:

```json
{
  "version": 1,
  "jobs": [
    {
      "id": "poster",
      "input": "artwork.png",
      "style": "editorial-halftone",
      "styleVariant": "tonal-key",
      "seed": 142,
      "dpi": 300,
      "paper": "rag",
      "marksMm": 2,
      "exports": {
        "formats": ["png", "jpg", "webp", "svg"],
        "scale": 2,
        "alpha": "source",
        "vectorPlates": true
      }
    }
  ]
}
```

A job may instead specify `config: "inks.json"` and optional `screen: "screens.json"`. Named styles accept optional `styleVariant`, `lpi` and `seed`; explicit screen files own their seed. Mixing those two configuration paths is rejected. Other job fields are `dpi` (72–1200), `marksMm` (0–15), `paper` and `exports`. Unknown fields, duplicate ids, invalid recipes and missing inputs fail preflight before output creation. A rendering/encoding/verification failure is recorded per job; subsequent jobs still run. Partial batches exit nonzero.

A comparison has 2–8 `variants`; each variant has an `id`, a recipe/style choice and its associated settings. Source, complete oriented frame, DPI, marks, paper stock and export settings are shared. Compare requires an explicit stock id, default `rag`; `auto` and `recipe` are rejected because they could choose different paper across variants. Supported stocks are rag, chalk, linen, clay, rose, sage and mist. See [the runnable comparison plan](../examples/workflows/compare.json). Ink assignments and screen settings may differ deliberately and are retained in each normalized package recipe. Use the same explicit seed when comparing parameter changes.

Each successful job creates its ZIP, lossless source/proof PNGs and verification JSON. `index.html` is an offline comparison with relative image/package links; it does not crop artwork. `workflow-manifest.json` records source/package/preview/recipe hashes, measured ink coverage, job results, Node/platform/codec versions, elapsed time and the process-wide peak RSS (not an isolated per-job memory measurement). `plan.json` preserves the submitted plan. ZIPs are bounded to 64 MiB compressed, 256 MiB inflated, 64 MiB per entry and 256 entries. Each package is self-contained; the workflow's saved plan still needs its originally referenced input/recipe files to run again.

## JSON and exit codes

`--json` produces one `stipra-cli-result-v1` envelope on stdout for presets, styles, render, scene, import, separate, package, compare, batch, verify and sheet. It contains `command`, `status` and either `result` or `error: {code,message}`. Existing command-specific result contracts stay inside the envelope. Without the flag, successful commands still print their JSON results; errors go to stderr.

- Exit 0: successful command.
- Exit 1: partial/failed job set, or an I/O error such as an existing/missing path.
- Exit 2: invalid request, unsupported input or another uncaught validation/processing error.

Do not treat an `ok` workflow status as press calibration. `verify` returns `VERIFIED_DIGITAL_NOT_PHYSICALLY_VALIDATED` after checking all file hashes, complete file set, source identity, native trim/DPI, opaque grayscale plates, measured coverage, unique master paths, matching ink assignments, zero production registration, unchanged marked trim pixels, A4 PDF geometry and declared derivative formats/dimensions. Older authored packages report coverage to six decimals; verification accepts that precision, while new packages record the exact byte-derived mean. It is an integrity/geometry check, not authentication or a fresh independent artistic assessment.

`sheet` verifies an existing print ZIP, then extracts its already embedded PDF/HTML report. It does not reflow artwork or render arbitrary source code.

## Export formats and physical dimensions

The existing PNG masters remain native-size, opaque grayscale, zero registration, with `pHYs` density. Registration marks are separate enlarged PNGs with an explicit trim origin. Bleed is explicitly zero; Stiprā does not invent additional artwork beyond the source. The complete marked sheet also must remain within 24 megapixels / 20,000 px per edge.

Optional package derivatives:

```sh
node bin/stipra.js package --input artwork.png --style editorial-halftone --dpi 300 \
  --formats png,jpg,webp,svg --scale 2 --alpha source --vector-plates true --out out/artwork.zip --json
```

| Output | Behavior |
| --- | --- |
| PNG proof | Lossless, source-alpha or opaque paper; explicit density |
| JPG proof | Lossy quality 0.92, source alpha flattened onto the selected paper |
| WebP proof | Lossy quality 0.92, source-alpha or opaque paper; encoder bytes may vary |
| SVG proof / optional screened SVG plates | Pure vector run paths representing sampled pixel values; no embedded bitmap |
| PDF / HTML | A4 inspection reports; compact recipe spacing avoids orphan diagnostics without shrinking text |
| ZIP | Source, recipes, diagnostics, native PNG masters, report, optional derivatives and hashes |

Proof scales 1, 2 and 3 use explicit nearest-neighbor pixel replication. Their effective DPI increases by the same factor, so the intended physical trim stays the same. This is not new image detail or a changed physical screen frequency. PNG records density and SVG records physical millimeters; JPEG/WebP density metadata is not guaranteed, so use the package's physical manifest. All derivatives have the same 24 megapixel / 20,000 px output budget. Optional derivatives do not change the canonical proof, masters or inspection report.

SVG paths preserve the sampled mask geometry, including its pixel steps. They do **not** recover original drawing paths, smooth curves, text, scene layers or analytic halftone circles. Native procedural `scene` SVGs retain their own analytic primitives; #28 remains a separate vector-screen extension. Raster parity is tested with an explicit pixel viewport; arbitrary SVG viewers/RIPs may resample physical-unit viewports differently. Vectorization is capped at 250,000 horizontal runs and 16 MiB of text; excessive complexity fails explicitly without silently embedding a bitmap. Choose PNG for complex photographic fields.

The Canvas adapter accepts the same optional derivatives through `exportSnapshot(rendered, loadExporter, {exports: {...}})`. Settings are frozen before the loader resolves. Authored ink layers have no single original source alpha, so use `alpha: "paper"`. The core import remains free of PDF/ZIP/fonts/native codecs. Browser and Node lossy encoder bytes are not promised to match.

## Reproduce the software evidence

```sh
npm run build:pages
npm test
npm run check:exports
npm run check:export-parity
npm run check:distribution
```

`check:exports` creates only original procedural artwork, exercises the actual compare/batch/verify/sheet CLI and produces 2/3/4-ink, square/portrait/landscape, 1/2/3-scale evidence in `out/export-workflow/`. `check:export-parity` requires Chrome/Chromium and the prior page/evidence builds. It verifies real browser packages against Node: lossless PNG pixels and SVG paths match; all JPG/WebP signatures, dimensions and declared lossiness are checked. CI uploads `cli-export-workflow-evidence`, including packages, reports and comparison screenshots. Fixed source/mask hashes are in `tests/fixtures/export-goldens.json`; changing them requires reviewing the underlying engine change.

#13 physical observations, #14 upstream provenance findings, #70 publication/artist acceptance and final identity choices remain separate gates. No release tag or registry publication follows from these tests.
