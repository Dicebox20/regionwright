import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BAIT_CATALOG,
  BIOME_ORDER,
  FISHING_BIOMES,
  createBaitItemSource,
  createFishingItemSources,
  getBiomeBait,
  getFishingBiome,
  normalizeBiomeId
} from "../modules/regionwright-hunting-gathering/fishing-catalog.js";
import { createFishingCatalog, createFishItemSource } from "../modules/regionwright-hunting-gathering/fishing-engine.js";
import { FISH_RARITIES, POND_TIER_ORDER, POND_TIERS } from "../modules/regionwright-hunting-gathering/fishing-rarity.js";
import {
  chooseSrdImage,
  createFishingImageMacroSource,
  FISHING_IMAGE_MACRO_ID,
  FISHING_IMAGE_MACRO_NAME,
  isDndSrdItemPack,
  isCreatureSrdImage,
  isUsableSrdImage
} from "../modules/regionwright-hunting-gathering/fishing-srd-images.js";

test("Fishing Biomes covers the official environment set and waterborne alias", () => {
  assert.deepEqual(BIOME_ORDER, ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "urban", "underwater"]);
  assert.equal(normalizeBiomeId("waterborne"), "underwater");
  assert.equal(getFishingBiome("Waterborne"), FISHING_BIOMES.underwater);
});

test("Every injected biome has valid fish and biome-specific bait", () => {
  for (const biome of Object.values(FISHING_BIOMES)) {
    assert.ok(biome.summary.length > 0);
    assert.ok(biome.officialBasis.length > 0);
    const fish = createFishingCatalog(biome.fish);
    assert.ok(fish.length >= 3);
    assert.ok(fish.every(entry => ["common", "uncommon", "rare", "very rare", "legendary"].includes(entry.rarity)));
    for (const rarity of FISH_RARITIES) assert.ok(fish.some(entry => entry.rarity === rarity), `${biome.id} needs a ${rarity} fish`);
    for (const baitId of biome.baitIds) assert.equal(getBiomeBait(biome, baitId).id, baitId);
  }
});

test("Pond tier rarity distributions are complete and Legendary is only a 2% top-tier chance", () => {
  assert.deepEqual(POND_TIER_ORDER, ["common", "uncommon", "rare"]);
  for (const tier of Object.values(POND_TIERS)) {
    assert.equal(Object.values(tier.rarityWeights).reduce((sum, weight) => sum + weight, 0), 100);
  }
  assert.equal(POND_TIERS.common.rarityWeights["very rare"] ?? 0, 0);
  assert.equal(POND_TIERS.common.rarityWeights.legendary ?? 0, 0);
  assert.equal(POND_TIERS.uncommon.rarityWeights.legendary ?? 0, 0);
  assert.equal(POND_TIERS.rare.rarityWeights.legendary, 2);
});

test("Fishing catalog records ration, material, and eating metadata", () => {
  const fish = FISHING_BIOMES.swamp.fish.find(entry => entry.id === "piranha");
  const normalized = createFishingCatalog([fish])[0];
  assert.equal(normalized.catchType, "material");
  assert.equal(normalized.ration, 0);
  assert.equal(normalized.source, "official creature");
  const item = createFishItemSource(normalized);
  assert.equal(item.flags["regionwright-hunting-gathering"].fishing.catchType, "material");
  assert.match(item.system.description.value, /Not intended as a ration/);
});

test("Bait injection sources are stackable loot items with stable flags", () => {
  const bait = createBaitItemSource(BAIT_CATALOG.leeches, 3);
  assert.equal(bait.name, "Leeches");
  assert.equal(bait.system.quantity, 3);
  assert.equal(bait.flags["regionwright-hunting-gathering"].bait.baitId, "leeches");
  const packed = createBaitItemSource(BAIT_CATALOG.leeches, 2, { containerId: "tackle-id" });
  assert.equal(packed.system.container, "tackle-id");
});

test("Fishing item catalog includes every gear and bait document", () => {
  const sources = createFishingItemSources();
  assert.equal(sources.length, 26);
  assert.equal(sources[0].flags["regionwright-hunting-gathering"].fishingGear.gearId, "fishing-pole");
  assert.equal(sources[1].flags["regionwright-hunting-gathering"].fishingTackle.itemId, "fishing-tackle");
  assert.equal(sources.slice(2).every(source => source.flags["regionwright-hunting-gathering"].bait?.baitId), true);
});

test("GM fishing HUD renders one clearly labeled button for every biome", async () => {
  const previousHooks = globalThis.Hooks;
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  try {
    const { createFishingHudMarkup, safeFishingHudPosition } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?hud-test=${Date.now()}`);
    assert.match(createFishingHudMarkup(), /Setup: select a Region/);
    const markup = createFishingHudMarkup({
      selectedRegionName: "Pond Region",
      activePlayers: [{ id: "player-one", name: "Player One", active: true, isGM: false }, { id: "offline-player", name: "Offline", active: false, isGM: false }]
    });
    assert.equal((markup.match(/data-fishing-biome=/g) ?? []).length, BIOME_ORDER.length);
    for (const biomeId of BIOME_ORDER) assert.match(markup, new RegExp(`>${FISHING_BIOMES[biomeId].label}<`));
    assert.match(markup, /Selected: Pond Region/);
    assert.match(markup, /data-fishing-hud-toggle/);
    assert.match(markup, /data-fishing-hud-drag/);
    assert.equal((markup.match(/data-fishing-test-start/g) ?? []).length, 1);
    assert.equal((markup.match(/<option value=/g) ?? []).length, FISH_RARITIES.length + 2);
    assert.match(markup, /data-fishing-test-player/);
    assert.match(markup, /value="player-one">Player One/);
    assert.doesNotMatch(markup, /Offline/);
    assert.match(markup, /Choose an active player to open the test on their screen/);
    assert.ok(markup.indexOf("rw-fishing-hud-buttons") < markup.indexOf("rw-fishing-hud-test"));
    const safePosition = safeFishingHudPosition({ viewportWidth: 1912, hudWidth: 208, controlsRight: 304, sidebarLeft: 1550 });
    assert.ok(safePosition.left >= 304);
    assert.ok(safePosition.left + 208 < 1550);
    const noSidebarPosition = safeFishingHudPosition({ viewportWidth: 1912, hudWidth: 208, controlsRight: 304 });
    assert.ok(noSidebarPosition.left + 208 <= 1912 - 64);
    const hudStyles = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/fishing.css", import.meta.url), "utf8");
    assert.match(hudStyles, /\.rw-fishing-hud\s*\{[^}]*pointer-events:\s*none/s);
    assert.match(hudStyles, /\.rw-fishing-hud\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    assert.match(hudStyles, /max-height:\s*min\(calc\(100vh - 1\.5rem\),\s*48rem\)/);
    assert.match(hudStyles, /\.rw-fishing-hud-heading\s*\{[^}]*display:\s*grid/s);
    assert.match(hudStyles, /\.rw-fishing-hud-status\s*\{[^}]*grid-row:\s*2/s);
    assert.match(hudStyles, /\.rw-fishing-hud-test select,[\s\S]*?pointer-events:\s*auto/);
    const expanded = createFishingHudMarkup({ expandedBiomeId: "forest" });
    assert.equal((expanded.match(/data-fishing-pond-tier=/g) ?? []).length, POND_TIER_ORDER.length);
    assert.match(expanded, /aria-expanded="true"/);
    assert.match(expanded, /Very Rare/i);
    assert.match(expanded, /Legendary 2%/);
    const miningOres = [
      ["iron-ore", "Iron Ore", "Common"], ["tin-ore", "Tin Ore", "Common"], ["copper-ore", "Copper Ore", "Common"],
      ["silver-ore", "Silver Ore", "Uncommon"], ["gold-ore", "Gold Ore", "Rare"], ["platinum-ore", "Platinum Ore", "Very Rare"],
      ["mithral-ore", "Mithral Ore", "Exceptional"], ["hizagkuur", "Hizagkuur", "Legendary"], ["arandur-ore", "Arandur Ore", "Legendary+"]
    ].map(([id, name, difficultyLabel]) => ({ id, name, difficultyLabel, price: { value: 1, denomination: "gp" } }));
    const miningStub = {
      catalog: {
        order: miningOres.map(ore => ore.id),
        get: id => miningOres.find(ore => ore.id === id) ?? null,
        value: ore => `${ore.price.value} ${ore.price.denomination}`
      }
    };
    const gathering = createFishingHudMarkup({ mining: miningStub, activeTab: "mining", activePlayers: [{ id: "player-one", name: "Player One", active: true, isGM: false }] });
    assert.match(gathering, /Regionwright Gathering/);
    assert.equal((gathering.match(/data-gathering-tab=/g) ?? []).length, 2);
    assert.equal((gathering.match(/data-mining-configure-ore=/g) ?? []).length, 9);
    assert.equal((gathering.match(/data-mining-test-start/g) ?? []).length, 1);
    assert.match(gathering, /Arandur Ore - Legendary\+/);
    assert.match(gathering, /data-gathering-panel="mining"/);
    assert.match(hudStyles, /\.rw-gathering-tabs\s*\{/);
    assert.match(hudStyles, /\.rw-mining-hud-ore/);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
  }
});

test("Fishing difficulty tests launch each rarity without an actor, gear, or inventory changes", async () => {
  const previousFoundry = globalThis.foundry;
  const previousGame = globalThis.game;
  const previousChatMessage = globalThis.ChatMessage;
  let inventoryWrites = 0;
  let chatMessages = 0;
  class MockDialogV2 {
    async render() { return this; }
    async close() { return this; }
  }
  globalThis.foundry = { applications: { api: { DialogV2: MockDialogV2 } } };
  globalThis.game = { user: { isGM: true } };
  globalThis.ChatMessage = { async create() { chatMessages += 1; } };
  try {
    const { openFishingTest } = await import(`../modules/regionwright-hunting-gathering/fishing.js?difficulty-test=${Date.now()}`);
    for (const fishRarity of FISH_RARITIES) {
      const region = {
        documentName: "Region",
        uuid: `Scene.fishing-difficulty-test.${fishRarity.replaceAll(" ", "-")}`,
        name: "Test Pond",
        getFlag: () => null
      };
      const dialog = await openFishingTest({ region, fishRarity });
      assert.equal(dialog.testMode, true);
      assert.equal(dialog.actor.name, "Test Angler");
      assert.equal(dialog.hookedFish.rarity, fishRarity);
      assert.equal(dialog.challenge.fishRarity, fishRarity);
      await dialog._finishCatch();
      assert.equal(dialog.resultKind, "test-caught");
      await dialog.close();
    }
    assert.equal(inventoryWrites, 0);
    assert.equal(chatMessages, 0);
    globalThis.game.user.isGM = false;
    await assert.rejects(
      openFishingTest({ region: { documentName: "Region", uuid: "Scene.non-gm-test", getFlag: () => null }, fishRarity: "common" }),
      /Only a GM can run fishing difficulty tests/
    );
  } finally {
    if (previousFoundry === undefined) delete globalThis.foundry;
    else globalThis.foundry = previousFoundry;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
    if (previousChatMessage === undefined) delete globalThis.ChatMessage;
    else globalThis.ChatMessage = previousChatMessage;
  }
});

test("Fishing HUD difficulty test is standalone with no selected Region or controlled token", async () => {
  const previousGlobals = Object.fromEntries(["Hooks", "game", "canvas", "foundry", "ChatMessage", "ui"].map(key => [key, globalThis[key]]));
  const callbacks = new Map();
  const notices = [];
  const emitted = [];
  class MockDialogV2 {
    async render() { return this; }
    async close() { return this; }
  }
  globalThis.Hooks = {
    on(name, callback) { callbacks.set(name, callback); },
    once(name, callback) { callbacks.set(name, callback); }
  };
  const players = [
    { id: "gm", name: "Gamemaster", isGM: true, active: true },
    { id: "player-one", name: "Player One", isGM: false, active: true },
    { id: "offline-player", name: "Offline", isGM: false, active: false }
  ];
  let socketHandler;
  globalThis.game = {
    user: { id: "gm", isGM: true, character: null },
    users: { contents: players, activeGM: players[0], get: id => players.find(user => user.id === id) },
    socket: {
      on: (_channel, callback) => { socketHandler = callback; },
      emit: (...args) => {
        emitted.push(args);
        const payload = args[1];
        if (payload?.action === "fishing-open-test") queueMicrotask(() => socketHandler({
          action: "fishing-test-opened",
          requestId: payload.requestId,
          recipientUserId: "gm",
          playerUserId: "player-one",
          success: true
        }));
      }
    }
  };
  globalThis.canvas = { regions: { controlled: [] }, tokens: { controlled: [] } };
  globalThis.foundry = { applications: { api: { DialogV2: MockDialogV2 } } };
  globalThis.ChatMessage = { async create() { throw new Error("A fishing test must not create a chat reward."); } };
  globalThis.ui = { notifications: { info: message => notices.push(message), warn: message => notices.push(message), error: message => notices.push(message) } };
  try {
    const module = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?region-only-hud-test=${Date.now()}`);
    const sent = await module.testFishingFromHud("very rare", "player-one");
    assert.deepEqual(sent, { success: true, message: null, userId: "player-one", userName: "Player One", fishRarity: "very rare" });
    assert.equal(emitted[0][1].action, "fishing-open-test");
    assert.equal(emitted[0][1].recipientUserId, "player-one");
    assert.equal(emitted[0][1].fishRarity, "very rare");
    const dialog = await module.testFishingFromHud("rare");
    assert.equal(dialog.testMode, true);
    assert.equal(dialog.hookedFish.rarity, "rare");
    assert.equal(dialog.actor.name, "Test Angler");
    assert.equal(dialog.region.name, "Test Pond");
    assert.equal(globalThis.canvas.regions.controlled.length, 0, "the HUD test must not require a selected Region");
    assert.equal(globalThis.canvas.tokens.controlled.length, 0, "the HUD test must not require a selected token");
    assert.deepEqual(notices, ["Fishing test opened for Player One."]);
    await dialog.close();
  } finally {
    for (const [key, value] of Object.entries(previousGlobals)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

test("Fishing test socket opens only on the selected player's client when sent by the active GM", async () => {
  const previousGlobals = Object.fromEntries(["Hooks", "game", "foundry", "ui"].map(key => [key, globalThis[key]]));
  const dialogs = [];
  const notices = [];
  let socketHandler;
  class MockDialogV2 {
    constructor() { dialogs.push(this); }
    async render() { return this; }
    async close() { return this; }
  }
  const playerCharacter = { documentName: "Actor", uuid: "Actor.player-one", name: "Player One's Character" };
  const users = [
    { id: "gm", name: "Gamemaster", isGM: true, active: true },
    { id: "player-one", name: "Player One", isGM: false, active: true }
  ];
  globalThis.Hooks = { on: () => undefined };
  const emitted = [];
  globalThis.game = {
    user: { id: "player-one", isGM: false, character: playerCharacter },
    users: { contents: users, activeGM: users[0], get: id => users.find(user => user.id === id) },
    socket: {
      on: (_channel, callback) => { socketHandler = callback; },
      emit: (...args) => emitted.push(args)
    }
  };
  globalThis.foundry = { applications: { api: { DialogV2: MockDialogV2 } } };
  globalThis.ui = { notifications: { info: message => notices.push(message), error: message => notices.push(message) } };
  try {
    const { installFishingSocket } = await import(`../modules/regionwright-hunting-gathering/fishing.js?remote-player-test=${Date.now()}`);
    assert.equal(installFishingSocket(), true);
    socketHandler({ action: "fishing-open-test", requestId: "spoofed", requesterUserId: "player-one", recipientUserId: "player-one", fishRarity: "legendary" });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(dialogs.length, 0, "another player cannot spoof the active GM's test command");
    socketHandler({ action: "fishing-open-test", requestId: "wrong-target", requesterUserId: "gm", recipientUserId: "someone-else", fishRarity: "rare" });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(dialogs.length, 0, "the test opens only for its intended recipient");
    socketHandler({ action: "fishing-open-test", requestId: "valid", requesterUserId: "gm", recipientUserId: "player-one", fishRarity: "legendary" });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].testMode, true);
    assert.equal(dialogs[0].actor, playerCharacter);
    assert.equal(dialogs[0].hookedFish.rarity, "legendary");
    assert.equal(dialogs[0].region.name, "Test Pond");
    assert.equal(emitted.length, 1);
    assert.deepEqual(emitted[0][1], {
      action: "fishing-test-opened",
      requestId: "valid",
      recipientUserId: "gm",
      playerUserId: "player-one",
      success: true
    });
    assert.deepEqual(notices, ["A GM started a fishing difficulty test for you. No bait or fish will be used."]);
    await dialogs[0].close();
  } finally {
    for (const [key, value] of Object.entries(previousGlobals)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});

test("Fishing module manifest enables the Foundry socket namespace", async () => {
  const manifest = JSON.parse(await readFile(new URL("../modules/regionwright-hunting-gathering/module.json", import.meta.url), "utf8"));
  assert.equal(manifest.socket, true);
  assert.equal(manifest.version, "0.4.0");
});

test("Fishing owns the only Region Controls tool after legacy controls are removed", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user: { isGM: true } };
  try {
    const { registerHuntingGatheringRegionControl } = await import(`../modules/regionwright-hunting-gathering/module.js?controls-test=${Date.now()}`);
    const controls = { regions: { tools: {} } };
    assert.equal(registerHuntingGatheringRegionControl(controls), true);
    assert.deepEqual(Object.values(controls.regions.tools).map(tool => tool.title), ["Hunting & Gathering"]);
    assert.equal(registerHuntingGatheringRegionControl(controls), false);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("Biome injection stores the selected pond tier in both fishing config and injection metadata", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  const updates = [];
  const flags = new Map();
  const region = {
    documentName: "Region",
    uuid: "Scene.test.Region.pond",
    async update(data) { updates.push(data); },
    async setFlag(scope, key, value) { flags.set(`${scope}.${key}`, value); }
  };
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user: { isGM: true } };
  try {
    const { api } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?tier-injection-test=${Date.now()}`);
    const result = await api.inject({ region, biome: "forest", pondTier: "rare" });
    assert.equal(result.config.pondTier, "rare");
    assert.equal(result.injection.pondTierId, "rare");
    assert.equal(flags.size, 0);
    const stored = updates.find(update => update["flags.regionwright-hunting-gathering.fishingSpot"])?.["flags.regionwright-hunting-gathering.fishingSpot"];
    assert.equal(stored.pondTier, "rare");
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("Fishing item installer creates missing world Items and is idempotent", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  const previousItem = globalThis.Item;
  const created = [];
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user: { isGM: true }, items: { values: () => created } };
  globalThis.Item = class {
    static async createDocuments(sources) {
      created.push(...sources.map(source => ({ flags: source.flags })));
      return sources;
    }
  };
  try {
    const { installFishingItems } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?items-test=${Date.now()}`);
    const first = await installFishingItems();
    assert.equal(first.created, 26);
    assert.equal(first.existing, 0);
    const second = await installFishingItems();
    assert.equal(second.created, 0);
    assert.equal(second.existing, 26);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
    if (previousItem === undefined) delete globalThis.Item;
    else globalThis.Item = previousItem;
  }
});

test("Fishing compendium installer creates a populated fallback pack when the module pack is absent", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  const previousFoundry = globalThis.foundry;
  const previousCompendium = globalThis.CompendiumCollection;
  const created = [];
  const pack = {
    collection: "world.fishing-items",
    documentName: "Item",
    metadata: { label: "Fishing Gear & Bait" },
    getDocuments: async () => created,
    documentClass: class {
      static async createDocuments(sources) {
        created.push(...sources.map(source => ({ flags: source.flags })));
        return sources;
      }
    }
  };
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user: { isGM: true }, system: { id: "dnd5e" }, packs: new Map() };
  globalThis.foundry = { documents: { collections: { CompendiumCollection: class {
    static async createCompendium() {
      globalThis.game.packs.set("world.fishing-items", pack);
      return pack;
    }
  } } } };
  try {
    const { ensureFishingCompendium } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?pack-test=${Date.now()}`);
    const first = await ensureFishingCompendium();
    assert.equal(first.fallback, true);
    assert.equal(first.created, 26);
    const second = await ensureFishingCompendium();
    assert.equal(second.fallback, false);
    assert.equal(second.created, 0);
    assert.equal(second.existing, 26);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
    if (previousFoundry === undefined) delete globalThis.foundry;
    else globalThis.foundry = previousFoundry;
    if (previousCompendium === undefined) delete globalThis.CompendiumCollection;
    else globalThis.CompendiumCollection = previousCompendium;
  }
});

test("SRD image matching ignores generic placeholders and prefers exact D&D item artwork", () => {
  assert.equal(isDndSrdItemPack({ documentName: "Item", collection: "dnd5e.items", metadata: { packageName: "dnd5e", label: "Items (SRD)" } }), true);
  assert.equal(isDndSrdItemPack({ documentName: "Item", collection: "regionwright-fishing.fishing-items", metadata: { packageName: "regionwright-fishing", label: "Fishing Gear & Bait" } }), false);
  assert.equal(isUsableSrdImage("icons/svg/fish.svg"), false);
  assert.equal(isUsableSrdImage("systems/dnd5e/icons/fish.webp"), true);
  assert.equal(isCreatureSrdImage("systems/dnd5e/icons/creatures/fish/fish.webp"), true);
  assert.equal(isCreatureSrdImage("systems/dnd5e/icons/equipment/armor/half-plate.webp"), false);
  const match = chooseSrdImage("Fishing Pole", [
    { name: "Fish", img: "systems/dnd5e/icons/fish.webp" },
    { name: "Fishing Rod", img: "systems/dnd5e/icons/fishing-rod.webp" },
    { name: "Placeholder", img: "icons/svg/fish.svg" }
  ]);
  assert.equal(match.name, "Fishing Rod");
  assert.equal(chooseSrdImage("Bread Dough", [
    { name: "Half Plate", img: "systems/dnd5e/icons/equipment/armor/half-plate.webp" }
  ]), null);
});

test("Fishing SRD image assignment updates the editable world compendium and reports its work", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  const fishingItems = [
    { name: "Fishing Pole", img: "icons/svg/fish.svg", flags: { "regionwright-fishing": { fishingGear: { gearId: "fishing-pole" } } }, update: async function (data) { Object.assign(this, data); } },
    { name: "Worms", img: "icons/svg/fish.svg", flags: { "regionwright-fishing": { bait: { baitId: "worms" } } }, update: async function (data) { Object.assign(this, data); } }
  ];
  const fishingPack = {
    collection: "world.fishing-items",
    documentName: "Item",
    metadata: { label: "Fishing Gear & Bait", package: "world" },
    getDocuments: async () => fishingItems
  };
  const srdPack = {
    collection: "dnd5e.items",
    documentName: "Item",
    metadata: { packageName: "dnd5e", label: "Items (SRD)" },
    getIndex: async () => [
      { name: "Fishing Rod", img: "systems/dnd5e/icons/creatures/fish/fishing-rod.webp" },
      { name: "Fish", img: "systems/dnd5e/icons/creatures/fish/fish.webp" },
      { name: "Half Plate", img: "systems/dnd5e/icons/equipment/armor/half-plate.webp" },
      { name: "Broken Placeholder", img: "icons/svg/fish.svg" }
    ]
  };
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user: { isGM: true, id: "GM" }, packs: new Map([["world.fishing-items", fishingPack], ["dnd5e.items", srdPack]]), system: { id: "dnd5e" } };
  try {
    const { assignFishingSrdImages } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?images-test=${Date.now()}`);
    const result = await assignFishingSrdImages();
    assert.equal(result.updated, 2);
    assert.equal(result.missing.length, 0);
    assert.equal(fishingItems[0].img, "systems/dnd5e/icons/creatures/fish/fishing-rod.webp");
    assert.equal(fishingItems[1].img, "systems/dnd5e/icons/creatures/fish/fish.webp");
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("Fishing SRD image Macro is a fixed GM-only module binding", () => {
  const command = createFishingImageMacroSource();
  assert.match(command, /assignSrdImages/);
  assert.match(command, /Fishing image assignment complete/);
  assert.match(command, /Fishing image assignment failed/);
  assert.match(command, /Only a GM/);
  assert.equal(FISHING_IMAGE_MACRO_ID, "assign-srd-images");
  assert.match(FISHING_IMAGE_MACRO_NAME, /D&D SRD Images/);
});

test("Fishing SRD image Macro is placed on the first free GM hotbar slot", async () => {
  const previousHooks = globalThis.Hooks;
  const previousGame = globalThis.game;
  const macros = [];
  macros.documentClass = {
    create: async data => {
      const macro = { ...data, id: "fishing-image-macro", async update(next) { Object.assign(this, next); } };
      macros.push(macro);
      return macro;
    }
  };
  const user = {
    isGM: true,
    id: "GM",
    hotbar: {},
    async assignHotbarMacro(macro, slot) { this.hotbar[slot] = macro.id; }
  };
  globalThis.Hooks = { on: () => undefined, once: () => undefined };
  globalThis.game = { user, macros };
  try {
    const { ensureFishingImageMacro } = await import(`../modules/regionwright-hunting-gathering/fishing-runtime.js?macro-test=${Date.now()}`);
    const first = await ensureFishingImageMacro();
    assert.equal(first.created, 1);
    assert.equal(first.hotbarSlot, 1);
    assert.equal(user.hotbar[1], "fishing-image-macro");
    const second = await ensureFishingImageMacro();
    assert.equal(second.updated, 1);
    assert.equal(second.hotbarSlot, 1);
    assert.equal(macros.length, 1);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});
