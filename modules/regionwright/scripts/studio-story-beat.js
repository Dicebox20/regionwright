import { MODULE_ID, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { validateScenarioBlueprint } from "./studio.js";

export const STORY_BEAT_ACTIVITY_ID = "story-beat";
const ACTIVITY_FLAG = "studioActivity";

function text(value) { return String(value ?? "").trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function idOf(document) { return document?.id ?? document?._id ?? null; }
function activityFlag(behavior) { return behavior?.getFlag?.(MODULE_ID, ACTIVITY_FLAG) ?? behavior?.flags?.[MODULE_ID]?.[ACTIVITY_FLAG] ?? behavior?._source?.flags?.[MODULE_ID]?.[ACTIVITY_FLAG] ?? null; }
function ownBehaviors(region, blueprintId = null) { return Array.from(region?.behaviors ?? []).filter(behavior => { const flag = activityFlag(behavior); return flag?.id === STORY_BEAT_ACTIVITY_ID && (!blueprintId || flag.blueprintId === blueprintId); }); }

function details(input) {
  const blueprint = validateScenarioBlueprint(input, { capabilities: { edition: "studio", maxNodes: Infinity, crossScene: true } });
  if (blueprint.id !== STORY_BEAT_ACTIVITY_ID || blueprint.edition !== "premium") throw new Error("This is not a Regionwright Studio Story Beat.");
  if (blueprint.scenes.length !== 1) throw new Error("This Story Beat uses one Scene. Use the cross-Scene storyboard when it becomes available.");
  const trigger = blueprint.nodes.find(node => node.id === "beat-region" && node.kind === "trigger" && node.type === "tokenEnter");
  const message = blueprint.nodes.find(node => node.id === "beat-message" && node.kind === "action" && node.type === "displayScrollingText");
  const pause = blueprint.nodes.find(node => node.id === "beat-pause" && node.kind === "action" && node.type === "pauseGame");
  const regionUuid = text(trigger?.config?.targetUuid);
  if (!trigger || !message || !pause || !regionUuid || !text(message.config?.text)) throw new Error("Choose an area and message before publishing this Story Beat.");
  return { blueprint, trigger, message, pause, regionUuid, sceneUuid: blueprint.scenes[0].uuid };
}

/** Build the bounded native behavior plans behind the first Studio template. */
export function buildStoryBeatActivityPlans(input) {
  const data = details(input);
  const region = { uuid: data.regionUuid, name: "Story Beat Area", sceneUuid: data.sceneUuid };
  const base = { sceneUuid: data.sceneUuid, regions: [region] };
  return Object.freeze({
    ...data,
    message: createPlan({ ...base, behaviorKey: "scrolling-text", parameters: { events: ["tokenAnimateIn"], text: text(data.message.config?.text), color: "#ffffff", visibility: "all", once: true } }),
    pause: createPlan({ ...base, behaviorKey: "pause", parameters: { once: true } })
  });
}

function sourceFor(plan, blueprintId, role) {
  const source = buildRegionBehaviorData(plan);
  source.name = `Regionwright Studio: Story Beat ${role}`;
  source.flags[MODULE_ID][ACTIVITY_FLAG] = { id: STORY_BEAT_ACTIVITY_ID, blueprintId, role };
  return source;
}

function assertContext({ sceneUuid, regionUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (!activeSceneUuid || activeSceneUuid !== sceneUuid) throw new Error("Switch to the Story Beat's Scene before publishing it.");
  const region = resolveUuid?.(regionUuid);
  if (!region || region.documentName !== "Region" || region.parent?.uuid !== sceneUuid) throw new Error("The selected Story Beat area is no longer available on this Scene.");
  return region;
}

async function restore(region, snapshot) {
  const ids = ownBehaviors(region).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

export async function publishStoryBeatActivity(input, {
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  resolveUuid = globalThis.fromUuidSync,
  RegionBehaviorClass = globalThis.foundry?.documents?.RegionBehavior
} = {}) {
  const plans = buildStoryBeatActivityPlans(input);
  const region = assertContext({ ...plans, currentUser, writesEnabled, activeSceneUuid, resolveUuid });
  const sources = [sourceFor(plans.message, plans.blueprint.id, "Message"), sourceFor(plans.pause, plans.blueprint.id, "Pause")];
  if (RegionBehaviorClass) for (const source of sources) new RegionBehaviorClass(source, { parent: region }).validate?.({ strict: true });
  const snapshot = ownBehaviors(region).map(behavior => clone(behavior.toObject?.() ?? behavior));
  try {
    const ids = ownBehaviors(region).map(idOf).filter(Boolean);
    if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
    const created = await region.createEmbeddedDocuments("RegionBehavior", sources);
    return { blueprint: plans.blueprint, region, created, replaced: snapshot.length };
  } catch (error) {
    try { await restore(region, snapshot); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Story Beat.`, rollbackError); }
    throw error;
  }
}

export async function clearStoryBeatActivity(input, options = {}) {
  const plans = buildStoryBeatActivityPlans(input);
  const region = assertContext({ ...plans, ...options, currentUser: options.currentUser ?? globalThis.game?.user, writesEnabled: options.writesEnabled ?? globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true, activeSceneUuid: options.activeSceneUuid ?? globalThis.canvas?.scene?.uuid, resolveUuid: options.resolveUuid ?? globalThis.fromUuidSync });
  const ids = ownBehaviors(region, plans.blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  return { blueprint: plans.blueprint, region, removed: ids.length };
}

export function storyBeatActivityBehaviors(region, blueprintId = null) { return Object.freeze(ownBehaviors(region, blueprintId)); }
