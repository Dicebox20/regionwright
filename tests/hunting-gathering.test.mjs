import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
const previousHooks = globalThis.Hooks;
globalThis.Hooks = { on: () => undefined, once: () => undefined };
const { HUNTING_GATHERING_ACTIVITIES, api, createHuntingGatheringHUDMarkup, huntingGatheringAvailability, registerHuntingGatheringRegionControl } = await import(`../modules/regionwright-hunting-gathering/module.js?test=${Date.now()}`);
const { migrateLegacyFlags } = await import("../modules/regionwright-hunting-gathering/migration.js");
if (previousHooks === undefined) delete globalThis.Hooks; else globalThis.Hooks = previousHooks;
function stubs() {
  const fishing = {
    catalog: {
      order: ["forest", "swamp"],
      biomes: { forest: { id: "forest", label: "Forest" }, swamp: { id: "swamp", label: "Swamp" } },
      pondTierOrder: ["common", "rare"],
      pondTiers: { common: { id: "common", label: "Common Pond" }, rare: { id: "rare", label: "Rare Pond" } },
      rarities: ["common", "rare", "legendary"]
    },
    inject: async () => ({}), clear: async () => ({}),
    fishing: { test: async () => ({}), testForPlayer: async () => ({ success: true }) }
  };
  const ores = [
    { id: "iron-ore", name: "Iron Ore", difficultyLabel: "Common" },
    { id: "arandur-ore", name: "Arandur Ore", difficultyLabel: "Legendary+" }
  ];
  const mining = {
    catalog: { order: ores.map(o => o.id), get: id => ores.find(o => o.id === id) },
    configureRegion: async () => ({}), clearRegion: async () => ({}),
    test: { open: async () => ({}), request: async () => ({ success: true }) }
  };
  return { fishing, mining };
}
test("Hunting & Gathering mini-HUD has exactly four product activities", () => {
  assert.deepEqual(HUNTING_GATHERING_ACTIVITIES.map(a => a.id), ["hunting", "fishing", "mining", "gathering"]);
});
test("availability exposes Hunting, Fishing, and Mining from one module API", () => {
  const { fishing, mining } = stubs();
  const state = huntingGatheringAvailability({ fishing, mining });
  assert.equal(state.hunting.available, true);
  assert.equal(state.fishing.available, true);
  assert.equal(state.mining.available, true);
  assert.equal(state.gathering.available, false);
});
test("mini-HUD renders Hunting, Fishing, and Mining controls while Gathering stays planned", () => {
  const { fishing, mining } = stubs();
  const markup = createHuntingGatheringHUDMarkup({ fishing, mining, activeTab: "fishing", selectedRegionName: "North Woods", players: [{ id: "p1", name: "Player One", active: true, isGM: false }] });
  assert.equal((markup.match(/data-rw-hg-tab=/g) ?? []).length, 4);
  assert.match(markup, /Selected Region: North Woods/);
  assert.match(markup, /data-rw-hg-action="fishing-configure"/);
  assert.match(markup, /data-rw-hg-action="fishing-test"/);
  assert.match(markup, /Forest/);
  assert.match(markup, /Rare Pond/);
  assert.match(markup, /Legendary/);
  assert.match(markup, /data-rw-hg-action="mining-configure"/);
  assert.match(markup, /Arandur Ore - Legendary\+/);
  assert.match(markup, /data-rw-hg-action="hunting-run-test"/);
  assert.match(markup, /data-rw-hg="hunting-test-mode"/);
  assert.match(markup, /Normal Test Hunt/);
  assert.match(markup, /Live Trained Holdover/);
  assert.match(markup, /Movement Calibration/);
  assert.match(markup, /data-rw-hg="hunting-test-range"/);
  assert.match(markup, /data-rw-hg-action="hunting-ballistics"/);
  assert.match(markup, /dedicated Regionwright Hunting Bow/);
  assert.match(markup, /Gathering is not implemented yet/);
});
test("mini-HUD remains useful when Fishing or Mining is disabled", () => {
  const markup = createHuntingGatheringHUDMarkup({ fishing: null, mining: null, players: [], activeTab: "hunting" });
  assert.match(markup, /data-rw-hg-action="hunting-run-test"/);
  assert.match(markup, /dedicated Regionwright Hunting Bow/);
  assert.match(markup, /Fishing unavailable/);
  assert.match(markup, /Mining unavailable/);
  assert.match(markup, /Gathering is not implemented yet/);
});
test("Region Controls registration is GM-only and adds one Hunting & Gathering tool", () => {
  const previousGame = globalThis.game;
  try {
    const controls = { regions: { tools: {} } };
    globalThis.game = { user: { isGM: true } };
    assert.equal(registerHuntingGatheringRegionControl(controls), true);
    assert.equal(registerHuntingGatheringRegionControl(controls), false);
    assert.equal(Object.keys(controls.regions.tools).length, 1);
    assert.equal(controls.regions.tools["regionwright-hunting-gathering-region-control"].title, "Hunting & Gathering");
    globalThis.game = { user: { isGM: false } };
    assert.equal(registerHuntingGatheringRegionControl({ regions: { tools: {} } }), false);
  } finally { globalThis.game = previousGame; }
});
test("H&G exposes one switchable Hunting test-mode launcher while preserving compatibility APIs", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/module.js", import.meta.url), "utf8");
  assert.match(source, /"hunting-run-test": runHuntingTestMode/);
  assert.match(source, /testModes: HUNTING_TEST_MODES/);
  assert.match(source, /testMode: openHuntingTestMode/);
  assert.match(source, /requestTestMode: requestHuntingTestMode/);
  assert.match(source, /liveCalibration: openHuntingCalibration/);
  assert.match(source, /requestLiveCalibration: requestHuntingCalibration/);
  assert.match(source, /test: openHuntingTest/);
  assert.match(source, /requestTest: requestHuntingTest/);
  assert.match(source, /syncHuntingTestModeControls/);
  assert.ok(api.fishing?.catalog);
  assert.ok(api.mining?.catalog);
});

test("manifest is a standalone Foundry v14 module with Hunting socket support", async () => {
  const manifest = JSON.parse(await readFile(new URL("../modules/regionwright-hunting-gathering/module.json", import.meta.url), "utf8"));
  assert.equal(manifest.id, "regionwright-hunting-gathering");
  assert.equal(manifest.version, "0.4.2");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.socket, true);
  assert.deepEqual(manifest.packs.map(pack => pack.name), ["fishing-items", "mining-resources"]);
});


test("H&G inherits native Foundry application and form styling", async () => {
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  const { fishing, mining } = stubs();
  const markup = createHuntingGatheringHUDMarkup({ fishing, mining, activeTab: "hunting", players: [] });
  assert.match(markup, /rw-hg-hud standard-form/);
  assert.match(markup, /class="tabs rw-hg-tabs"/);
  assert.equal((markup.match(/data-tab=/g) ?? []).length, 4);
  assert.doesNotMatch(css, /--rw-surface|backdrop-filter|\.window-content\s*\{/);
  assert.doesNotMatch(css, /\.rw-hg-hud button\s*\{|\.rw-hg-hud select\s*\{|--button-background-color/);
  assert.match(css, /var\(--color-border\)/);
  assert.match(css, /var\(--color-form-hint\)/);
  assert.match(css, /var\(--color-warm-1\)/);
  assert.match(css, /Game-specific visual surface/);
});

test("active-GM migration moves only legacy Hunting, Fishing, and Mining fields", async () => {
  const regionUpdates = [];
  const itemUpdates = [];
  const region = {
    flags: { "regionwright-fishing": { fishingSpot: { version: 3, pondTier: "rare" } } },
    async update(data) { regionUpdates.push(data); }
  };
  const item = {
    flags: { "regionwright-mining": { ore: { oreId: "gold-ore" } } },
    async update(data) { itemUpdates.push(data); }
  };
  const result = await migrateLegacyFlags({
    user: { isGM: true },
    scenes: [{ regions: [region] }],
    actors: [{ items: [item] }],
    items: [],
    macros: []
  });
  assert.equal(result.moved, 2);
  assert.equal(regionUpdates[0]["flags.regionwright-hunting-gathering.fishingSpot"].pondTier, "rare");
  assert.equal(regionUpdates[0]["flags.regionwright-fishing.fishingSpot"], null);
  assert.equal(itemUpdates[0]["flags.regionwright-hunting-gathering.ore"].oreId, "gold-ore");
  assert.equal(itemUpdates[0]["flags.regionwright-mining.ore"], null);
});
