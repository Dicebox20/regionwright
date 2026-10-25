export const MODULE_ID = "regionwright-puzzles-locks";
export const PUZZLE_FLAG_SCOPE = "regionwright";
export const PUZZLE_WRITE_SETTING = "enablePuzzleWrites";
export const LEGACY_PUZZLE_WRITE_SETTING = "enablePuzzleWrites";
export const SETTINGS_MIGRATED_SETTING = "legacySettingsMigrated";
export const PUZZLE_API_VERSION = "1.1.0";

export function regionWritesEnabled() {
  try { return globalThis.game?.settings?.get?.("regionwright", "enableRegionWrites") === true; }
  catch (_error) { return false; }
}
