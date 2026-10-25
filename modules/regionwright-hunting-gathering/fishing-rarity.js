export const FISH_RARITIES = Object.freeze([
  "common",
  "uncommon",
  "rare",
  "very rare",
  "legendary"
]);

// Homebrew sale values based on one tenth of the user's supplied rarity dice.
// Each fish is priced when caught, so identical species can have distinct values.
export const FISH_MARKET_VALUE_RULES = Object.freeze({
  common: Object.freeze({ count: 1, sides: 6, bonus: 1, multiplier: 1, formula: "(1d6 + 1) × 1 gp" }),
  uncommon: Object.freeze({ count: 1, sides: 6, bonus: 0, multiplier: 10, formula: "1d6 × 10 gp" }),
  rare: Object.freeze({ count: 2, sides: 10, bonus: 0, multiplier: 100, formula: "2d10 × 100 gp" }),
  "very rare": Object.freeze({ count: 1, sides: 4, bonus: 1, multiplier: 1000, formula: "(1d4 + 1) × 1,000 gp" }),
  legendary: Object.freeze({ count: 2, sides: 6, bonus: 0, multiplier: 2500, formula: "2d6 × 2,500 gp" })
});

export const FISH_RARITY_DIFFICULTY = Object.freeze({
  // The midpoint of each speed range is its average target pace. Rare is 5%
  // faster and Very Rare 6% slower than the current tuning; player tension
  // response scales with safe-band speed.
  // Direction changes are quicker and more frequent at every rarity.
  common: Object.freeze({ duration: 20, safeWidth: 34, safeTravel: 18, safeSpeedMin: 8, safeSpeedMax: 18, safeTurnChance: 0.34 }),
  uncommon: Object.freeze({ duration: 18, safeWidth: 30, safeTravel: 24, safeSpeedMin: 9.24, safeSpeedMax: 20.79, safeTurnChance: 0.43 }),
  rare: Object.freeze({ duration: 17, safeWidth: 23.4, safeTravel: 28, safeSpeedMin: 21.252, safeSpeedMax: 48.0585, safeTurnChance: 0.56 }),
  "very rare": Object.freeze({ duration: 16, safeWidth: 22, safeTravel: 31, safeSpeedMin: 22.5929, safeSpeedMax: 55.126676, safeTurnChance: 0.7 }),
  legendary: Object.freeze({ duration: 14, safeWidth: 16, safeTravel: 36, safeSpeedMin: 16.1, safeSpeedMax: 43.24, safeTurnChance: 0.78 })
});

export const POND_TIER_ORDER = Object.freeze(["common", "uncommon", "rare"]);

export const POND_TIERS = Object.freeze({
  common: Object.freeze({
    id: "common",
    label: "Common Pond",
    description: "Common 72% · Uncommon 25% · Rare 3%.",
    rarityWeights: Object.freeze({ common: 72, uncommon: 25, rare: 3 })
  }),
  uncommon: Object.freeze({
    id: "uncommon",
    label: "Uncommon Pond",
    description: "Common 45% · Uncommon 40% · Rare 14% · Very Rare 1%.",
    rarityWeights: Object.freeze({ common: 45, uncommon: 40, rare: 14, "very rare": 1 })
  }),
  rare: Object.freeze({
    id: "rare",
    label: "Rare Pond",
    description: "Common 30% · Uncommon 37% · Rare 24% · Very Rare 7% · Legendary 2%.",
    rarityWeights: Object.freeze({ common: 30, uncommon: 37, rare: 24, "very rare": 7, legendary: 2 })
  })
});

export function normalizePondTier(value) {
  const tier = String(value ?? "common").trim().toLocaleLowerCase().replaceAll(" pond", "");
  return Object.hasOwn(POND_TIERS, tier) ? tier : "common";
}

export function getPondTier(value) {
  const tier = String(value ?? "").trim().toLocaleLowerCase().replaceAll(" pond", "");
  return POND_TIERS[tier] ?? null;
}

export function normalizeFishRarity(value) {
  const rarity = String(value ?? "common").trim().toLocaleLowerCase();
  return FISH_RARITIES.includes(rarity) ? rarity : "common";
}

export function fishingDifficultyForRarity(value) {
  return FISH_RARITY_DIFFICULTY[normalizeFishRarity(value)] ?? FISH_RARITY_DIFFICULTY.common;
}
