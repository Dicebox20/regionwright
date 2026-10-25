import assert from "node:assert/strict";
import test from "node:test";
import { INGREDIENT_MIXING_VERSION, createIngredientMixingConfig, evaluateIngredientMix, validateIngredientMixingConfig } from "../modules/regionwright-puzzles-locks/scripts/ingredient-mixing-engine.js";

test("Ingredient Mixing defaults to a playable three-ingredient recipe", () => {
  const config = createIngredientMixingConfig();
  assert.deepEqual(config.ingredients.map(ingredient => ingredient.name), ["Moonwater", "Ember Salt", "Nightshade"]);
  assert.deepEqual(config.ingredients.map(ingredient => ingredient.target), [4, 6, 3]);
});

test("Ingredient Mixing preserves GM-named ingredients and recipe levels", () => {
  const config = createIngredientMixingConfig({ ingredients: [{ name: "Sun Moss", target: 2 }, { name: "Manticore Venom", target: 7 }] });
  assert.equal(config.version, INGREDIENT_MIXING_VERSION);
  assert.deepEqual(config.ingredients.map(item => [item.name, item.target]), [["Sun Moss", 2], ["Manticore Venom", 7]]);
  assert.doesNotThrow(() => validateIngredientMixingConfig(config));
});

test("Ingredient Mixing requires every amount to match its recipe within tolerance", () => {
  const config = createIngredientMixingConfig({ ingredients: [{ name: "A", target: 3 }, { name: "B", target: 8 }], tolerance: 1 });
  const ids = config.ingredients.map(item => item.id);
  assert.equal(evaluateIngredientMix(config, { [ids[0]]: 4, [ids[1]]: 7 }).success, true);
  assert.equal(evaluateIngredientMix(config, { [ids[0]]: 5, [ids[1]]: 7 }).success, false);
});

test("Ingredient Mixing rejects malformed recipe sizes and target levels", () => {
  assert.throws(() => validateIngredientMixingConfig({ version: INGREDIENT_MIXING_VERSION, ingredients: [{ id: "a", name: "A", target: 1 }] }), /two to four/i);
  assert.throws(() => validateIngredientMixingConfig({ version: INGREDIENT_MIXING_VERSION, ingredients: [{ id: "a", name: "A", target: 11 }, { id: "b", name: "B", target: 1 }] }), /between 0 and 10/i);
});
