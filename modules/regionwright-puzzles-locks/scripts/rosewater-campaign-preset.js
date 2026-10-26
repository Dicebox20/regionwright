import {createThreeRingConfig,evaluateThreeRing,rotateThreeRing,resetThreeRing} from "./three-ring-reliquary-engine.js";
// Canon for Cabin in the Ashen Veil, owner-approved 2026-10-25.
// Exact ring orientations OUTER 90°, MIDDLE 270°, INNER 180°.
// Artwork, symbols, discoverability and Source Region are *not* owner-approved yet.
export const ROSEWATER_RING_ANGLES_DEGREES=Object.freeze([90,270,180]);
export const ROSEWATER_RING_QUARTER_TURNS=Object.freeze([1,3,2]);
export const ROSEWATER_RING_START_ANGLE_DEGREES=0;
export const ROSEWATER_RING_STEP_ANGLE_DEGREES=90;
export function createRosewaterCampaignConfig({symbols}={}){
 if(!Array.isArray(symbols)||symbols.length!==4)
  throw Error("Rosewater requires four approved unique ring symbols; demo artwork/config may not be used for the campaign.");
 return createThreeRingConfig({symbols,solution:ROSEWATER_RING_QUARTER_TURNS});
}
export function evaluateRosewaterCampaignSolution(config,state){
 const c=createRosewaterCampaignConfig({symbols:config?.symbols});
 if(!Array.isArray(config?.solution)||config.solution.length!==3||
  config.solution.some((v,i)=>v!==ROSEWATER_RING_QUARTER_TURNS[i]))throw Error("Rosewater configuration does not match approved 90/270/180 positions");
 return evaluateThreeRing(c,state);
}
export function rotateRosewaterRing(config,state,ring,direction=1){
 return rotateThreeRing(createRosewaterCampaignConfig({symbols:config?.symbols}),state,ring,direction);
}
export function resetRosewaterRings(config){
 return resetThreeRing(createRosewaterCampaignConfig({symbols:config?.symbols}));
}
