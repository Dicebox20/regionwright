/**
 * Iggwilv's Tower — Regionwright puzzle setup
 *
 * Run one section at a time as a Foundry Script Macro after selecting exactly
 * one existing interaction Region on the named scene. This intentionally does
 * not create geometry: its target must be aligned to the approved map art by
 * the GM, rather than guessing an object coordinate and obscuring a doorway.
 *
 * Requires Regionwright: Studio to be enabled in Into the Feywild.
 */

const rw = game.modules.get("regionwright")?.api;
if (!rw?.premium?.ingredientMixing || !rw?.premium?.spineMosaic) {
  throw new Error("Enable Regionwright: Studio, then reload the Foundry world before using this setup.");
}

await game.settings.set("regionwright", "enablePuzzleWrites", true);
await game.settings.set("regionwright", "enableRegionWrites", true);

const selectedRegion = () => {
  const regions = [...(canvas?.regions?.controlled ?? [])];
  if (regions.length !== 1) throw new Error("Select exactly one interaction Region on the current scene.");
  return regions[0].document ?? regions[0];
};

/*
 * 1. Witch's Laboratory — create and select a small Region over the
 *    workbench/cauldron, then run this block. The guide's actual recipe is
 *    one measure of each component; tolerance 0 rejects substitutes.
 */
if (canvas.scene.name === "Iggwilv Tower — Witch's Laboratory") {
  const region = selectedRegion();
  await region.update({ name: "Iggwilv Puzzle — Fey-Infused Plant Food" });
  await rw.premium.ingredientMixing.configure({
    target: region,
    tolerance: 0,
    ingredients: [
      { name: "Red Leaf Fern", target: 1 },
      { name: "Epsom Salts", target: 1 },
      { name: "Blood Meal", target: 1 },
      { name: "Calcium-Rich Bone Meal", target: 1 }
    ]
  });
  ui.notifications.info("Fey-Infused Plant Food mixing is armed. Award the result manually when solved.");
}

/*
 * 2. Hidden Library — create and select a Region over the enchanted bookcase,
 *    then run this block. The listed order is the revealed mural/book-spine
 *    order. It is intentionally lore-flavoured rather than a visible reward.
 */
if (canvas.scene.name === "Iggwilv Tower — Hidden Library") {
  const region = selectedRegion();
  await region.update({ name: "Iggwilv Puzzle — Hidden Library Bookcase" });
  await rw.premium.spineMosaic.configure({
    target: region,
    seed: "iggwilv-hidden-library",
    books: [
      "Moonlit Bargains",
      "Crown of the Witch Queen",
      "Rose Door Reveries",
      "Keys of the Ninefold Path",
      "The Fallen Star",
      "Tides Beyond the Astral"
    ]
  });
  ui.notifications.info("Hidden Library Spine Mosaic is armed. Reveal or award Black Tallow Candles when solved.");
}

if (!["Iggwilv Tower — Witch's Laboratory", "Iggwilv Tower — Hidden Library"].includes(canvas.scene.name)) {
  throw new Error("Open the Witch's Laboratory or Hidden Library scene first.");
}
