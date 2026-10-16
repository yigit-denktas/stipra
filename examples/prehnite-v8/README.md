# Prehnite · procedural case study v8

This is the preserved case-study renderer that motivated Stipra. It is not yet a general image-separation engine.

Open index.html from a local static server. Source modules: src/engine.js (scene, plates, deterministic halftones, rendering/SVG); src/font-atlas.js (Inter-derived outlined glyphs, OFL); app.js and style.css (browser configurator).

Supported: six ink/paper palettes, separate spot-ink plates, paper textures, geometric facet editor, real vector SVG, experimental HSL overlays and independent paper/grain controls.

**Limitations:** original diagnostics referenced a locally approved image which is intentionally **not committed**. You may upload your own reference image in the browser editor. Browser functionality and physical-press output need fresh verification after importing into the new repository.

The first Stipra release must remove Prehnite-specific geometry from the generic engine contract.