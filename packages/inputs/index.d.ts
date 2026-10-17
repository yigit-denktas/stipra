export interface Provenance {kind:'authored'|'captured'|'renderer-provided'|'estimated';producer?:{name:string;version:string};parameters?:unknown}
export interface Region {id:string;name:string;role:'coverage';coverage:Uint8Array;provenance:Provenance}
export interface RegionSource {width:number;height:number;regions:Region[]}
export interface Mapping {version:1;paper:string;inks:{id:string;name:string;color:string;combine:'max'|'over';regions:{id:string;strength?:number}[]}[]}
export interface InkInput {width:number;height:number;paper:string;inks:{id:string;name:string;color:string;coverage:Uint8Array}[]}
export interface Mapped {contract:'stipra-region-result-v1';input:InkInput;recipe:Mapping;regions:Omit<Region,'coverage'>[];provenance:unknown}
export interface SourceProject {version:1;frame:{width:number;height:number;origin:{x:number;y:number};transform:number[]};artifacts:{id:string;name:string;role:string;mediaType:string;bytes:Uint8Array;provenance?:Provenance}[];relationships:{from:string;to:string;kind:string}[]}
export function mapRegions(source:RegionSource,mapping:Mapping):Mapped;
export function coverageFromRGBA(rgba:Uint8Array|Uint8ClampedArray,polarity:'alpha'|'dark-on-light'|'light-on-dark'):Uint8Array;
export function regionProject(source:RegionSource,mapping:Mapping):SourceProject;
export function replayRegions(project:SourceProject):Mapped;
export const MAX_REGIONS:64;
export const MAX_REGION_BYTES:number;
export interface Auxiliary {width:number;height:number;dataWindow:{x:number;y:number};displayWindow:{x:number;y:number;width:number;height:number};orientation:1;provenance:Provenance}
export interface CoverageResult {width:number;height:number;coverage:Uint8Array;interpretation:unknown}
export function depthCoverage(input:Auxiliary&{kind:'depth'|'disparity';units:'m'|'1/m';values:Float32Array|Float64Array;invalidValues:number[]},rule:{near:number;far:number;ramp:'near'|'far'}):CoverageResult;
export function labelCoverage(input:Auxiliary&{kind:'uint32-labels';units:'categorical';values:Uint32Array},selected:number[]):CoverageResult;
