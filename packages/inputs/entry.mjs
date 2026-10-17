import regions from '../../src/structured/regions.js';
import auxiliary from '../../src/structured/auxiliary.js';
export const {mapRegions,coverageFromRGBA,MAX_REGIONS,MAX_REGION_BYTES}=regions;
export const {depthCoverage,labelCoverage}=auxiliary;
export {regionProject,replayRegions} from '../../src/structured/project.js';
