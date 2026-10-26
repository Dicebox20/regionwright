// Campaign-local pure chase state transitions; no Foundry writes or player-controlled outcome claims.
export const FIRST_CHASE_DC=13;
export const FIRST_CHASE_SUCCESS_TARGET=3;
export const FIRST_CHASE_FAILURE_LIMIT=2;
export const FIRST_CHASE_TACTICS=Object.freeze(["dash","hide","navigate","distract","climb","assist"]);
export function newFirstChaseState(participants=[],initiatorActorId=null){
 if(!Array.isArray(participants)||!participants.length||!participants.every(p=>typeof p==="string"&&p.length))throw Error("No confirmed character participants");
 if(!participants.includes(initiatorActorId))throw Error("Initiator must be a participant");
 return{version:1,status:"running",round:0,successes:0,failures:0,participants:[...new Set(participants)],
  initiatorActorId,lastTacticByActor:{},captureCount:0,capturedActorId:null,dc:FIRST_CHASE_DC};
}
export function advanceFirstChase(state,{actorId,tactic,total,expectedRound}={}){
 if(state?.version!==1||state.status!=="running")return{status:"not-running",state};
 if(!Number.isInteger(expectedRound)||expectedRound!==state.round)return{status:"stale-round",state};
 if(!state.participants?.includes(actorId))return{status:"unregistered-actor",state};
 if(!FIRST_CHASE_TACTICS.includes(tactic))return{status:"invalid-tactic",state};
 if(state.lastTacticByActor?.[actorId]===tactic)return{status:"repeat-tactic",state};
 if(!Number.isFinite(total)||total<0||total>100)return{status:"invalid-total",state};
 const passed=total>=FIRST_CHASE_DC;
 const successes=state.successes+(passed?1:0),failures=state.failures+(passed?0:1);
 const status=successes>=FIRST_CHASE_SUCCESS_TARGET?"escaped_pending_well_exit":
  failures>=FIRST_CHASE_FAILURE_LIMIT?"capture_pending":"running";
 const next={...state,status,round:state.round+1,successes,failures,
  lastTacticByActor:{...state.lastTacticByActor,[actorId]:tactic}};
 return{status:"recorded",passed,next};
}
export function finalizeFirstChaseCapture(state,{actorId,physicallyInSophia=false,returnLocked=false,sourceAbsent=false}={}){
 const gate=firstChaseCaptureDecision(state,actorId);
 if(gate!=="gm-transfer-required")return{status:gate,state};
 if(!physicallyInSophia||!returnLocked||!sourceAbsent)return{status:"physical-safety-not-certified",state};
 return{status:"captured",next:{...state,status:"captured",capturedActorId:actorId,captureCount:1}};
}
export function firstChaseCaptureDecision(state,actorId){
 if(state?.status!=="capture_pending"||state?.captureCount!==0)return"blocked";
 return state.participants?.includes(actorId)?"gm-transfer-required":"not-a-participant";
}
