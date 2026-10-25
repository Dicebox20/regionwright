import { MODULE_ID, REGION_FLAG, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { createStoryFactStore } from "./studio-facts.js";
import { validateScenarioBlueprint } from "./studio.js";

export const HUB_UNLOCK_ACTIVITY_ID = "hub-unlock";
export const HUB_UNLOCK_FLAG = "hubUnlock";
export const HUB_UNLOCK_SOURCE = `await game.modules.get("${MODULE_ID}")?.api?.studio?.activities?.handleHubUnlock?.(region, event);`;
export const HUB_UNLOCK_SOCKET = `module.${MODULE_ID}`;
const PREMIUM_CAPABILITIES = { edition: "studio", maxNodes: Infinity, crossScene: true };

let socketInstalled = false;

function text(value) { return String(value ?? "").trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function requestId() { return globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function activeGM() { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); }
function idOf(document) { return document?.id ?? document?._id ?? null; }
function activityFlag(behavior) { return behavior?.getFlag?.(MODULE_ID, "studioActivity") ?? behavior?.flags?.[MODULE_ID]?.studioActivity ?? behavior?._source?.flags?.[MODULE_ID]?.studioActivity ?? null; }
function config(region) { return region?.getFlag?.(MODULE_ID, HUB_UNLOCK_FLAG) ?? region?.flags?.[MODULE_ID]?.[HUB_UNLOCK_FLAG] ?? null; }
function owned(region, blueprintId = null) { return Array.from(region?.behaviors ?? []).filter(behavior => { const entry = activityFlag(behavior); return entry?.id === HUB_UNLOCK_ACTIVITY_ID && (!blueprintId || entry.blueprintId === blueprintId); }); }

function details(input) {
  const blueprint = validateScenarioBlueprint(input, { capabilities: PREMIUM_CAPABILITIES });
  if (blueprint.id !== HUB_UNLOCK_ACTIVITY_ID || blueprint.edition !== "premium") throw new Error("This is not a Regionwright Studio Hub Unlock.");
  if (blueprint.scenes.length !== 1) throw new Error("A Hub Unlock uses one Scene.");
  const trigger = blueprint.nodes.find(node => node.id === "hub-region" && node.kind === "trigger" && node.type === "tokenEnter");
  const facts = blueprint.nodes.find(node => node.id === "hub-facts" && node.kind === "condition" && node.type === "allStoryFacts");
  const door = blueprint.nodes.find(node => node.id === "hub-door" && node.kind === "action" && node.type === "openDoor");
  const narration = blueprint.nodes.find(node => node.id === "hub-message" && node.kind === "action" && node.type === "displayScrollingText");
  const regionUuid = text(trigger?.config?.targetUuid);
  const factIds = [...new Set((facts?.config?.factIds ?? []).map(text).filter(Boolean))];
  const doorUuid = text(door?.config?.targetUuid);
  const message = text(narration?.config?.text);
  if (!trigger || !facts || !door || !narration || !regionUuid || !factIds.length || !doorUuid || !message) throw new Error("Choose a final area, at least one objective, a Door, and a message before publishing.");
  return { blueprint, trigger, facts, door, narration, regionUuid, factIds, doorUuid, message, sceneUuid: blueprint.scenes[0].uuid };
}

export function buildHubUnlockActivityPlans(input) {
  const data = details(input);
  const region = { uuid: data.regionUuid, name: "Hub Unlock Area", sceneUuid: data.sceneUuid };
  const narration = createPlan({ sceneUuid: data.sceneUuid, regions: [region], behaviorKey: "scrolling-text", parameters: { events: ["tokenAnimateIn"], text: data.message, color: "#ffffff", visibility: "all", once: true } });
  return Object.freeze({ ...data, unlock: Object.freeze({ type: "executeScript", system: { events: ["tokenEnter"], source: HUB_UNLOCK_SOURCE }, flags: { [MODULE_ID]: { [REGION_FLAG]: { behaviorKey: HUB_UNLOCK_ACTIVITY_ID } } } }), narration });
}

function sourceFor(source, blueprintId, role) {
  source.name = `Regionwright Studio: Hub Unlock ${role}`;
  source.flags = { ...(source.flags ?? {}), [MODULE_ID]: { ...(source.flags?.[MODULE_ID] ?? {}), studioActivity: { id: HUB_UNLOCK_ACTIVITY_ID, blueprintId, role } } };
  return source;
}

function assertContext({ sceneUuid, regionUuid, doorUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (activeSceneUuid !== sceneUuid) throw new Error("Switch to the Hub Unlock Scene before publishing it.");
  const region = resolveUuid?.(regionUuid);
  const door = resolveUuid?.(doorUuid);
  if (!region || region.documentName !== "Region" || region.parent?.uuid !== sceneUuid) throw new Error("The selected final area is no longer available on this Scene.");
  if (!door || door.documentName !== "Wall" || door.parent?.uuid !== sceneUuid || Number(door.door ?? 0) <= 0) throw new Error("The selected Hub Unlock Door is no longer available on this Scene.");
  return { region, door };
}

async function restore(region, snapshot) {
  const ids = owned(region).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

export async function publishHubUnlockActivity(input, options = {}) {
  const plans = buildHubUnlockActivityPlans(input);
  const { region, door } = assertContext({ ...plans, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const store = options.store ?? createStoryFactStore();
  if (plans.factIds.some(id => !store.load().facts[id])) throw new Error("One selected Hub Unlock objective no longer exists. Choose it again before publishing.");
  const source = [sourceFor(clone(plans.unlock), plans.blueprint.id, "Check"), sourceFor(buildRegionBehaviorData(plans.narration), plans.blueprint.id, "Message")];
  if (options.RegionBehaviorClass ?? globalThis.foundry?.documents?.RegionBehavior) for (const entry of source) new (options.RegionBehaviorClass ?? globalThis.foundry.documents.RegionBehavior)(entry, { parent: region }).validate?.({ strict: true });
  const snapshot = owned(region).map(behavior => clone(behavior.toObject?.() ?? behavior));
  const previous = config(region);
  try {
    await region.update({ [`flags.${MODULE_ID}.${HUB_UNLOCK_FLAG}`]: { version: 1, blueprintId: plans.blueprint.id, factIds: plans.factIds, doorUuid: door.uuid, originalDoorState: door.ds, triggered: false } });
    const ids = owned(region).map(idOf).filter(Boolean);
    if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
    const created = await region.createEmbeddedDocuments("RegionBehavior", source);
    return { blueprint: plans.blueprint, region, door, created, replaced: snapshot.length };
  } catch (error) {
    try { await restore(region, snapshot); await region.update({ [`flags.${MODULE_ID}.${HUB_UNLOCK_FLAG}`]: previous ?? null }); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Hub Unlock activity.`, rollbackError); }
    throw error;
  }
}

export async function clearHubUnlockActivity(input, options = {}) {
  const plans = buildHubUnlockActivityPlans(input);
  const { region, door } = assertContext({ ...plans, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const current = config(region);
  if (current?.triggered && Number.isFinite(Number(current.originalDoorState)) && door.ds === globalThis.CONST?.WALL_DOOR_STATES?.CLOSED) await door.update({ ds: current.originalDoorState });
  const ids = owned(region, plans.blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  await region.update({ [`flags.${MODULE_ID}.${HUB_UNLOCK_FLAG}`]: null });
  return { blueprint: plans.blueprint, region, door, removed: ids.length };
}

/** Fixed GM-only resolver: opens the configured Door only after every fact is true. */
async function handleHubUnlockOnGM(region, { store = createStoryFactStore(), resolveUuid = globalThis.fromUuidSync, closedState = globalThis.CONST?.WALL_DOOR_STATES?.CLOSED } = {}) {
  if (!globalThis.game?.user?.isGM) return { status: "ignored" };
  const current = config(region);
  if (!current?.doorUuid || current.triggered) return { status: current?.triggered ? "already-unlocked" : "ignored" };
  const facts = store.load().facts;
  const missing = (current.factIds ?? []).filter(id => facts[id]?.value !== true);
  if (missing.length) return { status: "waiting", missing };
  const door = resolveUuid?.(current.doorUuid);
  if (!door || door.documentName !== "Wall") return { status: "error", message: "The Hub Unlock Door is missing." };
  if (!Number.isFinite(Number(closedState))) return { status: "error", message: "Foundry did not provide a closed Door state." };
  await door.update({ ds: closedState });
  await region.update({ [`flags.${MODULE_ID}.${HUB_UNLOCK_FLAG}.triggered`]: true });
  return { status: "unlocked", doorUuid: door.uuid };
}

async function handleSocket(payload) {
  if (!payload || payload.action !== "hub-unlock" || !activeGM()) return;
  try {
    const region = globalThis.fromUuidSync?.(payload.regionUuid) ?? await globalThis.fromUuid?.(payload.regionUuid);
    await handleHubUnlockOnGM(region);
  } catch (error) { console.error(`${MODULE_ID} could not resolve a Hub Unlock.`, error); }
}

/** Install the player-to-GM relay on every client lifecycle entry point. */
export function installHubUnlockSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(HUB_UNLOCK_SOCKET, payload => { void handleSocket(payload); });
  socketInstalled = true;
}

/** A player can request the gate check; only the active GM updates the Door. */
export async function handleHubUnlock(region, event, options = {}) {
  if (event?.name !== "tokenEnter") return { status: "ignored" };
  if (globalThis.game?.user?.isGM) return handleHubUnlockOnGM(region, options);
  if (!globalThis.game?.users?.activeGM) return { status: "error", message: "A GM must be connected to resolve this Hub Unlock." };
  globalThis.game?.socket?.emit?.(HUB_UNLOCK_SOCKET, { action: "hub-unlock", requestId: requestId(), regionUuid: region?.uuid, userId: globalThis.game?.user?.id });
  return { status: "requested" };
}

export function hubUnlockActivityBehaviors(region, blueprintId = null) { return Object.freeze(owned(region, blueprintId)); }
