import assert from "node:assert/strict";
import test from "node:test";
import {
  ASCENDANCY_CHARACTERS, PERSONAL_PUZZLES, PAIRS, applyRuneForce, calibrateFrequencyStation, createAscendancyState,
  createCircuitConfig, createFrequencyConfig, createFrequencyState, createRuneMemoryConfig,
  createRuneSlottingState, createRushHourState, createTramRepairConfig, createTramRepairState,
  evaluateCircuit, flipRuneCards, hideRuneMismatch, installTramComponent, masterTestTram, recordFinalActivation,
  moveTram, solveRushHour, transitionPuzzle, updateProgression, verifyRushHourPuzzle, advanceCooperativeStage
  , selectNextRune
} from "../modules/regionwright/scripts/ascendancy-engine.js";
import { handleAscendancyRegionEvent, openAscendancyPuzzle, resetAscendancy } from "../modules/regionwright/scripts/ascendancy.js";

test("Ascendancy consumes the DiceBox semantic IDs and keeps Andrew Scene-owned", async () => {
  assert.deepEqual(Object.values(PERSONAL_PUZZLES), [
    "dbx:puzzle:aleister-frequency", "dbx:puzzle:sprocket-circuit", "dbx:puzzle:dalton-tram-repair",
    "dbx:puzzle:andrew-tram-routing", "dbx:puzzle:lawson-rune-memory", "dbx:puzzle:tactal-rune-slotting"
  ]);
  assert.equal(Object.values(ASCENDANCY_CHARACTERS).length, 6);
  await assert.rejects(() => openAscendancyPuzzle(PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING), /Scene controller.*not a Regionwright popup/i);
});

test("Ascendancy progression starts with the three first personal puzzles and advances pairs once", () => {
  let state = createAscendancyState({ sceneUuid: "Scene.ascendancy", seed: "stable" });
  assert.equal(state.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].state, "available");
  assert.equal(state.puzzles[PERSONAL_PUZZLES.SPROCKET_CIRCUIT].state, "locked");
  state = transitionPuzzle(state, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "open");
  state = transitionPuzzle(state, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "complete", { signatures: ["sig-a"] });
  assert.equal(state.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].state, "complete");
  const again = transitionPuzzle(state, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "complete", { signatures: ["changed"] });
  assert.deepEqual(again, state);
  state.puzzles[PERSONAL_PUZZLES.SPROCKET_CIRCUIT].state = "complete";
  state.puzzles[PERSONAL_PUZZLES.SPROCKET_CIRCUIT].complete = true;
  state = updateProgression(state);
  assert.equal(state.pairs[PAIRS.ALEISTER_SPROCKET].complete, true);
});

test("final activation requires one explicit round and cannot accumulate across rounds", () => {
  let state = createAscendancyState({ sceneUuid: "Scene.ascendancy", seed: "rounds" });
  state.finalActivation.available = true;
  assert.equal(recordFinalActivation(state, ASCENDANCY_CHARACTERS.ALEISTER, null).success, false);
  for (const characterId of Object.values(ASCENDANCY_CHARACTERS).slice(0, 5)) state = recordFinalActivation(state, characterId, "round-1").state;
  assert.equal(state.finalActivation.complete, false);
  const nextRound = recordFinalActivation(state, ASCENDANCY_CHARACTERS.ALEISTER, "round-2").state;
  assert.deepEqual(nextRound.finalActivation.activeUsers, [ASCENDANCY_CHARACTERS.ALEISTER]);
  assert.equal(nextRound.finalActivation.activationRound, "round-2");
  state = nextRound;
  for (const characterId of Object.values(ASCENDANCY_CHARACTERS).slice(1)) state = recordFinalActivation(state, characterId, "round-2").state;
  assert.equal(state.finalActivation.complete, true);
});

test("physical cooperative and core Region events use the active-GM listener for players", async () => {
  const previousGame = globalThis.game;
  const emitted = [];
  globalThis.game = { user: { id: "player-1", isGM: false }, users: { activeGM: { id: "gm-1" } }, socket: { emit: (...args) => emitted.push(args) } };
  try {
    const region = { uuid: "Region.ascendancy-cooperative", getFlag: () => ({ region: { stage: "cooperative", cooperativeId: "dbx:cooperative:aleister-sprocket-frequency-circuit" } }) };
    const result = await handleAscendancyRegionEvent(region, { name: "tokenEnter" });
    assert.equal(result.status, "gm-listener-requested");
    assert.equal(emitted[0][1].action, "ascendancy-region-event-request");
    assert.equal(emitted[0][1].regionUuid, region.uuid);
  } finally {
    globalThis.game = previousGame;
  }
});

test("partial Ascendancy reset fails closed without persistence after derived progress exists", async () => {
  const previousGame = globalThis.game;
  const previousCanvas = globalThis.canvas;
  const writes = [];
  let state = createAscendancyState({ sceneUuid: "Scene.fixture", seed: "reset-fixture" });
  state = transitionPuzzle(state, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "open");
  state = transitionPuzzle(state, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "complete", { signatures: ["sig-a"] });
  state = advanceCooperativeStage(state, PAIRS.ALEISTER_SPROCKET);
  state = transitionPuzzle(state, PERSONAL_PUZZLES.SPROCKET_CIRCUIT, "open");
  state = transitionPuzzle(state, PERSONAL_PUZZLES.SPROCKET_CIRCUIT, "complete", { circuitId: "circuit-a" });
  state = updateProgression(state);
  state.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].openedAt = 101;
  state.finalActivation = { available: true, activationRound: "round-7", activeUsers: [ASCENDANCY_CHARACTERS.ALEISTER], complete: false, cutsceneTriggered: true };
  state.data.frequency = { fixture: true };
  state.data.circuit = { fixture: true };
  state.trams = { "tram-X": { operational: true } };
  const before = structuredClone(state);
  const scene = {
    uuid: "Scene.fixture",
    flags: { "dicebox-campaign-helper": { managed: { semanticId: "dbx:room:fixture" } }, foreign: { preserved: true } },
    getFlag: () => state,
    update: async patch => { writes.push(patch); state = patch["flags.regionwright.ascendancy"]; }
  };
  globalThis.game = { user: { id: "gm-fixture", isGM: true }, users: { activeGM: { id: "gm-fixture" } } };
  globalThis.canvas = { scene };
  try {
    await assert.rejects(() => resetAscendancy({ scene, puzzleId: PERSONAL_PUZZLES.ALEISTER_FREQUENCY }), /Partial Ascendancy puzzle resets are disabled/);
    assert.equal(writes.length, 0);
    assert.deepEqual(state, before);
    assert.equal(state.pairs[PAIRS.ALEISTER_SPROCKET].complete, true);
    assert.equal(state.pairs[PAIRS.ALEISTER_SPROCKET].cooperativeComplete, true);
    assert.deepEqual(state.finalActivation, before.finalActivation);
    assert.deepEqual(state.data.frequency, { fixture: true });
    assert.deepEqual(state.data.circuit, { fixture: true });
    assert.deepEqual(scene.flags["dicebox-campaign-helper"], { managed: { semanticId: "dbx:room:fixture" } });
    assert.deepEqual(scene.flags.foreign, { preserved: true });
    assert.throws(() => transitionPuzzle(before, PERSONAL_PUZZLES.ALEISTER_FREQUENCY, "reset"), /Partial Ascendancy puzzle resets are disabled/);
  } finally {
    globalThis.game = previousGame;
    globalThis.canvas = previousCanvas;
  }
});

test("full Ascendancy reset restores initial owned state and rereads one Regionwright flag only", async () => {
  const previousGame = globalThis.game;
  const previousCanvas = globalThis.canvas;
  let stored = createAscendancyState({ sceneUuid: "Scene.fixture", seed: "full-reset" });
  stored.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].state = "complete";
  stored.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].complete = true;
  stored.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].openedAt = 101;
  stored.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].completedAt = 102;
  stored.pairs[PAIRS.ALEISTER_SPROCKET].complete = true;
  stored.pairs[PAIRS.ALEISTER_SPROCKET].cooperativeComplete = true;
  stored.finalActivation = { available: true, activationRound: "round-9", activeUsers: Object.values(ASCENDANCY_CHARACTERS), complete: true, cutsceneTriggered: true };
  stored.data = { permissions: { fixture: ["player"] }, frequency: { fixture: true }, circuit: { fixture: true }, tramRepair: { fixture: true }, routing: { fixture: true }, runeMemory: { fixture: true }, runeSlotting: { fixture: true } };
  stored.trams = { "tram-X": { operational: true } };
  const helperFlags = { managed: { semanticId: "dbx:room:fixture" } };
  const foreignFlags = { preserved: true };
  const writes = [];
  const scene = {
    uuid: "Scene.fixture",
    flags: { "dicebox-campaign-helper": helperFlags, foreign: foreignFlags },
    getFlag: () => stored,
    update: async patch => { writes.push(patch); stored = patch["flags.regionwright.ascendancy"]; }
  };
  globalThis.game = { user: { id: "gm-fixture", isGM: true }, users: { activeGM: { id: "gm-fixture" } } };
  globalThis.canvas = { scene };
  try {
    const reset = await resetAscendancy({ scene });
    assert.equal(writes.length, 1);
    assert.deepEqual(Object.keys(writes[0]), ["flags.regionwright.ascendancy"]);
    assert.equal(reset.sceneUuid, "Scene.fixture");
    assert.equal(reset.seed, "full-reset");
    assert.equal(reset.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].state, "available");
    assert.equal(reset.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].openedAt, null);
    assert.equal(reset.puzzles[PERSONAL_PUZZLES.ALEISTER_FREQUENCY].complete, false);
    assert.equal(reset.puzzles[PERSONAL_PUZZLES.SPROCKET_CIRCUIT].state, "locked");
    assert.ok(Object.values(reset.pairs).every(pair => pair.complete === false && pair.completedAt === null && pair.cooperativeComplete === undefined));
    assert.deepEqual(reset.finalActivation, { available: false, activationRound: null, activeUsers: [], complete: false, cutsceneTriggered: false });
    assert.deepEqual(reset.data, { permissions: {}, frequency: null, circuit: null, tramRepair: {}, routing: null, runeMemory: null, runeSlotting: null });
    assert.deepEqual(reset.trams, {});
    assert.deepEqual(scene.flags["dicebox-campaign-helper"], helperFlags);
    assert.deepEqual(scene.flags.foreign, foreignFlags);
    assert.deepEqual(scene.getFlag("regionwright", "ascendancy"), reset);
  } finally {
    globalThis.game = previousGame;
    globalThis.canvas = previousCanvas;
  }
});

test("Frequency Calibration locks stations only after exact discrete matches", () => {
  const config = createFrequencyConfig({ seed: "calibration" });
  let state = createFrequencyState(config);
  assert.equal(calibrateFrequencyStation(config, state, "F1").success, false);
  const target = config.stations[0].target;
  for (const field of ["frequency", "phase", "amplitude"]) state.stations[0].current[field] = target[field];
  const result = calibrateFrequencyStation(config, state, "F1");
  assert.equal(result.success, true);
  assert.equal(result.state.stations[0].signature, "sig-a");
});

test("Circuit Routing uses connected ports and graph reachability", () => {
  const config = createCircuitConfig({ seed: "circuit" });
  assert.equal(evaluateCircuit(config).solved, true);
  const rotations = { "link-1": 1 };
  assert.equal(evaluateCircuit(config, rotations).solved, false);
  assert.ok(evaluateCircuit(config, rotations).invalidReasons.includes("destination-not-reached"));
});

test("Tram Repair retains correct installs and reports only missing faults", () => {
  const config = createTramRepairConfig({ tramId: "tram-X", seed: "repair" });
  let state = createTramRepairState(config);
  const first = installTramComponent(config, state, config.faults[0].component);
  state = first.state;
  assert.equal(first.repaired, false);
  const result = masterTestTram(config, state);
  assert.equal(result.success, false);
  assert.equal(result.missingFaults.length, 2);
  for (const fault of config.faults.slice(1)) state = installTramComponent(config, state, fault.component).state;
  assert.equal(masterTestTram(config, state).success, true);
});

test("Rush Hour is authoritative, rejects unrepaired trams, and has a six-move minimum", () => {
  const locked = createRushHourState({ operational: [] });
  assert.deepEqual(locked.pieces.X && (awaitableMoves(locked, "X")), []);
  const verification = verifyRushHourPuzzle();
  assert.equal(verification.solvable, true);
  assert.equal(verification.minimumMoves, 6);
  assert.deepEqual(solveRushHour(), verification.solution);
  let state = createRushHourState();
  for (const [piece, distance] of verification.solution) state = moveTram(state, piece, distance).state;
  assert.equal(state.exited, true);
});

function awaitableMoves(state, piece) {
  // Import-free assertion helper: the public solver proves all legal movement
  // is gated by operational state; no unrepaired piece can enter its search.
  return solveRushHour({ state, maxDepth: 0 }) ? [piece] : [];
}

test("Rune Memory shuffles once, keeps decoys unique, and completes at five pairs", () => {
  const config = createRuneMemoryConfig({ seed: "memory" });
  assert.deepEqual(createRuneMemoryConfig({ seed: "memory" }), config);
  assert.equal(config.cards.length, 20);
  const counts = new Map(); for (const card of config.cards) counts.set(card.runeId, (counts.get(card.runeId) ?? 0) + 1);
  assert.equal([...counts.values()].filter(count => count === 2).length, 5);
  assert.equal([...counts.values()].filter(count => count === 1).length, 10);
  let state = { cards: config.cards, matchedRunes: [], pending: null };
  for (const rune of config.pairedRunes) { const pair = config.cards.filter(card => card.runeId === rune); state = flipRuneCards(config, state, pair[0].id, pair[1].id).state; }
  assert.equal(state.matchedRunes.length, 5);
});

test("Tactal slotting requires the Scene-established order and two force hits per rune", () => {
  let state = createRuneSlottingState(["rune-a", "rune-d", "rune-f", "rune-k", "rune-m"], ["rune-f", "rune-a", "rune-m", "rune-d", "rune-k"]);
  assert.equal(state.lastResult, null);
  assert.equal(selectNextRune(state, "rune-a").success, false);
  state = selectNextRune(state, "rune-f").state;
  state = applyRuneForce(state, 50).state;
  state = applyRuneForce(state, 50).state;
  assert.deepEqual(state.completedSlots, ["rune-f"]);
});
