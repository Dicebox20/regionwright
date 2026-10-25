import { MODULE_ID, STUDIO_FACTS_SETTING } from "./constants.js";

export const STORY_FACTS_VERSION = 1;

function text(value, fallback = "") { return String(value ?? fallback).trim(); }
function clone(value) { return structuredClone(value ?? {}); }
function plainObject(value) { return value && typeof value === "object" && !Array.isArray(value); }

/** Convert a short human label into a stable internal key. */
export function storyFactId(value) {
  const slug = text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!slug) throw new Error("Give this story fact a short name.");
  return `fact.${slug}`;
}

export function normalizeStoryFact(input) {
  if (!plainObject(input)) throw new Error("A story fact must be an object.");
  const label = text(input.label);
  if (!label || label.length > 80) throw new Error("A story fact needs a name of 80 characters or fewer.");
  const id = text(input.id) || storyFactId(label);
  if (!/^fact\.[a-z0-9][a-z0-9.-]{0,62}$/.test(id)) throw new Error("Story fact ids must use the Regionwright fact format.");
  return Object.freeze({ id, label, value: input.value === true, updatedAt: Number.isFinite(Number(input.updatedAt)) ? Number(input.updatedAt) : null });
}

function parse(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

/** Validate the small, world-setting-backed story-fact document. */
export function normalizeStoryFacts(raw) {
  const parsed = parse(raw);
  const values = Array.isArray(parsed?.facts) ? parsed.facts : Object.values(parsed?.facts ?? {});
  const facts = {};
  for (const item of values) {
    try {
      const fact = normalizeStoryFact(item);
      facts[fact.id] = fact;
    } catch { /* ignore malformed persisted entries rather than corrupt the whole world state */ }
  }
  return Object.freeze({ version: STORY_FACTS_VERSION, facts: Object.freeze(facts) });
}

function settingsFor(settings) { return settings ?? globalThis.game?.settings ?? null; }

/** GM-only persistence for understandable Studio facts such as "West Orb placed". */
export function createStoryFactStore({ settings, isGM, now = () => Date.now() } = {}) {
  const canWrite = () => (typeof isGM === "function" ? isGM() : isGM ?? globalThis.game?.user?.isGM === true);
  const getSettings = () => settingsFor(settings);
  const read = () => normalizeStoryFacts(getSettings()?.get?.(MODULE_ID, STUDIO_FACTS_SETTING));
  const write = async state => {
    const current = getSettings();
    if (typeof current?.set !== "function") throw new Error("Story fact storage is not available in this Foundry session.");
    await current.set(MODULE_ID, STUDIO_FACTS_SETTING, JSON.stringify(state));
    return state;
  };
  return Object.freeze({
    load: () => read(),
    list: () => Object.freeze(Object.values(read().facts).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))),
    async set(input) {
      if (!canWrite()) throw new Error("Only a GM can change Studio story facts.");
      const fact = normalizeStoryFact({ ...clone(input), updatedAt: now() });
      const current = read();
      const next = { version: STORY_FACTS_VERSION, facts: { ...current.facts, [fact.id]: fact } };
      return (await write(next)).facts[fact.id];
    },
    async reset(ids = null) {
      if (!canWrite()) throw new Error("Only a GM can reset Studio story facts.");
      const current = read();
      const requested = ids === null ? Object.keys(current.facts) : new Set((Array.isArray(ids) ? ids : [ids]).map(value => text(value)).filter(Boolean));
      const facts = Object.fromEntries(Object.entries(current.facts).map(([id, fact]) => [id, requested === null || requested.includes?.(id) || requested.has?.(id) ? { ...fact, value: false, updatedAt: now() } : fact]));
      return write({ version: STORY_FACTS_VERSION, facts });
    },
    isTrue(id) { return read().facts[text(id)]?.value === true; }
  });
}
