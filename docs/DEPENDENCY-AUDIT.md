# Dependency inventory and distribution gates

Audit recorded 17 October 2026 for the production npm graph locked in `package-lock.json`. This is an engineering inventory of actual packages and retained evidence; it does not turn package declarations into a blanket legal clearance.

```sh
npm ci
npm run audit:licenses
npm run check:release-licenses
```

The first audit command writes `out/license-audit/dependency-audit.json` and `THIRD-PARTY-NOTICES.txt`. It checks installed versions against the lock, records package integrity, selected license and SHA-256 of notice evidence, and fails for absent evidence or uninstalled runtime packages. It inventories 65 production package locations in the current lock; development build tools are outside that count. The report contains no machine-specific absolute paths or owner imagery.

The release-check command exits nonzero while findings remain. Ordinary CI generates and uploads the inventory; a green CI inventory step does **not** mean commercial redistribution is cleared. The build separately emits notices for the modules actually included in the browser export bundle, retaining Node/base64 and Google Apache notices inside prebundled fontkit as well as package notices and full Apache terms. The static site distributes Plex OFL notices, and generated print ZIPs now include the embedded report font's full OFL text with a manifest/hash entry.

## Findings and retained evidence in #14

| Component | Evidence | Remaining action |
| --- | --- | --- |
| dijkstrajs | Published MIT declaration, original author notice/disclaimer and hash-pinned supplement | Resolved notice completeness: retain the full referenced MIT terms without claiming a new grant |
| string-split-by | Published MIT declaration/2018 author line and hash-pinned supplement | Resolved notice completeness: original attribution plus full MIT terms |
| @pdf-lib/fontkit | MIT package; retained Node/base64 and Google Apache block notices, plus complete Apache terms | Still open: exact prebundled component versions/attributions; published 1.1.1 has no source map/gitHead and upstream default source declares 1.1.0 |
| skia-canvas | MIT npm wrapper; install downloads a platform native binary | Verify native/Rust/Skia/codec dependency notices for the exact platform binary before bundling an executable |
| fonteditor-core | MIT legacy `licenses` field and full LICENSE; includes WOFF2 WASM | Verify WOFF2/Brotli artifact provenance before bundling its dependency tree; the static site does not distribute this WASM |

The audit selects JSZip's MIT alternative explicitly and retains the dual-license evidence. Pako's combined MIT AND Zlib declaration is retained. Fonteditor's legacy metadata is read rather than incorrectly treating its absent singular `license` field as an unknown license. Other recognized declarations are MIT, ISC, BSD, Apache-2.0, OFL, 0BSD, Zlib and CC0; new expressions generate review findings rather than automatic approval.

## Creative coding and asset boundaries

- p5.riso is not installed, copied or vendored. Its Anti-Capitalist License is not the commercial-use basis for Kuşluk. Independently authored standard color/screen math remains the implementation path.
- [p5.grain's actual upstream LICENSE](https://github.com/josephmiclaus/p5.grain/blob/main/LICENSE) is MIT, copyright 2022–2026 Joseph Miclaus and Gorilla Sun, checked on 17 October 2026. It can be evaluated as a compatible optional dependency with notices retained; no reimplementation is required solely because of its license. It is not currently installed.
- p5.js is a separate optional host with its own license/distribution obligations. It is not bundled into the MIT render core by this work.
- Plex and Paper Mono are OFL fonts with their own notices and acquisition records. Brand artwork, owner photographs and reference artwork have separate rights; a code license does not grant media redistribution permission.
- Fonteditor, the PDF/reporting stack and native Skia are candidates to exclude from the lean creative-coding import. That packaging boundary is implemented in #71–#74 and #83: core/Canvas/inputs default imports exclude these tools.

See [the existing licensing policy](LICENSING.md), [color handling](COLOR-MANAGEMENT.md) and [creative coding plan](https://github.com/yigit-denktas/stipra/issues/70). Two incomplete-notice findings are resolved by `licenses/third-party/supplements.json`, which pins original evidence hashes, package versions and the referenced SPDX MIT text. Three binary/prebundle provenance findings remain. Issue #14 stays open for those concrete gaps. Physical print acceptance is a separate gate.


## Exact evidence and artifact boundaries

The notice extractor now scans both consecutive line comments and block comments in fontkit's unminified UMD artifact. Its embedded Google/Brotli code expressly names Apache-2.0; a package-level MIT label alone missed that evidence. The original package notices are never replaced. Canonical terms in `licenses/third-party/` are attributed supplements, not invented author grants. Changed original notice bytes fail the hash check rather than silently reusing a supplement for a different release.

The remaining questions are specific: fontkit needs an exact prebundled source/component inventory; skia-canvas 3.0.8 needs platform-binary Rust/Skia/codec notices; fonteditor-core 2.6.3 publishes a WOFF2 WASM matching its npm git revision, but its build references WOFF2/Brotli sources without a complete pinned source/build provenance record in the published package. A source repository's license does not by itself prove the dependency inventory of a compiled artifact. See `licenses/third-party/artifact-review.json` for measured hashes and primary source references. None of these external binary artifacts is committed.

The broad release gate remains deliberately nonzero. This does not say every artifact is blocked identically: the static site excludes native Skia and fonteditor WASM, but includes the fontkit browser export module; the three lean local packages exclude all three. Optional p5 host files retain their separate LGPL notice/source link. No npm package or executable is published as part of this consolidation.


## Check the artifact being distributed

`npm run check:distribution` builds and packs the three **private local** library packages. It requires Node/npm and the system `tar` command (verified on Linux); it never installs or publishes them and runs `npm pack --offline --ignore-scripts`. The check reads each actual archive, requires the reviewed file list and original Stiprā MIT notice, rejects runtime dependencies/lifecycle scripts, and uses esbuild to resolve packed JavaScript imports. Only the declared, exact Stiprā peer versions are permitted. Unexpected files, missing relative modules, foreign imports and unresolved dynamic imports fail the check. The resulting `out/distribution-audit/` contains those tarballs and a JSON report with tarball/file hashes, package versions, imports and scope. CI uploads it as `lean-distribution-audit`.

This gate covers static runtime code in those exact tarballs. An application-supplied optional exporter callback, separately hosted p5, fonts, artwork and the native CLI are outside it. It neither publishes the packages nor completes #70's owner/artist usefulness decision.

Every browser PDF/ZIP exporter build also emits `<bundle>.audit.json` beside its existing dependency notices. The report records esbuild's actual inputs, bundled package versions, upstream artifact identity, output/notice hashes and remaining findings. **The existing exporter selects fontkit's UMD entry even for the ESM output**, as confirmed by the build report; both upstream UMD and alternate ES artifacts are recorded. No Skia native code or fonteditor module may enter this bundle. The report's `review-required` status is explicit: successful generation does not clear fontkit's unresolved prebundle inventory. The site as a whole also includes fonts and the optional p5 host; this report covers the exporter only.

The production audit verifies installed bytes against `licenses/third-party/artifact-review.json`. A changed reviewed JS/WASM artifact or package version fails rather than inheriting an old review. The native record applies only to Linux x64 glibc; other platforms report their actual hash as `unrecorded-platform` and remain unresolved. A matching hash means **identity**, not a complete license inventory. `npm run check:release-licenses` still exits 1 for the three findings.

## Upstream investigation, 17 October 2026

- [Fontkit source commit 72b8e42](https://github.com/Hopding/fontkit/tree/72b8e42bd6a398d496a63a6d483eabeed43861fb) contains `yarn.lock`, source and Rollup recipes, while its package metadata says 1.1.0. These are useful reconstruction inputs, but no published 1.1.1 build map was found. This investigated commit is not claimed as the proven source of that published artifact.
- [The WOFF2 build instructions](https://github.com/kekee000/fonteditor-core/blob/04c47400895f11d857ca83f5725c0c3c0dd552a5/woff2src/Readme.md) recursively clone Google WOFF2 without pinning a revision. [The build script](https://github.com/kekee000/fonteditor-core/blob/04c47400895f11d857ca83f5725c0c3c0dd552a5/woff2src/build.sh) lists WOFF2/Brotli sources but does not pin those sources or Emscripten. The matching published WASM Git blob alone cannot supply that missing build provenance.
- [Skia Canvas v3.0.8 source commit 042312a](https://github.com/samizdatco/skia-canvas/tree/042312a3f40b660b1d7dc0beba541486171bc5cc) provides Cargo metadata and [platform workflows](https://github.com/samizdatco/skia-canvas/blob/042312a3f40b660b1d7dc0beba541486171bc5cc/.github/workflows/build.yml). The workflows use stable Rust and moving build-container references. Source evidence does not establish the exact downloaded binary's compiled component/notices inventory.

None of these observations closes a finding by inference. The actionable next step remains an attributable component/build inventory for each shipped opaque artifact, or a separately reviewed replacement build. No upstream messages were sent and no external binaries were added to the repository.
