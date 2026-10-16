# Stipra roadmap

**Baseline:** Prehnite Riso Studio v8 case-study source. **Target:** Stipra v0.9.
**Status:** planning and foundation; acceptance criteria below are not assertions of completion.

## Progress tracking

| Phase | Gate | Status | Issues |
|---|---|---|---|
| 0 — Foundation | MIT-ready source, six presets, CLI, browser demo | In progress | [#1](https://github.com/yigit-denktas/stipra/issues/1) |
| 1 — Print simulation | Crisp geometry, paper contamination and separated ink behavior | Not started | [#3](https://github.com/yigit-denktas/stipra/issues/3), [#4](https://github.com/yigit-denktas/stipra/issues/4), [#5](https://github.com/yigit-denktas/stipra/issues/5) |
| 2 — Separation | Imported images and independently aligned plates | Not started | [#2](https://github.com/yigit-denktas/stipra/issues/2), [#6](https://github.com/yigit-denktas/stipra/issues/6), [#7](https://github.com/yigit-denktas/stipra/issues/7), [#8](https://github.com/yigit-denktas/stipra/issues/8) |
| 3 — Report | A4 HTML/PDF diagnostic + print sheets | Not started | [#9](https://github.com/yigit-denktas/stipra/issues/9) |
| 4 — Delivery | CLI/agent API, batch, SVG/raster/PDF packages | Not started | [#11](https://github.com/yigit-denktas/stipra/issues/11), [#12](https://github.com/yigit-denktas/stipra/issues/12) |
| 5 — Quality | Golden comparisons, benchmark/reference suite, accessible browser QA | Not started | [#10](https://github.com/yigit-denktas/stipra/issues/10), [#13](https://github.com/yigit-denktas/stipra/issues/13), [#14](https://github.com/yigit-denktas/stipra/issues/14) |

**Progress is tracked by closed acceptance issues rather than speculative percentages.** All **14 numbered issues** are created; #1 covers the foundation and #2–#14 are the planned v0.9 backlog. Work remains open until verified and merged.

## v0.9 definition of success

A local user can upload a photo or SVG, select either a CMYK recipe or two/three chosen spot inks, adjust separations, solo each actual ink plate without reflow, export aligned monochrome plates, and generate a legible A4 landscape HTML/PDF inspection report.

The report's design follows the approved specimen: full-composite header, a panel for paper stock plus one panel per actual ink, exact-position miniatures, swatches, names, estimates, alignment marks, and notes. Separate production plates must retain the *full original image origin, crop box, size and registration*.

## Non-goals

No hosted workflow platform, paid API requirement, AI image generation for rasterization, unlicensed reference images in the distribution, or claim that simulated ink separations are press-calibrated without real-print testing.

## Migration

The Prehnite logo is a **case study**. Generic import and prepress tooling must not hard-code its wordmark, gem geometry, six presets, or paper dimensions.