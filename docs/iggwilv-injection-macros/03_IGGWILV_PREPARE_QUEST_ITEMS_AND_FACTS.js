/**
 * Iggwilv's Tower - prepare GM quest assets and Regionwright story facts
 * Foundry Script Macro. Run as GM after 02 reports a full pass.
 *
 * Creates only GM world Items; it does not give anything to player actors,
 * reveal secrets, add Regions, or write to Chat. Existing user-owned Items
 * are never overwritten. Regionwright facts are initialized false.
 */

const ITEM_FOLDER = "Iggwilv's Tower — Quest Items";
const FLAG_SCOPE = "iggwilvTower";
const MODULE_ID = "regionwright";

const items = [
  ["removable-star-emblem", "Removable Star Emblem", "A five-pointed ivory-and-brass star taken from the Floor 1 landing wall relief."],
  ["ingredient-cabinet-key", "Ingredient Cabinet Key", "A small iron key for the locked cabinet in the Witch's Laboratory."],
  ["red-leaf-fern", "Red Leaf Fern", "A delicate crimson fern frond, preserved for witchcraft."],
  ["epsom-salts", "Epsom Salts", "A sealed pouch of bitter mineral salts."],
  ["calcium-rich-bone-meal", "Calcium-Rich Bone Meal", "Finely ground, pale bone meal with an alchemical chalkiness."],
  ["blood-meal", "Blood Meal", "A dark packet of dried blood meal; useful only in a carefully warded recipe."],
  ["fey-infused-plant-food", "Fey-Infused Plant Food", "The successful product of Iggwilv's four-ingredient cauldron formula."],
  ["sunglobe", "Sunglobe", "A captured mote of warm sunlight in a glass sphere."],
  ["astral-water", "Astral Water", "A stoppered vial of silver-blue water recovered from the laboratory cabinet."],
  ["demon-skull", "Demon Skull", "A horned skull kept concealed in the laboratory cabinet."],
  ["fey-infused-water", "Fey-Infused Water", "Fey water altered by the Astral Garden's living magic."],
  ["astral-fruit", "Astral Fruit", "A luminous fruit grown only after the Astral Garden is properly restored."],
  ["arcane-vault-password", "Arcane Vault Password", "A spoken password learned from the revived nixie. Keep its actual phrase secret from players until earned."],
  ["obsidian-crows-foot-key", "Obsidian Crow's-Foot Key", "The black crow's-foot key displayed openly on the Floor 2 landing."],
  ["sovereign-seal", "Sovereign Seal", "The seal recovered from Iggwilv's private chambers; it is required at the Arcane Vault."],
  ["black-tallow-candles", "Black Tallow Candles", "Candles hidden beyond the Private Library's false bookcase."],
  ["powdered-silver", "Powdered Silver", "Powdered silver prepared by solving Iggwilv's hourglass riddle."],
  ["ivory-thorn", "Ivory Thorn", "A pale thorn secured in the Arcane Vault."],
  ["obsidian-thorn", "Obsidian Thorn", "A black thorn earned through the summoning sequence."],
  ["thorn-key", "Thorn Key", "The combined key made from the Ivory Thorn and Obsidian Thorn; it belongs at the Rose Door."]
];

const facts = [
  ["fact.study-star-unlocked", "Study star unlocked"],
  ["fact.hidden-library-revealed", "Hidden library revealed"],
  ["fact.hourglass-riddle-solved", "Hourglass riddle solved"],
  ["fact.cabinet-opened", "Laboratory cabinet opened"],
  ["fact.plant-food-created", "Fey-infused plant food created"],
  ["fact.garden-sunglobe-active", "Garden sunglobe activated"],
  ["fact.garden-water-active", "Garden astral water activated"],
  ["fact.garden-plant-food-active", "Garden plant food activated"],
  ["fact.treant-resolved", "Astral Garden treant resolved"],
  ["fact.nixie-revived", "Nixie revived"],
  ["fact.nixie-allied", "Nixie alliance earned"],
  ["fact.vault-seal-presented", "Vault seal presented"],
  ["fact.vault-password-spoken", "Vault password spoken"],
  ["fact.vault-opened", "Arcane Vault opened"],
  ["fact.summoning-ready", "Summoning ritual prepared"],
  ["fact.cambion-resolved", "Cambion encounter resolved"],
  ["fact.rose-door-unlocked", "Rose Door unlocked"]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (game.system.id !== "dnd5e") throw new Error(`This macro is written for D&D 5e Items; this world reports '${game.system.id}'.`);
const rw = game.modules.get(MODULE_ID);
if (!rw?.active || !game.modules.get(MODULE_ID)?.api?.studio?.facts?.set) {
  throw new Error("Regionwright must be active and expose Studio Story Facts before campaign progression can be prepared.");
}

let folder = game.folders.find(entry => entry.type === "Item" && entry.name === ITEM_FOLDER);
if (!folder) folder = await Folder.create({ name: ITEM_FOLDER, type: "Item", sorting: "a" });

const itemResults = [];
for (const [key, name, description] of items) {
  const tagged = game.items.find(entry => entry.getFlag(FLAG_SCOPE, "key") === key);
  const nameCollision = game.items.find(entry => entry.name === name && !entry.getFlag(FLAG_SCOPE, "key"));
  if (nameCollision && !tagged) {
    itemResults.push({ item: name, result: "SKIPPED — untagged Item with same name already exists" });
    continue;
  }
  const data = {
    name,
    type: "loot",
    img: "icons/containers/chest/chest-reinforced-box-brown.webp",
    folder: folder.id,
    system: { description: { value: `<p>${foundry.utils.escapeHTML(description)}</p>` }, quantity: 1, weight: { value: 0, units: "lb" }, price: { value: 0, denomination: "gp" } },
    flags: { [FLAG_SCOPE]: { version: 1, key, kind: "quest-item", campaign: "iggwilvs-tower" } }
  };
  if (tagged) {
    await tagged.update(data);
    itemResults.push({ item: name, result: "repaired" });
  } else {
    await Item.create(data);
    itemResults.push({ item: name, result: "created" });
  }
}

const factResults = [];
for (const [id, label] of facts) {
  const existing = rw.api.studio.facts.list().find(entry => entry.id === id);
  if (existing) {
    factResults.push({ fact: label, result: `preserved (${existing.value ? "true" : "false"})` });
  } else {
    await rw.api.studio.facts.set({ id, label, value: false });
    factResults.push({ fact: label, result: "initialized false" });
  }
}

const missing = items.filter(([key]) => !game.items.some(entry => entry.getFlag(FLAG_SCOPE, "key") === key));
if (missing.length) throw new Error(`Quest Item verification failed: ${missing.map(([, name]) => name).join(", ")}`);
console.table(itemResults);
console.table(factResults);
ui.notifications.info(`Iggwilv GM assets ready: ${items.length - itemResults.filter(row => row.result.startsWith("SKIPPED")).length}/${items.length} quest Items and ${facts.length} Regionwright facts. No items were given to players.`);
