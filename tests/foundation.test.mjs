import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { behaviorCatalog, BEHAVIOR_DEFINITIONS } from "../modules/regionwright/scripts/catalog.js";
import { buildCapabilitySnapshot } from "../modules/regionwright/scripts/capabilities.js";
import { createPlan, buildRegionBehaviorData, validatePlan } from "../modules/regionwright/scripts/plan.js";
import { captureSelection, selectedRegionDocuments } from "../modules/regionwright/scripts/selection.js";
import { applyPlan, buildReconciliationOperations } from "../modules/regionwright/scripts/write.js";
import { INTEGRATION_TEST_PROFILES, integrationSuiteReady, integrationTestProfile, runSceneToSceneTeleportTest } from "../modules/regionwright/scripts/test-routine.js";
import { createLockpickConfig, evaluateLockpickAttempt, LOCKPICK_DIFFICULTIES, lockpickDoorInteraction, requestLockpickAttempt, validateLockpickConfig } from "../modules/regionwright-puzzles-locks/scripts/lockpicking.js";
import { createPitfallTrapConfig, evaluateAthleticsCheck, evaluatePitfallDetection, handlePitfallTrap, passivePerception, pitfallBehaviorData, PITFALL_TRAP_KEY, PITFALL_TRAP_SOURCE, validatePitfallTrapConfig } from "../modules/regionwright/scripts/pitfall-trap.js";
import { buildBuilderContent, buildGuideContent, buildStudioContent, createBuilderState, mergeSelection, REGION_BEHAVIOR_RECIPES, reorderSelection, resetAfterGuidedApply, sceneRegionReferences, targetReferences, TOPICS, usesReducedMotion } from "../modules/regionwright/scripts/ui.js";
import { createSceneMomentScenarioBlueprint } from "../modules/regionwright/scripts/studio.js";

const sceneUuid = "Scene.test";
const regionA = { uuid: "Scene.test.Region.a", id: "a", name: "Entry", parent: { uuid: sceneUuid }, documentName: "Region" };
const regionB = { uuid: "Scene.test.Region.b", id: "b", name: "Exit", parent: { uuid: sceneUuid }, documentName: "Region" };

function runtimeConfig(...types) {
  return { RegionBehavior: { dataModels: Object.fromEntries(types.map(type => [type, class {}])) } };
}

function fakeRegion(region, { behaviors = [], failOnCreate = false } = {}) {
  const document = {
    ...region,
    behaviors: [...behaviors],
    async createEmbeddedDocuments(_name, data, options = {}) {
      if (failOnCreate) throw new Error("intentional create failure");
      const created = data.map((source, index) => ({
        ...structuredClone(source),
        id: options.keepId ? source._id ?? source.id : `created-${index}`,
        toObject() {
          const { toObject, ...documentData } = this;
          return structuredClone(documentData);
        }
      }));
      this.behaviors.push(...created);
      return created;
    },
    async updateEmbeddedDocuments(_name, updates) {
      return updates.map(update => {
        const current = this.behaviors.find(entry => entry.id === update._id);
        Object.assign(current, structuredClone(update));
        return current;
      });
    },
    async deleteEmbeddedDocuments(_name, ids) {
      const deleted = this.behaviors.filter(entry => ids.includes(entry.id));
      this.behaviors = this.behaviors.filter(entry => !ids.includes(entry.id));
      return deleted;
    },
    async update(data) {
      Object.assign(this, structuredClone(data));
      return this;
    }
  };
  return document;
}

test("manifest is valid JSON and declares the Foundry package contract", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../modules/regionwright/module.json", import.meta.url), "utf8"));
  assert.equal(manifest.id, "regionwright");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.socket, true);
  assert.deepEqual(manifest.esmodules, ["scripts/module.js"]);
  assert.equal(manifest.license, "LICENSE");
  assert.equal(manifest.title, "Regionwright: Studio");
  assert.deepEqual(manifest.styles, ["styles/regionwright.css", "styles/prompt-accessibility.css", "styles/ascendancy.css"]);
  assert.equal(fs.existsSync(new URL("../modules/regionwright/macros/open-regionwright.js", import.meta.url)), true);
  assert.equal(fs.existsSync(new URL("../docs/PROJECT_STANDARDS.md", import.meta.url)), true);
  assert.equal(fs.existsSync(new URL("../docs/MODULE_DEPENDENCIES.md", import.meta.url)), true);
});

test("capability snapshots intersect the local allowlist with registered Foundry types", () => {
  const snapshot = buildCapabilitySnapshot({ config: runtimeConfig("suppressWeather", "teleportToken") });
  assert.deepEqual(snapshot.supportedBehaviorTypes, ["suppressWeather", "teleportToken"]);
  assert.equal(snapshot.teleportRegistered, true);
  assert.equal(snapshot.arbitraryScriptGeneration, false);
  assert.equal(snapshot.arbitraryMacroGeneration, false);
});

test("catalog reports unavailable behavior types without hiding them", () => {
  const catalog = behaviorCatalog({ config: runtimeConfig("pauseGame") });
  assert.equal(catalog.find(entry => entry.key === "pause").available, true);
  assert.equal(catalog.find(entry => entry.key === "suppress-weather").status, "unavailable");
});

test("native behavior catalog exposes every registered core and system behavior for writes", () => {
  const catalog = behaviorCatalog({ config: runtimeConfig(
    "adjustDarknessLevel", "applyActiveEffect", "changeLevel", "defineSurface", "displayScrollingText",
    "dnd5e.difficultTerrain", "executeMacro", "executeScript", "modifyMovementCost", "pauseGame",
    "suppressWeather", "teleportToken", "toggleBehavior"
  ) });
  assert.equal(catalog.find(entry => entry.key === "darkness").category, "environment");
  assert.equal(catalog.find(entry => entry.key === "scrolling-text").category, "feedback");
  assert.equal(catalog.find(entry => entry.key === "teleport").category, "traversal");
  assert.equal(catalog.find(entry => entry.key === "difficult-terrain").category, "system");
  assert.equal(catalog.find(entry => entry.key === "execute-macro").advanced, true);
  assert.equal(catalog.find(entry => entry.key === "execute-script").writable, true);
  assert.equal(catalog.find(entry => entry.key === "teleport").writable, true);
});

test("every Region Behavior has an explicit guided recipe", () => {
  assert.deepEqual(
    Object.keys(REGION_BEHAVIOR_RECIPES).sort(),
    BEHAVIOR_DEFINITIONS.map(entry => entry.key).sort()
  );
  for (const [key, steps] of Object.entries(REGION_BEHAVIOR_RECIPES)) {
    assert.ok(steps.length >= 1, `${key} has at least one step`);
    assert.equal(steps[0].id, "regions", `${key} starts by choosing its Region`);
    for (const step of steps) {
      assert.ok(step.title.trim() || step.prompt.trim(), `${key}/${step.id} tells the GM what to do`);
    }
  }
  assert.deepEqual(REGION_BEHAVIOR_RECIPES["scrolling-text"].map(step => step.id), ["regions", "trigger", "message"]);
  assert.equal(REGION_BEHAVIOR_RECIPES["scrolling-text"][1].title, "", "the trigger step does not repeat its instruction");
  assert.deepEqual(REGION_BEHAVIOR_RECIPES.pause.map(step => step.id), ["regions", "frequency"]);
  assert.deepEqual(REGION_BEHAVIOR_RECIPES["difficult-terrain"].map(step => step.id), ["regions", "terrain-kind"]);
});

test("integration test routine requires evidence for every registered behavior", () => {
  assert.deepEqual(Object.keys(INTEGRATION_TEST_PROFILES).sort(), BEHAVIOR_DEFINITIONS.map(entry => entry.key).sort());
  assert.equal(integrationTestProfile("teleport").observation, "teleport");
  assert.deepEqual(integrationTestProfile("active-effects").requires, ["actor", "effectUuid"]);
  assert.equal(integrationSuiteReady([{ status: "passed" }, { status: "passed" }]), true);
  assert.equal(integrationSuiteReady([{ status: "passed" }, { status: "needs-review" }]), false);
  assert.equal(integrationSuiteReady([]), false);
});

test("cross-Scene teleport runner blocks an incomplete Scene fixture safely", async () => {
  const savedGame = globalThis.game;
  const savedCanvas = globalThis.canvas;
  globalThis.game = { user: { isGM: true }, settings: { get: () => true }, scenes: [] };
  globalThis.canvas = { scene: { uuid: "Scene.source" } };
  const result = await runSceneToSceneTeleportTest({ sourceScene: { uuid: "Scene.source" }, destinationScene: null });
  assert.equal(result.status, "blocked");
  assert.match(result.reason, /two different Scenes/i);
  globalThis.game = savedGame;
  globalThis.canvas = savedCanvas;
});

test("lockpicking creates deterministic difficulty-scaled puzzles and verifies attempts", () => {
  assert.deepEqual(Object.values(LOCKPICK_DIFFICULTIES).map(entry => entry.pins), [1, 2, 3, 4, 5]);
  const lock = createLockpickConfig({ difficulty: "hard", seed: "reliable-lock" });
  assert.equal(lock.version, 3);
  assert.equal(lock.targets.length, LOCKPICK_DIFFICULTIES.hard.pins);
  assert.ok(lock.targets.every(position => position >= 0 && position < LOCKPICK_DIFFICULTIES.hard.positions));
  assert.equal(new Set(lock.targets).size, lock.targets.length);
  assert.deepEqual(createLockpickConfig({ difficulty: "hard", seed: "reliable-lock" }), lock);
  assert.deepEqual(validateLockpickConfig(lock), lock);
  const success = evaluateLockpickAttempt(lock, { picks: lock.targets, tension: lock.tension });
  assert.equal(success.success, true);
  assert.equal(success.pinsSet, LOCKPICK_DIFFICULTIES.hard.pins);
  const failure = evaluateLockpickAttempt(lock, { picks: Array(lock.targets.length).fill(0), tension: 0 });
  assert.equal(failure.success, false);
  assert.match(failure.message, /pins set/i);
  const legacy = { version: 1, difficulty: "standard", targets: [0, 1, 2, 3], tension: 1 };
  assert.deepEqual(validateLockpickConfig(legacy), legacy);
  assert.throws(() => validateLockpickConfig({ version: 1, difficulty: "easy", targets: [0], tension: 0 }), /pins are invalid/i);
});

test("configured locked doors use the puzzle interaction without native door permission", () => {
  const config = createLockpickConfig({ difficulty: "easy", seed: "player-door" });
  const door = {
    documentName: "Wall",
    door: 1,
    ds: 2,
    flags: { regionwright: { lockpicking: config } }
  };
  const savedGame = globalThis.game;
  globalThis.game = { user: { isGM: false, can: () => false } };
  assert.equal(lockpickDoorInteraction(door), "puzzle");
  globalThis.game = savedGame;
});

test("player lockpick success is routed to the active GM instead of updating the Door", async () => {
  const config = createLockpickConfig({ difficulty: "easy", seed: "gm-route" });
  let updateCalls = 0;
  const emitted = [];
  const door = {
    uuid: "Scene.test.Wall.locked",
    documentName: "Wall",
    door: 1,
    ds: 2,
    flags: { regionwright: { lockpicking: config } },
    async update() {
      updateCalls += 1;
      throw new Error("players may not update walls");
    }
  };
  const saved = {
    game: globalThis.game,
    fromUuidSync: globalThis.fromUuidSync,
    CONST: globalThis.CONST
  };
  globalThis.game = {
    user: { id: "player", isGM: false },
    users: { activeGM: { id: "gm", isGM: true } },
    socket: { emit: (_channel, payload) => emitted.push(payload) }
  };
  globalThis.fromUuidSync = () => door;
  globalThis.CONST = { WALL_DOOR_STATES: { CLOSED: 0, OPEN: 1, LOCKED: 2 } };

  const result = await requestLockpickAttempt({ doorUuid: door.uuid, picks: config.targets, tension: config.tension });
  assert.equal(result.pending, true);
  assert.match(result.requestId, /.+/);
  assert.equal(updateCalls, 0);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].action, "attempt");
  assert.equal(emitted[0].doorUuid, door.uuid);
  assert.deepEqual(emitted[0].picks, config.targets);
  assert.equal(emitted[0].tension, config.tension);
  assert.equal(emitted[0].userId, "player");
  assert.match(emitted[0].requestId, /.+/);

  globalThis.game = saved.game;
  globalThis.fromUuidSync = saved.fromUuidSync;
  globalThis.CONST = saved.CONST;
});

test("Studio and Puzzles & Locks install their own client runtime sockets", () => {
  const studioSource = fs.readFileSync(new URL("../modules/regionwright/scripts/module.js", import.meta.url), "utf8");
  const puzzlesLocksSource = fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/scripts/module.js", import.meta.url), "utf8");
  assert.match(studioSource, /Hooks\.on\("canvasReady", \(\) => \{\s*installRuntimeSockets\(\)/);
  assert.doesNotMatch(studioSource, /Hooks\.on\("getSceneControlButtons"/);
  assert.doesNotMatch(puzzlesLocksSource, /installAscendancyFixtureControls\(\);/);
  assert.match(puzzlesLocksSource, /Hooks\.on\("canvasReady", \(\) => \{\s*installSockets\(\)/);
});

test("Pitfall Trap stores a bounded native script and evaluates passive Perception and Athletics", () => {
  const trap = createPitfallTrapConfig({ dc: 15, damage: "2d6 + 3" });
  assert.equal(trap.dc, 15);
  assert.equal(trap.damage.formula, "2d6+3");
  assert.equal(trap.damage.type, "bludgeoning");
  assert.deepEqual(validatePitfallTrapConfig(trap), trap);
  assert.throws(() => createPitfallTrapConfig({ dc: 31 }), /Passive Perception DC/i);
  assert.throws(() => createPitfallTrapConfig({ damage: "2d6; bad" }), /simple dice formula/i);
  const keenActor = { system: { skills: { prc: { passive: 16 } } } };
  const unawareActor = { system: { skills: { prc: { mod: 2 } } } };
  assert.equal(passivePerception(keenActor), 16);
  assert.equal(passivePerception(unawareActor), 12);
  assert.equal(evaluatePitfallDetection(trap, keenActor).detected, true);
  assert.equal(evaluatePitfallDetection(trap, unawareActor).detected, false);
  assert.equal(evaluateAthleticsCheck(15, trap.dc).success, true);
  assert.equal(evaluateAthleticsCheck(14, trap.dc).success, false);
  const behavior = pitfallBehaviorData();
  assert.equal(behavior.type, "executeScript");
  assert.deepEqual(behavior.system.events, ["tokenEnter"]);
  assert.equal(behavior.system.source, PITFALL_TRAP_SOURCE);
  assert.equal(behavior.flags.regionwright.regionwright.behaviorKey, PITFALL_TRAP_KEY);
  const pitfallSource = fs.readFileSync(new URL("../modules/regionwright/scripts/pitfall-trap.js", import.meta.url), "utf8");
  assert.match(pitfallSource, /installPitfallSocket/);
  assert.match(pitfallSource, /action: "pitfall"/);
});

test("Pitfall Trap returns a detected token to its entry point before an Athletics crossing check", async () => {
  const savedGame = globalThis.game;
  const savedChatMessage = globalThis.ChatMessage;
  const savedRoll = globalThis.Roll;
  try {
    let config = createPitfallTrapConfig({ dc: 15, damage: "2d6" });
    const updates = [];
    const region = {
      uuid: "Scene.test.Region.pit",
      getFlag: () => config,
      async update(data) {
        updates.push(data);
        const next = data["flags.regionwright.pitfallTrap"];
        if (next) config = next;
      }
    };
    const tokenUpdates = [];
    const damage = [];
    const actor = {
      name: "Scout",
      system: { skills: { prc: { passive: 16 } } },
      async rollSkill(options) {
        assert.deepEqual(options, { skill: "ath", targetValue: 15 });
        return [{ total: 16 }];
      },
      async applyDamage(payload) { damage.push(payload); }
    };
    const token = {
      uuid: "Scene.test.Token.scout",
      actor,
      async update(data) { tokenUpdates.push(data); }
    };
    globalThis.game = { user: { isGM: true }, users: [] };
    globalThis.ChatMessage = { getSpeaker: () => ({}), async create() {} };
    globalThis.Roll = class { static create() { return new this(); } async evaluate() { this.total = 7; return this; } };
    const result = await handlePitfallTrap(region, {
      name: "tokenEnter",
      data: { token, movement: { origin: { x: 100, y: 200, elevation: 5 } } }
    });
    assert.equal(result.status, "crossed");
    assert.deepEqual(tokenUpdates, [{ x: 100, y: 200, elevation: 5 }]);
    assert.deepEqual(damage, []);
    assert.equal(config.state.crossedBy.includes(token.uuid), true);
    assert.ok(updates.length >= 2);
  } finally {
    globalThis.game = savedGame;
    globalThis.ChatMessage = savedChatMessage;
    globalThis.Roll = savedRoll;
  }
});

test("Pitfall Trap damages a detected character who fails Athletics", async () => {
  const savedGame = globalThis.game;
  const savedChatMessage = globalThis.ChatMessage;
  const savedRoll = globalThis.Roll;
  try {
    let config = createPitfallTrapConfig({ dc: 15, damage: "2d6" });
    const region = {
      uuid: "Scene.test.Region.pit-failure",
      getFlag: () => config,
      async update(data) {
        const next = data["flags.regionwright.pitfallTrap"];
        if (next) config = next;
      }
    };
    const damage = [];
    const actor = {
      name: "Rogue",
      system: { skills: { prc: { passive: 16 } } },
      async rollSkill() { return [{ total: 14 }]; },
      async applyDamage(payload, options) { damage.push({ payload, options }); }
    };
    const token = { uuid: "Scene.test.Token.rogue", actor, async update() {} };
    globalThis.game = { user: { isGM: true }, users: [] };
    globalThis.ChatMessage = { getSpeaker: () => ({}), async create() {} };
    globalThis.Roll = class { static create() { return new this(); } async evaluate() { this.total = 8; return this; } };
    const result = await handlePitfallTrap(region, {
      name: "tokenEnter",
      data: { token, movement: { origin: { x: 100, y: 200 } } }
    });
    assert.equal(result.status, "fell");
    assert.equal(config.state.triggered, true);
    assert.deepEqual(damage, [{ payload: [{ value: 8, type: "bludgeoning" }], options: { isDelta: true } }]);
  } finally {
    globalThis.game = savedGame;
    globalThis.ChatMessage = savedChatMessage;
    globalThis.Roll = savedRoll;
  }
});

test("Studio traps link to optional Puzzles & Locks without embedding its games", () => {
  const state = createBuilderState({ canvasState: { scene: { uuid: sceneUuid, regions: new Map() } }, config: runtimeConfig("pauseGame") });
  state.topic = "puzzles";
  const catalog = behaviorCatalog({ config: runtimeConfig("pauseGame") });
  const start = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config: runtimeConfig("pauseGame") }), catalog, canvasState: { scene: { uuid: sceneUuid, regions: new Map(), walls: new Map() } } });
  assert.match(start, /Pitfall Trap/);
  assert.match(start, /Open Puzzles & Locks/);
  assert.doesNotMatch(start, /Tumbler Lock|Rotation Lock|Premium Library/);
  assert.doesNotMatch(start, /Paste UUID/i);
  state.pitfallGuideOpen = true;
  state.pitfallStep = 1;
  const pitfallGuide = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config: runtimeConfig("pauseGame") }), catalog, canvasState: { scene: { uuid: sceneUuid } } });
  assert.match(pitfallGuide, /Set difficulty and damage/);
  assert.match(pitfallGuide, /<span>DC<\/span>/);
  assert.match(pitfallGuide, /data-pitfall-damage/);
});

test("free launchpad exposes useful Studio recipes without replacing Assistant tools", () => {
  const html = buildBuilderContent({
    state: { ...createBuilderState({ canvasState: { scene: { uuid: sceneUuid, name: "Test Scene", regions: new Map() } }, config: runtimeConfig("pauseGame") }), topic: "studio" },
    capabilities: buildCapabilitySnapshot({ config: runtimeConfig("pauseGame") }),
    catalog: behaviorCatalog({ config: runtimeConfig("pauseGame") }),
    canvasState: { scene: { uuid: sceneUuid, name: "Test Scene", regions: new Map() } }
  });
  assert.match(html, /Studio/);
  assert.match(html, /Pressure Plate/);
  assert.match(html, /Scene Moment/);
  assert.match(html, /Included/);
  assert.match(buildStudioContent({ canvasState: { scene: { uuid: sceneUuid, name: "Test Scene" } } }), /Create Scene Moment/);
  assert.equal(TOPICS.filter(topic => topic.status === "available").at(-1)?.id, "studio");
  assert.equal(TOPICS.find(topic => topic.id === "native").status, "available");
});

test("a fresh Studio activity renders before it has review results", () => {
  const blueprint = createSceneMomentScenarioBlueprint({ sceneUuid, sceneName: "Test Scene" });
  const html = buildStudioContent({ state: { studioBlueprint: blueprint, studioSelectedNodeId: "moment-region", studioCompilation: null }, canvasState: { scene: { uuid: sceneUuid, regions: new Map() } } });
  assert.match(html, /Scene Moment/);
  assert.match(html, /Choose the area/);
});

test("unnamed Doors receive stable scene labels for quick visual selection", () => {
  const doors = new Map([
    ["b", { id: "b", uuid: "Scene.test.Wall.b", documentName: "Wall", door: 1, name: "" }],
    ["a", { id: "a", uuid: "Scene.test.Wall.a", documentName: "Wall", door: 1, name: "" }],
    ["c", { id: "c", uuid: "Scene.test.Wall.c", documentName: "Wall", door: 1, name: "Vault" }]
  ]);
  const references = targetReferences("door", { canvasState: { scene: { uuid: sceneUuid, walls: doors } } });
  assert.deepEqual(references.map(reference => reference.name), ["Door A", "Door B", "Vault"]);
});

test("guided Region setup defaults to drawing a Region and keeps existing choices inside the prompt", () => {
  const canvasState = { scene: { uuid: sceneUuid, name: "Test Scene", regions: new Map([[regionA.id, regionA]]) } };
  const config = runtimeConfig("displayScrollingText", "teleportToken");
  const state = createBuilderState({ canvasState, config });
  state.topic = "native";
  state.effectChosen = true;
  state.nativeView = "configure";
  state.behaviorKey = "scrolling-text";
  state.recipeStep = 0;
  const source = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(source, /Draw New Region/);
  assert.match(source, /Use an existing Region/);
  assert.doesNotMatch(source, /data-guided-target="region"/);

  state.topic = "traversal";
  state.traversalView = "configure";
  state.behaviorKey = "teleport";
  state.recipeStep = 0;
  state.parameters = { events: ["tokenEnter"], destinationsText: "", placement: "random", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 };
  const entry = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(entry, /Draw Entry Region/);
  assert.match(entry, /Use an existing Entry Region/);

  state.recipeStep = 1;
  const destination = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(destination, /Draw Arrival Region/);
  assert.match(destination, /Use an existing Arrival Region/);

  state.recipeStep = 2;
  const arrival = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(arrival, /Arrival Location/);
});

test("prompt-first selection owns Door and Region lists and advertises map highlighting", () => {
  const canvasState = {
    scene: {
      uuid: sceneUuid,
      name: "Test Scene",
      regions: new Map([[regionA.id, regionA]]),
      walls: new Map([["door", { id: "door", uuid: "Scene.test.Wall.door", documentName: "Wall", door: 1, name: "Vault Door" }]])
    }
  };
  const config = runtimeConfig("displayScrollingText", "teleportToken");
  const catalog = behaviorCatalog({ config });
  const capabilities = buildCapabilitySnapshot({ config });
  const state = createBuilderState({ canvasState, config });
  state.lockpickGuideOpen = true;
  state.lockpickStep = 0;
  const lockpick = buildGuideContent({ state, capabilities, catalog, canvasState });
  assert.match(lockpick, /Vault Door/);
  assert.match(lockpick, /data-action="pick-target"/);
  assert.match(lockpick, /Click to highlight on map/);
  assert.match(lockpick, /Step 1 of 3/);
  assert.match(lockpick, /rbb-guide-progress-footer/);
  assert.match(lockpick, /Choose a Door\./);

  state.lockpickGuideOpen = false;
  state.guideOpen = true;
  state.topic = "native";
  state.nativeView = "configure";
  state.effectChosen = true;
  state.behaviorKey = "scrolling-text";
  state.recipeStep = 0;
  state.regionPickerMode = "existing";
  const regionPrompt = buildGuideContent({ state, capabilities, catalog, canvasState });
  assert.match(regionPrompt, /Click to highlight on map/);
  assert.match(regionPrompt, /matching area will pulse on the map/i);
  assert.match(regionPrompt, /data-highlight-type="region"/);
  state.selection = [regionA];
  state.regionPickerMode = "create";
  const multiRegionPrompt = buildGuideContent({ state, capabilities, catalog, canvasState });
  assert.match(multiRegionPrompt, /Deselect the last Region before drawing another\./);
});

test("teleport destination prompt gives explicit cross-Scene switching guidance", () => {
  const sceneB = { uuid: "Scene.other", name: "Arrival Scene", regions: new Map([["b", { ...regionB, parent: { uuid: "Scene.other" } }]]) };
  const sceneA = { uuid: sceneUuid, name: "Entry Scene", regions: new Map([[regionA.id, regionA]]) };
  const canvasState = { scene: sceneA };
  const savedGame = globalThis.game;
  globalThis.game = { scenes: new Map([[sceneA.uuid, sceneA], [sceneB.uuid, sceneB]]) };
  const config = runtimeConfig("teleportToken");
  const state = createBuilderState({ canvasState, config });
  state.topic = "traversal";
  state.traversalView = "configure";
  state.effectChosen = true;
  state.behaviorKey = "teleport";
  state.recipeStep = 1;
  state.referenceSceneUuid = sceneB.uuid;
  state.regionReferenceMode = { destinationsText: "existing" };
  state.parameters = { destinationsText: "", placement: "random", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 };
  const html = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(html, /Arrival Scene/);
  assert.match(html, /Switch Scenes/);
  assert.match(html, /data-action="switch-scene"/);
  assert.match(html, /Switch Scenes, then choose the arrival Region/);
  assert.match(html, /disabled/);
  globalThis.game = savedGame;
});

test("prompt-first visual contract keeps the launchpad translucent and map feedback obvious", () => {
  const css = fs.readFileSync(new URL("../modules/regionwright/styles/regionwright.css", import.meta.url), "utf8");
  const promptAccessibilityCss = fs.readFileSync(new URL("../modules/regionwright/styles/prompt-accessibility.css", import.meta.url), "utf8");
  assert.match(css, /rgb\(20 15 20 \/ 65%\)/);
  assert.match(css, /rbb-prompt-selection-pulse/);
  assert.match(css, /rbb-scene-guidance/);
  assert.match(css, /font-family: "Candara", "Segoe UI", system-ui, sans-serif/);
  assert.match(css, /font-size: 1\.08rem/);
  assert.match(css, /rbb-visual-launchpad-card/);
  assert.match(css, /rbb-guide-step-track/);
  assert.match(css, /rbb-guide-choice-icon/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(promptAccessibilityCss, /font-size: clamp\(24px, 3\.2cqi, 28px\)/);
  assert.match(promptAccessibilityCss, /font-size: 18px/);
  assert.match(promptAccessibilityCss, /font-size: 17px/);
  assert.match(promptAccessibilityCss, /height: auto/);
  assert.match(promptAccessibilityCss, /flex: 1 1 auto/);
  assert.match(promptAccessibilityCss, /position: absolute/);
  assert.match(promptAccessibilityCss, /scrollbar-width: auto/);
  assert.match(promptAccessibilityCss, /width: 14px/);
});

test("map locator keeps a pulsing outline without a directional arrow", () => {
  const uiSource = fs.readFileSync(new URL("../modules/regionwright/scripts/ui.js", import.meta.url), "utf8");
  const locatorSource = uiSource.slice(uiSource.indexOf("function createLocatorBeacon"), uiSource.indexOf("function collectionDocuments"));
  assert.match(locatorSource, /root\.addChild\(shape, text\)/);
  assert.doesNotMatch(locatorSource, /const arrow/);
  assert.match(uiSource, /targetTileUuids\?\.includes\?\.\(uuid\)/);
  assert.match(uiSource, /node\?\.type === "openDoor" \? "door" : "region"/);
});

test("builder UI keeps a quiet options, features, and selected Regions workflow", () => {
  const canvasState = {
    scene: { uuid: sceneUuid, name: "Test Scene", regions: new Map([[regionA.id, regionA], [regionB.id, regionB]]) },
    regions: { controlled: [{ document: regionA }] }
  };
  const config = runtimeConfig("adjustDarknessLevel", "applyActiveEffect", "changeLevel", "defineSurface", "displayScrollingText", "dnd5e.difficultTerrain", "executeMacro", "executeScript", "modifyMovementCost", "pauseGame", "suppressWeather", "teleportToken", "toggleBehavior");
  const state = createBuilderState({ canvasState, config });
  assert.equal(state.topic, "home");
  assert.equal(state.behaviorKey, "scrolling-text");
  assert.equal(state.parameters.color, "#ffffff");
  const launchpad = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(launchpad, /rbb-visual-launchpad/);
  assert.match(launchpad, /What would you like to make\?/);
  assert.match(launchpad, /Puzzles &amp; Traps/);
  assert.match(launchpad, /aria-label="Region Assistant: Add built-in behaviors to a Region\./);
  state.topic = "native";
  state.selection = [{ uuid: regionA.uuid, id: regionA.id, name: regionA.name, sceneUuid }];
  const html = buildBuilderContent({
    state,
    capabilities: buildCapabilitySnapshot({ config }),
    catalog: behaviorCatalog({ config }),
    canvasState
  });
  assert.equal(TOPICS.find(topic => topic.id === "native").status, "available");
  assert.match(html, /class="rbb-shell"/);
  assert.doesNotMatch(html, /<select/);
  assert.match(html, /class="rbb-body"/);
  assert.match(html, /class="rbb-footer"/);
  assert.doesNotMatch(html, /class="rbb-selector-rail"/);
  assert.doesNotMatch(html, /data-picker-type=/);
  assert.doesNotMatch(html, /data-input="browserScene"/);
  assert.doesNotMatch(html, /Selected Regions/);
  assert.match(html, /What should this Region do\?/);
  assert.match(html, /Darkness &amp; Light/);
  assert.match(html, /Pause Game/);
  assert.match(html, /Apply a Condition/);
  assert.match(html, /D&amp;D5e Difficult Terrain/);
  assert.match(html, /Custom Movement Cost/);
  assert.doesNotMatch(html, /data-action="quick-start" data-topic="traversal" data-behavior-key="teleport"/);
  assert.match(html, /Browse all Region Behaviors/);
  assert.match(html, /Settings/);
  assert.doesNotMatch(html, /data-action="preview"/);
  assert.match(html, /More tools/);
  assert.match(html, /Portals &amp; Travel/);
  assert.doesNotMatch(html, /Choose the Regions you want to work with/);
  assert.doesNotMatch(html, /No Regions selected/);
  state.nativeView = "categories";
  const catalogHtml = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(catalogHtml, /Advanced: use a Macro or Script/);
  assert.match(catalogHtml, /Execute Macro/);
  assert.match(catalogHtml, /Execute Script/);
  state.nativeCategory = "feedback";
  state.nativeView = "configure";
  state.effectChosen = true;
  state.recipeStep = 2;
  const configHtml = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(configHtml, /Display Scrolling Text/);
  assert.match(configHtml, /Resume setup/);
  assert.match(configHtml, /class="rbb-sidebar"/);
  state.recipeStep = 0;
  state.guideOpen = true;
  state.pickerType = "actor";
  const guidedBuilderHtml = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.doesNotMatch(guidedBuilderHtml, /rbb-selector-rail/);
  assert.match(guidedBuilderHtml, /Setup prompt is open/);
  assert.match(guidedBuilderHtml, /rbb-topic is-active is-guided-target/);
  state.guideOpen = false;
  state.recipeStep = 2;
  const guideHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(guideHtml, /Write the message\./);
  assert.match(guideHtml, /rbb-guide-header/);
  assert.match(guideHtml, /rbb-guide-step-track/);
  assert.match(guideHtml, /aria-valuenow="3"/);
  assert.doesNotMatch(guideHtml, /rbb-guide-footer/);
  assert.match(guideHtml, /rbb-guide-actions/);
  assert.match(guideHtml, /rbb-guide-action-start/);
  assert.match(guideHtml, /rbb-guide-action-end/);
  assert.ok(guideHtml.indexOf("rbb-guide-action-start") < guideHtml.indexOf("rbb-guide-progress-footer"));
  assert.ok(guideHtml.indexOf("rbb-guide-progress-footer") < guideHtml.indexOf("rbb-guide-action-end"));
  assert.match(guideHtml, /textarea data-parameter="text"/);
  assert.doesNotMatch(guideHtml, /Fine tune \(optional\)/);
  assert.doesNotMatch(guideHtml, /Technical details/);
  assert.match(guideHtml, /Step 3 of 3/);
  state.recipeStep = 1;
  const triggerGuideHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(triggerGuideHtml, /Choose a trigger\./);
  assert.doesNotMatch(triggerGuideHtml, /<h3>/);
  assert.doesNotMatch(triggerGuideHtml, /class="rbb-recipe-progress"/);
  assert.match(triggerGuideHtml, /data-action="toggle-dropdown"/);
  state.behaviorKey = "darkness";
  state.parameters = { mode: "override", modifier: 0 };
  state.recipeStep = 1;
  const darknessHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(darknessHtml, /type="range" data-parameter="modifier"/);
  assert.doesNotMatch(darknessHtml, /0 is unchanged; 1 is the strongest adjustment/);
  state.behaviorKey = "pause";
  state.parameters = { once: false };
  state.recipeStep = 1;
  const pauseHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(pauseHtml, /Choose frequency\./);
  assert.match(pauseHtml, /Every time/);
  assert.match(pauseHtml, /Only once/);
  state.behaviorKey = "difficult-terrain";
  state.parameters = { magical: false, typesText: "", ignoredDispositionsText: "" };
  state.recipeStep = 1;
  const difficultTerrainGuideHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(difficultTerrainGuideHtml, /Choose terrain\./);
  assert.match(difficultTerrainGuideHtml, /Ordinary Difficult Terrain/);
  assert.match(difficultTerrainGuideHtml, /Magical Difficult Terrain/);
  assert.doesNotMatch(difficultTerrainGuideHtml, /Terrain Types/);
  state.behaviorKey = "active-effects";
  state.parameters = { effectsText: "" };
  state.recipeStep = 1;
  const activeEffectsGuideHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(activeEffectsGuideHtml, /Choose Active Effects\./);
  assert.match(activeEffectsGuideHtml, /Choose Active Effects/);
  assert.doesNotMatch(activeEffectsGuideHtml, /<h3>/);
  state.behaviorKey = "teleport";
  state.parameters = { destinationsText: "", placement: "random", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 };
  state.recipeStep = 1;
  state.regionReferenceMode = { destinationsText: "existing" };
  state.referencePicker = { key: "destinationsText" };
  const teleportGuideHtml = buildGuideContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(teleportGuideHtml, /Choose an existing arrival Region/);
  assert.match(teleportGuideHtml, new RegExp(`data-reference-uuid="${regionB.uuid}"`));
  assert.doesNotMatch(teleportGuideHtml, new RegExp(`data-reference-uuid="${regionA.uuid}"`));
  state.referencePicker = null;
  state.topic = "traversal";
  const traversalHtml = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(traversalHtml, /How should Tokens move\?/);
  assert.match(traversalHtml, /class="rbb-category-option rbb-behavior-option[^\"]*" data-action="behavior" data-behavior-key="change-level"/);
  assert.match(traversalHtml, /fa-layer-group/);
  assert.match(traversalHtml, /fa-door-open/);
  assert.match(traversalHtml, /Change Level/);
  assert.match(traversalHtml, /Toggle Behavior/);
  assert.match(traversalHtml, /Teleport Token/);
  state.behaviorKey = "teleport";
  state.traversalView = "configure";
  state.effectChosen = true;
  state.recipeStep = 1;
  const traversalConfigHtml = buildBuilderContent({ state, capabilities: buildCapabilitySnapshot({ config }), catalog: behaviorCatalog({ config }), canvasState });
  assert.match(traversalConfigHtml, /Resume setup/);
  assert.doesNotMatch(traversalConfigHtml, /class="rbb-selector-rail"/);
  assert.doesNotMatch(traversalConfigHtml, /These are the Regions this Behavior will affect/);
});

test("a completed guided workflow returns to the behavior picker instead of resuming setup", () => {
  const native = { topic: "native", nativeView: "configure", traversalView: "start", effectChosen: true };
  const traversal = { topic: "traversal", nativeView: "configure", traversalView: "configure", effectChosen: true };
  assert.deepEqual(resetAfterGuidedApply(native), { topic: "native", nativeView: "start", traversalView: "start", effectChosen: false });
  assert.deepEqual(resetAfterGuidedApply(traversal), { topic: "traversal", nativeView: "configure", traversalView: "start", effectChosen: false });
});

test("novice task paths keep common goals, visual reference choices, and review summaries discoverable", () => {
  const canvasState = {
    scene: { uuid: sceneUuid, name: "Test Scene", regions: new Map([[regionA.id, regionA], [regionB.id, regionB]]) },
    regions: { controlled: [{ document: regionA }] }
  };
  const config = runtimeConfig("adjustDarknessLevel", "applyActiveEffect", "changeLevel", "defineSurface", "displayScrollingText", "dnd5e.difficultTerrain", "executeMacro", "executeScript", "modifyMovementCost", "pauseGame", "suppressWeather", "teleportToken", "toggleBehavior");
  const catalog = behaviorCatalog({ config });
  const capabilities = buildCapabilitySnapshot({ config });
  const state = createBuilderState({ canvasState, config });
  state.topic = "native";
  state.selection = [{ uuid: regionA.uuid, id: regionA.id, name: regionA.name, sceneUuid }];

  const start = buildBuilderContent({ state, capabilities, catalog, canvasState });
  assert.match(start, /Darkness &amp; Light/);
  assert.match(start, /Floor, Ceiling, or Barrier/);
  assert.match(start, /Floating Text/);
  assert.match(start, /Difficult Terrain/);
  assert.match(start, /Suppress Weather/);
  assert.doesNotMatch(start, /data-action="quick-start" data-topic="traversal" data-behavior-key="teleport"/);

  state.topic = "traversal";
  state.traversalView = "configure";
  state.effectChosen = true;
  state.behaviorKey = "teleport";
  state.recipeStep = 1;
  state.parameters = {
    events: ["tokenEnter"],
    destinationsText: regionB.uuid,
    placement: "random",
    snap: true,
    choice: false,
    revealed: false,
    dialogRevealed: "",
    dialogUnrevealed: "",
    transitionType: "",
    transitionDuration: 1500
  };
  const portal = buildBuilderContent({ state, capabilities, catalog, canvasState });
  assert.match(portal, /Resume setup/);
  assert.doesNotMatch(portal, /Paste UUID instead/);

  state.topic = "native";
  state.effectChosen = true;
  state.behaviorKey = "define-surface";
  state.recipeStep = 1;
  state.parameters = { placement: "bottom", light: true, move: true, sight: true, sound: true, occlusion: true, exposure: false, culling: false };
  const surfaceGuide = buildGuideContent({ state, capabilities, catalog, canvasState });
  assert.match(surfaceGuide, /Choose a surface\./);
  assert.match(surfaceGuide, /data-parameter-key="placement" data-parameter-value="bottom"/);
  assert.match(surfaceGuide, /data-parameter-key="placement" data-parameter-value="top"/);
  assert.match(surfaceGuide, /data-parameter-key="placement" data-parameter-value="both"/);

  state.topic = "native";
  state.behaviorKey = "suppress-weather";
  state.parameters = {};
  state.plan = createPlan({ sceneUuid, regions: state.selection, behaviorKey: "suppress-weather", parameters: state.parameters });
  const review = buildGuideContent({ state, capabilities, catalog, canvasState });
  assert.doesNotMatch(review, /Your Region Behavior/);
  assert.doesNotMatch(review, /Show technical plan details/);
  assert.match(review, /rbb-guide-actions/);
});

test("target picker creates UUID references for Actors, Walls, and Tiles without treating them as Regions", () => {
  const actor = { uuid: "Actor.a", id: "a", name: "Guide", documentName: "Actor" };
  const wall = { uuid: "Scene.test.Wall.a", id: "a", documentName: "Wall" };
  const tile = { uuid: "Scene.test.Tile.a", id: "a", name: "Rune", documentName: "Tile" };
  const canvasState = {
    scene: {
      uuid: sceneUuid,
      walls: new Map([[wall.id, wall]]),
      tiles: new Map([[tile.id, tile]])
    }
  };
  const gameState = { actors: new Map([[actor.id, actor]]) };
  assert.deepEqual(targetReferences("actor", { canvasState, gameState }), [{ uuid: actor.uuid, id: actor.id, name: actor.name, type: "actor", sceneUuid }]);
  assert.deepEqual(targetReferences("wall", { canvasState, gameState }), [{ uuid: wall.uuid, id: wall.id, name: "Wall a", type: "wall", sceneUuid }]);
  assert.deepEqual(targetReferences("tile", { canvasState, gameState }), [{ uuid: tile.uuid, id: tile.id, name: tile.name, type: "tile", sceneUuid }]);
});

test("UI selection helpers preserve UUID identity, deduplicate, and reorder deterministically", () => {
  const first = { uuid: regionA.uuid, name: regionA.name };
  const second = { uuid: regionB.uuid, name: regionB.name };
  assert.deepEqual(mergeSelection([first], [first, second]), [first, second]);
  assert.deepEqual(reorderSelection([first, second], regionB.uuid, -1), [second, first]);
  assert.deepEqual(reorderSelection([first, second], regionA.uuid, -1), [first, second]);
});

test("map locator honors an operating system reduced-motion preference", () => {
  assert.equal(usesReducedMotion(() => ({ matches: true })), true);
  assert.equal(usesReducedMotion(() => ({ matches: false })), false);
  assert.equal(usesReducedMotion(() => { throw new Error("unavailable"); }), false);
});

test("Scene picker creates stable UUID references without changing Scene documents", () => {
  const canvasState = {
    scene: { uuid: sceneUuid, regions: new Map([[regionB.id, regionB], [regionA.id, regionA]]) }
  };
  assert.deepEqual(sceneRegionReferences(canvasState), [
    { uuid: regionA.uuid, id: regionA.id, name: regionA.name, sceneUuid },
    { uuid: regionB.uuid, id: regionB.id, name: regionB.name, sceneUuid }
  ]);
});

test("selection capture deduplicates controlled Regions and keeps Scene context", () => {
  const canvasState = {
    scene: { uuid: sceneUuid },
    regions: { controlled: [{ document: regionA }, { document: regionA }, regionB] }
  };
  assert.deepEqual(selectedRegionDocuments(canvasState), [regionA, regionA, regionB]);
  assert.deepEqual(captureSelection({ canvasState }), [
    { uuid: regionA.uuid, id: "a", name: "Entry", sceneUuid },
    { uuid: regionB.uuid, id: "b", name: "Exit", sceneUuid }
  ]);
});

test("plans are explicit, local, and not linked", () => {
  const plan = createPlan({
    sceneUuid,
    regions: [regionA, regionB],
    behaviorKey: "suppress-weather"
  });
  assert.equal(plan.behavior.type, "suppressWeather");
  assert.equal(plan.behavior.mode, "broadcast");
  assert.deepEqual(plan.links, []);
  assert.deepEqual(plan.regionUpdates, []);
  assert.equal(plan.approval.gmReviewed, false);
  assert.deepEqual(buildRegionBehaviorData(plan).system, {});
  assert.doesNotThrow(() => validatePlan(plan));
});

test("a reviewed plan can include draft Region renames", () => {
  const plan = createPlan({
    sceneUuid,
    regions: [regionA],
    behaviorKey: "scrolling-text",
    parameters: { events: ["tokenAnimateIn"], text: "Welcome", color: "#ffffff", visibility: "all" },
    regionRenames: { [regionA.uuid]: "Old Mine Entrance" }
  });
  assert.deepEqual(plan.regionUpdates, [{ uuid: regionA.uuid, name: "Old Mine Entrance" }]);
  assert.doesNotThrow(() => validatePlan(plan));
});

test("plan validation rejects cross-Scene selections and linked behavior data", () => {
  assert.throws(() => createPlan({
    sceneUuid,
    regions: [{ ...regionA, sceneUuid: "Scene.other" }],
    behaviorKey: "pause"
  }), /outside the active Scene/i);
  const plan = createPlan({ sceneUuid, regions: [regionA], behaviorKey: "pause" });
  assert.throws(() => validatePlan({ ...plan, links: [{ sourceUuid: regionA.uuid }] }), /linked behavior/i);
  const teleport = createPlan({ sceneUuid, regions: [regionA], behaviorKey: "teleport", parameters: { destinations: [regionB.uuid] } });
  assert.doesNotThrow(() => validatePlan(teleport));
});

test("every native Region Behavior produces Foundry-shaped system data", () => {
  const cases = [
    ["darkness", { mode: "brighten", modifier: 0.25 }, { mode: 1, modifier: 0.25 }],
    ["active-effects", { effectsText: "Actor.a.ActiveEffect.a" }, { effects: ["Actor.a.ActiveEffect.a"] }],
    ["change-level", { movementActionsText: "move, dash" }, { movementActions: ["move", "dash"] }],
    ["define-surface", { placement: "both", light: true, move: false, sight: true, sound: false, occlusion: true, exposure: true, culling: false }, { placement: "both", light: true, move: false, sight: true, sound: false, occlusion: true, exposure: true, culling: false }],
    ["scrolling-text", { events: ["tokenAnimateIn"], text: "Beware", color: "#ffcc00", visibility: "observer", once: true }, { events: ["tokenAnimateIn"], text: "Beware", color: "#ffcc00", visibility: 1, once: true }],
    ["difficult-terrain", { magical: true, typesText: "ice, snow", ignoredDispositionsText: "-1, 1" }, { magical: true, types: ["ice", "snow"], ignoredDispositions: [-1, 1] }],
    ["execute-macro", { events: ["tokenEnter"], uuid: "Macro.test", everyone: true }, { events: ["tokenEnter"], uuid: "Macro.test", everyone: true }],
    ["execute-script", { events: ["tokenEnter"], source: "return;", scriptAcknowledged: true }, { events: ["tokenEnter"], source: "return;" }],
    ["movement-cost", { difficulties: { move: 2, dash: 3 } }, { difficulties: { move: 2, dash: 3 } }],
    ["pause", { once: true }, { once: true }],
    ["suppress-weather", {}, {}],
    ["teleport", { destinationsText: regionB.uuid, placement: "center", snap: false, choice: true, revealed: true, dialogRevealed: "Choose", dialogUnrevealed: "Unknown", transitionType: "fade", transitionDuration: 2000 }, { destinations: [regionB.uuid], placement: "center", snap: false, choice: true, revealed: true, dialog: { revealed: "Choose", unrevealed: "Unknown" }, transition: { type: "fade", duration: 2000 } }],
    ["toggle-behavior", { events: ["tokenExit"], enableText: "Scene.test.Region.a.RegionBehavior.enable", disableText: "Scene.test.Region.a.RegionBehavior.disable" }, { events: ["tokenExit"], enable: ["Scene.test.Region.a.RegionBehavior.enable"], disable: ["Scene.test.Region.a.RegionBehavior.disable"] }]
  ];
  for (const [behaviorKey, parameters, expected] of cases) {
    const plan = createPlan({ sceneUuid, regions: [regionA], behaviorKey, parameters });
    assert.deepEqual(buildRegionBehaviorData(plan).system, expected, behaviorKey);
    assert.doesNotThrow(() => validatePlan(plan), behaviorKey);
  }
});

test("reconciliation updates Forge-owned behavior and preserves unrelated behavior", () => {
  const plan = createPlan({ sceneUuid, regions: [regionA], behaviorKey: "pause", parameters: { once: true } });
  const current = [
    { id: "keep", type: "suppressWeather", flags: {}, system: {} },
    {
      id: "owned",
      type: "pauseGame",
      flags: { regionwright: { regionwright: { behaviorKey: "pause" } } },
      system: { once: false }
    },
    {
      id: "old",
      type: "adjustDarknessLevel",
      flags: { regionwright: { regionwright: { behaviorKey: "darkness" } } },
      system: {}
    }
  ];
  const operations = buildReconciliationOperations(current, plan);
  assert.deepEqual(operations.updates.map(entry => entry._id), ["owned"]);
  assert.deepEqual(operations.deletes, ["old"]);
  assert.equal(operations.creates.length, 0);
});

test("applyPlan requires the GM, opt-in setting, active Scene, and runtime capability", async () => {
  const plan = createPlan({ sceneUuid, regions: [regionA], behaviorKey: "pause" });
  await assert.rejects(() => applyPlan(plan, {
    regions: [fakeRegion(regionA)],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: true,
    config: runtimeConfig("pauseGame")
  }), /reviewed and approved/i);
  plan.approval.gmReviewed = true;
  const region = fakeRegion(regionA);
  await assert.rejects(() => applyPlan(plan, {
    regions: [region],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: false },
    writesEnabled: true,
    config: runtimeConfig("pauseGame")
  }), /Only a GM/i);
  await assert.rejects(() => applyPlan(plan, {
    regions: [region],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: false,
    config: runtimeConfig("pauseGame")
  }), /disabled/i);
  await assert.rejects(() => applyPlan(plan, {
    regions: [region],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: true,
    config: runtimeConfig("suppressWeather")
  }), /has not registered/i);
});

test("applyPlan writes embedded Region Behaviors to every selected Region", async () => {
  const plan = createPlan({ sceneUuid, regions: [regionA, regionB], behaviorKey: "suppress-weather" });
  plan.approval.gmReviewed = true;
  const regions = [fakeRegion(regionA), fakeRegion(regionB)];
  const result = await applyPlan(plan, {
    regions,
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: true,
    config: runtimeConfig("suppressWeather")
  });
  assert.equal(result.results.length, 2);
  assert.deepEqual(regions.map(region => region.behaviors.map(entry => entry.type)), [["suppressWeather"], ["suppressWeather"]]);
  await assert.rejects(() => applyPlan(plan, {
    regions: [fakeRegion(regionA), fakeRegion({ ...regionB, uuid: "Scene.test.Region.other" })],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: true,
    config: runtimeConfig("suppressWeather")
  }), /reviewed UUID selection/i);
});

test("Apply Active Effects, D&D5e Difficult Terrain, and Teleport Token create and reconcile their native data", async () => {
  const cases = [
    {
      key: "active-effects",
      type: "applyActiveEffect",
      parameters: { effectsText: "Actor.test.ActiveEffect.bless" },
      updatedParameters: { effectsText: "Actor.test.ActiveEffect.bless\nActor.test.ActiveEffect.guidance" },
      expected: { effects: ["Actor.test.ActiveEffect.bless"] },
      updated: { effects: ["Actor.test.ActiveEffect.bless", "Actor.test.ActiveEffect.guidance"] }
    },
    {
      key: "difficult-terrain",
      type: "dnd5e.difficultTerrain",
      parameters: { magical: false, typesText: "", ignoredDispositionsText: "" },
      updatedParameters: { magical: true, typesText: "ice", ignoredDispositionsText: "1" },
      expected: { magical: false, types: [], ignoredDispositions: [] },
      updated: { magical: true, types: ["ice"], ignoredDispositions: [1] }
    },
    {
      key: "teleport",
      type: "teleportToken",
      parameters: { destinationsText: regionB.uuid, placement: "random", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 },
      updatedParameters: { destinationsText: regionB.uuid, placement: "center", snap: false, choice: true, revealed: true, dialogRevealed: "Choose a gate", dialogUnrevealed: "Unknown gate", transitionType: "fade", transitionDuration: 2000 },
      expected: { destinations: [regionB.uuid], placement: "random", snap: true, choice: false, revealed: false, dialog: { revealed: null, unrevealed: null }, transition: { type: null, duration: 1500 } },
      updated: { destinations: [regionB.uuid], placement: "center", snap: false, choice: true, revealed: true, dialog: { revealed: "Choose a gate", unrevealed: "Unknown gate" }, transition: { type: "fade", duration: 2000 } }
    }
  ];

  for (const entry of cases) {
    const region = fakeRegion(regionA);
    const plan = createPlan({ sceneUuid, regions: [regionA], behaviorKey: entry.key, parameters: entry.parameters });
    plan.approval.gmReviewed = true;
    await applyPlan(plan, {
      regions: [region], activeSceneUuid: sceneUuid, currentUser: { isGM: true }, writesEnabled: true,
      config: runtimeConfig(entry.type)
    });
    assert.equal(region.behaviors.length, 1, `${entry.key} creates one Behavior`);
    assert.equal(region.behaviors[0].type, entry.type, `${entry.key} uses the native behavior type`);
    assert.deepEqual(region.behaviors[0].system, entry.expected, `${entry.key} writes its selected values`);

    const updatedPlan = createPlan({ sceneUuid, regions: [regionA], behaviorKey: entry.key, parameters: entry.updatedParameters });
    updatedPlan.approval.gmReviewed = true;
    await applyPlan(updatedPlan, {
      regions: [region], activeSceneUuid: sceneUuid, currentUser: { isGM: true }, writesEnabled: true,
      config: runtimeConfig(entry.type)
    });
    assert.equal(region.behaviors.length, 1, `${entry.key} reconciles instead of duplicating`);
    assert.deepEqual(region.behaviors[0].system, entry.updated, `${entry.key} updates the existing Behavior`);
  }
});

test("applyPlan applies reviewed Region renames with the Behavior", async () => {
  const plan = createPlan({
    sceneUuid,
    regions: [regionA],
    behaviorKey: "pause",
    regionRenames: { [regionA.uuid]: "Quiet Chamber" }
  });
  plan.approval.gmReviewed = true;
  const region = fakeRegion(regionA);
  await applyPlan(plan, {
    regions: [region], activeSceneUuid: sceneUuid, currentUser: { isGM: true }, writesEnabled: true, config: runtimeConfig("pauseGame")
  });
  assert.equal(region.name, "Quiet Chamber");
});

test("multi-Region failures roll back Forge-owned changes", async () => {
  const plan = createPlan({ sceneUuid, regions: [regionA, regionB], behaviorKey: "pause", parameters: { once: true } });
  plan.approval.gmReviewed = true;
  const existing = {
    id: "old",
    type: "pauseGame",
    flags: { regionwright: { regionwright: { behaviorKey: "pause" } } },
    system: { once: false },
    toObject() {
      return {
        id: this.id,
        type: this.type,
        flags: structuredClone(this.flags),
        system: structuredClone(this.system)
      };
    }
  };
  const first = fakeRegion(regionA, { behaviors: [existing] });
  const second = fakeRegion(regionB, { failOnCreate: true });
  await assert.rejects(() => applyPlan(plan, {
    regions: [first, second],
    activeSceneUuid: sceneUuid,
    currentUser: { isGM: true },
    writesEnabled: true,
    config: runtimeConfig("pauseGame")
  }), /intentional create failure/i);
  assert.equal(first.behaviors.length, 1);
  assert.equal(first.behaviors[0].id, "old");
  assert.equal(first.behaviors[0].system.once, false);
});
