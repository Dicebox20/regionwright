// CAV Chat B L1-D: pure gazebo lantern/second-eye plans, source only.
// Not a Foundry authentication layer or operational adapter. Only consume inputs
// assembled by an elected GM from independent, server-side Region/Item readback.
export const GAZEBO_CONTRACT_VERSION = 1;
export const HISTORICAL_SECOND_EYE_SOURCE_UUID = "Item.QIH1ugEWGOO1U6LN";
// Verified in 2026-10-24 source Item creation receipt, not re-verified in current world.
export const GAZEBO_COMPONENTS = Object.freeze(["oil", "wick"]);
const nonempty = v => typeof v === "string" && v.trim().length > 0;
const itemUuid = v => nonempty(v) && /^Item\.[^.]+$/.test(v);
const regionUuid = (uuid, sceneId) => nonempty(sceneId) && nonempty(uuid) &&
  uuid.startsWith("Scene." + sceneId + ".Region.") &&
  uuid.length > ("Scene." + sceneId + ".Region.").length;
const trusted = r => r?.version === GAZEBO_CONTRACT_VERSION &&
  r?.origin === "elected-gm-readback" && r?.worldId === "cabin-in-the-ashen-veil";
const fixture = (r, regionId, atFlag) =>
  r?.gazeboSceneVerified === true && nonempty(r?.gazeboSceneId) &&
  r?.activeNonGmOwnerAtFixture === true && r?.explicitPlayerAction === true &&
  nonempty(r?.actorId) && nonempty(r?.tokenId) && r?.[atFlag] === true &&
  regionUuid(r?.[regionId], r?.gazeboSceneId);
const partStatusesValid = r => ["none", "installed"].includes(r?.oilStatus) &&
  ["none", "installed"].includes(r?.wickStatus);

export function planGazeboPartInstallation(receipt, component) {
  if (!trusted(receipt)) return {action:"deny", reason:"untrusted-readback"};
  if (!GAZEBO_COMPONENTS.includes(component))
    return {action:"deny", reason:"unsupported-component"};
  if (!fixture(receipt, "lanternRegionUuid", "ownedTokenAtLantern") ||
      receipt.lanternRegionVerified !== true)
    return {action:"deny", reason:"no-authenticated-lantern-interaction"};
  if (receipt.lanternStatus === "reserved" ||
      receipt.oilStatus === "reserved" || receipt.wickStatus === "reserved")
    return {action:"gm-review",reason:"reserved-installation-reconciliation"};
  if (receipt.lanternStatus === "lit")
    return receipt.oilStatus === "installed" && receipt.wickStatus === "installed"
      ? {action:"no-op",reason:"lantern-already-lit"}
      : {action:"gm-review",reason:"lit-with-missing-part-reconciliation"};
  if (receipt.lanternStatus !== "unlit" || !partStatusesValid(receipt))
    return {action:"gm-review",reason:"unknown-or-inconsistent-lantern-ledger"};
  if (receipt[component + "Status"] === "installed")
    return {action:"no-op",reason:"component-already-installed"};
  const canonicalName = component === "oil" ? "Lantern Oil" : "Wick";
  if (receipt.originalPartSourceVerified !== true ||
      receipt.actorCarriesOriginalPart !== true ||
      receipt.partSourceName !== canonicalName ||
      !itemUuid(receipt.expectedPartSourceUuid) ||
      receipt.actorPartSourceUuid !== receipt.expectedPartSourceUuid ||
      !regionUuid(receipt.expectedPartOriginRegionUuid, receipt.expectedPartOriginSceneId) ||
      receipt.actorPartOriginRegionUuid !== receipt.expectedPartOriginRegionUuid ||
      receipt.partSourceProvenanceVerified !== true ||
      (component === "wick" && receipt.authenticWorkshopWickClaimDone !== true) ||
      (component === "oil" && receipt.originalShackOilPickupVerified !== true))
    return {action:"deny",reason:"original-ingredient-provenance-not-certified"};
  // Adapter must reserve the chosen part, secure one authentic actor Item,
  // reread the installed fixture, then finalize. Failure after reserve => GM review.
  return {action:"gm-review-install",component,reason:"reserve-before-single-part-install"};
}

export function planGazeboLanternIgnition(r) {
  if (!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
  if (!fixture(r,"lanternRegionUuid","ownedTokenAtLantern") ||
      r.lanternRegionVerified !== true || r.explicitIgniteAction !== true)
    return {action:"deny",reason:"no-authenticated-ignite-interaction"};
  if (r.lanternStatus === "reserved" || r.eyeTwoMarkerStatus === "reserved" ||
      r.oilStatus === "reserved" || r.wickStatus === "reserved")
    return {action:"gm-review",reason:"reserved-ignite-reconciliation"};
  if (r.lanternStatus === "lit" &&
      ["visible","claimed"].includes(r.eyeTwoMarkerStatus) &&
      r.oilStatus === "installed" && r.wickStatus === "installed")
    return {action:"no-op",reason:"already-ignited-eye-persisted"};
  if (r.lanternStatus !== "unlit" || r.eyeTwoMarkerStatus !== "hidden" ||
      r.oilStatus !== "installed" || r.wickStatus !== "installed")
    return {action:"gm-review",reason:"missing-parts-or-uncertain-lantern-state"};
  if (r.originalOilInstalledVerified !== true ||
      r.originalWickInstalledVerified !== true ||
      r.wickSourceClaimVerified !== true ||
      !itemUuid(r.expectedOilSourceUuid) || !itemUuid(r.expectedWickSourceUuid) ||
      r.installedOilSourceUuid !== r.expectedOilSourceUuid ||
      r.installedWickSourceUuid !== r.expectedWickSourceUuid ||
      r.originalSecondEyeSourceVerified !== true ||
      r.eyeTwoSourceUuid !== HISTORICAL_SECOND_EYE_SOURCE_UUID ||
      r.eyeTwoSourceUuid === r.eyeOneSourceUuid ||
      r.worldwideEyeTwoRewardCopyCount !== 0 ||
      r.eyeTwoPickupRegionVerified !== true ||
      !regionUuid(r.eyeTwoPickupRegionUuid,r.gazeboSceneId))
    return {action:"deny",reason:"original-install-or-eye-source-not-certified"};
  // The optional Rose/Cog/Star family-table outcome is deliberately NOT an input.
  // GM adapter reserves ignition and marker atomically, applies temporary cobweb
  // reveal effect, persists eye-visible marker independent of effect expiry.
  return {action:"gm-review-ignite-and-reveal",reason:"two-original-parts-ready"};
}

export function planGazeboSecondEyePickup(r) {
  if (!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
  if (!fixture(r,"eyeTwoPickupRegionUuid","ownedTokenAtEyeTwoMarker") ||
      r.eyeTwoPickupRegionVerified !== true || r.explicitEyePickupAction !== true)
    return {action:"deny",reason:"no-authenticated-eye-pickup"};
  if (r.eyeTwoMarkerStatus === "reserved" || r.eyeTwoGrantStatus === "reserved" ||
      r.lanternStatus === "reserved")
    return {action:"gm-review",reason:"reserved-eye-claim-reconciliation"};
  if (r.eyeTwoMarkerStatus === "claimed" && r.eyeTwoGrantStatus === "done")
    return {action:"no-op",reason:"eye-already-claimed"};
  if (r.lanternStatus !== "lit" || r.eyeTwoMarkerStatus !== "visible" ||
      r.eyeTwoGrantStatus !== "none")
    return {action:"gm-review",reason:"eye-not-visibly-and-safely-claimable"};
  if (r.originalSecondEyeSourceVerified !== true ||
      r.eyeTwoSourceUuid !== HISTORICAL_SECOND_EYE_SOURCE_UUID ||
      r.eyeTwoSourceUuid === r.eyeOneSourceUuid ||
      r.worldwideEyeTwoRewardCopyCount !== 0 ||
      r.visibleEyeMarkerRehydrated !== true)
    return {action:"deny",reason:"authentic-eye-or-visible-marker-not-certified"};
  // GM adapter reserves before creating ONE original Item copy. No auto-award
  // on lantern ignition or token entry; visual effect expiry never respawns eye.
  return {action:"gm-review-single-eye",reason:"reserve-before-explicit-eye-grant"};
}