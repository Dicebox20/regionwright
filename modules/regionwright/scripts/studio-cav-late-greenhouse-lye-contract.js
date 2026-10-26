// CAV L1-G: isolated pure Greenhouse LYE-ONLY production gate.
// The original generic ingredient engine stays untouched; this reuses its owner-
// amended single-lye predicate. No real-world chemical recipes or numerical ratios.
import {evaluateGreenhouseLyeUse} from "../../regionwright-puzzles-locks/scripts/ingredient-mixing-engine.js";
export const CAV_GREENHOUSE_LYE_VERSION = 1;
export const ORIGINAL_LYE_SOURCE_UUID = "Item.vDR4cJU35iODR6gh";
export const ORIGINAL_PLANT_KILLER_UUID = "Item.YNWpGEGB17mqDFWe";
const str=v=>typeof v==="string"&&v.trim().length>0;
const region=(v,id)=>str(id)&&str(v)&&v.startsWith("Scene."+id+".Region.")&&v.length>("Scene."+id+".Region.").length;
const trust=r=>r?.version===CAV_GREENHOUSE_LYE_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const interacting=r=>r?.explicitMixingLeverAction===true&&r?.activeNonGmOwnerVerified===true&&
 r?.ownedTokenAtGreenhouseStation===true&&str(r?.actorId)&&str(r?.tokenId)&&
 r?.greenhouseSceneVerified===true&&r?.greenhouseCanonCode==="EXT-06"&&
 r?.mixingRegionVerified===true&&region(r?.mixingRegionUuid,r?.greenhouseSceneId);
export function planGreenhouseLyeMix(r) {
 if(!trust(r))return {action:"deny",reason:"untrusted-readback"};
 if(!interacting(r))return {action:"deny",reason:"greenhouse-fixture-or-player-not-certified"};
 if(r.greenhouseProductionStatus==="reserved"||r.flaskRewardStatus==="reserved")
   return {action:"gm-review",reason:"reserved-greenhouse-production"};
 if(r.greenhouseProductionStatus==="done"&&r.flaskRewardStatus==="done")
   return {action:"no-op",reason:"plant-killer-already-made"};
 if(r.greenhouseProductionStatus!=="none"||r.flaskRewardStatus!=="none")
   return {action:"gm-review",reason:"partial-greenhouse-ledger"};
 // Waterworks state is independently confirmed and is NOT the Pond/Bath Sluice.
 // Veil gates source Lye pickup, not the operation of this machine itself.
 if(r.waterworksRestorationLedgerVerified!==true||
    r.waterworksRestoreStatus!=="done"||
    r.waterRestoredFromActualWaterworks!==true||
    r.sprinklerAlreadyAccessible!==true)
   return {action:"deny",reason:"genuine-waterworks-not-restored"};
 if(r.originalLyeSourceReverified!==true||r.expectedLyeSourceUuid!==ORIGINAL_LYE_SOURCE_UUID||
    r.actorCarryingAuthenticLye!==true||r.actorLyeSourceUuid!==ORIGINAL_LYE_SOURCE_UUID||
    r.actorLyeItemType!=="loot"||r.actorLyeAcquiredFromSoapCase!==true||
    r.lyeSoapCasePickupLedgerDone!==true||r.actorLyeQuantityPositive!==true||
    r.actorLyeOriginRegionVerified!==true)
   return {action:"deny",reason:"original-soap-room-quest-lye-required"};
 const result=evaluateGreenhouseLyeUse({waterRestored:r.waterRestoredFromActualWaterworks===true,lyeAvailable:r.actorLyeQuantityPositive===true});
 if(result.success!==true||result.requiredIngredient!=="lye")
   return {action:"deny",reason:"owner-lye-only-engine-gate-not-ready"};
 if(r.originalPlantKillerSourceReverified!==true||
    r.plantKillerSourceUuid!==ORIGINAL_PLANT_KILLER_UUID||
    r.plantKillerSourceName!=="Plant Killer"||
    r.plantKillerSourceType!=="loot"||
    r.worldwidePlantKillerRewardCopies!==0||
    r.greenhouseCanStageUniqueFlask!==true)
   return {action:"deny",reason:"original-once-only-flask-reward-not-certified"};
 // Adapter must reserve before producing one existing original quest item.
 // Lye consumption is UNDECIDED; do not consume item without owner approval.
 return {action:"gm-review-produce-single-plant-killer",requiredIngredient:"lye"};
}