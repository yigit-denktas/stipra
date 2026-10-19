# Stiprā backlog audit handoff — 2026-10-20

Base: `d033ce7c923507c607786ca141fb532500964c60` (main, PR #119 merge). Read-only backlog audit, cloud reconciliation and A/B maintenance branches. No merges, PRs or issue-state changes.

## Branches

| Branch | Head | Scope |
|---|---|---|
| `fix/windows-portability-audit-2026-10-20` | `90abb56ec92675f677a30fa1ec1b1f0c756a740a` | Windows test/build portability; tests plus `scripts/build-core.js` atomic concurrency |
| `chore/reconstruction-test-requirements-2026-10-20` | `aa5e4242840fe2422c809227365ba8c0a92a79ad` | Self-contained reconstruction test requirements and future archive `.txt` inclusion |
| `audit/backlog-2026-10-20` | this branch | Audit reports, patches, logs and package |

## Windows results

- Baseline main: 193 tests / 180 pass / 11 fail / 2 skipped.
- A head, default `%TEMP%`: 194 / 187 pass / 5 fail / 2 skipped.
- A head, writable `TEMP`/`TMP`: 194 / 191 pass / 1 fail / 2 skipped — only #84 symlink privilege.
- Non-symlink subset: 193 / 191 pass / 0 fail / 2 skipped.
- Vendor checks retain committed-blob verification and add working-tree verification: text may differ only by LF/CRLF; binary must match exactly. Regressions cover newline-only pass, substantive fail and binary fail for both inventories. B: 5 Python tests OK; #119 evidence/archive identities untouched.

## C and #75

- Retain #8/#9/#12 as completed implementation records; propose one #13 acceptance child covering G01–G11 plus A1–C5 with private PASS/FAIL/NOT RUN fields. No acceptance passes implied.
- Record #75's usefulness dependency as a soft gate.
- Reconcile verified drift separately: 17 closed unchecked-box records, 17 `sourceUpdatedAt` mismatches, stale ROADMAP/RELEASE-CANDIDATE prose; no auto-reopen or auto-tick.

## Files

- `final-handoff.md` — coverage and all 55 issue rows.
- `cloud-reconciliation.md` — agreement summary and message.
- `maintenance-a-b.md` — A/B results, host restrictions, review instructions.
- `initial-findings.md` — historical first pass.
- `per-issue.csv`, `coverage.json`, `dispositions.json` — compact records.
- `patches/` — exact A/B patches.
- `logs/` — Windows baseline/final logs.
- `stipra-backlog-audit-2026-10-20-independent.zip` — complete audit package including raw issue retrieval.

## Message for the cloud agent (GitHub-accessible)

Cloud audit received and reconciled; no merge/issue-state changes. A/B maintenance branches are pushed at the heads above. Windows results and remaining host restrictions are in `maintenance-a-b.md`; the revised A branch keeps committed-blob verification and adds working-tree vendor verification (text LF/CRLF-only, binary exact) with regressions for both inventories. B is unchanged. C is as agreed: retain #8/#9/#12 completed implementation records and propose one #13 acceptance child covering G01–G11 + A1–C5; record #75 usefulness as a soft gate. Please review A/B on Linux against the file scopes and leave #13/#14/#70/#109 acceptance parents open. No Experiment 2 or new research started.
