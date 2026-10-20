# Authorized A/B/C integration — 20 October 2026

Owner authorized separate merges of the three accepted heads and creation of the #13 owner-photo acceptance task on 20 October 2026. All three PRs were merged with expected-head guards after their test, GitGuardian and Cloudflare checks succeeded.

| Work | PR | Reviewed head | Merge commit |
| --- | --- | --- | --- |
| A | [#120](https://github.com/yigit-denktas/stipra/pull/120) | 90abb56ec92675f677a30fa1ec1b1f0c756a740a | fd75d6df06e252fc71b86aab5a00be20032c1ee5 |
| B | [#121](https://github.com/yigit-denktas/stipra/pull/121) | aa5e4242840fe2422c809227365ba8c0a92a79ad | cc7dd0f92d11affeff090398f3382ab98794dcaf |
| C | [#122](https://github.com/yigit-denktas/stipra/pull/122) | b1538b30fcbcfbe374e13ae8b3c6badab7a20814 | f59c8d9fb144294e41209bc76d8d1c83701005ee |

Final integrated source: f59c8d9fb144294e41209bc76d8d1c83701005ee. Combined local A+B+C integration passed 194 Node tests and five Python tests, zero failures/skips. PR workflow runs: A 39347313989, B 39347315720, C 39347319513 (all success). These are software checks, not human/physical acceptance or a claim that a new main deployment has completed.

Created [#123 — Owner-photo package acceptance, private evidence](https://github.com/yigit-denktas/stipra/issues/123), assigned to yigit-denktas, milestone v0.9. It is linked from #13 with an unchecked task-list comment and its own parent reference. Native GitHub sub-issue linkage was not configured through the available connector; do not imply otherwise.

The child/task covers G01–G11 and A1–A5/B1–B5/C1–C5. It remains NOT RUN / 0 of 3. Closure requires the existing three-fixture package-pass policy, including named visual review and source-rights/evidence requirements. Human accessibility is open/not performed; physical prints and independent artist trials are owner-deferred. #13/#14/#70/#109 remain open. #8/#9/#12 remain closed implementation records. Conditional #34/#43/#46 proposals were not executed.

The exact baseline-to-final comparison contains 16 reviewed source/test/doc files and no canonical study evidence, original owner photographs, recipes, goldens or delivered archives. No study rerun, archive rebuild, renderer upgrade, package publication, branch deletion or Experiment 2 occurred.

Pre-merge C ledger notes say A/B were unmerged/no merge authorized and describe the acceptance child as proposed. Those are the accepted review snapshot preserved by merging the exact authorized heads. This record and #13/#123 establish the later authorized state; a future ordinary ledger refresh should reconcile those now-historical notes and add #123 without altering the original v0.9 denominator. No additional main change is included in this integration.
