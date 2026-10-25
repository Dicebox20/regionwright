/* Regionwright package-owned GM macro: complete minigame catalog HUD v2. */
let hud = game.modules.get("regionwright-puzzles-locks")?.api?.puzzleHUD;
if (typeof hud?.catalog !== "function") {
    const runtime = await import("modules/regionwright-puzzles-locks/scripts/puzzle-hud.js?rw-0.1.5-20260822-minigames-3");
  hud = runtime.puzzleHUD;
}
if (typeof hud?.open !== "function" || typeof hud?.catalog !== "function") {
  ui.notifications.error("Regionwright Puzzle HUD is unavailable.");
} else if (!game.user?.isGM) {
  ui.notifications.warn("Only a GM can deploy Regionwright puzzles.");
} else {
  await hud.open();
}

