/* Regionwright package-owned GM transport: Ballad Ascendancy behavior repair v1. */
const api = game.modules.get("regionwright")?.api?.premium?.ascendancy?.ballad;
if (!api) { ui.notifications.error("Regionwright premium Ballad adapter is unavailable."); } else { await api.openBehaviorRepair(); }
