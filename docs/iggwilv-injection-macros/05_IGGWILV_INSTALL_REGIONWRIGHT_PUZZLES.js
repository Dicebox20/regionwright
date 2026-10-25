/**
 * Iggwilv's Tower - install the bookcase and cauldron Regionwright puzzles
 * Foundry Script Macro. Run as GM after 02 and 03 succeed, before 04.
 *
 * Creates a locked secret Door at the Private Library bookcase, installs the
 * Spine Mosaic puzzle on it, creates a cauldron Region in the Witch's Lab,
 * and installs Regionwright's Ingredient Mixing puzzle on that Region.
 *
 * Important, honest limitation: Ingredient Mixing accepts recipe quantities,
 * not Foundry inventory UUIDs. This macro creates the four world Items and
 * the cauldron puzzle, but it cannot consume carried Items or award the
 * product automatically. Use macro 06 after a successful mix to do that.
 */

const FLAG_SCOPE = "iggwilvTower";
const TITLE_PREFIX = "Iggwilv Tower — ";
const GRID = 64;
const BOOKCASE_KEY = "hidden-library-bookcase-door";
const CAULDRON_KEY = "ingredient-cauldron";
const ITEM_KEYS = ["red-leaf-fern", "epsom-salts", "calcium-rich-bone-meal", "blood-meal", "fey-infused-plant-food"];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
const rw = game.modules.get("regionwright");
const spine = rw?.api?.premium?.spineMosaic;
const mix = rw?.api?.premium?.ingredientMixing;
if (!rw?.active || typeof spine?.configure !== "function" || typeof mix?.configure !== "function") {
  throw new Error("Regionwright Premium's Spine Mosaic and Ingredient Mixing APIs must be active before puzzle installation.");
}
if (game.settings.get("regionwright", "enableRegionWrites") !== true || game.settings.get("regionwright", "enablePuzzleWrites") !== true) {
  throw new Error("Enable both Regionwright 'Region Writes' and 'Puzzle Writes', then rerun. No puzzle objects were changed.");
}

const library = game.scenes.find(scene => scene.name === `${TITLE_PREFIX}Private Library`);
const lab = game.scenes.find(scene => scene.name === `${TITLE_PREFIX}Witch's Laboratory`);
if (!library || !lab) throw new Error("Private Library or Witch's Laboratory Scene is missing. Run 01C and 02 first.");
for (const scene of [library, lab]) {
  if (scene.grid.size !== GRID || scene.grid.distance !== 5 || scene.grid.units !== "ft") throw new Error(`${scene.name} is not 64 px / 5 ft. No puzzle was changed.`);
}
const missingItems = ITEM_KEYS.filter(key => !game.items.some(item => item.getFlag(FLAG_SCOPE, "key") === key));
if (missingItems.length) throw new Error(`Missing quest Item prerequisites: ${missingItems.join(", ")}. Run 03 first.`);

let bookcaseDoor = Array.from(library.walls ?? []).find(wall => wall.getFlag(FLAG_SCOPE, "key") === BOOKCASE_KEY);
const bookcaseData = {
  c: [2176, 640, 2176, 896],
  move: CONST.WALL_RESTRICTION_TYPES.NORMAL,
  sight: CONST.WALL_SENSE_TYPES.NORMAL,
  sound: CONST.WALL_SENSE_TYPES.NORMAL,
  light: CONST.WALL_SENSE_TYPES.NORMAL,
  door: CONST.WALL_DOOR_TYPES.DOOR,
  ds: CONST.WALL_DOOR_STATES.LOCKED,
  dir: CONST.WALL_DIRECTIONS.BOTH,
  flags: { [FLAG_SCOPE]: { version: 1, campaign: "iggwilvs-tower", key: BOOKCASE_KEY } }
};
if (bookcaseDoor) await bookcaseDoor.update(bookcaseData);
else [bookcaseDoor] = await library.createEmbeddedDocuments("Wall", [bookcaseData]);
if (!bookcaseDoor) throw new Error("Foundry did not create the hidden-bookcase Door.");

let cauldron = Array.from(lab.regions ?? []).find(region => region.getFlag(FLAG_SCOPE, "key") === CAULDRON_KEY);
const cauldronData = {
  name: "IGG | P01 | Witch's Laboratory | Four-Ingredient Cauldron",
  color: "#d18431",
  shapes: [{ type: "rectangle", x: 768, y: 704, width: 384, height: 384, anchorX: 0, anchorY: 0, rotation: 0, hole: false }],
  elevation: { bottom: 0, top: null }, levels: [], restriction: { enabled: false, type: "move", priority: 0 }, attachment: { token: null },
  visibility: 0, highlightMode: "coverage", displayMeasurements: false, hidden: false, locked: false,
  flags: { [FLAG_SCOPE]: { version: 1, campaign: "iggwilvs-tower", key: CAULDRON_KEY, role: "puzzle" } }
};
if (cauldron) await cauldron.update(cauldronData);
else [cauldron] = await lab.createEmbeddedDocuments("Region", [cauldronData]);
if (!cauldron) throw new Error("Foundry did not create the cauldron Region.");

// The book titles are deliberately in the intended picture order.
await spine.configure({
  target: bookcaseDoor,
  books: ["The Cauldron", "Crown of Thorns", "Iggwilv's Rose", "The Black Star", "Shadowed Door", "Keys to the Abyss"],
  seed: "iggwilv-hidden-library"
});
await mix.configure({
  target: cauldron,
  ingredients: [
    { name: "Red Leaf Fern", target: 2 },
    { name: "Epsom Salts", target: 3 },
    { name: "Blood Meal", target: 2 },
    { name: "Calcium-Rich Bone Meal", target: 3 }
  ],
  tolerance: 0
});

const spineInstalled = bookcaseDoor.getFlag("regionwright", "spineMosaic")?.persistent?.status === "locked";
const mixInstalled = cauldron.getFlag("regionwright", "ingredientMixing")?.persistent?.status === "locked";
if (!spineInstalled || !mixInstalled) throw new Error("Puzzle verification failed. Inspect the Foundry console before continuing.");
ui.notifications.info("Iggwilv puzzles installed: the locked bookcase runs Spine Mosaic; the laboratory cauldron runs Ingredient Mixing.");
