# Stiprā typography and private print specimens

This comparison is provisional. The owner has not approved a replacement logo or brand typeface. The original `logo_for_Readme.svg` remains byte-identical.

This is the original controlled, single-weight typography study, retained for reproducibility. The canonical print-package reports now use the separate editorial hierarchy and ink-linked paper treatment documented in `docs/PRINT-PACKAGE-v1.md` (#61 and #63). This study does not replace that report renderer. Its finalist recommendations are provisional historical observations; the later three-contender identity study (#59) also retains Paper Mono Regular and SemiBold for consideration.

## Designer's evaluation

The four-wordmark sheet compares **IBM Plex Sans Bold**, **IBM Plex Mono Bold**, **Paper Mono Regular**, and **Paper Mono ExtraBold**. Each reads `stiprā` with the actual U+0101 glyph. The large samples share a measured 66px x-height and baseline; native glyph advances are preserved, with no manual tracking or artificial bolding. The smaller samples use 24, 48 and 96px em sizes. Vector paths come directly from the verified font glyphs. These are visual comparisons, not a user study or physical press test.

**IBM Plex Sans Bold is the Plex finalist.** Its proportional spacing gives the short word a compact silhouette. The narrow i does not consume the same width as the p or a, so the middle reads as a continuous word. The open counters and separated macron remain clear at the smallest sample. Plex Mono Bold is readable, but its wide i and pronounced foot create a more segmented rhythm; it fits technical labels better than this wordmark.

**Paper Mono ExtraBold is the Paper finalist.** Its broad stems and slab-like details give the word an assertive, mechanical rhythm suited to the print specimen. At 24px it retains more presence than Regular while keeping the a counter and macron distinct. Regular has more air and would be useful for extended reading, but is visually too light beside the bold Plex candidate. ExtraBold needs a physical test for ink spread: its smaller counters have less tolerance than the Regular weight.

Both finalists are shown in full on the photograph sheets. All specimen text uses the selected face so the difference in density remains visible; image scale, drawing geometry, paper texture, ink assignments and recipes stay fixed between pages. Green with a coral final letter is the restrained wordmark treatment. Blue and golden yellow remain genuine brand tokens and appear in the relevant image separations; no requirement to apply all four colors to every word.

## Private generation

Keep originals and output outside the repository. The script refuses an output or source directory inside the repository, verifies all original fingerprints against `tests/fixtures/owner-photo-fixtures.json`, and uses the actual `src/separation.js` and `src/screening.js` engine. It does not require paid services or image generation.

```sh
npm install --no-audit --no-fund
python -m pip install -r scripts/type-comparison-requirements.txt
npm run prepare:paper-mono
python scripts/type-comparison.py \
  --sources /absolute/private/originals \
  --fonts .cache/stipra-paper-mono \
  --out /absolute/private/comparison
STIPRA_PRIVATE_OUTPUT=/absolute/private/comparison \
  python -m unittest discover -s tests -p type_comparison_test.py -v
```

The existing `skia-canvas` dependency rasterizes only the outlined comparison SVG into a preview PNG. Wordmarks in the SVG remain paths; the PDF uses embedded font subsets. No additional Node graphics dependency is required.

Upstream fonts are SIL OFL 1.1. Font binaries are cached privately, never committed or distributed separately. `scripts/type-comparison-fonts.json` records both upstream Git blob fingerprints and SHA-256. Every required font must pass the SHA-256 check before use.

- Paper Mono Regular and ExtraBold: `https://github.com/paper-design/paper-mono/tree/v1.000/fonts/ttf`, release v1.000.
- IBM Plex Sans Bold and Mono Bold: `https://github.com/IBM/plex/tree/master/packages`, complete TTFs.
- Additional Mono Bold URL: `https://raw.githubusercontent.com/IBM/plex/master/packages/plex-mono/fonts/complete/ttf/IBMPlexMono-Bold.ttf`.
- OFL notices: existing `LICENSES/OFL-1.1.txt`, `LICENSES/FONT_NOTICE.md`; Paper Mono's own OFL is at `https://github.com/paper-design/paper-mono/blob/v1.000/OFL.txt`.

## Output contract

Exactly three comparison PDFs, each containing two pages:

| File | Page size | Full source/proof size | Effective image DPI |
| --- | --- | --- | --- |
| `stipra-type-comparison-a-square.pdf` | 210 × 210 mm | 82 × 65.60 mm | 249.35 |
| `stipra-type-comparison-b-landscape.pdf` | 297 × 210 mm | 118 × 78.65 mm | 440.84 |
| `stipra-type-comparison-c-portrait.pdf` | 210 × 297 mm | 75 × 133.33 mm | 390.14 |

Each image retains all source pixels and its original aspect ratio. The effective DPI describes those pixels at the stated print size; the 72-DPI JPEG tag does not determine size. The sculpture remains rectangular on a square page. Plates are inspection thumbnails, not full-size press masters.

Each PDF embeds the exact normalized `recipe.json` and `brand-tokens.json`. Replay uses the command above with the authorized originals and pinned fonts. The recipe records native dimensions, input hash, ICC profile hash where present, normalized pixel hash, spot channels, gain, gamma, screen modes, angle, pixel pitch, zero registration, coverage, seed and paper. The QR and clickable link lead to the existing public print-package instructions, not to a private job or photo URL. The specimen-specific command and script are documented here.

The output directory also contains an SVG/PNG wordmark sheet, reusable tokens, normalized recipes, intermediate private images and a reproducibility manifest. Do not publish that directory or include it in Pages. Share only source code, tests, documentation and optionally the photo-free wordmark sheet. Publication rights for the photographs remain unconfirmed.

Paper stock is the existing warm-rag support color `#F5EEE2`, separate from the four brand colors. Procedural fibre is a **simulation** confined to the report background; it does not alter the plate pixels. Untagged RGB is assumed sRGB. The beach ICC profile is converted through LittleCMS to sRGB and its original fingerprint is recorded. RGB multiply is an uncalibrated preview of the selected spot inks, not a Risograph press prediction.

## Visual review and limitations

The source/proof pairs preserve the sculpture silhouette, the forest installation and its display, and the beach horizon. Continuous tone in the sculpture's green pass retains more ridge detail than a coarse dot screen; fine ridges still lose contrast. The forest's coral plate is intentionally sparse and darker foliage remains compressed. A blue black-hold preserves the beach's two figures; their small size warrants inspection before a large print. These image-fidelity limitations affect both font pages equally and are not evidence that print calibration passed.

Technical checks cover page count, page boxes, source fingerprints, original aspect ratios, image hashes and nontext PDF drawing operations across paired pages, font embedding and Unicode, normalized attachments, palette and public link targets. A second build must reproduce PDF and recipe hashes. All six pages require visual inspection after final changes. Owner aesthetic approval and physical press validation remain open.
