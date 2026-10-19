# Acceptance handoff — 19 October 2026

PR #98 is merged as `e4f7ee6`. Its exact head passed 75 CI steps and 16 strict before/after CSS comparisons. The original paper, palette, Plex typography, lowercase wordmark and CSS reference fixture remain intact.

| Work | Completed in this session | Still requires evidence |
| --- | --- | --- |
| Roadmap landing | Owner-authorized merge of #98 | First genuine release-history action, when a release is actually published |
| Native notices / #14 | Approved request posted as [skia-canvas #309](https://github.com/samizdatco/skia-canvas/issues/309) | Maintainer response and review of attributable compiled-component notices; native release gate stays blocked |
| Acceptance / #13, #70 | Fresh photo-free scale/legibility kit, verified packages, blank records and instructions | Actual printing, independent artist trial and human assistive-technology observations |
| Separation / #43, #47, #34 | All three original hashes verified; forest study reproduced; five real-photo comparison packages generated and verified privately | Owner/artist judgment and intended-size print observations |
| Public text | Larger secondary text and 70ch paragraph/list measure | Independent reading feedback; automated tests do not establish human acceptance |

## Start the real trials

The private handoff archive has `operator/`, `artist/`, `forest/` and `coast/` folders. It includes the existing operator procedure, ruler PDF, procedural print packages, exact-version artist instructions, blank records, original-frame photo comparisons and a file-hash manifest. Image-bearing material is private; do not attach it to public issues or commits. Public evidence contains hashes and measurements only.

1. **Operator:** print `operator/scale-and-legibility.pdf` at Actual size / 100%, then the 300-DPI masters as explained in `operator/READ-ME.md`. Record actual ruler/master measurements, printer, stock, legibility and registration. Retain the unchanged blank template separately. Run `node scripts/check-print-observations.js /private/completed-record/print-observations.json`. The blank record is rejected; a complete record is still subject to human review.
2. **Independent artist:** a person other than the implementer installs the exact three alpha.1 packages, applies Stiprā to their own existing Canvas/p5 sketch, inspects two passes, exports and replays. Complete `artist/artist-trial-record.json`, including failures, time and whether the workflow is useful. An agent rehearsal or the owner's approval alone is not independent feedback.
3. **Human accessibility:** record browser/OS and assistive technology. With keyboard only, follow Skip to content, use More, search for alpha.1, open a capability/source and return to Studio. At 200% zoom inspect reading order, reflow and focus. With a screen reader, check landmarks, summary state and search-result announcements. Record actual barriers and the route/step; no observations have been supplied yet.

No participant or printer is connected to this session. No invitation was sent to an unnamed person. #13 and #70 remain open until genuine records are returned.

## Artistic decisions from the digital review

**Forest:** retain two inks as the starting recommendation. The third coral pass changes 1.2416% of pixels by more than one encoded channel unit; that is not a perceptual or physical usefulness verdict. `forest-contrast` anchors the dark background better than `forest-depth` in this designer review, but full green coverage in about 13.13% of pixels can conceal shadow texture. Compare stumps, antlers, foliage and the distant display at actual size. The tonal two-/three-pass comparison keeps both common masks identical.

**Beach:** `coast-duotone` retains the blue atmosphere better than the tonal-key control. The added plan compares 50 against 75 LPI at 300 DPI: coral pitch 6px against 4px, with identical continuous-tone ink masks and an unchanged solid blue plate. Coral screened means are 6.9289% and 6.9370%. Finer dots reduce the coarse screen appearance in the digital detail crop, but do not by themselves fix the weak seated-figure contrast. Do not promote 75 LPI as universally preferable or physically printable; confirm the selected output process. Artist-authored local masks remain available for deliberate detail control.

**Sculpture:** a forest treatment is not a universal photographic recipe. Its dark background still consumes about 75% key coverage even in forest-depth; inspect fine ridges separately. No default recipe, published library bytes, source photo, golden, native backend or ink calibration changed.

Reproduction uses the existing CLI:

```sh
node scripts/review-ink-contribution.js --sources /private/originals --out /private/new-forest-study
node scripts/review-separation-quality.js --sources /private/originals --out /private/new-quality-study
node bin/stipra.js compare --input /private/originals/forest.jpg --config examples/workflows/forest-acceptance.json --out /private/new-forest-packages --json
node bin/stipra.js compare --input /private/originals/beach.jpg --config examples/workflows/coast-detail.json --out /private/new-coast-packages --json
```

Use the actual local filenames. The source hashes must match `tests/fixtures/owner-photo-fixtures.json` for the owner-fixture review scripts. Generic CLI compare accepts other authorized artwork, too. All five package jobs retain the complete source frame, 300 DPI, seed 42, zero marks and the same explicit rag stock within a comparison. Cropped images are labeled inspection details, never replacement production masters. Numeric evidence is in [the run record](evidence/acceptance-quality-2026-10-19.json).

## UI scope and verification

This follow-up raises document status text to 14px, document notes to 16px, footer text to 14px and small navigation/Studio labels to at least 13px. Running document paragraphs/list items use a 70ch maximum. It retains native disclosure, visible focus, all source links, brand colors, paper and the actual artwork/export behavior. Readability is the goal; no new motion, imagery, framework or logo is introduced.

The original roadmap stylesheet and its archived fixture are unchanged. Public-text changes intentionally affect auxiliary pages; the CSS comparison continues to apply both roadmap sheets against the same current shared shell. Full build, history/site checks, release gates, saved artwork/plate goldens and real browser checks must pass. Human accessibility and physical printing stay separate.
