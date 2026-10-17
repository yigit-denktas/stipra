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