# Stiprā design principles

> **The algorithm defines what's possible; design rules determine what's desirable.**
>
> This is our product design brief, **not** a complete implemented feature list. See [the roadmap](ROADMAP.md) for status, [the printmaking rules](docs/PRINT-DESIGN-RULES.md) for testable R01–R10 proposals, and [issue #31](https://github.com/yigit-denktas/stipra/issues/31) for interface decisions still under discussion.

## What we're making

Stiprā is a small printmaking studio for people and software agents. It lets artwork be understood and edited as **physical ink passes**, not just a flattened image with a fashionable color filter. Risograph-inspired printing is the first technique; anything else must earn its place by making the *same* source → layers → proof → export journey better.

The artistic reference is simple: **a beautiful print that you can take apart**. Each layer has its own marks, density, assigned ink and possible imperfections. Paper is not another ink. Those differences must exist in the data, not just the preview.

## Principles we will keep

### 1. The work takes center stage

A studio should open around the image and its resulting print, not an endless form. Treat the original, proof and plates as primary objects. One ink is active at a time; reveal its controls in context and hide expert parameters until asked.

**Unresolved UI choice:** should that workspace use one central interactive canvas with an ink strip, or side-by-side source/proof canvases? Both remain design options under [#31](https://github.com/yigit-denktas/stipra/issues/31). Do not code a permanent layout around an unapproved aesthetic choice.

### 2. Every effect has a reason

A portrait needs different tonal care than a poster, diagram or newspaper illustration. A **Stipra Style** is a deliberate strategy: what the work is for, which inks to use, where their coverage comes from, what to protect, how to screen the masks, and when *not* to use that style.

Start with four compelling, evidence-tested directions: **Portrait Duotone, Editorial Halftone, Bold Spot Poster, Clean Linework**. These are **proposed**, not four ready-to-use presets. Show a neutral/original baseline and a preview of each candidate using the *same input image*. Don't generate a library of lookalike slider snapshots. [#34 — Styles](https://github.com/yigit-denktas/stipra/issues/34).

### 3. Separate color from coverage

A grayscale plate describes how much of an ink prints at each pixel. The ink's name and preview color belong to its own metadata. Two differently colored previews of the same mask are **not** two different separations.

In our current pixel contract, 0 means no coverage and 255 means maximum; grayscale printing masters use the inverse convention (white means none, black means full). Keep every plate aligned to the same source and paper dimensions. Never silently resize one pass.

**Two legitimate inputs:** (a) full-color source → generated separation masks, and (b) grayscale plates already made by an artist → assigned inks and proofing. Both are implemented in the pixel SDK; authored canvases and replay are documented in the [Canvas adapter](packages/canvas/README.md). The studio does not yet have an authored-layer import UI. Named source regions and their mapping to inks are implemented in the [optional inputs adapter](docs/STRUCTURED-INPUTS.md).

### 4. Ink overlaps create the language

The most useful Risograph experiments show **what each pass contributes** and **what happens where they overlap**. A good UI should let you mute and solo an ink, inspect the actual grayscale layer, test alternate ink assignments, and see coverage changes in the combined proof.

The proof is a **digital approximation**; spot ink, paper, fluorescent ink, metallic ink and physical drying/registration cannot be represented faithfully by an ordinary sRGB multiply preview. Show that limit without drowning the canvas in warnings.

### 5. Design for printing, not merely pixels

Pixel pitch isn't equivalent to a physical halftone frequency. Eventually styles and exports need paper dimensions, DPI, LPI, trim and safe margins that don't silently change when a user asks for a bigger image.

Normal production masters should remain aligned; artistic simulated misregistration should be a **proof-only setting** unless explicitly baked into physical plates. Heavy overlapping inks, tiny lines and content near a particular machine's feed region deserve contextual warnings—not universal made-up limits.

See detailed, source-linked guidance: [R01–R10 printmaking rules](docs/PRINT-DESIGN-RULES.md) and [reference portal](docs/references/README.md).

### 6. Start easy; never take control away

The browser and CLI should apply the **same versioned style resolver** and produce the same normalized recipes and masks. Human workflow: **import → choose a suitable style → compare → adjust one ink → inspect/export**. Agent workflow: **inspect capabilities → choose/override style → render → evaluate → revise → keep the recipe**.

No style may quietly rewrite the original image, invent semantic understanding, transmit private artwork to a server, execute arbitrary uploaded scripts, or claim press calibration. The original remains recoverable. Every meaningful setting must remain accessible in Advanced controls, and every job should have documented provenance.

### 7. A warning is useful only if it explains itself

Offer diagnostics for clipping, weak/empty plates, near-identical masks, heavy combined coverage, lost thin details, and output-scale limits. Each message should say **what was measured**, **the assumed physical context**, and **what adjustment might help**. Artistic quality cannot be reduced to a single numerical score.

A rule without supporting measurements is a **design suggestion**, not a passed preflight test.

## Visual lessons from Dizzy Ink

The [Dizzy Ink Risograph Guide](https://www.dizzyink.co.uk/guide-to-risograph) is an excellent reminder that teaching the printing process can be beautiful. Its diagrams are not Stipra design assets. The four particularly relevant visual studies are documented with links and original attribution in [our Dizzy Ink image notes](docs/references/DIZZY-INK-VISUALS.md).

The lessons are ours to apply, but we don't copy their photos, diagrams, swatch artwork, page layout or code. The original website remains the place to experience them.

## Design system, public pages and agent editing

The principles above are the authority for the printmaking experience. The public roadmap/changelog/guide system has its own [experience contract](design/CONTRACT.md), [decision and rejection log](design/DECISIONS.md), and [three-task review protocol](design/REVIEW.md). The [design index](design/README.md) identifies which file governs intent, actual CSS, product-history facts and evidence.

Our design system is **more than colors and components**: it includes the objects the user manipulates (original, masks, proof, recipe, print package), source-backed communication, information relationships, interaction semantics and review decisions. Agents should extend the existing system only when they can show an improvement in an actual user task; a completed rendering is not automatic design approval. Treat the user's 2026 Katie Dill/Stripe discussion as inspiration, not a claim of using Stripe's private tooling.

## What belongs where

| Need | Document |
| --- | --- |
| First impression, current demo and concise progress | [README](README.md) |
| Product design direction and open interaction decisions | **This file** · [#31](https://github.com/yigit-denktas/stipra/issues/31) |
| Conditional printmaking rules and measurable QA ideas | [PRINT-DESIGN-RULES](docs/PRINT-DESIGN-RULES.md) |
| Original external sources and what we learned | [Printmaking references](docs/references/README.md) |
| Real implementation contracts | [Image separation](docs/IMAGE-SEPARATION-v1.md) · [Screening](docs/SCREENING-v1.md) · [Architecture](docs/ARCHITECTURE.md) |
| Done, next and deliberately deferred work | [ROADMAP](ROADMAP.md) · [GitHub issues](https://github.com/yigit-denktas/stipra/issues) |
| Contribution and agent work policy | [CONTRIBUTING](CONTRIBUTING.md) · [AGENTS](AGENTS.md) |

**What makes Stipra worth maintaining isn't a larger set of effects. It's making thoughtful printmaking decisions accessible, reversible, reproducible and enjoyable.**
