import { loadCompiledCampaignPackage } from "./ascendancy-region-plan.mjs";

const SCHEMA_VERSION = "0.1.0";
const MUTATION = "disabled-until-exact-runtime-gate";
const ROOM_IDS = Object.freeze([
  "dbx:room:signal-frequency-chamber",
  "dbx:room:ascendancy-tram-depot",
  "dbx:room:rune-mechanism-chamber",
  "dbx:room:central-core-control-chamber",
]);
const FOUNDRY_API = Object.freeze({
  sceneCreate: "Scene.create",
  sceneRead: "fromUuid | game.scenes.get",
  wallCreate: 'scene.createEmbeddedDocuments("Wall", ...)',
  regionCreate: 'scene.createEmbeddedDocuments("Region", ...)',
  sceneReread: "fromUuid | game.scenes.get",
  wallReread: "scene.walls",
  regionReread: "scene.regions",
  regionDocument: "RegionDocument",
});

function clone(value) {
  return structuredClone(value);
}

function findOrThrow(list, predicate, message) {
  const result = list.find(predicate);
  if (!result) throw new Error(message);
  return result;
}

function assertFoundryApi(api) {
  if (JSON.stringify(api) !== JSON.stringify(FOUNDRY_API)) throw new Error("Ascendancy Spatial Projection Foundry API contract drifted.");
}

function createSceneProjection(packageData, room) {
  const blueprint = findOrThrow(packageData.spatialBlueprints, (candidate) => candidate.blueprintId === room.spatialBlueprintId, `Missing Spatial Blueprint ${room.spatialBlueprintId}.`);
  const regionPlan = findOrThrow(packageData.regionPlans, (candidate) => candidate.roomId === room.roomId, `Missing Region plan ${room.roomId}.`);
  const asset = findOrThrow(packageData.assets.bound, (candidate) => candidate.assetId === room.assetId && candidate.roomId === room.roomId, `Missing bound renderer asset for ${room.roomId}.`);
  if (blueprint.bounds.width !== 1536 || blueprint.bounds.height !== 1024 || regionPlan.canvas.width !== 1536 || regionPlan.canvas.height !== 1024) throw new Error(`Scene dimensions drifted for ${room.roomId}.`);
  if (room.geometryOwner !== "spatial-blueprint" || room.renderer !== "scene-background" || asset.geometryOwner !== "spatial-blueprint") throw new Error(`Geometry/render authority drifted for ${room.roomId}.`);
  const doorAnchors = blueprint.anchors.filter((anchor) => anchor.kind === "door");
  const interactionAnchors = blueprint.anchors.filter((anchor) => anchor.kind === "interaction");
  if (blueprint.walls.length < 1 || doorAnchors.length < 1) throw new Error(`Spatial Blueprint perimeter or door-anchor contract is empty for ${room.roomId}.`);
  return {
    roomId: room.roomId,
    sceneId: regionPlan.sceneId,
    blueprintId: blueprint.blueprintId,
    asset: {
      assetId: asset.assetId,
      path: asset.path,
      renderer: asset.renderer,
      geometryOwner: asset.geometryOwner,
      expectedDimensions: { width: 1536, height: 1024 },
    },
    canvas: { width: blueprint.bounds.width, height: blueprint.bounds.height },
    sourceCounts: {
      walls: blueprint.walls.length,
      regions: regionPlan.regions.length,
      doorAnchors: doorAnchors.length,
      interactionAnchors: interactionAnchors.length,
    },
    wallIds: blueprint.walls.map((wall) => wall.wallId),
    regionIds: regionPlan.regions.map((region) => region.regionId),
    doorAnchors: doorAnchors.map((anchor) => ({ anchorId: anchor.anchorId, position: clone(anchor.position), clearance: anchor.clearance, nativeFieldMapping: "pending-exact-target-runtime" })),
    interactionAnchors: interactionAnchors.map((anchor) => ({ anchorId: anchor.anchorId, position: clone(anchor.position), clearance: anchor.clearance, nativeFieldMapping: "pending-exact-target-runtime" })),
    projectionSteps: [
      { order: 1, kind: "scene", api: FOUNDRY_API.sceneCreate, sourceCount: 1, source: "campaign.rooms + package-bound renderer asset" },
      { order: 2, kind: "walls", api: FOUNDRY_API.wallCreate, sourceCount: blueprint.walls.length, source: "spatialBlueprints[*].walls" },
      { order: 3, kind: "regions", api: FOUNDRY_API.regionCreate, sourceCount: regionPlan.regions.length, source: "regionPlans[*].regions" },
    ],
    reread: {
      scene: FOUNDRY_API.sceneReread,
      walls: FOUNDRY_API.wallReread,
      regions: FOUNDRY_API.regionReread,
      authoritative: true,
      expectedWallCount: blueprint.walls.length,
      expectedRegionCount: regionPlan.regions.length,
    },
    foundryApi: clone(FOUNDRY_API),
    geometrySource: "helper Spatial Blueprint and orthogonal Region plan",
    noPixelInference: true,
    noRawPayloads: true,
    mutation: MUTATION,
  };
}

function assertPackageContract(packageData) {
  if (packageData.mutation !== MUTATION) throw new Error("Ascendancy campaign package is not mutation-gated.");
  if (!Array.isArray(packageData.spatialBlueprints) || packageData.spatialBlueprints.length !== 4) throw new Error("Compiled campaign package is missing the four Spatial Blueprints.");
  if (!Array.isArray(packageData.regionPlans) || packageData.regionPlans.length !== 4) throw new Error("Compiled campaign package is missing the four Region plans.");
  if (!Array.isArray(packageData.assets?.bound) || packageData.assets.bound.length !== 4 || packageData.assets.unbound.length !== 0) throw new Error("Compiled campaign package renderer asset binding drifted.");
}

export function createAscendancySpatialProjectionPlan({ campaignPackage = loadCompiledCampaignPackage() } = {}) {
  assertPackageContract(campaignPackage);
  const rooms = ROOM_IDS.map((roomId) => findOrThrow(campaignPackage.campaign.rooms, (room) => room.roomId === roomId, `Campaign fixture is missing ${roomId}.`));
  const scenes = rooms.map((room) => createSceneProjection(campaignPackage, room));
  const tramProjection = campaignPackage.tramSceneProjection;
  if (tramProjection.canvas.width !== 1536 || tramProjection.canvas.height !== 1024 || tramProjection.logicalBoard.origin.x !== 420 || tramProjection.logicalBoard.origin.y !== 210 || tramProjection.logicalBoard.cellWidth !== 110 || tramProjection.logicalBoard.cellHeight !== 95 || tramProjection.logicalBoard.rows !== 6 || tramProjection.logicalBoard.columns !== 6 || tramProjection.anchors.length !== 36) throw new Error("Tram logical-board projection drifted.");
  if (tramProjection.rendererRequirements.projection !== "orthographic-top-down" || tramProjection.rendererRequirements.noPerspective !== true || tramProjection.rendererRequirements.visibleWalls !== true || tramProjection.rendererRequirements.visibleDoors !== true || tramProjection.rendererRequirements.trackLayout.kind !== "enclosed-six-by-six-orthogonal-routing-yard") throw new Error("Tram renderer requirements drifted.");
  assertFoundryApi(FOUNDRY_API);
  return validateAscendancySpatialProjectionPlan({
    schemaVersion: SCHEMA_VERSION,
    operation: "ascendancy.spatial-projection.preview",
    packageId: campaignPackage.packageId,
    scenes,
    tramProjection: {
      canvas: clone(tramProjection.canvas),
      logicalBoard: clone(tramProjection.logicalBoard),
      rendererRequirements: clone(tramProjection.rendererRequirements),
      anchorIds: tramProjection.anchors.map((anchor) => anchor.anchorId),
      regionIds: tramProjection.anchors.map((anchor) => anchor.regionId),
      exitRegionId: tramProjection.exitRegionId,
      tileOwner: tramProjection.tileOwner,
    },
    foundryApi: clone(FOUNDRY_API),
    nativeFieldMapping: {
      status: "blocked-pending-exact-target-runtime",
      scene: "Scene.create field mapping requires target runtime observation.",
      walls: "Spatial Blueprint wall centerlines require target native Wall field observation.",
      doors: "Spatial Blueprint door anchors require target native door/anchor field observation.",
      regions: "Region plan rectangles require target RegionDocument.shapes field observation.",
      authoritativeReread: "Required through fromUuid/game.scenes.get, scene.walls, and scene.regions.",
    },
    noPixelInference: true,
    noRawPayloads: true,
    mutation: MUTATION,
    blockers: [
      "Foundry target reconciliation is blocked: the local Data path contains only the-ballad-of-chauser-bill at Foundry 14.365 / dnd5e 5.3.3; dbx-test-world on Foundry 14.367 and modules/dicebox-campaign-helper are absent. Regionwright 0.1.4 is present, but no write may target the Ballad world without user-selected target track.",
      "Native Scene, Wall door/anchor, and RegionDocument field mappings plus authoritative reread remain unexercised at the target runtime.",
    ],
  }, { campaignPackage });
}

function canonicalSceneProjections(campaignPackage) {
  const rooms = ROOM_IDS.map((roomId) => findOrThrow(campaignPackage.campaign.rooms, (room) => room.roomId === roomId, `Campaign fixture is missing ${roomId}.`));
  return rooms.map((room) => createSceneProjection(campaignPackage, room));
}

export function validateAscendancySpatialProjectionPlan(input, { campaignPackage = loadCompiledCampaignPackage() } = {}) {
  const plan = clone(input);
  assertPackageContract(campaignPackage);
  if (plan.schemaVersion !== SCHEMA_VERSION || plan.operation !== "ascendancy.spatial-projection.preview" || plan.mutation !== MUTATION) throw new Error("Ascendancy Spatial Projection schema or mutation gate is invalid.");
  if (plan.noPixelInference !== true || plan.noRawPayloads !== true) throw new Error("Ascendancy Spatial Projection must reject pixel-derived geometry and raw Foundry payloads.");
  assertFoundryApi(plan.foundryApi);
  const expectedScenes = canonicalSceneProjections(campaignPackage);
  if (JSON.stringify(plan.scenes) !== JSON.stringify(expectedScenes)) throw new Error("Ascendancy Spatial Projection Scene/wall/Region intents drifted from the helper package.");
  if (plan.scenes.length !== 4 || JSON.stringify(plan.scenes.map((scene) => scene.roomId)) !== JSON.stringify(ROOM_IDS)) throw new Error("Ascendancy Spatial Projection room order drifted.");
  if (plan.scenes.some((scene) => scene.projectionSteps.length !== 3 || scene.projectionSteps[0].api !== FOUNDRY_API.sceneCreate || scene.projectionSteps[1].api !== FOUNDRY_API.wallCreate || scene.projectionSteps[2].api !== FOUNDRY_API.regionCreate || scene.reread.authoritative !== true)) throw new Error("Ascendancy Spatial Projection Foundry operation order or reread contract drifted.");
  const tram = findOrThrow(plan.scenes, (scene) => scene.roomId === "dbx:room:ascendancy-tram-depot", "Tram projection is missing.");
  const canonicalTram = expectedScenes.find((scene) => scene.roomId === "dbx:room:ascendancy-tram-depot");
  if (JSON.stringify(tram.sourceCounts) !== JSON.stringify(canonicalTram.sourceCounts)) throw new Error("Tram Spatial Blueprint source counts drifted from the helper package.");
  if (plan.tramProjection.canvas.width !== 1536 || plan.tramProjection.canvas.height !== 1024 || plan.tramProjection.logicalBoard.origin.x !== 420 || plan.tramProjection.logicalBoard.origin.y !== 210 || plan.tramProjection.logicalBoard.cellWidth !== 110 || plan.tramProjection.logicalBoard.cellHeight !== 95 || plan.tramProjection.logicalBoard.rows !== 6 || plan.tramProjection.logicalBoard.columns !== 6 || plan.tramProjection.anchorIds.length !== 36) throw new Error("Tram projection contract drifted.");
  if (plan.tramProjection.rendererRequirements.projection !== "orthographic-top-down" || plan.tramProjection.rendererRequirements.noPerspective !== true || plan.tramProjection.rendererRequirements.visibleWalls !== true || plan.tramProjection.rendererRequirements.visibleDoors !== true || plan.tramProjection.rendererRequirements.trackLayout.kind !== "enclosed-six-by-six-orthogonal-routing-yard") throw new Error("Tram renderer requirements drifted.");
  return Object.freeze(plan);
}

export function createAscendancySpatialProjectionReceipt(plan = createAscendancySpatialProjectionPlan()) {
  const validated = validateAscendancySpatialProjectionPlan(plan);
  const tram = validated.scenes.find((scene) => scene.roomId === "dbx:room:ascendancy-tram-depot");
  return {
    schemaVersion: SCHEMA_VERSION,
    operation: validated.operation,
    status: "reviewable",
    evidenceClass: "deterministic",
    readyClaim: false,
    noWrite: true,
    packageId: validated.packageId,
    sceneCount: validated.scenes.length,
    wallCreateCount: validated.scenes.reduce((total, scene) => total + scene.sourceCounts.walls, 0),
    regionCreateCount: validated.scenes.reduce((total, scene) => total + scene.sourceCounts.regions, 0),
    doorAnchorCount: validated.scenes.reduce((total, scene) => total + scene.sourceCounts.doorAnchors, 0),
    tramBoardAnchorCount: validated.tramProjection.anchorIds.length,
    tramStationAnchorCount: tram.sourceCounts.interactionAnchors - validated.tramProjection.anchorIds.length,
    assetPaths: validated.scenes.map((scene) => scene.asset.path),
    rendererRequirements: validated.tramProjection.rendererRequirements,
    foundryApi: validated.foundryApi,
    nativeFieldMapping: validated.nativeFieldMapping,
    noPixelInference: validated.noPixelInference,
    noRawPayloads: validated.noRawPayloads,
    blockerCount: validated.blockers.length,
    blockers: validated.blockers,
    mutation: MUTATION,
  };
}
