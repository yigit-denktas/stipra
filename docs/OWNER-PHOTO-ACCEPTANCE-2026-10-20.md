# Owner-photo acceptance execution - 20 October 2026

**Partial execution; 0 of 3 packages accepted.** Source: `f59c8d9fb144294e41209bc76d8d1c83701005ee`. Reviewer: Codex agent. This is neither an independent human/artist trial nor physical print validation.

The three original photographs were retrieved privately and match every SHA-256 and byte length in `tests/fixtures/owner-photo-fixtures.json`. The canonical `scripts/owner-photo-batch.js` generated fresh 300-DPI packages without changing any recipe. Every ZIP passes the existing package verifier, including source bytes, opaque grayscale masters, frame/origin, physical scale, file hashes and embedded report-font identities. A second same-environment build reproduces every archive member byte-for-byte; all 23 decoded PNGs also match.

| Fixture | Native frame | Native master at 300 DPI | Inks | Report | Package acceptance |
| --- | --- | --- | --- | --- | --- |
| A | 805 x 644 px | 68.1567 x 54.5253 mm | 2 | 2 pages, A4 landscape | FAIL / incomplete |
| B | 2048 x 1365 px | 173.3973 x 115.57 mm | 3 | 2 pages, A4 landscape | FAIL / incomplete |
| C | 1152 x 2048 px | 97.536 x 173.3973 mm | 2 | 2 pages, A4 portrait | FAIL / incomplete |

## Findings retained as open work

- [#124](https://github.com/yigit-denktas/stipra/issues/124): unchanged G07 requires landscape reports for all images, whereas the current ratio-aware system intentionally gives C a portrait report. HTML also contains a separately labeled substrate preview not present as a corresponding panel in the PDF (literal G08 content mismatch). The expectation was not rewritten to make output pass.
- [#125](https://github.com/yigit-denktas/stipra/issues/125): native source/proof crops and all six PDF pages expose loss of sculpture ridges/recess gradation, forest depth/display distinction and the two beach figures under the legacy owner-A/B/C recipes. These are agent observations, not mathematical aesthetic certification.

The batch runner uses the frozen `examples/recipes/owner-A/B/C-*` files, **not** the separately approved opt-in `forest-balanced` and `coast-tonal` specimens. This execution does not retract their scoped owner approval, alter defaults, or reopen the completed comparison #43. Any change to the specified three-ink forest acceptance scope requires an explicit decision.

Private JSON records all 33 common-gate and 15 image-specific statuses and their evidence. FAIL/NOT RUN criteria prevent acceptance. The existing specification/checklist and metadata-only fixture catalog remain preserved; that catalog is not an execution database. Current execution status is owned by [#123](https://github.com/yigit-denktas/stipra/issues/123), not inferred from the historical catalog's status string.

## Verification and limits

- Known-pixel grayscale polarity survives encoding and decoding: coverage 0/128/255 becomes gray 255/127/0.
- Import, print-package and workflow regressions: 23 tests pass, zero skipped. Ledger/history/site/README/acceptance-spec checks: 16 pass, zero skipped.
- The site builds successfully. Taste source lint reports zero failures/warnings. The browser inspector could not execute locally because no Chrome/Edge/Chromium executable is available; no local desktop/phone screenshot review or browser HTML/PDF visual parity is claimed. No CSS or page layout is changed.
- Six PDF pages were rendered and agent-reviewed; native detail crops are retained privately. Physical and independent artist trials remain owner-deferred; human accessibility remains open/not performed.
- Source hashes and aggregate measurements may be public; photographs, source/proof crops, ZIPs and image-bearing reports remain private. No prior evidence, archive, recipe, golden or original SVG was changed.

Reproduce privately at the recorded source SHA with `node scripts/owner-photo-batch.js --sources PRIVATE_DIR --out FRESH_PRIVATE_DIR --dpi 300`, then `node bin/stipra.js verify --input PACKAGE.zip --json`. Use a second fresh directory for replay. New acceptance results require evidence; this document does not authorize a renderer change, new recipe family or Experiment 2.
