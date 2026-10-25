import { MODULE_ID, WRITE_SETTING } from "./constants.js";
import { buildRegionBehaviorData, createPlan } from "./plan.js";
import { validateScenarioBlueprint } from "./studio.js";

export const PRESSURE_PLATE_ACTIVITY_ID = "pressure-plate-alarm";
const STUDIO_ACTIVITY_FLAG = "studioActivity";

function clone(value) {
  return structuredClone(value ?? {});
}

function text(value) {
  return String(value ?? "").trim();
}

function activityFlag(behavior) {
  return behavior?.getFlag?.(MODULE_ID, STUDIO_ACTIVITY_FLAG)
    ?? behavior?.flags?.[MODULE_ID]?.[STUDIO_ACTIVITY_FLAG]
    ?? behavior?._source?.flags?.[MODULE_ID]?.[STUDIO_ACTIVITY_FLAG]
    ?? null;
}

function idOf(document) {
  return document?.id ?? document?._id ?? null;
}

function isOwnedPressurePlateBehavior(behavior, blueprintId = null) {
  const flag = activityFlag(behavior);
  return flag?.id === PRESSURE_PLATE_ACTIVITY_ID && (!blueprintId || flag.blueprintId === blueprintId);
}

function ownedPressurePlateBehaviors(region, blueprintId = null) {
  return Array.from(region?.behaviors ?? []).filter(behavior => isOwnedPressurePlateBehavior(behavior, blueprintId));
}

function pressurePlateDetails(input) {
  const blueprint = validateScenarioBlueprint(input);
  if (blueprint.edition !== "free") throw new Error("This Pressure Plate activity belongs to Regionwright: Studio.");
  if (blueprint.scenes.length !== 1) throw new Error("The included Pressure Plate activity must use one Scene.");
  const trigger = blueprint.nodes.find(node => node.id === "plate" && node.kind === "trigger" && node.type === "tokenEnter");
  const warning = blueprint.nodes.find(node => node.id === "warning" && node.kind === "action" && node.type === "displayScrollingText");
  const pause = blueprint.nodes.find(node => node.id === "pause" && node.kind === "action" && node.type === "pauseGame");
  const regionUuid = text(trigger?.config?.targetUuid);
  if (!trigger || !warning || !pause || !regionUuid) {
    throw new Error("Choose a Region and keep the Pressure Plate trigger, warning, and pause steps before publishing.");
  }
  return { blueprint, trigger, warning, pause, regionUuid, sceneUuid: blueprint.scenes[0].uuid };
}

/**
 * Build the two native Region Behavior plans used by the included Free Studio
 * activity. This is intentionally limited to the maintained Pressure Plate
 * contract; the broader multi-step activity library belongs to Studio.
 */
export function buildPressurePlateActivityPlans(input) {
  const { blueprint, warning, regionUuid, sceneUuid } = pressurePlateDetails(input);
  const region = { uuid: regionUuid, name: "Pressure Plate Region", sceneUuid };
  const base = { sceneUuid, regions: [region] };
  const message = text(warning.config?.text) || "A hidden mechanism clicks.";
  return Object.freeze({
    blueprint,
    warning: createPlan({
      ...base,
      behaviorKey: "scrolling-text",
      parameters: { events: ["tokenAnimateIn"], text: message, color: "#ffcc00", visibility: "all", once: true }
    }),
    pause: createPlan({ ...base, behaviorKey: "pause", parameters: { once: true } })
  });
}

function sourceForActivity(plan, blueprintId) {
  const source = buildRegionBehaviorData(plan);
  source.name = plan.behavior.key === "pause" ? "Regionwright Studio: Pressure Plate Pause" : "Regionwright Studio: Pressure Plate Warning";
  source.flags[MODULE_ID][STUDIO_ACTIVITY_FLAG] = { id: PRESSURE_PLATE_ACTIVITY_ID, blueprintId };
  return source;
}

function assertPublishContext({ sceneUuid, regionUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid }) {
  if (!currentUser?.isGM) throw new Error("Only a GM can publish a Studio activity.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in Region write setting first.");
  if (!activeSceneUuid || activeSceneUuid !== sceneUuid) throw new Error("Switch to the activity's Scene before publishing it.");
  const region = resolveUuid?.(regionUuid);
  if (!region || region.documentName !== "Region" || region.parent?.uuid !== sceneUuid) {
    throw new Error("The selected Pressure Plate Region is no longer available on this Scene.");
  }
  return region;
}

async function restoreActivityBehaviors(region, snapshot) {
  const currentIds = ownedPressurePlateBehaviors(region).map(idOf).filter(Boolean);
  if (currentIds.length) await region.deleteEmbeddedDocuments("RegionBehavior", currentIds);
  if (snapshot.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot, { keepId: true });
}

/** Publish the included Pressure Plate Alarm as two tagged native behaviors. */
export async function publishPressurePlateActivity(input, {
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  resolveUuid = globalThis.fromUuidSync,
  RegionBehaviorClass = globalThis.foundry?.documents?.RegionBehavior
} = {}) {
  const plans = buildPressurePlateActivityPlans(input);
  const { blueprint } = plans;
  const region = assertPublishContext({ sceneUuid: plans.warning.sceneUuid, regionUuid: plans.warning.selection[0].uuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid });
  const sources = [sourceForActivity(plans.warning, blueprint.id), sourceForActivity(plans.pause, blueprint.id)];
  if (RegionBehaviorClass) {
    for (const source of sources) new RegionBehaviorClass(source, { parent: region }).validate?.({ strict: true });
  }
  const snapshot = ownedPressurePlateBehaviors(region).map(behavior => clone(behavior.toObject?.() ?? behavior));
  try {
    const previousIds = ownedPressurePlateBehaviors(region).map(idOf).filter(Boolean);
    if (previousIds.length) await region.deleteEmbeddedDocuments("RegionBehavior", previousIds);
    const created = await region.createEmbeddedDocuments("RegionBehavior", sources);
    return { blueprint, region, created, replaced: snapshot.length };
  } catch (error) {
    try { await restoreActivityBehaviors(region, snapshot); } catch (rollbackError) { console.error(`${MODULE_ID} could not restore the Pressure Plate activity.`, rollbackError); }
    throw error;
  }
}

/** Remove only the tagged behaviors created by this Pressure Plate activity. */
export async function clearPressurePlateActivity(input, {
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  resolveUuid = globalThis.fromUuidSync
} = {}) {
  const { blueprint, regionUuid, sceneUuid } = pressurePlateDetails(input);
  const region = assertPublishContext({ sceneUuid, regionUuid, currentUser, writesEnabled, activeSceneUuid, resolveUuid });
  const ids = ownedPressurePlateBehaviors(region, blueprint.id).map(idOf).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  return { blueprint, region, removed: ids.length };
}

export function pressurePlateActivityBehaviors(region, blueprintId = null) {
  return Object.freeze(ownedPressurePlateBehaviors(region, blueprintId));
}
