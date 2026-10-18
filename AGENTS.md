# AGENTS.md · Stipra work policy

## Goal

Turn the Prehnite proof-of-concept into a reproducible, local-first, open-source print engine. Preserve alignment fidelity and keep the render core and report/prepress UI distinct.

## Issue lifecycle

For **every issue**, record:
- **Type** (Feature/Bug/Chore/Research/Documentation) in the title or issue type field if supported.
- **Area, priority, scope and release target** in labels/body.
- **Assignee** (the repository owner unless delegated).
- **GitHub Project and milestone** when available; do not invent links or numbers if absent.
- **Dependencies and related issues**, referenced with actual issue numbers.
- **Acceptance tests** and reproducible output files expected.

Use branch names like feat/123-separation-sheet or fix/456-plate-offset. PR body must say Closes #123 (when applicable), list test commands and screenshots/report artifacts. Keep work traceable both forward (issue → branch → PR → commit) and backward (commit → PR → issue). Never mark a milestone complete on prose alone. Close genuine duplicates using GitHub's duplicate reason and a cross-link.

## Keep the public entry point current

When a change alters capabilities, setup, examples, limitations or the next priority, update README.md in the same PR and reconcile the relevant ROADMAP.md status. Keep the README short and link detailed contracts/evidence. Distinguish implemented behavior, verified checks, proposed work and publication/physical-print acceptance. Do not retain stale fixed issue counts or claim unsupported readiness.

## Maintain the public product history

When a change materially affects a capability, add a dated, typed event to `docs/data/product-history.json` and reconcile `docs/data/changelog.json`. Reuse its permanent capability ID; do not create a new feature merely because an old capability was improved. Classify features, validation, operations and research separately. Never infer publication or physical acceptance from a merged PR or closed issue. Release mappings require explicit typed changes in GitHub release notes. See [product-history rules](docs/PRODUCT-HISTORY.md). Run `node --test tests/roadmap-history.test.js tests/site-info.test.js` after edits.

## Before changing defaults or the studio UI

Read [DESIGN.md](DESIGN.md) for Stipra's product principles and [docs/STYLES-v1.md](docs/STYLES-v1.md) for the four implemented, unvalidated starting recipes, [docs/PRINT-DESIGN-RULES.md](docs/PRINT-DESIGN-RULES.md) for proposed printmaking constraints, and [docs/references/README.md](docs/references/README.md) for attributed real-world references. Distinguish approved UI behavior from open design choices in #31. Keep the README short; add new technical detail to the appropriate documentation.

## Technical rules

- Generate render pixels procedurally; reference artwork may be used for comparison only.
- All physical ink plates share dimensions and identical origin.
- Keep print imperfections separate from geometry.
- Use deterministic recipe and seeds; log exact input parameters and environment.
- No paid hosting, subscriptions, inference fees or vendor lock-in for core rendering.
- Keep the supplied logo_for_Readme.svg unchanged unless owner explicitly requests a redesign.
- Don't commit unrelated copyrighted references or restricted p5.riso source.
- Run tests before merging. Don't invent CI passes, percentage progress, or physical-press calibration.

## First milestone

Complete the documented v0.9 backlog: paper contamination/geometry, generic image input, editable spot+CMYK separations, full-size plates, A4 HTML/PDF inspection sheet, diagnostics, CLI, QA.
## Public page design reviews

The pinned upstream Taste Skill v2 lives in [`.agents/skills/design-taste-frontend/`](.agents/skills/design-taste-frontend/README-STIPRA.md). Before changing a public roadmap, changelog, guide, sitemap, sketches or regions page, read its `SKILL.md`, `references/critique.md` and the latest [page-by-page Stiprā review](docs/DESIGN-TASTE-REVIEW-2026-10-18.md). Verify the rendered page on desktop and phone, not just the CSS. Run its local `lint.mjs` and `inspect.mjs` if the environment supports Node 22 and Chrome. Keep the output and state any intentional exceptions.

**Do not** apply marketing-page image-count, stock imagery or motion rules mechanically to a source-backed software changelog, and do not redesign the interactive Studio purely for aesthetic conformity. Protect the original print engine, IBM Plex type, Stiprā paper/ink palette, identity assets, keyboard access and honest release/acceptance claims. CI's `design-taste-audit.yml` retains its raw findings; it does not replace product functionality, real-reader or assistive-technology acceptance.
