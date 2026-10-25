import {
  BAIT_CATALOG,
  BIOME_ORDER,
  FISHING_BIOMES,
  createBaitItemSource,
  createFishingItemSources,
  getBiomeBait,
  getFishingBiome,
  normalizeBiomeId
} from "./fishing-catalog.js";
import { FISH_RARITIES, getPondTier, POND_TIER_ORDER, POND_TIERS } from "./fishing-rarity.js";
import {
  clearFishingRegion,
  configureFishingRegion,
  installFishingContainerGuard,
  installFishingRegionInteraction,
  installFishingSocket,
  prepareFishingTackle,
  isFishingRegion,
  openFishing,
  openFishingTest,
  openFishingTestForPlayer
} from "./fishing.js";
import {
  chooseSrdImage,
  createFishingImageMacroSource,
  FISHING_IMAGE_MACRO_ID,
  FISHING_IMAGE_MACRO_NAME,
  fishingItemIdentity,
  isDndSrdItemPack,
  isCreatureSrdImage
} from "./fishing-srd-images.js";

const MODULE_ID = "regionwright-hunting-gathering";
const LEGACY_MODULE_ID = "regionwright-fishing";
const FISHING_PACK_NAME = "fishing-items";
const FISHING_PACK_LABEL = "Fishing Gear & Bait";
const INJECTION_FLAG = "injection";
const INJECTION_VERSION = 2;
const SRD_IMAGE_MACRO_FLAG = "srdImageMacro";

const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function resolveRegion(regionOrUuid) {
  if (regionOrUuid?.documentName === "Region") return regionOrUuid;
  if (regionOrUuid) {
    const region = globalThis.fromUuidSync?.(regionOrUuid) ?? await globalThis.fromUuid?.(regionOrUuid);
    if (region?.documentName === "Region") return region;
  }
  const selected = globalThis.canvas?.regions?.controlled?.[0]?.document
    ?? globalThis.canvas?.regions?.placeables?.find(placeable => placeable.controlled)?.document;
  if (selected?.documentName === "Region") return selected;
  throw new Error("Select one Region on the Regions layer first.");
}

async function resolveActor(actorOrUuid) {
  if (actorOrUuid?.documentName === "Actor") return actorOrUuid;
  if (actorOrUuid) {
    const actor = globalThis.fromUuidSync?.(actorOrUuid) ?? await globalThis.fromUuid?.(actorOrUuid);
    if (actor?.documentName === "Actor") return actor;
  }
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor
    ?? globalThis.game?.user?.character
    ?? null;
}

function selectedRegion() {
  return globalThis.canvas?.regions?.controlled?.[0]?.document
    ?? globalThis.canvas?.regions?.placeables?.find(placeable => placeable.controlled)?.document
    ?? null;
}

function injectionData(region) {
  return region?.getFlag?.(MODULE_ID, INJECTION_FLAG)
    ?? region?.flags?.[MODULE_ID]?.[INJECTION_FLAG]
    ?? region?._source?.flags?.[MODULE_ID]?.[INJECTION_FLAG]
    ?? region?.flags?.[LEGACY_MODULE_ID]?.[INJECTION_FLAG]
    ?? region?._source?.flags?.[LEGACY_MODULE_ID]?.[INJECTION_FLAG]
    ?? region?.flags?.regionwright?.[INJECTION_FLAG]
    ?? region?._source?.flags?.regionwright?.[INJECTION_FLAG]
    ?? null;
}

async function injectRegion({ region: regionOrUuid, biome = "forest", pondTier = "common", bait = null, poleItemName = "Fishing Pole", tackleItemName = "Fishing Tackle" } = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can inject a fishing biome into a Region.");
  const region = await resolveRegion(regionOrUuid);
  const definition = getFishingBiome(biome);
  if (!definition) throw new Error(`Unknown fishing environment: ${biome}.`);
  const tier = getPondTier(pondTier);
  if (!tier) throw new Error(`Unknown fishing pond type: ${pondTier}.`);
  const baitDefinition = getBiomeBait(definition, bait);
  if (!baitDefinition) throw new Error(`No bait is configured for ${definition.label}.`);
  const configured = await configureFishingRegion({
    region,
    poleItemName,
    tackleItemName,
    baitItemName: baitDefinition.name,
    pondTier: tier.id,
    fish: definition.fish
  });
  const injection = {
    version: INJECTION_VERSION,
    biomeId: definition.id,
    pondTierId: tier.id,
    baitId: baitDefinition.id,
    baitItemName: baitDefinition.name,
    tackleItemName
  };
  await region.update({
    [`flags.${MODULE_ID}.${INJECTION_FLAG}`]: injection,
    [`flags.${LEGACY_MODULE_ID}.${INJECTION_FLAG}`]: null,
    [`flags.regionwright.${INJECTION_FLAG}`]: null
  });
  return { ...configured, definition, tier, bait: baitDefinition, injection };
}

async function injectSelectedRegion(options = {}) {
  return injectRegion({ ...options, region: options.region ?? selectedRegion() });
}

async function clearRegion(regionOrUuid) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can clear an injected fishing Region.");
  const region = await resolveRegion(regionOrUuid);
  await clearFishingRegion(region);
  await region.update({
    [`flags.${MODULE_ID}.${INJECTION_FLAG}`]: null,
    [`flags.${LEGACY_MODULE_ID}.${INJECTION_FLAG}`]: null,
    [`flags.regionwright.${INJECTION_FLAG}`]: null
  });
  return region;
}

async function createBaitForActor({ actor: actorOrUuid, bait: baitOrId, quantity = 3 } = {}) {
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before creating bait.");
  if (!globalThis.game?.user?.isGM && actor.isOwner !== true && !actor.testUserPermission?.(globalThis.game?.user, "OWNER")) {
    throw new Error("You do not have permission to add bait to this actor.");
  }
  const baitDefinition = typeof baitOrId === "object" ? baitOrId : BAIT_CATALOG[String(baitOrId ?? "")];
  if (!baitDefinition) throw new Error("Choose a bait from the fishing catalog.");
  const tackle = await prepareFishingTackle({ actor });
  const items = Array.from(actor.items?.values?.() ?? actor.items ?? []);
  const existing = items.find(item => item?.getFlag?.(MODULE_ID, "bait")?.baitId === baitDefinition.id)
    ?? items.find(item => item?.name?.toLocaleLowerCase?.() === baitDefinition.name.toLocaleLowerCase());
  const amount = Math.max(1, Math.floor(Number(quantity) || 1));
  if (existing) {
    const current = Math.max(0, Number(existing.system?.quantity ?? 1) || 0);
    const updates = { "system.quantity": current + amount };
    if (tackle && existing.system?.container !== tackle.id) updates["system.container"] = tackle.id;
    await existing.update(updates);
    return { actor, bait: baitDefinition, quantity: current + amount, item: existing, tackle };
  }
  const created = await actor.createEmbeddedDocuments("Item", [createBaitItemSource(baitDefinition, amount, { containerId: tackle?.id ?? null })]);
  return { actor, bait: baitDefinition, quantity: amount, item: created?.[0] ?? null, tackle };
}

function itemFlagIdentity(source) {
  const flags = source?.flags?.[MODULE_ID] ?? {};
  if (flags.bait?.baitId) return { flag: "bait", key: "baitId", value: flags.bait.baitId };
  if (flags.fishingGear?.gearId) return { flag: "fishingGear", key: "gearId", value: flags.fishingGear.gearId };
  if (flags.fishingTackle?.itemId) return { flag: "fishingTackle", key: "itemId", value: flags.fishingTackle.itemId };
  return null;
}

function sameFishingItem(item, source) {
  const identity = itemFlagIdentity(source);
  if (!identity) return false;
  return [MODULE_ID, LEGACY_MODULE_ID, "regionwright"].some(scope => {
    // Legacy scopes may no longer be registered after their modules are removed.
    const rawFlag = item?.flags?.[scope]?.[identity.flag]
      ?? item?._source?.flags?.[scope]?.[identity.flag];
    if (rawFlag !== undefined) return rawFlag?.[identity.key] === identity.value;
    try {
      return item?.getFlag?.(scope, identity.flag)?.[identity.key] === identity.value;
    } catch {
      return false;
    }
  });
}

export async function installFishingItems() {
  if (!globalThis.game?.user?.isGM) return { created: 0, existing: 0, skipped: true };
  const collection = globalThis.game.items;
  const ItemClass = collection?.documentClass ?? globalThis.Item;
  if (!ItemClass?.createDocuments) throw new Error("Foundry Item documents are unavailable.");
  const existingItems = Array.from(collection?.values?.() ?? collection ?? []);
  const sources = createFishingItemSources();
  const missing = sources.filter(source => !existingItems.some(item => sameFishingItem(item, source)));
  if (!missing.length) return { created: 0, existing: sources.length, skipped: false };
  const created = await ItemClass.createDocuments(missing);
  return { created: created?.length ?? missing.length, existing: sources.length - missing.length, skipped: false };
}

function packEntries(collection) {
  return collection?.values ? Array.from(collection.values()) : Array.from(collection ?? []);
}

function isWorldPack(pack) {
  return String(pack?.collection ?? "").startsWith("world.")
    || String(pack?.metadata?.package ?? "").toLocaleLowerCase() === "world";
}

function findFishingPack({ editableOnly = false } = {}) {
  const packs = globalThis.game?.packs;
  const entries = packEntries(packs);
  const candidates = entries.filter(pack => pack?.documentName === "Item" && pack?.metadata?.label === FISHING_PACK_LABEL);
  if (editableOnly) return candidates.find(isWorldPack) ?? null;
  return packs?.get?.(`${MODULE_ID}.${FISHING_PACK_NAME}`)
    ?? candidates.find(isWorldPack)
    ?? candidates[0]
    ?? null;
}

export async function ensureFishingCompendium() {
  if (!globalThis.game?.user?.isGM) return { created: 0, existing: 0, skipped: true, fallback: false };
  let pack = findFishingPack({ editableOnly: true });
  let fallback = false;
  if (!pack) {
    const CompendiumClass = globalThis.foundry?.documents?.collections?.CompendiumCollection
      ?? globalThis.CompendiumCollection;
    if (!CompendiumClass?.createCompendium) throw new Error("Foundry Compendium collections are unavailable.");
    pack = await CompendiumClass.createCompendium({
      name: FISHING_PACK_NAME,
      label: FISHING_PACK_LABEL,
      type: "Item",
      system: globalThis.game.system?.id ?? "dnd5e",
      ownership: { PLAYER: "OBSERVER", ASSISTANT: "OWNER" }
    });
    fallback = true;
  }
  const existing = await pack.getDocuments();
  const sources = createFishingItemSources();
  const missing = sources.filter(source => !existing.some(item => sameFishingItem(item, source)));
  if (!missing.length) return { created: 0, existing: sources.length, skipped: false, fallback, pack };
  const ItemClass = pack.documentClass ?? globalThis.Item;
  if (!ItemClass?.createDocuments) throw new Error("Foundry Item documents are unavailable for the fishing compendium.");
  const created = await ItemClass.createDocuments(missing, { pack: pack.collection });
  return { created: created?.length ?? missing.length, existing: sources.length - missing.length, skipped: false, fallback, pack };
}

async function collectSrdImageCandidates() {
  const packs = packEntries(globalThis.game?.packs).filter(isDndSrdItemPack);
  const candidates = [];
  const errors = [];
  for (const pack of packs) {
    let entries = [];
    try {
      const index = await pack.getIndex?.({ fields: ["name", "img", "type"] });
      entries = index?.values ? Array.from(index.values()) : Array.from(index ?? []);
      if (!entries.some(entry => isCreatureSrdImage(entry?.img)) && typeof pack.getDocuments === "function") {
        entries = await pack.getDocuments();
      }
      for (const entry of entries) {
        if (!isCreatureSrdImage(entry?.img)) continue;
        candidates.push({
          name: entry.name,
          img: entry.img,
          packLabel: pack.metadata?.label ?? pack.collection
        });
      }
    } catch (error) {
      errors.push(`${pack.metadata?.label ?? pack.collection}: ${error.message ?? error}`);
    }
  }
  return { candidates, packs: packs.map(pack => pack.metadata?.label ?? pack.collection).filter(Boolean), errors };
}

export async function assignFishingSrdImages() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can assign fishing compendium images.");
  let pack = findFishingPack({ editableOnly: true });
  if (!pack) pack = (await ensureFishingCompendium()).pack ?? findFishingPack({ editableOnly: true });
  if (!pack || !isWorldPack(pack)) throw new Error("An editable world Fishing Gear & Bait compendium is unavailable.");
  const fishingItems = await pack.getDocuments();
  const { candidates, packs, errors } = await collectSrdImageCandidates();
  if (!candidates.length) throw new Error("No usable icons/creatures images were found in the active D&D 5e SRD Item compendia.");

  const usedImages = new Set();
  const defaultImageByIdentity = new Map(
    createFishingItemSources()
      .map(source => [fishingItemIdentity(source), source.img])
      .filter(([identity]) => identity)
  );
  let updated = 0;
  let reset = 0;
  let unchanged = 0;
  const missing = [];
  for (const item of fishingItems) {
    if (!fishingItemIdentity(item)) continue;
    const match = chooseSrdImage(item.name, candidates, usedImages);
    if (!match) {
      missing.push(item.name);
      const fallbackImage = defaultImageByIdentity.get(fishingItemIdentity(item)) ?? "icons/svg/fish.svg";
      if (item.img !== fallbackImage) {
        await item.update({ img: fallbackImage });
        reset += 1;
      }
      continue;
    }
    usedImages.add(match.img);
    if (item.img === match.img) {
      unchanged += 1;
      continue;
    }
    await item.update({ img: match.img });
    updated += 1;
  }
  const result = { pack: pack.metadata?.label ?? pack.collection, sourcePacks: packs, candidates: candidates.length, updated, reset, unchanged, missing, errors };
  globalThis.ui?.notifications?.info?.(`Fishing SRD images: ${updated} updated, ${reset} reset, ${unchanged} already assigned${missing.length ? `, ${missing.length} without a match` : ""}.`);
  if (errors.length) console.warn(`[${MODULE_ID}] Some SRD image packs could not be read.`, errors);
  return result;
}

function macroDocuments() {
  return packEntries(globalThis.game?.macros);
}

async function assignFishingMacroToFreeHotbarSlot(macro) {
  const user = globalThis.game?.user;
  if (!macro?.id || typeof user?.assignHotbarMacro !== "function") return null;
  const hotbar = user.hotbar ?? {};
  const existingSlot = Object.entries(hotbar).find(([, macroId]) => macroId === macro.id);
  if (existingSlot) return Number(existingSlot[0]);
  const freeSlot = Array.from({ length: 10 }, (_, index) => index + 1).find(slot => !hotbar[slot] && !hotbar[String(slot)]);
  if (!freeSlot) return null;
  await user.assignHotbarMacro(macro, freeSlot);
  return freeSlot;
}

export async function ensureFishingImageMacro() {
  if (!globalThis.game?.user?.isGM) return { created: 0, updated: 0, skipped: true };
  const macros = globalThis.game?.macros;
  const macroFlag = macro => [MODULE_ID, LEGACY_MODULE_ID, "regionwright"].some(scope =>
    macro?.flags?.[scope]?.[SRD_IMAGE_MACRO_FLAG]?.macroId === FISHING_IMAGE_MACRO_ID
  );
  const owned = macroDocuments().filter(macroFlag);
  if (owned.length > 1) return { created: 0, updated: 0, skipped: true, duplicate: true };
  const foreign = macroDocuments().find(macro => macro.name === FISHING_IMAGE_MACRO_NAME && !owned.includes(macro));
  if (foreign) return { created: 0, updated: 0, skipped: true, conflict: true };
  const data = {
    name: FISHING_IMAGE_MACRO_NAME,
    type: "script",
    img: "icons/svg/fish.svg",
    command: createFishingImageMacroSource(),
    ownership: { default: 0, [globalThis.game.user.id]: 3 },
    flags: { [MODULE_ID]: { [SRD_IMAGE_MACRO_FLAG]: { version: 1, macroId: FISHING_IMAGE_MACRO_ID } } }
  };
  if (owned[0]) {
    await owned[0].update(data);
    const hotbarSlot = await assignFishingMacroToFreeHotbarSlot(owned[0]);
    return { created: 0, updated: 1, skipped: false, macro: owned[0], hotbarSlot };
  }
  const MacroClass = macros?.documentClass ?? globalThis.Macro;
  if (typeof MacroClass?.create === "function") {
    const macro = await MacroClass.create(data, { renderSheet: false });
    const hotbarSlot = await assignFishingMacroToFreeHotbarSlot(macro);
    return { created: 1, updated: 0, skipped: false, macro, hotbarSlot };
  }
  if (typeof MacroClass?.createDocuments === "function") {
    const [macro] = await MacroClass.createDocuments([data]);
    const hotbarSlot = await assignFishingMacroToFreeHotbarSlot(macro);
    return { created: 1, updated: 0, skipped: false, macro, hotbarSlot };
  }
  throw new Error("Foundry Macro documents are unavailable.");
}

function hudStatusText(region) {
  return region ? `Selected: ${region.name || "Region"}` : "Setup: select a Region";
}

const HUD_POSITION_KEY = `${MODULE_ID}.hud-position`;
const HUD_COLLAPSED_KEY = `${MODULE_ID}.hud-collapsed`;
const HUD_TAB_KEY = `${MODULE_ID}.hud-tab`;
function runtimeMiningApi() {
  return globalThis.game?.modules?.get?.(MODULE_ID)?.api?.mining ?? null;
}
function normalizeHudTab(value, mining = runtimeMiningApi()) {
  return value === "mining" && mining ? "mining" : "fishing";
}
function readHudTab() {
  try { return globalThis.localStorage?.getItem?.(HUD_TAB_KEY) ?? "fishing"; } catch (_error) { return "fishing"; }
}
function writeHudTab(tab) {
  try { globalThis.localStorage?.setItem?.(HUD_TAB_KEY, tab); } catch (_error) { /* optional client storage */ }
}

function findRegionControlGroup(controls) {
  return Array.isArray(controls)
    ? controls.find(entry => ["region", "regions"].includes(entry?.name))
    : controls?.regions ?? controls?.region;
}

function addRegionControlTool(regionControls, tool) {
  const tools = regionControls?.tools;
  if (!tools || typeof tool?.name !== "string") return false;
  const exists = Array.isArray(tools)
    ? tools.some(entry => entry?.name === tool.name)
    : Boolean(tools[tool.name]);
  if (exists) return false;
  const orderedTool = { ...tool, order: Array.isArray(tools) ? tools.length : Object.keys(tools).length };
  if (Array.isArray(tools)) tools.push(orderedTool);
  else tools[tool.name] = orderedTool;
  return true;
}

export function registerFishingRegionControl(controls) {
  const regionControls = findRegionControlGroup(controls);
  if (!regionControls?.tools || !globalThis.game?.user?.isGM) return false;
  return addRegionControlTool(regionControls, {
    name: `${MODULE_ID}-region-control`,
    title: "Fishing Ponds",
    icon: "fa-solid fa-fish",
    button: true,
    visible: true,
    onChange: () => {
      renderFishingHud({ tab: "fishing" });
      if (!selectedRegion()) globalThis.ui?.notifications?.info?.("Select a Region before choosing a fishing biome.");
    }
  });
}

function readHudPosition() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem?.(HUD_POSITION_KEY) ?? "null");
    if (Number.isFinite(value?.left) && Number.isFinite(value?.top)) return value;
  } catch (_error) {
    // Ignore unavailable or malformed client-local position state.
  }
  return null;
}

function writeHudPosition(position) {
  try { globalThis.localStorage?.setItem?.(HUD_POSITION_KEY, JSON.stringify(position)); } catch (_error) { /* optional client storage */ }
}

function readHudCollapsed() {
  try { return globalThis.localStorage?.getItem?.(HUD_COLLAPSED_KEY) === "true"; } catch (_error) { return false; }
}

function writeHudCollapsed(collapsed) {
  try { globalThis.localStorage?.setItem?.(HUD_COLLAPSED_KEY, String(collapsed)); } catch (_error) { /* optional client storage */ }
}

function createFishingHudButtonsMarkup(expandedBiomeId = null) {
  return BIOME_ORDER.map(id => {
    const definition = FISHING_BIOMES[id];
    const expanded = id === expandedBiomeId;
    const tiers = expanded
      ? `<div class="rw-fishing-hud-pond-tiers" role="group" aria-label="${escapeHTML(definition.label)} pond types">${POND_TIER_ORDER.map(tierId => {
        const tier = POND_TIERS[tierId];
        return `<button type="button" class="rw-fishing-hud-tier" data-fishing-pond-tier="${tierId}" title="${escapeHTML(tier.description)}"><strong>${escapeHTML(tier.label)}</strong><small>${escapeHTML(tier.description)}</small></button>`;
      }).join("")}</div>`
      : "";
    return `<div class="rw-fishing-hud-biome" data-biome-group="${escapeHTML(id)}"><button type="button" class="rw-fishing-hud-button" data-fishing-biome="${escapeHTML(id)}" aria-expanded="${expanded}" title="Choose a ${escapeHTML(definition.label)} pond type">${escapeHTML(definition.label)}<i class="fa-solid ${expanded ? "fa-chevron-up" : "fa-chevron-down"}" aria-hidden="true"></i></button>${tiers}</div>`;
  }).join("");
}

function activeFishingTestPlayers() {
  const users = globalThis.game?.users;
  const entries = Array.isArray(users?.contents)
    ? users.contents
    : typeof users?.values === "function"
      ? Array.from(users.values())
      : Array.from(users ?? []);
  return entries
    .filter(user => user?.active === true && !user.isGM)
    .sort((left, right) => String(left.name ?? "Player").localeCompare(String(right.name ?? "Player")));
}

function fishingTestPlayerOptions(players = activeFishingTestPlayers()) {
  const activePlayers = players.filter(user => user?.active === true && !user.isGM);
  return `<option value="self">This screen (GM)</option>${activePlayers.map(user => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name ?? "Active player")}</option>`).join("")}`;
}

function miningOreDefinitions(mining = runtimeMiningApi()) {
  const order = mining?.catalog?.order ?? [];
  return order.map(id => mining?.catalog?.get?.(id) ?? mining?.catalog?.ores?.[id]).filter(Boolean);
}
function createMiningHudMarkup(mining = runtimeMiningApi(), activePlayers = activeFishingTestPlayers()) {
  if (!mining) return `<section class="rw-gathering-unavailable"><strong>Mining unavailable</strong><small>Enable Regionwright Mining to configure deposits and run ore tests here.</small></section>`;
  const ores = miningOreDefinitions(mining);
  const oreButtons = ores.map(ore => {
    const value = mining.catalog?.value?.(ore) ?? `${ore.price?.value ?? "?"} ${ore.price?.denomination ?? ""}`.trim();
    return `<button type="button" class="rw-mining-hud-ore" data-mining-configure-ore="${escapeHTML(ore.id)}"><strong>${escapeHTML(ore.name)}</strong><small>${escapeHTML(ore.difficultyLabel ?? ore.miningDifficulty ?? ore.tier ?? "Standard")} ? ${escapeHTML(value)}/unit</small></button>`;
  }).join("");
  const oreOptions = ores.map(ore => `<option value="${escapeHTML(ore.id)}">${escapeHTML(ore.name)} - ${escapeHTML(ore.difficultyLabel ?? ore.miningDifficulty ?? ore.tier ?? "Standard")}</option>`).join("");
  return `<div class="rw-mining-hud-ores" role="toolbar" aria-label="Mining ores">${oreButtons}</div>
    <button type="button" class="rw-mining-hud-clear" data-mining-clear><i class="fa-solid fa-trash"></i> Clear mining deposit</button>
    <section class="rw-fishing-hud-test rw-mining-hud-test" aria-label="Mining difficulty test">
      <label for="rw-mining-test-player">Test on</label>
      <select id="rw-mining-test-player" data-mining-test-player aria-label="Player to run the mining test for">${fishingTestPlayerOptions(activePlayers)}</select>
      <label for="rw-mining-test-ore">Test ore</label>
      <div class="rw-fishing-hud-test-controls">
        <select id="rw-mining-test-ore" data-mining-test-ore aria-label="Ore difficulty to test">${oreOptions}</select>
        <button type="button" class="rw-fishing-hud-test-button" data-mining-test-start>Test game</button>
      </div>
      <small>Tests use the selected ore's real timing profile, require no pickaxe, award no ore, and do not change Region state.</small>
    </section>`;
}
export function createFishingHudMarkup({ selectedRegionName = null, expandedBiomeId = null, activePlayers = activeFishingTestPlayers(), mining = runtimeMiningApi(), activeTab = readHudTab() } = {}) {
  const status = selectedRegionName ? `Selected: ${selectedRegionName}` : "Setup: select a Region";
  const rarityOptions = FISH_RARITIES.map(rarity => `<option value="${escapeHTML(rarity)}">${escapeHTML(rarity === "very rare" ? "Very Rare" : rarity[0].toLocaleUpperCase() + rarity.slice(1))}</option>`).join("");
  const tab = normalizeHudTab(activeTab, mining);
  return `<section class="rw-fishing-hud" aria-label="Regionwright Gathering">
    <div class="rw-fishing-hud-heading" data-fishing-hud-drag title="Drag to move the Regionwright Gathering panel">
      <strong><i class="fa-solid fa-basket-shopping"></i> Regionwright Gathering</strong>
      <span class="rw-fishing-hud-status" data-fishing-hud-status>${escapeHTML(status)}</span>
      <button type="button" class="rw-fishing-hud-toggle" data-fishing-hud-toggle aria-expanded="true" aria-label="Collapse Regionwright Gathering"><i class="fa-solid fa-chevron-up"></i></button>
    </div>
    <div class="rw-fishing-hud-content">
      <nav class="rw-gathering-tabs" aria-label="Gathering tools">
        <button type="button" class="rw-gathering-tab${tab === "fishing" ? " active" : ""}" data-gathering-tab="fishing" aria-selected="${tab === "fishing"}"><i class="fa-solid fa-fish"></i> Fishing</button>
        <button type="button" class="rw-gathering-tab${tab === "mining" ? " active" : ""}" data-gathering-tab="mining" aria-selected="${tab === "mining"}" ${mining ? "" : "disabled"}><i class="fa-solid fa-pickaxe"></i> Mining</button>
      </nav>
      <section class="rw-gathering-panel" data-gathering-panel="fishing" ${tab === "fishing" ? "" : "hidden"}>
        <div class="rw-fishing-hud-buttons" role="toolbar" aria-label="Fishing biomes">${createFishingHudButtonsMarkup(expandedBiomeId)}</div>
        <section class="rw-fishing-hud-test" aria-label="Fishing difficulty test">
          <label for="rw-fishing-test-player">Test on</label>
          <select id="rw-fishing-test-player" data-fishing-test-player aria-label="Player to run the test for">${fishingTestPlayerOptions(activePlayers)}</select>
          <label for="rw-fishing-test-rarity">Test difficulty</label>
          <div class="rw-fishing-hud-test-controls">
            <select id="rw-fishing-test-rarity" data-fishing-test-rarity aria-label="Difficulty to test">${rarityOptions}</select>
            <button type="button" class="rw-fishing-hud-test-button" data-fishing-test-start>Test game</button>
          </div>
          <small>Choose an active player to open the test on their screen. Tests use no bait and award no fish.</small>
        </section>
      </section>
      <section class="rw-gathering-panel" data-gathering-panel="mining" ${tab === "mining" ? "" : "hidden"}>${createMiningHudMarkup(mining, activePlayers)}</section>
    </div>
  </section>`;
}
let fishingHudElement = null;
let expandedBiomeId = null;
let activeHudTab = "fishing";

function setGatheringTab(root, requestedTab) {
  if (!root) return "fishing";
  const mining = runtimeMiningApi();
  const tab = normalizeHudTab(requestedTab, mining);
  activeHudTab = tab;
  writeHudTab(tab);
  root.querySelectorAll?.("[data-gathering-tab]")?.forEach?.(button => {
    const active = button.dataset.gatheringTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  root.querySelectorAll?.("[data-gathering-panel]")?.forEach?.(panel => { panel.hidden = panel.dataset.gatheringPanel !== tab; });
  return tab;
}
function refreshFishingHud() {
  if (!fishingHudElement) return;
  refreshFishingTestPlayers(fishingHudElement);
  refreshMiningTestPlayers(fishingHudElement);
  const region = selectedRegion();
  const status = fishingHudElement.querySelector?.("[data-fishing-hud-status]");
  if (status) status.textContent = hudStatusText(region);
  fishingHudElement.classList.toggle("has-selection", Boolean(region));
  fishingHudElement.dataset.regionUuid = region?.uuid ?? "";
  const mining = runtimeMiningApi();
  const configuredOreId = region && mining?.readRegion ? mining.readRegion(region)?.oreId : null;
  fishingHudElement.querySelectorAll?.("[data-mining-configure-ore]")?.forEach?.(button => {
    button.classList.toggle("is-configured", Boolean(configuredOreId && button.dataset.miningConfigureOre === configuredOreId));
  });
  setGatheringTab(fishingHudElement, activeHudTab || readHudTab());
}
function refreshFishingTestPlayers(root) {
  const select = root?.querySelector?.("[data-fishing-test-player]");
  if (!select) return;
  const selected = select.value || "self";
  const players = activeFishingTestPlayers();
  select.innerHTML = fishingTestPlayerOptions(players);
  select.value = selected === "self" || players.some(user => String(user.id) === selected) ? selected : "self";
}
function refreshMiningTestPlayers(root) {
  const select = root?.querySelector?.("[data-mining-test-player]");
  if (!select) return;
  const selected = select.value || "self";
  const players = activeFishingTestPlayers();
  select.innerHTML = fishingTestPlayerOptions(players);
  select.value = selected === "self" || players.some(user => String(user.id) === selected) ? selected : "self";
}
export function safeFishingHudPosition({ viewportWidth, hudWidth, controlsRight = 0, sidebarLeft = null } = {}) {
  const width = Math.max(1, Number(hudWidth) || 208);
  const viewport = Math.max(width + 24, Number(viewportWidth) || 1280);
  const margin = 12;
  const rightRailMargin = 64;
  const minLeft = Math.max(margin, (Number(controlsRight) || 0) + margin);
  const maxLeft = Math.max(margin, viewport - width - rightRailMargin);
  const hasSidebar = sidebarLeft !== null && sidebarLeft !== undefined && Number.isFinite(Number(sidebarLeft));
  const sidebarBound = hasSidebar
    ? Number(sidebarLeft) - width - margin
    : maxLeft;
  const left = sidebarBound >= minLeft
    ? sidebarBound
    : Math.min(maxLeft, minLeft);
  return { left: Math.round(Math.max(margin, left)), top: margin };
}

function hudControlBounds() {
  const columns = ["#ui-left-column-1", "#ui-left-column-2"]
    .map(selector => globalThis.document?.querySelector?.(selector)?.getBoundingClientRect?.())
    .filter(rect => rect && rect.width > 0 && rect.height > 0);
  return {
    controlsRight: columns.length ? Math.max(...columns.map(rect => rect.right)) : 0,
    sidebarLeft: (() => {
      const rect = globalThis.document?.querySelector?.("#sidebar")?.getBoundingClientRect?.();
      return rect?.width > 0 ? rect.left : null;
    })()
  };
}

function applyHudPosition(root, position = readHudPosition()) {
  if (!root) return;
  const width = root.getBoundingClientRect?.().width || root.offsetWidth || 208;
  const { controlsRight, sidebarLeft } = hudControlBounds();
  const overlapsControls = position && position.left < controlsRight && position.left + width > 0;
  if (!position || overlapsControls) {
    position = safeFishingHudPosition({
      viewportWidth: globalThis.innerWidth,
      hudWidth: width,
      controlsRight,
      sidebarLeft
    });
    if (overlapsControls) writeHudPosition(position);
  }
  root.style.left = `${position.left}px`;
  root.style.top = `${position.top}px`;
  root.style.right = "auto";
  root.style.transform = "none";
}

function installHudInteractions(root) {
  if (!root || root.dataset.interactionsInstalled === "true") return;
  root.dataset.interactionsInstalled = "true";
  const toggle = root.querySelector?.("[data-fishing-hud-toggle]");
  const setCollapsed = collapsed => {
    root.classList.toggle("is-collapsed", collapsed);
    toggle?.setAttribute("aria-expanded", String(!collapsed));
    toggle?.setAttribute("aria-label", collapsed ? "Expand Regionwright Gathering" : "Collapse Regionwright Gathering");
    const icon = toggle?.querySelector?.("i");
    icon?.classList.toggle("fa-chevron-down", collapsed);
    icon?.classList.toggle("fa-chevron-up", !collapsed);
    writeHudCollapsed(collapsed);
  };
  toggle?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!root.classList.contains("is-collapsed"));
  });
  setCollapsed(readHudCollapsed());

  const handle = root.querySelector?.("[data-fishing-hud-drag]");
  handle?.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target?.closest?.("button")) return;
    const rect = root.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const move = moveEvent => {
      const maxLeft = Math.max(0, globalThis.innerWidth - root.offsetWidth);
      const maxTop = Math.max(0, globalThis.innerHeight - root.offsetHeight);
      const left = Math.min(maxLeft, Math.max(0, moveEvent.clientX - offsetX));
      const top = Math.min(maxTop, Math.max(0, moveEvent.clientY - offsetY));
      root.style.left = `${left}px`;
      root.style.top = `${top}px`;
      root.style.transform = "none";
    };
    const stop = () => {
      globalThis.removeEventListener?.("pointermove", move);
      globalThis.removeEventListener?.("pointerup", stop);
      const current = root.getBoundingClientRect();
      writeHudPosition({ left: Math.round(current.left), top: Math.round(current.top) });
    };
    globalThis.addEventListener?.("pointermove", move);
    globalThis.addEventListener?.("pointerup", stop, { once: true });
    event.preventDefault();
  });
}

function renderFishingHud(options = {}) {
  if (!globalThis.game?.user?.isGM || !globalThis.document?.body) return null;
  const requestedTab = typeof options === "string" ? options : options?.tab;
  if (requestedTab) activeHudTab = normalizeHudTab(requestedTab);
  else if (!fishingHudElement) activeHudTab = normalizeHudTab(readHudTab());
  if (!fishingHudElement || !fishingHudElement.isConnected) {
    fishingHudElement = globalThis.document.createElement("div");
    fishingHudElement.innerHTML = createFishingHudMarkup({ activeTab: activeHudTab });
    const root = fishingHudElement.firstElementChild;
    root?.addEventListener("click", event => {
      const tabButton = event.target?.closest?.("[data-gathering-tab]");
      if (tabButton) {
        event.preventDefault();
        setGatheringTab(root, tabButton.dataset.gatheringTab);
        return;
      }
      const miningTestButton = event.target?.closest?.("[data-mining-test-start]");
      if (miningTestButton) {
        event.preventDefault();
        const oreId = root.querySelector?.("[data-mining-test-ore]")?.value;
        const targetUserId = root.querySelector?.("[data-mining-test-player]")?.value ?? "self";
        void testMiningFromHud(oreId, targetUserId);
        return;
      }
      const miningClearButton = event.target?.closest?.("[data-mining-clear]");
      if (miningClearButton) {
        event.preventDefault();
        void clearMiningFromHud();
        return;
      }
      const miningOreButton = event.target?.closest?.("[data-mining-configure-ore]");
      if (miningOreButton) {
        event.preventDefault();
        void configureMiningFromHud(miningOreButton.dataset.miningConfigureOre);
        return;
      }
      const testButton = event.target?.closest?.("[data-fishing-test-start]");
      if (testButton) {
        event.preventDefault();
        const rarity = root.querySelector?.("[data-fishing-test-rarity]")?.value ?? "common";
        const targetUserId = root.querySelector?.("[data-fishing-test-player]")?.value ?? "self";
        void testFishingFromHud(rarity, targetUserId);
        return;
      }
      const tierButton = event.target?.closest?.("[data-fishing-pond-tier]");
      if (tierButton) {
        event.preventDefault();
        const group = tierButton.closest?.("[data-biome-group]");
        void injectFromHud(group?.dataset?.biomeGroup, tierButton.dataset.fishingPondTier);
        return;
      }
      const button = event.target?.closest?.("[data-fishing-biome]");
      if (!button) return;
      event.preventDefault();
      expandedBiomeId = expandedBiomeId === button.dataset.fishingBiome ? null : button.dataset.fishingBiome;
      const buttons = root.querySelector?.(".rw-fishing-hud-buttons");
      if (buttons) buttons.innerHTML = createFishingHudButtonsMarkup(expandedBiomeId);
    });
    fishingHudElement = root;
    installHudInteractions(root);
    globalThis.document.body.append(fishingHudElement);
  }
  setGatheringTab(fishingHudElement, activeHudTab);
  applyHudPosition(fishingHudElement);
  refreshFishingHud();
  return fishingHudElement;
}
async function configureMiningFromHud(oreId) {
  const mining = runtimeMiningApi();
  if (!mining?.configureRegion) return globalThis.ui?.notifications?.warn?.("Regionwright Mining is not available.");
  const region = selectedRegion();
  if (!region) return globalThis.ui?.notifications?.warn?.("Select or highlight a Region before choosing an ore deposit.");
  const ore = mining.catalog?.get?.(oreId);
  if (!ore) return globalThis.ui?.notifications?.warn?.("Unknown mining ore.");
  try {
    await mining.configureRegion({ region, oreId });
    globalThis.ui?.notifications?.info?.(`${ore.name} deposit configured on ${region.name || "selected Region"}.`);
    refreshFishingHud();
  } catch (error) {
    globalThis.ui?.notifications?.error?.(error.message ?? "Unable to configure the mining deposit.");
  }
}
async function clearMiningFromHud() {
  const mining = runtimeMiningApi();
  const region = selectedRegion();
  if (!mining?.clearRegion) return globalThis.ui?.notifications?.warn?.("Regionwright Mining is not available.");
  if (!region) return globalThis.ui?.notifications?.warn?.("Select or highlight a Region first.");
  try {
    await mining.clearRegion(region);
    globalThis.ui?.notifications?.info?.(`Mining deposit cleared from ${region.name || "selected Region"}.`);
    refreshFishingHud();
  } catch (error) {
    globalThis.ui?.notifications?.error?.(error.message ?? "Unable to clear the mining deposit.");
  }
}
export async function testMiningFromHud(oreId, targetUserId = "self") {
  const mining = runtimeMiningApi();
  const ore = mining?.catalog?.get?.(oreId);
  if (!mining?.test || !ore) return globalThis.ui?.notifications?.warn?.("Regionwright Mining or the selected ore is unavailable.");
  try {
    if (!targetUserId || targetUserId === "self") return await mining.test.open({ oreId: ore.id });
    const result = await mining.test.request(targetUserId, { oreId: ore.id });
    if (!result.success) throw new Error(result.message ?? "The player did not confirm that the mining test opened.");
    globalThis.ui?.notifications?.info?.(`${ore.name} mining test opened for ${result.userName}.`);
    return result;
  } catch (error) {
    globalThis.ui?.notifications?.error?.(error.message ?? "Unable to start the mining difficulty test.");
    return null;
  }
}
async function injectFromHud(biomeId, pondTier = "common") {
  const region = selectedRegion();
  if (!region) {
    globalThis.ui?.notifications?.warn?.("Select or highlight a Region before choosing a fishing biome.");
    refreshFishingHud();
    return null;
  }
  try {
    const result = await injectRegion({ region, biome: biomeId, pondTier });
    globalThis.ui?.notifications?.info?.(`${result.tier.label} · ${result.definition.label} pond injected with ${result.bait.name}.`);
    refreshFishingHud();
    return result;
  } catch (error) {
    globalThis.ui?.notifications?.error?.(error.message ?? "Unable to inject the fishing biome.");
    return null;
  }
}

export async function testFishingFromHud(fishRarity, targetUserId = "self") {
  try {
    if (!targetUserId || targetUserId === "self") return await openFishingTest({ fishRarity });
    const result = await openFishingTestForPlayer({ userId: targetUserId, fishRarity });
    if (!result.success) throw new Error(result.message ?? "The player did not confirm that the fishing test opened.");
    globalThis.ui?.notifications?.info?.(`Fishing test opened for ${result.userName}.`);
    return result;
  } catch (error) {
    globalThis.ui?.notifications?.error?.(error.message ?? "Unable to start the fishing difficulty test.");
    return null;
  }
}

function openSetup() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can inject a fishing biome into a Region.");
  globalThis.game?.modules?.get?.(MODULE_ID)?.api?.open?.({ tab: "fishing" });
  return selectedRegion();
}

function installFishingHudHooks() {
  const hooks = globalThis.Hooks;
  if (!hooks?.on || installFishingHudHooks.installed) return;
  installFishingHudHooks.installed = true;
  hooks.on("canvasReady", renderFishingHud);
  hooks.on("controlRegion", refreshFishingHud);
  hooks.on("activateCanvasLayer", refreshFishingHud);
  hooks.on("deactivateCanvasLayer", refreshFishingHud);
  hooks.on("updateUser", refreshFishingHud);
  hooks.on("userConnected", refreshFishingHud);
  hooks.on("userDisconnected", refreshFishingHud);
}

export const api = Object.freeze({
  version: "0.1.17",
  catalog: Object.freeze({ biomes: FISHING_BIOMES, bait: BAIT_CATALOG, order: BIOME_ORDER, pondTiers: POND_TIERS, pondTierOrder: POND_TIER_ORDER, rarities: FISH_RARITIES, get: getFishingBiome, normalize: normalizeBiomeId }),
  inject: injectRegion,
  injectSelected: injectSelectedRegion,
  clear: clearRegion,
  read: injectionData,
  fishing: Object.freeze({
    open: openFishing,
    test: openFishingTest,
    testForPlayer: openFishingTestForPlayer,
    configureRegion: configureFishingRegion,
    clearRegion: clearFishingRegion,
    isRegion: isFishingRegion,
    prepareTackle: prepareFishingTackle
  }),
  createBaitForActor,
  createBaitItemSource,
  ensureCompendium: ensureFishingCompendium,
  assignSrdImages: assignFishingSrdImages,
  ensureImageMacro: ensureFishingImageMacro,
  installItems: installFishingItems,
  openSetup,
  openHud: options => globalThis.game?.modules?.get?.(MODULE_ID)?.api?.open?.(options)
});

globalThis.Hooks?.once?.("setup", () => {
  installFishingRegionInteraction();
});

globalThis.Hooks?.once?.("init", () => {
  installFishingContainerGuard();
});

globalThis.Hooks?.once?.("ready", () => {
  installFishingSocket();
  installFishingRegionInteraction();
  void Promise.all([installFishingItems(), ensureFishingCompendium(), ensureFishingImageMacro()]).then(([items, compendium, macro]) => {
    if (items.created) globalThis.ui?.notifications?.info?.(`Fishing catalog installed: ${items.created} item${items.created === 1 ? "" : "s"} added to the Items directory.`);
    if (compendium.created || compendium.fallback) globalThis.ui?.notifications?.info?.(`${FISHING_PACK_LABEL} compendium is ready.`);
    if (macro.created || macro.hotbarSlot) {
      const location = macro.hotbarSlot ? ` Hotbar slot ${macro.hotbarSlot} is ready.` : "";
      globalThis.ui?.notifications?.info?.(`${FISHING_IMAGE_MACRO_NAME} is ready in the Macro directory.${location}`);
    }
    if (macro.conflict) console.warn(`[${MODULE_ID}] A foreign Macro already uses the reserved name ${FISHING_IMAGE_MACRO_NAME}.`);
  }).catch(error => {
    console.error(`[${MODULE_ID}] Unable to install fishing catalog.`, error);
    globalThis.ui?.notifications?.error?.("Fishing items or the compendium could not be installed.");
  });
  globalThis.Hooks?.callAll?.(`${MODULE_ID}.fishing.ready`, api);
});

// CONFIG.Region.objectClass can be finalized after ready in Foundry v14. Retry
// here so player clicks work even when the Region layer is drawn late.
globalThis.Hooks?.on?.("canvasReady", () => {
  installFishingRegionInteraction();
});
