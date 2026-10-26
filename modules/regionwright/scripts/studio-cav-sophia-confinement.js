import {sophiaCapturePreparation,sophiaReleaseDecision} from "./studio-cav-sophia-state.js";
const NS="dicebox-campaign-helper",W="cabin-in-the-ashen-veil",AQ="CAVAQ01Scene0001",CHASE="woZ98KXx0RsWIPpl";
const ROOM="CAVHU05Scene0001",RETURN="CAVHU05RETURN001",RETURN_BEHAVIOR="CAVHU05RETURNB01";
const GALLERY="gGgUHlHdI7RFrbUh",DOOR="UV4YAstBe0WCuLcM",ENTRY="CAVHU02SOPHTEL01",KEY_GATE="CAVHU02SOPHGATE1";
const KEY="Item.CAVOLDIRONKEY001",KEY_ORIGIN="Scene.CAVHU04Scene0001.Region.CAVHU04COATREG01";
const FLAG="cavSophiaCaptureSession", CHASE_FLAG="cavFirstAqueductChase";
const HOOK="__CAV_SOPHIA_RESCUE_GM_SERVICE_v001",BUSY="__CAV_SOPHIA_RESCUE_BUSY_v001";
function elected(){return game?.ready===true&&game.world?.id===W&&game.user?.isGM===true&&game.users?.activeGM?.id===game.user.id}
function refs(){
 const room=game.scenes.get(ROOM),ret=room?.regions.get(RETURN);
 const gallery=game.scenes.get(GALLERY),door=gallery?.regions.get(DOOR);
 const aq=game.scenes.get(AQ),chase=aq?.regions.get(CHASE);
 return{room,ret,returnPortal:ret?.behaviors.get(RETURN_BEHAVIOR),gallery,door,
  entry:door?.behaviors.get(ENTRY),keyGate:door?.behaviors.get(KEY_GATE),aq,chase};
}
function originalsValid(x){
 return !!x.room&&!!x.ret&&!!x.returnPortal&&!!x.door&&!!x.entry&&!!x.keyGate&&!!x.chase&&
  x.returnPortal.type==="teleportToken"&&x.entry.type==="teleportToken"&&x.keyGate.type==="executeScript"&&
  x.entry.system.destinations.has("Scene."+ROOM+".Region.CAVHU05ARRIVE001")&&
  x.returnPortal.system.destinations.has("Scene."+GALLERY+".Region.CAVHU02SOPHAR001");
}
function hasKey(actor){return actor?.items.some(i=>i.type==="loot"&&i.name==="Old Iron Key"&&
 i.getFlag(NS,"cavOldIronKeySourceUuid")===KEY&&i.getFlag(NS,"cavOldIronKeySourceRegionUuid")===KEY_ORIGIN)}
export async function prepareSophiaGMConfinement({actorId}={}){
 if(!elected())return{status:"not-elected-gm"};
 const x=refs();if(!originalsValid(x)||!actorId)return{status:"missing-source"};
 const chase=x.chase.getFlag(NS,CHASE_FLAG),existing=x.ret.getFlag(NS,FLAG);
 const present=x.aq.tokens.contents.some(t=>t.actor?.id===actorId&&!t.hidden);
 const state=sophiaCapturePreparation(chase,existing,x.room.tokens.size,present,!x.returnPortal.disabled);
 if(state!=="ready")return{status:state};
 if(!chase.participants.includes(actorId))return{status:"actor-not-in-chase"};
 const orig={entryDisabled:x.entry.disabled,keyGateDisabled:x.keyGate.disabled,returnDisabled:x.returnPortal.disabled};
 const record={version:1,status:"reserved",actorId,original:orig,preparedByGM:game.user.id};
 await x.ret.setFlag(NS,FLAG,record);
 // Both entrances are locked while the captive is held. Preserve gallery original key script
 // and native portals; disabling temporarily cannot unlock the house for other players.
 await x.door.updateEmbeddedDocuments("RegionBehavior",[{_id:ENTRY,disabled:true},{_id:KEY_GATE,disabled:true}]);
 await x.ret.updateEmbeddedDocuments("RegionBehavior",[{_id:RETURN_BEHAVIOR,disabled:true}]);
 if(!x.entry.disabled||!x.keyGate.disabled||!x.returnPortal.disabled)throw Error("Sophia portal state uncertain; reserved capture requires GM reconcile");
 await x.ret.setFlag(NS,FLAG,{...record,status:"prepared",preparedAtMs:Date.now()});
 return{status:"prepared",actorId,manualGMTransferRequired:true,destination:"Scene."+ROOM+".Region.CAVHU05ARRIVE001"};
}
export async function markSophiaCapturedAfterTransfer({actorId}={}){
 if(!elected())return{status:"not-elected-gm"};
 const x=refs();if(!originalsValid(x))return{status:"missing-source"};
 const session=x.ret.getFlag(NS,FLAG),chase=x.chase.getFlag(NS,CHASE_FLAG);
 if(session?.actorId!==actorId||session?.status!=="prepared"||chase?.status!=="captured")return{status:"reconcile"};
 if(!x.returnPortal.disabled||!x.entry.disabled||!x.keyGate.disabled)return{status:"unsafe-portal"};
 const rooms=x.room.tokens.contents.filter(t=>!t.hidden&&t.actor?.type==="character").map(t=>t.actor.id);
 if(rooms.length!==1||rooms[0]!==actorId||x.aq.tokens.contents.some(t=>t.actor?.id===actorId))return{status:"position-not-verified"};
 await x.ret.setFlag(NS,FLAG,{...session,status:"captured",capturedAtMs:Date.now()});
 return{status:"captured",actorId,gmFallbackAfterMinutes:20};
}
async function restore(original,x){
 if(!original||typeof original.entryDisabled!=="boolean"||typeof original.keyGateDisabled!=="boolean"||
  original.returnDisabled!==false)throw Error("Sophia original portal state receipt missing");
 await x.ret.updateEmbeddedDocuments("RegionBehavior",[{_id:RETURN_BEHAVIOR,disabled:original.returnDisabled}]);
 await x.door.updateEmbeddedDocuments("RegionBehavior",[{_id:ENTRY,disabled:original.entryDisabled},{_id:KEY_GATE,disabled:original.keyGateDisabled}]);
 if(x.returnPortal.disabled!==original.returnDisabled||x.entry.disabled!==original.entryDisabled||x.keyGate.disabled!==original.keyGateDisabled)
  throw Error("Sophia portal restore uncertain; reserved ledger retained");
}
async function release(method,{actorId=null,reason="",actor=null}={}){
 if(!elected())return{status:"not-elected-gm"};
 const x=refs();if(!originalsValid(x))return{status:"missing-source"};
 const session=x.ret.getFlag(NS,FLAG),chase=x.chase.getFlag(NS,CHASE_FLAG);
 const earlyOverride=method==="emergency"&&typeof reason==="string"&&reason.trim().length>=12;
 const decision=sophiaReleaseDecision(chase,session,method,
  {hasOriginalKey:hasKey(actor),nowMs:Date.now(),allowEmergency:earlyOverride});
 if(decision!=="ready")return{status:decision};
 if(actorId&&actorId!==session.actorId)return{status:"wrong-captive"};
 if(!x.returnPortal.disabled||!x.entry.disabled||!x.keyGate.disabled)return{status:"portal-state-reconcile"};
 const occupant=x.room.tokens.contents.filter(t=>!t.hidden&&t.actor?.type==="character");
 if(occupant.length!==1||occupant[0].actor?.id!==session.actorId)return{status:"captive-location-reconcile"};
 const reserved={...session,status:"release-reserved",releaseMethod:method,releaseByGM:game.user.id,reason:earlyOverride?reason.trim():null};
 await x.ret.setFlag(NS,FLAG,reserved);
 await restore(session.original,x);
 await x.chase.setFlag(NS,CHASE_FLAG,{...chase,status:"capture_resolved"});
 await x.ret.setFlag(NS,FLAG,{...reserved,status:"released",releasedAtMs:Date.now()});
 return{status:"released",actorId:session.actorId,method,bedroomExitRestored:true};
}
export async function emergencyReleaseSophiaGM({actorId,reason=""}={}){
 return release("emergency",{actorId,reason});
}
export async function abortPreparedSophiaGM(){
 if(!elected())return{status:"not-elected-gm"};
 const x=refs(),s=x.ret?.getFlag(NS,FLAG),chase=x.chase?.getFlag(NS,CHASE_FLAG);
 if(!originalsValid(x)||s?.status!=="prepared"||chase?.status!=="capture_pending"||x.room.tokens.size>0)
  return{status:"not-safe-to-abort"};
 await x.ret.setFlag(NS,FLAG,{...s,status:"abort-reserved"});
 await restore(s.original,x);
 await x.ret.setFlag(NS,FLAG,{...s,status:"aborted",abortedAtMs:Date.now()});
 return{status:"aborted",chaseStillPending:true};
}
export function describeSophiaConfinementGM(){
 if(!elected())return{status:"not-elected-gm"};
 const x=refs();
 return{session:x.ret?.getFlag(NS,FLAG)||null,chase:x.chase?.getFlag(NS,CHASE_FLAG)?.status||null,
  returnDisabled:x.returnPortal?.disabled,galleryEntryDisabled:x.entry?.disabled,keyScriptDisabled:x.keyGate?.disabled,
  roomTokenCount:x.room?.tokens.size||0};
}
async function keyRescue(req,author){
 if(!elected()||req?.version!==1||req.action!=="key-rescue"||req.sceneId!==GALLERY||req.regionId!==DOOR)return{status:"denied"};
 const x=refs(),user=game.users.get(author),token=x.gallery?.tokens.get(req.tokenId),actor=token?.actor;
 if(!user?.active||user.isGM||!token||token.hidden||actor?.type!=="character"||!actor.testUserPermission(user,"OWNER"))return{status:"denied"};
 const point={x:token.x+token.width*x.gallery.grid.size/2,y:token.y+token.height*x.gallery.grid.size/2,elevation:0};
 if(!x.door?.testPoint(point))return{status:"not-near-door"};
 return release("key",{actor});
}
export function installSophiaRescueGMService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==W)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const handler=async(m,opt,sender)=>{
  if(!elected())return;
  const req=m?.getFlag?.(NS,"cavSophiaKeyRescueRequest");if(!req)return;
  const user=m.user;if(!user||user.id!==sender||user.isGM||!user.active||globalThis[BUSY])return;
  globalThis[BUSY]=true;let out={status:"reconcile"};
  try{out=await keyRescue(req,sender)}catch(e){console.error("[CAV Sophia] release uncertain",e)}
  finally{globalThis[BUSY]=false}
  const messages={released:"The original iron key turns in Sophia's lock. The captive's way out is clear.",
   "not-captured":"The bedroom is not holding a captive.","missing-original-key":"You need the original iron key from the Parents' coat.",
   "captive-location-reconcile":"The bedroom must be checked by the Gamemaster.","portal-state-reconcile":"The locked door requires Gamemaster reconciliation.",
   denied:"Approach Sophia's door with your own character.","not-near-door":"Stand beside the door to use the key."};
  try{await ChatMessage.create({speaker:{alias:"Sophia's Door"},whisper:[sender],content:"<p>"+(messages[out.status]||"The old lock remains still.")+"</p>"})}catch(e){}
 };
 globalThis[HOOK]={version:1,hookId:Hooks.on("createChatMessage",handler)};return true;
}
export async function handleSophiaRescueRegionEvent(region,event){
 if(game?.world?.id!==W||game.user?.isGM||region?.parent?.id!==GALLERY||region.id!==DOOR||!canvas?.ready)return;
 const tag="__CAV_SOPHIA_KEY_RESCUE_CLICK_v001",prev=globalThis[tag];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){if(prev?.handler)canvas.stage.off("pointertap",prev.handler);delete globalThis[tag];return}
 if(event?.name!=="behaviorViewed")return;
 if(prev?.handler)canvas.stage.off("pointertap",prev.handler);
 const h=async ev=>{
  if(!canvas?.ready||canvas.scene?.id!==GALLERY||(ev.button!==undefined&&ev.button!==0))return;
  const pos=canvas.stage.toLocal(ev.global);if(!region.testPoint({x:pos.x,y:pos.y,elevation:0})||globalThis[tag+"_busy"])return;
  const session=game.scenes.get(ROOM)?.regions.get(RETURN)?.getFlag(NS,FLAG);
  if(session?.status!=="captured")return; // normal exploration has no new button.
  globalThis[tag+"_busy"]=true;
  try{
   const owners=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"));
   const token=owners.length===1?owners[0].document:null;
   const x=token?.x+(token?.width||0)*canvas.scene.grid.size/2,y=token?.y+(token?.height||0)*canvas.scene.grid.size/2;
   const eligible=!!token&&region.testPoint({x,y,elevation:0})&&hasKey(token.actor);
   await foundry.applications.api.DialogV2.prompt({window:{title:"Rescue from Sophia's Bedroom"},
    content:"<p>The bedroom is sealed. The original iron key can release the captive without forcing the door.</p>",
    ok:{label:eligible?"Unlock for Captive":"Close",callback:async()=>{
     if(!eligible)return true;const gm=game.users.activeGM;if(!gm?.active)return false;
     await ChatMessage.create({content:"<p>You use the original iron key.</p>",whisper:[gm.id,game.user.id],
      flags:{[NS]:{cavSophiaKeyRescueRequest:{version:1,action:"key-rescue",sceneId:GALLERY,regionId:DOOR,tokenId:token.id}}}});
     return true;
    }},rejectClose:false});
  }catch(e){console.error("[CAV Sophia] rescue click failed",e)}finally{globalThis[tag+"_busy"]=false}
 };
 canvas.stage.on("pointertap",h);globalThis[tag]={handler:h};
}
