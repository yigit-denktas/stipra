# Product history — editing and publication rules

The public roadmap and its search index are generated from `docs/data/product-history.json`. This record is not the GitHub issue board and is not an assertion that every merged change has shipped.

## What is what

- **Capability:** immutable `ID` (for example `INK-01`), one present-day description, area, implementation and acceptance states. A capability is not duplicated to describe later improvements.
- **Type:** `feature`, `validation`, `operations`, or `research`. Not all tracked records are user-facing features.
- **Development change:** a dated `events[]` entry associated with an existing capability, a classified change type, and the exact title of a recorded `docs/data/changelog.json` entry. Development does not mean shipped.
- **Release change:** an event created only when GitHub publishes a release. It links the version to a capability and records *what changed*, not merely which issue closed.
- **Initiative:** descriptive active or possible work. It does not automatically have a version, release date, or completion percentage.

The public site deliberately separates **Now → Published releases → Recent development → Capabilities → Next**. Its live search indexes release names, dates, capability names, individual changes and initiatives from the *same* structured source.

Publication has two distinct channels. The npm library card is derived from the existing `docs/evidence/npm-alpha-registry-2026-10-18.json` verification, checked by `scripts/site-publication.js`; it does not create a GitHub release or invent a publication timestamp from `checkedAt`. `libraryCapabilityIds` explicitly maps the verified package scope for search. The `releases` collection records repository GitHub releases only. The Studio working build stays separate from both. Granular version targets, prerequisites, downstream work and exit gates remain authoritative in `delivery-ledger.json`, rendered at `/delivery/` and linked from the overview and navigation.

## Adding an ordinary development change

Edit `docs/data/product-history.json` and add an event with a new permanent event ID, an existing capability ID, a precise human-readable title, its actual date, and a `sourceTitle` matching an existing changelog entry. Do not backdate, automatically mark acceptance complete, or infer publication from merge or issue closure.

For a new capability, first create a unique ID and add its type, area, dependencies, evidence links, and separate implementation/acceptance states. Never renumber an existing ID.

## Publishing a release

Publish a normal GitHub release. Optionally write structured lines in the release description:

```text
- Added [INK-01] Edit each ink independently
- Improved [INK-01] Restore an earlier mask revision
- Fixed [OUT-02] Correct landscape sheet margins
```

The allowed labels are **Added, Improved, Fixed, Verified, Researched, Deprecated, Removed**. An ID may occur more than once in a release for distinct changes. A change must describe something actually included in that release. Mentioning `#7` in prose **never** establishes that `INK-01` shipped.

The `release.published` workflow appends the version, publication timestamp and URL; it also appends each explicitly declared change. If there are no typed entries, the version is still recorded but contains no inferred capability mappings. It refuses an unknown ID, a malformed typed entry or a changed historical publication fact. If a previous record needs correction, handle it as an explicit editorial migration reviewed in a PR.

The workflow serializes its history updates, fetches a paginated snapshot of published repository releases and replays it alongside the triggering event. A later run can recover a release missed by a replaced pending job or earlier failure; drafts/unpublished records are excluded. Invalid batches do not partly update the file. Event IDs include a SHA-256 of the exact tag, preserving prerelease/build-metadata/case distinctions. Replay never rewrites an already recorded publication fact.

The job validates the populated history and runs fixture-based tests before committing to `main`. Branch protection or a concurrent human push may reject that commit; the job fails rather than force-pushing, and rerunning against current main recovers missing publications from the snapshot. The first live publication event for `v0.9.0-rc.1` created history commit `401aeef` and dispatched Pages run `39281801339` on 19 October 2026. The API still reported queued at review, so completion of that deployment is not claimed from the committed record alone.

Actions-token pushes do not trigger the existing push-based Pages job. The release job therefore explicitly dispatches `pages.yml` with the recorded commit as `revision`, even on an idempotent retry. Pages checks out that exact revision. The release job needs `contents: write` for its history commit and `actions: write` for this dispatch; it adds no secret or publisher credential. The mirror remains secondary to the current primary app address. The external Cloudflare webhook path has not been established by this rehearsal.

## Testing

```sh
node scripts/sync-release-history.js --check
node --test tests/roadmap-history.test.js tests/release-history.test.js tests/site-info.test.js
npm run build:pages
```

The tests use explicit empty/populated fixtures, so real publication does not invalidate their assumptions. A disposable CLI rehearsal appends releases, invokes the actual validation command and runs the history suite with populated production data. Other checks cover repeated changes, invalid references, atomic snapshot recovery, tag-ID collisions, verified npm evidence, version search and 100 simulated releases. The public site needs no external runtime requests. Automated browser/reflow evidence and human accessibility acceptance remain distinct.

The synthetic long-horizon fixture used during design is not part of the published history and should never appear as a real release on the website.
