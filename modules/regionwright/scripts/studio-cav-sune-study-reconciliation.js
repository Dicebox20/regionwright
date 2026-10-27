// Cabin in the Ashen Veil — Sune rewards / Study Door read-only GM reconciliation.
// This file never mutates world documents, replays an item award, or activates a portal.
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const GROVE_SCENE="CAVSG05Scene0001",GROVE_REGION="L15BdSqcbCOLPnIN";
const DOOR_SCENE="CAVHG06GreatRoom",DOOR_REGION="CAV06R0000000003";
const LANDING_SCENE="CAVHG05Scene0001",LANDING_REGION="CAVB9AA3D7BE9560";
const ORIGIN="Scene."+GROVE_SCENE+".Region."+GROVE_REGION;
const DOOR_UUID="Scene."+DOOR_SCENE+".Region."+DOOR_REGION;
const KEY="Item.CAVSTUDYBRASS001",GOLD="Item.CAVSUNEGPBAG0001";
const DEST="Scene."+LANDING_SCENE+".Region."+LANDING_REGION;
const PORTAL_ID="CAVHG06STUDYT001";
const result=(status,requiresGM=false)=>({status,requiresGM});
const nonempty=x=>typeof x==="string"&&x.length>0;

function rewardProof(type,claim,items,source){
 const isKey=type==="key",expected=isKey?KEY:GOLD,prefix=type+"-";
 const name=isKey?"Brass Key":"Sune's Cloth Bag (1,000 gp)",kind=isKey?"loot":"container";
 if(source?.uuid!==expected||source?.name!==name||source?.type!==kind||
   (isKey?Number(source?.quantity)!==1:Number(source?.gp)!==1000))
  return result(prefix+"source-unverified",true);
 if(!Array.isArray(items))return result(prefix+"inventory-unverified",true);
 if(items.length>1)return result(prefix+"duplicate-tagged-items",true);
 const i=items[0]??null;
 if(i&&(i.sourceUuid!==expected||i.regionUuid!==ORIGIN||i.reward!==type||
  i.name!==name||i.type!==kind||(isKey?Number(i.quantity)!==1:Number(i.gp)!==1000)||
  (isKey&&(i.keySource!==KEY||i.keyRegion!==ORIGIN))||!nonempty(i.actorId)||!nonempty(i.id)))
  return result(prefix+"item-provenance-conflict",true);
 if(claim==null)return result(prefix+(i?"item-without-ledger":"unclaimed"),!!i);
 if(claim.sourceUuid!==expected||!nonempty(claim.actorId))return result(prefix+"ledger-provenance-conflict",true);
 if(claim.status==="reserved")return result(prefix+(i?"reserved-item-visible":"reserved-item-not-found"),true);
 if(claim.status!=="done")return result(prefix+"ledger-status-unknown",true);
 if(!nonempty(claim.embeddedItemId))return result(prefix+"done-item-id-missing",true);
 if(!i)return result(prefix+"done-item-not-found",true);
 if(i.actorId!==claim.actorId||i.id!==claim.embeddedItemId)return result(prefix+"done-item-identity-conflict",true);
 return result(prefix+"award-consistent");
}

/** Pure evidence classification. Never a repair or mutation plan. */
export function assessCavSuneStudyReconciliation({
 groveUuid=null,doorUuid=null,goldSource=null,keySource=null,
 goldClaim=null,keyClaim=null,doorLedger=null,items=[],portal=null,landingExists=false
}={}){
 const bad=(status)=>({status,requiresGM:true,gold:result("unverified",true),
   key:result("unverified",true),door:result("unverified",true)});
 if(groveUuid!==ORIGIN||doorUuid!==DOOR_UUID)return bad("original-regions-unverified");
 if(!Array.isArray(items))return bad("original-items-unverified");
 const unknown=items.filter(i=>i?.reward!=="gold"&&i?.reward!=="key");
 const gold=rewardProof("gold",goldClaim,items.filter(i=>i?.reward==="gold"),goldSource);
 const key=rewardProof("key",keyClaim,items.filter(i=>i?.reward==="key"),keySource);
 const topology=!!landingExists&&portal?.id===PORTAL_ID&&portal?.type==="teleportToken"&&
  Array.isArray(portal?.destinations)&&portal.destinations.length===1&&portal.destinations[0]===DEST;
 let door;
 if(!topology)door=result("study-portal-topology-unverified",true);
 else if(doorLedger==null)
  door=portal.disabled===true?result("study-door-locked"):result("study-portal-enabled-without-ledger",true);
 else if(doorLedger.status==="reserved")
  door=result(portal.disabled===true?"study-unlock-reserved-portal-locked":"study-unlock-reserved-portal-enabled",true);
 else if(doorLedger.status==="done"){
  if(portal.disabled!==false)door=result("study-done-but-portal-locked",true);
  else if(!nonempty(doorLedger.actorId)||!nonempty(doorLedger.tokenId)||
   doorLedger.keySource!==KEY||doorLedger.portal!==PORTAL_ID||
   keyClaim?.status!=="done"||doorLedger.actorId!==keyClaim.actorId)
   door=result("study-done-ledger-provenance-conflict",true);
  else door=result("study-unlocked-record-consistent");
 }else door=result("study-ledger-status-unknown",true);
 const stageOrderConflict=(keyClaim!=null&&goldClaim?.status!=="done")||
  (doorLedger!=null&&keyClaim?.status!=="done");
 const requiresGM=!!(unknown.length||stageOrderConflict||gold.requiresGM||key.requiresGM||door.requiresGM);
 const status=requiresGM?"reconciliation-required":
  door.status==="study-unlocked-record-consistent"?"study-door-unlocked":
  gold.status==="gold-unclaimed"&&key.status==="key-unclaimed"?"not-started":
  key.status==="key-award-consistent"?"key-awarded-door-locked":"sune-rewards-in-progress";
 return {status,requiresGM,gold,key,door,evidence:{
   taggedItemCount:items.length,unexpectedTaggedItems:unknown.length,stageOrderConflict}};
}

/** Elected GM in exact world only. Reads original world documents, returns receipt. */
export function describeCavSuneStudyReconciliationGM(){
 if(typeof game==="undefined"||!game.ready||game.world?.id!==WORLD||
  !game.user?.isGM||game.users.activeGM?.id!==game.user.id)
  return{status:"denied",requiresGM:true};
 const grove=game.scenes.get(GROVE_SCENE)?.regions.get(GROVE_REGION);
 const door=game.scenes.get(DOOR_SCENE)?.regions.get(DOOR_REGION);
 const goldSource=game.items.get("CAVSUNEGPBAG0001"),keySource=game.items.get("CAVSTUDYBRASS001");
 const portal=door?.behaviors.get(PORTAL_ID);
 const items=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>{
  const src=i.getFlag(NS,"cavSuneReliefSourceUuid");
  const origin=i.getFlag(NS,"cavSuneReliefRegionUuid");
  const reward=i.getFlag(NS,"cavSuneReliefReward");
  const key=i.getFlag(NS,"cavStudyKeySourceUuid");
  if(!src&&!origin&&!reward&&!key)return[];
  return[{actorId:a.id,id:i.id,name:i.name,type:i.type,
   quantity:i.system?.quantity,gp:i.system?.currency?.gp,
   sourceUuid:src,regionUuid:origin,reward,keySource:key,
   keyRegion:i.getFlag(NS,"cavStudyKeySourceRegionUuid")}];
 }));
 const goldClaim=grove?.getFlag(NS,"cavSuneGoldClaim")??null;
 const keyClaim=grove?.getFlag(NS,"cavSuneBrassKeyClaim")??null;
 const doorLedger=door?.getFlag(NS,"cavStudyDoorUnlocked")??null;
 const assessment=assessCavSuneStudyReconciliation({
  groveUuid:grove?.uuid,doorUuid:door?.uuid,goldClaim,keyClaim,doorLedger,items,
  goldSource:goldSource&&{uuid:goldSource.uuid,name:goldSource.name,type:goldSource.type,gp:goldSource.system?.currency?.gp},
  keySource:keySource&&{uuid:keySource.uuid,name:keySource.name,type:keySource.type,quantity:keySource.system?.quantity},
  portal:portal&&{id:portal.id,type:portal.type,disabled:portal.disabled,destinations:[...portal.system.destinations]},
  landingExists:!!game.scenes.get(LANDING_SCENE)?.regions.get(LANDING_REGION)
 });
 return {...assessment,version:1,world:WORLD,electedGM:true,
   originalGroveUuid:grove?.uuid??null,originalStudyDoorUuid:door?.uuid??null,
   goldClaimStatus:goldClaim?.status??null,keyClaimStatus:keyClaim?.status??null,
   studyDoorStatus:doorLedger?.status??null,portalDisabled:portal?.disabled??null,
   taggedItemRefs:items.map(i=>({actorId:i.actorId,itemId:i.id,reward:i.reward??null}))};
}
