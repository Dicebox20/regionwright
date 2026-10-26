import test from "node:test";
import assert from "node:assert/strict";
import {
  planAqueductSourceCharge,planCrimsonVeilCommit,planVeilSceneProjection,
  AQUEDUCT_CHARGER_SCENE,ORIGINAL_UNCHARGED_GONDIAN_SOURCE,ORIGINAL_VEIL_SIXTH_BOOK
} from "../modules/regionwright/scripts/studio-cav-late-aqueduct-veil-contract.js";

const first=()=>({
 version:1, origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 aqueductSceneId:AQUEDUCT_CHARGER_SCENE,aqueductSceneVerified:true,
 chargerRegionVerified:true,chargerRegionUuid:"Scene.CAVAQ01Scene0001.Region.CHARGER",
 originalChargingFixtureVerified:true,originalChargerReachable:true,
 activeNonGMOwnerVerified:true,ownedTokenAtCharger:true,
 explicitUseChargerAction:true,actorId:"ACTOR",tokenId:"TOKEN",
 actorEmbeddedSourceItemId:"EMBEDDED-ORIGINAL",originalWorldSourceItemReverified:true,
 originalSourceUuid:ORIGINAL_UNCHARGED_GONDIAN_SOURCE,
 originalSourceName:"Uncharged Gondian Power Source",originalSourceType:"loot",
 actorHoldsOriginalSource:true,actorSourceUuid:ORIGINAL_UNCHARGED_GONDIAN_SOURCE,
 actorSourceItemType:"loot",actorSourceAcquiredFromRufus:true,
 rufusSourceClaimLedgerDone:true,rufusSourcePickupRegionVerified:true,
 actorSourceOriginSceneId:"CAVHG05Scene0001",
 actorSourceOriginRegionUuid:"Scene.CAVHG05Scene0001.Region.SOURCE",
 expectedRufusOriginRegionUuid:"Scene.CAVHG05Scene0001.Region.SOURCE",
 originalSourceInventoryCopyCount:1,worldwideSourceActorCopyCount:1,
 unchargedToChargedPreservesItemIdentity:true,
 chargeLedgerStatus:"none",veilLedgerStatus:"dormant",
 actorSourceChargeState:"uncharged",currentVeilFlagCertifiesDormant:true,
 singleCanonicalVeilLedgerVerified:true,safeAqueductReturnAvailable:true,
 noPriorSourceChargeTransaction:true,sourcePriorChargeCount:0
});
const commit=()=>({
 ...first(),chargeLedgerStatus:"reserved",veilLedgerStatus:"reserved",
 actorSourceChargeState:"charged",reservationId:"transaction-unique",
 chargeReservationId:"transaction-unique",veilReservationId:"transaction-unique",
 reservedActorId:"ACTOR",reservedEmbeddedItemId:"EMBEDDED-ORIGINAL",
 itemChargeProofFromIndependentReadback:true,verifiedSourceChargeCount:1,
 sourceItemIdentityUnchanged:true,canonicalVeilLedgerVersion:1,
 canonicalVeilStillDormantPreCommit:true,
 noPreviousVeilActiveTransitionVerified:true
});
const projection=(kind="scene-appearance",extra={})=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 canonicalVeilLedgerStatus:"active",canonicalVeilLedgerVersion:1,
 canonicalChargeStatus:"done",
 originalSourceUuid:ORIGINAL_UNCHARGED_GONDIAN_SOURCE,
 originalSourceChargeState:"charged",globalVeilTransitionCount:1,
 authoritativePhaseReadbackVerified:true,projectionKind:kind,
 physicalSceneProjectionPresent:false,projectionCanRehydrateWithoutRewards:true,
 projectionPreExistingItemOwnershipUnchanged:true,
 projectionLedgerStatus:"none",approvedProjectionManifestVerified:true,
 originalSceneVerified:true,sceneId:kind==="sophia-bed-sixth-book"?"CAVHU05Scene0001":"SCENE_APPROVED",
 manifestSceneId:kind==="sophia-bed-sixth-book"?"CAVHU05Scene0001":"SCENE_APPROVED",
 manifestProjectionKind:kind,safeSceneGeometryVerified:true,
 sceneVariantPairVerified:true,originalSixthBookReverified:true,
 sixthBookSourceUuid:ORIGINAL_VEIL_SIXTH_BOOK,
 sixthBookSourceName:"Princess Penelope and the Sea of Stars",
 sixthBookAlreadyClaimedByPlayer:false,bookStagingPlanKeepsItemInScene:true,sophiaBedPickupFixtureVerified:true,
 hostilityDisablePlanVerified:true,deactivationBoundToCanonicalVeil:true,...extra
});

test("one deliberate GM-readback charger interaction can request reserve only",()=>{
 assert.deepEqual(planAqueductSourceCharge(first()),{action:"gm-review-reserve-single-charge",reason:"explicit-original-source-use"});
});
test("charger is the original Aqueduct scene, not Grove or Parents",()=>{
 assert.equal(AQUEDUCT_CHARGER_SCENE,"CAVAQ01Scene0001");
 assert.equal(planAqueductSourceCharge({...first(),aqueductSceneId:"SG-01"}).action,"deny");
});
for(const mutation of [
 {origin:"client"},{worldId:"other"},{version:2},{aqueductSceneVerified:false},
 {chargerRegionVerified:false},{chargerRegionUuid:"Scene.WRONG.Region.CHARGER"},
 {originalChargingFixtureVerified:false},{originalChargerReachable:false},
 {activeNonGMOwnerVerified:false},{ownedTokenAtCharger:false},
 {actorId:""},{tokenId:""},{actorEmbeddedSourceItemId:""},
 {explicitUseChargerAction:false}
])test("charge rejects unauthenticated/unsafe player action "+JSON.stringify(mutation),()=>{
 assert.equal(planAqueductSourceCharge({...first(),...mutation}).action,"deny");
});
for(const mutation of [
 {originalWorldSourceItemReverified:false},
 {originalSourceUuid:"Item.LOOKALIKE"},{originalSourceName:"Charged Source"},
 {originalSourceType:"spell"},{actorHoldsOriginalSource:false},
 {actorSourceUuid:"Item.FAKE"},{actorSourceItemType:"gear"},
 {actorSourceAcquiredFromRufus:false},{rufusSourceClaimLedgerDone:false},
 {actorSourceOriginRegionUuid:"Scene.CAVHG05Scene0001.Region.FAKE"},
 {originalSourceInventoryCopyCount:2},{worldwideSourceActorCopyCount:2},
 {unchargedToChargedPreservesItemIdentity:false},
 {actorSourceChargeState:"charged"},{currentVeilFlagCertifiesDormant:false},
 {singleCanonicalVeilLedgerVerified:false},{safeAqueductReturnAvailable:false},
 {noPriorSourceChargeTransaction:false},{sourcePriorChargeCount:1}
])test("charge rejects forged/duplicated/prior source "+JSON.stringify(mutation),()=>{
 assert.equal(planAqueductSourceCharge({...first(),...mutation}).action,"deny");
});
test("charge does not require an extra minigame or any puzzle score",()=>{
 assert.equal(planAqueductSourceCharge({...first(),additionalPuzzleSolved:false}).action,"gm-review-reserve-single-charge");
});
test("a reserved transaction blocks blindly repeating charge",()=>{
 assert.equal(planAqueductSourceCharge({...first(),chargeLedgerStatus:"reserved"}).action,"gm-review");
 assert.equal(planAqueductSourceCharge({...first(),veilLedgerStatus:"reserved"}).action,"gm-review");
});
test("post-Veil repeated explicit click is harmless",()=>{
 assert.equal(planAqueductSourceCharge({...first(),chargeLedgerStatus:"done",veilLedgerStatus:"active"}).action,"no-op");
});
test("partial status cannot start a fresh transaction",()=>{
 assert.equal(planAqueductSourceCharge({...first(),chargeLedgerStatus:"done",veilLedgerStatus:"dormant"}).action,"gm-review");
 assert.equal(planAqueductSourceCharge({...first(),chargeLedgerStatus:"none",veilLedgerStatus:"active"}).action,"gm-review");
});
test("reserved, identity-stable charged source permits one canonical transition review",()=>{
 assert.deepEqual(planCrimsonVeilCommit(commit()),{
   action:"gm-review-commit-one-global-veil-transition",
   reason:"charged-source-independent-proof"});
});
test("no premature commit without reservations",()=>{
 assert.equal(planCrimsonVeilCommit({...commit(),veilLedgerStatus:"dormant"}).action,"gm-review");
});
for(const mutation of [
 {reservationId:""},{chargeReservationId:"other"},{veilReservationId:"other"},
 {reservedActorId:"OTHER"},{reservedEmbeddedItemId:"OTHER"},
 {originalSourceUuid:"Item.FAKE"},{actorSourceUuid:"Item.FAKE"},
 {actorSourceChargeState:"uncharged"},{itemChargeProofFromIndependentReadback:false},
 {verifiedSourceChargeCount:2},{sourceItemIdentityUnchanged:false},
 {canonicalVeilLedgerVersion:3},{originalSourceInventoryCopyCount:2},
 {worldwideSourceActorCopyCount:2},{canonicalVeilStillDormantPreCommit:false},
 {noPreviousVeilActiveTransitionVerified:false}
])test("commit demands exact source and one transaction "+JSON.stringify(mutation),()=>{
 assert.equal(planCrimsonVeilCommit({...commit(),...mutation}).action,"gm-review");
});
test("client supplied commit status never trusted",()=>{
 assert.equal(planCrimsonVeilCommit({...commit(),origin:"client"}).action,"deny");
});
test("already committed global Veil transition cannot fire again",()=>{
 const r={...commit(),chargeLedgerStatus:"done",veilLedgerStatus:"active"};
 assert.equal(planCrimsonVeilCommit(r).action,"no-op");
});
test("inconsistent already active with source uncharged must be reconciled",()=>{
 const r={...commit(),chargeLedgerStatus:"done",veilLedgerStatus:"active",actorSourceChargeState:"uncharged"};
 assert.equal(planCrimsonVeilCommit(r).action,"gm-review");
});
test("verified active Veil supports ordinary scene projection",()=>{
 assert.equal(planVeilSceneProjection(projection()).action,"gm-review-stage-veil-projection");
});
test("Veil-only Princess Penelope book is staged on Sophia bed after transition",()=>{
 assert.equal(planVeilSceneProjection(projection("sophia-bed-sixth-book")).action,"gm-review-stage-veil-projection");
});
test("Privy and Crooked Man changes are projections, not separate Veil activations",()=>{
 assert.equal(planVeilSceneProjection(projection("veil-privy-access")).action,"gm-review-stage-veil-projection");
 assert.equal(planVeilSceneProjection(projection("crooked-man-hostility-off")).action,"gm-review-stage-veil-projection");
});
for(const change of [
 {canonicalVeilLedgerStatus:"dormant"},{canonicalVeilLedgerVersion:2},
 {canonicalChargeStatus:"reserved"},{originalSourceUuid:"Item.FAKE"},
 {originalSourceChargeState:"uncharged"},{globalVeilTransitionCount:0},
 {globalVeilTransitionCount:2},{authoritativePhaseReadbackVerified:false}
])test("no projection without one persistent canonical Veil activation "+JSON.stringify(change),()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",change)).action,"deny");
});
test("projection duplicate repeat is no-op and reserved stops for reconciliation",()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{projectionLedgerStatus:"done",physicalSceneProjectionPresent:true})).action,"no-op");
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{projectionLedgerStatus:"reserved"})).action,"gm-review");
});
for(const change of [
 {approvedProjectionManifestVerified:false},{originalSceneVerified:false},
 {sceneId:"OTHER"},{manifestProjectionKind:"wrong"},
 {safeSceneGeometryVerified:false},{sceneVariantPairVerified:false}
])test("unverified scene manifest and unsafe geometry cannot project "+JSON.stringify(change),()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",change)).action,"deny");
});
test("no future scene variant inventions in projection kind",()=>{
 assert.equal(planVeilSceneProjection(projection("unapproved-new-room")).action,"deny");
});
for(const change of [
 {sceneId:"CAVHU04Scene0001",manifestSceneId:"CAVHU04Scene0001"},
 {originalSixthBookReverified:false},{sixthBookSourceUuid:"Item.WRONG"},
 {sixthBookSourceName:"Some Other Story"},{sixthBookAlreadyClaimedByPlayer:true},
 {bookStagingPlanKeepsItemInScene:false},{sophiaBedPickupFixtureVerified:false}
])test("Princess source/physical bed staging must be authentic "+JSON.stringify(change),()=>{
 assert.equal(planVeilSceneProjection(projection("sophia-bed-sixth-book",change)).action,"deny");
});
test("Crooked Man remains nonhostile post-Veil; fail closed if not disabled",()=>{
 assert.equal(planVeilSceneProjection(projection("crooked-man-hostility-off",{hostilityDisablePlanVerified:false})).action,"deny");
});
test("client projection claims are rejected",()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{origin:"client"})).action,"deny");
});
test("Rufus source must come from independently verified Study pickup",()=>{
 assert.equal(planAqueductSourceCharge({...first(),actorSourceOriginSceneId:"FAKE"}).action,"deny");
 assert.equal(planAqueductSourceCharge({...first(),rufusSourcePickupRegionVerified:false}).action,"deny");
});
test("reserved commit requires actor and embedded Item identifiers",()=>{
 assert.equal(planCrimsonVeilCommit({...commit(),actorId:undefined,reservedActorId:undefined}).action,"gm-review");
 assert.equal(planCrimsonVeilCommit({...commit(),actorEmbeddedSourceItemId:undefined,reservedEmbeddedItemId:undefined}).action,"gm-review");
});
test("approved sixth book staging action works before physical tile reveal",()=>{
 assert.equal(planVeilSceneProjection(projection("sophia-bed-sixth-book")).action,"gm-review-stage-veil-projection");
});
test("approved Crooked Man disable action works before switching it off",()=>{
 assert.equal(planVeilSceneProjection(projection("crooked-man-hostility-off")).action,"gm-review-stage-veil-projection");
 assert.equal(planVeilSceneProjection(projection("crooked-man-hostility-off",{
   deactivationBoundToCanonicalVeil:false
 })).action,"deny");
});
test("after scene reload a done ledger with missing physical Veil overlay rehydrates safely",()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{
   projectionLedgerStatus:"done",physicalSceneProjectionPresent:false
 })).action,"gm-review-rehydrate-veil-projection");
});
test("Sophia book rehydration is not an additional player grant",()=>{
 assert.equal(planVeilSceneProjection(projection("sophia-bed-sixth-book",{
   projectionLedgerStatus:"done",physicalSceneProjectionPresent:false,
   projectionPreExistingItemOwnershipUnchanged:true,
   projectionCanRehydrateWithoutRewards:true
 })).action,"gm-review-rehydrate-veil-projection");
});
test("unable to prove no duplicate item on rehydrate fails closed",()=>{
 assert.equal(planVeilSceneProjection(projection("sophia-bed-sixth-book",{
   projectionLedgerStatus:"done",physicalSceneProjectionPresent:false,
   projectionPreExistingItemOwnershipUnchanged:false
 })).action,"gm-review");
});
test("unknown physical projection state cannot be used as a fresh animation permission",()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{
   physicalSceneProjectionPresent:undefined
 })).action,"gm-review");
});
test("done ledger with uncertain physical state must be reconciled",()=>{
 assert.equal(planVeilSceneProjection(projection("scene-appearance",{
   projectionLedgerStatus:"done",physicalSceneProjectionPresent:undefined
 })).action,"gm-review");
});