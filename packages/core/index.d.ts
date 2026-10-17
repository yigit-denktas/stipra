/** The working RGB space; source-file decoding belongs to the host. */
export type RGBSpace = 'srgb';
/** The shared full-frame pixel dimensions. */
export interface Frame { width: number; height: number }
/** Straight-alpha 8-bit sRGB input; buffers are borrowed read-only during rendering. */
export interface ImageInput extends Frame { colorSpace: RGBSpace; rgba: Uint8Array | Uint8ClampedArray }
/** Nominal ink identity and display color. */
export interface InkIdentity { id: string; name: string; color: string }
/** Authored coverage: zero means no ink, 255 means full ink; alpha is already incorporated. */
export interface AuthoredInk extends InkIdentity { coverage: Uint8Array }
/** One to eight authored passes sharing dimensions, origin and paper. */
export interface LayersInput extends Frame { paper: string; inks: AuthoredInk[] }
/** Image-to-ink channel mapping supported by the shared engine. */
export type SourceChannel = 'red' | 'green' | 'blue' | 'luminance' | 'darkness' | 'match' | 'cyan' | 'magenta' | 'yellow' | 'black' | 'tone' | 'cyan-density' | 'magenta-density' | 'yellow-density';
/** An explicit image-separation pass. */
export interface InkSpec extends InkIdentity {
  source: SourceChannel; target?: string; tolerance?: number; threshold?: number;
  gain?: number; gamma?: number; invert?: boolean; grayRemoval?: number;
}
/** The shared version-one image separation recipe. */
export interface InkRecipe {
  version: 1; mode: 'spot' | 'cmyk'; paper?: string; inks: InkSpec[];
  blackHold?: { inkId: string; threshold: number };
}
/** The authored ink mapping; source mask bytes are retained separately by the host. */
export interface AuthoredRecipe { version: 1; mode: 'authored'; paper: string; inks: InkIdentity[] }
/** Proof-only ink displacement in source pixels and degrees. */
export interface Registration { x?: number; y?: number; rotate?: number }
/** The deterministic raster treatment; physical frequency is DPI divided by pitch. */
export interface ScreenSettings {
  mode?: 'solid' | 'dots' | 'reverse' | 'lines' | 'hybrid' | 'paper';
  pitch?: number; angle?: number; dotScale?: number; jitter?: number;
  solidThreshold?: number; registration?: Registration;
}
/** Explicit per-ink screen settings and an unsigned 32-bit seed. */
export interface ScreenRecipe { version: 1; seed?: number; default?: ScreenSettings; plates?: Record<string, ScreenSettings> }
/** Fully resolved settings, with every production registration coordinate zero. */
export type NormalizedScreen = Required<Omit<ScreenSettings, 'registration'>> & { registration: Required<Registration> };
/** The complete settings used for this render. */
export interface NormalizedScreenRecipe { version: 1; seed: number; default: NormalizedScreen; plates: Record<string, NormalizedScreen> }
/** Nominal diagnostic thresholds, not physical press safety limits. */
export interface DiagnosticSettings { activeThreshold?: number; littleUsedMean?: number; denseMean?: number; overlapFraction?: number }
/** Physical settings shared by both input paths. */
export interface RenderSettings { dpi?: number; seed?: number; diagnostics?: DiagnosticSettings }
/** User-controlled adjustments to a versioned style. */
export interface StyleSettings {
  variant?: string; paper?: string; strength?: number; colors?: Record<string, string>;
  lpi?: number; screening?: 'authored' | 'unscreened';
}
/** Exactly one style or explicit image recipe is accepted. */
export type ImageOptions = RenderSettings & (
  { style: StyleSettings & { id: string }; inkRecipe?: never; screenRecipe?: never } |
  { style?: never; inkRecipe: InkRecipe; screenRecipe?: ScreenRecipe }
);
/** Authored masks bypass image-to-ink mapping. */
export interface LayerOptions extends RenderSettings { screenRecipe?: ScreenRecipe }
/** One available style family and its variants. */
export interface StyleSummary {
  id: string; name: string; version: number; intent: string; description: string;
  goodFor: string[]; avoid: string[]; lpi: number;
  variants: { id: string; name: string; version: number }[]; inks: InkIdentity[];
}
/** An attributed, explicit shared style resolution. */
export interface StyleResolution {
  contract: 'stipra-style-resolution-v1';
  style: { id: string; name: string; version: number; variant: string; variantVersion: number | null;
    intent: string; description: string; goodFor: string[]; avoid: string[];
    references: { id: string; title: string; url: string }[]; calibration: string };
  dpi: number; seed: number; screening: 'authored' | 'unscreened'; targetLpi: number;
  effectiveLpi: number | null; strength: number; inkRecipe: InkRecipe; screenRecipe: ScreenRecipe;
  physicalScreens: { id: string; mode: string; targetLpi: number | null; effectiveLpi: number | null; pitchPx: number | null }[];
  warnings: string[];
}
/** Owned production arrays, independent of the input and proof pixels. */
export interface Plate extends InkIdentity { coverage: Uint8Array; screened: Uint8Array; screen: NormalizedScreen }
/** Nominal per-plate, overlap and physical-frequency measurements. */
export interface PlateDiagnostics extends Frame {
  contract: 'stipra-plate-diagnostics-v1'; dpi: number; measurement: string;
  thresholds: Record<string, number>;
  overall: { inkedFraction: number; meanAdditiveCoverage: number; overlapTwoPlusFraction: number; overlapThreePlusFraction: number; heavyCombinedFraction: number };
  plates: { id: string; name: string; meanCoverage: number; occupiedFraction: number; veryDenseFraction: number;
    meanWhereOccupied: number; additiveInkShare: number;
    screen: { mode: string; pitchPx: number; angleDeg: number; effectiveLpi: number | null } | null }[];
  pairs: { inks: string[]; overlapFraction: number }[];
  warnings: { code: string; inkIds: string[]; message: string }[];
  suitability?: { measurement: string; visiblePixelWeight: number; shadowFraction: number;
    highlightFraction: number; nearNeutralFraction: number; tonalRange: number;
    thresholds: Record<string, number>; guidance: string[] };
}
/** Reproducible normalized settings; authored mask bytes are not embedded in JSON. */
export interface NormalizedRecipe {
  version: 1; kind: 'image' | 'layers'; dpi: number; inks: InkRecipe | AuthoredRecipe;
  screens: NormalizedScreenRecipe; proofScreens: NormalizedScreenRecipe; style: StyleResolution | null;
}
/** The shared frame at physical print size, with zero production registration. */
export interface Geometry {
  dpi: number; sourcePixels: Frame; origin: { x: number; y: number };
  trimPixels: Frame & { x: number; y: number }; trimMm: Frame;
  resampled: false; registration: { x: 0; y: 0; rotate: 0 }; marksMm: 0; profile: null;
}
/** A synchronous render with owned buffers and opaque paper proof pixels. */
export interface RenderResult {
  contract: 'stipra-core-v1'; version: string; inputKind: 'image' | 'layers';
  geometry: Geometry; recipe: NormalizedRecipe; plates: Plate[];
  proof: Frame & { colorSpace: RGBSpace; alpha: 'opaque'; paper: string; rgba: Uint8ClampedArray };
  diagnostics: PlateDiagnostics; warnings: string[];
}
/** The experimental local package version. */
export const VERSION: string;
/** The public result contract identifier. */
export const CONTRACT: 'stipra-core-v1';
/**
 * Separates full-frame straight-alpha sRGB pixels.
 * @param input - The normalized pixel input, borrowed read-only during the call.
 * @param options - The style or explicit ink recipes and physical settings.
 * @returns The owned proof, production masks and diagnostics.
 * @throws Error if input or settings violate the documented contract.
 */
export function renderImage(input: ImageInput, options: ImageOptions): RenderResult;
/**
 * Screens authored masks while retaining their ink assignments.
 * @param input - The shared frame, paper and authored ink coverages.
 * @param options - The physical settings and optional screen recipe.
 * @returns The owned proof, production masks and diagnostics.
 * @throws Error if input or settings violate the documented contract.
 */
export function renderLayers(input: LayersInput, options?: LayerOptions): RenderResult;
/** Lists independent style metadata; editing the result does not alter the catalog. */
export function listStyles(): StyleSummary[];
/**
 * Resolves a shared style into explicit physical ink/screen recipes.
 * @param id - The style family identifier.
 * @param options - The style adjustments, DPI and seed.
 * @returns The normalized resolution with effective frequency and warnings.
 */
export function resolveStyle(id: string, options?: StyleSettings & { dpi?: number; seed?: number }): StyleResolution;
