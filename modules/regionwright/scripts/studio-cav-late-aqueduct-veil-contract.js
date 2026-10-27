// CAV Chat B L1-F — pure review decisions, not native Foundry writes/registration.
// The "elected-gm-readback" origin is a description of evidence provenance,
// NOT an authentication mechanism. The integrating GM owns all actual authorization.
export const AQUEDUCT_VEIL_CONTRACT_VERSION = 1;
export const AQUEDUCT_CHARGER_SCENE = "CAVAQ01Scene0001"; // verified upstream Regionwright source
export const ORIGINAL_UNCHARGED_GONDIAN_SOURCE = "Item.pbmUZPfC3WnsBRgi"; // Oct 24 history ONLY
export const ORIGINAL_VEIL_SIXTH_BOOK = "Item.gmTsIOqc3qFBc3zA"; // Oct 24 history ONLY
export const VEIL_PROJECTION_KINDS = Object.freeze([
 "scene-appearance","sophia-bed-sixth-book","veil-privy-access","crooked-man-hostility-off"
]);
const str = v => typeof v === "string" && v.trim().length>0;
const regionOf = (uuid,sceneId) => str(sceneId) && str(uuid) &&
 uuid.startsWith("Scene."+sceneId+".Region.") &&
 uuid.length > ("Scene."+sceneId+".Region.").length;
const trusted = r => r?.version===AQUEDUCT_VEIL_CONTRACT_VERSION &&
 r.origin==="elected-gm-readback" && r.worldId==="cabin-in-the-ashen-veil";
const atCharger = r => trusted(r) && r.aqueductSceneId===AQUEDUCT_CHARGER_SCENE &&
 r.aqueductSceneVerified===true && r.chargerRegionVerified===true &&
 regionOf(r.chargerRegionUuid,AQUEDUCT_CHARGER_SCENE) &&
 r.originalChargingFixtureVerified===true && r.originalChargerReachable===true &&
 r.activeNonGMOwnerVerified===true && r.ownedTokenAtCharger===true &&
 r.explicitUseChargerAction===true && str(r.actorId) && str(r.tokenId) &&
 str(r.actorEmbeddedSourceItemId);
const sourceVerified = r =>
 r.originalWorldSourceItemReverified===true &&
 r.originalSourceUuid===ORIGINAL_UNCHARGED_GONDIAN_SOURCE &&
 r.originalSourceName==="Uncharged Gondian Power Source" &&
 r.originalSourceType==="loot" &&
 r.actorHoldsOriginalSource===true &&
 r.actorSourceUuid===ORIGINAL_UNCHARGED_GONDIAN_SOURCE &&
 r.actorSourceItemType==="loot" &&
 r.actorSourceAcquiredFromRufus===true &&
 r.rufusSourceClaimLedgerDone===true &&
 r.actorSourceOriginSceneId==="CAVHG05Scene0001" &&
 r.rufusSourcePickupRegionVerified===true &&
 regionOf(r.actorSourceOriginRegionUuid,r.actorSourceOriginSceneId) &&
 r.expectedRufusOriginRegionUuid===r.actorSourceOriginRegionUuid &&
 r.originalSourceInventoryCopyCount===1 &&
 r.worldwideSourceActorCopyCount===1 &&
 r.unchargedToChargedPreservesItemIdentity===true;

export function planAqueductSourceCharge(r) {
 if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
 if(!atCharger(r)) return {action:"deny",reason:"unverified-source-or-charger-interaction"};
 if(r.chargeLedgerStatus==="reserved" || r.veilLedgerStatus==="reserved")
   return {action:"gm-review",reason:"reserved-charge-or-veil-transaction"};
 if(r.chargeLedgerStatus==="done" && r.veilLedgerStatus==="active")
   return {action:"no-op",reason:"already-charged-and-veil-active"};
 if(r.chargeLedgerStatus!=="none" || r.veilLedgerStatus!=="dormant")
   return {action:"gm-review",reason:"unknown-or-partial-global-transaction"};
 if(!sourceVerified(r) || r.actorSourceChargeState!=="uncharged" ||
    r.currentVeilFlagCertifiesDormant!==true ||
    r.singleCanonicalVeilLedgerVerified!==true ||
    r.safeAqueductReturnAvailable!==true ||
    r.noPriorSourceChargeTransaction!==true ||
    r.sourcePriorChargeCount!==0)
   return {action:"deny",reason:"source-custody-route-or-dormant-state-not-certified"};
 // The elected GM must reserve one canonical ledger FIRST, with actor/Item/token
 // identity and unique transaction id. Then update IN PLACE the embedded original
 // Item's charge flag, independently reread, and commit the Veil phase ONCE.
 // No second Item template, extra puzzle, nighttime timer, or automatic token event.
 return {action:"gm-review-reserve-single-charge",reason:"explicit-original-source-use"};
}

export function planCrimsonVeilCommit(r) {
 if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
 if(r.chargeLedgerStatus==="done" && r.veilLedgerStatus==="active" &&
    r.canonicalVeilLedgerVersion===1 && r.actorSourceChargeState==="charged" &&
    r.verifiedSourceChargeCount===1)
   return {action:"no-op",reason:"already-active"};
 if(r.chargeLedgerStatus!=="reserved" || r.veilLedgerStatus!=="reserved")
   return {action:"gm-review",reason:"no-unambiguous-reserved-transition"};
 if(!str(r.reservationId) || !str(r.actorId) || !str(r.actorEmbeddedSourceItemId) ||
    r.chargeReservationId!==r.reservationId ||
    r.veilReservationId!==r.reservationId ||
    r.reservedActorId!==r.actorId ||
    r.reservedEmbeddedItemId!==r.actorEmbeddedSourceItemId ||
    r.originalSourceUuid!==ORIGINAL_UNCHARGED_GONDIAN_SOURCE ||
    r.actorSourceUuid!==ORIGINAL_UNCHARGED_GONDIAN_SOURCE ||
    r.actorSourceChargeState!=="charged" ||
    r.itemChargeProofFromIndependentReadback!==true ||
    r.verifiedSourceChargeCount!==1 ||
    r.sourceItemIdentityUnchanged!==true ||
    r.canonicalVeilLedgerVersion!==1 ||
    r.originalSourceInventoryCopyCount!==1 ||
    r.worldwideSourceActorCopyCount!==1 ||
    r.canonicalVeilStillDormantPreCommit!==true ||
    r.noPreviousVeilActiveTransitionVerified!==true)
   return {action:"gm-review",reason:"reserved-effects-uncertain-reconcile-manually"};
 // Native GM service must persist canonical phase ACTIVE once and reread. Scene
 // variants, bed Book, Privy and non-hostile Crooked Man are derived projections.
 // No claim of ACID atomicity across Foundry embedded Items/Scenes.
 return {action:"gm-review-commit-one-global-veil-transition",reason:"charged-source-independent-proof"};
}

export function planVeilSceneProjection(r) {
 if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
 if(!VEIL_PROJECTION_KINDS.includes(r.projectionKind))
   return {action:"deny",reason:"unrecognized-veil-projection"};
 if(r.canonicalVeilLedgerStatus!=="active" ||
    r.canonicalVeilLedgerVersion!==1 ||
    r.canonicalChargeStatus!=="done" ||
    r.originalSourceUuid!==ORIGINAL_UNCHARGED_GONDIAN_SOURCE ||
    r.originalSourceChargeState!=="charged" ||
    r.globalVeilTransitionCount!==1 ||
    r.authoritativePhaseReadbackVerified!==true)
   return {action:"deny",reason:"global-veil-activation-not-certified"};
 if(r.projectionLedgerStatus==="reserved")
   return {action:"gm-review",reason:"projection-reserved-needs-reconciliation"};
 if(r.projectionLedgerStatus==="done" && r.physicalSceneProjectionPresent===true)
   return {action:"no-op",reason:"scene-projection-already-applied"};
 const restoring=r.projectionLedgerStatus==="done" && r.physicalSceneProjectionPresent===false;
 if(r.projectionLedgerStatus!=="none" && !restoring)
   return {action:"gm-review",reason:"projection-ledger-uncertain"};
 if((restoring && (r.projectionCanRehydrateWithoutRewards!==true ||
    r.projectionPreExistingItemOwnershipUnchanged!==true)) ||
    (!restoring && r.physicalSceneProjectionPresent!==false))
   return {action:"gm-review",reason:"physical-projection-state-uncertain"};
 if(r.approvedProjectionManifestVerified!==true ||
    r.originalSceneVerified!==true ||
    !str(r.sceneId) ||
    r.manifestSceneId!==r.sceneId ||
    r.manifestProjectionKind!==r.projectionKind ||
    r.safeSceneGeometryVerified!==true ||
    r.sceneVariantPairVerified!==true)
   return {action:"deny",reason:"unverified-variant-or-projection-manifest"};
 if(r.projectionKind==="sophia-bed-sixth-book" &&
   (r.sceneId!=="CAVHU05Scene0001" ||
    r.originalSixthBookReverified!==true ||
    r.sixthBookSourceUuid!==ORIGINAL_VEIL_SIXTH_BOOK ||
    r.sixthBookSourceName!=="Princess Penelope and the Sea of Stars" ||
    r.sixthBookAlreadyClaimedByPlayer!==false ||
    r.bookStagingPlanKeepsItemInScene!==true ||
    r.sophiaBedPickupFixtureVerified!==true))
   return {action:"deny",reason:"veil-only-book-staging-not-certified"};
 if(r.projectionKind==="crooked-man-hostility-off" &&
   (r.hostilityDisablePlanVerified!==true || r.deactivationBoundToCanonicalVeil!==true))
   return {action:"deny",reason:"hostile-pursuit-safety-plan-not-verified"};
 // Any projection is repeatable from canonical ACTIVE without retriggering it.
 // Reserve->project->verify->done and treat uncertain projection as STOP.
 return {action:restoring?"gm-review-rehydrate-veil-projection":"gm-review-stage-veil-projection",kind:r.projectionKind};
}