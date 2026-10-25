// Pure pressure-balancing engine, reusable for Waterworks (5 valves) and Boiler (2).
export const WATERWORKS_PRESSURE_VERSION = 2;
export const PRESSURE_VARIANTS = Object.freeze({waterworks:Object.freeze(['red','blue','green','yellow','purple']),boiler:Object.freeze(['left','right'])});
const integer=n=>Number.isInteger(n)&&n>=0&&n<=5;
export function createWaterworksPressureConfig({variant='waterworks',targets}={}){
 const ids=PRESSURE_VARIANTS[variant];if(!ids)throw Error('Unknown pressure puzzle variant');
 const goal=targets??(variant==='boiler'?[2,4]:[2,4,3,1,5]);
 if(!Array.isArray(goal)||goal.length!==ids.length||!goal.every(integer))throw Error('One pressure target per valve (0–5) is required');
 return Object.freeze({version:WATERWORKS_PRESSURE_VERSION,variant,valves:Object.freeze(ids.map((id,i)=>Object.freeze({id,target:goal[i]})))});
}
export function evaluateWaterworksPressure(config,state={}){
 const c=createWaterworksPressureConfig({variant:config?.variant,targets:config?.valves?.map(v=>v.target)});
 if(config.version!==c.version||config.valves.some((v,i)=>v.id!==c.valves[i].id))throw Error('Invalid pressure puzzle config');
 const positions=state.positions??{};
 const valves=Object.freeze(c.valves.map(v=>Object.freeze({id:v.id,target:v.target,position:positions[v.id],matched:integer(positions[v.id])&&positions[v.id]===v.target})));
 const blockageCleared=state.blockageCleared===true,balanced=valves.every(v=>v.matched);
 return Object.freeze({variant:c.variant,blockageCleared,balanced,success:balanced&&(c.variant==='boiler'||blockageCleared),valves});
}
export function adjustWaterworksValve(config,state,id,delta){const check=evaluateWaterworksPressure(config,state);if(!check.valves.some(v=>v.id===id)||![-1,1].includes(delta))throw Error('Invalid valve adjustment');const previous=state?.positions?.[id]??0;if(!integer(previous))throw Error('Invalid position');return Object.freeze({...state,positions:Object.freeze({...state?.positions,[id]:Math.max(0,Math.min(5,previous+delta))}),blockageCleared:state?.blockageCleared===true});}
export function resetWaterworksPressure(config=createWaterworksPressureConfig()){return Object.freeze({positions:Object.freeze(Object.fromEntries(config.valves.map(v=>[v.id,0]))),blockageCleared:false});}
