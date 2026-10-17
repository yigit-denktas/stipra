# Browser and CLI print packages

The browser's Print package ZIP button runs the same `src/print-package.js`, report layout, screening, diagnostics and recipes as the CLI. Browser adapters replace only Canvas/image encoding, font loading and SHA-256. The browser loads its export bundle from the same host on demand; no artwork leaves the device. A failed or invalid render disables export. Concurrent imports use a selection counter so an older decode cannot replace a newer selection.

The export contains original bytes, normalized source PNG, unscreened plates, aligned screened masters, a proof with requested offsets, PDF and HTML inspection reports, recipe attachments, diagnostics and a hashed manifest. DPI is stored in exactly one PNG pHYs chunk. Geometry, trim, inks, screen frequency and seed are recorded. Browser paper uses the current recipe substrate, matching CLI `--paper recipe`. Current browser exports use no added trim marks (`marksMm: 0`); the CLI additionally supports external marks and alternate stock selection.

The two environments share a package contract and render algorithms. PNG encoder output, PDF serialization, antialiasing, texture and image decoders can differ between browser and Skia; byte-for-byte ZIP equality is not promised. For identical decoded RGBA and normalized recipes, mask pixels must match. Browser smoke captures the actual UI download, decodes its aligned masters and compares them with the shared engine, verifies original source and every manifest hash, checks physical PNG density and confirms embedded PDF recipes. Node tests verify CLI package pixels and the same geometry/screen contract. Source ICC policy #44 remains open.

Production masters always have zero simulated registration. Only `proof/composite.png` uses proof offsets; both production and proof screen recipes are saved. The standalone Screen recipe JSON export is the aligned production recipe. Source paper texture never contaminates masters. PDF report thumbnails are inspection images, not plates to print at master size.

The lab and guide share `web/stipra/shared.css`: real Plex fonts, the original four-color identity, warm dotted paper, sharp rules and focus outlines. Existing source/proof/plate arrangement remains intact. Brand wordmarks remain lowercase. The original owner logo SVG is unchanged.

## Browser test timing

The previous smoke runner advanced Chrome's virtual clock while file reads and decoding ran outside that clock. This could exhaust polling timers before real IO completed. The runner now opens a local-only Chrome debugging pipe and polls explicit pass/fail state against a 60-second wall-clock deadline. Assertions and ordinary asynchronous file handling remain enabled. This removes that timing mechanism; repeated CI runs are still required to assess residual flakiness.

## Build and reproduce

```sh
npm ci
npm run build:github-pages
npm test
node scripts/browser-smoke.js
STIPRA_SMOKE_PAGE=web/stipra/browser-smoke.html STIPRA_SMOKE_EXPECT=BROWSER_SEPARATION_PASS node scripts/browser-smoke.js
```

The export bundle embeds licensed Plex font bytes and the unchanged brand palette source, with dependency notices beside it. Local output is not published to a server. Keep any ZIP carrying owner artwork private.

Physical verification: [print-check procedure](PHYSICAL-PRINT-CHECK.md). Browser and Node checks establish software behavior, not physical print quality.
