# Stipra · licensing, independent implementation and asset provenance

**Policy, 16 October 2026.** Stipra-authored core, browser UI, Node CLI, algorithms, schemas and examples are released under **MIT**, subject to individual component/asset exceptions. **MIT on our repository does not relicense dependencies, third-party source, media, logos or fonts.** See [issue #14](https://github.com/yigit-denktas/stipra/issues/14) for the unresolved release audit.

## Existing project assets and libraries

- Stipra-original source: **MIT**, [repository LICENSE](../LICENSE).
- Prehnite v8 case study: inherited MIT-authored source; keep provenance separate.
- Inter / Inter Display-derived vector glyph outlines: **SIL Open Font License 1.1**, [notice](../LICENSES/OFL-1.1.txt); no font binaries bundled.
- `logo_for_Readme.svg`: owner-supplied identity artwork. Do **not** presume trademark/branding permissions or external artwork rights are conferred by a code license.
- **p5.js itself is LGPL-2.1** ([official repository](https://github.com/processing/p5.js)); it is not MIT, and embedding/distributing it requires checking LGPL obligations (notices, relinking/modification rights and bundled distribution choices). Optional p5.js compatibility does not change the license of independently authored Stipra code.
- Current `skia-canvas` / `@xmldom/xmldom` and transitive libraries: maintain actual version/asset notices and full license report before tagged release.
- The new PDF inspection typography uses **IBM Plex Sans and IBM Plex Mono**, licensed **SIL OFL 1.1** (IBM Corp; license is kept in the upstream npm packages); no font binaries are committed or handed out separately. Conversion of WOFF into embedded TTF data uses **fonteditor-core** (MIT). QR generation uses **qrcode** (MIT), and pdf-lib custom-font support uses **@pdf-lib/fontkit** (MIT).
- **Paper Mono v1.000** (Paper Design, Regular/SemiBold/ExtraBold as applicable) and **IBM Plex** (IBM) are SIL OFL 1.1; its Regular and ExtraBold TTF are acquired **at build time** from the project's official tag, checked against pinned Git blob SHA-1 fingerprints and retained only in an ignored cache. They are embedded in optional generated PDF specimens; SVG wordmarks contain converted glyph outlines, not distributed font binaries. [Upstream and OFL](https://github.com/paper-design/paper-mono/tree/v1.000).
- Print-package PDF uses [`pdf-lib`](https://github.com/Hopding/pdf-lib) **MIT**; ZIP uses [`JSZip`](https://github.com/Stuk/jszip) under its **MIT alternative** to the dual MIT/GPL-3 license. The application code remains MIT; dependency notices and any transitive licenses still require a tagged release audit. Some dependencies have native code or platform-specific distributions.
- User-submitted visual references, photographs, prints and screenshots: use for private comparison; do not redistribute without rights. SVG format alone does not establish reuse permission.
- [Jeffrey Warren's risoAtHome](https://github.com/jywarren/risoAtHome): consulted for general CMYK/registration concepts, **no source copied**.
- [p5.riso@home](https://github.com/adrawerofthings/p5.risoAtHome): mixed code/assets and licenses; audit each component separately before considering reuse.

## p5.riso is not the MIT implementation source

[p5.riso by Sam Lavigne and Tega Brain](https://github.com/antiboredom/p5.riso) uses an **Anti-Capitalist License** with organization/use conditions, not MIT or unrestricted OSI-approved open source. A fork, vendored script or AI-generated near-verbatim rewrite of protected code does **not** become MIT simply because we changed names or used automated reverse engineering. There is no commercial-use blanket authorization just because its source is publicly readable or its authors are US-based.

**Allowed engineering plan (with jurisdiction-specific review where needed):**
1. Implement standard concepts ourselves: subtractive color channel math, ink coverage maps, monochrome plates, halftone screen geometry, ordered/error-diffusion dithering, overprint approximation, print registration, raster/export handling.
2. Base designs on **documented underlying algorithms, independent math/specifications, our product requirements, and separately licensed compatible material**. Where observing a lawfully accessible tool's *behavior* helps, document inputs/outputs in an original test specification; do not paste reference source into an AI prompt asking it to translate or rewrite it.
3. Keep an independent implementation/provenance record per algorithm: references, design notes, authored source, fixtures and tests. Audit significant similarities and all dependency licenses before publishing. Attribution is appropriate, but **attribution alone does not grant copying permission**.
4. Use genuinely license-compatible libraries and native Canvas/SVG where helpful. p5.js is LGPL-2.1, **not permissive MIT**; a p5.js adapter needs the relevant notices/distribution compliance review, but need not be part of Stipra's MIT-authored core. No p5.riso dependency in the MIT package.
5. If we later want the actual p5.riso source or behavior reproduced beyond protected boundaries, seek separate permission or professional advice. Don't use a decompiler/AI rewriting system as an automatic license-laundering tool.

## Legal evidence and limits (not a legal opinion)

- [EU Directive 2009/24/EC, Article 1(2)](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng): software copyright protects the **expression** of computer programs; ideas and principles, including those underlying interfaces, are not protected by software copyright.
- [EU Directive 2009/24/EC, Article 5(3) and 6](https://eur-lex.europa.eu/legal-content/en/ALL/?uri=CELEX%3A32009L0024): observation/study/testing by lawful users and decompilation *for interoperability* are addressed under different conditions. Article 6 is **not** permission to copy implementation or decompile anything for an MIT clone.
- [CJEU case C-406/10, SAS Institute v World Programming](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A62010CJ0406): reimplementing functionality without copying protected expression is different from reproducing code, though copyrighted documentation/other works remain protected.
- [US 17 USC §1201(f)](https://www.copyright.gov/title17/92chap12.html): narrow exceptions around anti-circumvention **for interoperability** with additional conditions; not a general right to defeat access protection or clone source.
- Other copyright, license, patent and trademark questions can arise; applicable law and facts matter. Before **commercial distribution** or promising unrestricted use, have German/EU-aware counsel assess the actual implementation and sources.

**Release gate:** no p5.riso code (direct, forked, machine-rewritten, or indirectly copied) in the MIT build. Record dependency license audit, notices, fonts, artwork rights, names and reference fixture provenance under #14. No claim of legal clearance solely from unit tests.
