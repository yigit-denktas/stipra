# Dizzy Ink's Risograph guide · visual field notes

**Reference:** [Dizzy Ink — Guide to Risograph](https://www.dizzyink.co.uk/guide-to-risograph) (view the original page and its imagery there). **Researched:** 17 October 2026. The photographic/artwork examples, diagrams and ink color fan **belong to their respective creators**. We link to originals; we do not download, embed, redraw, rehost, or claim them as MIT assets.

This page supplements the earlier [interactive Risograph Print Guide notes](DIZZY-INK.md). The [Dizzy Ink studio guide](https://www.dizzyink.co.uk/guide-to-risograph) is a *different page* from the [interactive guide at risograph.co.uk](https://risograph.co.uk/), even though both come from Dizzy Ink.

## Four images worth studying

### 1. One image is built from separately prepared physical passes

[See Dizzy Ink's “How it Works” diagram on the original site](https://www.dizzyink.co.uk/guide-to-risograph) · [Open original image](https://images.squarespace-cdn.com/content/v1/5762d556bebafb3df5760be5/1539351672108-IEC577484T65UCRV6PAO/How-Riso-Works1.jpg)

What we see: the left column presents three separate files: a solid triangular shape, a tonal circle, and a screened square. The right is a **single overlapping print** with three assigned inks. Geometry, tone and dots coexist without pretending they were one original RGB effect.

**Stipra lesson:** the hero proof should make individual physical passes understandable at a glance. Plate thumbnails must have real independent content and consistent alignment. A user should be able to select an ink and immediately see **what that ink contributes**, not only adjust its color. A4 separation sheets should reproduce this source→layers→print relationship with the user's own licensed input and our own graphics—not this diagram.

### 2. Color theory becomes physical when inks overlap

[See “Ink Mixing” on the original guide](https://www.dizzyink.co.uk/guide-to-risograph) · [Open original image](https://images.squarespace-cdn.com/content/v1/5762d556bebafb3df5760be5/1540310584306-YVT45Z8BJGXESJTFFJ22/Mixing-Inks.jpg)

What we see: large transparent overlapping colored circles reveal unexpected greens, browns and darker combinations. Beside them, small two-color swatches show that the *same ink* changes appearance depending on what sits below it.

**Stipra lesson:** palette UI ought to present not just solitary ink swatches, but **predicted overlap swatches on the chosen paper**. Show how ink order/density/paper may alter the perceived result, but label RGB preview models as approximations. The ability to tune masks separately matters more than a huge palette picker.

### 3. Full-color reproduction can come from unconventional spot combinations

[See “Full Colour Printing” on the original guide](https://www.dizzyink.co.uk/guide-to-risograph) · [Open original image](https://images.squarespace-cdn.com/content/v1/5762d556bebafb3df5760be5/1539342404029-XR3WW8IPG5AWBWYFC88D/Full-Colour-CMYK.jpg)

What we see: **four separate monochrome-toned passes** on the left, labeled Blue, Pink, Yellow and Black, combine into a vivid multicolored photograph on the right. Some regions survive through a strong key; others gain their character from overlaps. The resulting image has print texture without making the original subject unrecognizable.

**Stipra lesson:** the effective print palette needn't imitate standard process cyan/magenta/yellow/black in preview. A preset needs an explicit **ink mapping plus a tonal strategy**. The UI should compare the actual independent channels against the proof. Don't automatically assign an “authentic Riso” label to our digital CMYK implementation or promise that any four-color approximation matches this sample physically.

### 4. An ink swatch is also a density experiment

[See “Our Colour Range” on the original guide](https://www.dizzyink.co.uk/guide-to-risograph) · [Open original image](https://images.squarespace-cdn.com/content/v1/5762d556bebafb3df5760be5/54c4c67f-c25f-425b-8b7a-028e51bcd6cc/DizzyInk-RisoSwatch.jpg)

What we see: a large fan of named colors radiating into progressively lighter density steps. Some inks are metallic or fluorescent, which a normal RGB display cannot faithfully reproduce.

**Stipra lesson:** **ink color and ink coverage are two different controls**. An explanatory palette picker could show varying coverage of a given spot ink instead of only a HEX square. Each palette needs a source/provenance and a “screen approximation” label; don't copy Dizzy Ink's original wheel, its printed swatch color measurements or labels as a bundled palette.

## How we apply the lessons (without copying the images)

| Image insight | Stipra design decision | Where tracked |
| --- | --- | --- |
| Separate pass files assemble a composition | One primary proof with direct ink-layer selection; unchanged source geometry | [DESIGN](../../DESIGN.md) · [#31](https://github.com/yigit-denktas/stipra/issues/31) · [#22](https://github.com/yigit-denktas/stipra/issues/22) |
| Ink overlap creates new colors | Inspect overlaps and individual physical masks independently | [Print rule R05](../PRINT-DESIGN-RULES.md) |
| Four-color spot reproduction differs from RGB | Input-appropriate, explained style recipes with adjustable mapping | [#34](https://github.com/yigit-denktas/stipra/issues/34) |
| Density gradients make color choices tangible | Inline printable coverage controls and clear paper/press caveats | [#8](https://github.com/yigit-denktas/stipra/issues/8) · [#13](https://github.com/yigit-denktas/stipra/issues/13) |

**A question for the next owner review:** should selecting an ink swap the central canvas to that grayscale plate (one-canvas interaction), or keep a split source/print comparison with an active plate strip? The research supports a *layer-focused workspace* but doesn't decide the layout for us.

**Rights:** These notes are an independent description and critique of reference images. No image assets, code, CSS, text blocks or reproductions from the guide are redistributed; website and original image URLs remain with the source.
