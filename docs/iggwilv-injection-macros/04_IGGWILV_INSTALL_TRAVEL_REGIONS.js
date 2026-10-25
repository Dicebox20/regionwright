/**
 * Iggwilv's Tower - install the 20 two-way scene-travel Region portals
 * Foundry Script Macro. Run as GM after 02, 03, and 05 succeed.
 *
 * Creates 20 one-square doorway thresholds and 20 2x2 arrival areas, then
 * uses Regionwright Studio's native Scene Portal publisher to attach the
 * cross-Scene Teleport Token behavior. It does not create a Floor 3 portal.
 *
 * Re-running this macro only repairs Regions/behaviors tagged iggwilvTower.
 * It never changes another module's or a user's Region.
 */

const FLAG_SCOPE = "iggwilvTower";
const TITLE_PREFIX = "Iggwilv Tower — ";
const GRID = 64;
const REQUIRED_SCENES = {
  f1: "Floor 1 Landing",
  curiosities: "Curiosities Room",
  chambers: "Private Chambers",
  library: "Private Library",
  hidden: "Hidden Library",
  study: "Private Study",
  lab: "Witch's Laboratory",
  f2: "Floor 2 Landing",
  summoning: "Summoning Chamber",
  garden: "Astral Garden",
  vault: "Arcane Vault"
};

// x/y are grid-aligned pixels. Doorway regions are 5 ft; arrivals are 10 ft.
// They were placed from the final-draft artwork, clear of blocking décor.
const routes = [
  ["T01", "f1", [256, 960], "curiosities", [1536, 640], "F1 west door → Curiosities"],
  ["T02", "curiosities", [1600, 640], "f1", [320, 960], "Curiosities east door → F1"],
  ["T03", "f1", [960, 256], "chambers", [832, 1216], "F1 north door → Private Chambers"],
  ["T04", "chambers", [832, 1216], "f1", [960, 320], "Private Chambers south door → F1"],
  ["T05", "f1", [1728, 960], "library", [128, 960], "F1 east door → Private Library"],
  ["T06", "library", [128, 960], "f1", [1664, 960], "Private Library west door → F1"],
  ["T07", "f1", [960, 1728], "lab", [896, 256], "F1 south door → Witch's Laboratory"],
  ["T08", "lab", [896, 256], "f1", [960, 1664], "Witch's Laboratory north door → F1"],
  ["T09", "library", [1088, 128], "study", [768, 1216], "Private Library north door → Private Study"],
  ["T10", "study", [768, 1216], "library", [1088, 192], "Private Study south door → Private Library"],
  ["T11", "library", [2176, 704], "hidden", [448, 576], "Revealed bookcase → Hidden Library"],
  ["T12", "hidden", [448, 576], "library", [1856, 704], "Hidden Library return bookcase → Private Library"],
  ["T13", "f1", [960, 768], "f2", [1024, 1216], "Floor 1 stair → Floor 2 stair"],
  ["T14", "f2", [1024, 1216], "f1", [960, 832], "Floor 2 stair → Floor 1 stair"],
  ["T15", "f2", [1024, 256], "vault", [832, 1216], "Floor 2 north door → Arcane Vault"],
  ["T16", "vault", [832, 1216], "f2", [1024, 320], "Arcane Vault south door → Floor 2"],
  ["T17", "f2", [320, 1536], "summoning", [1600, 320], "Floor 2 southwest arch → Summoning Chamber"],
  ["T18", "summoning", [1600, 320], "f2", [384, 1536], "Summoning Chamber return → Floor 2"],
  ["T19", "f2", [1792, 1536], "garden", [192, 384], "Floor 2 southeast arch → Astral Garden"],
  ["T20", "garden", [192, 384], "f2", [1728, 1536], "Astral Garden return arch → Floor 2"]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
const rw = game.modules.get("regionwright");
const publisher = rw?.api?.studio?.activities?.publishScenePortal;
if (!rw?.active || typeof publisher !== "function") throw new Error("Regionwright Studio's Scene Portal API is unavailable. Activate Regionwright Studio first.");
if (game.settings.get("regionwright", "enableRegionWrites") !== true) {
  throw new Error("Regionwright's 'Enable Region Writes' setting is off. Enable it, then rerun this macro. No Regions were changed.");
}

const scenes = Object.fromEntries(Object.entries(REQUIRED_SCENES).map(([key, room]) => [key, game.scenes.find(scene => scene.name === `${TITLE_PREFIX}${room}`)]));
const absent = Object.entries(scenes).filter(([, scene]) => !scene).map(([key]) => REQUIRED_SCENES[key]);
if (absent.length) throw new Error(`Missing tower Scenes: ${absent.join(", ")}. Run 01C, then 02, before installing travel.`);
const badGrid = Object.entries(scenes).filter(([, scene]) => scene.grid.size !== GRID || scene.grid.distance !== 5 || scene.grid.units !== "ft").map(([key]) => REQUIRED_SCENES[key]);
if (badGrid.length) throw new Error(`These Scenes do not have the required 64px / 5ft grid: ${badGrid.join(", ")}. No Regions were changed.`);
const bookcaseDoor = Array.from(scenes.library.walls ?? []).find(wall => wall.getFlag(FLAG_SCOPE, "key") === "hidden-library-bookcase-door");
if (!bookcaseDoor) throw new Error("The hidden-bookcase Door is missing. Run 05 before installing travel so the Hidden Library cannot be entered before its puzzle is solved.");

const fits = (scene, [x, y], width, height) => x >= 0 && y >= 0 && x + width <= scene.width && y + height <= scene.height;
const invalid = routes.flatMap(([id, sourceKey, sourceXY, destinationKey, destinationXY]) => {
  const failures = [];
  if (!fits(scenes[sourceKey], sourceXY, GRID, GRID)) failures.push(`${id} source lies outside ${REQUIRED_SCENES[sourceKey]}`);
  if (!fits(scenes[destinationKey], destinationXY, GRID * 2, GRID * 2)) failures.push(`${id} arrival lies outside ${REQUIRED_SCENES[destinationKey]}`);
  return failures;
});
if (invalid.length) throw new Error(`Coordinate preflight failed:\n${invalid.join("\n")}`);

const regionData = (name, [x, y], size, routeId, role, label) => ({
  name,
  color: role === "source" ? "#a85ad8" : "#43b7e8",
  shapes: [{ type: "rectangle", x, y, width: size, height: size, anchorX: 0, anchorY: 0, rotation: 0, hole: false }],
  elevation: { bottom: 0, top: null },
  levels: [],
  restriction: { enabled: false, type: "move", priority: 0 },
  attachment: { token: null },
  visibility: 0,
  highlightMode: "coverage",
  displayMeasurements: false,
  hidden: false,
  locked: false,
  flags: { [FLAG_SCOPE]: { version: 1, campaign: "iggwilvs-tower", routeId, role, label } }
});

async function ensureRegion(scene, routeId, role, xy, label) {
  const owned = Array.from(scene.regions ?? []).find(region => region.getFlag(FLAG_SCOPE, "routeId") === routeId && region.getFlag(FLAG_SCOPE, "role") === role);
  const name = `IGG | ${role === "source" ? routeId : `A${routeId.slice(1)}`} | ${scene.name.replace(TITLE_PREFIX, "")} | ${label}`;
  const data = regionData(name, xy, role === "source" ? GRID : GRID * 2, routeId, role, label);
  if (owned) return owned.update(data);
  const [created] = await scene.createEmbeddedDocuments("Region", [data]);
  if (!created) throw new Error(`Foundry did not create ${name}.`);
  return created;
}

const result = [];
for (const [id, sourceKey, sourceXY, destinationKey, destinationXY, label] of routes) {
  const sourceScene = scenes[sourceKey];
  const destinationScene = scenes[destinationKey];
  const source = await ensureRegion(sourceScene, id, "source", sourceXY, label);
  const arrival = await ensureRegion(destinationScene, id, "arrival", destinationXY, label);
  const blueprint = {
    schemaVersion: "1.0",
    moduleId: "regionwright",
    id: "scene-portal",
    name: `Iggwilv Tower ${id}`,
    description: label,
    edition: "premium",
    status: "published",
    scenes: [{ uuid: sourceScene.uuid, name: sourceScene.name }, { uuid: destinationScene.uuid, name: destinationScene.name }],
    nodes: [
      { id: "portal-entry", kind: "trigger", type: "tokenEnter", label: "Enter doorway", sceneUuid: sourceScene.uuid, config: { targetType: "region", targetUuid: source.uuid }, position: { x: 80, y: 140 } },
      { id: "portal-arrival", kind: "action", type: "teleportToken", label: "Arrive in destination", sceneUuid: destinationScene.uuid, config: { targetType: "region", targetUuid: arrival.uuid, targetSceneUuid: destinationScene.uuid }, position: { x: 360, y: 140 } }
    ],
    edges: [{ id: "portal-travel", from: "portal-entry", to: "portal-arrival" }],
    metadata: { source: "iggwilv-injection-macro", routeId: id }
  };
  const published = await publisher(blueprint, { currentUser: game.user, writesEnabled: true, activeSceneUuid: sourceScene.uuid, resolveUuid: fromUuidSync });
  const behavior = Array.from(source.behaviors ?? []).find(entry => entry.type === "teleportToken" && entry.getFlag("regionwright", "studioActivity")?.blueprintId === "scene-portal");
  if (!published?.created?.length || !behavior) throw new Error(`${id} did not receive a verified Teleport Token behavior.`);
  result.push({ route: id, source: sourceScene.name, destination: destinationScene.name, region: source.name, status: "installed" });
}

console.table(result);
ui.notifications.info(`Iggwilv travel installed: ${result.length} doorway portals, ${result.length} arrival Regions, and ${result.length} verified Regionwright teleports.`);
