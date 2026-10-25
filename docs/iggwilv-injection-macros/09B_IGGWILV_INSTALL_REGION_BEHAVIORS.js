/**
 * Iggwilv's Tower — Install all Region Behaviors
 * Foundry Script Macro. Run once as GM after 08 and after saving 09A as
 * a Script Macro named exactly "IGG | Runtime Controller".
 *
 * Idempotently installs 20 native teleports, controller behaviors for every
 * G/P/E interaction, and the two special Regionwright puzzles at P06/T11.
 */

const MODULE_ID = "regionwright";
const CONTROLLER_NAME = "IGG | Runtime Controller";
const STATE_JOURNAL = "IGG | Runtime State";
const EXPECTED_KEYS = [
  ...Array.from({ length: 20 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 20 }, (_, i) => `A${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 12 }, (_, i) => `G${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`),
  "E01"
];
const INTERACTION_KEYS = [
  ...Array.from({ length: 12 }, (_, i) => `G${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`),
  "E01", "T11"
];
const ITEM_NAMES = [
  "Arcane Lock Password", "Astral Fruit", "Astral Water", "Black Tallow Candles", "Blood Meal",
  "Calcium-Rich Bone Meal", "Demon Skull", "Epsom Salts", "Fey-Infused Plant Food", "Fey-Infused Water",
  "Hourglass Coven's Hourglass", "Iggwilv's Sovereign Seal", "Ingredient Cabinet Key", "Ivory Thorn",
  "Obsidian Crow's-Foot Key", "Obsidian Thorn", "Powdered Silver", "Red Leaf Fern", "Sunglobe", "Thorn Key",
  "Star", "Skeleton Bones", "Ordinary Water"
];
const ACTOR_UUIDS = [
  "Actor.88UZTmEStCJvgRQA", "Actor.ZxwpNOpwal02ivlJ", "Actor.6Qz6BnNqn3eegGKJ",
  "Actor.yp5N7pZJ55H7JAu1", "Actor.p6Fe5QOVEoGfeWA9", "Actor.zIuxjSzp3qPbFdJF"
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (game.system.id !== "dnd5e") throw new Error("This behavior series expects a D&D 5e world.");
const rw = game.modules.get(MODULE_ID);
if (!rw?.active) throw new Error("Regionwright is not active.");
if (game.settings.get(MODULE_ID, "enableRegionWrites") !== true) {
  await game.settings.set(MODULE_ID, "enableRegionWrites", true);
  ui.notifications.info("Regionwright Region Writes enabled for this installation.");
}
if (game.settings.get(MODULE_ID, "enablePuzzleWrites") !== true) {
  await game.settings.set(MODULE_ID, "enablePuzzleWrites", true);
  ui.notifications.info("Regionwright Puzzle Writes enabled for this installation.");
}
const mix = rw.api?.premium?.ingredientMixing;
const spine = rw.api?.premium?.spineMosaic;
if (typeof mix?.configure !== "function" || typeof spine?.configure !== "function") throw new Error("Regionwright Premium Ingredient Mixing and Spine Mosaic are required.");
const controller = game.macros.getName(CONTROLLER_NAME);
if (!controller || controller.type !== "script") throw new Error(`Create and save the Script Macro "${CONTROLLER_NAME}" from 09A before running this installer.`);

const allRegions = game.scenes.contents.flatMap(scene => Array.from(scene.regions ?? []));
const byKey = new Map();
for (const candidate of allRegions) {
  const key = candidate.flags?.regionwright?.iggwilvTower?.regionKey ?? candidate.name?.match(/IGG\s*\|\s*([A-Z]\d{2})\s*\|/)?.[1];
  if (!key || !EXPECTED_KEYS.includes(key)) continue;
  if (byKey.has(key)) throw new Error(`Duplicate Tower Region key ${key}. No behaviors were changed.`);
  byKey.set(key, candidate);
}
const missingRegions = EXPECTED_KEYS.filter(key => !byKey.has(key));
if (missingRegions.length) throw new Error(`Missing Tower Regions: ${missingRegions.join(", ")}. Run macro 08 first.`);

function firstRect(target) {
  const shape = target?.shapes?.[0];
  if (!shape || shape.type !== "rectangle") throw new Error(`${target?.name ?? "A Tower Region"} needs a rectangular shape.`);
  return { x: Number(shape.x), y: Number(shape.y), width: Number(shape.width), height: Number(shape.height) };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function inwardRect(scene, origin, width, height, distance) {
  const originCenter = { x: origin.x + origin.width / 2, y: origin.y + origin.height / 2 };
  const sceneCenter = { x: scene.dimensions.sceneX + scene.dimensions.sceneWidth / 2, y: scene.dimensions.sceneY + scene.dimensions.sceneHeight / 2 };
  const dx = sceneCenter.x - originCenter.x;
  const dy = sceneCenter.y - originCenter.y;
  const shift = Math.abs(dx) >= Math.abs(dy)
    ? { x: Math.sign(dx || 1) * distance, y: 0 }
    : { x: 0, y: Math.sign(dy || 1) * distance };
  return { x: originCenter.x + shift.x - width / 2, y: originCenter.y + shift.y - height / 2, width, height };
}

function rectangleShape(rect) {
  return { type: "rectangle", ...rect, anchorX: 0, anchorY: 0, rotation: 0, hole: false };
}

// Repair the known geometry defects before any behavior can fire.
// Arrival anchors move only while they overlap a travel trigger, so reruns are idempotent.
for (let index = 1; index <= 20; index += 1) {
  const number = String(index).padStart(2, "0");
  const arrival = byKey.get(`A${number}`);
  const sceneTravels = Array.from(arrival.parent.regions ?? []).filter(candidate => candidate.flags?.regionwright?.iggwilvTower?.kind === "travel");
  let rect = firstRect(arrival);
  let attempts = 0;
  while (sceneTravels.some(travel => overlaps(rect, firstRect(travel))) && attempts < 4) {
    rect = inwardRect(arrival.parent, rect, rect.width, rect.height, Number(arrival.parent.grid.size ?? 64) * 3);
    attempts += 1;
  }
  if (attempts) await arrival.update({ shapes: [rectangleShape(rect)] });
  if (sceneTravels.some(travel => overlaps(firstRect(arrival), firstRect(travel)))) throw new Error(`${arrival.name} still overlaps a travel trigger after geometry repair.`);
}

// G01 must be reachable from the Library side before T09 unlocks the Study.
const oldG01 = byKey.get("G01");
const t09 = byKey.get("T09");
if (oldG01.parent !== t09.parent) {
  const rect = inwardRect(t09.parent, firstRect(t09), 192, 128, Number(t09.parent.grid.size ?? 64) * 2);
  const data = oldG01.toObject();
  delete data._id;
  delete data.behaviors;
  data.name = "IGG | G01 | Private Library | Private Study Star Socket";
  data.shapes = [rectangleShape(rect)];
  const [replacement] = await t09.parent.createEmbeddedDocuments("Region", [data]);
  await oldG01.parent.deleteEmbeddedDocuments("Region", [oldG01.id]);
  byKey.set("G01", replacement);
}

// Split the Nixie's sequential tank interactions so one entry cannot solve both stages.
const g08 = byKey.get("G08");
const g09 = byKey.get("G09");
if (overlaps(firstRect(g08), firstRect(g09))) {
  const tank = firstRect(g08);
  const half = tank.height / 2;
  await g08.update({ shapes: [rectangleShape({ ...tank, height: half })] });
  await g09.update({ shapes: [rectangleShape({ ...tank, y: tank.y + half, height: half })] });
}

// G11 checks the two-part lock; T15 remains the door crossing beyond it.
const g11 = byKey.get("G11");
const t15 = byKey.get("T15");
if (g11.parent === t15.parent && overlaps(firstRect(g11), firstRect(t15))) {
  const moved = inwardRect(g11.parent, firstRect(t15), firstRect(g11).width, firstRect(g11).height, Number(g11.parent.grid.size ?? 64) * 3);
  await g11.update({ shapes: [rectangleShape(moved)] });
}

const behaviorModels = CONFIG.RegionBehavior?.dataModels ?? {};
for (const type of ["teleportToken", "executeScript"]) {
  if (!behaviorModels[type]) throw new Error(`Foundry Region behavior type ${type} is unavailable.`);
}

// Create only the three PDF-required names that were absent from the supplied Item list.
for (const name of ["Star", "Skeleton Bones", "Ordinary Water"]) {
  if (!game.items.find(item => item.name === name)) {
    await Item.create({ name, type: "loot", img: "icons/containers/bags/pack-simple-leather-tan.webp", system: { quantity: 1, description: { value: `<p>Iggwilv's Tower quest item.</p>` } } });
  }
}
const missingItems = ITEM_NAMES.filter(name => !game.items.find(item => item.name === name));
if (missingItems.length) throw new Error(`Missing exact Item names: ${missingItems.join(", ")}. No behaviors were changed.`);
const missingActors = [];
for (const uuid of ACTOR_UUIDS) if (!await fromUuid(uuid)) missingActors.push(uuid);
if (missingActors.length) throw new Error(`Missing Tower Actors: ${missingActors.join(", ")}. No behaviors were changed.`);

let stateJournal = game.journal.getName(STATE_JOURNAL);
if (!stateJournal) stateJournal = await JournalEntry.create({ name: STATE_JOURNAL, ownership: { default: 0 }, flags: { regionwright: { iggwilvTowerState: {} } } });
const state = stateJournal.flags?.regionwright?.iggwilvTowerState ?? {};

function owned(entry, role = null) {
  const data = entry.flags?.regionwright?.iggwilvTowerBehavior;
  return Boolean(data && (!role || data.role === role));
}

async function upsertBehavior(target, role, data) {
  const matches = Array.from(target.behaviors ?? []).filter(entry => owned(entry, role));
  const payload = {
    name: data.name,
    type: data.type,
    disabled: Boolean(data.disabled),
    system: foundry.utils.deepClone(data.system),
    flags: { regionwright: { iggwilvTowerBehavior: { version: 1, campaign: "iggwilvs-tower", regionKey: target.flags?.regionwright?.iggwilvTower?.regionKey, role } } }
  };
  let result;
  if (matches[0]) {
    [result] = await target.updateEmbeddedDocuments("RegionBehavior", [{ _id: matches[0].id, ...payload }]);
    const duplicates = matches.slice(1).map(entry => entry.id);
    if (duplicates.length) await target.deleteEmbeddedDocuments("RegionBehavior", duplicates);
  } else [result] = await target.createEmbeddedDocuments("RegionBehavior", [payload]);
  return result;
}

const controllerSource = `if (game.user.isGM) await game.macros.getName(${JSON.stringify(CONTROLLER_NAME)})?.execute({ region, event });`;
for (let index = 1; index <= 20; index += 1) {
  const number = String(index).padStart(2, "0");
  const source = byKey.get(`T${number}`);
  const destination = byKey.get(`A${number}`);
  const gated = index === 9 ? !state.studyUnlocked : index === 11 ? !state.bookcaseSolved : index === 15 ? !state.vaultUnlocked : false;
  await upsertBehavior(source, "teleport", {
    name: `IGG | T${number} | Teleport to A${number}`,
    type: "teleportToken",
    disabled: gated,
    system: {
      destinations: [destination.uuid], placement: "center", snap: true, choice: false, revealed: false,
      dialog: { revealed: null, unrevealed: null }, transition: { type: null, duration: 1500 }
    }
  });
}

// Configure puzzle state only when absent; rerunning must not erase a solved puzzle.
const cauldron = byKey.get("P06");
if (!cauldron.flags?.regionwright?.ingredientMixing) {
  await mix.configure({
    target: cauldron,
    ingredients: [
      { name: "Red Leaf Fern", target: 2 }, { name: "Epsom Salts", target: 3 },
      { name: "Blood Meal", target: 2 }, { name: "Calcium-Rich Bone Meal", target: 3 }
    ],
    tolerance: 0
  });
}
const bookcase = byKey.get("T11");
if (!bookcase.flags?.regionwright?.spineMosaic) {
  await spine.configure({
    target: bookcase,
    books: ["The Cauldron", "Crown of Thorns", "Iggwilv's Rose", "The Black Star", "Shadowed Door", "Keys to the Abyss"],
    seed: "iggwilv-hidden-library"
  });
}

// Remove the adapters' unconditional auto-open behaviors. The Tower controller
// verifies requirements, invokes the adapters, and watches their solved flags.
const adapterBehaviors = [
  ...Array.from(cauldron.behaviors ?? []).filter(entry => entry.flags?.regionwright?.ingredientMixing?.region),
  ...Array.from(bookcase.behaviors ?? []).filter(entry => entry.flags?.regionwright?.spineMosaic?.region)
];
for (const target of [cauldron, bookcase]) {
  const ids = adapterBehaviors.filter(entry => entry.parent === target).map(entry => entry.id);
  if (ids.length) await target.deleteEmbeddedDocuments("RegionBehavior", ids);
}

for (const key of INTERACTION_KEYS) {
  const target = byKey.get(key);
  await upsertBehavior(target, "controller", {
    name: `IGG | ${key} | Tower Controller`,
    type: "executeScript",
    disabled: false,
    system: { events: ["tokenEnter"], source: controllerSource }
  });
}

ui.notifications.info("Iggwilv behavior installation complete: 20 teleports, 29 controller triggers, and 2 gated Regionwright puzzles.");
console.table(EXPECTED_KEYS.map(key => {
  const target = byKey.get(key);
  return { key, scene: target.parent.name, behaviors: Array.from(target.behaviors ?? []).length };
}));
