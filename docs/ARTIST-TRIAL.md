# Lean library artist trial

Status: prepared, not performed. This is the remaining usefulness evidence for #70, separate from software parity and physical printing.

Use the current [Canvas/p5 examples](https://apps.yigitdenktas.com/stipra/sketches/) and the three exact tarballs in the CI `lean-distribution-audit` artifact. Follow [the candidate checks](RELEASE-CANDIDATE.md) to build/install them locally; candidates are not yet available from npm. Use artwork you own. Keep photographs and image-bearing exports private.

The task is small: start with an existing Canvas or p5 sketch, apply a shared treatment, inspect two ink passes, then export and replay the frozen source/layers with the same recipe. Also try artist-authored ink masks with solid lettering. Compare this with your normal Canvas/p5 buffer/export approach; drawing and grain stay in the host.

Record what actually happens:

- Host/version, backing/logical pixels, input kind and the exact package/recipe hashes.
- Whether the documented setup works without agent intervention, and every confusing or failed step.
- Actual elapsed task time, which controls you used, whether plates aligned and replay succeeded.
- Whether the extra recipe/package workflow is useful enough to keep; what you would remove or change.

Use `examples/alpha/artist-trial-record.json` for an empty record. A completed record is feedback, not automatic release approval. Do not copy benchmark timings into observed fields, fill it with simulated users, or call an agent review an independent artist trial. No independent trial has been submitted.

## Publication handoff

The intended experimental distribution is the lean core/Canvas/inputs set. PDF/native tools remain optional and outside their imports. The native Skia finding does not become a dependency of these tarballs. A digital alpha must still state its performance, host and uncalibrated-proof limits.

The owner has created and verified npm account `yigit-denktas` and authorized experimental publication. Candidates use the personal scope and version `0.1.0-alpha.1`; see [the release procedure](RELEASE-CANDIDATE.md). CLI authentication succeeded and npm accepted all three uploads; registry processing and availability verification remain pending. No credentials belong in the repository or trial record. This authorization does not supply independent artist feedback.

Publisher identity and upload status are recorded in [the accepted-upload record](evidence/npm-alpha-upload-2026-10-18.json). Use the audited CI tarballs while registry lookup returns 404; an accepted upload alone does not establish a working public install.

## Human handoff

An artist other than the implementer should follow the task above without agent setup assistance, then return their completed trial record and specific failure notes. There is no named participant or submitted record yet; no invitation has been sent. A maintainer or owner rehearsal can find defects, but does not count as independent feedback.

For a first physical check, follow [the operator procedure](PHYSICAL-PRINT-CHECK.md): print the photo-free scale/legibility sheet at 100%, measure both 100 mm rules and the 101.6 × 76.2 mm master, and record the actual printer, stock and observed text/registration behavior. Keep evidence private and run the record checker. This home-printer check does not validate Riso color or dot gain.

Return the actual records before closing #13 or the independent-usefulness portion of #70. Forest/beach artistic acceptance remains separate under #43/#47; the operator kit uses original procedural artwork, not the private owner photographs.
