import{createWaterworksPressureConfig,evaluateWaterworksPressure,adjustWaterworksValve,resetWaterworksPressure}from"./waterworks-pressure-engine.js";
// Cabin in the Ashen Veil owner-approved two-valve Boiler pressure puzzle.
// Standalone generic demo remains [2,4]; live campaign targets are [2,1].
export const CAV_BOILER_VALVE_TARGETS=Object.freeze([2,1]);
export function createCavBoilerConfig(){return createWaterworksPressureConfig({variant:"boiler",targets:CAV_BOILER_VALVE_TARGETS})}
const exact=config=>config?.variant==="boiler"&&config?.valves?.length===2&&
 config.valves[0].id==="left"&&config.valves[0].target===2&&config.valves[1].id==="right"&&config.valves[1].target===1;
export function evaluateCavBoiler(config,state){if(!exact(config))throw Error("Campaign Boiler config must use two valves at 2/1");return evaluateWaterworksPressure(createCavBoilerConfig(),state)}
export function adjustCavBoiler(config,state,id,direction){if(!exact(config))throw Error("Wrong Boiler configuration");return adjustWaterworksValve(createCavBoilerConfig(),state,id,direction)}
export function resetCavBoiler(config){if(!exact(config))throw Error("Wrong Boiler configuration");return resetWaterworksPressure(createCavBoilerConfig())}
