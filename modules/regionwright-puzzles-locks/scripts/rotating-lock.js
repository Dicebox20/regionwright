import { MODULE_ID, PUZZLE_FLAG_SCOPE } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import {
  DIFFICULTY_PROFILES, ENGINE_DEFAULTS, LOCK_PHASES, ROTATING_LOCK_VERSION,
  advanceLock, createRuntimeState, effectiveTier, presentationForState,
  replaceBrokenPick, seededTarget, setPickAngle, setTorque
} from "./rotating-lock-engine.js";
import { lockSkillRank } from "./rotating-lock-adapter.js";
import { loadRotationLockPointBoardData, RotationLockPointBoardRenderer } from "./rotation-lock-point-art.js";

export const PREMIUM_MODULE_ID = MODULE_ID;
export const ROTATING_LOCK_FLAG = "rotatingLock";
export const ROTATING_LOCK_SOCKET = `module.${PREMIUM_MODULE_ID}`;

const activeSessions = new Map();
const openDialogs = new Map();
const waitingRequests = new Map();
let socketInstalled = false;
let doorControlInstalled = false;

const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const sessionId = () => globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function doorStates() { return globalThis.CONST?.WALL_DOOR_STATES ?? { CLOSED: 0, OPEN: 1, LOCKED: 2 }; }
function activeGM() {
  const gm = globalThis.game?.users?.activeGM;
  return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id));
}
function rootFor(application) { return application?.element?.[0] ?? application?.element ?? null; }
function currentActor() { return globalThis.canvas?.tokens?.controlled?.length === 1 ? globalThis.canvas.tokens.controlled[0]?.actor ?? null : null; }

function lockData(door) {
  return door?.getFlag?.(PUZZLE_FLAG_SCOPE, ROTATING_LOCK_FLAG)
    ?? door?.flags?.[PUZZLE_FLAG_SCOPE]?.[ROTATING_LOCK_FLAG]
    ?? null;
}
function normalizeLock(data) {
  if (!data || typeof data !== "object" || !data.config || !data.persistent) return null;
  if (Number(data.config.version) !== ROTATING_LOCK_VERSION) return null;
  return data;
}
function targetFor(config, persistent) {
  if (Number.isFinite(Number(persistent?.targetAngle))) return clamp(Number(persistent.targetAngle), -90, 90);
  if (config.target.policy === "fixed" && Number.isFinite(Number(config.target.fixedAngle))) return clamp(Number(config.target.fixedAngle), -90, 90);
  return seededTarget(config.target.seed, config.difficulty.baseTier);
}

export function createRotatingLockConfig({ baseTier = 2, seed = sessionId(), picks = 3 } = {}) {
  const tier = clamp(Math.trunc(Number(baseTier) || 0), 0, DIFFICULTY_PROFILES.length - 1);
  return Object.freeze({
    version: ROTATING_LOCK_VERSION,
    enabled: true,
    premiumFeature: true,
    difficulty: { baseTier: tier, showTierToPlayer: true, applyToolProficiency: true },
    target: { policy: "seeded", seed: String(seed), fixedAngle: null, persistAcrossBrokenPicks: true, persistAcrossClose: true },
    picks: { mode: "virtual", startingCount: Math.max(1, Math.trunc(Number(picks) || 3)), showDurability: true },
    controls: { allowPointer: true, allowKeyboard: true, allowTouch: true, allowFineAdjustment: true },
    presentation: { soundEnabled: true, reducedMotionOverride: "system", showReferenceMarks: true, showNumericDurability: false },
    trap: { enabled: false, state: { initial: "armed", resetPolicy: "manual" }, triggers: [] },
    outcomes: {}
  });
}

export function validateRotatingLockConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== ROTATING_LOCK_VERSION) throw new Error("This Rotation Lock configuration is unsupported.");
  if (!Number.isInteger(config.difficulty?.baseTier) || config.difficulty.baseTier < 0 || config.difficulty.baseTier >= DIFFICULTY_PROFILES.length) throw new Error("This Rotation Lock has an invalid difficulty.");
  if (!config.target?.seed) throw new Error("This Rotation Lock needs a target seed.");
  return clone(config);
}

function createPersistent(config) {
  return { version: ROTATING_LOCK_VERSION, status: "locked", targetAngle: targetFor(config, {}), brokenPickCount: 0, failedSessionCount: 0, lastInteractorTokenUuid: null, lastUpdatedAt: Date.now(), trapState: config.trap?.enabled ? config.trap.state.initial : "none" };
}
async function resolveDoor(doorOrUuid) {
  if (doorOrUuid?.documentName === "Wall") return doorOrUuid;
  const uuid = String(doorOrUuid ?? "").trim();
  if (!uuid) throw new Error("Choose a Door first.");
  const door = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  if (!door || door.documentName !== "Wall" || Number(door.door ?? 0) <= 0) throw new Error("The selected document is not a Door.");
  return door;
}
function requireGMWrite() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a Rotation Lock.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, "enablePuzzleWrites") !== true) throw new Error("Enable Regionwright Puzzle writes in Configure Settings before creating a lock.");
}

export async function configureRotatingLockDoor({ door: doorOrUuid, baseTier = 2, seed, picks } = {}) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  const config = createRotatingLockConfig({ baseTier, seed, picks });
  const persistent = createPersistent(config);
  await door.update({ ds: doorStates().LOCKED, [`flags.${PUZZLE_FLAG_SCOPE}.${ROTATING_LOCK_FLAG}`]: { config, persistent } });
  return { door, config, persistent };
}

export async function clearRotatingLockDoor(doorOrUuid) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  await door.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${ROTATING_LOCK_FLAG}`]: null });
  return door;
}

export function isRotatingLockDoor(door) { return Boolean(normalizeLock(lockData(door))); }
export function isConfiguredRotatingLockDoor(door) { return isRotatingLockDoor(door) && Number(door.ds) === doorStates().LOCKED; }

async function persistLock(door, next) {
  await door.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${ROTATING_LOCK_FLAG}`]: next });
  return next;
}
function sessionPayload(session) {
  return { sessionId: session.id, doorUuid: session.doorUuid, config: clone(session.config), targetAngle: session.targetAngle, effectiveTier: session.effectiveTier, proficiency: clone(session.proficiency), picksRemaining: session.picksRemaining };
}

/**
 * A player may read the configured Door but may never write it. Building this
 * short-lived local session removes a fragile request/response dependency
 * from opening the puzzle; the GM still owns every persistent state change.
 */
async function startClientSession({ doorUuid, userId, tokenUuid = null } = {}) {
  const door = await resolveDoor(doorUuid);
  const data = normalizeLock(lockData(door));
  if (!isConfiguredRotatingLockDoor(door) || data?.persistent?.status !== "locked") throw new Error("That Rotation Lock is no longer available.");
  const proficiency = lockSkillRank(currentActor());
  const rank = data.config.difficulty.applyToolProficiency ? proficiency.rank : 0;
  return {
    sessionId: sessionId(),
    doorUuid: door.uuid,
    config: clone(data.config),
    targetAngle: targetFor(data.config, data.persistent),
    effectiveTier: effectiveTier(data.config.difficulty.baseTier, rank),
    proficiency: clone(proficiency),
    picksRemaining: data.config.picks.mode === "unbreakable" ? Infinity : data.config.picks.startingCount,
    userId,
    tokenUuid
  };
}

async function startSession({ doorUuid, userId, tokenUuid = null } = {}) {
  const door = await resolveDoor(doorUuid);
  const data = normalizeLock(lockData(door));
  if (!isConfiguredRotatingLockDoor(door) || data?.persistent?.status !== "locked") throw new Error("That Rotation Lock is no longer available.");
  const current = activeSessions.get(door.uuid);
  if (current && current.userId !== userId) throw new Error("Another adventurer is already working this lock.");
  if (current) return sessionPayload(current);
  const actor = currentActor();
  const proficiency = lockSkillRank(actor);
  const rank = data.config.difficulty.applyToolProficiency ? proficiency.rank : 0;
  const targetAngle = targetFor(data.config, data.persistent);
  if (!Number.isFinite(Number(data.persistent.targetAngle))) {
    data.persistent.targetAngle = targetAngle;
    data.persistent.lastUpdatedAt = Date.now();
    if (activeGM()) await persistLock(door, data);
  }
  const session = { id: sessionId(), doorUuid: door.uuid, door, userId, tokenUuid, config: data.config, targetAngle, effectiveTier: effectiveTier(data.config.difficulty.baseTier, rank), proficiency, picksRemaining: data.config.picks.mode === "unbreakable" ? Infinity : data.config.picks.startingCount, resolved: false, createdAt: Date.now() };
  activeSessions.set(door.uuid, session);
  return sessionPayload(session);
}

async function recordBreak({ doorUuid, sessionId: expectedSession, userId } = {}) {
  const session = activeSessions.get(doorUuid);
  if (!session || session.id !== expectedSession || session.userId !== userId || session.resolved) return { accepted: false };
  const data = normalizeLock(lockData(session.door));
  data.persistent.brokenPickCount = Number(data.persistent.brokenPickCount ?? 0) + 1;
  data.persistent.lastUpdatedAt = Date.now();
  try {
    await persistLock(session.door, data);
    return { accepted: true };
  } catch (_error) {
    return { accepted: true, deferred: true };
  }
}

async function finishSession({ doorUuid, sessionId: expectedSession, userId } = {}) {
  const session = activeSessions.get(doorUuid);
  const door = session?.door ?? await resolveDoor(doorUuid);
  if (session && (session.id !== expectedSession || session.userId !== userId || session.resolved)) return { success: false, message: "This lock attempt has expired." };
  const data = normalizeLock(lockData(door));
  if (!data || data.persistent.status !== "locked" || !isConfiguredRotatingLockDoor(door)) return { success: false, message: "That lock is no longer available." };
  if (session) session.resolved = true;
  data.persistent.status = "unlocked";
  data.persistent.lastUpdatedAt = Date.now();
  await door.update({ ds: doorStates().CLOSED, [`flags.${PUZZLE_FLAG_SCOPE}.${ROTATING_LOCK_FLAG}`]: data });
  activeSessions.delete(doorUuid);
  return { success: true, message: "The lock opens." };
}

function response(recipientId, requestId, result) { globalThis.game?.socket?.emit?.(ROTATING_LOCK_SOCKET, { action: "response", recipientId, requestId, result }); }
async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "response" && payload.recipientId === globalThis.game?.user?.id) {
    const pending = waitingRequests.get(payload.requestId);
    if (pending) { waitingRequests.delete(payload.requestId); pending.resolve(payload.result); }
    return;
  }
  if (!activeGM()) return;
  const userId = payload.userId ?? senderId;
  try {
    if (payload.action === "start") return response(userId, payload.requestId, await startSession({ ...payload, userId }));
    if (payload.action === "break") return response(userId, payload.requestId, await recordBreak({ ...payload, userId }));
    if (payload.action === "finish") return response(userId, payload.requestId, await finishSession({ ...payload, userId }));
    if (payload.action === "release") activeSessions.delete(payload.doorUuid);
  } catch (error) { response(userId, payload.requestId, { error: error.message ?? "The lock could not be updated." }); }
}

export function installRotatingLockSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(ROTATING_LOCK_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
}
function requestGM(action, payload) {
  const userId = globalThis.game?.user?.id;
  // Every runtime action must be authoritative on the active GM. In
  // particular, do not optimistically call finishSession or recordBreak on a
  // Player3 client: those functions persist Wall flags and door state.
  if (!activeGM()) return requestRemoteGM(action, payload);
  if (action === "start") return startSession({ ...payload, userId });
  if (action === "break") return recordBreak({ ...payload, userId });
  if (action === "finish") return finishSession({ ...payload, userId });
  return requestRemoteGM(action, payload);
}
async function waitForDoorUnlock(doorUuid, timeout = 9000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeout) {
    const door = await resolveDoor(doorUuid);
    if (Number(door.ds) !== doorStates().LOCKED) return { success: true, message: "The lock opens." };
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  return { success: false, message: "The active GM did not unlock this Door." };
}

async function requestRemoteGM(action, payload, previousError = null) {
  const userId = globalThis.game?.user?.id;
  if (action === "start") return startClientSession({ ...payload, userId });
  const requestId = sessionId();
  // Break feedback is local. The GM may record it when a session exists, but
  // the puzzle never needs a response before it can replace a virtual pick.
  if (action === "break") {
    globalThis.game?.socket?.emit?.(ROTATING_LOCK_SOCKET, { action, requestId, ...payload, userId, puzzle: "rotation-lock" });
    return { accepted: true, deferred: true };
  }
  // Door updates are authoritative world-document events and synchronize to
  // the player more reliably than a second custom socket response. Do not let
  // a missing response strand the player in a completed puzzle.
  if (action === "finish") {
    globalThis.game?.socket?.emit?.(ROTATING_LOCK_SOCKET, { action, requestId, ...payload, userId, puzzle: "rotation-lock" });
    return waitForDoorUnlock(payload.doorUuid);
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      waitingRequests.delete(requestId);
      reject(previousError ?? new Error("The active GM could not update this Door."));
    }, 8000);
    waitingRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } });
    globalThis.game?.socket?.emit?.(ROTATING_LOCK_SOCKET, { action, requestId, ...payload, userId, puzzle: "rotation-lock" });
  });
}

function lockMarkup(state, session) {
  const view = presentationForState(state);
  const status = state.phase === LOCK_PHASES.PICK_BROKEN ? "The pick breaks." : state.phase === LOCK_PHASES.OPENED ? "The lock turns free." : view.isBlocked ? "The pick shakes — release A." : "";
  const durability = Math.round(state.pickDurability * 100);
  return `<section class="rw-rotation-lock" tabindex="0" aria-label="Rotation Lock puzzle"><p class="rw-rotation-instruction">Mouse: pick. <kbd>A</kbd>: turn.</p><div class="rw-rotation-stage ${view.isBlocked ? "is-resisting" : ""}"><div class="rw-skyrim-lock" role="img" aria-label="A point-board lock. Move the mouse left or right to position the pick, then hold A to turn the cylinder."><canvas class="rw-rotation-point-board" data-rw-rotation-point-board aria-hidden="true"></canvas></div></div><div class="rw-rotation-readout"><span role="status">${escapeHTML(status)}</span>${session.config.picks.showDurability ? `<span>Pick ${durability}%</span>` : ""}<span>${Number.isFinite(session.picksRemaining) ? `${session.picksRemaining} picks` : "Unbreakable pick"}</span></div></section>`;
}

function createRotationDialogClass(DialogV2) {
  return class RegionwrightRotationLockDialog extends DialogV2 {
    constructor({ door, session, pointBoard, standalone = false }) {
      const state = createRuntimeState({ baseTier: session.config.difficulty.baseTier, effectiveLockTier: session.effectiveTier, targetAngle: session.targetAngle });
      super({ classes: ["regionwright", "rw-rotation-dialog"], window: { title: "Rotation Lock", icon: "fa-solid fa-lock", resizable: true, minimizable: false }, position: { width: 540, height: 465 }, content: lockMarkup(state, session), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] });
      this.door = door; this.session = session; this.pointBoard = pointBoard; this.standalone = standalone; this.lockState = state; this.resolving = false; this.frame = null; this.lastTimestamp = null; this.listenerHost = null; this.movementGuardRelease = null; this.pointArtRenderer = null;
      this.onPointerMove = event => this._setPointerAngle(event); this.onPointerDown = event => this._setPointerAngle(event); this.onKeyDown = event => this._keyDown(event); this.onKeyUp = event => this._keyUp(event); this.onVisibility = () => this._releaseTorque(); this.onWindowBlur = () => this._releaseTorque();
    }
    _onRender(context, options) { super._onRender(context, options); this._bind(); this._ensurePointArt(); this._startLoop(); rootFor(this)?.querySelector(".rw-rotation-lock")?.focus?.(); this.bringToFront?.(); }
    _bind() {
      const root = rootFor(this); if (!root || this.listenerHost === root) return; this.listenerHost = root;
      const lock = root.querySelector(".rw-skyrim-lock");
      lock?.addEventListener("pointermove", this.onPointerMove); lock?.addEventListener("pointerdown", this.onPointerDown); root.addEventListener("keydown", this.onKeyDown); root.addEventListener("keyup", this.onKeyUp); globalThis.document?.addEventListener?.("visibilitychange", this.onVisibility); globalThis.window?.addEventListener?.("blur", this.onWindowBlur); this.movementGuardRelease ??= acquirePuzzleMovementGuard({ onKeyDown: this.onKeyDown, onKeyUp: this.onKeyUp });
    }
    _ensurePointArt() { const canvas = rootFor(this)?.querySelector("[data-rw-rotation-point-board]"); if (!canvas) return; if (this.pointArtRenderer?.canvas !== canvas) { this.pointArtRenderer?.dispose(); this.pointArtRenderer = new RotationLockPointBoardRenderer(canvas, this.pointBoard); } this.pointArtRenderer.render(this.lockState); }
    _setPointerAngle(event) { if (this.lockState.torqueInput >= ENGINE_DEFAULTS.pickMovementTorqueLockout) return; const box = event.currentTarget.getBoundingClientRect(); const horizontal = clamp((event.clientX - box.left) / Math.max(1, box.width), 0, 1); setPickAngle(this.lockState, (horizontal * 180) - 90); this._renderDynamic(); rootFor(this)?.querySelector(".rw-rotation-lock")?.focus?.(); }
    _releaseTorque() { setTorque(this.lockState, 0); }
    _keyDown(event) { if (event.key === "a" || event.key === "A") { event.preventDefault(); setTorque(this.lockState, 1); } if (event.key === "Escape") void this.close(); }
    _keyUp(event) { if (event.key === "a" || event.key === "A") { event.preventDefault(); this._releaseTorque(); } }
    _startLoop() { if (this.frame !== null) return; this.frame = globalThis.requestAnimationFrame?.(time => this._loop(time)) ?? null; }
    async _loop(timestamp) { const delta = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000; this.lastTimestamp = timestamp; advanceLock(this.lockState, delta); this._renderDynamic(); if (this.lockState.lastEvent === "pickBroken") await this._onBreak(); if (this.lockState.lastEvent === "opened") await this._onOpened(); if (!this.resolving) this.frame = globalThis.requestAnimationFrame?.(time => this._loop(time)) ?? null; }
    _renderDynamic() { const root = rootFor(this); this._ensurePointArt(); const stage = root?.querySelector(".rw-rotation-stage"); stage?.classList.toggle("is-resisting", this.lockState.phase === LOCK_PHASES.BLOCKED); const fresh = lockMarkup(this.lockState, this.session); const readout = root?.querySelector(".rw-rotation-readout"); const next = new DOMParser().parseFromString(fresh, "text/html").querySelector(".rw-rotation-readout"); if (readout && next) readout.replaceWith(next); }
    async _onBreak() {
      this.lockState.lastEvent = null;
      this.session.picksRemaining -= 1;
      try {
        const result = this.standalone ? { accepted: true } : await requestGM("break", { doorUuid: this.door.uuid, sessionId: this.session.sessionId });
        if (result?.error) throw new Error(result.error);
        if (this.session.picksRemaining > 0 || !Number.isFinite(this.session.picksRemaining)) replaceBrokenPick(this.lockState);
        else { this.resolving = true; globalThis.ui?.notifications?.warn?.("No picks remain."); }
      } catch (error) {
        this.resolving = true;
        globalThis.ui?.notifications?.error?.(error.message ?? "The active GM could not record the broken pick.");
        await this.close();
      }
    }
    async _onOpened() {
      this.lockState.lastEvent = null;
      this.resolving = true;
      try {
        const result = this.standalone ? { success: true, message: "The cylinder turns and the lock opens." } : await requestGM("finish", { doorUuid: this.door.uuid, sessionId: this.session.sessionId });
        if (result?.success) {
          globalThis.ui?.notifications?.info?.("The Rotation Lock opens.");
          await this.close();
        } else {
          this.resolving = false;
          this.lockState.phase = LOCK_PHASES.IDLE;
          this.lockState.cylinderProgress = 0;
          globalThis.ui?.notifications?.warn?.(result?.message ?? "The lock could not be opened.");
          this._startLoop();
        }
      } catch (error) {
        this.resolving = false;
        this.lockState.phase = LOCK_PHASES.IDLE;
        this.lockState.cylinderProgress = 0;
        globalThis.ui?.notifications?.error?.(error.message ?? "The active GM could not unlock the Door.");
        this._startLoop();
      }
    }
    async close(options = {}) { this._releaseTorque(); if (this.frame !== null) globalThis.cancelAnimationFrame?.(this.frame); this.frame = null; globalThis.document?.removeEventListener?.("visibilitychange", this.onVisibility); globalThis.window?.removeEventListener?.("blur", this.onWindowBlur); const root = this.listenerHost; if (root) { root.removeEventListener("keydown", this.onKeyDown); root.removeEventListener("keyup", this.onKeyUp); } this.movementGuardRelease?.(); this.movementGuardRelease = null; this.pointArtRenderer?.dispose(); this.pointArtRenderer = null; openDialogs.delete(this.door?.uuid); if (this.session && !this.standalone && !this.resolving) globalThis.game?.socket?.emit?.(ROTATING_LOCK_SOCKET, { action: "release", doorUuid: this.door?.uuid, sessionId: this.session.sessionId, userId: globalThis.game?.user?.id }); return super.close(options); }
  };
}

export async function openRotatingLockPuzzle(doorOrUuid) {
  const door = await resolveDoor(doorOrUuid);
  if (!isConfiguredRotatingLockDoor(door)) return null;
  const existing = openDialogs.get(door.uuid); if (existing) { existing.bringToFront?.(); return existing; }
  const pointBoard = await loadRotationLockPointBoardData();
  const session = await requestGM("start", { doorUuid: door.uuid, tokenUuid: globalThis.canvas?.tokens?.controlled?.[0]?.document?.uuid ?? null });
  if (session?.error) throw new Error(session.error);
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const Dialog = createRotationDialogClass(DialogV2); const dialog = new Dialog({ door, session, pointBoard }); openDialogs.set(door.uuid, dialog); dialog.render(true); return dialog;
}

export async function openStandaloneRotatingLockPuzzle({ seed = `${Date.now()}` } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const pointBoard = await loadRotationLockPointBoardData();
  const door = { uuid: `Regionwright.Standalone.RotationLock.${seed}`, name: "Standalone Rotation Lock", documentName: "Wall" };
  const config = createRotatingLockConfig({ baseTier: 2, seed, picks: 3 });
  const session = { sessionId: `standalone-${seed}`, doorUuid: door.uuid, config, targetAngle: targetFor(config, {}), effectiveTier: 2, proficiency: { rank: 0 }, picksRemaining: config.picks.startingCount };
  const dialog = new (createRotationDialogClass(DialogV2))({ door, session, pointBoard, standalone: true });
  await dialog.render({ force: true });
  return dialog;
}

function availableDoors() { return [...(globalThis.canvas?.scene?.walls?.values?.() ?? [])].filter(door => Number(door.door ?? 0) > 0).sort((first, second) => String(first.id ?? "").localeCompare(String(second.id ?? ""), undefined, { sensitivity: "base" })).map((door, index) => ({ door, label: String(door.name ?? "").trim() || `Door ${String.fromCharCode(65 + index)}` })); }
function highlightSetupDoor(uuid, active) { const wall = globalThis.canvas?.walls?.placeables?.find?.(placeable => placeable.document?.uuid === uuid); if (wall) wall.hover = active; }
function setupMarkup(state) { const entries = availableDoors().map(({ door, label }) => `<button type="button" class="rw-rotation-setup-door ${state.doorUuid === door.uuid ? "is-selected" : ""}" data-door="${escapeHTML(door.uuid)}"><i class="fa-solid fa-door-closed"></i> ${escapeHTML(label)}</button>`).join("") || "<p>No Doors are available on this Scene.</p>"; return `<section class="rw-rotation-setup"><p>Choose Door &amp; difficulty.</p><div class="rw-rotation-setup-doors">${entries}</div><div class="rw-rotation-tier-list">${DIFFICULTY_PROFILES.map((profile, index) => `<button type="button" class="${state.tier === index ? "is-selected" : ""}" data-tier="${index}">${profile.label}</button>`).join("")}</div><div class="rw-rotation-setup-actions"><button type="button" data-create="true" ${state.doorUuid ? "" : "disabled"}>Create Rotation Lock</button></div></section>`; }
function createSetupDialogClass(DialogV2) { return class RotationLockSetup extends DialogV2 { constructor({ builder = null } = {}) { super({ classes: ["regionwright", "rw-rotation-setup-dialog"], window: { title: "Add Rotation Lock", icon: "fa-solid fa-lock", resizable: true, minimizable: false }, position: { width: 430, height: 440 }, content: setupMarkup({ doorUuid: null, tier: 2 }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] }); this.builder = builder; this.setupState = { doorUuid: null, tier: 2 }; } _onRender(context, options) { super._onRender(context, options); const root = rootFor(this); root?.addEventListener("click", event => { const door = event.target.closest?.("[data-door]"); const tier = event.target.closest?.("[data-tier]"); const create = event.target.closest?.("[data-create]"); if (door) { if (this.setupState.doorUuid) highlightSetupDoor(this.setupState.doorUuid, false); this.setupState.doorUuid = door.dataset.door; highlightSetupDoor(this.setupState.doorUuid, true); this._refresh(); } if (tier) { this.setupState.tier = Number(tier.dataset.tier); this._refresh(); } if (create) void this._create(); }); root?.addEventListener("pointerover", event => { const door = event.target.closest?.("[data-door]"); if (door) highlightSetupDoor(door.dataset.door, true); }); root?.addEventListener("pointerout", event => { const door = event.target.closest?.("[data-door]"); if (door && door.dataset.door !== this.setupState.doorUuid) highlightSetupDoor(door.dataset.door, false); }); } _refresh() { const section = rootFor(this)?.querySelector(".rw-rotation-setup"); if (section) section.outerHTML = setupMarkup(this.setupState); } async _create() { try { await configureRotatingLockDoor({ door: this.setupState.doorUuid, baseTier: this.setupState.tier }); globalThis.ui?.notifications?.info?.("Rotation Lock added to the Door."); await this.close(); } catch (error) { globalThis.ui?.notifications?.error?.(error.message); } } async close(options = {}) { if (this.setupState.doorUuid) highlightSetupDoor(this.setupState.doorUuid, false); await this.builder?._restoreFromGuide?.(); return super.close(options); } }; }
export function openRotationLockSetup({ builder = null } = {}) { const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); void builder?._minimizeForGuide?.(); const dialog = new (createSetupDialogClass(DialogV2))({ builder }); dialog.render(true); return dialog; }

export function installRotatingLockDoorControl() {
  if (doorControlInstalled) return true; const Base = globalThis.CONFIG?.Canvas?.doorControlClass; if (!Base) return false;
  class RotationDoorControl extends Base { _onMouseDown(event) { const door = this.wall?.document; if (isConfiguredRotatingLockDoor(door) && globalThis.game?.user?.can?.("WALL_DOORS")) { event.stopPropagation(); void openRotatingLockPuzzle(door).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open Rotation Lock.")); return false; } return super._onMouseDown(event); } }
  globalThis.CONFIG.Canvas.doorControlClass = RotationDoorControl; doorControlInstalled = true; for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); } return true;
}

export function previewRotatingLock(config, actor = null) { const checked = validateRotatingLockConfig(config); const proficiency = lockSkillRank(actor); const tier = effectiveTier(checked.difficulty.baseTier, checked.difficulty.applyToolProficiency ? proficiency.rank : 0); return Object.freeze({ baseTier: checked.difficulty.baseTier, effectiveTier: tier, profile: clone(DIFFICULTY_PROFILES[tier]), proficiency }); }

