# Stiprā · v0.9 delivery roadmap

**Product decision:** [#21](https://github.com/yigit-denktas/stipra/issues/21) · 16 October 2026 · [Design principles](DESIGN.md) · [Getting started](docs/GETTING-STARTED.md)  
**Mission:** a small, local-first, **MIT-licensed browser printmaking studio** with an **agent-safe CLI**. One artist or agent should be able to take an image or generate simple layered vector artwork, control the actual ink-separation masks, see each plate/overprint and produce aligned masters and an A4 separation inspection sheet.

Stipra is **not** a new p5.js, a p5.riso relicense, a general image generator, a replacement for professional ICC/prepress calibration or a hosted publishing platform. The existing v1 scene, #6 image importer, CLI scaffolding and Prehnite v8 case study are kept. [Kuşluk #21](https://github.com/interzettel/kushluk/issues/21#issuecomment-6225189079) may consume *optional static graphics only* after a direct-tools benchmark.

## v0.9 user experience — one browser workflow

1. **Input:** drag/drop a raster or supported safe vector, or choose an existing vector/procedural example. Preserve original bytes, alpha, pixel origin, aspect, explicit trim and DPI.
2. **Separations:** choose `2–N` actual spot-ink passes or `CMYK`. Edit thresholds, intensity/channel mapping and each **independent coverage mask**; preserve solid marks and type when selected. Paper/substrate is never an ink plate. Unlike palette recoloring, changing a separation must change printed coverage.
3. **Screen:** apply optional controlled dots/lines/knockouts/dithering to the masks, or preserve continuous-tone/solid coverage. Keep registration independent from source geometry.
4. **Inspect:** compare input, combined color proof, paper, and individual aligned monochrome plates. Show overprints, accurate crop and registration, coverage estimates and print-size warning.
5. **Export:** full-frame aligned grayscale masters, tinted proof, legible **A4 landscape separation sheet (HTML and PDF)**, structured recipe/seed/source/provenance manifest and ZIP package.
6. **Automate:** same inputs, plate masks and output settings via local CLI/batch/agent recipes with deterministic seeds, bounded cost/memory/paths and actionable errors.

The attached sample showing alternative Riso color separations is the visual benchmark for distinct masks, not an asset bundled with the public code. The checked six-item acceptance benchmark is **proposed test criteria, not observed passing evidence**.

## Status and priority

| Work | Issue | Status | Release priority |
| --- | --- | --- | --- |
| Prehnite case-study foundation | [#1](https://github.com/yigit-denktas/stipra/issues/1) | **Merged** | Done |
| Vector scene, ink plates and stable recipe v1 | [#2](https://github.com/yigit-denktas/stipra/issues/2) | **Merged** | Done |
| Local PNG/JPEG/WebP and restricted SVG import | [#6](https://github.com/yigit-denktas/stipra/issues/6) | **Merged, 21 Node tests + Chromium smoke** | Done |
| Real spot / CMYK **image-to-mask** separation | [#7](https://github.com/yigit-denktas/stipra/issues/7) | **Implemented — actual continuous-tone masks, edit controls, browser lab and CLI** | Done |
| Raster dot, reverse, line and hybrid screens of masks | [#5](https://github.com/yigit-denktas/stipra/issues/5) | **Implemented — Node/Chromium screen masks, real CLI and browser controls** | Done |
| Native vector facet screening (SVG) | [#28](https://github.com/yigit-denktas/stipra/issues/28) | Planned — separate from raster screens | P1 |
| Full-frame grayscale production plates, accurate trim and registration marks | [#8](https://github.com/yigit-denktas/stipra/issues/8) | Planned | **P0 — next** |
| A4 HTML/PDF separation inspection sheet | [#9](https://github.com/yigit-denktas/stipra/issues/9) | Planned | P0 |
| CLI and reproducible agent/batch jobs | [#11](https://github.com/yigit-denktas/stipra/issues/11) | Partial foundation | P0 |
| Browser separation studio and edit/solo/overprint controls | [#22](https://github.com/yigit-denktas/stipra/issues/22) | Planned | P0 |
| Input-aware, print-guided **style defaults** | [#34](https://github.com/yigit-denktas/stipra/issues/34) | Design proposal; no style engine yet | P1 · scope before implementation |
| PNG/JPEG/WebP/true SVG/PDF/ZIP delivery | [#12](https://github.com/yigit-denktas/stipra/issues/12) | Planned | P0 |
| Golden art, browser accessibility and print QA | [#13](https://github.com/yigit-denktas/stipra/issues/13) | Partial import tests | P0 release gate |
| Component provenance and commercial-compatible licensing | [#14](https://github.com/yigit-denktas/stipra/issues/14) | Planned | P0 release gate |
| Diagnostic HSL/coverage comparison overlays | [#10](https://github.com/yigit-denktas/stipra/issues/10) | Planned | P1; ship minimal plate diagnostics first |
| Prehnite crystal seam/proportion polish | [#3](https://github.com/yigit-denktas/stipra/issues/3) | Planned | **Case-study-only, nonblocking** |
| Fine paper fibers/clusters and dirt realism | [#4](https://github.com/yigit-denktas/stipra/issues/4) | Planned | **Optional style extension, nonblocking** |
| GitHub Project/milestone administrative setup | [#17](https://github.com/yigit-denktas/stipra/issues/17) | Planned | Admin, not runtime |

**New dependency ordering:** #22 is the browser studio/UI integration issue; #7 needs completed #6; a grayscale continuous-tone separation is valid before optional halftoning. Raster screening #5 now operates on #7's independently separated masks. True SVG dot geometry is separately tracked in #28. #8 and #9 must not invent new channel maps or change the shared pixel grid. User-facing visual tooling must not wait for #3/#4.

## Keep versus prune

**Keep:** scene/plate geometry and deterministic provenance, original images, isolated ink coverage masks, substrate, registration, controlled imperfection, RGB/CMYK/spot modes, print report, local/browser parity, reproducible CLI, and clearly optional p5.js/Canvas integration *later* if shown useful.

**Prune:** general rendering engine/plugin marketplace, reimplementing a p5.js sketch API, cloud orchestration, arbitrary AI-generated code execution, excessive Prehnite-specific gem work as a precondition for importing images, and physically calibrated Riso claims unsupported by measurements.

**Use compatible existing packages where useful.** Avoid duplicating standard raster codecs, basic SVG support or PDF rendering without a demonstrated need. An optional p5.js adapter may help author procedural scenes, but Stipra is not to be marketed as a competing p5.js runtime or library in v0.9.

## Printmaking references and style rules

[The printmaking reading room](docs/references/README.md) connects the [Dizzy Ink interactive guide](https://risograph.co.uk/), its [illustrated studio guide](https://www.dizzyink.co.uk/guide-to-risograph) and [our linked visual studies](docs/references/DIZZY-INK-VISUALS.md) as a credited external resource, with [our independent field notes](docs/references/DIZZY-INK.md) and [conditional design rules](docs/PRINT-DESIGN-RULES.md). These rules should guide #34 preset defaults and #31/#22 interaction choices: safe mask alignment, explicit ink density/overlap, print-size limits, proof-only misregistration, and paper as a separate substrate. Machine-specific 5 mm margins or feed concerns are **references, not globally calibrated Stipra thresholds**. No artwork/code/mirrored pages are redistributed. Review the rule contract before adding automated warnings or “press-ready” claims.

## First real-image acceptance fixture set

The owner supplied three **private, rights-not-yet-cleared-for-redistribution** photographs (sculpture contours, complex forest installation, and gradient beach horizon). Their **exact hash/dimension metadata and per-image pass/fail criteria** live in [the owner-photo print-package acceptance specification](docs/PRINT-PACKAGE-ACCEPTANCE.md), tracked by [#39](https://github.com/yigit-denktas/stipra/issues/39). This is the common verification gate for #8 masters, #9 A4 reports, #12 ZIP exports and #13 human/physical QA. **0/3 complete packages verified** against these tests so far; existing Node/browser separation tests do not establish print-package readiness. The original photos are not committed.

## Release acceptance and kill switches

**Acceptance fixture:** Given a rights-cleared full-resolution image, a novice and CLI agent independently select two spot inks, adjust coverage masks, solo/overprint with no crop/reflow, and export two exactly aligned monochrome plates, truthful manifest, A4 landscape report/PDF and self-contained ZIP. Extend test to 3+ inks and CMYK; repeat with text-heavy, transparent, edge-case and malformed inputs.

**Tests:** first usable separation; fidelity and line/text retention; full-frame prepress size/trim/registration; deterministic repeatability with pinned versions; time/peak memory; physical prints on ordinary printers (and Risograph only if physically tested).

**Scope gate:** If the browser+CLI workflow does not beat or materially complement direct licensed tools for that fixed fixture, **do not enlarge Stipra**. Fix or shrink the interface; publish honest limitations. If Kuşluk finds no value, it should not acquire Stipra as a mandatory dependency.

## Licensing and provenance

Stipra-original code is MIT, with individual third-party notices retained. [p5.riso](https://github.com/antiboredom/p5.riso) has a restrictive Anti-Capitalist License; it is **not** a compatible MIT implementation source for copying, vendoring, generated translation or a fork. Study unprotected concepts, standard math and documented visual behavior; create and validate **independent original implementations**. See [licensing notes](docs/LICENSING.md) and [#14](https://github.com/yigit-denktas/stipra/issues/14). Commercial redistribution requires real dependency/asset provenance review.

**Current progress:** 5 of the original #1–#14 tasks merged (#1, #2, #5, #6, #7). This counts issue completions, **not** weighted engineering percent. No work in this scope note claims any of the remaining features are finished.
