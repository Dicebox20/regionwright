import test from "node:test";
import assert from "node:assert/strict";
import {
 CAV_OUTER_UNDERCROFT_VERSION,ORIGINAL_SUNE_BOWL,ORIGINAL_027_DUST,
 GREAT_ROOM_SCENE,SG05_STATUE_SCENE,UNDERCROFT_OUTER_SCENE,UNDERCROFT_INNER_SCENE,
 CANONICAL_027_CODE,planGreatRoom027Unlock,planGreatRoomFilledPelletClaim,
 planSuneScryingBowlPlacement,planSuneFilledPelletPlacement,
 planSuneOuterUndercroftOpening,planOuterUndercroftRehydrate
} from "../modules/regionwright/scripts/studio-cav-late-outer-undercroft-contract.js";
const common=(scene)=>({
 version:CAV_OUTER_UNDERCROFT_VERSION,origin:"elected-gm-readback",
 worldId:"cabin-in-the-ashen-veil",activeNonGmOwnedActorVerified:true,
 ownedTokenAtFixtureVerified:true,explicitPlayerAction:true,
 actorId:"PC",tokenId:"TOKEN",
 sceneId:scene,currentSceneReverified:true,interactionRegionVerified:true,
 interactionRegionUuid:"Scene."+scene+".Region.VERIFIED_FIXTURE"
});
const box=(change={})=>({
 ...common(GREAT_ROOM_SCENE),originalGreatRoom027LockboxVerified:true,
 originalLockboxRegionVerified:true,correctPaintingClueReadableVerified:true,
 explicitSubmitThreeDigitCode:true,lockboxStatus:"locked",
 submittedCombination:"027",original027BoxNot024Confirmed:true,
 actual027LockboxClickTargetSafeVerified:true,
 codeSubmissionVerifiedByGm:true,currentLockboxUnlockedIndependentlyVerified:true,...change
});
const dust=(change={})=>({
 ...box({lockboxStatus:"unlocked"}),explicitPelletPickup:true,
 ownedTokenAtOpen027LidVerified:true,lockboxOpenPhysicalReadbackVerified:true,
 pelletClaimLedger:"none",original027DustItemReverified:true,
 expectedOriginalDustSourceUuid:ORIGINAL_027_DUST,originalDustName:"Dust of Dryness",
 originalDustType:"loot","027PelletOriginalSourceProvenanceVerified":true,
 waterFilledPelletAsCanonVerified:true,original027PelletInsideActualBoxVerified:true,
 "027PelletFromThisBoxVerified":true,"027PelletRewardItemSourceUuid":ORIGINAL_027_DUST,
 worldwideOriginal027PelletRewardCopies:0,
 originalPelletClaimReceiptIndependentlyVerified:true,...change
});
const sg=(change={})=>({
 ...common(SG05_STATUE_SCENE),
 originalSuneStatueVerified:true,statueHasEmptyCuppedHandsInApprovedArtVerified:true,
 statueBowlChamberRegionVerified:true,
 statueBowlChamberRegionUuid:"Scene."+SG05_STATUE_SCENE+".Region.CHAMBER",
 earlySlidingMosaicSeparateVerified:true,
 bowlPlacementLedger:"empty",pelletChamberLedger:"empty",
 explicitPlaceBowlInHands:true,installedBowlPhysicalAndSourceVerified:true,
 installedBowlSourceUuid:ORIGINAL_SUNE_BOWL,
 originalBowlSourceReverified:true,originalBowlSourceUuid:ORIGINAL_SUNE_BOWL,
 originalBowlName:"Sune's Scrying Bowl",originalBowlType:"loot",
 actorHoldsAuthenticBowl:true,actorBowlSourceUuid:ORIGINAL_SUNE_BOWL,
 authenticUnifiedBathRosewaterBowlClaimDone:true,
 unifiedBathhouseNoSeparateBATH04ScenePlanVerified:true,
 actorBowlAcquisitionProvenanceVerified:true,noDuplicatedBowlInWorldActorsVerified:true,
 sourceItemCustodyCanBeInstalledSafelyVerified:true,
 explicitInstall027PelletInBowlChamber:true,
 originalDustSourceReverified:true,expectedOriginalDustSourceUuid:ORIGINAL_027_DUST,
 actorDustSourceUuid:ORIGINAL_027_DUST,actorCarriesWaterFilled027Pellet:true,
 "027OriginalLockboxClaimLedgerDone":true,
 "027PelletFromGreatRoomAuthenticVerified":true,
 "027DustIsWaterFilledVerified":true,
 noOther027RewardCopyVerified:true,noDuplicatedDustItemAfterInstallVerified:true,
 pelletCustodyTransitionPlanVerified:true,installedPelletPhysicalAndSourceVerified:true,
 installedPelletSourceUuid:ORIGINAL_027_DUST,...change
});
const pellet=(change={})=>sg({bowlPlacementLedger:"installed",...change});
const outer=(change={})=>({
 version:1,origin:"elected-gm-readback",worldId:"cabin-in-the-ashen-veil",
 sg05SceneId:SG05_STATUE_SCENE,sg05SceneReverified:true,
 statueOriginalMechanismRegionVerified:true,
 statueMechanismRegionUuid:"Scene."+SG05_STATUE_SCENE+".Region.STATUE_GATE",
 outerGateLedgerStatus:"sealed",mechanismRevealLedgerStatus:"hidden",
 bowlPlacementLedger:"installed",pelletChamberLedger:"installed",
 bowlPlacementNativeSourceUuid:ORIGINAL_SUNE_BOWL,
 pelletPlacementNativeSourceUuid:ORIGINAL_027_DUST,
 bowlInstallationDoneReadbackVerified:true,pelletInstallationDoneReadbackVerified:true,
 pelletWasFilledFromOriginal027BoxVerified:true,
 originalSuneWaterMechanismCanOpenVerified:true,
 outerSceneId:UNDERCROFT_OUTER_SCENE,outerSceneNowReverified:true,
 nativeSG05ToUND01PortalVerified:true,nativeUND01ReturnPortalVerified:true,
 sg05GateRegionUuid:"Scene."+SG05_STATUE_SCENE+".Region.OUTER",
 und01ReturnRegionUuid:"Scene."+UNDERCROFT_OUTER_SCENE+".Region.RETURN",
 originalDryEngineeredWaterRouteVerified:true,safeTwoWayArrivalAndReturnVerified:true,
 originalOuterGateClosedVerified:true,und01InnerKeystoneDoorStillSealedVerified:true,
 innerPortalMustRemainDisabledVerified:true,
 und02SceneId:UNDERCROFT_INNER_SCENE,noVossOrRefugeTransitionVerified:true,
 nativeOuterPortalAndReturnOpenVerified:true,innerKeystoneDoorStillLockedVerified:true,
 ...change
});
const restore=(change={})=>({
 ...outer({outerGateLedgerStatus:"open",mechanismRevealLedgerStatus:"revealed"}),
 authoritativeOuterGateLedgerReadbackVerified:true,
 outerRouteRehydrateStatus:"none",sg05OutboundOpen:false,und01ReturnOpen:false,
 currentNativeOuterPortalPairReverified:true,
 safeSG05Und01LandingAfterReloadVerified:true,
 innerDoorUnchangedAndLockedVerified:true,
 noItemsOrScriptedPelletsCanBeGrantedOnReloadVerified:true,...change
});

test("exact historical sources and approved original scene IDs",()=>{
 assert.equal(ORIGINAL_SUNE_BOWL,"Item.1n5LONw3nYIy61O9");
 assert.equal(ORIGINAL_027_DUST,"Item.VjdQNwil7pPKzkHU");
 assert.equal(GREAT_ROOM_SCENE,"CAVHG06GreatRoom");
 assert.equal(SG05_STATUE_SCENE,"CAVSG05Scene0001");
 assert.equal(UNDERCROFT_OUTER_SCENE,"CN5fkK2QLUELBGGR");
 assert.equal(UNDERCROFT_INNER_SCENE,"ywpIpQDrkMLIgUP0");
 assert.equal(CANONICAL_027_CODE,"027");
});
test("original Great Room code 027 unlock plan never automatically grants pellet",()=>{
 assert.deepEqual(planGreatRoom027Unlock(box()),
  {action:"gm-review-unlock-original-027-box",reason:"reserve-before-one-box-open"});
});
test("wrong three digit code permits reattempt with no reward",()=>{
 assert.equal(planGreatRoom027Unlock(box({submittedCombination:"024"})).action,"gm-review-wrong-code-retry");
 assert.equal(planGreatRoom027Unlock(box({submittedCombination:"999"})).action,"gm-review-wrong-code-retry");
});
for(const change of [
 {origin:"client"},{worldId:"wrong"},{version:2},
 {sceneId:"OTHER"},{currentSceneReverified:false},
 {interactionRegionUuid:"Scene.OTHER.Region.BOX"},{interactionRegionVerified:false},
 {activeNonGmOwnedActorVerified:false},{ownedTokenAtFixtureVerified:false},
 {explicitPlayerAction:false},{actorId:""},{tokenId:""},
 {originalGreatRoom027LockboxVerified:false},{originalLockboxRegionVerified:false},
 {correctPaintingClueReadableVerified:false},{explicitSubmitThreeDigitCode:false}
])test("027 lockbox denies untrusted player or physical source "+JSON.stringify(change),()=>{
 assert.equal(planGreatRoom027Unlock(box(change)).action,"deny");
});
for(const change of [
 {submittedCombination:"27"},{submittedCombination:"0-2-7"},
 {submittedCombination:27},{submittedCombination:undefined}
])test("027 requires exact zero-prefixed three digit code "+JSON.stringify(change),()=>{
 assert.equal(planGreatRoom027Unlock(box(change)).action,"deny");
});
test("024/027 historical disagreement must be resolved before success",()=>{
 assert.equal(planGreatRoom027Unlock(box({original027BoxNot024Confirmed:false})).action,"deny");
 assert.equal(planGreatRoom027Unlock(box({actual027LockboxClickTargetSafeVerified:false})).action,"deny");
 assert.equal(planGreatRoom027Unlock(box({codeSubmissionVerifiedByGm:false})).action,"deny");
});
test("lockbox reserved requires reconciliation, unlocked can be idempotent",()=>{
 assert.equal(planGreatRoom027Unlock(box({lockboxStatus:"reserved"})).action,"gm-review");
 assert.equal(planGreatRoom027Unlock(box({lockboxStatus:"unlocked"})).action,"no-op");
 assert.equal(planGreatRoom027Unlock(box({lockboxStatus:"unlocked",currentLockboxUnlockedIndependentlyVerified:false})).action,"gm-review");
});
test("explicit open-box pickup is separate from 027 code",()=>{
 assert.equal(planGreatRoomFilledPelletClaim(dust()).action,"gm-review-grant-single-filled-027-pellet");
 assert.equal(planGreatRoomFilledPelletClaim(dust({explicitPelletPickup:false})).action,"deny");
});
for(const change of [
 {lockboxStatus:"locked"},{lockboxOpenPhysicalReadbackVerified:false},
 {ownedTokenAtOpen027LidVerified:false},{originalGreatRoom027LockboxVerified:false},
 {sceneId:"OTHER"},{origin:"client"}
])test("cannot claim filled pellet without unlocked original box "+JSON.stringify(change),()=>{
 assert.equal(planGreatRoomFilledPelletClaim(dust(change)).action,"deny");
});
for(const change of [
 {original027DustItemReverified:false},
 {expectedOriginalDustSourceUuid:"Item.FAKE"},
 {originalDustName:"Random dust"},{originalDustType:"consumable"},
 {"027PelletOriginalSourceProvenanceVerified":false},
 {waterFilledPelletAsCanonVerified:false},
 {original027PelletInsideActualBoxVerified:false},
 {"027PelletFromThisBoxVerified":false},
 {"027PelletRewardItemSourceUuid":"Item.FAKE"},
 {worldwideOriginal027PelletRewardCopies:1}
])test("only 027 water-filled original Dust of Dryness claimed "+JSON.stringify(change),()=>{
 assert.equal(planGreatRoomFilledPelletClaim(dust(change)).action,"deny");
});
test("pellet grant reserved and already done are once only and independently verified",()=>{
 assert.equal(planGreatRoomFilledPelletClaim(dust({pelletClaimLedger:"reserved"})).action,"gm-review");
 assert.equal(planGreatRoomFilledPelletClaim(dust({pelletClaimLedger:"done"})).action,"no-op");
 assert.equal(planGreatRoomFilledPelletClaim(dust({pelletClaimLedger:"done",originalPelletClaimReceiptIndependentlyVerified:false})).action,"gm-review");
});
test("authentic original unified Bathhouse bowl can be installed in statue hands",()=>{
 assert.deepEqual(planSuneScryingBowlPlacement(sg()),{
  action:"gm-review-install-original-bowl-in-hands",reason:"reserve-before-statue-placement"
 });
});
test("early SG-05 bust puzzle completion is NOT Bowl prerequisite",()=>{
 assert.equal(planSuneScryingBowlPlacement(sg({earlySlidingPuzzleSolved:false,bustsSolved:false})).action,"gm-review-install-original-bowl-in-hands");
});
for(const change of [
 {sceneId:"H-U05"},{originalSuneStatueVerified:false},
 {statueHasEmptyCuppedHandsInApprovedArtVerified:false},
 {statueBowlChamberRegionVerified:false},
 {statueBowlChamberRegionUuid:"Scene.OTHER.Region.CHAMBER"},
 {earlySlidingMosaicSeparateVerified:false},
 {explicitPlaceBowlInHands:false},{ownedTokenAtFixtureVerified:false}
])test("Bowl target is original SG-05 cupped hands separate from mosaic "+JSON.stringify(change),()=>{
 assert.equal(planSuneScryingBowlPlacement(sg(change)).action,"deny");
});
for(const change of [
 {originalBowlSourceReverified:false},{originalBowlSourceUuid:"Item.FAKE"},
 {originalBowlName:"Keystone"},{originalBowlType:"spell"},
 {actorHoldsAuthenticBowl:false},{actorBowlSourceUuid:"Item.FAKE"},
 {authenticUnifiedBathRosewaterBowlClaimDone:false},
 {unifiedBathhouseNoSeparateBATH04ScenePlanVerified:false},
 {actorBowlAcquisitionProvenanceVerified:false},
 {noDuplicatedBowlInWorldActorsVerified:false},
 {sourceItemCustodyCanBeInstalledSafelyVerified:false}
])test("no original Bowl or fabricated Vault/legacy BATH04 source "+JSON.stringify(change),()=>{
 assert.equal(planSuneScryingBowlPlacement(sg(change)).action,"deny");
});
test("no independent extra Bowl duplicate after source installed",()=>{
 assert.equal(planSuneScryingBowlPlacement(sg({bowlPlacementLedger:"installed"})).action,"no-op");
 assert.equal(planSuneScryingBowlPlacement(sg({bowlPlacementLedger:"installed",installedBowlSourceUuid:"Item.FAKE"})).action,"gm-review");
});
test("Bowl reserved or pellet reserved stops action safely",()=>{
 assert.equal(planSuneScryingBowlPlacement(sg({bowlPlacementLedger:"reserved"})).action,"gm-review");
 assert.equal(planSuneScryingBowlPlacement(sg({pelletChamberLedger:"reserved"})).action,"gm-review");
});
test("cannot install pellet until Bowl already placed in hands",()=>{
 assert.equal(planSuneFilledPelletPlacement(sg()).action,"deny");
});
test("separate explicit filled pellet placement permits GM review",()=>{
 assert.deepEqual(planSuneFilledPelletPlacement(pellet()),{
  action:"gm-review-install-027-pellet-in-bowl",reason:"reserve-before-separate-pellet-placement"
 });
});
for(const change of [
 {explicitInstall027PelletInBowlChamber:false},
 {bowlPlacementLedger:"empty"},{installedBowlPhysicalAndSourceVerified:false},
 {installedBowlSourceUuid:"Item.FAKE"},
 {originalDustSourceReverified:false},
 {expectedOriginalDustSourceUuid:"Item.FAKE"},
 {actorDustSourceUuid:"Item.FAKE"},{actorCarriesWaterFilled027Pellet:false},
 {"027OriginalLockboxClaimLedgerDone":false},
 {"027PelletFromGreatRoomAuthenticVerified":false},
 {"027DustIsWaterFilledVerified":false},
 {noOther027RewardCopyVerified:false},
 {noDuplicatedDustItemAfterInstallVerified:false},
 {pelletCustodyTransitionPlanVerified:false}
])test("pellet must be original filled 027 item after Bowl "+JSON.stringify(change),()=>{
 assert.equal(planSuneFilledPelletPlacement(pellet(change)).action,"deny");
});
test("pellet installed rerun is no-op only with original source readback",()=>{
 assert.equal(planSuneFilledPelletPlacement(pellet({pelletChamberLedger:"installed"})).action,"no-op");
 assert.equal(planSuneFilledPelletPlacement(pellet({pelletChamberLedger:"installed",installedPelletSourceUuid:"Item.FAKE"})).action,"gm-review");
});
test("pellet reserved or prior Bowl reservation stops concurrent action",()=>{
 assert.equal(planSuneFilledPelletPlacement(pellet({pelletChamberLedger:"reserved"})).action,"gm-review");
 assert.equal(planSuneFilledPelletPlacement(pellet({bowlPlacementLedger:"reserved"})).action,"gm-review");
});
test("after BOTH placements, only outer Undercroft opens, no extra third click",()=>{
 assert.deepEqual(planSuneOuterUndercroftOpening(outer()),{
  action:"gm-review-open-only-outer-undercroft",reason:"two-original-statue-components-certified"
 });
});
test("outer opening does NOT depend on a claimed Keystone or Vault state",()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer({
   keystoneClaimStatus:"unclaimed",vaultDoorLedgerStatus:"locked",vossCombatStarted:false
 })).action,"gm-review-open-only-outer-undercroft");
});
for(const change of [
 {bowlPlacementLedger:"empty"},{pelletChamberLedger:"empty"},
 {bowlPlacementNativeSourceUuid:"Item.FAKE"},
 {pelletPlacementNativeSourceUuid:"Item.FAKE"},
 {bowlInstallationDoneReadbackVerified:false},
 {pelletInstallationDoneReadbackVerified:false},
 {pelletWasFilledFromOriginal027BoxVerified:false},
 {originalSuneWaterMechanismCanOpenVerified:false}
])test("no outer reveal without both authentic Items and one dry mechanism "+JSON.stringify(change),()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer(change)).action,"deny");
});
for(const change of [
 {sg05SceneId:"FAKE"},{sg05SceneReverified:false},
 {statueOriginalMechanismRegionVerified:false},
 {statueMechanismRegionUuid:"Scene.WRONG.Region.STATUE"},
 {outerSceneId:"FAKE"},{outerSceneNowReverified:false},
 {nativeSG05ToUND01PortalVerified:false},{nativeUND01ReturnPortalVerified:false},
 {sg05GateRegionUuid:"Scene.WRONG.Region.GATE"},
 {und01ReturnRegionUuid:"Scene.WRONG.Region.RETURN"},
 {originalDryEngineeredWaterRouteVerified:false},
 {safeTwoWayArrivalAndReturnVerified:false},{originalOuterGateClosedVerified:false},
 {und01InnerKeystoneDoorStillSealedVerified:false},
 {innerPortalMustRemainDisabledVerified:false},{und02SceneId:"WRONG"},
 {noVossOrRefugeTransitionVerified:false}
])test("outer route requires safe paired native portals and sealed inner Refuge "+JSON.stringify(change),()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer(change)).action,"deny");
});
test("already opened original outer gate is idempotent only with actual safe route",()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer({
  outerGateLedgerStatus:"open",mechanismRevealLedgerStatus:"revealed"
 })).action,"no-op");
 assert.equal(planSuneOuterUndercroftOpening(outer({
  outerGateLedgerStatus:"open",mechanismRevealLedgerStatus:"revealed",
  innerKeystoneDoorStillLockedVerified:false
 })).action,"gm-review");
});
test("reserved or half-done outer gate cannot be retried",()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer({outerGateLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planSuneOuterUndercroftOpening(outer({mechanismRevealLedgerStatus:"reserved"})).action,"gm-review");
 assert.equal(planSuneOuterUndercroftOpening(outer({
  outerGateLedgerStatus:"open",mechanismRevealLedgerStatus:"hidden"
 })).action,"gm-review");
});
test("client cannot open outer gate by claiming completed item stages",()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer({origin:"client"})).action,"deny");
});
test("safe rehydrate only original paired OUTER Region portals",()=>{
 assert.deepEqual(planOuterUndercroftRehydrate(restore()),{
  action:"gm-review-rehydrate-only-outer-paired-portals",reason:"restore-travel-no-rewards"
 });
});
test("outer route already paired does not replay FX or grant items",()=>{
 assert.equal(planOuterUndercroftRehydrate(restore({sg05OutboundOpen:true,und01ReturnOpen:true})).action,"no-op");
});
for(const change of [
 {outerGateLedgerStatus:"sealed"},{mechanismRevealLedgerStatus:"hidden"},
 {authoritativeOuterGateLedgerReadbackVerified:false},
 {sg05SceneId:"OTHER"},{outerSceneId:"OTHER"},{origin:"client"}
])test("rehydrate only with globally verified open outer phase "+JSON.stringify(change),()=>{
 assert.equal(planOuterUndercroftRehydrate(restore(change)).action,"deny");
});
for(const change of [
 {currentNativeOuterPortalPairReverified:false},
 {safeSG05Und01LandingAfterReloadVerified:false},
 {innerDoorUnchangedAndLockedVerified:false},
 {noItemsOrScriptedPelletsCanBeGrantedOnReloadVerified:false},
 {sg05OutboundOpen:undefined},{und01ReturnOpen:undefined}
])test("unsafe rehydrate never alters the inner Keystone door or loot "+JSON.stringify(change),()=>{
 assert.equal(planOuterUndercroftRehydrate(restore(change)).action,"gm-review");
});
test("rehydrate reserved state requires elected GM reconciliation",()=>{
 assert.equal(planOuterUndercroftRehydrate(restore({outerRouteRehydrateStatus:"reserved"})).action,"gm-review");
});
test("installed pellet is inconsistent without original Bowl still present",()=>{
 assert.equal(planSuneFilledPelletPlacement(pellet({
  pelletChamberLedger:"installed",bowlPlacementLedger:"empty"
 })).action,"gm-review");
 assert.equal(planSuneFilledPelletPlacement(pellet({
  pelletChamberLedger:"installed",installedBowlSourceUuid:"Item.FAKE"
 })).action,"gm-review");
});
test("opened outer ledger is not accepted if original component source has changed",()=>{
 assert.equal(planSuneOuterUndercroftOpening(outer({
  outerGateLedgerStatus:"open",mechanismRevealLedgerStatus:"revealed",
  pelletPlacementNativeSourceUuid:"Item.FAKE"
 })).action,"gm-review");
});
test("native outer portal no-op requires safe independently verified pairing",()=>{
 assert.equal(planOuterUndercroftRehydrate(restore({
  sg05OutboundOpen:true,und01ReturnOpen:true,
  currentNativeOuterPortalPairReverified:false
 })).action,"gm-review");
});
test("original safe outer geometry must be GM-reverified even on no-op",()=>{
 assert.equal(planOuterUndercroftRehydrate(restore({
  sg05OutboundOpen:true,und01ReturnOpen:true,
  safeSG05Und01LandingAfterReloadVerified:false
 })).action,"gm-review");
});