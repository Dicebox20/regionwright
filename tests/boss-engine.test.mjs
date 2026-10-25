import test from "node:test";
import assert from "node:assert/strict";

const scene = {
  uuid: "Scene.test",
  regions: [],
  flags: {},
  getFlag(moduleId, flag) { return this.flags?.[moduleId]?.[flag] ?? null; },
  async update(data) {
    const key = Object.keys(data).find(path => path.includes("flags."));
    if (!key) return this;
    const [, moduleId, flag] = key.split(".");
    this.flags[moduleId] ??= {};
    this.flags[moduleId][flag] = structuredClone(data[key]);
    return this;
  },
  async unsetFlag(moduleId, flag) {
    if (this.flags[moduleId]) delete this.flags[moduleId][flag];
  }
};

const actors = [];
const socketRequests = [];
class FakeActor {
  constructor(data) {
    Object.assign(this, data, { id: `${actors.length + 1}` });
    this.system = structuredClone(data.system);
    this.items = [];
  }
  getFlag(moduleId, flag) { return this.flags?.[moduleId]?.[flag] ?? null; }
  async update(data) {
    for (const [path, value] of Object.entries(data)) {
      if (path === "type") this.type = value;
      if (path === "name") this.name = value;
      if (path === "system.attributes.hp.value") this.system.attributes.hp.value = value;
      if (path === "system.attributes.hp.max") this.system.attributes.hp.max = value;
      if (path === "system.attributes.hp.temp") this.system.attributes.hp.temp = value;
      if (path === "system.attributes.hp.tempmax") this.system.attributes.hp.tempmax = value;
      if (path.includes("flags.")) {
        const [, moduleId, flag] = path.split(".");
        this.flags ??= {};
        this.flags[moduleId] ??= {};
        this.flags[moduleId][flag] = structuredClone(value);
      }
    }
    return this;
  }
  async deleteEmbeddedDocuments() { this.items = []; }
  async createEmbeddedDocuments(_type, data) { this.items.push(...data); return data; }
}
globalThis.game = {
  user: { isGM: true, id: "gm" },
  users: { activeGM: { id: "gm" } },
  actors,
  scenes: { active: scene },
  modules: new Map(),
  socket: { emit(...args) { socketRequests.push(args); }, on() {} }
};
globalThis.canvas = { scene, tokens: { placeables: [] }, interface: null };
globalThis.Actor = { async create(data) { const actor = new FakeActor(data); actors.push(actor); return actor; } };
globalThis.ChatMessage = { async create() {} };
globalThis.ui = { notifications: { info() {}, error() {} } };

const engine = await import(`../modules/regionwright/scripts/boss-engine.js?boss-test=${Date.now()}`);

test("the supplied Region IDs map to the intended arena, console, and six puzzle stations", () => {
  assert.deepEqual(engine.bossEngineTest.knownRegionConfig({ id: "DAAcwdFDK4BppT77" }), { role: "directive-arena" });
  assert.deepEqual(engine.bossEngineTest.knownRegionConfig({ id: "21M2oB7126UNEZQQ" }), { role: "link-console" });
  assert.equal(engine.bossEngineTest.knownRegionConfig({ id: "NNLo6Bjqfusytowo" }).kind, "redirect");
  assert.equal(engine.bossEngineTest.knownRegionConfig({ id: "UGi0eciKevUZQA57" }).index, 3);
  assert.equal(engine.bossEngineTest.knownRegionConfig({ id: "jsJysJkoA2iQBtmI" }).kind, "timing");
  assert.equal(engine.bossEngineTest.knownRegionConfig({ id: "oXvK8e5rkGWerA5z" }).index, 6);
});

test("player puzzle and Region callbacks route to the active GM", async () => {
  socketRequests.length = 0;
  globalThis.game.user.isGM = false;
  await engine.bossEngine.completePuzzle({ index: 1 });
  await engine.bossEngine.handleRegionEvent({ uuid: "Scene.test.Region.node", getFlag() { return { role: "puzzle-node", index: 1, kind: "redirect", owner: "Sprocket" }; } }, { type: "tokenEnter", tokenUuid: "Token.player" });
  globalThis.game.user.isGM = true;
  assert.equal(socketRequests.filter(([scope, payload]) => scope === "module.regionwright" && payload?.action === "request").length, 2);
  assert.equal(socketRequests.at(-1)[1].request.action, "region-event");
});

test("any entrant gets the matching puzzle opened on Region entry", async () => {
  await engine.bossEngine.start();
  const arachnid = actors.find(actor => actor.name === engine.PRIME_ARACHNID_NAME);
  await engine.bossEngineTest.handleActorUpdate(arachnid, { "system.attributes.hp.temp": 0 });
  const state = engine.bossEngine.state();
  state.puzzles["1"].doorUuid = "Scene.test.Door.redirect";
  await scene.update({ "flags.regionwright.bossEngine": state });

  const opened = [];
  globalThis.game.modules.set("regionwright", { api: { premium: { laserGrid: { open: async door => opened.push(door.uuid) }, timingDial: { open: async door => opened.push(door.uuid) } } } });
  globalThis.fromUuidSync = uuid => {
    if (uuid === "Token.sprocket") return { actor: { name: "Sprocket" } };
    if (uuid === "Token.dalton") return { actor: { name: "Dalton" } };
    if (uuid === "Scene.test.Door.redirect") return { uuid };
    return null;
  };
  const region = { uuid: "Scene.test.Region.redirect", getFlag() { return { role: "puzzle-node", index: 1, kind: "redirect", owner: "Sprocket" }; } };

  await engine.bossEngine.handleRegionEvent(region, { type: "tokenEnter", tokenUuid: "Token.sprocket", userId: "gm" });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(opened, ["Scene.test.Door.redirect"]);

  await new Promise(resolve => setTimeout(resolve, 1100));
  await engine.bossEngine.handleRegionEvent(region, { type: "tokenEnter", tokenUuid: "Token.dalton", userId: "gm" });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(opened, ["Scene.test.Door.redirect", "Scene.test.Door.redirect"]);
  delete globalThis.fromUuidSync;
});

test("puzzle bind buttons assign configured Doors by puzzle type", async () => {
  await engine.bossEngine.start();
  const arachnid = actors.find(actor => actor.name === engine.PRIME_ARACHNID_NAME);
  await engine.bossEngineTest.handleActorUpdate(arachnid, { "system.attributes.hp.temp": 0 });
  const makeDoor = (uuid, flagName) => ({ uuid, documentName: "Wall", door: 1, flags: { regionwright: { [flagName]: { config: {}, persistent: { status: "locked" } } } }, getFlag(moduleId, name) { return this.flags?.[moduleId]?.[name] ?? null; }, async update(data) { this.flags.regionwright.bossEnginePuzzle = data["flags.regionwright.bossEnginePuzzle"]; return this; } });
  scene.walls = [makeDoor("Scene.test.Wall.laser-a", "laserGrid"), makeDoor("Scene.test.Wall.laser-b", "laserGrid"), makeDoor("Scene.test.Wall.laser-c", "laserGrid"), makeDoor("Scene.test.Wall.timing-a", "timingDial"), makeDoor("Scene.test.Wall.timing-b", "timingDial"), makeDoor("Scene.test.Wall.timing-c", "timingDial")];
  globalThis.fromUuidSync = uuid => scene.walls.find(door => door.uuid === uuid) ?? null;
  await engine.bossEngine.bindConfiguredPuzzleDoors();
  const state = engine.bossEngine.state();
  assert.equal(state.puzzles["1"].doorUuid, "Scene.test.Wall.laser-a");
  assert.equal(state.puzzles["3"].doorUuid, "Scene.test.Wall.laser-c");
  assert.equal(state.puzzles["4"].doorUuid, "Scene.test.Wall.timing-a");
  assert.equal(state.puzzles["6"].doorUuid, "Scene.test.Wall.timing-c");
  delete globalThis.fromUuidSync;
  scene.walls = [];
});

test("shell depletion automatically starts the six-station Reactive Plating phase", async () => {
  await engine.bossEngine.start();
  const arachnid = actors.find(actor => actor.name === engine.PRIME_ARACHNID_NAME);
  const directive = actors.find(actor => actor.name === engine.PRIME_DIRECTIVE_NAME);
  assert.equal(arachnid.type, "npc");
  assert.equal(arachnid.system.attributes.hp.max, 720);
  assert.equal(arachnid.system.attributes.hp.temp, 500);
  assert.equal(directive.system.attributes.hp.max, 360);
  await engine.bossEngineTest.handleActorUpdate(arachnid, { "system.attributes.hp.temp": 0, "system.attributes.hp.value": 0 });
  const state = engine.bossEngine.state();
  assert.equal(state.phase, engine.bossEngine.phases.REACTIVE_PLATING);
  assert.equal(state.plating.active, true);
  assert.equal(state.puzzlesComplete, 0);
  assert.equal(arachnid.system.attributes.hp.value, 720);
});

test("all six puzzle completions expose the weakness and open Convergence on the next round", async () => {
  for (let index = 1; index <= 6; index += 1) await engine.bossEngine.completePuzzle({ index });
  let state = engine.bossEngine.state();
  assert.equal(state.phase, engine.bossEngine.phases.WEAKNESS_EXPOSURE);
  assert.equal(state.puzzlesComplete, 6);
  assert.equal(state.weaknessExposed, true);
  state.weakness.pins.forEach(pin => { pin.removed = true; pin.shot = true; });
  state.weakness.pinsRemoved = 9;
  state.weakness.shotsLanded = 9;
  await scene.update({ "flags.regionwright.bossEngine": state });
  await engine.bossEngine.advanceRound();
  state = engine.bossEngine.state();
  assert.equal(state.phase, engine.bossEngine.phases.SEPARATION);
  assert.equal(state.pocketDimension.active, true);
});

test("the final listener chain reaches destruction without the old six-segment reset loop", async () => {
  let state = engine.bossEngine.state();
  state.phase = engine.bossEngine.phases.SEPARATION;
  state.active = true;
  state.round = 4;
  state.phaseStartedRound = 4;
  state.roundsInPhase = 1;
  state.linkLoad = 100;
  state.linkSaturated = true;
  state.vectorEvasionSpent = true;
  state.anchor = { active: true, tokenUuid: "Token.tactal", untilRound: 5 };
  state.transmitterExposed = true;
  await scene.update({ "flags.regionwright.bossEngine": state });
  await engine.bossEngine.severTransmitter();
  assert.equal(engine.bossEngine.state().phase, engine.bossEngine.phases.FRENZY);
  await engine.bossEngine.advanceRound();
  assert.equal(engine.bossEngine.state().phase, engine.bossEngine.phases.OVERDRIVE);
  const arachnid = actors.find(actor => actor.name === engine.PRIME_ARACHNID_NAME);
  await engine.bossEngineTest.handleActorUpdate(arachnid, { "system.attributes.hp.value": 0 });
  assert.equal(engine.bossEngine.state().phase, engine.bossEngine.phases.CRITICAL_FAILURE);
  await engine.bossEngine.openBreach();
  await engine.bossEngine.strikeCore();
  assert.equal(engine.bossEngine.state().phase, engine.bossEngine.phases.DESTROYED);
  assert.equal(engine.bossEngine.state().active, false);
});
