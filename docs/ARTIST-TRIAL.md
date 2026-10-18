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

The owner selected a personal npm scope on 18 October 2026. The owner confirmed that no npm account exists yet. Account creation comes before selecting the exact personal namespace; do not infer it from GitHub. Authenticate through the normal npm login flow, never by placing a password, token or one-time code in an issue or chat. Package renaming/publication waits for the actual account identity.
