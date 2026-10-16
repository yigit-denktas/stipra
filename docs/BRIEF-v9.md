# v0.9 engineering and art-direction brief

**Mission:** reusable code-first printmaking, not a one-off Prehnite logo filter.

## Print behavior

- Rebuild bottom-right crystal proportions; keep outer polygon edges geometrically straight, internal seams shared and sharp.
- Registration moves ink passes; it must not mutate geometry.
- Add separated, deterministic seeds for geometry, screening, paper, and deposited print debris.
- Add clustered pulp, fibers, dirty specks, colored flecks, rare debris and local stains without uniform noise.
- Promote dot-native facet modes: positive dots, reverse paper knockouts, dense solid, paper-only, two-plate crossover and hybrid.

## Deliverables

- General image upload, spot-color and CMYK separation.
- A4 landscape report modeled after approved color separation sheet: composite + stock + all physical ink layers + metadata.
- Full-resolution plates at original image coordinates.
- HSL/coverage diagnostics for reference overlays, including geometric and text differences.
- Local browser studio + Node CLI using shared scene, recipes and plate logic.
- PNG, JPEG, WebP, true-vector SVG, PDF and ZIP exports.

## Success tests

- Crystal silhouette and seams stay straight when print distress settings change.
- Plate solo + composite share bounds, aspect ratio and origins.
- A paper-only background never appears as an ink master.
- CLI and browser renders are deterministically equivalent for the same recipe and seed.
- Report renders correctly for 2, 3 and 4+ inks; overflow creates additional pages, never distorted art.
- All six inherited Prehnite colorways still render.
- Reference diagnostics record both gains and regressions independently by element.
- Every new issue links to a branch and PR before it can be declared complete.

**Deferred to press validation:** spot-color conversion profiles, physical dot gain, master/stencil constraints, fluorescent overprint calibration, and vendor-specific crop requirements.