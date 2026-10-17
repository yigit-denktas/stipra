# Source color and working pixels

Policy `stipra-srgb-v1` addresses source RGB color handling, not measured ink or paper calibration. Photographs and scans use the same import contract as raster artwork. Direct sketch buffers will need to declare this contract explicitly in the planned library.

The importer preserves original file bytes separately, neutralizes a decoder copy's EXIF orientation, lets the native decoder interpret the image/profile, draws into an explicitly requested sRGB canvas, and requests 8-bit sRGB RGBA readback. Orientation is applied once. Alpha is preserved where present; fully transparent hidden RGB values are not an identity guarantee after native canvas premultiplication. Native pixel dimensions and the complete frame remain unchanged.

The manifest records source profile presence, `pixels.colorSpace`, decoder identity and `colorManagement` policy. JPEG ICC segments are reassembled in sequence and their header/tag bounds checked before decode; description, byte length, RGB space and connection space are recorded. PNG/WebP currently record profile presence and delegate profile interpretation to the decoder. This is not a comprehensive validator for every ICC profile or a promise that every native decoder has identical behavior. Unsupported or malformed profile handling beyond the tested cases remains a compatibility limit.

Node uses the locked `skia-canvas` dependency. Browsers use their native image decoder and Canvas implementation. Untagged sources follow decoder defaults with sRGB working output. We do not assign the beach profile to unrelated inputs. Encoded source files, normalized pixels and press simulation are separate stages; a source ICC profile is not a printer/spot-ink profile.

## Verification

`tests/fixtures/color-reference.json` contains original synthetic six-patch artwork as small base64 files, not owner images. The tagged RGB samples use sRGB primaries/D65 with a linear transfer curve. A decoder that ignores that profile produces values over 50 levels away from the reference in the first gray patch. PNG and JPEG are compared with independently converted Pillow ImageCms/LittleCMS sRGB references at patch centers, with a declared two-level tolerance for decoder/version rounding. Both tagged-versus-untagged distinction and reference agreement are tested.

Run:

```sh
node --test tests/color-management.test.js tests/import.test.js tests/export-plan.test.js
python scripts/verify-color-reference.py
npm run build:pages
STIPRA_SMOKE_PAGE=web/stipra/browser-smoke.html STIPRA_SMOKE_EXPECT=BROWSER_SEPARATION_PASS node scripts/browser-smoke.js
```

Python requirements are pinned in `scripts/type-comparison-requirements.txt`. Browser smoke requires a real Chrome/Chromium executable (or `CHROME_BIN`); it imports the synthetic profiled files through the actual studio and compares its source canvas with the reference. Node tests also check original-byte retention, exported profile/policy metadata, normalized-pixel retention and the embedded font notice. Existing package tests check plate masks, density, geometry, registration isolation and file hashes.

### Owner beach C observation, 17 October 2026

The private source matches SHA-256 `f8a9b2f7eaaa18d62f4908456f8e8a47c84e0edb5c0172e57dabfd166dd3f273` in the owner fixture manifest. Its 456-byte embedded profile describes **sRGB**, RGB input and XYZ connection space. At 1152 × 2048 pixels, Node v24.19.0 / skia-canvas 3.0.8 normalized RGB matched Pillow 12.3.0 / LittleCMS 2.19 conversion over the entire image: maximum absolute 8-bit channel difference **0**, mean **0**, 2,359,296 pixels. No source or derived image is included in this public record.

That observation is one verified environment and source, not universal decoder equivalence. CI verifies the public non-sRGB fixtures independently. Physical ink response, paper, dot gain, gamut and printer calibration remain outside this source-color check.

Primary references: [Skia Canvas image API](https://skia-canvas.org/api/image), [context readback](https://skia-canvas.org/api/context), [Pillow ImageCms](https://pillow.readthedocs.io/en/stable/reference/ImageCms.html). The installed version and committed regression evidence take precedence over claims inferred from newer documentation.
