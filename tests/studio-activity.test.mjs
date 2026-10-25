import assert from "node:assert/strict";
import test from "node:test";
import { buildPressurePlateActivityPlans, clearPressurePlateActivity, publishPressurePlateActivity } from "../modules/regionwright/scripts/studio-activity.js";
import { createStarterScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) {
  return {
    ...structuredClone(source),
    id,
    toObject() { return structuredClone({ ...this, toObject: undefined }); }
  };
}

function fixture() {
  const sceneUuid = "Scene.demo";
  const region = {
    id: "plate-region",
    uuid: `${sceneUuid}.Region.plate-region`,
    name: "Alarm Plate",
    documentName: "Region",
    parent: { uuid: sceneUuid },
    behaviors: [],
    async createEmbeddedDocuments(type, sources) {
      assert.equal(type, "RegionBehavior");
      const created = sources.map((source, index) => behavior(source, `created-${this.behaviors.length + index + 1}`));
      this.behaviors.push(...created);
      return created;
    },
    async deleteEmbeddedDocuments(type, ids) {
      assert.equal(type, "RegionBehavior");
      this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id));
      return ids;
    }
  };
  const blueprint = structuredClone(createStarterScenarioBlueprint({ sceneUuid, sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "plate").config.targetUuid = region.uuid;
  return { blueprint, region, sceneUuid };
}

test("Pressure Plate Alarm builds two bounded native Region Behavior plans", () => {
  const { blueprint } = fixture();
  const plans = buildPressurePlateActivityPlans(blueprint);
  assert.equal(plans.warning.behavior.key, "scrolling-text");
  assert.equal(plans.warning.behavior.parameters.text, "A hidden mechanism clicks.");
  assert.equal(plans.pause.behavior.key, "pause");
  assert.equal(plans.pause.behavior.parameters.once, true);
});

test("Pressure Plate Alarm publishes and removes only its own tagged behaviors", async () => {
  const { blueprint, region, sceneUuid } = fixture();
  region.behaviors.push(behavior({ id: "other", flags: { regionwright: { regionwright: { behaviorKey: "pause" } } } }, "other"));
  const options = { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid: uuid => uuid === region.uuid ? region : null };
  const first = await publishPressurePlateActivity(blueprint, options);
  assert.equal(first.created.length, 2);
  assert.equal(region.behaviors.length, 3);
  assert.equal(region.behaviors.filter(entry => entry.flags?.regionwright?.studioActivity?.id === "pressure-plate-alarm").length, 2);
  const second = await publishPressurePlateActivity(blueprint, options);
  assert.equal(second.replaced, 2);
  assert.equal(region.behaviors.length, 3);
  const removed = await clearPressurePlateActivity(blueprint, options);
  assert.equal(removed.removed, 2);
  assert.equal(region.behaviors.length, 1);
  assert.equal(region.behaviors[0].id, "other");
});

test("Pressure Plate Alarm requires a selected Region, active Scene, GM, and enabled Region writes", async () => {
  const { blueprint, region, sceneUuid } = fixture();
  const options = { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid: uuid => uuid === region.uuid ? region : null };
  await assert.rejects(() => publishPressurePlateActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishPressurePlateActivity(blueprint, { ...options, writesEnabled: false }), /Region writes are disabled/);
  await assert.rejects(() => publishPressurePlateActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  delete blueprint.nodes.find(node => node.id === "plate").config.targetUuid;
  await assert.rejects(() => publishPressurePlateActivity(blueprint, options), /Choose a Region/);
});
