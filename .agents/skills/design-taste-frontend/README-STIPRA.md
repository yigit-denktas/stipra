# Taste-skill integration for Stiprā

Source: [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), `skills/taste-skill` (`design-taste-frontend`, v2).
Upstream `SKILL.md` blob at import: `91d114a9d8d1e9999ff8bdc7c6fc2303a49af754`.
Imported 18 October 2026, with upstream MIT license in this folder.

The files here are a pinned local copy of the **default public-page skill** and its supporting scripts and references, not the entire multi-skill upstream bundle. A networked developer can also use:

```sh
npx skills add Leonxlnx/taste-skill --skill design-taste-frontend
```

## How to use

Review the page's purpose and real visual assets, then read `SKILL.md` and `references/critique.md`. In a Node 22+ environment with Chromium:

```sh
node .agents/skills/design-taste-frontend/scripts/lint.mjs web/stipra/roadmap.css web/stipra/shared.css
npm run build:pages
node .agents/skills/design-taste-frontend/scripts/inspect.mjs dist/stipra/roadmap/index.html
```

The inspector creates `.taste-skill/inspect` screenshots and a JSON report. Treat its output as evidence, not as a substitute for judgment. It evaluates public marketing pages by default and may report image/motion deficits on an intentionally text-forward software changelog.

## Contract before inspection

Read [`design/CONTRACT.md`](../../../design/CONTRACT.md), [`design/PATTERNS.md`](../../../design/PATTERNS.md) and the decision log before proposing visual changes. The upstream skill provides critique and experiments; Stiprā's contract specifies the product-specific experience, with [`design/REVIEW.md`](../../../design/REVIEW.md) assigning final judgment to an editor/owner and evidence from real user tasks.

## Stiprā-specific boundaries

- Apply the taste skill to **public editorial pages**, not as a replacement for usability or print-production rules in the interactive Studio.
- Keep the actual IBM Plex fonts, paper/ink palette, original SVG dotmark and current print workflows. No fictional product imagery, fabricated publication date, decorative chart, or animated interface is accepted merely to satisfy a heuristic.
- Prefer actual product screenshots or measured print examples, with permissions, when a visual demonstration is warranted. Do not add stock imagery to technical records.
- Keep real releases separate from implementation, acceptance and proposed milestones. The future-state simulation remains fictional.
- Preserve reduced-motion, keyboard navigation and the existing local processing/content-security constraints.
- `docs/DESIGN-TASTE-REVIEW-2026-10-18.md` records the latest page-by-page decisions, evidence, and remaining manual acceptance.

The upstream inspector's failure/warning count is recorded verbatim. Exceptions require a written rationale rather than quietly suppressing its checks.
