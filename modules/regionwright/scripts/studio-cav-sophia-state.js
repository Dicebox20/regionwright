export const SOPHIA_EMERGENCY_MIN_MS=20*60*1000;
export function sophiaCapturePreparation(chase,session,bedroomTokens,sourceActorPresent,returnPortalEnabled){
 if(session)return "reconcile";
 if(chase?.status!=="capture_pending"||chase.captureCount!==0)return "no-capture-pending";
 if(!chase.participants?.length)return "no-participants";
 if(bedroomTokens!==0)return "bedroom-occupied";
 if(!sourceActorPresent)return "source-not-present";
 if(!returnPortalEnabled)return "exit-not-baseline";
 return "ready";
}
export function sophiaCaptureConfirmation(chase,session,bedroomActorIds,sourceActorPresent){
 if(chase?.status!=="capture_pending"||session?.status!=="prepared")return "reconcile";
 if(!session.actorId||!chase.participants?.includes(session.actorId))return "invalid-actor";
 if(bedroomActorIds.length!==1||bedroomActorIds[0]!==session.actorId)return "capture-position-unsafe";
 if(sourceActorPresent)return "source-still-present";
 return "ready";
}
export function sophiaReleaseDecision(chase,session,method,{hasOriginalKey=false,nowMs=0,allowEmergency=false}={}){
 if(chase?.status!=="captured"||session?.status!=="captured")return "not-captured";
 if(method==="key")return hasOriginalKey?"ready":"missing-original-key";
 if(method!=="emergency")return "unknown-release-method";
 if(allowEmergency)return "ready";
 if(!Number.isFinite(nowMs)||!Number.isFinite(session.capturedAtMs)||nowMs<session.capturedAtMs+SOPHIA_EMERGENCY_MIN_MS)return "waiting";
 return "ready";
}
