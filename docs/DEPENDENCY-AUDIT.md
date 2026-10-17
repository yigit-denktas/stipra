# Dependency inventory and distribution gates

Audit recorded 17 October 2026 for the production npm graph locked in `package-lock.json`. This is an engineering inventory of actual packages and retained evidence; it does not turn package declarations into a blanket legal clearance.

```sh
npm ci
npm run audit:licenses
npm run check:release-licenses
```

The first audit command writes `out/license-audit/dependency-audit.json` and `THIRD-PARTY-NOTICES.txt`. It checks installed versions against the lock, records package integrity, selected license and SHA-256 of notice evidence, and fails for absent evidence or uninstalled runtime packages. It inventories 65 production package locations in the current lock; development build tools are outside that count. The report contains no machine-specific absolute paths or owner imagery.

The release-check command exits nonzero while findings remain. Ordinary CI generates and uploads the inventory; a green CI inventory step does **not** mean commercial redistribution is cleared. The build separately emits notices for the modules actually included in the browser export bundle, retaining the Node-derived notice inside prebundled fontkit as well as package notices. The static site distributes Plex OFL notices, and generated print ZIPs now include the embedded report font's full OFL text with a manifest/hash entry.

## Findings requiring follow-up in #14

| Component | Evidence | Remaining action |
| --- | --- | --- |
| dijkstrajs | Published MIT declaration, author notice and disclaimer; grant terms linked rather than fully included | Resolve the incomplete distributed notice against authoritative upstream terms |
| string-split-by | Published MIT declaration and author line | Retain complete applicable terms with the author attribution |
| @pdf-lib/fontkit | Published MIT declaration and embedded Node notice, now retained in bundle notices | Inventory prebundled components and complete their attribution; the npm dependency list is insufficient |
| skia-canvas | MIT npm wrapper; install downloads a platform native binary | Verify native/Rust/Skia/codec dependency notices for the exact platform binary before bundling an executable |
| fonteditor-core | MIT legacy `licenses` field and full LICENSE; includes WOFF2 WASM | Verify WOFF2/Brotli artifact provenance before bundling its dependency tree; the static site does not distribute this WASM |

The audit selects JSZip's MIT alternative explicitly and retains the dual-license evidence. Pako's combined MIT AND Zlib declaration is retained. Fonteditor's legacy metadata is read rather than incorrectly treating its absent singular `license` field as an unknown license. Other recognized declarations are MIT, ISC, BSD, Apache-2.0, OFL, 0BSD, Zlib and CC0; new expressions generate review findings rather than automatic approval.

## Creative coding and asset boundaries

- p5.riso is not installed, copied or vendored. Its Anti-Capitalist License is not the commercial-use basis for Kuşluk. Independently authored standard color/screen math remains the implementation path.
- [p5.grain's actual upstream LICENSE](https://github.com/josephmiclaus/p5.grain/blob/main/LICENSE) is MIT, copyright 2022–2026 Joseph Miclaus and Gorilla Sun, checked on 17 October 2026. It can be evaluated as a compatible optional dependency with notices retained; no reimplementation is required solely because of its license. It is not currently installed.
- p5.js is a separate optional host with its own license/distribution obligations. It is not bundled into the MIT render core by this work.
- Plex and Paper Mono are OFL fonts with their own notices and acquisition records. Brand artwork, owner photographs and reference artwork have separate rights; a code license does not grant media redistribution permission.
- Fonteditor, the PDF/reporting stack and native Skia are candidates to exclude from the lean creative-coding import. That packaging boundary is #71; it is not implemented here.

See [the existing licensing policy](LICENSING.md), [color handling](COLOR-MANAGEMENT.md) and [creative coding plan](https://github.com/yigit-denktas/stipra/issues/70). Issue #14 remains open for the concrete distribution findings above. Physical print acceptance is a separate gate.
