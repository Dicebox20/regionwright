// Run from Foundry's Macro bar after enabling Regionwright Region writes.
// Example: await game.modules.get("regionwright").api.tests.run({ behaviorKey: "teleport" });

const api = game.modules.get("regionwright")?.api;
if (!api) return ui.notifications.error("Regionwright is not active.");

const result = await api.tests.run({ behaviorKey: "teleport" });
console.table([result]);
ui.notifications.info(`Regionwright test: ${result.status}. See the browser console for the report.`);
