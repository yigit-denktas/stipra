# Report parity review - 20 October 2026

Scope: #124, report layout v8 and [owner-report contract v2](OWNER-REPORT-CONTRACT-v2.md). Base: `e0aeac82cf84a095da628216df8051641b0b08b3`. **Integration status:** merged as #127 from reviewed head `63f2572ec898ff11c01bd7abf60b5edf339c06a7` (merge `48c4d40ea5e39f450ce62f30a11e2057d331b805`). Recipe work belongs to #125; combined package acceptance remains #123.

## Change and decision

The artist must be able to inspect the same source, proof, substrate and grayscale passes in HTML and PDF. Previously HTML included the substrate card and ink notes while PDF omitted that image and notes. Layout v8 includes every card in the same order, preserves complete captions, keeps ink swatches separate from substrate and reserves space above the footer. Continuation rows retain a consistent column width and fit the source aspect ratio rather than centering short landscape thumbnails in excessively tall slots.

Retain the existing ratio-aware A4 rule; explicitly supersede the old landscape-only G07/C5 clauses through contract v2. Reject changing the historical catalog or relabeling a failed prior run. No recipe, production master, original photograph, golden, study evidence or archived delivery is replaced.

## Verification

- `npm run build:pages` succeeds, including the shared browser exporter and typography builds.
- `npm test`: **197 passed, zero failed/skipped**.
- After the final continuation-layout edit, focused report/owner-contract/README checks: **15 passed, zero failed/skipped**.
- Six authored synthetic HTML/PDF cases: 2/3/8 inks, each portrait and landscape. Final PDF page counts are 2/2, 2/2 and 4/3 respectively. These targets test geometry and labels, not separation quality.
- HTML image identities/order match the embedded PDF layout audit; captions are complete; all PDF text is at least 9 pt; all images preserve source aspect; repeated builds are byte-stable in this environment.
- Three private, source-hash-verified photo packages were regenerated using unchanged legacy recipes. Comparison with the prior private packages confirms **12 / 14 / 12 non-report members byte-identical**, including sources, proof, substrate, plates, recipes and notices. Source/output/ink/registration metadata also matches. The manifest necessarily records new report hashes and layout version.
- Final report-only renders from those unchanged archive images retain **two pages each**, A/B landscape and C portrait. All six pages were inspected at 120-DPI A4 rasterization. Substrate previews and complete plate notes are visible; no observed crop, stretch, caption clipping or footer overlap. This is agent visual review, not physical or independent human acceptance.

Reproduce synthetic outputs in a new directory:

```sh
npm run prepare:fonts
node scripts/review-report-parity.js --out out/report-parity
node --test tests/report-layout.test.js tests/owner-print-acceptance.test.js
```

`review.json` records PDF hashes, layout version and page counts. Each case also contains self-contained HTML and its embedded-layout audit. Never place private owner artwork in this synthetic output directory or public CI artifacts.

## Boundaries

No Chromium executable is available locally, so a rendered desktop/phone HTML inspection and assistive-technology review are **NOT RUN**. Structural HTML/PDF checks and the browser bundle build do not replace those observations. CI checks at the reviewed head passed; they do not replace human review.

The legacy sculpture/forest/beach proof defects remain visible and are not fixed or accepted by this report change. #123 stays **0 of 3 accepted**; the #125 recipe implementation is complete via #128, but a combined package rerun remains pending. Human accessibility remains open; physical prints and independent artist trials remain owner-deferred. The report work was merged as #127; no release, Experiment 2 or new identity is implied.

## CI follow-up: compact four-ink reports

The first PR-head CI run reached `check:exports` and exposed a missing case in the initial unit matrix: substrate plus four inks spilled onto an extra page, violating the existing two-page compact-procedural acceptance check. The 197-test local pass did not cover that separate script. Keep its two-page assertion unchanged.

For exactly four inks, layout v8 now fits substrate plus four plates in a five-column row, with existing caption/footer reservations. Other counts retain the reviewed four-column continuation behavior. Unit coverage now includes 2/3/4/8 inks and a dedicated two-page four-ink regression. `npm run check:exports` passes on Linux after the fix. The three private owner-photo cases have two/three/two inks, so this correction does not alter their previously reviewed layouts. New-head CI passed at `63f2572`; merged as #127.
