/**
 * Fixed convenience Macro for Regionwright.
 * It delegates to the installed module and contains no behavior payloads or
 * generated code.
 */
const openBuilder = game.modules.get("regionwright")?.api?.openBuilder;
if (typeof openBuilder !== "function") {
  ui.notifications.error("Regionwright is not available in this world.");
} else {
  await openBuilder();
}
