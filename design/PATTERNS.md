# Stiprā interface patterns — behavior before decoration

These are **existing pattern contracts** for Stiprā's current public pages and shared Studio shell. They document intent, content, and interactive states. They are not instructions to build a new component library or replace native HTML with a framework.

The source of truth is the actual CSS and generated HTML: `web/stipra/shared.css`, `web/stipra/roadmap.css`, `scripts/build-site-info.js`, `scripts/build-roadmap-page.js`, `web/stipra/roadmap-search.js`. If the implementation changes, review the contract and update this document in the same change.

## Pattern inventory

| Pattern | Actual implementation | When it exists | Non-negotiable behavior |
| --- | --- | --- | --- |
| Public-page shell | `.site-nav`, `.site-nav-primary`, `.site-nav-more`, `.skip-link` | All primary pages | Discoverable primary destinations, secondary links, skip to main, visible focus, usable phone targets |
| Studio work surface | `.lab` and the real inspector/editor markup | Artwork import and proofing | Image/proof/plates remain primary; advanced settings do not change original data unexpectedly |
| Roadmap overview | `.r-head`, `.r-overview`, `.r-section` | Project direction | Active work seen before deep reference material, no misleading progress percentage |
| Initiative row | `.r-priority` | Current or proposed work | Natural-language objective and real included capabilities; future goals have no fictional release tags |
| Published release row | `.r-release` | Only when a real release exists | Real version, real date, linked release, typed change events; no PR-close inference |
| Change row | `.r-change`, `.r-changes`, `.change-entry` | Development history and changelog | Date and consequence before source identifiers; source details remain accessible |
| Capability reference | `.r-area`, `.r-record`, `.r-record-history` | Feature lookup | Permanent ID, distinct implementation and acceptance status, dated cross-version history |
| Unified lookup | `.r-search`, `#r-results` | Full capability reference | Release title, event and capability resolve through one index; deep link opens containing disclosure |
| Print explanation | Guide diagrams and editorial chapters | Learn DPI/LPI, proof/plate distinction | Original authored schematics and measured values; no implied calibration |
| Visual proof/specimen | Real Studio and print-package outputs | Only when visual comparison is informative | Same source artwork, aligned comparison, visible captions and permissions |

## 1. Public shell

**Input:** route and local site navigation. **Output:** a readable page with one main landmark and meaningful links. **Failure states:** route not found, link invalid, mobile menu impossible to reach, keyboard focus invisible.

The four primary destinations are Studio / Guide / Roadmap / Changelog. Sketches, Regions, Delivery map and Site map remain inside a native `details` “More” disclosure. Do not duplicate the complete site map as seven equally dominant navigation tabs. The site map is a reference destination, not a marketing page.

The global wordmark, ink-colored links, paper ground and font families come from shared CSS. Do not copy-paste a second palette into every page. Use real page-specific composition below the shared shell.

## 2. Product status and provenance

**Text pattern** (not a badge component):

- “Implemented” = engineering behavior exists. Do not imply human acceptance.
- “Digital evidence” = named browser/Node/geometry checks exist. Do not imply press output is calibrated.
- “Pending” = evidence not yet accepted. State which printer, artist, accessibility or licence check is missing.
- “Published” = channel-specific evidence: verified registry archives/consumer for the npm library; a version + actual timestamp + URL from a genuine GitHub release event for repository releases. Registry verification time is not an invented publication date.
- “Planned” = objective without a committed date unless deliberately approved.

**Forbidden shortcut:** show `17/33 features complete = 51.52% release readiness`. Capability size and evidence differ; this count measures nothing comparable. Use concrete tasks and real gate outcomes.

**Naming:** Issues and PR identifiers live in source disclosures and machine-readable history. Top-level labels name actions, objects and consequences.

## 3. Timeline, change and capability record

**Initiative row:** “Trust the printed result” with one concise reason; expandable list of related `QA-02`, `QA-03`, `AUD-01`. User should know what remains without a giant technical ledger.

**Release row:** `vX.Y.Z`, published date, title, and number or type of actual changes. Its details list typed events. This row **must not render as a published release** for the owner-reported working `v0.8.0`.

**Development row:** date and change type, readable change title; labeled Development. It is not a public release until a published event exists.

**Capability record:** `INK-01` + human name + type + current implementation/acceptance + ordered events and sources, with related capabilities when present. New improvements attach to `INK-01`, not to synthetic `INK-02` records.

**Changelog row:** date → concrete human title → *one* consequence. Details disclose additional facts and linked PR/issues. If there is only one change, do not create filler to make it the same length as larger releases.

## 4. Unified search, focus and empty results

The source index in `buildIndex()` contains releases, changes, capabilities and initiatives; `roadmap-search.js` presents matches. Search for a release title must also return capabilities whose change events belong to it.

- Empty query: hide results, preserve ordinary browsing.
- No match: say “0 results”, keep input accessible, no fabricated suggestion.
- Many matches: bounded list plus “refine your search” feedback, not an unbounded scrolling panel.
- Direct fragment: open containing `details`, navigate to intended element, keep focus/visibility accessible.
- Reset: search clears cleanly and the feature catalogue remains available.
- Unavailable JS: page content remains readable and navigable through native links and disclosures; search may be an optional enhancement.

## 5. Artwork and print controls

Artwork is the hero of the Studio because it is the **object of work**, not because the page needs a fashionable hero illustration.

Real workflow objects: `source`, `ink masks`, `combined proof`, `monochrome plates`, `paper`, `recipe`, `package`. Distinguish them visually and semantically. A solo/mute setting for inspection cannot silently change physical export contents. Only a user action that explicitly edits a mask or package should do so.

The Studio may be more tool-dense than the roadmap. Do not apply no-card or four-images-per-page marketing heuristics to an inspector. Arrange controls for the user's current action; use local explanations and leave advanced controls available without obscuring the image.

## 6. Image and illustration rules

A visual on a release note must **prove** a product claim, not act as a filler photograph. Good examples: source/overprint/plate comparisons, a real output package, a measured before/after alignment problem, a legitimate workflow screen.

Use original/generated-by-code specimens or rights-cleared artwork. Label generated schematic material as schematic. Do not upload the owner's private forest/beach/sculpture photographs or claim test fixtures represent published customer outcomes. Motion is permitted where it demonstrates a real temporal interaction, with reduced-motion and static access.

## 7. Anti-patterns to catch in code review

| Smell | Why it fails | Better move |
| --- | --- | --- |
| Three near-identical status cards | Implies comparable measurable progress | Two or three plain source-of-truth facts with distinct meanings |
| Every item wrapped in the same rounded box | Artificial visual hierarchy | Plain timeline, fine separators, genuine grouping only where useful |
| Placeholder version/date for future work | False commitment | Natural-language initiative without a release number |
| “Technically complete / production ready” in copy | Hides acceptance boundaries | State exactly what passed and what has not |
| Ink dots that change color arbitrarily | May look like status without semantics | Assign meaningful categories + legend, or mark as decorative |
| Multiple 10–12px metadata rows | Readability burden | Larger essential text, optional detail one level down |
| Search result links to a hidden record | Broken navigation despite correct index | Open parent disclosure before navigating |
| Marketing photo unrelated to the actual artwork | Destroys credibility | Real output demonstration or no image |
| New font/brand mark added per feature | Incoherent visual identity | Use existing Plex family and reviewed brand assets |
| “AI has audited quality” as a status | Confuses evaluation with proof | Cite test evidence, pending human/editor acceptance |

**Exception policy:** a new layout, visual motif or interaction is welcome when it solves a demonstrated product problem. Record the reasoning and test result in [`DECISIONS.md`](DECISIONS.md); do not suppress originality to satisfy a linter.

See [`CONTRACT.md`](CONTRACT.md) for values and copy, [`REVIEW.md`](REVIEW.md) for scenario acceptance.
