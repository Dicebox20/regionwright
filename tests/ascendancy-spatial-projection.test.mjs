import assert from "node:assert/strict";
import test from "node:test";
import { createAscendancySpatialProjectionPlan, createAscendancySpatialProjectionReceipt, validateAscendancySpatialProjectionPlan } from "../scripts/ascendancy-spatial-projection.mjs";

const plan = createAscendancySpatialProjectionPlan();

test("Spatial Projection consumes the four helper blueprints and package-bound renderer paths", () => {
  assert.equal(plan.scenes.length, 4);
  assert.deepEqual(plan.scenes.map((scene) => scene.asset.path), [
    "assets/maps/ascendancy-signal-frequency-chamber-v2.png",
    "assets/maps/ascendancy-tram-depot-routing-yard-v6-neutral.png",
    "assets/maps/ascendancy-rune-mechanism-chamber-v2.png",
    "assets/maps/manual-central-core-control-chamber-v5-neutral.png",
  ]);
  assert.deepEqual(plan.scenes.map((scene) => ({ walls: scene.sourceCounts.walls, doorAnchors: scene.sourceCounts.doorAnchors })), [
    { walls: 6, doorAnchors: 2 },
    { walls: 11, doorAnchors: 3 },
    { walls: 6, doorAnchors: 2 },
    { walls: 7, doorAnchors: 3 },
  ]);
});

test("Spatial Projection preserves native API order, orthogonal tram requirements, and authoritative reread", () => {
  assert.deepEqual(plan.foundryApi, {
    sceneCreate: "Scene.create",
    sceneRead: "fromUuid | game.scenes.get",
    wallCreate: 'scene.createEmbeddedDocuments("Wall", ...)',
    regionCreate: 'scene.createEmbeddedDocuments("Region", ...)',
    sceneReread: "fromUuid | game.scenes.get",
    wallReread: "scene.walls",
    regionReread: "scene.regions",
    regionDocument: "RegionDocument",
  });
  assert.deepEqual(plan.scenes[0].projectionSteps.map((step) => step.kind), ["scene", "walls", "regions"]);
  assert.equal(plan.tramProjection.rendererRequirements.projection, "orthographic-top-down");
  assert.equal(plan.tramProjection.rendererRequirements.noPerspective, true);
  assert.equal(plan.tramProjection.rendererRequirements.trackLayout.kind, "enclosed-six-by-six-orthogonal-routing-yard");
  assert.equal(plan.tramProjection.logicalBoard.origin.x, 420);
  assert.equal(plan.tramProjection.logicalBoard.origin.y, 210);
  assert.equal(plan.tramProjection.anchorIds.length, 36);
  assert.ok(plan.scenes.every((scene) => scene.reread.authoritative === true));
});

test("Spatial Projection rejects blueprint, renderer, and API drift", () => {
  const movedWall = structuredClone(plan);
  movedWall.scenes[0].wallIds[0] = "dbx:wall:invented";
  assert.throws(() => validateAscendancySpatialProjectionPlan(movedWall), /intents drifted/);
  const wrongAsset = structuredClone(plan);
  wrongAsset.scenes[1].asset.path = "assets/maps/ascendancy-tram-depot-v2.png";
  assert.throws(() => validateAscendancySpatialProjectionPlan(wrongAsset), /intents drifted/);
  const wrongApi = structuredClone(plan);
  wrongApi.foundryApi.regionCreate = "scene.createEmbeddedDocuments(\"Tile\", ...)";
  assert.throws(() => validateAscendancySpatialProjectionPlan(wrongApi), /API contract drifted/);
});

test("Spatial Projection receipt is review-only and keeps native field mapping behind the runtime gate", () => {
  const receipt = createAscendancySpatialProjectionReceipt(plan);
  assert.equal(receipt.noWrite, true);
  assert.equal(receipt.readyClaim, false);
  assert.equal(receipt.sceneCount, 4);
  assert.equal(receipt.wallCreateCount, 30);
  assert.equal(receipt.regionCreateCount, 61);
  assert.equal(receipt.doorAnchorCount, 10);
  assert.equal(receipt.tramBoardAnchorCount, 36);
  assert.equal(receipt.tramStationAnchorCount, 2);
  assert.equal(receipt.noPixelInference, true);
  assert.equal(receipt.noRawPayloads, true);
  assert.equal(receipt.nativeFieldMapping.status, "blocked-pending-exact-target-runtime");
});
