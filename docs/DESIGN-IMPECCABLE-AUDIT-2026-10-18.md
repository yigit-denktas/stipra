# Impeccable review — Stiprā public pages and roadmap

**Date:** 18 October 2026  
**Source:** [pbakaus/impeccable](https://github.com/pbakaus/impeccable), `SKILL.md` v4.6.0, upstream main at `ab524607fdea…` when inspected.  
**Scope:** draft [PR #98](https://github.com/yigit-denktas/stipra/pull/98), prior actual/future roadmap previews, and repository source for Studio, Guide, Changelog, Sketches, Regions and Site map.  
**Method:** applied upstream `audit`, `distill`, `clarify`, `polish`, `harden`, `craft-floor` and Read-mode guidance to the actual source and a reconstructed standalone rendered prototype. **The Impeccable CLI/detector itself was not executed** because it is not installed in this working environment. This is a source-informed manual audit, not an upstream detector score or a full production-browser acceptance.

## Fit: use modes by surface, not by brand

Impeccable's mode distinction resolves a tension with the earlier Taste Skill. A documentation page should not add hero photographs and animations merely because those help a marketing website.

| Surface | Visitor mode | User succeeds when… | Direction |
| --- | --- | --- | --- |
| Public roadmap | **Read** | What is active, published, changed and proposed is evident and source-backed. | Keep the chronological, typographic document; suppress decorative status and internal tracker jargon. |
| Changelog | **Read** | A dated change and its consequence can be found without reading PR metadata first. | Date, title, one concrete sentence, evidence on request. |
| Field guide | **Read** | Readers understand proof vs plate, physical scale and reproducible recipes. | Preserve authored explanatory diagrams and readable measures; make instructions easy to follow. |
| Studio | **Operate** | Import → separate → inspect → export works without losing source or masks. | Prioritize artwork and controls, not a decorative full-screen editorial hero. |
| Sketches / Regions | **Read + Operate** | An artist can understand an example and interact with a real drawing or layer. | Preserve the examples and their context, improve keyboard guidance when tested. |
| Site map | **Read** | Every destination is discoverable. | Plain navigable reference, not a showcase page. |

The visual world stays Stiprā's own paper/ink palette and IBM Plex type. A Read page's identity belongs in its masthead, rhythm, measurements and real print specimens, not in a repeating decorative effect behind body text. Product-specific meaning outranks a generalized detector rule.

## Implementation-integrity verdict

**Direction is coherent; the most consequential usability defect was a hidden destination when arriving on a deep link.** Release and acceptance states are correctly separate, the feature IDs survive across versions, and the current/future page distinction is honest. However, the initial interface used decorative numbered section labels that gave no additional information, repeated its own purpose in an eyebrow, and wrote several active priorities as internal process statements.

### Findings and interventions

| Severity | Finding and user impact | Observed evidence | Action in PR |
| --- | --- | --- | --- |
| **P1** | **Incoming `#cap-ID` URLs did not reveal a record inside closed `details`.** A fresh reader sees no obvious destination even though the index and link are correct. | Original `roadmap-search.js` only opened disclosure ancestors inside a same-page click handler. | Added `revealHash()`, initial-hash and `hashchange` handling, safe decoding and scroll to the opened record; tests for nested disclosure and invalid fragments. |
| **P2** | Numbered section labels `01 / NOW` … `05 / NEXT` repeated the actual section headings without encoding meaningful sequence. | Source-generated `r-section-head > span` and screenshot. | Removed decorative indices and used full-width section headings with editorial spacing. |
| **P2** | “STIPRĀ / ROADMAP & RELEASES” eyebrow duplicated the identity and page navigation; delayed active content on phone. | Screenshot of 390px previous prototype. | Removed eyebrow from generated markup. |
| **P2** | Intro repeated generic categories, with limited product specificity. | “What Stiprā can do, what changed, and what we’re working on.” | Changed to “Ink separations, release history, and the work still ahead.” |
| **P2** | Active initiative descriptions were process-heavy and harder for a new artist to decode. | Phrases such as “close distribution evidence” and “owner/artist usefulness”. | Rephrased print validation, Canvas/p5 independent trial, and two/three-pass forest comparison as concrete actions; kept their underlying capability IDs and acceptance states. |
| **P2** | Guide displayed two navigation sets: its own header menu and the generated global site navigation. This repeats Studio and competes with the page introduction. | `web/stipra/guide.html` embedded a `Main navigation` group although `build-site-info.js` supplies a shared navigation. | Removed the redundant header menu and retained both the Studio action and source/licence links in the guide footer; added a source regression test. |\n| **P2** | Shared historical CSS still includes older v3 rules as well as v4 overrides, increasing maintenance overhead. | `web/stipra/roadmap.css` includes superseded selectors and appended override layers. | **Open:** consolidate the stylesheet in a separate behavior-preserving follow-up after a built-branch screenshot baseline; do not risk regression by deleting unverified inheritance in this PR. |
| **P2** | Public interfaces still lack independent first-reader and screen-reader task evidence. | Existing review docs explicitly mark this pending. | **Open:** run actual keyboard, assistive-tech and artist journeys; do not report a WCAG conformance claim from CSS alone. |
| **P3** | Small monospace metadata can be tedious on mobile, even when CSS meets basic contrast targets. | Prior 390px screenshots and current font roles. | Existing Taste pass improved some labels; inspect at text zoom / physical phone before further typographic churn. |
| **P3** | The Studio has a separate functional surface from editorial pages. A generic page-level audit can miss its export semantics. | `DESIGN.md` and Studio code distinguish proof-only mute from production plates. | **Open:** Studio-specific Operate-mode usability test; no speculative change to export code. |

### What must not be “fixed”

- Do not replace the IBM Plex type with a fashionable display face solely to satisfy “unusual typography.”
- Do not add stock photographs, hero videos, arbitrary ink splashes or bouncing entrances to a release history.
- Do not replace genuine release dates with targets, or turn a closed issue into a “shipped” badge.
- Do not show a percentage-complete aggregate across non-equivalent feature, quality and research records.
- Do not turn the Studio into a Read-mode marketing page. Its user needs the source, proof, plates and controls in the working area.
- Do not install Impeccable's hooks without inspecting their effect on the actual repo and existing design/CI standards.

## Checks performed during this review

**Live repository data (draft branch):** 33 permanent product records, 16 development events, 3 current initiatives, zero verified public releases. `INK-01` remains one capability. The working `v0.8.0` is identified as owner-reported and *unpublished*.

**Source behavior:** evaluated actual `render()`, `buildIndex()`, `search()` and `revealHash()` functions in JavaScript against the branch's actual product-history/ledger/changelog JSON: 33 IDs validated, “ink” returned 18 indexed matches, nested closed disclosures opened, malformed fragments were safely ignored. The rendered HTML no longer contains decorative section numbers or the redundant eyebrow.

**Representative Chromium render:** modified the earlier standalone snapshot with the same markup/CSS refinements, rather than claiming to have built the entire connected branch. At 320/390/768/1440 CSS px, no horizontal overflow or page script exceptions were observed. The `In progress` section begins around **473px at 390px** rather than around **537px** in the previous snapshot. Native `details` disclosure was exercised at 390px. **This does not replace full PR build/CI checks**, font-loaded deployment screenshots, zoom testing, a physical touch device, or screen-reader acceptance.

**Upstream tool:** read Impeccable v4.6.0's own `SKILL.md` and relevant instructions. No `impeccable detect` output or numeric score was fabricated.

## Relative to the earlier Taste review

Taste Skill pushed attention toward compositional quality; Impeccable clarifies that **Read** and **Operate** modes justify different kinds of quality. Their useful intersection here is precision in type, navigation and honest states, not adding more visual ornament. The dominant work remains long-term consistency: actual releases, capability biographies, and clear documentation.

The earlier design decision log in `design/DECISIONS.md` continues to own Stiprā-specific accepted/rejected patterns. This report evaluates that system without creating a competing palette, source-of-truth data model or universal styling command.

## Reproducing with the official CLI later

Impeccable has not been vendored or installed by this PR. In a trusted local checkout with network access, use the upstream documented installer:

```sh
npx impeccable install --providers=codex,claude --scope=project
# Review exactly what was installed and any hook permissions before trusting them.
# Open a supported agent and ask for /impeccable audit roadmap,
# then /impeccable critique roadmap and /impeccable polish roadmap.
```

Existing root `DESIGN.md` and the `design/` contract are authoritative. Do not blindly run an initializer that overwrites those files; reconcile any new `PRODUCT.md` or generated document deliberately. Only grant project-level hooks after examining their behavior, scope and output.

## Review/merge boundary

PR #98 remains draft. Run its full `Verify Stipra` and Taste inspection workflows on the latest commit; then evaluate actual built pages at mobile and desktop, test incoming deep links, and resolve any issues. The first live release-history action, native rights review, physical prints and independent first-reader testing remain separate release acceptance gates.
