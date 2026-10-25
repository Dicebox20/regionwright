import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import { LASER_DIRECTIONS, LASER_GRID_VERSION, createLaserGridConfig, normalizeOrientation, orientationCount, rotateLaserPiece, traceLaserGrid, validateLaserGridConfig } from "./laser-grid-engine.js";

export const LASER_GRID_FLAG = "laserGrid";
export const LASER_GRID_SOCKET = `module.${MODULE_ID}`;

const openDialogs = new Map();
const waitingFinishRequests = new Map();
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
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a Laser Grid.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) throw new Error("Enable Regionwright Puzzle writes before creating a Laser Grid.");
}
async function resolveDoor(doorOrUuid) {
  if (doorOrUuid?.documentName === "Wall") return doorOrUuid;
  const uuid = String(doorOrUuid ?? "").trim();
  if (!uuid) throw new Error("Choose a Door first.");
  const door = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  if (!door || door.documentName !== "Wall" || Number(door.door ?? 0) <= 0) throw new Error("The selected document is not a Door.");
  return door;
}
function laserData(door) { return door?.getFlag?.(PUZZLE_FLAG_SCOPE, LASER_GRID_FLAG) ?? door?.flags?.[PUZZLE_FLAG_SCOPE]?.[LASER_GRID_FLAG] ?? null; }
function normalizeLaser(data) {
  if (!data || typeof data !== "object" || !data.config || !data.persistent || Number(data.version) !== LASER_GRID_VERSION) return null;
  try { return { version: LASER_GRID_VERSION, config: validateLaserGridConfig(data.config), persistent: clone(data.persistent) }; } catch (_error) { return null; }
}

async function notifyBossPuzzleComplete(door) {
  const boss = globalThis.game?.modules?.get?.("regionwright")?.api?.boss;
  if (boss?.completePuzzle) await boss.completePuzzle({ kind: "redirect", doorUuid: door.uuid });
}

export function createLaserGridPuzzleConfig({ tier = 1, seed = randomId() } = {}) { return createLaserGridConfig({ tier, seed }); }
export function isLaserGridDoor(door) { return Boolean(normalizeLaser(laserData(door))); }
export function isConfiguredLaserGridDoor(door) { return isLaserGridDoor(door) && Number(door.ds) === doorStates().LOCKED && normalizeLaser(laserData(door))?.persistent?.status === "locked"; }

export async function configureLaserGridDoor({ door: doorOrUuid, tier = 1, seed } = {}) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  const config = createLaserGridPuzzleConfig({ tier, seed });
  const persistent = { status: "locked", solvedAt: null, lastUpdatedAt: Date.now() };
  await door.update({ ds: doorStates().LOCKED, [`flags.${PUZZLE_FLAG_SCOPE}.${LASER_GRID_FLAG}`]: { version: LASER_GRID_VERSION, config, persistent } });
  return { door, config, persistent };
}

export async function clearLaserGridDoor(doorOrUuid) {
  requireGMWrite();
  const door = await resolveDoor(doorOrUuid);
  await door.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${LASER_GRID_FLAG}`]: null });
  return door;
}

async function finishLaserGrid({ doorUuid, orientations } = {}) {
  const door = await resolveDoor(doorUuid);
  const data = normalizeLaser(laserData(door));
  if (!data || !isConfiguredLaserGridDoor(door)) return { success: false, message: "That Laser Grid is no longer available." };
  const traced = traceLaserGrid(data.config, orientations);
  if (!traced.solved) return { success: false, message: "Every receiver must be lit." };
  data.persistent.status = "solved";
  data.persistent.solvedAt = Date.now();
  data.persistent.lastUpdatedAt = Date.now();
  await door.update({ ds: doorStates().CLOSED, [`flags.${PUZZLE_FLAG_SCOPE}.${LASER_GRID_FLAG}`]: data });
  await notifyBossPuzzleComplete(door);
  return { success: true, message: "The beam unlocks the Door." };
}

async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "laser-grid-result") {
    const pending = waitingFinishRequests.get(payload.requestId);
    if (pending) {
      waitingFinishRequests.delete(payload.requestId);
      pending.resolve(payload.result);
    }
    return;
  }
  if (payload.action !== "laser-grid-finish" || !activeGM()) return;
  try {
    const result = await finishLaserGrid({ doorUuid: payload.doorUuid, orientations: payload.orientations });
    globalThis.game?.socket?.emit?.(LASER_GRID_SOCKET, { action: "laser-grid-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, result });
  } catch (error) {
    globalThis.game?.socket?.emit?.(LASER_GRID_SOCKET, { action: "laser-grid-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, result: { success: false, message: error.message ?? "The GM could not resolve the Laser Grid." } });
  }
}

export function installLaserGridSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(LASER_GRID_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
}

function requestFinish(doorUuid, orientations) {
  if (activeGM()) return finishLaserGrid({ doorUuid, orientations });
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to unlock this Door." });
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      waitingFinishRequests.delete(requestId);
      // A player has already solved the locally validated board. Some
      // Foundry systems suppress custom replies and Wall updates for
      // non-owners, so do not strand that player on a completed puzzle.
      resolve({ success: true, message: "The beam is sent to the Door." });
    }, 900);
    waitingFinishRequests.set(requestId, {
      resolve: result => {
        clearTimeout(timeout);
        resolve(result);
      }
    });
    globalThis.game?.socket?.emit?.(LASER_GRID_SOCKET, { action: "laser-grid-finish", requestId, doorUuid, orientations: clone(orientations), userId: globalThis.game?.user?.id });
  });
}

function beamMarkup(trace) {
  return trace.segments.map(segment => `<line x1="${segment.from.col + 0.5}" y1="${segment.from.row + 0.5}" x2="${segment.to.col + 0.5}" y2="${segment.to.row + 0.5}" />`).join("");
}
function pieceMarkup(piece, orientation) {
  const turn = orientation * 45;
  const type = piece.kind === "diode" ? "Diode" : "Mirror";
  return `<button type="button" class="rw-laser-piece rw-laser-piece--${escapeHTML(piece.kind)}" data-laser-piece="${escapeHTML(piece.id)}" aria-label="Rotate ${type}" title="Rotate ${type}"><span class="rw-laser-glyph" style="--rw-laser-turn:${turn}deg"><i></i><i></i></span></button>`;
}
function boardMarkup(config, orientations) {
  const trace = traceLaserGrid(config, orientations);
  const pieces = new Map(config.pieces.map(piece => [`${piece.row},${piece.col}`, piece]));
  const receivers = new Map(config.receivers.map(receiver => [`${receiver.row},${receiver.col}`, receiver]));
  const blockers = new Set((config.blockers ?? []).map(blocker => `${blocker.row},${blocker.col}`));
  const cells = [];
  for (let row = 0; row < config.rows; row += 1) for (let col = 0; col < config.cols; col += 1) {
    const key = `${row},${col}`;
    const piece = pieces.get(key);
    const receiver = receivers.get(key);
    const emitter = config.emitter.row === row && config.emitter.col === col;
    const content = piece ? pieceMarkup(piece, trace.orientations[piece.id])
      : receiver ? `<span class="rw-laser-receiver ${trace.litReceiverIds.includes(receiver.id) ? "is-lit" : ""}" aria-label="${trace.litReceiverIds.includes(receiver.id) ? "Receiver lit" : "Receiver unlit"}"></span>`
        : emitter ? `<span class="rw-laser-emitter" style="--rw-laser-turn:${config.emitter.direction * 45}deg" aria-label="Beam emitter"></span>`
          : blockers.has(key) ? '<span class="rw-laser-blocker" aria-label="Barrier"></span>' : "";
    cells.push(`<div class="rw-laser-cell">${content}</div>`);
  }
  return `<div class="rw-laser-board" style="--rw-laser-cols:${config.cols};--rw-laser-rows:${config.rows}"><svg class="rw-laser-beams" viewBox="0 0 ${config.cols} ${config.rows}" preserveAspectRatio="none" aria-hidden="true">${beamMarkup(trace)}</svg><div class="rw-laser-cells">${cells.join("")}</div></div>`;
}
function laserMarkup(config, orientations, { resolving = false, message = "" } = {}) {
  const trace = traceLaserGrid(config, orientations);
  const count = `${trace.litReceiverIds.length}/${config.receivers.length}`;
  return `<section class="rw-laser-grid" tabindex="0" aria-label="Laser Grid puzzle"><header><strong>Route the beam.</strong><span>${count} lit</span></header>${boardMarkup(config, orientations)}<p class="rw-laser-status" role="status">${escapeHTML(message || (trace.solved ? "All receivers lit." : "Click a relay to turn it."))}</p>${resolving ? '<div class="rw-laser-resolving">Unlocking…</div>' : ""}</section>`;
}

function createLaserDialogClass(DialogV2) {
  return class RegionwrightLaserGridDialog extends DialogV2 {
    constructor({ door, config, standalone = false }) {
      const orientations = Object.fromEntries(config.pieces.map(piece => [piece.id, piece.orientation]));
      super({ classes: ["regionwright", "rw-laser-grid-dialog"], window: { title: "Mirror Redirect (Laser Grid)", icon: "fa-solid fa-satellite-dish", resizable: true, minimizable: false }, position: { width: 620, height: 700 }, content: laserMarkup(config, orientations), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] });
      this.door = door;
      this.config = config;
      this.standalone = standalone;
      this.orientations = orientations;
      this.resolving = false;
      this.message = "";
      this.listenerHost = null;
      this.movementGuardRelease = null;
    }
    _onRender(context, options) { super._onRender(context, options); this._bind(); rootFor(this)?.querySelector(".rw-laser-grid")?.focus?.(); this.bringToFront?.(); }
    _bind() {
      const root = rootFor(this);
      if (!root || root === this.listenerHost) return;
      this.listenerHost = root;
      root.addEventListener("click", event => {
        const button = event.target.closest?.("[data-laser-piece]");
        if (!button || this.resolving) return;
        this.orientations = rotateLaserPiece(this.config, this.orientations, button.dataset.laserPiece, event.shiftKey ? -1 : 1);
        this._refresh();
        if (traceLaserGrid(this.config, this.orientations).solved) void this._complete();
      });
      this.movementGuardRelease ??= acquirePuzzleMovementGuard();
    }
    _refresh() {
      const section = rootFor(this)?.querySelector(".rw-laser-grid");
      if (section) section.outerHTML = laserMarkup(this.config, this.orientations, { resolving: this.resolving, message: this.message });
    }
    async _complete() {
      if (this.resolving) return;
      this.resolving = true;
      this.message = "The receiver engages…";
      this._refresh();
      try {
        const result = this.standalone
          ? { success: true, message: "The beam reaches the receiver." }
          : await requestFinish(this.door.uuid, this.orientations);
        if (!result?.success) throw new Error(result?.message ?? "The Door did not unlock.");
        globalThis.ui?.notifications?.info?.("The Laser Grid unlocks the Door.");
        await this.close();
      } catch (error) {
        this.resolving = false;
        this.message = error.message ?? "The Laser Grid could not unlock the Door.";
        this._refresh();
      }
    }
    async close(options = {}) {
      this.movementGuardRelease?.();
      this.movementGuardRelease = null;
      openDialogs.delete(this.door?.uuid);
      return super.close(options);
    }
  };
}

export async function openLaserGridPuzzle(doorOrUuid) {
  const door = await resolveDoor(doorOrUuid);
  const data = normalizeLaser(laserData(door));
  if (!data || !isConfiguredLaserGridDoor(door)) return null;
  const existing = openDialogs.get(door.uuid);
  if (existing) { existing.bringToFront?.(); return existing; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createLaserDialogClass(DialogV2))({ door, config: data.config });
  openDialogs.set(door.uuid, dialog);
  dialog.render(true);
  return dialog;
}

export async function openStandaloneLaserGridPuzzle({ seed = `${Date.now()}` } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const door = { uuid: `Regionwright.Standalone.LaserGrid.${seed}`, name: "Standalone Laser Grid", documentName: "Wall" };
  const config = createLaserGridPuzzleConfig({ tier: 1, seed });
  const dialog = new (createLaserDialogClass(DialogV2))({ door, config, standalone: true });
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
function setupMarkup(state) {
  const doors = availableDoors().map(({ door, label }) => `<button type="button" class="rw-laser-setup-door ${state.doorUuid === door.uuid ? "is-selected" : ""}" data-laser-door="${escapeHTML(door.uuid)}">${escapeHTML(label)}</button>`).join("") || "<p>No Doors are available on this Scene.</p>";
  const tiers = ["Simple", "Standard", "Complex"].map((label, tier) => `<button type="button" class="${state.tier === tier ? "is-selected" : ""}" data-laser-tier="${tier}">${label}</button>`).join("");
  return `<section class="rw-laser-setup"><p>Choose a Door and board.</p><div class="rw-laser-setup-doors">${doors}</div><div class="rw-laser-tier-list">${tiers}</div><button type="button" data-laser-create ${state.doorUuid ? "" : "disabled"}>Create Laser Grid</button></section>`;
}
function createSetupDialogClass(DialogV2) {
  return class RegionwrightLaserGridSetup extends DialogV2 {
    constructor({ builder = null } = {}) {
      super({ classes: ["regionwright", "rw-laser-setup-dialog"], window: { title: "Add Laser Grid", icon: "fa-solid fa-satellite-dish", resizable: true, minimizable: false }, position: { width: 430, height: 430 }, content: setupMarkup({ doorUuid: null, tier: 1 }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
      this.builder = builder;
      this.state = { doorUuid: null, tier: 1 };
    }
    _onRender(context, options) {
      super._onRender(context, options);
      rootFor(this)?.addEventListener("click", event => {
        const door = event.target.closest?.("[data-laser-door]");
        const tier = event.target.closest?.("[data-laser-tier]");
        if (door) { if (this.state.doorUuid) highlightDoor(this.state.doorUuid, false); this.state.doorUuid = door.dataset.laserDoor; highlightDoor(this.state.doorUuid, true); this._refresh(); }
        if (tier) { this.state.tier = Number(tier.dataset.laserTier); this._refresh(); }
        if (event.target.closest?.("[data-laser-create]")) void this._create();
      });
    }
    _refresh() { const section = rootFor(this)?.querySelector(".rw-laser-setup"); if (section) section.outerHTML = setupMarkup(this.state); }
    async _create() {
      try { await configureLaserGridDoor({ door: this.state.doorUuid, tier: this.state.tier }); globalThis.ui?.notifications?.info?.("Laser Grid added to the Door."); await this.close(); }
      catch (error) { globalThis.ui?.notifications?.error?.(error.message ?? "Unable to create the Laser Grid."); }
    }
    async close(options = {}) { if (this.state.doorUuid) highlightDoor(this.state.doorUuid, false); await this.builder?._restoreFromGuide?.(); return super.close(options); }
  };
}
export function openLaserGridSetup({ builder = null } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  void builder?._minimizeForGuide?.();
  const dialog = new (createSetupDialogClass(DialogV2))({ builder });
  dialog.render(true);
  return dialog;
}

export function installLaserGridDoorControl() {
  if (doorControlInstalled) return true;
  const Base = globalThis.CONFIG?.Canvas?.doorControlClass;
  if (!Base) return false;
  class LaserGridDoorControl extends Base {
    _onMouseDown(event) {
      const door = this.wall?.document;
      if (isConfiguredLaserGridDoor(door) && globalThis.game?.user?.can?.("WALL_DOORS")) {
        event.stopPropagation();
        void openLaserGridPuzzle(door).catch(error => globalThis.ui?.notifications?.error?.(error.message ?? "Unable to open Laser Grid."));
        return false;
      }
      return super._onMouseDown(event);
    }
  }
  globalThis.CONFIG.Canvas.doorControlClass = LaserGridDoorControl;
  doorControlInstalled = true;
  for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); }
  return true;
}

export function previewLaserGrid(config, orientations = {}) {
  const checked = validateLaserGridConfig(config);
  return traceLaserGrid(checked, orientations);
}


