/* Regionwright: Hunting & Gathering Fishing compatibility macro. The HUD is the preferred
 * setup surface; this opens it for a GM. */
const fishing = game.modules.get("regionwright-hunting-gathering")?.api;
if (!game.user?.isGM) {
  ui.notifications.error("Only a GM can configure fishing Regions.");
} else if (typeof fishing?.open !== "function") {
  ui.notifications.error("Enable Regionwright: Hunting & Gathering first.");
} else {
  fishing.open({ tab: "fishing" });
}
