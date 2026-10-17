# Creative coding alpha: measured scope and publication gate

Stiprā is useful when a sketch needs named ink masks, explicit screening, inspection and a replayable package. For a flat PNG or grain-only effect, the host's existing tools are simpler. Keep the core and Canvas adapter as a small optional layer; do not build another sketch runtime or photo editor.

This is a maintainer-run engineering and workflow evaluation for #74, not independent artist usability research. Core and adapter remain private local packages at `0.1.0-alpha.0`. No registry release or tag is authorized by these checks.

## Evidence and reproduction

Use original procedural fixtures in [fixture.mjs](../examples/alpha/fixture.mjs). The 97 × 61 parity artwork includes gradients, transparency, neutral material and saturated colors; the authored counterpart has two or three deliberately assigned passes with continuous coverage and solid lettering. No owner photographs are used.

```sh
npm install
npm run build:pages
npm test
npm run benchmark:alpha
npm run check:alpha
```

`check:alpha` needs a real Chrome/Chromium executable (`CHROME_BIN` may select it). It writes browser benchmark JSON, six captured source packages, CLI replays and a parity report into `out/alpha-validation/`. CI uploads those files as `creative-coding-alpha-evidence`. Run the benchmark on the intended device before choosing an update frequency.

The Node benchmark uses a fresh process per case, one warmup and recorded samples. Rendering includes separation, screening, compositing and diagnostics. Input generation is outside the timer. The A4 case has one measured sample and is not a latency distribution. No timing threshold is used to make a shared runner pass or fail.

[Recorded Node measurements](evidence/alpha-node-2026-10-17.json) identify runtime, CPU, fixture hash, source commit, complete settings and measured asset sizes. [Browser measurements](evidence/alpha-browser-2026-10-17.json) from [CI run 39042755610](https://github.com/yigit-denktas/stipra/actions/runs/39042755610) record Chromium 155 on the GitHub Linux runner (four reported logical CPUs, software-rendered); browser rendering includes capture and drawable proof for image cases, while the large authored A4 case measures the core only. These are different workloads, not a Node-versus-browser speed ranking.

Memory figures have explicit limits: Node peak RSS includes the runtime and allocator, not only one render. Chromium JS heap before/after is not peak memory and excludes native canvas allocations. Owned input/output buffer bytes are a lower bound, not a memory budget. No mobile-memory guarantee follows from these figures.

## Use the CPU deliberately

The first local Node baseline, on an AMD EPYC 9V74 virtualized Linux host with Node 24.19.0, measured:

| Backing frame | Inks / input | Median render | Process peak RSS |
| --- | --- | --- | --- |
| 256 × 192 | 2 / authored | 15.5 ms | 53.5 MiB |
| 256 × 192 | 3 / separated image | 35.6 ms | 55.3 MiB |
| 512 × 384 | 3 / separated image | 140.5 ms | 75.8 MiB |
| 1024 × 768 | 3 / separated image | 543.7 ms | 109.3 MiB |
| 2480 × 3508 | 2 / authored | 2273.2 ms (one sample) | 251.6 MiB |

On that CI browser, median render times were 13.9 ms (256 × 192, two authored inks), 43.2 ms (256 × 192, three separated inks), 118.6 ms (512 × 384, three separated inks), 453.8 ms (1024 × 768, three separated inks) and 2224.5 ms (A4, two authored inks, one sample). The 1024 × 768 frozen-frame workflow took 42.9 ms for its 256 × 192 draft and 465.3 ms for the explicit full final. A cache hit took 0.1 ms. These values are observations from that run, not performance guarantees. Cached Canvas draw calls often measured zero at the timer's precision; that is not zero display/GPU cost or measured frame rate.

Cold optional-exporter import took 109.4 ms on the local CI HTTP server. Warm package generation for the small parity cases took 535.8–677.3 ms, with the studio's separate lazy export path taking 804.3 ms including its load and UI polling. This says nothing about CDN/network download time or large-artwork export latency. Export performance beyond these small frames remains uncharacterized.

The density-2 case is 256 × 192 logical units with 512 × 384 backing pixels. Rendering cost follows the backing pixels. Native dimensions are retained for finals; increasing pixel density is not free.

Start with a 256–384 px long-edge draft, render only after an artwork/recipe revision, and reuse its drawable canvas between updates. Large finals are explicit operations and can block the main thread. A full render inside every `draw()` call is unsuitable for the measured large cases. There is no 60 fps promise. Workers/GPU are deferred; retain the deterministic CPU path as the reference if a measured interaction requirement later justifies them.

[The draft example](../examples/sketches/draft.mjs) is an optional example helper, not a new packaged API. It freezes one full-resolution frame, makes a bounded resampled draft, and caches by source identity plus an explicit caller revision. The caller must change the revision when artwork changes. Clear the cache when disposing of a sketch; retain only frames you need.

```js
import {createDraftRenderer} from './draft.mjs';

const drafts = createDraftRenderer({
  options: {style: {id: 'portrait-duotone', variant: 'blue-pink'}, dpi: 300, seed: 42},
  maxEdge: 256,
});
const frame = drafts.update(art, artworkRevision);
p.image(frame.canvas, 0, 0, p.width, p.height);

const final = frame.renderFinal();
const archive = await frame.exportFinal(() => import('./assets/print-export.mjs'));
```

Call the last two lines only on an explicit final/export action. `renderFinal()` is cached independently and uses the captured full frame, even if the live sketch has changed. The draft object's `resolution` declares source and preview dimensions. Its screen texture is a pixel-pattern approximation; resampling and pitch limits mean it cannot certify final physical screening or small detail. Export uses the full-resolution capture and original DPI/settings. Draft objects intentionally do not expose the adapter's exportable capture/result shape.

The core accepts at most 24 megapixels and eight inks as a validation ceiling. That is not a tested interactive target. The measured workload envelope is narrower: three separated inks through 1024 × 768, and two authored inks at 2480 × 3508. Larger ink counts, eight-ink A4, Safari/Firefox, mobile devices, GPU renderers and continuous video need separate measurements.

## What parity proves

Six fixtures cover blue/pink duotone, a selective third ink, four-ink process approximation, two/three authored masks, and a real studio import/style/export interaction. Browser SDK results are hashed before export. Actual browser packages are then replayed with the real CLI and compared with Node core and package output.

For each case, checks require the same normalized ink and screen settings, dimensions, origin, DPI, continuous coverage, zero-offset screened masters and proof pixels. Every exported file hash is checked. The authored source descriptor and raw mask hashes must reconstruct exactly. Solid lettering and proof-only registration are included. A corrupted-master test proves the verifier rejects changed plate data.

Equality concerns decoded mask/proof pixels. Browser and native PNG/PDF/ZIP serializers may produce different bytes. This matrix uses explicit normalized sRGB pixel input and browser-captured PNGs; it does not claim that every camera file/profile decodes identically across hosts. File color handling remains governed by the separate color policy and reference tests.

The studio is an image-input host; authored canvases use the adapter/package writer and authored replay CLI. There is no claim that the studio now has an authored-layer import UI. The two paths share production screening and export geometry.

Heavy PDF/ZIP/fonts stay outside core and adapter imports. The exporter loads only on an export action, and its cold import time is reported separately. Its fonts, dependency notices, provenance, physical settings and normalized recipes remain in the optional distribution/package paths. The complete exporter is substantially larger than the core; see the recorded asset sizes before deciding to host it.

## Compare one fixed task with existing tools

Task: use the same 97 × 61 procedural artwork or its three authored coverage passes, inspect each pass, keep lettering solid, screen the shapes, and reopen aligned masks with the exact recipe in another host.

| Approach | Direct workflow for this task | What Stiprā changes / costs |
| --- | --- | --- |
| Plain Canvas / p5.Graphics | Keep independent buffers; draw and save each grayscale pass. Composite them in the sketch. | Stiprā adds explicit polarity, screen/physical settings, diagnostics and archived recipes. If saving flat unscreened layers is enough, this is unnecessary work and CPU cost. |
| p5.riso | Its documented workflow creates named Riso layers, draws into them, previews with `drawRiso`, applies optional `halftoneImage`, and saves passes with `exportRiso`. LPI control already exists. | Substantial overlap. Stiprā's reason to exist is its independent core, Canvas input, normalized browser/CLI replay and package evidence, subject to actual user value. p5.riso's license has use/organization conditions; its code is not included or rewritten here. |
| p5.grain | Use the existing source as a p5.Graphics target for grain or texture; a supplied deterministic RNG is supported. | Reuse it when grain is wanted. It addresses texture rather than this separation/package task. Do not add a replacement grain engine or claim grain as Stiprā's differentiator. |
| canvas-sketch | Keep its drawing lifecycle; specify physical dimensions and `pixelsPerInch`, use its canvas and `exportFrame` for output. | Keep that host. Pass its 2D canvas or artist masks to Stiprā only when ink-specific screening and replay are needed. Physical sizing/export already exist there. |

The three external workflows above are a documentation-based comparison, not executed performance or visual head-to-head tests. No speed superiority, unique invention, artist preference or equal rendering across tools is claimed. The executed checks measure Stiprā and native Canvas draw/capture operations only. A future independent artist trial should test whether the recipe/package workflow saves enough effort to justify the extra dependency and render time.

Decision: continue the bounded SDK for reproducible ink-pass work, keep drawing and grain in established hosts, and defer more adapters, classifiers and GPU work until a concrete sketch needs them. A texture-only user should use the smaller existing solution.

Primary sources checked 17 October 2026:

- [p5.riso reference](https://antiboredom.github.io/p5.riso/), especially layers, export and `halftoneImage`; [license at inspected commit](https://github.com/antiboredom/p5.riso/blob/0ec2a9e330be5b7292ea8faf931f82fbb34687fb/LICENSE).
- [p5.grain API and deterministic RNG option](https://github.com/josephmiclaus/p5.grain#api) and [MIT license](https://github.com/josephmiclaus/p5.grain/blob/main/LICENSE).
- [canvas-sketch API](https://github.com/mattdesl/canvas-sketch/blob/master/docs/api.md), especially physical units, density and `exportFrame`.

## Publication decision

The 132 Node tests and all real-browser checks passed in the recorded CI run. The local core and Canvas packages pass offline installation, exact-content checks and strict TypeScript consumption. Core has no runtime dependencies; the adapter has only the matching core peer. Real-browser compatibility covers Chromium and p5 1.11.11 / 2.2.2 at densities 1/2. That does not establish Safari, Firefox, WEBGL or other p5 version compatibility.

Keep `private: true` and `0.1.0-alpha.0`. Publication is a separate owner decision after the intended distribution is defined. The current audit has one #14 finding for native Skia; the opaque fontkit bundle was replaced and fonteditor removed after #94. Historical incomplete-notice fixes remain retained. Existing notices are retained, and the release-license check remains intentionally red. p5 is a separately replaceable LGPL host, not part of the MIT core/adapter packages. p5.grain is not added merely for this comparison. The [current candidate checks](RELEASE-CANDIDATE.md) install the exact audited core/Canvas/inputs tarballs together and exercise their public runtime/type exports; this extends the historical alpha evidence without claiming publication or independent artist acceptance.

Physical output remains unverified (#13). The digital alpha and reproducible masks can be evaluated now; calibrated ink appearance, spread, stock, registration and machine behavior require actual print observations. Branding remains provisional. No claim of print readiness follows from these timings or parity checks.

The [artist trial and publication handoff](ARTIST-TRIAL.md) now supplies a concrete task and empty record. The session publisher check returns npm ENEEDAUTH; no npm account/scope is established here. That is a real registry-access blocker, not a failed core/Canvas/inputs package check.
