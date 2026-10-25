import { MODULE_ID, REGION_FLAG, WRITE_SETTING } from "./constants.js";
import { buildCapabilitySnapshot } from "./capabilities.js";
import { buildRegionBehaviorData, validatePlan } from "./plan.js";

function idOf(document) {
  return document?.id ?? document?._id ?? null;
}

export function forgeOwnedKey(document) {
  return document?.flags?.[MODULE_ID]?.[REGION_FLAG]?.behaviorKey
    ?? document?._source?.flags?.[MODULE_ID]?.[REGION_FLAG]?.behaviorKey
    ?? document?.getFlag?.(MODULE_ID, `${REGION_FLAG}.behaviorKey`)
    ?? "";
}

export function buildReconciliationOperations(existingBehaviors, plan, { replaceOwned = true } = {}) {
  validatePlan(plan);
  const existing = Array.from(existingBehaviors ?? []);
  const owned = existing.filter(entry => forgeOwnedKey(entry));
  const desired = buildRegionBehaviorData(plan);
  const matching = owned.find(entry => forgeOwnedKey(entry) === plan.behavior.key && entry.type === plan.behavior.type);
  const updates = matching ? [{ _id: idOf(matching), ...desired }] : [];
  const creates = matching ? [] : [desired];
  const deletes = replaceOwned
    ? owned.filter(entry => idOf(entry) !== idOf(matching) || forgeOwnedKey(entry) !== plan.behavior.key).map(idOf).filter(Boolean)
    : [];
  return { creates, updates, deletes };
}

function snapshotOwned(region) {
  return Array.from(region?.behaviors ?? [])
    .filter(entry => forgeOwnedKey(entry))
    .map(entry => entry.toObject?.() ?? structuredClone(entry));
}

function snapshotRegion(region) {
  return { name: String(region?.name ?? ""), behaviors: snapshotOwned(region) };
}

async function validateRuntime(plan, regions, { config, RegionBehaviorClass } = {}) {
  validatePlan(plan);
  const capabilities = buildCapabilitySnapshot({ config });
  if (!capabilities.supportedBehaviorTypes.includes(plan.behavior.type)) {
    throw new Error(`Foundry has not registered Region behavior type ${plan.behavior.type}.`);
  }
  if (RegionBehaviorClass) {
    for (const region of regions) {
      const candidate = new RegionBehaviorClass(buildRegionBehaviorData(plan), { parent: region });
      candidate.validate?.({ strict: true });
    }
  }
}

async function restoreRegion(region, snapshot) {
  const currentOwnedIds = Array.from(region?.behaviors ?? []).filter(entry => forgeOwnedKey(entry)).map(idOf).filter(Boolean);
  if (currentOwnedIds.length) await region.deleteEmbeddedDocuments("RegionBehavior", currentOwnedIds);
  if (snapshot.behaviors.length) await region.createEmbeddedDocuments("RegionBehavior", snapshot.behaviors, { keepId: true });
  if (String(region?.name ?? "") !== snapshot.name) await region.update?.({ name: snapshot.name });
}

export async function applyPlan(plan, {
  regions,
  activeSceneUuid = globalThis.canvas?.scene?.uuid,
  currentUser = globalThis.game?.user,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  config = globalThis.CONFIG,
  RegionBehaviorClass = globalThis.foundry?.documents?.RegionBehavior,
  replaceOwned = true
} = {}) {
  validatePlan(plan);
  if (!currentUser?.isGM) throw new Error("Only a GM can apply Region Behavior plans.");
  if (plan.approval?.gmReviewed !== true) throw new Error("The plan must be reviewed and approved by a GM before applying it.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in world setting first.");
  if (!activeSceneUuid || activeSceneUuid !== plan.sceneUuid) throw new Error("The plan must target the active Scene.");
  if (!Array.isArray(regions) || regions.length !== plan.selection.length) throw new Error("The resolved Region documents do not match the reviewed selection.");
  if (regions.some(region => region?.documentName !== "Region" || region?.parent?.uuid !== plan.sceneUuid)) {
    throw new Error("Every resolved Region must belong to the active Scene.");
  }
  const reviewedUuids = new Set(plan.selection.map(reference => reference.uuid));
  const resolvedUuids = regions.map(region => region.uuid);
  if (new Set(resolvedUuids).size !== resolvedUuids.length || resolvedUuids.some(uuid => !reviewedUuids.has(uuid))) {
    throw new Error("The resolved Region documents do not match the reviewed UUID selection.");
  }

  await validateRuntime(plan, regions, { config, RegionBehaviorClass });
  const snapshots = new Map(regions.map(region => [region, snapshotRegion(region)]));
  const namesByUuid = new Map(plan.regionUpdates.map(update => [update.uuid, update.name]));
  const results = [];
  try {
    for (const region of regions) {
      const operations = buildReconciliationOperations(region.behaviors, plan, { replaceOwned });
      const created = operations.creates.length ? await region.createEmbeddedDocuments("RegionBehavior", operations.creates) : [];
      const updated = operations.updates.length ? await region.updateEmbeddedDocuments("RegionBehavior", operations.updates) : [];
      const deleted = operations.deletes.length ? await region.deleteEmbeddedDocuments("RegionBehavior", operations.deletes) : [];
      const renamed = namesByUuid.has(region.uuid) ? await region.update?.({ name: namesByUuid.get(region.uuid) }) : null;
      results.push({ region, created, updated, deleted, renamed, operations });
    }
  } catch (error) {
    for (const [region, snapshot] of snapshots) {
      try {
        await restoreRegion(region, snapshot);
      } catch (rollbackError) {
        console.error(`${MODULE_ID} could not fully roll back Region Behavior changes.`, rollbackError);
      }
    }
    throw error;
  }
  return { plan, results };
}

export { validateRuntime };
