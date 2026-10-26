// Chat B L1-B: pure source-only plans for the second-chase Silver Tiny Key and Hope Chest.
// These do not mutate Foundry, authenticate users, create Items, or trigger a chase.
// The elected-GM adapter MUST build all inputs from server-side readback, not client claims.
// Original source Item/Region UUIDs are intentionally unresolved until Chat A verifies them.
export const LATE_REWARD_CONTRACT_VERSION = 1;
export const HOPE_CHEST_SCENE_ID = "CAVHU04Scene0001";

const nonempty = value => typeof value === "string" && value.trim().length > 0;
const trusted = r => r?.version === LATE_REWARD_CONTRACT_VERSION &&
  r?.origin === "elected-gm-readback";

export function planSilverTinyKeyMarker(receipt) {
  if (!trusted(receipt)) return { action: "deny", reason: "untrusted-or-missing-readback" };
  // A skipped chase after the Veil is NOT permission for an automatic payout.
  if (receipt.crimsonVeilStarted === true && receipt.secondChaseStatus !== "completed")
    return { action: "gm-review", reason: "post-veil-skipped-chase-recovery" };
  if (receipt.secondChaseStatus !== "completed" ||
      !["escaped", "captured"].includes(receipt.secondChaseOutcome))
    return { action: "deny", reason: "second-chase-not-finalized" };
  const status = receipt.silverKeyMarkerStatus;
  if (status === "reserved")
    return { action: "gm-review", reason: "uncertain-marker-transaction" };
  if (status === "visible")
    return { action: "no-op", reason: "existing-recoverable-marker" };
  if (status === "claimed")
    return { action: "no-op", reason: "key-already-claimed" };
  if (status !== "none")
    return { action: "gm-review", reason: "unrecognized-marker-state" };
  if (receipt.northwestBustScene !== "SG-01" ||
      receipt.bustRegionVerified !== true ||
      receipt.keySourceVerified !== true ||
      !nonempty(receipt.bustRegionUuid) ||
      !nonempty(receipt.silverKeySourceUuid) ||
      !receipt.silverKeySourceUuid.startsWith("Item."))
    return { action: "deny", reason: "missing-authentic-source-or-location" };
  // Caller must reserve the persistent Region ledger first and require physical
  // source/marker reread before marking visible. Never grant an Item here.
  return { action: "stage-marker", reason: "eligible-for-once-only-ground-marker" };
}

export function assessHopeChestUnlock(receipt) {
  if (!trusted(receipt)) return { eligible: false, reason: "untrusted-or-missing-readback" };
  if (receipt.chestSceneId !== HOPE_CHEST_SCENE_ID ||
      receipt.chestRegionVerified !== true ||
      !nonempty(receipt.chestRegionUuid) ||
      !receipt.chestRegionUuid.startsWith("Scene." + HOPE_CHEST_SCENE_ID + ".Region.") ||
      receipt.explicitPlayerClick !== true ||
      receipt.activeNonGMOwnerAtChest !== true ||
      !nonempty(receipt.actorId) || !nonempty(receipt.tokenId))
    return { eligible: false, reason: "unauthorized-or-wrong-chest-context" };
  if (receipt.chestLedgerStatus === "reserved")
    return { eligible: false, reason: "manual-reconciliation-required" };
  if (receipt.chestLedgerStatus === "unlocked")
    return { eligible: false, reason: "already-unlocked" };
  if (receipt.chestLedgerStatus !== "locked")
    return { eligible: false, reason: "unknown-chest-ledger" };
  if (receipt.sourceRegistryVerified !== true ||
      !nonempty(receipt.expectedSilverKeySourceUuid) ||
      !receipt.expectedSilverKeySourceUuid.startsWith("Item.") ||
      !nonempty(receipt.expectedMarkerRegionUuid) ||
      !receipt.expectedMarkerRegionUuid.startsWith("Scene.") ||
      receipt.actorInventorySilverKeyPresent !== true ||
      receipt.keyItemSourceUuid !== receipt.expectedSilverKeySourceUuid ||
      receipt.keyItemMarkerRegionUuid !== receipt.expectedMarkerRegionUuid)
    return { eligible: false, reason: "authentic-silver-key-required" };
  // Never consume the key, materialize a Music Box, or mark a chest opened here.
  return { eligible: true, reason: "eligible-for-gm-once-only-chest-unlock" };
}