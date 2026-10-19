# Public experience contract

**Status:** working design contract proposed in PR #98, not a claim of independent user approval.  
**Scope:** roadmap, releases, changelog, site navigation, guide, sketches/regions examples and the shared editorial layer of the Studio.  
**Product:** a local-first printmaking studio that turns source artwork into independent, inspectable ink passes and reproducible print artifacts.

This contract answers **what the interface must communicate and what the implementation may not quietly compromise**. The app's printmaking interaction principles continue to live in [`DESIGN.md`](../DESIGN.md); technical truth lives in the actual engine, structured history and tests.

## 1. Point of view

**A beautiful print that you can take apart.** The artwork remains primary. Color is a proof; plate coverage is physical data. A recipe permits an artist or agent to explain, replay and revise the work.

The corresponding roadmap is **a navigable history of changes**, not a strategy presentation or a GitHub backlog dressed as a website. A person should be able to understand *what works, what changed, what is being developed, and where the evidence is* without knowing issue numbers.

The product can be warm and expressive, but never at the price of falsely precise progress, hidden ink controls or decorative status theatrics.

**Audience and starting question**

| Reader | First question | What the interface must give them |
| --- | --- | --- |
| New artist | What can I do with my image right now? | A working Studio entrance, realistic scope and a way to inspect results |
| Returning artist | What changed, and will my files still work? | Dated version/change records, clear improvement/fix language and compatibility notes when needed |
| Developer or AI agent | Which contract exists, and when did it change? | Stable capability IDs, typed events, source links, acceptance status and machine-readable history |
| Reviewer | Is this feature genuinely ready? | Separate digital implementation, real-world acceptance and publication evidence |
| Curious visitor | Where is Stiprā going? | Three current initiatives and descriptive next directions, without fictional ship dates |

### Distinctiveness test

Replace the word “Stiprā” with an unrelated analytics SaaS. If the interface still says the same things and looks equally credible, its content is too generic. Actual marks, ink plates, paper units, overlaps, proof/production distinctions and reproduction recipes are the product-specific vocabulary.

**Do not respond to this test by adding arbitrary halftone textures, ink blotches or animated particles.** The best visual motif is a *real* separation, registration example, plate comparison or product screenshot, used only when it helps someone understand a capability.

## 2. Information architecture — do not flatten different truths

Public main destinations: **Studio, Field guide, Roadmap, Changelog**. Sketches, Regions, Delivery map and Site map remain discoverable secondary links. Every page needs its own clear purpose.

| Surface | User task | Default level of detail | Deeper information |
| --- | --- | --- | --- |
| Studio | Import → separate → adjust → inspect → export | Artwork and one immediately useful control group | Advanced settings, diagnostics, recipe, provenance |
| Guide | Learn how ink passes and print geometry work | Original diagrams and concrete explanations | Reproduction command, physical limitations and complete recipes |
| Roadmap | Understand now, shipped and next | Current priorities first, releases next, readable feature entry | Typed change events, evidence and capability relationships |
| Changelog | See what actually changed | Date, descriptive title, one concrete change | Remaining changes, technical notes, issue/PR evidence |
| Feature reference | Find a capability by name, type or history | Stable title, implementation/acceptance state | Cross-version changes, related capabilities, source links |
| Release history | Find what was publicly published | Actual version and publication date | Individual `added / improved / fixed / verified` events |

**Three independent state dimensions:**
- **Implementation:** `implemented`, `in-progress`, `planned`; describes software/development state.
- **Acceptance:** `digital-evidence`, `pending`, `not-evaluated`; describes the evidence actually recorded.
- **Publication:** channel-specific evidence. Library availability is derived from the committed registry archive/consumer verification; repository GitHub releases require an actual tag, published timestamp and declared change events. Neither is inferred from a merged PR or closed issue.

Capability/event state comes from product-history.json, npm publication from the existing registry verification, and engineering milestones/gates from delivery-ledger.json. The public Delivery map exposes the latter without duplicating its status in the overview. In the public page, the owner-reported working `v0.8.0` is **not** silently transformed into a tagged/public release. Future-state simulations must be clearly fictional and remain outside production history.

Use a permanent ID such as `INK-01` for a capability over its lifetime. A later update creates an **event attached to that same capability**; it does not manufacture a new feature. Separate research, operations and validation records from user-facing features.

No misleading aggregate “percentage complete”: splitting one feature into three tasks should not change the apparent maturity of the product. No arbitrary color badge should masquerade as a meaningful status.

## 3. Language and editorial system

**Voice:** calm, factual, capable, concrete. Speak about what happens to the artwork, not how sophisticated the project is.

| Surface | Primary copy | Avoid |
| --- | --- | --- |
| Navigation | Studio, Guide, Roadmap, Changelog | Internal workstream/ledger jargon |
| Capability title | “Export aligned monochrome printing masters” | “Achieve robust export pipeline maturity” |
| Improvement | “Preserve embedded color profiles” | “Enhanced color processing experience” |
| Release | Version, actual date, one human title | Invented date or “fully production ready” with missing gates |
| Current priority | A named outcome and the practical unresolved step | “Increase quality and unlock ecosystem potential” |
| Technical note | Exact behavior, limit, file or test | Generic reassurance or padded explanation |

A reliable writing hierarchy:
1. **Recognition:** concise noun/action (“Editable ink separations”).
2. **Consequence:** one sentence (“Adjust each ink without changing the original.”).
3. **Record:** concrete change and limitations (“Added X; Y remains untested on physical printers.”).
4. **Evidence:** issue/test/source/release references available on demand.

Avoid repeating the same claim across heading, subtitle, bullets and a summary card. Length belongs in documentation behind a meaningful link, not necessarily in every top-level section.

**Claim language:** “Implemented” is not “accepted”; “digitally verified” is not “physically calibrated”; “proposed” is not “shipping”; “in the repo” is not “published”. If a version or date cannot be verified, say so rather than manufacturing certainty.

## 4. Visual system — real implementation, not an aspirational palette

The **single source of rendering truth** remains [`web/stipra/shared.css`](../web/stipra/shared.css) and [`web/stipra/roadmap.css`](../web/stipra/roadmap.css). These current tokens are documented so decisions can be understood, **not** to establish a second independent token registry.

| CSS token | Current value | Intended role |
| --- | --- | --- |
| `--paper` | `#f5eee2` | Paper-like background, dominant field |
| `--text` | `#25352c` | Primary readable text |
| `--green` | `#006043` | Brand ink, headings, links, primary structure |
| `--coral` | `#ff665d` | Restrained accent/ink specimen, not default small body text |
| `--blue` | `#0d4dad` | Brand ink; existing keyboard focus outline |
| `--yellow` | `#e2a523` | Accent/ink specimen; not relied on alone for status or normal small text |
| `--line` | `#00604365` | Subordinate separators; avoid making every row a framed card |

Current editorial type is **IBM Plex Sans** (regular/bold), supported by **IBM Plex Mono** for technical labels, IDs and dates. Existing builds use project-managed font assets; do not embed, commit or publish unlicensed external font packages to reproduce a screenshot. Revisit actual font loading and licensing when the distribution changes.

**Typographic roles, not an endless scale:** one commanding page heading; medium section headings; readable body; restrained metadata. Normal running text should be comfortable at mobile widths (aim 16px or above), and essential meaning must not rely exclusively on tiny monospace captions. A utility/date label may be smaller if still readable and tested.

**Composition:** paper ground, dark green ink, a few intentional alignment lines. Use the recurring left edges, versions and dates as a registration-like structure rather than a decorative timeline graphic. A complex print preview earns greater visual area than its settings. Contrast between sections comes from change in purpose and density, not a new component skin on every scroll.

**Card policy:** cards are not forbidden, but each container must solve grouping, comparison, selection or feedback. Do not surround ordinary text with identical rounded rectangles. A timeline entry or technical note can be plain typography with a rule. Use imagery when it proves an actual separation or artist workflow, not as stock mood-setting for a release ledger.

**Color semantics:** make color optional to comprehension. If dots or ink chips encode actual areas/categories/states, define and show that meaning and preserve it across versions. Otherwise treat them clearly as decorative and never as the only indicator.

## 5. Interaction and disclosure contract

- One index and search model must resolve **releases, events, capabilities and initiatives** consistently. Searching for a release title must also lead to the capabilities it changed; no “one release found, zero related features” contradiction.
- Roadmap current priorities should be visible without first traversing an enormous legend, search panel or completed-task inventory.
- Expandable records use native `<details>/<summary>` when suitable. A record opens to explain a real question; don't hide crucial availability information behind disclosure.
- A direct link to `#cap-INK-01` must open any containing disclosure so the target is visible. A query/reset must not silently destroy unrelated reading context.
- Form controls and links need accessible names, keyboard focus and visible states. Aim for usable ≥44 CSS px interaction targets where possible; verify WCAG 2.2 target-size rules rather than asserting conformance based only on CSS.
- Error/empty/loading states must state what happened and what to do; do not show fabricated success percentages or stale release data.
- Responsive at 320, 390, 768 and 1440 CSS px, plus zoom/reflow and long labels. No unintended horizontal overflow; maintain meaningful hierarchy on mobile, not merely a squashed desktop grid.
- Respect reduced motion. No animation should be necessary to read a version, inspect a plate, complete an export, or reach provenance.

## 6. Evidence is part of the interface

Use links to verified tests and source records for claims that matter. Human task research, artist prints, screen-reader sessions, and external distribution rights each have independent acceptance gates. If an evidence gate hasn't happened, say **pending**.

Never expose owner photographs, private art assets or image-bearing reports without permission. Use authored test artwork or rights-cleared demonstrations. The source image, recipe, proof and production masks must remain distinguishable; simulated paper and registration must not silently contaminate the physical plates.

**Protect the distinctive idea:** the relationship *source artwork → independent ink plates → combined proof → reproducible physical package*. Shared buttons/tokens are supporting material. The difference between an intelligent printing studio and a generic image-filter UI is the system of objects and interactions, not brand-colored chrome.

## 7. Boundaries and explicit open decisions

- `#31` retains the unapproved Studio layout choice (single interactive canvas versus paired source/proof presentation). This contract does not authorize either one.
- Final wordmark/identity, ink-style artistic suitability and physical print calibration require owner/artist evidence.
- Publication of an npm library, approval of native binary notices and a real GitHub release are operational/release decisions, not a styling review.
- A useful design may challenge a token or layout rule **with evidence**. Log the exception and editor decision. Avoid compliance-only interfaces that feel correct but generic.

For practical review steps, see [`REVIEW.md`](REVIEW.md); for previous accepted/rejected proposals, see [`DECISIONS.md`](DECISIONS.md). The design intent should survive agent handoffs; the rules are not meant to freeze exploration.
