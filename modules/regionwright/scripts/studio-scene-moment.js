import { MODULE_ID, REGION_FLAG, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { validateScenarioBlueprint } from "./studio.js";

export const SCENE_MOMENT_ACTIVITY_ID = "scene-moment";
export const SCENE_MOMENT_FLAG = "sceneMoment";
export const SCENE_MOMENT_SOURCE = `await game.modules.get("${MODULE_ID}")?.api?.studio?.activities?.handleSceneMoment?.(region, event);`;
export const SCENE_MOMENT_SOCKET = `module.${MODULE_ID}`;

const processing = new Set();
let socketInstalled = false;

function text(value) { return String(value ?? "").trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function requestId() { return globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function activeGM() { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); }
function activityFlag(behavior) { return behavior?.getFlag?.(MODULE_ID, "studioActivity") ?? behavior?.flags?.[MODULE_ID]?.studioActivity ?? behavior?._source?.flags?.[MODULE_ID]?.studioActivity ?? null; }
function sceneMomentData(region) { return region?.getFlag?.(MODULE_ID, SCENE_MOMENT_FLAG) ?? region?.flags?.[MODULE_ID]?.[SCENE_MOMENT_FLAG] ?? null; }
function idOf(document) { return document?.id ?? document?._id ?? null; }
function ownBehaviors(region, blueprintId = null) { return Array.from(region?.behaviors ?? []).filter(behavior => { const flag = activityFlag(behavior); return flag?.id === SCENE_MOMENT_ACTIVITY_ID && (!blueprintId || flag.blueprintId === blueprintId); }); }

function details(input) {
  const blueprint = validateScenarioBlueprint(input);
  if (blueprint.id !== SCENE_MOMENT_ACTIVITY_ID || blueprint.edition !== "free") throw new Error("This is not a Free Scene Moment activity.");
  if (blueprint.scenes.length !== 1) throw new Error("A Scene Moment uses one Scene.");
  const trigger = blueprint.nodes.find(node => node.id === "moment-region" && node.kind === "trigger" && node.type === "tokenEnter");
  const reveal = blueprint.nodes.find(node => node.id === "reveal" && node.kind === "action" && node.type === "revealHiddenTokens");
  const narration = blueprint.nodes.find(node => node.id === "narration" && node.kind === "action" && node.type === "displayScrollingText");
  const regionUuid = text(trigger?.config?.targetUuid);
  const targets = [...new Set((reveal?.config?.targetUuids ?? []).map(text).filter(Boolean))];
  const tileTargets = [...new Set((reveal?.config?.targetTileUuids ?? []).map(text).filter(Boolean))];
  const secretReveal = blueprint.metadata?.template === "secret-reveal";
  const message = text(narration?.config?.text);
  if (!trigger || !reveal || !narration || !regionUuid || !(targets.length || tileTargets.length) || !message) throw new Error(secretReveal ? "Choose an area, at least one hidden creature or Tile, and a clue before publishing." : "Choose an area, at least one hidden creature, and a message before publishing.");
  return { blueprint, trigger, reveal, narration, regionUuid, targets, tileTargets, secretReveal, message, sceneUuid: blueprint.scenes[0].uuid };
}

function sourceFor(behavior, blueprintId, role) {
  behavior.name = `Regionwright Studio: Scene Moment ${role}`;
  behavior.flags = { ...(behavior.flags ?? {}), [MODULE_ID]: { ...(behavior.flags?.[MODULE_ID] ?? {}), studioActivity: { id: SCENE_MOMENT_ACTIVITY_ID, blueprintId, role } } };
  return behavior;
}

export function buildSceneMomentActivityPlans(input) {
  const data = details(input);
  const region = { uuid: data.regionUuid, name: "Scene Moment Area", sceneUuid: data.sceneUuid };
  const narration = createPlan({ sceneUuid: data.sceneUuid, regions: [region], behaviorKey: "scrolling-text", parameters: { events: ["tokenAnimateIn"], text: data.message, color: "#ffffff", visibility: "all", once: true } });
  return Object.freeze({
    ...data,
    reveal: Object.freeze({ type: "executeScript", system: { events: ["tokenEnter"], source: SCENE_MOMENT_SOURCE }, flags: { [MODULE_ID]: { [REGION_FLAG]: { behaviorKey: SCENE_MOMENT_ACTIVITY_ID } } } }),
    narration
  });
}

function assertContext({ sceneUuid, regionUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (!activeSceneUuid || activeSceneUuid !== sceneUuid) throw new Error("Switch to the activity's Scene before publishing it.");
  const region = resolveUuid?.(regionUuid);
  if (!region || region.documentName !== "Region" || region.parent?.uuid !== sceneUuid) throw new Error("The selected Scene Moment area is no longer available on this Scene.");
  return region;
}

async function resolveTargets(targets, tileTargets, resolveUuid) {
  const documents = [];
  for (const [uuids, type, label] of [[targets, "Token", "creature"], [tileTargets, "Tile", "Tile"]]) for (const uuid of uuids) {
    const document = resolveUuid?.(uuid);
    if (!document || document.documentName !== type) throw new Error(`One selected hidden ${label} is no longer available on this Scene.`);
    if (document.hidden !== true && document._source?.hidden !== true) throw new Error(`${document.name ?? `A selected ${label}`} must be hidden before publishing this Scene Moment.`);
    documents.push(document);
  }
  return documents;
}

async function restoreBehaviors(region, snapshot) {
  const ids = ownBehaviors(region).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

/** Publish a bounded, resettable reveal-and-narration Scene Moment. */
export async function publishSceneMomentActivity(input, {
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  resolveUuid = globalThis.fromUuidSync,
  RegionBehaviorClass = globalThis.foundry?.documents?.RegionBehavior
} = {}) {
  const plans = buildSceneMomentActivityPlans(input);
  const region = assertContext({ ...plans, currentUser, writesEnabled, activeSceneUuid, resolveUuid });
  const targets = await resolveTargets(plans.targets, plans.tileTargets, resolveUuid);
  const sources = [
    sourceFor(clone(plans.reveal), plans.blueprint.id, "reveal"),
    sourceFor(buildRegionBehaviorData(plans.narration), plans.blueprint.id, "narration")
  ];
  if (RegionBehaviorClass) for (const source of sources) new RegionBehaviorClass(source, { parent: region }).validate?.({ strict: true });
  const snapshot = ownBehaviors(region).map(behavior => clone(behavior.toObject?.() ?? behavior));
  const previous = sceneMomentData(region);
  const state = { version: 1, blueprintId: plans.blueprint.id, targets: targets.map(target => ({ uuid: target.uuid, type: target.documentName, hidden: true })), once: true, triggered: false };
  try {
    await region.update({ [`flags.${MODULE_ID}.${SCENE_MOMENT_FLAG}`]: state });
    const ids = ownBehaviors(region).map(idOf).filter(Boolean);
    if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
    const created = await region.createEmbeddedDocuments("RegionBehavior", sources);
    return { blueprint: plans.blueprint, region, created, replaced: snapshot.length };
  } catch (error) {
    try { await restoreBehaviors(region, snapshot); await region.update({ [`flags.${MODULE_ID}.${SCENE_MOMENT_FLAG}`]: previous ?? null }); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Scene Moment.`, rollbackError); }
    throw error;
  }
}

export async function clearSceneMomentActivity(input, options = {}) {
  const plans = buildSceneMomentActivityPlans(input);
  const region = assertContext({ ...plans, ...options, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const resolveUuid = options.resolveUuid ?? globalThis.fromUuidSync;
  const state = sceneMomentData(region);
  for (const target of state?.targets ?? []) {
    const document = resolveUuid?.(target.uuid);
    if (["Token", "Tile"].includes(document?.documentName) && target.hidden === true) await document.update({ hidden: true });
  }
  const ids = ownBehaviors(region, plans.blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  await region.update({ [`flags.${MODULE_ID}.${SCENE_MOMENT_FLAG}`]: null });
  return { blueprint: plans.blueprint, region, removed: ids.length };
}

async function handleSceneMomentOnGM(region) {
  if (!globalThis.game?.user?.isGM) return { status: "ignored" };
  const state = sceneMomentData(region);
  if (!state?.blueprintId || state.triggered) return { status: state?.triggered ? "already-triggered" : "ignored" };
  const key = `${region.uuid}:${state.blueprintId}`;
  if (processing.has(key)) return { status: "busy" };
  processing.add(key);
  try {
    const targets = await Promise.all((state.targets ?? []).map(async target => globalThis.fromUuidSync?.(target.uuid) ?? await globalThis.fromUuid?.(target.uuid)));
    if (targets.some(document => !document || !["Token", "Tile"].includes(document.documentName))) return { status: "error", message: "A Scene Moment target is missing." };
    await Promise.all(targets.map(document => document.update({ hidden: false })));
    await region.update({ [`flags.${MODULE_ID}.${SCENE_MOMENT_FLAG}.triggered`]: true });
    return { status: "revealed", targets: targets.length };
  } finally { processing.delete(key); }
}

async function handleSocket(payload) {
  if (!payload || payload.action !== "scene-moment" || !activeGM()) return;
  try {
    const region = globalThis.fromUuidSync?.(payload.regionUuid) ?? await globalThis.fromUuid?.(payload.regionUuid);
    await handleSceneMomentOnGM(region);
  } catch (error) { console.error(`${MODULE_ID} could not resolve a Scene Moment.`, error); }
}

export function installSceneMomentSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(SCENE_MOMENT_SOCKET, payload => { void handleSocket(payload); });
  socketInstalled = true;
}

export async function handleSceneMoment(region, event) {
  if (event?.name !== "tokenEnter") return { status: "ignored" };
  if (globalThis.game?.user?.isGM) return handleSceneMomentOnGM(region);
  if (!globalThis.game?.users?.activeGM) return { status: "error", message: "A GM must be connected to resolve this Scene Moment." };
  globalThis.game?.socket?.emit?.(SCENE_MOMENT_SOCKET, { action: "scene-moment", requestId: requestId(), regionUuid: region?.uuid, userId: globalThis.game?.user?.id });
  return { status: "requested" };
}

export function sceneMomentActivityBehaviors(region, blueprintId = null) { return Object.freeze(ownBehaviors(region, blueprintId)); }
