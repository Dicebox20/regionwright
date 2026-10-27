import test from "node:test";
import assert from "node:assert/strict";
import {
 INNER_UNDERCROFT_CONTRACT_VERSION,UND01_APPROACH,UND02_REFUGE,SG05_CLEARING,HB02_VAULT,
 ORIGINAL_SUNE_BOWL,ORIGINAL_GOND_HALF,ORIGINAL_SUNE_HALF,
 planInnerKeystoneRecessInsert,planInnerStoneLeverPress,
 planInnerRefugeThresholdCrossing,planRefugeNarrativeInspection,planInnerDoorRehydrate
} from "../modules/regionwright/scripts/studio-cav-late-inner-undercroft-contract.js";

const TEST_ONLY_KEYSTONE="Item.CAVKEYSTONEITEM1";
const base=(scene=UND01_APPROACH)=>({
 version:INNER_UNDERCROFT_CONTRACT_VERSION,
 origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 explicitPlayerAction:true,activeNonGmOwnerVerified:true,
 actorOwnershipFromGmVerified:true,tokenInRegionFromGmVerified:true,
 actorId:"ACTOR",tokenId:"TOKEN",sceneId:scene,sceneCurrentSourceVerified:true,
 interactionRegionVerified:true,interactionRegionUuid:"Scene."+scene+".Region.PLAYER_INTERACT",
 originalApprovedUnd01V002ArtVerified:true,
 originalInnerCarvedDoorVisibleVerified:true,
 originalRoseGearRecessAtChestHeightVerified:true,
 originalStoneLeverSeparateFromRecessVerified:true,
 noAlternateInnerDoorRouteVerified:true,
 outerUndercroftGateLedger:"open",outerStatueBowlLedger:"installed",
 outerStatuePelletLedger:"installed",outerGateFromRealBowl027Verified:true,
 outerBidirectionalRouteCurrentlySafeVerified:true,originalSG05EntryIntoUnd01Verified:true,
 originalSG05SceneId:SG05_CLEARING,
 currentWorldKeystoneTemplateReverified:true,originalKeystoneSourceOwnerApprovedVerified:true,
 keystoneTemplateUuid:TEST_ONLY_KEYSTONE,keystoneSourceName:"Keystone",
 keystoneSourceType:"loot",originalVaultSceneId:HB02_VAULT,
 vaultKeystonePickupLedger:"done",vaultKeystoneClaimReceiptIndependentlyVerified:true,
 keystoneObtainedAtOriginalVaultPlinthVerified:true,
 uniqueKeystoneProvenanceAndNoCopiesVerified:true
});
const recess=(extra={})=>({
 ...base(),explicitInsertKeystone:true,recessRegionSourceVerified:true,
 recessRegionUuid:"Scene."+UND01_APPROACH+".Region.ROSE_GEAR",
 recessLedgerStatus:"empty",innerDoorLedgerStatus:"sealed",
 originalInnerDoorNonTraversableVerified:true,innerStoneWallClosedVerified:true,
 stoneLeverUnpulledVerified:true,innerDoorCanOnlyOpenWithLeverVerified:true,
 actorHoldsAuthenticKeystone:true,
 actorEmbeddedKeystoneSourceUuid:TEST_ONLY_KEYSTONE,
 actorOwnedKeystoneEmbeddedItemVerified:true,
 actorKeystoneUninstalledElsewhereVerified:true,
 nativeUniqueKeystoneCustodyTransactionPlanned:true,
 installedOriginalKeystonePhysicallyVerified:true,
 installedKeystoneSourceUuid:TEST_ONLY_KEYSTONE,
 innerDoorStillSealedUntilLeverVerified:true,...extra
});
const lever=(extra={})=>({
 ...base(),explicitPressStoneLever:true,originalStoneLeverRegionVerified:true,
 stoneLeverRegionUuid:"Scene."+UND01_APPROACH+".Region.LEVER",
 recessLedgerStatus:"installed",innerDoorLedgerStatus:"sealed",leverLedgerStatus:"ready",
 installedOriginalKeystonePhysicallyVerified:true,
 installedKeystoneSourceUuid:TEST_ONLY_KEYSTONE,
 keystoneWasPhysicallyInstalledIntoUnd01RecessVerified:true,
 innerStoneWallClosedVerified:true,
 refugeSceneId:UND02_REFUGE,refugeCurrentSceneVerified:true,
 originalApprovedUnd02V002ArtVerified:true,
 originalUnd01DoorwayRegionVerified:true,
 und01InnerThresholdRegionUuid:"Scene."+UND01_APPROACH+".Region.DOOR",
 originalUnd02ArrivalRegionVerified:true,
 und02ArrivalRegionUuid:"Scene."+UND02_REFUGE+".Region.ARRIVAL",
 nativeUnd01ToUnd02PortalVerified:true,nativeUnd02ToUnd01ReturnVerified:true,
 safeArrivalAndReturnVerified:true,partyTokenLocationsSafeForPermanentDoorChange:true,
 innerPortalCurrentlyDisabledVerified:true,originalInnerDoorClosedCollisionVerified:true,
 preventOtherRoutesOrVossShortcutsVerified:true,
 noAutomaticTokenTeleportOnPressVerified:true,
 originalDoorPermanentUnlockPlanVerified:true,
 nativeInnerPortalAndSafeReturnOpenVerified:true,originalDoorPermanentUnlockProofVerified:true,
 ...extra
});
const crossing=(extra={})=>({
 ...base(),originalInnerThresholdRegionVerified:true,
 innerThresholdRegionUuid:"Scene."+UND01_APPROACH+".Region.THRESHOLD",
 explicitPlayerCrossing:true,recessLedgerStatus:"installed",
 leverLedgerStatus:"pressed",innerDoorLedgerStatus:"open",
 crossingLedgerStatus:"ready",refugeSceneId:UND02_REFUGE,
 refugeCurrentSceneVerified:true,
 nativeUnd01ToUnd02PortalEnabledVerified:true,
 nativeUnd02ReturnEnabledVerified:true,
 currentInnerDoorCollisionOpenVerified:true,safeDestinationAndReturnReverified:true,
 noOneWayTrapVerified:true,notRitualChamberPortalVerified:true,
 notVossCollapsedTranspositionVerified:true,...extra
});
const refuge=(extra={})=>({
 ...base(UND02_REFUGE),explicitInspectRefugeEvidence:true,
 innerDoorLedgerStatus:"open",arrivedByCertifiedInnerDoorVerified:true,
 originalUnd02RefugeArtAndEvidenceAnchorsVerified:true,
 refugeEvidenceInspectionStatus:"none",playerReceivedOriginalReadOnlyClueVerified:true,
 donovanBrokenToolsInsideVerified:true,donovanRemainsNearInnerDoorFaceVerified:true,
 sophiaRemainsFartherInsideVerified:true,scratchMarksOnlyOnInsideFaceVerified:true,
 noPrematureEvidenceOutsideUnd01Verified:true,
 ashStoneVossPlanarTraceInspectableOnlyBeyondDoorVerified:true,
 singleUsePlanarTranspositionCollapsedVerified:true,
 vossTransitCannotReactivateOrBypassDoorVerified:true,
 ritualChamberEncounterStillDeferredVerified:true,
 noLootOrActorMutationDuringClueVerified:true,...extra
});
const hydrate=(extra={})=>({
 ...base(),innerDoorLedgerStatus:"open",leverLedgerStatus:"pressed",
 authoritativeInnerOpenReadbackVerified:true,recessLedgerStatus:"installed",
 approachSceneId:UND01_APPROACH,refugeSceneId:UND02_REFUGE,
 currentOriginalInnerKeystoneInstalledVerified:true,
 innerRouteRehydrateLedger:"none",
 und01NativePortalOpen:false,und02SafeReturnOpen:false,
 originalInnerDoorCollisionOpen:false,
 nativePairedRouteReadbackVerified:true,safeLandingAndReturnAfterReloadVerified:true,
 originalApprovedUnd01Und02CollisionGeometryVerified:true,
 outerRouteUnaffectedVerified:true,
 doNotGrantKeystoneOrChangeInventoryOnReloadVerified:true,
 noCombatOrRitualChamberDoorDuringReloadVerified:true,...extra
});

test("original inner scenes are the two historical approved maps, not invented arena",()=>{
 assert.equal(UND01_APPROACH,"CN5fkK2QLUELBGGR");
 assert.equal(UND02_REFUGE,"ywpIpQDrkMLIgUP0");
 assert.equal(SG05_CLEARING,"CAVSG05Scene0001");
 assert.equal(HB02_VAULT,"tjTpG2RVZNoCqRLh");
});
test("Keystone UUID is intentionally unknown: these IDs must not be re-used",()=>{
 assert.notEqual(TEST_ONLY_KEYSTONE,ORIGINAL_SUNE_BOWL);
 assert.notEqual(TEST_ONLY_KEYSTONE,ORIGINAL_GOND_HALF);
 assert.notEqual(TEST_ONLY_KEYSTONE,ORIGINAL_SUNE_HALF);
 assert.equal(planInnerKeystoneRecessInsert(recess({
   currentWorldKeystoneTemplateReverified:false
 })).action,"deny");
});
test("original Keystone insertion reserves review and DOES NOT open the inner door",()=>{
 assert.deepEqual(planInnerKeystoneRecessInsert(recess()),{
  action:"gm-review-reserve-keystone-in-original-recess",
  reason:"install-one-original-without-opening-inner-door"
 });
});
for(const patch of [
 {version:2},{origin:"client"},{worldId:"OTHER"},
 {explicitPlayerAction:false},{activeNonGmOwnerVerified:false},
 {actorOwnershipFromGmVerified:false},{tokenInRegionFromGmVerified:false},
 {actorId:""},{tokenId:""},
 {sceneId:"OTHER"},{sceneCurrentSourceVerified:false},
 {interactionRegionVerified:false},{interactionRegionUuid:"Scene.WRONG.Region.KEY"},
 {originalApprovedUnd01V002ArtVerified:false},
 {originalInnerCarvedDoorVisibleVerified:false},
 {originalRoseGearRecessAtChestHeightVerified:false},
 {originalStoneLeverSeparateFromRecessVerified:false},
 {noAlternateInnerDoorRouteVerified:false},
 {explicitInsertKeystone:false},{recessRegionSourceVerified:false},
 {recessRegionUuid:"Scene.WRONG.Region.RECESS"}
])test("Keystone recess rejects forged GM/actor/physical context "+JSON.stringify(patch),()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess(patch)).action,"deny");
});
for(const patch of [
 {outerUndercroftGateLedger:"sealed"},{outerStatueBowlLedger:"empty"},
 {outerStatuePelletLedger:"empty"},{outerGateFromRealBowl027Verified:false},
 {outerBidirectionalRouteCurrentlySafeVerified:false},
 {originalSG05EntryIntoUnd01Verified:false},{originalSG05SceneId:"OTHER"}
])test("no direct Undercroft Keystone teleport without genuine Bowl+027 outer access "+JSON.stringify(patch),()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess(patch)).action,"deny");
});
for(const patch of [
 {currentWorldKeystoneTemplateReverified:false},
 {originalKeystoneSourceOwnerApprovedVerified:false},
 {keystoneTemplateUuid:undefined},{keystoneTemplateUuid:"Key.UNKNOWN"},
 {keystoneTemplateUuid:"Item.BAD"},{keystoneTemplateUuid:ORIGINAL_SUNE_BOWL},
 {keystoneTemplateUuid:ORIGINAL_GOND_HALF},
 {keystoneTemplateUuid:ORIGINAL_SUNE_HALF},
 {keystoneSourceName:"Vault Bowl"},{keystoneSourceType:"weapon"},
 {originalVaultSceneId:"OTHER"},{vaultKeystonePickupLedger:"reserved"},
 {vaultKeystoneClaimReceiptIndependentlyVerified:false},
 {keystoneObtainedAtOriginalVaultPlinthVerified:false},
 {uniqueKeystoneProvenanceAndNoCopiesVerified:false}
])test("original unknown Keystone requires live owner-approved Vault provenance "+JSON.stringify(patch),()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess(patch)).action,"deny");
});
for(const patch of [
 {originalInnerDoorNonTraversableVerified:false},
 {innerStoneWallClosedVerified:false},{stoneLeverUnpulledVerified:false},
 {innerDoorCanOnlyOpenWithLeverVerified:false},
 {actorHoldsAuthenticKeystone:false},
 {actorEmbeddedKeystoneSourceUuid:"Item.FORGED"},
 {actorOwnedKeystoneEmbeddedItemVerified:false},
 {actorKeystoneUninstalledElsewhereVerified:false},
 {nativeUniqueKeystoneCustodyTransactionPlanned:false}
])test("recess needs held original Item and still-locked wall "+JSON.stringify(patch),()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess(patch)).action,"deny");
});
test("a reserved recess/inner door transaction fails closed",()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess({recessLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planInnerKeystoneRecessInsert(recess({innerDoorLedgerStatus:"reserved"})).action,"gm-review");
});
test("unknown or partial initial recess/door cannot insert",()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess({recessLedgerStatus:"broken"})).action,"gm-review");
 assert.equal(planInnerKeystoneRecessInsert(recess({innerDoorLedgerStatus:"open"})).action,"gm-review");
});
test("Keystone installed stage only idempotent with independent exact-source proof",()=>{
 assert.equal(planInnerKeystoneRecessInsert(recess({recessLedgerStatus:"installed"})).action,"no-op");
 assert.equal(planInnerKeystoneRecessInsert(recess({
  recessLedgerStatus:"installed",installedKeystoneSourceUuid:"Item.FAKE"
 })).action,"gm-review");
 assert.equal(planInnerKeystoneRecessInsert(recess({
  recessLedgerStatus:"installed",installedOriginalKeystonePhysicallyVerified:false
 })).action,"gm-review");
 assert.equal(planInnerKeystoneRecessInsert(recess({
  recessLedgerStatus:"installed",innerDoorStillSealedUntilLeverVerified:false
 })).action,"gm-review");
});

test("lever is a SECOND explicit action opening only permanent inner door",()=>{
 assert.deepEqual(planInnerStoneLeverPress(lever()),{
  action:"gm-review-permanently-unlock-inner-door",
  reason:"separate-verified-lever-action"
 });
});
test("Keystone cannot auto-open door when inserted",()=>{
 assert.equal(planInnerStoneLeverPress(lever({
  explicitPressStoneLever:false
 })).action,"deny");
});
for(const patch of [
 {explicitPressStoneLever:false},
 {originalStoneLeverRegionVerified:false},
 {stoneLeverRegionUuid:"Scene.WRONG.Region.LEVER"},
 {sceneId:UND02_REFUGE},{actorOwnershipFromGmVerified:false},
 {originalApprovedUnd01V002ArtVerified:false}
])test("only deliberate authenticated original lever click "+JSON.stringify(patch),()=>{
 assert.equal(planInnerStoneLeverPress(lever(patch)).action,"deny");
});
for(const patch of [
 {recessLedgerStatus:"empty"},{installedOriginalKeystonePhysicallyVerified:false},
 {installedKeystoneSourceUuid:"Item.FAKE"},
 {keystoneWasPhysicallyInstalledIntoUnd01RecessVerified:false},
 {innerStoneWallClosedVerified:false},{currentWorldKeystoneTemplateReverified:false}
])test("cannot press lever before physical original Keystone installed "+JSON.stringify(patch),()=>{
 assert.equal(planInnerStoneLeverPress(lever(patch)).action,"deny");
});
for(const patch of [
 {outerUndercroftGateLedger:"sealed"},
 {outerStatueBowlLedger:"empty"},{outerStatuePelletLedger:"empty"},
 {outerBidirectionalRouteCurrentlySafeVerified:false}
])test("lever never creates secret outer/inner shortcut "+JSON.stringify(patch),()=>{
 assert.equal(planInnerStoneLeverPress(lever(patch)).action,"deny");
});
for(const patch of [
 {refugeSceneId:"WRONG"},{refugeCurrentSceneVerified:false},
 {originalApprovedUnd02V002ArtVerified:false},
 {originalUnd01DoorwayRegionVerified:false},
 {und01InnerThresholdRegionUuid:"Scene.WRONG.Region.X"},
 {originalUnd02ArrivalRegionVerified:false},
 {und02ArrivalRegionUuid:"Scene.WRONG.Region.X"},
 {nativeUnd01ToUnd02PortalVerified:false},
 {nativeUnd02ToUnd01ReturnVerified:false},
 {safeArrivalAndReturnVerified:false},
 {partyTokenLocationsSafeForPermanentDoorChange:false},
 {innerPortalCurrentlyDisabledVerified:false},
 {originalInnerDoorClosedCollisionVerified:false},
 {preventOtherRoutesOrVossShortcutsVerified:false},
 {noAutomaticTokenTeleportOnPressVerified:false},
 {originalDoorPermanentUnlockPlanVerified:false}
])test("no inner wall change without safe paired Foundry Region travel "+JSON.stringify(patch),()=>{
 assert.equal(planInnerStoneLeverPress(lever(patch)).action,"deny");
});
test("inner lever/door reservations must be reconciled manually",()=>{
 assert.equal(planInnerStoneLeverPress(lever({innerDoorLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planInnerStoneLeverPress(lever({leverLedgerStatus:"reserved"})).action,"gm-review");
});
test("partial inner door state cannot replay lever",()=>{
 assert.equal(planInnerStoneLeverPress(lever({innerDoorLedgerStatus:"open",leverLedgerStatus:"ready"})).action,"gm-review");
 assert.equal(planInnerStoneLeverPress(lever({innerDoorLedgerStatus:"sealed",leverLedgerStatus:"pressed"})).action,"gm-review");
});
test("permanently open door is independently verified before no-op",()=>{
 assert.equal(planInnerStoneLeverPress(lever({
  innerDoorLedgerStatus:"open",leverLedgerStatus:"pressed"
 })).action,"no-op");
 assert.equal(planInnerStoneLeverPress(lever({
  innerDoorLedgerStatus:"open",leverLedgerStatus:"pressed",
  nativeInnerPortalAndSafeReturnOpenVerified:false
 })).action,"gm-review");
 assert.equal(planInnerStoneLeverPress(lever({
  innerDoorLedgerStatus:"open",leverLedgerStatus:"pressed",
  installedKeystoneSourceUuid:"Item.FAKE"
 })).action,"gm-review");
});
test("player intentional crossing is distinct from lever press",()=>{
 assert.deepEqual(planInnerRefugeThresholdCrossing(crossing()),{
  action:"gm-review-cross-original-inner-threshold",
  reason:"safe-und01-to-und02-route-only"
 });
});
for(const patch of [
 {explicitPlayerCrossing:false},{originalInnerThresholdRegionVerified:false},
 {innerThresholdRegionUuid:"Scene.WRONG.Region.GATE"},
 {explicitPlayerAction:false},{sceneId:UND02_REFUGE},
 {outerUndercroftGateLedger:"sealed"},{recessLedgerStatus:"empty"},
 {leverLedgerStatus:"ready"},{innerDoorLedgerStatus:"sealed"}
])test("cannot cross original stone wall before lever "+JSON.stringify(patch),()=>{
 assert.equal(planInnerRefugeThresholdCrossing(crossing(patch)).action,"deny");
});
for(const patch of [
 {refugeSceneId:"OTHER"},{refugeCurrentSceneVerified:false},
 {nativeUnd01ToUnd02PortalEnabledVerified:false},
 {nativeUnd02ReturnEnabledVerified:false},
 {currentInnerDoorCollisionOpenVerified:false},
 {safeDestinationAndReturnReverified:false},
 {noOneWayTrapVerified:false},{notRitualChamberPortalVerified:false},
 {notVossCollapsedTranspositionVerified:false}
])test("crossing cannot skip toward Voss/ritual or trap player "+JSON.stringify(patch),()=>{
 assert.equal(planInnerRefugeThresholdCrossing(crossing(patch)).action,"deny");
});
test("unknown crossing state does not teleport",()=>{
 assert.equal(planInnerRefugeThresholdCrossing(crossing({crossingLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planInnerRefugeThresholdCrossing(crossing({crossingLedgerStatus:"unknown"})).action,"gm-review");
});
test("Refuge story evidence only appears beyond real inner door after explicit inspection",()=>{
 assert.deepEqual(planRefugeNarrativeInspection(refuge()),{
  action:"gm-review-show-refuge-evidence-only",
  reason:"player-triggered-readonly-clue"
 });
});
for(const patch of [
 {sceneId:UND01_APPROACH},{origin:"client"},
 {explicitInspectRefugeEvidence:false},
 {innerDoorLedgerStatus:"sealed"},
 {arrivedByCertifiedInnerDoorVerified:false},
 {originalUnd02RefugeArtAndEvidenceAnchorsVerified:false},
 {tokenInRegionFromGmVerified:false}
])test("no remains revelation from UND01 or unsolicited player notice "+JSON.stringify(patch),()=>{
 assert.equal(planRefugeNarrativeInspection(refuge(patch)).action,"deny");
});
for(const patch of [
 {donovanBrokenToolsInsideVerified:false},
 {donovanRemainsNearInnerDoorFaceVerified:false},
 {sophiaRemainsFartherInsideVerified:false},
 {scratchMarksOnlyOnInsideFaceVerified:false},
 {noPrematureEvidenceOutsideUnd01Verified:false},
 {ashStoneVossPlanarTraceInspectableOnlyBeyondDoorVerified:false},
 {singleUsePlanarTranspositionCollapsedVerified:false},
 {vossTransitCannotReactivateOrBypassDoorVerified:false},
 {ritualChamberEncounterStillDeferredVerified:false},
 {noLootOrActorMutationDuringClueVerified:false}
])test("Refuge clues preserve location and Voss one-shot lore "+JSON.stringify(patch),()=>{
 assert.equal(planRefugeNarrativeInspection(refuge(patch)).action,"deny");
});
test("already displayed player clue idempotent, no duplicate journal",()=>{
 assert.equal(planRefugeNarrativeInspection(refuge({
  refugeEvidenceInspectionStatus:"done"
 })).action,"no-op");
 assert.equal(planRefugeNarrativeInspection(refuge({
  refugeEvidenceInspectionStatus:"done",playerReceivedOriginalReadOnlyClueVerified:false
 })).action,"gm-review");
});
test("reserved read-only clue doesn't replay",()=>{
 assert.equal(planRefugeNarrativeInspection(refuge({refugeEvidenceInspectionStatus:"reserved"})).action,"gm-review");
});
test("permanent inner door can restore geometry on safe reload without rewards",()=>{
 assert.deepEqual(planInnerDoorRehydrate(hydrate()),{
  action:"gm-review-restore-only-inner-safe-portals",
  reason:"retain-original-keystone-and-permanent-unlock"
 });
});
test("inner route already open is idempotent with true safe native readback",()=>{
 assert.equal(planInnerDoorRehydrate(hydrate({
  und01NativePortalOpen:true,und02SafeReturnOpen:true,originalInnerDoorCollisionOpen:true
 })).action,"no-op");
});
for(const patch of [
 {innerDoorLedgerStatus:"sealed"},{leverLedgerStatus:"ready"},
 {authoritativeInnerOpenReadbackVerified:false},
 {recessLedgerStatus:"empty"},{approachSceneId:"OTHER"},
 {refugeSceneId:"OTHER"},{currentOriginalInnerKeystoneInstalledVerified:false},
 {origin:"client"}
])test("cannot restore passage from an unverified or locked ledger "+JSON.stringify(patch),()=>{
 assert.equal(planInnerDoorRehydrate(hydrate(patch)).action,"deny");
});
for(const patch of [
 {und01NativePortalOpen:undefined},{und02SafeReturnOpen:undefined},
 {originalInnerDoorCollisionOpen:undefined},
 {nativePairedRouteReadbackVerified:false},
 {safeLandingAndReturnAfterReloadVerified:false},
 {originalApprovedUnd01Und02CollisionGeometryVerified:false},
 {outerRouteUnaffectedVerified:false},
 {doNotGrantKeystoneOrChangeInventoryOnReloadVerified:false},
 {noCombatOrRitualChamberDoorDuringReloadVerified:false}
])test("reloaded inner geometry fails closed and never re-grants Keystone "+JSON.stringify(patch),()=>{
 assert.equal(planInnerDoorRehydrate(hydrate(patch)).action,"gm-review");
});
test("native current inner route no-op requires safe paired readback",()=>{
 assert.equal(planInnerDoorRehydrate(hydrate({
  und01NativePortalOpen:true,und02SafeReturnOpen:true,originalInnerDoorCollisionOpen:true,
  safeLandingAndReturnAfterReloadVerified:false
 })).action,"gm-review");
});
test("reserved rehydrate never auto-replays token movement",()=>{
 assert.equal(planInnerDoorRehydrate(hydrate({innerRouteRehydrateLedger:"reserved"})).action,"gm-review");
});