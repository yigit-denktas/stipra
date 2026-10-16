# Separation sheets · v0.9 contract

**Implementation status:** Continuous-tone spot/CMYK ink masks (#7) and raster screening (#5) are implemented. This document still specifies **planned** A4 HTML/PDF inspection sheets (#9), press geometry and marks (#8), and the complete ZIP exporter (#12). Screens already working does not mean prepress bundles are finished. The three owner-image test cases and release gate are in [PRINT-PACKAGE-ACCEPTANCE.md](PRINT-PACKAGE-ACCEPTANCE.md).

The supplied specimen demonstrates **three spot colors plus paper**, not CMYK. Stipra must allow 2–N spot inks *and* an optional CMYK recipe.

## Two distinct deliverables

**A. Inspection report:** A4 landscape HTML/PDF. A large final artwork panel occupies the top, with an aligned small-scale paper panel and one panel for each spot ink below. Each plate thumbnail uses the same aspect ratio, crop, origin, and registration as the full artwork. An accurate metadata footer includes dimensions, DPI, trim/bleed, colors, render seed, separation method, and coverage estimates. Panel layout may flow as ink count changes, **but artwork inside panels must never reflow**.

**B. Production masters:** Separate uncolored grayscale plates with a shared, identical raster grid. Black = full ink, white = no ink, grayscale = fractional coverage. Full-size aligned SVG for vector-supporting geometry; optional PDF with registration marks. Paper color and pulp texture are documented but are not a fourth ink.

## For each plate

- Unique stable ID, human-readable ink name, optional reference/Pantone/Riso number where known.
- One per-ink full-canvas coverage mask; tinted preview is *derived* from this mask.
- Coverage estimate = mean normalized plate intensity over the artwork trim area (not the preview's visible colored area).
- Seed, screening method, angle, frequency/dot pitch, separation input transforms and registration offset.
- Ink flecks on printed stock must belong to an ink plate; fibers inherent in paper belong to the substrate model.

## Debug controls

Show/solo/mute ink, toggle paper simulation, one-plate-per-page, on-canvas 1:1 inspection, overprint combinations, and recolored reference-vs-render overlays. Reference plate decomposition is an estimated segmentation and must be labeled as such.

## Acceptance test

Given a 2020×779 RGB source and a three-spot-ink recipe: generate three plates, each exactly 2020×779 with the same origin; generate tinted plate previews; produce one PDF inspection document with composite + substrate + all three plates; package all assets, metadata and report in one ZIP. No panel may shift or scale components internally relative to the composite.