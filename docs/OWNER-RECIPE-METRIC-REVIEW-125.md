# Independent metric-unit correction for #125

Review base: `e5ac1fb4dabade50068165977901cce9160a648c`. This follow-up is prepared on a separate review branch; it does not rewrite the local agent's candidate head or any prior private metrics file.

The recipe changes are unaffected. The helper's Pearson and low-pass correlations are unaffected. Two descriptive statistic fields did not match their declarations:

- `sourceTone` / `proofTone` returned mean gray / 255, i.e. brightness. A white target returned 1 despite the documented `tone = 1 - gray / 255`. Return darkness/tone instead: white 0, black 1.
- `sourceGradient` / `proofGradient` measured differences in 0..255 gray levels but were declared in tone units. A black/white horizontal step returned 65025 instead of 1. Divide squared differences by 255² and retain eight decimal places. Missing horizontal/vertical neighbor axes contribute zero, so a one-pixel ROI does not serialize a NaN gradient as null.

Population standard deviation intentionally stays in 8-bit gray levels; its unit is now explicit. New synthetic assertions cover black, white, a unit step and a singleton ROI. The focused owner-recipe/metrics/package/report suite passes **23/23** on Linux. No owner imagery is committed.

The low-pass helper uses a finite radius of 3 pixels and sigma 1, as documented. The earlier independent PIL review used a blur radius/sigma of approximately 3; its numerical low-pass values are a sensitivity check, not the same filter or a contradiction. Always state the kernel when comparing these records.

Keep historical numeric files unchanged. Regenerate to a fresh output filename using this correction when corrected tone/gradient statistics are needed. Named human visual review and physical/independent-artist acceptance remain separate; no package-pass or issue closure is implied.
