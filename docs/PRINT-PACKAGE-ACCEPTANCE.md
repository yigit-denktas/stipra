# First complete print package · owner-photo acceptance

**Specification status: NOT YET RUN.** A future execution owner is proposed as a #13 child: [owner-photo acceptance child proposal](PROPOSAL-OWNER-PHOTO-ACCEPTANCE-CHILD.md). This proposal creates no issue, result or acceptance pass. This document is an acceptance test for [#8 print masters](https://github.com/yigit-denktas/stipra/issues/8), [#9 A4 separation sheet](https://github.com/yigit-denktas/stipra/issues/9), [#12 export bundle](https://github.com/yigit-denktas/stipra/issues/12), and [#13 QA](https://github.com/yigit-denktas/stipra/issues/13). It is **not** evidence that any of those features or physical prints are complete. Test specification: [#39](https://github.com/yigit-denktas/stipra/issues/39).

The owner supplied three photographs as **private acceptance inputs**. This repository contains **metadata, sizes and SHA-256 fingerprints only**, in [owner-photo-fixtures.json](../tests/fixtures/owner-photo-fixtures.json). It does **not** contain the photos, because permission to test an image is not the same as permission to redistribute a photograph or depicted installation under MIT. Use images from the conversation or a locally approved, private fixture directory. Never fetch supposed replacements from the public web.

## Source images and print-scale truth

| ID | Photograph (local filename, not committed) | Native pixels | Maximum *native* print size at a declared 300 DPI | Main challenge |
| --- | --- | --- | --- | --- |
| A · **Sculpture folds** | `1680898969919.jpg` | **805 × 644** | **68.16 × 54.53 mm** | Fine concentric ridges, ivory highlights, black negative space |
| B · **Forest installation** | `SPK-Skulpturenpark-04.web_-2048x1365.jpg` | **2048 × 1365** | **173.40 × 115.57 mm** | Bark/foliage textures, antler silhouettes, distant rectangular artwork |
| C · **Beach horizon** | `IMG_9087.jpg` | **1152 × 2048** | **97.54 × 173.40 mm** | Smooth sky gradient, straight horizon, two tiny figures |

Print sizes above are computed from **width or height ÷ 300 × 25.4 mm** and rounded to 0.01 mm. They are hypothetical *output declarations*, not verified EXIF image resolutions or evidence of print quality. B has a 72 DPI JPEG resolution tag, which must be recorded but cannot silently override the chosen output DPI. C contains an embedded ICC profile; don't quietly discard it without recording the conversion/assumption. A and B have no embedded ICC profile; note an assumed working space (e.g. sRGB) rather than claiming a measured profile. The photographs are RGB JPEGs with no alpha.

**Important:** these three images are useful but do not cover typography, fine diagrams or transparent artwork. Keep a fourth *rights-cleared text/linework* fixture for [#13](https://github.com/yigit-denktas/stipra/issues/13). Do not declare the whole Stipra QA effort finished with these three alone.

## The common package contract (applies to A, B and C)

A finished print job must produce **one ZIP per image**, with manifest-verifiable contents. Filename conventions are illustrative but the relationships and data are mandatory:

```text
stipra-{fixture-id}-print.zip
├── source/original.jpg              original bytes unchanged
├── proof/composite.png              explicitly labeled digital approximation
├── proof/paper.png                  substrate-only visual; NOT an ink master
├── plates/ink-01-{id}.png           full-frame, unscreened grayscale
├── plates/ink-02-{id}.png           another distinct full-frame grayscale
├── plates/...                       optional third ink / CMYK
├── screened/ink-01-{id}.png         same canvas and origin after screening
├── screened/ink-02-{id}.png
├── report/separation-sheet.html     self-contained or declared local references
├── report/separation-sheet.pdf      A4 landscape inspection document
├── recipe/inks.json
├── recipe/screens.json
└── manifest.json                    provenance, hashes and exact print intent
```

A `source-normalized.png` may also be included, and an actual physically printable plate PDF may be separate from the **A4 inspection report**. When files are absent because a processing mode does not support them, the manifest must say so explicitly; a silent omission is a failure. **Never claim arbitrary raster photos have become true-vector SVG**: include SVG only for genuinely vector-supported components or clearly label a bitmap-containing SVG as hybrid.

### G · Automated gates — required for each image

- [ ] **G01 Input identity:** source SHA-256, byte length, orientation and native pixel dimensions match the metadata manifest. The ZIP's original is **byte-for-byte identical** to the local input.
- [ ] **G02 Exactly the intended inks:** A has 2 distinct spot ink masks, B has 3 distinct spot inks, C has 2 distinct spot inks. Paper is not counted as an ink. CMYK is a separate compatibility run, not mislabeled as one of these spot print packages.
- [ ] **G03 Full-frame alignment:** every unscreened and screened plate has the exact source pixel width/height, the same pixel origin, orientation, registered trim rectangle and aspect ratio. No independent per-card cropping, resizing or shifts of source content. Production-masters registration defaults to `0` and any deliberately shifted **proof** must not silently alter them.
- [ ] **G04 Grayscale polarity:** white = no ink, black = full ink, with predictable intermediate density. Verify both ends using synthesized known-pixel targets in addition to photographs; do not judge polarity by the appearance of a colored proof.
- [ ] **G05 Real separation:** the inks are separately stored coverage masks, not recolorings of the same plate. Report plate coverage/overlap; no plate is silently blank or identically equal to another plate. Differences in an overlapping region are allowed and expected.
- [ ] **G06 Physical scale:** manifest states output DPI, source/native pixels, trim size in mm, whether any resampling occurred and its method. At **300 DPI without upscaling**, the image rectangles must match the native print-size table above (±0.02 mm after rounding). Warn or block if an enlarged target claims 300 DPI without adding real pixel information. Never confuse a 297 × 210 mm *report* with an image master of that size.
- [ ] **G07 A4 inspection report:** PDF pages are **landscape A4 (297 × 210 mm, equivalently ~841.89 × 595.28 PDF pt)**, with page count responsive to ink count. It shows original, composite, paper/substrate, distinct per-ink grayscale plates, ink labels/swatches, scale, source attribution/provenance, screen angle/pitch/seed and an explicit **uncalibrated proof** notice. All image thumbnails share pixel coordinates and composition geometry even if panel sizes differ.
- [ ] **G08 HTML/PDF fidelity:** the HTML report and PDF present the **same plate identities/order, captions and inspection content**. No missing/cropped cards; text remains legible at actual A4 100%-scale printing, and report pages do not inadvertently scale production masters.
- [ ] **G09 ZIP integrity:** all referenced paths exist in the archive, no duplicate/absolute/`../` paths, and every asset has a SHA-256 in `manifest.json`. Archive opens without error. The recipes, source dimensions, pixel scale, paper and physical inks can be reconstructed without the browser. No network calls or paid API.
- [ ] **G10 Reproducibility:** same original bytes + same normalized recipes + same seed + same software versions produce pixel-identical masks and proof (compare decoded pixels/hashes). Sorted archive inventory and normalized manifests agree. Time-variant ZIP/PDF container metadata must be normalized or explicitly exempted and documented; do not claim byte-identical PDFs without testing.
- [ ] **G11 Failure behavior:** malformed input, unsupported output scale, invalid paths/unsafe SVG or missing fonts/assets fail with an actionable error and no corrupted partial ZIP. Never replace an accepted prior package without the user's authorization.

**Every check above is currently unchecked.** A QA report must record one of `PASS`, `FAIL`, `NOT RUN`, `NOT APPLICABLE`, with evidence paths, software SHA/version, test date and whether the work was automated, visually reviewed or physically printed. `NOT RUN` must never turn into `PASS` just because CI for existing masks is green.

## Image-specific review · the non-negotiable details

### A — Sculpture folds / ivory relief

**Suggested starting experiment (not a released style):** two actual spot plates, a warm midtone and a dark key. Low/no proof misregistration; compare unscreened continuous tone with fine dots. **Owner can change the inks**; success is not tied to a specific hue.

- [ ] **A1 Silhouette:** the entire folded sculpture is recognizable against the very dark background; no cut-off lobes, merged cavities or pale halo from filtering.
- [ ] **A2 Ridge continuity:** the closely spaced carved/concentric surface grooves remain visible and follow their original contour at native 100% view. Dot screening does not introduce dominant **moiré bands** that change the form.
- [ ] **A3 Tonal depth:** highlight crests, warm midtones and deep recesses are distinguishable. If the chosen palette deliberately compresses tones, document that decision rather than silently treating lost ridges as success.
- [ ] **A4 Dense background:** the mostly black background does not unintentionally saturate *both* inks edge-to-edge. A dense key ink is permissible, but accidental double overprinting and unnecessary coverage must be visible in diagnostics.
- [ ] **A5 Scale truth:** at 300 DPI the actual un-upscaled image rectangle is only **68.16 × 54.53 mm**. An A4-sized enlargement requires an explicit lower effective resolution warning or an acknowledged resampling method; never call it native 300 DPI.

**Human decision:** compare 100%-pixel crop of ridge detail and interior cavities plus a full-page 100%-size print preview. Reject if the form becomes visually flatter or screen interference overwhelms the original texture.

### B — Forest / stumps / antler installation

**Suggested starting experiment:** three intentional spot inks, e.g. dark green, light green and neutral shadow, with coverage partitioned to distinguish layers rather than a uniform green overlay. Alternative two-ink proof is useful as an additional comparison, but the acceptance package contains **three**.

- [ ] **B1 Scene structure:** near/mid/far depth stays legible. The distant rectangular image/display remains recognizable as a **separate rectangular object** in the forest.
- [ ] **B2 Fine silhouettes:** thin antler-like branches atop stumps, stump edges and the antler on the foreground log remain visibly separated from foliage/grass; no accidental cut-off points.
- [ ] **B3 Texture differentiation:** bark grooves, grass and leafy background don't merge into a single coarse/noisy screen. At least one meaningful tonal or frequency distinction remains among these regions.
- [ ] **B4 Overprint control:** broad foliage shadows do not become an unexplained solid dark block or cover the distant screen. Where multiple inks overlap heavily, show a measurable overlay/coverage map and label its print risk as advisory without fabricated shop limits.
- [ ] **B5 Scale truth:** at 300 DPI the original is **173.40 × 115.57 mm**. The source's 72 DPI JPEG metadata is not an instruction to enlarge it to ~72 DPI without warning.

**Human decision:** inspect a crop around antlers against the background, the distant rectangle, midground stumps and textured grass. Compare grayscale plate contributions individually before approving the composite.

### C — Beach / sky / sea / tiny figures

**Suggested starting experiment:** two spot inks, one blue/blue-green tonal plate and one restrained dark/detail plate. Fine or continuous tone for sky, stronger key near horizon and figures; don't claim the engine can semantically detect those objects without actual controls.

- [ ] **C1 Horizon:** the sea/sky boundary remains a visually **straight, uninterrupted horizontal line**; screening, crop and registration do not bend it or introduce a false stepped horizon at presentation scale.
- [ ] **C2 Sky:** broad smooth blue gradient has no unintended high-contrast bands, blocks or objectionable periodic screening stripes. Compare unscreened and screened previews at actual output size.
- [ ] **C3 Figures:** the two seated people remain visibly distinguishable from each other and from the beach/sea at native image size and at the chosen physical print size.
- [ ] **C4 Surface transitions:** sky, sea and pebbled beach remain three distinct visual fields with coherent tonal transitions; the intended light foreground does not accidentally fill with unnecessary solid ink.
- [ ] **C5 Color provenance and scale:** record the source's **embedded ICC profile**, any conversion policy, and what information is discarded. At native 300 DPI the vertical print rectangle is **97.54 × 173.40 mm**; the A4 landscape *report* must show a faithful portrait-oriented composition without distortion.

**Human decision:** view the full portrait, zoom into the tiny figures and horizon, and assess a representative smooth-sky crop for banding/moire. A beautiful broad gradient that destroys the people is a failure; so is a crisp horizon with ugly sky patterns.

## Pass/fail policy and evidence

A fixture is **package-pass** only if **G01–G11 are verified PASS** (or a narrowly justified NOT APPLICABLE), the **five image-specific criteria** are judged PASS by a named reviewer with saved 100% crops, and package source rights are confirmed for its intended distribution channel. The software can check many geometry/file/metadata properties; subjective print quality is a real human decision.

A fixture is **physical-pass** only after printing at a documented **100% scale** (not “fit to page”), checking alignment/trim, measuring a marked reference length if available, inspecting plate and overprint artifacts, and recording the printer, paper, inks, media settings, photos and actual observations. Physical printing is currently **NOT RUN**; no claim of a measured Risograph simulation follows from a successful office printer proof.

**Milestone completion:** all **three package-pass** results plus a single comparative evidence report, then separately a physical test record or an explicit statement that release is still digitally validated only. Defects must open linked issues; don't change the expected result just to make failing output appear acceptable. See [#13 QA](https://github.com/yigit-denktas/stipra/issues/13).

### Suggested evidence directory (generated locally; not committed automatically)

```text
local-evidence/owner-photos/
  A/{original,proof,plates,report,zip,qa.json,crops/}
  B/{original,proof,plates,report,zip,qa.json,crops/}
  C/{original,proof,plates,report,zip,qa.json,crops/}
  comparison.md
```

For reproducible inputs, compare each local file with the fingerprint in [the metadata manifest](../tests/fixtures/owner-photo-fixtures.json). Do not add owner's JPGs, third-party artworks or personal fixture paths to CI or public GitHub releases without explicit permission; test infrastructure can use **synthetic public-safe** fixtures. The workflow is deliberately local, suitable for agent runs and for manual owner review.

## Implementation ownership

- **[#8](https://github.com/yigit-denktas/stipra/issues/8):** G01–G06 (print master dimensions, zero-shift baseline, polarity and actual physical scale).
- **[#9](https://github.com/yigit-denktas/stipra/issues/9):** G07–G08 (A4 HTML/PDF with correct ink/plate narrative).
- **[#12](https://github.com/yigit-denktas/stipra/issues/12):** G09–G11 (ZIP contents, saved recipes/hashes, replay, fail-closed behavior).
- **[#13](https://github.com/yigit-denktas/stipra/issues/13):** A1–A5, B1–B5, C1–C5 visual/physical QA and evidence retention.
- **[#34](https://github.com/yigit-denktas/stipra/issues/34):** use good results to inform genuine Styles defaults **after** these inputs are evaluated; do not claim these style strategies exist yet.

**Progress:** 0 of 3 owner-photo packages has been verified against this new specification. This figure describes the acceptance exercise—not the repository's separate v0.9 issue backlog percentage.
