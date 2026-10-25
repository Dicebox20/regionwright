/* Regionwright: Hunting & Gathering player fishing macro. */
const fishing = game.modules.get("regionwright-hunting-gathering")?.api?.fishing;
const region = canvas.regions?.controlled?.[0]?.document;
const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character;
if (typeof fishing?.open !== "function") {
  ui.notifications.error("Enable Regionwright: Hunting & Gathering first.");
} else if (!region) {
  ui.notifications.warn("Select or click a configured Fishing Region first.");
} else {
  await fishing.open({ region, actor });
}
