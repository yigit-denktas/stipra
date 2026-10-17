# Stiprā Styles v1 · four experimental starting points

**Status:** runnable deterministic spot-ink strategies, **not** artist-approved print profiles, image classifiers, or finished visual design. [#34](https://github.com/yigit-denktas/stipra/issues/34) and [#47](https://github.com/yigit-denktas/stipra/issues/47) track the quality work. Read the [design principles](../DESIGN.md) and [print rules](PRINT-DESIGN-RULES.md) before introducing new defaults.

We deliberately support **four different intentions**, not 50 effects. Each Style picks actual grayscale ink channels, tonal transfer settings, ink colors and screening. These recipes go through the same `StipraSeparation` and `StipraScreen` engines as manual adjustments.

| Style | Main intention | Real passes | Screen intent | Known risks |
| --- | --- | --- | --- | --- |
| Portrait Duotone | Sculpture and portraits with modeled light | Deep blue key + warm coral | Shadow-preserving hybrid + fine tonal dots | Dark background coverage and moiré against very fine sculptural ridges |
| Editorial Halftone | Kuşluk/editorial photography | Dark key + muted cyan | Relatively fine mixed-angle dots | Thin text not automatically preserved |
| Bold Spot Poster | Collage, silhouettes, graphic composition | Blue + vermilion + navy key | Coarser dots and stronger graphic key | Oversaturated overlapping ink and clipped gradients |
| Clean Linework | Diagrams, high-contrast lettering | Charcoal key + pale cyan | Solid key with sparse accented dots | Smooth photographs become posterized; it is **not** vectorization |

## Try the same logic in your browser and CLI

In the [browser studio](https://apps.yigitdenktas.com/stipra/), import an image, select **Starting style**, then inspect source, digital proof and individual grayscale plates. All manual channel/screen controls remain available. A chosen style is just editable starting settings.

```sh
node bin/stipra.js styles list
node bin/stipra.js styles explain editorial-halftone
node bin/stipra.js styles suggest --intent editorial

node bin/stipra.js package \
  --input photo.jpg \
  --style editorial-halftone \
  --dpi 300 \
  --out out/editorial.zip
```

The CLI ZIP preserves the resolved ink and screening recipes, style ID/version, original bytes and reproducibility details. For full control, use `--config inks.json --screen screens.json` instead of `--style`. The current `package` command deliberately rejects mixing `--style` and `--screen`; resolved styles are atomic defaults, but saved recipes remain independently editable.

**No AI portrait detection.** `styles suggest --intent …` only ranks suggestions based on **the explicit intent provided by a person or agent**. Unsupported or missing intent falls back to an editorial-first exploration order; it does not inspect the photograph.

## Compare the actual ink contribution

[Plate diagnostics v1](PLATE-DIAGNOSTICS-v1.md) records per-plate average coverage, per-pair overlap and effective screen frequency in LPI. Warnings are **editorial prompts**: a third ink with little coverage should justify its own pass, and a dense green key needs visual scrutiny. No numeric diagnostic alone proves forest depth or small-line readability.

## Physical constraints and reproducibility

Each preset records target halftone frequency in **LPI**. The shared resolver calculates raster pitch in pixels from `dpi / lpi` while enforcing current screen limits of 4–128 px, and warns if clamping changes effective LPI. A screen is still a deterministic **digital geometric approximation**, not measured Risograph dot gain or a press RIP.

The source image's geometry is not changed; the resolved ink colors, threshold, source channel, gain, gamma, paper color, angle, pitch and seed are visible in saved JSON. The browser and Node module load the same original `src/styles.js` source and generate the same normalized recipes.

The four defaults are **a baseline to improve**, not a finished style quality release. The three private owner fixtures expose different failure modes: sculpture ridges and dark coverage; complex forest depth/antler separation; smooth beach sky and tiny human figures. The forest [#43](https://github.com/yigit-denktas/stipra/issues/43) and source ICC [#44](https://github.com/yigit-denktas/stipra/issues/44) remain unresolved. Fine-line and typography testing needs a separate rights-cleared sample. No original owner photographs are committed.

We should grade future style improvements on **same-input side-by-side comparisons**, real masks, coverage/overlap diagnostics, detail crops at intended print dimensions, and physical print samples. Merely passing schema or parity tests doesn't establish aesthetic merit or press safety.

## Editorial tonal-key variants

The four original starting recipes remain unchanged. Editorial Halftone additionally offers two explicit version-1 variants: `tonal-key` and `warm-third`. Each resolution records the family version, variant identifier and variant version. The [forest study](FOREST-STYLE-STUDY.md) explains their mask choices, measured contribution and limitations. Neither variant is an automatic forest detector or a new default.

```sh
node bin/stipra.js styles explain editorial-halftone
node bin/stipra.js styles resolve editorial-halftone \
  --variant tonal-key --dpi 600 --lpi 50 --seed 42
node bin/stipra.js package --input photo.jpg \
  --style editorial-halftone --style-variant tonal-key \
  --dpi 600 --lpi 50 --seed 42 --out out/tonal-key.zip
```

The browser exposes the same variant, DPI, LPI and authored/unscreened selections. Changing these starting-style controls reapplies the recipe, replacing manual adjustments; individual ink and screen edits remain available afterward. The same `resolve` implementation supplies both paths. `styles resolve` prints the complete normalized recipes for inspection and manual reuse. `--style-screening unscreened` removes screening for a continuous-tone comparison without changing separation masks; browser uses the corresponding Screen treatment control.

LPI overrides accept 5–150; the engine still clamps pixel pitch to 4–128. Read the effective per-plate values and warnings, especially at low DPI. Solid passes explicitly record null frequency; they are not presented as screened at the family's target LPI. DPI changes physical print dimensions while preserving native pixels, not image resolution through resampling.

Named-style packages now retain their authored substrate by default, matching the browser proof. An explicit `--paper auto` or named stock remains available and intentionally changes the proof substrate; the selected paper is recorded in the package. Manual `--config` packages retain the existing automatic-paper default. The package embeds full style resolution and effective recipes; these are reproducible digital settings, not press calibration.
