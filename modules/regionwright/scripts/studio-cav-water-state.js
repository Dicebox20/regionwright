// Cabin in the Ashen Veil: pure stage-validation model. No Foundry writes.
// Water state is one authoritative datum on the EXT-02 Sluice Region, never independent scene flags.
export const INITIAL_CAV_WATER_STATE=Object.freeze({version:1,status:"closed",pond:"full",bath:"full",stage:"initial"});
export function normalizeCavWaterState(state=null){
 if(state==null)return {...INITIAL_CAV_WATER_STATE};
 if(!state||typeof state!=="object"||state.version!==1)throw new Error("Unsupported water-state format");
 if(state.status==="closed"&&state.pond==="full"&&state.bath==="full")return {...state};
 if(state.status==="open"&&state.pond==="drained"&&state.bath==="drained")return {...state};
 throw new Error("Pond/Bath must change together; conflicting water-state labels.");
}
export function planCavWaterChange({current=null,action,crankInstalled=false,
  pondVisualApproved=false,bathVisualApproved=false,
  tokenPositionsSafe=false,returnRoutesSafe=false,originalRegionReady=false}={}){
 const state=normalizeCavWaterState(current);
 if(!["open","close"].includes(action))return {result:"invalid-action",current:state};
 const expected=action==="open"?"closed":"open";
 if(state.status!==expected)return {result:"already-at-target",current:state};
 if(!crankInstalled||!originalRegionReady)return {result:"blocked-crank-or-region",current:state};
 if(!pondVisualApproved||!bathVisualApproved)return {result:"blocked-unapproved-visuals",current:state};
 if(!tokenPositionsSafe||!returnRoutesSafe)return {result:"pending-safety",current:state};
 const target=action==="open"?"drained":"full";
 return {result:"ready",current:state,next:{...state,status:action==="close"?"closed":"open",pond:target,bath:target,stage:"water-transition"}};
}

