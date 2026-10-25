import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import { TIMING_DIAL_VERSION, TIMING_DIFFICULTIES, createTimingDialConfig, isTimingHit, timingPresentation, validateTimingDialConfig } from "./timing-dial-engine.js";

export const TIMING_DIAL_FLAG = "timingDial";
export const TIMING_DIAL_SOCKET = `module.${MODULE_ID}`;

const openDialogs = new Map();
const waitingFinishRequests = new Map();
const remoteTimingData = new Map();
let socketInstalled = false;
let doorControlInstalled = false;

const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const rootFor = application => application?.element?.[0] ?? application?.element ?? null;
const clone = value => structuredClone(value);

function doorStates() { return globalThis.CONST?.WALL_DOOR_STATES ?? { CLOSED: 0, OPEN: 1, LOCKED: 2 }; }
function activeGM() {
  const gm = globalThis.game?.users?.activeGM;
  return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id));
}
function requireGMWrite() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a Timing Dial.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) throw new Error("Enable Regionwright Puzzle writes before creating a Timing Dial.");
}
async function resolveDoor(doorOrUuid) {
  if (doorOrUuid?.documentName === "Wall") return doorOrUuid;
  const uuid = String(doorOrUuid ?? "").trim();
  if (!uuid) throw new Error("Choose a Door first.");
  const door = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  if (!door || door.documentName !== "Wall" || Number(door.door ?? 0) <= 0) throw new Error("The selected document is not a Door.");
  return door;
}
function timingData(door) { return door?.getFlag?.(PUZZLE_FLAG_SCOPE, TIMING_DIAL_FLAG) ?? door?.flags?.[PUZZLE_FLAG_SCOPE]?.[TIMING_DIAL_FLAG] ?? remoteTimingData.get(door?.uuid) ?? null; }
function normalizeTiming(data) {
  if (!data || typeof data !== "object" || Number(data.version) !== TIMING_DIAL_VERSION || !data.config || !data.persistent) return null;
  try { return { version: TIMING_DIAL_VERSION, config: validateTimingDialConfig(data.config), persistent: clone(data.persistent) }; } catch (_error) { return null; }
}

async function notifyBossPuzzleComplete(door) {
  const boss = globalThis.game?.modules?.get?.("regionwright")?.api?.boss;
  if (boss?.completePuzzle) await boss.completePuzzle({ kind: "timingDial", doorUuid: door.uuid });
}

export function createTimingDialPuzzleConfig({ difficulties = [1], seed = randomId() } = {}) { return createTimingDialConfig({ difficulties, seed }); }
export function isTimingDialDoor(door) { return Boolean(normalizeTiming(timingData(door))); }
export function isConfiguredTimingDialDoor(door) {
  const remote = remoteTimingData.has(door?.uuid);
  return isTimingDialDoor(door) && (Number(door.ds) === doorStates().LOCKED || (!globalThis.game?.user?.isGM && remote)) && normalizeTiming(timingData(door))?.persistent?.status === "locked";
}

export async function configureTimingDialDoor({ door: doorOrUuid, difficulties = [1], seed } = {}) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  const config = createTimingDialPuzzleConfig({ difficulties, seed });
  const persistent = { status: "locked", solvedAt: null, lastUpdatedAt: Date.now() };
  const data = { version: TIMING_DIAL_VERSION, config, persistent };
  await door.update({ ds: doorStates().LOCKED, [`flags.${PUZZLE_FLAG_SCOPE}.${TIMING_DIAL_FLAG}`]: data });
  globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-config", doorUuid: door.uuid, data: clone(data) });
  return { door, config, persistent };
}

export async function clearTimingDialDoor(doorOrUuid) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  await door.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${TIMING_DIAL_FLAG}`]: null });
  return door;
}

async function finishTimingDial({ doorUuid, completedSteps } = {}) {
  const door = await resolveDoor(doorUuid);
  const data = normalizeTiming(timingData(door));
  if (!data || !isConfiguredTimingDialDoor(door)) return { success: false, message: "That Timing Dial is no longer available." };
  const required = data.config.steps.map(step => step.id);
  if (!Array.isArray(completedSteps) || completedSteps.length !== required.length || completedSteps.some((id, index) => id !== required[index])) return { success: false, message: "The timing sequence is incomplete." };
  data.persistent.status = "solved";
  data.persistent.solvedAt = Date.now();
  data.persistent.lastUpdatedAt = Date.now();
  await door.update({ ds: doorStates().CLOSED, [`flags.${PUZZLE_FLAG_SCOPE}.${TIMING_DIAL_FLAG}`]: data });
  await notifyBossPuzzleComplete(door);
  return { success: true, message: "The timing lock releases." };
}

async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "timing-dial-config" && (!payload.recipientId || payload.recipientId === globalThis.game?.user?.id)) {
    if (payload.doorUuid && normalizeTiming(payload.data)) remoteTimingData.set(payload.doorUuid, clone(payload.data));
    return;
  }
  if (payload.action === "timing-dial-request-config" && activeGM()) {
    const recipientId = payload.userId ?? senderId;
    for (const door of globalThis.canvas?.scene?.walls?.values?.() ?? []) {
      const data = normalizeTiming(timingData(door));
      if (data?.persistent?.status === "locked") globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-config", recipientId, doorUuid: door.uuid, data: clone(data) });
    }
    return;
  }
  if (payload.action === "timing-dial-result") {
    if (payload.result?.success && payload.doorUuid) remoteTimingData.delete(payload.doorUuid);
    const pending = waitingFinishRequests.get(payload.requestId);
    if (pending) { waitingFinishRequests.delete(payload.requestId); pending.resolve(payload.result); }
    return;
  }
  if (payload.action !== "timing-dial-finish" || !activeGM()) return;
  try {
    const result = await finishTimingDial({ doorUuid: payload.doorUuid, completedSteps: payload.completedSteps });
    globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, doorUuid: payload.doorUuid, result });
  } catch (error) {
    globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, doorUuid: payload.doorUuid, result: { success: false, message: error.message ?? "The GM could not resolve the Timing Dial." } });
  }
}

export function installTimingDialSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(TIMING_DIAL_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
  if (!globalThis.game?.user?.isGM) setTimeout(() => globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-request-config", userId: globalThis.game?.user?.id }), 0);
}

function requestFinish(doorUuid, completedSteps) {
  if (activeGM()) return finishTimingDial({ doorUuid, completedSteps });
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to unlock this Door." });
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      waitingFinishRequests.delete(requestId);
      resolve({ success: true, message: "The timing result is sent to the Door." });
    }, 900);
    waitingFinishRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } });
    globalThis.game?.socket?.emit?.(TIMING_DIAL_SOCKET, { action: "timing-dial-finish", requestId, doorUuid, completedSteps: [...completedSteps], userId: globalThis.game?.user?.id });
  });
}

function dialMarkup(step, angle) {
  const presentation = timingPresentation(step);
  return `<div class="rw-timing-dial" style="--rw-timing-target:${presentation.targetAngle}deg;--rw-timing-window:${presentation.window}deg;--rw-timing-needle:${angle}deg" role="img" aria-label="Moving dial. Press Space or Enter to stop the hand in the green area."><i class="rw-timing-target"></i><i class="rw-timing-needle"></i><b></b></div>`;
}
function timingMarkup(config, stepIndex, angle, message = "") {
  const step = config.steps[stepIndex];
  const presentation = timingPresentation(step);
  return `<section class="rw-timing-puzzle" tabindex="0" aria-label="Timing Dial puzzle"><header><strong>Stop in the green.</strong><span>${stepIndex + 1}/${config.steps.length}</span></header>${dialMarkup(step, angle)}<div class="rw-timing-meta"><span>${escapeHTML(presentation.label)}</span><button type="button" data-timing-stop>Stop</button></div><p class="rw-timing-status" role="status">${escapeHTML(message || "Press Space to stop.")}</p></section>`;
}

function createTimingDialogClass(DialogV2) {
  return class RegionwrightTimingDialDialog extends DialogV2 {
    constructor({ door, config, standalone = false }) {
      super({ classes: ["regionwright", "rw-timing-dialog"], window: { title: "Timing Dial", icon: "fa-solid fa-stopwatch", resizable: false, minimizable: false }, position: { width: 440, height: 540 }, content: timingMarkup(config, 0, 0), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] });
      this.door = door;
      this.config = config;
      this.standalone = standalone;
      this.stepIndex = 0;
      this.angle = 0;
      this.completedSteps = [];
      this.lastFrame = null;
      this.frameId = null;
      this.resolving = false;
      this.listenerHost = null;
      this.movementGuardRelease = null;
    }
    _onRender(context, options) {
      super._onRender(context, options);
      this._bind();
      this._focus();
      this._start();
      this.bringToFront?.();
    }
    _bind() {
      const root = rootFor(this);
      if (!root || root === this.listenerHost) return;
      this.listenerHost = root;
      root.addEventListener("click", event => { if (event.target.closest?.("[data-timing-stop]")) this._stop(); });
      root.addEventListener("keydown", event => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        this._stop();
      });
      this.movementGuardRelease ??= acquirePuzzleMovementGuard();
    }
    _focus() { rootFor(this)?.querySelector(".rw-timing-puzzle")?.focus?.(); }
    _start() {
      if (this.frameId || this.resolving) return;
      const tick = timestamp => {
        if (this.resolving) { this.frameId = null; return; }
        if (this.lastFrame != null) {
          const speed = timingPresentation(this.config.steps[this.stepIndex]).speed;
          this.angle = (this.angle + ((timestamp - this.lastFrame) / 1000) * speed) % 360;
          const dial = rootFor(this)?.querySelector(".rw-timing-dial");
          if (dial) dial.style.setProperty("--rw-timing-needle", `${this.angle}deg`);
        }
        this.lastFrame = timestamp;
        this.frameId = globalThis.requestAnimationFrame?.(tick) ?? null;
      };
      this.frameId = globalThis.requestAnimationFrame?.(tick) ?? null;
    }
    _refresh(message = "") {
      const section = rootFor(this)?.querySelector(".rw-timing-puzzle");
      if (section) section.outerHTML = timingMarkup(this.config, this.stepIndex, this.angle, message);
      this._focus();
    }
    async _stop() {
      if (this.resolving) return;
      const step = this.config.steps[this.stepIndex];
      if (!isTimingHit(step, this.angle)) {
        this.angle = 0;
        this.lastFrame = null;
        this._refresh("Missed. Try again.");
        return;
      }
      this.completedSteps.push(step.id);
      if (this.stepIndex + 1 < this.config.steps.length) {
        this.stepIndex += 1;
        this.angle = 0;
        this.lastFrame = null;
        this._refresh("Good. Next stop.");
        return;
      }
      this.resolving = true;
      this._refresh("Unlocking…");
      const result = this.standalone
        ? { success: true, message: "The dial sequence is complete." }
        : await requestFinish(this.door.uuid, this.completedSteps);
      if (result?.success) {
        globalThis.ui?.notifications?.info?.("The Timing Dial unlocks the Door.");
        await this.close();
        return;
      }
      this.resolving = false;
      this._refresh(result?.message ?? "The Door did not unlock.");
      this._start();
    }
    async close(options = {}) {
      if (this.frameId) globalThis.cancelAnimationFrame?.(this.frameId);
      this.frameId = null;
      this.movementGuardRelease?.();
      this.movementGuardRelease = null;
      openDialogs.delete(this.door?.uuid);
      return super.close(options);
    }
  };
}

export async function openTimingDialPuzzle(doorOrUuid) {
  const door = await resolveDoor(doorOrUuid);
  const data = normalizeTiming(timingData(door));
  if (!data || !isConfiguredTimingDialDoor(door)) return null;
  const existing = openDialogs.get(door.uuid);
  if (existing) { existing.bringToFront?.(); return existing; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createTimingDialogClass(DialogV2))({ door, config: data.config });
  openDialogs.set(door.uuid, dialog);
  dialog.render(true);
  return dialog;
}

export async function openStandaloneTimingDialPuzzle({ seed = `${Date.now()}` } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const door = { uuid: `Regionwright.Standalone.TimingDial.${seed}`, name: "Standalone Timing Dial", documentName: "Wall" };
  const config = createTimingDialPuzzleConfig({ difficulties: [1, 1, 2], seed });
  const dialog = new (createTimingDialogClass(DialogV2))({ door, config, standalone: true });
  await dialog.render({ force: true });
  return dialog;
}

function availableDoors() {
  return [...(globalThis.canvas?.scene?.walls?.values?.() ?? [])]
    .filter(door => Number(door.door ?? 0) > 0)
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, { sensitivity: "base" }))
    .map((door, index) => ({ door, label: String(door.name ?? "").trim() || `Door ${String.fromCharCode(65 + index)}` }));
}
function highlightDoor(uuid, active) {
  const wall = globalThis.canvas?.walls?.placeables?.find?.(placeable => placeable.document?.uuid === uuid);
  if (wall) wall.hover = active;
}
function difficultyOptions(selected) {
  return TIMING_DIFFICULTIES.map(difficulty => `<option value="${difficulty.id}" ${Number(selected) === difficulty.id ? "selected" : ""}>${difficulty.label}</option>`).join("");
}
function setupMarkup(state) {
  const doors = availableDoors().map(({ door, label }) => `<button type="button" class="rw-timing-setup-door ${state.doorUuid === door.uuid ? "is-selected" : ""}" data-timing-door="${escapeHTML(door.uuid)}">${escapeHTML(label)}</button>`).join("") || "<p>No Doors are available on this Scene.</p>";
  const stops = state.difficulties.map((difficulty, index) => `<div class="rw-timing-setup-stop"><span>${index + 1}</span><select data-timing-difficulty="${index}" aria-label="Stop ${index + 1} difficulty">${difficultyOptions(difficulty)}</select>${state.difficulties.length > 1 ? `<button type="button" data-timing-remove="${index}" aria-label="Remove stop ${index + 1}">−</button>` : ""}</div>`).join("");
  return `<section class="rw-timing-setup"><p>Choose a Door. Add one stop for each successful timing test.</p><div class="rw-timing-setup-doors">${doors}</div><div class="rw-timing-setup-stops">${stops}</div><button type="button" data-timing-add ${state.difficulties.length >= 8 ? "disabled" : ""}>Add stop</button><button type="button" data-timing-create ${state.doorUuid ? "" : "disabled"}>Create Timing Dial</button></section>`;
}
function createSetupDialogClass(DialogV2) {
  return class RegionwrightTimingDialSetup extends DialogV2 {
    constructor({ builder = null } = {}) {
      super({ classes: ["regionwright", "rw-timing-setup-dialog"], window: { title: "Add Timing Dial", icon: "fa-solid fa-stopwatch", resizable: false, minimizable: false }, position: { width: 440, height: 520 }, content: setupMarkup({ doorUuid: null, difficulties: [1] }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
      this.builder = builder;
      this.state = { doorUuid: null, difficulties: [1] };
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = rootFor(this);
      root?.addEventListener("click", event => {
        const door = event.target.closest?.("[data-timing-door]");
        if (door) { if (this.state.doorUuid) highlightDoor(this.state.doorUuid, false); this.state.doorUuid = door.dataset.timingDoor; highlightDoor(this.state.doorUuid, true); this._refresh(); return; }
        if (event.target.closest?.("[data-timing-add]")) { this.state.difficulties.push(1); this._refresh(); return; }
        const remove = event.target.closest?.("[data-timing-remove]");
        if (remove) { this.state.difficulties.splice(Number(remove.dataset.timingRemove), 1); this._refresh(); return; }
        if (event.target.closest?.("[data-timing-create]")) void this._create();
      });
      root?.addEventListener("change", event => {
        const select = event.target.closest?.("[data-timing-difficulty]");
        if (!select) return;
        this.state.difficulties[Number(select.dataset.timingDifficulty)] = Number(select.value);
      });
    }
    _refresh() { const section = rootFor(this)?.querySelector(".rw-timing-setup"); if (section) section.outerHTML = setupMarkup(this.state); }
    async _create() {
      try { await configureTimingDialDoor({ door: this.state.doorUuid, difficulties: this.state.difficulties }); globalThis.ui?.notifications?.info?.("Timing Dial added to the Door."); await this.close(); }
      catch (error) { globalThis.ui?.notifications?.error?.(error.message ?? "Unable to create a Timing Dial."); }
    }
    async close(options = {}) { if (this.state.doorUuid) highlightDoor(this.state.doorUuid, false); await this.builder?._restoreFromGuide?.(); return super.close(options); }
  };
}

export function openTimingDialSetup({ builder = null } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  void builder?._minimizeForGuide?.();
  const dialog = new (createSetupDialogClass(DialogV2))({ builder });
  dialog.render(true);
  return dialog;
}

export function installTimingDialDoorControl() {
  if (doorControlInstalled) return true;
  const Base = globalThis.CONFIG?.Canvas?.doorControlClass;
  if (!Base) return false;
  class TimingDialDoorControl extends Base {
    _onMouseDown(event) {
      const door = this.wall?.document;
      if (isConfiguredTimingDialDoor(door) && globalThis.game?.user?.can?.("WALL_DOORS")) {
        event.stopPropagation();
        void openTimingDialPuzzle(door).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open the Timing Dial."));
        return false;
      }
      return super._onMouseDown(event);
    }
  }
  globalThis.CONFIG.Canvas.doorControlClass = TimingDialDoorControl;
  doorControlInstalled = true;
  for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); }
  return true;
}

export function previewTimingDial(config, stepIndex = 0, angle = 0) {
  const checked = validateTimingDialConfig(config);
  const step = checked.steps[stepIndex];
  return Object.freeze({ step, hit: Boolean(step && isTimingHit(step, angle)), presentation: step ? timingPresentation(step) : null });
}


