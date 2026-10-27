// Cabin in the Ashen Veil — Chat B L1-L pure safety/eligibility contracts.
// NO Foundry writes; no hooks, sockets, macros, actor grants, teleport invocation,
// module registration, scene art changes or initiative/encounter automation.
// A receipt origin label is NOT authentication. Native elected-GM service must
// independently verify requester, actor, token, Regions and original Item.
export const INNER_UNDERCROFT_CONTRACT_VERSION=1;
export const UND01_APPROACH="CN5fkK2QLUELBGGR";
export const UND02_REFUGE="ywpIpQDrkMLIgUP0";
export const SG05_CLEARING="CAVSG05Scene0001";
export const HB02_VAULT="tjTpG2RVZNoCqRLh";
export const ORIGINAL_SUNE_BOWL="Item.1n5LONw3nYIy61O9";
export const ORIGINAL_KEYSTONE="Item.CAVKEYSTONEITEM1"; // Owner delegated, GM_LIBRARY_ONLY until Vault plinth claim
export const ORIGINAL_GOND_HALF="Item.o9G3UJjEe2QX1ZH0";
export const ORIGINAL_SUNE_HALF="Item.t9uCIpsKeSvtC31w";
const text=v=>typeof v==="string"&&v.trim().length>0;
const itemUuid=v=>text(v)&&/^Item\.[A-Za-z0-9_-]{6,64}$/.test(v);
const region=(v,s)=>text(s)&&text(v)&&v.startsWith("Scene."+s+".Region.")&&v.length>("Scene."+s+".Region.").length;
const certified=r=>r?.version===INNER_UNDERCROFT_CONTRACT_VERSION&&r.origin==="elected-gm-readback"&&r.worldId==="cabin-in-the-ashen-veil";
const owned=r=>r?.explicitPlayerAction===true&&r.activeNonGmOwnerVerified===true&&
 r.actorOwnershipFromGmVerified===true&&r.tokenInRegionFromGmVerified===true&&
 text(r.actorId)&&text(r.tokenId);
const onScene=(r,scene)=>certified(r)&&owned(r)&&r.sceneId===scene&&r.sceneCurrentSourceVerified===true&&
 r.interactionRegionVerified===true&&region(r.interactionRegionUuid,scene);
const approach=r=>onScene(r,UND01_APPROACH)&&
 r.originalApprovedUnd01V002ArtVerified===true&&
 r.originalInnerCarvedDoorVisibleVerified===true&&
 r.originalRoseGearRecessAtChestHeightVerified===true&&
 r.originalStoneLeverSeparateFromRecessVerified===true&&
 r.noAlternateInnerDoorRouteVerified===true;
const outerOpen=r=>r.outerUndercroftGateLedger==="open"&&
 r.outerStatueBowlLedger==="installed"&&r.outerStatuePelletLedger==="installed"&&
 r.outerGateFromRealBowl027Verified===true&&
 r.outerBidirectionalRouteCurrentlySafeVerified===true&&
 r.originalSG05EntryIntoUnd01Verified===true&&
 r.originalSG05SceneId===SG05_CLEARING;
const keystone=r=>r.currentWorldKeystoneTemplateReverified===true&&
 r.originalKeystoneSourceOwnerApprovedVerified===true&&
 r.keystoneTemplateUuid===ORIGINAL_KEYSTONE&&
 r.keystoneSourceName==="Keystone"&&r.keystoneSourceType==="loot"&&
 r.keystoneTemplateUuid!==ORIGINAL_SUNE_BOWL&&
 r.keystoneTemplateUuid!==ORIGINAL_GOND_HALF&&
 r.keystoneTemplateUuid!==ORIGINAL_SUNE_HALF&&
 r.originalVaultSceneId===HB02_VAULT&&
 r.vaultKeystonePickupLedger==="done"&&
 r.vaultKeystoneClaimReceiptIndependentlyVerified===true&&
 r.keystoneObtainedAtOriginalVaultPlinthVerified===true&&
 r.uniqueKeystoneProvenanceAndNoCopiesVerified===true;

export function planInnerKeystoneRecessInsert(r){
 if(!certified(r))return {action:"deny",reason:"untrusted-gm-readback"};
 if(!approach(r)||r.explicitInsertKeystone!==true||
    r.recessRegionSourceVerified!==true||
    !region(r.recessRegionUuid,UND01_APPROACH))
   return {action:"deny",reason:"original-underside-recess-or-actor-not-certified"};
 if(!outerOpen(r))return {action:"deny",reason:"outer-undercroft-not-authentically-open"};
 if(r.recessLedgerStatus==="reserved"||r.innerDoorLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-recess-or-door-transaction"};
 if(r.recessLedgerStatus==="installed")
   return r.installedOriginalKeystonePhysicallyVerified===true&&
      keystone(r)&&r.installedKeystoneSourceUuid===r.keystoneTemplateUuid&&
      r.innerDoorStillSealedUntilLeverVerified===true
     ? {action:"no-op",reason:"original-keystone-already-installed"}
     : {action:"gm-review",reason:"installed-keystone-readback-uncertain"};
 if(r.recessLedgerStatus!=="empty"||r.innerDoorLedgerStatus!=="sealed")
   return {action:"gm-review",reason:"partial-inner-door-stage"};
 if(r.originalInnerDoorNonTraversableVerified!==true||
    r.innerStoneWallClosedVerified!==true||
    r.stoneLeverUnpulledVerified!==true||
    r.innerDoorCanOnlyOpenWithLeverVerified!==true||
    !keystone(r)||
    r.actorHoldsAuthenticKeystone!==true||
    r.actorEmbeddedKeystoneSourceUuid!==r.keystoneTemplateUuid||
    r.actorOwnedKeystoneEmbeddedItemVerified!==true||
    r.actorKeystoneUninstalledElsewhereVerified!==true||
    r.nativeUniqueKeystoneCustodyTransactionPlanned!==true)
   return {action:"deny",reason:"original-keystone-or-initial-door-not-certified"};
 // Native GM must reserve, install SAME original source without duplication,
 // reread fixture + actor, commit. Insertion alone does not open the wall.
 return {action:"gm-review-reserve-keystone-in-original-recess",reason:"install-one-original-without-opening-inner-door"};
}

export function planInnerStoneLeverPress(r){
 if(!certified(r))return {action:"deny",reason:"untrusted-gm-readback"};
 if(!approach(r)||r.explicitPressStoneLever!==true||
    r.originalStoneLeverRegionVerified!==true||
    !region(r.stoneLeverRegionUuid,UND01_APPROACH))
   return {action:"deny",reason:"not-original-stone-lever-player-action"};
 if(!outerOpen(r))return {action:"deny",reason:"outer-route-not-open"};
 if(r.innerDoorLedgerStatus==="reserved"||r.leverLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-inner-door-or-lever"};
 if(r.innerDoorLedgerStatus==="open"&&r.leverLedgerStatus==="pressed")
   return r.nativeInnerPortalAndSafeReturnOpenVerified===true&&
     r.installedOriginalKeystonePhysicallyVerified===true&&
     keystone(r)&&r.installedKeystoneSourceUuid===r.keystoneTemplateUuid&&
     r.originalDoorPermanentUnlockProofVerified===true?
      {action:"no-op",reason:"inner-door-already-open"}:
      {action:"gm-review",reason:"inner-open-readback-uncertain"};
 if(r.innerDoorLedgerStatus!=="sealed"||r.leverLedgerStatus!=="ready")
   return {action:"gm-review",reason:"partial-lever-or-door-ledger"};
 if(r.recessLedgerStatus!=="installed"||
    r.installedOriginalKeystonePhysicallyVerified!==true||
    !keystone(r)||r.installedKeystoneSourceUuid!==r.keystoneTemplateUuid||
    r.keystoneWasPhysicallyInstalledIntoUnd01RecessVerified!==true||
    r.innerStoneWallClosedVerified!==true)
   return {action:"deny",reason:"original-keystone-not-yet-installed"};
 if(r.refugeSceneId!==UND02_REFUGE||r.refugeCurrentSceneVerified!==true||
    r.originalApprovedUnd02V002ArtVerified!==true||
    r.originalUnd01DoorwayRegionVerified!==true||
    !region(r.und01InnerThresholdRegionUuid,UND01_APPROACH)||
    r.originalUnd02ArrivalRegionVerified!==true||
    !region(r.und02ArrivalRegionUuid,UND02_REFUGE)||
    r.nativeUnd01ToUnd02PortalVerified!==true||
    r.nativeUnd02ToUnd01ReturnVerified!==true||
    r.safeArrivalAndReturnVerified!==true||
    r.partyTokenLocationsSafeForPermanentDoorChange!==true||
    r.innerPortalCurrentlyDisabledVerified!==true||
    r.originalInnerDoorClosedCollisionVerified!==true||
    r.preventOtherRoutesOrVossShortcutsVerified!==true||
    r.noAutomaticTokenTeleportOnPressVerified!==true||
    r.originalDoorPermanentUnlockPlanVerified!==true)
   return {action:"deny",reason:"inner-refuge-route-or-safety-not-certified"};
 // Transaction: reserve -> open original collision/paired Regions -> native
 // reread -> commit permanently open. No player teleport/loot/combat here.
 return {action:"gm-review-permanently-unlock-inner-door",reason:"separate-verified-lever-action"};
}

export function planInnerRefugeThresholdCrossing(r){
 if(!certified(r))return {action:"deny",reason:"untrusted-gm-readback"};
 if(!onScene(r,UND01_APPROACH)||r.originalInnerThresholdRegionVerified!==true||
    !region(r.innerThresholdRegionUuid,UND01_APPROACH)||
    r.explicitPlayerCrossing!==true)
   return {action:"deny",reason:"not-original-inner-threshold-crossing"};
 if(!outerOpen(r)||r.recessLedgerStatus!=="installed"||
    r.leverLedgerStatus!=="pressed"||r.innerDoorLedgerStatus!=="open")
   return {action:"deny",reason:"keystone-door-still-sealed"};
 if(r.crossingLedgerStatus==="reserved")return {action:"gm-review",reason:"reserved-inner-crossing"};
 if(r.crossingLedgerStatus!=="ready")return {action:"gm-review",reason:"uncertain-inner-crossing"};
 if(r.refugeSceneId!==UND02_REFUGE||r.refugeCurrentSceneVerified!==true||
    r.nativeUnd01ToUnd02PortalEnabledVerified!==true||
    r.nativeUnd02ReturnEnabledVerified!==true||
    r.currentInnerDoorCollisionOpenVerified!==true||
    r.safeDestinationAndReturnReverified===false||
    r.safeDestinationAndReturnReverified!==true||
    r.noOneWayTrapVerified!==true||
    r.notRitualChamberPortalVerified!==true||
    r.notVossCollapsedTranspositionVerified!==true)
   return {action:"deny",reason:"unsafe-or-unauthorized-inner-crossing"};
 // Intentional native travel only; does not automatically trigger final encounter.
 return {action:"gm-review-cross-original-inner-threshold",reason:"safe-und01-to-und02-route-only"};
}

export function planRefugeNarrativeInspection(r){
 if(!certified(r))return {action:"deny",reason:"untrusted-gm-readback"};
 if(!onScene(r,UND02_REFUGE)||r.explicitInspectRefugeEvidence!==true||
    r.innerDoorLedgerStatus!=="open"||
    r.arrivedByCertifiedInnerDoorVerified!==true||
    r.originalUnd02RefugeArtAndEvidenceAnchorsVerified!==true)
   return {action:"deny",reason:"refuge-evidence-not-reachable"};
 if(r.refugeEvidenceInspectionStatus==="reserved")
   return {action:"gm-review",reason:"reserved-refuge-inspection"};
 if(r.refugeEvidenceInspectionStatus==="done"&&r.playerReceivedOriginalReadOnlyClueVerified===true)
   return {action:"no-op",reason:"original-refuge-clue-already-inspected"};
 if(r.refugeEvidenceInspectionStatus!=="none")
   return {action:"gm-review",reason:"refuge-inspection-ledger-uncertain"};
 if(r.donovanBrokenToolsInsideVerified!==true||
    r.donovanRemainsNearInnerDoorFaceVerified!==true||
    r.sophiaRemainsFartherInsideVerified!==true||
    r.scratchMarksOnlyOnInsideFaceVerified!==true||
    r.noPrematureEvidenceOutsideUnd01Verified!==true||
    r.ashStoneVossPlanarTraceInspectableOnlyBeyondDoorVerified!==true||
    r.singleUsePlanarTranspositionCollapsedVerified!==true||
    r.vossTransitCannotReactivateOrBypassDoorVerified!==true||
    r.ritualChamberEncounterStillDeferredVerified!==true||
    r.noLootOrActorMutationDuringClueVerified!==true)
   return {action:"deny",reason:"original-inner-face-evidence-not-certified"};
 // Notice/read journal only: no authored final chamber, enemy, reward or alternate portal.
 return {action:"gm-review-show-refuge-evidence-only",reason:"player-triggered-readonly-clue"};
}

export function planInnerDoorRehydrate(r){
 if(!certified(r))return {action:"deny",reason:"untrusted-gm-readback"};
 if(r.innerDoorLedgerStatus!=="open"||r.leverLedgerStatus!=="pressed"||
    r.authoritativeInnerOpenReadbackVerified!==true||
    r.recessLedgerStatus!=="installed"||
    r.approachSceneId!==UND01_APPROACH||r.refugeSceneId!==UND02_REFUGE||
    r.currentOriginalInnerKeystoneInstalledVerified!==true)
   return {action:"deny",reason:"not-original-verified-permanently-open-inner-door"};
 if(r.innerRouteRehydrateLedger==="reserved")
   return {action:"gm-review",reason:"reserved-inner-route-rehydrate"};
 if(r.und01NativePortalOpen===true&&r.und02SafeReturnOpen===true&&
    r.originalInnerDoorCollisionOpen===true)
   return r.nativePairedRouteReadbackVerified===true&&
     r.safeLandingAndReturnAfterReloadVerified===true&&
     r.outerRouteUnaffectedVerified===true?
      {action:"no-op",reason:"inner-passage-already-open"}:
      {action:"gm-review",reason:"inner-no-op-route-uncertain"};
 if(r.und01NativePortalOpen!==false||r.und02SafeReturnOpen!==false||
    r.originalInnerDoorCollisionOpen!==false||
    r.nativePairedRouteReadbackVerified!==true||
    r.safeLandingAndReturnAfterReloadVerified!==true||
    r.originalApprovedUnd01Und02CollisionGeometryVerified!==true||
    r.outerRouteUnaffectedVerified!==true||
    r.doNotGrantKeystoneOrChangeInventoryOnReloadVerified!==true||
    r.noCombatOrRitualChamberDoorDuringReloadVerified!==true)
   return {action:"gm-review",reason:"inner-rehydrate-geometry-or-reward-uncertain"};
 return {action:"gm-review-restore-only-inner-safe-portals",reason:"retain-original-keystone-and-permanent-unlock"};
}