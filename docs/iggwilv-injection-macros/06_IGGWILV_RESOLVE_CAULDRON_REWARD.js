/**
 * Iggwilv's Tower - finalize the solved cauldron reward
 * Foundry Script Macro. Run as GM only AFTER the selected token's player
 * solves the Regionwright Ingredient Mixing puzzle.
 *
 * Regionwright's current Ingredient Mixing API does not own Foundry Items,
 * so this deliberate follow-up verifies the solved puzzle, verifies the
 * selected actor has all four carried ingredients, consumes them, gives that
 * actor Fey-Infused Plant Food, and marks the campaign story fact complete.
 */

const FLAG_SCOPE = "iggwilvTower";
const TITLE_PREFIX = "Iggwilv Tower — ";
const INGREDIENTS = ["red-leaf-fern", "epsom-salts", "blood-meal", "calcium-rich-bone-meal"];
const REWARD = "fey-infused-plant-food";
const FACT_ID = "fact.plant-food-created";

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
const rw = game.modules.get("regionwright");
if (!rw?.active || !rw.api?.studio?.facts?.set) throw new Error("Regionwright Studio facts are required.");
const lab = game.scenes.find(scene => scene.name === `${TITLE_PREFIX}Witch's Laboratory`);
if (!lab) throw new Error("Witch's Laboratory Scene is missing.");
const cauldron = Array.from(lab.regions ?? []).find(region => region.getFlag(FLAG_SCOPE, "key") === "ingredient-cauldron");
if (!cauldron) throw new Error("The cauldron Region is missing. Run 05 first.");
if (cauldron.getFlag("regionwright", "ingredientMixing")?.persistent?.status !== "solved") {
  throw new Error("The Ingredient Mixing puzzle is not solved yet. No Items were changed.");
}
const controlled = canvas?.tokens?.controlled ?? [];
if (controlled.length !== 1 || !controlled[0].actor) throw new Error("Select exactly one token for the actor who carried the ingredients, then rerun.");
const actor = controlled[0].actor;
const worldItem = key => game.items.find(item => item.getFlag(FLAG_SCOPE, "key") === key);
const missingWorld = [...INGREDIENTS, REWARD].filter(key => !worldItem(key));
if (missingWorld.length) throw new Error(`Missing world quest Items: ${missingWorld.join(", ")}. Run 03 first.`);
const held = key => actor.items.find(item => item.getFlag(FLAG_SCOPE, "key") === key);
const missingHeld = INGREDIENTS.filter(key => !held(key));
if (missingHeld.length) throw new Error(`The selected actor is not carrying: ${missingHeld.join(", ")}. No Items were changed.`);
const existingReward = held(REWARD);

await actor.deleteEmbeddedDocuments("Item", INGREDIENTS.map(key => held(key).id));
if (existingReward) await existingReward.update({ "system.quantity": Number(existingReward.system.quantity ?? 1) + 1 });
else {
  const data = worldItem(REWARD).toObject();
  delete data._id;
  await actor.createEmbeddedDocuments("Item", [data]);
}
await rw.api.studio.facts.set({ id: FACT_ID, label: "Fey-infused plant food created", value: true });
const stillHeld = INGREDIENTS.filter(key => held(key));
const rewardHeld = held(REWARD);
if (stillHeld.length || !rewardHeld) throw new Error("Cauldron reward verification failed. Check the selected actor's inventory.");
ui.notifications.info(`${actor.name} receives Fey-Infused Plant Food. Four carried ingredients were consumed.`);
