import { ALLOWLISTED_BEHAVIOR_TYPES } from "./constants.js";

const DEFINITIONS = Object.freeze([
  {
    key: "darkness",
    label: "Adjust Darkness Level",
    type: "adjustDarknessLevel",
    mode: "broadcast",
    category: "environment",
    writable: true,
    parameterHint: "mode, modifier, and optional edge blur"
  },
  {
    key: "active-effects",
    label: "Apply Active Effects",
    type: "applyActiveEffect",
    mode: "broadcast",
    category: "effects",
    writable: true,
    parameterHint: "explicit Active Effect UUIDs from a selected world Item"
  },
  {
    key: "change-level",
    label: "Change Level",
    type: "changeLevel",
    mode: "broadcast",
    category: "traversal",
    writable: true,
    parameterHint: "prompt a Token to move between Scene Levels"
  },
  {
    key: "define-surface",
    label: "Define Surface",
    type: "defineSurface",
    mode: "broadcast",
    category: "environment",
    writable: true,
    parameterHint: "define how light, movement, sight, or sound interact with the Region"
  },
  {
    key: "scrolling-text",
    label: "Display Scrolling Text",
    type: "displayScrollingText",
    mode: "broadcast",
    category: "feedback",
    writable: true,
    parameterHint: "text, event, visibility, color, and once"
  },
  {
    key: "difficult-terrain",
    label: "D&D5e Difficult Terrain",
    type: "dnd5e.difficultTerrain",
    mode: "broadcast",
    category: "system",
    writable: true,
    parameterHint: "magical flag and optional creature filters"
  },
  {
    key: "execute-macro",
    label: "Execute Macro",
    type: "executeMacro",
    mode: "advanced",
    category: "advanced",
    advanced: true,
    writable: true,
    parameterHint: "existing Macro UUID, trigger event, and execution audience"
  },
  {
    key: "execute-script",
    label: "Execute Script",
    type: "executeScript",
    mode: "advanced",
    category: "advanced",
    advanced: true,
    writable: true,
    parameterHint: "GM-entered script source and trigger event"
  },
  {
    key: "movement-cost",
    label: "Modify Movement Cost",
    type: "modifyMovementCost",
    mode: "broadcast",
    category: "environment",
    writable: true,
    parameterHint: "movement action multipliers"
  },
  {
    key: "pause",
    label: "Pause Game",
    type: "pauseGame",
    mode: "broadcast",
    category: "feedback",
    writable: true,
    parameterHint: "once"
  },
  {
    key: "suppress-weather",
    label: "Suppress Weather",
    type: "suppressWeather",
    mode: "broadcast",
    category: "environment",
    writable: true,
    parameterHint: "no parameters"
  },
  {
    key: "teleport",
    label: "Teleport Token",
    type: "teleportToken",
    mode: "broadcast",
    category: "traversal",
    writable: true,
    parameterHint: "destination Region UUID, optional choice, and entry event"
  },
  {
    key: "toggle-behavior",
    label: "Toggle Behavior",
    type: "toggleBehavior",
    mode: "broadcast",
    category: "traversal",
    writable: true,
    parameterHint: "enable or disable another Behavior by UUID"
  }
]);

export function behaviorCatalog({ config = globalThis.CONFIG } = {}) {
  const registered = new Set(Object.keys(config?.RegionBehavior?.dataModels ?? {}));
  return DEFINITIONS.map(definition => ({
    ...definition,
    allowlisted: ALLOWLISTED_BEHAVIOR_TYPES.includes(definition.type),
    available: registered.has(definition.type),
    status: registered.has(definition.type) ? "available" : "unavailable"
  }));
}

export function getBehaviorDefinition(key) {
  return DEFINITIONS.find(definition => definition.key === key) ?? null;
}

export { DEFINITIONS as BEHAVIOR_DEFINITIONS };
