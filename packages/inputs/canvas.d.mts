import type {RegionSource,Provenance} from './dist/index.mjs';
export function captureRegions(input:{regions:{id:string;name:string;source:unknown;polarity:'alpha'|'dark-on-light'|'light-on-dark';provenance:Provenance}[]}):RegionSource;
