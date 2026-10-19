# Forest pass contribution and contrast review

Digital designer review, 17 October 2026. A [19 October tonal-detail follow-up](TONAL-DETAIL-REVIEW.md) adds a separately versioned forest-balanced candidate without changing these earlier results. Owner and physical acceptance remain pending (#43/#47/#34). All photo-bearing outputs stay private. The committed evidence is [numeric metadata and recipes only](evidence/forest-ink-contribution-2026-10-17.json).

The original forest SHA-256 matches fixture B. All treatments use the complete 2048 × 1365 canonical source, 300 DPI, the same paper, seed 42 and 50 LPI screened accents. Inspection contact sheets are downscaled; the artwork and master grid are not cropped or resampled. The two common `tonal-key` / `warm-third` plates are asserted byte-identical, making the third-pass comparison controlled.

| Treatment | Green key mean | Yellow mean | Coral mean | Fully covered key pixels |
| --- | ---: | ---: | ---: | ---: |
| tonal-key v1 | 58.6358% | 25.8164% | — | 17.1239% |
| warm-third v1 | 58.6358% | 25.8164% | 1.2416% | 17.1239% |
| forest-depth v1 | 52.4723% | 16.6879% | — | 0% |
| forest-contrast v1 | 55.8612% | 16.6879% | — | 13.1259% |

Omitting the coral pass changes 1.2416% of the full image by more than one encoded RGB unit in any channel. Its mean absolute channel difference is 0.8861/255 over the whole image, 2.3795/255 in the declared stump crop and 0.1610/255 in the antler crop. This measures digital proof difference, not perceptual Delta E, artistic necessity, ink safety or press behavior. It does not justify an extra ink automatically.

The coral pass gives a small localized warm note on the stumps. The two-ink treatments remain the preferred starting point for this scene. `forest-depth` opens foliage texture but lifts the dark background enough to flatten spatial separation. The new opt-in `forest-contrast` uses the same yellow chroma pass and a green tone curve with gain 1.1 / gamma 1.3. Its stronger dark background better separates the lighter stumps in the digital review. That tradeoff restores full key coverage in some shadows: inspect bark and foliage before choosing it. Lower average coverage alone is not a quality verdict.

The four defaults and every earlier variant are unchanged. `forest-contrast` is a separately named v1 recipe available through the same browser/CLI/library resolver, not an invisible revision of saved `forest-depth` recipes. It uses the existing original green/yellow palette and established paper. No new scene classifier, image-editing workflow or symbol is introduced.

The beach review still favors `coast-duotone` over a nearly bare-paper sky, while its small figures lose contrast against the strongly screened water. That remains a print-size review requirement. The sculpture is a counterexample to applying a forest recipe universally: its large dark background still dominates. Neither result justifies promoting a universal photographic preset.

## Reproduce privately

```sh
node scripts/review-ink-contribution.js --sources /private/originals --out /private/new-pass-study
```

The script rejects a wrong original hash, existing output directories and repository-local photo/output paths. It emits normalized recipes, full-frame proofs, a contact sheet and per-pass omission metrics for the full frame, foliage, stumps and antlers. Both common plates in the two-/three-ink comparison must match. The fixed crop coordinates are inspection regions only. Physical printing and independent artist review remain not performed.
