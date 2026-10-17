# Forest tonal-key experiment

Status: private visual candidate for #43, not a new default or owner-approved print style. Related: #34, #56, #60. The owner photograph and all image-bearing outputs stay outside the public repository.

The baseline comparison maps linear-light darkness onto a dominant green pass and uses very little coral. This experiment uses the existing `black` channel, `1 - max(R,G,B)`, as a continuous green tonal key. A screened golden-yellow pass supplies a second tonal layer. It removes coral instead of adding density to justify a third ink.

The experiment uses only the original SVG's green and golden yellow. The paper support color remains warm rag. No semantic object detection, local retouching, image regeneration, cropping or resampling is involved. It is authored image-specific art direction using the existing separation/screening engine, not automatic printmaking intelligence.

Replay requires the original forest JPEG and its private frozen baseline recipe:

```sh
node scripts/forest-key-study.js \
  --input /private/SPK-Skulpturenpark-04.web_-2048x1365.jpg \
  --baseline /private/prior-comparison-output/b/recipe.json \
  --out /private/new-forest-study
```

The runner verifies the original fingerprint, refuses an existing output directory or a directory inside the repository, and saves full-size proof PNGs, normalized recipes, hashes and diagnostic JSON. Golden yellow targets **50 LPI**, resolving its pixel pitch from the frozen effective output DPI. The green key is continuous tone and has no screen frequency.

Measured on the owner fixture, at 118 mm wide and 440.84 effective DPI:

| Nominal raster measure | Baseline | Two-ink candidate |
| --- | --- | --- |
| Green mean coverage | 76.4% | 58.6% |
| Golden-yellow mean coverage | 35.5% | 25.7% |
| Coral mean coverage | 1.8% | Pass removed |
| Pixels with two-plus overlapping passes | 29.0% | 23.4% |

Overlap uses the diagnostics module's declared 25% per-pass activity threshold. These measures describe this raster recipe, not drying safety or aesthetic merit.

In private side-by-side review, the antler edges, foreground stumps and distant display are easier to distinguish in the lighter two-ink candidate. It also loses some midtone weight and still compresses foliage in the dark background. That tradeoff remains visible in the comparison; reduced coverage is not proof that the candidate is better. Owner review and printer-specific physical tests remain open. Neither recipe replaces the current source fixture or Styles defaults.
