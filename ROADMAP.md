# Stipra roadmap

**Baseline:** Prehnite Riso Studio v8 case-study source. **Target:** Stipra v0.9.
**Status:** planning and foundation; acceptance criteria below are not assertions of completion.

## Progress tracking

| Phase | Gate | Status | Issues |
|---|---|---|---|
| 0 — Foundation | MIT-ready source, six presets, CLI, browser demo | In progress | Foundation |
| 1 — Print simulation | Crisp geometry, paper contamination and separated ink behavior | Not started | Geometry, ink, paper |
| 2 — Separation | Imported images and independently aligned plates | Not started | Import, spot/CMYK |
| 3 — Report | A4 HTML/PDF diagnostic + print sheets | Not started | Report |
| 4 — Delivery | CLI/agent API, batch, SVG/raster/PDF packages | Not started | CLI, export |
| 5 — Quality | Golden comparisons, benchmark/reference suite, accessible browser QA | Not started | Diagnostics, tests |

**Progress bars are linked to closed acceptance issues, not speculative percentages.** Once issues are created, replace the issue labels in this table with their GitHub links.

## v0.9 definition of success

A local user can upload a photo or SVG, select either a CMYK recipe or two/three chosen spot inks, adjust separations, solo each actual ink plate without reflow, export aligned monochrome plates, and generate a legible A4 landscape HTML/PDF inspection report.

The report's design follows the approved specimen: full-composite header, a panel for paper stock plus one panel per actual ink, exact-position miniatures, swatches, names, estimates, alignment marks, and notes. Separate production plates must retain the *full original image origin, crop box, size and registration*.

## Non-goals

No hosted workflow platform, paid API requirement, AI image generation for rasterization, unlicensed reference images in the distribution, or claim that simulated ink separations are press-calibrated without real-print testing.

## Migration

The Prehnite logo is a **case study**. Generic import and prepress tooling must not hard-code its wordmark, gem geometry, six presets, or paper dimensions.