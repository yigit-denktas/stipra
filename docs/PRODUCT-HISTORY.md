# Product history — editing and publication rules

The public roadmap and its search index are generated from `docs/data/product-history.json`. This record is not the GitHub issue board and is not an assertion that every merged change has shipped.

## What is what

- **Capability:** immutable `ID` (for example `INK-01`), one present-day description, area, implementation and acceptance states. A capability is not duplicated to describe later improvements.
- **Type:** `feature`, `validation`, `operations`, or `research`. Not all tracked records are user-facing features.
- **Development change:** a dated `events[]` entry associated with an existing capability, a classified change type, and the exact title of a recorded `docs/data/changelog.json` entry. Development does not mean shipped.
- **Release change:** an event created only when GitHub publishes a release. It links the version to a capability and records *what changed*, not merely which issue closed.
- **Initiative:** descriptive active or possible work. It does not automatically have a version, release date, or completion percentage.

The public site deliberately separates **Now → Published releases → Recent development → Capabilities → Next**. Its live search indexes release names, dates, capability names, individual changes and initiatives from the *same* structured source.

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

The existing workflow writes back to `main`. Branch protection or permission restrictions may require adapting the workflow to open a PR instead of pushing. The first live publication run is an operational acceptance check, **not yet performed**.

## Testing

```sh
node --test tests/roadmap-history.test.js tests/site-info.test.js
npm run build:pages
```

The history tests cover repeated improvements to the same capability, invalid references, idempotent release ingestion, searching by release title, and 100 simulated releases. The public site is designed to need no external runtime requests. Color, typography, focus, 320/390px reflow, and assistive-technology behavior still need full browser and human acceptance before production approval.

The synthetic long-horizon fixture used during design is not part of the published history and should never appear as a real release on the website.
