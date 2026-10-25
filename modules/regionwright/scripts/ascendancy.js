import { MODULE_ID } from "./constants.js";
import {
  ASCENDANCY_VERSION, ASCENDANCY_CHARACTERS, PAIRS, PERSONAL_PUZZLES, TRAM_IDS,
  advanceCooperativeStage, applyRuneForce, calibrateFrequencyStation, createAscendancyState,
  createCircuitConfig, createFrequencyConfig, createFrequencyState, createRuneMemoryConfig,
  createRuneSlottingState, createRushHourState, createTramRepairConfig, createTramRepairState,
  evaluateCircuit, flipRuneCards, hideRuneMismatch, installTramComponent, legalTramMoves,
  masterTestTram, moveTram, rotateCircuitComponent, selectNextRune, setFrequencyValue,
  recordFinalActivation, transitionPuzzle, updateProgression, validateAscendancyState, waveformSamples
} from "./ascendancy-engine.js";

export const ASCENDANCY_FLAG = "ascendancy";
export const ASCENDANCY_SOCKET = `module.${MODULE_ID}`;
export const SCENE_OWNED_ASCENDANCY_PUZZLES = Object.freeze(new Set([PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING]));
export const ASCENDANCY_TRAM_SCENE_CONTRACT = Object.freeze({ assetPath: "assets/maps/ascendancy-tram-depot-v3.png", width: 1536, height: 1024, rows: 6, columns: 6, origin: Object.freeze({ x: 420, y: 210 }), cellWidth: 110, cellHeight: 95, anchorCount: 36, stateOwner: "logical-board", mutation: "disabled-until-exact-runtime-gate" });
const openDialogs = new Map();
const pending = new Map();
let socketInstalled = false;
const relayDiagnostics = [];
const RELAY_DIAGNOSTIC_HOOK = `${MODULE_ID}.ascendancyRelayDiagnostic`;

const clone = value => structuredClone(value);
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const currentScene = () => globalThis.canvas?.scene ?? globalThis.game?.scenes?.active ?? null;
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === globalThis.game.user.id));
const userId = () => globalThis.game?.user?.id ?? null;
const now = () => Date.now();

function recordRelayDiagnostic(phase, details = {}) {
  const entry = Object.freeze({
    version: 1,
    phase,
    at: now(),
    userId: userId(),
    activeGM: activeGM(),
    regionUuid: details.regionUuid ?? null,
    puzzleId: details.puzzleId ?? null,
    recipientId: details.recipientId ?? null,
    senderId: details.senderId ?? null,
    requestId: details.requestId ?? null,
    eventType: details.eventType ?? null,
    error: details.error ? String(details.error?.message ?? details.error) : null,
  });
  relayDiagnostics.push(entry);
  if (relayDiagnostics.length > 32) relayDiagnostics.shift();
  globalThis.Hooks?.callAll?.(RELAY_DIAGNOSTIC_HOOK, entry);
  return entry;
}

function stateFor(scene = currentScene()) {
  if (!scene) return createAscendancyState();
  const stored = scene.getFlag?.(MODULE_ID, ASCENDANCY_FLAG) ?? scene.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG];
  try { return validateAscendancyState(stored ?? createAscendancyState({ sceneUuid: scene.uuid })); } catch (error) { console.warn(`${MODULE_ID} ignored invalid Ascendancy state.`, error); return createAscendancyState({ sceneUuid: scene.uuid }); }
}

async function persist(scene, state) {
  if (!activeGM()) throw new Error("Only the active GM can persist Ascendancy progress.");
  const next = validateAscendancyState(state);
  await scene.update({ [`flags.${MODULE_ID}.${ASCENDANCY_FLAG}`]: next });
  return next;
}

function runtimeFor(state, key, factory) { if (!state.data) state.data = {}; if (state.data[key] == null) state.data[key] = factory(); return state.data[key]; }
function configuredPermissions(state, puzzleId) { return state.data?.permissions?.[puzzleId] ?? null; }
function canUse(state, puzzleId, actorUserId = userId()) { const allowed = configuredPermissions(state, puzzleId); return !Array.isArray(allowed) || !allowed.length || allowed.includes(actorUserId) || globalThis.game?.user?.isGM; }

function mutation(state, puzzleId, action, payload = {}) {
  const next = clone(state);
  if (action === "reset") throw new Error("Partial Ascendancy puzzle resets are disabled; use the full GM reset without puzzleId.");
  if (SCENE_OWNED_ASCENDANCY_PUZZLES.has(puzzleId)) return { state: next, success: false, status: "scene-owned", message: "Andrew's tram routing is owned by the DiceBox Scene controller and has no Regionwright popup." };
  if (!canUse(next, puzzleId, payload.userId)) return { state: next, success: false, message: "That station is reserved for its assigned player." };
  const puzzle = next.puzzles[puzzleId];
  if (!puzzle) return { state: next, success: false, message: "That Ascendancy puzzle does not exist." };
  if (action === "open") {
    if (puzzle.state === "locked") return { state: next, success: false, message: "That puzzle is not available yet." };
    return { state: transitionPuzzle(next, puzzleId, "open"), success: true };
  }
  if (action === "close") return { state: transitionPuzzle(next, puzzleId, "close"), success: true };
  if (puzzle.state === "locked") return { state: next, success: false, message: "That puzzle is not available yet." };
  if (puzzle.state === "available") next.puzzles[puzzleId].state = "active";

  if (puzzleId === PERSONAL_PUZZLES.ALEISTER_FREQUENCY) {
    const config = createFrequencyConfig({ seed: `${next.seed}:frequency` }); const runtime = runtimeFor(next, "frequency", () => createFrequencyState(config));
    if (action === "frequency-set") { next.data.frequency = setFrequencyValue(runtime, payload.stationId, payload.field, payload.value); }
    if (action === "frequency-calibrate") {
      const result = calibrateFrequencyStation(config, runtime, payload.stationId); next.data.frequency = result.state;
      if (result.success && next.data.frequency.stations.every(station => station.complete)) return finish(next, puzzleId, { signatures: next.data.frequency.stations.map(station => station.signature) }, result);
      return { state: updateProgression(next), success: result.success, message: result.success ? `Station ${payload.stationId} stabilized.` : "The waveform still differs from the target.", result };
    }
    return { state: next, success: true, result: { runtime: next.data.frequency } };
  }
  if (puzzleId === PERSONAL_PUZZLES.SPROCKET_CIRCUIT) {
    const config = createCircuitConfig({ circuitId: payload.circuitId ?? "circuit-a", seed: `${next.seed}:circuit` }); const runtime = runtimeFor(next, "circuit", () => ({ rotations: {} }));
    if (action === "circuit-rotate") runtime.rotations = rotateCircuitComponent(config, runtime.rotations, payload.componentId, payload.amount ?? 1);
    const result = evaluateCircuit(config, runtime.rotations); if (result.solved) return finish(next, puzzleId, { circuitId: config.circuitId, rotations: result.rotations }, result);
    return { state: next, success: true, result: { ...result, runtime } };
  }
  if (puzzleId === PERSONAL_PUZZLES.DALTON_TRAM_REPAIR) {
    const tramId = payload.tramId ?? "tram-X"; const config = createTramRepairConfig({ tramId, seed: `${next.seed}:tram:${tramId}` }); const repairs = runtimeFor(next, "tramRepair", () => ({})); repairs[tramId] ??= createTramRepairState(config);
    if (action === "tram-install") { const result = installTramComponent(config, repairs[tramId], payload.componentId); repairs[tramId] = result.state; return { state: next, success: true, result }; }
    if (action === "tram-test") { const result = masterTestTram(config, repairs[tramId]); repairs[tramId] = result.state; if (result.success) next.trams[tramId] = { repaired: true, operational: true }; return { state: next, success: result.success, message: result.success ? `${tramId} is operational.` : "The master test identifies the remaining faults.", result }; }
    return { state: next, success: true, result: { runtime: repairs[tramId], config } };
  }
  if (puzzleId === PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING) {
    const runtime = runtimeFor(next, "routing", () => createRushHourState({ operational: Object.keys(next.trams).filter(id => next.trams[id]?.operational) }));
    if (action === "routing-move") { const result = moveTram(runtime, payload.pieceKey, payload.distance); if (!result.success) return { state: next, success: false, message: result.message, result }; next.data.routing = result.state; if (result.state.exited) return finish(next, puzzleId, { moveCount: result.state.moveCount, solution: result.state }, result); return { state: next, success: true, result: { ...result, legalMoves: legalMoves(result.state) } }; }
    return { state: next, success: true, result: { runtime, legalMoves: legalMoves(runtime) } };
  }
  if (puzzleId === PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY) {
    const config = createRuneMemoryConfig({ seed: `${next.seed}:rune-memory` }); const runtime = runtimeFor(next, "runeMemory", () => ({ cards: config.cards, matchedRunes: [], pending: null }));
    if (action === "rune-flip") { const result = flipRuneCards(config, runtime, payload.firstId, payload.secondId); next.data.runeMemory = result.state; if (result.status === "complete") return finish(next, puzzleId, { matchedRunes: result.state.matchedRunes }, result); return { state: next, success: result.status !== "invalid", result }; }
    if (action === "rune-hide-mismatch") { next.data.runeMemory = hideRuneMismatch(runtime); return { state: next, success: true, result: { runtime: next.data.runeMemory } }; }
    return { state: next, success: true, result: { runtime, config } };
  }
  if (puzzleId === PERSONAL_PUZZLES.TACTAL_RUNE_SLOTTING) {
    const matched = next.puzzles[PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY].result?.matchedRunes ?? payload.matchedRunes; const order = payload.correctRuneOrder ?? next.data?.runeSlotting?.correctRuneOrder;
    const runtime = runtimeFor(next, "runeSlotting", () => createRuneSlottingState(matched, order));
    if (action === "slot-select") { const result = selectNextRune(runtime, payload.runeId); next.data.runeSlotting = result.state; return { state: next, success: result.success, result }; }
    if (action === "slot-force") { const result = applyRuneForce(runtime, payload.position); next.data.runeSlotting = result.state; if (result.complete) return finish(next, puzzleId, { completedSlots: result.state.completedSlots }, result); return { state: next, success: result.success, result }; }
    return { state: next, success: true, result: { runtime, matchedRunes: runtime.matchedRunes } };
  }
  return { state: next, success: false, message: "That Ascendancy puzzle has no handler." };
}

function finish(state, puzzleId, result, detail = null) {
  const wasComplete = state.puzzles[puzzleId].state === "complete";
  const next = updateProgression(transitionPuzzle(state, puzzleId, "complete", result));
  return { state: next, success: true, completed: !wasComplete, result: detail ?? result, message: "Puzzle complete." };
}

function legalMoves(state) { return Object.keys(state.pieces).flatMap(pieceKey => legalTramMoves(state, pieceKey).map(move => ({ ...move, label: `${pieceKey} ${move.distance > 0 ? "forward" : "reverse"} ${Math.abs(move.distance)}` }))); }

async function applyMutation(payload) {
  const scene = currentScene(); if (!scene) return { success: false, message: "The active Scene is unavailable." };
  const before = stateFor(scene); const result = mutation(before, payload.puzzleId, payload.puzzleAction ?? payload.action, { ...payload, userId: payload.userId ?? userId() });
  const after = await persist(scene, result.state);
  if (payload.puzzleId === PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING && result.success) await syncRoutingScene(scene, result.state);
  if (result.completed) globalThis.Hooks?.callAll?.(`${MODULE_ID}.ascendancyPuzzleComplete`, { puzzleId: payload.puzzleId, result: result.result, scene, state: after });
  return { ...result, state: after };
}

function emitResponse(payload, senderId, result) { globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-response", requestId: payload.requestId, recipientId: payload.userId ?? senderId, result }); }
async function handleSocket(payload = {}, senderId = null) {
  if (payload.action === "ascendancy-response" && (!payload.recipientId || payload.recipientId === userId())) { const request = pending.get(payload.requestId); if (request) { pending.delete(payload.requestId); request(payload.result); } return; }
  if (payload.action === "ascendancy-open" && (!payload.recipientId || payload.recipientId === userId())) {
    const recipientId = payload.recipientId ?? userId();
    recordRelayDiagnostic("client-received-open", { puzzleId: payload.puzzleId, recipientId, senderId });
    try {
      await openAscendancyPuzzle(payload.puzzleId, payload.options);
      recordRelayDiagnostic("open-succeeded", { puzzleId: payload.puzzleId, recipientId, senderId });
    } catch (error) {
      recordRelayDiagnostic("open-rejected", { puzzleId: payload.puzzleId, recipientId, senderId, error });
      console.error(`${MODULE_ID} Ascendancy puzzle open rejected.`, error);
    }
    return;
  }
  if (payload.action === "ascendancy-open-request" && activeGM()) {
    const recipientId = payload.userId ?? senderId;
    recordRelayDiagnostic("gm-received-open-request", { puzzleId: payload.puzzleId, recipientId, senderId });
    globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-open", recipientId, puzzleId: payload.puzzleId, options: payload.options });
    recordRelayDiagnostic("gm-forwarded-open", { puzzleId: payload.puzzleId, recipientId, senderId });
    return;
  }
  if (payload.action === "ascendancy-region-event-request" && activeGM()) { const region = globalThis.fromUuidSync?.(payload.regionUuid) ?? await globalThis.fromUuid?.(payload.regionUuid); if (region) await handleAscendancyRegionEvent(region, { ...(payload.event ?? {}), userId: payload.userId ?? senderId }); return; }
  if (payload.action === "ascendancy-final-request" && activeGM()) { try { const result = await activateAscendancyStation(payload.characterId, currentScene(), { activationRound: payload.activationRound }); globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-response", requestId: payload.requestId, recipientId: payload.userId ?? senderId, result }); } catch (error) { globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-response", requestId: payload.requestId, recipientId: payload.userId ?? senderId, result: { success: false, message: error.message } }); } return; }
  if (payload.action === "ascendancy-mutate" && activeGM()) { try { emitResponse(payload, senderId, await applyMutation(payload)); } catch (error) { emitResponse(payload, senderId, { success: false, message: error.message }); } }
}

export function installAscendancySocket() { if (socketInstalled || !globalThis.game?.socket?.on) return false; globalThis.game.socket.on(ASCENDANCY_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); }); socketInstalled = true; recordRelayDiagnostic("socket-installed"); return true; }
export function getAscendancyRelayDiagnostics() { return clone(relayDiagnostics); }

export function getAscendancyState(scene = currentScene()) { return stateFor(scene); }
export async function initializeAscendancy(scene = currentScene(), { seed = null } = {}) { if (!activeGM() || !scene) throw new Error("Only the active GM can initialize Ascendancy on the current Scene."); const existing = scene.getFlag?.(MODULE_ID, ASCENDANCY_FLAG); if (existing) return stateFor(scene); const state = createAscendancyState({ sceneUuid: scene.uuid, seed: seed ?? scene.uuid ?? `scene-${now()}` }); return persist(scene, state); }
export async function resetAscendancy({ scene = currentScene(), puzzleId = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can reset Ascendancy.");
  if (puzzleId != null) throw new Error("Partial Ascendancy puzzle resets are disabled; use the full GM reset without puzzleId.");
  const state = stateFor(scene);
  return persist(scene, createAscendancyState({ sceneUuid: scene.uuid, seed: state.seed }));
}
export async function requestAscendancyMutation(puzzleId, action, payload = {}) { const requestId = globalThis.foundry?.utils?.randomID?.() ?? `${now()}-${Math.random().toString(36).slice(2)}`; const message = { requestId, puzzleId, ...payload, action: "ascendancy-mutate", puzzleAction: action, userId: userId() }; if (activeGM()) return applyMutation({ ...message, action }); if (!globalThis.game?.users?.activeGM) return { success: false, message: "A GM must be connected to save Ascendancy progress." }; return new Promise(resolve => { pending.set(requestId, resolve); globalThis.game.socket.emit(ASCENDANCY_SOCKET, message); setTimeout(() => { if (!pending.has(requestId)) return; pending.delete(requestId); resolve({ success: false, message: "The active GM did not respond." }); }, 10000); }); }

export async function openAscendancyPuzzle(puzzleId, options = {}) {
  if (!Object.values(PERSONAL_PUZZLES).includes(puzzleId)) throw new Error("Cooperative Ascendancy stages remain physical Scene puzzles.");
  if (SCENE_OWNED_ASCENDANCY_PUZZLES.has(puzzleId)) throw new Error("Andrew's tram routing is a DiceBox Scene controller, not a Regionwright popup.");
  const scene = currentScene(); const state = stateFor(scene); if (!canUse(state, puzzleId)) throw new Error("That station is reserved for another player."); if (state.puzzles[puzzleId].state === "locked") return null;
  const existing = openDialogs.get(puzzleId); if (existing) { existing.bringToFront?.(); return existing; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createAscendancyDialog(DialogV2))({ puzzleId, state, options }); openDialogs.set(puzzleId, dialog); await dialog.render({ force: true }); return dialog;
}

export async function openCircuitPuzzle(circuitId = "circuit-a") { return openAscendancyPuzzle(PERSONAL_PUZZLES.SPROCKET_CIRCUIT, { circuitId }); }

export function availableAscendancyPuzzles(scene = currentScene()) {
  const state = stateFor(scene);
  return Object.values(PERSONAL_PUZZLES).filter(puzzleId => !SCENE_OWNED_ASCENDANCY_PUZZLES.has(puzzleId)).map(puzzleId => ({ id: puzzleId, label: puzzleTitle(puzzleId), state: state.puzzles[puzzleId]?.state ?? "locked" })).filter(puzzle => ["available", "active"].includes(puzzle.state));
}

export async function advanceAscendancyCooperativeStage(pairId, scene = currentScene()) { if (!activeGM()) throw new Error("Only the active GM can advance a cooperative Ascendancy stage."); const state = advanceCooperativeStage(stateFor(scene), pairId); return persist(scene, state); }
export async function setAscendancyPuzzlePermissions(puzzleId, allowedUserIds, scene = currentScene()) { if (!activeGM()) throw new Error("Only the active GM can set Ascendancy puzzle permissions."); const state = stateFor(scene); state.data.permissions[puzzleId] = [...new Set((allowedUserIds ?? []).filter(Boolean))]; return persist(scene, state); }
export async function activateAscendancyStation(characterId, scene = currentScene(), { activationRound = null } = {}) { if (!activeGM()) throw new Error("Only the active GM can record final activation."); const before = stateFor(scene); const result = recordFinalActivation(before, characterId, activationRound); if (!result.success) return result; if (result.completed && !result.state.finalActivation.cutsceneTriggered) { result.state.finalActivation.cutsceneTriggered = true; globalThis.Hooks?.callAll?.(`${MODULE_ID}.ascendancyCoreUnlocked`, { scene, state: result.state }); } return { ...result, state: await persist(scene, result.state) }; }

/**
 * Move the physical tram Tiles from logical anchor flags. The state argument
 * is authoritative; a Tile's current x/y is never consulted for legality.
 */
export async function syncRoutingScene(scene = currentScene(), state = stateFor(scene)) {
  if (!activeGM() || !scene) return false;
  const anchors = scene.getFlag?.(MODULE_ID, ASCENDANCY_FLAG)?.anchors ?? scene.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG]?.anchors ?? {};
  const tiles = [...(scene.tiles?.values?.() ?? scene.tiles ?? [])];
  const runtime = state.data?.routing; if (!runtime) return false;
  for (const [pieceKey, piece] of Object.entries(runtime.pieces)) {
    const tile = tiles.find(entry => entry.getFlag?.(MODULE_ID, ASCENDANCY_FLAG)?.tramId === piece.id || entry.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG]?.tramId === piece.id);
    const anchorId = piece.exited ? "tram-exit" : `tram-slot-r${piece.row + 1}-c${piece.column + 1}`;
    const anchor = anchors[anchorId];
    if (!tile || !anchor || typeof tile.update !== "function") continue;
    await tile.update({ x: anchor.x, y: anchor.y, ...(anchor.elevation == null ? {} : { elevation: anchor.elevation }) });
  }
  if (runtime.exited) {
    const tokenUuids = scene.getFlag?.(MODULE_ID, ASCENDANCY_FLAG)?.partyTokenUuids ?? [];
    for (const uuid of tokenUuids.slice(0, 2)) { const token = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid); if (token?.update && anchors["tram-exit"]) await token.update({ x: anchors["tram-exit"].x, y: anchors["tram-exit"].y }); }
  }
  return true;
}

export async function configureAscendancyRegion(region, config) { if (!activeGM() || !region?.update) throw new Error("Only the active GM can configure an Ascendancy Region."); const next = { version: ASCENDANCY_VERSION, ...clone(config) }; await region.update({ [`flags.${MODULE_ID}.${ASCENDANCY_FLAG}.region`]: next }); return region; }
export async function configureAscendancyRoutingScene({ anchors = {}, partyTokenUuids = [] } = {}, scene = currentScene()) { if (!activeGM() || !scene?.update) throw new Error("Only the active GM can configure Ascendancy tram anchors."); await scene.update({ [`flags.${MODULE_ID}.${ASCENDANCY_FLAG}.anchors`]: clone(anchors), [`flags.${MODULE_ID}.${ASCENDANCY_FLAG}.partyTokenUuids`]: [...partyTokenUuids].slice(0, 2) }); return scene; }
export async function handleAscendancyRegionEvent(region, event = {}) {
  const config = region?.getFlag?.(MODULE_ID, ASCENDANCY_FLAG)?.region ?? region?.flags?.[MODULE_ID]?.[ASCENDANCY_FLAG]?.region;
  const eventType = event.type ?? event.name ?? event.event ?? "tokenEnter";
  if (!config) { recordRelayDiagnostic("behavior-config-missing", { regionUuid: region?.uuid ?? null, eventType }); return null; }
  const targetUserId = event.userId ?? event.user?.id ?? userId();
  recordRelayDiagnostic("behavior-dispatched", { regionUuid: region?.uuid ?? null, puzzleId: config.puzzleId ?? null, recipientId: targetUserId, eventType });
  if (["cooperative", "core"].includes(config.stage) && !activeGM()) {
    globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-region-event-request", regionUuid: region.uuid, event: { type: eventType, activationRound: event.activationRound }, userId: targetUserId });
    return { status: "gm-listener-requested", stage: config.stage, config };
  }
  if (config.stage === "cooperative") { globalThis.Hooks?.callAll?.(`${MODULE_ID}.ascendancyCooperativeStage`, { region, config, event }); return { status: "physical-stage", config }; }
  if (config.stage === "core") { const state = stateFor(currentScene()); const unlocked = state.finalActivation.complete === true; if (unlocked) globalThis.Hooks?.callAll?.(`${MODULE_ID}.ascendancyCoreUnlocked`, { region, config, event, state }); return { status: unlocked ? "core-unlocked" : "core-locked", config, state }; }
  if (config.stage === "final") return requestFinalActivation(config.characterId ?? event.characterId, currentScene(), event.activationRound);
  if (SCENE_OWNED_ASCENDANCY_PUZZLES.has(config.puzzleId)) return { status: "scene-owned", puzzleId: config.puzzleId, popup: false };
  if (activeGM()) {
    globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-open", recipientId: targetUserId, puzzleId: config.puzzleId, options: config.options });
    recordRelayDiagnostic("gm-forwarded-open", { regionUuid: region?.uuid ?? null, puzzleId: config.puzzleId, recipientId: targetUserId, eventType });
    return targetUserId === userId() ? openAscendancyPuzzle(config.puzzleId, config.options) : { status: "open-forwarded", puzzleId: config.puzzleId, recipientId: targetUserId };
  }
  globalThis.game?.socket?.emit?.(ASCENDANCY_SOCKET, { action: "ascendancy-open-request", puzzleId: config.puzzleId, options: config.options, userId: targetUserId });
  return { status: "open-requested", puzzleId: config.puzzleId, recipientId: targetUserId };
}

async function requestFinalActivation(characterId, scene = currentScene(), activationRound = null) {
  if (!characterId) return { success: false, message: "That activation station has no character assignment." };
  if (activeGM()) return activateAscendancyStation(characterId, scene, { activationRound });
  if (!globalThis.game?.users?.activeGM) return { success: false, message: "A GM must be connected to record the activation." };
  const requestId = globalThis.foundry?.utils?.randomID?.() ?? `${now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise(resolve => { pending.set(requestId, resolve); globalThis.game.socket.emit(ASCENDANCY_SOCKET, { action: "ascendancy-final-request", requestId, characterId, activationRound, userId: userId() }); setTimeout(() => { if (!pending.has(requestId)) return; pending.delete(requestId); resolve({ success: false, message: "The active GM did not respond." }); }, 10000); });
}

function createAscendancyDialog(DialogV2) {
  return class AscendancyDialog extends DialogV2 {
    constructor({ puzzleId, state, options }) { super({ classes: ["regionwright", "rw-ascendancy-dialog"], window: { title: puzzleTitle(puzzleId), icon: "fa-solid fa-gear", resizable: true, minimizable: false }, position: { width: 760, height: 620 }, content: `<div class="rw-ascendancy-shell"><div class="rw-ascendancy-body">${renderBody(puzzleId, state, options)}</div></div>`, buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] }); this.puzzleId = puzzleId; this.ascendancyState = state; this.ascendancyOptions = options; this.memoryFirst = null; }
    _onRender(context, options) { super._onRender(context, options); const root = this.element?.[0] ?? this.element; root?.addEventListener("click", event => { const target = event.target.closest?.("[data-ascendancy-action]"); if (!target) return; event.preventDefault(); event.stopPropagation(); void this.act(target.dataset.ascendancyAction, target.dataset); }); root?.addEventListener("change", event => { const target = event.target.closest?.("[data-ascendancy-action]"); if (target) void this.act(target.dataset.ascendancyAction, target.dataset, event.target.value); }); root?.addEventListener("input", event => { const target = event.target.closest?.("[data-ascendancy-action]"); if (target?.dataset.ascendancyAction === "frequency-set") void this.act("frequency-set", target.dataset, event.target.value); }); }
    async act(action, data, value = null) { const payload = { ...data }; if (value !== null) payload.value = value; if (action === "close") return this.close(); if (action === "tram-select") { this.ascendancyOptions.selectedTram = value ?? data.value; this.refresh(); return; } if (action === "rune-flip") { if (!this.memoryFirst) { this.memoryFirst = data.cardId; this.refresh(); return; } payload.firstId = this.memoryFirst; payload.secondId = data.cardId; this.memoryFirst = null; } if (this.puzzleId === PERSONAL_PUZZLES.TACTAL_RUNE_SLOTTING) { payload.correctRuneOrder = this.ascendancyOptions.correctRuneOrder; payload.matchedRunes = this.ascendancyOptions.matchedRunes; } const result = await requestAscendancyMutation(this.puzzleId, action, payload); if (result?.state) this.ascendancyState = result.state; if (action === "rune-flip" && result?.result?.status === "mismatch") setTimeout(() => void requestAscendancyMutation(this.puzzleId, "rune-hide-mismatch"), 900); if (result?.message) globalThis.ui?.notifications?.[result.success ? "info" : "warn"]?.(result.message); this.refresh(); }
    refresh() { const root = this.element?.[0] ?? this.element; const body = root?.querySelector?.(".rw-ascendancy-body"); if (body) body.innerHTML = renderBody(this.puzzleId, this.ascendancyState, this.ascendancyOptions); }
    async close(options = {}) { openDialogs.delete(this.puzzleId); if (this.ascendancyState?.puzzles?.[this.puzzleId]?.state === "active") await requestAscendancyMutation(this.puzzleId, "close"); return super.close(options); }
  };
}

function puzzleTitle(id) { return { [PERSONAL_PUZZLES.ALEISTER_FREQUENCY]: "Aleister — Frequency Calibration", [PERSONAL_PUZZLES.SPROCKET_CIRCUIT]: "Sprocket — Circuit Routing", [PERSONAL_PUZZLES.DALTON_TRAM_REPAIR]: "Dalton — Tram Repair", [PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING]: "Andrew — Tram Routing Controller", [PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY]: "Lawson — Rune Memory", [PERSONAL_PUZZLES.TACTAL_RUNE_SLOTTING]: "Tactal — Heavy Rune Slotting" }[id] ?? "Ascendancy"; }
function renderBody(id, state, options) {
  if (id === PERSONAL_PUZZLES.ALEISTER_FREQUENCY) return renderFrequency(state);
  if (id === PERSONAL_PUZZLES.SPROCKET_CIRCUIT) return renderCircuit(state, options);
  if (id === PERSONAL_PUZZLES.DALTON_TRAM_REPAIR) return renderRepair(state, options);
  if (id === PERSONAL_PUZZLES.ANDREW_TRAM_ROUTING) return renderRouting(state);
  if (id === PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY) return renderMemory(state);
  return renderSlotting(state, options);
}
function renderFrequency(state) { const config = createFrequencyConfig({ seed: `${state.seed}:frequency` }); const runtime = state.data?.frequency ?? createFrequencyState(config); return `<p class="rw-ascendancy-intro">Tune each generator until the current waveform matches its target exactly.</p><div class="rw-frequency-grid">${runtime.stations.map(station => { const target = config.stations.find(entry => entry.id === station.id)?.target; return `<section class="rw-frequency-station ${station.complete ? "is-complete" : ""}"><h3>${escapeHTML(station.id)} ${station.complete ? "✓" : ""}</h3><div class="rw-wave-label">TARGET WAVE <code>${escapeHTML((target?.frequency ?? 0) + "/" + (target?.phase ?? 0) + "/" + (target?.amplitude ?? 0))}</code></div><div class="rw-wave-label">CURRENT WAVE <code>${escapeHTML(station.current.frequency + "/" + station.current.phase + "/" + station.current.amplitude)}</code></div><div class="rw-waveform" aria-label="Current waveform">${waveformSamples(station.current, 16).map(value => `<i style="height:${Math.max(2, Math.abs(value) * 8)}px"></i>`).join("")}</div>${["frequency", "phase", "amplitude"].map(field => `<label>${field}<input type="range" min="1" max="${field === "amplitude" ? 3 : 5}" value="${station.current[field]}" data-ascendancy-action="frequency-set" data-station-id="${station.id}" data-field="${field}" ${station.complete ? "disabled" : ""}></label>`).join("")}<button type="button" data-ascendancy-action="frequency-calibrate" data-station-id="${station.id}" ${station.complete ? "disabled" : ""}>${station.complete ? `Signature ${escapeHTML(station.signature)}` : "Stabilize station"}</button></section>`; }).join("")}</div>`; }
function renderCircuit(state, options) { const config = createCircuitConfig({ circuitId: options?.circuitId ?? "circuit-a", seed: `${state.seed}:circuit` }); const runtime = state.data?.circuit ?? { rotations: {} }; const trace = evaluateCircuit(config, runtime.rotations); const map = new Map(config.components.map(component => [`${component.row},${component.col}`, component])); return `<p class="rw-ascendancy-intro">Rotate conductors to energize the destination. Validation follows connected ports and graph traversal.</p><div class="rw-circuit-board">${Array.from({ length: 25 }, (_, index) => { const row = Math.floor(index / 5); const col = index % 5; const component = map.get(`${row},${col}`); return component ? `<button type="button" class="rw-circuit-cell" data-ascendancy-action="circuit-rotate" data-component-id="${component.id}">${component.kind === "source" ? "◉" : component.kind === "destination" ? "◎" : component.kind === "deadEnd" ? "•" : component.kind === "crossover" ? "╳" : component.kind === "tee" ? "┳" : component.kind === "elbow" ? "⌜" : "━"}<small>${component.id}</small></button>` : "<span class=\"rw-circuit-cell is-empty\"></span>"; }).join("")}</div><p class="rw-ascendancy-status ${trace.solved ? "is-success" : ""}">${trace.solved ? "Circuit energized." : escapeHTML(trace.invalidReasons.join(" · ") || "Disconnected circuit")}</p>`; }
function renderRepair(state, options = {}) { const repairs = state.data?.tramRepair ?? {}; const selected = options.selectedTram ?? Object.keys(repairs)[0] ?? "tram-X"; const config = createTramRepairConfig({ tramId: selected, seed: `${state.seed}:tram:${selected}` }); const runtime = repairs[selected] ?? createTramRepairState(config); return `<p class="rw-ascendancy-intro">Install the correct components, then run the master test. Faults remain visible when another subsystem is wrong.</p><label>Tram <select data-ascendancy-action="tram-select">${TRAM_IDS.map(id => `<option value="${id}" ${id === selected ? "selected" : ""}>${id}</option>`).join("")}</select></label><div class="rw-tram-systems">${config.faults.map(fault => `<span class="${runtime.installed.includes(fault.component) ? "is-fixed" : ""}">${fault.subsystem}</span>`).join("")}</div><div class="rw-component-tray">${config.components.map(component => `<button type="button" data-ascendancy-action="tram-install" data-tram-id="${selected}" data-component-id="${component.id}">${component.id}</button>`).join("")}</div><button type="button" data-ascendancy-action="tram-test" data-tram-id="${selected}">Master test</button><p class="rw-ascendancy-status">${runtime.lastTest ? (runtime.lastTest.success ? "Operational." : `Still faulty: ${runtime.lastTest.missingFaults.join(", ")}`) : "Awaiting diagnostic test."}</p>`; }
function renderRouting(state) { const runtime = state.data?.routing ?? createRushHourState({ operational: Object.keys(state.trams ?? {}).filter(id => state.trams[id]?.operational) }); const moves = legalMoves(runtime); return `<p class="rw-ascendancy-intro">Select a repaired tram and move only along its fixed axis. The logical board controls legality.</p><div class="rw-routing-readout">${Object.entries(runtime.pieces).map(([key, piece]) => `<span>${key}: ${piece.row + 1},${piece.column + 1}${piece.exited ? " EXIT" : ""}</span>`).join("")}</div><div class="rw-routing-moves">${moves.length ? moves.map(move => `<button type="button" data-ascendancy-action="routing-move" data-piece-key="${move.piece}" data-distance="${move.distance}">${move.label}</button>`).join("") : "<span>No legal moves for currently operational trams.</span>"}</div><p class="rw-ascendancy-status ${runtime.exited ? "is-success" : ""}">${runtime.exited ? "Andrew and Dalton's tram reached the crossing." : `Moves: ${runtime.moveCount}`}</p>`; }
function renderMemory(state) { const config = createRuneMemoryConfig({ seed: `${state.seed}:rune-memory` }); const runtime = state.data?.runeMemory ?? { cards: config.cards, matchedRunes: [], pending: null }; return `<p class="rw-ascendancy-intro">Find the five duplicated runes. Decoys occur only once; matched pairs stay face-up.</p><div class="rw-rune-grid">${runtime.cards.map(card => `<button type="button" class="rw-rune-card ${card.faceUp ? "is-face-up" : ""} ${card.matched ? "is-matched" : ""}" data-ascendancy-action="rune-flip" data-card-id="${card.id}">${card.faceUp ? escapeHTML(card.runeId) : "?"}</button>`).join("")}</div><p class="rw-ascendancy-status">Matched: ${(runtime.matchedRunes ?? []).length}/5</p>`; }
function renderSlotting(state, options) { const runtime = state.data?.runeSlotting; const matched = runtime?.matchedRunes ?? state.puzzles[PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY].result?.matchedRunes ?? options?.matchedRunes ?? []; return `<p class="rw-ascendancy-intro">Choose the next rune in the Scene-established order, then stop the force bar inside OPTIMAL twice.</p><div class="rw-slot-runes">${matched.map(rune => `<button type="button" data-ascendancy-action="slot-select" data-rune-id="${rune}" ${runtime?.completedSlots?.includes(rune) ? "disabled" : ""}>${escapeHTML(rune)}</button>`).join("")}</div><label>Force position<input type="range" min="0" max="100" value="50" data-ascendancy-action="slot-force"></label><button type="button" data-ascendancy-action="slot-force" data-position="50">Apply force</button><p class="rw-ascendancy-status">Completed slots: ${(runtime?.completedSlots ?? []).length}/5</p>`; }

export const ascendancyAPI = Object.freeze({ initialize: initializeAscendancy, state: getAscendancyState, available: availableAscendancyPuzzles, reset: resetAscendancy, open: openAscendancyPuzzle, openCircuitPuzzle, mutate: requestAscendancyMutation, configureRegion: configureAscendancyRegion, configureRoutingScene: configureAscendancyRoutingScene, syncRoutingScene, sceneContract: ASCENDANCY_TRAM_SCENE_CONTRACT, handleRegionEvent: handleAscendancyRegionEvent, advanceCooperativeStage: advanceAscendancyCooperativeStage, setPermissions: setAscendancyPuzzlePermissions, activateStation: activateAscendancyStation, installSocket: installAscendancySocket, relayDiagnostics: getAscendancyRelayDiagnostics });
