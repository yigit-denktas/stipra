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

A picture is one thing. A print is what happens when you pull it apart.

Stipra is a small workshop for doing just that: experimenting with color, turning artwork into ink layers, and seeing how those layers come together on paper. You can make something from simple shapes or bring an image of your own. The longer-term idea is to move freely between a browser workspace and scripts, without losing control of the individual plates.

**We're building it in the open.** The drawing tools, vector plates, image importer, editable spot/CMYK masks **and digital ink screening** now work. The A4 separation report and complete *image → print package* workflow come next.

**[Try what's working](#try-it) · [See the plan](#where-were-going) · [Explore the code](#inside-the-workshop)**

---

## Try it

**The Separation Lab is the public app**, built automatically for Cloudflare Pages. The remaining browser pages below are engineering examples you can still run locally; they aren't separate deployed applications.

### In your browser

Clone the repository and serve it locally:

```sh
git clone https://github.com/yigit-denktas/stipra.git
cd stipra
python -m http.server 8080
```

The published application lives at **[apps.yigitdenktas.com/stipra/](https://apps.yigitdenktas.com/stipra/)**. The other experiments remain available when running the repository locally:

| Open | What you'll find |
| --- | --- |
| **[Stipra app](https://apps.yigitdenktas.com/stipra/)** | Drop an image, choose two spot inks or CMYK, adjust real grayscale coverage masks and inspect the overprint. Adjust screens, pitch, ink angles and registration; download real grayscale plates and both recipes. **Digital screening, not press-calibrated.** |
| **[Image importer](http://localhost:8080/examples/import-studio/)** | Drop a PNG, JPEG, WebP, or supported geometric SVG. Inspect its size and metadata, preview it, and download a normalized PNG. |
| **[Prehnite print experiment](http://localhost:8080/examples/prehnite-v8/)** | An experimental editor with six colorways, print textures, and a working procedural renderer. This is where Stipra started, not the finished studio UI. |
| **[Vector plates demo](http://localhost:8080/examples/scene-contract/)** | One scene viewed as a composite and as separate, aligned vector ink plates. |

The Stipra app is also available locally at [web/stipra/](web/stipra/index.html) when you serve the cloned repository. The importer runs in the browser without sending your artwork to a service. The SVG importer intentionally accepts a limited set of geometric shapes and rejects unsupported features instead of silently changing them. See [supported formats and limits](docs/IMPORT.md).

### From your terminal

With Node.js 20 or newer:

```sh
npm install

# Explore the six existing procedural presets
node bin/stipra.js presets

# Render a Prehnite example and its simulated plates
node bin/stipra.js render --preset 01 --format png,svg --plates --out out/prehnite

# Render a separate, recipe-driven vector scene
node bin/stipra.js scene --config examples/recipes/spot-shapes.json --out out/scene

# Inspect and normalize one local image
node bin/stipra.js import --input path/to/artwork.png --out out/import

# Create two real editable spot-ink coverage plates from an image
node bin/stipra.js separate --input path/to/artwork.png --config examples/recipes/spot-photo.json --out out/separation

# Apply deterministic dot/reverse/hybrid screens to those real ink masks
node bin/stipra.js separate --input path/to/artwork.png --config examples/recipes/spot-photo.json --screen examples/recipes/screens-spot.json --out out/screened
```

Each command writes local files. The scene renderer produces an SVG composite, individual SVG plates, a normalized recipe, and a manifest. The importer keeps the original bytes alongside its normalized PNG and metadata; it refuses to overwrite existing outputs, so use a new output directory when repeating an import.

The `separate` command also supports four-ink CMYK using [its sample recipe](examples/recipes/cmyk-photo.json). Each separation produces a full-resolution grayscale mask per ink, a digital color proof, the original source and a manifest. Read the [separation contract](docs/IMAGE-SEPARATION-v1.md) and [screening documentation](docs/SCREENING-v1.md) for exact controls, export formats and limitations.

If you're an agent or you're building a tool around Stipra, those explicit inputs and outputs are the point: artwork should be possible to inspect, revise, and reproduce without manually clicking through the same steps.

## The part we're working toward

Picture dropping in a photograph, choosing two or three inks, and getting to decide **which marks belong to which ink**. You could soften one plate, sharpen another, try different dots or line screens, and see the overprint change. When you're happy, you'd take away the plates *and* a sheet showing how the print was put together.

That means more than giving an image a vintage color filter. The separation has to live in the actual ink-coverage masks, not just in the colors of a preview.

A finished Stipra job should make it easy to see:

- **The artwork** — the original alongside an honest preview of the result.
- **The inks** — independently adjustable coverage masks, with the same dimensions and alignment.
- **The paper** — its own surface and texture, never mistaken for an extra ink.
- **The output** — individual masters, print settings, a separation sheet, and the recipe needed to make it again.

Risograph-inspired printing is our starting point, not the limit of the layering model. Other graphic techniques can belong here when they genuinely benefit from the same separation, screening, and export workflow.

## Where it stands

| Ready to explore | Still in progress |
| --- | --- |
| Prehnite's six-colorway procedural case study | A unified production-grade workspace and print-ready export package |
| A versioned vector scene with aligned SVG plates | Native SVG **vector dot geometry** for procedural artwork (separate [#28](https://github.com/yigit-denktas/stipra/issues/28)) |
| Local import of PNG, JPEG, WebP, and a restricted SVG subset | Production-grade registration marks and calibrated press-oriented masters |
| **Real spot and CMYK masks with dot, line, reverse, and hybrid raster screens**; browser and CLI controls | One cohesive production studio, A4 separation reports, production bundles and full agent batches |
| A Node CLI, normalized recipes, manifests, source provenance and tests | Physical printer calibration and advanced report/export verification |

These are not interchangeable checkmarks. We **can** turn an imported photograph into individual, full-frame ink masks and apply deterministic raster screening. We **cannot yet** turn them into a calibrated, independently verified, complete prepress package. Nor do we claim that a digital overprint preview is calibrated to a physical Risograph machine.

### Where we're going

Our [**v0.9 roadmap**](ROADMAP.md) is deliberately focused on finishing one useful journey instead of inventing another graphics platform:

1. [**Separate the image**](https://github.com/yigit-denktas/stipra/issues/7) into editable spot or CMYK ink-coverage masks. **Implemented.**
2. [**Give the masks a screen**](https://github.com/yigit-denktas/stipra/issues/5), with controllable dots, lines, knockouts, and registration. **Implemented for raster masks.**
3. [**Export aligned masters**](https://github.com/yigit-denktas/stipra/issues/8) and build a [**real browser workspace**](https://github.com/yigit-denktas/stipra/issues/22).
4. [**Make the separation sheet**](https://github.com/yigit-denktas/stipra/issues/9): an A4 landscape HTML/PDF report with the composite, paper, each ink, and useful production details.
5. [**Make it repeatable**](https://github.com/yigit-denktas/stipra/issues/11) through the CLI, finished export packages, and honest visual/print tests.

The roadmap is where we track dependencies, what we've decided *not* to build, and the evidence required before calling v0.9 usable. **Five of the original fourteen implementation issues are merged, including raster ink screening. That is an issue count, not a percentage of total engineering effort.**

## Inside the workshop

Stipra grew out of **Prehnite Riso Studio v8**, a small procedural art experiment. We kept its working presets rather than throwing them away, then built a more general scene-and-plate contract and a separate image-import layer around it.

The guiding idea is simple: **the drawing, the ink, and the paper are different things.** We are also gathering real print-shop knowledge—from [Dizzy Ink's Risograph guide](https://risograph.co.uk/) and other attributed sources—to make future style presets useful instead of leaving people with dozens of poorly chosen settings. A misregistered plate can move without bending the shapes underneath it. Every plate should keep the same canvas, trim, and origin. A browser preview and a scripted export should agree about what is actually being printed.

The code is split along those lines:

| If you're looking for… | Start here |
| --- | --- |
| The procedural example | [Prehnite v8](examples/prehnite-v8/) |
| The reusable vector scene and recipe format | [Recipe v1](docs/RECIPE-v1.md) · [Core](src/core.js) |
| Image decoding and source metadata | [Import contract](docs/IMPORT.md) · [Source](src/import/) |
| Spot/CMYK coverage masks and real image-to-ink mapping | [Separation v1](docs/IMAGE-SEPARATION-v1.md) · [Engine](src/separation.js) |
| Raster screens, paper knockouts and per-ink registration | [Screening v1](docs/SCREENING-v1.md) · [Screen engine](src/screening.js) |
| What a separation report should contain | [Separation-sheet specification](docs/SEPARATIONS.md) |
| How the parts should eventually fit together | [Architecture](docs/ARCHITECTURE.md) · [Roadmap](ROADMAP.md) |
| Printmaking field notes and practical design rules | [Reference reading room](docs/references/README.md) · [Printmaking rules](docs/PRINT-DESIGN-RULES.md) |

Stipra isn't trying to become p5.js, and it isn't a fork of p5.riso. We can use compatible tools and established printmaking techniques without copying restrictively licensed implementations. Any future p5.js adapter would be optional, with its own licensing requirements.

## Make something with us

If a separation comes out wrong, a browser control is confusing, or a printed proof doesn't match its plates, we'd like to know. Small, reproducible examples are especially useful. Start with the [issues](https://github.com/yigit-denktas/stipra/issues), read [CONTRIBUTING.md](CONTRIBUTING.md), or follow the project's [agent and testing conventions](AGENTS.md).

Stipra-authored source code is [MIT-licensed](LICENSE), with separate terms for some dependencies, fonts, and identity assets. The [licensing and provenance notes](docs/LICENSING.md) explain those boundaries. This is local-first software; there is no required account, cloud renderer, paid subscription, or image-generation API.

**Make a mark. Choose its ink. See what happens when the layers meet.**
