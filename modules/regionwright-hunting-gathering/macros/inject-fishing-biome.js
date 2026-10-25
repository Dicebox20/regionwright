/* Regionwright: Hunting & Gathering Fishing GM macro.
 * Select or highlight a Region on the Regions layer, then open the compact
 * biome-button HUD.
 */
const fishingBiomes = game.modules.get("regionwright-hunting-gathering")?.api?.fishing ?? game.modules.get("regionwright-hunting-gathering")?.api;
if (typeof fishingBiomes?.openSetup !== "function") {
  ui.notifications.error("Enable Regionwright: Hunting & Gathering first.");
} else {
  await fishingBiomes.openSetup();
}
