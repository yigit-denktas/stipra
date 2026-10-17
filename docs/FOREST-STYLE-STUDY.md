# Forest separation study

The two-ink tonal-key treatment is the preferred digital candidate from this study. It improves the distinction between foreground stumps, antlers and the distant display relative to the original private three-ink specimen. The dark upper foliage still compresses into a broad green area. This is a designer's assessment of the digital proofs, pending owner review and physical printing, not an automated quality score.

All cases use the SHA-256-verified original fixture B, the canonical Node importer, native 2048 × 1365 pixels, zero registration and warm rag paper. The image width is 118 mm, giving 440.840678 DPI. No artwork crop or resampling is applied to the proofs. Separate labeled detail crops are review aids only.

| Treatment | Green mean coverage | Yellow mean coverage | Coral mean coverage | Area with two or more active inks |
| --- | --- | --- | --- | --- |
| Original specimen recipe | 76.4034% | 35.4985% | 1.7616% | 29.0288% |
| Shared tonal key, two inks | 58.6358% | 25.7405% | — | 23.3700% |
| Shared tonal key, selective coral | 58.6358% | 25.7405% | 1.1640% | 24.4602% |

The original uses approximately 73.47 LPI at this print size. The new variants use a continuous-tone key and a 50 LPI yellow pass; the third-ink case also screens coral at 50 LPI. Continuous tone describes the exported grayscale key, not a claim that a physical printer will apply no screening of its own. Coverage and overlap are measured from the actual output masks; the active overlap threshold is recorded in each diagnostics file. These figures are descriptive, with no universal press-safe threshold.

The important separation change is using the RGB black component (`1 - max(R,G,B)`) for structure, rather than covering most dark foliage with a luminance-darkness mask. Yellow remains an independent chromatic mask. Both masks preserve the underlying source geometry. This improves foreground material definition but does not recover all shadow detail.

The optional third pass matches a narrow neutral RGB region centered on `#a3a3a3` and assigns coral to it. It is a color-distance mask, not recognition of wood, stone or objects. An earlier broader brown match contaminated too much grass. The tighter match isolates more neutral wood and display material, but its 1.16% average coverage triggers the low-contribution advisory. I would use two inks for this image unless the coral detail is an explicit artistic choice. The third plate has not earned a recommendation merely by existing.

## Reproduce privately

```sh
node scripts/forest-style-study.js \
  --input /private/originals/SPK-Skulpturenpark-04.web_-2048x1365.jpg \
  --baseline /private/type-comparison/b/recipe.json \
  --out /private/new-forest-study

node scripts/review-shared-styles.js \
  --sources /private/originals \
  --out /private/new-style-matrix
```

The first command checks the source fingerprint and produces native proofs, grayscale plates, normalized recipes, diagnostic records, a comparison and three 1:1 pixel detail sheets: antlers, stumps and display. Its baseline is the frozen recipe from the original typography comparison. The second checks all three owner-photo fingerprints and produces 24 comparisons: the four original families and two editorial variants on sculpture, forest, beach and an authored type/line fixture. It records the Node and Canvas versions, recipe/seed and proof hashes. Matrix cases use 300 DPI; the focused forest study uses the frozen 118 mm image width. Compare physical texture only within the same stated print intent.

The matrix exposes important limits. The sculpture retains clearer ridges with the tonal key but still has a dense background. On the beach, the two figures survive, while the sky loses too much tonal structure. The neutral-material coral pass adds little there. The line fixture demonstrates why photographic screens should not be used indiscriminately for text; Clean Linework and the continuous-tone key preserve its black strokes better than the poster recipe. These are visual observations, not a validated classifier or evidence that every family is finished.

Keep all owner images, comparison sheets, crops, reports and bundles private. Only source, tests and these aggregate notes belong in Git. Related: #43, #47, #34, #44. Physical press checks, owner approval and broader recipe quality remain open.
