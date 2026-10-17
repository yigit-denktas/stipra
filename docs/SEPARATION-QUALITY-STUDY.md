# Photographic separation study: open shadows and cool atmosphere

Status: digital candidates, not physical print acceptance. Advances #43 and #47 after merged PR #64. Original defaults and `tonal-key` / `warm-third` recipes are retained, so the comparison remains reproducible. Guide and lab visual alignment is deferred.

## Inputs and conditions

The scripts verify all three original SHA-256 values against `tests/fixtures/owner-photo-fixtures.json` before rendering any study. No original, thumbnail, proof, plate or image-bearing document is committed or hosted. The private review contains 48 same-source proofs (12 treatments on three photographs and authored linework), six focused before/after proofs, grayscale plates, normalized recipes and source metadata.

Both focused candidates and their earlier `tonal-key` baselines use native decoded pixels, 300 DPI, seed 42 and a 50 LPI target for screened accents. The key is continuous-tone; its effective LPI is null. A is 805 × 644 pixels, B 2048 × 1365, C 1152 × 2048. At 300 DPI they are approximately 68.16 × 54.53, 173.40 × 115.57 and 97.54 × 173.40 mm. No full image is cropped, stretched or resampled. Contact sheets are previews; the separately marked detail sheets are native-pixel crops for inspection.

The beach original contains ICC metadata. The study uses Stiprā's existing canonical Skia import path and records the metadata; it does not resolve source ICC policy #44 or establish color-managed browser import parity. Shared-engine parity is tested on identical decoded RGBA, and actual CLI package pixels are compared with that shared browser engine. Distinguish decoding policy from rendering parity.

## Results

| Fixture / treatment | Key or blue mean | Accent mean | Two-plus overlap |
| --- | ---: | ---: | ---: |
| B / earlier `tonal-key` | 58.6358% | 25.8164% yellow | 23.4856% |
| B / `forest-depth` | 52.4723% | 16.6879% yellow | 14.3398% |
| C / earlier `tonal-key` | 19.6863% green | 2.7553% yellow | 1.9085% |
| C / `coast-duotone` | 44.1530% blue | 6.9289% coral | 5.3889% |

These measurements use the same physical screening within this study. Do not compare the screened-accent numbers directly with the earlier 118 mm forest specimen, whose effective DPI and screen raster pitch differed. Ink coverage is not an aesthetic score. The green and blue passes also have different preview colors and source formulas.

### Forest

The prior key clipped some dark foliage into flat green. The new photographic tone source and gain below 1 preserve distinctions without requiring a black hold. Gray removal from the yellow source prevents neutral bark from acquiring the same yellow density as chromatic foliage. Native crops of foliage, stumps, antlers and the distant display were inspected. Foliage texture is more visible; stump contours remain readable. The display remains recognizable but its original violet/brown distinctions are unavailable in green/yellow. The result still has a pronounced green cast and needs a physical print comparison.

Two inks remain the preferred candidate. The retained `warm-third` treatment's selective coral still contributes little, and the broader matrix makes its limited value visible. Four-ink process experiments are alternatives, not an automatic upgrade. The forest's dark-source suitability advisory is triggered by 32.2799% of visible pixels below encoded tone 0.25.

### Beach

The `tonal-key` family reduced the sky to nearly bare paper. Complementary red-channel density assigned blue retains the cool sky gradient and cloud contours. A first experiment used green-channel chroma for coral, which warmed the blue sky too much; the accepted candidate instead uses blue-channel density with partial gray removal. The coral pass now remains restrained and contributes to material tone. Both seated figures remain visible in the native crop. Clouds, horizon and figures were reviewed separately.

This is a cool duotone, not faithful color reproduction: sea becomes stronger blue, pebbles remain cooler than the original, and fine screened coral is visible in the foreground. Canonical source ICC handling now has its own implemented/tested #44 policy; physical ink/paper color is still unverified. Keep the recipe opt-in.

### Sculpture and authored linework

The new forest recipe is a counterexample to universal defaults: sculpture background green still averages 74.9757%, while yellow contributes only 1.9963%. The diagnostics call out both the broad heavy pass and weak accent. It is not the recommended two-ink solution for this image. The original rectangular composition is preserved. The authored linework fixture remains useful for exposing screen damage to fine strokes; photographic recipes do not replace Clean Linework.

## Reproduce

```sh
npm run build:github-pages
npm test
node scripts/review-shared-styles.js --sources /private/originals --out /private/new-matrix
node scripts/review-separation-quality.js --sources /private/originals --out /private/new-focus
```

Use new output directories. The scripts refuse overwrites and repository-local source/output paths. The focus manifest records source metadata, native geometry, print dimensions, source/proof/plate hashes, recipes, screening, coverage and source suitability. The matrix records the same shared style resolutions and full-frame proofs. Pixel-size detail regions are recorded in the focus manifest; changing them changes only the inspection crops, never the artwork or masters.

Release gates still open: owner visual acceptance, physical print evaluation, broader style evidence and small-detail print limits. Source color handling follows the documented canonical import contract; it does not calibrate ink. No style is declared press-ready on a software test pass.

The current [pass-contribution review](FOREST-PASS-REVIEW.md) adds an opt-in `forest-contrast` candidate and a controlled two-versus-three-pass removal test. Earlier recipes remain unchanged.
