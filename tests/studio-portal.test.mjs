import assert from "node:assert/strict";
import test from "node:test";
import { buildScenePortalActivityPlan, clearScenePortalActivity, publishScenePortalActivity } from "../modules/regionwright/scripts/studio-portal.js";
import { createPortalScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) { return { ...structuredClone(source), id, toObject() { return structuredClone({ ...this, toObject: undefined }); } }; }

function fixture() {
  const sourceSceneUuid = "Scene.source";
  const destinationSceneUuid = "Scene.destination";
  const source = {
    id: "source", uuid: `${sourceSceneUuid}.Region.source`, name: "Portal Entrance", documentName: "Region", parent: { uuid: sourceSceneUuid }, behaviors: [],
    async createEmbeddedDocuments(type, sources) { assert.equal(type, "RegionBehavior"); const created = sources.map((entry, index) => behavior(entry, `portal-${this.behaviors.length + index}`)); this.behaviors.push(...created); return created; },
    async deleteEmbeddedDocuments(type, ids) { assert.equal(type, "RegionBehavior"); this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id)); return ids; }
  };
  const destination = { id: "destination", uuid: `${destinationSceneUuid}.Region.destination`, name: "Arrival", documentName: "Region", parent: { uuid: destinationSceneUuid } };
  const blueprint = structuredClone(createPortalScenarioBlueprint({ sceneUuid: sourceSceneUuid, sceneName: "Source" }));
  blueprint.scenes.push({ uuid: destinationSceneUuid, name: "Destination" });
  blueprint.nodes.find(node => node.id === "portal-entry").config.targetUuid = source.uuid;
  const arrival = blueprint.nodes.find(node => node.id === "portal-arrival");
  arrival.sceneUuid = destinationSceneUuid;
  arrival.config.targetSceneUuid = destinationSceneUuid;
  arrival.config.targetUuid = destination.uuid;
  const resolveUuid = uuid => ({ [source.uuid]: source, [destination.uuid]: destination })[uuid] ?? null;
  return { blueprint, source, destination, sourceSceneUuid, destinationSceneUuid, options: { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sourceSceneUuid, resolveUuid } };
}

test("Scene Portal builds a bounded native cross-Scene teleport plan", () => {
  const { blueprint, destination } = fixture();
  const plans = buildScenePortalActivityPlan(blueprint);
  assert.equal(plans.portal.behavior.key, "teleport");
  assert.deepEqual(plans.portal.behavior.parameters.destinations, [destination.uuid]);
  assert.equal(plans.portal.behavior.parameters.placement, "center");
});

test("Scene Portal publishes and removes only its tagged native behavior", async () => {
  const { blueprint, source, destination, options } = fixture();
  source.behaviors.push(behavior({ flags: { regionwright: { studioActivity: { id: "other" } } } }, "other"));
  const published = await publishScenePortalActivity(blueprint, options);
  assert.equal(published.created.length, 1);
  assert.equal(published.destination, destination);
  const again = await publishScenePortalActivity(blueprint, options);
  assert.equal(again.replaced, 1);
  const removed = await clearScenePortalActivity(blueprint, options);
  assert.equal(removed.removed, 1);
  assert.equal(source.behaviors.length, 1);
});

test("Scene Portal rejects player, stale, same-Scene, and incomplete routes", async () => {
  const { blueprint, options, sourceSceneUuid } = fixture();
  await assert.rejects(() => publishScenePortalActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishScenePortalActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  blueprint.nodes.find(node => node.id === "portal-arrival").config.targetSceneUuid = sourceSceneUuid;
  await assert.rejects(() => publishScenePortalActivity(blueprint, options), /different destination Scene/);
  blueprint.nodes.find(node => node.id === "portal-arrival").config.targetSceneUuid = "";
  await assert.rejects(() => publishScenePortalActivity(blueprint, options), /Choose the portal area/);
});
