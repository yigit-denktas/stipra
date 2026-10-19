# Reconstruction Study 01

Executed 19 October 2026 for #109. This is a controlled research pilot, not six new product modes. #113 and #114 remain proposed work in the same delivery ledger; the original fourteen-issue v0.9 denominator is unchanged.

## Sources and controls

Two real photographs are used: NASA's portrait of Eileen Collins, distributed as the public-domain [scikit-image astronaut dataset](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut), and Noclip's [Capitol Building Full View](https://commons.wikimedia.org/wiki/File:Capitol_Building_Full_View.jpg), released worldwide into the public domain by its author. No private owner photograph, image generation or substitute illustration is used. Original source hashes and dimensions are recorded in [the evidence](evidence/reconstruction-study-01.json). Credit is retained even where not required.

Every method receives the same full-frame normalized image: longest edge capped at 600 pixels (smaller sources are not upscaled), Lanczos resampling explicitly declared, no crop or stretch. Comparison panels have the same 90 mm longest edge within each source. The architecture's panoramic composition remains panoramic. The existing two-ink Stiprā proof is a baseline, not a claim of calibrated printing. Grayscale reconstruction methods do not preserve source color; the four-level vector study deliberately shows grayscale rather than pretending to match the spot-ink baseline.

## Executed methods and observed tradeoffs

| Method | Actual representation | Observation / decision |
| --- | --- | --- |
| Weighted Voronoi stippling | 3,000 circle sites; nine weighted Lloyd iterations using SciPy cKDTree; seed 109 | Spatially editable dots, but sparse marks still lose small portrait/architectural detail. Keep as research, not a default. |
| Directional hatching | Short line paths oriented along local Sobel iso-tone directions; density controls length/width | Useful drawing vocabulary; weak gradients produce noisy directions. Investigate smoothing/coherent fields before adoption. |
| Continuous line | 600 sampled sites joined by a greedy nearest-neighbor route | Long jumps and crossings obscure the subject. Reject this naive route as a product feature. It is not an optimized TSP solution or plotter-ready path. |
| Vector regions | Isolated VTracer 0.6.15 polygon contours from a four-level grayscale image | Strong silhouette/large-form readability and real polygon regions. Most promising isolated adapter; shadow flattening and lost fine details remain visible. |
| Dithering | Pillow's existing Floyd-Steinberg implementation; raster only | Strong tonal/detail retention at these sizes. Keep as a simpler comparator; no reason to rebuild a standard dither implementation. |
| Hybrid | Explicit luminance selection combines stipple in lighter regions with hatching in shadows | Changes the visual language but does not automatically improve legibility. Retain the composition experiment; no semantic masking claim. |

An initial 850-site stipple was visibly too sparse. The final study uses 3,000 sites on both sources; the same setting is applied rather than tuning one flattering result per photograph. Outputs are previews, not artist acceptance. The baseline preserves more literal detail than most mark-based methods; different geometry alone is not evidence of a better artwork.

## External landscape and integration verdict

Repository metadata and source documentation were inspected on 19 October. Maintenance observations are activity signals, not promises of compatibility. No external implementation source is copied into the core.

| Candidate / primary source | Rights / interface | Decision in this study |
| --- | --- | --- |
| [VTracer](https://github.com/visioncortex/vtracer) | MIT; Rust engine with Python/CLI and other bindings; actual 0.6.15 Python package executed | Isolated local adapter only. No native binary, WASM package or code is redistributed. Evaluate JS delivery/size separately before a browser proposal. |
| [SciPy cKDTree](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html) | Existing numerical primitive, BSD-licensed SciPy; Python host | Reuse for the weighted-site experiment; no JavaScript reimplementation or core dependency. |
| [penfill](https://github.com/piLeoni/penfill) | Apache-2.0; geometric fills/plotter tooling; active repository | Defer: candidate for artist-controlled fills, not needed for the two adapters here. Runtime and NOTICE coverage need review before distribution. |
| [vpype](https://github.com/abey79/vpype) | MIT; Python vector CLI / path operations; active repository | Defer until plotting or path optimization is a real output requirement. Do not add it to the browser core. |
| [DoGPack](https://github.com/dpfens/dogpack) | Apache-2.0; TypeScript, WebGL/WebGPU | Defer: potentially useful edge/direction interpretation; GPU/color parity, size and notice audit not performed. |
| [Plottter](https://github.com/pywkt/plottter) | Desktop method/workflow reference; repository license was not resolved by the inspected metadata/path | Reference only. Do not adopt code or assume commercial-compatible rights. |
| [Image Sequencer](https://github.com/publiclab/image-sequencer) | GPL-3.0 repository metadata; JS processing pipeline | Reference architecture only. Not added to the MIT library; redistribution obligations require a separate decision. |

Only SciPy and VTracer are exercised as isolated research dependencies. Pillow and the repository's existing rasterizer render the evidence. No package lock, production runtime or renderer backend is changed.

## Representation boundary

Interpretation derives luminance, local orientation or regions. Reconstruction emits circles, line paths, region polygons or pixels. Composition combines explicit methods/masks. Production consumes those results through the existing authored-ink/region or raster-input route. Keep the SVG geometry and parameters; do not label a raster screenshot editable vector artwork. Paper simulation, native pixel alignment and physical ink assignment remain the existing engine's responsibility.

This trial writes vector geometry and raster proofs but does not install a universal scene format, change the core API, promise plotter optimization or produce workshop-calibrated stencils. A future adapter should preserve source hash, scale, method version and native representation alongside its ink masks.

## Reproduce and evaluate

Commands and exact source URLs are in `examples/reconstruction-study/README.md`. The two-page A3 landscape comparison PDF uses the same panel dimensions and includes the original, native baseline and six approaches for each photograph. Outputs, native SVGs, source hashes and recipes are delivered separately; reference photographs are not added to the repository.

The agent route was executed: generate, inspect, revise the sparse site count, render and compare. The visual sheets also support a human choosing a method, but no unfamiliar human completed that task. Independent artist evaluation and physical prints remain unperformed. This does not close #109 or count as complete human acceptance in #70/#13.

**Recommendation:** keep the current production engine unchanged. Retain VTracer as the one promising optional region adapter; improve coherent hatching only if a real drawing task warrants it. Reject the naive continuous-route output. Use the existing raster baseline/dither as a quality and complexity check before approving more code.
