# Skia Canvas 3.0.8 versus 4.0.0: isolated experiment

18 October 2026. **Keep the production backend unchanged.** The tested masks, imported pixels and proof/master pixels match exactly. The product-facing migration deltas are the speckled paper texture and encoded PNG identities. Canvas metric/synthesis changes are backend probes with no production call sites in the pinned source; they do not establish a product typography regression. The conservative experimental stop verdict is retained.

## Measured scope

Frozen Stipra source: `24f731fb93a0aaee0f049a7ca0bb59f7215bcfb2`. Linux x64 glibc, Node 24.19.0, npm 11.9.0, CPU fallback on both backends. Separate prefixes and fresh processes load exactly one verified addon. Backend versions and all npm integrities, native SHA-256 values, source lock identity, seven real font identities and 37 frozen inputs are recorded in [pins.json](../scripts/experiments/skia-compare/pins.json).

| Check | Result |
| --- | --- |
| File import | 23 accepted synthetic inputs have identical RGBA and metadata; 10 expected rejections agree |
| Color/orientation references | Both ICC cases match the LittleCMS reference at every sampled point; all eight EXIF transforms apply exactly once |
| JavaScript masks/recipes | 12 style/shape cases plus one authored-layer case match exactly |
| Raster proofs and plates | All 60 cases match decoded RGBA; 36 PNG encodings differ while their pixels match |
| Physical masters | Both versions pass 24 plate cases each: dimensions, grayscale polarity, zero origin and exactly one 300-DPI pHYs chunk |
| Real text faces | Six registered faces/weights render identically, with and without explicit synthesis disabling; genuine lowercase `stiprā` shaping is retained |
| Canvas text measurements | All 14 text controls return changed metrics, including outline bounds and em metrics |
| Missing Bold face | v4 synthesizes Bold by default; explicit `fontSynthesis=false` restores the v3 control's pixels |
| Branded QR | All 124 color/grayscale checks pass across raster specimens and PDF placements |
| Default reports | Page sizes, text placements, embedded font streams, print geometry and all 26 package image derivatives match; paper texture pixels differ |
| Fixed-paper reports | Both orientations render identically at 150 and 300 DPI when supplied the same frozen paper bitmap |
| Missing native payload | Both versions fail loudly; v4 identifies the missing platform package |

The file-import count includes the real ICC-reference fixtures, 16-bit SDR PNG, low-alpha PNG/WebP, restricted SVG fills and all eight EXIF orientations. Unsupported HDR/animation/unsafe SVG cases remain rejected. Physical page/plate measurements here are digital metadata and pixel checks, not measurements of a printed sheet.

## Differences that matter

The Canvas metric changes agree with [v4's documented metric corrections](https://skia-canvas.org/releases). Explicit alphabetic placement and the real static font faces preserve the tested text pixels, while the reported bounding boxes and em heights change. A source audit finds no native `measureText`, `fontSynthesis`, `FontLibrary` or `fillText` use in src, bin, web or package sources. Browser overlays and developer review scripts are separate. Stipra's PDF text uses Fontkit/pdf-lib; its extracted text positions and embedded faces remain identical. These controls describe backend behavior, not a current product migration blocker.

The missing-face control intentionally registers only Regular, then requests Bold. It changes under v4's default `fontSynthesis=true`, as documented upstream. This control must not be mistaken for a failure to load the genuine Bold font used elsewhere.

Flat and fibre-only paper match. Speckled paper changes at small antialiased dots: the 1684×1191 landscape background has 7,018 changed pixels, at most 2/255 per channel, with no alpha change. The portrait background has 6,974 changed pixels with the same maximum. The fixed-paper control isolates this difference: all report-page pixels then match, including source/proof/plates, typography and QR. No baseline or tolerance was relaxed to make that result pass.

Raw PDF hashes are not acceptance criteria. Embedded `report-layout.json` image hashes change with PNG encoding, even when geometry and image pixels agree; ink, screen, replay and diagnostic recipe contents agree.

## Bounded resource observations

Three fresh-process trials per version alternated order, with five warmup and 60 measured exports of a 1024×768 canvas. Median cycle times, including explicit GC, were 27.04 ms for v3 and 10.89 ms for v4. The median first PNG encode was 28.21 ms versus 10.43 ms. These are observations of this CPU workload, not a general speed claim.

RSS grew 0–0.125 MiB across the recorded v3 loops and 2.875–6 MiB in v4. This short run cannot distinguish bounded cache growth from a leak. It does not establish long-run memory stability, parallel-export behavior, large-photo behavior or GPU parity.

The verified Linux native binaries remain 30,457,832 bytes (v3) and 37,769,600 bytes (v4). Registry-contained delivery with scripts disabled works for v4 in the isolated preparation. Neither binary's complete compiled-component notice inventory is established by this experiment.

## Decision and reproduction

The recorded verdict is **stop-and-review**, with 19 case-level stops: 15 backend typography probes, two speckled-paper cases and two default report cases. Several stops describe the same underlying change. The image/mask/proof compatibility evidence is favorable. A future migration needs a paper texture decision, encoded-PNG identity updates and reviewed audit/version pins. Rebaseline evidence deliberately; do not bypass the existing version guards. Build pages before running all tests so type-proof tests execute. No upgrade is needed merely because the behavior comparison passed.

A fresh preparation and complete replay on the same host reproduced all decode/mask/font/paper worker records and the same promotion stops. This is a reproducibility check, not independent platform validation. The input/native identity guard also rejects an intentionally altered fixture.

No application dependency, package version, public npm artifact, release gate, owner photograph or production golden changed. The native notice finding remains open in #14. Independent artist, accessibility and physical-print acceptance remain separate.

[Harness and commands](../scripts/experiments/skia-compare/README.md) · [Measured comparison](evidence/skia-v4-comparison-2026-10-18.json) · [Environment](evidence/skia-v4-environment-2026-10-18.json) · [Earlier decision review](RENDER-BACKEND-REVIEW.md).

## Independent replay and analyzer correction

The owner supplied an independent AI-assisted review reporting a full replay on a different Linux x64 CPU host: Node/Python matched, while npm, Poppler, glibc and CPU count differed. Its supplied comparison reports 272 identical decode/mask/font/paper records, the same 19 stops and matching reference/PDF/QR verdicts. This strengthens the bounded Linux evidence; it is not Windows/macOS/GPU, artist or physical-print acceptance. The supplied replay failure records are not byte-identical, although the review reports the same failure behavior.

The review correctly identified a PDF-attachment blind spot. Results-v2 now blocks added/removed or semantically changed attachments. Only report-layout `pages[*].images[*].sha256` changes may pass, and only when both hashes come from actual paired PNG files with identical decoded pixels. Geometry, recipe, DPI and arbitrary hashes remain blocking. Package image pixels, physical output contracts, recorded-versus-actual image hashes and PDF link changes are also explicit checks. Other worker-record integrity remains subject to the documented experiment limits.

Five standard-library regression tests and four mutations of real PDF attachments pass. The mutations preserve page structure and drawing streams but are rejected by the corrected contract. Reanalysis of the captured evidence retains all 19 original stops, with compatible attachment contracts for all five PDF pairs. No native renderer or migration was rerun for this correction.

The original archive remains unchanged at SHA-256 `abbb25088c75bd9a638f154c94c9dbe33642cbc0f6af7735c4734031b6ec2b76`. Host paths in its diagnostic records are historical; the public comparison copy and future analyzer/failure outputs redact them. The original environment record was curated; future preparation automatically captures host and analysis-tool versions and leaves replay acceptance unset.

One supplied JSON source-lock hash differs from the LF pin. Local verification shows it equals the same file with CRLF endings: LF `3f1681a6…`, CRLF `bcbea8c2…`. This explains the byte-identity discrepancy without silently normalizing any pinned artifact. The separate narrow LF checkout task remains open.

[Review identities, bounded claims and mutation results](evidence/skia-v4-review-reconciliation-2026-10-18.json). The full supplied review files remain private and unchanged.
