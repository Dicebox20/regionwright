import { MODULE_ID, PUZZLE_API_VERSION, PUZZLE_WRITE_SETTING, SETTINGS_MIGRATED_SETTING, LEGACY_PUZZLE_WRITE_SETTING } from "./constants.js";
import { createPuzzleAPI } from "./api.js";
import { installLockpickDoorControl, installLockpickSocket } from "./lockpicking.js";
import { installRotatingLockDoorControl, installRotatingLockSocket } from "./rotating-lock.js";
import { installLaserGridDoorControl, installLaserGridSocket } from "./laser-grid.js";
import { installTimingDialDoorControl, installTimingDialSocket } from "./timing-dial.js";
import { installIngredientMixingDoorControl, installIngredientMixingTileControl, installIngredientMixingSocket } from "./ingredient-mixing.js";
import { installSpineMosaicDoorControl, installSpineMosaicTileControl, installSpineMosaicSocket } from "./spine-mosaic.js";
import { installSlidingMosaicDoorControl, installSlidingMosaicTileControl, installSlidingMosaicSocket } from "./sliding-mosaic.js";
import { installPuzzleHUDSocket } from "./puzzle-hud.js";
import { registerPuzzleHubControl, openPuzzleHub } from "./puzzle-hub.js";

const api = createPuzzleAPI({ openPuzzleHub });
const installs = [installLockpickSocket, installRotatingLockSocket, installLaserGridSocket, installTimingDialSocket, installIngredientMixingSocket, installSpineMosaicSocket, installSlidingMosaicSocket, installPuzzleHUDSocket];
function installSockets() { for (const install of installs) install(); }
function installTargetControls() {
  installLockpickDoorControl();
  installRotatingLockDoorControl();
  installLaserGridDoorControl();
  installTimingDialDoorControl();
  installIngredientMixingDoorControl();
  installIngredientMixingTileControl();
  installSpineMosaicDoorControl();
  installSpineMosaicTileControl();
  installSlidingMosaicDoorControl();
  installSlidingMosaicTileControl();
}
async function migrateLegacySettings() {
  const settings = globalThis.game?.settings;
  if (!globalThis.game?.user?.isGM || globalThis.game?.users?.activeGM && globalThis.game.users.activeGM.id !== globalThis.game.user.id || !settings) return;
  if (settings.get(MODULE_ID, SETTINGS_MIGRATED_SETTING) === true) return;
  let legacyValue = false;
  try { legacyValue = settings.get("regionwright", LEGACY_PUZZLE_WRITE_SETTING) === true; } catch { /* The legacy module may be absent. */ }
  if (legacyValue && settings.get(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) await settings.set(MODULE_ID, PUZZLE_WRITE_SETTING, true);
  await settings.set(MODULE_ID, SETTINGS_MIGRATED_SETTING, true);
}
async function migrateLegacyMacroPaths() {
  const game = globalThis.game;
  if (!game?.user?.isGM || game?.users?.activeGM && game.users.activeGM.id !== game.user.id) return { updated: 0, failed: [] };
  let updated = 0;
  const failed = [];
  for (const macro of game.macros ?? []) {
    const command = String(macro?.command ?? "");
    const migrated = command.replaceAll(
      "modules/regionwright/premium/scripts/puzzle-hud.js",
      "modules/regionwright-puzzles-locks/scripts/puzzle-hud.js"
    );
    if (migrated === command || typeof macro?.update !== "function") continue;
    try {
      await macro.update({ command: migrated });
      updated++;
    } catch (error) {
      const uuid = String(macro.uuid ?? macro.id ?? macro._id ?? "unknown macro");
      failed.push(uuid);
      console.error(`${MODULE_ID} | Legacy Puzzle HUD macro migration failed for ${uuid}; it will be retried on the next active-GM startup.`, error);
    }
  }
  return { updated, failed };
}
function registerSettings() {
  game.settings.register(MODULE_ID, PUZZLE_WRITE_SETTING, { name: "Puzzles & Locks: Enable puzzle writes", hint: "Allow the active GM to configure or remove puzzle state on selected Scene documents.", scope: "world", config: true, type: Boolean, default: false });
  game.settings.register(MODULE_ID, SETTINGS_MIGRATED_SETTING, { name: "Puzzles & Locks: legacy settings migrated", scope: "world", config: false, type: Boolean, default: false });
}
function exposeAPI() { const module = globalThis.game?.modules?.get?.(MODULE_ID); if (module) module.api = api; }

Hooks.on("getSceneControlButtons", controls => registerPuzzleHubControl(controls));
Hooks.once("init", () => {
  registerSettings();
  exposeAPI();
  installSockets();
  installTargetControls();
});
Hooks.once("ready", () => {
  exposeAPI();
  installSockets();
  installTargetControls();
  void migrateLegacySettings().catch(error => console.error(`${MODULE_ID} | Legacy setting migration failed.`, error));
  void migrateLegacyMacroPaths()
    .then(result => {
      if (result.updated) console.info(`${MODULE_ID} | Updated ${result.updated} legacy Puzzle HUD macro path${result.updated === 1 ? "" : "s"}.`);
      if (result.failed.length) console.error(`${MODULE_ID} | ${result.failed.length} macro path update${result.failed.length === 1 ? "" : "s"} can be retried on the next active-GM startup.`);
    })
    .catch(error => console.error(`${MODULE_ID} | Legacy macro path migration failed.`, error));
  Hooks.callAll(`${MODULE_ID}.ready`, api);
  console.info(`${MODULE_ID} ready (API ${PUZZLE_API_VERSION}).`);
});
Hooks.on("canvasReady", () => { installSockets(); installTargetControls(); });
