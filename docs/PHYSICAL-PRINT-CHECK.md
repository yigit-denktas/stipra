# Physical print check

Status: not performed. This is an operator procedure and evidence template; no printer or press has been measured by the automated suite.

Generate a photo-free check kit:

```sh
node scripts/physical-print-kit.js /private/new-print-kit
```

1. Open `scale-and-legibility.pdf`. Select A4 landscape, Actual size / 100%, and turn off Fit / Shrink. Print its single page. Measure the horizontal and vertical 100 mm rules, compare the text and line specimens, and record the printer, stock, driver and scaling settings in `print-observations.json`.
2. Inspect either recipe ZIP's `report/separation-sheet.pdf`. These pages explain the print, but their image thumbnails are not full-size masters. Extract `screened/ink-*.png` for pre-screened masters or `plates/ink-*.png` if your print shop wants continuous-tone input. Confirm screening with the operator; do not apply two screens inadvertently.
3. Print the aligned master PNGs at their declared 300 DPI. The authored fixture should span 101.6 × 76.2 mm. Ensure no automatic crop, fit, borderless enlargement or image enhancement. Compare layer dimensions and origins. Source transparency must leave paper uninked; texture is present only on the inspection report.
4. Compare shadow steps, pale tones, thin lines and 8/9/10/12 pt lettering. Overlay the printed plates or register physical passes with the printer's normal procedure. Record missing details, banding, unexpected scaling, feed issues and registration drift. Do not promote a digital recipe based only on a lower ink percentage.
5. For Riso or screen printing, separately record actual ink names, pass order, stock, machine screening, drying and observed overlap. A home inkjet/laser check can verify size and legibility but cannot establish spot-ink color, dot gain or press calibration.

Use a ruler and retain the printed sheet. Record actual measurements and observations, not expected values copied into measured fields. A proposed geometry check is within 0.5 mm of each 100 mm rule; it is a declared project review tolerance, not an industry or printer specification. Any result still needs the owner's review. Keep `status: not-run` until a person actually prints and records evidence. Do not publish photographs from private owner jobs with the evidence.

The kit includes a one-page vector scale/legibility PDF, an authored 1200 × 900 px source, two shared-style print packages, hashes and a blank observation record. It contains no owner photographs. Its vector ruler is exact in PDF coordinates; source image dimensions are recorded independently.

After printing, set the record's status to `recorded`, supply the operator/date/printer/driver/stock, actual measurements and the three observation notes. Add 1–16 local evidence entries as `{"path":"ruler.jpg","sha256":"<64 lowercase hex characters>"}`. Keep the kit and evidence private. The kit manifest hashes the original blank template; preserve it, and retain the completed record separately when recording that change.

```sh
node scripts/check-print-observations.js /private/kit/print-observations.json
```

This checks completeness, file hashes, safe local paths and measured geometry against the proposed 0.5 mm tolerance (also used for the fixture's width/height). It rejects blank records, missing measurements and evidence outside the record directory. Exit 0 means the record was checked; inspect `geometryWithinProposedTolerance` for the declared measurements. The result always requires human review: it cannot authenticate the operator, printing, visual quality or calibration, and never turns `ownerApproved` or `physicalInkCalibrated` into an automated pass. An evidence image alone does not establish correct printing. No completed operator record has been submitted.
