/* Fishing Biomes & Minigame GM macro.
 * Scans active D&D 5e SRD Item compendia for creature artwork under
 * icons/creatures and assigns semantic matches to Fishing Gear & Bait entries.
 */
(async () => {
  try {
    if (!game.user?.isGM) return ui.notifications.warn("Only a GM can assign fishing item images.");
    const fishing = game.modules.get("regionwright-hunting-gathering")?.api?.fishing ?? game.modules.get("regionwright-hunting-gathering")?.api;
    if (typeof fishing?.assignSrdImages !== "function") return ui.notifications.error("Enable Regionwright: Hunting & Gathering first.");
    const result = await fishing.assignSrdImages();
    ui.notifications.info(`Fishing image assignment complete: ${result.updated} updated, ${result.reset ?? 0} reset, ${result.unchanged} unchanged, ${result.missing.length} unmatched.`);
  } catch (error) {
    console.error("[regionwright-hunting-gathering] SRD image assignment failed.", error);
    ui.notifications.error(`Fishing image assignment failed: ${error?.message ?? error}`);
  }
})();
