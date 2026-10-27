import {assessCavAqueductPartProof} from "./studio-cav-aqueduct-part-proof.js";
import {assessCavDrainedPickupWaterReady} from "./studio-cav-drained-pickups.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const POND="CAVEXT02Scene001",REG="CAVPONDAQGATE001",PORT="CAVPONDAQPORT001",AQ="CAVAQ01Scene0001";
const GEAR="Item.wDKqETOykWEdKF1Z",GEAR_ORIGIN="Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001";
const HANDLE="Item.nRVZJL9JOwEwfnLq",HANDLE_ORIGIN="Scene.CAVHU04Scene0001.Region.CAVPARENTNIGHT01";
const GEAR_FLAG="cavAqueductGearInstalled",HANDLE_FLAG="cavAqueductHandleInstalled",READY="cavAqueductGateMechanicalReady";
const HOOK="__CAV_AQUEDUCT_GATE_GM_SERVICE_v001",LOCK="__CAV_AQUEDUCT_GATE_GM_BUSY_v001";
const ART="worlds/cabin-in-the-ashen-veil/assets/puzzle-closeups/cav-aqueduct-gate-owner-map-crop-20261026.png";
export const aqueductGearStage=(g,h)=>g?.status==="reserved"||h?.status==="reserved"?"reconcile":g?.status==="done"&&h?.status==="done"?"both":g?.status==="done"?"handle":h?.status==="done"?"gear":"either";
export function nextAqueductPart(stage,hasGear,hasHandle){
 if(stage==="gear")return hasHandle?"handle":null;
 if(stage==="handle")return hasGear?"gear":null;
 if(stage==="either")return hasGear?"gear":hasHandle?"handle":null;
 return null;
}
function elected(){return game?.ready&&game.world?.id===WORLD&&game.user?.isGM&&game.users.activeGM?.id===game.user.id;}
function tokenCenter(t,scene){return{x:t.x+t.width*scene.grid.size/2,y:t.y+t.height*scene.grid.size/2,elevation:0};}
function sourceCopy(actor,part){
 const uuid=part==="gear"?GEAR:HANDLE,origin=part==="gear"?GEAR_ORIGIN:HANDLE_ORIGIN;
 const flag=part==="gear"?"cavRoofGearSourceUuid":"cavGateHandleSourceUuid";
 const srcRegionFlag=part==="gear"?"cavRoofGearRegionUuid":"cavGateHandleSourceRegionUuid";
 const extraFlag=part==="gear"?"cavRoofGearPuzzle":"cavParentsNightstandSource";
 const ids=origin.split("."),reg=game.scenes.get(ids[1])?.regions.get(ids[3]);
 const item=game.items.get(uuid.slice(5));
 const all=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>{
  const src=i.getFlag(NS,flag),orig=i.getFlag(NS,srcRegionFlag);
  if(src!==uuid&&orig!==origin)return[];
  return[{actorId:a.id,id:i.id,name:i.name,type:i.type,quantity:i.system?.quantity,
   sourceUuid:src,originUuid:orig,marker:i.getFlag(NS,extraFlag)}];
 }));
 const screw=game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("CAVBATHSCRDRY001")?.getFlag(NS,"cavDrainedPickupClaim");
 const repair=game.scenes.get("CAVHU04Scene0001")?.regions.get("CAVPARENTNIGHT01")?.getFlag(NS,"cavNightstandRepaired");
 const claim=reg?.getFlag(NS,part==="gear"?"cavRoofClockClaim":"cavNightstandHandleClaim");
 const proof=assessCavAqueductPartProof({
  part,claim,regionUuid:reg?.uuid,actorId:actor?.id,
  source:item&&{uuid:item.uuid,name:item.name,type:item.type,quantity:item.system?.quantity},
  items:all,nightstandRepair:repair,screwdriverClaim:screw
 });
 return proof.ready?actor.items.get(proof.itemId):null;
}
function gateWaterDrained(){
 const pond=game.scenes.get(POND),gate=pond?.regions.get("CAVEXT02SLUICE01");
 const trail=game.scenes.get("CAVTRAILScene001")?.regions.get("13g6uK1QrR9PFOzA")?.behaviors.get("ZbrhX0nnaLvLA5Zh");
 const proof=assessCavDrainedPickupWaterReady({
  crank:gate?.getFlag(NS,"cavSluiceCrankInstall"),water:gate?.getFlag(NS,"cavPondBathWaterState"),
  transaction:gate?.getFlag(NS,"cavSluiceStageTransaction"),pondBackground:pond?.background?.src,
  trailPortal:trail&&{id:trail.id,type:trail.type,disabled:trail.disabled,destinations:[...(trail.system?.destinations??[])]},
  dryBathLandingExists:!!game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("R2Pg9eHODtb1C1Yk")
 });
 return proof.ready;
}
async function installPart(req,uid){
 if(!elected()||req?.version!==1||!["gear","handle"].includes(req.part)||
 req.action!=="install"||req.sceneId!==POND||req.regionId!==REG)return "denied";
 const s=game.scenes.get(POND),r=s?.regions.get(REG),user=game.users.get(uid),token=s?.tokens.get(req.tokenId),actor=token?.actor;
 if(!r||!user?.active||user.isGM||!token||token.hidden||actor?.type!=="character"||
 !actor.testUserPermission(user,"OWNER")||!r.testPoint(tokenCenter(token,s)))return "denied";
 if(!gateWaterDrained())return "water";
 const ledger=req.part==="gear"?GEAR_FLAG:HANDLE_FLAG;
 const old=r.getFlag(NS,ledger);if(old?.status==="done")return "already";if(old)return "reconcile";
 const original=sourceCopy(actor,req.part);if(!original)return "missing";
 const srcId=req.part==="gear"?GEAR:HANDLE,src=game.items.get(srcId.slice(5));
 if(!src||src.uuid!==srcId||src.name!==(req.part==="gear"?"Replacement Gear":"Aqueduct Gate Handle"))return "reconcile";
 if(r.getFlag(NS,READY)?.status==="ready")return "already";
 await r.setFlag(NS,ledger,{status:"reserved",actorId:actor.id,tokenId:token.id,sourceUuid:srcId,actorItemId:original.id});
 await actor.deleteEmbeddedDocuments("Item",[original.id]);
 if(actor.items.has(original.id))throw Error("Installed Aqueduct part still in actor inventory; reserved ledger retained");
 await r.setFlag(NS,ledger,{status:"done",actorId:actor.id,sourceUuid:srcId,consumedActorItemId:original.id});
 if(r.getFlag(NS,GEAR_FLAG)?.status==="done"&&r.getFlag(NS,HANDLE_FLAG)?.status==="done"){
  // Mechanical progression only. Traversal requires a separately audited Aqueduct return route.
  await r.setFlag(NS,READY,{status:"ready",version:1,portal:PORT,traversalEnabled:false});
 }
 return "installed";
}
export function installCabinAqueductGateGMService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const fn=async(message,options,author)=>{
  if(!elected())return;
  const req=message?.getFlag?.(NS,"cavAqueductPartRequest");if(!req)return;
  const user=message.user;if(!user||user.id!==author||user.isGM||!user.active||globalThis[LOCK])return;
  globalThis[LOCK]=true;let result="reconcile";
  try{result=await installPart(req,author);}catch(e){console.error("[CAV Aqueduct] reserved item installation uncertain",e)}
  finally{globalThis[LOCK]=false}
  const words={installed:"The original "+(req.part==="gear"?"gear":"handle")+" fits into the ancient gate housing.",
   water:"The gate's fixtures remain inaccessible beneath the pond. Drain the water first.",
   missing:"This fitting requires its original recovered mechanical part.",
   already:"That part has already been fitted.",
   denied:"Approach the exposed gate with your own character.",
   reconcile:"The mechanism requires Gamemaster reconciliation."};
  try{await ChatMessage.create({speaker:{alias:"Aqueduct Gate"},whisper:[author],content:"<p>"+(words[result]||"The gate does not respond.")+"</p>"});}catch(e){}
 };
 globalThis[HOOK]={hookId:Hooks.on("createChatMessage",fn),version:1};return true;
}
export async function handleCabinAqueductGateRegionEvent(region,event){
 if(!game?.ready||game.world?.id!==WORLD||game.user?.isGM||region?.parent?.id!==POND||region.id!==REG||!canvas?.ready)return;
 const key="__CAV_AQUEDUCT_GATE_POINTER_v001",prev=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){if(prev?.handler)canvas.stage.off("pointertap",prev.handler);delete globalThis[key];return}
 if(event?.name!=="behaviorViewed")return;
 if(prev?.handler)canvas.stage.off("pointertap",prev.handler);
 const handler=async ev=>{
  if(!canvas?.ready||canvas.scene?.id!==POND||(ev.button!==undefined&&ev.button!==0))return;
  const pos=canvas.stage.toLocal(ev.global);if(!region.testPoint({x:pos.x,y:pos.y,elevation:0})||globalThis[key+"_busy"])return;
  globalThis[key+"_busy"]=true;
  try{
   const owned=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"));
   const token=owned.length===1?owned[0].document:null,actor=token?.actor,near=!!token&&region.testPoint(tokenCenter(token,canvas.scene));
    const water=gateWaterDrained();
   const stage=aqueductGearStage(region.getFlag(NS,GEAR_FLAG),region.getFlag(NS,HANDLE_FLAG));
   const next=near&&water?nextAqueductPart(stage,!!sourceCopy(actor,"gear"),!!sourceCopy(actor,"handle")):null;
   const label=next==="gear"?"Install Replacement Gear":next==="handle"?"Install Gate Handle":"Close";
   const description=!water?"The gate remains mostly submerged; its metal sockets are out of reach.":stage==="both"?
     "Both original parts are seated. The immense gate begins to unlock; the inner passage awaits its safety interlocks.":
     stage==="reconcile"?"The mechanism needs the Gamemaster's attention.":"Two separate sockets await a machined gear and a heavy turning handle.";
   await foundry.applications.api.DialogV2.prompt({window:{title:"Aqueduct Gate"},content:'<figure style="max-width:600px;margin:auto"><img alt="Gate cropped from owner-approved pond map" src="'+ART+'" style="display:block;max-width:100%"><figcaption>'+description+'</figcaption></figure>',
    ok:{label,callback:async()=>{if(!next)return true;const gm=game.users.activeGM;if(!gm?.active)return false;
     await ChatMessage.create({content:"<p>You seat the mechanical part in the Aqueduct gate.</p>",whisper:[gm.id,game.user.id],
      flags:{[NS]:{cavAqueductPartRequest:{version:1,action:"install",part:next,sceneId:POND,regionId:REG,tokenId:token.id}}}});
     return true;
    }},rejectClose:false});
  }catch(e){console.error("[CAV Aqueduct] gate interaction failed",e)}
  finally{globalThis[key+"_busy"]=false}
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}

