# Printmaking knowledge · Stipra reading room

Stipra is a graphics tool, but it needs to understand the practical decisions that turn graphics into prints. This reading room keeps **linked, attributed references** alongside **our own design and engineering notes**, so a future contributor or coding agent can tell a printer's advice from an implemented Stipra feature.

## Start here

**[Dizzy Ink's Risograph Print Guide](https://risograph.co.uk/)** — an unusually clear, interactive guide to physical color separation, ink density, overprinting, registration, paper margins and proofing. Curated and designed by [Dizzy Ink](https://www.dizzyink.co.uk/).

- [Field notes on the Dizzy Ink guide](DIZZY-INK.md): chapter-by-chapter reading map and what Stipra should learn, with links back to the source.
- [Stipra printmaking design rules](../PRINT-DESIGN-RULES.md): proposed rules, UI behaviors, CLI contracts, diagnostics and release tests derived from printmaking needs. These are **our proposals**, not quotations or claims of physical validation.
- [v0.9 roadmap](../../ROADMAP.md): which features exist and which remain open.
- [Styles discussion, #34](https://github.com/yigit-denktas/stipra/issues/34): where intent-based starting points should live.
- [Interface discussion, #31](https://github.com/yigit-denktas/stipra/issues/31): art direction still requires owner review.

## Find a reference by the question you're asking

| Question | Original reading | Stipra implementation concern |
| --- | --- | --- |
| Why not just recolor a photograph? | [Your Files](https://risograph.co.uk/03-your-files), [Profiles](https://risograph.co.uk/04-risograph-profiles) | Independent 0–100% ink masks; editable palettes and channel selection |
| How should ink strength appear? | [Density](https://risograph.co.uk/05-density) | Grayscale mask conventions, tonal range, transfer curves |
| Why do overlapping colors change? | [Ink Overlay](https://risograph.co.uk/06-ink-overlays) | Proof compositing separate from real press calibration |
| Why shouldn't every style have heavy coverage? | [Drying Time](https://risograph.co.uk/07-drying-time) | Coverage and overlap diagnostics; conditional rather than absolute advice |
| When are registration imperfections desirable? | [Imperfections](https://risograph.co.uk/08-imperfections) | Optional simulated misregistration vs accurately aligned production masters |
| How large can I print? | [Printable Area](https://risograph.co.uk/09-printable-area) | Real sheet size, device-specific safe areas, pixels-to-mm conversion |
| What should a layer-oriented browser tool feel like? | [Riso Proof Tool](https://risograph.co.uk/10-riso-proof-tool) | Layer selection, active ink, proof, registration, export |
| What are the available ink names and approximate colors? | [Dizzy Ink Colours](https://risograph.co.uk/dizzy-ink-colours) | Label screen-only palette references; machine/substrate differences |

The guide's [introduction](https://risograph.co.uk/02-introduction) and [history](https://risograph.co.uk/01-quick-history) explain why a stencil-per-ink process belongs to community printmaking, zines and independent publishing—not merely a decorative photo-filter aesthetic. Its [recycling discussion](https://risograph.co.uk/dizzy-ink-recycling) is a reminder not to claim that a process has zero environmental cost.

## Reference-handling policy

1. **Visit the original pages for their diagrams, artwork and interactive examples.** Stipra's notes are an independent synthesis, not a mirror, archived copy, scrape, generated clone or redistribution of that material.
2. Attribute observations to **Dizzy Ink**. The guide's print margins, roller/feed advice, and proof UI are examples of a printer's practice, not guaranteed requirements for every Risograph model.
3. No photos, screenshots, full chapter text, downloadable Photoshop profiles, site JS/CSS, third-party artwork or color chart reproductions are included. These are **not MIT assets** just because they are publicly accessible.
4. For a rule that may become code, record: source URL; whether it is print practice, design judgment or measured/calibrated fact; required input; warning behavior; acceptance evidence.
5. Review external content again before implementing machine-specific defaults. Last manually reviewed **17 October 2026**; page content and ownership may change.

*All code and text authored specifically for Stipra remain subject to the repository's documented license/provenance policy. No endorsement or affiliation with Dizzy Ink is claimed.*
