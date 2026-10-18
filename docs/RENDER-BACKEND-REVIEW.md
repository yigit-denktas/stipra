# Rendering backend review: current decision and follow-ups

18 October 2026. The owner supplied an independent AI-assisted repository/artifact review against main 71358d5. It is technical evidence, not an independent artist trial, legal opinion or physical-print observation. The complete private review was not copied into the repository. Its supplied evidence records are identified below.

## Verified here

The three alpha.1 packages are public. Fresh downloads match the committed upload record in SHA-256, SHA-512 and byte count. An initially empty-cache registry consumer installs exactly three packages with scripts disabled and passes runtime/types/replay checks. Both alpha/latest tags point to alpha.1, with additional public 0.0.0-stage versions observed. No tags, packages or versions were modified. See [the release record](evidence/npm-alpha-registry-2026-10-18.json).

The two upstream Cargo lockfiles independently count 318 package entries at Skia Canvas 3.0.8 and 328 at 4.0.0, with 49 added and 30 removed unique names. Those are source supersets, not compiled component counts. New source names include hayro/PDF, TIFF, CMS and font parsing crates. Upgrading is not established to reduce native notice obligations.

The [SLSA 1.2 FAQ](https://slsa.dev/spec/v1.2/faq) is current; the earlier 1.1 link is superseded. Inventory, notices, packaging/build provenance and independently reproduced bytes remain distinct questions.

## Reviewer findings to retain with their limits

The supplied records identify npm packaging provenance for the v4 wrapper and platform packages, plus a publish workflow that downloads/repackages release binaries. This does not attest native compile inputs or enumerate all embedded components. The reviewer inspected attestation structure, not the full cryptographic trust chain.

The sampled @napi-rs/canvas platform contains a 107-component CycloneDX SBOM, but the reviewer reports no separately itemised Skia component. An SBOM is useful inventory evidence, not a complete notice collection by itself.

Upstream resvg 0.48/relicensing facts must not be assigned to current npm bindings: the reviewer identifies @resvg/resvg-js and @resvg/resvg-wasm 2.6.2 as MPL-2.0, using resvg 0.34.0 with a fork patch. Stable node-canvas latest 3.2.3 differs from next 4.0.0-rc3. These are artifact-specific observations, not blanket clearance of alternatives.

## Work deliberately not performed

No backend upgrade, migration, native self-build, golden regeneration or release-gate weakening. No native compatibility/performance run, native notice clearance, physical print or human artist/accessibility acceptance is claimed. The proposed upstream inventory request remains unsent after the connector HTTP 403.

## Bounded follow-ups

1. Owner decides whether a self-contained offline executable is an actual product requirement. The browser, lean library and source-installed Node CLI are separate delivery scenarios.
2. Under #14, design artifact-specific release gates: lean/browser checks can pass while native/container/executable review stays required. CI currently runs non-gating audit:licenses and separate lean/browser checks; it does not run check:release-licenses. A green workflow is not native clearance. Review any proposed gate change before implementation.
3. Under #14, fix checkout portability for hash-pinned notice text. The reviewer demonstrates core.autocrlf=true changing MIT-terms.txt to CRLF and causing a hash failure before the native finding. Prefer a narrow LF checkout policy; do not weaken the hash comparison or modify the retained license terms. This fix is not included in the publication housekeeping.
4. If justified, run one isolated 3.0.8-versus-4.0.0 experiment with pinned prefixes and fresh processes. Record JS mask identity, decoded RGBA and encoded bytes as three distinct results. Use procedural fixtures, explicit real font faces and fixed color/alpha/geometry contracts. Stop and review geometry, color, alpha, shaping or QR changes; do not regenerate goldens automatically. Exact decoded proof equality can be a promotion criterion, but expected upstream antialiasing/color fixes may justify an explicitly reviewed change rather than proving the experiment useless.

Source anchors: [Skia Canvas release notes](https://skia-canvas.org/releases), [v4 publish workflow](https://github.com/samizdatco/skia-canvas/blob/v4.0.0/.github/workflows/publish.yml), [resvg binding manifest](https://registry.npmjs.org/@resvg%2fresvg-js/2.6.2), [node-canvas registry](https://registry.npmjs.org/canvas). Local boundaries and the remaining native gate are in [the audit contract](DEPENDENCY-AUDIT.md).

## Supplied evidence identity

- repo-experiment.md: 69643 bytes; SHA-256 `157e6f2daa3ab7417227432192c3a75ef1939263b4829a73caf9f5ec065b3d04`.
- backends-registry.md: 48154 bytes; SHA-256 `3fc27667421ad78e85200ef404421a7a84588e6d0a8f5a22003c7770fdaadad0`.
- licensing-provenance.md: 48136 bytes; SHA-256 `524965cbfda5dc7a569765a0786c32cc983cf85ea373a6cc8984a006a30a5ac1`.
