import { ALLOWLISTED_BEHAVIOR_TYPES, CAPABILITY_SCHEMA_VERSION } from "./constants.js";

export function buildCapabilitySnapshot({ config = globalThis.CONFIG } = {}) {
  const registeredBehaviorTypes = Object.keys(config?.RegionBehavior?.dataModels ?? {}).sort();
  const registered = new Set(registeredBehaviorTypes);
  const supportedBehaviorTypes = ALLOWLISTED_BEHAVIOR_TYPES.filter(type => registered.has(type));
  return {
    schemaVersion: CAPABILITY_SCHEMA_VERSION,
    regionBehaviorRegistry: Boolean(config?.RegionBehavior?.dataModels),
    registeredBehaviorTypes,
    supportedBehaviorTypes,
    missingBehaviorTypes: ALLOWLISTED_BEHAVIOR_TYPES.filter(type => !registered.has(type)),
    teleportRegistered: registered.has("teleportToken"),
    arbitraryScriptGeneration: false,
    arbitraryMacroGeneration: false
  };
}
