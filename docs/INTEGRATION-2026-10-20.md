# Integration record — 20 October 2026

**Main baseline:** `71bbb0b3cc1a6a784fcec153b5eab1bc4ce90fe2`
**Scope:** docs-only reconciliation of the two owner-photo integration PRs. No product code, acceptance promotion, artifact regeneration, branch deletion, release publication or merge.

## Merged work

| PR | Reviewed head | Merge commit | Merged at | Main CI |
|---|---|---|---|---|
| [#127](https://github.com/yigit-denktas/stipra/pull/127) | `63f2572ec898ff11c01bd7abf60b5edf339c06a7` | `48c4d40ea5e39f450ce62f30a11e2057d331b805` | 2026-10-20T13:06:04Z | deploy, build and test success |
| [#128](https://github.com/yigit-denktas/stipra/pull/128) | `cbdd295db1bfd2f50aade7d39ec69ed3d71e9c2b` | `71bbb0b3cc1a6a784fcec153b5eab1bc4ce90fe2` | 2026-10-20T13:06:19Z | checks success |

`#127` implements the ratio-aware owner-report contract v2 and layout-v8 HTML/PDF substrate/caption parity. `#128` implements the revised owner-A/B/C batch recipes, selective three-ink forest candidate and reproducible metric helper. The recipe and report changes are implementation only.

## Remaining gates

- **#123:** PARTIAL EXECUTION / **0 of 3 accepted**. Combined digital package generation, generic verification, byte-for-byte repeatability and agent review of all six PDF pages are complete; final combined build/export checks and 206 tests pass. Named human package acceptance and rendered HTML/browser review remain pending.
- **#13/#14/#70/#109:** open.
- Human accessibility remains open/not performed.
- Physical prints and independent artist trials remain owner-deferred.
- Historical landscape-only failures, prior packages, evidence and archive identities are preserved; the initial `f59c8d9` execution remains recorded and no previous FAIL or NOT RUN result became PASS.

Main CI at `71bbb0b`: deploy, build and test runs all succeeded when checked on 20 October 2026. This record does not infer publication or physical acceptance from the merges.
