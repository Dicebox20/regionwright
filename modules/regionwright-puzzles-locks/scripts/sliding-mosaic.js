import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING, regionWritesEnabled } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import { createSlidingMosaicConfig, evaluateSlidingOrder, shuffledSlidingOrder, slideMosaicTile, SLIDING_MOSAIC_TARGET_TYPES, SLIDING_MOSAIC_VERSION, validateSlidingMosaicConfig } from "./sliding-mosaic-engine.js";

export const SLIDING_MOSAIC_FLAG = "slidingMosaic";
export const SLIDING_MOSAIC_SOCKET = `module.${MODULE_ID}`;

const openDialogs = new Map();
const remoteMosaics = new Map();
const waitingRequests = new Map();
let socketInstalled = false;
let doorControlInstalled = false;
let tileControlInstalled = false;

const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const clone = value => structuredClone(value);
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const rootFor = application => application?.element?.[0] ?? application?.element ?? null;
const doorStates = () => globalThis.CONST?.WALL_DOOR_STATES ?? { CLOSED: 0, OPEN: 1, LOCKED: 2 };
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === globalThis.game.user.id));
const targetType = target => target?.documentName === "Wall" ? "door" : target?.documentName === "Tile" ? "tile" : target?.documentName === "Region" ? "region" : null;
const targetLabel = target => String(target?.name ?? "").trim() || `${targetType(target) === "door" ? "Door" : targetType(target) === "tile" ? "Tile" : "Region"} ${String(target?.id ?? "").slice(0, 5)}`;
const targetData = target => target?.getFlag?.(PUZZLE_FLAG_SCOPE, SLIDING_MOSAIC_FLAG) ?? target?.flags?.[PUZZLE_FLAG_SCOPE]?.[SLIDING_MOSAIC_FLAG] ?? remoteMosaics.get(target?.uuid) ?? null;

function normalizeMosaic(data) {
  if (!data || typeof data !== "object" || Number(data.version) !== SLIDING_MOSAIC_VERSION || !data.config || !data.persistent) return null;
  try { return { version: SLIDING_MOSAIC_VERSION, config: validateSlidingMosaicConfig(data.config), persistent: clone(data.persistent) }; } catch (_error) { return null; }
}

function isConfiguredTarget(target) {
  const type = targetType(target);
  const data = normalizeMosaic(targetData(target));
  if (!type || !data || data.persistent.status !== "locked") return false;
  return type !== "door" || Number(target?.ds) === doorStates().LOCKED || (!globalThis.game?.user?.isGM && remoteMosaics.has(target.uuid));
}

async function resolveTarget(targetOrUuid) {
  if (targetType(targetOrUuid)) return targetOrUuid;
  const uuid = String(targetOrUuid ?? "").trim();
  const target = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  const type = targetType(target);
  if (!target || !SLIDING_MOSAIC_TARGET_TYPES.includes(type) || (type === "door" && Number(target.door ?? 0) <= 0)) throw new Error("Choose a Door, Tile, or Region.");
  return target;
}

function requireWrite(target) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure Sliding Mosaic.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) throw new Error("Enable Regionwright Puzzle writes before creating Sliding Mosaic.");
  if (targetType(target) === "region" && !regionWritesEnabled()) throw new Error("Enable Regionwright: Studio Region writes before placing Sliding Mosaic on a Region.");
}

function regionBehaviorData() {
  return { type: "executeScript", system: { events: ["tokenEnter"], source: `await game.modules.get("${MODULE_ID}")?.api?.slidingMosaic?.handleRegionEvent(region, event);` }, flags: { [PUZZLE_FLAG_SCOPE]: { [SLIDING_MOSAIC_FLAG]: { region: true } } } };
}
const ownedBehavior = behavior => Boolean(behavior?.flags?.[PUZZLE_FLAG_SCOPE]?.[SLIDING_MOSAIC_FLAG]?.region);

export const createSlidingMosaicPuzzleConfig = options => createSlidingMosaicConfig(options);
export const isSlidingMosaicTarget = target => Boolean(normalizeMosaic(targetData(target)));

export async function configureSlidingMosaic({ target: targetOrUuid, image, size = 4, seed = "", initialOrder = null } = {}) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  const config = createSlidingMosaicPuzzleConfig({ image, size, seed, initialOrder });
  const data = { version: SLIDING_MOSAIC_VERSION, config, persistent: { status: "locked", solvedAt: null, lastUpdatedAt: Date.now() } };
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${SLIDING_MOSAIC_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().LOCKED;
  await target.update(updates);
  if (targetType(target) === "region") {
    const behavior = Array.from(target.behaviors ?? []).find(ownedBehavior);
    if (behavior) await target.updateEmbeddedDocuments("RegionBehavior", [{ _id: behavior.id, ...regionBehaviorData() }]);
    else await target.createEmbeddedDocuments("RegionBehavior", [regionBehaviorData()]);
  }
  globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-config", targetUuid: target.uuid, data: clone(data) });
  return { target, config, data };
}

export async function clearSlidingMosaic(targetOrUuid) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  if (targetType(target) === "region") {
    const ids = Array.from(target.behaviors ?? []).filter(ownedBehavior).map(entry => entry.id).filter(Boolean);
    if (ids.length) await target.deleteEmbeddedDocuments("RegionBehavior", ids);
  }
  await target.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${SLIDING_MOSAIC_FLAG}`]: null });
  remoteMosaics.delete(target.uuid);
  return target;
}

async function finishSlidingMosaic({ targetUuid, order } = {}) {
  const target = await resolveTarget(targetUuid);
  const data = normalizeMosaic(targetData(target));
  if (!data || !isConfiguredTarget(target)) return { success: false, message: "That puzzle is no longer available." };
  if (!evaluateSlidingOrder(data.config, order).success) return { success: false, message: "The picture is not complete yet." };
  data.persistent.status = "solved";
  data.persistent.solvedAt = Date.now();
  data.persistent.lastUpdatedAt = Date.now();
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${SLIDING_MOSAIC_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().CLOSED;
  await target.update(updates);
  return { success: true, message: targetType(target) === "door" ? "The picture is complete. The Door unlocks." : "The picture is complete." };
}

function sceneTargets() {
  const scene = globalThis.canvas?.scene;
  return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0).concat([...(scene?.tiles ?? [])], [...(scene?.regions ?? [])]);
}

function requestConfigs() {
  if (!globalThis.game?.user?.isGM) globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-request-config", userId: globalThis.game?.user?.id });
}

async function openForUser(targetUuid, recipientId = null) {
  if (!recipientId || recipientId === globalThis.game?.user?.id) return openSlidingMosaicPuzzle(targetUuid);
  globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-open", targetUuid, recipientId });
  return null;
}

async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "sliding-config" && (!payload.recipientId || payload.recipientId === globalThis.game?.user?.id)) {
    if (payload.targetUuid && normalizeMosaic(payload.data)) remoteMosaics.set(payload.targetUuid, clone(payload.data));
    return;
  }
  if (payload.action === "sliding-request-config" && activeGM()) {
    const recipientId = payload.userId ?? senderId;
    for (const target of sceneTargets()) {
      const data = normalizeMosaic(targetData(target));
      if (data?.persistent?.status === "locked") globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-config", recipientId, targetUuid: target.uuid, data: clone(data) });
    }
    return;
  }
  if (payload.action === "sliding-region-event" && activeGM()) { void openForUser(payload.targetUuid, payload.recipientId ?? senderId).catch(() => {}); return; }
  if (payload.action === "sliding-open" && payload.recipientId === globalThis.game?.user?.id) { void openSlidingMosaicPuzzle(payload.targetUuid).catch(() => {}); return; }
  if (payload.action === "sliding-result") {
    if (payload.result?.success && payload.targetUuid) remoteMosaics.delete(payload.targetUuid);
    const pending = waitingRequests.get(payload.requestId);
    if (pending) { waitingRequests.delete(payload.requestId); pending.resolve(payload.result); }
    return;
  }
  if (payload.action === "sliding-finish" && activeGM()) {
    try {
      const result = await finishSlidingMosaic(payload);
      globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result });
    } catch (error) {
      globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result: { success: false, message: error.message ?? "The GM could not resolve the puzzle." } });
    }
  }
}

export function installSlidingMosaicSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(SLIDING_MOSAIC_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
  setTimeout(requestConfigs, 0);
}

function requestFinish(targetUuid, order) {
  if (activeGM()) return finishSlidingMosaic({ targetUuid, order });
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to complete the puzzle." });
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => { waitingRequests.delete(requestId); resolve({ success: false, message: "The GM did not respond. Try again when they are connected." }); }, 10000);
    waitingRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } });
    globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-finish", requestId, targetUuid, order: [...order], userId: globalThis.game?.user?.id });
  });
}

const percent = (value, size) => size > 1 ? `${(value / (size - 1)) * 100}%` : "0%";

function boardMarkup(config, order, showReference = false) {
  const { size } = config;
  const blank = order.indexOf(0);
  const solved = evaluateSlidingOrder(config, order).success;
  const tiles = order.map((tile, index) => {
    const row = Math.floor(index / size);
    const column = index % size;
    if (tile === 0) return `<div class="rw-sliding-empty" aria-label="Empty space"></div>`;
    const sourceIndex = tile - 1;
    const sourceRow = Math.floor(sourceIndex / size);
    const sourceColumn = sourceIndex % size;
    const movable = Math.abs(row - Math.floor(blank / size)) + Math.abs(column - (blank % size)) === 1;
    return `<button type="button" class="rw-sliding-tile ${movable ? "is-movable" : ""}" data-sliding-tile="${index}" aria-label="Image tile, originally row ${sourceRow + 1} column ${sourceColumn + 1}. Currently row ${row + 1} column ${column + 1}.${movable ? " Can slide." : ""}" style="--rw-sliding-x:${percent(sourceColumn, size)};--rw-sliding-y:${percent(sourceRow, size)}"></button>`;
  }).join("");
  return `<section class="rw-sliding-game" tabindex="0"><header><strong>Slide the picture into order</strong><span data-sliding-moves>0 moves</span></header><div class="rw-sliding-board" role="group" aria-label="Sliding image puzzle" style="--rw-sliding-size:${size};--rw-sliding-background-size:${size * 100}%">${tiles}</div><div class="rw-sliding-actions"><button type="button" data-sliding-preview aria-expanded="${showReference ? "true" : "false"}">${showReference ? "Hide picture" : "Show picture"}</button><button type="button" data-sliding-reset>Shuffle</button>${solved ? `<button type="button" data-sliding-submit>Complete puzzle</button>` : ""}</div><figure class="rw-sliding-reference" data-sliding-reference ${showReference ? "" : "hidden"}><img src="${escapeHTML(config.image)}" alt="Completed puzzle image"></figure><p role="status" data-sliding-status>Slide a neighboring tile into the empty space. You can also use WASD or arrow keys.</p></section>`;
}

function cssUrl(path) {
  const safe = String(path ?? "").replaceAll("\\", "\\\\").replaceAll('"', '\\"').replace(/[\r\n\f]/g, "");
  return `url("${safe}")`;
}

function resolveImageUrl(path) {
  try { return new URL(String(path ?? ""), globalThis.document?.baseURI ?? globalThis.location?.href).href; }
  catch (_error) { return String(path ?? ""); }
}

function createSlidingDialog(DialogV2) {
  return class SlidingMosaicDialog extends DialogV2 {
    constructor({ target, config, standalone = false }) {
      const order = [...shuffledSlidingOrder(config, `${target.uuid}:${Date.now()}`)];
      super({ classes: ["regionwright", "rw-sliding-mosaic-dialog"], window: { title: "Sliding Mosaic", icon: "fa-solid fa-puzzle-piece", resizable: true, minimizable: false }, position: { width: 590, height: 700 }, content: boardMarkup(config, order), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] });
      this.target = target;
      this.config = config;
      this.standalone = standalone;
      this.order = order;
      this.moves = 0;
      this.showReference = false;
      this.resolving = false;
      this.listenerHost = null;
      this.releaseGuard = null;
    }

    _onRender(context, options) {
      super._onRender(context, options);
      this._bind();
      this._loadImage();
      rootFor(this)?.querySelector(".rw-sliding-game")?.focus?.();
      this.bringToFront?.();
    }

    _loadImage() {
      const root = rootFor(this);
      if (!root) return;
      root.style.setProperty("--rw-sliding-image", cssUrl(resolveImageUrl(this.config.image)));
      const image = new globalThis.Image();
      image.onload = () => {
        this._imageWidth = image.naturalWidth;
        this._imageHeight = image.naturalHeight;
        const board = rootFor(this)?.querySelector(".rw-sliding-board");
        if (board && image.naturalWidth && image.naturalHeight) board.style.setProperty("--rw-sliding-ratio", `${image.naturalWidth} / ${image.naturalHeight}`);
      };
      image.onerror = () => this._status("The image could not be loaded. Check the image path or choose another image.");
      image.src = this.config.image;
    }

    _bind() {
      const root = rootFor(this);
      if (!root || root === this.listenerHost) return;
      this.listenerHost = root;
      root.addEventListener("click", event => {
        const tile = event.target.closest?.("[data-sliding-tile]");
        if (tile && !this.resolving) { this._move(Number(tile.dataset.slidingTile)); return; }
        if (event.target.closest?.("[data-sliding-reset]") && !this.resolving) { this.order = [...shuffledSlidingOrder(this.config, `${this.target.uuid}:${Date.now()}`)]; this.moves = 0; this.resolving = false; this._refresh("The picture is shuffled. Slide a neighboring tile into the empty space."); return; }
        const preview = event.target.closest?.("[data-sliding-preview]");
        if (preview) {
          this.showReference = !this.showReference;
          const figure = root.querySelector("[data-sliding-reference]");
          if (figure) figure.hidden = !this.showReference;
          preview.setAttribute("aria-expanded", String(this.showReference));
          preview.textContent = this.showReference ? "Hide picture" : "Show picture";
          return;
        }
        if (event.target.closest?.("[data-sliding-submit]")) void this._submit();
      });
      root.addEventListener("keydown", event => {
        const directions = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0] };
        const direction = directions[event.key];
        if (!direction || this.resolving) return;
        event.preventDefault();
        event.stopPropagation();
        this._moveFromDirection(...direction);
      });
      this.releaseGuard ??= acquirePuzzleMovementGuard({ onKeyDown: event => {
        if (event.repeat || this.resolving) return;
        const directions = { KeyW: [0, -1], KeyD: [1, 0], KeyS: [0, 1], KeyA: [-1, 0] };
        const direction = directions[event.code];
        if (direction) this._moveFromDirection(...direction);
      } });
    }

    _moveFromDirection(dx, dy) {
      const blank = this.order.indexOf(0);
      const row = Math.floor(blank / this.config.size) + dy;
      const column = (blank % this.config.size) + dx;
      if (row < 0 || row >= this.config.size || column < 0 || column >= this.config.size) return;
      this._move(row * this.config.size + column);
    }

    _move(index) {
      const moved = slideMosaicTile(this.order, index, this.config.size);
      if (!moved) return;
      this.order = [...moved];
      this.moves += 1;
      this._refresh();
      if (evaluateSlidingOrder(this.config, this.order).success) void this._submit();
    }

    async _submit() {
      if (this.resolving) return;
      this.resolving = true;
      this._status("The picture is complete...");
      const result = this.standalone ? { success: true, message: `Solved in ${this.moves} moves.` } : await requestFinish(this.target.uuid, this.order);
      if (result?.success) {
        globalThis.ui?.notifications?.info?.(this.standalone ? result.message : `${result.message} Solved in ${this.moves} moves.`);
        await this.close();
        return;
      }
      this.resolving = false;
      this._status(result?.message ?? "The GM could not complete the puzzle.");
    }

    _status(message) {
      const status = rootFor(this)?.querySelector("[data-sliding-status]");
      if (status) status.textContent = message;
    }

    _refresh(message = null) {
      const root = rootFor(this);
      const game = root?.querySelector(".rw-sliding-game");
      if (!root || !game) return;
      game.outerHTML = boardMarkup(this.config, this.order, this.showReference);
      root.querySelector("[data-sliding-moves]").textContent = `${this.moves} ${this.moves === 1 ? "move" : "moves"}`;
      root.style.setProperty("--rw-sliding-image", cssUrl(resolveImageUrl(this.config.image)));
      if (message) this._status(message);
      if (this._imageWidth && this._imageHeight) root.querySelector(".rw-sliding-board")?.style.setProperty("--rw-sliding-ratio", `${this._imageWidth} / ${this._imageHeight}`);
    }

    async close(options = {}) {
      this.releaseGuard?.();
      this.releaseGuard = null;
      openDialogs.delete(this.target?.uuid);
      return super.close(options);
    }
  };
}

export async function openSlidingMosaicPuzzle(targetOrUuid) {
  const target = await resolveTarget(targetOrUuid);
  const data = normalizeMosaic(targetData(target));
  if (!data || !isConfiguredTarget(target)) return null;
  const existing = openDialogs.get(target.uuid);
  if (existing) { existing.bringToFront?.(); return existing; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createSlidingDialog(DialogV2))({ target, config: data.config });
  openDialogs.set(target.uuid, dialog);
  dialog.render(true);
  return dialog;
}

export async function openStandaloneSlidingMosaicPuzzle({ seed = `${Date.now()}`, image = `modules/${MODULE_ID}/assets/sliding-mosaic-demo.svg`, size = 4 } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const target = { uuid: `Regionwright.Standalone.SlidingMosaic.${seed}`, name: "Standalone Sliding Mosaic", documentName: "Region" };
  const config = createSlidingMosaicConfig({ image, size, seed });
  const dialog = new (createSlidingDialog(DialogV2))({ target, config, standalone: true });
  await dialog.render({ force: true });
  return dialog;
}

export async function handleSlidingMosaicRegionEvent(region, event = {}) {
  const target = await resolveTarget(region);
  if (!isConfiguredTarget(target)) return null;
  const userId = event?.userId ?? event?.user?.id ?? event?.data?.userId ?? globalThis.game?.user?.id ?? null;
  if (!activeGM()) {
    globalThis.game?.socket?.emit?.(SLIDING_MOSAIC_SOCKET, { action: "sliding-region-event", targetUuid: target.uuid, recipientId: userId });
    return null;
  }
  return openForUser(target.uuid, userId);
}

function highlightTarget(uuid, active) {
  const placeable = [...(globalThis.canvas?.walls?.placeables ?? []), ...(globalThis.canvas?.tiles?.placeables ?? []), ...(globalThis.canvas?.regions?.placeables ?? [])].find(entry => entry.document?.uuid === uuid);
  if (placeable) placeable.hover = active;
}

function availableTargets(type) {
  const scene = globalThis.canvas?.scene;
  if (type === "door") return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0);
  if (type === "tile") return [...(scene?.tiles ?? [])];
  return [...(scene?.regions ?? [])];
}

function setupMarkup(state) {
  const typeButtons = SLIDING_MOSAIC_TARGET_TYPES.map(type => `<button type="button" data-sliding-type="${type}" class="${state.type === type ? "is-selected" : ""}">${type[0].toUpperCase() + type.slice(1)}</button>`).join("");
  const targets = availableTargets(state.type).map(target => `<button type="button" data-sliding-target="${escapeHTML(target.uuid)}" class="${state.targetUuid === target.uuid ? "is-selected" : ""}">${escapeHTML(targetLabel(target))}</button>`).join("") || `<p>No ${state.type}s are available on this Scene.</p>`;
  const preview = state.image ? `<img data-sliding-image-preview src="${escapeHTML(state.image)}" alt="Selected puzzle image">` : `<span data-sliding-image-placeholder>Choose an image for the puzzle.</span>`;
  return `<section class="standard-form rw-sliding-setup"><p>Choose a picture, grid size, and Door, Tile, or Region.</p><div class="form-group"><label for="rw-sliding-image">Puzzle image</label><div class="rw-sliding-image-field"><input id="rw-sliding-image" data-sliding-image value="${escapeHTML(state.image)}" placeholder="Image path or URL" autocomplete="off"><button type="button" data-sliding-browse>Browse</button></div></div><div class="rw-sliding-image-preview">${preview}</div><div class="form-group"><label for="rw-sliding-size">Grid size</label><select id="rw-sliding-size" data-sliding-size><option value="3" ${state.size === 3 ? "selected" : ""}>3 × 3 — Easy</option><option value="4" ${state.size === 4 ? "selected" : ""}>4 × 4 — Standard</option><option value="5" ${state.size === 5 ? "selected" : ""}>5 × 5 — Hard</option></select></div><div class="rw-sliding-target-types">${typeButtons}</div><div class="rw-sliding-target-list">${targets}</div><button type="button" data-sliding-create ${state.targetUuid && state.image ? "" : "disabled"}>Create Sliding Mosaic</button></section>`;
}

function createSetupDialog(DialogV2) {
  return class SlidingMosaicSetup extends DialogV2 {
    constructor({ builder = null } = {}) {
      const state = { type: "door", targetUuid: null, image: "", size: 4 };
      super({ classes: ["regionwright", "rw-sliding-setup-dialog"], window: { title: "Sliding Mosaic Setup", icon: "fa-solid fa-puzzle-piece", resizable: true, minimizable: false }, position: { width: 560, height: 690 }, content: setupMarkup(state), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
      this.builder = builder;
      this.setupState = state;
    }

    _onRender(context, options) {
      super._onRender(context, options);
      const root = rootFor(this);
      root?.addEventListener("click", event => {
        const type = event.target.closest?.("[data-sliding-type]");
        const target = event.target.closest?.("[data-sliding-target]");
        if (type) {
          if (this.setupState.targetUuid) highlightTarget(this.setupState.targetUuid, false);
          this.setupState.type = type.dataset.slidingType;
          this.setupState.targetUuid = null;
          this._refresh();
          return;
        }
        if (target) {
          if (this.setupState.targetUuid) highlightTarget(this.setupState.targetUuid, false);
          this.setupState.targetUuid = target.dataset.slidingTarget;
          highlightTarget(this.setupState.targetUuid, true);
          this._refresh();
          return;
        }
        if (event.target.closest?.("[data-sliding-browse]")) { void this._browse(); return; }
        if (event.target.closest?.("[data-sliding-create]")) void this._create();
      });
      root?.addEventListener("input", event => {
        if (event.target.matches?.("[data-sliding-image]")) {
          this.setupState.image = event.target.value.trim();
          this._updateImagePreview(root);
          const create = root.querySelector("[data-sliding-create]");
          if (create) create.disabled = !this.setupState.targetUuid || !this.setupState.image;
        }
      });
      root?.addEventListener("change", event => {
        if (event.target.matches?.("[data-sliding-size]")) this.setupState.size = Number(event.target.value);
      });
    }

    _updateImagePreview(root = rootFor(this)) {
      const host = root?.querySelector(".rw-sliding-image-preview");
      if (!host) return;
      host.innerHTML = this.setupState.image
        ? `<img data-sliding-image-preview src="${escapeHTML(this.setupState.image)}" alt="Selected puzzle image">`
        : `<span data-sliding-image-placeholder>Choose an image for the puzzle.</span>`;
    }

    async _browse() {
      const FilePicker = globalThis.FilePicker ?? globalThis.foundry?.applications?.apps?.FilePicker;
      if (!FilePicker) { globalThis.ui?.notifications?.error?.("Foundry's image picker is unavailable."); return; }
      const picker = new FilePicker({ type: "image", current: this.setupState.image, callback: path => {
        this.setupState.image = String(path ?? "").trim();
        const root = rootFor(this);
        const input = root?.querySelector("[data-sliding-image]");
        if (input) input.value = this.setupState.image;
        this._updateImagePreview(root);
        const create = root?.querySelector("[data-sliding-create]");
        if (create) create.disabled = !this.setupState.targetUuid || !this.setupState.image;
      } });
      await picker.render(true);
    }

    _refresh() {
      const section = rootFor(this)?.querySelector(".rw-sliding-setup");
      if (section) section.outerHTML = setupMarkup(this.setupState);
    }

    async _create() {
      try {
        await configureSlidingMosaic({ target: this.setupState.targetUuid, image: this.setupState.image, size: this.setupState.size });
        globalThis.ui?.notifications?.info?.("Sliding Mosaic added.");
        await this.close();
      } catch (error) {
        globalThis.ui?.notifications?.error?.(error.message ?? "Unable to create Sliding Mosaic.");
      }
    }

    async close(options = {}) {
      if (this.setupState.targetUuid) highlightTarget(this.setupState.targetUuid, false);
      await this.builder?._restoreFromGuide?.();
      return super.close(options);
    }
  };
}

export function openSlidingMosaicSetup({ builder = null } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  void builder?._minimizeForGuide?.();
  const dialog = new (createSetupDialog(DialogV2))({ builder });
  dialog.render(true);
  return dialog;
}

export function installSlidingMosaicDoorControl() {
  if (doorControlInstalled) return true;
  const Base = globalThis.CONFIG?.Canvas?.doorControlClass;
  if (!Base) return false;
  class SlidingMosaicDoorControl extends Base {
    _onMouseDown(event) {
      const target = this.wall?.document;
      if (isConfiguredTarget(target) && globalThis.game?.user?.can?.("WALL_DOORS")) { event.stopPropagation(); void openSlidingMosaicPuzzle(target).catch(() => {}); return false; }
      return super._onMouseDown(event);
    }
  }
  globalThis.CONFIG.Canvas.doorControlClass = SlidingMosaicDoorControl;
  doorControlInstalled = true;
  for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); }
  return true;
}

export function installSlidingMosaicTileControl() {
  if (tileControlInstalled) return true;
  const prototype = globalThis.CONFIG?.Tile?.objectClass?.prototype;
  const original = prototype?._onClickLeft;
  if (typeof original !== "function") return false;
  prototype._onClickLeft = function SlidingMosaicTileClick(event) {
    if (isConfiguredTarget(this.document)) { event?.stopPropagation?.(); void openSlidingMosaicPuzzle(this.document).catch(() => {}); return false; }
    return original.call(this, event);
  };
  tileControlInstalled = true;
  return true;
}

export const previewSlidingMosaic = (config, order) => evaluateSlidingOrder(config, order);
