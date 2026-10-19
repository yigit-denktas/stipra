# Stiprā public pages: Taste Skill design review

**Date:** 18 October 2026  
**Reviewer:** ChatGPT, applying the pinned Leonxlnx `design-taste-frontend` v2 criteria with Stiprā's product constraints.  
**State:** Review of PR #98 and the standalone fictional v4 future simulation, not a publication acceptance.  
**Scope:** Roadmap, its fictional future-state model, changelog, site map, field guide, Studio shell, sketches and regions.

## Art direction / what is distinctive

A printmaking studio exposes the relationship between the original artwork, independent ink passes, their measured output and a reproducible recipe. Its public history should likewise show releases, capabilities and supporting evidence as separate but aligned layers. Stiprā's existing paper ground, ink-green typography, IBM Plex family, thin registration-like rules, physical print vocabulary and local-only workflows already express this idea.

Do **not** replace these with a SaaS gradient, generic cards, unrelated stock photographs, arbitrary motion or a new identity. Substantial product demonstrations should use authentic output only.

## Audited page states and decisions

| Surface | Finding | Intervention | Still open |
| --- | --- | --- | --- |
| Roadmap, actual development state | Search and three summary blocks pushed current work below the mobile first screen. Additional small labels competed with the hero. | Put the two source-of-truth version facts in a compact summary, move search to capability reference, increase metadata readability and reduce repeated heading chrome. | Human first-reader task testing, real screen-reader review. |
| Fictional future simulation (10 releases, 48 capabilities) | The same data-model view works with more releases, but must not be mistaken for actual history. | Apply identical first-screen and search placement rules to the downloadable simulation. Keep all hypothetical dates and versions explicitly fictional. | Test at larger than 100 releases with meaningful imagery and long translated titles. |
| Changelog | Every entry carried its full list of technical bullet points and PR references at equal weight. | Date + plain-language title + one concrete change by default; remaining changes and evidence live behind a native disclosure. No source links removed. | Editorial review of entry titles and source accuracy on future additions. |
| Global navigation | Every destination had the same priority, and mobile wrapping could dominate a guide or Studio first screen. | Primary paths: Studio, Guide, Roadmap, Changelog. Secondary: Sketches, Regions, Site map under keyboard-accessible “More”. 44px minimum link/summary targets. | Real touch/assistive-technology review. |
| Guide | The existing ink-first chapter layout and native diagrams communicate the product well. | Retain its chapter structure and illustrations; apply shared navigation and focus conventions. | Test its older in-page navigation and reading order with a new user. |
| Studio | Functional tooling has higher priority than a decorative redesign. Its side panels, canvas and export controls are task surfaces, not a marketing page. | Limit taste changes to shared site chrome. No changes to ink selection, preview geometry, paper defaults or exports. | Real import/export, 200% zoom and manual accessibility testing. |
| Sketches and Regions | These are explanatory examples of authored masks and procedural source, not independent sales pages. | Preserve demos and their explanatory steps. Share global navigation and link affordances. | Check long examples on mobile and with keyboard input. |
| Site map | Useful as a complete inventory and fails when treated as a product pitch. | Preserve the straightforward complete link listing and refine its destination descriptions. | Validate links after adding any future public page. |

## Four-part juror review (provisional)

The upstream rubric weights design 40%, usability 30%, creativity 20%, content 10%. This is a **qualitative design assessment** of the rendered roadmap prototype, not an independent usability study.

| Dimension | Before final pass | Assessment |
| --- | --- | --- |
| Design | 7/10 | Strong Stiprā type/palette; some repeated chrome and a mobile first-screen bottleneck. |
| Usability | 7/10 | Useful search and source disclosure; current priorities were visually distant on a phone. |
| Creativity | 7/10 | Appropriate ink/registration editorial idea; little visual evidence from actual tool output yet. |
| Content | 7/10 | Truthful statuses; technical changelog and auxiliary information could be more compact. |

Weighted baseline: **7.0/10** as a subjective review anchor, not a benchmarked score or formal certification. The end state is subject to real-user testing rather than a self-awarded high score.

## Browser checks on the current and fictional local prototypes

The final-pass standalones were checked in Chromium at 320, 390, 768 and 1440 CSS px. Each showed **no horizontal overflow or page JavaScript errors** in those particular checks. In the 390px actual roadmap the active-work section starts at approximately **537px**; in the 390px future-state view at approximately **541px**. The source file being deployed from PR #98 requires independent CI and post-build inspection.

Navigation and disclosure use native HTML. Search is unified over releases, changes, capabilities and initiatives and is already covered by the separate product-history tests.

## Interpreting upstream taste-skill criteria responsibly

Taste Skill's default inspector assumes a public marketing page with real photographs, multiple picture regions and motion. A documentary roadmap and changelog do **not** need decorative video, four arbitrary photographs or GSAP entrances. Record any image/motion warnings honestly, but do not fabricate visual material just to score higher.

Likewise, a major visual release may deserve a real before/after screenshot or actual image/plate comparison when a rights-cleared output exists. Small bug fixes and technical notes generally do not.

## Remaining acceptance boundaries

- Upstream `lint.mjs` / `inspect.mjs` are available on the branch; a separate browser-inspection report should be retained as evidence rather than silently ignoring any findings.
- GitHub CI, a physical printer, an independent first reader, a keyboard/screen-reader user and npm publication are separate gates.
- Merge of this review PR remains the owner/design decision. No future-state simulation is shipped as product history.

The reusable design skill lives in `.agents/skills/design-taste-frontend/`. Its pinned upstream source and scope are documented in `README-STIPRA.md`.

## Editorial follow-up — preserving intent across agents

The user's 18 October Katie Dill/Stripe discussion raised an important distinction: standardize **how quality is achieved**, not **what every product looks like**. This second-pass design infrastructure is a concrete response, not an assertion that the early Taste review has become a human usability study.

- [`design/CONTRACT.md`](../design/CONTRACT.md): Stiprā-specific point of view, authentic palette/fonts, editorial IA, honest statuses and interaction contracts.
- [`design/PATTERNS.md`](../design/PATTERNS.md): concrete markup/CSS patterns, intended usage and anti-patterns.
- [`design/DECISIONS.md`](../design/DECISIONS.md): chosen, rejected and experimental directions with evidence, limitations and reopening criteria.
- [`design/REVIEW.md`](../design/REVIEW.md): three critical task journeys and a separate editor/critic workflow.

**Important boundaries:** Some rows describe implemented draft-PR behaviors and user-expressed preferences, but none of these documents by itself constitutes final owner acceptance. The active Studio layout decision (#31), independent user and accessibility observations, print acceptance, licensing evidence, actual release publication and the first live release-history ingestion remain separate and open unless verified by their own sources.

The new `tests/design-contract.test.js` is a deliberately narrow check: it alerts us when documented CSS tokens drift from the actual stylesheet and when required agent/contract entry points disappear. It cannot judge artistic quality. The existing product-history and site-info tests continue to guard truthful release history, navigation and information placement. This division reflects the editor principle discussed in the user's summary of [Katie Dill's talk](https://www.youtube.com/watch?v=GLvFTMtw4Jk&t=547s): fast implementation is not itself design approval.
