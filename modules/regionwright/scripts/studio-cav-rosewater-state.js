import{createRosewaterCampaignConfig,evaluateRosewaterCampaignSolution,rotateRosewaterRing,resetRosewaterRings}from"../../regionwright-puzzles-locks/scripts/rosewater-campaign-preset.js";
export const CAV_ROSEWATER_SCENE="8yLMRDvxyw58dydh";
export const CAV_ROSEWATER_REGION="CAVBROSEWATER001";
export const CAV_ROSEWATER_SESSION="cavRosewaterRingSession";
export const CAV_ROSEWATER_BEHAVIOR_ID="CAVROSEWATERSCR1";
export const CAV_ROSEWATER_SYMBOL_FLAG="cavRosewaterApprovedSymbols";
export const newRosewaterState=()=>({version:1,status:"unsolved",revision:0,positions:[0,0,0]});
export function planRosewaterGMAction(session,action){
 const state=session??newRosewaterState();
 if(state.status==="reserved")return{status:"reconcile"};
 if(state.status==="done")return{status:"already-solved"};
 if(state.status!=="unsolved"||state.version!==1||!Number.isInteger(state.revision)||state.revision<0||
 !Array.isArray(state.positions)||state.positions.length!==3||state.positions.some(x=>!Number.isInteger(x)||x<0||x>3))
  return{status:"reconcile"};
 if(action?.version!==1||action.expectedRevision!==state.revision||
 !["rotate","reset","submit"].includes(action.op))return{status:"stale-or-invalid"};
 const config=createRosewaterCampaignConfig({symbols:["symbol-one","symbol-two","symbol-three","symbol-four"]});
 const current={positions:[...state.positions],submitted:false};
 if(action.op==="rotate"&&(!["outer","middle","inner"].includes(action.ring)||![-1,1].includes(action.direction)))
  return{status:"denied"};
 if(action.op==="rotate"&&action.ring&&action.direction){
  const next=rotateRosewaterRing(config,current,action.ring,action.direction);
  return{status:"ready",next:{version:1,status:"unsolved",revision:state.revision+1,positions:[...next.positions]}};
 }
 if(action.op==="reset")return{status:"ready",next:{version:1,status:"unsolved",revision:state.revision+1,positions:[...resetRosewaterRings(config).positions]}};
 if(!evaluateRosewaterCampaignSolution(config,current).success)return{status:"incorrect"};
 return{status:"ready",next:{version:1,status:"done",revision:state.revision+1,positions:[...state.positions]}};
}
// Read-only commissioning proof: never trust a hand-set water flag without the
// original Crank receipt AND completed GM two-scene Sluice transition.
export function evaluateRosewaterSluiceProof({water=null,transition=null,crank=null,controller=null}={}){
 const blockers=[];
 if(crank?.status!=="done"||crank?.sourceUuid!=="Item.g3VYdgc1qkgkHGvn")
  blockers.push("original-crank-not-installed");
 if(controller?.drainEnabled!==true)blockers.push("sluice-controller-not-commissioned");
 if(water?.version!==1||water?.status!=="open"||water?.pond!=="drained"||
    water?.bath!=="drained"||water?.stage!=="committed"||water?.source!=="sluice")
  blockers.push("pond-bath-not-committed-drained");
 if(transition?.version!==1||transition?.status!=="done"||
    transition?.operation!=="open"||transition?.committedState!=="open")
  blockers.push("original-sluice-transaction-not-complete");
 if(transition?.status==="reserved")blockers.push("sluice-transaction-reserved");
 return {ready:blockers.length===0,blockers};
}
