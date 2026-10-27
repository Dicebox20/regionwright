import test from "node:test";
import assert from "node:assert/strict";
import {
 RUFUS_STUDY_SCENE_ID,HISTORICAL_RUFUS_ITEMS,
 planRufusEyeInstallation,planRufusJawRelease,planRufusSourcePickup
} from "../modules/regionwright/scripts/studio-cav-late-rufus-source-contract.js";

const base=()=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 studySceneId:RUFUS_STUDY_SCENE_ID,studySceneVerified:true,
 rufusRegionVerified:true,rufusRegionUuid:"Scene.CAVHG05Scene0001.Region.RUFUSFIXTURE",
 originalRufusFixtureVerified:true,studyDoorUnlockedVerified:true,
 nonGmActiveActorOwnerVerified:true,ownedTokenAtRufus:true,
 actorId:"PC-ACTOR",tokenId:"PC-TOKEN",explicitPlayerAction:true,
 firstSocketStatus:"empty",secondSocketStatus:"empty"
});
const eye=(slot,extra={})=>({
 ...base(),
 originalEyeTemplateReverified:true,
 expectedEyeSourceUuid:HISTORICAL_RUFUS_ITEMS[slot+"Eye"],
 actorEyeSourceUuid:HISTORICAL_RUFUS_ITEMS[slot+"Eye"],
 actorHoldsAuthenticEye:true,actorEyeItemType:"loot",
 originalEyeProvenanceVerified:true,
 actorEyePickupSceneId:slot==="first"?"CAVHU05Scene0001":"AUTH_GAZEBO_SCENE",
 actorEyePickupRegionUuid:slot==="first"
   ?"Scene.CAVHU05Scene0001.Region.SOPHIABEAR"
   :"Scene.AUTH_GAZEBO_SCENE.Region.SECONDEYE",
 expectedEyePickupSceneId:slot==="first"?"CAVHU05Scene0001":"AUTH_GAZEBO_SCENE",
 expectedEyePickupRegionUuid:slot==="first"
   ?"Scene.CAVHU05Scene0001.Region.SOPHIABEAR"
   :"Scene.AUTH_GAZEBO_SCENE.Region.SECONDEYE",
 originalEyeAcquisitionLedgerDone:true,eyeAlreadyInstalledElsewhere:false,
 existingOtherEyeSourceVerified:true,
 existingOtherEyeSourceUuid:HISTORICAL_RUFUS_ITEMS[slot==="first"?"secondEye":"firstEye"],
 originFixtureKind:slot==="first"?"sophia-torn-bear":"gazebo-lantern-reveal",
 ...extra
});
const jaw=(extra={})=>({
 ...base(),firstSocketStatus:"installed",secondSocketStatus:"installed",
 jawLedgerStatus:"closed",sourceMarkerStatus:"hidden",explicitJawButtonPress:true,
 installedFirstEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.firstEye,
 installedSecondEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.secondEye,
 firstEyeInstallLedgerDone:true,secondEyeInstallLedgerDone:true,
 originalUnchargedSourceTemplateReverified:true,
 unchargedSourceUuid:HISTORICAL_RUFUS_ITEMS.unchargedSource,
 sourceTemplateName:"Uncharged Gondian Power Source",sourceTemplateType:"loot",
 worldwideUnchargedSourceRewardCopyCount:0,sourcePickupRegionVerified:true,
 sourcePickupRegionUuid:"Scene.CAVHG05Scene0001.Region.RUFUSSOURCE",
 sourceWillAppearUncharged:true,...extra
});
const pickup=(extra={})=>({
 ...jaw({jawLedgerStatus:"open",sourceMarkerStatus:"visible"}),
 explicitSourcePickupAction:true,ownedTokenAtSourceMarker:true,
 sourceGrantStatus:"none",unpluggedSourceReverified:true,
 originalSourceChargeState:"uncharged",markerRehydratedAfterSceneSwap:true,
 crimsonVeilStarted:false,...extra
});

test("canonical Allen Study scene sourced from existing Studio 587",()=>{
 assert.equal(RUFUS_STUDY_SCENE_ID,"CAVHG05Scene0001");
});
test("authentic first eye from Sophia bear can be installed first",()=>{
 assert.equal(planRufusEyeInstallation(eye("first"),"first").action,"gm-review-install-eye");
});
test("authentic second eye from Gazebo can be installed first",()=>{
 assert.equal(planRufusEyeInstallation(eye("second"),"second").action,"gm-review-install-eye");
});
test("second eye after first is independent",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{firstSocketStatus:"installed"}),"second").action,"gm-review-install-eye");
});
test("first eye after second is independent",()=>{
 assert.equal(planRufusEyeInstallation(eye("first",{secondSocketStatus:"installed"}),"first").action,"gm-review-install-eye");
});
test("already installed first eye is no-op",()=>{
 assert.equal(planRufusEyeInstallation(eye("first",{firstSocketStatus:"installed"}),"first").action,"no-op");
});
test("already installed second eye is no-op",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{secondSocketStatus:"installed"}),"second").action,"no-op");
});
test("wrong socket and no identity cannot install",()=>{
 assert.equal(planRufusEyeInstallation(eye("first"),"middle").action,"deny");
 assert.equal(planRufusEyeInstallation(null,"first").action,"deny");
});
for(const change of [
 {studySceneId:"OTHER"},{studySceneVerified:false},{rufusRegionVerified:false},
 {rufusRegionUuid:"Scene.OTHER.Region.RUFUS"},{originalRufusFixtureVerified:false},
 {studyDoorUnlockedVerified:false},{nonGmActiveActorOwnerVerified:false},
 {ownedTokenAtRufus:false},{explicitPlayerAction:false},{actorId:""},
 {origin:"client"},{worldId:"other-world"}
])test("Rufus installation fails closed on invalid player/fixture "+JSON.stringify(change),()=>{
 assert.equal(planRufusEyeInstallation(eye("first",change),"first").action,"deny");
});
for(const change of [
 {originalEyeTemplateReverified:false},{actorHoldsAuthenticEye:false},
 {actorEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.secondEye},
 {actorEyeItemType:"spell"},{originalEyeProvenanceVerified:false},
 {expectedEyePickupRegionUuid:"Scene.CAVHU05Scene0001.Region.FAKE"},
 {originalEyeAcquisitionLedgerDone:false},{eyeAlreadyInstalledElsewhere:true},
 {originFixtureKind:"gazebo-lantern-reveal"}
])test("original Eye1 identity or bear provenance required "+JSON.stringify(change),()=>{
 assert.equal(planRufusEyeInstallation(eye("first",change),"first").action,"deny");
});
test("first eye cannot substitute for second",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{actorEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.firstEye}),"second").action,"deny");
});
test("Gazebo eye needs Gazebo origin",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{originFixtureKind:"sophia-torn-bear"}),"second").action,"deny");
});
test("reserved first or second socket needs reconciliation",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{firstSocketStatus:"reserved"}),"second").action,"gm-review");
 assert.equal(planRufusEyeInstallation(eye("first",{secondSocketStatus:"reserved"}),"first").action,"gm-review");
});
test("corrupt socket ledger cannot proceed",()=>{
 assert.equal(planRufusEyeInstallation(eye("first",{secondSocketStatus:"corrupt"}),"first").action,"gm-review");
});
test("jaw needs a deliberate button press, not just both eyes installed",()=>{
 assert.equal(planRufusJawRelease(jaw({explicitJawButtonPress:false})).action,"deny");
 assert.equal(planRufusJawRelease(jaw()).action,"gm-review-open-jaw-and-reveal");
});
test("jaw won't open with missing eye",()=>{
 assert.equal(planRufusJawRelease(jaw({secondSocketStatus:"empty"})).action,"deny");
 assert.equal(planRufusJawRelease(jaw({firstSocketStatus:"empty"})).action,"deny");
});
test("partial or reserved jaw transaction never silently retries",()=>{
 assert.equal(planRufusJawRelease(jaw({jawLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planRufusJawRelease(jaw({sourceMarkerStatus:"reserved"})).action,"gm-review");
 assert.equal(planRufusJawRelease(jaw({jawLedgerStatus:"open",sourceMarkerStatus:"hidden"})).action,"gm-review");
});
test("jaw open and marker visible is idempotent",()=>{
 assert.equal(planRufusJawRelease(jaw({jawLedgerStatus:"open",sourceMarkerStatus:"visible"})).action,"no-op");
});
test("jaw open after source claimed is idempotent",()=>{
 assert.equal(planRufusJawRelease(jaw({jawLedgerStatus:"open",sourceMarkerStatus:"claimed"})).action,"no-op");
});
for(const change of [
 {installedFirstEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.secondEye},
 {installedSecondEyeSourceUuid:HISTORICAL_RUFUS_ITEMS.firstEye},
 {firstEyeInstallLedgerDone:false},{secondEyeInstallLedgerDone:false},
 {originalUnchargedSourceTemplateReverified:false},
 {unchargedSourceUuid:"Item.WRONG"},{sourceTemplateName:"Charged Gondian Power Source"},
 {sourceTemplateType:"equipment"},{worldwideUnchargedSourceRewardCopyCount:1},
 {sourcePickupRegionVerified:false},{sourcePickupRegionUuid:"Scene.OTHER.Region.SOURCE"},
 {sourceWillAppearUncharged:false}
])test("jaw authentic eyes/source required "+JSON.stringify(change),()=>{
 assert.equal(planRufusJawRelease(jaw(change)).action,"deny");
});
test("jaw is not triggered from forged player context",()=>{
 assert.equal(planRufusJawRelease(jaw({origin:"client"})).action,"deny");
});
test("persistent visible source after scene swap can be explicitly claimed",()=>{
 assert.equal(planRufusSourcePickup(pickup()).action,"gm-review-single-uncharged-source");
});
test("visual marker display never auto grants on eye insertion or jaw opening",()=>{
 assert.equal(planRufusSourcePickup(pickup({explicitSourcePickupAction:false})).action,"deny");
});
test("source collection requires nearby owned token",()=>{
 assert.equal(planRufusSourcePickup(pickup({ownedTokenAtSourceMarker:false})).action,"deny");
});
test("already claimed source cannot respawn",()=>{
 assert.equal(planRufusSourcePickup(pickup({sourceMarkerStatus:"claimed",sourceGrantStatus:"done"})).action,"no-op");
});
test("reserved source transaction needs reconciliation",()=>{
 assert.equal(planRufusSourcePickup(pickup({sourceGrantStatus:"reserved"})).action,"gm-review");
 assert.equal(planRufusSourcePickup(pickup({sourceMarkerStatus:"reserved"})).action,"gm-review");
});
test("hidden source not claimable",()=>{
 assert.equal(planRufusSourcePickup(pickup({sourceMarkerStatus:"hidden"})).action,"gm-review");
});
for(const change of [
 {unpluggedSourceReverified:false},{unchargedSourceUuid:"Item.COUNTERFEIT"},
 {originalSourceChargeState:"charged"},{worldwideUnchargedSourceRewardCopyCount:1},
 {markerRehydratedAfterSceneSwap:false},{crimsonVeilStarted:true}
])test("source claim refuses forged/charged duplicate "+JSON.stringify(change),()=>{
 assert.equal(planRufusSourcePickup(pickup(change)).action,"deny");
});
test("Rufus does not require Aqueduct or auto-start the Crimson Veil",()=>{
 assert.equal(planRufusSourcePickup(pickup({aqueductChargerActivated:false,crimsonVeilStarted:false})).action,"gm-review-single-uncharged-source");
});
test("already installed counterpart must be original, not lookalike",()=>{
 assert.equal(planRufusEyeInstallation(eye("second",{
   firstSocketStatus:"installed",existingOtherEyeSourceUuid:"Item.FAKE"
 }),"second").action,"deny");
});
test("counterpart proof required if socket already occupied",()=>{
 assert.equal(planRufusEyeInstallation(eye("first",{
   secondSocketStatus:"installed",existingOtherEyeSourceVerified:false
 }),"first").action,"deny");
});
test("uncertain duplicate eye location cannot be installed",()=>{
 assert.equal(planRufusEyeInstallation(eye("first",{
   eyeAlreadyInstalledElsewhere:undefined
 }),"first").action,"deny");
});
test("unknown Crimson Veil phase cannot release a source",()=>{
 assert.equal(planRufusSourcePickup(pickup({crimsonVeilStarted:undefined})).action,"deny");
});