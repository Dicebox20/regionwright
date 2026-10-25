/*
 * Regionwright package-owned injection macro.
 * Run once as the elected GM in the Into the Feywild world. It creates or
 * updates one GM-owned HUD macro, verifies the native Macro readback, and
 * opens the HUD immediately. The HUD's default scope is all active players
 * plus this GM.
 */
const expectedWorldId = "the-lost-mine-of-phandalin";
const expectedFoundry = "14.367";
const expectedSystem = "dnd5e@5.3.3";
const macroId = "regionwright-puzzle-hud-into-feywild-v1";
const legacyMacroIds = new Set(["regionwright-puzzle-hud-v1"]);
const cacheKey = "rw-0.1.5-20260822-minigames-3";
const command = `/* Regionwright package-owned GM macro: deploy a selected puzzle to all active players + this GM. */
let hud = game.modules.get("regionwright-puzzles-locks")?.api?.puzzleHUD;
if (typeof hud?.open !== "function") {
  const runtime = await import("modules/regionwright-puzzles-locks/scripts/puzzle-hud.js?${cacheKey}");
  hud = runtime.puzzleHUD;
}
if (typeof hud?.open !== "function") throw new Error("Regionwright Puzzle HUD is unavailable.");
if (!game.user?.isGM) throw new Error("Only a GM can deploy Regionwright puzzles.");
await hud.open();`;

const foundryVersion = String(game.version ?? game.release?.version ?? "");
const systemVersion = `${game.system?.id ?? ""}@${game.system?.version ?? ""}`;
if (game.world?.id !== expectedWorldId || foundryVersion !== expectedFoundry || systemVersion !== expectedSystem) {
  ui.notifications.error(`Blocked: this injection is only for Into the Feywild (${expectedWorldId}), Foundry ${expectedFoundry}, ${expectedSystem}.`);
} else if (!game.user?.isGM) {
  ui.notifications.error("Blocked: the Puzzle HUD injection requires a GM.");
} else if (typeof game.modules.get("regionwright-puzzles-locks")?.api?.puzzleHUD?.open !== "function") {
  ui.notifications.error("Blocked: reload the reviewed Regionwright: Puzzles & Locks module first.");
} else {
  const owned = game.macros.contents.filter(macro => macro.flags?.regionwright?.puzzleHUD?.macroId === macroId || legacyMacroIds.has(macro.flags?.regionwright?.puzzleHUD?.macroId));
  const sameName = game.macros.contents.filter(macro => macro.name === "Regionwright Puzzle HUD");
  if (owned.length > 1) {
    ui.notifications.error("Blocked: duplicate owned Puzzle HUD macros detected; no change made.");
  } else if (owned.length === 0 && sameName.some(macro => !legacyMacroIds.has(macro.flags?.regionwright?.puzzleHUD?.macroId) && macro.flags?.regionwright?.puzzleHUD?.macroId !== macroId)) {
    ui.notifications.error("Blocked: a foreign Macro already uses the Regionwright Puzzle HUD name; no change made.");
  } else {
    const data = {
      name: "Regionwright Puzzle HUD",
      type: "script",
      command,
      img: "icons/svg/gamepad.svg",
      ownership: { default: 0, [game.user.id]: 3 },
      flags: { regionwright: { puzzleHUD: { macroId, version: "1.1.0", role: "gm-only-all-active-recipients", cacheKey } } }
    };
    const existing = owned[0];
    const result = existing ? await existing.update(data) : await Macro.create(data, { renderSheet: false });
    const readback = game.macros.contents.find(macro => macro.flags?.regionwright?.puzzleHUD?.macroId === macroId);
    const ownership = readback?.ownership?.toObject?.() ?? readback?.ownership ?? null;
    if (!readback || ownership?.default !== 0 || ownership?.[game.user.id] !== 3) {
      ui.notifications.error("Puzzle HUD injection failed authoritative Macro ownership readback.");
    } else {
      const receipt = { operation: "regionwright.puzzleHUD.inject", status: "PASS", worldId: game.world.id, macroId, uuid: readback.uuid, created: existing ? 0 : 1, updated: existing ? 1 : 0, ownership, defaultScope: "all-active-players-plus-gm", playerFacing: false };
      console.info("Regionwright Puzzle HUD injection receipt", receipt);
      ui.notifications.info(`${existing ? "Updated" : "Created"} the GM Regionwright Puzzle HUD. Opening it now.`);
      await game.modules.get("regionwright-puzzles-locks")?.api?.puzzleHUD?.open?.();
    }
  }
}

