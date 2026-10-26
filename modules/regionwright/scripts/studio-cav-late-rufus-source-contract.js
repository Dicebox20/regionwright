// Cabin in the Ashen Veil / Chat B L1-E — pure Rufus source contract.
// NO native document writes, messages, Hooks, UI, item creation, or player-authorized flags.
// Integrating GM must independently derive all receipts from authoritative Foundry documents.
export const RUFUS_CONTRACT_VERSION = 1;
export const RUFUS_STUDY_SCENE_ID = "CAVHG05Scene0001";
export const HISTORICAL_RUFUS_ITEMS = Object.freeze({
  firstEye: "Item.mN1dk0qlr7hyfupk",
  secondEye: "Item.QIH1ugEWGOO1U6LN",
  unchargedSource: "Item.pbmUZPfC3WnsBRgi"
});
export const RUFUS_EYE_SLOTS = Object.freeze(["first", "second"]);
const nonempty = v => typeof v === "string" && v.trim().length > 0;
const regionUuid = (uuid,sceneId) => nonempty(sceneId) && nonempty(uuid) &&
  uuid.startsWith("Scene." + sceneId + ".Region.") &&
  uuid.length > ("Scene." + sceneId + ".Region.").length;
const itemUuid = v => nonempty(v) && /^Item\.[^.]+$/.test(v);
const trusted = r => r?.version === RUFUS_CONTRACT_VERSION &&
  r?.origin === "elected-gm-readback" && r?.worldId === "cabin-in-the-ashen-veil";
const activeAtRufus = r => trusted(r) &&
  r.studySceneId === RUFUS_STUDY_SCENE_ID &&
  r.studySceneVerified === true &&
  r.rufusRegionVerified === true &&
  regionUuid(r.rufusRegionUuid,RUFUS_STUDY_SCENE_ID) &&
  r.originalRufusFixtureVerified === true &&
  r.studyDoorUnlockedVerified === true &&
  r.nonGmActiveActorOwnerVerified === true &&
  r.ownedTokenAtRufus === true &&
  nonempty(r.actorId) && nonempty(r.tokenId) &&
  r.explicitPlayerAction === true;
const validEyeStatuses = r => ["empty", "installed"].includes(r?.firstSocketStatus) &&
  ["empty", "installed"].includes(r?.secondSocketStatus);

export function planRufusEyeInstallation(r,slot) {
  if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
  if(!RUFUS_EYE_SLOTS.includes(slot)) return {action:"deny",reason:"unsupported-socket"};
  if(!activeAtRufus(r)) return {action:"deny",reason:"rufus-player-context-not-certified"};
  if(r.firstSocketStatus === "reserved" || r.secondSocketStatus === "reserved")
    return {action:"gm-review",reason:"reserved-eye-install-reconciliation"};
  if(!validEyeStatuses(r)) return {action:"gm-review",reason:"unknown-socket-ledger"};
  if(r[slot+"SocketStatus"] === "installed")
    return {action:"no-op",reason:"eye-already-installed"};
  const original=HISTORICAL_RUFUS_ITEMS[slot+"Eye"];
  const opposite=HISTORICAL_RUFUS_ITEMS[(slot==="first"?"second":"first")+"Eye"];
  if(r.originalEyeTemplateReverified !== true ||
     r.expectedEyeSourceUuid !== original ||
     r.actorEyeSourceUuid !== original ||
     r.actorEyeSourceUuid === opposite ||
     r.actorHoldsAuthenticEye !== true ||
     r.actorEyeItemType !== "loot" ||
     r.originalEyeProvenanceVerified !== true ||
     !regionUuid(r.actorEyePickupRegionUuid,r.actorEyePickupSceneId) ||
     r.actorEyePickupRegionUuid !== r.expectedEyePickupRegionUuid ||
     r.expectedEyePickupSceneId !== r.actorEyePickupSceneId ||
     r.originalEyeAcquisitionLedgerDone !== true ||
     r.eyeAlreadyInstalledElsewhere !== false ||
     (r[(slot==="first"?"second":"first")+"SocketStatus"] === "installed" &&
       (r.existingOtherEyeSourceVerified !== true ||
        r.existingOtherEyeSourceUuid !== opposite)) ||
     (slot==="first" && r.originFixtureKind!=="sophia-torn-bear") ||
     (slot==="second" && r.originFixtureKind!=="gazebo-lantern-reveal"))
    return {action:"deny",reason:"original-eye-or-pickup-provenance-not-certified"};
  // The adapting GM reserves this socket, secures exact original eye custody,
  // verifies the eye is mounted into Rufus and only then persists 'installed'.
  return {action:"gm-review-install-eye",slot,reason:"original-eye-eligible"};
}

export function planRufusJawRelease(r) {
  if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
  if(!activeAtRufus(r) || r.explicitJawButtonPress !== true)
    return {action:"deny",reason:"jaw-button-context-not-certified"};
  if(["reserved"].includes(r.firstSocketStatus) ||
     ["reserved"].includes(r.secondSocketStatus) ||
     r.jawLedgerStatus === "reserved" || r.sourceMarkerStatus === "reserved")
    return {action:"gm-review",reason:"reserved-jaw-reconciliation"};
  if(r.jawLedgerStatus === "open" &&
     ["visible","claimed"].includes(r.sourceMarkerStatus) &&
     r.firstSocketStatus === "installed" && r.secondSocketStatus === "installed")
    return {action:"no-op",reason:"already-open-source-persistent"};
  if(r.firstSocketStatus !== "installed" || r.secondSocketStatus !== "installed")
    return {action:"deny",reason:"two-distinct-installed-eyes-required"};
  if(r.jawLedgerStatus !== "closed" || r.sourceMarkerStatus !== "hidden")
    return {action:"gm-review",reason:"unknown-jaw-or-source-ledger"};
  if(r.installedFirstEyeSourceUuid !== HISTORICAL_RUFUS_ITEMS.firstEye ||
     r.installedSecondEyeSourceUuid !== HISTORICAL_RUFUS_ITEMS.secondEye ||
     r.firstEyeInstallLedgerDone !== true || r.secondEyeInstallLedgerDone !== true ||
     r.installedFirstEyeSourceUuid === r.installedSecondEyeSourceUuid ||
     r.originalUnchargedSourceTemplateReverified !== true ||
     r.unchargedSourceUuid !== HISTORICAL_RUFUS_ITEMS.unchargedSource ||
     r.sourceTemplateName !== "Uncharged Gondian Power Source" ||
     r.sourceTemplateType !== "loot" ||
     r.worldwideUnchargedSourceRewardCopyCount !== 0 ||
     r.sourcePickupRegionVerified !== true ||
     !regionUuid(r.sourcePickupRegionUuid,RUFUS_STUDY_SCENE_ID) ||
     r.sourceWillAppearUncharged !== true)
    return {action:"deny",reason:"installed-eyes-or-uncharged-source-not-certified"};
  // Jaw opening reveals a persistent pickup marker; it does not grant/charge a source.
  return {action:"gm-review-open-jaw-and-reveal",reason:"two-original-eyes-installed"};
}

export function planRufusSourcePickup(r) {
  if(!trusted(r)) return {action:"deny",reason:"untrusted-readback"};
  if(!activeAtRufus(r) || r.explicitSourcePickupAction !== true ||
     r.sourcePickupRegionVerified !== true ||
     !regionUuid(r.sourcePickupRegionUuid,RUFUS_STUDY_SCENE_ID) ||
     r.ownedTokenAtSourceMarker !== true)
    return {action:"deny",reason:"not-an-authentic-source-pickup"};
  if(r.sourceMarkerStatus === "reserved" || r.sourceGrantStatus === "reserved" ||
     r.jawLedgerStatus === "reserved")
    return {action:"gm-review",reason:"reserved-source-transaction"};
  if(r.sourceMarkerStatus === "claimed" && r.sourceGrantStatus === "done")
    return {action:"no-op",reason:"already-collected"};
  if(r.jawLedgerStatus !== "open" || r.sourceMarkerStatus !== "visible" ||
     r.sourceGrantStatus !== "none")
    return {action:"gm-review",reason:"source-not-visible-or-uncertain"};
  if(r.unpluggedSourceReverified !== true ||
     r.unchargedSourceUuid !== HISTORICAL_RUFUS_ITEMS.unchargedSource ||
     r.originalSourceChargeState !== "uncharged" ||
     r.worldwideUnchargedSourceRewardCopyCount !== 0 ||
     r.markerRehydratedAfterSceneSwap !== true ||
     r.crimsonVeilStarted !== false)
    return {action:"deny",reason:"authentic-uncharged-source-not-certified"};
  // Only the elected-GM actor writes after a reservation and post-write reread.
  // Never charge power, set Veil, or teleport the player during this step.
  return {action:"gm-review-single-uncharged-source",reason:"reserve-before-original-grant"};
}