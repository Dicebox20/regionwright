// Chat B L1-H pure review contracts. NO Foundry writes or native registration.
// Inputs must be independently certified by elected active GM from source docs.
// origin: elected-gm-readback is a descriptive label, NOT authentication.
export const DOCK_VERSION=1;
export const POND="CAVEXT02Scene001"; // Existing water-controller source
export const PLANT="Item.YNWpGEGB17mqDFWe"; // Oct24 original, current readback required
export const PRAYER="Item.GXLYq6Tf4OgPNbkU"; // Oct24 original
export const SUNE="Item.t9uCIpsKeSvtC31w"; // Oct24 original
const text=v=>typeof v==="string"&&v.trim().length>0;
const region=(v,s)=>text(s)&&text(v)&&v.startsWith("Scene."+s+".Region.")&&v.length>("Scene."+s+".Region.").length;
const trusted=r=>r?.version===DOCK_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const at=r=>trusted(r)&&r.sceneVerified===true&&text(r.sceneId)&&r.regionVerified===true&&
 region(r.regionUuid,r.sceneId)&&r.activeNonGMOwnerVerified===true&&r.tokenAtFixtureVerified===true&&
 r.explicitPlayerAction===true&&text(r.actorId)&&text(r.tokenId);
const water=r=>r.pondSceneId===POND&&r.canonicalPondBathStateVerified===true&&
 r.waterStageFromGmReadback===true&&r.normalizedPondWater==="full"&&
 r.normalizedBathWater==="full"&&r.sluiceStatus==="closed"&&
 r.noPendingSluiceTransition===true&&r.approvedPondFullArtVerified===true;

export function planThornDockClear(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r)||r.sceneId!==POND||r.originalThornFixtureVerified!==true||
    r.explicitPlantKillerUse!==true)
   return {action:"deny",reason:"not-original-pond-thorns"};
 if(r.thornLedger==="reserved")return {action:"gm-review",reason:"reserved-thorn"};
 if(r.thornLedger==="cleared"&&r.thornObstaclePresent===false)
   return {action:"no-op",reason:"already-cleared"};
 if(r.thornLedger==="cleared"&&r.thornObstaclePresent===true)
   return r.safeRehydrateClearVerified===true?
     {action:"gm-review-restore-removed-thorns",reason:"geometry-reloaded"}:
     {action:"gm-review",reason:"uncertain-clear-geometry"};
 if(r.thornLedger!=="blocked"||r.thornObstaclePresent!==true)
   return {action:"gm-review",reason:"uncertain-thorn-ledger"};
 if(r.originalPlantItemReverified!==true||r.expectedPlantSource!==PLANT||
    r.actorPlantSource!==PLANT||r.actorCarriesPlantItem!==true||
    r.actorPlantName!=="Plant Killer"||r.actorPlantType!=="loot"||
    r.greenhouseProductionClaimDone!==true||r.greenhouseCustodyVerified!==true||
    r.singleScriptedUseAvailable!==true||
    r.targetKind!=="designated-magical-thorn-dock"||
    r.notOrdinaryPlantsVerified!==true)
   return {action:"deny",reason:"original-item-or-target-not-certified"};
 return {action:"gm-review-clear-once",reason:"reserve-before-original-magical-thorn-effect"};
}
export function planRowboatToBoathouse(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r)||r.sceneId!==POND||r.explicitBoardBoat!==true||r.originalRowboatVerified!==true)
   return {action:"deny",reason:"not-original-rowboat"};
 if(!water(r))return {action:"deny",reason:"pond-not-authoritatively-full"};
 if(r.thornLedger!=="cleared"||r.thornObstaclePresent!==false)
   return {action:"deny",reason:"far-dock-still-blocked"};
 if(r.boatTransitLedger==="reserved")return {action:"gm-review",reason:"reserved-rowboat"};
 if(r.boatTransitLedger!=="ready")return {action:"gm-review",reason:"unknown-boat-ledger"};
 if(r.originalOarsVerified!==true||r.actorOarsProvenanceVerified!==true||
    r.portalPairVerified!==true||r.destinationBoathouseVerified!==true||
    r.safeLandingAndReturnVerified!==true||r.portalEnabledForFullStage!==true||
    r.noUnsafeOccupantsVerified!==true)
   return {action:"deny",reason:"unsafe-or-unverified-full-water-boat"};
 return {action:"gm-review-board-boat",reason:"full-pond-and-safe-dock"};
}
export function planBoathouseDevotionPickup(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r)||r.sceneId!==r.boathouseSceneId||r.boathouseSceneVerified!==true||
    r.arrivalByLegitimateBoatVerified!==true||r.explicitPickupPrayer!==true)
   return {action:"deny",reason:"not-original-boathouse-pickup"};
 if(r.prayerClaimLedger==="reserved")return {action:"gm-review",reason:"reserved-prayer"};
 if(r.prayerClaimLedger==="done")return {action:"no-op",reason:"prayer-already-claimed"};
 if(r.prayerClaimLedger!=="none")return {action:"gm-review",reason:"uncertain-prayer-ledger"};
 if(r.originalPrayerReverified!==true||r.prayerSource!==PRAYER||
    r.prayerName!=="Prayer of Devotion"||r.prayerType!=="loot"||
    r.fullReadableJournalVerified!==true||r.journalBoundToOriginalPrayer!==true||
    r.distinctFromProtectionVerified!==true||r.worldwidePrayerRewardCount!==0)
   return {action:"deny",reason:"original-devotion-prayer-not-certified"};
 return {action:"gm-review-grant-one-devotion-prayer",reason:"reserve-before-claim"};
}
export function planSuneDevotionHalf(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r)||r.studioCode!=="H-U07"||r.sceneId!=="CAVHU07Scene0001"||r.originalSuneAltarVerified!==true||
    r.explicitReadDevotionAtAltar!==true)
   return {action:"deny",reason:"not-studio-devotion-reading"};
 if(r.readLedger==="reserved"||r.emblemLedger==="reserved")
   return {action:"gm-review",reason:"reserved-altar"};
 if(r.readLedger==="read"&&r.emblemLedger==="done")
   return {action:"no-op",reason:"sune-reward-already-done"};
 if(r.readLedger!=="unread"||r.emblemLedger!=="none")
   return {action:"gm-review",reason:"partial-altar-ledger"};
 if(r.originalPrayerReverified!==true||r.originalPrayerSource!==PRAYER||
    r.actorPrayerSource!==PRAYER||r.actorHoldsDevotion!==true||
    r.devotionObtainedFromBoathouseVerified!==true||
    r.fullPrayerReadAtAltarVerified!==true||
    r.originalSuneHalfReverified!==true||r.suneHalfSource!==SUNE||
    r.suneHalfName!=="Sune Emblem Half"||r.suneHalfType!=="loot"||
    r.worldwideSuneHalfRewardCount!==0||
    r.protectionPrayerNotAcceptedInPlaceOfDevotion!==true)
   return {action:"deny",reason:"wrong-prayer-or-emblem-provenance"};
 return {action:"gm-review-grant-single-sune-half",reason:"reserve-before-original-half"};
}