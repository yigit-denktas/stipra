# Stiprā · delivery roadmap

**Product decision:** [#21](https://github.com/yigit-denktas/stipra/issues/21) · 16 October 2026 · [Design principles](DESIGN.md) · [Getting started](docs/GETTING-STARTED.md)  
**Mission:** a small, local-first, **MIT-licensed browser printmaking studio** with an **agent-safe CLI**. One artist or agent should be able to take an image or generate simple layered vector artwork, control the actual ink-separation masks, see each plate/overprint and produce aligned masters and an A4 separation inspection sheet.

Stipra is **not** a new p5.js, a p5.riso relicense, a general image generator, a replacement for professional ICC/prepress calibration or a hosted publishing platform. The existing v1 scene, #6 image importer, CLI scaffolding and Prehnite v8 case study are kept. [Kuşluk #21](https://github.com/interzettel/kushluk/issues/21#issuecomment-6225189079) may consume *optional static graphics only* after a direct-tools benchmark.

## Current: experimental digital alpha published

The [library direction](docs/CREATIVE-CODING-LIBRARY.md) now has an implemented local alpha. The lean core (#71), Canvas/p5 adapter (#72), authored-ink export (#73) and measured engineering evaluation (#74) are merged in #78/#79/#80. [Alpha evidence](docs/CREATIVE-CODING-ALPHA.md) records performance, compatibility and browser/Node/CLI parity. The delivery milestone records alpha.1 as published, with registry archives and clean install verified; [tracker #70](https://github.com/yigit-denktas/stipra/issues/70) remains open for independent artist usefulness feedback.

The normalized color contract/reference tests (#44) and bounded PNG interpretation fix (#82) are implemented. The native notice request is posted as [skia-canvas #309](https://github.com/samizdatco/skia-canvas/issues/309); its answer/review remains open (#14). The audit has one native Skia provenance finding (#14); the browser exporter uses a source-mapped Fontkit replacement and fonteditor is removed. The supported digital master/CLI/export scope (#8/#11/#12) is delivered in #93; physical and broader QA acceptance remain #13. The essential studio workflow (#22) is implemented; plate captions now open and focus their matching ink controls. The broader workspace redesign (#31) remains open.

Named-region mapping (#83) and opt-in inert source projects (#84) are implemented locally, with a public procedural example and browser/CLI replay checks. [Structured-input contracts](docs/STRUCTURED-INPUTS.md) record local C2PA feasibility (#85) and OpenRaster/auxiliary pilots (#86), including justified native/browser deferrals. This is additional post-alpha scope; alpha.1 is published and its registry bytes/clean install are verified. The Processing Java bridge (#75) remains a separate feasibility task. Do not build another drawing framework.

Physical-print evidence gates print-quality claims, not evaluation of the experimental digital effect. Additional vector formats, branding and paper realism remain separate. These workstreams are planning targets. Native v0.9 tracking is linked below; #17 records the native configuration.

The [19 October acceptance handoff](docs/ACCEPTANCE-2026-10-19.md) records the merged #98, public-text fixes, reproducible private quality comparisons and the exact outstanding human/physical records. No style defaults or print-quality claims are promoted. The [tonal-detail study](docs/TONAL-DETAIL-REVIEW.md) adds opt-in forest/beach keys with controlled accent plates; owner approved those digital specimens on 19 October; physical prints and independent artist testing are deferred. Studio recipe comparison preserves current edits until explicit adoption.

## v0.9 user experience — one browser workflow

1. **Input:** drag/drop a raster or supported safe vector, or choose an existing vector/procedural example. Preserve original bytes, alpha, pixel origin, aspect, explicit trim and DPI.
2. **Separations:** choose `2–N` actual spot-ink passes or `CMYK`. Edit thresholds, intensity/channel mapping and each **independent coverage mask**; preserve solid marks and type when selected. Paper/substrate is never an ink plate. Unlike palette recoloring, changing a separation must change printed coverage.
3. **Screen:** apply optional controlled dots/lines/knockouts/dithering to the masks, or preserve continuous-tone/solid coverage. Keep registration independent from source geometry.
4. **Inspect:** compare input, combined color proof, paper, and individual aligned monochrome plates. Show overprints, accurate crop and registration, coverage estimates and print-size warning.
5. **Export:** full-frame aligned grayscale masters, tinted proof, legible **A4 portrait/landscape separation sheet (HTML and PDF)**, structured recipe/seed/source/provenance manifest and ZIP package.
6. **Automate:** same inputs, plate masks and output settings via local CLI/batch/agent recipes with deterministic seeds, bounded cost/memory/paths and actionable errors.

The attached sample showing alternative Riso color separations is the visual benchmark for distinct masks, not an asset bundled with the public code. The checked six-item acceptance benchmark is **proposed test criteria, not observed passing evidence**.

## Consolidated dependencies and version targets

[Public delivery map](https://apps.yigitdenktas.com/stipra/roadmap/) · [Changelog](https://apps.yigitdenktas.com/stipra/changelog/) · [Site map](https://apps.yigitdenktas.com/stipra/sitemap/) · [Source ledger](docs/data/delivery-ledger.json). The ledger covers every task, prerequisites, downstream work, optional scope, conditional version gates and parked branches. It preserves the original #1–#14 denominator; #83–#86 remain additional scope.

`main` is canonical. The studio/audit/navigation and recipe comparison work is merged through #115. The [Studio v0.9-rc.1 candidate](docs/STUDIO-RC-0.9-rc.1.md) records the bounded digital scope and exact-run artifact review; it was published as experimental prerelease [v0.9.0-rc.1](https://github.com/yigit-denktas/stipra/releases/tag/v0.9.0-rc.1) on 19 October 2026. The old #46 identity branch remains parked with four unique commits; it is not an approved identity or safe bulk merge. Native milestone/Project tracking is configured below; #17 records completed board/workflow verification. Library alpha, studio RC/final and style recipe versions have distinct exit evidence; future targets are not automatically published tags.

## Status and priority

| Work | Issue | Status | Release priority |
| --- | --- | --- | --- |
| Prehnite case-study foundation | [#1](https://github.com/yigit-denktas/stipra/issues/1) | **Merged** | Done |
| Vector scene, ink plates and stable recipe v1 | [#2](https://github.com/yigit-denktas/stipra/issues/2) | **Merged** | Done |
| Local PNG/JPEG/WebP and restricted SVG import | [#6](https://github.com/yigit-denktas/stipra/issues/6) | **Merged, 21 Node tests + Chromium smoke** | Done |
| Real spot / CMYK **image-to-mask** separation | [#7](https://github.com/yigit-denktas/stipra/issues/7) | **Implemented — actual continuous-tone masks, edit controls, browser lab and CLI** | Done |
| Raster dot, reverse, line and hybrid screens of masks | [#5](https://github.com/yigit-denktas/stipra/issues/5) | **Implemented — Node/Chromium screen masks, real CLI and browser controls** | Done |
| Native vector facet screening (SVG) | [#28](https://github.com/yigit-denktas/stipra/issues/28) | Planned — separate from raster screens | P1 |
| Full-frame raster plates, native scale and optional external registration marks | [#8](https://github.com/yigit-denktas/stipra/issues/8) | **Native PNG and sampled-path SVG masters verified for frame, DPI, coverage and zero registration; physical observations remain #13** | P0 verification |
| A4 landscape HTML/PDF separation inspection sheet | [#9](https://github.com/yigit-denktas/stipra/issues/9) | **Complete digital report acceptance, reconciled in #91: ink-linked annotations, texture, recipes, ink-dot QR and shared browser writer. Physical observations remain #13** | P0 verification |
| CLI and reproducible agent/batch jobs | [#11](https://github.com/yigit-denktas/stipra/issues/11) | Implemented import/separate/package/scene/render plus compare/batch/verify/sheet; versioned JSON results and per-job evidence | P0 |
| Browser separation studio and edit/solo/overprint controls | [#22](https://github.com/yigit-denktas/stipra/issues/22) | Image workflow implemented with 2–8 passes, solo/mute/paper inspection, native pixel zoom, print geometry and shared marked export; see docs/STUDIO-WORKFLOW.md for acceptance | P0 |
| Input-aware, print-guided **style defaults** | [#34](https://github.com/yigit-denktas/stipra/issues/34) · [#47](https://github.com/yigit-denktas/stipra/issues/47) | **Four shared families plus attributed variants and forest/coast refinements merged in #64/#68; physical validation open** | P1 evidence |
| Print-package formats, proof derivatives and reproducible ZIP | [#12](https://github.com/yigit-denktas/stipra/issues/12) | **PNG/JPG/WebP/SVG/PDF/HTML/ZIP matrix verified through shared browser/CLI writer; sampled vector paths are distinct from analytic screens (#28)** | P0 |
| Golden art, browser accessibility and print QA | [#13](https://github.com/yigit-denktas/stipra/issues/13) | Browser/export tests, 2/3/4-ink mask goldens, odd frames and CLI/format regression evidence implemented; remaining broader/physical acceptance open | P0 release gate |
| Component provenance and commercial-compatible licensing | [#14](https://github.com/yigit-denktas/stipra/issues/14) | Browser exporter source/notice inventory checked; fonteditor removed; one native Skia inventory remains | P0 release gate |
| Quantitative ink diagnostics and future visual overlays | [#10](https://github.com/yigit-denktas/stipra/issues/10) · [#56](https://github.com/yigit-denktas/stipra/issues/56) | **Ink contribution, overlap and LPI implemented in shared browser/CLI engine**; richer visual overlays open | P1 |
| Prehnite crystal seam/proportion polish | [#3](https://github.com/yigit-denktas/stipra/issues/3) | Planned | **Case-study-only, nonblocking** |
| Fine paper fibers/clusters and dirt realism | [#4](https://github.com/yigit-denktas/stipra/issues/4) | Planned | **Optional style extension, nonblocking** |
| GitHub Project/milestone administrative setup | [#17](https://github.com/yigit-denktas/stipra/issues/17) | Configured and verified | Admin, not runtime |

**New dependency ordering:** #22 is the browser studio/UI integration issue; #7 needs completed #6; a grayscale continuous-tone separation is valid before optional halftoning. Raster screening #5 now operates on #7's independently separated masks. True SVG dot geometry is separately tracked in #28. #8 and #9 must not invent new channel maps or change the shared pixel grid. User-facing visual tooling must not wait for #3/#4.

## Keep versus prune

**Keep:** scene/plate geometry and deterministic provenance, original images, isolated ink coverage masks, substrate, registration, controlled imperfection, RGB/CMYK/spot modes, print report, local/browser parity, reproducible CLI, and the bounded p5.js/Canvas alpha in #70, subject to usefulness evidence.

**Prune:** general rendering engine/plugin marketplace, reimplementing a p5.js sketch API, cloud orchestration, arbitrary AI-generated code execution, excessive Prehnite-specific gem work as a precondition for importing images, and physically calibrated Riso claims unsupported by measurements.

**Use compatible existing packages where useful.** Avoid duplicating standard raster codecs, basic SVG support or PDF rendering without a demonstrated need. The implemented thin Canvas/p5.js adapter consumes existing 2D sketches; it must not duplicate p5.js drawing primitives or become a competing sketch runtime. See the separate creative coding alpha plan above.

## Printmaking references and style rules

[The printmaking reading room](docs/references/README.md) connects the [Dizzy Ink interactive guide](https://risograph.co.uk/), its [illustrated studio guide](https://www.dizzyink.co.uk/guide-to-risograph) and [our linked visual studies](docs/references/DIZZY-INK-VISUALS.md) as a credited external resource, with [our independent field notes](docs/references/DIZZY-INK.md) and [conditional design rules](docs/PRINT-DESIGN-RULES.md). These rules should guide #34 preset defaults and #31/#22 interaction choices: safe mask alignment, explicit ink density/overlap, print-size limits, proof-only misregistration, and paper as a separate substrate. Machine-specific 5 mm margins or feed concerns are **references, not globally calibrated Stipra thresholds**. No artwork/code/mirrored pages are redistributed. Review the rule contract before adding automated warnings or “press-ready” claims.

## Identity research and actionable ink diagnostics

The [three-font controlled identity study](docs/BRAND-IDENTITY-STUDY-v2.md) tests IBM Plex Sans Bold, Paper Mono Regular and the *actual* Paper Mono SemiBold, including macron-only coral and original-dotmark integration. No final logo has been approved; the original README SVG remains intact. The [shared plate diagnostics](docs/PLATE-DIAGNOSTICS-v1.md) expose per-ink coverage, pair overlap and effective LPI through browser and print ZIP. Both enable better judgment; neither implies visual or physical acceptance.

## First real-image acceptance fixture set

The [print-package CLI contract](docs/PRINT-PACKAGE-v1.md) now describes the digital raster ZIP, aligned masters, actual output DPI and A4 report; [the private owner-photo batch script](scripts/owner-photo-batch.js) checks original source hashes before it writes any ZIP. These changes do **not** replace visual and physical quality acceptance. The supported digital format matrix is documented in [CLI workflows](docs/CLI-WORKFLOWS.md); analytic vector screening remains separate in #28.


The owner supplied three **private, rights-not-yet-cleared-for-redistribution** photographs (sculpture contours, complex forest installation, and gradient beach horizon). Their **exact hash/dimension metadata and per-image pass/fail criteria** live in [the owner-photo print-package acceptance specification](docs/PRINT-PACKAGE-ACCEPTANCE.md), tracked by [#39](https://github.com/yigit-denktas/stipra/issues/39). This is the common verification gate for #8 masters, #9 A4 reports, #12 ZIP exports and #13 human/physical QA. Digital owner-photo packages and typography specimens have been generated and inspected; that evidence does not close the physical-print gate. See [#39](https://github.com/yigit-denktas/stipra/issues/39) and subsequent quality work [#68](https://github.com/yigit-denktas/stipra/pull/68). Keep per-criterion evidence in the acceptance record rather than inferring physical readiness from automated tests. The original photos are not committed.

## Release acceptance and kill switches

**Acceptance fixture:** Given a rights-cleared full-resolution image, a novice and CLI agent independently select two spot inks, adjust coverage masks, solo/overprint with no crop/reflow, and export two exactly aligned monochrome plates, truthful manifest, A4 landscape report/PDF and self-contained ZIP. Extend test to 3+ inks and CMYK; repeat with text-heavy, transparent, edge-case and malformed inputs.

**Tests:** first usable separation; fidelity and line/text retention; full-frame prepress size/trim/registration; deterministic repeatability with pinned versions; time/peak memory; physical prints on ordinary printers (and Risograph only if physically tested).

**Scope gate:** If the browser+CLI workflow does not beat or materially complement direct licensed tools for that fixed fixture, **do not enlarge Stipra**. Fix or shrink the interface; publish honest limitations. If Kuşluk finds no value, it should not acquire Stipra as a mandatory dependency.

## Licensing and provenance

Stipra-original code is MIT, with individual third-party notices retained. [p5.riso](https://github.com/antiboredom/p5.riso) has a restrictive Anti-Capitalist License; it is **not** a compatible MIT implementation source for copying, vendoring, generated translation or a fork. Study unprotected concepts, standard math and documented visual behavior; create and validate **independent original implementations**. See [licensing notes](docs/LICENSING.md) and [#14](https://github.com/yigit-denktas/stipra/issues/14). Commercial redistribution requires real dependency/asset provenance review.

**Current delivery record (19 October 2026):** report/guide/ink-dot QR, CLI compare/batch/verify and the bounded Studio workflow are merged. PR #98 is merged; stable capability history and the delivery map are implemented. The three lean npm packages are published at alpha.1 and registry-verified. Candidate preparation does not publish another package or GitHub release.

**Published experimental Studio:** [v0.9.0-rc.1](https://github.com/yigit-denktas/stipra/releases/tag/v0.9.0-rc.1), exact source `aec0c23`, has the verified browser archive attached. The owner-supplied live print export passes integrity, dimensions/DPI, grayscale masters, embedded fonts/recipes and two-page visual inspection. This is bounded digital acceptance, not physical or independent human acceptance.

**Use before expanding:** [Morning window](docs/CREATIVE-USE-2026-10-19.md) exercises the published core with deliberate authored inks. Keep green fine marks solid, screen the coral light beam, and preserve the sun/cup contours with hybrid screening. This is an agent-authored trial; independent artist feedback remains open. No Kushluk integration or p5 runtime acceptance is implied.

**Remaining acceptance (#13/#14/#70):** real human keyboard/screen-reader review remains open. Physical-print measurements and independent artist trials are explicitly deferred by the owner, not passed. The owner approved the supplied digital forest/beach specimens; this is not universal Style or print-quality approval. Native compiled-component notices remain unresolved, and [upstream #309](https://github.com/samizdatco/skia-canvas/issues/309) was posted on 19 October. The earlier HTTP 403 and unsent-request notes are historical.

**Artifact checks:** lean tarballs and browser exporter inventories pass their own scoped gates; native CLI/executable/container redistribution remains blocked. Source CLI use is separate from bundling its native dependencies. Frozen recipes/goldens and the existing Skia 3.0.8 backend are retained. [The release contract](docs/RELEASE-CANDIDATE.md) distinguishes digital acceptance, immutable registry archives and native/physical obligations.

**Native tracking (#17):** [Studio v0.9 milestone](https://github.com/yigit-denktas/stipra/milestone/1) holds original issues #1–#14. Existing [private Project #3](https://github.com/users/yigit-denktas/projects/3), its [priority table](https://github.com/users/yigit-denktas/projects/3/views/6), [status board](https://github.com/users/yigit-denktas/projects/3/views/7) and workflow settings are configured and verified. Acceptance gates remain in review. Optional Java hosting, analytic vector screens, identity and paper extensions are not new candidate prerequisites.

**Independent rendering review:** [Evidence and bounded follow-ups](docs/RENDER-BACKEND-REVIEW.md) retain the current backend and native finding. The [v4 experiment and independent replay review](docs/SKIA-V4-EXPERIMENT.md) support image/mask/proof parity. Typography stops are backend probes with no production call sites; paper/PNG identities and audit pins define any future migration. The research analyzer checks attachment semantics explicitly. [Artifact-specific release gates](docs/RELEASE-CANDIDATE.md) now rebuild lean and IIFE/ESM browser artifacts in CI, while native CLI/executable/container delivery remains blocked. A narrow LF checkout rule preserves the pinned MIT notice bytes and hash checks. No upgrade, self-build or native notice clearance has occurred.

**Public history (#98, merged):** permanent capability IDs and typed events power the readable overview. Library publication derives from committed registry verification, separately from GitHub release history. The release-ingestion and explicit Pages-dispatch workflows are implemented and tested; the first live publication event is recorded in [the product history](docs/PRODUCT-HISTORY.md) (history commit `401aeef`, Pages run `39281801339`). Later release-history actions remain explicit.

**Reconstruction research:** [Study 01](docs/RECONSTRUCTION-STUDY-01.md) reruns the bounded #109 pilot across two public-domain photographs and six methods with matched monochrome mark coverage, measured complexity and verified four-tone regions. Independent usefulness/adoption remains open. #113 operator proofs and #114 wider print processes are proposed research in the delivery ledger, with no promised version/date. The original fourteen-issue denominator is unchanged.

**Study review integration:** #109 now records local-tone/spatial errors, separate calibration timing and a deliverable fail-closed replay procedure. The original evidence remains preserved. Windows portability concerns are tracked separately from host restrictions; Experiment 2 and adapter adoption remain undecided.

**Study delivery:** #109 metric/replay regressions now have a CI gate. Original ZIP PDF identity and the standalone C2PA-appended delivery identity are separately verified; prior evidence is unchanged.

**Audit reconciliation (20 October 2026):** A/B maintenance branches are prepared and independently reviewed but unmerged; no merge is authorized. C proposes one #13 owner-photo acceptance child covering G01–G11 plus A1–C5, with private evidence and no acceptance pass implied. #13/#14/#70/#109 remain open; Experiment 2 and #113/#114 are separate proposals.
