# Dizzy Ink guide · field notes for Stipra

**Original:** [Interactive Risograph Print Guide](https://risograph.co.uk/) — designed and curated by **Dizzy Ink**, a UK print studio. **Research reviewed:** 17 October 2026. **Status:** reference and design research, *not* an implemented Stipra feature specification or reproduction of the website.

For the image-rich **Dizzy Ink studio guide** at a *different URL*, see [our visual analysis of its four reference images](DIZZY-INK-VISUALS.md) and the [original source](https://www.dizzyink.co.uk/guide-to-risograph).

The strongest lesson is not a particular color, layout, or texture. It's that a print workflow becomes intuitive when **every control visibly refers to a physical ink layer, a sheet of paper, or a known production trade-off**. Below are Stipra-authored observations and questions. Open each original link for Dizzy Ink's artwork, diagrams and interactive demos.

## Reading map

| Chapter | What matters for printmaking | What to carry into Stipra |
| --- | --- | --- |
| [01 · History](https://risograph.co.uk/01-quick-history) | Stencil duplication supports zines, posters, community publishing and editions. | Make printed artifacts and repeatable editions the goal, not merely “Riso texture.” |
| [02 · Introduction](https://risograph.co.uk/02-introduction) | Printing is one pass per ink/stencil. | Model a job as named physical passes plus an independent substrate. |
| [03 · Your Files](https://risograph.co.uk/03-your-files) | A supplied grayscale plate describes *where and how much* an ink prints; ink color is assigned separately. | Keep a single coverage convention (0=no ink; 255=full) and export inverted grayscale masters (white=none, black=full). Name files by physical ink. |
| [04 · Profiles](https://risograph.co.uk/04-risograph-profiles) | RGB artwork can be decomposed and channels reused as stencils with different spot inks; two- and three-ink images need not imitate process CMYK. | Styles should choose an intentional color/tonal *mapping* and produce distinct masks, not only tint an RGB copy. |
| [05 · Density](https://risograph.co.uk/05-density) | A grayscale value controls strength within a single ink pass. One ink has a tonal range. | Offer plate-intensity/curve adjustment, preview each mask at 100%, and do not confuse transparency with exported grayscale density. |
| [06 · Ink Overlay](https://risograph.co.uk/06-ink-overlays) | Semi-translucent inks combine into additional apparent colors; ink and paper influence the outcome. | Preview overprint with independently toggleable plates. Mark our RGB multiply proof as *approximate*, not spectrally color-managed. |
| [07 · Drying Time](https://risograph.co.uk/07-drying-time) | Dense layers and stacked full-coverage inks can make handling and subsequent print passes difficult. | Estimate mean/max/localized combined coverage and warn conditionally. Do not hard-code arbitrary “safe” limits as facts. |
| [08 · Imperfections](https://risograph.co.uk/08-imperfections) | Misregistration, roller contact and paper feed influence printed detail and aesthetics. | Keep deliberate preview offsets separate from output-plate geometry; note feed-edge risks only when a machine profile justifies it. |
| [09 · Printable Area](https://risograph.co.uk/09-printable-area) | A printable sheet is not always edge-to-edge; trimming and feed allowances matter. | Configure sheet size, target image extent, trim, bleed and device-specific margin. Never conflate the A4 separation **report** with an A4 production stencil. |
| [10 · Riso Proof Tool](https://risograph.co.uk/10-riso-proof-tool) | Layers can be uploaded, tinted, shifted and proofed together without burying the artwork behind controls. | Consider direct import of **already separated** grayscale masters, per-layer naming/color, solo/mute, paper preview, registration in mm, and proof export. |

### Two additional references

The [Dizzy Ink Colours](https://risograph.co.uk/dizzy-ink-colours) page identifies the studio's inks with **screen-reference** RGB/HEX approximations and Pantone references where available. In Stipra, a named physical ink should not be treated as an exact reproducible RGB value. Use neutral named ink catalogs only with verified provenance and explicit print-machine/paper caveats; avoid copying the site's complete chart or third-party calibration data into our MIT package.

The [Dizzy Ink Recycling](https://risograph.co.uk/dizzy-ink-recycling) article discusses cartridge waste and reuse. If Stipra eventually estimates consumables or environmental impact, it must not treat low-energy stencil duplication as automatically zero-waste.

## Four particularly actionable observations

### 1. The user should be able to supply ready-made plates

Today's Stipra focus is **image → algorithmic separation → raster screening**. The printer-facing guide shows a second legitimate entry point: someone who has already built a grayscale pass in Illustrator, Photoshop or another tool should be able to attach an ink name and inspect/print it **without Stipra re-separating it**.

**Proposed contract, not implemented:** import 2–8 aligned grayscale masks, validate identical bounds, associate physical inks and order, preview overprint and produce the same package as the automatic workflow. Refuse silent resizing. Link: [#22 browser studio](https://github.com/yigit-denktas/stipra/issues/22), [#8 production plates](https://github.com/yigit-denktas/stipra/issues/8).

### 2. Styles should express *purpose* before numeric knobs

The [Profiles](https://risograph.co.uk/04-risograph-profiles) page compares actual spot-color combinations on similar imagery. The consequence for Stipra is an opinionated **same image, several meaningful ink strategies** comparison, not dozens of arbitrary combinations of sliders. Possible initial intents: portrait duotone, restrained editorial photo, bold poster, clean linework.

Each style should state whether it preserves a key plate, how it maps tone, its preferred ink arrangement, appropriate screening, unsuitable inputs, and why. Do not claim it “detects portraits” unless an actual recognition pipeline exists. Link: [#34 Stipra Styles](https://github.com/yigit-denktas/stipra/issues/34).

### 3. Preview registration must not damage actual masters

The [Imperfections](https://risograph.co.uk/08-imperfections) page describes small registration variations as part of real printing. Its typical ~1–2 mm shifts are descriptive **of this printer's experience**; they are not Stipra's default printing offset or a universal tolerance. The [Proof Tool](https://risograph.co.uk/10-riso-proof-tool) exposes registration in **millimeters** (approximately -2 to +2 mm in its controls), a user-comprehensible unit.

Stipra screening currently supports per-plate registration in **pixels** and can bake it into raster output. For faithful *press masters*, use nominally aligned artwork by default and make simulated offsets a **proof-only** choice. If a user intentionally bakes an offset into production, label that as a deliberate nonstandard transformation. Link: [#8 production plates](https://github.com/yigit-denktas/stipra/issues/8), [#31 studio design](https://github.com/yigit-denktas/stipra/issues/31).

### 4. A proof should teach, not just impress

The [Proof Tool](https://risograph.co.uk/10-riso-proof-tool) accepts up to five grayscale artwork layers and allows per-layer ink selection, registration adjustments, grain and proof download against an A3-sized preview. It's a distinct workflow from automatic separation; its ability to explain layers is the insight worth borrowing **at the concept level**.

For Stipra, a useful workspace could expose:
- one dominant **combined print proof**, with a switch to the source;
- a compact active-ink strip with visible colors and coverage;
- active plate solo/mute; optional registered vs intentionally shifted proof;
- a details panel for the chosen ink, not every slider for every ink at once;
- clear “Digital approximation” and target print-size status;
- final separate files + an A4 process sheet explaining how the preview was made.

This is **interaction research, not permission to copy** Dizzy Ink's page design, text, code or illustrations. Link: [#31 interface art direction](https://github.com/yigit-denktas/stipra/issues/31), [#9 separation sheets](https://github.com/yigit-denktas/stipra/issues/9).

## Machine- and studio-specific observations: treat as profiles, not constants

Dizzy Ink's [Printable Area](https://risograph.co.uk/09-printable-area) illustrates a **5 mm clear edge** around A3 material on its setup, and its [Imperfections](https://risograph.co.uk/08-imperfections) guide notes that relatively heavy ink within approximately **50 mm of the feed edge** can contribute to roller/feed problems. These examples should become a **printer profile's configurable safety region**, not a fixed rule for every printer and paper.

The [Drying Time](https://risograph.co.uk/07-drying-time) guidance similarly discourages building large regions from several fully saturated inks and suggests reconsidering opacity/knockouts. We can compute overlap statistics now, but cannot claim any per-pixel density or drying time is safe until a shop profile or physical trials substantiate the threshold.

Other limits of inference:
- RGB/HEX palette values are **preview approximations**, not measured physical output or transferable ICC values.
- Our geometric dot screen is not guaranteed to match an actual stencil's dots, ink spread or grain.
- A mock shifted proof is aesthetic information, not a recommendation to misalign printing plates.
- An A4 PDF inspection sheet and a production A4 master have **different page geometry and acceptance tests**.

## Research-to-work mapping

| Research takeaway | Relevant issues | Proposed next evidence |
| --- | --- | --- |
| Strong preset defaults with suitability rules | [#34 styles](https://github.com/yigit-denktas/stipra/issues/34), [#13 QA](https://github.com/yigit-denktas/stipra/issues/13) | Same rights-cleared image shown under four distinct strategies and at actual print size |
| Layers-first proof and grayscale-master import | [#22 browser](https://github.com/yigit-denktas/stipra/issues/22), [#31 UX](https://github.com/yigit-denktas/stipra/issues/31) | Owner-reviewed workflow sketches and complete keyboard interaction |
| Real dimensions/margins, proof-only registration | [#8 masters](https://github.com/yigit-denktas/stipra/issues/8), [#9 sheet](https://github.com/yigit-denktas/stipra/issues/9) | Raster and PDF crop/physical DPI tests under a named profile |
| Explainable ink density/overlap warnings | [#13 QA](https://github.com/yigit-denktas/stipra/issues/13), [#34 styles](https://github.com/yigit-denktas/stipra/issues/34) | Known synthetic overlapping coverage fixtures; thresholds calibrated by an actual press operator |

---

**Rights and provenance.** This is an original Stipra research synthesis written with links to the guide, not a translated/reprinted guide, copyrighted illustration set, hosted asset snapshot, downloaded Photoshop profile or code port. For the actual instructional diagrams and the site's design, visit [the original Dizzy Ink resource](https://risograph.co.uk/). Stipra has no affiliation or endorsement from Dizzy Ink. See [project licensing policy](../LICENSING.md).
