import test from "node:test";
import assert from "node:assert/strict";
import {planThornDockClear,planRowboatToBoathouse,planBoathouseDevotionPickup,planSuneDevotionHalf,
  POND,PLANT,PRAYER,SUNE} from "../modules/regionwright/scripts/studio-cav-late-dock-devotion-contract.js";

const base=(scene=POND)=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 sceneId:scene,sceneVerified:true,regionVerified:true,
 regionUuid:"Scene."+scene+".Region.FIXTURE",
 activeNonGMOwnerVerified:true,tokenAtFixtureVerified:true,
 explicitPlayerAction:true,actorId:"PC",tokenId:"TOKEN"
});
const thorns=(extra={})=>({...base(),originalThornFixtureVerified:true,
 explicitPlantKillerUse:true,thornLedger:"blocked",thornObstaclePresent:true,
 originalPlantItemReverified:true,expectedPlantSource:PLANT,actorPlantSource:PLANT,
 actorCarriesPlantItem:true,actorPlantName:"Plant Killer",actorPlantType:"loot",
 greenhouseProductionClaimDone:true,greenhouseCustodyVerified:true,
 singleScriptedUseAvailable:true,targetKind:"designated-magical-thorn-dock",
 notOrdinaryPlantsVerified:true,safeRehydrateClearVerified:true,...extra});
const boat=(extra={})=>({...base(),explicitBoardBoat:true,originalRowboatVerified:true,
 pondSceneId:POND,canonicalPondBathStateVerified:true,waterStageFromGmReadback:true,
 normalizedPondWater:"full",normalizedBathWater:"full",sluiceStatus:"closed",
 noPendingSluiceTransition:true,approvedPondFullArtVerified:true,
 thornLedger:"cleared",thornObstaclePresent:false,boatTransitLedger:"ready",
 originalOarsVerified:true,actorOarsProvenanceVerified:true,portalPairVerified:true,
 destinationBoathouseVerified:true,safeLandingAndReturnVerified:true,
 portalEnabledForFullStage:true,noUnsafeOccupantsVerified:true,...extra});
const devotion=(extra={})=>({...base("BOATHOUSE_SCENE"),boathouseSceneId:"BOATHOUSE_SCENE",
 boathouseSceneVerified:true,arrivalByLegitimateBoatVerified:true,explicitPickupPrayer:true,
 prayerClaimLedger:"none",originalPrayerReverified:true,prayerSource:PRAYER,
 prayerName:"Prayer of Devotion",prayerType:"loot",
 fullReadableJournalVerified:true,journalBoundToOriginalPrayer:true,
 distinctFromProtectionVerified:true,worldwidePrayerRewardCount:0,...extra});
const sune=(extra={})=>({...base("CAVHU07Scene0001"),studioCode:"H-U07",
 originalSuneAltarVerified:true,explicitReadDevotionAtAltar:true,
 readLedger:"unread",emblemLedger:"none",originalPrayerReverified:true,
 originalPrayerSource:PRAYER,actorPrayerSource:PRAYER,actorHoldsDevotion:true,
 devotionObtainedFromBoathouseVerified:true,fullPrayerReadAtAltarVerified:true,
 originalSuneHalfReverified:true,suneHalfSource:SUNE,suneHalfName:"Sune Emblem Half",
 suneHalfType:"loot",worldwideSuneHalfRewardCount:0,
 protectionPrayerNotAcceptedInPlaceOfDevotion:true,...extra});

test("original Plant Killer gives review-only one magical thorn clear",()=>{
 assert.deepEqual(planThornDockClear(thorns()),{action:"gm-review-clear-once",reason:"reserve-before-original-magical-thorn-effect"});
});
for(const m of [
 {origin:"client"},{worldId:"OTHER"},{sceneId:"SOMEWHERE"},
 {sceneVerified:false},{regionVerified:false},{regionUuid:"Scene.OTHER.Region.FIXTURE"},
 {tokenAtFixtureVerified:false},{activeNonGMOwnerVerified:false},{explicitPlayerAction:false},
 {originalThornFixtureVerified:false},{explicitPlantKillerUse:false}
])test("thorn cannot be changed from forged context "+JSON.stringify(m),()=>assert.equal(planThornDockClear(thorns(m)).action,"deny"));
for(const m of [
 {originalPlantItemReverified:false},{expectedPlantSource:"Item.FAKE"},
 {actorPlantSource:"Item.FAKE"},{actorCarriesPlantItem:false},
 {actorPlantName:"Real Herbicide"},{actorPlantType:"weapon"},
 {greenhouseProductionClaimDone:false},{greenhouseCustodyVerified:false},
 {singleScriptedUseAvailable:false},{targetKind:"ordinary-garden"},
 {notOrdinaryPlantsVerified:false}
])test("thorn effect restricted to original fantasy source and magical target "+JSON.stringify(m),()=>assert.equal(planThornDockClear(thorns(m)).action,"deny"));
test("cleared thorns don't consume more scripted uses",()=>assert.equal(planThornDockClear(thorns({thornLedger:"cleared",thornObstaclePresent:false})).action,"no-op"));
test("reserved thorn ledger fails closed",()=>assert.equal(planThornDockClear(thorns({thornLedger:"reserved"})).action,"gm-review"));
test("reloaded thorns after persistent clearance request safe geometry restore only",()=>assert.equal(planThornDockClear(thorns({thornLedger:"cleared",thornObstaclePresent:true})).action,"gm-review-restore-removed-thorns"));
test("no safe rehydrate proof blocks automatic retry",()=>assert.equal(planThornDockClear(thorns({thornLedger:"cleared",safeRehydrateClearVerified:false})).action,"gm-review"));
test("uncertain ledger or unexpected blocker cannot be bypassed",()=>{
 assert.equal(planThornDockClear(thorns({thornLedger:"unknown"})).action,"gm-review");
 assert.equal(planThornDockClear(thorns({thornObstaclePresent:false})).action,"gm-review");
});
test("actual FULL Pond and paired rowboat returns review-only",()=>assert.equal(planRowboatToBoathouse(boat()).action,"gm-review-board-boat"));
for(const m of [
 {canonicalPondBathStateVerified:false},{waterStageFromGmReadback:false},
 {normalizedPondWater:"drained"},{normalizedBathWater:"drained"},{sluiceStatus:"open"},
 {noPendingSluiceTransition:false},{approvedPondFullArtVerified:false}
])test("FULL water requires exact unified authoritative stage "+JSON.stringify(m),()=>assert.equal(planRowboatToBoathouse(boat(m)).reason,"pond-not-authoritatively-full"));
test("historical null Pond initial status is insufficient without normalization",()=>assert.equal(planRowboatToBoathouse(boat({normalizedPondWater:null})).action,"deny"));
test("Waterworks state cannot substitute for FULL Pond rowboat",()=>assert.equal(planRowboatToBoathouse(boat({normalizedPondWater:"drained",waterworksRestored:true})).action,"deny"));
for(const m of [
 {thornLedger:"blocked"},{thornObstaclePresent:true}
])test("rowboat cannot bypass magical thorn obstruction "+JSON.stringify(m),()=>assert.equal(planRowboatToBoathouse(boat(m)).action,"deny"));
for(const m of [
 {originalOarsVerified:false},{actorOarsProvenanceVerified:false},
 {portalPairVerified:false},{destinationBoathouseVerified:false},
 {safeLandingAndReturnVerified:false},{portalEnabledForFullStage:false},
 {noUnsafeOccupantsVerified:false}
])test("rowboat cannot travel without actual safe route "+JSON.stringify(m),()=>assert.equal(planRowboatToBoathouse(boat(m)).action,"deny"));
test("route reservation stops concurrent teleport",()=>assert.equal(planRowboatToBoathouse(boat({boatTransitLedger:"reserved"})).action,"gm-review"));
test("unknown boat ledger needs reconciliation",()=>assert.equal(planRowboatToBoathouse(boat({boatTransitLedger:"unknown"})).action,"gm-review"));
test("no rowboat auto-teleport on token entry",()=>assert.equal(planRowboatToBoathouse(boat({explicitBoardBoat:false})).action,"deny"));
test("prayer pickup is separate and requires actual legitimate Boathouse arrival",()=>assert.equal(planBoathouseDevotionPickup(devotion()).action,"gm-review-grant-one-devotion-prayer"));
for(const m of [
 {arrivalByLegitimateBoatVerified:false},{explicitPickupPrayer:false},
 {boathouseSceneVerified:false},{regionVerified:false},
 {sceneId:"OTHER"},{originalPrayerReverified:false},
 {prayerSource:"Item.FAKE"},{prayerName:"Prayer of Protection"},
 {prayerType:"equipment"},{fullReadableJournalVerified:false},
 {journalBoundToOriginalPrayer:false},{distinctFromProtectionVerified:false},
 {worldwidePrayerRewardCount:1}
])test("original Devotion prayer Journal required "+JSON.stringify(m),()=>assert.equal(planBoathouseDevotionPickup(devotion(m)).action,"deny"));
test("prayer claim idempotent and reservation-safe",()=>{
 assert.equal(planBoathouseDevotionPickup(devotion({prayerClaimLedger:"done"})).action,"no-op");
 assert.equal(planBoathouseDevotionPickup(devotion({prayerClaimLedger:"reserved"})).action,"gm-review");
});
test("prayer never automatically given by boat travel",()=>assert.equal(planBoathouseDevotionPickup(devotion({explicitPlayerAction:false})).action,"deny"));
test("Studio Devotion reading yields Sune half review only",()=>assert.equal(planSuneDevotionHalf(sune()).action,"gm-review-grant-single-sune-half"));
for(const m of [
 {studioCode:"H-G08"},{originalSuneAltarVerified:false},
 {explicitReadDevotionAtAltar:false},{regionVerified:false},
 {activeNonGMOwnerVerified:false},{origin:"client"}
])test("Sune altar must be authentic explicit owned action "+JSON.stringify(m),()=>assert.equal(planSuneDevotionHalf(sune(m)).action,"deny"));
for(const m of [
 {originalPrayerReverified:false},{originalPrayerSource:"Item.FAKE"},
 {actorPrayerSource:"Item.FAKE"},{actorHoldsDevotion:false},
 {devotionObtainedFromBoathouseVerified:false},{fullPrayerReadAtAltarVerified:false},
 {originalSuneHalfReverified:false},{suneHalfSource:"Item.GOND_HALF"},
 {suneHalfName:"Gond Emblem Half"},{suneHalfType:"weapon"},
 {worldwideSuneHalfRewardCount:1},{protectionPrayerNotAcceptedInPlaceOfDevotion:false}
])test("only Devotion and Sune original, not Prayer of Protection/Gond "+JSON.stringify(m),()=>assert.equal(planSuneDevotionHalf(sune(m)).action,"deny"));
test("Studio Protection altar path cannot accidentally satisfy Devotion",()=>assert.equal(planSuneDevotionHalf(sune({actorPrayerSource:"Item.PRAYER_PROTECTION"})).action,"deny"));
test("Devotion read and half award are once only and partial state blocked",()=>{
 assert.equal(planSuneDevotionHalf(sune({readLedger:"read",emblemLedger:"done"})).action,"no-op");
 assert.equal(planSuneDevotionHalf(sune({readLedger:"reserved"})).action,"gm-review");
 assert.equal(planSuneDevotionHalf(sune({readLedger:"read",emblemLedger:"none"})).action,"gm-review");
});
test("only real H-U07/CAVHU07Scene0001 Studio may review Sune Devotion half",()=>{
 assert.equal(planSuneDevotionHalf(sune()).action,"gm-review-grant-single-sune-half");
 for(const patch of [
   {studioCode:"H-G07"},{sceneId:"CAVHG07Scene0001"},
   {sceneId:"STUDIO_SCENE"},{studioCode:"SG-05"}
 ])assert.equal(planSuneDevotionHalf(sune(patch)).action,"deny",JSON.stringify(patch));
});
test("original Boathouse Prayer is blocked until full actual readable Journal verified",()=>{
 assert.equal(planBoathouseDevotionPickup(devotion({fullReadableJournalVerified:false})).action,"deny");
 assert.equal(planBoathouseDevotionPickup(devotion({journalBoundToOriginalPrayer:false})).action,"deny");
});