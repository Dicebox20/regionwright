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
// Preflight for the original 587 Crank → installed closed/full stage → GM water
// transaction chain. A missing or half-written receipt must never be interpreted
// as a clean initial stage merely because normalizeCavWaterState(null) is full.
export function evaluateSluiceRecordedPrestate({crank=null,water=null,transaction=null}={}){
 const denied=reason=>({ready:false,reason});
 if(crank?.version!==1||crank.status!=="done"||
    crank.sourceUuid!=="Item.g3VYdgc1qkgkHGvn"||
    typeof crank.consumedActorItemId!=="string"||!crank.consumedActorItemId||
    typeof crank.boxRegionUuid!=="string"||!crank.boxRegionUuid)
  return denied("original-crank-consumption-incomplete");
 if(!water||water.version!==1)return denied("initial-water-receipt-missing");
 try{normalizeCavWaterState(water)}catch{return denied("water-state-conflicting")}
 if(water.status==="closed"&&water.stage==="initial"&&
    water.source==="cav-sluice-crank-install")
  return transaction==null?{ready:true,reason:"initial-full-stage"}:denied("unexpected-transaction-for-initial");
 if(water.stage!=="committed"||water.source!=="sluice")
  return denied("water-stage-not-committed");
 const op=water.status==="open"?"open":water.status==="closed"?"close":null;
 if(transaction?.version!==1||transaction.status!=="done"||
    transaction.operation!==op||transaction.committedState!==water.status||
    transaction.next?.status!==water.status||
    transaction.next?.pond!==water.pond||
    transaction.next?.bath!==water.bath)
  return denied("completed-transaction-receipt-mismatch");
 return{ready:true,reason:"previous-stage-committed"};
}
