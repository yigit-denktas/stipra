# Published separation approaches used in Styles

These are independently authored Stiprā recipes based on published printmaking methods. We have not measured their popularity. The source pages establish that these combinations and approaches are in use; they do not endorse our settings. No external source code, artwork, ICC profiles or downloadable commercial recipes are bundled.

| Stiprā variant | Published approach | What Stiprā implements |
| --- | --- | --- |
| Portrait Duotone / `blue-pink` | [Dizzy Ink: profiles](https://risograph.co.uk/04-risograph-profiles), [Exploriso: channel separation](https://en.exploriso.info/exploriso/colour/separations/ad-hoc-separation-of-colour-channels/) | Complementary red/green channel densities assigned blue/pink, with different gray removal and tone curves. Not the source studio's profile. |
| Portrait Duotone / `teal-orange` | Dizzy Ink's teal/orange pairing; Exploriso's channel approach | Red/blue complementary densities, independent gray removal. The fluorescent-orange swatch is pinkish on screen; compare it rather than assuming a conventional orange. |
| Bold Spot Poster / `process-cmy` | Exploriso's three-channel separation | Full complementary RGB densities, blue/pink/yellow, no black pass. Gray and dark areas require substantial overlap. |
| Bold Spot Poster / `process-cmyk` | [Ambipress: CMYK simulation](https://www.ambi-press.com/guia/), [Exploriso: GCR](https://en.exploriso.info/exploriso/colour/separations/convert-via-custom-cmyk-and-gcr/) | Full removal of the common gray component from color densities, plus a separate black key. Simple arithmetic, not Photoshop Custom CMYK or an ICC transform. |
| Editorial Halftone / `forest-depth` | GCR principle applied to a two-ink study | Photographic tone key without highlight/shadow clipping, plus yellow chroma with full gray removal. The curve and palette are our choices. |
| Editorial Halftone / `coast-duotone` | Published duotone/channel and gray-removal approaches | Broad blue atmosphere from complementary red, restrained coral from blue-channel density with partial gray removal. Our palette and curves, not an external profile. |

References consulted 17 October 2026. [Ambipress's published screen swatches](https://www.ambi-press.com/guia/) supply blue `#0078BF`, fluorescent pink `#FF48B0`, yellow `#FFE800`, light teal `#009DA5`, fluorescent orange `#FF7477` and black `#000000`. These are preview approximations, not measured spectral data. The green/coral/blue/golden-yellow Stiprā identity palette and original logo remain unchanged; an artwork's chosen inks are separate from the brand palette.

All new recipes are opt-in version-1 variants. The four family defaults and the earlier editorial variants retain their separation and screen settings. Target frequency is expressed in LPI and resolved at the declared output DPI. Screen angles are Stiprā starting settings, not press guarantees. Use `--style-screening unscreened` when a printer wants continuous-tone separations for its own RIP; confirm their requirements before applying a second screen.

## Why the new channels exist

The old `darkness` source is one minus linear-light relative luminance. It remains useful and unchanged, but places encoded mid-gray quite heavily on a plate. `tone` instead uses one minus the weighted encoded RGB signal. It is an explicit photographic curve input, not a physical luminance measurement.

For complementary channel density `D = 1 - channel` and common gray `K = 1 - max(R,G,B)`, the new sources compute `max(0, D - grayRemoval * K)`. They do not divide by the remaining channel maximum as normalized CMYK does. Gray removal 0 retains all channel density; 1 leaves only the chromatic residual. It removes gray across the tonal range, not just dark areas. The usual threshold/gamma/gain transfer and source alpha follow. This is an artistic coverage model; it is not a measured ink model.

The new forest key caps coverage below full ink through gain rather than a clipped black hold. This preserves distinctions in dark texture. The coast recipe gives pale blue atmosphere a real plate contribution while reserving most neutral shadow structure for blue. Neither recipe detects foliage, sky, bark or people.

The suitability measurements use alpha-weighted encoded tone, source tonal range and near-neutral area. Their thresholds are disclosed in JSON. The resulting advice tells a reader what to inspect; it never certifies a style or infers image semantics. Coverage and overlap remain separate diagnostics. Digital inspection and physical print acceptance are distinct gates.

## Stiprā tonal-detail follow-up, 19 October 2026

`forest-balanced` and `coast-tonal` are independently authored refinements of the existing photographic-tone strategy. No additional external algorithm, profile or library is introduced. The forest key uses `tone`, gain 1, gamma 1.3; the coast key uses `tone`, gain 1, gamma 0.9. Their yellow/coral passes and screen recipes remain identical to `forest-contrast` / `coast-duotone`. Existing source references describe channel and gray-removal principles, not these settings or an endorsement. See [the controlled evidence and tradeoffs](../TONAL-DETAIL-REVIEW.md).
