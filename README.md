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

**Stipra** is a small, open-source printmaking studio for exploring how images become layers of ink. Bring a photograph or illustration, try a spot-color separation, change what each ink prints, and see what happens when the layers meet. The same process can be driven from a browser or a command line.

Riso is where we're starting. We care as much about **why** an image should be separated a certain way as how many effects we can apply to it.

**[Open the studio ↗](https://apps.yigitdenktas.com/stipra/) · [Getting started](docs/GETTING-STARTED.md) · [Roadmap](ROADMAP.md) · [Design principles](DESIGN.md)**

## Try it

The **[browser studio](https://apps.yigitdenktas.com/stipra/)** processes your images locally. Drop in a PNG, JPEG, WebP, or supported SVG; choose two spot inks or CMYK; adjust actual grayscale ink masks and their dot, line, reverse or hybrid screens. Compare the artwork with the digital overprint and the individual plates. No account or image API needed.

Prefer a script? With Node.js 20+ installed:

```sh
npm install
node bin/stipra.js separate \
  --input artwork.png \
  --config examples/recipes/spot-photo.json \
  --screen examples/recipes/screens-spot.json \
  --out out/my-first-print
```

That creates separate grayscale plates, previews, recipes and a provenance manifest without changing the original. Use a fresh output directory for each run. The [getting-started guide](docs/GETTING-STARTED.md) has CMYK, procedural art, local browser and CLI examples.

## Where we are

**Working today:** image import, independent spot/CMYK coverage masks, adjustable raster screening, digital overprint previews, the browser lab, CLI recipes, and deterministic vector scene/plate examples. The [Prehnite](examples/prehnite-v8/) experiment is where it began.

**Coming next:** physical print-size checks and aligned production masters [#8](https://github.com/yigit-denktas/stipra/issues/8), an A4 separation sheet [#9](https://github.com/yigit-denktas/stipra/issues/9), a more complete browser workspace [#22](https://github.com/yigit-denktas/stipra/issues/22), and useful, input-aware style defaults [#34](https://github.com/yigit-denktas/stipra/issues/34).

Our previews are **digital approximations**, not guarantees of real ink color, registration, or printer calibration.

## Follow the work

**v0.9 — 5 of the original 14 issues completed (35.71% by issue count).** This is a transparent backlog count, *not* a measure of engineering effort or readiness to print. Check the [roadmap](ROADMAP.md) and [open issues](https://github.com/yigit-denktas/stipra/issues) for current progress and priorities.

We're keeping the project intentionally small: make one image-to-print workflow genuinely good before building dozens of filters. [Stipra's design brief](DESIGN.md) explains what we want the experience to feel like, while the [printmaking rules](docs/PRINT-DESIGN-RULES.md) and [research library](docs/references/README.md) keep the craft knowledge and sources out of the README.

Want to help? Open an [issue](https://github.com/yigit-denktas/stipra/issues), read [CONTRIBUTING.md](CONTRIBUTING.md), or follow [AGENTS.md](AGENTS.md) if you're working through an agent. The [technical docs](docs/ARCHITECTURE.md) cover the renderer and data model.

Stipra-authored code is [MIT-licensed](LICENSE), with [third-party notices and asset exceptions](docs/LICENSING.md).

**Make a mark. Choose its ink. See what happens when the layers meet.**
