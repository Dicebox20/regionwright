import test from "node:test";
import assert from "node:assert/strict";
import {planMusicBoxClaim,planPrayerProtectionClaim} from "../modules/regionwright/scripts/studio-cav-late-music-prayer-contract.js";
const music=()=>({version:1,origin:"elected-gm-readback",chestSceneId:"CAVHU04Scene0001",
 chestLedgerStatus:"unlocked",chestRegionVerified:true,chestRegionUuid:"Scene.CAVHU04Scene0001.Region.VERIFIED",
 activeNonGmOwnerAtFixture:true,explicitPlayerClick:true,actorId:"ACTOR",tokenId:"TOKEN",
 musicBoxClaimStatus:"none",originalMusicBoxVerified:true,musicBoxSourceUuid:"Item.ORIGINAL",
 musicBoxSourceName:"Ornate Music Box",worldwideMusicBoxRewardCopyCount:0});
const prayer=()=>({version:1,origin:"elected-gm-readback",activeNonGmOwnerAtFixture:true,explicitPlayerClick:true,
 actorId:"ACTOR",tokenId:"TOKEN",ornateMusicBoxPresentOnActingActor:true,boxSourceVerified:true,
 expectedMusicBoxSourceUuid:"Item.ORIGINAL",actingBoxSourceUuid:"Item.ORIGINAL",
 expectedChestRegionUuid:"Scene.CAVHU04Scene0001.Region.VERIFIED",
 actingBoxChestRegionUuid:"Scene.CAVHU04Scene0001.Region.VERIFIED",
 originalSilverKeyPresentOnActingActor:true,originalSilverKeyProvenanceVerified:true,
 explicitOpenMusicBoxAction:true,prayerClaimStatus:"none",boxOpenStatus:"closed",
 originalPrayerVerified:true,prayerSourceUuid:"Item.PRAYER",prayerSourceName:"Prayer of Protection",
 worldwidePrayerRewardCopyCount:0});
test("eligible chest claim requests one Music Box via GM only",()=>{
 assert.deepEqual(planMusicBoxClaim(music()),{action:"gm-review-claim",reason:"reserve-before-single-item-grant"});
});
for(const [mutation,reason] of [
 [{chestLedgerStatus:"locked"},"chest-or-player-not-certified"],
 [{chestSceneId:"CAVHU05Scene0001"},"chest-or-player-not-certified"],
 [{explicitPlayerClick:false},"chest-or-player-not-certified"],
 [{activeNonGmOwnerAtFixture:false},"chest-or-player-not-certified"],
 [{musicBoxSourceUuid:"Item.FAKE",originalMusicBoxVerified:false},"source-or-duplication-not-certified"],
 [{musicBoxSourceName:"A Forgery"},"source-or-duplication-not-certified"],
 [{worldwideMusicBoxRewardCopyCount:1},"source-or-duplication-not-certified"],
])test("Music Box denied: "+JSON.stringify(mutation),()=>{
 assert.equal(planMusicBoxClaim({...music(),...mutation}).reason,reason);
});
test("claimed Music Box cannot respawn",()=>assert.equal(planMusicBoxClaim({...music(),musicBoxClaimStatus:"done"}).action,"no-op"));
test("reserved Music Box needs manual reconciliation",()=>assert.equal(planMusicBoxClaim({...music(),musicBoxClaimStatus:"reserved"}).action,"gm-review"));
test("client box request cannot certify itself",()=>assert.equal(planMusicBoxClaim({...music(),origin:"client"}).action,"deny"));
test("original key plus box allows Prayer pickup review",()=>assert.equal(planPrayerProtectionClaim(prayer()).action,"gm-review-prayer"));
test("opened original box allows prayer review if still unclaimed",()=>assert.equal(planPrayerProtectionClaim({...prayer(),boxOpenStatus:"open"}).action,"gm-review-prayer"));
for(const mutation of [
 {actingBoxSourceUuid:"Item.FAKE"},{actingBoxChestRegionUuid:"Scene.INVALID.Region.WRONG"},
 {ornateMusicBoxPresentOnActingActor:false},{originalSilverKeyPresentOnActingActor:false},
 {originalSilverKeyProvenanceVerified:false},{explicitOpenMusicBoxAction:false},
 {explicitPlayerClick:false},{activeNonGmOwnerAtFixture:false}
])test("Prayer requires authentic box/key and explicit owner action: "+JSON.stringify(mutation),()=>{
 assert.equal(planPrayerProtectionClaim({...prayer(),...mutation}).action,"deny");
});
test("Prayer global copy count stops duplication",()=>assert.equal(planPrayerProtectionClaim({...prayer(),worldwidePrayerRewardCopyCount:1}).action,"deny"));
test("Prayer source absent blocks reward",()=>assert.equal(planPrayerProtectionClaim({...prayer(),originalPrayerVerified:false}).action,"deny"));
test("reserved box is never retried",()=>assert.equal(planPrayerProtectionClaim({...prayer(),boxOpenStatus:"reserved"}).action,"gm-review"));
test("reserved Prayer is never retried",()=>assert.equal(planPrayerProtectionClaim({...prayer(),prayerClaimStatus:"reserved"}).action,"gm-review"));
test("Prayer already taken is idempotent",()=>assert.equal(planPrayerProtectionClaim({...prayer(),prayerClaimStatus:"done"}).action,"no-op"));
test("unknown Prayer ledger goes to GM review",()=>assert.equal(planPrayerProtectionClaim({...prayer(),prayerClaimStatus:"uncertain"}).action,"gm-review"));
test("client-supplied prayer completion cannot certify itself",()=>assert.equal(planPrayerProtectionClaim({...prayer(),origin:"client"}).action,"deny"));