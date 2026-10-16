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

**We're building it in the open.** The first drawing tools, vector plates, and image importer work today. The complete *image → editable separations → print package* workflow is what we're building next.

**[Try what's working](#try-it) · [See the plan](#where-were-going) · [Explore the code](#inside-the-workshop)**

---

## Try it

There are three ways to explore Stipra right now. They are deliberately separate experiments; you don't need to understand the entire project to use one.

### In your browser

Clone the repository and serve it locally:

```sh
git clone https://github.com/yigit-denktas/stipra.git
cd stipra
python -m http.server 8080
```

Then open one of these pages:

| Open | What you'll find |
| --- | --- |
| **[Image importer](http://localhost:8080/examples/import-studio/)** | Drop a PNG, JPEG, WebP, or supported geometric SVG. Inspect its size and metadata, preview it, and download a normalized PNG. **No color separation yet.** |
| **[Prehnite print experiment](http://localhost:8080/examples/prehnite-v8/)** | An experimental editor with six colorways, print textures, and a working procedural renderer. This is where Stipra started, not the finished studio UI. |
| **[Vector plates demo](http://localhost:8080/examples/scene-contract/)** | One scene viewed as a composite and as separate, aligned vector ink plates. |

The importer runs in the browser without sending your artwork to a service. The SVG importer intentionally accepts a limited set of geometric shapes and rejects unsupported features instead of silently changing them. See [supported formats and limits](docs/IMPORT.md).

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
```

Each command writes local files. The scene renderer produces an SVG composite, individual SVG plates, a normalized recipe, and a manifest. The importer keeps the original bytes alongside its normalized PNG and metadata; it refuses to overwrite existing outputs, so use a new output directory when repeating an import.

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
| Prehnite's six-colorway procedural case study | Automatic, **editable** spot-ink and CMYK separations from imported images |
| A versioned vector scene with aligned SVG plates | Halftone, reverse-dot, and hybrid screening for real masks |
| Local import of PNG, JPEG, WebP, and a restricted SVG subset | One cohesive browser studio for adjusting and comparing layers |
| A basic Node CLI, manifests, and automated tests | A4 HTML/PDF separation sheets, production bundles, and full agent-driven batch workflows |

These are not interchangeable checkmarks. The existing **vector** plates are real outputs of the geometric scene engine; we cannot yet take an arbitrary photograph and automatically turn it into a finished set of printing plates. Nor do we claim that a digital overprint preview is calibrated to a physical Risograph machine.

### Where we're going

Our [**v0.9 roadmap**](ROADMAP.md) is deliberately focused on finishing one useful journey instead of inventing another graphics platform:

1. [**Separate the image**](https://github.com/yigit-denktas/stipra/issues/7) into editable spot or CMYK ink-coverage masks.
2. [**Give the masks a screen**](https://github.com/yigit-denktas/stipra/issues/5), with controllable dots, lines, knockouts, and registration.
3. [**Export aligned masters**](https://github.com/yigit-denktas/stipra/issues/8) and build a [**real browser workspace**](https://github.com/yigit-denktas/stipra/issues/22).
4. [**Make the separation sheet**](https://github.com/yigit-denktas/stipra/issues/9): an A4 landscape HTML/PDF report with the composite, paper, each ink, and useful production details.
5. [**Make it repeatable**](https://github.com/yigit-denktas/stipra/issues/11) through the CLI, finished export packages, and honest visual/print tests.

The roadmap is where we track dependencies, what we've decided *not* to build, and the evidence required before calling v0.9 usable. **Three of the original fourteen implementation issues have been merged; that is an issue count, not a claim that the product is 21% finished.**

## Inside the workshop

Stipra grew out of **Prehnite Riso Studio v8**, a small procedural art experiment. We kept its working presets rather than throwing them away, then built a more general scene-and-plate contract and a separate image-import layer around it.

The guiding idea is simple: **the drawing, the ink, and the paper are different things.** A misregistered plate can move without bending the shapes underneath it. Every plate should keep the same canvas, trim, and origin. A browser preview and a scripted export should agree about what is actually being printed.

The code is split along those lines:

| If you're looking for… | Start here |
| --- | --- |
| The procedural example | [Prehnite v8](examples/prehnite-v8/) |
| The reusable vector scene and recipe format | [Recipe v1](docs/RECIPE-v1.md) · [Core](src/core.js) |
| Image decoding and source metadata | [Import contract](docs/IMPORT.md) · [Source](src/import/) |
| What a separation report should contain | [Separation-sheet specification](docs/SEPARATIONS.md) |
| How the parts should eventually fit together | [Architecture](docs/ARCHITECTURE.md) · [Roadmap](ROADMAP.md) |

Stipra isn't trying to become p5.js, and it isn't a fork of p5.riso. We can use compatible tools and established printmaking techniques without copying restrictively licensed implementations. Any future p5.js adapter would be optional, with its own licensing requirements.

## Make something with us

If a separation comes out wrong, a browser control is confusing, or a printed proof doesn't match its plates, we'd like to know. Small, reproducible examples are especially useful. Start with the [issues](https://github.com/yigit-denktas/stipra/issues), read [CONTRIBUTING.md](CONTRIBUTING.md), or follow the project's [agent and testing conventions](AGENTS.md).

Stipra-authored source code is [MIT-licensed](LICENSE), with separate terms for some dependencies, fonts, and identity assets. The [licensing and provenance notes](docs/LICENSING.md) explain those boundaries. This is local-first software; there is no required account, cloud renderer, paid subscription, or image-generation API.

**Make a mark. Choose its ink. See what happens when the layers meet.**
