# Creative coding library direction

Recorded 17 October 2026 from the owner's request. This is a scoped plan, not a shipped SDK or an approved public API. [Milestone tracker #70](https://github.com/yigit-denktas/stipra/issues/70) holds the work breakdown; native GitHub milestone/Project setup remains [#17](https://github.com/yigit-denktas/stipra/issues/17).

**Core implementation:** [the private local alpha](../packages/core/README.md) implements the #71 contract using the same separation/screen/Styles/diagnostics modules, with pixel and authored-mask input, ESM/CommonJS entries and TypeScript declarations. This does not complete the p5.js adapter, transparent effects, authored-layer export integration, performance/usefulness gate or registry release. Those remain in #72–#74. p5.grain will be reused when the integration needs compatible grain/texture functionality; a photo editor is outside the product scope.

## The experience

An artist draws in an existing p5.js or Canvas sketch, applies Stiprā's ink/screen/paper treatment, and draws the proof back into the sketch. No manual image download and reimport is needed. Saving a frozen frame can optionally produce independent aligned ink plates, diagnostics and a versioned recipe using the same engine as the studio and CLI.

The digital effect is useful by itself. Physical plates and reports are optional outputs. A convincing screen simulation does not establish physical print quality.

Support two authoring paths:

1. **Composite input:** separate an existing colored canvas into ink masks, then screen and proof them.
2. **Authored ink input:** accept masks the artist has already drawn for each ink. Preserve that knowledge instead of flattening to RGB and estimating it again.

## Sequence

| Stage | Work | Exit evidence |
| --- | --- | --- |
| Reliable foundation | Resolve [PR #69](https://github.com/yigit-denktas/stipra/pull/69); finish the RGBA/alpha/color contract [#44](https://github.com/yigit-denktas/stipra/issues/44), master/export checks in [#8](https://github.com/yigit-denktas/stipra/issues/8), [#12](https://github.com/yigit-denktas/stipra/issues/12), [#13](https://github.com/yigit-denktas/stipra/issues/13), and shipped dependency/asset audit [#14](https://github.com/yigit-denktas/stipra/issues/14) | Documented input semantics, verified masks/geometry, truthful export metadata and notices |
| Creative coding alpha | [#71](https://github.com/yigit-denktas/stipra/issues/71) engine contract; [#72](https://github.com/yigit-denktas/stipra/issues/72) Canvas/p5 adapter; [#73](https://github.com/yigit-denktas/stipra/issues/73) authored ink layers; [#74](https://github.com/yigit-denktas/stipra/issues/74) performance/export/usefulness acceptance | Working Canvas, p5 global and p5 instance examples; measured limits; repeatable proof/plate package |
| Additional hosts | [#75](https://github.com/yigit-denktas/stipra/issues/75) Processing Java feasibility, after alpha usefulness evidence | Measured handoff and a bounded recommendation, or explicit deferral |

This sequence does not require completing every checkbox in the broad export backlog. Native vector screening, extra export formats, identity polish and more elaborate paper fibers are separate work. Finish the essential studio path in [#22](https://github.com/yigit-denktas/stipra/issues/22) without turning it into a sketch IDE. A pure-RGBA prototype can run while file-decoder ICC policy is investigated, but must not claim source-file parity until verified.

Physical print observations remain an open gate for print-quality claims. They do not block a clearly experimental digital-effect demo or require delaying the entire SDK until access to a press is available.

## Existing tools and the opportunity to test

The following primary documentation was reviewed on 17 October 2026:

| Tool | Already provides | Consequence for Stiprā |
| --- | --- | --- |
| [p5.riso](https://antiboredom.github.io/p5.riso/) | Ink drawing layers, channel extraction, on-screen proof, individual PNG layer exports and LPI-based halftones | Layers, halftones and physical frequency alone are not a new contribution. Respect its license; do not copy or translate its implementation into this repository. |
| [p5.grain](https://github.com/josephmiclaus/p5.grain) | Pixel grain and texture overlays inside sketches, animation options and global/instance modes | Reuse compatible tools when only grain is needed; do not build a competing catalog of generic texture utilities. |
| [canvas-sketch](https://github.com/mattdesl/canvas-sketch) | A generative-art workflow with physical dimensions, resolution and print export | Integrate with existing canvases rather than inventing another sketch runner or drawing language. |

**Product hypothesis:** Stiprā can make the route from an existing sketch to inspectable plates and a reproducible print package easier through one shared engine, versioned Styles, coverage/overlap diagnostics and explicit physical scale. This is not evidence that no other tool offers that combination.

Before expanding, run one fixed procedural artwork through a documented direct-tool workflow and the Stiprā adapter. Compare setup friction, control over ink assignments, inspection, repeatability, runtime and package burden. Keep what materially helps; narrow the SDK if it adds little. References are not dependencies by default. Any reuse must satisfy [the licensing policy](LICENSING.md) and retain notices.

## Engineering boundaries

- Reuse `separation.js`, `screening.js`, `styles.js` and `plate-diagnostics.js`; establish their public boundary rather than writing a second renderer. The repository currently has an internal CommonJS/browser module structure and a private package, not a published SDK.
- Keep the typed-array render contract independent of the DOM. Use a small optional Canvas/p5 adapter and explicit shared dimensions, origin, alpha and normalized color semantics.
- Keep PDF, fonts, QR, ZIP and Node image codecs outside the core import. Load export machinery only when requested.
- A sketch owns its drawing loop and random state. Stiprā owns explicit treatment seeds. Separate source and destination so the effect does not accidentally process its own previous proof.
- Define frozen versus animated paper/grain explicitly. Treat registration and substrate as proof effects; preserve production-master geometry.
- Account for [p5 pixel density](https://p5js.org/reference/p5/pixelDensity/): logical canvas size can differ from backing pixels. Test densities 1 and 2, transparency and non-square frames; document exact supported p5 versions. Demonstrate WEBGL capture or state its limits.
- Start with a deterministic CPU reference. Measure preview latency, final-render time, memory and actual bundle bytes. Preview resolution and final print resolution may differ, with explicit physical screen frequency and declared approximation. Add workers or GPU paths only against measured need, with documented numerical differences.
- Use the same frozen source/layers and normalized recipe for final production masks in SDK, studio and CLI. Encoders, decoders and browser color management can differ; do not promise byte-identical PNG, PDF or ZIP files across hosts.
- Use original procedural examples and rights-cleared assets. Owner photographs and derived image-bearing documents stay private.

No API names or npm package names are fixed here. No new drawing API, general framework, cloud service, plugin marketplace or unconditional animation-frame-rate promise is part of this alpha.

## Processing is a separate host

[Processing Java](https://processing.org/environment/) runs in a different environment from p5.js. A browser JavaScript package cannot simply be imported into a Java sketch. Research a frame/file-to-CLI route first, then a local bridge if demand and latency justify it. That handoff must be described as offline processing unless an interactive path is actually demonstrated. Do not commit to a Java port or maintain a second rendering engine in the alpha.
