import assert from "node:assert/strict";
import test from "node:test";
import { STUDIO_DRAFT_SETTING } from "../modules/regionwright/scripts/constants.js";
import { createStudioDraftStore, normalizeStudioDraft } from "../modules/regionwright/scripts/studio-storage.js";
import { createStarterScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

test("Studio draft storage round-trips a blueprint through a module-owned setting", async () => {
  let value = "";
  const settings = { get: () => value, set: async (_moduleId, key, next) => { assert.equal(key, STUDIO_DRAFT_SETTING); value = next; } };
  const store = createStudioDraftStore({ settings, isGM: true });
  const saved = await store.save(createStarterScenarioBlueprint());
  const loaded = await store.load();
  assert.equal(loaded.id, saved.id);
  assert.equal(loaded.nodes.length, 3);
  await store.clear();
  assert.equal(await store.load(), null);
});

test("Studio draft storage refuses player writes and ignores corrupt drafts", async () => {
  const settings = { get: () => "not-json", set: async () => {} };
  const store = createStudioDraftStore({ settings, isGM: false });
  assert.equal(await store.load(), null);
  await assert.rejects(() => store.save(createStarterScenarioBlueprint()), /Only a GM/);
  assert.equal(normalizeStudioDraft({ moduleId: "wrong", schemaVersion: "1.0" }), null);
});
