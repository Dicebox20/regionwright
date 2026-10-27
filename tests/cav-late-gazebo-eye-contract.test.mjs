import test from "node:test";
import assert from "node:assert/strict";
import {
  HISTORICAL_SECOND_EYE_SOURCE_UUID,planGazeboPartInstallation,
  planGazeboLanternIgnition,planGazeboSecondEyePickup
} from "../modules/regionwright/scripts/studio-cav-late-gazebo-eye-contract.js";
const shell=()=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 gazeboSceneVerified:true,gazeboSceneId:"CAV_VERIFIED_GAZEBO_SCENE",
 activeNonGmOwnerAtFixture:true,explicitPlayerAction:true,actorId:"PC",tokenId:"TOKEN",
 lanternRegionUuid:"Scene.CAV_VERIFIED_GAZEBO_SCENE.Region.LANTERN",
 lanternRegionVerified:true,ownedTokenAtLantern:true,
 oilStatus:"none",wickStatus:"none",lanternStatus:"unlit"
});
const part=(component,statuses={})=>({
 ...shell(),...statuses,
 originalPartSourceVerified:true,actorCarriesOriginalPart:true,
 expectedPartSourceUuid:component==="oil"?"Item.OIL":"Item.WICK",
 actorPartSourceUuid:component==="oil"?"Item.OIL":"Item.WICK",
 partSourceName:component==="oil"?"Lantern Oil":"Wick",
 expectedPartOriginSceneId:component==="oil"?"SHACK_SCENE":"WORKSHOP_SCENE",
 expectedPartOriginRegionUuid:component==="oil"
   ?"Scene.SHACK_SCENE.Region.OIL":"Scene.WORKSHOP_SCENE.Region.WICK",
 actorPartOriginRegionUuid:component==="oil"
   ?"Scene.SHACK_SCENE.Region.OIL":"Scene.WORKSHOP_SCENE.Region.WICK",
 partSourceProvenanceVerified:true,
 authenticWorkshopWickClaimDone:component==="wick",
 originalShackOilPickupVerified:component==="oil"
});
const ignite=(patch={})=>({
 ...shell(),oilStatus:"installed",wickStatus:"installed",
 explicitIgniteAction:true,eyeTwoMarkerStatus:"hidden",
 originalOilInstalledVerified:true,originalWickInstalledVerified:true,
 wickSourceClaimVerified:true,expectedOilSourceUuid:"Item.OIL",
 expectedWickSourceUuid:"Item.WICK",installedOilSourceUuid:"Item.OIL",
 installedWickSourceUuid:"Item.WICK",originalSecondEyeSourceVerified:true,
 eyeTwoSourceUuid:HISTORICAL_SECOND_EYE_SOURCE_UUID,
 eyeOneSourceUuid:"Item.mN1dk0qlr7hyfupk",
 worldwideEyeTwoRewardCopyCount:0,eyeTwoPickupRegionVerified:true,
 eyeTwoPickupRegionUuid:"Scene.CAV_VERIFIED_GAZEBO_SCENE.Region.EYE",
 ...patch
});
const eye=(patch={})=>({
 ...ignite({lanternStatus:"lit",eyeTwoMarkerStatus:"visible"}),
 ownedTokenAtEyeTwoMarker:true,explicitEyePickupAction:true,
 eyeTwoGrantStatus:"none",visibleEyeMarkerRehydrated:true,
 ...patch
});
test("oil installed first is eligible",()=>assert.equal(planGazeboPartInstallation(part("oil"),"oil").action,"gm-review-install"));
test("wick installed first is eligible",()=>assert.equal(planGazeboPartInstallation(part("wick"),"wick").action,"gm-review-install"));
test("oil after Wick uses independent slot",()=>assert.equal(planGazeboPartInstallation(part("oil",{wickStatus:"installed"}),"oil").action,"gm-review-install"));
test("wick after oil uses independent slot",()=>assert.equal(planGazeboPartInstallation(part("wick",{oilStatus:"installed"}),"wick").action,"gm-review-install"));
test("repeated ingredient install is harmless no-op",()=>{
 assert.equal(planGazeboPartInstallation(part("oil",{oilStatus:"installed"}),"oil").action,"no-op");
 assert.equal(planGazeboPartInstallation(part("wick",{wickStatus:"installed"}),"wick").action,"no-op");
});
test("oil or wick reserved state requires GM reconciliation",()=>{
 assert.equal(planGazeboPartInstallation(part("oil",{wickStatus:"reserved"}),"oil").action,"gm-review");
 assert.equal(planGazeboPartInstallation(part("wick",{oilStatus:"reserved"}),"wick").action,"gm-review");
});
test("reserved lantern blocks all further installs",()=>assert.equal(planGazeboPartInstallation(part("wick",{lanternStatus:"reserved"}),"wick").action,"gm-review"));
for(const change of [
 {originalPartSourceVerified:false},{actorCarriesOriginalPart:false},
 {actorPartSourceUuid:"Item.COUNTERFEIT"},{actorPartOriginRegionUuid:"Scene.WRONG.Region.SOURCE"},
 {partSourceProvenanceVerified:false},{expectedPartSourceUuid:undefined}
])test("original ingredient provenance fails closed "+JSON.stringify(change),()=>{
 assert.equal(planGazeboPartInstallation({...part("wick"),...change},"wick").action,"deny");
});
test("must genuinely claim Workshop Wick",()=>assert.equal(planGazeboPartInstallation({...part("wick"),authenticWorkshopWickClaimDone:false},"wick").action,"deny"));
test("must genuinely pick up Shack oil",()=>assert.equal(planGazeboPartInstallation({...part("oil"),originalShackOilPickupVerified:false},"oil").action,"deny"));
test("wrong component or swapped ingredient name is rejected",()=>{
 assert.equal(planGazeboPartInstallation(part("oil"),"wax").action,"deny");
 assert.equal(planGazeboPartInstallation({...part("oil"),partSourceName:"Wick"},"oil").action,"deny");
});
test("fake client receipt cannot cause install",()=>assert.equal(planGazeboPartInstallation({...part("oil"),origin:"client"},"oil").action,"deny"));
test("actual token/owned player + explicit click needed",()=>{
 assert.equal(planGazeboPartInstallation({...part("wick"),activeNonGmOwnerAtFixture:false},"wick").action,"deny");
 assert.equal(planGazeboPartInstallation({...part("wick"),explicitPlayerAction:false},"wick").action,"deny");
 assert.equal(planGazeboPartInstallation({...part("wick"),ownedTokenAtLantern:false},"wick").action,"deny");
});
test("incorrect Gazebo Region source never accepted",()=>assert.equal(planGazeboPartInstallation({...part("wick"),lanternRegionUuid:"Scene.OTHER.Region.LANTERN"},"wick").action,"deny"));
test("unknown slot state blocked",()=>assert.equal(planGazeboPartInstallation({...part("wick"),oilStatus:"unknown"},"wick").action,"gm-review"));
test("two authentic ingredients permit explicit lighting/reveal review",()=>assert.equal(planGazeboLanternIgnition(ignite()).action,"gm-review-ignite-and-reveal"));
test("optional Rose/Cog/Star solved state is NOT required for ignition",()=>{
 assert.equal(planGazeboLanternIgnition({...ignite(),tableSolved:false}).action,"gm-review-ignite-and-reveal");
 assert.equal(planGazeboLanternIgnition({...ignite(),tableSolved:undefined}).action,"gm-review-ignite-and-reveal");
});
test("lighting requires separate explicit action",()=>assert.equal(planGazeboLanternIgnition(ignite({explicitIgniteAction:false})).action,"deny"));
for(const change of [
 {oilStatus:"none"},{wickStatus:"none"},{oilStatus:"reserved"},
 {lanternStatus:"reserved"},{eyeTwoMarkerStatus:"reserved"},
 {eyeTwoMarkerStatus:"visible"},{lanternStatus:"uncertain"}
])test("incomplete/uncertain ignition cannot reveal second eye "+JSON.stringify(change),()=>{
 assert.notEqual(planGazeboLanternIgnition(ignite(change)).action,"gm-review-ignite-and-reveal");
});
for(const change of [
 {originalOilInstalledVerified:false},{originalWickInstalledVerified:false},
 {installedOilSourceUuid:"Item.FORGE"},{installedWickSourceUuid:"Item.FORGE"},
 {wickSourceClaimVerified:false},{eyeTwoSourceUuid:"Item.FAKE"},
 {originalSecondEyeSourceVerified:false},{eyeOneSourceUuid:HISTORICAL_SECOND_EYE_SOURCE_UUID},
 {worldwideEyeTwoRewardCopyCount:1},{eyeTwoPickupRegionVerified:false}
])test("eye source and dual part provenance verified "+JSON.stringify(change),()=>{
 assert.equal(planGazeboLanternIgnition(ignite(change)).action,"deny");
});
test("success only stages eye marker, no automatic grant",()=>{
 assert.equal(planGazeboLanternIgnition(ignite()).action,"gm-review-ignite-and-reveal");
});
test("finished ignition+visible marker does not rerun effects",()=>{
 assert.equal(planGazeboLanternIgnition(ignite({lanternStatus:"lit",eyeTwoMarkerStatus:"visible"})).action,"no-op");
});
test("claimed eye also keeps lantern lit and idempotent",()=>{
 assert.equal(planGazeboLanternIgnition(ignite({lanternStatus:"lit",eyeTwoMarkerStatus:"claimed"})).action,"no-op");
});
test("after visual effect expires, persistent visible eye can still be picked up",()=>{
 assert.equal(planGazeboSecondEyePickup(eye({temporaryEffectActive:false})).action,"gm-review-single-eye");
});
test("valid pickup needs an explicit player action",()=>assert.equal(planGazeboSecondEyePickup(eye({explicitEyePickupAction:false})).action,"deny"));
test("eye must still be physically visible",()=>assert.equal(planGazeboSecondEyePickup(eye({eyeTwoMarkerStatus:"hidden"})).action,"gm-review"));
test("claimed eye does not respawn",()=>assert.equal(planGazeboSecondEyePickup(eye({eyeTwoMarkerStatus:"claimed",eyeTwoGrantStatus:"done"})).action,"no-op"));
test("reserved claim is reconciliation, not replay",()=>assert.equal(planGazeboSecondEyePickup(eye({eyeTwoGrantStatus:"reserved"})).action,"gm-review"));
test("actual local token on eye marker required",()=>assert.equal(planGazeboSecondEyePickup(eye({ownedTokenAtEyeTwoMarker:false})).action,"deny"));
test("eye cannot be claimed from a fake Region",()=>assert.equal(planGazeboSecondEyePickup(eye({eyeTwoPickupRegionUuid:"Scene.WRONG.Region.EYE"})).action,"deny"));
test("claimed Eye1 cannot substitute eye2 original",()=>assert.equal(planGazeboSecondEyePickup(eye({eyeTwoSourceUuid:"Item.mN1dk0qlr7hyfupk"})).action,"deny"));
test("missing original second eye in current world stops pickup",()=>assert.equal(planGazeboSecondEyePickup(eye({originalSecondEyeSourceVerified:false})).action,"deny"));
test("duplicated actor eye elsewhere blocks another copy",()=>assert.equal(planGazeboSecondEyePickup(eye({worldwideEyeTwoRewardCopyCount:1})).action,"deny"));
test("incomplete marker rehydration blocks physical pickup",()=>assert.equal(planGazeboSecondEyePickup(eye({visibleEyeMarkerRehydrated:false})).action,"deny"));
test("client cannot self certify eye pickup",()=>assert.equal(planGazeboSecondEyePickup(eye({origin:"client"})).action,"deny"));
test("lit lantern with missing Wick cannot be silently accepted",()=>assert.equal(planGazeboPartInstallation(part("wick",{lanternStatus:"lit",wickStatus:"none"}),"wick").action,"gm-review"));
test("lit lantern with both parts already installed is idempotent",()=>assert.equal(planGazeboPartInstallation(part("oil",{lanternStatus:"lit",oilStatus:"installed",wickStatus:"installed"}),"oil").action,"no-op"));
