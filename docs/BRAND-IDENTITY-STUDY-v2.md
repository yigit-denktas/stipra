# stiprā / controlled identity study v2

**status: design comparison only.** The owner rejected the unbalanced standalone S and asked for a coherent relationship between **wordmark**, the [original five-row dotmark](../logo_for_Readme.svg), and printmaking. Nothing here is an approved logo, and no existing README asset was replaced. No image-generation tools or photographs were used.

[**compare three genuine lowercase wordmarks**](https://apps.yigitdenktas.com/stipra/identity/) · [source generator](../scripts/build-identity-study.js)

## candidates and hypotheses

| Candidate | Weight | What to learn |
| --- | --- | --- |
| **ibm plex sans bold** | authentic official IBM Plex bold | The legible, compact baseline. Does it become distinct only through branding around it? |
| **paper mono regular** | authentic Paper Mono Regular, v1.000 | More breathing room and character; does it survive 24–48px and uncoated print? |
| **paper mono semibold** | authentic Paper Mono SemiBold, v1.000 | Actual middle weight, not an artificially emboldened Regular or reduced ExtraBold. Does it resolve the 'airy vs congested' disagreement? |

The real [Paper Mono release](https://github.com/paper-design/paper-mono/releases/tag/v1.000) includes **eight static weights plus a weight-variable family**, so forcing a binary Regular/ExtraBold choice was not justified. The first study used IBM Plex Sans Bold vs Paper Mono ExtraBold as initial PDF finalists; this is a **new brand experiment**, not a retroactive claim that the earlier two-page PDFs used the SemiBold face.

## controlled comparisons

Each candidate uses the real lowercase `stiprā` including U+0101, with the actual font's shaped glyph sequence and advance positions via fontkit. It is scaled to the **same x-height and baseline**, and displayed with its natural advance width; **perceived darkness is not artificially normalized** because that would erase the real difference among weights.

The comparison produces:

1. **monochrome:** one-color outlined wordmark; verify recognition, natural internal rhythm and the macron at 24/48/96px.
2. **macron-only two-ink:** all letter bodies in original Stiprā green (`#006043`), with only the disconnected upper macron region from the *real ā glyph* overprinted in original coral (`#FF665D`). This avoids the prior coral **whole-letter** effect that split `stipr` and `ā`.
3. **wordmark + original dotmark:** use the original owner-authored five-row symbol **unchanged** as a graphic companion. The genuine dotmark's four colors and each existing circle opacity remain intact. This is **not** another invented S mark.

Blue `#0D4DAD` and golden yellow `#E2A523` are preserved through the original dotmark but not forced into the wordmark. Neutral dark/paper are nonbrand supporting colors. Ink visibility at the tiny 24px scale is a serious risk and demands *actual raster and print* checks.

The macron-only colored version uses a font-metric clipping boundary. **It is a test, not a claim that the macron shape has been professionally redrawn.** Check that clipping does not cut the top of the letter body or any mark in all three faces. Do not adopt based on automated presence of a clipPath alone.

## full system and testing

Build using pinned official source fonts (SIL OFL 1.1), do not distribute the font files:

```bash
npm install
npm run build:identity
```

Generated artefacts live in ignored `dist/stipra/identity/`: a comparison page, six actual vector outline wordmarks, and an unmodified original dotmark. Cloudflare Pages publishes the comparison as an optional review page. The repository keeps source and tests only; no redundant generated PNG or SVG outputs are committed.

For an owner design review, evaluate **three** dimensions independently:
- **recognition at a distance:** word readability, counter openness, macron legibility, S-to-`ā` rhythm, optical balance;
- **print-specific identity:** whether the original dot row makes sense beneath the word and whether a restrained second-ink macron survives misregistration;
- **system utility:** can a clean wordmark work in a header, while the five-row dotmark acts as a separator/motif on printable A4 reports without fighting the plates?

Then compare *real* user images A sculpture, B forest, C beach in the already prepared [three owner-photo PDFs](../docs/PRINT-PACKAGE-ACCEPTANCE.md). Those documents are private; this identity study does **not** regenerate them or claim visual acceptance.

## acceptance boundary

No identity candidate is selected, no main logo is replaced and no font is declared 'best' on test success alone. The next design decision should follow a **side-by-side 24/48/96px inspection and a physical small-print test**. Fine-kerning/optical-spacing adjustments after that should be deliberate and stored as a reproducible revision, not a silent manual change.

Related [#57](https://github.com/yigit-denktas/stipra/issues/57), [#46](https://github.com/yigit-denktas/stipra/issues/46), [#31](https://github.com/yigit-denktas/stipra/issues/31), and [#54](https://github.com/yigit-denktas/stipra/issues/54).
