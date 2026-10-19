# Roadmap data and release history

`scripts/build-site-info.js` and `scripts/build-roadmap-page.js` generate the public pages. Do not edit built HTML, search indexes or history files manually.

| Source | Authority | Public destination |
| --- | --- | --- |
| `docs/data/product-history.json` | Permanent capability IDs, typed development/release events, initiatives, implementation and acceptance | Roadmap and search |
| `docs/data/delivery-ledger.json` | Version targets, prerequisite/downstream relationships, issue state and exit gates | Delivery map |
| `docs/data/changelog.json` | Dated development changes and their sources | Changelog |
| `docs/evidence/npm-alpha-registry-2026-10-18.json` | Verified npm package identities and clean consumer; verification time is not a publication date | Library release card |

Implementation (`implemented`, `in-progress`, `planned`), acceptance (`digital-evidence`, `pending`, `not-evaluated`) and publication are separate. Keep capability IDs stable across improvements. Publication of an experimental library does not complete artist/physical acceptance or clear native notices.

The `releases` collection records actual repository GitHub releases. npm library availability uses its existing registry evidence. An empty GitHub history must never become “all packages are unpublished.” Library, Studio targets and recipe versions remain distinct.

## Publication editing

The actual `release.published` workflow collects a published-release snapshot, appends missing records and validates before committing. Only explicit typed release-note lines map capabilities:

```text
- Added [INK-01] Edit individual ink masks
- Improved [INK-01] Preserve authored coverage
- Fixed [OUT-02] Correct a report margin
```

Issue/PR mentions and the obsolete `Capabilities:` shorthand never infer shipped functionality. See [the full editing and automation contract](PRODUCT-HISTORY.md), including immutable metadata, replay, failure handling and exact-revision Pages dispatch. The first live release-action remains pending.

## Verification

```sh
node scripts/sync-release-history.js --check
node --test tests/roadmap-history.test.js tests/release-history.test.js tests/site-info.test.js
npm run build:pages
npm run check:roadmap-visual
npm run check:accessibility
```

Inspect the actual built Roadmap, Changelog and Delivery map at phone/desktop widths, incoming links, keyboard access and text scaling. A passing pixel comparison establishes equivalence for its fixture states; it does not approve taste, real screen-reader use or physical print quality. Keep fictional release stress fixtures out of production history.
