/** Iggwilv's Tower — Key Item Injection (Foundry Script Macro) */
const FOLDER_NAME = "Iggwilv's Tower — Key Items";
const FLAG_SCOPE = "iggwilvTower";

const KEY_ITEMS = [
  ["star", "Star", "Unlocks the Private Study when inserted into its hollow star-shaped socket."],
  ["ingredient-cabinet-key", "Ingredient Cabinet Key", "Opens the reinforced cabinet in the Witch's Laboratory."],
  ["red-leaf-fern", "Red Leaf Fern", "Ingredient for Fey-Infused Plant Food."],
  ["epsom-salts", "Epsom Salts", "Ingredient for Fey-Infused Plant Food."],
  ["blood-meal", "Blood Meal", "Ingredient for Fey-Infused Plant Food."],
  ["skeleton-bones", "Skeleton Bones", "Must be ground with the laboratory mortar and pestle."],
  ["calcium-rich-bone-meal", "Calcium-Rich Bone Meal", "Ingredient produced from Skeleton Bones."],
  ["fey-infused-plant-food", "Fey-Infused Plant Food", "One of three requirements for awakening the Astral Treant."],
  ["sunglobe", "Sunglobe", "One of three requirements for awakening the Astral Treant."],
  ["astral-water", "Astral Water", "One of three requirements for awakening the Astral Treant."],
  ["ordinary-water", "Ordinary Water", "Can be transformed by the Faerie Dragons."],
  ["fey-infused-water", "Fey-Infused Water", "Revives the desiccated Nixie."],
  ["astral-fruit", "Astral Fruit", "The revived Nixie's favorite food."],
  ["arcane-lock-password", "Arcane Lock Password", "One of exactly two Arcane Vault requirements."],
  ["hourglass-covens-hourglass", "Hourglass Coven’s Hourglass", "Provides the HOURGLASS answer to the Study statue riddle."],
  ["powdered-silver", "Powdered Silver", "Component for summoning the Cambion."],
  ["demon-skull", "Demon Skull", "Component for summoning the Cambion."],
  ["black-tallow-candles", "Black Tallow Candles", "Component for summoning the Cambion."],
  ["obsidian-crows-foot-key", "Obsidian Crow’s-Foot Key", "Opens the matching portrait mechanism in the Private Chambers."],
  ["iggwilvs-sovereign-seal", "Iggwilv’s Sovereign Seal", "One of exactly two Arcane Vault requirements."],
  ["ivory-thorn", "Ivory Thorn", "One half of the final Thorn Key."],
  ["obsidian-thorn", "Obsidian Thorn", "One half of the final Thorn Key."],
  ["thorn-key", "Thorn Key", "The completed key for the final rose-themed door."]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (game.system.id !== "dnd5e") throw new Error("This key-item macro requires a D&D 5e world.");
if (!globalThis.Item?.createDocuments) throw new Error("Foundry's Item creation API is unavailable.");

let folder = game.folders.find(f => f.type === "Item" && f.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Item", sorting: "a" });

const existingByKey = new Map(game.items.contents
  .filter(item => item.getFlag(FLAG_SCOPE, "key"))
  .map(item => [item.getFlag(FLAG_SCOPE, "key"), item]));

const createData = [];
const updateData = [];
for (const [key, name, description] of KEY_ITEMS) {
  const data = {
    name,
    type: "loot",
    img: "icons/containers/bags/pack-simple-leather-tan.webp",
    folder: folder.id,
    system: {
      description: { value: `<p>${foundry.utils.escapeHTML(description)}</p>` },
      quantity: 1,
      weight: { value: 0, units: "lb" },
      price: { value: 0, denomination: "gp" }
    },
    flags: { [FLAG_SCOPE]: { key, kind: "key-item", campaign: "iggwilvs-tower", version: 1 } }
  };
  const existing = existingByKey.get(key);
  if (existing) updateData.push({ _id: existing.id, ...data });
  else createData.push(data);
}

if (updateData.length) await Item.updateDocuments(updateData);
if (createData.length) await Item.createDocuments(createData);

const missing = KEY_ITEMS.filter(([key]) => !game.items.some(item => item.getFlag(FLAG_SCOPE, "key") === key));
if (missing.length) throw new Error(`Missing after injection: ${missing.map(([, name]) => name).join(", ")}`);

console.table(KEY_ITEMS.map(([key, name]) => ({ key, name, installed: true })));
ui.notifications.info(`Iggwilv key items installed: ${KEY_ITEMS.length}/${KEY_ITEMS.length}.`);
