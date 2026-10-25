/**
 * Iggwilv's Tower - read-only structural audit
 * Foundry Script Macro. Run as GM after 04.
 *
 * Confirms every final map background, the secret bookcase Door, cauldron
 * puzzle region, and the 20 tagged portal source/arrival Regions. It makes
 * no changes and writes no Chat messages; use F12 Console for the tables.
 */

const FLAG_SCOPE = "iggwilvTower";
const TITLE_PREFIX = "Iggwilv Tower — ";
const rooms = ["Floor 1 Landing", "Curiosities Room", "Private Chambers", "Private Library", "Hidden Library", "Private Study", "Witch's Laboratory", "Floor 2 Landing", "Summoning Chamber", "Astral Garden", "Arcane Vault"];
const sceneRows = rooms.map(room => {
  const scene = game.scenes.find(entry => entry.name === `${TITLE_PREFIX}${room}`);
  const regions = Array.from(scene?.regions ?? []).filter(region => region.getFlag(FLAG_SCOPE, "campaign") === "iggwilvs-tower");
  return { room, scene: Boolean(scene), background: scene?.background?.src ?? "MISSING", grid5ft: Boolean(scene?.grid?.size === 64 && scene?.grid?.distance === 5), taggedRegions: regions.length };
});
const allRegions = game.scenes.contents.flatMap(scene => Array.from(scene.regions ?? []));
const routeRows = Array.from({ length: 20 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`).map(routeId => {
  const source = allRegions.find(region => region.getFlag(FLAG_SCOPE, "routeId") === routeId && region.getFlag(FLAG_SCOPE, "role") === "source");
  const arrival = allRegions.find(region => region.getFlag(FLAG_SCOPE, "routeId") === routeId && region.getFlag(FLAG_SCOPE, "role") === "arrival");
  const portal = Array.from(source?.behaviors ?? []).find(behavior => behavior.type === "teleportToken" && behavior.getFlag("regionwright", "studioActivity")?.id === "scene-portal");
  return { routeId, sourceScene: source?.parent?.name ?? "MISSING", arrivalScene: arrival?.parent?.name ?? "MISSING", sourceRegion: source?.name ?? "MISSING", arrivalRegion: arrival?.name ?? "MISSING", teleport: Boolean(portal), pass: Boolean(source && arrival && portal) };
});
const library = game.scenes.find(scene => scene.name === `${TITLE_PREFIX}Private Library`);
const lab = game.scenes.find(scene => scene.name === `${TITLE_PREFIX}Witch's Laboratory`);
const bookcaseDoor = Array.from(library?.walls ?? []).find(wall => wall.getFlag(FLAG_SCOPE, "key") === "hidden-library-bookcase-door");
const cauldron = Array.from(lab?.regions ?? []).find(region => region.getFlag(FLAG_SCOPE, "key") === "ingredient-cauldron");
const puzzleRows = [
  { puzzle: "Hidden bookcase", present: Boolean(bookcaseDoor), status: bookcaseDoor?.getFlag("regionwright", "spineMosaic")?.persistent?.status ?? "MISSING", doorState: bookcaseDoor?.ds ?? "MISSING" },
  { puzzle: "Ingredient cauldron", present: Boolean(cauldron), status: cauldron?.getFlag("regionwright", "ingredientMixing")?.persistent?.status ?? "MISSING", doorState: "n/a" }
];
console.table(sceneRows);
console.table(routeRows);
console.table(puzzleRows);
const failures = sceneRows.filter(row => !row.scene || row.background === "MISSING" || !row.grid5ft).length + routeRows.filter(row => !row.pass).length + puzzleRows.filter(row => !row.present || row.status === "MISSING").length;
if (failures) throw new Error(`Iggwilv audit found ${failures} issue(s). Review the Console tables; nothing was changed.`);
ui.notifications.info("Iggwilv audit passed: 11 mapped Scenes, 20 portal routes, bookcase puzzle, and cauldron puzzle are present.");
