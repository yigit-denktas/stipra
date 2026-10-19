# Studio v0.9-rc.1 — experimental digital candidate

Published 19 October 2026 as experimental prerelease [v0.9.0-rc.1](https://github.com/yigit-denktas/stipra/releases/tag/v0.9.0-rc.1), exact source `aec0c23d6cc538e4e00352c66ee9543eba7694cd`. The attached browser build matches the independently verified archive. The owner-supplied live print package passes the digital verifier and two-page visual inspection. This does not establish a new npm version, final identity approval or calibrated print acceptance. Earlier incomplete observations below are historical; see [current release and creative-use evidence](CREATIVE-USE-2026-10-19.md). The existing three npm libraries remain at their immutable, registry-verified `0.1.0-alpha.1`.

## Included workflow

Import a supported PNG/JPEG/WebP or restricted geometric SVG, choose a shared Style or manual spot/CMYK separation, compare a candidate without losing current edits, adjust physical ink masks, inspect all passes and export aligned masters with a reproducible print-package ZIP. Manual spot recipes support 2–8 inks. Comparison retains the source frame, paper, DPI and seed; adoption is explicit. Solo/mute and proof registration do not alter production plate geometry.

The package includes original source bytes, continuous/screened plates, proof, normalized recipes, hashes, metadata and PDF/HTML inspection reports with retained notices. The [workflow contract](STUDIO-WORKFLOW.md) and [format matrix](CLI-WORKFLOWS.md) define exact limits. The source CLI remains available separately; this browser candidate contains no bundled Node executable or container. Artist-authored layer APIs/examples are implemented, but a general authored-layer import editor is outside this Studio candidate.

## Candidate identity and review artifact

The reviewed application baseline is [7cb3605c181488c38d9574e37c131841ebc47d1e](https://github.com/yigit-denktas/stipra/commit/7cb3605c181488c38d9574e37c131841ebc47d1e), including merged PRs #111, #112 and #115. This preparation changes release records and CI artifact retention; it does not change rendering code, recipes, fonts, defaults or goldens.

The Verify Stipra workflow archives `dist/stipra/` as `studio-browser-candidate-COMMIT_SHA` after all verification commands. Download it from the exact successful run's Artifacts section. Included `candidate.json` records the actual checked-out commit, run/attempt and SHA-256/byte count of every site file; it does not hash itself. On a pull request, the checked-out revision is GitHub's test merge commit, which differs from the PR head. Use the manifest revision to reconstruct the build. GitHub's artifact metadata separately supplies the archive SHA-256. Require the **whole run** to succeed; a downloadable artifact alone is not acceptance. Retention is 30 days, subject to repository policy.

Serve the extracted directory over local HTTP, preserving relative paths. Keep its notices, fonts, scripts and guide together. For reconstruction, check out the recorded SHA, install the lockfile with `npm ci`, then run:

```sh
npm run build:pages
npm test
npm run check:goldens
npm run check:release:browser
npm run check:release:lean
npm run check:accessibility
STIPRA_SMOKE_PAGE=web/stipra/browser-smoke.html STIPRA_SMOKE_EXPECT=BROWSER_SEPARATION_PASS node scripts/browser-smoke.js
npm run check:exports
npm run check:export-parity
```

Chromium and the documented font prerequisites are required. The complete CI workflow also checks creative-coding/structured inputs, QR decoding and report evidence. A reproduction in a different runtime is a new measured build, not an assertion of identical archive bytes. Native redistribution remains rejected by `check:release:native`.

## Evidence and its limits

Baseline [Verify Stipra run 39238753929](https://github.com/yigit-denktas/stipra/actions/runs/39238753929) completed successfully with all 75 steps. [Pages run 39238753855](https://github.com/yigit-denktas/stipra/actions/runs/39238753855) also succeeded for that SHA. Its temporary `github-pages` artifact 12180880291 has archive digest `65c75e8ca1e1e1a49986b084390f7743a8e1b4f525f427fce2708c8a5def0ee9`; that older artifact has only one-day retention. These are baseline results, not predeclared results for this preparation PR. The PR's final-head checks and retained candidate artifact must be inspected separately.

On 19 October, the primary hosted Studio entry state, guide comparison instructions and rendered Canvas example were inspected through the connected Edge browser. The Studio had disabled import-dependent controls before artwork, the new comparison guidance and explicit uncalibrated-preview wording; the guide described Keep current / Use candidate, matching framing and effective LPI. The Canvas example displayed a 288 × 216 source/proof and two ink plates; Draw next frame advanced the displayed frame counter from 0 to 1. This establishes those deployed UI states, **not** exact deployed-byte identity or a complete live-host workflow.

The browser download transport timed out while acquiring the public 8 × 8 SVG fixture. Import/comparison/package download on the live host were therefore not completed in this session. This is an observation about the review tooling, not evidence of an application export defect. The existing real Chromium workflow exercises actual procedural imports, edits, comparison adoption/invalidation, inspection and exported ZIP contents; require its fresh final-head pass. The local command runner was unavailable, so no local test run is claimed.

## Main-build verification follow-up

The 19 October main build at `aec0c23d6cc538e4e00352c66ee9543eba7694cd` passed all 77 CI steps and Pages deployment. A fresh downloaded archive matches its GitHub SHA-256; all 78 site files match the manifest, with no missing, unlisted or duplicate entries. Fourteen release-history/navigation tests also pass locally after the command runner recovered. [Prepared prerelease notes and exact verification procedure](STUDIO-PRERELEASE-v0.9-rc.1.md) record the immutable target and archive. This supplements the earlier session limits above; it does not establish a completed live-host import/download check. Browser automation now reports an extension UI that requires a person to dismiss it. No release/tag or human acceptance is claimed.

## Acceptance boundaries

| Item | Candidate treatment |
| --- | --- |
| Automated digital workflow, geometry, masks, exports, notices | Required passing checks for the exact candidate commit |
| Host navigation and truthful preview wording | Bounded live observations recorded above; full live-host journey not claimed |
| Owner forest/beach approval | [Recorded digital specimens only](OWNER-VISUAL-APPROVAL-2026-10-19.md); no blanket approval of every Style |
| Human keyboard/screen-reader review | Still open in #13; automated axe/keyboard checks are narrower |
| Physical measurements and independent artist trial | Deferred by the owner; not passed (#13/#70) |
| Native compiled-component notices | Still unresolved in #14; [upstream #309](https://github.com/samizdatco/skia-canvas/issues/309) is posted, with no response observed on 19 October |
| GitHub prerelease/tag or subsequent npm release | Not created by candidate preparation |

Previews are experimental, uncalibrated digital approximations. Synchronous large-image rendering, declared import/color limits and raster screen quantization remain documented constraints. Inspection reports are not full-size plate masters. The supplied owner photographs and image-bearing documents remain private; this archive contains the generated public site only.

## Promotion and recovery

Promote only the exact successful candidate commit and its reviewed artifact. A later code change requires fresh checks; do not reuse an older green run. A tagged prerelease, npm version and deployment are distinct actions and records. Keep #13/#14/#70 open for their remaining scoped evidence; do not infer their closure from RC preparation.

If a candidate regresses, retain the failing record, return to the prior known-good source/build and rerun its checks. Do not regenerate goldens or overwrite existing frozen recipes to obtain a pass. Final v0.9 and any physical-quality claims retain their separate acceptance criteria.
