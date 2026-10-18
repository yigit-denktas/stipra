# Skia Canvas 3.0.8 versus 4.0.0: isolated experiment

18 October 2026. **Keep the production backend unchanged.** The tested masks, imported pixels and proof/master pixels match exactly, but v4 changes Canvas text metrics, missing-face bold synthesis and the speckled paper texture. Those differences trigger the agreed review gate. They are not evidence that v4 is unusable or that the existing PDF text layout is broken.

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

The Canvas metric changes agree with [v4's documented metric corrections](https://skia-canvas.org/releases). Explicit alphabetic placement and the real static font faces preserve the tested text pixels, while the reported bounding boxes and em heights change. Code using those measurements needs review before an upgrade. Stipra's PDF text uses Fontkit/pdf-lib; its extracted text positions and embedded faces remain identical in this experiment.

The missing-face control intentionally registers only Regular, then requests Bold. It changes under v4's default `fontSynthesis=true`, as documented upstream. This control must not be mistaken for a failure to load the genuine Bold font used elsewhere.

Flat and fibre-only paper match. Speckled paper changes at small antialiased dots: the 1684×1191 landscape background has 7,018 changed pixels, at most 2/255 per channel, with no alpha change. The portrait background has 6,974 changed pixels with the same maximum. The fixed-paper control isolates this difference: all report-page pixels then match, including source/proof/plates, typography and QR. No baseline or tolerance was relaxed to make that result pass.

Raw PDF hashes are not acceptance criteria. Embedded `report-layout.json` image hashes change with PNG encoding, even when geometry and image pixels agree; ink, screen, replay and diagnostic recipe contents agree.

## Bounded resource observations

Three fresh-process trials per version alternated order, with five warmup and 60 measured exports of a 1024×768 canvas. Median cycle times, including explicit GC, were 27.04 ms for v3 and 10.89 ms for v4. The median first PNG encode was 28.21 ms versus 10.43 ms. These are observations of this CPU workload, not a general speed claim.

RSS grew 0–0.125 MiB across the recorded v3 loops and 2.875–6 MiB in v4. This short run cannot distinguish bounded cache growth from a leak. It does not establish long-run memory stability, parallel-export behavior, large-photo behavior or GPU parity.

The verified Linux native binaries remain 30,457,832 bytes (v3) and 37,769,600 bytes (v4). Registry-contained delivery with scripts disabled works for v4 in the isolated preparation. Neither binary's complete compiled-component notice inventory is established by this experiment.

## Decision and reproduction

The recorded verdict is **stop-and-review**, with 19 case-level stops covering Canvas metrics, the missing-face control, speckled paper and default report pixels. Several stops describe the same underlying change; this is not a count of independent bugs. The image/mask/proof compatibility evidence is favorable. Adoption still needs an explicit decision about the typography defaults/metrics and whether to retain or intentionally version the changed texture.

A fresh preparation and complete replay on the same host reproduced all decode/mask/font/paper worker records and the same promotion stops. This is a reproducibility check, not independent platform validation. The input/native identity guard also rejects an intentionally altered fixture.

No application dependency, package version, public npm artifact, release gate, owner photograph or production golden changed. The native notice finding remains open in #14. Independent artist, accessibility and physical-print acceptance remain separate.

[Harness and commands](../scripts/experiments/skia-compare/README.md) · [Measured comparison](evidence/skia-v4-comparison-2026-10-18.json) · [Environment](evidence/skia-v4-environment-2026-10-18.json) · [Earlier decision review](RENDER-BACKEND-REVIEW.md).
