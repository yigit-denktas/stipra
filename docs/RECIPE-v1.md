# Stipra recipe v1 · scene and plate contract

This is the **implemented generic vector contract** in `src/core.js`, shared as CommonJS (`require('./src/core.js')`) and a browser global (`StipraCore`). The former Prehnite v8 engine remains a separate case-study adapter in `examples/prehnite-v8`. Generic image import is **not** yet supported.

## Document shape

- `version: 1` — required. The validator rejects unknown versions and unknown fields rather than silently changing intent.
- `canvas: {width,height,dpi,units:'px',trim:{x,y,width,height},bleed:{top,right,bottom,left}}` — all positions and bleed are in canvas pixels. The bleed margins must fit around the trim **inside the full canvas**.
- `substrate: {name,color}` — virtual paper stock; never exported as a physical ink plate.
- `inks: [{id,name,color,reference?}]` — one to sixteen named spot inks, identified by stable lowercase IDs. Colors are uncalibrated `#RRGGBB` previews, not spot ink spectral data.
- `plates: [{id,inkId,role,offset:{x,y},screen:{mode:'solid'}}]` — exactly one physical plate per ink. Roles are human-readable metadata; offset moves ink relative to the shared canvas.
- `layers: [{id,plateId,geometry,coverage,transform?,clip?}]` — independent, uniquely identified geometric marks. Coverage is a continuous `0..1` fill alpha, not true halftone dots or calibrated stencil darkness.
- `seeds: {geometry,screen,paper,debris}` — four independent positive integer streams. Each layer receives reproducible derived seeds; geometry/screens/paper/debris sampling is **not** implemented in the generic renderer yet.
- `provenance: {adapter,source,notes?}` — records how the recipe was authored. Do not embed unlicensed source artwork.

Supported `geometry`: `{kind:'rect',x,y,width,height}`, `{kind:'circle',x,y,radius}`, or `{kind:'polygon',points:[[x,y],...]}`. Optional transform fields are `translateX`, `translateY`, `scaleX`, `scaleY`, and `rotate` (degrees); optional clipping is a rectangle in the layer's local coordinates. Layer transform and the plate's registration offset do not alter the canvas origin.

## Example: three inks, one canvas

See [spot-shapes.json](../examples/recipes/spot-shapes.json) for a complete example. It has 44 vector marks mapped to three physical spot-ink plates at `960 × 560`, with a `920 × 520` trim and `20 px` bleed.

```sh
# Dependency-free for this v1 SVG scene:
node bin/stipra.js scene --config examples/recipes/spot-shapes.json --out out/scene
# Or call node bin/scene.js directly.
# Open examples/scene-contract/index.html from a local HTTP server to inspect the same recipe.
```

Exports: one tinted SVG composite on virtual paper, full-frame monochrome SVG for each ink with **white = no ink** and **black = full ink** (gray via alpha for partial coverage), the canonical normalized recipe, and `manifest.json`. All composite and plate SVGs use identical `width`, `height`, `viewBox`, coordinate system and registration offsets.

The browser demo and the Node CLI both call `resolveRecipe` and `renderSvg` without reimplementing geometry. Automated tests run the browser-global build in a VM and compare the normalized recipe, scene and SVG bytes with Node results.

## Boundaries and next work

This slice **does not** import photographs or SVG files into the scene, decompose pixels into CMYK/spot channels, simulate halftone dot patterns, output calibrated plates, or generate PDF separation sheets. Those are distinct issues [#6](https://github.com/yigit-denktas/stipra/issues/6), [#7](https://github.com/yigit-denktas/stipra/issues/7), [#5](https://github.com/yigit-denktas/stipra/issues/5), [#8](https://github.com/yigit-denktas/stipra/issues/8), and [#9](https://github.com/yigit-denktas/stipra/issues/9).

This module has no new dependencies, hosted services, bundled reference images, or fonts.
