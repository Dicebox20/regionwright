import assert from "node:assert/strict";
import test from "node:test";
import { buildStoryBeatActivityPlans, clearStoryBeatActivity, publishStoryBeatActivity } from "../modules/regionwright/scripts/studio-story-beat.js";
import { createStoryBeatScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) { return { ...structuredClone(source), id, toObject() { return structuredClone({ ...this, toObject: undefined }); } }; }

function fixture() {
  const sceneUuid = "Scene.demo";
  const region = {
    id: "beat-region", uuid: `${sceneUuid}.Region.beat-region`, name: "Arrival", documentName: "Region", parent: { uuid: sceneUuid }, behaviors: [],
    async createEmbeddedDocuments(type, sources) { assert.equal(type, "RegionBehavior"); const created = sources.map((source, index) => behavior(source, `beat-${this.behaviors.length + index}`)); this.behaviors.push(...created); return created; },
    async deleteEmbeddedDocuments(type, ids) { assert.equal(type, "RegionBehavior"); this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id)); return ids; }
  };
  const blueprint = structuredClone(createStoryBeatScenarioBlueprint({ sceneUuid, sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "beat-region").config.targetUuid = region.uuid;
  return { blueprint, region, sceneUuid, options: { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid: uuid => uuid === region.uuid ? region : null } };
}

test("Story Beat compiles into a native message and pause", () => {
  const { blueprint } = fixture();
  const plans = buildStoryBeatActivityPlans(blueprint);
  assert.equal(plans.message.behavior.key, "scrolling-text");
  assert.equal(plans.message.behavior.parameters.text, "Something changes.");
  assert.equal(plans.pause.behavior.key, "pause");
});

test("Story Beat publishes, replaces, and removes only its tagged behaviors", async () => {
  const { blueprint, region, options } = fixture();
  region.behaviors.push(behavior({ flags: { regionwright: { studioActivity: { id: "other" } } } }, "other"));
  const first = await publishStoryBeatActivity(blueprint, options);
  assert.equal(first.created.length, 2);
  const second = await publishStoryBeatActivity(blueprint, options);
  assert.equal(second.replaced, 2);
  assert.equal(region.behaviors.length, 3);
  const removed = await clearStoryBeatActivity(blueprint, options);
  assert.equal(removed.removed, 2);
  assert.equal(region.behaviors.length, 1);
});

test("Story Beat requires a GM, active Scene, writes, area, and message", async () => {
  const { blueprint, options } = fixture();
  await assert.rejects(() => publishStoryBeatActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishStoryBeatActivity(blueprint, { ...options, writesEnabled: false }), /writes are disabled/);
  await assert.rejects(() => publishStoryBeatActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  delete blueprint.nodes.find(node => node.id === "beat-region").config.targetUuid;
  await assert.rejects(() => publishStoryBeatActivity(blueprint, options), /Choose an area/);
});
