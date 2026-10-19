# Critical reader journeys and design review protocol

**Purpose:** turn Stiprā's design intent into an observable editing process. A page is not accepted simply because it renders or because an agent says it is beautiful.

This procedure is for **public design quality**. Print quality, release licensing, security, performance and operational reliability have their own gates.

## 1. Three journeys that must remain easy

These are acceptance **scenarios**, not claims that an independent human has already passed them.

### Journey A — New reader understands what is real and what is next
**Persona/task.** Someone unfamiliar with Stiprā opens `/stipra/roadmap/` on a phone and asks: “What can I use today, what are the top three work areas, and has v0.8.0 actually been released?”

**Fixture.** Actual `docs/data/product-history.json` with a verified npm library and no GitHub releases; initiatives `PRINT-TRUST`, `ARTIST-LIBRARY`, `STYLE-QUALITY`, and the owner-reported working build.

**Steps.**
1. Open the page at 390px; read without scrolling past an unrelated card grid.
2. Identify **In progress** and all three active initiative names.
3. Identify the working build separately from “Latest published”.
4. Follow one initiative to its included capability; expand its acceptance/source record.
5. Navigate to Studio/Guide and return using actual accessible links.

**Pass condition.** The reader correctly distinguishes *implemented*, *digitally checked*, *human/physical acceptance pending*, and *not released*, and locates a real source without needing a GitHub issue number upfront.

**Failure examples.** Percent-complete progress confused with release readiness; `v0.8.0` presented with an invented publication date; active work pushed far below an explanatory essay; a reader cannot discover More on mobile.

### Journey B — Trace a capability across time
**Persona/task.** An artist/developer asks “When did editable ink separations arrive, what was improved later, and which release contains those changes?”

**Fixture.** Permanent capability `INK-01`, its dated development events and the **fictional** stress fixture where multiple releases introduce/improve/fix the same capability. No synthetic release enters production history.

**Steps.**
1. Use roadmap search for “ink”, “INK-01” or a known release title.
2. Open the capability record and inspect dated, typed changes.
3. Find related published release details (only if a real release record exists).
4. Follow evidence without forcing the reader through PR identifiers in the main overview.
5. Reset search and continue navigating without losing access to the underlying records.

**Pass condition.** Exactly one stable `INK-01` capability exists, with multiple changes as needed. A search for a release title reaches that release *and* related capability; a source link has a meaningful destination. The system never labels development-only events as published.

**Failure examples.** “One matching release, zero matching features” when features changed in that release; a duplicate capability manufactured for an improvement; a search result that links to a closed disclosure that never opens; history silently overwritten on release ingestion.

### Journey C — Artist gets from artwork to an inspectable print package
**Persona/task.** Someone with an authorized raster image wants to import it, control two ink passes, inspect the grayscale masks, and understand how to reproduce the resulting output.

**Fixture.** A public synthetic/authorized example, never the owner's private comparison photographs.

**Steps.**
1. Find the Studio from any public page, including phone navigation.
2. Import the source; see source/proof/individual ink masks without confusing paper with an ink plate.
3. Change or inspect one ink; confirm the production/export passes remain consistent even when preview solo/mute state changes.
4. Export an aligned master/print package. Consult the Guide for DPI, LPI, registration and recipe interpretation.
5. Verify that the site does not claim a digital proof is physical printer calibration.

**Pass condition.** An actual browser interaction/export test supports the software step; output has the correct masks, measured dimensions, and provenance as required by existing engine tests. If real physical print results are missing, the UI labels that limit truthfully.

**Failure examples.** Settings obscure the artwork; preview mute silently deletes production plates; simulated texture enters physical masks; hidden/private artwork is bundled in the public page; styling changes the export geometry.

## 2. Edge states to evaluate in every design session

| State | Evidence to capture |
| --- | --- |
| Real current roadmap: verified npm alpha, zero GitHub releases | Published library visible, GitHub absence scoped, working build separate, readable priorities |
| Future stress case: 10 releases / 48 capabilities / multiple events | Scan release index; find cross-version capability; no “every feature in exactly one release” shortcut |
| Extended archive: 100 versions and many events | Search and disclosure performance, no duplicate IDs, stable permalinks |
| Zero search results / ambiguous release title | Helpful empty state and consistent search scope |
| 320px, 390px, 768px, 1440px, browser zoom/reflow | No content overflow/collisions; legible metadata; keyboard and touch navigation |
| Long feature titles, translations and very long URLs | Wrapping without broken focus, missing labels or inaccessible clipping |
| Direct `#cap-ID` and `#release-version` link | Linked record becomes visible, containing disclosures open |
| Keyboard-only and screen-reader use | Focus order, skip link, summary state, search updates and contextual labels |
| Reduced motion / JS unavailable | Reading and core navigation remain possible; optional enhancement degrades cleanly |
| Release job fails or release notes omit explicit typed changes | No invented feature mapping or false “shipped” information |
| Rights-limited imagery / no photo fixture | No stock or generated image portrayed as a specific artist's actual work |

## 3. Two complementary reviewers, one editorial decision

- **Design Maturity Review** (the user's existing skill): investigate appropriateness, purpose, craft, systemic coherence and product-specific expression across *any* artifact. Best for deciding what to question and whether the direction itself is justified.
- **Impeccable v4.6** ([source-informed Stiprā audit](../docs/DESIGN-IMPECCABLE-AUDIT-2026-10-18.md)): distinguish **Read** (roadmap/changelog/guide) from **Operate** (Studio), and use its audit/clarify/distill/harden/polish checks for specific failures. The upstream CLI/detector were not run in the original audit. The pinned skill now exists at `.agents/skills/impeccable/`, but its engine requires a separate first-run download or preinstallation. Keep hooks off unless explicitly authorized. Do not overwrite existing design contracts or automatically authorize hooks.
- **Taste Skill v2** (pinned under `.agents/skills/design-taste-frontend/`): inspect public-facing page composition/copy, warn on generic habits, measure rendered geometry and produce screenshots. Best for exploring and editing the actual visual page.
- **Implementation tests** (`tests/roadmap-history.test.js`, `tests/site-info.test.js`, CI): establish behavioral invariants and source-backed state; they cannot approve taste or physical print quality.
- **Editor / owner:** makes the keep/revise/reject decision after reading evidence and experiencing the product. Automated model scores are diagnostic notes, not authority.

Neither critic should be the only judge of the work it generated. Where practical, run an independent read-only review of screenshots and actual interactions without showing the implementation agent's rationale first. If the independent critic and implementer disagree, record the exact disagreement and reproduce the observable behavior before changing design rules.

## 4. Repeatable run

From the repository root, in Node 22+ with a browser:

```sh
# Behavioral and information consistency
node --test tests/roadmap-history.test.js tests/site-info.test.js
npm run build:pages

# Static editorial linter; findings require triage, not denial
node .agents/skills/design-taste-frontend/scripts/lint.mjs \
  web/stipra/roadmap.css web/stipra/shared.css

# Real rendered pages; review each saved screenshot + report
node .agents/skills/design-taste-frontend/scripts/inspect.mjs dist/stipra/roadmap/index.html
node .agents/skills/design-taste-frontend/scripts/inspect.mjs dist/stipra/changelog/index.html
```

The `design-taste-audit.yml` workflow also captures real-browser inspection for Guide, Site map, Sketches, Regions and the Studio shell. **Its advisory inspection step does not replace manual reviews or justify suppressing failures.** Distinguish “passed product tests” from “Taste warning needs human evaluation”, and keep the raw inspector report.

Taste Skill expects image-heavy marketing pages and sometimes requires motion/video. A historical record need not add fake imagery or movements to satisfy that benchmark. Record the exception, the user task it protects, and any real usability cost.

For a major art-facing feature, use **actual rights-cleared output** in a source/proof/plate comparison. Don't invent product photography to beautify release notes.

## 5. Four review dimensions with distinct evidence

| Dimension | Question | Evidence and action |
| --- | --- | --- |
| Utility | Can this person complete the workflow? | User-task trace, errors and functional test artifacts |
| Clarity | Can a stranger locate and correctly interpret the data? | Five-minute first-reader tasks, comprehension questions and misinterpretations |
| Craft | Does the interface remain legible and coherent? | Desktop/mobile screenshots, actual font loading, zoom, contrast, focus and geometry checks |
| Character | Would this make sense for *this* printmaking product? | Compare against contract, genuine plate/proof objects, original art direction and rejected defaults |

No automatic numeric weighted sum determines approval. If an inspector generates a numerical score, cite it as a subjective/heuristic observation with its scope.

## 6. Definition of ready for design review

A significant UI change is ready for an owner's design decision when it includes:
- Link to the working build or a self-contained local preview;
- The one user task the change solves and a before/after description;
- Real representative data and at least one dense/empty state;
- Desktop and mobile screenshots, keyboard/focus evidence and inspector raw findings (or a named blocker);
- Functional tests on the actual browser flow where it exists;
- Known limitations, any privacy/rights consequences, and any claimed release/acceptance gate status;
- A reviewer recommendation and **explicit decisions requested**, including whether the change should remain an experiment.

**Ready for design review is not ready to merge or release.** CI, integration testing, independent accessibility acceptance, artwork/print approvals and authorization still have to be satisfied separately.

## 7. Design evidence record template

Create a short review entry in a PR or add a dated evidence file under `docs/` when a change merits archival review:

```md
Change / capability:
Task and intended audience:
Current observed problem:
What was changed (scope):
Before: [screenshot/link]
After: [screenshot/link]
Behavioral test: [command, run, result]
Browser widths / zoom:
Keyboard and AT: [tested | not tested; details]
Other evidence (rights, print, source):
Independent critic: [findings + disagreements]
Rejected alternatives and why:
Decision: keep | revise | reject | experimental
Owner acceptance: pending | accepted [link] | rejected [link]
Follow-up / revisit condition:
```

A good review should make the next session **less likely to repeat a mistake** and **more able to attempt something distinctive**. It is not an invitation to write more promotional design prose.
