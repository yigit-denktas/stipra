# Tonal-detail comparison, 19 October 2026

The opt-in `forest-balanced` and `coast-tonal` recipes improve two specific digital separation failures. They use the existing shared resolver and separation engine. All earlier recipes and family defaults are unchanged. This is an agent visual review and automated evidence for #43/#47/#34; owner, independent artist and physical-print acceptance remain open.

All three original SHA-256 values match `tests/fixtures/owner-photo-fixtures.json`. Source photographs, image-bearing reports, crops and packages remain private. Public [evidence](evidence/tonal-detail-2026-10-19.json) contains settings, source metadata, hashes and numeric measurements only.

## Controlled comparison

Each pair uses the full oriented source, 300 DPI, 50 LPI accents, seed 42, the same authored paper, ink colors, screen angles and framing. Forest remains 2048 × 1365 pixels / 173.3973 × 115.57 mm; beach remains 1152 × 2048 pixels / 97.536 × 173.3973 mm. The key is continuous-tone; screened accents resolve to a six-pixel pitch. No source is cropped or resampled for production. Contact sheets are reduced previews; detail crops are inspection views only.

The forest yellow and beach coral masks are asserted byte-identical within their respective comparisons. Only the key mapping changes. The earlier two-/three-ink omission study was also repeated: the common plates match and the selective coral pass still changes about 1.2416% of forest pixels. That does not establish a need for a third ink.

## Forest: retain detail inside the dark anchor

`forest-contrast` multiplies photographic tone to the power 1.3 by gain 1.1, then clamps it. `forest-balanced` retains gamma 1.3 with gain 1. Different dark source tones therefore remain distinct over a wider range instead of reaching a shared coverage ceiling.

| Continuous green key measurement | forest-contrast v1 | forest-balanced v1 |
| --- | ---: | ---: |
| Mean nominal coverage | 55.8612% | 51.3835% |
| Full-coverage pixels | 13.1259% | 0.1004% |
| Full coverage where source tone exceeds 0.02 | 9.3413% | 0% |
| Two-plus overlap after screening | 12.6273% | 11.2131% |

The last full-coverage measure excludes the darkest source tones by an explicit encoded RGB threshold; its denominator is the complete frame. It is a diagnostic for this comparison, not an estimate of recovered information or a physical ink limit. Residual full coverage is consistent with source black and eight-bit quantization; the new recipe does not promise zero plateaus.

Native foliage/display crops show gradation where the previous key flattened the background. Stump and antler crops retain their silhouettes with a lighter middle-tone treatment. I prefer the new candidate for this forest because it keeps the dark anchor while showing more texture; the earlier stronger treatment remains available for a deliberately graphic result. More detail is not automatically more desirable for every image.

## Beach: separate silhouettes from saturated water

The old blue key uses complementary red-channel density. Both blue water and nearly black figures contain little red, so this mapping gives them similar coverage. `coast-tonal` uses photographic tone with gain 1 / gamma 0.9. The coral mapping, paper and screens remain fixed.

Blue mean coverage changes from 44.1530% to 38.0858%. The native figure crop shows more distinction between the two dark silhouettes and their surroundings. Sky/cloud structure remains visible but the sky is slightly paler. Choose the earlier `coast-duotone` when its stronger atmosphere is preferred. The warm ground remains an artistic interpretation; neither treatment reproduces the original colors faithfully.

Two-plus overlap rises from 5.3889% to 5.8610% despite the lower blue mean. This is another reason to inspect actual masks and proof detail rather than rank quality by a single coverage number. No semantic figure detection or local retouching is performed.

## Suitability and remaining limits

The sculpture is a counterexample to a universal photographic recipe. Both new variants still print its large dark background heavily; a toned key does not remove negative space. The coastal warm pass also makes little sense as a general sculpture recommendation. Fine ridges and small typography need their own appropriate mapping and print-size checks.

The four family defaults remain experimental. The shared-style matrix includes every current family/variant on the three original photographs and authored linework. Synthetic regression fixtures separately check dark-tone ordering, silhouette/water contrast, white/alpha handling, frozen recipe hashes and browser/Node/CLI parity. These checks do not approve the entire family artistically.

Four canonical CLI packages compare old/new forest and beach recipes. Their ZIP verification checks source bytes, recipes, masks, frame, DPI, hashes and report attachments. Eight report pages are rendered for visual inspection. Inspection-sheet previews are not native-size printing masters; print the package masters at their declared DPI, with scaling disabled, for a physical trial.

## Reproduce privately

```sh
node scripts/review-separation-quality.js --sources /private/originals --out /private/new-tonal-study
node scripts/review-ink-contribution.js --sources /private/originals --out /private/new-contribution-study
node scripts/review-shared-styles.js --sources /private/originals --out /private/new-style-matrix
node bin/stipra.js package --input /private/originals/forest.jpg \
  --style editorial-halftone --style-variant forest-balanced \
  --dpi 300 --lpi 50 --seed 42 --out /private/forest-balanced.zip
node bin/stipra.js verify --input /private/forest-balanced.zip --json
```

Use the actual original filename for `--input`; the study scripts verify the manifest filenames and hashes. Their output directories must be new and outside the repository. For beach, select `coast-tonal`; compare `forest-contrast` / `coast-duotone` with otherwise identical options. Browser Recipe variant offers the same settings. Choosing a recipe is explicit and does not update an already saved recipe.
