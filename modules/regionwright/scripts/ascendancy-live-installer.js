import { MODULE_ID } from "./constants.js";

const HELPER_MODULE_ID = "dicebox-campaign-helper";
const HELPER_FLAG = "managed";
const ASCENDANCY_FLAG = "ascendancy";
const MUTATION = "disabled-until-exact-runtime-gate";
const TARGET = Object.freeze({ foundryVersion: "14.367", systemId: "dnd5e", systemVersion: "5.3.3" });
const PACKAGE_URL = `modules/${HELPER_MODULE_ID}/ascendancy-campaign-package.json`;
const REGION_EVENT_SOURCE = `await game.modules.get("${MODULE_ID}")?.api?.premium?.ascendancy?.handleRegionEvent(region, event);`;

const clone = value => structuredClone(value);
const contents = collection => Array.isArray(collection) ? collection : Array.isArray(collection?.contents) ? collection.contents : collection?.values ? [...collection.values()] : [];
const helperMarker = document => document?.flags?.[HELPER_MODULE_ID]?.[HELPER_FLAG] ?? null;
const regionwrightMarker = document => document?.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG] ?? null;
const activeGM = runtime => Boolean(runtime.game?.user?.isGM && runtime.game?.users?.activeGM?.id === runtime.game.user.id);
const destinationUuid = value => typeof value === "string" ? value : value?.uuid ?? value?.document?.uuid ?? null;
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function exactRuntimeGate(runtime) {
  const game = runtime.game;
  const failed = [];
  if (game?.version !== TARGET.foundryVersion) failed.push(`Foundry ${TARGET.foundryVersion} is required; observed ${game?.version ?? "unknown"}.`);
  if (game?.system?.id !== TARGET.systemId || game?.system?.version !== TARGET.systemVersion) failed.push(`D&D5e ${TARGET.systemVersion} is required; observed ${game?.system?.id ?? "unknown"} ${game?.system?.version ?? "unknown"}.`);
  if (!activeGM(runtime)) failed.push("The current user must be the elected active GM.");
  if (!runtime.game?.scenes?.contents) failed.push("game.scenes.contents was not observed.");
  return Object.freeze({ pass: failed.length === 0, failed: Object.freeze(failed) });
}

function validatePackage(packageData) {
  if (!packageData || packageData.mutation !== MUTATION || packageData.packageId !== "dbx:package:chauser-bill-prime-arachnid-aftermath") throw new Error("The compiled Ascendancy campaign package is missing or not mutation-gated.");
  if (!Array.isArray(packageData.campaign?.rooms) || packageData.campaign.rooms.length !== 4 || !Array.isArray(packageData.regionPlans) || packageData.regionPlans.length !== 4) throw new Error("The compiled Ascendancy package must contain exactly four campaign Region plans.");
  const macroBindings = packageData.regionPlans.flatMap(plan => plan.regions.map(region => region.macroBinding));
  if (macroBindings.some(Boolean)) throw new Error("The current Ascendancy package declares a player-facing Macro; explicit Player ownership/readback is required before installation.");
  return packageData;
}

async function loadCampaignPackage(runtime, packageData) {
  if (packageData) return validatePackage(packageData);
  if (runtime.__regionwrightAscendancyPackage) return runtime.__regionwrightAscendancyPackage;
  if (typeof runtime.fetch !== "function") throw new Error("Fetch is unavailable for the compiled Ascendancy campaign package.");
  const response = await runtime.fetch(`${PACKAGE_URL}?v=0.1.0`);
  if (!response.ok) throw new Error(`Campaign package fetch failed with HTTP ${response.status}.`);
  const loaded = validatePackage(await response.json());
  runtime.__regionwrightAscendancyPackage = loaded;
  return loaded;
}

function findScene(runtime, roomId, packageId) {
  return contents(runtime.game?.scenes).find(scene => {
    const marker = helperMarker(scene);
    return marker?.owner === HELPER_MODULE_ID && marker.packageId === packageId && marker.kind === "scene" && marker.semanticId === roomId;
  }) ?? null;
}

function findRegion(scene, regionId, packageId) {
  return contents(scene?.regions).find(region => {
    const marker = helperMarker(region);
    return marker?.owner === HELPER_MODULE_ID && marker.packageId === packageId && marker.kind === "region" && marker.semanticId === regionId;
  }) ?? null;
}

function cooperativeStageFor(packageData, behaviorBinding) {
  return packageData.regionwrightHandoff?.cooperativeStages?.find(stage => stage.cooperativeId === behaviorBinding) ?? null;
}

function configFor(packageData, regionPlanRegion) {
  if (regionPlanRegion.interaction === "popup-personal") return { puzzleId: regionPlanRegion.behaviorBinding, stage: "personal", options: {}, permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.behaviorBinding === "dbx:stage:six-person-simultaneous-activation") return { stage: "core", finalStageId: regionPlanRegion.behaviorBinding, permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.interaction === "final-station") return { stage: "final", characterId: regionPlanRegion.behaviorBinding, activationRound: "event.activationRound", permissionBoundary: "active-gm-listener" };
  if (regionPlanRegion.interaction === "physical-cooperative") {
    const stage = cooperativeStageFor(packageData, regionPlanRegion.behaviorBinding);
    if (!stage) throw new Error(`No cooperative handoff exists for ${regionPlanRegion.behaviorBinding}.`);
    return { stage: "cooperative", cooperativeId: stage.cooperativeId, pairId: stage.pairId, entryHook: "regionwright.ascendancyCooperativeStage", completionSource: `pairs[${stage.pairId}].cooperativeComplete after advanceCooperativeStage`, permissionBoundary: "active-gm-listener" };
  }
  return null;
}

function handoffSummaryFor(packageData) {
  const regions = packageData.regionPlans.flatMap(plan => plan.regions);
  const finalStageId = packageData.regionwrightHandoff?.finalActivation?.stageId;
  return Object.freeze({
    popupBehaviorCount: regions.filter(region => region.interaction === "popup-personal").length,
    cooperativeRegionBindingCount: regions.filter(region => region.interaction === "physical-cooperative").length,
    finalCoreBindingCount: regions.filter(region => region.interaction === "final-station" || region.behaviorBinding === finalStageId).length,
    teleportBehaviorCount: packageData.regionPlans.reduce((count, plan) => count + plan.teleports.length, 0),
  });
}

function eventBehaviorData(regionPlanRegion, config) {
  return {
    name: `Regionwright: Ascendancy ${regionPlanRegion.label}`,
    type: "executeScript",
    disabled: false,
    system: { events: ["tokenEnter"], source: REGION_EVENT_SOURCE },
    flags: { [MODULE_ID]: { [ASCENDANCY_FLAG]: { handoffKey: `region:${regionPlanRegion.regionId}`, semanticId: regionPlanRegion.behaviorBinding, kind: config.stage, permissionBoundary: "active-gm-listener" } } },
  };
}

function teleportBehaviorData(teleport, destinationUuid) {
  return {
    name: `Regionwright: Ascendancy ${teleport.teleportId}`,
    type: "teleportToken",
    disabled: false,
    system: { destinations: [destinationUuid], placement: "center", snap: true, choice: false, revealed: false, dialog: { revealed: null, unrevealed: null }, transition: { type: null, duration: 1500 } },
    flags: { [MODULE_ID]: { [ASCENDANCY_FLAG]: { handoffKey: `teleport:${teleport.teleportId}`, semanticId: teleport.teleportId, kind: "native-teleport", fromRegionId: teleport.fromRegionId, toRegionId: teleport.toRegionId, activeGMRequired: true, permissionBoundary: "active-gm-listener" } } },
  };
}

function ownedBehaviors(region) {
  return contents(region?.getEmbeddedCollection?.("RegionBehavior") ?? region?.behaviors).filter(behavior => typeof regionwrightMarker(behavior)?.handoffKey === "string");
}

async function upsertOwnedBehavior(region, data) {
  const key = data.flags[MODULE_ID][ASCENDANCY_FLAG].handoffKey;
  const matches = ownedBehaviors(region).filter(behavior => regionwrightMarker(behavior).handoffKey === key);
  if (matches.length > 1) throw new Error(`Duplicate Regionwright Ascendancy behaviors found for ${key}; refusing to guess.`);
  if (matches.length === 1) {
    const [updated] = await region.updateEmbeddedDocuments("RegionBehavior", [{ _id: matches[0].id, ...data }]);
    return { action: "updated", document: updated };
  }
  const [created] = await region.createEmbeddedDocuments("RegionBehavior", [data]);
  return { action: "created", document: created };
}

async function rereadRegion(runtime, region) {
  if (typeof runtime.fromUuid === "function" && region?.uuid) return await runtime.fromUuid(region.uuid) ?? region;
  return region;
}

function assertHelperScene(scene, roomId, packageId, expectedCount) {
  const marker = helperMarker(scene);
  if (marker?.owner !== HELPER_MODULE_ID || marker.packageId !== packageId || marker.kind !== "scene" || marker.semanticId !== roomId) throw new Error(`Helper Scene readback drifted for ${roomId}.`);
  const regions = contents(scene.regions).filter(region => helperMarker(region)?.owner === HELPER_MODULE_ID && helperMarker(region)?.packageId === packageId);
  if (regions.length !== expectedCount) throw new Error(`Helper-owned Region count drifted for ${roomId}.`);
}

export async function installAscendancyRegionwrightHandoff({ runtime = globalThis, campaignPackage = null, dryRun = false } = {}) {
  const gate = exactRuntimeGate(runtime);
  if (!gate.pass) return Object.freeze({ operation: "ascendancy.regionwright.install", status: "BLOCKED", noWrite: true, blockers: gate.failed, mutation: MUTATION });
  const packageData = await loadCampaignPackage(runtime, campaignPackage);
  const summary = handoffSummaryFor(packageData);
  const roomResults = [];
  const actions = [];
  const sceneByRoom = new Map();
  for (const room of packageData.campaign.rooms) {
    const plan = packageData.regionPlans.find(candidate => candidate.roomId === room.roomId);
    const scene = findScene(runtime, room.roomId, packageData.packageId);
    if (!plan || !scene) throw new Error(`Helper-owned Scene/Region plan is missing for ${room.roomId}.`);
    assertHelperScene(scene, room.roomId, packageData.packageId, plan.regions.length);
    sceneByRoom.set(room.roomId, { scene, plan });
  }
  for (const { scene, plan } of sceneByRoom.values()) {
    const regionById = new Map();
    for (const regionPlanRegion of plan.regions) {
      const region = findRegion(scene, regionPlanRegion.regionId, packageData.packageId);
      if (!region) throw new Error(`Helper-owned Region is missing for ${regionPlanRegion.regionId}.`);
      regionById.set(regionPlanRegion.regionId, region);
      const config = configFor(packageData, regionPlanRegion);
      if (config) {
        const flagPath = `flags.${MODULE_ID}.${ASCENDANCY_FLAG}.region`;
        actions.push({ type: "region.update", regionId: regionPlanRegion.regionId, promise: async () => region.update({ [flagPath]: { version: 1, ...clone(config) } }) });
        if (!dryRun) await actions.at(-1).promise();
        if (!dryRun) await upsertOwnedBehavior(region, eventBehaviorData(regionPlanRegion, config));
      }
    }
    for (const teleport of plan.teleports) {
      const source = regionById.get(teleport.fromRegionId);
      const destinationPlan = packageData.regionPlans.find(candidate => candidate.regions.some(region => region.regionId === teleport.toRegionId));
      const destinationScene = destinationPlan ? sceneByRoom.get(destinationPlan.roomId)?.scene : null;
      const destination = destinationScene ? findRegion(destinationScene, teleport.toRegionId, packageData.packageId) : null;
      if (!source || !destination?.uuid) throw new Error(`Teleport binding is missing a helper-owned endpoint for ${teleport.teleportId}.`);
      const flagPath = `flags.${MODULE_ID}.${ASCENDANCY_FLAG}.teleport`;
      actions.push({ type: "region.update", regionId: teleport.fromRegionId, promise: async () => source.update({ [flagPath]: { ...clone(teleport), permissionBoundary: "active-gm-listener" } }) });
      if (!dryRun) await actions.at(-1).promise();
      if (!dryRun) await upsertOwnedBehavior(source, teleportBehaviorData(teleport, destination.uuid));
    }
    const rereadRegions = [];
    for (const regionPlanRegion of plan.regions) {
      const region = await rereadRegion(runtime, findRegion(scene, regionPlanRegion.regionId, packageData.packageId));
      if (!region) throw new Error(`Regionwright reread failed for ${regionPlanRegion.regionId}.`);
      rereadRegions.push(region);
    }
    roomResults.push({ roomId: plan.roomId, sceneUuid: scene.uuid ?? null, helperRegionCount: rereadRegions.length, regionwrightBehaviorCount: rereadRegions.reduce((count, region) => count + ownedBehaviors(region).length, 0), reread: !dryRun });
  }
  return Object.freeze({ operation: "ascendancy.regionwright.install", status: dryRun ? "PREVIEW" : "PASS", evidenceClass: "target-bound", readyClaim: false, noWrite: dryRun, packageId: packageData.packageId, target: { worldId: runtime.game.world?.id ?? null, foundryVersion: runtime.game.version, systemId: runtime.game.system.id, systemVersion: runtime.game.system.version, activeGm: true }, scenes: Object.freeze(roomResults), ...summary, duplicateRegionCreateCount: 0, playerFacingMacroCount: 0, geometryMutation: false, foreignStatePreserved: true, actions: actions.map(({ type, regionId }) => ({ type, regionId })), mutation: MUTATION });
}

export async function inspectAscendancyRegionwrightHandoff({ runtime = globalThis, campaignPackage = null } = {}) {
  const gate = exactRuntimeGate(runtime);
  if (!gate.pass) return Object.freeze({ operation: "ascendancy.regionwright.snapshot", status: "BLOCKED", noWrite: true, blockers: gate.failed, mutation: MUTATION });
  const packageData = await loadCampaignPackage(runtime, campaignPackage);
  const summary = handoffSummaryFor(packageData);
  const expectedBehaviorKeys = new Set();
  const ownedBehaviorKeys = [];
  const teleports = [];
  const teleportDiagnostics = [];
  const readbackErrors = [];
  const scenes = [];
  let helperRegionCount = 0;
  let regionwrightBehaviorCount = 0;
  let andrewBehaviorCount = 0;
  for (const room of packageData.campaign.rooms) {
    const plan = packageData.regionPlans.find(candidate => candidate.roomId === room.roomId);
    const scene = findScene(runtime, room.roomId, packageData.packageId);
    if (!plan || !scene) throw new Error(`Installed helper Scene is missing for ${room.roomId}.`);
    assertHelperScene(scene, room.roomId, packageData.packageId, plan.regions.length);
    const rereadScene = typeof runtime.fromUuid === "function" && scene.uuid ? await runtime.fromUuid(scene.uuid) ?? scene : scene;
    const roomKeys = [];
    for (const regionPlanRegion of plan.regions) {
      const region = findRegion(rereadScene, regionPlanRegion.regionId, packageData.packageId);
      if (!region) throw new Error(`Installed helper Region is missing for ${regionPlanRegion.regionId}.`);
      helperRegionCount += 1;
      const behaviors = ownedBehaviors(region);
      regionwrightBehaviorCount += behaviors.length;
      const keys = behaviors.map(behavior => regionwrightMarker(behavior).handoffKey).sort();
      if (new Set(keys).size !== keys.length) throw new Error(`Duplicate Regionwright handoff keys found for ${regionPlanRegion.regionId}.`);
      for (const key of keys) { ownedBehaviorKeys.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, key }); roomKeys.push(key); }
      const config = configFor(packageData, regionPlanRegion);
      if (config) expectedBehaviorKeys.add(`region:${regionPlanRegion.regionId}`);
      if (regionPlanRegion.interaction === "tram-anchor" && behaviors.length !== 0) throw new Error(`Andrew Scene-owned tram anchor gained a Regionwright behavior: ${regionPlanRegion.regionId}.`);
      if (regionPlanRegion.interaction === "tram-anchor") andrewBehaviorCount += behaviors.length;
      const teleportsForRegion = plan.teleports.filter(candidate => candidate.fromRegionId === regionPlanRegion.regionId);
      for (const teleport of teleportsForRegion) {
        expectedBehaviorKeys.add(`teleport:${teleport.teleportId}`);
        const marker = regionwrightMarker(region);
        const teleportBehavior = behaviors.find(behavior => regionwrightMarker(behavior).handoffKey === `teleport:${teleport.teleportId}`);
        const rawDestinations = teleportBehavior?.system?.destinations ?? teleportBehavior?._source?.system?.destinations ?? [];
        const observedDestinations = contents(rawDestinations);
        const observedDestinationUuids = observedDestinations.map(destinationUuid);
        if (!teleportBehavior) {
          readbackErrors.push({ teleportId: teleport.teleportId, issue: "missing-teleport-behavior", sourceRegionUuid: region.uuid ?? null, expectedDestinationRegionId: teleport.toRegionId, expectedDestinationRegionUuid: null, observedBehaviorSystemDestinations: observedDestinationUuids, regionTeleportFlag: clone(marker?.teleport ?? null), behaviorId: null });
          continue;
        }
        const destinationPlan = packageData.regionPlans.find(candidate => candidate.regions.some(candidateRegion => candidateRegion.regionId === teleport.toRegionId));
        const destinationScene = destinationPlan ? findScene(runtime, destinationPlan.roomId, packageData.packageId) : null;
        const destination = destinationScene ? findRegion(destinationScene, teleport.toRegionId, packageData.packageId) : null;
        const diagnostic = { teleportId: teleport.teleportId, sourceRegionUuid: region.uuid ?? null, expectedDestinationRegionId: teleport.toRegionId, expectedDestinationRegionUuid: destination?.uuid ?? null, observedBehaviorSystemDestinations: observedDestinationUuids, regionTeleportFlag: clone(marker?.teleport ?? null), behaviorId: teleportBehavior.id ?? null };
        teleportDiagnostics.push(diagnostic);
        if (!destination?.uuid || observedDestinationUuids.length !== 1 || observedDestinationUuids[0] !== destination.uuid) {
          readbackErrors.push({ ...diagnostic, issue: "destination-readback-drift" });
          continue;
        }
        teleports.push({ teleportId: teleport.teleportId, fromRegionId: teleport.fromRegionId, toRegionId: teleport.toRegionId, sourceRegionUuid: region.uuid ?? null, destinationRegionUuid: destination.uuid, behaviorId: teleportBehavior.id ?? null, activeGMRequired: marker?.teleport?.activeGMRequired === true, reread: true });
      }
    }
    scenes.push({ roomId: room.roomId, sceneUuid: rereadScene.uuid ?? scene.uuid ?? null, helperRegionCount: plan.regions.length, regionwrightBehaviorCount: roomKeys.length, ownedBehaviorKeys: roomKeys, reread: true });
  }
  const macroCount = contents(runtime.game?.macros).filter(macro => Boolean(macro?.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG])).length;
  if (macroCount !== 0) throw new Error("Ascendancy Regionwright audit found a player-facing Macro marker.");
  const countErrors = [];
  const expectedHelperRegionCount = packageData.regionPlans.reduce((count, plan) => count + plan.regions.length, 0);
  if (helperRegionCount !== expectedHelperRegionCount) countErrors.push({ issue: "helper-region-count", observed: helperRegionCount, expected: expectedHelperRegionCount });
  if (regionwrightBehaviorCount !== 22) countErrors.push({ issue: "regionwright-behavior-count", observed: regionwrightBehaviorCount, expected: 22 });
  if (expectedBehaviorKeys.size !== 22) countErrors.push({ issue: "expected-behavior-key-count", observed: expectedBehaviorKeys.size, expected: 22 });
  if (teleports.length !== 5) countErrors.push({ issue: "teleport-pass-count", observed: teleports.length, expected: 5 });
  if (andrewBehaviorCount !== 0) countErrors.push({ issue: "andrew-scene-owned-behavior-count", observed: andrewBehaviorCount, expected: 0 });
  const target = { worldId: runtime.game.world?.id ?? null, foundryVersion: runtime.game.version, systemId: runtime.game.system.id, systemVersion: runtime.game.system.version, activeGm: true };
  if (readbackErrors.length || countErrors.length) return Object.freeze({ operation: "ascendancy.regionwright.snapshot", status: "BLOCKED", evidenceClass: "target-bound", readyClaim: false, noWrite: true, packageId: packageData.packageId, target, scenes: Object.freeze(scenes), ownedBehaviorKeys: Object.freeze(ownedBehaviorKeys), teleports: Object.freeze(teleports), teleportDiagnostics: Object.freeze(teleportDiagnostics), readbackErrors: Object.freeze([...readbackErrors, ...countErrors]), helperRegionCount, regionwrightBehaviorCount, ...summary, andrewSceneOwnedBehaviorCount: andrewBehaviorCount, scenesCreated: 0, wallsCreated: 0, regionsCreated: 0, duplicateRegionCreateCount: 0, playerFacingMacroCount: macroCount, foreignStatePreserved: true, authoritativeReread: true, mutation: MUTATION });
  return Object.freeze({ operation: "ascendancy.regionwright.snapshot", status: "PASS", evidenceClass: "target-bound", readyClaim: false, noWrite: true, packageId: packageData.packageId, target, scenes: Object.freeze(scenes), ownedBehaviorKeys: Object.freeze(ownedBehaviorKeys), teleports: Object.freeze(teleports), teleportDiagnostics: Object.freeze(teleportDiagnostics), readbackErrors: Object.freeze([]), helperRegionCount, regionwrightBehaviorCount, ...summary, andrewSceneOwnedBehaviorCount: andrewBehaviorCount, scenesCreated: 0, wallsCreated: 0, regionsCreated: 0, duplicateRegionCreateCount: 0, playerFacingMacroCount: macroCount, foreignStatePreserved: true, authoritativeReread: true, mutation: MUTATION });
}

export async function openAscendancyHandoffAudit() {
  const receipt = await inspectAscendancyRegionwrightHandoff();
  console.info(`${MODULE_ID} Ascendancy Regionwright target-bound readback`, receipt);
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (DialogV2) new DialogV2({ window: { title: "Ascendancy Regionwright readback", icon: "fa-solid fa-clipboard-check" }, content: `<pre style="max-height:60vh;overflow:auto;white-space:pre-wrap">${escapeHTML(JSON.stringify(receipt, null, 2))}</pre>`, buttons: [{ action: "close", label: "Close", default: true }] }).render(true);
  return receipt;
}

function redactedBehaviorRecord(behavior) {
  const marker = regionwrightMarker(behavior);
  const behaviorType = typeof behavior?.type === "string" ? behavior.type : typeof behavior?._source?.type === "string" ? behavior._source.type : null;
  const disabled = typeof behavior?.disabled === "boolean" ? behavior.disabled : typeof behavior?._source?.disabled === "boolean" ? behavior._source.disabled : null;
  if (!marker || typeof marker.handoffKey !== "string" || typeof marker.semanticId !== "string" || typeof marker.kind !== "string" || typeof behaviorType !== "string" || typeof disabled !== "boolean") throw new Error("Malformed Regionwright RegionBehavior marker or state.");
  return { handoffKey: marker.handoffKey, semanticId: marker.semanticId, kind: marker.kind, behaviorType, disabled, active: !disabled };
}

/**
 * Read-only, target-bound current-state surface. It is deliberately separate
 * from install, preview, inspect, and audit: it returns only stable IDs and
 * redacted state derived from Foundry's current Scene/Region APIs.
 */
export async function readAscendancyRegionwrightHandoffState({ runtime = globalThis, campaignPackage = null } = {}) {
  const gate = exactRuntimeGate(runtime);
  const target = { worldId: runtime.game?.world?.id ?? null, foundryVersion: runtime.game?.version ?? null, systemId: runtime.game?.system?.id ?? null, systemVersion: runtime.game?.system?.version ?? null, activeGm: activeGM(runtime) };
  if (!gate.pass) return Object.freeze({ operation: "ascendancy.regionwright.state-readback", status: "BLOCKED", evidenceClass: "target-bound", provenance: "current-state-derived", historicalInstallerReceipt: "not-observable", readyClaim: false, noWrite: true, apply: false, authoritativeReread: false, target, blockers: gate.failed, mutation: MUTATION });
  let packageData;
  try {
    packageData = await loadCampaignPackage(runtime, campaignPackage);
  } catch (error) {
    return Object.freeze({ operation: "ascendancy.regionwright.state-readback", status: "UNKNOWN", evidenceClass: "target-bound", provenance: "current-state-derived", historicalInstallerReceipt: "not-observable", readyClaim: false, noWrite: true, apply: false, authoritativeReread: false, target, blockers: [`Campaign package read failed: ${error?.message ?? String(error)}`], mutation: MUTATION });
  }
  const summary = handoffSummaryFor(packageData);
  const expectedHelperRegionCount = packageData.regionPlans.reduce((count, plan) => count + plan.regions.length, 0);
  const packageExpectedBehaviorCount = packageData.regionPlans.reduce((count, plan) => count + plan.regions.filter(region => Boolean(configFor(packageData, region))).length, 0) + summary.teleportBehaviorCount;
  const expectedBehaviorCount = 22;
  const expectedTeleportCount = summary.teleportBehaviorCount;
  const sceneReadback = [];
  const behaviorReadback = [];
  const teleportReadback = [];
  const readbackErrors = [];
  const expectedBehaviorKeys = new Set();
  const sceneByRoom = new Map();
  let helperRegionCount = 0;
  let regionwrightBehaviorCount = 0;
  let authoritativeReread = true;

  for (const room of packageData.campaign.rooms) {
    const plan = packageData.regionPlans.find(candidate => candidate.roomId === room.roomId);
    const scene = findScene(runtime, room.roomId, packageData.packageId);
    if (!plan || !scene) {
      readbackErrors.push({ roomId: room.roomId, issue: "missing-helper-plan-or-scene" });
      authoritativeReread = false;
      continue;
    }
    let rereadScene;
    try {
      rereadScene = await (typeof runtime.fromUuid === "function" && scene.uuid ? runtime.fromUuid(scene.uuid) : scene);
    } catch (error) {
      readbackErrors.push({ roomId: room.roomId, issue: "scene-reread-failed" });
      authoritativeReread = false;
      continue;
    }
    if (!rereadScene) {
      readbackErrors.push({ roomId: room.roomId, issue: "scene-reread-missing" });
      authoritativeReread = false;
      continue;
    }
    try {
      assertHelperScene(rereadScene, room.roomId, packageData.packageId, plan.regions.length);
    } catch (error) {
      readbackErrors.push({ roomId: room.roomId, issue: "helper-scene-drift" });
      continue;
    }
    sceneByRoom.set(room.roomId, { scene: rereadScene, plan });
  }

  for (const room of packageData.campaign.rooms) {
    const entry = sceneByRoom.get(room.roomId);
    if (!entry) continue;
    const { scene, plan } = entry;
    const roomKeys = [];
    for (const regionPlanRegion of plan.regions) {
      const region = findRegion(scene, regionPlanRegion.regionId, packageData.packageId);
      if (!region) {
        readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "missing-helper-region" });
        authoritativeReread = false;
        continue;
      }
      let rereadRegionDocument;
      try {
        rereadRegionDocument = await rereadRegion(runtime, region);
      } catch (error) {
        readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "region-reread-failed" });
        authoritativeReread = false;
        continue;
      }
      if (!rereadRegionDocument) {
        readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "region-reread-missing" });
        authoritativeReread = false;
        continue;
      }
      helperRegionCount += 1;
      const behaviors = ownedBehaviors(rereadRegionDocument);
      const keys = [];
      for (const behavior of behaviors) {
        try {
          const record = redactedBehaviorRecord(behavior);
          if (keys.includes(record.handoffKey)) readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, handoffKey: record.handoffKey, issue: "duplicate-handoff-key" });
          keys.push(record.handoffKey);
          behaviorReadback.push({ regionId: regionPlanRegion.regionId, ...record });
        } catch (error) {
          readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "malformed-regionwright-behavior" });
        }
      }
      roomKeys.push(...keys);
      regionwrightBehaviorCount += keys.length;
      let config = null;
      try {
        config = configFor(packageData, regionPlanRegion);
      } catch (error) {
        readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "malformed-region-plan" });
      }
      if (config) expectedBehaviorKeys.add(`region:${regionPlanRegion.regionId}`);
      if (regionPlanRegion.interaction === "tram-anchor" && keys.length !== 0) readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, issue: "tram-anchor-owned-behavior" });
      for (const teleport of plan.teleports.filter(candidate => candidate.fromRegionId === regionPlanRegion.regionId)) {
        expectedBehaviorKeys.add(`teleport:${teleport.teleportId}`);
        const teleportBehavior = behaviors.find(behavior => regionwrightMarker(behavior)?.handoffKey === `teleport:${teleport.teleportId}`);
        const destinationPlan = packageData.regionPlans.find(candidate => candidate.regions.some(candidateRegion => candidateRegion.regionId === teleport.toRegionId));
        const destinationScene = destinationPlan ? sceneByRoom.get(destinationPlan.roomId)?.scene : null;
        const destination = destinationScene ? findRegion(destinationScene, teleport.toRegionId, packageData.packageId) : null;
        const rawDestinations = teleportBehavior?.system?.destinations ?? teleportBehavior?._source?.system?.destinations ?? [];
        const observedDestinations = contents(rawDestinations).map(destinationUuid);
        const destinationMatch = Boolean(teleportBehavior && destination?.uuid && observedDestinations.length === 1 && observedDestinations[0] === destination.uuid);
        teleportReadback.push({ teleportId: teleport.teleportId, fromRegionId: teleport.fromRegionId, toRegionId: teleport.toRegionId, behaviorType: teleportBehavior?.type ?? teleportBehavior?._source?.type ?? null, destinationMatch });
        if (!teleportBehavior) readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, teleportId: teleport.teleportId, issue: "missing-teleport-behavior" });
        else if (!destinationMatch) readbackErrors.push({ roomId: room.roomId, regionId: regionPlanRegion.regionId, teleportId: teleport.teleportId, issue: "teleport-destination-mismatch" });
      }
    }
    sceneReadback.push({ roomId: room.roomId, helperRegionCount: plan.regions.length, regionwrightBehaviorCount: roomKeys.length, behaviorKeys: roomKeys.sort() });
  }

  const playerFacingMacroCount = contents(runtime.game?.macros).filter(macro => Boolean(macro?.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG])).length;
  if (playerFacingMacroCount !== 0) readbackErrors.push({ issue: "player-facing-macro-marker", observed: playerFacingMacroCount, expected: 0 });
  if (expectedHelperRegionCount !== 61) readbackErrors.push({ issue: "canonical-helper-region-count", observed: expectedHelperRegionCount, expected: 61 });
  if (packageExpectedBehaviorCount !== expectedBehaviorCount) readbackErrors.push({ issue: "canonical-regionwright-behavior-count", observed: packageExpectedBehaviorCount, expected: expectedBehaviorCount });
  if (expectedTeleportCount !== 5) readbackErrors.push({ issue: "canonical-teleport-count", observed: expectedTeleportCount, expected: 5 });
  if (helperRegionCount !== expectedHelperRegionCount) readbackErrors.push({ issue: "helper-region-count", observed: helperRegionCount, expected: expectedHelperRegionCount });
  if (regionwrightBehaviorCount !== expectedBehaviorCount) readbackErrors.push({ issue: "regionwright-behavior-count", observed: regionwrightBehaviorCount, expected: expectedBehaviorCount });
  if (expectedBehaviorKeys.size !== expectedBehaviorCount) readbackErrors.push({ issue: "expected-behavior-key-count", observed: expectedBehaviorKeys.size, expected: expectedBehaviorCount });
  const observedBehaviorKeys = new Set(behaviorReadback.map(behavior => behavior.handoffKey));
  for (const key of expectedBehaviorKeys) if (!observedBehaviorKeys.has(key)) readbackErrors.push({ issue: "missing-expected-behavior-key", handoffKey: key });
  for (const key of observedBehaviorKeys) if (!expectedBehaviorKeys.has(key)) readbackErrors.push({ issue: "unexpected-behavior-key", handoffKey: key });
  const verifiedTeleportCount = teleportReadback.filter(teleport => teleport.destinationMatch).length;
  if (verifiedTeleportCount !== expectedTeleportCount) readbackErrors.push({ issue: "teleport-pass-count", observed: verifiedTeleportCount, expected: expectedTeleportCount });
  const status = readbackErrors.length ? "BLOCKED" : "PASS";
  return Object.freeze({ operation: "ascendancy.regionwright.state-readback", status, evidenceClass: "target-bound", provenance: "current-state-derived", historicalInstallerReceipt: "not-observable", target, expected: { helperRegionCount: expectedHelperRegionCount, regionwrightBehaviorCount: expectedBehaviorCount, teleportBindingCount: expectedTeleportCount, ...summary }, observed: { helperRegionCount, regionwrightBehaviorCount, teleportBindingCount: verifiedTeleportCount, playerFacingMacroCount }, scenes: Object.freeze(sceneReadback), behaviors: Object.freeze(behaviorReadback), teleports: Object.freeze(teleportReadback), readbackErrors: Object.freeze(readbackErrors), noWrite: true, apply: false, authoritativeReread, noWritesPerformed: true, foreignStatePreservation: "not-observable-after-historical-apply", geometryPreservation: "not-observable-after-historical-apply", playerPasswordState: "not-observable", readyClaim: false, mutation: MUTATION });
}

export async function openAscendancyHandoffStateReadback() {
  const receipt = await readAscendancyRegionwrightHandoffState();
  console.info(`${MODULE_ID} Ascendancy Regionwright current-state readback`, receipt);
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (DialogV2) new DialogV2({ window: { title: "Ascendancy Regionwright handoff state", icon: "fa-solid fa-clipboard-check" }, content: `<pre style="max-height:60vh;overflow:auto;white-space:pre-wrap">${escapeHTML(JSON.stringify(receipt, null, 2))}</pre>`, buttons: [{ action: "close", label: "Close", default: true }] }).render(true);
  return receipt;
}

export async function openAscendancyHandoffInstaller() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can open the Ascendancy handoff installer.");
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const result = await installAscendancyRegionwrightHandoff({ dryRun: true });
  const confirmed = await new Promise(resolve => {
    const dialog = new DialogV2({
      window: { title: "Ascendancy Regionwright Handoff", icon: "fa-solid fa-link" },
      content: `<p>Helper-owned Scenes and Regions are present at the exact target. Regionwright will add only approved behaviors and flags: ${result.popupBehaviorCount} popup, ${result.cooperativeRegionBindingCount} cooperative, ${result.finalCoreBindingCount} final/core, and ${result.teleportBehaviorCount} teleports.</p><p>No Scene, Wall, Region, Macro, or foreign behavior will be created or removed.</p>`,
      buttons: [{ action: "install", label: "Apply Regionwright handoff", default: true, callback: () => resolve(true) }, { action: "cancel", label: "Cancel", callback: () => resolve(false) }],
      close: () => resolve(false),
    });
    dialog.render(true);
  });
  if (!confirmed) return { ...result, status: "CANCELLED" };
  const receipt = await installAscendancyRegionwrightHandoff();
  globalThis.Hooks?.callAll?.(`${MODULE_ID}.ascendancyRegionwrightInstalled`, receipt);
  globalThis.ui?.notifications?.info?.("Ascendancy Regionwright handoff installed and reread.");
  return receipt;
}

export const ascendancyLiveInstaller = Object.freeze({ install: installAscendancyRegionwrightHandoff, inspect: inspectAscendancyRegionwrightHandoff, readback: readAscendancyRegionwrightHandoffState, open: openAscendancyHandoffInstaller, openReadback: openAscendancyHandoffStateReadback, audit: openAscendancyHandoffAudit, preview: options => installAscendancyRegionwrightHandoff({ ...options, dryRun: true }) });
