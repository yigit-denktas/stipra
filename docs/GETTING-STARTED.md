# Getting started with Stiprā

Stiprā is an MIT-authored local-first printmaking experiment. You can try the [browser studio](https://apps.yigitdenktas.com/stipra/) right away, or automate image separation through a Node 20+ CLI. The live studio supports image import, spot/CMYK continuous-tone separation, raster screens and digital overprint previews. It is **not** a calibrated printer RIP or an A4 production-package generator yet.

## The browser

Visit **[apps.yigitdenktas.com/stipra/](https://apps.yigitdenktas.com/stipra/)**. Drop a PNG, JPEG, WebP or supported restricted SVG, choose two spot inks or CMYK, edit the actual coverage and screening controls, and inspect source / overprint / separate plates. Images are processed locally in your browser; they are not uploaded to a server.

To run the app from source:

```sh
git clone https://github.com/yigit-denktas/stipra.git
cd stipra
python -m http.server 8080
```

Then open [localhost:8080/web/stipra/](http://localhost:8080/web/stipra/). The Pages deployment is built from this same source using `npm run build:pages`; generated `dist/` stays out of Git.

Other **engineering examples**, not separate deployed applications:

- [Image importer](../examples/import-studio/): local probing, EXIF orientation and supported geometric SVGs.
- [Prehnite v8](../examples/prehnite-v8/): the six-colorway procedural print study that started the project.
- [Vector scene](../examples/scene-contract/): composite SVG and fixed-coordinate ink plate geometry.

## The CLI

Install the dependencies with Node.js 20+:

```sh
npm install
```

Separate an image into **two independent spot-ink masks**:

```sh
node bin/stipra.js separate \
  --input path/to/artwork.png \
  --config examples/recipes/spot-photo.json \
  --out out/spot-print
```

Add a **deterministic screen** to those actual masks:

```sh
node bin/stipra.js separate \
  --input path/to/artwork.png \
  --config examples/recipes/spot-photo.json \
  --screen examples/recipes/screens-spot.json \
  --out out/screened-spot
```

Use **CMYK** instead:

```sh
node bin/stipra.js separate \
  --input path/to/artwork.png \
  --config examples/recipes/cmyk-photo.json \
  --screen examples/recipes/screens-cmyk.json \
  --out out/screened-cmyk
```

The separated output includes an untouched original, a normalized PNG, a composite proof, full-frame grayscale masks, and structured recipes and provenance. `--screen` adds screened versions and their own preview/recipe. All modes refuse to overwrite existing files. **Use an unused output directory for each new render**.

The CLI also has the existing procedural and import utilities:

```sh
node bin/stipra.js presets
node bin/stipra.js render --preset 01 --format png,svg --plates --out out/prehnite
node bin/stipra.js scene --config examples/recipes/spot-shapes.json --out out/scene
node bin/stipra.js import --input path/to/artwork.png --out out/import
```

## For agents and contributors

A reproducible result needs **source input + ink recipe + optional screen recipe + version/seed + output dimensions**, with original image provenance. Do not silently modify accepted output or pass arbitrary uploaded code to an evaluator.

Useful contracts:
- [Image importer](IMPORT.md): accepted formats, bounded input and EXIF handling.
- [Image separation](IMAGE-SEPARATION-v1.md): actual coverage masks and spot/CMYK recipes.
- [Screening](SCREENING-v1.md): raster dot, reverse, line, hybrid patterns and per-ink offsets.
- [Vector recipe](RECIPE-v1.md): scene/plate geometry and SVG exports.
- [Architecture](ARCHITECTURE.md) and [Design brief](../DESIGN.md).
- [AGENTS.md](../AGENTS.md): issue, PR and evidence workflow; [CONTRIBUTING](../CONTRIBUTING.md): human contribution details.

To check changes locally:

```sh
npm test
npm run build:pages
```

Production-size masters, A4 HTML/PDF separation sheets, automatic **Stipra Styles** and finished agent batch tooling remain on the [roadmap](../ROADMAP.md). Physical printing requires additional real-machine tests and appropriately rights-cleared source images.
