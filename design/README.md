# Stiprā design system — entry point

**Scope:** public product pages and the Studio's shared language. This is a compact set of decisions and review procedures, not a new UI framework or a replacement for the print engine.

> Preserve the product's point of view. Encode repeatable standards. Edit the result in a real browser. Keep the unusual thing that genuinely improves the work.

## Start here

| Question | Authoritative source |
| --- | --- |
| What is Stiprā for, and which interaction choices remain open? | [Product design principles](../DESIGN.md) |
| What must the public pages communicate, and how should they look and behave? | [Public experience contract](CONTRACT.md) |
| What patterns and page-flow behaviors should code follow? | [Interface patterns](PATTERNS.md) |\n| What was accepted or rejected, and why? | [Design decisions](DECISIONS.md) |
| How do we judge the design before approving it? | [Critical user journeys and review protocol](REVIEW.md) |
| How is development/release history represented? | [Product-history rules](../docs/PRODUCT-HISTORY.md) and [source data](../docs/data/product-history.json) |
| What color and font values does the browser actually use? | [Shared stylesheet](../web/stipra/shared.css) and [roadmap stylesheet](../web/stipra/roadmap.css) |
| What has the latest public-page critique actually observed? | [Taste-skill review](../docs/DESIGN-TASTE-REVIEW-2026-10-18.md) |
| What can the reviewer run? | [Pinned Taste Skill](../.agents/skills/design-taste-frontend/README-STIPRA.md) and [design inspection workflow](../.github/workflows/design-taste-audit.yml) |

The **implementation sources remain authoritative**. Do not copy CSS tokens into a second system of truth or mark a capability shipped because its issue or PR was closed. This folder states intent, semantics, review boundaries and edit decisions.

## How to contribute a design change

1. Identify the specific reader/artist task, current failure and affected surface. Quote or capture *observable evidence*, not the implementer's intention.
2. Check `CONTRACT.md` and `DECISIONS.md`. Keep existing behavior unless the proposal explains why it should change.
3. Implement one bounded change; capture the real page at desktop and narrow/mobile widths, and a representative dense or empty state where relevant.
4. Evaluate **utility, clarity, craft, character** separately. Run objective checks and record human review as pending until actually performed.
5. Record a decision: **keep / revise / reject**, rationale, evidence link, and what would reopen the question.
6. Update accepted patterns here, not every speculative idea. Preserve a clearly marked experimental branch for exploratory directions.

**Design acceptance is not release acceptance.** A green CI check or an attractive screenshot does not establish independent artist acceptance, physical print validity, accessible screen-reader operation, licensing clearance, or published release provenance.

## Inspiration, not borrowed authority

The editor-oriented principles here were prompted by the user's discussion of Katie Dill's 2026 Lenny & Friends Summit talk, [*Raise the Ceiling: How to Scale Intent, Quality, and Artistry with AI*](https://www.youtube.com/watch?v=GLvFTMtw4Jk&t=547s): have a point of view, encode standards in tools, distinguish finished from good, and use AI for experimentation. This repository interprets those ideas for Stiprā; it does **not** claim to use Stripe's internal CLI, templates or design system.

Do not impose this visual style on other products. Shared review standards are portable; Stiprā's look, vocabulary and interactions are specific to printmaking.
