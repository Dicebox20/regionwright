import test from "node:test";
import assert from "node:assert/strict";
import {planStudioPrayerPassage,planWorkshopWickPickup} from "../modules/regionwright/scripts/studio-cav-late-workshop-wick-contract.js";
const passage=()=>({
 version:1,origin:"elected-gm-readback",activeNonGmOwnerAtFixture:true,explicitPlayerAction:true,
 actorId:"ACTOR",tokenId:"TOKEN",studioCode:"H-G07",workshopCode:"H-G08",
 ownedTokenAtSuneAltar:true,studioAltarRegionVerified:true,studioSceneId:"STUDIOID",
 studioAltarRegionUuid:"Scene.STUDIOID.Region.ALTAR",explicitReadPrayerJournalAction:true,
 originalPrayerHeldByActingActor:true,originalPrayerSourceVerified:true,
 expectedPrayerSourceUuid:"Item.PRAYER",heldPrayerSourceUuid:"Item.PRAYER",
 heldPrayerFromMusicBoxProvenanceVerified:true,passageStatus:"sealed",prayerReadStatus:"unread",
 workshopSceneId:"WORKSHOPID",verifiedStudioWorkshopPortalPair:true,workshopSceneExists:true,
 safeArrivalVerified:true,safeReturnVerified:true,initialPassageSealed:true,
 studioPassageRegionUuid:"Scene.STUDIOID.Region.PASSAGE",
 workshopReturnRegionUuid:"Scene.WORKSHOPID.Region.RETURN"
});
const wick=()=>({
 version:1,origin:"elected-gm-readback",activeNonGmOwnerAtFixture:true,explicitPlayerAction:true,
 actorId:"ACTOR",tokenId:"TOKEN",workshopCode:"H-G08",
 workshopSceneVerified:true,ownedTokenAtWickFixture:true,
 workshopSceneId:"WORKSHOPID",wickRegionUuid:"Scene.WORKSHOPID.Region.WICK",
 authenticPassageOpenLedger:true,wickClaimStatus:"none",originalWickSourceVerified:true,
 wickSourceUuid:"Item.WICK",wickSourceName:"Wick",worldwideWickRewardCopyCount:0
});
test("true Prayer reading at Studio altar requests GM-only passage review",()=>{
 assert.equal(planStudioPrayerPassage(passage()).action,"gm-review-open-passage");
});
for(const mutation of [
 {studioCode:"SG-05"},{workshopCode:"H-U06"},{ownedTokenAtSuneAltar:false},
 {studioAltarRegionVerified:false},{studioAltarRegionUuid:"Scene.WRONG.Region.ALTAR"},
 {explicitReadPrayerJournalAction:false},{originalPrayerHeldByActingActor:false},
 {heldPrayerSourceUuid:"Item.FORGERY"},{heldPrayerFromMusicBoxProvenanceVerified:false},
 {activeNonGmOwnerAtFixture:false},{explicitPlayerAction:false},
])test("Passage denies inauthentic prayer/altar interaction "+JSON.stringify(mutation),()=>{
 assert.equal(planStudioPrayerPassage({...passage(),...mutation}).action,"deny");
});
for(const mutation of [
 {verifiedStudioWorkshopPortalPair:false},{workshopSceneExists:false},{workshopSceneExists:undefined},
 {safeArrivalVerified:false},{safeReturnVerified:false},
 {initialPassageSealed:false},{studioPassageRegionUuid:"Scene.WRONG.Region.PASSAGE"},
 {workshopReturnRegionUuid:"Scene.WRONG.Region.RETURN"}
])test("Passage fails closed without safe original route "+JSON.stringify(mutation),()=>{
 assert.equal(planStudioPrayerPassage({...passage(),...mutation}).reason,"unsafe-or-unverified-native-route");
});
test("repeated Prayer read with opened passage is no-op",()=>{
 assert.equal(planStudioPrayerPassage({...passage(),prayerReadStatus:"read",passageStatus:"open"}).action,"no-op");
});
test("partially read but still sealed passage requires reconciliation",()=>{
 assert.equal(planStudioPrayerPassage({...passage(),prayerReadStatus:"read"}).action,"gm-review");
});
test("reserved passage must not be retried",()=>{
 assert.equal(planStudioPrayerPassage({...passage(),passageStatus:"reserved"}).action,"gm-review");
});
test("player-supplied ledger read is not trusted",()=>{
 assert.equal(planStudioPrayerPassage({...passage(),origin:"client"}).action,"deny");
});
test("opened original passage and ownership permit single Wick claim review",()=>{
 assert.equal(planWorkshopWickPickup(wick()).action,"gm-review-single-wick");
});
for(const mutation of [
 {authenticPassageOpenLedger:false},{workshopCode:"H-G07"},{ownedTokenAtWickFixture:false},
 {workshopSceneVerified:false},{wickRegionUuid:"Scene.FAKE.Region.WICK"},
 {activeNonGmOwnerAtFixture:false},{explicitPlayerAction:false}
])test("Wick denied without true workshop context "+JSON.stringify(mutation),()=>{
 assert.equal(planWorkshopWickPickup({...wick(),...mutation}).action,"deny");
});
for(const mutation of [
 {originalWickSourceVerified:false},{wickSourceUuid:"Item.INVALID",originalWickSourceVerified:false},
 {wickSourceName:"Lookalike"},{worldwideWickRewardCopyCount:1}
])test("Wick source and duplicate must be verified "+JSON.stringify(mutation),()=>{
 assert.equal(planWorkshopWickPickup({...wick(),...mutation}).action,"deny");
});
test("already claimed Wick cannot duplicate",()=>{
 assert.equal(planWorkshopWickPickup({...wick(),wickClaimStatus:"done"}).action,"no-op");
});
test("reserved Wick requires reconciliation",()=>{
 assert.equal(planWorkshopWickPickup({...wick(),wickClaimStatus:"reserved"}).action,"gm-review");
});
test("unknown Wick ledger requires reconciliation",()=>{
 assert.equal(planWorkshopWickPickup({...wick(),wickClaimStatus:"unknown"}).action,"gm-review");
});
test("client Wick request cannot invent GM evidence",()=>{
 assert.equal(planWorkshopWickPickup({...wick(),origin:"client"}).action,"deny");
});