// Pure late-game SG-01 eligibility contract. No registration, sockets, Foundry writes or chase launch.
// All booleans must be computed by the elected GM from authoritative readback, never player payloads.
export const SECOND_CHASE_SCENE = "SG-01";
export const SECOND_CHASE_GATE_VERSION = 1;
export const SECOND_CHASE_REQUIRED_PROOFS = Object.freeze([
  "firstChaseCompleted", "waterworksRestored", "allenWarningRead"
]);

export function assessSecondChaseEligibility(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt))
    return { eligible: false, reason: "missing-authoritative-receipt" };
  if (receipt.version !== SECOND_CHASE_GATE_VERSION ||
      receipt.origin !== "elected-gm-readback" ||
      receipt.scene !== SECOND_CHASE_SCENE ||
      typeof receipt.actorId !== "string" || !receipt.actorId.trim() ||
      typeof receipt.tokenId !== "string" || !receipt.tokenId.trim() ||
      receipt.ownedTokenAtNorthwestBust !== true)
    return { eligible: false, reason: "identity-or-location-not-certified" };
  const missing = SECOND_CHASE_REQUIRED_PROOFS.filter(key => receipt[key] !== true);
  if (missing.length) return { eligible: false, reason: "missing-upstream-proofs", missing };
  if (receipt.crimsonVeilStarted === true)
    return { eligible: false, reason: "veil-already-started" };
  if (receipt.secondChaseStatus !== "not-started")
    return { eligible: false, reason: "chase-already-claimed-or-uncertain" };
  return { eligible: true, reason: "eligible-for-gm-chase-review" };
}
