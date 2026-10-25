import assert from "node:assert/strict";
import test from "node:test";
import { diagnoseStudioBlueprint } from "../modules/regionwright/scripts/studio-diagnostics.js";
import { createHubUnlockScenarioBlueprint, createPortalScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

test("Studio diagnostics identify missing targets and incomplete objectives without writing", () => {
  const blueprint = structuredClone(createHubUnlockScenarioBlueprint({ sceneUuid: "Scene.demo", sceneName: "Demo" }));
  blueprint.nodes.find(node => node.id === "hub-region").config.targetUuid = "Scene.demo.Region.missing";
  blueprint.nodes.find(node => node.id === "hub-facts").config.factIds = ["fact.west-orb"];
  blueprint.nodes.find(node => node.id === "hub-door").config.targetUuid = "Scene.demo.Wall.missing";
  const result = diagnoseStudioBlueprint(blueprint, { facts: { "fact.west-orb": { label: "West Orb", value: false } }, resolveUuid: () => null });
  assert.equal(result.status, "blocked");
  assert.match(result.errors.map(item => item.message).join(" "), /target that still exists/i);
  assert.match(result.warnings.map(item => item.message).join(" "), /not complete/i);
});

test("Studio diagnostics flag same-Scene portals and return Scene-switch guidance", () => {
  const blueprint = structuredClone(createPortalScenarioBlueprint({ sceneUuid: "Scene.source", sceneName: "Source" }));
  blueprint.scenes.push({ uuid: "Scene.destination", name: "Destination" });
  const arrival = blueprint.nodes.find(node => node.id === "portal-arrival");
  arrival.sceneUuid = "Scene.destination";
  arrival.config.targetSceneUuid = "Scene.source";
  const result = diagnoseStudioBlueprint(blueprint, { activeSceneUuid: "Scene.destination" });
  assert.equal(result.errors.some(item => /different arrival Scene/i.test(item.message)), true);
  assert.equal(result.warnings.some(item => /portal entrance Scene/i.test(item.message)), true);
});

test("Studio diagnostics block an invalid blueprint instead of reporting it as publishable", () => {
  const result = diagnoseStudioBlueprint({ id: "not-a-blueprint" });
  assert.equal(result.status, "blocked");
  assert.equal(result.errors.length, 1);
  assert.equal(result.items[0], result.errors[0]);
});
