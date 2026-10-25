import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";

export const LOCKPICK_FLAG = "lockpicking";
export const LOCKPICK_VERSION = 3;
export const LOCKPICK_SOCKET = `module.${MODULE_ID}`;

// The current presets follow the same one-through-five tumbler progression as
// the classic pin-tumbler minigame that inspired this feature.  Version 1
// locks remain readable through LEGACY_LOCKPICK_DIFFICULTIES below.
export const LOCKPICK_DIFFICULTIES = Object.freeze({
  veryEasy: Object.freeze({ label: "Very Easy", pins: 1, positions: 2, hint: "One tumbler." }),
  easy: Object.freeze({ label: "Easy", pins: 2, positions: 2, hint: "Two tumblers." }),
  average: Object.freeze({ label: "Average", pins: 3, positions: 3, hint: "Three tumblers." }),
  hard: Object.freeze({ label: "Hard", pins: 4, positions: 4, hint: "Four tumblers." }),
  veryHard: Object.freeze({ label: "Very Hard", pins: 5, positions: 5, hint: "Five tumblers." })
});

const LEGACY_LOCKPICK_DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ label: "Easy", pins: 3, positions: 3 }),
  standard: Object.freeze({ label: "Standard", pins: 4, positions: 4 }),
  hard: Object.freeze({ label: "Hard", pins: 5, positions: 5 })
});

function clone(value) {
  return structuredClone(value);
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sequence(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function doorStates() {
  return globalThis.CONST?.WALL_DOOR_STATES ?? { CLOSED: 0, OPEN: 1, LOCKED: 2 };
}

function readConfig(door) {
  return door?.getFlag?.(PUZZLE_FLAG_SCOPE, LOCKPICK_FLAG) ?? door?.flags?.[PUZZLE_FLAG_SCOPE]?.[LOCKPICK_FLAG] ?? null;
}

function activeGM() {
  const gm = globalThis.game?.users?.activeGM;
  return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id));
}

function dialogRoot(dialog) {
  return dialog?.element?.[0] ?? dialog?.element ?? null;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configError(config) {
  if (!config || typeof config !== "object") return "This door has no Regionwright lock.";
  const difficulty = lockpickDifficulty(config);
  if (!difficulty || ![1, 2, LOCKPICK_VERSION].includes(config.version)) return "This door's lock configuration is unsupported.";
  if (!Array.isArray(config.targets) || config.targets.length !== difficulty.pins) return "This door's lock pins are invalid.";
  if (config.targets.some(value => !Number.isInteger(value) || value < 0 || value >= difficulty.positions)) return "This door's lock pins are invalid.";
  if (!Number.isInteger(config.tension) || config.tension < 0 || config.tension >= difficulty.positions) return "This door's tension setting is invalid.";
  return null;
}

function lockpickDifficulty(config) {
  return config?.version === 1
    ? LEGACY_LOCKPICK_DIFFICULTIES[config.difficulty]
    : LOCKPICK_DIFFICULTIES[config?.difficulty];
}

function pinHeight(config, index) {
  const preset = lockpickDifficulty(config);
  const target = Number(config?.targets?.[index] ?? 0);
  const ratio = preset?.positions <= 1 ? 0.5 : target / ((preset?.positions ?? 2) - 1);
  return 0.18 + (ratio * 0.66);
}

export function createLockpickConfig({ difficulty = "average", seed = `${Date.now()}-${Math.random()}` } = {}) {
  const preset = LOCKPICK_DIFFICULTIES[difficulty];
  if (!preset) throw new Error("Choose a lock difficulty.");
  const random = sequence(seed);
  const targets = Array.from({ length: preset.pins }, (_unused, index) => index);
  for (let index = targets.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [targets[index], targets[next]] = [targets[next], targets[index]];
  }
  return Object.freeze({
    version: LOCKPICK_VERSION,
    difficulty,
    targets,
    tension: Math.floor(random() * preset.positions)
  });
}

export function validateLockpickConfig(config) {
  const error = configError(config);
  if (error) throw new Error(error);
  return clone(config);
}

export function evaluateLockpickAttempt(config, { picks = [], tension = 0 } = {}) {
  const lock = validateLockpickConfig(config);
  const preset = lockpickDifficulty(lock);
  const normalizedPicks = Array.from({ length: preset.pins }, (_unused, index) => Number(picks[index] ?? -1));
  const normalizedTension = Number(tension);
  const pinsSet = normalizedPicks.reduce((count, value, index) => count + (Number.isInteger(value) && value === lock.targets[index] ? 1 : 0), 0);
  const tensionCorrect = Number.isInteger(normalizedTension) && normalizedTension === lock.tension;
  const tensionHint = normalizedTension < lock.tension ? "Tension is too loose." : normalizedTension > lock.tension ? "Tension is too tight." : "Tension holds.";
  const success = pinsSet === preset.pins && tensionCorrect;
  return {
    success,
    pinsSet,
    pinsTotal: preset.pins,
    tensionCorrect,
    message: success ? "The lock clicks open." : `${pinsSet} of ${preset.pins} pins set. ${tensionHint}`
  };
}

export function isLockpickDoor(door) {
  return Boolean(door?.documentName === "Wall" && Number(door.door ?? 0) > 0 && !configError(readConfig(door)));
}

export function isConfiguredLockedDoor(door) {
  return isLockpickDoor(door) && Number(door.ds) === doorStates().LOCKED;
}

/**
 * A configured locked Door uses the lockpicking interaction even when the
 * current user lacks Foundry's native Open and Close Doors permission. The
 * eventual state change is still authorized and performed by the active GM.
 */
export function lockpickDoorInteraction(door) {
  return isConfiguredLockedDoor(door) ? "puzzle" : "native";
}

async function resolveDoor(doorOrUuid) {
  if (typeof doorOrUuid === "object" && doorOrUuid) return doorOrUuid;
  const uuid = String(doorOrUuid ?? "").trim();
  if (!uuid) throw new Error("Choose a Door first.");
  const resolved = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  if (!resolved || resolved.documentName !== "Wall" || Number(resolved.door ?? 0) <= 0) throw new Error("The selected document is not a Door.");
  return resolved;
}

function requirePuzzleWriteAccess() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a lockpicking puzzle.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) {
    throw new Error("Enable Regionwright Puzzle writes in Configure Settings before creating a lock.");
  }
}

export async function configureLockpickDoor({ door: doorOrUuid, difficulty = "average", seed } = {}) {
  requirePuzzleWriteAccess();
  const door = await resolveDoor(doorOrUuid);
  const config = createLockpickConfig({ difficulty, seed });
  await door.update({
    ds: doorStates().LOCKED,
    [`flags.${PUZZLE_FLAG_SCOPE}.${LOCKPICK_FLAG}`]: config
  });
  return { door, config };
}

export async function clearLockpickDoor(doorOrUuid) {
  requirePuzzleWriteAccess();
  const door = await resolveDoor(doorOrUuid);
  await door.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${LOCKPICK_FLAG}`]: null });
  return door;
}

async function resolveLockpickAttempt({ doorUuid, picks, tension, userId }) {
  if (!activeGM()) return null;
  const door = await resolveDoor(doorUuid);
  if (!isConfiguredLockedDoor(door)) return { success: false, message: "That lock is no longer available." };
  const result = evaluateLockpickAttempt(readConfig(door), { picks, tension });
  if (result.success) await door.update({ ds: doorStates().CLOSED });
  return { ...result, doorUuid: door.uuid, userId };
}

const openDialogs = new Map();
const pendingAttempts = new Map();

function requestId() {
  return globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sendResult(recipientId, result, requestIdValue = null) {
  globalThis.game?.socket?.emit?.(LOCKPICK_SOCKET, { action: "result", recipientId, requestId: requestIdValue, result });
}

async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "attempt" && activeGM()) {
    try {
      const userId = payload.userId ?? senderId;
      const result = await resolveLockpickAttempt({ ...payload, userId });
      if (result) sendResult(userId, result, payload.requestId);
    } catch (error) {
      sendResult(payload.userId ?? senderId, { success: false, doorUuid: payload.doorUuid, message: error.message }, payload.requestId);
    }
    return;
  }
  if (payload.action === "result" && payload.recipientId === globalThis.game?.user?.id) {
    const pending = pendingAttempts.get(payload.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingAttempts.delete(payload.requestId);
    }
    openDialogs.get(payload.result?.doorUuid)?.applyResult(payload.result);
  }
}

let socketInstalled = false;
export function installLockpickSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(LOCKPICK_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
}

export async function requestLockpickAttempt({ doorUuid, picks, tension } = {}) {
  if (!doorUuid) throw new Error("Choose a Door first.");
  const door = await resolveDoor(doorUuid);
  const result = evaluateLockpickAttempt(readConfig(door), { picks, tension });
  if (!result.success) return result;

  // Players cannot update Wall documents through Foundry's normal door
  // permission. Route their successful attempt straight to the active GM so
  // the GM performs the authoritative state change on the server.
  if (!activeGM()) {
    if (!globalThis.game?.users?.activeGM) return { success: false, message: "A GM must be connected to unlock this door." };
    const requestIdValue = requestId();
    const timeout = globalThis.setTimeout?.(() => {
      const pending = pendingAttempts.get(requestIdValue);
      if (!pending) return;
      pendingAttempts.delete(requestIdValue);
      openDialogs.get(door.uuid)?.applyResult({ success: false, doorUuid: door.uuid, message: "The active GM did not respond. The Door remains locked." });
    }, 8000);
    pendingAttempts.set(requestIdValue, { doorUuid: door.uuid, timeout });
    globalThis.game?.socket?.emit?.(LOCKPICK_SOCKET, {
      action: "attempt",
      requestId: requestIdValue,
      doorUuid,
      picks,
      tension,
      userId: globalThis.game?.user?.id
    });
    return { pending: true, requestId: requestIdValue };
  }

  try {
    await door.update({ ds: doorStates().CLOSED });
    return result;
  } catch (_error) {
    // If this GM client is not the active GM, let the active GM do it.
    if (!globalThis.game?.users?.activeGM) return { success: false, message: "A GM must be connected to unlock this door." };
  }
  const requestIdValue = requestId();
  const timeout = globalThis.setTimeout?.(() => {
    const pending = pendingAttempts.get(requestIdValue);
    if (!pending) return;
    pendingAttempts.delete(requestIdValue);
    openDialogs.get(door.uuid)?.applyResult({ success: false, doorUuid: door.uuid, message: "The active GM did not respond. The Door remains locked." });
  }, 8000);
  pendingAttempts.set(requestIdValue, { doorUuid: door.uuid, timeout });
  globalThis.game?.socket?.emit?.(LOCKPICK_SOCKET, {
    action: "attempt",
    requestId: requestIdValue,
    doorUuid,
    picks,
    tension,
    userId: globalThis.game?.user?.id
  });
  return { pending: true };
}

function puzzleMarkup(state) {
  const preset = lockpickDifficulty(state.config);
  const selectedIndex = state.selectedIndex ?? 0;
  const liftLevels = state.liftLevels ?? Array(preset.pins).fill(0);
  const tumblers = state.picks.map((value, index) => {
    const set = value >= 0;
    const selected = index === selectedIndex;
    const height = set ? pinHeight(state.config, index) : liftLevels[index];
    const ready = state.hold?.index === index && state.tensionReady;
    return `<button type="button" class="rw-lockpick-tumbler-button ${set ? "is-set" : ""} ${selected ? "is-selected" : ""} ${ready ? "is-ready" : ""}" data-rw-lockpick="lift" data-pin-index="${index}" aria-pressed="${selected}" aria-label="Tumbler ${index + 1}${set ? ": set" : selected ? ": selected" : ""}"><span class="rw-lockpick-ruler" aria-hidden="true"></span><span class="rw-lockpick-track"><span class="rw-lockpick-spring" aria-hidden="true"></span><span class="rw-lockpick-tumbler" style="bottom: ${21 + (height * 38)}%" aria-hidden="true"><span></span></span></span></button>`;
  }).join("");
  const selectedSet = state.picks[selectedIndex] >= 0;
  const pickWidth = 15 + ((selectedIndex + 0.5) * (70 / preset.pins));
  const feedback = state.feedback ? `<p class="rw-lockpick-feedback ${state.success ? "is-success" : ""}" role="status">${escapeHTML(state.feedback)}</p>` : `<p class="rw-lockpick-feedback" role="status"></p>`;
  return `<section class="rw-lockpick-content" style="--rw-tumbler-count: ${preset.pins}; --rw-pick-width: ${pickWidth}%"><p class="rw-lockpick-prompt">Move pick. Hold tumbler.</p><div class="rw-lockpick-mechanism" role="group" aria-label="Lock tumblers"><div class="rw-lockpick-top-plate" aria-hidden="true"></div><div class="rw-lockpick-tumblers">${tumblers}</div><div class="rw-lockpick-barrel" aria-hidden="true"><span></span></div><div class="rw-lockpick-pick" aria-hidden="true"><span></span></div></div><div class="rw-lockpick-controls"><span>Tumbler ${selectedIndex + 1}${selectedSet ? " set" : ""}</span></div>${feedback}<p class="rw-lockpick-progress" aria-live="polite">${state.picks.filter(value => value >= 0).length} of ${preset.pins} set${state.brokenPicks ? ` · ${state.brokenPicks} pick${state.brokenPicks === 1 ? "" : "s"} broken` : ""}</p></section>`;
}

function createLockpickDialogClass(DialogV2) {
  return class RegionwrightLockpickDialog extends DialogV2 {
    constructor({ door, config, standalone = false }) {
      const preset = lockpickDifficulty(config);
      super({
        classes: ["regionwright", "rw-lockpick-dialog"],
        window: { title: "Pick Lock", icon: "fa-solid fa-key", resizable: true, minimizable: false },
        position: { width: 500, height: 560 },
        content: puzzleMarkup({ config, picks: Array(preset.pins).fill(-1), tension: config.tension }),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark", default: true }]
      });
      this.door = door;
      this.config = config;
      this.standalone = standalone;
      this.picks = Array(preset.pins).fill(-1);
      this.selectedIndex = 0;
      this.tension = config.tension;
      this.feedback = "";
      this.success = false;
      this.attempting = false;
      this.brokenPicks = 0;
      this.liftLevels = Array(preset.pins).fill(0);
      this.hold = null;
      this.tensionReady = false;
      this._animationFrame = null;
      this._listenerHost = null;
      this._movementGuardRelease = null;
      this._clickHandler = event => { void this._handlePuzzleClick(event); };
      this._keyHandler = event => { void this._handlePuzzleKeydown(event); };
      this._pointerDownHandler = event => this._handlePuzzlePointerDown(event);
      this._pointerMoveHandler = event => { void this._handlePuzzlePointerMove(event); };
      this._pointerUpHandler = event => { void this._handlePuzzlePointerUp(event); };
      this._pointerCancelHandler = event => this._handlePuzzlePointerCancel(event);
    }

    activateListeners(element) {
      this._bind(dialogRoot(this) ?? (element?.[0] ?? element));
    }

    _onRender(context, options) {
      super._onRender(context, options);
      this._bind(dialogRoot(this));
      this.bringToFront?.();
    }

    _bind(root) {
      if (!root || this._listenerHost === root) return;
      this._listenerHost?.removeEventListener("click", this._clickHandler, true);
      this._listenerHost?.removeEventListener("keydown", this._keyHandler, true);
      this._listenerHost?.removeEventListener("pointerdown", this._pointerDownHandler, true);
      this._listenerHost?.removeEventListener("pointermove", this._pointerMoveHandler, true);
      this._listenerHost?.removeEventListener("pointerup", this._pointerUpHandler, true);
      this._listenerHost?.removeEventListener("pointercancel", this._pointerCancelHandler, true);
      root.addEventListener("click", this._clickHandler, true);
      root.addEventListener("keydown", this._keyHandler, true);
      root.addEventListener("pointerdown", this._pointerDownHandler, true);
      root.addEventListener("pointermove", this._pointerMoveHandler, true);
      root.addEventListener("pointerup", this._pointerUpHandler, true);
      root.addEventListener("pointercancel", this._pointerCancelHandler, true);
      this._listenerHost = root;
      this._movementGuardRelease ??= acquirePuzzleMovementGuard();
    }

    _refresh() {
      const content = dialogRoot(this)?.querySelector?.(".rw-lockpick-content");
      if (content) content.outerHTML = puzzleMarkup(this);
    }

    targetHeight(index) {
      return pinHeight(this.config, index);
    }

    _playTensionClick() {
      try {
        const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
        if (!AudioContext) return;
        const context = this._audioContext ??= new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(760, context.currentTime);
        gain.gain.setValueAtTime(0.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.045);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.05);
      } catch (_error) {
        // Sound is an optional cue; the visible click state always remains.
      }
    }

    _movePickTo(index, { refresh = false } = {}) {
      if (this.attempting || this.picks[index] >= 0) return;
      this.selectedIndex = Math.max(0, Math.min(this.picks.length - 1, index));
      if (refresh) return this._refresh();
      const root = dialogRoot(this);
      const content = root?.querySelector?.(".rw-lockpick-content");
      const preset = lockpickDifficulty(this.config);
      if (content) content.style.setProperty("--rw-pick-width", `${15 + ((this.selectedIndex + 0.5) * (70 / preset.pins))}%`);
      root?.querySelectorAll?.(".rw-lockpick-tumbler-button").forEach(button => {
        button.classList.toggle("is-selected", Number(button.dataset.pinIndex) === this.selectedIndex);
      });
    }

    _setTumblerVisual(index, height) {
      const root = dialogRoot(this);
      const tumbler = root?.querySelector?.(`.rw-lockpick-tumbler-button[data-pin-index="${index}"] .rw-lockpick-tumbler`);
      if (tumbler) tumbler.style.bottom = `${21 + (height * 38)}%`;
      const pick = root?.querySelector?.(".rw-lockpick-pick");
      if (pick) pick.style.bottom = "2rem";
    }

    _updateHold(now) {
      if (!this.hold) return;
      const { index, startedAt } = this.hold;
      const height = Math.min(1, (now - startedAt) / 1100);
      const target = this.targetHeight(index);
      this.liftLevels[index] = height;
      const ready = Math.abs(height - target) <= 0.035;
      if (ready && !this.tensionReady) this._playTensionClick();
      this.tensionReady = ready;
      this.feedback = ready ? "The tumbler trembles." : "";
      this._setTumblerVisual(index, height);
      const root = dialogRoot(this);
      root?.querySelector?.(`.rw-lockpick-tumbler-button[data-pin-index="${index}"]`)?.classList.toggle("is-ready", ready);
      const feedback = root?.querySelector?.(".rw-lockpick-feedback");
      if (feedback) feedback.textContent = this.feedback;
      if (height > target + 0.10) return this._breakPick();
      this._animationFrame = globalThis.requestAnimationFrame?.(timestamp => this._updateHold(timestamp)) ?? null;
    }

    _startHold(index) {
      if (this.attempting || this.hold || this.picks[index] >= 0) return;
      this._movePickTo(index);
      this.hold = { index, startedAt: globalThis.performance?.now?.() ?? Date.now() };
      this.tensionReady = false;
      this.feedback = "";
      dialogRoot(this)?.querySelector?.(".rw-lockpick-content")?.classList.add("is-pressing");
      this._animationFrame = globalThis.requestAnimationFrame?.(timestamp => this._updateHold(timestamp)) ?? null;
    }

    async _releaseTumbler() {
      if (!this.hold) return;
      const { index } = this.hold;
      this.hold = null;
      this.tensionReady = false;
      if (this._animationFrame !== null) globalThis.cancelAnimationFrame?.(this._animationFrame);
      this._animationFrame = null;
      dialogRoot(this)?.querySelector?.(".rw-lockpick-content")?.classList.remove("is-pressing");
      if (Math.abs(this.liftLevels[index] - this.targetHeight(index)) > 0.035) {
        this.liftLevels[index] = 0;
        this.feedback = "The tumbler slips back.";
        return this._refresh();
      }
      this.picks[index] = this.config.targets[index];
      this.liftLevels[index] = this.targetHeight(index);
      this._playTensionClick();
      this.feedback = "Click. Tumbler set.";
      const next = this.picks.findIndex(value => value < 0);
      if (next >= 0) this.selectedIndex = next;
      this._refresh();
      if (!this.picks.every(value => value >= 0)) return;
      this.attempting = true;
      const result = this.standalone
        ? { success: true, message: "The tumbler lock clicks open." }
        : await requestLockpickAttempt({ doorUuid: this.door.uuid, picks: this.picks, tension: this.tension });
      if (result?.pending) {
        this.feedback = "Checking the lock...";
        this._refresh();
      } else this.applyResult(result);
    }

    async _raiseTumbler(index, height) {
      if (this.attempting || this.picks[index] >= 0) return;
      const target = this.targetHeight(index);
      const nextHeight = Math.max(0, Math.min(1, height));
      if (nextHeight > target + 0.10) return this._breakPick();
      this.liftLevels[index] = nextHeight;
      const distance = Math.abs(nextHeight - target);
      this.feedback = distance <= 0.025 ? "Tension is hot." : distance <= 0.075 ? "Tension is warm." : "Tension is cold.";
      const tumbler = dialogRoot(this)?.querySelector?.(`.rw-lockpick-tumbler-button[data-pin-index="${index}"] .rw-lockpick-tumbler`);
      if (tumbler) tumbler.style.bottom = `${8 + (nextHeight * 68)}%`;
      const pick = dialogRoot(this)?.querySelector?.(".rw-lockpick-pick");
      if (pick) pick.style.bottom = `${13 + (nextHeight * 58)}%`;
      const feedback = dialogRoot(this)?.querySelector?.(".rw-lockpick-feedback");
      if (feedback) feedback.textContent = this.feedback;
      return;
      this.picks[index] = this.config.targets[index];
      this.liftLevels[index] = target;
      this.drag = null;
      this.feedback = "Click — tumbler set.";
      const next = this.picks.findIndex(value => value < 0);
      if (next >= 0) this.selectedIndex = next;
      this._refresh();
      if (!this.picks.every(value => value >= 0)) return;
      this.attempting = true;
      const result = this.standalone
        ? { success: true, message: "The tumbler lock clicks open." }
        : await requestLockpickAttempt({ doorUuid: this.door.uuid, picks: this.picks, tension: this.tension });
      if (result?.pending) {
        this.feedback = "Checking the lock...";
        this._refresh();
      } else this.applyResult(result);
    }

    async _lockTumbler(index) {
      const target = this.targetHeight(index);
      if (Math.abs(this.liftLevels[index] - target) > 0.018) {
        this.liftLevels[index] = 0;
        this.feedback = "The tension slips. Try again.";
        return this._refresh();
      }
      this.picks[index] = this.config.targets[index];
      this.liftLevels[index] = target;
      this._playTensionClick();
      this.feedback = "Click. Tumbler set.";
      const next = this.picks.findIndex(value => value < 0);
      if (next >= 0) this.selectedIndex = next;
      this._refresh();
      if (!this.picks.every(value => value >= 0)) return;
      this.attempting = true;
      const result = this.standalone
        ? { success: true, message: "The tumbler lock clicks open." }
        : await requestLockpickAttempt({ doorUuid: this.door.uuid, picks: this.picks, tension: this.tension });
      if (result?.pending) {
        this.feedback = "Checking the lock...";
        this._refresh();
      } else this.applyResult(result);
    }

    _handlePuzzlePointerDown(event) {
      if (event.button !== 0) return;
      const button = event.target?.closest?.(".rw-lockpick-tumbler-button");
      if (!button) return;
      event.preventDefault();
      const index = Number(button.dataset.pinIndex);
      this._movePickTo(index);
      if (this.picks[index] >= 0) return;
      button.setPointerCapture?.(event.pointerId);
      this._startHold(index);
    }

    _handlePuzzlePointerMove(event) {
      const button = event.target?.closest?.(".rw-lockpick-tumbler-button");
      if (!this.hold) {
        if (button) this._movePickTo(Number(button.dataset.pinIndex));
      }
    }

    async _handlePuzzlePointerUp() {
      await this._releaseTumbler();
    }

    _handlePuzzlePointerCancel() {
      if (!this.hold) return;
      this.hold = null;
      this.tensionReady = false;
      if (this._animationFrame !== null) globalThis.cancelAnimationFrame?.(this._animationFrame);
      this._animationFrame = null;
      this.liftLevels[this.selectedIndex] = 0;
      this.feedback = "The tumbler slips back.";
      this._refresh();
    }

    _startTumblerMotion() {
      if (this._animationFrame !== null || !globalThis.requestAnimationFrame) return;
      this._animationFrame = globalThis.requestAnimationFrame(this._animate);
    }

    _motionHeight(now) {
      if (!this.motion) return 0;
      const elapsed = now - this.motion.startedAt;
      if (elapsed <= this.motion.rise) return Math.min(1, elapsed / this.motion.rise);
      if (elapsed <= this.motion.rise + this.motion.dwell) return 1;
      const falling = (elapsed - this.motion.rise - this.motion.dwell) / this.motion.fall;
      return Math.max(0, 1 - falling);
    }

    _updateTumblerMotion(now) {
      const root = dialogRoot(this);
      if (!root) return;
      const height = this._motionHeight(now);
      const activeIndex = this.motion?.index;
      root.querySelectorAll(".rw-lockpick-tumbler-button").forEach(button => {
        const index = Number(button.dataset.pinIndex);
        const set = this.picks[index] >= 0;
        const tumblerHeight = set ? 1 : index === activeIndex ? height : 0;
        const tumbler = button.querySelector(".rw-lockpick-tumbler");
        if (tumbler) tumbler.style.bottom = `${8 + (tumblerHeight * 68)}%`;
        button.classList.toggle("is-ready", !set && index === activeIndex && this.motion?.safe && tumblerHeight >= 0.98);
        button.classList.toggle("is-set", set);
      });
      if (this.motion && height <= 0) {
        this.motion = null;
        this.feedback = "Try the tumbler again.";
        this._refresh();
      }
    }

    _selectTumbler(index) {
      if (this.attempting || this.motion || this.picks[index] >= 0) return;
      this.selectedIndex = Math.max(0, Math.min(this.picks.length - 1, index));
      this.feedback = "";
      this._refresh();
    }

    _liftTumbler() {
      if (this.attempting || this.motion || this.picks[this.selectedIndex] >= 0) return;
      const pins = lockpickDifficulty(this.config).pins;
      const safe = this.random() > (0.40 + ((pins - 1) * 0.075));
      this.motion = {
        index: this.selectedIndex,
        startedAt: globalThis.performance?.now?.() ?? Date.now(),
        rise: 400 + Math.floor(this.random() * 180),
        dwell: safe ? 160 + Math.floor(this.random() * 150) : 25 + Math.floor(this.random() * 40),
        fall: safe ? 560 + Math.floor(this.random() * 260) : 120 + Math.floor(this.random() * 100),
        safe
      };
      this.feedback = "";
      this._refresh();
      this._startTumblerMotion();
    }

    _canSet(now) {
      if (!this.motion || !this.motion.safe) return false;
      const elapsed = now - this.motion.startedAt;
      return elapsed >= this.motion.rise
        && elapsed <= this.motion.rise + this.motion.dwell + (this.motion.fall * 0.18)
        && this._motionHeight(now) >= 0.94;
    }

    _breakPick() {
      this.brokenPicks += 1;
      this.picks.fill(-1);
      this.liftLevels.fill(0);
      this.hold = null;
      this.tensionReady = false;
      if (this._animationFrame !== null) globalThis.cancelAnimationFrame?.(this._animationFrame);
      this._animationFrame = null;
      this.feedback = "The pick snaps. The tumblers fall.";
      this._refresh();
    }

    async _setTumbler() {
      if (this.attempting) return;
      if (!this.motion) {
        this.feedback = "Lift the selected tumbler first.";
        this._refresh();
        return;
      }
      const now = globalThis.performance?.now?.() ?? Date.now();
      if (!this._canSet(now)) return this._breakPick();
      const index = this.motion.index;
      this.picks[index] = this.config.targets[index];
      this.motion = null;
      this.feedback = "Tumbler set.";
      const next = this.picks.findIndex(value => value < 0);
      if (next >= 0) this.selectedIndex = next;
      this._refresh();
      if (!this.picks.every(value => value >= 0)) return;
      this.attempting = true;
      const result = this.standalone
        ? { success: true, message: "The tumbler lock clicks open." }
        : await requestLockpickAttempt({ doorUuid: this.door.uuid, picks: this.picks, tension: this.tension });
      if (result?.pending) {
        this.feedback = "Checking the lock…";
        this._refresh();
      } else this.applyResult(result);
    }

    async _handlePuzzleClick(event) {
      const action = event.target?.closest?.("[data-rw-lockpick]");
      if (!action) return;
      event.preventDefault();
      if (action.dataset.rwLockpick === "lift") return;
    }

    async _handlePuzzleKeydown(event) {
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target?.tagName)) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const change = event.key === "ArrowLeft" ? -1 : 1;
        this._movePickTo((this.selectedIndex + change + this.picks.length) % this.picks.length, { refresh: true });
      }
    }

    applyResult(result) {
      if (!result) return;
      this.success = result.success === true;
      this.attempting = false;
      this.feedback = result.message ?? "The lock does not respond.";
      if (this.success) {
        globalThis.ui?.notifications?.info?.("Lock picked. The door is unlocked.");
        void this.close();
        return;
      }
      this._refresh();
    }

    async close(options = {}) {
      this._listenerHost?.removeEventListener("click", this._clickHandler, true);
      this._listenerHost?.removeEventListener("keydown", this._keyHandler, true);
      this._listenerHost?.removeEventListener("pointerdown", this._pointerDownHandler, true);
      this._listenerHost?.removeEventListener("pointermove", this._pointerMoveHandler, true);
      this._listenerHost?.removeEventListener("pointerup", this._pointerUpHandler, true);
      this._listenerHost?.removeEventListener("pointercancel", this._pointerCancelHandler, true);
      this._movementGuardRelease?.();
      this._movementGuardRelease = null;
      if (this._animationFrame !== null) globalThis.cancelAnimationFrame?.(this._animationFrame);
      this._animationFrame = null;
      openDialogs.delete(this.door?.uuid);
      return super.close(options);
    }
  };
}

export async function openLockpickPuzzle(doorOrUuid) {
  const door = await resolveDoor(doorOrUuid);
  if (!isConfiguredLockedDoor(door)) return null;
  const existing = openDialogs.get(door.uuid);
  if (existing) {
    existing.bringToFront?.();
    return existing;
  }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const DialogClass = createLockpickDialogClass(DialogV2);
  const dialog = new DialogClass({ door, config: validateLockpickConfig(readConfig(door)) });
  openDialogs.set(door.uuid, dialog);
  dialog.render(true);
  return dialog;
}

export async function openStandaloneLockpickPuzzle({ seed = `${Date.now()}` } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const door = { uuid: `Regionwright.Standalone.TumblerLock.${seed}`, name: "Standalone Tumbler Lock", documentName: "Wall" };
  const config = createLockpickConfig({ difficulty: "average", seed });
  const dialog = new (createLockpickDialogClass(DialogV2))({ door, config, standalone: true });
  await dialog.render({ force: true });
  return dialog;
}

let doorControlInstalled = false;
export function installLockpickDoorControl() {
  if (doorControlInstalled) return true;
  const BaseDoorControl = globalThis.CONFIG?.Canvas?.doorControlClass;
  if (!BaseDoorControl) return false;
  class RegionwrightDoorControl extends BaseDoorControl {
    _onMouseDown(event) {
      const door = this.wall?.document;
      if (lockpickDoorInteraction(door) === "puzzle") {
        event.stopPropagation();
        void openLockpickPuzzle(door).catch(error => {
          const message = (error instanceof Error ? error.message : String(error ?? "")) || "Unable to open the lockpicking puzzle.";
          console.error(`${MODULE_ID} | Unable to open lockpicking puzzle.`, error);
          globalThis.ui?.notifications?.error?.(message);
        });
        return false;
      }
      return super._onMouseDown(event);
    }
  }
  globalThis.CONFIG.Canvas.doorControlClass = RegionwrightDoorControl;
  doorControlInstalled = true;
  for (const wall of globalThis.canvas?.walls?.placeables ?? []) {
    wall.clearDoorControl?.();
    wall.createDoorControl?.();
  }
  return true;
}


