import { MODULE_ID, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { validateScenarioBlueprint } from "./studio.js";

export const SCENE_PORTAL_ACTIVITY_ID = "scene-portal";
const ACTIVITY_FLAG = "studioActivity";
const PREMIUM_CAPABILITIES = { edition: "studio", maxNodes: Infinity, crossScene: true };

function text(value) { return String(value ?? "").trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function idOf(document) { return document?.id ?? document?._id ?? null; }
function flag(behavior) { return behavior?.getFlag?.(MODULE_ID, ACTIVITY_FLAG) ?? behavior?.flags?.[MODULE_ID]?.[ACTIVITY_FLAG] ?? behavior?._source?.flags?.[MODULE_ID]?.[ACTIVITY_FLAG] ?? null; }
function owned(region, blueprintId = null) { return Array.from(region?.behaviors ?? []).filter(behavior => { const entry = flag(behavior); return entry?.id === SCENE_PORTAL_ACTIVITY_ID && (!blueprintId || entry.blueprintId === blueprintId); }); }

function details(input) {
  const blueprint = validateScenarioBlueprint(input, { capabilities: PREMIUM_CAPABILITIES });
  if (blueprint.id !== SCENE_PORTAL_ACTIVITY_ID || blueprint.edition !== "premium") throw new Error("This is not a Regionwright Studio Scene Portal.");
  const entry = blueprint.nodes.find(node => node.id === "portal-entry" && node.kind === "trigger" && node.type === "tokenEnter");
  const arrival = blueprint.nodes.find(node => node.id === "portal-arrival" && node.kind === "action" && node.type === "teleportToken");
  const sourceUuid = text(entry?.config?.targetUuid);
  const destinationUuid = text(arrival?.config?.targetUuid);
  const sourceSceneUuid = text(entry?.sceneUuid);
  const destinationSceneUuid = text(arrival?.config?.targetSceneUuid);
  if (!entry || !arrival || !sourceUuid || !destinationUuid || !sourceSceneUuid || !destinationSceneUuid) throw new Error("Choose the portal area, destination Scene, and arrival area before publishing.");
  if (sourceSceneUuid === destinationSceneUuid) throw new Error("Choose a different destination Scene for this portal.");
  if (!blueprint.scenes.some(scene => scene.uuid === sourceSceneUuid) || !blueprint.scenes.some(scene => scene.uuid === destinationSceneUuid)) throw new Error("The portal Scenes are incomplete. Choose the destination Scene again.");
  return { blueprint, entry, arrival, sourceUuid, destinationUuid, sourceSceneUuid, destinationSceneUuid };
}

export function buildScenePortalActivityPlan(input) {
  const data = details(input);
  return Object.freeze({
    ...data,
    portal: createPlan({
      sceneUuid: data.sourceSceneUuid,
      regions: [{ uuid: data.sourceUuid, name: "Portal entrance", sceneUuid: data.sourceSceneUuid }],
      behaviorKey: "teleport",
      parameters: { destinations: [data.destinationUuid], placement: "center", snap: true, choice: false, revealed: true, transitionDuration: 500 }
    })
  });
}

function sourceFor(plan, blueprintId) {
  const source = buildRegionBehaviorData(plan);
  source.name = "Regionwright Studio: Scene Portal";
  source.flags[MODULE_ID][ACTIVITY_FLAG] = { id: SCENE_PORTAL_ACTIVITY_ID, blueprintId, role: "portal" };
  return source;
}

function assertContext({ sourceSceneUuid, destinationSceneUuid, sourceUuid, destinationUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (activeSceneUuid !== sourceSceneUuid) throw new Error("Switch to the portal entrance Scene before publishing it.");
  const source = resolveUuid?.(sourceUuid);
  const destination = resolveUuid?.(destinationUuid);
  if (!source || source.documentName !== "Region" || source.parent?.uuid !== sourceSceneUuid) throw new Error("The selected portal area is no longer available on its Scene.");
  if (!destination || destination.documentName !== "Region" || destination.parent?.uuid !== destinationSceneUuid) throw new Error("The selected arrival area is no longer available on its Scene.");
  return { source, destination };
}

async function restore(region, snapshot) {
  const ids = owned(region).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

/** Publish a native, tagged cross-Scene Teleport Region Behavior. */
export async function publishScenePortalActivity(input, {
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  resolveUuid = globalThis.fromUuidSync,
  RegionBehaviorClass = globalThis.foundry?.documents?.RegionBehavior
} = {}) {
  const plans = buildScenePortalActivityPlan(input);
  const { source, destination } = assertContext({ ...plans, currentUser, writesEnabled, activeSceneUuid, resolveUuid });
  const sourceData = sourceFor(plans.portal, plans.blueprint.id);
  if (RegionBehaviorClass) new RegionBehaviorClass(sourceData, { parent: source }).validate?.({ strict: true });
  const snapshot = owned(source).map(behavior => clone(behavior.toObject?.() ?? behavior));
  try {
    const ids = owned(source).map(idOf).filter(Boolean);
    if (ids.length) await source.deleteEmbeddedDocuments("RegionBehavior", ids);
    const created = await source.createEmbeddedDocuments("RegionBehavior", [sourceData]);
    return { blueprint: plans.blueprint, region: source, destination, created, replaced: snapshot.length };
  } catch (error) {
    try { await restore(source, snapshot); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Scene Portal.`, rollbackError); }
    throw error;
  }
}

export async function clearScenePortalActivity(input, options = {}) {
  const plans = buildScenePortalActivityPlan(input);
  const { source } = assertContext({ ...plans, ...options, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const ids = owned(source, plans.blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await source.deleteEmbeddedDocuments("RegionBehavior", ids);
  return { blueprint: plans.blueprint, region: source, removed: ids.length };
}

export function scenePortalActivityBehaviors(region, blueprintId = null) { return Object.freeze(owned(region, blueprintId)); }
