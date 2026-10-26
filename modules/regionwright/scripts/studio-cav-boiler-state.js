// Canonical CAV Boiler pressure reducer. GM-owned session; no client-supplied state or success flag is accepted.
export const CAV_BOILER_TARGETS=Object.freeze([2,1]);
export const CAV_BOILER_REGION_ID="CAVBBOILERCTRL01";
export const CAV_BOILER_SCENES=Object.freeze(["CAVBATHScene0001","8yLMRDvxyw58dydh"]);
export const CAV_BOILER_SESSION="cavUnifiedBoilerPressureSession";
export const initialCavBoilerState=()=>({status:"unsolved",revision:0,positions:{left:0,right:0}});
export function planCavBoilerAction(existing,req){
 const state=existing??initialCavBoilerState();
 if(state.status==="reserved")return{status:"reconcile"};
 if(state.status==="done")return{status:"already-solved"};
 if(state.status!=="unsolved"||!Number.isInteger(state.revision)||state.revision<0||
  !state.positions||!["left","right"].every(k=>Number.isInteger(state.positions[k])&&state.positions[k]>=0&&state.positions[k]<=5))
   return{status:"reconcile"};
 if(req?.version!==1||req.expectedRevision!==state.revision||
    !["adjust","reset","submit"].includes(req.op))return{status:"stale-or-invalid"};
 const positions={left:state.positions.left,right:state.positions.right};
 if(req.op==="adjust"){
  if(!["left","right"].includes(req.valve)||![-1,1].includes(req.direction))return{status:"denied"};
  positions[req.valve]=Math.max(0,Math.min(5,positions[req.valve]+req.direction));
 }else if(req.op==="reset"){positions.left=0;positions.right=0;}
 else if(positions.left!==2||positions.right!==1)return{status:"incorrect"};
 const solved=req.op==="submit";
 return{status:"ready",next:{status:solved?"done":"unsolved",revision:state.revision+1,positions,solved}};
}
