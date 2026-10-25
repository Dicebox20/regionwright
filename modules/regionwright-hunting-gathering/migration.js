export const CANONICAL_MODULE_ID = "regionwright-hunting-gathering";
export const LEGACY_MODULE_IDS = Object.freeze({
  fishing: Object.freeze(["regionwright-fishing", "regionwright"]),
  mining: Object.freeze(["regionwright-mining"])
});
const LEGACY_PATHS = Object.freeze([
  Object.freeze(["modules/regionwright-fishing/", "modules/regionwright-hunting-gathering/"]),
  Object.freeze(["modules/regionwright-mining/", "modules/regionwright-hunting-gathering/"]),
  Object.freeze(["modules/regionwright/assets/fishing/", "modules/regionwright-hunting-gathering/assets/fishing/"]),
  Object.freeze(["modules/regionwright/scripts/fishing.js", "modules/regionwright-hunting-gathering/scripts/fishing.js"]),
  Object.freeze(["modules/regionwright/scripts/fishing-engine.js", "modules/regionwright-hunting-gathering/scripts/fishing-engine.js"])
]);

const clone = value => {
  if (value === undefined) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

function documents(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.contents)) return collection.contents;
  try { return Array.from(collection.values?.() ?? collection); } catch (_error) { return []; }
}

function sourceFlags(document) {
  return document?.flags ?? document?._source?.flags ?? {};
}

function rewriteLegacyPaths(value) {
  if (typeof value === "string") {
    let rewritten = value;
    let count = 0;
    for (const [legacy, canonical] of LEGACY_PATHS) {
      const matches = rewritten.split(legacy).length - 1;
      if (!matches) continue;
      rewritten = rewritten.replaceAll(legacy, canonical);
      count += matches;
    }
    return { value: rewritten, count };
  }
  if (Array.isArray(value)) {
    let count = 0;
    const rewritten = value.map(entry => {
      const result = rewriteLegacyPaths(entry);
      count += result.count;
      return result.value;
    });
    return { value: rewritten, count };
  }
  if (value && typeof value === "object") {
    let count = 0;
    const rewritten = {};
    for (const [key, entry] of Object.entries(value)) {
      const result = rewriteLegacyPaths(entry);
      rewritten[key] = result.value;
      count += result.count;
    }
    return { value: rewritten, count };
  }
  return { value, count: 0 };
}

async function rewriteDocumentPaths(document) {
  const updates = {};
  let count = 0;
  for (const field of ["img", "command"]) {
    const value = document?.[field];
    if (typeof value !== "string") continue;
    const result = rewriteLegacyPaths(value);
    if (!result.count) continue;
    updates[field] = result.value;
    count += result.count;
  }

  const flags = sourceFlags(document);
  for (const scope of ["regionwright", "regionwright-fishing", "regionwright-mining", CANONICAL_MODULE_ID]) {
    for (const [key, value] of Object.entries(flags[scope] ?? {})) {
      const result = rewriteLegacyPaths(value);
      if (!result.count) continue;
      updates[`flags.${scope}.${key}`] = result.value;
      count += result.count;
    }
  }

  if (count && typeof document?.update === "function") await document.update(updates);
  return count;
}

async function migrateKeys(document, scopes, keys) {
  const flags = sourceFlags(document);
  const canonical = flags[CANONICAL_MODULE_ID] ?? {};
  const updates = {};
  let moved = 0;

  for (const key of keys) {
    if (canonical[key] !== undefined && canonical[key] !== null) {
      const result = rewriteLegacyPaths(canonical[key]);
      if (result.count) updates[`flags.${CANONICAL_MODULE_ID}.${key}`] = result.value;
      continue;
    }
    for (const scope of scopes) {
      const value = flags[scope]?.[key];
      if (value === undefined || value === null) continue;
      updates[`flags.${CANONICAL_MODULE_ID}.${key}`] = rewriteLegacyPaths(clone(value)).value;
      moved++;
      break;
    }
  }

  for (const scope of scopes) {
    for (const key of keys) {
      if (flags[scope]?.[key] !== undefined) updates[`flags.${scope}.${key}`] = null;
    }
  }

  if (!Object.keys(updates).length || typeof document?.update !== "function") return 0;
  await document.update(updates);
  return moved;
}

async function migrateRegion(region) {
  return (await migrateKeys(region, LEGACY_MODULE_IDS.fishing, ["fishingSpot", "injection"]))
    + (await migrateKeys(region, LEGACY_MODULE_IDS.mining, ["miningDeposit"]));
}

async function migrateItem(item) {
  return (await migrateKeys(item, LEGACY_MODULE_IDS.fishing, ["fishing", "bait", "fishingGear", "fishingTackle"]))
    + (await migrateKeys(item, LEGACY_MODULE_IDS.mining, ["ore", "pickaxe", "managedWorldOre"]));
}

async function migrateMacro(macro) {
  return migrateKeys(macro, [...LEGACY_MODULE_IDS.fishing, ...LEGACY_MODULE_IDS.mining], ["srdImageMacro", "setupMacro", "resetSceneMacro"]);
}

/** Move subsystem-owned flags into the consolidated module without touching unrelated flags. */
export async function migrateLegacyFlags(game = globalThis.game) {
  if (!game?.user?.isGM) return { updated: 0, moved: 0, assetPaths: 0, failed: [], skipped: true };
  let updated = 0;
  let moved = 0;
  let assetPaths = 0;
  const failed = [];
  const migrate = async (document, fn) => {
    if (!document) return;
    try {
      const count = await fn(document);
      if (count) { updated++; moved += count; }
      const rewritten = await rewriteDocumentPaths(document);
      if (rewritten) { updated++; assetPaths += rewritten; }
    } catch (error) {
      const uuid = String(document.uuid ?? document.id ?? document._id ?? "unknown document");
      failed.push(uuid);
      console.error(`${CANONICAL_MODULE_ID} | Legacy migration failed for ${uuid}; it will be retried on the next active-GM startup.`, error);
    }
  };

  for (const scene of documents(game.scenes)) {
    await migrate(scene, async () => 0);
    for (const region of documents(scene?.regions)) await migrate(region, migrateRegion);
  }
  for (const actor of documents(game.actors)) {
    await migrate(actor, migrateItem);
    for (const item of documents(actor?.items)) await migrate(item, migrateItem);
  }
  for (const item of documents(game.items)) await migrate(item, migrateItem);
  for (const macro of documents(game.macros)) await migrate(macro, migrateMacro);
  return { updated, moved, assetPaths, failed, skipped: false };
}
