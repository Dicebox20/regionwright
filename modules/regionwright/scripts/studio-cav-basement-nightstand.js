import {assessCavSuccessorPickup,assessCavNightstandRepairProof} from "./studio-cav-successor-pickup-proof.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const FOYER="CAVHG02Scene0001",FREG="CAVFOYERBASEDR01",FPORT="CAVFOYERBASPORT1";
const BASE="G6NMonfCwMvNzipL",ARRIVAL="CAVB9C0F653A2A6F",FOYER_RETURN="CAVFOYERBASEAR01";
const PARENTS="CAVHU04Scene0001",NREG="CAVPARENTNIGHT01";
const WEATHER="Item.CAVWEATHERKEY001",WEATHER_ORIGIN="Scene.CAVEXT02Scene001.Region.CAVPONDWEATHER01";
const DRIVER="Item.CAVBATHSCREW0001",DRIVER_ORIGIN="Scene.8yLMRDvxyw58dydh.Region.CAVBATHSCRDRY001";
const HANDLE="Item.nRVZJL9JOwEwfnLq";
const KEY_FLAG="cavWeatheredBasementUnlocked",REPAIR="cavNightstandRepaired",CLAIM="cavNightstandHandleClaim";
const HOOK="__CAV_BASEMENT_NIGHTSTAND_GM_SERVICE_v001",LOCK="__CAV_BASEMENT_NIGHTSTAND_GM_BUSY_v001";
const ART="worlds/cabin-in-the-ashen-veil/assets/puzzle-closeups/cav-parents-nightstand-owner-map-crop-20261026.png";
const ready=()=>game?.ready===true&&game.world?.id===WORLD;
const elected=()=>ready()&&game.user?.isGM===true&&game.users.activeGM?.id===game.user.id;
export const basementDecision=(ledger,hasKey)=>ledger?.status==="done"?"unlocked":ledger?.status==="reserved"?"reconcile":hasKey?"ready":"locked";
export const nightstandStage=(repair,claim)=>claim?.status==="done"?"empty":claim?.status==="reserved"||repair?.status==="reserved"?"reconcile":repair?.status==="done"?"handle":"repair";
function context(uid,sceneId,regionId,tokenId){
 const user=game.users.get(uid),scene=game.scenes.get(sceneId),region=scene?.regions.get(regionId),token=scene?.tokens.get(tokenId),actor=token?.actor;
 if(!user?.active||user.isGM||!token||token.hidden||actor?.type!=="character"||!actor.testUserPermission(user,"OWNER")||!region)return null;
 const pt={x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};
 if(!region.testPoint(pt))return null;
 return{user,scene,region,token,actor};
}
function exactItem(actor,uuid,name,flag,origin){
 const kind=uuid===WEATHER?"weather":uuid===DRIVER?"screwdriver":null;
 if(!kind)return null;
 const ids=origin.split(".");
 const region=game.scenes.get(ids[1])?.regions.get(ids[3]);
 const source=game.items.get(uuid.split(".")[1]);
 const items=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>{
  const id=i.getFlag(NS,"cavDrainedPickupSourceUuid"),special=i.getFlag(NS,flag);
  if(id!==uuid&&special!==uuid)return[];
  return[{actorId:a.id,id:i.id,name:i.name,type:i.type,quantity:i.system?.quantity,
   sourceUuid:id,originUuid:i.getFlag(NS,"cavDrainedPickupRegionUuid"),markerUuid:special}];
 }));
 const proof=assessCavSuccessorPickup({
  kind,source:source&&{uuid:source.uuid,name:source.name,type:source.type,quantity:source.system?.quantity},
  regionUuid:region?.uuid,claim:region?.getFlag(NS,"cavDrainedPickupClaim"),
  actorId:actor?.id,items
 });
 return proof.ready?actor.items.get(proof.itemId):null;
}
async function openBasement(req,uid){
 if(req?.version!==1||req.action!=="unlock"||req.sceneId!==FOYER||req.regionId!==FREG)return "denied";
 const c=context(uid,FOYER,FREG,req.tokenId);if(!c)return "denied";
 const portal=c.region.behaviors.get(FPORT);
 if(!portal||portal.type!=="teleportToken"||portal.system.destinations.size!==1||
 !portal.system.destinations.has("Scene."+BASE+".Region."+ARRIVAL))return "reconcile";
 const status=basementDecision(c.region.getFlag(NS,KEY_FLAG),!!exactItem(c.actor,WEATHER,"Weathered Key","cavWeatheredKeySourceUuid",WEATHER_ORIGIN));
 if(status!=="ready")return status;
 if(!portal.disabled)return "reconcile";
 await c.region.setFlag(NS,KEY_FLAG,{status:"reserved",actorId:c.actor.id,tokenId:c.token.id,keySource:WEATHER,origin:WEATHER_ORIGIN});
 await c.region.updateEmbeddedDocuments("RegionBehavior",[{_id:portal.id,disabled:false}]);
 if(c.region.behaviors.get(FPORT)?.disabled!==false)throw Error("Basement portal update uncertain");
 await c.region.setFlag(NS,KEY_FLAG,{status:"done",actorId:c.actor.id,keySource:WEATHER,portal:FPORT});
 return "unlocked";
}
async function handleNightstand(req,uid){
 if(req?.version!==1||!["repair","claim"].includes(req.action)||req.sceneId!==PARENTS||req.regionId!==NREG)return "denied";
 const c=context(uid,PARENTS,NREG,req.tokenId);if(!c)return "denied";
 const repair=c.region.getFlag(NS,REPAIR),claim=c.region.getFlag(NS,CLAIM);
 if(req.action==="repair"){
  if(repair?.status==="done")return "already";
  if(repair)return "reconcile";
  const tool=exactItem(c.actor,DRIVER,"Screwdriver","cavBathScrewdriverSourceUuid",DRIVER_ORIGIN);
  if(!tool)return "need-tool";
  // Physical screwdriver persists as a real reusable hand tool.
  await c.region.setFlag(NS,REPAIR,{status:"reserved",actorId:c.actor.id,tokenId:c.token.id,toolSourceUuid:DRIVER});
  await c.region.setFlag(NS,REPAIR,{status:"done",actorId:c.actor.id,toolSourceUuid:DRIVER});
  return "repaired";
 }
  if(repair?.status!=="done")return "blocked";
  const driverPickup=game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("CAVBATHSCRDRY001")?.getFlag(NS,"cavDrainedPickupClaim");
  if(!assessCavNightstandRepairProof({repair,screwdriverClaim:driverPickup}).ready)return "reconcile";
 if(claim?.status==="done")return "already";
 if(claim)return "reconcile";
 const item=game.items.get("nRVZJL9JOwEwfnLq");
 if(!item||item.uuid!==HANDLE||item.name!=="Aqueduct Gate Handle"||item.type!=="loot")return "reconcile";
 if(game.actors.some(a=>a.items.some(i=>i.getFlag(NS,"cavGateHandleSourceUuid")===HANDLE&&i.getFlag(NS,"cavGateHandleSourceRegionUuid")===c.region.uuid)))return "reconcile";
 await c.region.setFlag(NS,CLAIM,{status:"reserved",actorId:c.actor.id,sourceUuid:HANDLE});
 const copy=item.toObject();delete copy._id;
 copy.flags={...copy.flags,[NS]:{...copy.flags?.[NS],cavGateHandleSourceUuid:HANDLE,cavGateHandleSourceRegionUuid:c.region.uuid,cavParentsNightstandSource: "repaired-drawer"}};
 const made=await c.actor.createEmbeddedDocuments("Item",[copy]);
 if(made.length!==1)throw Error("Gate Handle creation uncertain");
 await c.region.setFlag(NS,CLAIM,{status:"done",actorId:c.actor.id,sourceUuid:HANDLE,embeddedItemId:made[0].id});
 return "claimed";
}
export function installCabinBasementNightstandGMService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const handler=async(m,opt,authorId)=>{
  if(!elected())return;
  const req=m?.getFlag?.(NS,"cavBasementNightstandRequest");if(!req)return;
  const user=m.user;if(!user||user.id!==authorId||user.isGM||!user.active||globalThis[LOCK])return;
  globalThis[LOCK]=true;let result="reconcile";
  try{result=req.action==="unlock"?await openBasement(req,authorId):await handleNightstand(req,authorId)}
  catch(e){console.error("[CAV] Basement/Nightstand reserved action uncertain",e)}
  finally{globalThis[LOCK]=false}
  const feedback={unlocked:"The weathered key fits. The cellar latch releases; the stairway opens.",
   locked:"The cellar gate requires its original Weathered Key.",denied:"Approach the fixture with an owned character.",
   needTool:"The broken drawer needs the Screwdriver from the drained Bathhouse.",
   repaired:"The screwdriver frees the seized mechanism. Something heavy is tucked inside the drawer.",
   blocked:"The drawer is still stuck.",claimed:"You take the Aqueduct Gate Handle from the repaired drawer.",
   already:"This fixture has already yielded its secret.",reconcile:"A Gamemaster must reconcile the saved fixture state."};
  try{await ChatMessage.create({speaker:{alias:req.action==="unlock"?"Basement Stairwell":"Parents' Nightstand"},whisper:[authorId],content:"<p>"+(feedback[result]||"Nothing changes.")+"</p>"});}catch(e){console.warn("[CAV] Text feedback unavailable",e)}
 };
 globalThis[HOOK]={hookId:Hooks.on("createChatMessage",handler),version:1};return true;
}
export async function handleCabinBasementNightstandRegionEvent(region,event){
 if(!ready()||game.user?.isGM||!canvas?.ready)return;
 const role=region?.parent?.id===FOYER&&region.id===FREG?"basement":region?.parent?.id===PARENTS&&region.id===NREG?"nightstand":null;
 if(!role)return;
 const key="__CAV_BASE_NIGHT_POINTER_"+region.id,prior=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){if(prior?.handler)canvas.stage.off("pointertap",prior.handler);delete globalThis[key];return}
 if(event?.name!=="behaviorViewed")return;
 if(prior?.handler)canvas.stage.off("pointertap",prior.handler);
 const handler=async event=>{
  if(!canvas?.ready||canvas.scene?.id!==region.parent.id||(event.button!==undefined&&event.button!==0))return;
  const p=canvas.stage.toLocal(event.global);if(!region.testPoint({x:p.x,y:p.y,elevation:0})||globalThis[key+"_busy"])return;
  globalThis[key+"_busy"]=true;
  try{
   const chosen=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"));
   const token=chosen.length===1?chosen[0].document:null;
   const c=token&&context(game.user.id,region.parent.id,region.id,token.id);
   const stage=role==="basement"?basementDecision(region.getFlag(NS,KEY_FLAG),!!c&&!!exactItem(c.actor,WEATHER,"Weathered Key","cavWeatheredKeySourceUuid",WEATHER_ORIGIN)):
    nightstandStage(region.getFlag(NS,REPAIR),region.getFlag(NS,CLAIM));
   let action=null,label="Close",msg="";
   if(role==="basement"){
    msg=stage==="unlocked"?"The stairwell into the basement stands unlocked.":stage==="ready"?"The heavy, corroded lock bears the familiar teeth of your Weathered Key.":"A rusted latch blocks the descent into the basement.";
    if(stage==="ready"&&c){action="unlock";label="Use Weathered Key"}
   }else{
    msg=stage==="empty"?"The repaired drawer is empty.":stage==="handle"?"The freed drawer now exposes a heavy gate handle.":stage==="reconcile"?"The stuck mechanism needs Gamemaster attention.":"A nightstand drawer has jammed badly; its fastener could be freed with a narrow screwdriver.";
    if(c&&stage==="repair"&&exactItem(c.actor,DRIVER,"Screwdriver","cavBathScrewdriverSourceUuid",DRIVER_ORIGIN)){action="repair";label="Repair with Screwdriver"}
    else if(c&&stage==="handle"&&assessCavNightstandRepairProof({
      repair:region.getFlag(NS,REPAIR),
      screwdriverClaim:game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("CAVBATHSCRDRY001")?.getFlag(NS,"cavDrainedPickupClaim")
     }).ready){action="claim";label="Take Gate Handle"}
   }
   if(!c)msg+=" Select your character and stand beside the fixture.";
   const content=(role==="nightstand"?'<figure style="max-width:540px;margin:auto"><img alt="Nightstand detail from approved Parents Bedroom" src="'+ART+'" style="max-width:100%;display:block"></figure>':"")+"<p>"+msg+"</p>";
   await foundry.applications.api.DialogV2.prompt({window:{title:role==="basement"?"Basement Stairwell":"Broken Parents' Nightstand"},content,ok:{label,callback:async()=>{
    if(!action)return true;const gm=game.users.activeGM;if(!gm?.active)return false;
    await ChatMessage.create({content:"<p>You inspect the old mechanism.</p>",whisper:[gm.id,game.user.id],
     flags:{[NS]:{cavBasementNightstandRequest:{version:1,action,sceneId:region.parent.id,regionId:region.id,tokenId:token.id}}}});
    return true;
   }},rejectClose:false});
  }catch(e){console.error("[CAV] Basement/nightstand interaction unavailable",e)}
  finally{globalThis[key+"_busy"]=false}
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}

