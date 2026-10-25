import assert from "node:assert/strict";
import test from "node:test";
import {
  STUDIO_SCHEMA_VERSION,
  createSceneMomentScenarioBlueprint,
  createSecretRevealScenarioBlueprint,
  createRoomTransformationScenarioBlueprint,
  createScenarioBlueprint,
  createPortalScenarioBlueprint,
  createHubUnlockScenarioBlueprint,
  createKeyGateScenarioBlueprint,
  createStoryFactScenarioBlueprint,
  createStoryBeatScenarioBlueprint,
  createStarterScenarioBlueprint,
  createStudioService,
  serializeScenarioBlueprint,
  validateScenarioBlueprint
} from "../modules/regionwright/scripts/studio.js";

test("Studio starter blueprint is a complete Pressure Plate Alarm", () => {
  const blueprint = createStarterScenarioBlueprint();
  assert.equal(blueprint.schemaVersion, STUDIO_SCHEMA_VERSION);
  assert.equal(blueprint.edition, "free");
  assert.equal(blueprint.name, "Pressure Plate Alarm");
  assert.equal(blueprint.nodes.length, 3);
  assert.equal(blueprint.edges.length, 2);
  assert.equal(blueprint.scenes[0].uuid, "Scene.demo");
});

test("Studio Scene Moment uses an area, hidden-creature targets, and narration", () => {
  const blueprint = createSceneMomentScenarioBlueprint();
  assert.equal(blueprint.id, "scene-moment");
  assert.equal(blueprint.edition, "free");
  assert.equal(blueprint.nodes.find(node => node.id === "reveal").type, "revealHiddenTokens");
  assert.equal(blueprint.nodes.length, 3);
});

test("Studio Secret Reveal is a named, usable hidden-creature template", () => {
  const blueprint = createSecretRevealScenarioBlueprint();
  assert.equal(blueprint.id, "scene-moment");
  assert.equal(blueprint.name, "Reveal a Secret");
  assert.equal(blueprint.metadata.template, "secret-reveal");
  assert.equal(blueprint.nodes.find(node => node.id === "narration").config.text, "A secret is revealed.");
});

test("Studio Room Transformation reuses the bounded hidden-feature reveal template", () => {
  const blueprint = createRoomTransformationScenarioBlueprint();
  assert.equal(blueprint.id, "scene-moment");
  assert.equal(blueprint.name, "Room Transformation");
  assert.equal(blueprint.metadata.template, "room-transformation");
});

test("Studio Story Beat is a Studio-owned, portable visual sequence", () => {
  const blueprint = createStoryBeatScenarioBlueprint();
  assert.equal(blueprint.id, "story-beat");
  assert.equal(blueprint.edition, "premium");
  assert.deepEqual(blueprint.nodes.map(node => node.id), ["beat-region", "beat-message", "beat-pause"]);
  assert.equal(blueprint.metadata.template, "story-beat");
});

test("Studio Scene Portal starts with a visual entrance and awaits a destination Scene", () => {
  const blueprint = createPortalScenarioBlueprint();
  assert.equal(blueprint.id, "scene-portal");
  assert.equal(blueprint.edition, "premium");
  assert.equal(blueprint.nodes.find(node => node.id === "portal-entry").config.targetType, "region");
  assert.equal(blueprint.nodes.find(node => node.id === "portal-arrival").config.targetSceneUuid, null);
});

test("Studio Story Fact has a named progress step instead of a variable", () => {
  const blueprint = createStoryFactScenarioBlueprint();
  assert.equal(blueprint.id, "story-fact");
  assert.equal(blueprint.nodes.find(node => node.id === "set-fact").type, "setStoryFact");
});

test("Studio Hub Unlock uses fact cards and a Door target", () => {
  const blueprint = createHubUnlockScenarioBlueprint();
  assert.equal(blueprint.id, "hub-unlock");
  assert.equal(blueprint.nodes.find(node => node.id === "hub-facts").type, "allStoryFacts");
  assert.equal(blueprint.nodes.find(node => node.id === "hub-door").config.targetType, "door");
});

test("Studio Symbolic Key Gate is a one-key Door template", () => {
  const blueprint = createKeyGateScenarioBlueprint();
  assert.equal(blueprint.id, "hub-unlock");
  assert.equal(blueprint.name, "Symbolic Key Gate");
  assert.equal(blueprint.metadata.template, "key-gate");
});

test("Studio blueprints reject dangling graph links and duplicate node ids", () => {
  const base = { id: "sample", name: "Sample", nodes: [{ id: "start", kind: "trigger" }, { id: "finish", kind: "action" }] };
  assert.throws(() => createScenarioBlueprint({ ...base, edges: [{ from: "start", to: "missing" }] }), /missing node/i);
  assert.throws(() => createScenarioBlueprint({ ...base, nodes: [...base.nodes, { id: "start", kind: "action" }] }), /duplicated/i);
});

test("included Studio activity enforces its small limit while Studio can validate larger graphs", () => {
  const nodes = Array.from({ length: 5 }, (_, index) => ({ id: `node-${index}`, kind: index === 0 ? "trigger" : "action" }));
  assert.throws(() => createScenarioBlueprint({ id: "large", name: "Large", nodes }), /at most 4/i);
  const service = createStudioService();
  service.register({ id: "premium-test", title: "Premium Test", edition: "premium" });
  const blueprint = service.create({ id: "large", name: "Large", nodes, edition: "premium" });
  assert.equal(blueprint.nodes.length, 5);
  assert.equal(service.capabilities().visualGraph, true);
});

test("Studio blueprints serialize as portable JSON and remain immutable", () => {
  const blueprint = createStarterScenarioBlueprint();
  const serialized = serializeScenarioBlueprint(blueprint);
  assert.match(serialized, /pressure-plate-alarm/);
  assert.equal(Object.isFrozen(blueprint), true);
  assert.throws(() => validateScenarioBlueprint({ ...blueprint, moduleId: "other-module" }), /different module/i);
});
