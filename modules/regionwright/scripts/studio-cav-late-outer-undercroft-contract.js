// CAV Chat B L1-K: isolated, PURE elected-GM review decisions, no native writes.
// "elected-gm-readback" is NOT authentication: integrator must independently
// authenticate GM, sender, owned player token and Foundry source/Region readbacks.
export const CAV_OUTER_UNDERCROFT_VERSION=1;
export const ORIGINAL_SUNE_BOWL="Item.1n5LONw3nYIy61O9";
export const ORIGINAL_027_DUST="Item.VjdQNwil7pPKzkHU";
export const GREAT_ROOM_SCENE="CAVHG06GreatRoom";
export const SG05_STATUE_SCENE="CAVSG05Scene0001";
export const UNDERCROFT_OUTER_SCENE="CN5fkK2QLUELBGGR";
export const UNDERCROFT_INNER_SCENE="ywpIpQDrkMLIgUP0";
export const CANONICAL_027_CODE="027";
const str=v=>typeof v==="string"&&v.trim().length>0;
const region=(uuid,scene)=>str(scene)&&str(uuid)&&uuid.startsWith("Scene."+scene+".Region.")&&
 uuid.length>("Scene."+scene+".Region.").length;
const trusted=r=>r?.version===CAV_OUTER_UNDERCROFT_VERSION&&
 r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const owner=r=>r?.activeNonGmOwnedActorVerified===true&&
 r?.ownedTokenAtFixtureVerified===true&&r?.explicitPlayerAction===true&&
 str(r.actorId)&&str(r.tokenId);
const at=(r,scene)=>trusted(r)&&owner(r)&&r.sceneId===scene&&
 r.currentSceneReverified===true&&r.interactionRegionVerified===true&&
 region(r.interactionRegionUuid,scene);
const statue=r=>at(r,SG05_STATUE_SCENE)&&
 r.originalSuneStatueVerified===true&&
 r.statueHasEmptyCuppedHandsInApprovedArtVerified===true&&
 r.statueBowlChamberRegionVerified===true&&
 region(r.statueBowlChamberRegionUuid,SG05_STATUE_SCENE)&&
 r.earlySlidingMosaicSeparateVerified===true;

export function planGreatRoom027Unlock(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r,GREAT_ROOM_SCENE)||r.originalGreatRoom027LockboxVerified!==true||
    r.originalLockboxRegionVerified!==true||r.correctPaintingClueReadableVerified!==true||
    r.explicitSubmitThreeDigitCode!==true)
   return {action:"deny",reason:"original-great-room-lockbox-not-certified"};
 if(r.lockboxStatus==="reserved")return {action:"gm-review",reason:"reserved-027-lockbox"};
 if(r.lockboxStatus==="unlocked"){
   return r.currentLockboxUnlockedIndependentlyVerified===true?
     {action:"no-op",reason:"027-already-open"}:
     {action:"gm-review",reason:"027-open-ledger-unverified"};
 }
 if(r.lockboxStatus!=="locked")return {action:"gm-review",reason:"unknown-027-lockbox-ledger"};
 if(typeof r.submittedCombination!=="string"||!/^[0-9]{3}$/.test(r.submittedCombination))
   return {action:"deny",reason:"invalid-three-digit-combination"};
 if(r.submittedCombination!==CANONICAL_027_CODE)
   return {action:"gm-review-wrong-code-retry",reason:"027-retry-no-reward"};
 if(r.original027BoxNot024Confirmed!==true||
    r.actual027LockboxClickTargetSafeVerified!==true||
    r.codeSubmissionVerifiedByGm!==true)
   return {action:"deny",reason:"024-027-conflict-or-target-not-reconciled"};
 // Only unlocked lid after native GM reserve/readback. NO automatic pellet grant.
 return {action:"gm-review-unlock-original-027-box",reason:"reserve-before-one-box-open"};
}

export function planGreatRoomFilledPelletClaim(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!at(r,GREAT_ROOM_SCENE)||r.originalGreatRoom027LockboxVerified!==true||
    r.originalLockboxRegionVerified!==true||
    r.explicitPelletPickup!==true||r.ownedTokenAtOpen027LidVerified!==true||
    r.lockboxStatus!=="unlocked"||r.lockboxOpenPhysicalReadbackVerified!==true)
   return {action:"deny",reason:"not-original-027-open-box-pickup"};
 if(r.pelletClaimLedger==="reserved")
   return {action:"gm-review",reason:"reserved-027-pellet-claim"};
 if(r.pelletClaimLedger==="done")
   return r.originalPelletClaimReceiptIndependentlyVerified===true?
     {action:"no-op",reason:"filled-pellet-already-recovered"}:
     {action:"gm-review",reason:"027-pellet-done-state-unverified"};
 if(r.pelletClaimLedger!=="none")
   return {action:"gm-review",reason:"unknown-027-pellet-claim"};
 if(r.original027DustItemReverified!==true||
    r.expectedOriginalDustSourceUuid!==ORIGINAL_027_DUST||
    r.originalDustName!=="Dust of Dryness"||r.originalDustType!=="loot"||
    r["027PelletOriginalSourceProvenanceVerified"]!==true)
   return {action:"deny",reason:"original-dust-item-not-certified"};
 if(r.waterFilledPelletAsCanonVerified!==true||
    r.original027PelletInsideActualBoxVerified!==true||
    r["027PelletFromThisBoxVerified"]!==true||
    r["027PelletRewardItemSourceUuid"]!==ORIGINAL_027_DUST||
    r.worldwideOriginal027PelletRewardCopies!==0)
   return {action:"deny",reason:"unique-water-filled-027-pellet-not-certified"};
 return {action:"gm-review-grant-single-filled-027-pellet",reason:"reserve-before-original-pellet-pickup"};
}

export function planSuneScryingBowlPlacement(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!statue(r)||r.explicitPlaceBowlInHands!==true)
   return {action:"deny",reason:"not-original-sune-statue-hands"};
 if(r.bowlPlacementLedger==="reserved"||r.pelletChamberLedger==="reserved")
   return {action:"gm-review",reason:"reserved-bowl-or-pellet"};
 if(r.bowlPlacementLedger==="installed")
   return r.installedBowlPhysicalAndSourceVerified===true&&
     r.installedBowlSourceUuid===ORIGINAL_SUNE_BOWL?
       {action:"no-op",reason:"bowl-already-placed"}:
       {action:"gm-review",reason:"placed-bowl-unverified"};
 if(r.bowlPlacementLedger!=="empty"||r.pelletChamberLedger!=="empty")
   return {action:"gm-review",reason:"unexpected-statue-configuration"};
 if(r.originalBowlSourceReverified!==true||
    r.originalBowlSourceUuid!==ORIGINAL_SUNE_BOWL||
    r.originalBowlName!=="Sune's Scrying Bowl"||
    r.originalBowlType!=="loot"||r.actorHoldsAuthenticBowl!==true||
    r.actorBowlSourceUuid!==ORIGINAL_SUNE_BOWL||
    r.authenticUnifiedBathRosewaterBowlClaimDone!==true||
    r.unifiedBathhouseNoSeparateBATH04ScenePlanVerified!==true||
    r.actorBowlAcquisitionProvenanceVerified!==true||
    r.noDuplicatedBowlInWorldActorsVerified!==true||
    r.sourceItemCustodyCanBeInstalledSafelyVerified!==true)
   return {action:"deny",reason:"original-unified-rosewater-bowl-not-certified"};
 // SG-05 early mosaic and grove busts are not prerequisites for this late usage.
 return {action:"gm-review-install-original-bowl-in-hands",reason:"reserve-before-statue-placement"};
}

export function planSuneFilledPelletPlacement(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(!statue(r)||r.explicitInstall027PelletInBowlChamber!==true)
   return {action:"deny",reason:"not-original-sune-pellet-chamber"};
 if(r.bowlPlacementLedger==="reserved"||r.pelletChamberLedger==="reserved")
   return {action:"gm-review",reason:"reserved-bowl-or-pellet"};
 if(r.pelletChamberLedger==="installed")
   return r.bowlPlacementLedger==="installed"&&
     r.installedBowlPhysicalAndSourceVerified===true&&
     r.installedBowlSourceUuid===ORIGINAL_SUNE_BOWL&&
     r.installedPelletPhysicalAndSourceVerified===true&&
     r.installedPelletSourceUuid===ORIGINAL_027_DUST?
       {action:"no-op",reason:"pellet-already-installed"}:
       {action:"gm-review",reason:"installed-pellet-unverified"};
 if(r.pelletChamberLedger!=="empty"||
    r.bowlPlacementLedger!=="installed"||
    r.installedBowlPhysicalAndSourceVerified!==true||
    r.installedBowlSourceUuid!==ORIGINAL_SUNE_BOWL)
   return {action:"deny",reason:"original-bowl-must-be-installed-first"};
 if(r.originalDustSourceReverified!==true||
    r.expectedOriginalDustSourceUuid!==ORIGINAL_027_DUST||
    r.actorDustSourceUuid!==ORIGINAL_027_DUST||
    r.actorCarriesWaterFilled027Pellet!==true||
    r["027OriginalLockboxClaimLedgerDone"]!==true||
    r["027PelletFromGreatRoomAuthenticVerified"]!==true||
    r["027DustIsWaterFilledVerified"]!==true||
    r.noOther027RewardCopyVerified!==true||
    r.noDuplicatedDustItemAfterInstallVerified!==true||
    r.pelletCustodyTransitionPlanVerified!==true)
   return {action:"deny",reason:"authentic-filled-027-pellet-not-certified"};
 return {action:"gm-review-install-027-pellet-in-bowl",reason:"reserve-before-separate-pellet-placement"};
}

export function planSuneOuterUndercroftOpening(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(r.sg05SceneId!==SG05_STATUE_SCENE||r.sg05SceneReverified!==true||
    r.statueOriginalMechanismRegionVerified!==true||
    !region(r.statueMechanismRegionUuid,SG05_STATUE_SCENE))
   return {action:"deny",reason:"not-original-statue-gate"};
 if(r.outerGateLedgerStatus==="reserved"||
    r.mechanismRevealLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-outer-gate-transaction"};
 if(r.outerGateLedgerStatus==="open"&&r.mechanismRevealLedgerStatus==="revealed")
   return r.bowlPlacementLedger==="installed"&&
     r.pelletChamberLedger==="installed"&&
     r.bowlPlacementNativeSourceUuid===ORIGINAL_SUNE_BOWL&&
     r.pelletPlacementNativeSourceUuid===ORIGINAL_027_DUST&&
     r.nativeOuterPortalAndReturnOpenVerified===true&&
     r.innerKeystoneDoorStillLockedVerified===true?
       {action:"no-op",reason:"outer-approach-already-open"}:
       {action:"gm-review",reason:"outer-gate-native-status-uncertain"};
 if(r.outerGateLedgerStatus!=="sealed"||r.mechanismRevealLedgerStatus!=="hidden")
   return {action:"gm-review",reason:"partial-or-unknown-outer-gate-ledger"};
 if(r.bowlPlacementLedger!=="installed"||
    r.pelletChamberLedger!=="installed"||
    r.bowlPlacementNativeSourceUuid!==ORIGINAL_SUNE_BOWL||
    r.pelletPlacementNativeSourceUuid!==ORIGINAL_027_DUST||
    r.bowlInstallationDoneReadbackVerified!==true||
    r.pelletInstallationDoneReadbackVerified!==true||
    r.pelletWasFilledFromOriginal027BoxVerified!==true||
    r.originalSuneWaterMechanismCanOpenVerified!==true)
   return {action:"deny",reason:"separate-original-bowl-and-027-installations-required"};
 if(r.outerSceneId!==UNDERCROFT_OUTER_SCENE||
    r.outerSceneNowReverified!==true||
    r.nativeSG05ToUND01PortalVerified!==true||
    r.nativeUND01ReturnPortalVerified!==true||
    !region(r.sg05GateRegionUuid,SG05_STATUE_SCENE)||
    !region(r.und01ReturnRegionUuid,UNDERCROFT_OUTER_SCENE)||
    r.originalDryEngineeredWaterRouteVerified!==true||
    r.safeTwoWayArrivalAndReturnVerified!==true||
    r.originalOuterGateClosedVerified!==true||
    r.und01InnerKeystoneDoorStillSealedVerified!==true||
    r.innerPortalMustRemainDisabledVerified!==true||
    r.und02SceneId!==UNDERCROFT_INNER_SCENE||
    r.noVossOrRefugeTransitionVerified!==true)
   return {action:"deny",reason:"outer-native-route-or-inner-lock-not-certified"};
 // Native GM service follows reservation -> verify -> open ONLY outer portal.
 // Do not move tokens automatically, modify inner Keystone lever, or start Voss.
 return {action:"gm-review-open-only-outer-undercroft",reason:"two-original-statue-components-certified"};
}

export function planOuterUndercroftRehydrate(r){
 if(!trusted(r))return {action:"deny",reason:"untrusted-readback"};
 if(r.outerGateLedgerStatus!=="open"||r.mechanismRevealLedgerStatus!=="revealed"||
    r.authoritativeOuterGateLedgerReadbackVerified!==true||
    r.sg05SceneId!==SG05_STATUE_SCENE||r.outerSceneId!==UNDERCROFT_OUTER_SCENE)
   return {action:"deny",reason:"not-certified-as-open-outer-undercroft"};
 if(r.outerRouteRehydrateStatus==="reserved")
   return {action:"gm-review",reason:"reserved-outer-route-rehydrate"};
 if(r.sg05OutboundOpen===true&&r.und01ReturnOpen===true&&
    r.currentNativeOuterPortalPairReverified===true&&
    r.safeSG05Und01LandingAfterReloadVerified===true&&
    r.und01InnerKeystoneDoorStillSealedVerified===true)
   return {action:"no-op",reason:"outer-route-already-paired"};
 if(r.sg05OutboundOpen!==false||r.und01ReturnOpen!==false||
    r.currentNativeOuterPortalPairReverified!==true||
    r.safeSG05Und01LandingAfterReloadVerified!==true||
    r.innerDoorUnchangedAndLockedVerified!==true||
    r.noItemsOrScriptedPelletsCanBeGrantedOnReloadVerified!==true)
   return {action:"gm-review",reason:"unknown-or-unsafe-outer-route"};
 return {action:"gm-review-rehydrate-only-outer-paired-portals",reason:"restore-travel-no-rewards"};
}