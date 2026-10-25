import assert from "node:assert/strict";
import test from "node:test";
import { compileScenarioBlueprint } from "../modules/regionwright/scripts/studio-compiler.js";
import { createStarterScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

const premium = { edition: "studio", maxNodes: Infinity, crossScene: true };

test("Studio compiler creates an ordered, review-only artifact", () => {
  const result = compileScenarioBlueprint(createStarterScenarioBlueprint(), {
    availableBehaviorTypes: ["displayScrollingText", "pauseGame"]
  });
  assert.equal(result.execution.status, "ready-for-approval");
  assert.equal(result.execution.writesWorld, false);
  assert.equal(result.execution.readyForReview, true);
  assert.deepEqual(result.order, ["plate", "warning", "pause"]);
  assert.deepEqual(result.operations.filter(operation => operation.kind === "native-action").map(operation => operation.behaviorKey), ["scrolling-text", "pause"]);
});

test("Studio compiler blocks unavailable native actions and cycles", () => {
  const blueprint = {
    schemaVersion: "1.0",
    moduleId: "regionwright",
    id: "broken", name: "Broken", scenes: [{ uuid: "Scene.one", name: "One" }],
    nodes: [
      { id: "start", kind: "trigger", type: "tokenEnter", sceneUuid: "Scene.one" },
      { id: "action", kind: "action", type: "teleportToken", sceneUuid: "Scene.one", config: {} }
    ],
    edges: [{ from: "start", to: "action" }, { from: "action", to: "start" }]
  };
  const result = compileScenarioBlueprint(blueprint, { capabilities: premium, availableBehaviorTypes: ["pauseGame"] });
  assert.equal(result.execution.status, "blocked");
  assert.equal(result.execution.readyForReview, false);
  assert.match(result.errors.join(" "), /cycle/i);
  assert.match(result.errors.join(" "), /teleportToken/i);
});

test("Studio compiler preserves explicit UUID references for future pickers", () => {
  const blueprint = {
    schemaVersion: "1.0", moduleId: "regionwright", id: "refs", name: "References", scenes: [{ uuid: "Scene.one", name: "One" }],
    nodes: [
      { id: "start", kind: "trigger", type: "tokenEnter", sceneUuid: "Scene.one" },
      { id: "message", kind: "action", type: "displayScrollingText", sceneUuid: "Scene.one", config: { targetUuid: "Scene.one.Region.a", targetUuids: ["Scene.one.Region.b"], text: "Hello" } }
    ],
    edges: [{ from: "start", to: "message" }]
  };
  const result = compileScenarioBlueprint(blueprint, { capabilities: premium, availableBehaviorTypes: ["displayScrollingText"] });
  assert.deepEqual(result.operations[1].references, [
    { path: "config.targetUuid", uuid: "Scene.one.Region.a" },
    { path: "config.targetUuids[0]", uuid: "Scene.one.Region.b" }
  ]);
});
