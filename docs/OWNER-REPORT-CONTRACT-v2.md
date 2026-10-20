# Owner-photo inspection report contract v2

**Decision: 20 October 2026, #124.** Preserve the implemented ratio-aware A4 layout and require a separately labeled substrate preview in both HTML and PDF. The owner authorized this work after the proposed split of #124/#125. This is a report contract revision, not an acceptance result or a change to production masters.

## Historical specification and scope

The original [owner-photo specification](PRINT-PACKAGE-ACCEPTANCE.md), including its landscape-only G07/C5 wording, and the [metadata catalog](../tests/fixtures/owner-photo-fixtures.json) remain available. The catalog's `target.inspectionSheet` describes the original specification; it is not the current report-orientation policy. Its source identities, native sizes and planned 2/3/2 inks remain binding.

For **new layout-v8 packages**, this revision supersedes only the report-orientation clauses in G07 and C5 and makes G08's inspection-content requirement explicit. Every other acceptance criterion remains unchanged. Previously recorded FAIL/NOT RUN results and packages retain their identities; new results require a fresh run against this named revision. Do not relabel the old execution as PASS.

## G07 / C5: A4 orientation and geometry

Use the existing renderer rule: `heightPx > widthPx * 1.08` selects portrait; otherwise select landscape. Every page within one report uses the same orientation.

| Source | Inspection PDF | Width × height |
| --- | --- | --- |
| A, sculpture (805 × 644 px) | A4 landscape | 297 × 210 mm |
| B, forest (2048 × 1365 px) | A4 landscape | 297 × 210 mm |
| C, beach (1152 × 2048 px) | A4 portrait | 210 × 297 mm |

Square and near-square sources use landscape. All image panels fit the complete source frame without cropping, stretching or rotation. The page count responds to ink count and caption length; an extra documentation page is preferable to missing labels or footer collisions. The minimum PDF text size remains 9 pt.

The report is an inspection document. Its thumbnail sizes do not change production pixels, trim, DPI, origin, proof registration or physical plate dimensions. The original 300-DPI master sizes remain 68.16 × 54.53, 173.40 × 115.57 and 97.54 × 173.40 mm respectively. This revision does not change the earlier square/landscape/portrait typography-study deliverables.

## G08: matching inspection content

HTML and PDF must contain the same full-frame image identities in this order:

1. Original image (or explicitly labeled authored composite).
2. Simulated overprint.
3. Paper / substrate, labeled **not a physical ink**.
4. Each individual grayscale ink plate, in recipe order, with ink name and its complete coverage/screen caption.

A textured page background alone does not satisfy the substrate panel requirement. The substrate preview is the existing `proof/paper.png`, not a newly textured or recolored production plate. Ink swatches identify physical inks only; substrate never increases ink count.

Responsive HTML and paginated PDF may use different line breaks, headings and panel sizes. Content equivalence requires matching image bytes, names, notes and ink order, plus the existing settings, source fingerprint, physical dimensions, paper/seed and uncalibrated-proof explanation. It does not require pixel-identical page composition. HTML's shared page texture remains a simulation.

## Verification and remaining acceptance

[Implementation review and bounded test evidence](REPORT-PARITY-2026-10-20.md).

`tests/report-layout.test.js` checks portrait/landscape 2/3/8-ink pagination, matching HTML image hashes and PDF audit order, complete captions, A4 dimensions, full-frame image geometry, readable text and repeatability. `tests/owner-print-acceptance.test.js` preserves the original catalog/specification assertions and checks this explicit revision separately.

Run `node scripts/review-report-parity.js --out out/report-parity` for six **authored synthetic QA targets**, HTML/PDF pairs and layout audits. These are test targets, not substitutes for the private owner photographs. Render PDFs at intended page size and inspect HTML at desktop and phone widths when Chromium is available.

A report regression pass is not an owner-photo package-pass. #123 still requires its full G01–G11 and image-specific review; #125 owns the legacy recipe defects. Human accessibility remains open. Physical prints and independent artist trials remain owner-deferred. No new release or press-calibration claim follows from this revision.
