/* Regionwright package-owned GM installer: creates or updates the fixed Puzzle HUD macro. */
const expectedWorldId = "the-ballad-of-chauser-bill";
const expectedFoundry = "14.367";
const expectedSystem = "dnd5e@5.3.3";
const macroId = "regionwright-puzzle-hud-v1";
const command = `/* Regionwright package-owned GM macro: complete minigame catalog HUD v2. */
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
}`;

const foundryVersion = String(game.version ?? game.release?.version ?? "");
const systemVersion = `${game.system?.id ?? ""}@${game.system?.version ?? ""}`;
if (game.world?.id !== expectedWorldId || foundryVersion !== expectedFoundry || systemVersion !== expectedSystem) {
  ui.notifications.error(`Blocked: this installer is only for ${expectedWorldId}, Foundry ${expectedFoundry}, ${expectedSystem}.`);
} else if (!game.user?.isGM) {
  ui.notifications.error("Blocked: the Puzzle HUD installer requires a GM.");
} else if (typeof game.modules.get("regionwright-puzzles-locks")?.api?.puzzleHUD?.open !== "function") {
  ui.notifications.error("Blocked: the loaded Regionwright Puzzle HUD runtime is unavailable. Reload the reviewed module first.");
} else {
  const owned = game.macros.contents.filter((macro) => macro.flags?.regionwright?.puzzleHUD?.macroId === macroId);
  const sameName = game.macros.contents.filter((macro) => macro.name === "Regionwright Puzzle HUD");
  if (owned.length > 1) {
    ui.notifications.error("Blocked: duplicate Regionwright Puzzle HUD macros detected; no change made.");
  } else if (owned.length === 0 && sameName.some((macro) => macro.flags?.regionwright?.puzzleHUD?.macroId !== macroId)) {
    ui.notifications.error("Blocked: a foreign macro already uses the Regionwright Puzzle HUD name; no change made.");
  } else {
    const data = {
      name: "Regionwright Puzzle HUD",
      type: "script",
      command,
      img: "icons/svg/ puzzle.svg".replace(" ", ""),
      ownership: { default: 0, [game.user.id]: 3 },
      flags: {
        regionwright: {
          puzzleHUD: {
            macroId,
            version: "1.0.0",
            role: "gm-only-transport"
          }
        }
      }
    };
    const macro = owned[0];
    const result = macro
      ? await macro.update(data)
      : await Macro.create(data, { renderSheet: false });
    const readback = game.macros.contents.find((entry) => entry.flags?.regionwright?.puzzleHUD?.macroId === macroId);
    if (!readback) {
      ui.notifications.error("Puzzle HUD installer did not produce an authoritative Macro readback.");
    } else {
      ui.notifications.info(`${macro ? "Updated" : "Created"} GM-only Regionwright Puzzle HUD (${readback.uuid}).`);
      console.info("Regionwright Puzzle HUD install receipt", {
        operation: "regionwright.puzzleHUD.install",
        worldId: game.world.id,
        status: "PASS",
        created: macro ? 0 : 1,
        updated: macro ? 1 : 0,
        macroId,
        uuid: readback.uuid,
        ownership: readback.ownership.toObject?.() ?? readback.ownership,
        playerFacing: false
      });
    }
  }
}

