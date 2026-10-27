// Cabin in the Ashen Veil: read-only original Donovan 587 Crank recovery diagnostic.
// NEVER automatically replay a reserved Item award, Item deletion, or water operation.
import {evaluateSluiceRecordedPrestate} from "./studio-cav-water-state.js";

const NS="dicebox-campaign-helper";
const SOURCE="Item.g3VYdgc1qkgkHGvn";
const BOX_SCENE="CAVEXT03Scene001",BOX_REGION="CAVEXT03BOXREG01";
const POND_SCENE="CAVEXT02Scene001",SLUICE_REGION="CAVEXT02SLUICE01";
const NOTE_SCENE="CAVHG05Scene0001",NOTE_REGION="CAVB3E32BD6B01BD";
const result=(status,requiresGM=true,detail=null)=>({status,requiresGM,detail});

/**
 * Pure verification of the existing source records and Item provenance.
 * All "reserved" / inconsistent outcomes require manual GM inspection.
 * This function never returns a mutation plan or replay instructions.
 */
export function assessCavCrankReconciliation({
 claim=null,fitting=null,water=null,transaction=null,items=[],
 boxUuid=null,noteUuid=null,sourceVerified=true
}={}){
 if(!sourceVerified||typeof boxUuid!=="string"||!boxUuid||
    typeof noteUuid!=="string"||!noteUuid)return result("source-documents-unverified");
 if(!Array.isArray(items))return result("inventory-evidence-invalid");
 if(items.length>1)return result("duplicate-tagged-cranks",true,{itemCount:items.length});
 if(items.some(i=>i?.sourceUuid!==SOURCE||i?.boxRegionUuid!==boxUuid||
   i?.noteUuid!==noteUuid||i?.name!=="Sluice Crank"||i?.type!=="loot"||
   Number(i?.quantity)!==1||!i?.id||!i?.actorId))
   return result("item-provenance-conflict");
 const item=items[0]??null;
 if(!claim&&!fitting&&!water&&!transaction&&!item)return result("not-claimed",false);
 if(!claim&&item)return result("tagged-item-without-claim");
 if(!claim)return result("world-state-without-claim");
 if(claim?.sourceUuid!==SOURCE||!claim.actorId)return result("claim-provenance-conflict");
 if(claim.status==="reserved"){
   // There is no safe automatic distinction between an unstarted create and a
   // create which succeeded but whose final ledger write was interrupted.
   if(fitting||water||transaction)return result("reserved-claim-with-downstream-state");
   return result(item?"reserved-award-item-visible":"reserved-award-item-not-found");
 }
 if(claim.status!=="done")return result("claim-state-unrecognized");
 if(!claim.embeddedItemId)return result("completed-claim-item-id-missing");
 if(fitting?.status==="reserved"){
   if(fitting.sourceUuid!==SOURCE||fitting.actorId!==claim.actorId||
      fitting.actorItemId!==claim.embeddedItemId||
      fitting.boxRegionUuid!==boxUuid)return result("fit-reservation-provenance-conflict");
   return result(item?"reserved-fit-item-visible":"reserved-fit-item-not-found");
 }
 if(!fitting){
   if(water||transaction)return result("water-before-crank-install");
   if(!item)return result("claimed-crank-item-not-found");
   if(item.id!==claim.embeddedItemId||item.actorId!==claim.actorId)
      return result("claimed-item-identity-conflict");
   return result("claimed-crank-held",false);
 }
 if(fitting.status!=="done")return result("fit-state-unrecognized");
 if(fitting.sourceUuid!==SOURCE||fitting.actorId!==claim.actorId||
    fitting.consumedActorItemId!==claim.embeddedItemId||
    fitting.boxRegionUuid!==boxUuid)return result("fitted-crank-provenance-conflict");
 if(item)return result("fitted-crank-item-still-present");
 const proof=evaluateSluiceRecordedPrestate({crank:fitting,water,transaction});
 if(!proof.ready)return result("fitted-water-receipt-unverified",true,{reason:proof.reason});
 return result(proof.reason==="initial-full-stage"?"fitted-initial-stage-consistent":"fitted-committed-stage-consistent",false);
}

/** Elected-GM only, no ChatMessage, no flag, no Item or Scene writes. */
export function describeCavCrankReconciliationGM(){
 if(typeof game==="undefined"||!game.ready||
    game.world?.id!=="cabin-in-the-ashen-veil"||!game.user?.isGM||
    game.users.activeGM?.id!==game.user.id)return{status:"denied",requiresGM:true};
 const box=game.scenes.get(BOX_SCENE)?.regions.get(BOX_REGION);
 const note=game.scenes.get(NOTE_SCENE)?.regions.get(NOTE_REGION);
 const sluice=game.scenes.get(POND_SCENE)?.regions.get(SLUICE_REGION);
 const original=game.items.get("g3VYdgc1qkgkHGvn");
 const boxes=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>{
  const sourceUuid=i.getFlag(NS,"cavDonovanCrankSourceUuid");
  const regionUuid=i.getFlag(NS,"cavDonovanCrankRegionUuid");
  if(!sourceUuid&&!regionUuid)return[];
  return[{actorId:a.id,id:i.id,name:i.name,type:i.type,quantity:i.system?.quantity,
   sourceUuid,boxRegionUuid:regionUuid,noteUuid:i.getFlag(NS,"cavDonovanCrankStudyNoteUuid")}];
 }));
 const claim=box?.getFlag(NS,"cavDonovan587LockboxClaim")??null;
 const fitting=sluice?.getFlag(NS,"cavSluiceCrankInstall")??null;
 const water=sluice?.getFlag(NS,"cavPondBathWaterState")??null;
 const transaction=sluice?.getFlag(NS,"cavSluiceStageTransaction")??null;
 const assessment=assessCavCrankReconciliation({
  claim,fitting,water,transaction,items:boxes,boxUuid:box?.uuid,
  noteUuid:note?.uuid,sourceVerified:original?.uuid===SOURCE&&
    original.name==="Sluice Crank"&&original.type==="loot"&&!!sluice
 });
 return{...assessment,version:1,world:game.world.id,electedGM:true,
  sourceUuid:SOURCE,boxUuid:box?.uuid??null,noteUuid:note?.uuid??null,
  claimStatus:claim?.status??null,fittingStatus:fitting?.status??null,
  waterStatus:water?.status??null,transactionStatus:transaction?.status??null,
  taggedItemCount:boxes.length,
  taggedItemRefs:boxes.map(i=>({actorId:i.actorId,itemId:i.id}))};
}
