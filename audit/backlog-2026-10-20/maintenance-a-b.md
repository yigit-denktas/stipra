# Maintenance A/B — Windows portability and reconstruction test requirements

Base: `d033ce7c923507c607786ca141fb532500964c60` (main, PR #119 merge). No merge, no PR, no issue-state change.

## Branches and exact heads

| Branch | Head commit | URL |
|---|---|---|
| `fix/windows-portability-audit-2026-10-20` | `90abb56ec92675f677a30fa1ec1b1f0c756a740a` | https://github.com/yigit-denktas/stipra/tree/fix/windows-portability-audit-2026-10-20 |
| `chore/reconstruction-test-requirements-2026-10-20` | `aa5e4242840fe2422c809227365ba8c0a92a79ad` | https://github.com/yigit-denktas/stipra/tree/chore/reconstruction-test-requirements-2026-10-20 |

Both branches are pushed to `origin` and are based directly on `d033ce7`; no evidence, archive, recipe, golden or delivery file is changed.

## A — reproduced Windows failures and bounded fixes

Files changed (7):
- `tests/npm-cli.js` (new): run npm through its JS CLI (`process.execPath` + `npm_execpath`) rather than a Windows executable shim.
- `tests/canvas-package.test.js`, `tests/core-package.test.js`, `tests/inputs-package.test.js`: use that helper. Fixes six `spawnSync npm ENOENT` failures.
- `tests/design-skills.test.js`: keep committed-blob verification; also verify working-tree vendor content, allowing only LF/CRLF differences for text files and exact equality for binary files. Add regressions for both inventories proving newline-only changes pass and substantive/binary edits fail. Fixes LF/CRLF checkout variants.
- `tests/readme.test.js`: normalise CRLF before the README length/entry-point check. Fixes the Windows CRLF length failure.
- `scripts/build-core.js`: unique atomic temp name and tolerate a concurrent worker that already produced the same artifact (EPERM on Windows rename); prevents `.tmp` contamination and flaky concurrent package tests.
- TypeScript consumer isolation: `tests/core-package.test.js` passes an empty `--typeRoots` so ambient ancestor `@types` cannot change the test result.

No import/runtime behavior, product API, evidence, archive identity, recipe or golden was changed. The only non-test file is `scripts/build-core.js` (build-mechanism concurrency only).

### Reproduction and results

Environment: Windows NT 10.0.26300.0; Node v22.15.0; npm 11.7.0; git 2.49.0.windows.1; Python 3.12.14.

Baseline on main `d033ce7` (LF checkout, default `%TEMP%`): `193 tests, 180 pass, 11 fail, 2 skipped`.
Failures: canvas adapter 4×, packed core, optional inputs (npm spawn ENOENT); browser export, Pages build, build-copy deterministic, mirror (TEMP access denied); physical records (symlink EPERM).

CRLF reproduction on main (separate file conversion, restored afterwards): README short-entry and vendor checks fail; both pass after the A fixes. Targeted design test 5/5 in LF and CRLF, including newline-only/substantive/binary regressions for both inventories.

After A fixes, default `%TEMP%`: `194 tests, 187 pass, 5 fail, 2 skipped (A adds one vendor-content regression test)`.
Remaining: #36, #69, #70, #128 (TEMP access denied) and #84 (symlink EPERM).

After A fixes with a writable `TEMP`/`TMP` (`C:\Users\yigit\Documents\repos\stipra-windows-temp`): `194 tests, 191 pass, 1 fail, 2 skipped`. The only failure is #84 symlink EPERM. A non-symlink subset run is `193 tests, 191 pass, 0 fail, 2 skipped`.

Logs preserved in this package:
- `windows-test-baseline.log`
- `windows-test-after-fixes.log`
- `windows-test-full-workspace-temp.log`
- `windows-test-no-symlink.log`
- `windows-test-vendor-default-temp.log`
- `windows-test-vendor-workspace-temp.log`
- `windows-test-vendor-no-symlink.log`

## B — self-contained reconstruction test requirements

Files changed (3):
- `examples/reconstruction-study/requirements-test.txt`: adds `Pillow==12.3.0` and `reportlab==4.4.9` alongside `numpy==2.3.5` and `scipy==1.17.0`.
- `examples/reconstruction-study/package.py`: `study_source_files()` includes intended study `.txt` files (requirements) in future self-testing archives.
- `examples/reconstruction-study/test_metrics.py`: fifth regression test validates the four pins and that the requirements file is in the archive source inventory.

Local Python test result: `Ran 5 tests in 0.121s — OK` (dependencies from the review environment; no evidence or archive built/rewritten).

## Remaining host restrictions (not application claims)

1. **Default Windows `%TEMP%` ACL blocks esbuild writes** for browser-export/Pages/mirror tests (`Access is denied`). With `TEMP`/`TMP` set to a writable directory the same tests pass. This is a host temp/ACL restriction, not a proven Stiprā application defect; no code workaround was added.
2. **Windows symlink creation EPERM** in the print-observations test. Requires Developer Mode or symlink privilege; no code change. The test remains a real host-privilege gate.
3. **Ambient `@types` in an ancestor directory** (`C:\Users\yigit\node_modules`) contaminated a TypeScript consumer test; A isolates the consumer with an empty `--typeRoots`. This is test isolation, not a runtime issue.
4. **CRLF checkout bytes** affected two tests; A verifies pinned Git blobs and normalises text measurement. No remaining CRLF failure in the targeted checks.
5. No Linux/other-platform acceptance is claimed from this Windows run; cloud review should run A/B on Linux.

## Review instructions

```bash
git fetch origin
git switch fix/windows-portability-audit-2026-10-20
npm ci
npm run prepare:paper-mono
npm test
# Windows: set TEMP/TMP to a writable directory; expect 191 pass / 1 host fail / 2 skip
# Linux: no host-temp or symlink restriction expected; confirm the full suite

git switch chore/reconstruction-test-requirements-2026-10-20
python -m pip install -r examples/reconstruction-study/requirements-test.txt
python examples/reconstruction-study/test_metrics.py
# expect 5 tests: OK

git diff --name-only d033ce7..fix/windows-portability-audit-2026-10-20
git diff --name-only d033ce7..chore/reconstruction-test-requirements-2026-10-20
# no evidence/archive/recipe/golden path should appear
```

Do not merge either branch. C reconciliation is still cloud-owned and must preserve `#8/#9/#12` completed implementation records while proposing one `#13` acceptance child covering G01–G11 plus A1–C5; no acceptance pass is implied. Record #75's usefulness dependency as a soft gate.
