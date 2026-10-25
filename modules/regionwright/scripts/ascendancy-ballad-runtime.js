import {
  BALLAD_BINDINGS_SOURCE,
  BALLAD_REGION_BINDINGS,
  BALLAD_TELEPORT_CONFIRMATION,
  BALLAD_TELEPORTS,
  BALLAD_UNBOUND_REGION_ID,
  createBalladAscendancyBindingPlan,
  executeBalladTeleportAfterConfirmation,
  validateBalladBindingReadback,
  validateBalladTargetGate,
} from "./ascendancy-ballad-bindings.mjs";
import { ascendancyAPI } from "./ascendancy.js";

const MODULE_ID = "regionwright";
const RUNTIME_VERSION = "1.0.0";
export const BALLAD_INJECTION_MACRO_VERSION = "1.0.0";
const ASSISTANT_LABELS = new Set(["Assistant Gamemaster", "Assistant Gamemaster [GM]"]);
const ASCENDANCY_FLAG = "ascendancy";

// These are the reviewed manual bindings. The apply surface never accepts a
// caller-supplied behavior payload or a package-discovered Region.
const APPROVED_REGION_BEHAVIORS = Object.freeze([
  ["dbx:region:signal-aleister-frequency", "dbx:puzzle:aleister-frequency", "popup-personal"],
  ["dbx:region:signal-sprocket-circuit", "dbx:puzzle:sprocket-circuit", "popup-personal"],
  ["dbx:region:rune-lawson-memory", "dbx:puzzle:lawson-rune-memory", "popup-personal"],
  ["dbx:region:rune-tactal-slotting", "dbx:puzzle:tactal-rune-slotting", "popup-personal"],
  ["dbx:region:signal-cooperative-left", "dbx:cooperative:signal-left", "physical-cooperative"],
  ["dbx:region:signal-cooperative-right", "dbx:cooperative:signal-right", "physical-cooperative"],
  ["dbx:region:rune-order-left", "dbx:cooperative:rune-left", "physical-cooperative"],
  ["dbx:region:rune-order-right", "dbx:cooperative:rune-right", "physical-cooperative"],
  ["dbx:region:core-aleister-station", "dbx:actor:aleister", "final-station"],
  ["dbx:region:core-sprocket-station", "dbx:actor:sprocket", "final-station"],
  ["dbx:region:core-dalton-station", "dbx:actor:dalton", "final-station"],
  ["dbx:region:core-andrew-station", "dbx:actor:andrew-mcconaughey", "final-station"],
  ["dbx:region:core-lawson-station", "dbx:actor:lawson", "final-station"],
  ["dbx:region:core-tactal-station", "dbx:actor:tactal", "final-station"],
  ["dbx:region:core-security-room", "dbx:stage:six-person-simultaneous-activation", "final-core"],
]);

const bindingMap = new Map(BALLAD_REGION_BINDINGS.map(binding => [binding.stableId, binding]));
const approvedRegionMap = new Map(APPROVED_REGION_BEHAVIORS.map(([regionId, semanticId, kind]) => [regionId, { regionId, semanticId, kind }]));
const teleportMap = new Map(BALLAD_TELEPORTS.filter(teleport => teleport.toRegionId !== BALLAD_UNBOUND_REGION_ID).map(teleport => [teleport.teleportId, teleport]));
const MACRO_FLAG = "balladInjection";
const macroCommand = Object.freeze({
  previewAudit: 'const api = game.modules.get("regionwright")?.api?.premium?.ascendancy?.ballad;\nif (!api) { ui.notifications.error("Regionwright premium Ballad adapter is unavailable."); } else { await api.openPreview(); await api.openAudit(); }',
  apply: 'const api = game.modules.get("regionwright")?.api?.premium?.ascendancy?.ballad;\nif (!api) { ui.notifications.error("Regionwright premium Ballad adapter is unavailable."); } else { await api.openApply(); }',
  behaviorRepair: 'const api = game.modules.get("regionwright")?.api?.premium?.ascendancy?.ballad;\nif (!api) { ui.notifications.error("Regionwright premium Ballad adapter is unavailable."); } else { await api.openBehaviorRepair(); }',
});
export const BALLAD_INJECTION_MACRO_DEFINITIONS = Object.freeze([
  Object.freeze({ macroId: "regionwright-ballad-ascendancy-preview-audit-v1", name: "Regionwright Ballad Ascendancy — Preview & Audit", command: macroCommand.previewAudit }),
  Object.freeze({ macroId: "regionwright-ballad-ascendancy-apply-v1", name: "Regionwright Ballad Ascendancy — Apply Reviewed", command: macroCommand.apply }),
  Object.freeze({ macroId: "regionwright-ballad-ascendancy-behavior-repair-v1", name: "Regionwright Ballad Ascendancy — Repair Behaviors", command: macroCommand.behaviorRepair }),
]);
const clone = value => structuredClone(value);
const contents = collection => Array.isArray(collection) ? collection : Array.isArray(collection?.contents) ? collection.contents : collection?.values ? [...collection.values()] : [];
const marker = document => document?.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG] ?? null;
const behaviorCollection = region => contents(region?.getEmbeddedCollection?.("RegionBehavior") ?? region?.behaviors);
const regionStableId = region => marker(region)?.stableRegionId ?? marker(region)?.balladBinding?.stableRegionId ?? null;
const normalizeEvents = events => contents(events).map(String).sort();

function ownedBehaviorReadback(region, stableId) {
  return behaviorCollection(region)
    .filter(behavior => typeof marker(behavior)?.handoffKey === "string")
    .map(behavior => ({
      stableId,
      behaviorId: behavior.id ?? behavior._id ?? null,
      behaviorUuid: behavior.uuid ?? null,
      handoffKey: marker(behavior)?.handoffKey ?? null,
      type: behavior.type ?? behavior._source?.type ?? null,
      disabled: behavior.disabled ?? behavior._source?.disabled ?? null,
      events: normalizeEvents(behavior.system?.events ?? behavior._source?.system?.events),
      source: behavior.system?.source ?? behavior._source?.system?.source ?? null,
    }));
}

function exactAssistantGate(runtime, assistantGamemasterConfirmed) {
  const game = runtime?.game;
  const user = game?.user;
  const target = {
    worldId: game?.world?.id ?? null,
    foundryVersion: game?.version ?? null,
    systemId: game?.system?.id ?? null,
    systemVersion: game?.system?.version ?? null,
    activeGm: Boolean(user?.isGM && game?.users?.activeGM?.id === user.id),
    executor: user?.name ?? user?.character?.name ?? null,
    assistantGamemasterConfirmed: assistantGamemasterConfirmed === true,
  };
  const blockers = [...validateBalladTargetGate(target).blockers];
  if (!user?.isGM) blockers.push("The executor must be a GM.");
  if (!ASSISTANT_LABELS.has(target.executor)) blockers.push("The executor must be Assistant Gamemaster.");
  if (assistantGamemasterConfirmed !== true) blockers.push("The Assistant Gamemaster executor confirmation is required.");
  return Object.freeze({ pass: blockers.length === 0, target: Object.freeze(target), blockers: Object.freeze(blockers) });
}

async function readManualRegions(runtime) {
  if (typeof runtime?.fromUuid !== "function") throw new Error("Foundry fromUuid is required for exact manual Region reread.");
  const regions = [];
  for (const expected of BALLAD_REGION_BINDINGS) {
    const region = await runtime.fromUuid(expected.regionUuid);
    if (!region || region.uuid !== expected.regionUuid) throw new Error(`Manual Region UUID readback drifted for ${expected.stableId}.`);
    if (region.parent?.uuid !== expected.sceneId) throw new Error(`Manual Region parent Scene drifted for ${expected.stableId}.`);
    regions.push({ expected, region, behaviorReadback: ownedBehaviorReadback(region, expected.stableId) });
  }
  const readback = regions.map(({ expected, region }) => ({ stableId: expected.stableId, sceneId: expected.sceneId, regionUuid: region.uuid }));
  const behaviorReadback = regions.flatMap(({ behaviorReadback }) => behaviorReadback);
  const validation = validateBalladBindingReadback(readback);
  if (!validation.pass) throw new Error(`Manual Ballad Region reread failed: ${JSON.stringify(validation.errors)}.`);
  return Object.freeze({ regions: Object.freeze(regions), readback: Object.freeze(readback), behaviorReadback: Object.freeze(behaviorReadback), validation });
}

function protectedRegionSnapshot(region, ownedKeys) {
  const flags = clone(region?.flags ?? {});
  if (flags[MODULE_ID]?.[ASCENDANCY_FLAG]) delete flags[MODULE_ID][ASCENDANCY_FLAG];
  const behaviors = behaviorCollection(region).filter(behavior => !ownedKeys.has(marker(behavior)?.handoffKey)).map(behavior => ({ id: behavior.id ?? null, uuid: behavior.uuid ?? null, source: clone(behavior._source ?? behavior) }));
  return { flags, behaviors };
}

function approvedActions() {
  return APPROVED_REGION_BEHAVIORS.map(([regionId, semanticId, kind]) => ({ type: "regionwright-owned-behavior-upsert", regionId, semanticId, kind, handoffKey: `ballad:region:${regionId}`, permissionBoundary: "assistant-gm-listener" }));
}

function teleportActions() {
  return [...teleportMap.values()].map(teleport => {
    const source = bindingMap.get(teleport.fromRegionId);
    const destination = bindingMap.get(teleport.toRegionId);
    return {
      type: "regionwright-owned-behavior-upsert",
      regionId: teleport.fromRegionId,
      semanticId: teleport.teleportId,
      handoffKey: `ballad:teleport:${teleport.teleportId}`,
      sourceRegionUuid: source.regionUuid,
      destinationRegionUuid: destination.regionUuid,
      confirmation: { required: true, text: BALLAD_TELEPORT_CONFIRMATION, cancel: "leave-token-in-place" },
      automatic: false,
    };
  });
}

function baseReceipt(gate, operation, extra = {}) {
  return Object.freeze({
    runtimeVersion: RUNTIME_VERSION,
    operation,
    evidenceClass: "target-bound",
    target: gate.target,
    source: BALLAD_BINDINGS_SOURCE,
    noSceneWallRegionMacroCreation: true,
    scenesCreated: 0,
    wallsCreated: 0,
    regionsCreated: 0,
    macrosCreated: 0,
    preserveForeignBehaviors: true,
    preserveUnknownFlags: true,
    authoritativeReread: true,
    ...extra,
  });
}

export async function previewBalladAscendancy({ runtime = globalThis, assistantGamemasterConfirmed = false } = {}) {
  const gate = exactAssistantGate(runtime, assistantGamemasterConfirmed);
  if (!gate.pass) return baseReceipt(gate, "ascendancy.ballad.regionwright.preview", { status: "BLOCKED", noWrite: true, blockers: gate.blockers });
  let reread;
  try { reread = await readManualRegions(runtime); } catch (error) { return baseReceipt(gate, "ascendancy.ballad.regionwright.preview", { status: "BLOCKED", noWrite: true, blockers: [error.message] }); }
  const plan = createBalladAscendancyBindingPlan({ target: gate.target, behaviorBindings: approvedActions().map(action => ({ regionId: action.regionId, behavior: action.semanticId })) });
  return baseReceipt(gate, "ascendancy.ballad.regionwright.preview", {
    status: plan.status,
    noWrite: true,
    blockers: plan.blockers,
    mappingCoverage: { expectedBoundRegions: 21, verifiedBoundRegions: reread.readback.length, explicitlyUnboundRegions: [BALLAD_UNBOUND_REGION_ID] },
    behaviorActions: approvedActions(),
    teleportActions: teleportActions(),
    blockedTeleports: plan.blockedTeleports,
    readback: reread.readback,
    behaviorReadback: reread.behaviorReadback,
    ownedBehaviorCount: reread.behaviorReadback.length,
  });
}

export async function auditBalladAscendancy({ runtime = globalThis, assistantGamemasterConfirmed = false } = {}) {
  const gate = exactAssistantGate(runtime, assistantGamemasterConfirmed);
  if (!gate.pass) return baseReceipt(gate, "ascendancy.ballad.regionwright.audit", { status: "BLOCKED", noWrite: true, blockers: gate.blockers });
  try {
    const reread = await readManualRegions(runtime);
    return baseReceipt(gate, "ascendancy.ballad.regionwright.audit", { status: "PASS", noWrite: true, mappingCoverage: { expectedBoundRegions: 21, verifiedBoundRegions: reread.readback.length, explicitlyUnboundRegions: [BALLAD_UNBOUND_REGION_ID] }, readback: reread.readback, behaviorReadback: reread.behaviorReadback, ownedBehaviorCount: reread.behaviorReadback.length, blockedTeleports: [{ teleportId: "dbx:teleport:tram-to-core", issue: "unbound-core-entry-west" }] });
  } catch (error) {
    return baseReceipt(gate, "ascendancy.ballad.regionwright.audit", { status: "BLOCKED", noWrite: true, blockers: [error.message] });
  }
}

function behaviorData(action) {
  return {
    name: `Regionwright: Ballad ${action.semanticId}`,
    type: "executeScript",
    disabled: false,
    system: { events: ["tokenEnter"], source: `const adapter = game.modules.get("${MODULE_ID}")?.api?.premium?.ascendancy?.ballad; const eventType = event?.type ?? event?.name ?? "tokenEnter"; if (!adapter?.handleRegionEvent) { Hooks.callAll("${MODULE_ID}.ascendancyRelayDiagnostic", { version: 1, phase: "player-adapter-absent", regionUuid: region?.uuid ?? null, eventType }); } else { try { await adapter.handleRegionEvent(region, event); } catch (error) { Hooks.callAll("${MODULE_ID}.ascendancyRelayDiagnostic", { version: 1, phase: "behavior-dispatch-rejected", regionUuid: region?.uuid ?? null, eventType, error: String(error?.message ?? error) }); throw error; } }` },
    flags: { [MODULE_ID]: { [ASCENDANCY_FLAG]: { handoffKey: action.handoffKey, stableRegionId: action.regionId, semanticId: action.semanticId, kind: action.kind, permissionBoundary: "assistant-gm-listener", sourceId: BALLAD_BINDINGS_SOURCE.sourceId } } },
  };
}

function teleportBehaviorData(action) {
  return {
    name: `Regionwright: Ballad ${action.semanticId}`,
    type: "executeScript",
    disabled: false,
    system: { events: ["tokenEnter"], source: `const adapter = game.modules.get("${MODULE_ID}")?.api?.premium?.ascendancy?.ballad; const eventType = event?.type ?? event?.name ?? "tokenEnter"; if (!adapter?.handleTeleportEvent) { Hooks.callAll("${MODULE_ID}.ascendancyRelayDiagnostic", { version: 1, phase: "player-adapter-absent", regionUuid: region?.uuid ?? null, eventType }); } else { try { await adapter.handleTeleportEvent(region, event); } catch (error) { Hooks.callAll("${MODULE_ID}.ascendancyRelayDiagnostic", { version: 1, phase: "teleport-dispatch-rejected", regionUuid: region?.uuid ?? null, eventType, error: String(error?.message ?? error) }); throw error; } }` },
    flags: { [MODULE_ID]: { [ASCENDANCY_FLAG]: { handoffKey: action.handoffKey, stableRegionId: action.regionId, semanticId: action.semanticId, kind: "confirmation-gated-teleport", confirmationText: BALLAD_TELEPORT_CONFIRMATION, automatic: false, permissionBoundary: "assistant-gm-listener", sourceId: BALLAD_BINDINGS_SOURCE.sourceId } } },
  };
}

async function upsertBehavior(region, data) {
  const key = data.flags[MODULE_ID][ASCENDANCY_FLAG].handoffKey;
  const owned = behaviorCollection(region).filter(behavior => marker(behavior)?.handoffKey === key);
  if (owned.length > 1) throw new Error(`Duplicate manual Ballad behavior ${key}; refusing to guess.`);
  if (owned.length === 1) {
    const [updated] = await region.updateEmbeddedDocuments("RegionBehavior", [{ _id: owned[0].id, ...data }]);
    return { action: "updated", document: updated };
  }
  const [created] = await region.createEmbeddedDocuments("RegionBehavior", [data]);
  return { action: "created", document: created };
}

export async function applyBalladAscendancy({ runtime = globalThis, assistantGamemasterConfirmed = false, approved = false } = {}) {
  const gate = exactAssistantGate(runtime, assistantGamemasterConfirmed);
  if (!gate.pass || approved !== true) return baseReceipt(gate, "ascendancy.ballad.regionwright.apply", { status: "BLOCKED", noWrite: true, blockers: [...gate.blockers, ...(approved === true ? [] : ["Explicit reviewed approval is required."])] });
  let reread;
  try { reread = await readManualRegions(runtime); } catch (error) { return baseReceipt(gate, "ascendancy.ballad.regionwright.apply", { status: "BLOCKED", noWrite: true, blockers: [error.message] }); }
  const actions = [...approvedActions(), ...teleportActions()];
  const ownedKeys = new Set(actions.map(action => action.handoffKey));
  const before = new Map(reread.regions.map(({ expected, region }) => [expected.stableId, protectedRegionSnapshot(region, ownedKeys)]));
  const byId = new Map(reread.regions.map(({ expected, region }) => [expected.stableId, region]));
  const writes = [];
  for (const action of actions) {
    const region = byId.get(action.regionId);
    if (!region) throw new Error(`Verified manual Region disappeared for ${action.regionId}.`);
    await region.update({ [`flags.${MODULE_ID}.${ASCENDANCY_FLAG}.balladBinding`]: { sourceId: BALLAD_BINDINGS_SOURCE.sourceId, stableRegionId: action.regionId, handoffKey: action.handoffKey } });
    await upsertBehavior(region, action.confirmation ? teleportBehaviorData(action) : behaviorData(action));
    writes.push({ regionId: action.regionId, handoffKey: action.handoffKey });
  }
  const after = await readManualRegions(runtime);
  for (const { expected, region } of after.regions) {
    if (JSON.stringify(before.get(expected.stableId)) !== JSON.stringify(protectedRegionSnapshot(region, ownedKeys))) throw new Error(`Foreign behavior or unknown flag drifted for ${expected.stableId}.`);
  }
  return baseReceipt(gate, "ascendancy.ballad.regionwright.apply", { status: "PASS", noWrite: false, mappingCoverage: { expectedBoundRegions: 21, verifiedBoundRegions: after.readback.length, explicitlyUnboundRegions: [BALLAD_UNBOUND_REGION_ID] }, writes, blockedTeleports: [{ teleportId: "dbx:teleport:tram-to-core", issue: "unbound-core-entry-west" }], readback: after.readback, behaviorReadback: after.behaviorReadback, ownedBehaviorCount: after.behaviorReadback.length, behaviorEventContract: { type: "executeScript", events: ["tokenEnter"], sourceDispatch: "ballad.handleRegionEvent(region,event)" } });
}

export async function ensureBalladInjectionMacros({ runtime = globalThis, assistantGamemasterConfirmed = false } = {}) {
  const gate = exactAssistantGate(runtime, assistantGamemasterConfirmed);
  if (!gate.pass) return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: true, blockers: gate.blockers });
  const macros = runtime?.game?.macros;
  if (!macros) return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: true, blockers: ["Foundry Macro collection is unavailable."] });
  const writes = [];
  let createdMacroCount = 0;
  let updatedMacroCount = 0;
  for (const definition of BALLAD_INJECTION_MACRO_DEFINITIONS) {
    const matches = contents(macros).filter(macro => macro?.flags?.[MODULE_ID]?.[MACRO_FLAG]?.macroId === definition.macroId);
    if (matches.length > 1) return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: true, blockers: [`Duplicate package-owned Macro ${definition.macroId} found.`] });
    const sameName = contents(macros).filter(macro => macro?.name === definition.name && !matches.includes(macro));
    if (sameName.length) return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: true, blockers: [`A foreign Macro already uses the reserved package name ${definition.name}; refusing to duplicate or overwrite it.`] });
    const data = {
      name: definition.name,
      type: "script",
      command: definition.command,
      ownership: { default: 0, [runtime.game.user.id]: 3 },
      flags: { [MODULE_ID]: { [MACRO_FLAG]: { macroId: definition.macroId, version: BALLAD_INJECTION_MACRO_VERSION, role: "gm-only-transport", sourceId: BALLAD_BINDINGS_SOURCE.sourceId } } },
    };
    if (matches.length === 1) {
      const [macro] = matches;
      await macro.update(data);
      updatedMacroCount += 1;
      writes.push({ macroId: definition.macroId, action: "updated", uuid: macro.uuid ?? null });
    } else {
      if (typeof macros.documentClass?.create !== "function") return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: true, blockers: ["Foundry Macro documentClass.create is unavailable."] });
      const macro = await macros.documentClass.create(data, { renderSheet: false });
      createdMacroCount += 1;
      writes.push({ macroId: definition.macroId, action: "created", uuid: macro?.uuid ?? null });
    }
  }
  const reread = contents(runtime.game.macros).filter(macro => BALLAD_INJECTION_MACRO_DEFINITIONS.some(definition => macro?.flags?.[MODULE_ID]?.[MACRO_FLAG]?.macroId === definition.macroId)).map(macro => ({ macroId: macro.flags[MODULE_ID][MACRO_FLAG].macroId, uuid: macro.uuid ?? null, ownership: clone(macro.ownership ?? null), command: macro.command ?? null }));
  if (reread.length !== BALLAD_INJECTION_MACRO_DEFINITIONS.length || reread.some(entry => entry.ownership?.[runtime.game.user.id] !== 3 || !entry.command)) return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "BLOCKED", noWrite: false, blockers: ["Package-owned Macro authoritative reread drifted."], writes, readback: reread });
  return baseReceipt(gate, "ascendancy.ballad.regionwright.ensure-macros", { status: "PASS", noWrite: false, macrosCreated: createdMacroCount, macrosUpdated: updatedMacroCount, writes, readback: reread, playerFacingMacroCount: 0, gmTransportMacroCount: reread.length });
}

export async function handleTeleportEvent(region = null, event = {}) {
  const nativeMove = event?.nativeMove;
  if (typeof nativeMove !== "function") return { status: "BLOCKED", moved: false, reason: "Native movement callback is not exposed by the approved Regionwright adapter." };
  const confirm = typeof event?.confirm === "function" ? event.confirm : async text => {
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    if (typeof DialogV2?.confirm !== "function") return false;
    return (await DialogV2.confirm({ window: { title: "Ascendancy transition", icon: "fa-solid fa-route" }, content: `<p>${text}</p>`, rejectClose: false, modal: true })) === true;
  };
  return executeBalladTeleportAfterConfirmation({ confirm, nativeMove });
}

export function createBalladRegionEventConfig(region) {
  const reviewed = approvedRegionMap.get(regionStableId(region));
  if (!reviewed) return null;
  if (reviewed.kind === "popup-personal") return { version: 1, puzzleId: reviewed.semanticId, stage: "personal", options: {}, permissionBoundary: "active-gm-listener" };
  if (reviewed.kind === "physical-cooperative") return { version: 1, cooperativeId: reviewed.semanticId, stage: "cooperative", entryHook: "regionwright.ascendancyCooperativeStage", completionSource: "pairs[pairId].cooperativeComplete after advanceCooperativeStage", permissionBoundary: "active-gm-listener" };
  if (reviewed.kind === "final-station") return { version: 1, characterId: reviewed.semanticId, stage: "final", activationRound: "event.activationRound", permissionBoundary: "active-gm-listener" };
  if (reviewed.kind === "final-core") return { version: 1, finalStageId: reviewed.semanticId, stage: "core", permissionBoundary: "active-gm-listener" };
  return null;
}

export async function dispatchBalladRegionEvent({ region, event = {}, engine = ascendancyAPI } = {}) {
  const config = createBalladRegionEventConfig(region);
  if (!config) return { status: "BLOCKED", reason: "Region is not one of the fixed reviewed Ballad behavior bindings." };
  const configuredRegion = { ...region, getFlag: (moduleId, flagId) => {
    const existing = region?.getFlag?.(moduleId, flagId) ?? region?.flags?.[moduleId]?.[flagId] ?? {};
    return moduleId === MODULE_ID && flagId === ASCENDANCY_FLAG ? { ...existing, region: config } : existing;
  } };
  return engine.handleRegionEvent(configuredRegion, event);
}

export async function handleRegionEvent(region, event = {}) {
  return dispatchBalladRegionEvent({ region, event });
}

async function showReceipt(title, receipt) {
  console.info(`${MODULE_ID} ${title}`, receipt);
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) return receipt;
  if (typeof DialogV2.wait !== "function") throw new Error("Foundry's documented DialogV2.wait is unavailable.");
  await DialogV2.wait({ window: { title, icon: "fa-solid fa-link" }, content: `<pre style="max-height:60vh;overflow:auto;white-space:pre-wrap">${String(JSON.stringify(receipt, null, 2)).replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>`, buttons: [{ action: "close", label: "Close", default: true }], rejectClose: false, modal: true });
  return receipt;
}

async function confirmAssistantGamemaster(title) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  if (typeof DialogV2.confirm !== "function") throw new Error("Foundry's documented DialogV2.confirm is unavailable.");
  const result = await DialogV2.confirm({ window: { title, icon: "fa-solid fa-user-shield" }, content: "<p>This controlled operation is limited to the official Ballad world and requires the Assistant Gamemaster executor.</p>", rejectClose: false, modal: true });
  return result === true;
}

async function confirmBalladApplyPlan(preview) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const planned = [...(preview.behaviorActions ?? []), ...(preview.teleportActions ?? [])].map(action => `<li><code>${action.handoffKey}</code> → <code>${action.regionId}</code></li>`).join("");
  const blocked = (preview.blockedTeleports ?? []).map(action => `<li><code>${action.teleportId}</code>: blocked (${action.issue})</li>`).join("");
  if (typeof DialogV2.wait !== "function") throw new Error("Foundry's documented DialogV2.wait is unavailable.");
  const result = await DialogV2.wait({
    window: { title: "Review Ballad Ascendancy changes", icon: "fa-solid fa-link" },
    content: `<p>Verified ${preview.mappingCoverage?.verifiedBoundRegions ?? 0}/21 exact manual Regions.</p><p>Only Regionwright-owned RegionBehavior/flags will be updated. No Scene, Wall, Region, or player-facing Macro will be created.</p><p>Planned allowlisted changes:</p><ul style="max-height:30vh;overflow:auto">${planned}</ul><p>Blocked and unchanged:</p><ul>${blocked}</ul><p>Every teleport requires exactly <code>${BALLAD_TELEPORT_CONFIRMATION}</code>; cancel leaves the token in place.</p>`,
    buttons: [{ action: "apply", label: "Approve and apply", default: true }, { action: "cancel", label: "Cancel" }],
    rejectClose: false,
    modal: true,
    submit: submitted => submitted,
  });
  return result === "apply" || result === true;
}

export async function openBalladPreview() {
  const confirmed = await confirmAssistantGamemaster("Preview Ballad Ascendancy bindings");
  const receipt = await previewBalladAscendancy({ assistantGamemasterConfirmed: confirmed });
  return showReceipt("Ballad Ascendancy binding preview", receipt);
}

export async function openBalladAudit() {
  const confirmed = await confirmAssistantGamemaster("Audit Ballad Ascendancy bindings");
  const receipt = await auditBalladAscendancy({ assistantGamemasterConfirmed: confirmed });
  return showReceipt("Ballad Ascendancy binding audit", receipt);
}

export async function openBalladApply() {
  const confirmed = await confirmAssistantGamemaster("Apply Ballad Ascendancy bindings");
  if (!confirmed) return { operation: "ascendancy.ballad.regionwright.apply", status: "CANCELLED", noWrite: true };
  const preview = await previewBalladAscendancy({ assistantGamemasterConfirmed: true });
  const nonExpectedBlockers = (preview.blockers ?? []).filter(blocker => !String(blocker).includes("lack an exact manual Region UUID binding"));
  if (preview.mappingCoverage?.verifiedBoundRegions !== 21 || nonExpectedBlockers.length) return showReceipt("Ballad Ascendancy binding preview blocked", preview);
  if (!await confirmBalladApplyPlan(preview)) return { operation: "ascendancy.ballad.regionwright.apply", status: "CANCELLED", noWrite: true, preview };
  const receipt = await applyBalladAscendancy({ assistantGamemasterConfirmed: true, approved: true });
  return showReceipt("Ballad Ascendancy binding apply", receipt);
}

export async function openBalladBehaviorRepair() {
  return openBalladApply();
}

export async function openBalladEnsureInjectionMacros() {
  const confirmed = await confirmAssistantGamemaster("Install Ballad GM transport macros");
  if (!confirmed) return { operation: "ascendancy.ballad.regionwright.ensure-macros", status: "CANCELLED", noWrite: true };
  const receipt = await ensureBalladInjectionMacros({ assistantGamemasterConfirmed: true });
  return showReceipt("Ballad GM transport macro receipt", receipt);
}

export const ascendancyBalladRuntime = Object.freeze({
  version: RUNTIME_VERSION,
  source: BALLAD_BINDINGS_SOURCE,
  preview: previewBalladAscendancy,
  audit: auditBalladAscendancy,
  apply: applyBalladAscendancy,
  ensureInjectionMacros: ensureBalladInjectionMacros,
  openPreview: openBalladPreview,
  openAudit: openBalladAudit,
  openApply: openBalladApply,
  openBehaviorRepair: openBalladBehaviorRepair,
  openEnsureInjectionMacros: openBalladEnsureInjectionMacros,
  readManualRegions,
  handleRegionEvent,
  createBalladRegionEventConfig,
  handleTeleportEvent,
});
