# Stiprā · candidate mark 01

**Status: owner review, not adopted.** The current five-row dotted logo in [`logo_for_Readme.svg`](../logo_for_Readme.svg) is preserved, byte-for-byte. The repository header will not change until the new design is explicitly approved.

[**See the generated vector composite**](https://apps.yigitdenktas.com/stipra/brand/stipra-mark.svg) · [Teal plate](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-blue.svg) · [Vermilion plate](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-coral.svg) · [Key plate](https://apps.yigitdenktas.com/stipra/brand/stipra-mark-key.svg)

The composition is an abstract, screen-printed **S**, assembled from hundreds of stippled circles along a reproducible cubic-Bézier ribbon. Two overlapping spot inks form the body; a sparse third key pass gives registration and material character. The *artwork is defined as three actual ink plates* in the real [Stiprā v1 scene contract](../src/core.js), not a traced bitmap or manually authored one-layer SVG.

**Original source:** [`scripts/generate-stipra-mark.js`](../scripts/generate-stipra-mark.js). Every layer is generated deterministically and normalized by `StipraCore.resolveRecipe` and `StipraCore.renderSvg`; the output includes four separate SVG exports, normalized recipe JSON and SHA-256 manifest. The scene does not contain font glyphs or downloaded visual assets. This candidate's circular marks constitute vector stippling (an authored dot screen); it doesn't claim any calibrated mechanical ink spread.

## Reproduce it

With Node.js 20+:

```sh
npm install
npm run build:mark
```

Generated files go into ignored `dist/brand/`:

- `stipra-mark.svg` — full composite
- `stipra-mark-{blue,coral,key}.svg` — independent monochrome physical ink passes
- `stipra-mark.recipe.json` — fully normalized scene recipe
- `stipra-mark.manifest.json` — actual SHA-256 hashes and plate metadata

The Cloudflare Pages build independently generates the same files to `/stipra/brand/` as a preview. No redundant generated SVG or HTML screenshot is committed as source.

## What to evaluate

The mark must work at small icon size and full poster scale, in one-ink fallback and 2–3 color, and with/without an independent type lockup. The [IBM Plex choice](PRINT-PACKAGE-v1.md) is used for the print-sheet typography, but **no typeface is baked into the SVG mark**, so future identity typography can be reviewed independently.

Questions before adopting:
- Does this look like a distinct print studio, or just a decorative effect?
- Should the identity emphasize the accented **ā** instead of an abstract **S**?
- At 24px, does the dot structure remain recognizable—or do we need a simplified solid-ink derivative?
- Should the palette track our turquoise/coral brand, or does printmaking merit a less conventional two-ink pair?

**Licensing:** All programmatically produced shapes and the original generator are Stiprā-authored, MIT. No copied Dizzy Ink reference illustration or AI-generated mark is bundled. Link to [DESIGN.md](../DESIGN.md) for the layer-first philosophy and [#31](https://github.com/yigit-denktas/stipra/issues/31) for the interface identity discussion.
