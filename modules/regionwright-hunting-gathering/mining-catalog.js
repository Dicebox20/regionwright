import { MODULE_ID, MINING_ORE_FLAG } from "./mining-engine.js";
const freeze = value => Object.freeze(value);
function ore(id, name, img, priceValue, denomination, options = {}) {
  return freeze({
    id,
    name,
    img,
    weight: 1,
    price: freeze({ value: priceValue, denomination }),
    ...options
  });
}
export const ORE_CATALOG = freeze({
  "iron-ore": ore("iron-ore", "Iron Ore", "icons/commodities/stone/ore-chunk-iron-black.webp", 1, "sp", {
    tier: "common", miningDifficulty: "common", difficultyLabel: "Common",
    colorHint: "dark iron-black seams with rusty brown staining",
    description: "A one-pound chunk of raw iron-bearing ore. Common, practical, and comparatively forgiving to extract."
  }),
  "tin-ore": ore("tin-ore", "Tin Ore", "icons/commodities/stone/ore-chunk-grey.webp", 3, "sp", {
    tier: "common", miningDifficulty: "common", difficultyLabel: "Common",
    colorHint: "dull grey ore with pale metallic flecks",
    description: "A one-pound chunk of tin-bearing ore, valuable chiefly as a component of bronze and other alloys."
  }),
  "copper-ore": ore("copper-ore", "Copper Ore", "icons/commodities/stone/ore-chunk-copper-orange.webp", 5, "sp", {
    tier: "common", miningDifficulty: "common", difficultyLabel: "Common",
    colorHint: "orange-red copper ore with green-blue oxidation",
    description: "A one-pound chunk of raw copper-bearing ore."
  }),
  "silver-ore": ore("silver-ore", "Silver Ore", "icons/commodities/stone/ore-chunk-silver-gray.webp", 2, "gp", {
    tier: "uncommon", miningDifficulty: "uncommon", difficultyLabel: "Uncommon",
    colorHint: "pale metallic silver veins in dark stone",
    description: "A one-pound chunk of silver-bearing raw ore. It still needs crushing, sorting, and smelting before it reaches refined silver value."
  }),
  "gold-ore": ore("gold-ore", "Gold Ore", "icons/commodities/stone/ore-chunk-yellow-gold.webp", 10, "gp", {
    tier: "rare", miningDifficulty: "rare", difficultyLabel: "Rare",
    colorHint: "warm yellow-gold flecks and narrow metallic veins",
    description: "A one-pound chunk of gold-bearing raw ore. The visible metal is valuable, but much of the mass is still host rock."
  }),
  "platinum-ore": ore("platinum-ore", "Platinum Ore", "icons/commodities/stone/ore-chunk-white.webp", 25, "gp", {
    tier: "very rare", miningDifficulty: "very-rare", difficultyLabel: "Very Rare",
    colorHint: "cold pale-grey metallic grains with a dense silvery sheen",
    description: "A one-pound chunk of platinum-bearing ore from an unusually rich deposit."
  }),
  "mithral-ore": ore("mithral-ore", "Mithral Ore", "icons/commodities/stone/ore-chunk-teal.webp", 100, "gp", {
    tier: "exceptional", miningDifficulty: "exceptional", difficultyLabel: "Exceptional",
    colorHint: "pale blue-silver metallic veins with a cold sheen",
    description: "A one-pound chunk of extraordinarily rare mithral-bearing ore. Five ore units refine into one forging ingot in the Regionwright crafting abstraction."
  }),
  "hizagkuur": ore("hizagkuur", "Hizagkuur", "icons/commodities/stone/clay-grey.webp", 625, "gp", {
    tier: "legendary", miningDifficulty: "legendary", difficultyLabel: "Legendary",
    colorHint: "pale green-grey claylike material with conspicuous white flecks",
    description: "A one-pound raw deposit of hizagkuur. In its natural state it resembles strange clay more than valuable metal."
  }),
  "arandur-ore": ore("arandur-ore", "Arandur Ore", "icons/commodities/stone/ore-chunk-green.webp", 1000, "gp", {
    tier: "legendary", miningDifficulty: "legendary-plus", difficultyLabel: "Legendary+",
    colorHint: "blue-green metallic streaks through dark igneous or glassy stone",
    description: "A one-pound chunk of legendary arandur-bearing material, famed in ancient Realms smithcraft for exceptional edged weapons."
  })
});
export const ORE_ORDER = freeze([
  "iron-ore",
  "tin-ore",
  "copper-ore",
  "silver-ore",
  "gold-ore",
  "platinum-ore",
  "mithral-ore",
  "hizagkuur",
  "arandur-ore"
]);
export function getOre(oreId) {
  return ORE_CATALOG[String(oreId ?? "").trim().toLowerCase()] ?? null;
}
export function formatOreValue(definition) {
  if (!definition) return "?";
  return `${definition.price.value} ${definition.price.denomination}`;
}
export function createOreItemSource(definitionOrId, quantity = 1) {
  const definition = typeof definitionOrId === "string" ? getOre(definitionOrId) : definitionOrId;
  if (!definition) throw new Error("Unknown mining ore.");
  const q = Math.max(1, Math.trunc(Number(quantity) || 1));
  const priceText = formatOreValue(definition);
  const description = [
    `<p><strong>${definition.name}</strong></p>`,
    `<p>${definition.description}</p>`,
    `<p><strong>Gathering unit:</strong> 1 lb. <strong>Sale value:</strong> ${priceText} per unit. <strong>Mining difficulty:</strong> ${definition.difficultyLabel}.</p>`
  ].join("");
  return {
    name: definition.name,
    type: "loot",
    img: definition.img,
    system: {
      quantity: q,
      weight: { value: definition.weight, units: "lb" },
      description: { value: description, chat: description },
      price: { value: definition.price.value, denomination: definition.price.denomination }
    },
    flags: {
      [MODULE_ID]: {
        [MINING_ORE_FLAG]: {
          version: 1,
          oreId: definition.id,
          unitWeight: definition.weight,
          saleValue: { ...definition.price },
          tier: definition.tier,
          miningDifficulty: definition.miningDifficulty
        }
      }
    }
  };
}
export function createAllOreItemSources() {
  return ORE_ORDER.map(id => createOreItemSource(id, 1));
}
