import { openBallisticsLab } from "./ballistics-lab.js";
import { api as fishingApi } from "./fishing-runtime.js";
import { api as miningApi } from "./mining-runtime.js";
import { migrateLegacyFlags } from "./migration.js";
import {
  createHuntingBowItemSource,
  findHuntingBow,
  installHuntingBow,
  installHuntingSocket,
  openHunting,
  openHuntingTest,
  openHuntingCalibration,
  openHuntingTestMode,
  requestHuntingTest,
  requestHuntingCalibration,
  requestHuntingTestMode,
  HUNTING_TEST_MODES,
  HUNTING_TEST_MODE_ORDER,
  HUNTING_HOLDOVER_CALIBRATION_RANGES_YARDS
} from "./hunting.js";

const MODULE_ID = "regionwright-hunting-gathering";
const HUD_VERSION = "0.4.0";
const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const contents = collection => Array.isArray(collection)
  ? collection
  : Array.isArray(collection?.contents)
    ? collection.contents
    : typeof collection?.values === "function"
      ? Array.from(collection.values())
      : Array.from(collection ?? []);
const currentUserId = () => globalThis.game?.user?.id ?? null;
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === currentUserId()));
const runtimeFishingApi = () => fishingApi;
const runtimeMiningApi = () => miningApi;
function selectedRegion() {
  return globalThis.canvas?.regions?.controlled?.[0]?.document
    ?? globalThis.canvas?.regions?.placeables?.find?.(placeable => placeable.controlled)?.document
    ?? null;
}
function activePlayers() {
  return contents(globalThis.game?.users)
    .filter(user => user?.active === true && !user.isGM)
    .sort((a, b) => String(a.name ?? "Player").localeCompare(String(b.name ?? "Player")));
}
function playerOptions(players = activePlayers()) {
  return `<option value="self">This screen (GM)</option>${players.map(user => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name ?? "Active player")}</option>`).join("")}`;
}
function labelize(value) {
  return String(value ?? "").split(/[\s_-]+/).filter(Boolean).map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
export const HUNTING_GATHERING_ACTIVITIES = Object.freeze([
  Object.freeze({ id: "hunting", label: "Hunting", icon: "fa-solid fa-paw", implemented: true }),
  Object.freeze({ id: "fishing", label: "Fishing", icon: "fa-solid fa-fish", implemented: true }),
  Object.freeze({ id: "mining", label: "Mining", icon: "fa-solid fa-pickaxe", implemented: true }),
  Object.freeze({ id: "gathering", label: "Gathering", icon: "fa-solid fa-leaf", implemented: false })
]);
export function huntingGatheringAvailability({ fishing = runtimeFishingApi(), mining = runtimeMiningApi() } = {}) {
  return Object.freeze({
    hunting: Object.freeze({ available: true, reason: null }),
    fishing: Object.freeze({ available: Boolean(fishing?.inject && fishing?.clear && fishing?.fishing?.test), reason: fishing ? null : "Fishing is unavailable in the consolidated module." }),
    mining: Object.freeze({ available: Boolean(mining?.configureRegion && mining?.clearRegion && mining?.test?.open), reason: mining ? null : "Mining is unavailable in the consolidated module." }),
    gathering: Object.freeze({ available: false, reason: "Gathering will follow Hunting." })
  });
}
function defaultActivity(availability) {
  if (availability.hunting.available) return "hunting";
  if (availability.fishing.available) return "fishing";
  if (availability.mining.available) return "mining";
  return "hunting";
}
function normalizeActivity(value, availability) {
  const id = HUNTING_GATHERING_ACTIVITIES.some(activity => activity.id === value) ? value : defaultActivity(availability);
  return id;
}
function huntingTestModeOptions() {
  return HUNTING_TEST_MODE_ORDER.map(id => `<option value="${escapeHTML(id)}">${escapeHTML(HUNTING_TEST_MODES[id].label)}</option>`).join("");
}
function huntingTestRangeOptions(mode = "normal") {
  const definition = HUNTING_TEST_MODES[mode] ?? HUNTING_TEST_MODES.normal;
  if (!definition.ranges.length) return '<option value="">From Survival / Stealth</option>';
  return definition.ranges.map(yards => `<option value="${yards}">${yards} yd</option>`).join("");
}
function syncHuntingTestModeControls(root) {
  const modeSelect = root?.querySelector?.('[data-rw-hg="hunting-test-mode"]');
  const rangeSelect = root?.querySelector?.('[data-rw-hg="hunting-test-range"]');
  if (!modeSelect || !rangeSelect) return;
  const mode = HUNTING_TEST_MODES[modeSelect.value] ? modeSelect.value : "normal";
  const current = Number(rangeSelect.value);
  const ranges = HUNTING_TEST_MODES[mode].ranges;
  rangeSelect.innerHTML = huntingTestRangeOptions(mode);
  rangeSelect.disabled = ranges.length === 0;
  if (ranges.includes(current)) rangeSelect.value = String(current);
}
function huntingPanel(players) {
  return `<div class="rw-hg-grid">
    <div class="rw-hg-hunting-summary"><strong>Track -> Approach -> Shoot -> Harvest</strong><small>Real hunts require the dedicated Regionwright Hunting Bow. GM test modes bypass equipment and inventory rewards.</small></div>
  </div>
  <div class="rw-hg-test">
    <strong>Test hunting</strong>
    <label>Test on<select data-rw-hg="hunting-player">${playerOptions(players)}</select></label>
    <label>Test mode<select data-rw-hg="hunting-test-mode">${huntingTestModeOptions()}</select></label>
    <label>Test range<select data-rw-hg="hunting-test-range" disabled>${huntingTestRangeOptions("normal")}</select></label>
    <button type="button" data-rw-hg-action="hunting-run-test"><i class="fa-solid fa-crosshairs"></i> Run Hunting Test</button>
    <button type="button" class="secondary" data-rw-hg-action="hunting-ballistics"><i class="fa-solid fa-chart-line"></i> Ballistics Lab</button>
    <small>Normal Test Hunt uses Survival and Stealth. Live Trained Holdover uses fixed expert vertical compensation. Movement Calibration uses fixed ranges and expanded motion diagnostics.</small>
  </div>`;
}
function fishingPanel(fishing, players) {
  if (!fishing) return `<div class="rw-hg-unavailable"><strong>Fishing unavailable</strong><small>Fishing is included in Regionwright: Hunting &amp; Gathering.</small></div>`;
  const biomes = (fishing.catalog?.order ?? []).map(id => fishing.catalog?.biomes?.[id] ?? fishing.catalog?.get?.(id)).filter(Boolean);
  const tiers = (fishing.catalog?.pondTierOrder ?? []).map(id => fishing.catalog?.pondTiers?.[id]).filter(Boolean);
  const rarities = fishing.catalog?.rarities ?? ["common", "uncommon", "rare", "very rare", "legendary"];
  return `<div class="rw-hg-grid">
    <label>Biome<select data-rw-hg="fishing-biome">${biomes.map(def => `<option value="${escapeHTML(def.id)}">${escapeHTML(def.label ?? def.name ?? labelize(def.id))}</option>`).join("")}</select></label>
    <label>Pond quality<select data-rw-hg="fishing-tier">${tiers.map(def => `<option value="${escapeHTML(def.id)}">${escapeHTML(def.label ?? labelize(def.id))}</option>`).join("")}</select></label>
    <div class="rw-hg-actions"><button type="button" data-rw-hg-action="fishing-configure"><i class="fa-solid fa-water"></i> Configure selected Region</button><button type="button" class="secondary" data-rw-hg-action="fishing-clear">Clear</button></div>
  </div>
  <div class="rw-hg-test">
    <strong>Test fishing</strong>
    <label>Test on<select data-rw-hg="fishing-player">${playerOptions(players)}</select></label>
    <label>Difficulty<select data-rw-hg="fishing-rarity">${rarities.map(r => `<option value="${escapeHTML(r)}">${escapeHTML(labelize(r))}</option>`).join("")}</select></label>
    <button type="button" data-rw-hg-action="fishing-test"><i class="fa-solid fa-bullseye"></i> Test game</button>
  </div>`;
}
function miningPanel(mining, players) {
  if (!mining) return `<div class="rw-hg-unavailable"><strong>Mining unavailable</strong><small>Mining is included in Regionwright: Hunting &amp; Gathering.</small></div>`;
  const ores = (mining.catalog?.order ?? []).map(id => mining.catalog?.get?.(id) ?? mining.catalog?.ores?.[id]).filter(Boolean);
  const options = ores.map(ore => `<option value="${escapeHTML(ore.id)}">${escapeHTML(ore.name)} - ${escapeHTML(ore.difficultyLabel ?? labelize(ore.miningDifficulty ?? ore.tier))}</option>`).join("");
  return `<div class="rw-hg-grid">
    <label>Ore<select data-rw-hg="mining-ore">${options}</select></label>
    <div class="rw-hg-actions"><button type="button" data-rw-hg-action="mining-configure"><i class="fa-solid fa-pickaxe"></i> Configure selected Region</button><button type="button" class="secondary" data-rw-hg-action="mining-clear">Clear</button></div>
  </div>
  <div class="rw-hg-test">
    <strong>Test mining</strong>
    <label>Test on<select data-rw-hg="mining-player">${playerOptions(players)}</select></label>
    <label>Ore difficulty<select data-rw-hg="mining-test-ore">${options}</select></label>
    <button type="button" data-rw-hg-action="mining-test"><i class="fa-solid fa-bullseye"></i> Test game</button>
  </div>`;
}
function plannedPanel(activity, reason) {
  return `<div class="rw-hg-planned"><i class="${escapeHTML(activity.icon)}" aria-hidden="true"></i><strong>${escapeHTML(activity.label)} is not implemented yet.</strong><p>${escapeHTML(reason)}</p></div>`;
}
export function createHuntingGatheringHUDMarkup({
  fishing = runtimeFishingApi(),
  mining = runtimeMiningApi(),
  players = activePlayers(),
  selectedRegionName = selectedRegion()?.name ?? null,
  activeTab = null
} = {}) {
  const availability = huntingGatheringAvailability({ fishing, mining });
  const tab = normalizeActivity(activeTab, availability);
  const tabs = HUNTING_GATHERING_ACTIVITIES.map(activity => {
    const state = availability[activity.id];
    return `<a class="rw-hg-tab${activity.id === tab ? " active" : ""}" data-rw-hg-tab="${activity.id}" data-tab="${activity.id}" role="tab" aria-selected="${activity.id === tab}"><i class="${activity.icon}"></i><span>${activity.label}</span>${state.available ? "" : '<small>Planned</small>'}</a>`;
  }).join("");
  const regionText = selectedRegionName ? `Selected Region: ${selectedRegionName}` : "Select a Region to configure a hunting or gathering site.";
  return `<section class="rw-hg-hud standard-form" data-rw-hg-root data-active-tab="${tab}">
    <p class="rw-hg-region${selectedRegionName ? " selected" : ""}" data-rw-hg-region>${escapeHTML(regionText)}</p>
    <nav class="tabs rw-hg-tabs" aria-label="Hunting and gathering activities">${tabs}</nav>
    <section class="rw-hg-panel" data-rw-hg-panel="hunting" ${tab === "hunting" ? "" : "hidden"}>${huntingPanel(players)}</section>
    <section class="rw-hg-panel" data-rw-hg-panel="fishing" ${tab === "fishing" ? "" : "hidden"}>${fishingPanel(fishing, players)}</section>
    <section class="rw-hg-panel" data-rw-hg-panel="mining" ${tab === "mining" ? "" : "hidden"}>${miningPanel(mining, players)}</section>
    <section class="rw-hg-panel" data-rw-hg-panel="gathering" ${tab === "gathering" ? "" : "hidden"}>${plannedPanel(HUNTING_GATHERING_ACTIVITIES[3], availability.gathering.reason)}</section>
    <p class="rw-hg-status" data-rw-hg-status>Ready.</p>
  </section>`;
}
function findRegionControlGroup(controls) {
  return Array.isArray(controls)
    ? controls.find(entry => ["region", "regions"].includes(entry?.name))
    : controls?.regions ?? controls?.region;
}
function addRegionControlTool(regionControls, tool) {
  const tools = regionControls?.tools;
  if (!tools || typeof tool?.name !== "string") return false;
  const exists = Array.isArray(tools) ? tools.some(entry => entry?.name === tool.name) : Boolean(tools[tool.name]);
  if (exists) return false;
  const ordered = { ...tool, order: Array.isArray(tools) ? tools.length : Object.keys(tools).length };
  if (Array.isArray(tools)) tools.push(ordered); else tools[tool.name] = ordered;
  return true;
}
export function registerHuntingGatheringRegionControl(controls) {
  const regionControls = findRegionControlGroup(controls);
  if (!regionControls?.tools || !globalThis.game?.user?.isGM) return false;
  return addRegionControlTool(regionControls, {
    name: `${MODULE_ID}-region-control`,
    title: "Hunting & Gathering",
    icon: "fa-solid fa-leaf",
    button: true,
    visible: true,
    onChange: () => { void openHuntingGatheringHUD(); }
  });
}
let activeDialog = null;
function setStatus(root, message, kind = "") {
  const status = root?.querySelector?.('[data-rw-hg-status]');
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}
function updateSelectedRegionText(root) {
  const region = selectedRegion();
  const target = root?.querySelector?.('[data-rw-hg-region]');
  if (target) {
    target.textContent = region ? `Selected Region: ${region.name ?? region.id ?? "Region"}` : "Select a Region to configure a hunting or gathering site.";
    target.classList.toggle("selected", Boolean(region));
  }
  return region;
}
function setTab(root, tab) {
  if (!root || !HUNTING_GATHERING_ACTIVITIES.some(activity => activity.id === tab)) return;
  root.dataset.activeTab = tab;
  root.querySelectorAll?.('[data-rw-hg-tab]')?.forEach?.(button => {
    const active = button.dataset.rwHgTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  root.querySelectorAll?.('[data-rw-hg-panel]')?.forEach?.(panel => { panel.hidden = panel.dataset.rwHgPanel !== tab; });
}
async function openHuntingBallisticsLab() {
  await openBallisticsLab();
  return "Opened Regionwright Ballistics Lab.";
}
async function runHuntingTestMode(root) {
  const targetUserId = root.querySelector?.('[data-rw-hg="hunting-player"]')?.value ?? "self";
  const mode = root.querySelector?.('[data-rw-hg="hunting-test-mode"]')?.value ?? "normal";
  const rawRange = root.querySelector?.('[data-rw-hg="hunting-test-range"]')?.value;
  const distanceYards = rawRange ? Number(rawRange) : null;
  const definition = HUNTING_TEST_MODES[mode] ?? HUNTING_TEST_MODES.normal;
  if (targetUserId === "self") {
    const actor = globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? globalThis.game?.user?.character ?? null;
    if (!actor) throw new Error("Select a token or assign a character before launching a Hunting test mode.");
    await openHuntingTestMode({ actor, mode, distanceYards });
    return `Opened ${definition.label}${distanceYards ? ` at ${distanceYards} yd` : ""} for ${actor.name}.`;
  }
  const result = await requestHuntingTestMode(targetUserId, { mode, distanceYards });
  if (!result?.success) throw new Error(result?.message ?? "The Hunting test mode could not be opened.");
  return `Opened ${definition.label}${distanceYards ? ` at ${distanceYards} yd` : ""} for ${result.userName}.`;
}
async function testHunting(root) {
  const targetUserId = root.querySelector?.('[data-rw-hg="hunting-player"]')?.value ?? "self";
  if (targetUserId === "self") {
    const actor = globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? globalThis.game?.user?.character ?? null;
    if (!actor) throw new Error("Select a token or assign a character before launching a hunting test.");
    await openHuntingTest({ actor });
    return `Opened a hunting test for ${actor.name}.`;
  }
  const result = await requestHuntingTest(targetUserId);
  if (!result?.success) throw new Error(result?.message ?? "The hunting test could not be opened.");
  return `Opened a hunting test for ${result.userName}.`;
}
async function calibrateHuntingHoldover(root) {
  const targetUserId = root.querySelector?.('[data-rw-hg="hunting-player"]')?.value ?? "self";
  const distanceYards = Number(root.querySelector?.('[data-rw-hg="hunting-calibration-range"]')?.value ?? 20);
  if (targetUserId === "self") {
    const actor = globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? globalThis.game?.user?.character ?? null;
    if (!actor) throw new Error("Select a token or assign a character before launching live Hunting holdover calibration.");
    await openHuntingCalibration({ actor, distanceYards });
    return `Opened ${distanceYards} yd live holdover calibration for ${actor.name}.`;
  }
  const result = await requestHuntingCalibration(targetUserId, { distanceYards });
  if (!result?.success) throw new Error(result?.message ?? "The live Hunting holdover calibration could not be opened.");
  return `Opened ${distanceYards} yd live holdover calibration for ${result.userName}.`;
}
async function configureFishing(root) {
  const api = runtimeFishingApi();
  const region = updateSelectedRegionText(root);
  if (!api?.inject) throw new Error("Fishing is unavailable in the consolidated module.");
  if (!region) throw new Error("Select one Region on the Regions layer first.");
  const biome = root.querySelector?.('[data-rw-hg="fishing-biome"]')?.value;
  const pondTier = root.querySelector?.('[data-rw-hg="fishing-tier"]')?.value;
  const result = await api.inject({ region, biome, pondTier });
  return `${result?.tier?.label ?? labelize(pondTier)} ${result?.definition?.label ?? labelize(biome)} pond configured.`;
}
async function clearFishing(root) {
  const api = runtimeFishingApi();
  const region = updateSelectedRegionText(root);
  if (!api?.clear) throw new Error("Fishing is unavailable in the consolidated module.");
  if (!region) throw new Error("Select one Region on the Regions layer first.");
  await api.clear(region);
  return "Fishing configuration cleared from the selected Region.";
}
async function testFishing(root) {
  const api = runtimeFishingApi();
  const fishRarity = root.querySelector?.('[data-rw-hg="fishing-rarity"]')?.value ?? "common";
  const targetUserId = root.querySelector?.('[data-rw-hg="fishing-player"]')?.value ?? "self";
  if (!api?.fishing?.test) throw new Error("Fishing is unavailable in the consolidated module.");
  if (targetUserId === "self") { await api.fishing.test({ fishRarity }); return `Opened a ${labelize(fishRarity)} fishing test on this screen.`; }
  if (!api.fishing.testForPlayer) throw new Error("This Fishing build does not expose remote HUD tests yet.");
  const result = await api.fishing.testForPlayer({ userId: targetUserId, fishRarity });
  if (!result?.success) throw new Error(result?.message ?? "The fishing test could not be opened.");
  return `Opened a ${labelize(fishRarity)} fishing test for ${result.userName}.`;
}
async function configureMining(root) {
  const api = runtimeMiningApi();
  const region = updateSelectedRegionText(root);
  if (!api?.configureRegion) throw new Error("Mining is unavailable in the consolidated module.");
  if (!region) throw new Error("Select one Region on the Regions layer first.");
  const oreId = root.querySelector?.('[data-rw-hg="mining-ore"]')?.value;
  const ore = api.catalog?.get?.(oreId);
  await api.configureRegion({ region, oreId });
  return `${ore?.name ?? "Mining"} deposit configured.`;
}
async function clearMining(root) {
  const api = runtimeMiningApi();
  const region = updateSelectedRegionText(root);
  if (!api?.clearRegion) throw new Error("Mining is unavailable in the consolidated module.");
  if (!region) throw new Error("Select one Region on the Regions layer first.");
  await api.clearRegion(region);
  return "Mining configuration cleared from the selected Region.";
}
async function testMining(root) {
  const api = runtimeMiningApi();
  const oreId = root.querySelector?.('[data-rw-hg="mining-test-ore"]')?.value;
  const targetUserId = root.querySelector?.('[data-rw-hg="mining-player"]')?.value ?? "self";
  const ore = api?.catalog?.get?.(oreId);
  if (!api?.test?.open) throw new Error("Mining is unavailable in the consolidated module.");
  if (targetUserId === "self") { await api.test.open({ oreId }); return `Opened the ${ore?.name ?? "mining"} test on this screen.`; }
  const result = await api.test.request(targetUserId, { oreId });
  if (!result?.success) throw new Error(result?.message ?? "The mining test could not be opened.");
  return `Opened the ${ore?.name ?? "mining"} test for ${result.userName}.`;
}
const ACTIONS = Object.freeze({
  "hunting-run-test": runHuntingTestMode,
  "hunting-ballistics": openHuntingBallisticsLab,
  "fishing-configure": configureFishing,
  "fishing-clear": clearFishing,
  "fishing-test": testFishing,
  "mining-configure": configureMining,
  "mining-clear": clearMining,
  "mining-test": testMining
});
function createHuntingGatheringHUD(DialogV2) {
  return class HuntingGatheringHUD extends DialogV2 {
    constructor({ tab = null } = {}) {
      const fishing = runtimeFishingApi();
      const mining = runtimeMiningApi();
      const availability = huntingGatheringAvailability({ fishing, mining });
      const initialTab = normalizeActivity(tab, availability);
      super({
        classes: ["rw-hg-dialog"],
        window: { title: "Regionwright: Hunting & Gathering", icon: "fa-solid fa-leaf", resizable: true, minimizable: false },
        position: { width: 480, height: 540 },
        content: createHuntingGatheringHUDMarkup({ fishing, mining, activeTab: initialTab }),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }]
      });
      this.initialTab = initialTab;
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.element?.[0] ?? this.element;
      updateSelectedRegionText(root);
      syncHuntingTestModeControls(root);
      root?.querySelector?.('[data-rw-hg="hunting-test-mode"]')?.addEventListener("change", () => syncHuntingTestModeControls(root));
      root?.addEventListener("click", event => {
        const tab = event.target?.closest?.('[data-rw-hg-tab]');
        if (tab) { event.preventDefault(); setTab(root, tab.dataset.rwHgTab); return; }
        const button = event.target?.closest?.('[data-rw-hg-action]');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const action = ACTIONS[button.dataset.rwHgAction];
        if (!action) return;
        button.disabled = true;
        void action(root).then(message => {
          setStatus(root, message, "success");
          globalThis.ui?.notifications?.info?.(message);
          updateSelectedRegionText(root);
        }).catch(error => {
          const message = error instanceof Error ? error.message : String(error ?? "Unable to complete that action.");
          setStatus(root, message, "error");
          globalThis.ui?.notifications?.error?.(message);
        }).finally(() => { button.disabled = false; });
      });
    }
    refreshRegion() {
      const root = this.element?.[0] ?? this.element;
      return updateSelectedRegionText(root);
    }
    async close(options = {}) {
      if (activeDialog === this) activeDialog = null;
      return super.close(options);
    }
  };
}
export async function openHuntingGatheringHUD({ tab = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can open Regionwright: Hunting & Gathering.");
  if (activeDialog) {
    const root = activeDialog.element?.[0] ?? activeDialog.element;
    if (tab) setTab(root, tab);
    activeDialog.refreshRegion?.();
    activeDialog.bringToFront?.();
    return activeDialog;
  }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  activeDialog = new (createHuntingGatheringHUD(DialogV2))({ tab });
  await activeDialog.render({ force: true });
  return activeDialog;
}
export const api = Object.freeze({
  version: HUD_VERSION,
  activities: HUNTING_GATHERING_ACTIVITIES,
  availability: huntingGatheringAvailability,
  markup: createHuntingGatheringHUDMarkup,
  hunting: Object.freeze({
    open: openHunting,
    test: openHuntingTest,
    liveCalibration: openHuntingCalibration,
    testModes: HUNTING_TEST_MODES,
    testMode: openHuntingTestMode,
    requestTest: requestHuntingTest,
    requestLiveCalibration: requestHuntingCalibration,
    requestTestMode: requestHuntingTestMode,
    findBow: findHuntingBow,
    bowItemSource: createHuntingBowItemSource,
    ballisticsLab: openBallisticsLab
  }),
  fishing: fishingApi,
  mining: miningApi,
  migrate: Object.freeze({ legacyFlags: true }),
  open: openHuntingGatheringHUD
});
const hooks = globalThis.Hooks;
hooks?.on?.("getSceneControlButtons", registerHuntingGatheringRegionControl);
hooks?.on?.("controlRegion", () => activeDialog?.refreshRegion?.());
hooks?.on?.("canvasReady", () => activeDialog?.refreshRegion?.());
hooks?.once?.("init", () => {
  const module = globalThis.game?.modules?.get?.(MODULE_ID);
  if (module) module.api = api;
});
hooks?.once?.("setup", () => { installHuntingSocket(); });
hooks?.once?.("ready", () => {
  const module = globalThis.game?.modules?.get?.(MODULE_ID);
  if (module) module.api = api;
  installHuntingSocket();
  if (activeGM()) {
    void Promise.all([installHuntingBow(), migrateLegacyFlags()]).then(([result, migration]) => {
      if (result?.created) globalThis.ui?.notifications?.info?.("Regionwright Hunting Bow added to the Items directory.");
      const migrationNotes = [];
      if (migration?.moved) migrationNotes.push(`${migration.moved} data field${migration.moved === 1 ? "" : "s"} migrated`);
      if (migration?.assetPaths) migrationNotes.push(`${migration.assetPaths} legacy asset path${migration.assetPaths === 1 ? "" : "s"} updated`);
      if (migrationNotes.length) globalThis.ui?.notifications?.info?.(`Regionwright Hunting & Gathering migration complete: ${migrationNotes.join("; ")}.`);
      if (migration?.failed?.length) globalThis.ui?.notifications?.warn?.(`${migration.failed.length} legacy document update${migration.failed.length === 1 ? "" : "s"} need retry; details are in the GM console.`);
    }).catch(error => {
      console.error(`[${MODULE_ID}] Unable to install Hunting Bow.`, error);
      globalThis.ui?.notifications?.error?.("The Regionwright Hunting Bow could not be installed.");
    });
  }
  globalThis.Hooks?.callAll?.(`${MODULE_ID}.ready`, api);
});
