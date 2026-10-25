import { MODULE_ID, REGION_FLAG, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { createStoryFactStore, normalizeStoryFact } from "./studio-facts.js";
import { validateScenarioBlueprint } from "./studio.js";

export const STORY_FACT_ACTIVITY_ID = "story-fact";
export const STORY_FACT_FLAG = "storyFactTrigger";
export const STORY_FACT_SOURCE = `await game.modules.get("${MODULE_ID}")?.api?.studio?.activities?.handleStoryFact?.(region, event);`;
export const STORY_FACT_SOCKET = `module.${MODULE_ID}`;
const PREMIUM_CAPABILITIES = { edition: "studio", maxNodes: Infinity, crossScene: true };

let socketInstalled = false;

function text(value) { return String(value ?? "").trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function requestId() { return globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function activeGM() { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); }
function idOf(document) { return document?.id ?? document?._id ?? null; }
function activityFlag(behavior) { return behavior?.getFlag?.(MODULE_ID, "studioActivity") ?? behavior?.flags?.[MODULE_ID]?.studioActivity ?? behavior?._source?.flags?.[MODULE_ID]?.studioActivity ?? null; }
function state(region) { return region?.getFlag?.(MODULE_ID, STORY_FACT_FLAG) ?? region?.flags?.[MODULE_ID]?.[STORY_FACT_FLAG] ?? null; }
function owned(region, blueprintId = null) { return Array.from(region?.behaviors ?? []).filter(behavior => { const entry = activityFlag(behavior); return entry?.id === STORY_FACT_ACTIVITY_ID && (!blueprintId || entry.blueprintId === blueprintId); }); }

function details(input) {
  const blueprint = validateScenarioBlueprint(input, { capabilities: PREMIUM_CAPABILITIES });
  if (blueprint.id !== STORY_FACT_ACTIVITY_ID || blueprint.edition !== "premium") throw new Error("This is not a Regionwright Studio Story Fact.");
  if (blueprint.scenes.length !== 1) throw new Error("A Story Fact uses one Scene.");
  const trigger = blueprint.nodes.find(node => node.id === "fact-region" && node.kind === "trigger" && node.type === "tokenEnter");
  const setFact = blueprint.nodes.find(node => node.id === "set-fact" && node.kind === "action" && node.type === "setStoryFact");
  const narration = blueprint.nodes.find(node => node.id === "fact-message" && node.kind === "action" && node.type === "displayScrollingText");
  const regionUuid = text(trigger?.config?.targetUuid);
  const fact = normalizeStoryFact({ id: setFact?.config?.factId, label: setFact?.config?.label, value: false });
  const message = text(narration?.config?.text);
  if (!trigger || !setFact || !narration || !regionUuid || !message) throw new Error("Choose an area, name the story fact, and enter a message before publishing.");
  return { blueprint, trigger, setFact, narration, regionUuid, fact, message, sceneUuid: blueprint.scenes[0].uuid };
}

export function buildStoryFactActivityPlans(input) {
  const data = details(input);
  const region = { uuid: data.regionUuid, name: "Story Fact Area", sceneUuid: data.sceneUuid };
  const narration = createPlan({ sceneUuid: data.sceneUuid, regions: [region], behaviorKey: "scrolling-text", parameters: { events: ["tokenAnimateIn"], text: data.message, color: "#ffffff", visibility: "all", once: true } });
  return Object.freeze({ ...data, setFact: Object.freeze({ type: "executeScript", system: { events: ["tokenEnter"], source: STORY_FACT_SOURCE }, flags: { [MODULE_ID]: { [REGION_FLAG]: { behaviorKey: STORY_FACT_ACTIVITY_ID } } } }), narration });
}

function sourceFor(source, blueprintId, role) {
  source.name = `Regionwright Studio: Story Fact ${role}`;
  source.flags = { ...(source.flags ?? {}), [MODULE_ID]: { ...(source.flags?.[MODULE_ID] ?? {}), studioActivity: { id: STORY_FACT_ACTIVITY_ID, blueprintId, role } } };
  return source;
}

function assertContext({ sceneUuid, regionUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (activeSceneUuid !== sceneUuid) throw new Error("Switch to the Story Fact Scene before publishing it.");
  const region = resolveUuid?.(regionUuid);
  if (!region || region.documentName !== "Region" || region.parent?.uuid !== sceneUuid) throw new Error("The selected Story Fact area is no longer available on this Scene.");
  return region;
}

async function restore(region, snapshot) {
  const ids = owned(region).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

export async function publishStoryFactActivity(input, options = {}) {
  const plans = buildStoryFactActivityPlans(input);
  const region = assertContext({ ...plans, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const store = options.store ?? createStoryFactStore();
  const source = [sourceFor(clone(plans.setFact), plans.blueprint.id, "Set"), sourceFor(buildRegionBehaviorData(plans.narration), plans.blueprint.id, "Message")];
  if (options.RegionBehaviorClass ?? globalThis.foundry?.documents?.RegionBehavior) for (const entry of source) new (options.RegionBehaviorClass ?? globalThis.foundry.documents.RegionBehavior)(entry, { parent: region }).validate?.({ strict: true });
  const snapshot = owned(region).map(behavior => clone(behavior.toObject?.() ?? behavior));
  const previous = state(region);
  try {
    if (!store.load().facts[plans.fact.id]) await store.set(plans.fact);
    await region.update({ [`flags.${MODULE_ID}.${STORY_FACT_FLAG}`]: { version: 1, blueprintId: plans.blueprint.id, factId: plans.fact.id, label: plans.fact.label } });
    const ids = owned(region).map(idOf).filter(Boolean);
    if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
    const created = await region.createEmbeddedDocuments("RegionBehavior", source);
    return { blueprint: plans.blueprint, region, fact: plans.fact, created, replaced: snapshot.length };
  } catch (error) {
    try { await restore(region, snapshot); await region.update({ [`flags.${MODULE_ID}.${STORY_FACT_FLAG}`]: previous ?? null }); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Story Fact activity.`, rollbackError); }
    throw error;
  }
}

export async function clearStoryFactActivity(input, options = {}) {
  const plans = buildStoryFactActivityPlans(input);
  const region = assertContext({ ...plans, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const ids = owned(region, plans.blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  await region.update({ [`flags.${MODULE_ID}.${STORY_FACT_FLAG}`]: null });
  return { blueprint: plans.blueprint, region, removed: ids.length };
}

/** Resolve the state write exclusively on the active GM client. */
async function handleStoryFactOnGM(region, { store = createStoryFactStore() } = {}) {
  if (!globalThis.game?.user?.isGM) return { status: "ignored" };
  const config = state(region);
  if (!config?.factId || !config?.label) return { status: "ignored" };
  const existing = store.load().facts[config.factId];
  if (existing?.value === true) return { status: "already-set", fact: existing };
  const fact = await store.set({ id: config.factId, label: config.label, value: true });
  return { status: "set", fact };
}

async function handleSocket(payload) {
  if (!payload || payload.action !== "story-fact" || !activeGM()) return;
  try {
    const region = globalThis.fromUuidSync?.(payload.regionUuid) ?? await globalThis.fromUuid?.(payload.regionUuid);
    await handleStoryFactOnGM(region);
  } catch (error) { console.error(`${MODULE_ID} could not resolve a Story Fact.`, error); }
}

/** Install the player-to-GM relay on every client lifecycle entry point. */
export function installStoryFactSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(STORY_FACT_SOCKET, payload => { void handleSocket(payload); });
  socketInstalled = true;
}

/** A player may request this outcome, but only the active GM writes progress. */
export async function handleStoryFact(region, event, options = {}) {
  if (event?.name !== "tokenEnter") return { status: "ignored" };
  if (globalThis.game?.user?.isGM) return handleStoryFactOnGM(region, options);
  if (!globalThis.game?.users?.activeGM) return { status: "error", message: "A GM must be connected to resolve this Story Fact." };
  globalThis.game?.socket?.emit?.(STORY_FACT_SOCKET, { action: "story-fact", requestId: requestId(), regionUuid: region?.uuid, userId: globalThis.game?.user?.id });
  return { status: "requested" };
}

export function storyFactActivityBehaviors(region, blueprintId = null) { return Object.freeze(owned(region, blueprintId)); }
