# Reconstruction Study 01

Executed 19 October 2026 for #109. This is a controlled research pilot, not six new product modes. #113 and #114 remain proposed work in the same delivery ledger; the original fourteen-issue v0.9 denominator is unchanged.

## Sources and controls

Two real photographs are used: NASA's portrait of Eileen Collins, distributed as the public-domain [scikit-image astronaut dataset](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut), and Noclip's [Capitol Building Full View](https://commons.wikimedia.org/wiki/File:Capitol_Building_Full_View.jpg), released worldwide into the public domain by its author. No private owner photograph, image generation or substitute illustration is used. Original source hashes and dimensions are recorded in [the evidence](evidence/reconstruction-study-01.json). Credit is retained even where not required.

Every method receives the same full-frame normalized image: longest edge capped at 600 pixels (smaller sources are not upscaled), Lanczos resampling explicitly declared, no crop or stretch. Comparison panels have the same 90 mm longest edge within each source. The architecture's panoramic composition remains panoramic. The existing two-ink Stiprā proof is a baseline, not a claim of calibrated printing. Grayscale reconstruction methods do not preserve source color; the four-level vector study deliberately shows grayscale rather than pretending to match the spot-ink baseline.

## Coverage-controlled revision (v2)

The independent review found that v1 compared 2–14% mark coverage with roughly 55–61% source darkness. Its method ranking therefore confounded under-inking with reconstruction quality. **The original sparse-mark ranking is withdrawn.** The revised study controls decoded monochrome coverage; it does not equalize vector complexity or establish artistic preference.

All reconstruction proofs use black/gray on white so color and paper do not contaminate tone measurements. The untouched color source is contextual; its Pillow L channel supplies the common tone target. The primary baseline is that exact L-darkness mask passed through existing `Core.renderLayers`, in solid mode at 144.50 / 169.33 DPI, not an automatic single-ink separation or a production halftone. The earlier green/coral two-ink solid proof and its recipe remain separately labeled context and excluded from metrics. Branding remains green on warm paper around the panels.

| Method | What v2 controls | Portrait / architecture block RMSE (8-bit) |
| --- | --- | --- |
| Stipple | 3,000 frozen sites; local circle area equals full-resolution cell area × mean darkness; final overlap/clipping calibration | 10.41 / 7.75 |
| Directional hatch | 8 px grid, local tone sets width; actual Sobel iso-tone directions; final overlap/clipping calibration | 10.53 / 7.23 |
| Greedy continuous route | Same 600 frozen nodes; final stroke width calibrated to equal coverage | 59.15 / 58.21 |
| VTracer regions | Precision 8, layer difference 1, speckle 4, polygon; fills snapped to the four actual input gray values | 7.62 / 11.97 |
| Floyd–Steinberg | Existing Pillow implementation; **unconstrained raster tonal reference**, not an equal-complexity style competitor | 0.82 / 0.92 |
| Hybrid | Actual stipple circles above gray .45 plus actual method-02 directional paths at/below .45; shared final coverage calibration | 12.56 / 16.40 |

The mark methods meet the source darkness target within **0.5 percentage point** on both frames (actual errors below 0.01 pp). Targets are 54.74% portrait and 60.95% architecture in this explicitly defined monochrome metric, not physical ink-volume estimates. Equal longest edge is a within-source control; the 90 × 90 mm portrait and 90 × 38.55 mm architecture do not have equal areas or support a cross-source detail ranking.

VTracer retains all four bands on both frames. Input/render-nearest band fractions and L1 errors are in the canonical evidence and the PDF budget page. Its coverage is not artificially re-normalized: portrait 54.62%, architecture 62.71%; architecture remains +1.76 pp darker than target. The four-band distribution L1 errors are 0.0146 / 0.0210. Antialiasing can produce intermediate rendered pixels even when SVG fills are exactly the four palette values. Four grayscale regions are continuous-tone representations, not four physical spot-ink plates.

The v0.6.15 upstream tag is commit `fd9cdb08e622f237eb05be553a020ddc9e4c47a1`. Its [Python package metadata](https://github.com/visioncortex/vtracer/blob/fd9cdb08e622f237eb05be553a020ddc9e4c47a1/cmdapp/pyproject.toml) says 0.6.15; its [Rust crate metadata](https://github.com/visioncortex/vtracer/blob/fd9cdb08e622f237eb05be553a020ddc9e4c47a1/cmdapp/Cargo.toml) says 0.6.12. The [SVG writer](https://github.com/visioncortex/vtracer/blob/fd9cdb08e622f237eb05be553a020ddc9e4c47a1/cmdapp/src/svg.rs) emits `CARGO_PKG_VERSION`. The observed banner is therefore consistent with distinct binding and crate versions; neither version proves compiled-binary attribution.

**Revised interpretation:** stipple and hatch now preserve meaningful tonal structure and deserve consideration as artistic vocabularies. The naive route still fails even after matching darkness, but this says nothing about an optimized TSP method. VTracer is a viable regions candidate, not the overall winner: hatch/stipple have lower architecture block-tone error. Hybrid does not automatically improve either parent. Baseline RMSE zero is expected because it consumes the reference L mask; dither's low error comes with unconstrained per-pixel complexity. Tone fidelity is not artistic quality. Do not approve a new production adapter from these metrics alone.

## Reproducibility and evidence scope

`docs/evidence/reconstruction-study-01.json` is the **single canonical evidence file**, containing actual parameters, per-method generation time and a separated render-calibration/final-raster time, marks, segments, polyline length, coverage/error, block RMSE, signed block-error quantiles and 32-bin tone histograms per method, radius/stroke-width and overlap/clipping statistics, per-band VTracer IoU and spatial band agreement, SVG/PNG bytes, every delivered image/recipe hash, decoded-pixel hashes, PDF/contact-sheet/replay hashes and runtime/script identities. `generation.json` and `render-metrics.json` are transient measurements, not alternate evidence documents; neither is delivered.

Committed rounded point fixtures avoid resampling the floating cumulative RNG distribution on another build. They preserve the observed 3,000 sites and seed provenance; they do not prove every later numerical operation portable. `examples/reconstruction-study/replay.py` snapshots the generated artifacts, re-runs the Python and Node generation, and writes `replay-check.json` for exactly 32 same-environment geometry/decoded-pixel identities (5 SVG + 11 PNG per source); `measure.py` records its result. PNG bytes may differ across encoder/zlib builds; decoded hashes include dimensions, RGBA8 mode and row-major pixels. PDF bytes include one run's varying timings, so their hash identifies a specific report, not a portable visual golden. The former boolean repeat claim applied only to the recorded machine/build.

Coverage matching is a global mean control, not a local tone guarantee. The review-branch measurements expose the residual: 16 x 16 signed block-error quantiles, per-decile signed error, and 32-bin tone histograms per method; stipple and hatch still under-ink the darkest blocks after the global scale is applied. VTracer band counts are not accepted as spatial proof: per-band IoU, nearest-band pixel agreement and boundary mismatch are recorded too. The expanded canonical evidence was regenerated on Linux during integration. The original `1ddd32e` recording is retained byte-for-byte in [the historical evidence](evidence/reconstruction-study-01-v2-original.json), SHA-256 `cc2a9b4178a08f6d0d487844422f79bad69b73e7eaf21d4b9f3d4d703e3a683e`; the supplied Windows recording was not substituted for it. Text artifacts are written with explicit UTF-8 and LF and `.gitattributes` keeps this tree LF on Windows checkouts, so fixture, script and SVG identities are checkout-stable.

The four-neighbour boundary includes both sides of each horizontal/vertical band transition. `overlappingCircleFraction` counts circles touching any other circle once; `overlappingPairsPerCircle` separately counts pairs/N and may exceed one. Positive coverage error means excess rendered darkness. These definitions correct discrepancies found while reviewing upstream branch `3deeab8`; the full four-band guard and exact 32-file replay inventory are enforced. Failed/incomplete replay records cannot be recorded as passing evidence. Local tone remains a diagnostic, not a passed ±4 pp acceptance gate.

Source baseline commit, actual script hashes (line-ending normalized), the generation commit and dirty-tree flag, Node, Skia Canvas and ReportLab versions are recorded separately. No report pretends that uncommitted revision code was already at the baseline commit. The complete delivery manifest hashes the canonical evidence itself and every other archive member without recursive self-hashing. Sources/credits, documentation links and replay paths retain their repository layout.

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

Commands and exact source URLs are in `examples/reconstruction-study/README.md`. The three-page A3 landscape PDF (two comparison pages plus a measured-budget page) uses the same panel dimensions and includes the original, native baseline and six approaches for each photograph. Outputs, native SVGs, source hashes and recipes are delivered separately; reference photographs are not added to the repository.

The agent route was executed: generate, inspect, revise the sparse site count, render and compare. The visual sheets also support a human choosing a method, but no unfamiliar human completed that task. Independent artist evaluation and physical prints remain unperformed. This does not close #109 or count as complete human acceptance in #70/#13.

**Recommendation:** keep the current production engine unchanged. Retain stipple, hatch and regions as distinct candidates; reject only this naive route. Obtain 2–3 blind human rankings of three chosen panels before selecting an adapter. Human ranking and physical prints remain unperformed; this coverage-controlled rerun does not close #109.

## Integration scope and next decision

The review branch `3deeab829678e10ebe8953b459723f4c68f674d9` supplies UTF-8/LF handling, POSIX archive paths, local/spatial diagnostics, split timing and a replay entry point. Integration adds fail-closed replay/count checks, restores the four-band guard, corrects overlap/boundary definitions and error polarity, preserves the prior recording and regenerates the expanded evidence on Linux. Four synthetic regression tests exercise sign, overlap, four-neighbour boundaries and rejection of invalid replay records. The PDF prints actual local-tone quantiles, separate timing and n/a for inapplicable values.

Reported Windows failures are not all host-only: npm subprocess launching, vendor checkout bytes and README newline counting need portability work; temp ACL and symlink privileges need host-sensitive diagnosis. They were not reproduced on Windows in this integration, and this patch does not claim full Windows acceptance. Review-reported Linux CI totals should be read from the actual run rather than adding skipped cases to passed tests.

Experiment 2 was not executed. The proposed nearest-neighbour radius cap is not adopted: increasing site density under a fixed fractional spacing cap does not necessarily restore dark-tone capacity. Keep overlap-aware local correction, deliberate dark-tone compression or alternative mark vocabularies as hypotheses requiring separate parameterized tests. Human rankings and physical prints remain open.
