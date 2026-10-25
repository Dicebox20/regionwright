import { MODULE_ID, STUDIO_DRAFT_SETTING } from "./constants.js";
import { createScenarioBlueprint, validateScenarioBlueprint } from "./studio.js";

function settingsFor(settings) {
  return settings ?? globalThis.game?.settings ?? null;
}

function parseDraft(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

export function normalizeStudioDraft(raw, { capabilities } = {}) {
  const parsed = parseDraft(raw);
  if (!parsed) return null;
  try { return validateScenarioBlueprint(parsed, { capabilities }); } catch { return null; }
}

/**
 * World-setting backed draft storage. It stores only the portable blueprint;
 * no Region, Door, Tile, Actor, or other Foundry document is changed.
 */
export function createStudioDraftStore({ settings, isGM, capabilities } = {}) {
  const canWrite = () => (typeof isGM === "function" ? isGM() : isGM ?? globalThis.game?.user?.isGM === true);
  const getSettings = () => settingsFor(settings);
  return Object.freeze({
    async load() {
      const current = getSettings();
      if (typeof current?.get !== "function") return null;
      return normalizeStudioDraft(current.get(MODULE_ID, STUDIO_DRAFT_SETTING), { capabilities });
    },
    async save(blueprint) {
      if (!canWrite()) throw new Error("Only a GM can save a Studio draft.");
      const current = getSettings();
      if (typeof current?.set !== "function") throw new Error("Studio draft storage is not available in this Foundry session.");
      const normalized = createScenarioBlueprint(blueprint, { capabilities });
      await current.set(MODULE_ID, STUDIO_DRAFT_SETTING, JSON.stringify(normalized));
      return normalized;
    },
    async clear() {
      if (!canWrite()) throw new Error("Only a GM can clear a Studio draft.");
      const current = getSettings();
      if (typeof current?.set !== "function") throw new Error("Studio draft storage is not available in this Foundry session.");
      await current.set(MODULE_ID, STUDIO_DRAFT_SETTING, "");
      return true;
    }
  });
}
