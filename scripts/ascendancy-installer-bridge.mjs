import { loadCompiledCampaignPackage } from "./ascendancy-region-plan.mjs";

const MUTATION = "disabled-until-exact-runtime-gate";
const HELPER_SCOPE = "dicebox-campaign-helper";
const HELPER_FLAG_KEY = "managed";
const REGIONWRIGHT_SCOPE = "regionwright";
const REGIONWRIGHT_FLAG_KEY = "ascendancy";
const TARGET = Object.freeze({ foundryVersion: "14.367", systemId: "dnd5e", systemVersion: "5.3.3" });
const GM_HARNESS = Object.freeze({
  operation: "gm-chrome-harness.select",
  targetUrl: "http://localhost:30000/game",
  requiredAccountLabel: "Gamemaster [GM]",
  excludedAccountLabel: "Assistant Gamemaster [GM]",
  exactFields: ["providerTabId", "title", "url"],
  noChromeMutation: true,
  noWorldMutation: true,
  failClosed: true,
});
const FOUNDRY_API = Object.freeze({
  sceneRead: "fromUuid | game.scenes.get",
  regionRead: 'scene.getEmbeddedCollection("Region")',
  regionUpdate: "region.update",
  behaviorRead: 'region.getEmbeddedCollection("RegionBehavior")',
  behaviorCreate: 'region.createEmbeddedDocuments("RegionBehavior", ...)',
  behaviorReread: 'region.getEmbeddedCollection("RegionBehavior")',
});
const NATIVE_READBACK_CONTRACT = Object.freeze({
  installerOperation: "ascendancy.install",
  snapshotOperation: "ascendancy.snapshot",
  source: "DiceBox page-main native live bridge only",
  redactedSnapshot: true,
  authoritative: true,
});
const POPUP_PUZZLES = Object.freeze([
  "dbx:puzzle:aleister-frequency",
  "dbx:puzzle:sprocket-circuit",
  "dbx:puzzle:dalton-tram-repair",
  "dbx:puzzle:lawson-rune-memory",
  "dbx:puzzle:tactal-rune-slotting",
]);
const COOPERATIVE_STAGES = Object.freeze([
  "dbx:cooperative:aleister-sprocket-frequency-circuit",
  "dbx:cooperative:dalton-andrew-tram-troubleshooting",
  "dbx:cooperative:lawson-tactal-rune-order",
]);
const FINAL_STAGE = "dbx:stage:six-person-simultaneous-activation";
const ANDREW_PUZZLE = "dbx:puzzle:andrew-tram-routing";

function clone(value) {
  return structuredClone(value);
}

function collectionContents(collection) {
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection?.contents)) return collection.contents;
  if (collection?.values) return [...collection.values()];
  return [];
}

function helperMarker(document) {
  return document?.flags?.[HELPER_SCOPE]?.[HELPER_FLAG_KEY] ?? null;
}

function expectedPlan(packageData, roomId) {
  const plan = packageData.regionPlans.find((candidate) => candidate.roomId === roomId);
  if (!plan) throw new Error(`Missing helper Region plan ${roomId}.`);
  return plan;
}

function assertInstallerReceipt(receipt, packageData) {
  if (!receipt || receipt.operation !== "ascendancy.install" || receipt.status !== "PASS" || receipt.readyClaim !== false || receipt.packageId !== packageData.packageId) throw new Error("Helper installer receipt is missing, incomplete, or belongs to a different campaign package.");
  if (receipt.target?.foundryVersion !== TARGET.foundryVersion || receipt.target?.systemId !== TARGET.systemId || receipt.target?.systemVersion !== TARGET.systemVersion) throw new Error("Helper installer receipt does not prove the exact Foundry 14.367 / dnd5e 5.3.3 target.");
  if (receipt.playerFacingMacroCount !== 0 || !Array.isArray(receipt.scenes) || receipt.scenes.length !== 4 || receipt.scenes.some((scene) => scene.reread !== true || !scene.sceneUuid)) throw new Error("Helper installer receipt lacks the required authoritative Scene reread or no-Macro evidence.");
  for (const room of packageData.campaign.rooms) {
    const installed = receipt.scenes.find((scene) => scene.roomId === room.roomId);
    const plan = expectedPlan(packageData, room.roomId);
    const blueprint = packageData.spatialBlueprints.find((candidate) => candidate.blueprintId === room.spatialBlueprintId);
    if (!installed || !blueprint || installed.wallCount !== blueprint.walls.length + blueprint.anchors.filter((anchor) => anchor.kind === "door").length || installed.regionCount !== plan.regions.length) throw new Error(`Helper installer receipt counts drifted for ${room.roomId}.`);
  }
  return clone(receipt);
}

export function validateGamemasterHarnessReceipt(receipt) {
  const selected = receipt?.selected;
  if (receipt?.operation !== GM_HARNESS.operation || receipt.status !== "PASS" || receipt.noChromeMutation !== true || receipt.noWorldMutation !== true || receipt.targetUrl !== GM_HARNESS.targetUrl || receipt.blockers?.length !== 0) throw new Error("Gamemaster harness receipt is not a mutation-free PASS.");
  if (!selected || selected.accountLabel !== GM_HARNESS.requiredAccountLabel || selected.accountLabel === GM_HARNESS.excludedAccountLabel || selected.url !== GM_HARNESS.targetUrl || GM_HARNESS.exactFields.some((field) => typeof selected[field] !== "string" || selected[field].length === 0)) throw new Error("Gamemaster harness receipt does not identify the exact visible Gamemaster [GM] tab.");
  if (receipt.preserved?.some((candidate) => candidate.providerTabId === selected.providerTabId)) throw new Error("Gamemaster harness receipt preserved the selected providerTabId.");
  return clone(receipt);
}

export function validateHelperNativeReadback({ installerReceipt, snapshot, campaignPackage = loadCompiledCampaignPackage() } = {}) {
  assertInstallerReceipt(installerReceipt, campaignPackage);
  if (snapshot?.status !== "observed" || snapshot.packageId !== HELPER_SCOPE || !Array.isArray(snapshot.scenes) || snapshot.scenes.length !== 4) throw new Error("Helper ascendancy.snapshot is not an observed redacted native readback.");
  const evidence = [];
  for (const room of campaignPackage.campaign.rooms) {
    const plan = expectedPlan(campaignPackage, room.roomId);
    const blueprint = campaignPackage.spatialBlueprints.find((candidate) => candidate.blueprintId === room.spatialBlueprintId);
    const scene = snapshot.scenes.find((candidate) => candidate.semanticId === room.roomId);
    if (!blueprint || !scene || typeof scene.binding !== "string" || !scene.binding.startsWith("redacted:")) throw new Error(`Helper snapshot is missing a redacted Scene readback for ${room.roomId}.`);
    const expectedWalls = new Set([...blueprint.walls.map((wall) => wall.wallId), ...blueprint.anchors.filter((anchor) => anchor.kind === "door").map((anchor) => anchor.anchorId)]);
    const expectedRegions = new Set(plan.regions.map((region) => region.regionId));
    const observedWalls = Array.isArray(scene.walls) ? scene.walls : [];
    const observedRegions = Array.isArray(scene.regions) ? scene.regions : [];
    if (observedWalls.length !== expectedWalls.size || observedRegions.length !== expectedRegions.size) throw new Error(`Helper snapshot counts drifted for ${room.roomId}.`);
    const seenWalls = new Set();
    for (const wall of observedWalls) {
      if (!expectedWalls.has(wall.semanticId) || seenWalls.has(wall.semanticId) || typeof wall.binding !== "string" || !wall.binding.startsWith("redacted:")) throw new Error(`Helper snapshot Wall readback drifted for ${room.roomId}.`);
      seenWalls.add(wall.semanticId);
    }
    const seenRegions = new Set();
    for (const region of observedRegions) {
      if (!expectedRegions.has(region.semanticId) || seenRegions.has(region.semanticId) || typeof region.binding !== "string" || !region.binding.startsWith("redacted:")) throw new Error(`Helper snapshot Region readback drifted for ${room.roomId}.`);
      seenRegions.add(region.semanticId);
    }
    evidence.push({ roomId: room.roomId, sceneBinding: scene.binding, wallCount: observedWalls.length, regionCount: observedRegions.length, reread: true });
  }
  return Object.freeze({ status: "observed", installerOperation: NATIVE_READBACK_CONTRACT.installerOperation, snapshotOperation: NATIVE_READBACK_CONTRACT.snapshotOperation, packageId: campaignPackage.packageId, scenes: Object.freeze(evidence), playerFacingMacroCount: installerReceipt.playerFacingMacroCount, noWrite: true });
}

function regionConfig(regionPlanRegion, cooperativeStage = null) {
  if (regionPlanRegion.owner === "regionwright-popup") return { puzzleId: regionPlanRegion.behaviorBinding, stage: "personal", options: {}, permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.behaviorBinding === FINAL_STAGE) return { stage: "core", finalStageId: FINAL_STAGE, permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.interaction === "physical-cooperative") return { stage: "cooperative", cooperativeId: regionPlanRegion.behaviorBinding, entryHook: "regionwright.ascendancyCooperativeStage", completionSource: cooperativeStage ? `pairs[${cooperativeStage.pairId}].cooperativeComplete after advanceCooperativeStage` : "pairs[pairId].cooperativeComplete after advanceCooperativeStage", permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.interaction === "final-station") return { stage: "final", characterId: regionPlanRegion.behaviorBinding, activationRound: "event.activationRound", permissionBoundary: "active-gm-listener" };
  return null;
}

function createBehaviorBindings(packageData) {
  const handoff = packageData.regionwrightHandoff;
  const regionPlans = packageData.regionPlans;
  const regionBindings = (predicate, mapper) => regionPlans.flatMap((plan) => plan.regions.filter(predicate).map((region) => mapper(region, plan)));
  const popupBindings = regionBindings((region) => region.popup === true && region.owner === "regionwright-popup", (region, plan) => ({ roomId: plan.roomId, regionId: region.regionId, semanticId: region.behaviorBinding, kind: "popup-personal", owner: "regionwright-popup", regionwrightFlagPath: `flags.${REGIONWRIGHT_SCOPE}.${REGIONWRIGHT_FLAG_KEY}.region`, config: regionConfig(region), permissionBoundary: "active-gm-listener", mutation: MUTATION }));
  const cooperativeBindings = handoff.cooperativeStages.flatMap((stage) => regionBindings((region) => region.behaviorBinding === stage.cooperativeId, (region, plan) => ({ roomId: plan.roomId, regionId: region.regionId, semanticId: stage.cooperativeId, pairId: stage.pairId, kind: "physical-cooperative", owner: "dicebox-foundry-region", popup: false, regionwrightFlagPath: `flags.${REGIONWRIGHT_SCOPE}.${REGIONWRIGHT_FLAG_KEY}.region`, config: regionConfig(region, stage), mutation: MUTATION })));
  const finalBindings = regionBindings((region) => region.behaviorBinding === FINAL_STAGE || region.interaction === "final-station", (region, plan) => ({ roomId: plan.roomId, regionId: region.regionId, semanticId: region.behaviorBinding, kind: region.interaction, owner: "dicebox-foundry-region", popup: false, regionwrightFlagPath: `flags.${REGIONWRIGHT_SCOPE}.${REGIONWRIGHT_FLAG_KEY}.region`, config: regionConfig(region), mutation: MUTATION }));
  const teleports = regionPlans.flatMap((plan) => plan.teleports.map((teleport) => ({ roomId: plan.roomId, teleportId: teleport.teleportId, fromRegionId: teleport.fromRegionId, toRegionId: teleport.toRegionId, behavior: "native-teleport", owner: "dicebox-foundry-region", activeGMRequired: true, source: `flags.${HELPER_SCOPE}.${HELPER_FLAG_KEY}.teleport`, mutation: MUTATION })));
  return { popupBindings, cooperativeBindings, finalBindings, teleports, andrew: { semanticId: ANDREW_PUZZLE, owner: "dicebox-scene-engine", popup: false, regionBehaviorCount: 0 } };
}

export function createAscendancyRegionwrightInstallerBindingPlan({ campaignPackage = loadCompiledCampaignPackage(), installerReceipt = null, gmHarnessReceipt = null, nativeReadback = null } = {}) {
  const bindings = createBehaviorBindings(campaignPackage);
  let receiptStatus = "blocked-missing-helper-installer-receipt";
  const blockers = ["Helper installer PASS receipt and authoritative owned-Region reread are required before Regionwright binding.", "Gamemaster harness PASS receipt with exact providerTabId/title/url and visible Gamemaster [GM] label is required; Assistant Gamemaster is excluded and selection fails closed.", "Foundry module loader was repaired and installed entry hash e4fb1add499341280b67461dd5613dd953cee98b9cb162d7b0973ea0e5c7d2e5; the Ballad Gamemaster client must reload once before helper settings, handshake, installer PASS, and redacted snapshot can be rechecked.", "No Regionwright binding mutation is enabled until helper readback is verified."];
  if (installerReceipt) {
    assertInstallerReceipt(installerReceipt, campaignPackage);
    receiptStatus = "reviewable-awaiting-regionwright-readback";
    blockers.splice(0, 1);
  }
  if (gmHarnessReceipt) {
    validateGamemasterHarnessReceipt(gmHarnessReceipt);
    const gmBlockerIndex = blockers.findIndex((blocker) => blocker.startsWith("Gamemaster harness PASS receipt"));
    if (gmBlockerIndex >= 0) blockers.splice(gmBlockerIndex, 1);
  }
  let nativeReadbackEvidence = null;
  if (nativeReadback) {
    nativeReadbackEvidence = validateHelperNativeReadback({ installerReceipt, snapshot: nativeReadback, campaignPackage });
    const readbackBlockerIndex = blockers.findIndex((blocker) => blocker.startsWith("Helper readiness/native reread"));
    if (readbackBlockerIndex >= 0) blockers.splice(readbackBlockerIndex, 1);
    receiptStatus = "verified-helper-native-readback";
  }
  return Object.freeze({
    schemaVersion: "0.1.0",
    operation: "ascendancy.regionwright.installer-bridge.preview",
    packageId: campaignPackage.packageId,
    installerReceiptStatus: receiptStatus,
    gmHarness: clone(GM_HARNESS),
    nativeReadbackContract: clone(NATIVE_READBACK_CONTRACT),
    nativeReadbackEvidence,
    baseRegionOwner: "dicebox-campaign-helper",
    duplicateRegionCreateCount: 0,
    bindings,
    foundryApi: clone(FOUNDRY_API),
    playerFacingMacros: [],
    macroPolicy: { mode: "none-in-current-campaign", explicitPlayerOwnershipRequiredIfAdded: true, inheritedPermissionsAccepted: false, foundryField: "ownership.default", readbackRequired: true },
    noPopupCooperativeStages: bindings.cooperativeBindings.every((entry) => entry.popup === false),
    andrewSceneOwned: bindings.andrew,
    authoritativeRereadRequired: true,
    noRawPayloads: true,
    mutation: MUTATION,
    blockers,
  });
}

export function validateAscendancyRegionwrightInstallerBindingPlan(input, { campaignPackage = loadCompiledCampaignPackage() } = {}) {
  const plan = clone(input);
  if (plan.schemaVersion !== "0.1.0" || plan.operation !== "ascendancy.regionwright.installer-bridge.preview" || plan.mutation !== MUTATION) throw new Error("Regionwright installer bridge schema or mutation gate is invalid.");
  if (plan.baseRegionOwner !== "dicebox-campaign-helper" || plan.duplicateRegionCreateCount !== 0 || plan.noRawPayloads !== true || plan.authoritativeRereadRequired !== true) throw new Error("Regionwright installer bridge must preserve helper-owned Regions and authoritative reread.");
  if (JSON.stringify(plan.gmHarness) !== JSON.stringify(GM_HARNESS)) throw new Error("Gamemaster harness selection contract drifted.");
  if (JSON.stringify(plan.nativeReadbackContract) !== JSON.stringify(NATIVE_READBACK_CONTRACT) || (plan.nativeReadbackEvidence !== null && plan.nativeReadbackEvidence.status !== "observed")) throw new Error("Helper native readback contract drifted.");
  if (plan.playerFacingMacros.length !== 0 || plan.macroPolicy.mode !== "none-in-current-campaign" || plan.macroPolicy.inheritedPermissionsAccepted !== false || plan.macroPolicy.readbackRequired !== true) throw new Error("Regionwright installer bridge Macro policy drifted.");
  if (plan.bindings.popupBindings.length !== POPUP_PUZZLES.length || JSON.stringify(plan.bindings.popupBindings.map((entry) => entry.semanticId).sort()) !== JSON.stringify([...POPUP_PUZZLES].sort()) || plan.bindings.popupBindings.some((entry) => entry.permissionBoundary !== "active-gm-listener" || entry.owner !== "regionwright-popup")) throw new Error("Regionwright popup binding contract drifted.");
  if (plan.bindings.cooperativeBindings.length !== 5 || plan.bindings.cooperativeBindings.some((entry) => entry.popup !== false || entry.kind !== "physical-cooperative" || entry.config.entryHook !== "regionwright.ascendancyCooperativeStage" || !entry.config.completionSource.includes("cooperativeComplete"))) throw new Error("Cooperative Region binding contract drifted.");
  if (plan.bindings.finalBindings.length !== 7 || plan.bindings.finalBindings.filter((entry) => entry.kind === "final-station").length !== 6 || plan.bindings.finalBindings.some((entry) => entry.popup !== false)) throw new Error("Final activation Region binding contract drifted.");
  if (plan.bindings.teleports.length !== 5 || plan.bindings.teleports.some((entry) => entry.activeGMRequired !== true || entry.behavior !== "native-teleport")) throw new Error("Native teleport binding contract drifted.");
  if (plan.bindings.andrew.owner !== "dicebox-scene-engine" || plan.bindings.andrew.popup !== false || plan.bindings.andrew.regionBehaviorCount !== 0) throw new Error("Andrew must remain Scene-owned without Regionwright behavior.");
  if (JSON.stringify(plan.foundryApi) !== JSON.stringify(FOUNDRY_API)) throw new Error("Regionwright installer bridge Foundry API contract drifted.");
  return Object.freeze(plan);
}

export function validateAscendancyInstallerRegionReadback({ scenes, campaignPackage = loadCompiledCampaignPackage(), installerReceipt = null } = {}) {
  assertInstallerReceipt(installerReceipt, campaignPackage);
  if (!Array.isArray(scenes) || scenes.length !== 4) throw new Error("Target-bound helper installer readback must include all four Scenes.");
  const evidence = [];
  for (const room of campaignPackage.campaign.rooms) {
    const scene = scenes.find((candidate) => candidate?.flags?.[HELPER_SCOPE]?.[HELPER_FLAG_KEY]?.semanticId === room.roomId);
    const plan = expectedPlan(campaignPackage, room.roomId);
    if (!scene) throw new Error(`Target-bound helper Scene flag readback is missing ${room.roomId}.`);
    const regions = collectionContents(scene.regions);
    for (const region of plan.regions) {
      const found = regions.find((candidate) => {
        const marker = helperMarker(candidate);
        return marker?.owner === HELPER_SCOPE && marker.packageId === campaignPackage.packageId && marker.kind === "region" && marker.semanticId === region.regionId;
      });
      if (!found) throw new Error(`Target-bound helper Region flag readback is missing ${region.regionId}.`);
      const config = helperMarker(found);
      if (config.semanticId !== region.regionId || found.flags?.[HELPER_SCOPE]?.[HELPER_FLAG_KEY]?.behaviorBinding !== region.behaviorBinding || found.flags?.[HELPER_SCOPE]?.[HELPER_FLAG_KEY]?.popup !== region.popup) throw new Error(`Target-bound helper Region flag drifted for ${region.regionId}.`);
    }
    evidence.push({ roomId: room.roomId, sceneUuid: scene.uuid ?? null, regionCount: plan.regions.length, reread: true });
  }
  return Object.freeze({ status: "observed", packageId: campaignPackage.packageId, scenes: Object.freeze(evidence), playerFacingMacroCount: 0, noWrite: true });
}

export function createAscendancyRegionwrightInstallerBindingReceipt(plan = createAscendancyRegionwrightInstallerBindingPlan()) {
  const validated = validateAscendancyRegionwrightInstallerBindingPlan(plan);
  return {
    schemaVersion: "0.1.0",
    operation: validated.operation,
    status: validated.installerReceiptStatus === "blocked-missing-helper-installer-receipt" ? "blocked" : "reviewable",
    evidenceClass: "deterministic",
    readyClaim: false,
    noWrite: true,
    packageId: validated.packageId,
    helperInstallerReceiptStatus: validated.installerReceiptStatus,
    gmHarness: validated.gmHarness,
    nativeReadbackStatus: validated.nativeReadbackEvidence?.status ?? "blocked-missing-helper-native-readback",
    nativeReadbackContract: validated.nativeReadbackContract,
    nativeReadbackEvidence: validated.nativeReadbackEvidence,
    popupBehaviorCount: validated.bindings.popupBindings.length,
    cooperativeRegionBindingCount: validated.bindings.cooperativeBindings.length,
    finalRegionBindingCount: validated.bindings.finalBindings.length,
    teleportBehaviorCount: validated.bindings.teleports.length,
    duplicateRegionCreateCount: validated.duplicateRegionCreateCount,
    playerFacingMacroCount: validated.playerFacingMacros.length,
    authoritativeRereadRequired: validated.authoritativeRereadRequired,
    noRawPayloads: validated.noRawPayloads,
    foundryApi: validated.foundryApi,
    blockers: validated.blockers,
    mutation: MUTATION,
  };
}
