// Chat B L1-C. Pure GM-review decisions; neither authenticates a Foundry request nor changes documents.
// All input MUST come from an elected-GM adapter's independent scene/item/ledger readback, never player flags.
export const LATE_MUSIC_PRAYER_VERSION = 1;
export const PARENTS_SCENE_ID = "CAVHU04Scene0001";
const has = value => typeof value === "string" && value.trim().length > 0;
const itemUuid = value => has(value) && value.startsWith("Item.");
const regionUuid = value => has(value) && value.startsWith("Scene.") && value.includes(".Region.");
const trust = r => r?.version === LATE_MUSIC_PRAYER_VERSION && r?.origin === "elected-gm-readback";
const ownerAt = r => r?.activeNonGmOwnerAtFixture === true &&
  r?.explicitPlayerClick === true && has(r?.actorId) && has(r?.tokenId);

export function planMusicBoxClaim(r) {
  if (!trust(r)) return {action:"deny",reason:"untrusted-readback"};
  if (r.chestSceneId !== PARENTS_SCENE_ID ||
      r.chestLedgerStatus !== "unlocked" ||
      r.chestRegionVerified !== true ||
      !regionUuid(r.chestRegionUuid) ||
      !r.chestRegionUuid.startsWith("Scene."+PARENTS_SCENE_ID+".Region.") ||
      !ownerAt(r)) return {action:"deny",reason:"chest-or-player-not-certified"};
  if (r.musicBoxClaimStatus === "reserved") return {action:"gm-review",reason:"uncertain-claim"};
  if (r.musicBoxClaimStatus === "done") return {action:"no-op",reason:"already-claimed"};
  if (r.musicBoxClaimStatus !== "none") return {action:"gm-review",reason:"unknown-claim-state"};
  if (r.originalMusicBoxVerified !== true || !itemUuid(r.musicBoxSourceUuid) ||
      r.musicBoxSourceName !== "Ornate Music Box" ||
      r.worldwideMusicBoxRewardCopyCount !== 0)
    return {action:"deny",reason:"source-or-duplication-not-certified"};
  return {action:"gm-review-claim",reason:"reserve-before-single-item-grant"};
}

export function planPrayerProtectionClaim(r) {
  if (!trust(r)) return {action:"deny",reason:"untrusted-readback"};
  if (!ownerAt(r) || r.ornateMusicBoxPresentOnActingActor !== true ||
      r.boxSourceVerified !== true || !itemUuid(r.expectedMusicBoxSourceUuid) ||
      r.actingBoxSourceUuid !== r.expectedMusicBoxSourceUuid ||
      !regionUuid(r.expectedChestRegionUuid) ||
      r.actingBoxChestRegionUuid !== r.expectedChestRegionUuid ||
      r.originalSilverKeyPresentOnActingActor !== true ||
      r.originalSilverKeyProvenanceVerified !== true ||
      r.explicitOpenMusicBoxAction !== true)
    return {action:"deny",reason:"original-box-key-or-actor-not-certified"};
  if (r.prayerClaimStatus === "reserved" || r.boxOpenStatus === "reserved")
    return {action:"gm-review",reason:"uncertain-transaction"};
  if (r.prayerClaimStatus === "done") return {action:"no-op",reason:"prayer-already-recovered"};
  if (r.prayerClaimStatus !== "none" || !["closed","open"].includes(r.boxOpenStatus))
    return {action:"gm-review",reason:"unknown-box-or-prayer-ledger"};
  if (r.originalPrayerVerified !== true ||
      !itemUuid(r.prayerSourceUuid) ||
      r.prayerSourceName !== "Prayer of Protection" ||
      r.worldwidePrayerRewardCopyCount !== 0)
    return {action:"deny",reason:"prayer-source-or-duplication-not-certified"};
  // Ledger: reserve BEFORE opening the box and before creating the original Prayer copy.
  // An adapter must reread both, and persist done only after exact creation/visibility proof.
  return {action:"gm-review-prayer",reason:"reserve-before-single-prayer-claim"};
}