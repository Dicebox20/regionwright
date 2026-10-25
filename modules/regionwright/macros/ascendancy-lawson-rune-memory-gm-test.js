/* Regionwright package-owned GM transport: Lawson Rune Memory test v1. */
const api = game.modules.get("regionwright")?.api?.premium?.ascendancy;
if (!api?.open) {
  ui.notifications.error("Regionwright Ascendancy puzzle API is unavailable.");
} else {
  await api.open("dbx:puzzle:lawson-rune-memory");
}
