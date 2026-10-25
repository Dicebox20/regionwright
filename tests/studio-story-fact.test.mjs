import assert from "node:assert/strict";
import test from "node:test";
import { buildStoryFactActivityPlans, clearStoryFactActivity, handleStoryFact, publishStoryFactActivity } from "../modules/regionwright/scripts/studio-story-fact.js";
import { createStoryFactScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) { return { ...structuredClone(source), id, toObject() { return structuredClone({ ...this, toObject: undefined }); } }; }
function fixture() {
  const sceneUuid = "Scene.demo";
  const region = {
    id: "fact-area", uuid: `${sceneUuid}.Region.fact-area`, name: "Orb Pedestal", documentName: "Region", parent: { uuid: sceneUuid }, behaviors: [], flags: {},
    getFlag(moduleId, key) { return this.flags?.[moduleId]?.[key] ?? null; },
    async update(data) { for (const [path, value] of Object.entries(data)) { const [, moduleId, key] = path.split("."); this.flags[moduleId] ??= {}; this.flags[moduleId][key] = value; } return this; },
    async createEmbeddedDocuments(type, sources) { assert.equal(type, "RegionBehavior"); const created = sources.map((source, index) => behavior(source, `fact-${this.behaviors.length + index}`)); this.behaviors.push(...created); return created; },
    async deleteEmbeddedDocuments(type, ids) { assert.equal(type, "RegionBehavior"); this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id)); return ids; }
  };
  const blueprint = structuredClone(createStoryFactScenarioBlueprint({ sceneUuid, sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "fact-region").config.targetUuid = region.uuid;
  Object.assign(blueprint.nodes.find(node => node.id === "set-fact").config, { factId: "fact.west-orb-placed", label: "West Orb Placed" });
  const facts = {};
  const store = { load: () => ({ facts }), set: async input => { facts[input.id] = { ...input }; return facts[input.id]; } };
  return { blueprint, region, sceneUuid, facts, store, options: { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid: uuid => uuid === region.uuid ? region : null, store } };
}

test("Story Fact publishes a fixed GM script and native message", () => {
  const { blueprint } = fixture();
  const plans = buildStoryFactActivityPlans(blueprint);
  assert.match(plans.setFact.system.source, /handleStoryFact/);
  assert.equal(plans.narration.behavior.key, "scrolling-text");
  assert.equal(plans.fact.label, "West Orb Placed");
});

test("Story Fact publishes, sets progress through the GM, and removes only owned behaviors", async () => {
  const { blueprint, region, sceneUuid, facts, store, options } = fixture();
  const published = await publishStoryFactActivity(blueprint, options);
  assert.equal(published.created.length, 2);
  assert.equal(facts["fact.west-orb-placed"].value, false);
  const savedGame = globalThis.game;
  globalThis.game = { user: { isGM: true } };
  try {
    const set = await handleStoryFact(region, { name: "tokenEnter" }, { store });
    assert.equal(set.status, "set");
    assert.equal(facts["fact.west-orb-placed"].value, true);
    assert.equal((await handleStoryFact(region, { name: "tokenEnter" }, { store })).status, "already-set");
  } finally { globalThis.game = savedGame; }
  const removed = await clearStoryFactActivity(blueprint, options);
  assert.equal(removed.removed, 2);
  assert.equal(region.behaviors.length, 0);
});

test("Story Fact routes a player trigger to the active GM without writing locally", async () => {
  const { region, store } = fixture();
  const savedGame = globalThis.game;
  const emitted = [];
  globalThis.game = { user: { id: "player", isGM: false }, users: { activeGM: { id: "gm", isGM: true } }, socket: { emit: (channel, payload) => emitted.push({ channel, payload }) } };
  try {
    const result = await handleStoryFact(region, { name: "tokenEnter" }, { store });
    assert.equal(result.status, "requested");
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].payload.action, "story-fact");
    assert.equal(emitted[0].payload.regionUuid, region.uuid);
  } finally { globalThis.game = savedGame; }
});

test("Story Fact requires a name, selected area, active Scene, and GM", async () => {
  const { blueprint, options } = fixture();
  await assert.rejects(() => publishStoryFactActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishStoryFactActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  blueprint.nodes.find(node => node.id === "set-fact").config.label = "";
  await assert.rejects(() => publishStoryFactActivity(blueprint, options), /story fact needs a name/i);
});
