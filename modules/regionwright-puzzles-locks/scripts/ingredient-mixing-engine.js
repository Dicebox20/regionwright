export const INGREDIENT_MIXING_VERSION = 1;
export const INGREDIENT_TARGET_TYPES = Object.freeze(["door", "tile", "region"]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const cleanName = (value, fallback) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 42) || fallback;

export function createIngredientMixingConfig({ ingredients = [], tolerance = 0 } = {}) {
  const requested = Array.isArray(ingredients) ? ingredients : [];
  const list = requested.length ? requested : ["Moonwater", "Ember Salt", "Nightshade"];
  const normalized = list.slice(0, 4).map((ingredient, index) => ({
    id: `ingredient-${index + 1}`,
    name: cleanName(typeof ingredient === "object" ? ingredient.name : ingredient, `Ingredient ${index + 1}`),
    target: clamp(Math.trunc(Number(typeof ingredient === "object" ? ingredient.target : index === 0 ? 4 : index === 1 ? 6 : 3) || 0), 0, 10)
  }));
  if (normalized.length < 2) normalized.push({ id: `ingredient-${normalized.length + 1}`, name: `Ingredient ${normalized.length + 1}`, target: 5 });
  return Object.freeze({ version: INGREDIENT_MIXING_VERSION, tolerance: clamp(Math.trunc(Number(tolerance) || 0), 0, 2), ingredients: Object.freeze(normalized.map(Object.freeze)) });
}

export function validateIngredientMixingConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== INGREDIENT_MIXING_VERSION) throw new Error("This ingredient mix configuration is unsupported.");
  if (!Array.isArray(config.ingredients) || config.ingredients.length < 2 || config.ingredients.length > 4) throw new Error("Choose two to four ingredients.");
  const names = new Set();
  const ingredients = config.ingredients.map((ingredient, index) => {
    const id = String(ingredient?.id ?? `ingredient-${index + 1}`).trim();
    const name = cleanName(ingredient?.name, `Ingredient ${index + 1}`);
    if (!id || names.has(id)) throw new Error("Each ingredient must be unique.");
    names.add(id);
    const target = Number(ingredient?.target);
    if (!Number.isInteger(target) || target < 0 || target > 10) throw new Error("Ingredient targets must be between 0 and 10.");
    return Object.freeze({ id, name, target });
  });
  return Object.freeze({ version: INGREDIENT_MIXING_VERSION, tolerance: clamp(Math.trunc(Number(config.tolerance) || 0), 0, 2), ingredients: Object.freeze(ingredients) });
}

export function evaluateIngredientMix(config, amounts = {}) {
  const checked = validateIngredientMixingConfig(config);
  const result = checked.ingredients.map(ingredient => {
    const amount = clamp(Math.trunc(Number(amounts?.[ingredient.id]) || 0), 0, 10);
    const difference = Math.abs(amount - ingredient.target);
    return Object.freeze({ ...ingredient, amount, difference, matched: difference <= checked.tolerance });
  });
  return Object.freeze({ ingredients: Object.freeze(result), success: result.every(ingredient => ingredient.matched) });
}

// Independent access gate for the Cabin Greenhouse. Lye is the only required ingredient.
// Water availability comes from Waterworks/Region state, not a second ingredient.
// Explicit true values are required; unknown state fails closed.
export function evaluateIngredientPrerequisites(state = {}) {
  const waterRestored = state?.waterRestored === true;
  const lyeAvailable = state?.lyeAvailable === true;
  const missing = Object.freeze([
    ...(!waterRestored ? ["waterRestored"] : []),
    ...(!lyeAvailable ? ["lyeAvailable"] : [])
  ]);
  return Object.freeze({ ready: missing.length === 0, missing });
}

// This composes a recipe engine with a separate Region/quest gate. The generic
// two-to-four-ingredient engine remains unchanged for other adventures.
export function evaluateGatedIngredientMix(config, amounts = {}, prerequisiteState = {}) {
  const prerequisites = evaluateIngredientPrerequisites(prerequisiteState);
  const mixture = evaluateIngredientMix(config, amounts);
  return Object.freeze({ success: prerequisites.ready && mixture.success, prerequisites, mixture });
}

// Cabin's plant-killer preparation uses one item only; no numeric recipe to guess.
export function evaluateGreenhouseLyeUse(state = {}) {
  const prerequisites = evaluateIngredientPrerequisites(state);
  return Object.freeze({ success: prerequisites.ready, prerequisites, requiredIngredient: "lye" });
}
// The Region/GM adapter MUST derive this evidence from actual documents,
// never from socket payload fields supplied by a player.
export function evaluateGreenhouseCompletion({ waterRestored, inventoryItems = [], alreadyComplete = false } = {}) {
  const items = Array.isArray(inventoryItems) ? inventoryItems : [];
  const lyeAvailable = items.some(item => item && typeof item === "object" &&
    String(item.name ?? "").trim().toLowerCase() === "lye" &&
    (item.quantity === undefined || (Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0)));
  const check = evaluateGreenhouseLyeUse({ waterRestored, lyeAvailable });
  return Object.freeze({
    success: !alreadyComplete && check.success,
    alreadyComplete: alreadyComplete === true,
    missing: check.prerequisites.missing,
    requiredIngredient: "lye"
  });
}