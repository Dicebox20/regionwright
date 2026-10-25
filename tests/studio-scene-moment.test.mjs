import assert from "node:assert/strict";
import test from "node:test";
import { buildSceneMomentActivityPlans, clearSceneMomentActivity, publishSceneMomentActivity } from "../modules/regionwright/scripts/studio-scene-moment.js";
import { createSceneMomentScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) {
  return { ...structuredClone(source), id, toObject() { return structuredClone({ ...this, toObject: undefined }); } };
}

function fixture() {
  const sceneUuid = "Scene.demo";
  const hiddenToken = {
    id: "shadow-guard", uuid: `${sceneUuid}.Token.shadow-guard`, name: "Shadow Guard", documentName: "Token", hidden: true,
    async update(data) { if (Object.hasOwn(data, "hidden")) this.hidden = data.hidden; return this; }
  };
  const region = {
    id: "moment-area", uuid: `${sceneUuid}.Region.moment-area`, name: "Gallery Entrance", documentName: "Region", parent: { uuid: sceneUuid }, behaviors: [], flags: {},
    getFlag(moduleId, key) { return this.flags?.[moduleId]?.[key] ?? null; },
    async update(data) {
      for (const [key, value] of Object.entries(data)) {
        const parts = key.split(".");
        if (parts[0] !== "flags") continue;
        this.flags[parts[1]] ??= {};
        this.flags[parts[1]][parts[2]] = value;
      }
      return this;
    },
    async createEmbeddedDocuments(type, sources) {
      assert.equal(type, "RegionBehavior");
      const created = sources.map((source, index) => behavior(source, `created-${this.behaviors.length + index + 1}`));
      this.behaviors.push(...created);
      return created;
    },
    async deleteEmbeddedDocuments(type, ids) { assert.equal(type, "RegionBehavior"); this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id)); return ids; }
  };
  const blueprint = structuredClone(createSceneMomentScenarioBlueprint({ sceneUuid, sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "moment-region").config.targetUuid = region.uuid;
  blueprint.nodes.find(node => node.id === "reveal").config.targetUuids = [hiddenToken.uuid];
  const resolveUuid = uuid => ({ [region.uuid]: region, [hiddenToken.uuid]: hiddenToken })[uuid] ?? null;
  return { blueprint, region, hiddenToken, sceneUuid, resolveUuid };
}

test("Scene Moment builds a bounded GM script and native narration plan", () => {
  const { blueprint } = fixture();
  const plans = buildSceneMomentActivityPlans(blueprint);
  assert.equal(plans.reveal.type, "executeScript");
  assert.match(plans.reveal.system.source, /handleSceneMoment/);
  assert.equal(plans.narration.behavior.key, "scrolling-text");
});

test("Scene Moment publishes and removes only its owned behaviors and restores hidden creatures", async () => {
  const { blueprint, region, hiddenToken, sceneUuid, resolveUuid } = fixture();
  const options = { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid };
  const published = await publishSceneMomentActivity(blueprint, options);
  assert.equal(published.created.length, 2);
  assert.equal(region.behaviors.filter(entry => entry.flags?.regionwright?.studioActivity?.id === "scene-moment").length, 2);
  await hiddenToken.update({ hidden: false });
  const removed = await clearSceneMomentActivity(blueprint, options);
  assert.equal(removed.removed, 2);
  assert.equal(hiddenToken.hidden, true);
  assert.equal(region.behaviors.length, 0);
});

test("Scene Moment requires a selected area, hidden creature, GM, and active Scene", async () => {
  const { blueprint, region, hiddenToken, sceneUuid, resolveUuid } = fixture();
  const options = { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid };
  await assert.rejects(() => publishSceneMomentActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishSceneMomentActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  hiddenToken.hidden = false;
  await assert.rejects(() => publishSceneMomentActivity(blueprint, options), /must be hidden/);
  hiddenToken.hidden = true;
  blueprint.nodes.find(node => node.id === "reveal").config.targetUuids = [];
  await assert.rejects(() => publishSceneMomentActivity(blueprint, options), /hidden creature/);
  assert.equal(region.behaviors.length, 0);
});

