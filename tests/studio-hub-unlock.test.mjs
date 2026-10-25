import assert from "node:assert/strict";
import test from "node:test";
import { buildHubUnlockActivityPlans, clearHubUnlockActivity, handleHubUnlock, publishHubUnlockActivity } from "../modules/regionwright/scripts/studio-hub-unlock.js";
import { createHubUnlockScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

function behavior(source, id) { return { ...structuredClone(source), id, toObject() { return structuredClone({ ...this, toObject: undefined }); } }; }
function setPath(target, path, value) { const parts = path.split("."); let cursor = target; for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {}; cursor[parts.at(-1)] = value; }

function fixture() {
  const sceneUuid = "Scene.demo";
  const region = {
    id: "hub", uuid: `${sceneUuid}.Region.hub`, name: "Final Pedestal", documentName: "Region", parent: { uuid: sceneUuid }, behaviors: [], flags: {},
    getFlag(moduleId, key) { return this.flags?.[moduleId]?.[key] ?? null; },
    async update(data) { for (const [path, value] of Object.entries(data)) setPath(this, path, value); return this; },
    async createEmbeddedDocuments(type, sources) { assert.equal(type, "RegionBehavior"); const created = sources.map((source, index) => behavior(source, `hub-${this.behaviors.length + index}`)); this.behaviors.push(...created); return created; },
    async deleteEmbeddedDocuments(type, ids) { assert.equal(type, "RegionBehavior"); this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id)); return ids; }
  };
  const door = { id: "door", uuid: `${sceneUuid}.Wall.door`, name: "Final Door", documentName: "Wall", parent: { uuid: sceneUuid }, door: 1, ds: 2, async update(data) { Object.assign(this, data); return this; } };
  const blueprint = structuredClone(createHubUnlockScenarioBlueprint({ sceneUuid, sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "hub-region").config.targetUuid = region.uuid;
  blueprint.nodes.find(node => node.id === "hub-facts").config.factIds = ["fact.west-orb", "fact.east-orb"];
  blueprint.nodes.find(node => node.id === "hub-door").config.targetUuid = door.uuid;
  const facts = { "fact.west-orb": { id: "fact.west-orb", label: "West Orb", value: false }, "fact.east-orb": { id: "fact.east-orb", label: "East Orb", value: true } };
  const store = { load: () => ({ facts }) };
  const resolveUuid = uuid => ({ [region.uuid]: region, [door.uuid]: door })[uuid] ?? null;
  return { blueprint, region, door, facts, store, sceneUuid, resolveUuid, options: { currentUser: { isGM: true }, writesEnabled: true, activeSceneUuid: sceneUuid, resolveUuid, store } };
}

test("Hub Unlock builds a bounded GM script and native message", () => {
  const { blueprint } = fixture();
  const plans = buildHubUnlockActivityPlans(blueprint);
  assert.match(plans.unlock.system.source, /handleHubUnlock/);
  assert.deepEqual(plans.factIds, ["fact.west-orb", "fact.east-orb"]);
  assert.equal(plans.narration.behavior.key, "scrolling-text");
});

test("Hub Unlock waits for all facts, unlocks through the GM, and resets its Door", async () => {
  const { blueprint, region, door, facts, store, resolveUuid, options } = fixture();
  const published = await publishHubUnlockActivity(blueprint, options);
  assert.equal(published.created.length, 2);
  const savedGame = globalThis.game;
  const savedConst = globalThis.CONST;
  globalThis.game = { user: { isGM: true } };
  globalThis.CONST = { WALL_DOOR_STATES: { CLOSED: 1 } };
  try {
    const waiting = await handleHubUnlock(region, { name: "tokenEnter" }, { store, resolveUuid, closedState: 1 });
    assert.deepEqual(waiting, { status: "waiting", missing: ["fact.west-orb"] });
    assert.equal(door.ds, 2);
    facts["fact.west-orb"].value = true;
    const unlocked = await handleHubUnlock(region, { name: "tokenEnter" }, { store, resolveUuid, closedState: 1 });
    assert.equal(unlocked.status, "unlocked");
    assert.equal(door.ds, 1);
    assert.equal((await handleHubUnlock(region, { name: "tokenEnter" }, { store, resolveUuid, closedState: 1 })).status, "already-unlocked");
    const cleared = await clearHubUnlockActivity(blueprint, options);
    assert.equal(cleared.removed, 2);
    assert.equal(door.ds, 2);
  } finally { globalThis.game = savedGame; globalThis.CONST = savedConst; }
});

test("Hub Unlock routes a player trigger to the active GM without a local Door update", async () => {
  const { region, door, store, resolveUuid } = fixture();
  const savedGame = globalThis.game;
  const emitted = [];
  globalThis.game = { user: { id: "player", isGM: false }, users: { activeGM: { id: "gm", isGM: true } }, socket: { emit: (channel, payload) => emitted.push({ channel, payload }) } };
  try {
    const result = await handleHubUnlock(region, { name: "tokenEnter" }, { store, resolveUuid, closedState: 1 });
    assert.equal(result.status, "requested");
    assert.equal(door.ds, 2);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].payload.action, "hub-unlock");
    assert.equal(emitted[0].payload.regionUuid, region.uuid);
  } finally { globalThis.game = savedGame; }
});

test("Hub Unlock requires a GM, selected facts, a Door, and its active Scene", async () => {
  const { blueprint, options } = fixture();
  await assert.rejects(() => publishHubUnlockActivity(blueprint, { ...options, currentUser: { isGM: false } }), /Only a GM/);
  await assert.rejects(() => publishHubUnlockActivity(blueprint, { ...options, activeSceneUuid: "Scene.other" }), /Switch to/);
  blueprint.nodes.find(node => node.id === "hub-facts").config.factIds = [];
  await assert.rejects(() => publishHubUnlockActivity(blueprint, options), /at least one objective/);
});
