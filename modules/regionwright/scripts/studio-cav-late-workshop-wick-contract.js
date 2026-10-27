// Chat B L1-C. Pure elected-GM review contract: Studio Sune altar -> Candle Workshop Wick.
// Foundry actual Art Studio H-U07 and Workshop H-U08; old H-G scene codes
// are obsolete. Scene/Region/Item UUIDs require elected-GM readback.
// This file has NO Foundry imports, side effects, native portal edits, or UI panels.
export const LATE_WORKSHOP_CONTRACT_VERSION = 1;
export const STUDIO_CANON_CODE = "H-U07";
export const STUDIO_SCENE_ID = "CAVHU07Scene0001";
export const WORKSHOP_CANON_CODE = "H-U08";
export const WORKSHOP_SCENE_ID = "CAVHU08Scene0001";
const nonempty = v => typeof v === "string" && v.trim().length > 0;
const item = v => nonempty(v) && v.startsWith("Item.");
const region = (v,scene) => nonempty(scene) && nonempty(v) &&
  v.startsWith("Scene."+scene+".Region.") && v.length > ("Scene."+scene+".Region.").length;
const authorized = r => r?.version === LATE_WORKSHOP_CONTRACT_VERSION &&
  r?.origin === "elected-gm-readback";
const tokenAction = r => r?.activeNonGmOwnerAtFixture === true &&
  r?.explicitPlayerAction === true && nonempty(r?.actorId) && nonempty(r?.tokenId);

export function planStudioPrayerPassage(r) {
  if (!authorized(r)) return {action:"deny",reason:"untrusted-readback"};
  if (!tokenAction(r) || r.studioCode !== STUDIO_CANON_CODE ||
      r.workshopCode !== WORKSHOP_CANON_CODE ||
      r.studioSceneId !== STUDIO_SCENE_ID ||
      r.workshopSceneId !== WORKSHOP_SCENE_ID ||
      r.ownedTokenAtSuneAltar !== true ||
      r.studioAltarRegionVerified !== true ||
      !region(r.studioAltarRegionUuid,r.studioSceneId) ||
      r.explicitReadPrayerJournalAction !== true ||
      r.originalPrayerHeldByActingActor !== true ||
      r.originalPrayerSourceVerified !== true ||
      !item(r.expectedPrayerSourceUuid) ||
      r.heldPrayerSourceUuid !== r.expectedPrayerSourceUuid ||
      r.heldPrayerFromMusicBoxProvenanceVerified !== true)
    return {action:"deny",reason:"altar-reading-or-prayer-provenance-not-certified"};
  if (r.passageStatus === "reserved" || r.prayerReadStatus === "reserved")
    return {action:"gm-review",reason:"reserved-transition-reconciliation"};
  if (r.prayerReadStatus === "read" && r.passageStatus === "open")
    return {action:"no-op",reason:"already-open"};
  if (r.prayerReadStatus !== "unread" || r.passageStatus !== "sealed")
    return {action:"gm-review",reason:"inconsistent-read-or-passage-ledger"};
  if (!nonempty(r.studioSceneId) || !nonempty(r.workshopSceneId) ||
      r.verifiedStudioWorkshopPortalPair !== true ||
      r.workshopSceneExists !== true ||
      r.safeArrivalVerified !== true ||
      r.safeReturnVerified !== true ||
      r.initialPassageSealed !== true ||
      !region(r.studioPassageRegionUuid,r.studioSceneId) ||
      !region(r.workshopReturnRegionUuid,r.workshopSceneId))
    return {action:"deny",reason:"unsafe-or-unverified-native-route"};
  // Output permits only a GM review. The adapter must atomically reserve,
  // open the existing native passage, verify return/safe landing and finish both ledgers.
  return {action:"gm-review-open-passage",reason:"read-at-altar-and-route-certified"};
}

export function planWorkshopWickPickup(r) {
  if (!authorized(r)) return {action:"deny",reason:"untrusted-readback"};
  if (!tokenAction(r) || r.workshopCode !== WORKSHOP_CANON_CODE ||
      r.workshopSceneId !== WORKSHOP_SCENE_ID ||
      r.workshopSceneVerified !== true ||
      r.ownedTokenAtWickFixture !== true ||
      !region(r.wickRegionUuid,r.workshopSceneId) ||
      r.authenticPassageOpenLedger !== true)
    return {action:"deny",reason:"workshop-or-actor-not-certified"};
  if (r.wickClaimStatus === "reserved")
    return {action:"gm-review",reason:"reserved-claim-reconciliation"};
  if (r.wickClaimStatus === "done")
    return {action:"no-op",reason:"wick-already-claimed"};
  if (r.wickClaimStatus !== "none")
    return {action:"gm-review",reason:"unknown-wick-ledger"};
  if (r.originalWickSourceVerified !== true ||
      !item(r.wickSourceUuid) ||
      r.wickSourceName !== "Wick" ||
      r.worldwideWickRewardCopyCount !== 0)
    return {action:"deny",reason:"original-wick-or-global-duplicate-not-certified"};
  return {action:"gm-review-single-wick",reason:"reserve-before-authentic-wick-grant"};
}