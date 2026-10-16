# Architecture · proposed

## Current foundation

The preserved Prehnite v8 source includes a browser editor and a reusable scene/plate renderer in examples/prehnite-v8/src/engine.js, plus font outlines from Inter under SIL OFL.

Stipra's root CLI initially calls that case-study engine. This is a bridge, **not** the finished generalized Stipra architecture.

## Target modules

1. **Input adapters:** raster (PNG/JPG/WebP), SVG where safely supported, procedural scene descriptions.
2. **Scene/geometry:** stable coordinates, shared facet edges, geometry independent of distress.
3. **Separation strategy:** CMYK decomposition OR N user-defined spot inks, adjustable plate masks, preview overprints.
4. **Print model:** independent ink channels, dot screens (positive/reverse/hybrid), coverage controls, plate registration.
5. **Substrate model:** stock tones, procedural fibers, contamination, independent seeds; physical paper effects are never serialized as a printable plate.
6. **Export:** SVG, PNG/JPG/WebP, aligned grayscale masters, consistent manifests and registration metadata.
7. **Diagnostic renderer:** color-space masks for reference approximation, recolored discrepancy overlays, bbox and coverage/IoU metrics.
8. **Report:** HTML/CSS print layout for A4; PDF via local headless browser; production masters kept separate.

## Shared contract

A recipe describes canvas/trim dimensions, optional bleed/registration marks, paper, inks (one plate per ink), layers, deterministic seeds, and separation method. Both browser and CLI must interpret this same recipe.

Preview compositing is a **simulation**, not a claim that RGB multiply reproduces a calibrated physical press. Ink percentages may overlap and therefore need not sum to 100.

## CLI contract, stages

- Available now: presets, case-study render and plates (from Prehnite).
- Planned: import, separate, sheet, compare, batch, export/profile.
- Planned reports: machine-readable JSON and A4 landscape HTML/PDF.

## Boundary

The original p5.riso library has an Anti-Capitalist License. Study public algorithms and principles, but do not copy restricted source into the MIT engine. Attribute ideas; assess dependencies and assets separately.