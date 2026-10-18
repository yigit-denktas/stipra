# @yigit-denktas/stipra-inputs — local experimental alpha

Optional dependency-free adapters; not published. Run `npm run build:inputs`, then pack this directory. This package does not import the core, PDF/ZIP writer, fonts, image codecs or a drawing runtime. The `/canvas` subpath additionally needs `@yigit-denktas/stipra-canvas` (and its core peer).

```js
import {mapRegions, regionProject} from '@yigit-denktas/stipra-inputs';
import {renderLayers} from '@yigit-denktas/stipra-core';
const mapped = mapRegions(source, {
  version: 1, paper: '#ffffff',
  inks: [{id: 'green', name: 'Green', color: '#006043', combine: 'max',
    regions: [{id: 'foreground'}, {id: 'foliage', strength: 0.6}]}]
});
const result = renderLayers(mapped.input, {dpi: 300, seed: 42});
const optionalProject = regionProject(source, mapped.recipe);
```

A source has `width`, `height` and named `regions`: `{id, name, role:'coverage', coverage:Uint8Array, provenance:{kind:'authored'}}`. Provenance kind must be `authored`, `captured`, `renderer-provided` or `estimated`; it is a declaration, not authenticated evidence. Optional producer name/version and bounded JSON parameters record the method.

Regions are continuous 0..255 coverage on the same frame. Up to 64 regions / 64 MiB map to 1..8 inks. Each ink explicitly chooses `max` or ordered alpha `over`; strengths are 0..1. The mapper never screens. Call `renderLayers` once for screening. IDs, depth and RGB labels must be converted explicitly. `/canvas` exposes `captureRegions({regions:[{id,name,source,polarity,provenance}]})`, checking backing and logical frames; polarity is `alpha`, `dark-on-light` or `light-on-dark`.

`depthCoverage` requires orientation-normalized float depth (m) or disparity (1/m), integer data/display windows, invalid sentinels, provenance and an explicit positive near/far ramp. `labelCoverage` selects exact uint32 IDs without interpolation. Neither function decodes a native file or reconstructs occluded geometry. Fractional renderer mattes should be passed as coverage, not quantized to IDs.

`regionProject` and `replayRegions` preserve raw mask bytes plus the normalized mapping. Source projects have a smaller attachment budget: 32 artifacts, 16 MiB each, 32 MiB total; the mapping plus one artifact per region means at most 31 regions per project. Source files are inert and selected explicitly. No source project is attached by default; never include secrets/private work in a publicly redistributed package. SHA-256 identifies bytes, not authorship. See `docs/STRUCTURED-INPUTS.md` in the repository for export/replay and adapter boundaries.
