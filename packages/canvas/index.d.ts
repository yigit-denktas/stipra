import type {ImageInput, LayersInput, ImageOptions, LayerOptions, RenderResult, Frame} from '@stipra/core';
/** A plain canvas or a structural p5 2D drawing host; p5 is not a dependency. */
export type CanvasSource = HTMLCanvasElement | {canvas: HTMLCanvasElement; width?: number; height?: number} | {elt: HTMLCanvasElement; width?: number; height?: number};
/** Explicit backing-pixel and logical drawing dimensions, with no automatic resampling. */
export interface CaptureMetadata {
  contract: 'stipra-canvas-capture-v1'; renderer: '2d'; backing: Frame; logical: Frame;
  pixelDensity: {x: number; y: number}; colorSpace: 'srgb'; polarity?: {id: string; polarity: string}[];
}
/** Owned image pixels captured synchronously from one drawing frame. */
export interface ImageCapture {kind: 'image'; input: ImageInput; alpha: Uint8Array; metadata: CaptureMetadata}
/** Owned authored coverages captured on the same frame. */
export interface LayersCapture {kind: 'layers'; input: LayersInput; alpha: Uint8Array; metadata: CaptureMetadata}
/** The permitted presentation clipping; production masks are unaffected. */
export interface ViewOptions {alpha?: 'source' | 'paper'}
/** Grayscale/opacity interpretation is explicit to avoid guessing ink polarity. */
export interface CanvasInk {id: string; name: string; color: string; source: CanvasSource; polarity: 'dark-on-light' | 'light-on-dark' | 'alpha'}
/** Artist-authored ink canvases sharing logical and backing dimensions. */
export interface CanvasLayers {paper: string; inks: CanvasInk[]}
/** A separate drawable proof with its underlying masks and captured frame. */
export interface CanvasRender {
  canvas: HTMLCanvasElement; result: RenderResult; capture: ImageCapture | LayersCapture;
  presentation: {alpha: 'source' | 'paper'; logical: Frame};
}
/** The optional exporter contract; PDF/ZIP implementations are not imported by the adapter. */
export interface ProofExportOptions {
  formats?: Array<'png' | 'jpg' | 'webp' | 'svg'>;
  scale?: 1 | 2 | 3;
  alpha?: 'source' | 'paper';
  vectorPlates?: boolean;
}
export interface SketchExporter {
  generateSketch(options: {input: ImageInput | LayersInput; recipe: RenderResult['recipe']; metadata: CaptureMetadata; sourceProject?: unknown; exports?: ProofExportOptions}): Promise<{bytes: Uint8Array; manifest: Record<string, unknown>}>;
}
/** Captures a 2D frame as owned sRGB pixels, retaining density metadata. */
export function captureCanvas(source: CanvasSource): ImageCapture;
/** Captures explicitly interpreted grayscale/opacity ink canvases without resizing them. */
export function captureLayers(input: CanvasLayers): LayersCapture;
/** Renders a source into a separate drawable proof; default alpha is source clipping. */
export function renderCanvas(source: CanvasSource, options: ImageOptions, view?: ViewOptions): CanvasRender;
/** Renders authored canvases directly; default presentation includes opaque paper. */
export function renderCanvasLayers(input: CanvasLayers, options?: LayerOptions, view?: ViewOptions): CanvasRender;
/** Draws in logical coordinates, retaining destination state and rejecting source feedback. */
export function drawProof(rendered: CanvasRender, target: CanvasSource, placement?: {x?: number; y?: number; width?: number; height?: number}): void;
/** Freezes the frame and settings before awaiting an explicit optional exporter loader. */
export function exportSnapshot(rendered: CanvasRender, loadExporter: () => Promise<SketchExporter>, options?: {sourceProject?: unknown; exports?: ProofExportOptions}): Promise<{bytes: Uint8Array; manifest: Record<string, unknown>}>;
