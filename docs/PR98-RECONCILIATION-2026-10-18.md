# PR #98 — review corrections and integration evidence

The reviewed head was `5212a77`; integration retains main through `9d5894e` (including the alpha.1 milestone correction). The visual direction, original logo/palette, permanent capability IDs and installed vendor skills are preserved.

| Review finding | Correction | Evidence |
| --- | --- | --- |
| First real release invalidates empty-history tests | Explicit fixtures; actual CLI synchronization, populated-history validation and history-suite rehearsal | `tests/release-history.test.js` |
| Published npm library described as private/unpublished | Derive availability from the existing verified registry record, independently of GitHub releases; reconcile capability types and current status | `scripts/site-publication.js`, generated roadmap and library version search |
| Delivery/version context disappears | Restore a Delivery map from the existing ledger, with milestones, Needs/Opens and exit gates; link it from overview, navigation and sitemap | `tests/site-info.test.js` and `/delivery/` |
| Actions-token history push does not trigger Pages | Explicit dispatch with recorded source revision; Pages checks out that revision | `release-history.yml`, `pages.yml`; first live event remains pending |
| Distinct valid tags collide | SHA-256 of the exact tag in event identity; retain the original tag | Prerelease/build-metadata/case regression and idempotent replay |
| Conflicts with current main | Reconcile both changelogs, renderer and navigation tests; preserve current publication evidence and artifact gates | Integrated build and Node suite |

Snapshot replay can recover publications missed by a replaced pending job or earlier failure. Invalid batches preserve the file; drafts/unpublished snapshot entries are skipped. The job never force-pushes. A concurrent human push or branch restriction fails visibly; rerun against current main to recover the missing records. The workflow needs only the documented repository `contents: write` and `actions: write` permissions, with no new secret.

The registry verification time is explicitly a verification date, not an invented npm publication date. Actual GitHub releases require their own publication timestamps. Artist usefulness, human accessibility, physical print quality and native notices remain separate and open. No package, tag or synthetic release is published by these corrections.

## Verification

The local integrated build and all 187 Node tests pass. The focused suite includes 21 history, site, design-contract, CSS-source and skill-integrity checks. Both browser-export release formats pass, and all saved Prehnite colorway/plate goldens match. Engine imports and published library contents are unchanged by the public-page code.

CI results, actual CSS comparison and rendered browser evidence are recorded on PR #98 and its workflow artifacts. The accessibility fixture now includes the Delivery map; automated checks do not replace human assistive-technology use. Do not claim actual release-action acceptance from the local synthetic rehearsal.

## Design decision

Keep the existing Plex/ink/paper editorial system. The readable overview and granular delivery view have different jobs, with links between them. The correction introduces no additional design framework or identity direction. Owner design/merge approval, independent first-reader feedback and the first genuine release-action remain explicit decisions/evidence.
