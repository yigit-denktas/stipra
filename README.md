<div align="center">

  <h1>Stiprā</h1>

  <p>A programmable printmaking studio.</p>

  <img src="logo_for_Readme.svg" alt="Original Stiprā dotmark: five rows of colored stippling dots" width="100%" />

  <p><sub><strong>Stiprā</strong> /ˈstip.raː/ <em>adj., Latvian</em> — feminine definite form of <em>stiprs</em>, “strong.”<br/>Also shaped by <em>stippling</em> + <em>strata</em>: dots arranged in layers.</sub></p>

  <p><strong>Separate the inks. Keep the imperfections.</strong></p>

  [![Development](https://img.shields.io/badge/status-experimental%20alpha-30343b?style=flat-square)](ROADMAP.md)
  [![License MIT](https://img.shields.io/badge/code-MIT-006043?style=flat-square)](LICENSE)
  [![Node 20+](https://img.shields.io/badge/Node.js-20%2B-0D4DAD?style=flat-square)](package.json)
  [![Local-first](https://img.shields.io/badge/local--first-no%20API%20fees-FF665D?style=flat-square)](docs/ARCHITECTURE.md)
  [![v0.9 issues](https://img.shields.io/badge/issues-v0.9%20backlog-424b55?style=flat-square)](https://github.com/yigit-denktas/stipra/issues)

</div>

**Stiprā** is a local-first printmaking studio and experimental JavaScript library. Bring a photograph, handmade illustration or Canvas/p5.js drawing; separate it into spot inks or CMYK, or supply the ink masks yourself. Inspect each pass, adjust its screen, and export aligned plates with a reproducible recipe. Keep drawing in your existing tools.

The macron belongs to the display name; the repository, URL and CLI use `stipra`.

**[Open the studio](https://apps.yigitdenktas.com/stipra/) · [Canvas/p5.js examples](https://apps.yigitdenktas.com/stipra/sketches/) · [Reproduction guide](https://apps.yigitdenktas.com/stipra/guide/) · [Getting started](docs/GETTING-STARTED.md)**

## Try it

The **browser studio** processes supported PNG, JPEG, WebP and restricted SVG locally. Choose a shared Style or edit spot/CMYK masks, inspect the proof and individual plates, and save a print-package ZIP. No account or image API is needed. See [input limits](docs/IMPORT.md).

For creative coding, the [core API](packages/core/README.md) accepts sRGB pixels or authored ink coverage. The optional [Canvas/p5 adapter](packages/canvas/README.md) applies Stiprā in a **2D** sketch, freezes its source frame and exports aligned plates. The `@yigit-denktas/stipra-*` packages are published at `0.1.0-alpha.1`.

Prefer a script? With Node.js 20+ installed:

```sh
npm install
npm run prepare:fonts
node bin/stipra.js separate \
  --input artwork.png \
  --config examples/recipes/spot-photo.json \
  --screen examples/recipes/screens-spot.json \
  --out out/my-first-print
```

This creates grayscale plates, previews, recipes and provenance without changing the original. The [print-package command](docs/PRINT-PACKAGE-v1.md) produces a ZIP with aligned masters, an A4 PDF/HTML inspection report, diagnostics and normalized recipes. Use a fresh output directory.

## Where we are

**Implemented:** local import, spot/CMYK masks, raster screening, [shared Styles](docs/STYLES-v1.md) and opt-in forest contrast, LPI/DPI settings, ink diagnostics, browser/CLI packages, a lean core, Canvas/p5 integration and authored-ink replay. [Prehnite](examples/prehnite-v8/) and native vector scenes remain separate paths.

**Digital evidence:** [the alpha evaluation](docs/CREATIVE-CODING-ALPHA.md) records performance, compatibility, bundle sizes and six browser/Node/CLI export-parity cases. Large renders are synchronous; cache proofs and use bounded drafts.

**Delivery:** [Dependency/version map](https://apps.yigitdenktas.com/stipra/roadmap/) · [Changelog](https://apps.yigitdenktas.com/stipra/changelog/) · [Site map](https://apps.yigitdenktas.com/stipra/sitemap/). [Studio workflow](docs/STUDIO-WORKFLOW.md): 2–8 inks, solo/mute/paper, native pixel zoom and print geometry.

**Structured inputs:** named regions → physical inks and opt-in frozen source projects are implemented locally (#83/#84). [Try the region example](https://apps.yigitdenktas.com/stipra/regions/). [Contracts and evidence](docs/STRUCTURED-INPUTS.md) cover replay, the bounded OpenRaster/auxiliary pilots and local C2PA feasibility (#85/#86); native Apple/EXR and browser credentials remain deferred.

**CLI:** [Compare, batch, export and verify](docs/CLI-WORKFLOWS.md), with JSON results, optional proof formats and sampled-path SVG plates.

**Acceptance:** [Release gates](docs/RELEASE-CANDIDATE.md). Physical/artist review and the [native notice gap](docs/DEPENDENCY-AUDIT.md) remain open. The [v4 experiment](docs/SKIA-V4-EXPERIMENT.md) supports image parity; paper/PNG migration is deferred. Previews are **digital approximations**; branding is provisional.

## Follow the work

The [roadmap](ROADMAP.md), [alpha tracker #70](https://github.com/yigit-denktas/stipra/issues/70) and [issues](https://github.com/yigit-denktas/stipra/issues) distinguish implementation, validation and publication. Keep original photographs and image-bearing packages private unless redistribution is authorized.

[Design principles](DESIGN.md) · [Printmaking rules](docs/PRINT-DESIGN-RULES.md) · [Reference library](docs/references/README.md) · [Architecture](docs/ARCHITECTURE.md)

To contribute, read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Stiprā-authored code is [MIT-licensed](LICENSE), with [third-party notices and asset exceptions](docs/LICENSING.md).

**Make a mark. Choose its ink. See what happens when the layers meet.**
