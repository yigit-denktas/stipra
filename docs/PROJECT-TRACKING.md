# Native GitHub tracking

Verified 18 October 2026 through the owner's signed-in GitHub interface. The [v0.9 milestone](https://github.com/yigit-denktas/stipra/milestone/1) contains the original issues #1–#14. Nine are closed; #3, #4, #10, #13 and #14 remain open. This is issue closure, not estimated implementation progress.

The existing [Stipra Project](https://github.com/users/yigit-denktas/projects/3) remains private. Its access page lists one collaborator: the owner, with Admin access. No collaborators, permissions or visibility settings were changed. Links work for that current collaborator; adding another collaborator would require its own access decision.

Both saved views filter `repo:yigit-denktas/stipra milestone:v0.9` and sort Priority ascending:

- [v0.9 backlog](https://github.com/users/yigit-denktas/projects/3/views/6): table with Priority and Area.
- [v0.9 board](https://github.com/users/yigit-denktas/projects/3/views/7): columns by native Status, including three Backlog items, two In review and nine Done.

All 14 original items have Priority and Area values. Existing broader views and fields are retained. #17's configuration is complete; it does not close any physical or artistic acceptance gate.

## Inspected workflows

All 11 workflow configurations were inspected; seven are enabled. These are configuration observations, not a claim that every trigger was exercised with disposable issues. The rules were not changed.

| Workflow | Enabled | Observed behavior |
| --- | --- | --- |
| Auto-add sub-issues | Yes | Add sub-issues of a Project item |
| Auto-add to project | Yes | Repository `stipra`, filter `is:issue,pr is:open`; add new or updated matches |
| Auto-close issue | Yes | Status becomes Done → close the issue |
| Item added | Yes | Issues and PRs added → Backlog |
| Item closed | Yes | Issues and PRs closed → Done |
| Pull request linked to issue | Yes | Set Status to In progress |
| Pull request merged | Yes | Set Status to Done |
| Auto-archive items | No | Archive filter workflow, not active |
| Code changes requested | No | Configured target Ready, not active |
| Code review approved | No | Configured target Ready, not active |
| Item reopened | No | Configured target Ready, not active |

Moving an acceptance issue to Done closes it. Keep #13/#14 and artist/physical gates In review until their actual requirements are met. A merged implementation PR is evidence for its own scope; it is not a substitute for print observations or independent feedback. Auto-add operates going forward; it does not promise that every historical matching issue is already in the Project. The original 14 were checked directly.

The [versioned ledger](data/delivery-ledger.json), [roadmap](../ROADMAP.md) and issue bodies record the same native objects. Library package versions, recipe versions and studio release targets remain separate.
