# Studio workflow review — 20 October 2026

Agent review; not human accessibility, artist or physical acceptance. Related: #13, #70, #123. Owner authorized the maintenance/review package after #129.

## Integration and live hosting

PR #129 was merged from reviewed `45c1f2f` as `86de649798ffed1e951cb6527c4d1f14421cba0c`. Both post-merge Verify Stipra and Publish GitHub Pages mirror runs passed. No acceptance issue was closed.

The first live check found `apps.yigitdenktas.com/stipra/` serving **LINK**, not Stiprā. The Pages project correctly built `86de649`; the shared hostname's separate Worker served LINK assets on every non-counter path. Added a distinct, binding-free `stipra-prefix` Worker and only these routes:

- `apps.yigitdenktas.com/stipra`
- `apps.yigitdenktas.com/stipra/*`

The Worker serves the existing `yigitdenktas-apps.pages.dev/stipra/` tree. It preserves path/query, redirects the bare prefix, rewrites origin-relative redirects, accepts GET/HEAD only and strips incoming cookies/authorization. DNS and the existing LINK Worker/assets/counter are unchanged. The primary Studio was subsequently inspected in the connected Edge browser. Deployment/rollback instructions: [static hosting](STATIC-HOSTING.md).

## Rendered report defect and correction

A real browser check of the generated 2-ink portrait HTML showed plate images rendering at their natural 320px height inside 148px panels. They extended into captions and settings. `max-height:100%` alone did not constrain the replaced element in its grid item.

Images now fill a definite panel box with `object-fit:contain`, preserving the complete source frame; captions wrap without truncation. Header content wraps. A labeled, keyboard-focusable settings region scrolls horizontally on phones without widening the document. Existing ink, paper, image bytes, panel order and all PDF generation are unchanged.

Generic 2-ink portrait and 8-ink landscape HTML were inspected with the connected Edge browser, including a phone viewport (actual document width 375 CSS px). Browser geometry confirmed image elements stay within panels and document width does not overflow. Settings remain a full table within their scroll region. For temporary browser inspection only, two photo-free QA reports were staged separately; their embedded Plex regular/mono URLs were replaced by the identical public font files. Image bytes and report CSS were retained; no owner artwork was staged. The temporary route and Worker were removed after review.

The six generated 2/3/8-ink portrait/landscape report pairs retain byte-identical PDFs across this HTML correction. All 17 PDF pages were rendered and reviewed as a contact sheet for gross layout issues. These authored QA targets are not private owner-photo acceptance fixtures.

## Creative-code/export check

The live p5 instance example advanced frame 0 → 1, retained its three authored passes, and completed export with the visible `package exported` status. Its phone view retained proof, plate controls and export action. This tests the deployed example, not an independent artist's first use.

`examples/creative-use/morning-window.cjs` was rerun with the current repository core: 1440×1800 px, 300 DPI, seed 193, green linework plus coral hybrid screen at 40 LPI. Both plate coverage/screen hashes match the prior recorded illustration, repeat masks are identical and the core proof matches the exporter. The frozen-layer package replay completed successfully (2 inks, 300 DPI), providing a separate package verification path. No production recipe/default change was needed.

The download event did not resolve in browser automation. Browser security policy blocks the internal downloads page; it was not bypassed. Consequently the UI's success status is recorded separately from inspecting the actual browser-downloaded ZIP. Node package generation/replay is not presented as proof of that download.

## Validation and outstanding acceptance

Regression checks: 208/208 Node tests pass after the site build, including the two routing tests; `check:exports` passes. The focused report/routing and documentation tests pass.

Run `npm run build:pages`, `npm test`, `npm run check:exports` and `node scripts/review-report-parity.js --out NEW_DIRECTORY`. Run the drawing with `node examples/creative-use/morning-window.cjs NEW_DIRECTORY`, then `node scripts/reproduce-layers.js NEW_DIRECTORY/morning-window.zip NEW_DIRECTORY/replayed.zip`.

#123 remains **PARTIAL EXECUTION / 0 of 3 accepted**. Generic HTML review does not close the pending private owner-photo rendered HTML review or named human package acceptance. Human accessibility remains open; physical prints and independent artist trials remain owner-deferred. Native bundled distribution still awaits #14 notices. No release publication, study regeneration or Experiment 2.
