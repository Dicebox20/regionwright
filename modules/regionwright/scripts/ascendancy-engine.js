/**
 * Pure, deterministic rules for the Ascendancy personal puzzle suite.
 *
 * The Foundry adapter intentionally lives in ascendancy.js. Keeping these
 * rules free of Foundry globals makes them useful to the GM harness and keeps
 * the logical tram board authoritative over its scene artwork.
 */

export const ASCENDANCY_VERSION = 1;
export const PUZZLE_STATES = Object.freeze(["locked", "available", "active", "complete"]);
export const PERSONAL_PUZZLES = Object.freeze({
  ALEISTER_FREQUENCY: "dbx:puzzle:aleister-frequency",
  SPROCKET_CIRCUIT: "dbx:puzzle:sprocket-circuit",
  DALTON_TRAM_REPAIR: "dbx:puzzle:dalton-tram-repair",
  ANDREW_TRAM_ROUTING: "dbx:puzzle:andrew-tram-routing",
  LAWSON_RUNE_MEMORY: "dbx:puzzle:lawson-rune-memory",
  TACTAL_RUNE_SLOTTING: "dbx:puzzle:tactal-rune-slotting"
});
export const PAIRS = Object.freeze({
  ALEISTER_SPROCKET: "dbx:pair:aleister-sprocket",
  DALTON_ANDREW: "dbx:pair:dalton-andrew",
  LAWSON_TACTAL: "dbx:pair:lawson-tactal"
});
export const ASCENDANCY_CHARACTERS = Object.freeze({
  ALEISTER: "dbx:actor:aleister",
  SPROCKET: "dbx:actor:sprocket",
  DALTON: "dbx:actor:dalton",
  ANDREW: "dbx:actor:andrew-mcconaughey",
  LAWSON: "dbx:actor:lawson-burnheart",
  TACTAL: "dbx:actor:tactal"
});

const clone = value => structuredClone(value);
const modulo = (value, size) => ((Number(value) % size) + size) % size;
const integer = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const hashSeed = (seed, salt = "") => {
  let hash = 2166136261;
  for (const character of `${String(seed ?? "ascendancy")}:${salt}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};
const seededNumber = (seed, salt, max) => hashSeed(seed, salt) % max;

export function createAscendancyState({ sceneUuid = null, seed = "ascendancy" } = {}) {
  const puzzle = id => ({ id, state: "locked", complete: false, openedAt: null, completedAt: null, result: null });
  const state = {
    version: ASCENDANCY_VERSION,
    sceneUuid,
    seed: String(seed),
    puzzles: Object.fromEntries(Object.values(PERSONAL_PUZZLES).map(id => [id, puzzle(id)])),
    pairs: Object.fromEntries(Object.values(PAIRS).map(id => [id, { id, complete: false, completedAt: null }])),
    trams: {},
    data: { permissions: {}, frequency: null, circuit: null, tramRepair: {}, routing: null, runeMemory: null, runeSlotting: null },
    finalActivation: { available: false, activationRound: null, activeUsers: [], complete: false, cutsceneTriggered: false }
  };
  for (const id of [PERSONAL_PUZZLES.ALEISTER_FREQUENCY, PERSONAL_PUZZLES.DALTON_TRAM_REPAIR, PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY]) state.puzzles[id].state = "available";
  return state;
}

export function validateAscendancyState(input) {
  if (!input || typeof input !== "object" || Number(input.version) !== ASCENDANCY_VERSION) throw new Error("The Ascendancy state version is unsupported.");
  for (const id of Object.values(PERSONAL_PUZZLES)) {
    const entry = input.puzzles?.[id];
    if (!entry || entry.id !== id || !PUZZLE_STATES.includes(entry.state)) throw new Error(`The Ascendancy puzzle state for ${id} is invalid.`);
    if (Boolean(entry.complete) !== (entry.state === "complete")) throw new Error(`The completion flag for ${id} is inconsistent.`);
  }
  for (const id of Object.values(PAIRS)) if (!input.pairs?.[id]) throw new Error(`The Ascendancy pair state for ${id} is missing.`);
  if (!input.finalActivation || !Array.isArray(input.finalActivation.activeUsers) || (input.finalActivation.activationRound !== null && typeof input.finalActivation.activationRound !== "string")) throw new Error("The final activation state is invalid.");
  return clone(input);
}

export function recordFinalActivation(input, characterId, activationRound) {
  const state = validateAscendancyState(input);
  if (!Object.values(ASCENDANCY_CHARACTERS).includes(characterId)) return { state, success: false, message: "That station is not assigned to an Ascendancy character." };
  if (activationRound == null || String(activationRound).trim() === "") return { state, success: false, message: "An explicit activationRound is required for final station activation." };
  if (!state.finalActivation.available) return { state, success: false, message: "The six activation stations are not available yet." };
  if (state.finalActivation.complete) return { state, success: true, completed: false, message: "The Ascendancy core is already unlocked." };
  const round = String(activationRound);
  if (state.finalActivation.activationRound !== round) {
    state.finalActivation.activationRound = round;
    state.finalActivation.activeUsers = [];
    state.finalActivation.complete = false;
    state.finalActivation.cutsceneTriggered = false;
  }
  if (!state.finalActivation.activeUsers.includes(characterId)) state.finalActivation.activeUsers.push(characterId);
  const completed = state.finalActivation.activeUsers.length === Object.values(ASCENDANCY_CHARACTERS).length;
  if (completed) state.finalActivation.complete = true;
  return { state, success: true, completed };
}

export function transitionPuzzle(input, puzzleId, operation, result = null) {
  const state = validateAscendancyState(input);
  const puzzle = state.puzzles[puzzleId];
  if (!puzzle) throw new Error(`Unknown Ascendancy puzzle: ${puzzleId}`);
  if (operation === "open") {
    if (puzzle.state === "locked") throw new Error(`${puzzleId} is locked.`);
    if (puzzle.state === "complete") return state;
    puzzle.state = "active";
    puzzle.openedAt ??= Date.now();
  } else if (operation === "close") {
    if (puzzle.state === "active") puzzle.state = "available";
  } else if (operation === "reset") {
    throw new Error("Partial Ascendancy puzzle resets are disabled; use the full GM reset without puzzleId.");
  } else if (operation === "complete") {
    if (puzzle.state === "complete") return state;
    puzzle.state = "complete";
    puzzle.complete = true;
    puzzle.completedAt = Date.now();
    puzzle.result = clone(result);
  } else throw new Error(`Unknown Ascendancy puzzle operation: ${operation}`);
  return state;
}

export function updateProgression(input) {
  const state = validateAscendancyState(input);
  const pairs = [
    [PAIRS.ALEISTER_SPROCKET, [PERSONAL_PUZZLES.ALEISTER_FREQUENCY, PERSONAL_PUZZLES.SPROCKET_CIRCUIT]],
    [PAIRS.DALTON_ANDREW, [PERSONAL_PUZZLES.DALTON_TRAM_REPAIR, PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING]],
    [PAIRS.LAWSON_TACTAL, [PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY, PERSONAL_PUZZLES.TACTAL_RUNE_SLOTTING]]
  ];
  for (const [pairId, puzzleIds] of pairs) {
    const pair = state.pairs[pairId];
    if (!pair.complete && puzzleIds.every(id => state.puzzles[id].state === "complete")) {
      pair.complete = true;
      pair.completedAt = Date.now();
    }
  }
  if (Object.values(PAIRS).every(id => state.pairs[id].complete)) state.finalActivation.available = true;
  return state;
}

export function advanceCooperativeStage(input, pairId) {
  const state = validateAscendancyState(input);
  const pair = state.pairs[pairId];
  if (!pair) throw new Error(`Unknown Ascendancy pair: ${pairId}`);
  pair.cooperativeComplete = true;
  const nextPuzzle = {
    [PAIRS.ALEISTER_SPROCKET]: PERSONAL_PUZZLES.SPROCKET_CIRCUIT,
    [PAIRS.DALTON_ANDREW]: PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING,
    [PAIRS.LAWSON_TACTAL]: PERSONAL_PUZZLES.TACTAL_RUNE_SLOTTING
  }[pairId];
  if (nextPuzzle && state.puzzles[nextPuzzle].state === "locked") state.puzzles[nextPuzzle].state = "available";
  return state;
}

export const FREQUENCY_VERSION = 1;
const FREQUENCY_SIGNATURES = Object.freeze(["sig-a", "sig-b", "sig-c", "sig-d"]);

export function waveformSamples(values, count = 32) {
  const frequency = Number(values?.frequency);
  const phase = Number(values?.phase);
  const amplitude = Number(values?.amplitude);
  if (![frequency, phase, amplitude].every(Number.isFinite)) return [];
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 * frequency + (phase - 1) * Math.PI / 2;
    return Number((Math.sin(angle) * amplitude).toFixed(6));
  });
}

export function createFrequencyConfig({ seed = "frequency", stationCount = 4 } = {}) {
  const count = Math.max(1, Math.min(4, Math.trunc(Number(stationCount) || 4)));
  const stations = Array.from({ length: count }, (_, index) => {
    const target = { frequency: 1 + seededNumber(seed, `frequency:${index}`, 5), phase: 1 + seededNumber(seed, `phase:${index}`, 5), amplitude: 1 + seededNumber(seed, `amplitude:${index}`, 3) };
    const current = { ...target, frequency: target.frequency === 5 ? 1 : target.frequency + 1 };
    return { id: `F${index + 1}`, target, signature: FREQUENCY_SIGNATURES[index] };
  });
  return { version: FREQUENCY_VERSION, seed: String(seed), stations };
}

export function validateFrequencyConfig(config) {
  if (!config || Number(config.version) !== FREQUENCY_VERSION || !Array.isArray(config.stations) || config.stations.length !== 4) throw new Error("Frequency calibration needs four stations.");
  const ids = new Set();
  for (const station of config.stations) {
    if (!station?.id || ids.has(station.id) || !station.signature) throw new Error("Frequency station IDs and signatures must be unique.");
    ids.add(station.id);
    for (const values of [station.target]) if (!integer(values?.frequency, 1, 5) || !integer(values?.phase, 1, 5) || !integer(values?.amplitude, 1, 3)) throw new Error("Frequency values are out of range.");
  }
  return clone(config);
}

export function createFrequencyState(config) {
  const checked = validateFrequencyConfig(config);
  return { version: FREQUENCY_VERSION, stations: checked.stations.map(station => ({ id: station.id, current: { ...station.target, frequency: station.target.frequency === 5 ? 1 : station.target.frequency + 1 }, complete: false, signature: null })) };
}

export function setFrequencyValue(state, stationId, field, value) {
  if (!state?.stations?.some(station => station.id === stationId)) throw new Error("That frequency station does not exist.");
  if (!["frequency", "phase", "amplitude"].includes(field)) throw new Error("That frequency control does not exist.");
  const next = clone(state);
  const station = next.stations.find(entry => entry.id === stationId);
  if (station.complete) return next;
  const bounds = { frequency: [1, 5], phase: [1, 5], amplitude: [1, 3] }[field];
  station.current[field] = Math.max(bounds[0], Math.min(bounds[1], Math.trunc(Number(value) || bounds[0])));
  return next;
}

export function calibrateFrequencyStation(config, state, stationId) {
  const checked = validateFrequencyConfig(config);
  const next = clone(state);
  const target = checked.stations.find(station => station.id === stationId);
  const station = next.stations.find(entry => entry.id === stationId);
  if (!target || !station) throw new Error("That frequency station does not exist.");
  const success = target.target.frequency === station.current.frequency && target.target.phase === station.current.phase && target.target.amplitude === station.current.amplitude;
  if (success) { station.complete = true; station.signature = target.signature; }
  return { success, state: next, signature: success ? target.signature : null, waveform: waveformSamples(station.current) };
}

export const CIRCUIT_VERSION = 1;
export const CIRCUIT_PORTS = Object.freeze(["N", "E", "S", "W"]);
const PORT_VECTORS = Object.freeze({ N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] });
const opposite = Object.freeze({ N: "S", E: "W", S: "N", W: "E" });

export function componentPorts(kind, rotation = 0) {
  const turns = modulo(Math.trunc(Number(rotation) || 0), 4);
  const base = { straight: ["E", "W"], elbow: ["N", "E"], tee: ["N", "E", "W"], crossover: ["N", "E", "S", "W"], source: ["E"], destination: ["W"], deadEnd: ["N"] }[kind];
  if (!base) throw new Error(`Unknown circuit component: ${kind}`);
  return new Set(base.map(port => CIRCUIT_PORTS[modulo(CIRCUIT_PORTS.indexOf(port) + turns, 4)]));
}

export function createCircuitConfig({ circuitId = "circuit-a", seed = "circuit" } = {}) {
  const components = [
    { id: "source", kind: "source", row: 2, col: 0, rotation: 0 },
    { id: "link-1", kind: "straight", row: 2, col: 1, rotation: 0 },
    { id: "link-2", kind: "straight", row: 2, col: 2, rotation: 0 },
    { id: "link-3", kind: "straight", row: 2, col: 3, rotation: 0 },
    { id: "destination", kind: "destination", row: 2, col: 4, rotation: 0 },
    { id: "decoy-a", kind: "tee", row: 0, col: 1, rotation: seededNumber(seed, "decoy-a", 4) },
    { id: "decoy-b", kind: "deadEnd", row: 4, col: 3, rotation: seededNumber(seed, "decoy-b", 4) }
  ];
  return { version: CIRCUIT_VERSION, circuitId: String(circuitId), rows: 5, cols: 5, sourceId: "source", destinationId: "destination", allowBranches: false, prohibitedIds: [], components };
}

export function validateCircuitConfig(config) {
  if (!config || Number(config.version) !== CIRCUIT_VERSION || !integer(config.rows, 3, 9) || !integer(config.cols, 3, 9)) throw new Error("The circuit board dimensions are invalid.");
  const ids = new Set(); const positions = new Set(); let sources = 0; let destinations = 0;
  for (const component of config.components ?? []) {
    if (!component?.id || ids.has(component.id) || !Object.hasOwn({ straight: 1, elbow: 1, tee: 1, crossover: 1, source: 1, destination: 1, deadEnd: 1 }, component.kind)) throw new Error("Circuit components are invalid or duplicated.");
    if (!integer(component.row, 0, config.rows - 1) || !integer(component.col, 0, config.cols - 1) || !integer(component.rotation, 0, 3)) throw new Error("Circuit component placement is invalid.");
    const position = `${component.row},${component.col}`; if (positions.has(position)) throw new Error("Circuit components cannot overlap.");
    ids.add(component.id); positions.add(position); sources += component.kind === "source"; destinations += component.kind === "destination";
  }
  if (sources !== 1 || destinations !== 1) throw new Error("A circuit needs exactly one source and one destination.");
  return clone(config);
}

export function evaluateCircuit(config, suppliedRotations = {}) {
  const board = validateCircuitConfig(config); const rotations = suppliedRotations instanceof Map ? suppliedRotations : new Map(Object.entries(suppliedRotations ?? {}));
  const components = new Map(board.components.map(component => [`${component.row},${component.col}`, { ...component, rotation: modulo(Number(rotations.get(component.id) ?? component.rotation), 4), ports: componentPorts(component.kind, rotations.get(component.id) ?? component.rotation) }]));
  const connections = []; const adjacency = new Map(board.components.map(component => [component.id, []]));
  for (const component of board.components) {
    const current = components.get(`${component.row},${component.col}`);
    for (const port of current.ports) {
      const [dr, dc] = PORT_VECTORS[port]; const neighbor = components.get(`${component.row + dr},${component.col + dc}`); if (!neighbor || !neighbor.ports.has(opposite[port])) continue;
      if (component.id < neighbor.id) { connections.push([component.id, neighbor.id, port]); adjacency.get(component.id).push(neighbor.id); adjacency.get(neighbor.id).push(component.id); }
    }
  }
  const source = board.components.find(component => component.id === board.sourceId); const destination = board.components.find(component => component.id === board.destinationId);
  const reachable = new Set(source ? [source.id] : []); const queue = [...reachable];
  while (queue.length) for (const id of adjacency.get(queue.shift()) ?? []) if (!reachable.has(id)) { reachable.add(id); queue.push(id); }
  const invalid = [];
  if (destination && !reachable.has(destination.id)) invalid.push("destination-not-reached");
  for (const id of board.prohibitedIds ?? []) if (reachable.has(id)) invalid.push(`prohibited-branch:${id}`);
  if (!board.allowBranches && source && [...(adjacency.get(source.id) ?? [])].length !== 1) invalid.push("source-branch");
  if (!board.allowBranches) for (const id of reachable) { const degree = adjacency.get(id)?.length ?? 0; if (id !== board.sourceId && id !== board.destinationId && degree > 2) invalid.push(`branch:${id}`); }
  return { solved: reachable.has(board.destinationId) && invalid.length === 0, connections, reachableIds: [...reachable], invalidReasons: [...new Set(invalid)], rotations: Object.fromEntries([...components.values()].map(component => [component.id, component.rotation])) };
}

export function rotateCircuitComponent(config, rotations, componentId, amount = 1) {
  const board = validateCircuitConfig(config); const component = board.components.find(entry => entry.id === componentId); if (!component) throw new Error("That circuit component does not exist.");
  const next = { ...(rotations ?? {}) }; next[componentId] = modulo(Number(next[componentId] ?? component.rotation) + Number(amount || 0), 4); return next;
}

export const TRAM_VERSION = 1;
export const TRAM_IDS = Object.freeze(["tram-B", "tram-C", "tram-O", "tram-Q", "tram-R", "tram-X"]);
export const TRAM_SUBSYSTEMS = Object.freeze(["POWER", "CONTROL", "BRAKES", "DRIVE"]);
const TRAM_COMPONENTS = Object.freeze([
  { id: "arcane-fuse", subsystem: "POWER" }, { id: "relay", subsystem: "CONTROL" }, { id: "power-coupler", subsystem: "POWER" },
  { id: "pressure-regulator", subsystem: "BRAKES" }, { id: "conductor", subsystem: "CONTROL" }, { id: "drive-linkage", subsystem: "DRIVE" }
]);

export function createTramRepairConfig({ tramId = "tram-X", seed = "trams" } = {}) {
  if (!TRAM_IDS.includes(tramId)) throw new Error("Unknown tram ID.");
  const faults = TRAM_SUBSYSTEMS.slice(0, 3).map((subsystem, index) => {
    const options = TRAM_COMPONENTS.filter(component => component.subsystem === subsystem);
    return { id: `${tramId}-fault-${index + 1}`, subsystem, component: options[seededNumber(seed, `${tramId}:${subsystem}`, options.length)].id };
  });
  return { version: TRAM_VERSION, tramId, faults, components: TRAM_COMPONENTS.map(component => ({ ...component })) };
}

export function validateTramRepairConfig(config) {
  if (!config || Number(config.version) !== TRAM_VERSION || !TRAM_IDS.includes(config.tramId) || !Array.isArray(config.faults) || config.faults.length !== 3) throw new Error("Tram repair configuration is invalid.");
  const ids = new Set(); for (const fault of config.faults) { if (!fault?.id || ids.has(fault.id) || !TRAM_SUBSYSTEMS.includes(fault.subsystem) || !config.components?.some(component => component.id === fault.component && component.subsystem === fault.subsystem)) throw new Error("Tram fault data is invalid."); ids.add(fault.id); }
  return clone(config);
}

export function createTramRepairState(config) { const checked = validateTramRepairConfig(config); return { tramId: checked.tramId, installed: [], repaired: false, operational: false, lastTest: null }; }

export function installTramComponent(config, state, componentId) {
  const checked = validateTramRepairConfig(config); const component = checked.components.find(entry => entry.id === componentId); if (!component) throw new Error("That component is not in Dalton's tray.");
  const next = clone(state); if (!next.installed.includes(componentId)) next.installed.push(componentId);
  next.lastTest = null; const missing = checked.faults.filter(fault => !next.installed.includes(fault.component)); next.repaired = missing.length === 0; next.operational = false; return { state: next, repaired: next.repaired, missingFaults: missing };
}

export function masterTestTram(config, state) {
  const checked = validateTramRepairConfig(config); const next = clone(state); const missingFaults = checked.faults.filter(fault => !next.installed.includes(fault.component));
  next.repaired = missingFaults.length === 0; next.operational = next.repaired; next.lastTest = { success: next.operational, missingFaults: missingFaults.map(fault => fault.subsystem) }; return { state: next, success: next.operational, missingFaults };
}

export const RUSH_HOUR_VERSION = 1;
export const RUSH_HOUR_BOARD = Object.freeze({ rows: 6, cols: 6, exitRow: 2, exitColumn: 6 });
export const RUSH_HOUR_PIECES = Object.freeze({
  X: Object.freeze({ id: "tram-X", orientation: "horizontal", length: 2, row: 2, column: 1 }),
  O: Object.freeze({ id: "tram-O", orientation: "vertical", length: 3, row: 0, column: 5 }),
  Q: Object.freeze({ id: "tram-Q", orientation: "vertical", length: 3, row: 1, column: 3 }),
  B: Object.freeze({ id: "tram-B", orientation: "vertical", length: 2, row: 4, column: 0 }),
  C: Object.freeze({ id: "tram-C", orientation: "horizontal", length: 2, row: 4, column: 4 }),
  R: Object.freeze({ id: "tram-R", orientation: "horizontal", length: 3, row: 5, column: 2 })
});
// The coordinates in the brief make R-left-1 collide with Q after Q-down-2.
// This is the legal six-move solution for the printed board.
export const RUSH_HOUR_SOLUTION = Object.freeze([["B", -1], ["C", -3], ["O", 3], ["R", -2], ["Q", 2], ["X", 3]]);

export function createRushHourState({ operational = TRAM_IDS } = {}) { return { version: RUSH_HOUR_VERSION, pieces: clone(RUSH_HOUR_PIECES), operational: Object.fromEntries(TRAM_IDS.map(id => [id, operational.includes(id)])), moveCount: 0, exited: false }; }

function cellsFor(piece) { return Array.from({ length: piece.length }, (_, index) => [piece.row + (piece.orientation === "vertical" ? index : 0), piece.column + (piece.orientation === "horizontal" ? index : 0)]); }
function stateKey(state) { return Object.values(state.pieces).sort((a, b) => a.id.localeCompare(b.id)).map(piece => `${piece.id}:${piece.row},${piece.column}`).join("|"); }
function occupancy(state, ignoreId = null) { const occupied = new Map(); for (const [key, piece] of Object.entries(state.pieces)) if (key !== ignoreId && piece.id !== ignoreId) for (const [row, column] of cellsFor(piece)) occupied.set(`${row},${column}`, key); return occupied; }

export function legalTramMoves(state, pieceKey) {
  const piece = state?.pieces?.[pieceKey]; if (!piece) return [];
  if (!state.operational?.[piece.id]) return [];
  const result = []; const axis = piece.orientation === "vertical" ? "row" : "column"; const occupancyMap = occupancy(state, pieceKey);
  for (const direction of [-1, 1]) {
    let distance = 1;
    while (true) {
      const candidate = { ...piece, [axis]: piece[axis] + direction * distance };
      const cells = cellsFor(candidate); const isExit = pieceKey === "X" && direction > 0 && candidate.column === RUSH_HOUR_BOARD.exitColumn - piece.length;
      if (isExit) { if (candidate.row !== RUSH_HOUR_BOARD.exitRow || occupancyMap.has(`${candidate.row},${RUSH_HOUR_BOARD.cols - 1}`)) break; result.push({ piece: pieceKey, distance: direction * distance, exit: true }); break; }
      if (cells.some(([row, column]) => row < 0 || row >= RUSH_HOUR_BOARD.rows || column < 0 || column >= RUSH_HOUR_BOARD.cols || occupancyMap.has(`${row},${column}`))) break;
      result.push({ piece: pieceKey, distance: direction * distance, exit: false }); distance += 1;
    }
  }
  return result;
}

export function moveTram(state, pieceKey, distance) {
  const move = legalTramMoves(state, pieceKey).find(entry => entry.distance === Number(distance)); if (!move) return { success: false, state: clone(state), message: "That tram cannot make that move." };
  const next = clone(state); const piece = next.pieces[pieceKey]; const axis = piece.orientation === "vertical" ? "row" : "column"; piece[axis] += move.distance; next.moveCount += 1; if (move.exit) { next.exited = true; piece.exited = true; }
  return { success: true, state: next, move };
}

export function validateRushHourState(state) {
  if (!state || Number(state.version) !== RUSH_HOUR_VERSION) throw new Error("Rush Hour state version is unsupported.");
  const seen = new Set(); for (const piece of Object.values(state.pieces ?? {})) for (const cell of cellsFor(piece)) { const key = cell.join(","); if (seen.has(key)) throw new Error("Rush Hour pieces overlap."); seen.add(key); }
  return clone(state);
}

export function solveRushHour({ state = createRushHourState(), maxDepth = 12 } = {}) {
  const start = validateRushHourState(state); const queue = [{ state: start, path: [] }]; const seen = new Set([stateKey(start)]);
  while (queue.length) { const current = queue.shift(); if (current.state.exited) return current.path; if (current.path.length >= maxDepth) continue;
    for (const pieceKey of Object.keys(current.state.pieces)) for (const move of legalTramMoves(current.state, pieceKey)) { const result = moveTram(current.state, pieceKey, move.distance); if (!result.success) continue; const key = stateKey(result.state); if (seen.has(key)) continue; seen.add(key); queue.push({ state: result.state, path: [...current.path, [pieceKey, move.distance]] }); }
  }
  return null;
}

export function verifyRushHourPuzzle() { const state = createRushHourState(); const solution = solveRushHour({ state, maxDepth: 12 }); return { solvable: Boolean(solution), minimumMoves: solution?.length ?? null, solution }; }

export const RUNE_VERSION = 1;
export function createRuneMemoryConfig({ seed = "runes" } = {}) {
  const pairs = ["rune-a", "rune-d", "rune-f", "rune-k", "rune-m"];
  const decoys = Array.from({ length: 10 }, (_, index) => `decoy-${String.fromCharCode(97 + index)}`);
  const cards = [...pairs, ...pairs, ...decoys].map((runeId, index) => ({ id: `card-${index + 1}`, runeId, matched: false, faceUp: false }));
  for (let index = cards.length - 1; index > 0; index -= 1) { const swap = seededNumber(seed, `card:${index}`, index + 1); [cards[index], cards[swap]] = [cards[swap], cards[index]]; }
  return { version: RUNE_VERSION, seed: String(seed), cards, pairedRunes: pairs };
}
export function validateRuneMemoryConfig(config) {
  if (!config || Number(config.version) !== RUNE_VERSION || !Array.isArray(config.cards) || config.cards.length !== 20) throw new Error("Rune Memory needs twenty cards.");
  const counts = new Map(); for (const card of config.cards) counts.set(card.runeId, (counts.get(card.runeId) ?? 0) + 1);
  if ([...counts.values()].filter(count => count === 2).length !== 5 || [...counts.values()].filter(count => count === 1).length !== 10) throw new Error("Rune Memory needs five pairs and ten unique decoys."); return clone(config);
}
export function flipRuneCards(config, state, firstId, secondId) {
  validateRuneMemoryConfig(config); const next = clone(state); const first = next.cards.find(card => card.id === firstId); const second = next.cards.find(card => card.id === secondId);
  if (!first || !second || firstId === secondId || first.matched || second.matched || next.pending) return { state: next, status: "invalid" };
  first.faceUp = true; second.faceUp = true; if (first.runeId === second.runeId) { first.matched = true; second.matched = true; next.matchedRunes = [...new Set([...(next.matchedRunes ?? []), first.runeId])]; next.pending = null; return { state: next, status: next.matchedRunes.length === 5 ? "complete" : "match" }; }
  next.pending = [firstId, secondId]; return { state: next, status: "mismatch" };
}
export function hideRuneMismatch(state) { const next = clone(state); for (const id of next.pending ?? []) { const card = next.cards.find(entry => entry.id === id); if (card && !card.matched) card.faceUp = false; } next.pending = null; return next; }

export const SLOT_VERSION = 1;
export function createRuneSlottingState(matchedRunes, correctRuneOrder) {
  const matched = [...new Set(matchedRunes ?? [])]; const order = [...(correctRuneOrder ?? [])]; if (matched.length !== 5 || order.length !== 5 || order.some(id => !matched.includes(id))) throw new Error("Rune slotting needs five discovered runes and a matching order.");
  return { version: SLOT_VERSION, matchedRunes: matched, correctRuneOrder: order, nextIndex: 0, insertion: 0, completedSlots: [], lastResult: null, complete: false };
}
export function selectNextRune(state, runeId) { const next = clone(state); if (next.complete) return { state: next, success: false, message: "All runes are already seated." }; const expected = next.correctRuneOrder[next.nextIndex]; if (runeId !== expected) { next.lastResult = "wrong-rune"; return { state: next, success: false, message: "The socket rejects that rune." }; } next.lastResult = "selected"; return { state: next, success: true, message: "The rune catches in the receiving socket." }; }
export function applyRuneForce(state, position, optimal = [42, 58]) {
  const next = clone(state);
  if (!["selected", "force-failed", "force-hit"].includes(next.lastResult)) return { state: next, success: false, message: "Select the next rune first." };
  const value = Number(position);
  const hit = value >= optimal[0] && value <= optimal[1];
  if (!hit) {
    next.insertion = Math.max(0, next.insertion - 0.25);
    next.lastResult = "force-failed";
    return { state: next, success: false, message: "Mechanical recoil knocks the rune back." };
  }
  next.insertion += 0.5;
  next.lastResult = "force-hit";
  if (next.insertion >= 1) {
    const rune = next.correctRuneOrder[next.nextIndex];
    next.completedSlots.push(rune);
    next.nextIndex += 1;
    next.insertion = 0;
    next.lastResult = next.nextIndex === 5 ? "complete" : "seated";
    next.complete = next.nextIndex === 5;
  }
  return { state: next, success: true, complete: next.complete, message: next.complete ? "All five runes are seated." : "The rune sinks deeper." };
}
