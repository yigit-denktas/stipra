# Design skills installed in Stiprā

**PR:** #98 · **Skill source paths:** `.agents/skills/` (Codex/Cursor-compatible). Claude Code discovery shims: `.claude/skills/` (read the canonical copies; no duplicated implementation).

| Skill | Source | Installed scope | Runtime status |
| --- | --- | --- | --- |
| `design-maturity-review` | Owner-uploaded `SKILL(1).md`, v1.0.0, MIT | Original main skill preserved; five missing reference files supplied as explicitly labeled local Stiprā companions | Readable Markdown skill, no executable dependency |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), v2 | Existing pinned local copy with scripts/references/LICENSE | Browser inspector requires Node/browser; not automatically run on every edit |
| `good-css` | [vojtaholik/good-css](https://github.com/vojtaholik/good-css) | Existing pinned local copy with eight references/LICENSE | Pure agent guidance |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), revision `ab524607fdea` | **All 62 upstream skill files** plus root Apache-2.0 license; exact upstream hashes in [`skills.lock.json`](skills.lock.json) | Launcher installed; external engine binary **not** bundled, fetches pinned binary on first run when network and permissions permit. Not executed here. Hooks disabled. |

| `awwwards` / `jury` | [juliobsz/skills](https://github.com/juliobsz/skills), revision `f193f6745aae738e9d54a0ca28792822e4777a63` | Both complete upstream skill folders, MIT license; [hash inventory](juliobsz-skills.lock.json) | Jury static audit executed; browser measurement runner blocked by Chromium download failure. No motion engine, hooks or global install. |

These are project files committed to the review branch; none is installed globally on the user's machine. The project-local installation works for future agents that read Agent Skills at these paths. The first Impeccable engine invocation requires network access (or a separately preinstalled matching binary) and must be tested on a trusted machine.

## Selection and precedence

1. **Source of product truth:** `DESIGN.md`, `design/CONTRACT.md`, actual Studio code and structured release data take precedence over generic skills.
2. **First review:** `design-maturity-review` evaluates intent and the relationship between resolved behavior and distinctive character.
3. **Page critique:** `design-taste-frontend` and/or `impeccable` for actual interface problems. Roadmap/Changelog/Guide are **Read**; Studio is **Operate**. Use screenshots and observed behavior, not generic page templates.
4. **Implementation:** `good-css` for CSS refactors, with actual browser support and visual regressions.
5. **Acceptance:** editor/owner decision, relevant functional tests, independent reader/printer evidence where required. A skill's score is not product acceptance.

## Verify installation

```sh
node --test tests/design-skills.test.js
# Or run all repository checks:
npm test
```

The targeted test resolves every installed skill, verifies the six Claude discovery shims, verifies Impeccable's upstream Git SHA-1 blobs, and verifies direct Markdown links inside the skills. The Impeccable binary download/engine runtime is outside this file-integrity check.

## Update policy

- Do not auto-update these vendor copies without review; updating Impeccable means refreshing `skills.lock.json` from a specified upstream revision and checking its license and behavior.
- Never install repo-wide agent hooks automatically; review their file-modification and execution behavior with the owner.
- Keep the uploaded Design Maturity Review file verbatim. The locally authored companion references must not be mistaken for missing original source documents.
- Existing design audit decisions and rejected alternatives remain in `design/DECISIONS.md`.

## Jury review boundary

Use `/jury` to inspect the existing site; `/awwwards` is an optional building workflow, not permission to replace the Studio. Product requirements take precedence over generic motion, imagery and award-scoring prescriptions. The [19 October bounded review](../docs/DESIGN-JURY-REVIEW-2026-10-19.md) records findings and unmeasured areas. Independent scoring was unavailable; no award score is claimed.
