# Printmaking design rules · proposals for Stipra Styles, studio and CLI

> **Status:** design/engineering guidance, **not yet a built-in rule engine**, printer profile, scientific image-quality model or a claim that exported files are press-certified.  
> **Primary field reference:** [Dizzy Ink Print Guide](https://risograph.co.uk/) · [our annotated reading map](references/DIZZY-INK.md) · [#34 style presets](https://github.com/yigit-denktas/stipra/issues/34)

**Stipra's working principle:** *Algorithms define what is possible; design rules help decide what is desirable.* Good defaults should be tied to the artwork and intended print, explain why they were chosen, and remain adjustable in the **same validated recipe** in the browser and CLI.

The rules below have stable IDs for future implementations and QA. “Available data” means we already have enough raw information to evaluate it; it **does not** mean Stipra currently displays the proposed warning.

## A. Protect the print's structure

### R01 — Physical ink passes, not tinted screenshots

**Observation:** Every ink pass is independent grayscale coverage, with its color assigned separately. See [Your Files](https://risograph.co.uk/03-your-files) and [Density](https://risograph.co.uk/05-density).

- **Default:** maintain a shared `width × height` source grid and plate order, with one 8-bit mask per named *physical* ink and **paper outside the plate array**.
- **Export:** internal `0=no coverage`, `255=maximum`; grayscale raster master **white=no ink**, **black=maximum ink**. Do not accidentally double-invert an imported ready-made grayscale plate.
- **Failure:** if masks have mismatched bounds/rotation, block prepress export; never silently crop or resample one plate.
- **Already possible:** image import #6, separation #7; ready-made grayscale-master import is still proposed.

### R02 — A palette choice must change the separation strategy where appropriate

**Observation:** Risograph “profiles” use source-image channels as stencils assigned to chosen spot inks; selecting two different spot inks may require rebalancing light/shadow coverage, not merely coloring the same RGB render. See [Profiles](https://risograph.co.uk/04-risograph-profiles).

- **Default:** portrait/photo → prioritize broad continuous tones and a recognizable dark key; graphic poster → fewer discrete colors and clearer solid shapes; linework → solid key with minimal screening.
- **Avoid:** an unexamined “match target RGB” recipe for arbitrary photos, default destructive clipping, or three identical masks with three different preview colors.
- **Proposed warning:** “This preset produces two nearly identical plates; try a different tonal mapping.” Compare per-mask distributions/correlation, while acknowledging legitimate overlaps.
- **Already possible:** manual channels, ink colors, transfer curves #7; automatic intent-specific mapping and presets #34 are open.

### R03 — Preserve semantic detail without pretending to know semantics

- **Default:** treat user/agent intent (e.g. “portrait”, “technical drawing”, “poster”, “editorial photograph”) as an **explicit input** unless a separate verified classifier exists.
- **Linework:** prefer a solid key/hold; screen decorative midtones, not fine text/critical diagram strokes. Detect potentially fragile lines by image-space geometry and target print size, not by a fictional “AI understands text” claim.
- **Proposed warnings:** tonal clipping, dropped edges, unsupported detail below target print resolution.
- **Source:** [Imperfections / registration](https://risograph.co.uk/08-imperfections) cautions against small details dependent on precise ink alignment.

## B. Use inks economically and honestly

### R04 — Show the *actual* layer density and overlap

**Observation:** Large solid ink regions and several strongly overlapping passes can affect handling and drying. See [Drying Time](https://risograph.co.uk/07-drying-time).

- **Data available:** each per-pixel mask coverage `c_i = mask_i / 255` within `[0,1]`.
- **Useful diagnostics to implement:** per-plate mean `mean(c_i)`; fraction of printed pixels; joint coverage `sum_i c_i`; fraction of pixels with more than one near-solid pass; localized rolling-window density near a feed edge.
- **Proposed UI:** overlay flagged regions on proof; show which ink combination causes them and offer **Reduce overlapping density** or **Knock out under key ink** as *suggestions*, not destructive silent edits.
- **No invented universal threshold:** a label like “high overlap” depends on ink, stock, sheet orientation, machine and printer's practice. Introduce an explicitly named configurable machine profile before presenting a hard pass/fail limit.

### R05 — Overprint is a proof, not a colorimetric prediction

**Observation:** The relative transparency and interaction of physical inks makes additional perceived colors; paper, density and pass order matter. See [Ink Overlay](https://risograph.co.uk/06-ink-overlays) and the [ink reference list](https://risograph.co.uk/dizzy-ink-colours).

- **Default:** a paper/background preview distinct from named ink masters; toggle and solo actual masks without mutating them.
- **Proof label:** “Digital approximation.” The existing RGB multiply model is **not** an ICC-managed or spectrally measured proof.
- **Avoid:** presenting copied RGB/HEX values as guaranteed printed ink colors, or claiming fluorescent/metallic results are accurately represented on ordinary displays.
- **Longer term:** accept *measured printer-specific* ink/paper characterization under an optional profile, with its source and measurement conditions.

### R06 — Registration has two meanings

**Observation:** Small mechanical shifts occur when physical passes are printed separately. See [Imperfections](https://risograph.co.uk/08-imperfections) and the [interactive proof](https://risograph.co.uk/10-riso-proof-tool).

- **Production-default:** aligned masters, zero unintended transform; show crop/registration marks and retain identical page geometry across ink passes.
- **Optional proof effect:** artist-adjustable simulated x/y shifts, stored independently and **not baked into production masters** by default.
- **Explicit bake:** require intentional opt-in and record the transformed plate separately so the user does not confuse a simulated fault with printing instructions.
- **Physical units:** report offsets in millimeters for print jobs; pixels only for digital/raster-specific settings. `offset_px = offset_mm × dpi / 25.4` with a documented rounding rule. Example: 1 mm at 300 DPI is approximately 12 px. Actual tolerance varies by machine/paper.
- **Current gap:** #5 supports raster pixel offsets, which can currently be baked into exported masks. Decoupling preview registration and correctly aligned print masters belongs to [#8](https://github.com/yigit-denktas/stipra/issues/8).

## C. Respect the intended physical artifact

### R07 — Physical page size, margin and screen frequency are separate properties

**Observation:** Actual printable areas need mechanical margins and trimming allowances. [Printable Area](https://risograph.co.uk/09-printable-area) uses a 5 mm edge allowance as an example for Dizzy Ink's setup. **Do not copy that as a universal machine constant.**

- **Default:** distinguish **source dimensions**, **target image rectangle**, **physical paper size**, **safe area**, **bleed/trim**, **plate export** and **A4 documentation sheet**.
- **Validation:** calculate effective physical resolution using `dpi = pixels × 25.4 / millimeters` per axis, and warn if axes disagree or target detail is unprintable under the selected profile.
- **Screening:** `pitch_px = dpi / lpi` for periodic dot-cell screens. A 12-pixel pitch at 300 DPI means ~25 lines/inch; it is not automatically a fine professional halftone. Preserve physical screen frequency across alternative export resolutions.
- **Machine-profile input:** printable margin, feed edge, paper thickness, model, orientation, usable colors, target master size. Missing profile → contextual advisory, **not** unearned “press ready” status.

### R08 — Press accidents should be optional and localized

- **Digital aesthetics:** grain, minor misregistration, roller marks, paper texture or photocopy roughness may be artistic **preview/style** choices.
- **Production:** no fake mechanical artifacts should be silently embedded into printable grayscale plates. Avoid default speckle that damages small type, faces or vector geometry.
- **Feed-edge note:** Dizzy Ink mentions roughly 50 mm near its feed edge as an area where dense ink may increase mark risk; make any corresponding overlay conditional on an expressly selected relevant printer profile. See [Imperfections](https://risograph.co.uk/08-imperfections).
- **Avoid:** a “Riso authenticity” slider that conflates unrelated failure mechanisms.

## D. Make defaults explain themselves

### R09 — Put intention before sliders

**UI starting journey (proposed, not deployed):** **Import → intended use → 3–4 curated style cards rendered from the user's own artwork → main proof + active ink strip → optional advanced editing → export**.

Each authored style should have:
- `id`, version, name, short intent, compatible input types, **not recommended for** text/illustration/photography conditions, and reason for choice.
- explicit physical spot inks (or CMYK where meaningful), paper, separation/tonal mapping, dot/line/solid treatment, output intent and **neutral/unscreened fallback**;
- a small common edit surface: *ink palette*, *tone/contrast*, *detail preservation*, *texture*; all advanced existing parameters remain discoverable;
- warnings that can be evaluated from known data; a resolution-independent physical rendering goal; any output overrides recorded in the manifest.

**CLI promise:** the same style resolver and controls as browser, not a second approximate implementation. An agent should be able to list/explain/suggest presets, set target DPI/size, render alternatives and see *why* a candidate was warned about or rejected. It must remain possible to start from raw individual mask recipes.

### R10 — Distinguish operational states from quality claims

A Stipra job should make these states impossible to confuse:

| State | Meaning |
| --- | --- |
| **Valid artwork** | Decoded and bounded; original retained |
| **Separated** | Independent correctly aligned coverage masks exist |
| **Screened** | Raster screen recipe was applied as requested |
| **Proof generated** | Digital simulated composite produced |
| **Preflight checked** | Size/trim/margins/coverage were checked against *stated* assumptions |
| **Press tested** | The actual printer, paper and inks were measured or physically inspected |

Passing the first four must **not** automatically imply the last two.

## Suggested diagnostic contract (future)

A style rule report should include `rule_id`, `severity` (info/warning/blocker), `status` (pass/triggered/not-evaluated), `measured` values with units, `assumptions`, `source` link, and `suggested_fix`. This is a **proposal**, not a currently supported JSON schema. Never fabricate measurements, image semantics or laboratory calibration.

Minimal golden tests to add across [#13 QA](https://github.com/yigit-denktas/stipra/issues/13), [#34 presets](https://github.com/yigit-denktas/stipra/issues/34), [#8 exports](https://github.com/yigit-denktas/stipra/issues/8) and [#22 browser UX](https://github.com/yigit-denktas/stipra/issues/22):
1. Pure white/black/gray and transparent pixels map predictably onto each ink mask.
2. Image with tiny text keeps key linework under the *Clean Linework* intent or warns when print dimensions make preservation unlikely.
3. Two 100%-coverage overlapping masks register as dense overlap, with no arbitrary global “unsafe” limit.
4. The same recipe at two target DPI values has equivalent **physical** screen pitch and alignment, even if the raster pixels differ.
5. Proof-only registration leaves nominally aligned production masks unchanged.
6. A machine-specific crop/feed margin detects content at an excluded edge and names the profile that set the exclusion.
7. The browser, CLI and exported manifest resolve **identical normalized style settings** and per-mask bytes under the same runtime/version.

**Priorities:** ink/printing **correctness** before surface grain; practical print rules before fancy aesthetic sliders; accessible warnings before complex automatic repair. The aim is informed control, not pretending that a mathematical score can judge art.

---

**Provenance:** This is Stipra-authored guidance influenced by publicly documented printmaking practice; its external examples are clearly linked to Dizzy Ink. Nothing here licenses copying its diagrams, illustrations, software, Photoshop profiles or website design. See the [reading room](references/README.md) and [Stipra licensing policy](LICENSING.md).
