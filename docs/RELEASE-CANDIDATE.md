# Digital acceptance and the library candidate

The owner selected npm account `yigit-denktas` and authorized an experimental alpha. The three publishable candidates are `@yigit-denktas/stipra-core`, `@yigit-denktas/stipra-canvas` and `@yigit-denktas/stipra-inputs`, each at `0.1.0-alpha.1`. Authenticated uploads of all three exact audited archives were accepted by npm on 18 October 2026. npm reports processing; registry availability, downloadable hashes and a clean registry install remain unverified. See the [upload record](evidence/npm-alpha-upload-2026-10-18.json). This is not a print-quality approval. No new runtime dependencies were added for these checks.

```sh
npm ci
npm test
npm run check:goldens
npm run check:library-candidate
npm run audit:licenses
npm run check:release-licenses
```

The final command deliberately exits 1 while the remaining native finding remain. A successful inventory or lean-library check does not override it.

## Saved artwork acceptance — #13

`tests/fixtures/prehnite-goldens.json` records exact SHA-256 and byte counts for all six native 2020 × 779 procedural composites and every active monochrome plate. The test compares against saved values, not a second render from the same code. `check:goldens` emits those original SVGs and its checked report under `out/acceptance-goldens/`; CI uploads `procedural-acceptance-goldens`. Existing saved generic 2/3/4-ink masks and actual browser/export evidence remain in the CLI/export workflow artifact.

These are vector serialization goldens. They catch geometry, typography, screen and palette changes in the serialized scenes; they do not measure cross-rasterizer pixel identity or artistic quality. Change the fixture only after inspecting the old and new native composites and all affected masters. There is no automatic update flag. Generated artwork stays out of Git; only its hashes are committed.

The generic vector path verifies that changing paper seed/color leaves every monochrome master byte-identical. Prehnite now also accepts an explicit `paperSeed`: its substrate changes independently while all six native plate exports remain identical. Omitting it preserves the old defaults and every saved golden. The zero-softness path has geometric checks for genuinely shared straight edges in either traversal direction; the deliberately softened default appearance is preserved. This is not an automatic approval of the optional geometry redesign (#3).

`npm run check:accessibility` runs axe-core 4.10.3 against nine actual pages in Chromium: studio, import editor, Prehnite editor, guide, sketches, regions, roadmap, changelog and sitemap. The CI artifact `accessibility-acceptance` records passes, violations and incomplete checks for WCAG 2/2.1 A/AA tags. Incomplete checks need manual review; zero detected violations is not a full accessibility certification. Axe is an MPL-2.0 development-only audit tool and is not shipped in the site or libraries. Existing interaction tests still exercise import, masks, keyboard labels and export. The same audit also sends actual Tab/Enter events through Chromium on all nine generated destinations: the first Tab must reveal the skip link and Enter must move focus to main content. This bounded automated keyboard check does not replace a human screen-reader trial.
Physical evidence still needs an operator. The [print procedure and record checker](PHYSICAL-PRINT-CHECK.md) distinguish a filled observation record from an authenticated physical result. #13 remains open.

## Exact library consumer — #70

`check:library-candidate` first runs the actual tarball/import/notice audit, then installs those same three archives together in a fresh temporary project using offline npm with lifecycle scripts disabled. It requires exactly core, Canvas and inputs in the installed graph; there is no PDF stack, native codec, font, drawing framework or exporter callback in that graph.

The consumer imports package names through their public export maps, including `@yigit-denktas/stipra-inputs/canvas`. It exercises Canvas capture → named regions → authored inks → core rendering, ESM/CJS parity, unchanged coverage and inert source-project replay. Strict NodeNext TypeScript checks the public entry points together. A synthetic Canvas readback fixture tests capture/mapping without adding a native library to the consumer; actual rendering and p5 integration remain the separate real Chromium CI checks.

`out/distribution-audit/library-candidate.json` records runtime, exact archive hashes/bytes, installed graph, checks and remaining decisions beside the three tarballs. CI uploads the directory as `lean-distribution-audit`. Compare hashes with that report before sharing an archive. Reports are generated per run; changed bytes require rerunning the check. This does not test or authorize an `npm publish` operation, registry namespace access, release tags or optional downstream exporter dependencies.

## Artifact-specific gates — #14

| Intended artifact | Verified here | Remaining gate |
| --- | --- | --- |
| Experimental core/Canvas/inputs tarballs | Exact files/imports/notices, isolated offline install, public runtime/types | Registry availability, downloadable hashes and clean install; independent artist usefulness review remains separate |
| Browser PDF/ZIP exporter | Replacement Fontkit own-source/maps, resolved dependency versions, actual output hashes and complete notices | None in this exporter artifact; separate host/font/media obligations remain |
| Bundled native CLI/executable | Installed Linux x64 glibc binary identity and production graph inventory | Exact native Rust/Skia/codec notices for the downloaded platform binary |
| Printed results | Digital geometry and an operator record validator | Actual print observations, visual review and any calibrated-ink claims |

One native provenance gap remains open. Fonteditor is removed; source-mapped Fontkit replaces the old opaque bundle. [Dependency evidence](DEPENDENCY-AUDIT.md) records the exact replacement and native boundary. Old retired artifacts are not retrospectively cleared.

Publish only the exact audited tarballs, in core → canvas → inputs order, with `--tag alpha --access public --ignore-scripts --registry=https://registry.npmjs.org/`. Verify `npm whoami` is `yigit-denktas` first and compare each registry integrity value with `distribution-audit.json` afterward. The root application remains private. The audit rejects unreviewed names, versions, peers, registry and tags. Publication is authorized for the experimental digital library; independent artist feedback remains unperformed. Full native/export distribution and physical claims keep their own gates. No identity approval, owner-photo redistribution or physical-print certification follows from library acceptance.
