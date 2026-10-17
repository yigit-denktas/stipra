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

## Physical constraints and reproducibility

Each preset records target halftone frequency in **LPI**. The shared resolver calculates raster pitch in pixels from `dpi / lpi` while enforcing current screen limits of 4–128 px, and warns if clamping changes effective LPI. A screen is still a deterministic **digital geometric approximation**, not measured Risograph dot gain or a press RIP.

The source image's geometry is not changed; the resolved ink colors, threshold, source channel, gain, gamma, paper color, angle, pitch and seed are visible in saved JSON. The browser and Node module load the same original `src/styles.js` source and generate the same normalized recipes.

The four defaults are **a baseline to improve**, not a finished style quality release. The three private owner fixtures expose different failure modes: sculpture ridges and dark coverage; complex forest depth/antler separation; smooth beach sky and tiny human figures. The forest [#43](https://github.com/yigit-denktas/stipra/issues/43) and source ICC [#44](https://github.com/yigit-denktas/stipra/issues/44) remain unresolved. Fine-line and typography testing needs a separate rights-cleared sample. No original owner photographs are committed.

We should grade future style improvements on **same-input side-by-side comparisons**, real masks, coverage/overlap diagnostics, detail crops at intended print dimensions, and physical print samples. Merely passing schema or parity tests doesn't establish aesthetic merit or press safety.
