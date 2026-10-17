# Dependency inventory and distribution gates

Audit updated 17 October 2026. This inventories actual installed packages, retained notices and shipped artifacts; it is not blanket legal clearance.

```sh
npm ci
npm run prepare:fonts
npm run audit:licenses
npm run check:browser-distribution
npm run check:library-candidate
npm run check:release-licenses
```

The production graph now contains 74 package locations on the recorded Linux installation. `audit:licenses` checks lock versions, package integrity, notices and supplements, and writes `out/license-audit/`. The broad release check deliberately exits 1 for **one remaining finding: the platform-specific Skia native binary**. A successful inventory does not clear that binary.

## Two opaque artifacts removed

| Former dependency | Resolution | What is verified |
| --- | --- | --- |
| `@pdf-lib/fontkit` 1.1.1 | Removed; replaced by exact `fontkit` 2.0.4 | Its published browser CJS/ESM and Node CJS modules have source maps matching every referenced own-source file. Dependencies resolve separately through the lock and browser build inventory. |
| `fonteditor-core` 2.6.3, including WOFF2 WASM | Removed entirely | Report/QR typography reads the original complete IBM Plex TTF files already pinned in the font cache. No WOFF conversion or fonteditor WASM is needed. |

This resolves those findings by replacement/removal, not by claiming that the old opaque bytes were cleared. Their measured identities and investigation remain in `licenses/third-party/artifact-review.json` with `retired: true`.

`licenses/third-party/fontkit-source-inventory.json` pins replacement module/map hashes, version and dependency declarations. `scripts/fontkit-evidence.js` requires all 111 browser / 112 Node source-map entries to match the published `src/` files and rejects foreign paths, changed code/maps/sources or dependency metadata. This is a source/component inventory, not an independent compiler-build attestation.

The replacement introduces separately installed dependencies instead of hiding them inside the old bundle. Published MIT declarations for Fontkit, dfa and Brotli omit complete terms; hash-pinned supplements retain their original declarations/author metadata and referenced MIT terms. No copyright line or new grant is invented. Brotli's actual Google Apache decoder notices and full Apache terms are retained separately; the audit records `MIT AND Apache-2.0`. The browser build rejects the unused compiled Brotli encoder, native Skia and fonteditor. Its manifest records the actual modules shipped, rather than claiming the entire upstream Brotli encoder is covered by the decoder review.

## Browser exporter

`check:browser-distribution` builds the PDF/ZIP exporter and writes `out/browser-distribution/export.mjs.audit.json`, its dependency notices and output hashes. Every included package must have a declaration and full retained terms. The report includes the actual Fontkit module/hash, matching own-source inventory, resolved package versions, file hashes and final bundle/notice hashes. Both IIFE and ESM builds select the reviewed `fontkit/dist/browser.cjs` through the CommonJS source imports.

The browser exporter has no unresolved findings in this artifact scope. The whole site also distributes separately licensed Plex/Paper Mono fonts and optional replaceable p5 host files; the exporter report is not a site-wide trademark/media license. Generated print ZIPs retain report-font OFL terms. No owner photograph is committed or added to public evidence.

## Lean library candidate

`check:library-candidate` builds and inspects the exact private core/Canvas/inputs tarballs, then installs those archives together offline with lifecycle scripts disabled. The installed graph must contain only those three packages. Public runtime/type exports and Canvas-region-core replay are checked. The packages contain the original Stiprā MIT notice and no PDF stack, font, native library or drawing framework. CI uploads the tarballs and reports as `lean-distribution-audit`.

The import audit rejects unexpected files, lifecycle scripts, runtime dependencies, unresolved imports and unreviewed peer versions. An application-supplied exporter callback is outside that boundary. See [candidate scope](RELEASE-CANDIDATE.md). Publication/artist acceptance remain #70.

## Remaining native gate

`skia-canvas` 3.0.8's MIT npm wrapper does not establish the exact Rust/Skia/codec inventory of its downloaded platform binary. The recorded Linux x64 glibc artifact is 30,457,832 bytes, SHA-256 `2363537634644a50b69d785411713d12ae62453c1238bb98842e65b9919777f9`. Other platforms report actual identity as `unrecorded-platform`; a matching hash is identity, not clearance.

[Source commit 042312a](https://github.com/samizdatco/skia-canvas/tree/042312a3f40b660b1d7dc0beba541486171bc5cc) supplies Cargo metadata and platform workflows, but moving stable Rust/container references do not attest the downloaded binary's compiled components. Before distributing a bundled native executable, obtain an attributable inventory tied to those bytes or build and review a separately pinned replacement. No bundled executable or native binary is released by this work. #14 remains open for this specific gate.

## Fonts and first offline use

`npm run prepare:fonts` downloads the official OFL font files into the ignored cache and verifies Git blob hashes. IBM URLs now use source commit `71f558992315a12ca1f06a2215d57962a1992162`; Paper Mono stays at `v1.000`. Existing font bytes are unchanged from the earlier pinned originals. The report reader verifies each original again and never silently downloads, converts or substitutes a font. Prepare once before working offline. The browser build embeds the verified files and needs no font-cache network access at runtime.

## Separate rights and historical evidence

Stiprā-authored code is MIT; artwork, photographs, branding and typefaces have separate rights. JSZip's MIT alternative and Pako's MIT AND Zlib terms remain explicit. p5 is a separate optional LGPL host, not bundled into the lean packages. [p5.grain's upstream MIT license](https://github.com/josephmiclaus/p5.grain/blob/main/LICENSE) permits evaluation with retained notices; it is not installed. Restricted p5.riso source is not copied, translated or vendored. See [licensing policy](LICENSING.md).

Historical investigations are retained in `licenses/third-party/source-review.json`: the old fontkit source commit did not prove its 1.1.1 bundle; fonteditor's WOFF2 instructions installed Emscripten 1.38.48 but activated latest and did not pin WOFF2/Brotli revisions. Removal avoids shipping those unresolved artifacts. No upstream messages were sent. Physical ink/stock calibration remains a separate #13 task.
