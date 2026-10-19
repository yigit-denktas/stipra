# Cloud/local reconciliation — Stiprā backlog (A/B prepared)

**Status:** cloud audit received and read; independent first pass recorded first. A/B maintenance branches are prepared and pushed; no merge, no PR, no issue-state change. C remains owner/cloud action.

## Agreement summary

| Cloud recommendation | Position | Independent evidence | Disposition |
|---|---|---|---|
| Most completed engineering correctly closed; don’t close acceptance gates or promote proposals to sprints | Agree | 55 issues / 17 open / 38 closed / 123 comments; ledger state match; 17 historical unchecked closed boxes are stale, not reopens | Keep closed implementation records |
| #34/#43/#46 conditional consolidation/closure | Agree, needs owner | #34 proposal implemented through #47; #43 digital forest/beach approval recorded with physical/artist deferred; #46 superseded by #57 | Owner confirms; preserve artifacts |
| #47 remains one Styles quality gate | Agree | Four families implemented; only two digital specimens owner-approved | Keep #47 open |
| #13/#70 acceptance parents; split Windows/human/operator | Agree, with addition | `PHYSICAL-PRINT-CHECK.md` not performed; `ARTIST-TRIAL.md` no submitted trial; Windows failures mixed | Keep parents; separate children |
| #3/#4/#10/#28/#75 deferred; #31/#57 owner decisions; #113/#114 proposals; #14 native-only | Agree | Issue scope/ledger and code inventory; upstream #309 open/0 comments | Keep as proposed/deferred/open |
| #109 keep open; Study 01 delivered; extract maintenance; no Experiment 2 | Agree | PR #119 merged at d033ce7; original evidence preserved | Keep #109 open; no rerun |
| 17 closed unchecked-box issues; 17 sourceUpdatedAt drifts; stale ROADMAP/RELEASE-CANDIDATE prose | Agree | Independently reproduced exactly | Cloud/owner docs pass; no auto-tick/reopen |
| #75 body/ledger dependency mismatch | Agree | Body waits on #70 usefulness; ledger names #74 | Record usefulness as **soft gate** |
| Windows A / requirements B / C reconciliation | Agree | Reproduced and fixed bounded items; host restrictions documented | A/B branches prepared; C cloud-owned |
| Human D / research E | Agree | No observations; no Experiment 2 authorization | Owner/human only; paused |
| **#8/#9/#12 acceptance residual** | **Agree keep completed implementation records; needs owner action on child** | `PRINT-PACKAGE-ACCEPTANCE.md` still NOT YET RUN, all G01–G11/A1–C5 unchecked, 0 of 3; fixture status SPECIFICATION_ONLY_NOT_EVALUATED | Retain #8/#9/#12 as completed implementation records; propose one #13 child covering G01–G11 + A1–C5; no acceptance pass implied |

## A/B delivered

| Branch | Head | Scope |
|---|---|---|
| `fix/windows-portability-audit-2026-10-20` | `90abb56ec92675f677a30fa1ec1b1f0c756a740a` | Test/build portability only: npm CLI invocation, committed-blob plus working-tree vendor checks (text LF/CRLF-only, binary exact), CRLF-insensitive README and ambient-@types isolation, core build atomic concurrency |
| `chore/reconstruction-test-requirements-2026-10-20` | `aa5e4242840fe2422c809227365ba8c0a92a79ad` | Self-contained `requirements-test.txt`, `.txt` archive inclusion, fifth membership test |

Windows: baseline 193/180/11/2; after A with writable TEMP/TMP 193/190/1/2, sole failure the symlink privilege test. Default `%TEMP%` still blocks four esbuild/browser tests with Access denied; that is a host ACL restriction, not a proven application defect. No import/runtime/evidence/golden changes. B: 5 Python tests OK; #119 evidence/archive identities untouched.

## Proposed C and owner decisions

1. Retain #8/#9/#12 completed implementation records; propose one #13 acceptance child covering G01–G11 + A1–C5 with private PASS/FAIL/NOT RUN fields. No passes implied.
2. Record #75 usefulness as a soft gate.
3. Reconcile verified drift in one cloud-owned docs/metadata pass; no evidence rewrite, no auto-close/tick.
4. Confirm #34→#47, #43→#13/#70, #46→#57 consolidations; keep #3/#4/#10/#28/#75 parked/owner-close.
5. After maintenance, choose any next creative package only if wanted; Experiment 2 remains separate and unauthorized.
6. If the issue board/thread URL is provided, post this handoff there; no GitHub coordination issue currently exists.

## Paste-ready final message to the cloud agent

```text
A/B maintenance is prepared and pushed; no merges, PRs or issue-state changes. Base d033ce7.

A: fix/windows-portability-audit-2026-10-20 @ 90abb56ec92675f677a30fa1ec1b1f0c756a740a
B: chore/reconstruction-test-requirements-2026-10-20 @ aa5e4242840fe2422c809227365ba8c0a92a79ad

Windows results: baseline 193 tests / 180 pass / 11 fail / 2 skipped. After A fixes with writable TEMP/TMP: 194 / 191 pass / 1 host fail / 2 skipped; sole failure is the Windows symlink-privilege test. Default Windows %TEMP% additionally blocks four esbuild/browser-build tests with Access denied; writable TEMP/TMP resolves those, so this remains a host temp/ACL restriction, not a proven app defect. CRLF README/vendor failures were reproduced and fixed; vendor checks now verify committed blobs AND working-tree content (text permits LF/CRLF only; binary exact) with newline-only/substantive/binary regressions for both inventories; npm-shim, ambient-@types and concurrent-core-build failures were reproduced and fixed. No import/runtime or evidence/golden/recipe change. A’s file scope is tests + scripts/build-core.js atomic concurrency.

B: requirements-test.txt self-pins Pillow==12.3.0 and reportlab==4.4.9; package.py includes intended study .txt files in future self-testing archives; test_metrics.py adds a fifth pin/membership regression. Local Python: 5 tests OK. Existing #119 evidence/archive identities untouched.

C per owner: retain #8/#9/#12 as completed implementation records; propose one #13 acceptance child covering G01–G11 plus A1–C5 with private evidence and PASS/FAIL/NOT RUN fields. No acceptance pass implied: docs/PRINT-PACKAGE-ACCEPTANCE.md remains NOT YET RUN / 0 of 3 and the fixture status remains SPECIFICATION_ONLY_NOT_EVALUATED. Record #75’s usefulness dependency as a soft gate. Reconcile the verified drift separately: 17 closed unchecked-box records, 17 sourceUpdatedAt mismatches, stale ROADMAP/RELEASE-CANDIDATE prose; do not auto-reopen or auto-tick.

Please review A/B on Linux, confirm C wording, and leave #13/#14/#70/#109 acceptance parents open. No merge/closure during this phase; no Experiment 2 or new research started.
```

## Files for direct transfer

Send the cloud agent `stipra-backlog-audit-2026-10-20-independent.zip` or, minimally, this file plus `maintenance-a-b.md`, `per-issue.csv`, and the A/B patches. Local folder (owner only): `C:\Users\yigit\Downloads\stipra-backlog-audit-2026-10-20-independent\`.
