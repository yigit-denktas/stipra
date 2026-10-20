# #125 — Legacy owner-photo batch recipe review

**Status:** candidate branch for Linux review. No merge, issue closure, acceptance pass, production default change, report-layout change or Experiment 2. Owner photos and image-bearing outputs remain private.

**Branch:** `fix/125-owner-photo-recipes`  
**Base:** `e0aeac82cf84a095da628216df8051641b0b08b3` (`origin/main` when started; baseline recipe content matches #125's `f59c8d9`)  
**Scope:** six `examples/recipes/owner-*.json` files, one focused test file and this handoff. The runner was not changed because the existing three fixture names and recipe selection still apply.

## Source identity

All three originals were available privately and their bytes matched `tests/fixtures/owner-photo-fixtures.json`:

| Fixture | SHA-256 | Bytes | Pixels | Native print at 300 DPI |
|---|---|---|---|---|
| A | `0d3eeb51fc22aca97dadbf5bc1cad506418376f788c6b6c8a295558908c037cd` | 33,492 | 805 × 644 | 68.1567 × 54.5253 mm |
| B | `e46a4c774794d4c111df7021427492d37d51987a30b9f60e874c307a951ca55f` | 880,248 | 2048 × 1365 | 173.3973 × 115.57 mm |
| C | `f8a9b2f7eaaa18d62f4908456f8e8a47c84e0edb5c0172e57dabfd166dd3f273` | 898,480 | 1152 × 2048 | 97.536 × 173.3973 mm |

C was taken from the private 19 October tonal-detail archive; the similarly named file on the desktop was a different byte stream and was not used. Nothing from any source was committed.

## Why the legacy batch differs

The legacy recipes use **linear-light `darkness`** and raw channel sources with dense hybrid/dot screens. They therefore build a broad, high-coverage key before the chromatic passes:

- **A:** `darkness` slate at 50 LPI covers **88.1662%** screened / **73.4773%** continuous; the dot grid competes with the concentric ridges and recess shading.
- **B:** `darkness` hybrid key plus green/red dot passes produce additive coverage **1.1449**, with **26.7742%** two-plus overlap and **3.5332%** three-plus overlap; forest depth, the distant display and antler/trunk silhouettes become one texture.
- **C:** channel-blue solid sky plus a `darkness` hybrid key produce **27.2698%** overlap; the two figures and horizon lose local separation.

The approved opt-in treatments solve a different problem with **gamma-encoded `tone` keys** and much smaller chromatic passes: `forest-balanced` uses a unit-gain solid green key plus a yellow-density accent; `coast-tonal` uses a unit-gain solid blue key plus a low-gain yellow-density warm pass. Those treatments remain separate style variants. This branch translates their controls into the owner batch recipes rather than claiming they are the same feature.

## Candidate recipes

Substrate fields and the runner's default `--paper auto` behaviour are unchanged. No new algorithm or new source type was introduced.

| Fixture | Key candidates | Other passes | Screens |
|---|---|---|---|
| A | `slate`, `tone`, gain .8, gamma 1.1 | `ivory`, `luminance`, gain .4 | both **solid**; removes the 50 LPI dot grid from the key |
| B | `key`, `tone`, gain 1, gamma 1.3 (forest-balanced values) | `accent`, `yellow-density`, grayRemoval 1, gain .65, gamma 1.05; `earth`, `match` target #a3a3a3, tolerance .14, threshold .3, gain .5, gamma 1.4 (existing material-match control) | key solid; accent 50 LPI at −15°; earth 37.5 LPI at 65° |
| C | `blue`, `tone`, gain 1, gamma .9 (coast-tonal values) | `warm`, `yellow-density`, grayRemoval .65, gain .65, gamma 1.2 | blue solid; warm 50 LPI at 75° |

B remains **three inks**; the three-ink requirement was not changed. Earth was refined from the raw-red pass to the existing selective material-color `match` control, because the raw pass added coarse dots across the distant display and grass. A two-ink `forest-balanced` comparison was generated privately but is not the selected compliant candidate.

The shared `forest-balanced` / `coast-tonal` style variants in `src/styles.js` and their bytes were not changed. The owner-batch JSON recipes are a separate contract; #125's distinction between the two remains intact.

### Recipe identities

Baseline (`f59c8d9` content) → candidate:

| Recipe | Baseline SHA-256 | Candidate SHA-256 |
|---|---|---|
| A inks | `7367ef55ca1531313b4089fb14bd9122254eb32c23e60a07c8ff37cdde692b2e` | `d8900b9bc4bb632bc490e165bb091b28d6ef827e8a685fe494b244ca0448107b` |
| A screens | `12c49047d13c33beb8d71704557492de72bb6ec3a4ef3852ecae5b757d9d1cea` | `c30c53c327edb1a3209c0db6732a7a81d571dea7d6e3c432ff50d6c8b0163265` |
| B inks | `4394316e7c431c12d415d8457841eb1104b162a985f0143a13a7188debcf396a` | `6af3025c2a8657da5668ec136c5ee21932e526ad0e6568c4db2a5adad147863e` |
| B screens | `771ddc7e7dc4705af15d3376e36e636bd087b97e49e0f8123f5a2bd459c3981f` | `1423a7563be1430f6ed9ea2fc82d0566e0426328b6854af1fc79ed66e1e5e748` |
| C inks | `58203fa99d989e01961c250dcf82bedafb188790980d837c3b0a8aedcf505546` | `7b47acee29b6969d31b13becbc6495ca7625e18267c6d943abf85b6a5383546f` |
| C screens | `79a99f07ebda81ad4ca24f5731f0672f6b34b8dbefb2021f78f549e8725df008` | `367a95a81bb4165f0f3bffd2afad20331e0660ae7e1d58f36e7d1e0e67f970e6` |

## Private comparison

Baseline packages were generated from the unmodified `f59c8d9` recipes before editing. Candidate packages were generated through `scripts/owner-photo-batch.js` with the verified private sources at 300 DPI, zero marks, into fresh private directories. ZIP SHA-256:

| Fixture | Baseline ZIP | Candidate ZIP |
|---|---|---|
| A | `f5212d08ecd15b92379a86f2ece8086050559c7f4bf41d69f3fe8ad9c76e1baf` | `7db11848b0d6d77961429a7451e615943fc80dd90bbddb044947a42d59194fa3` |
| B | `7b68961ec3b49fd432a931346fe0ae7e73542f6c0d5a861402b5abff8fd1b343` | `dbaebbffeb0e385b5b660e8563b03bc970435b970ff902f742f25764e5aeb9cb` |
| C | `911643734c9775530d4c30761604eadf0dbfeaa9db573b6ee0372988a8420552` | `eea341cd9e64c82731b654ed571f6968571896bfd38c68535e46d80432ec1bd4` |

Coverage is nominal raster coverage, not press calibration. The table above uses the package's screened/diagnostic coverage; ROI material coverage below distinguishes continuous (`plates/`) from screened (`screened/`) coverage. Every metric comes from the private candidate package plus native-pixel crops; coverage alone was not used as proof of quality.

| Fixture | Legacy screened diagnostics | Candidate screened diagnostics | Legacy additive / 2+ overlap | Candidate additive / 2+ overlap |
|---|---|---|---|---|
| A | slate 88.1662%, ivory 11.6485% | slate 64.8018%, ivory 5.1742% | .9983 / 8.2155% | .6998 / 0% |
| B | shadow 63.877%, fern 36.0988%, earth 14.5183% | key 51.3896%, accent 16.6903%, earth 1.1835% | 1.1449 / 26.7742% | .6926 / 11.9750% |
| C | sky 39.3343%, key 34.229% | blue 38.088%, warm 6.9334% | .7356 / 27.2698% | .4502 / 5.8653% |

### Reproducible metrics

The measurement helper is [scripts/owner-recipe-review.js](../scripts/owner-recipe-review.js). It reads already-generated baseline/candidate ZIPs and writes numeric JSON only; it never writes or publishes owner images.

```sh
node scripts/owner-recipe-review.js \
  --baseline "$STIPRA_125_PRIVATE/baseline" \
  --candidate "$STIPRA_125_PRIVATE/candidate-selective" \
  --out "$STIPRA_125_PRIVATE/metrics.json"
```

Definitions in the generated JSON and code:

- **gray:** encoded-sRGB luma `.2126 R + .7152 G + .0722 B` (8-bit channels; alpha ignored).
- **tone:** `1 - gray/255`.
- **gradient:** `mean((I[y+1,x]-I[y,x])^2) + mean((I[y,x+1]-I[y,x])^2)` in tone units.
- **raw correlation:** Pearson r between source tone and proof tone inside the native-pixel ROI.
- **low-pass correlation:** the same r after a 3-pixel-radius separable Gaussian (`sigma=1`) applied to RGB before gray conversion. This limits the raw metric's reward for halftone texture.
- **continuous coverage:** `mean(1 - plateGray/255)` over the ROI using `plates/`.
- **screened coverage:** the same formula using `screened/`.
- **ROI coordinates:** `[x, y, width, height]` in native source pixels.

The helper's tone/gradient fields use the corrected declared units; raw and low-pass Pearson correlations are unchanged by that correction.

| ROI | Native coordinates | Raw legacy → candidate | Low-pass legacy → candidate |
|---|---|---|---|
| A sculpture ridges | (250, 150) 300 × 300 | .5254 → .9957 | .7818 → .9960 |
| B distant display | (650, 220) 600 × 430 | .1044 → .9013 | .2241 → .9580 |
| C seated figures | (470, 1250) 240 × 200 | .0437 → .6757 | .2112 → .8590 |

Selective Earth coverage in the declared ROIs (from the generated JSON; continuous / screened):

| ROI | Native coordinates | Earth continuous | Earth screened |
|---|---|---|---|
| B display | (650, 220) 600 × 430 | 2.085% | 2.462% |
| B near trunks | (1000, 650) 700 × 600 | 3.079% | 3.338% |
| B tall trunk | (1500, 250) 400 × 950 | 3.124% | 3.432% |

The earlier `0.16%` display figure came from a different, unpublished rectangle and is superseded by these declared ROIs. The full-frame screened Earth coverage is `1.1835%` in the package diagnostics (independently reported as `1.18418%`).

The source/proof means, standard deviations and gradient values are in the generated JSON. These numbers are evidence of local alignment/separation improvement, not an acceptance decision.

Private visual checks at 100% native crops:

- **A:** ridges and recess are continuous and legible; the legacy halftone grid is gone. The key is now an unscreened continuous-tone pass, so print-process screening remains an open decision.
- **B:** near grass/trunks, mid path and far foliage separate; the distant display is readable; antler/trunk silhouettes are retained. The selective Earth pass is concentrated on neutral material: **2.085% continuous / 2.462% screened** in the declared display ROI, **3.079% / 3.338%** in the near-trunk ROI and **1.1835% screened** full-frame. It is not a raw-red screen over the whole scene; the two-ink comparison remains visually cleaner but would change the required ink count.
- **C:** both seated figures are visible against the water, the horizon is continuous, and water/beach tone remains ordered. The warm pass is deliberately small (7.88% in the figure crop, 3.12% at the horizon).

The two-ink `forest-balanced` comparison remains visually cleaner on B but has only two inks and is **not** a compliant owner-B candidate. It is recorded only as an alternative; no acceptance requirement was changed.

## Repeatability and geometry

- Candidate ZIPs generated twice from the same source, recipes and seed were **byte-identical** for A, B and C; all entry bytes matched.
- Source originals inside every candidate ZIP are byte-identical to the verified private inputs.
- Every candidate `plates/` and `screened/` PNG has the exact source pixel dimensions; candidate `trimMm`, origin and `resampled:false` match baseline.
- No image was resampled or cropped independently.

## Tests

```sh
node --test tests/owner-recipes.test.js tests/owner-recipe-metrics.test.js
node --test tests/print-package.test.js tests/report-layout.test.js
node scripts/owner-recipe-review.js --baseline "$STIPRA_125_PRIVATE/baseline" --candidate "$STIPRA_125_PRIVATE/candidate-selective" --out "$STIPRA_125_PRIVATE/metrics.json"
```

Focused result: **8/8 owner-recipe/metric tests pass**, including the runner fingerprint-rejection, declared-unit and coverage tests. Package/report result: **16/16 pass**; combined **24/24 pass**. The metric helper writes numbers only and never writes or publishes owner imagery. No Linux full-suite result is claimed here; the branch is for Linux review.

## Private artifacts

Private only, outside the repository under a private root such as `$STIPRA_125_PRIVATE`:

- `$STIPRA_125_PRIVATE/baseline/` — frozen legacy ZIPs
- `$STIPRA_125_PRIVATE/candidate-selective/` — current candidate ZIPs and report pages
- `$STIPRA_125_PRIVATE/candidate-selective-repeat/` — byte-identical repeatability run
- `$STIPRA_125_PRIVATE/baseline-recipes/` — frozen recipe copies
- `$STIPRA_125_PRIVATE/final-views/` and `$STIPRA_125_PRIVATE/crops2/` — source/legacy/candidate native crops
- `$STIPRA_125_PRIVATE/metrics.json` — reproducible ROI/raw/low-pass plus continuous/screened coverage record; `final-summary.json` retains the earlier source/geometry record

Reproduction form (private sources and targets; never commit their contents):

```sh
node scripts/owner-photo-batch.js \
  --sources "$STIPRA_125_PRIVATE/sources" \
  --out "$STIPRA_125_PRIVATE/candidate-selective" \
  --dpi 300 --marks-mm 0
```

Agent visual review: DeepSeek Harness local coding agent, 20 October 2026. This is private agent review evidence only, not a human/owner review, physical print result or package-pass claim.

## Unresolved findings / handoff

- **A:** the solid continuous-tone key is a deliberate screen-semantics change; owner/print process must decide whether an unscreened key is acceptable for the intended production path.
- **B:** the selective Earth pass is deliberately sparse (1.1835% screened full-frame; 2.462% screened display; 3.338% screened near-trunk); it now supplies localized material information instead of broad texture, but named human review of the display/silhouette crops is still required. The two-ink alternative must not silently replace the three-ink acceptance scope.
- **C:** figures are materially improved in local crops but are still tiny; the intended A4/native inspection review is still required. The prior scoped coast-tonal approval is not retracted or expanded.
- **All:** no G01–G11, A/B/C image-specific criteria or physical-pass claim is made. #123 remains **PARTIAL EXECUTION / 0 of 3 accepted**; this branch does not close #123, #125 or #13/#14/#70/#109.
- **#124:** report layout, orientation and substrate parity remain owned by ChatGPT Work. This branch does not edit report-layout code, acceptance specifications, README, ROADMAP, changelog or the delivery ledger; the G07/G08 discrepancies recorded in #124 remain open and are not inferred to pass here.
