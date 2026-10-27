import test from "node:test";
import assert from "node:assert/strict";
import {
 VAULT_CONTRACT_VERSION,BASEMENT_WORKSHOP_SCENE,SECURED_VAULT_SCENE,
 ORIGINAL_GONDIAN_SOURCE,ORIGINAL_GOND_HALF,ORIGINAL_SUNE_HALF,
 ORIGINAL_SCRYING_BOWL,HISTORICAL_COMPLETED_EMBLEM,VAULT_SOCKET_KINDS,
 planVaultSocketInstall,planVaultTurnJoinedEmblem,planVaultKeystonePickup,planVaultDoorRehydrate
} from "../modules/regionwright/scripts/studio-cav-late-vault-keystone-contract.js";
const item={
 "charged-source":{id:ORIGINAL_GONDIAN_SOURCE,name:"Uncharged Gondian Power Source"},
 "gond-half":{id:ORIGINAL_GOND_HALF,name:"Gond Emblem Half"},
 "sune-half":{id:ORIGINAL_SUNE_HALF,name:"Sune Emblem Half"}
};
const common=()=>({
 version:VAULT_CONTRACT_VERSION,origin:"elected-gm-readback",
 worldId:"cabin-in-the-ashen-veil",sceneId:BASEMENT_WORKSHOP_SCENE,
 actorIsOwnedNonGmCharacterVerified:true,tokenAtOriginalFixtureVerified:true,
 explicitPlayerAction:true,actorId:"ACTOR",tokenId:"TOKEN",
 basementAccessFlagName:"cavWeatheredBasementUnlocked",
 basementAccessStatus:"done",weatheredKeyBasementEntryVerified:true,
 basementPortalIsGenuineAndEnabled:true,workshopSceneVerified:true,
 workshopSceneId:BASEMENT_WORKSHOP_SCENE,
 vaultActuatorRegionVerified:true,vaultActuatorRegionUuid:
   "Scene."+BASEMENT_WORKSHOP_SCENE+".Region.ACTUATOR",
 originalVaultActuatorVerified:true,actuatorHasExactlyThreeItemSockets:true,
 chargedSourceSocketStatus:"empty",gondSocketStatus:"empty",suneSocketStatus:"empty",
 vaultDoorLedgerStatus:"locked"
});
const install=(kind,patch={})=>({
 ...common(),
 explicitInstallSocketKind:kind,originalSocketRegionVerified:true,
 socketRegionUuid:"Scene."+BASEMENT_WORKSHOP_SCENE+".Region.SOCKET",
 socketAcceptsOnlySpecifiedSource:true,
 originalWorldItemSourceReverified:true,expectedOriginalSourceUuid:item[kind].id,
 actorItemSourceUuid:item[kind].id,actorItemType:"loot",
 actorHoldsVerifiedOriginalItem:true,actorSourceIdentityPreserved:true,
 sourceItemOriginLedgerDone:true,itemPickupProvenanceVerified:true,
 actorItemHasNoDuplicateCopies:true,itemNotAlreadyInstalledInAnotherFixture:true,
 itemSourceName:item[kind].name,chargeState:"charged",
 originalSourceChargeLedgerDone:true,canonicalVeilActiveVerified:true,
 sourceChargedAtOriginalAqueductVerified:true,
 originalH_U05GondClaimDone:true,gondClaimProvenanceVerified:true,
 originalSuneAltarClaimDone:true,suneClaimProvenanceVerified:true,
 nativeCustodyTransactionPlanVerified:true,
 installedCurrentSocketSourceReverified:true,installedCurrentSocketSourceUuid:item[kind].id,...patch
});
const turn=(patch={})=>({
 ...common(),chargedSourceSocketStatus:"installed",gondSocketStatus:"installed",
 suneSocketStatus:"installed",explicitTurnJoinedEmblem:true,
 originalTurnControlRegionVerified:true,
 turnControlRegionUuid:"Scene."+BASEMENT_WORKSHOP_SCENE+".Region.TURN",
 plinthMarkerStatus:"hidden",actuatorAssemblyStatus:"ready",
 sourceInstalledSourceUuid:ORIGINAL_GONDIAN_SOURCE,
 gondInstalledSourceUuid:ORIGINAL_GOND_HALF,suneInstalledSourceUuid:ORIGINAL_SUNE_HALF,
 sourceInstalledChargedInPlaceVerified:true,sourceChargeLedgerDoneVerified:true,
 gondRewardH_U05LedgerDoneVerified:true,suneStudioRewardLedgerDoneVerified:true,
 completedEmblemIsMechanismNotFifthEarnedItem:true,
 finalTurnRequiresNoExtraInventoryItem:true,originalEmblemHasRoseAndGearGeometryVerified:true,
 vaultSceneId:SECURED_VAULT_SCENE,vaultSceneCurrentlyVerified:true,
 originalWorkshopVaultDoorRegionVerified:true,
 workshopVaultDoorRegionUuid:"Scene."+BASEMENT_WORKSHOP_SCENE+".Region.ORIGINAL_GATE",
 realNativeWorkshopVaultPortalVerified:true,nativePortalDestinationRegionVerified:true,
 originalVaultPlinthMarkerRegionVerified:true,
 vaultPlinthMarkerRegionUuid:"Scene."+SECURED_VAULT_SCENE+".Region.PLINTHTILE",
 safeWorkshopVaultArrivalAndReturnVerified:true,vaultInitiallyClosedVerified:true,
 keystoneWillNotBeGrantedByTurn:true,scryingBowlFromVaultForbiddenVerified:true,
 installedOriginalsStillVerifiedOnReread:true,vaultDoorNativeReadbackVerified:true,
 ...patch
});
const pickup=(patch={})=>({
 ...common(),sceneId:SECURED_VAULT_SCENE,
 vaultSceneId:SECURED_VAULT_SCENE,vaultSceneCurrentlyVerified:true,
 originalVaultPlinthRegionVerified:true,
 plinthRegionUuid:"Scene."+SECURED_VAULT_SCENE+".Region.KEYSTONEPLINTH",
 explicitTakeKeystone:true,actorAtKeystonePlinthVerified:true,
 keystoneGrantLedgerStatus:"none",keystoneMarkerLedgerStatus:"visible",
 vaultDoorLedgerStatus:"open",actuatorAssemblyStatus:"joined",
 originalPlinthRewardPhysicalVisibleVerified:true,
 currentWorldKeystoneItemReadbackVerified:true,
 keystoneSourceApprovedByOwnerOrExistingCanonVerified:true,
 // This is an INERT TEST FIXTURE, never a claimed live Foundry source UUID.
 keystoneSourceUuid:"Item.CAVKEYSTONEITEM1",
 keystoneSourceName:"Keystone",keystoneSourceType:"loot",
 keystoneSourceDistinctFromEveryVaultInputVerified:true,
 keystoneSourceNotStagedAtBathReliquaryVerified:true,
 worldwideKeystoneRewardCopies:0,keystoneOriginalPlinthBindingVerified:true,
 keystoneClaimReceiptIndependentlyVerified:true,
 ...patch
});
const rehydrate=(patch={})=>({
 ...common(),vaultDoorLedgerStatus:"open",actuatorAssemblyStatus:"joined",
 vaultSceneId:SECURED_VAULT_SCENE,
 authoritativeVaultOpenReadbackVerified:true,
 nativePortalRehydrateLedger:"none",
 physicalVaultPortalOpen:false,safeReturnPortalOpen:false,
 originalNativePortalPairVerified:true,
 safeArrivalAndReturnAfterSceneReloadVerified:true,
 noItemOrPlinthRewardMutationDuringRestoreVerified:true,...patch
});

test("source identities from prior original Oct24 creator without inventing Keystone UUID",()=>{
 assert.equal(BASEMENT_WORKSHOP_SCENE,"G6NMonfCwMvNzipL");
 assert.equal(SECURED_VAULT_SCENE,"tjTpG2RVZNoCqRLh");
 assert.deepEqual(VAULT_SOCKET_KINDS,["charged-source","gond-half","sune-half"]);
 assert.equal(HISTORICAL_COMPLETED_EMBLEM,"Item.vbDWTbnAZg65ErSS");
 assert.equal(ORIGINAL_SCRYING_BOWL,"Item.1n5LONw3nYIy61O9");
});
for(const kind of VAULT_SOCKET_KINDS){
 test("one authentic socket accepted for separate GM reservation: "+kind,()=>{
  assert.deepEqual(planVaultSocketInstall(install(kind),kind),{
   action:"gm-review-reserve-original-vault-socket",socket:kind
  });
 });
 test("already installed "+kind+" does not duplicate source",()=>{
  const p=kind==="charged-source"?{chargedSourceSocketStatus:"installed"}:
    kind==="gond-half"?{gondSocketStatus:"installed"}:{suneSocketStatus:"installed"};
  assert.equal(planVaultSocketInstall(install(kind,p),kind).action,"no-op");
 });
 for(const change of [
  {originalWorldItemSourceReverified:false},
  {actorHoldsVerifiedOriginalItem:false},{expectedOriginalSourceUuid:"Item.FAKE"},
  {actorItemSourceUuid:"Item.FAKE"},{actorItemType:"weapon"},
  {actorSourceIdentityPreserved:false},{sourceItemOriginLedgerDone:false},
  {itemPickupProvenanceVerified:false},{actorItemHasNoDuplicateCopies:false},
  {itemNotAlreadyInstalledInAnotherFixture:false},
  {itemSourceName:"Counterfeit"},{nativeCustodyTransactionPlanVerified:false}
 ]){
  test(kind+" source provenance denies "+JSON.stringify(change),()=>{
   assert.equal(planVaultSocketInstall(install(kind,change),kind).action,"deny");
  });
 }
}
test("charged original Item is not accepted while uncharged",()=>{
 assert.equal(planVaultSocketInstall(install("charged-source",{chargeState:"uncharged"}),"charged-source").action,"deny");
 assert.equal(planVaultSocketInstall(install("charged-source",{originalSourceChargeLedgerDone:false}),"charged-source").action,"deny");
 assert.equal(planVaultSocketInstall(install("charged-source",{canonicalVeilActiveVerified:false}),"charged-source").action,"deny");
 assert.equal(planVaultSocketInstall(install("charged-source",{sourceChargedAtOriginalAqueductVerified:false}),"charged-source").action,"deny");
});
test("Gond and Sune provenance remain independently required",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",{originalH_U05GondClaimDone:false}),"gond-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("gond-half",{gondClaimProvenanceVerified:false}),"gond-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("sune-half",{originalSuneAltarClaimDone:false}),"sune-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("sune-half",{suneClaimProvenanceVerified:false}),"sune-half").action,"deny");
});
for(const change of [
 {origin:"client"},{worldId:"OTHER"},{version:2},
 {basementAccessStatus:"reserved"},{basementAccessFlagName:"forged"},
 {weatheredKeyBasementEntryVerified:false},{basementPortalIsGenuineAndEnabled:false},
 {workshopSceneVerified:false},{workshopSceneId:"OTHER"},{sceneId:SECURED_VAULT_SCENE},
 {vaultActuatorRegionVerified:false},{vaultActuatorRegionUuid:"Scene.WRONG.Region.CASE"},
 {originalVaultActuatorVerified:false},{actuatorHasExactlyThreeItemSockets:false},
 {actorIsOwnedNonGmCharacterVerified:false},{tokenAtOriginalFixtureVerified:false},
 {actorId:""},{tokenId:""},{explicitPlayerAction:false}
])test("original Workshop/Weathered Key/actor context required "+JSON.stringify(change),()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",change),"gond-half").action,"deny");
});
test("basement access is a predicate from Weathered Key, not an inserted fourth item",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",{basementAccessStatus:"none"}),"gond-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("gond-half",{fourthInventoryItemPresent:false}),"gond-half").action,"gm-review-reserve-original-vault-socket");
});
test("unknown socket kind does not become fifth control",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half"),"basement-key").action,"deny");
 assert.equal(planVaultSocketInstall(install("gond-half"),"completed-emblem").action,"deny");
});
test("socket interaction cannot claim another socket",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",{explicitInstallSocketKind:"sune-half"}),"gond-half").action,"deny");
});
test("reserved ANY socket or door stops concurrent transaction",()=>{
 for(const patch of [
  {chargedSourceSocketStatus:"reserved"},{gondSocketStatus:"reserved"},
  {suneSocketStatus:"reserved"},{vaultDoorLedgerStatus:"reserved"}
 ])assert.equal(planVaultSocketInstall(install("gond-half",patch),"gond-half").action,"gm-review");
});
test("unknown socket ledger or door state never proceeds",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",{gondSocketStatus:"mystery"}),"gond-half").action,"gm-review");
 assert.equal(planVaultSocketInstall(install("gond-half",{vaultDoorLedgerStatus:"open"}),"gond-half").action,"gm-review");
});
test("wrong or missing physical socket Region cannot install",()=>{
 assert.equal(planVaultSocketInstall(install("sune-half",{socketRegionUuid:"Scene.WRONG.Region.X"}),"sune-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("sune-half",{originalSocketRegionVerified:false}),"sune-half").action,"deny");
 assert.equal(planVaultSocketInstall(install("sune-half",{socketAcceptsOnlySpecifiedSource:false}),"sune-half").action,"deny");
});
test("all four predicates and exact three sockets permit only manual final TURN review",()=>{
 assert.deepEqual(planVaultTurnJoinedEmblem(turn()),{
  action:"gm-review-open-vault-and-expose-keystone-plinth",
  reason:"four-authentic-gates-complete"
 });
});
test("no fifth combined emblem Item or Scrying Bowl is needed as inventory",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({
  completedEmblemItemHeldByActor:false,
  scryingBowlHeldByActor:false,
  fifthItemAvailable:false
 })).action,"gm-review-open-vault-and-expose-keystone-plinth");
});
test("no automatic opening merely from three installed parts",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({explicitTurnJoinedEmblem:false})).action,"deny");
});
for(const change of [
 {chargedSourceSocketStatus:"empty"},{gondSocketStatus:"empty"},
 {suneSocketStatus:"empty"}
])test("missing one socket blocks final turn "+JSON.stringify(change),()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn(change)).action,"deny");
});
for(const change of [
 {sourceInstalledSourceUuid:"Item.FAKE"},{gondInstalledSourceUuid:ORIGINAL_SUNE_HALF},
 {suneInstalledSourceUuid:ORIGINAL_GOND_HALF},
 {sourceInstalledChargedInPlaceVerified:false},{sourceChargeLedgerDoneVerified:false},
 {gondRewardH_U05LedgerDoneVerified:false},{suneStudioRewardLedgerDoneVerified:false},
 {completedEmblemIsMechanismNotFifthEarnedItem:false},
 {finalTurnRequiresNoExtraInventoryItem:false},
 {originalEmblemHasRoseAndGearGeometryVerified:false}
])test("four originals and mechanical assembled actuator mandatory "+JSON.stringify(change),()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn(change)).action,"deny");
});
for(const change of [
 {vaultSceneId:"WRONG"},{vaultSceneCurrentlyVerified:false},
 {originalWorkshopVaultDoorRegionVerified:false},
 {workshopVaultDoorRegionUuid:"Scene.WRONG.Region.GATE"},
 {realNativeWorkshopVaultPortalVerified:false},
 {nativePortalDestinationRegionVerified:false},
 {originalVaultPlinthMarkerRegionVerified:false},
 {vaultPlinthMarkerRegionUuid:"Scene.WRONG.Region.PLINTH"},
 {safeWorkshopVaultArrivalAndReturnVerified:false},
 {vaultInitiallyClosedVerified:false},{keystoneWillNotBeGrantedByTurn:false},
 {scryingBowlFromVaultForbiddenVerified:false}
])test("native vault route and separate Keystone stage mandatory "+JSON.stringify(change),()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn(change)).action,"deny");
});
test("reserved turn, source and marker requires reconciliation",()=>{
 for(const change of [
  {chargedSourceSocketStatus:"reserved"},{vaultDoorLedgerStatus:"reserved"},
  {plinthMarkerStatus:"reserved"}
 ])assert.equal(planVaultTurnJoinedEmblem(turn(change)).action,"gm-review");
});
test("partial door ledger is reconciled, not a new activation",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({vaultDoorLedgerStatus:"open",plinthMarkerStatus:"hidden"})).action,"gm-review");
});
test("completed vault door and plinth presentation are idempotent",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({
  vaultDoorLedgerStatus:"open",plinthMarkerStatus:"visible",actuatorAssemblyStatus:"joined"
 })).action,"no-op");
});
test("opening Vault never dispenses loot; physical separate pickup required",()=>{
 assert.equal(planVaultKeystonePickup(pickup()).action,"gm-review-grant-single-original-keystone");
 assert.equal(planVaultKeystonePickup(pickup({explicitTakeKeystone:false})).action,"deny");
});
for(const change of [
 {currentWorldKeystoneItemReadbackVerified:false},
 {keystoneSourceApprovedByOwnerOrExistingCanonVerified:false},
 {keystoneSourceUuid:undefined},{keystoneSourceUuid:""},
 {keystoneSourceName:"Sune's Scrying Bowl"},{keystoneSourceType:"weapon"},
 {keystoneSourceUuid:ORIGINAL_SCRYING_BOWL},
 {keystoneSourceUuid:HISTORICAL_COMPLETED_EMBLEM},
 {keystoneSourceDistinctFromEveryVaultInputVerified:false},
 {keystoneSourceNotStagedAtBathReliquaryVerified:false},
 {worldwideKeystoneRewardCopies:1},
 {keystoneOriginalPlinthBindingVerified:false}
])test("missing/unverified Keystone source cannot grant a guessed item "+JSON.stringify(change),()=>{
 assert.equal(planVaultKeystonePickup(pickup(change)).action,"deny");
});
test("source UUID isn't chosen by L1-J; only a verified GM readback can supply it",()=>{
 assert.equal(planVaultKeystonePickup(pickup({
  currentWorldKeystoneItemReadbackVerified:false,keystoneSourceUuid:"Item.FAKE"
 })).action,"deny");
});
for(const change of [
 {sceneId:BASEMENT_WORKSHOP_SCENE},{vaultSceneCurrentlyVerified:false},
 {originalVaultPlinthRegionVerified:false},
 {plinthRegionUuid:"Scene.WRONG.Region.PLINTH"},
 {explicitTakeKeystone:false},{actorAtKeystonePlinthVerified:false},
 {tokenAtOriginalFixtureVerified:false},{actorIsOwnedNonGmCharacterVerified:false}
])test("Keystone only from original H-B02 accessible plinth "+JSON.stringify(change),()=>{
 assert.equal(planVaultKeystonePickup(pickup(change)).action,"deny");
});
test("reserved Keystone claim never blindly retries; completed claim is once only",()=>{
 assert.equal(planVaultKeystonePickup(pickup({keystoneGrantLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planVaultKeystonePickup(pickup({keystoneMarkerLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planVaultKeystonePickup(pickup({
  keystoneGrantLedgerStatus:"done",keystoneMarkerLedgerStatus:"claimed"
 })).action,"no-op");
});
test("unsafe or unopened Vault remains blocked",()=>{
 assert.equal(planVaultKeystonePickup(pickup({vaultDoorLedgerStatus:"locked"})).action,"gm-review");
 assert.equal(planVaultKeystonePickup(pickup({originalPlinthRewardPhysicalVisibleVerified:false})).action,"gm-review");
});
test("source and actor claims cannot be self-certified by a client",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({origin:"client"})).action,"deny");
 assert.equal(planVaultKeystonePickup(pickup({origin:"client"})).action,"deny");
});
test("previously opened Vault rehydrates original route without reward changes",()=>{
 assert.equal(planVaultDoorRehydrate(rehydrate()).action,"gm-review-restore-vault-portals-only");
});
test("open and safe native Vault route doesn't need reapply",()=>{
 assert.equal(planVaultDoorRehydrate(rehydrate({
  physicalVaultPortalOpen:true,safeReturnPortalOpen:true
 })).action,"no-op");
});
for(const change of [
 {vaultDoorLedgerStatus:"locked"},{actuatorAssemblyStatus:"ready"},
 {vaultSceneId:"WRONG"},{workshopSceneId:"WRONG"},
 {authoritativeVaultOpenReadbackVerified:false},{origin:"client"}
])test("cannot restore portal from unverified canonical open status "+JSON.stringify(change),()=>{
 assert.equal(planVaultDoorRehydrate(rehydrate(change)).action,"deny");
});
for(const change of [
 {originalNativePortalPairVerified:false},
 {safeArrivalAndReturnAfterSceneReloadVerified:false},
 {noItemOrPlinthRewardMutationDuringRestoreVerified:false},
 {physicalVaultPortalOpen:undefined},{safeReturnPortalOpen:undefined}
])test("cannot guess geometry or mutate reward while rehydrating "+JSON.stringify(change),()=>{
 assert.equal(planVaultDoorRehydrate(rehydrate(change)).action,"gm-review");
});
test("reserved portal rehydration is manual reconciliation",()=>{
 assert.equal(planVaultDoorRehydrate(rehydrate({nativePortalRehydrateLedger:"reserved"})).action,"gm-review");
});
test("already-installed source ledger must independently match exact original component",()=>{
 assert.equal(planVaultSocketInstall(install("gond-half",{
   gondSocketStatus:"installed",installedCurrentSocketSourceUuid:ORIGINAL_SUNE_HALF
 }),"gond-half").action,"gm-review");
});
test("already-installed socket without native Item reread needs manual reconciliation",()=>{
 assert.equal(planVaultSocketInstall(install("charged-source",{
   chargedSourceSocketStatus:"installed",installedCurrentSocketSourceReverified:false
 }),"charged-source").action,"gm-review");
});
test("already opened door without certified original Items or native portal cannot be trusted",()=>{
 assert.equal(planVaultTurnJoinedEmblem(turn({
   vaultDoorLedgerStatus:"open",plinthMarkerStatus:"visible",actuatorAssemblyStatus:"joined",
   installedOriginalsStillVerifiedOnReread:false
 })).action,"gm-review");
 assert.equal(planVaultTurnJoinedEmblem(turn({
   vaultDoorLedgerStatus:"open",plinthMarkerStatus:"visible",actuatorAssemblyStatus:"joined",
   vaultDoorNativeReadbackVerified:false
 })).action,"gm-review");
});
test("already-done Keystone claim with missing actual receipt cannot be assumed valid",()=>{
 assert.equal(planVaultKeystonePickup(pickup({
   keystoneGrantLedgerStatus:"done",keystoneMarkerLedgerStatus:"claimed",
   keystoneClaimReceiptIndependentlyVerified:false
 })).action,"gm-review");
});