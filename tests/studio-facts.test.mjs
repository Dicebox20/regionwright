import assert from "node:assert/strict";
import test from "node:test";
import { createStoryFactStore, normalizeStoryFacts, storyFactId } from "../modules/regionwright/scripts/studio-facts.js";

test("story facts use stable human-label-derived ids and discard malformed state", () => {
  assert.equal(storyFactId("West Orb Placed!"), "fact.west-orb-placed");
  assert.throws(() => storyFactId("---"), /short name/);
  const state = normalizeStoryFacts({ facts: { good: { id: "fact.west-orb", label: "West Orb", value: true }, bad: { id: "no", label: "Broken" } } });
  assert.deepEqual(Object.keys(state.facts), ["fact.west-orb"]);
  assert.equal(state.facts["fact.west-orb"].value, true);
});

test("story fact store is GM-only, persistent, sortable, and resettable", async () => {
  let value = "";
  let now = 100;
  const settings = { get: () => value, set: async (_moduleId, _key, next) => { value = next; } };
  const store = createStoryFactStore({ settings, isGM: true, now: () => now++ });
  const west = await store.set({ label: "West Orb Placed", value: true });
  const east = await store.set({ label: "East Orb Placed", value: true });
  assert.equal(store.isTrue(west.id), true);
  assert.deepEqual(store.list().map(fact => fact.label), ["East Orb Placed", "West Orb Placed"]);
  await store.reset(west.id);
  assert.equal(store.isTrue(west.id), false);
  assert.equal(store.isTrue(east.id), true);
  await store.reset();
  assert.equal(store.isTrue(east.id), false);
  assert.match(value, /fact\.east-orb-placed/);
});

test("story fact store refuses player writes", async () => {
  const store = createStoryFactStore({ settings: { get: () => "", set: async () => {} }, isGM: false });
  await assert.rejects(() => store.set({ label: "Glass Eye Found", value: true }), /Only a GM/);
  await assert.rejects(() => store.reset(), /Only a GM/);
});
