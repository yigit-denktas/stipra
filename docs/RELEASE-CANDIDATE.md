# Digital acceptance and the library candidate

The three local packages remain private at `0.1.0-alpha.0`. This is a reviewable candidate, not a registry release or a print-quality approval. No new runtime dependencies were added for these checks.

```sh
npm ci
npm test
npm run check:goldens
npm run check:library-candidate
npm run audit:licenses
npm run check:release-licenses
```

The final command deliberately exits 1 while the three upstream findings remain. A successful inventory or lean-library check does not override it.

## Saved artwork acceptance — #13

`tests/fixtures/prehnite-goldens.json` records exact SHA-256 and byte counts for all six native 2020 × 779 procedural composites and every active monochrome plate. The test compares against saved values, not a second render from the same code. `check:goldens` emits those original SVGs and its checked report under `out/acceptance-goldens/`; CI uploads `procedural-acceptance-goldens`. Existing saved generic 2/3/4-ink masks and actual browser/export evidence remain in the CLI/export workflow artifact.

These are vector serialization goldens. They catch geometry, typography, screen and palette changes in the serialized scenes; they do not measure cross-rasterizer pixel identity or artistic quality. Change the fixture only after inspecting the old and new native composites and all affected masters. There is no automatic update flag. Generated artwork stays out of Git; only its hashes are committed.

The generic vector path now also verifies that changing paper seed/color leaves every monochrome master byte-identical. The legacy Prehnite path still has its original shared seed and deliberately softened edges. This work does not claim the optional straight-shared-edge redesign (#3), full keyboard/screen-reader auditing or an independent paper-seed architecture for that legacy engine. Existing Chromium interaction/label checks cover the implemented studio, import and sketch paths; they are not a blanket accessibility certification.

Physical evidence still needs an operator. The [print procedure and record checker](PHYSICAL-PRINT-CHECK.md) distinguish a filled observation record from an authenticated physical result. #13 remains open.

## Exact library consumer — #70

`check:library-candidate` first runs the actual tarball/import/notice audit, then installs those same three archives together in a fresh temporary project using offline npm with lifecycle scripts disabled. It requires exactly core, Canvas and inputs in the installed graph; there is no PDF stack, native codec, font, drawing framework or exporter callback in that graph.

The consumer imports package names through their public export maps, including `@stipra/inputs/canvas`. It exercises Canvas capture → named regions → authored inks → core rendering, ESM/CJS parity, unchanged coverage and inert source-project replay. Strict NodeNext TypeScript checks the public entry points together. A synthetic Canvas readback fixture tests capture/mapping without adding a native library to the consumer; actual rendering and p5 integration remain the separate real Chromium CI checks.

`out/distribution-audit/library-candidate.json` records runtime, exact archive hashes/bytes, installed graph, checks and remaining decisions beside the three tarballs. CI uploads the directory as `lean-distribution-audit`. Compare hashes with that report before sharing an archive. Reports are generated per run; changed bytes require rerunning the check. This does not test or authorize an `npm publish` operation, registry namespace access, release tags or optional downstream exporter dependencies.

## Artifact-specific gates — #14

| Intended artifact | Verified here | Remaining gate |
| --- | --- | --- |
| Private core/Canvas/inputs tarballs | Exact files/imports/notices, isolated offline install, public runtime/types | Owner publication scope/version and independent artist usefulness review |
| Browser PDF/ZIP exporter | Actual bundled fontkit UMD identity, emitted input/output hashes and notices | Exact fontkit prebundle component attribution/build map |
| Bundled native CLI/executable | Installed Linux x64 glibc binary identity and production graph inventory | Exact native Rust/Skia/codec notices; fonteditor WOFF2/Brotli build provenance; fontkit inventory |
| Printed results | Digital geometry and an operator record validator | Actual print observations, visual review and any calibrated-ink claims |

The three provenance gaps remain open. Their concrete resolution is an attributable component/build inventory tied to the measured shipped bytes, or a separately reviewed replacement build. The lean packages exclude those artifacts; exclusion does not clear the artifacts themselves. [Dependency evidence](DEPENDENCY-AUDIT.md) records the pinned primary sources and the WOFF2 toolchain ambiguity.

The next publication decision is bounded: whether to publish the three lean packages as an experimental digital library, at an explicitly selected version and registry namespace, after reviewing the candidate and artist task. Full native/export distribution and physical claims keep their own gates. No identity approval, owner-photo redistribution or physical-print certification follows from library acceptance.
