// Run from Foundry's Macro bar after enabling Regionwright Region writes.
// The active Scene is the source; the first other Scene is the destination.

const api = game.modules.get("regionwright")?.api;
if (!api) return ui.notifications.error("Regionwright is not active.");

const result = await api.tests.runSceneToSceneTeleport();
console.table([result]);
ui.notifications.info(`Regionwright Scene-to-Scene teleport test: ${result.status}. See the browser console for the report.`);
