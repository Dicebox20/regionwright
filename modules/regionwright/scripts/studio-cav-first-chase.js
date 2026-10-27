import {newFirstChaseState,advanceFirstChase,firstChaseCaptureDecision,finalizeFirstChaseCapture} from "./studio-cav-first-chase-state.js";
import {markSophiaCapturedAfterTransfer} from "./studio-cav-sophia-confinement.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const AQ="CAVAQ01Scene0001",START="woZ98KXx0RsWIPpl",POND="CAVEXT02Scene001",GATE="CAVPONDAQGATE001",PORT="CAVPONDAQPORT001";
const WATER_REGION="CAVEXT02SLUICE01",WATER="cavPondBathWaterState",MECHANIC="cavAqueductGateMechanicalReady";
const LEDGER="cavFirstAqueductChase",ROUND="cavFirstChaseGMAdjudication";
function isGM(){return game?.ready===true&&game.world?.id===WORLD&&game.user?.isGM&&game.users.activeGM?.id===game.user.id;}
function refs(){const aq=game.scenes.get(AQ),region=aq?.regions.get(START),pond=game.scenes.get(POND),gate=pond?.regions.get(GATE);return{aq,region,pond,gate,portal:gate?.behaviors.get(PORT),sluice:pond?.regions.get(WATER_REGION)};}
function prerequisites(){const x=refs(),water=x.sluice?.getFlag(NS,WATER);
 return !!x.region&&x.portal?.disabled===false&&x.gate?.getFlag(NS,MECHANIC)?.status==="ready"&&
 x.gate?.getFlag(NS,MECHANIC)?.traversalEnabled===true&&water?.status==="open"&&water.pond==="drained"&&water.bath==="drained";
}
function participantList(aq){return [...new Set(aq.tokens.contents.filter(t=>!t.hidden&&t.actor?.type==="character").map(t=>t.actor.id))];}
export async function handleCabinFirstChaseRegionEvent(region,event){
 if(!isGM()||region?.parent?.id!==AQ||region.id!==START||
 !["tokenMoveIn","tokenMoveWithin"].includes(event?.name)||!prerequisites())return;
 if(region.getFlag(NS,LEDGER))return;
 const x=refs(),t=event.data?.token?.document??event.data?.token,token=x.aq.tokens.get(t?.id??event.data?.tokenId);
 if(!token||token.hidden||token.actor?.type!=="character")return;
 const playerId=event.userId??event.data?.userId;
 const player=playerId?game.users.get(playerId):null;
 if(!player?.active||player.isGM||!token.actor.testUserPermission(player,"OWNER"))return;
 const participants=participantList(x.aq);if(!participants.includes(token.actor.id))return;
 const state=newFirstChaseState(participants,token.actor.id);
 await region.setFlag(NS,LEDGER,state);
 // No forced movement/capture. The GM adjudicates explicit skill checks against DC 13.
 try{await ChatMessage.create({speaker:{alias:"The Aqueduct"},content:"<p>An impossible scraping echoes down the masonry tunnel. Somewhere behind you, a towering silhouette unfolds from the dark. Its limbs strike stone in slow, uneven beats.</p>"})}
 catch(e){console.warn("[CAV First Chase] started, narrative delivery failed",e)}
}
export async function recordCabinFirstChaseGMResult({actorId,tactic,total,expectedRound}={}){
 if(!isGM())return{status:"not-elected-gm"};
 const {aq,region}=refs();
 if(!region||!prerequisites())return{status:"prerequisites-unavailable"};
 const state=region.getFlag(NS,LEDGER),previous=region.getFlag(NS,ROUND);
 if(previous?.status==="reserved")return{status:"manual-reconciliation-required"};
 if(previous?.status==="done"&&previous.round===expectedRound)return{status:"already-recorded"};
 if(!aq.tokens.contents.some(t=>t.actor?.id===actorId&&!t.hidden))return{status:"actor-not-in-aqueduct"};
 const decision=advanceFirstChase(state,{actorId,tactic,total,expectedRound});
 if(decision.status!=="recorded")return decision;
 await region.setFlag(NS,ROUND,{status:"reserved",round:expectedRound,actorId,tactic,total});
 await region.setFlag(NS,LEDGER,decision.next);
 await region.setFlag(NS,ROUND,{status:"done",round:expectedRound,actorId,tactic,total,passed:decision.passed});
 // Optional GM-run haunt cannot unlock a puzzle-chain well route.
 return{status:"recorded",passed:decision.passed,state:decision.next,
  well:"independent-physical-north-arrival",captureRequiresGM:decision.next.status==="capture_pending"};
}
export async function confirmCabinFirstChaseCaptureAfterGMTransfer({actorId}={}){
 if(!isGM())return{status:"not-elected-gm"};
 const {aq,region}=refs(),sophia=game.scenes.get("CAVHU05Scene0001");
 const returnBehavior=sophia?.regions.get("CAVHU05RETURN001")?.behaviors.get("CAVHU05RETURNB01");
 if(!aq||!region||!returnBehavior)return{status:"source-missing"};
 const match=sophia.tokens.contents.filter(t=>t.actor?.id===actorId&&!t.hidden);
 const sourcePresent=aq.tokens.contents.some(t=>t.actor?.id===actorId);
 const state=region.getFlag(NS,LEDGER);
 const session=sophia?.regions.get("CAVHU05RETURN001")?.getFlag(NS,"cavSophiaCaptureSession");
 const gallery=game.scenes.get("gGgUHlHdI7RFrbUh")?.regions.get("UV4YAstBe0WCuLcM");
 if(session?.status!=="prepared"||session.actorId!==actorId||
    gallery?.behaviors.get("CAVHU02SOPHTEL01")?.disabled!==true||
    gallery?.behaviors.get("CAVHU02SOPHGATE1")?.disabled!==true||
    sophia.tokens.contents.filter(t=>!t.hidden&&t.actor?.type==="character").length!==1)
    return{status:"confinement-not-prepared"};
 const decision=finalizeFirstChaseCapture(state,{actorId,physicallyInSophia:match.length===1,
   returnLocked:returnBehavior.disabled===true,sourceAbsent:!sourcePresent});
 if(decision.status!=="captured")return decision;
 // This confirms an actual GM relocation and locked escape; never moves the player itself.
 await region.setFlag(NS,LEDGER,decision.next);
 const saved=await markSophiaCapturedAfterTransfer({actorId});
 if(saved.status!=="captured")return{status:"capture-reconciliation-required",actorId,details:saved.status};
 return{status:"captured",actorId,captureCount:1,well:"independent-physical-north-arrival"};
}
export function describeCabinFirstChase(){
 if(!isGM())return{status:"not-elected-gm"};
 const {region,gate,portal,sluice}=refs();
 const state=region?.getFlag(NS,LEDGER)||null;
 return{status:state?.status||"not-triggered",state,
  gateReady:gate?.getFlag(NS,MECHANIC)||null,gatePortalDisabled:portal?.disabled,
  water:sluice?.getFlag(NS,WATER)||null,
  captureSafety:state?.status==="capture_pending"?"GM must prepare Sophia confinement and manually transfer one captive before confirming":null};
}
export {firstChaseCaptureDecision};
