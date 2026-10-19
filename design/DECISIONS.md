# Design decisions and rejected patterns

**Status of this log:** it records repository-visible implementations, explicit user feedback and proposals under PR #98. **Implemented ≠ approved**: a draft PR or an automated test is not owner sign-off. New decisions should record date, surface, proposer/editor, outcome, evidence and the condition that would reopen the question.

Keep this log compact and consequential. Do not register every CSS tweak as an architectural decision.

## Current direction

| ID | Decision | Basis | Status |
| --- | --- | --- | --- |
| D-001 | Printmaking, not a generic image filter, defines the Studio. | Existing [product principles](../DESIGN.md), print-masters/recipes and workflow tests. | Existing product contract |
| D-002 | Present the roadmap as **now / genuine releases / development history / capabilities / next**. | User asked for progress unified across completed/active/planned work, with natural-language future objectives and versioned past. | Implemented in draft PR, owner review outstanding |
| D-003 | Use **stable capability IDs and typed events**; separate implementation, acceptance and release. | Same feature changes repeatedly and a merged PR is not a release. | Implemented in draft PR; data-model tests exist |
| D-004 | Make the release timeline editorial rather than a grid of same-looking feature cards. | User explicitly rejected overused rectangles and obscure internal vocabulary. | Design direction positively received; details remain reviewable |
| D-005 | Keep existing IBM Plex and paper/ink palette; improve legibility before inventing a new identity. | Existing Stiprā brand and original dotmark. | Existing design direction |
| D-006 | Prioritize Studio, Guide, Roadmap and Changelog in global navigation; put support destinations in More. | Public-page taste review found navigation overload. | Implemented in draft PR; human test pending |
| D-007 | Use a compact changelog summary and expandable sources. | A full PR/issue list at top level obstructed reading. | Implemented in draft PR; source integrity preserved |
| D-008 | Treat the future-state prototype as a **stress test**, not a historical fixture. | It contains fictional versions, dates and changes. | Implemented review convention |
| D-009 | Protect brand-specific experimentation instead of optimizing for a generic checklist or “taste score.” | User's design-maturity/taste work and Katie Dill talk prompted this direction. | Proposed review principle in this contract |

## Decision records

### D-002 — A readable progression, not a backlog table
**Problem.** A ledger-shaped page used issue IDs, technical gates and proposed `v0.9` targets as if they were self-explanatory product milestones. The user could not immediately see what existed, what was being actively developed, and how past work related to versions.

**Chosen design.** Current priorities first, genuine published versions next, dated development changes, searchable capability histories, then next directions. Keep source evidence available one level deeper. Future initiatives have descriptive titles without promised release numbers or invented dates.

**Rejected.** A giant uninterrupted task table, a Gantt chart that implies fake delivery accuracy, and colorful percent-complete boxes unsupported by equal-weight work definitions.

**Reopen if.** Reader testing shows the primary task is to find a particular historical release before understanding the current product; consider route-level shortcuts without reintroducing competing progress models.

### D-003 — One enduring capability, many changes
**Problem.** Assigning a capability to exactly one version erases its evolution and encourages invented duplicates.

**Chosen design.** An immutable capability ID, dated typed change events and a separate published-release object. Development, acceptance and publication are explicitly different. A versioned release can contain several changes to one capability.

**Rejected.** “PR merged” as a shipped badge; automatic issue-number-based release inference; one feature per release; retroactively rewriting a published tag to tidy the page.

**Reopen if.** Real release practice demands migration or corrections. Do this through versioned schema changes and explicit editorial review, never silently.

### D-004 — Editorial structure over decorative density
**Problem.** Earlier prototypes had excessive rectangles, repeated category labels, visual noise and too much AI-sounding explanation. Removing the boxes alone also risked a thin, uninformative page.

**Chosen design.** Version/date/title/change hierarchy; repeated alignment edges; plain text and fine rules; disclosure where it reduces cognitive load. The record stays complete when expanded.

**Rejected.** Generic SaaS tiles, decorative colored badges, hero gradients, the same card treatment for validation, research, features and releases.

**Reopen if.** Genuine comparisons or choices require a contained component: before/after plate proofs, alternative prints or a selectable recipe are legitimate card-like layouts.

### D-005 — Stiprā's printmaking identity remains a system, not a skin
**Problem.** A logo and colored accents cannot substitute for a meaningful experience. Conversely, an overly severe “no ornament” rule can remove all individuality.

**Chosen design.** Existing paper/ink palette, IBM Plex typography and layout rhythms inspired by alignment/registration. Use actual plates or authored examples when they materially explain functionality.

**Rejected.** Stock imagery presented as Stiprā output, decorative halftones to hide missing content, unapproved new wordmarks, invented machine calibration diagrams.

**Reopen if.** Owner approves a new identity system after comparisons and actual use at small/print sizes. Existing historical decisions must remain traceable.

### D-006/D-007 — Primary information stays close; evidence stays reachable
**Problem.** Every navigation destination had equal emphasis; each changelog entry displayed every implementation reference before the user learned its main consequence.

**Chosen design.** Four primary destinations with a More disclosure; changelog date/title/concrete summary followed by optional details and sources. The machine-readable history remains available.

**Rejected.** Hiding the Site map entirely, stripping PR/issue links from the source record, abstract promotional copy and inaccessible custom dropdowns.

**Reopen if.** Real first-reader tests show More is undiscoverable or source disclosure is unworkable on touch/screen readers; revise based on observed behavior.

### D-009 — Design quality belongs to the editor, not the generator
**Problem.** AI can make a plausible finished page before anyone tests whether it is useful, coherent or characteristic of the product. Automated taste rules can create another sort of sameness.

**Chosen design.** A repeatable loop: product task → contract → working change → browser evidence → independent critique → keep/revise/reject → recorded learning. Preserve room for a surprising, defensible product-specific interaction.

**Rejected.** Automatic approval from a passing lighthouse/axe/taste result; self-awarded taste scores treated as quality evidence; indiscriminate imports of marketing-image and motion requirements into software documentation.

**Reopen if.** A documented experiment produces a better and accessible way of understanding ink passes or release history, even if it changes an established layout convention.

### D-010 — Use Impeccable's Read/Operate distinction without replacing Stiprā's identity
**Date:** 18 October 2026. **State:** implemented in draft PR, awaiting owner review.

**Problem.** An otherwise coherent history page repeated its own orientation with an eyebrow and decorative section indices. Incoming capability URLs failed to open nested history records. The Guide displayed a second header navigation alongside the generated shared site navigation.

**Chosen design.** Keep the existing green/cream editorial composition. Remove only decorative heading labels; make the first screen more task-focused; use specific printmaking verbs in active work. Reveal nested records on incoming fragment URLs as well as same-page clicks. Keep one public navigation system on the Guide. Treat Roadmap/Changelog/Guide as **Read**, Studio as **Operate**, and use genuine print specimens only where they clarify technical content.

**Rejected.** Redesigning the page in Impeccable's preferred aesthetic, introducing additional accent cards or motion, fake release badges, automated taste score as an approval gate, or replacing root DESIGN.md with another generated design brief.

**Evidence.** [Impeccable audit](../docs/DESIGN-IMPECCABLE-AUDIT-2026-10-18.md), source tests and representative 320/390/768/1440px Chromium snapshots (local prototype, not the production-built branch). The generated page source and the deep-link helper were exercised against the 33-record history.

**Risks / limitations.** Latest CI is not verified. The prototype is a reconstruction of the changed composition; it cannot substitute for a post-build screenshot or human/accessibility acceptance. Current CSS still carries superseded rule layers.

**Reopen if.** First-reader testing shows weaker navigation, focus behavior is incorrect, or real output demonstrations require a richer layout. Obtain owner acceptance before merging PR #98.

### D-011 — Publication channels and delivery gates keep distinct authorities
**Date:** 18 October 2026. **State:** implemented in draft PR; owner review pending.

**Problem.** The new overview described the verified npm alpha as unpublished, hid the existing milestone/dependency map and assumed an empty GitHub release history in its workflow tests.

**Chosen design.** Derive library availability from the existing registry verification, scope GitHub release history explicitly, and expose the existing ledger through a linked Delivery map. Keep capability IDs and the current editorial composition. Rehearse the actual publication CLI with populated fixtures, retain exact tag identity and dispatch the Pages build for the recorded source commit.

**Rejected.** A fictional GitHub release to fill the empty state; another independent delivery-status registry; loss of prerequisite/exit evidence; a new visual redesign to fix status/data failures.

**Evidence.** [Review reconciliation](../docs/PR98-RECONCILIATION-2026-10-18.md), actual CLI and generated-site tests, artifact-specific gates and workflow evidence attached to PR #98. The first live release action and human acceptance remain unperformed.

**Reopen if.** The release channels need a new artifact class, actual reader tests cannot find delivery gates, or a genuine deployment fails to show its recorded source history.

## How to record the next decision

```md
### D-012 — [concrete question]
Date: YYYY-MM-DD
Surface / capability:
Requested by:
Evidence: screenshot, task observation, test output, link
Options considered:
Decision: keep | revise | reject | experimental
What changed (or will change):
What was explicitly rejected and why:
Risks / limitations:
Owner / editor acceptance: pending | accepted [link] | rejected [link]
Revisit when:
```

**Do not automatically convert this document into a list of “approved” solutions.** The important institutional memory is *why a proposal was chosen, deferred or rejected*, and what observable evidence could overturn it. This is more useful across coding agents than an aesthetic score or an isolated screenshot.
