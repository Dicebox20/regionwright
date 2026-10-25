export const MODULE_ID = "regionwright";
export const PLAN_SCHEMA_VERSION = "1.0";
export const CAPABILITY_SCHEMA_VERSION = "1.0";
export const REGION_FLAG = "regionwright";
export const WRITE_SETTING = "enableRegionWrites";
export const LEGACY_PUZZLE_WRITE_SETTING = "enablePuzzleWrites";
export const DIAGNOSTIC_SETTING = "enableDiagnosticLogging";
export const PREVIEW_SETTING = "previewDetail";
export const STUDIO_DRAFT_SETTING = "studioDraft";
export const STUDIO_FACTS_SETTING = "studioStoryFacts";

export const ALLOWLISTED_BEHAVIOR_TYPES = Object.freeze([
  "adjustDarknessLevel",
  "applyActiveEffect",
  "changeLevel",
  "defineSurface",
  "displayScrollingText",
  "dnd5e.difficultTerrain",
  "executeMacro",
  "executeScript",
  "modifyMovementCost",
  "pauseGame",
  "suppressWeather",
  "teleportToken",
  "toggleBehavior"
]);
