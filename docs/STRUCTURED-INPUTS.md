# Structured inputs: regions, frozen projects and optional adapters

Implemented local alpha and bounded research pilots, 17 October 2026. Issues #83–#86 extend the existing core/Canvas alpha; they do not change the original v0.9 acceptance denominator or publish packages.

## Regions → physical inks (#83)

`@stipra/inputs` is an optional dependency-free package. `mapRegions(source, mapping)` accepts up to 64 named same-frame 8-bit coverage regions (64 MiB aggregate) and produces owned, unscreened masks for 1..8 physical inks. Regions describe the artwork, not ink channels. Mapping version 1 explicitly records paper, ink names/colors, binding order, strengths and combination:

- `max`: strongest coverage wins. Two half-covered regions remain approximately half coverage.
- `over`: ordered opacity union, `a + previous × (1 − a)`. Two 128/255 samples produce 192/255, not a binary edge or 256.

No automatic screen detection: provide continuous coverage, then call `renderLayers` once. Do not send pre-screened artwork unless you deliberately select a solid screen. Categorical labels, depth, normals and arbitrary RGB cannot be silently reinterpreted as coverage. `captureRegions` on the optional `/canvas` entry checks shared backing and logical frames, with explicit alpha or neutral grayscale polarity. Provenance is required (`authored`, `captured`, `renderer-provided`, `estimated`), with optional producer/version and bounded parameters. These declarations are not verified credentials.

[Original procedural forest](../examples/regions/fixture.mjs) keeps distant trees, foreground trunks and display lettering independent. The [public example](https://apps.yigitdenktas.com/stipra/regions/) compares two/three physical passes with separation estimated from the same fixed flattened drawing, same ink colors and screen. It demonstrates preserved author control, not a quality claim for owner photographs. Browser/Node/CLI checks compare exact masks, proof pixels and aligned master pixels.

## Optional source projects (#84)

The shared image and authored package writer accepts an explicit `sourceProject`; omission preserves snapshot-only output. `exportSnapshot(rendered, lazyLoader, {sourceProject})` copies selected attachments before waiting for the exporter. `generateSketch` also accepts the field. PDF/ZIP dependencies stay outside core/inputs/Canvas imports.

A version-1 project declares a frame `{width,height,origin:{x,y},transform:[a,b,c,d,e,f]}`, selected artifacts and relationships. The affine transform is recorded evidence; it is never silently applied. Dimensions must match the exported snapshot. Artifacts declare a unique lowercase ID, original name, role, media type, raw bytes and optional provenance. Roles are sketch-source, parameters, geometry, region-coverage, auxiliary-data, validation-report and reference. Limits: 32 artifacts, 16 MiB each, 32 MiB aggregate. Names are metadata; storage paths are generated `source/project/files/<id>.bin`. JavaScript, SVG and scene files remain inert bytes.

`source/project.json` records each artifact's byte size/SHA-256, relationships, frame and linked source snapshot SHA-256. Its hash is in `manifest.json`, and all attachments are included in the manifest file inventory. Original bytes, normalized image pixels, declared origin and credential validation are separate facts. A seed alone does not reproduce generator state. A Stiprā proof is not a newly signed C2PA derivative.

`regionProject(source,mapping)` preserves raw coverage plus a normalized mapping; because each region is an artifact, the project budget permits at most 31 regions. Larger region sets can still render but need explicit source selection or a future aggregate encoding. Replay never requires p5.js, fonts or arbitrary source execution:

```sh
node scripts/reproduce-layers.js INPUT.zip NEW-SNAPSHOT.zip
node scripts/reproduce-regions.js INPUT.zip NEW-MAPPED.zip
```

The latter remaps the stored regions, checks every final coverage against the archived snapshot, then uses the shared screen/export path. Archive reading checks central-directory paths, duplicates, encryption/methods, compressed/inflated budgets and actual streamed sizes before decoding attachments. Hashes establish integrity relative to the manifest, not independent authenticity.

Source inclusion is opt-in and local. Original photos, GPS, prompts, proprietary sketches and secrets may be present in selected files; inspect them before redistribution. No uploading, fetching URLs, executing source or rendering attached SVG occurs during project replay. Owner photographs remain private.

## OpenRaster and auxiliary passes (#86)

`src/adapters/openraster.js` is a Node-only feasibility adapter using existing JSZip, xmldom and the existing bounded PNG importer. It accepts explicit selections from a flat leaf-layer stack, translating integer offsets into the common full frame and multiplying layer opacity into fractional coverage. It records source path/order/offset/opacity/polarity. Supported blend is `svg:src-over`; hidden selected layers, nested stacks, incompatible root-stack effects, unsupported blends, unsafe references and implicit cropping reject. It extracts selected regions, not a promise to reproduce arbitrary application compositing or all valid OpenRaster archives. ZIP entry naming is deliberately narrower than the full format.

`depthCoverage` consumes explicitly extracted Float32/Float64 depth in meters or disparity in inverse meters. Declare orientation 1, data/display windows, positive near/far values, finite invalid sentinels and the near/far ramp. Nonfinite values become no coverage and are counted. Data-window offsets are preserved; data outside the display window rejects. Output outside the data window is zero. `labelCoverage` selects exact uint32 categorical IDs without interpolation. It does not decode Cryptomatte: use the host's existing Cryptomatte extractor to resolve hashed IDs and fractional coverage first. Occluded geometry cannot be recovered from a visible label/depth pass.

Recommendations from primary specifications:

| Source | Recommendation | Boundary/evidence |
| --- | --- | --- |
| OpenRaster | Opt-in selected-layer adapter | Offset/opacity/fractional edge and reject tests; no general paint-stack renderer |
| Apple HEIC/depth | Extract on Apple host using ImageIO + AVDepthData, then pass normalized arrays/metadata | ImageIO exposes auxiliary dictionaries; AVDepthData handles depth/disparity and EXIF orientation. Native extraction untested on Linux; defer native integration until an actual host workflow exists |
| OpenEXR | Use established OpenEXR/OpenImageIO host tools to select channels and preserve data/display windows | Native EXR codec/scene-linear color conversion not bundled; explicit float/ID array bridge tested |
| Cryptomatte | Use Blender/compositor's existing matte extraction; supply the resulting fractional coverage | Never color-convert hashed float IDs or substitute a uint32 threshold for an antialiased matte; no new Cryptomatte decoder |

PNG #82 boundaries remain unchanged: 16-bit input retains source precision metadata while working pixels are 8-bit; unvalidated HDR/cICP/profile/orientation combinations still reject. Auxiliary numeric passes bypass color processing, not image-import safety rules. No HEIC/RAW/EXR native codec, inference model, segmentation runtime or 3D engine was added.

Sources: [OpenRaster stack](https://www.openraster.org/baseline/layer-stack-spec.html), [file layout](https://www.openraster.org/baseline/file-layout-spec.html), [Apple AVDepthData](https://developer.apple.com/documentation/avfoundation/avdepthdata), [auxiliary conversion units](https://developer.apple.com/documentation/avfoundation/creating-auxiliary-depth-data-manually), [OpenEXR windows](https://openexr.com/en/latest/TechnicalIntroduction.html), [Cryptomatte upstream](https://github.com/Psyop/Cryptomatte), [OpenImageIO tools](https://openimageio.readthedocs.io/en/latest/oiiotool.html). Host tools have their own licenses; none are bundled by these adapters.

## Local provenance feasibility (#85)

Decision: keep C2PA optional and outside browser/core defaults. Reuse the official validator; do not implement crypto or classify AI origin. `src/adapters/provenance.js` is a Node pilot for an explicitly supplied absolute path to **c2patool 0.28.2** (SDK 0.91.2). No tool is downloaded by app import or inspection. It bounds PNG/JPEG bytes, process time/output, clears ambient C2PA settings variables, supplies explicit settings, disables remote manifest/OCSP fetching and denies every network host. Local files are removed after inspection.

Report states distinguish not-inspected, absent, inspected and error; binding is valid/invalid/unknown, signer trust is trusted/untrusted/unknown. Tool version, timestamp, policy, source SHA and raw report/hash are retained. This is not a conformant full trust decision: revocation freshness is unavailable offline, unknown trust is not asset tampering, and missing credentials imply nothing about AI, rights or truth. Remote-only credentials stay unresolved with no request. Original credential reports may be attached as validation-report artifacts only by explicit caller choice; they do not authenticate an exported derivative.

Five real local cases generate our own procedural PNG: not inspected, unsigned, signed with the upstream built-in **development-only** certificate, pixel-tampered with credentials preserved, and remote-manifest reference to a counting local server. The signed binding validates with an untrusted signer; tampering fails the asset hash; offline validation makes zero requests. No sample photographs, signing keys or external binaries are committed.

```sh
python scripts/setup-provenance-tool.py .cache/c2patool
C2PATOOL="$PWD/.cache/c2patool" npm run check:provenance
```

The setup helper is an explicit research download, Linux x86_64 only, pinning the official archive SHA-256 `ff9f05d0f985a77995ec18956671f331d619c804e033c9929972a8d4f479e93a`. External executable measured 37,959,712 bytes. Upstream dual license MIT OR Apache-2.0; Stiprā does not redistribute it. Bundling it later needs exact platform/transitive notices and a fresh audit; package metadata alone is not a completed binary audit.

The browser alternative evaluated from the actual npm tarball is `@contentauth/c2pa-web` **0.15.4**, MIT: compressed package 7,991,054 bytes; unpacked 21,284,048; WASM 9,049,453; worker 46,386. Its worker/WASM and inline alternatives support optional local inspection, but adding roughly 9 MB WASM to our small effect path is unjustified now. A browser adapter is deferred until a concrete credential workflow justifies lazy loading, offline policy and browser fixtures. The MIT grant is present; a future redistribution still needs review of the built WASM's component notices. No WASM or new runtime dependency was added. Tarball integrity: `sha512-i3bs67iNjovbBoIQwSUzdOQRU5+e/kJPWnIMSmn6tXF1WYWFKR8GhaX3ZyAM8EOLlefoNSmjztQr2wpGvJiCVg==`.

Sources checked 17 October 2026: [official c2patool release](https://github.com/contentauth/c2patool/releases/tag/v0.28.2), [pinned signing docs](https://github.com/contentauth/c2patool/blob/v0.28.2/docs/signing.md), [pinned offline settings](https://github.com/contentauth/c2pa-rs/blob/c2pa-v0.91.2/sdk/src/settings/mod.rs), [browser SDK](https://github.com/contentauth/c2pa-js/tree/main/packages/c2pa-web), [npm package](https://www.npmjs.com/package/@contentauth/c2pa-web/v/0.15.4).

## Verification and release status

`npm test` covers regions, overlap, role/provenance rejection, source ownership, tamper detection, bounded ZIP import, old snapshot compatibility, auxiliary orientation/windows and OpenRaster subset behavior. The inputs package is packed and installed offline with ESM/CJS/TypeScript checks; its default import has zero runtime dependencies. `npm run check:regions` tests real browser capture, two/three ink mappings, shared writer and Node/CLI replay; `npm run check:provenance` runs the actual upstream validator. CI uploads reports under `structured-input-evidence`; generated original procedural artwork is safe to share.

Packages remain private/unpublished. The research decisions complete #85/#86 without claiming production browser C2PA or native Apple/EXR support. Studio acceptance (#22), distribution notices (#14), artist feedback and physical prints remain separate gates.
