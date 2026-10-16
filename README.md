<div align="center">

  <h1>stipra</h1>

  <p>A programmable printmaking studio.</p>

  <img src="logo_for_Readme.svg" alt="Original Stipra dotmark: five rows of colored stippling dots" width="100%" />

  <p><sub>Stippling + strata: dots organized into layers.</sub></p>

  <p><strong>Separate the inks. Keep the imperfections.</strong></p>

  [![Development](https://img.shields.io/badge/status-v0.9%20in%20development-30343b?style=flat-square)](ROADMAP.md)
  [![License MIT](https://img.shields.io/badge/code-MIT-00765a?style=flat-square)](LICENSE)
  [![Node 20+](https://img.shields.io/badge/Node.js-20%2B-2157a6?style=flat-square)](package.json)
  [![Local-first](https://img.shields.io/badge/local--first-no%20API%20fees-d05754?style=flat-square)](docs/ARCHITECTURE.md)
  [![v0.9 issues](https://img.shields.io/badge/issues-v0.9%20backlog-424b55?style=flat-square)](https://github.com/yigit-denktas/stipra/issues)

</div>

## What is Stipra?

**Stipra** is a local-first, programmable printmaking studio for generative artwork, halftone color separation, ink simulation, and reproducible prepress workflows.

*Stippling + strata*: individual marks arranged into layers, then combined into a print.

**Two related but distinct jobs:**

- **Create** — Procedural artwork with controllable facets, geometry, typography, print grain, spot inks, halftone dots, and registration.
- **Separate** — Accept images or structured graphics, estimate or map independent ink plates, inspect overprints, and produce consistent prepress exports and beautiful separation sheets.

The latter is the main **v0.9 work**. A generic geometric scene/plate contract is now implemented, but imported-image separation is not finished. An imported photograph has no recoverable original printing plates; its separations are editable estimates.

## Start with the working case study

The initial source comes from **Prehnite Riso Studio v8**, an experimental but runnable procedural lockup engine. It has six palettes, a browser editor, deterministic Node-compatible scenes, a spot-ink plate model, and SVG/raster rendering.

| Entry point | Status | Location |
|---|---|---|
| Procedural engine | Working case-study source | [examples/prehnite-v8/src/engine.js](examples/prehnite-v8/src/engine.js) |
| Interactive browser editor | Experimental, modular; browser QA pending | [examples/prehnite-v8/index.html](examples/prehnite-v8/index.html) |
| Preset renderer and agent CLI | Foundation integration | [bin/stipra.js](bin/stipra.js) |
| Generic vector scene/plate v1 | **Implemented contract + SVG demo** | [Recipe contract](docs/RECIPE-v1.md) |
| PNG/JPEG/WebP + restricted SVG import | **Local adapters + inspector** | [Image import contract](docs/IMPORT.md) |
| Editable auto-separation / CMYK | **Planned v0.9** | [Roadmap](ROADMAP.md) |
| A4 separation reports / full prepress | **Planned v0.9** | [Separation contract](docs/SEPARATIONS.md) |

To try the existing renderer, use Node 20+:

~~~bash
npm install
npm test
node bin/stipra.js presets
node bin/stipra.js render --preset 01 --format png,svg,webp --plates --out out
node bin/stipra.js render --preset all --format png --out out
# Generic deterministic vector scene (independent of Prehnite)
node bin/stipra.js scene --config examples/recipes/spot-shapes.json --out out/scene
# Local file input (independent of ink separation)
node bin/stipra.js import --input ./my-image.png --out out/import
~~~

To use the modular browser example, serve the repository locally (rather than opening its HTML through a restricted file URL):

~~~bash
python -m http.server 8080
# open http://localhost:8080/examples/prehnite-v8/
~~~

No hosted inference or paid SaaS is required. Raster CLI output uses the local open-source skia-canvas package. The renderer is for design exploration; its simulated plates are **not automatically calibrated to a particular Risograph machine**.

For browser-based **local image import**, open [the drag/drop inspector](examples/import-studio/index.html) from the same local HTTP server. It preserves pixels and geometry, but does not yet split images into ink masters.

The generic v1 scene exports a colored composite, aligned monochrome plates, normalized JSON, and a manifest, without a raster dependency. Serve the repo over local HTTP and open [the scene contract browser demo](examples/scene-contract/index.html) to switch between the same physical plates.

## Roadmap · v0.9

| Track | Intended result | Progress |
|:--|:--|:--|
| Foundation | Adopt and preserve Prehnite v8 renderer | Completed (#1) |
| Geometry & paper | Crisp shared edges, corrected proportions, clustered contamination | Planned |
| Image import | PNG, JPEG, WebP, restricted SVG; aspect/alpha/EXIF metadata | Implemented adapter (#6); browser QA pending |
| Ink plates | Vector spot-ink scene contract and fixed-coordinate solid plates | Contract implemented (#2); raster/CMYK planned |
| Separation sheets | Beautiful A4 HTML/PDF reports + individually inspectable plates | Planned |
| Diagnostics | HSL/coverage overlays, coverage estimates, reproducible seeds | Planned |
| Exports | SVG, PNG, JPG, WebP, PDF + production ZIP | Planned |
| CLI & automation | Machine-readable recipes, batch jobs, reproducible manifests | Planned |
| Quality gates | Golden images, deterministic tests, accessibility and print QA | Planned |

See the [granular project roadmap](ROADMAP.md) and [v0.9 issues](https://github.com/yigit-denktas/stipra/issues). Planned does **not** mean implemented.

## Color language

Our first case study includes six paper/ink systems: evergreen + coral / ivory, midnight + ochre / natural, cobalt + pink + mint / blush, moss + dusty rose / natural, indigo + vermilion / warm gray, and black + fluorescent lime / ivory. Spot inks and substrate are modeled independently. **Paper is not a printing plate.**

## Engineering principles

- One scene/plate model should power Canvas previews, true-vector SVG, CLI and physical plate exports.
- Geometry stays straight; print imperfections belong to paper and **ink coverage**, not arbitrary vertex deformation.
- Separations never reflow individual components: all plates share trim, scale and origin.
- Reference segmentation is diagnostic only, never secretly substituted for procedural generation.
- Every render records seeds, ink names, plate settings, dimensions, and output paths.
- Licenses and bundled assets are audited before distribution; do not import restrictive p5.riso code into the MIT core.

Read [Architecture](docs/ARCHITECTURE.md), [Image import](docs/IMPORT.md), [Recipe v1](docs/RECIPE-v1.md), [Separation sheet specification](docs/SEPARATIONS.md), [v0.9 brief](docs/BRIEF-v9.md), and [Licensing](docs/LICENSING.md).

## Contributing

Issues should be reproducible, scoped and linked to branches/PRs. See [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

Stipra is MIT-licensed; the included Inter-derived vector glyph outlines retain their separate [SIL OFL 1.1 terms](LICENSES/OFL-1.1.txt).