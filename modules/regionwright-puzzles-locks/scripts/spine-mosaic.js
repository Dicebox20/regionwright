import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING, regionWritesEnabled } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import { SPINE_MOSAIC_TARGET_TYPES, SPINE_MOSAIC_VERSION, createSpineMosaicConfig, evaluateSpineOrder, shuffledSpineOrder, validateSpineMosaicConfig } from "./spine-mosaic-engine.js";

export const SPINE_MOSAIC_FLAG = "spineMosaic";
export const SPINE_MOSAIC_SOCKET = `module.${MODULE_ID}`;

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
const activeGM = () => { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); };
const targetType = target => target?.documentName === "Wall" ? "door" : target?.documentName === "Tile" ? "tile" : target?.documentName === "Region" ? "region" : null;
const targetLabel = target => String(target?.name ?? "").trim() || `${targetType(target) === "door" ? "Door" : targetType(target) === "tile" ? "Tile" : "Region"} ${String(target?.id ?? "").slice(0, 5)}`;
const targetData = target => target?.getFlag?.(PUZZLE_FLAG_SCOPE, SPINE_MOSAIC_FLAG) ?? target?.flags?.[PUZZLE_FLAG_SCOPE]?.[SPINE_MOSAIC_FLAG] ?? remoteMosaics.get(target?.uuid) ?? null;

function normalizeMosaic(data) {
  if (!data || typeof data !== "object" || Number(data.version) !== SPINE_MOSAIC_VERSION || !data.config || !data.persistent) return null;
  try { return { version: SPINE_MOSAIC_VERSION, config: validateSpineMosaicConfig(data.config), persistent: clone(data.persistent) }; } catch (_error) { return null; }
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
  if (!target || !SPINE_MOSAIC_TARGET_TYPES.includes(type) || (type === "door" && Number(target.door ?? 0) <= 0)) throw new Error("Choose a Door, Tile, or Region.");
  return target;
}
function requireWrite(target) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure Spine Mosaic.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) throw new Error("Enable Regionwright Puzzle writes before creating Spine Mosaic.");
  if (targetType(target) === "region" && !regionWritesEnabled()) throw new Error("Enable Regionwright: Studio Region writes before placing Spine Mosaic on a Region.");
}
function regionBehaviorData() { return { type: "executeScript", system: { events: ["tokenEnter"], source: `await game.modules.get("${MODULE_ID}")?.api?.spineMosaic?.handleRegionEvent(region, event);` }, flags: { [PUZZLE_FLAG_SCOPE]: { [SPINE_MOSAIC_FLAG]: { region: true } } } }; }
const ownedBehavior = behavior => Boolean(behavior?.flags?.[PUZZLE_FLAG_SCOPE]?.[SPINE_MOSAIC_FLAG]?.region);

export const createSpineMosaicPuzzleConfig = options => createSpineMosaicConfig(options);
export const isSpineMosaicTarget = target => Boolean(normalizeMosaic(targetData(target)));

export async function configureSpineMosaic({ target: targetOrUuid, books, seed = "" } = {}) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  const config = createSpineMosaicPuzzleConfig({ books, seed });
  const data = { version: SPINE_MOSAIC_VERSION, config, persistent: { status: "locked", solvedAt: null, lastUpdatedAt: Date.now() } };
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${SPINE_MOSAIC_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().LOCKED;
  await target.update(updates);
  if (targetType(target) === "region") {
    const behavior = Array.from(target.behaviors ?? []).find(ownedBehavior);
    if (behavior) await target.updateEmbeddedDocuments("RegionBehavior", [{ _id: behavior.id, ...regionBehaviorData() }]);
    else await target.createEmbeddedDocuments("RegionBehavior", [regionBehaviorData()]);
  }
  globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-config", targetUuid: target.uuid, data: clone(data) });
  return { target, config, data };
}
export async function clearSpineMosaic(targetOrUuid) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  if (targetType(target) === "region") {
    const ids = Array.from(target.behaviors ?? []).filter(ownedBehavior).map(entry => entry.id).filter(Boolean);
    if (ids.length) await target.deleteEmbeddedDocuments("RegionBehavior", ids);
  }
  await target.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${SPINE_MOSAIC_FLAG}`]: null });
  remoteMosaics.delete(target.uuid);
  return target;
}
async function finishSpineMosaic({ targetUuid, order } = {}) {
  const target = await resolveTarget(targetUuid);
  const data = normalizeMosaic(targetData(target));
  if (!data || !isConfiguredTarget(target)) return { success: false, message: "That shelf is no longer available." };
  if (!evaluateSpineOrder(data.config, order).success) return { success: false, message: "The mural is incomplete." };
  data.persistent.status = "solved";
  data.persistent.solvedAt = Date.now();
  data.persistent.lastUpdatedAt = Date.now();
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${SPINE_MOSAIC_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().CLOSED;
  await target.update(updates);
  return { success: true, message: targetType(target) === "door" ? "The bookshelf opens the Door." : "The hidden passage is revealed." };
}
function sceneTargets() { const scene = globalThis.canvas?.scene; return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0).concat([...(scene?.tiles ?? [])], [...(scene?.regions ?? [])]); }
function requestConfigs() { if (!globalThis.game?.user?.isGM) globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-request-config", userId: globalThis.game?.user?.id }); }
async function openForUser(targetUuid, recipientId = null) { if (!recipientId || recipientId === globalThis.game?.user?.id) return openSpineMosaicPuzzle(targetUuid); globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-open", targetUuid, recipientId }); return null; }
async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "spine-config" && (!payload.recipientId || payload.recipientId === globalThis.game?.user?.id)) { if (payload.targetUuid && normalizeMosaic(payload.data)) remoteMosaics.set(payload.targetUuid, clone(payload.data)); return; }
  if (payload.action === "spine-request-config" && activeGM()) { const recipientId = payload.userId ?? senderId; for (const target of sceneTargets()) { const data = normalizeMosaic(targetData(target)); if (data?.persistent?.status === "locked") globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-config", recipientId, targetUuid: target.uuid, data: clone(data) }); } return; }
  if (payload.action === "spine-region-event" && activeGM()) { void openForUser(payload.targetUuid, payload.recipientId ?? senderId).catch(() => {}); return; }
  if (payload.action === "spine-open" && payload.recipientId === globalThis.game?.user?.id) { void openSpineMosaicPuzzle(payload.targetUuid).catch(() => {}); return; }
  if (payload.action === "spine-result") { if (payload.result?.success && payload.targetUuid) remoteMosaics.delete(payload.targetUuid); const pending = waitingRequests.get(payload.requestId); if (pending) { waitingRequests.delete(payload.requestId); pending.resolve(payload.result); } return; }
  if (payload.action === "spine-finish" && activeGM()) {
    try { const result = await finishSpineMosaic(payload); globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result }); }
    catch (error) { globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result: { success: false, message: error.message ?? "The GM could not resolve the shelf." } }); }
  }
}
export function installSpineMosaicSocket() { if (socketInstalled || !globalThis.game?.socket?.on) return; globalThis.game.socket.on(SPINE_MOSAIC_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); }); socketInstalled = true; setTimeout(requestConfigs, 0); }
function requestFinish(targetUuid, order) {
  if (activeGM()) return finishSpineMosaic({ targetUuid, order });
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to complete the shelf." });
  const requestId = randomId();
  return new Promise(resolve => { const timeout = setTimeout(() => { waitingRequests.delete(requestId); resolve({ success: true, message: "The completed shelf is sent to the GM." }); }, 900); waitingRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } }); globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-finish", requestId, targetUuid, order: [...order], userId: globalThis.game?.user?.id }); });
}

function bookMarkup(config, order, selectedId, message) {
  const byId = new Map(config.books.map(book => [book.id, book]));
  const books = order.map(id => {
    const book = byId.get(id);
    const mosaicIndex = config.solution.indexOf(id);
    const position = config.solution.length > 1 ? (mosaicIndex / (config.solution.length - 1)) * 100 : 0;
    const imageStyle = book?.image ? `;--rw-spine-art:url("${escapeHTML(book.image)}")` : "";
    return `<button type="button" draggable="true" class="rw-spine-book ${book?.image ? "rw-spine-has-image" : ""} ${selectedId === id ? "is-selected" : ""}" data-spine-book="${escapeHTML(id)}" style="--rw-spine-count:${config.solution.length};--rw-spine-position:${position}%${imageStyle}" aria-label="${escapeHTML(book?.title ?? "Book")}"><i></i><span>${escapeHTML(book?.title ?? "Book")}</span></button>`;
  }).join("");
  return `<section class="rw-spine-mosaic" tabindex="0"><strong>Complete the picture.</strong><div class="rw-spine-shelf" aria-label="Bookshelf. Select two books to swap them, or drag a book into place.">${books}</div><div class="rw-spine-actions"><button type="button" data-spine-reset>Shuffle</button><button type="button" data-spine-submit>Check</button></div><p role="status">${escapeHTML(message || "Select two books to swap them.")}</p></section>`;
}
function createSpineDialog(DialogV2) { return class SpineMosaicDialog extends DialogV2 {
  constructor({ target, config, standalone = false }) { const order = [...shuffledSpineOrder(config, `${target.uuid}:${Date.now()}`)]; super({ classes: ["regionwright", "rw-spine-mosaic-dialog"], window: { title: "Spine Mosaic", icon: "fa-solid fa-book-open", resizable: false, minimizable: false }, position: { width: 600, height: 470 }, content: bookMarkup(config, order, null, ""), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] }); this.target = target; this.config = config; this.standalone = standalone; this.order = order; this.selectedId = null; this.message = ""; this.resolving = false; this.draggedId = null; this.listenerHost = null; this.releaseGuard = null; }
  _onRender(context, options) { super._onRender(context, options); this._bind(); rootFor(this)?.querySelector(".rw-spine-mosaic")?.focus?.(); this.bringToFront?.(); }
  _swap(first, second) { const a = this.order.indexOf(first); const b = this.order.indexOf(second); if (a < 0 || b < 0 || a === b) return; [this.order[a], this.order[b]] = [this.order[b], this.order[a]]; }
  _bind() { const root = rootFor(this); if (!root || root === this.listenerHost) return; this.listenerHost = root; root.addEventListener("click", event => { const book = event.target.closest?.("[data-spine-book]"); if (book && !this.resolving) { const id = book.dataset.spineBook; if (!this.selectedId) { this.selectedId = id; this._refresh("Choose another book to swap."); } else if (this.selectedId === id) { this.selectedId = null; this._refresh(); } else { this._swap(this.selectedId, id); this.selectedId = null; this._refresh(); } return; } if (event.target.closest?.("[data-spine-reset]")) { this.order = [...shuffledSpineOrder(this.config, `${this.target.uuid}:${Date.now()}`)]; this.selectedId = null; this._refresh("The books are mixed."); return; } if (event.target.closest?.("[data-spine-submit]")) void this._submit(); }); root.addEventListener("dragstart", event => { const book = event.target.closest?.("[data-spine-book]"); if (!book || this.resolving) return; this.draggedId = book.dataset.spineBook; event.dataTransfer?.setData("text/plain", this.draggedId); }); root.addEventListener("dragover", event => { if (event.target.closest?.("[data-spine-book]")) event.preventDefault(); }); root.addEventListener("drop", event => { const book = event.target.closest?.("[data-spine-book]"); if (!book || !this.draggedId || this.resolving) return; event.preventDefault(); this._swap(this.draggedId, book.dataset.spineBook); this.draggedId = null; this.selectedId = null; this._refresh(); }); this.releaseGuard ??= acquirePuzzleMovementGuard(); }
  async _submit() { if (this.resolving) return; if (!evaluateSpineOrder(this.config, this.order).success) { this._refresh("The picture does not line up yet."); return; } this.resolving = true; this._refresh("Opening the passage..."); const result = this.standalone ? { success: true, message: "The mosaic aligns." } : await requestFinish(this.target.uuid, this.order); if (result?.success) { globalThis.ui?.notifications?.info?.(result.message); await this.close(); return; } this.resolving = false; this._refresh(result?.message ?? "The shelf could not complete."); }
  _refresh(message = this.message) { this.message = message; const section = rootFor(this)?.querySelector(".rw-spine-mosaic"); if (section) section.outerHTML = bookMarkup(this.config, this.order, this.selectedId, message); }
  async close(options = {}) { this.releaseGuard?.(); this.releaseGuard = null; openDialogs.delete(this.target?.uuid); return super.close(options); }
}; }
export async function openSpineMosaicPuzzle(targetOrUuid) { const target = await resolveTarget(targetOrUuid); const data = normalizeMosaic(targetData(target)); if (!data || !isConfiguredTarget(target)) return null; const existing = openDialogs.get(target.uuid); if (existing) { existing.bringToFront?.(); return existing; } const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); const dialog = new (createSpineDialog(DialogV2))({ target, config: data.config }); openDialogs.set(target.uuid, dialog); dialog.render(true); return dialog; }

export async function openStandaloneSpineMosaicPuzzle({ seed = `${Date.now()}` } = {}) { const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); const target = { uuid: `Regionwright.Standalone.SpineMosaic.${seed}`, name: "Standalone Spine Mosaic", documentName: "Region" }; const config = createSpineMosaicConfig({ seed }); const dialog = new (createSpineDialog(DialogV2))({ target, config, standalone: true }); await dialog.render({ force: true }); return dialog; }
export async function handleSpineMosaicRegionEvent(region, event = {}) { const target = await resolveTarget(region); if (!isConfiguredTarget(target)) return null; const userId = event?.userId ?? event?.user?.id ?? event?.data?.userId ?? globalThis.game?.user?.id ?? null; if (!activeGM()) { globalThis.game?.socket?.emit?.(SPINE_MOSAIC_SOCKET, { action: "spine-region-event", targetUuid: target.uuid, recipientId: userId }); return null; } return openForUser(target.uuid, userId); }

function highlightTarget(uuid, active) { const placeable = [...(globalThis.canvas?.walls?.placeables ?? []), ...(globalThis.canvas?.tiles?.placeables ?? []), ...(globalThis.canvas?.regions?.placeables ?? [])].find(entry => entry.document?.uuid === uuid); if (placeable) placeable.hover = active; }
function availableTargets(type) { const scene = globalThis.canvas?.scene; if (type === "door") return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0); if (type === "tile") return [...(scene?.tiles ?? [])]; return [...(scene?.regions ?? [])]; }
function setupMarkup(state) { const typeButtons = SPINE_MOSAIC_TARGET_TYPES.map(type => `<button type="button" data-spine-type="${type}" class="${state.type === type ? "is-selected" : ""}">${type[0].toUpperCase() + type.slice(1)}</button>`).join(""); const targets = availableTargets(state.type).map(target => `<button type="button" data-spine-target="${escapeHTML(target.uuid)}" class="${state.targetUuid === target.uuid ? "is-selected" : ""}">${escapeHTML(targetLabel(target))}</button>`).join("") || `<p>No ${state.type}s are available on this Scene.</p>`; const books = state.books.map((book, index) => `<div class="rw-spine-setup-book"><input data-spine-title="${index}" value="${escapeHTML(book)}" aria-label="Book ${index + 1} title">${state.books.length > 4 ? `<button type="button" data-spine-remove="${index}" aria-label="Remove book ${index + 1}">−</button>` : ""}</div>`).join(""); return `<section class="rw-spine-setup"><p>Enter the books in picture order.</p><div class="rw-spine-target-types">${typeButtons}</div><div class="rw-spine-target-list">${targets}</div><div class="rw-spine-setup-books">${books}</div><button type="button" data-spine-add ${state.books.length >= 9 ? "disabled" : ""}>Add book</button><button type="button" data-spine-create ${state.targetUuid ? "" : "disabled"}>Create bookshelf</button></section>`; }
function createSetupDialog(DialogV2) { return class SpineMosaicSetup extends DialogV2 {
  constructor({ builder = null } = {}) { const books = ["Moon", "Crown", "Rose", "Key", "Star", "Wave"]; super({ classes: ["regionwright", "rw-spine-setup-dialog"], window: { title: "Spine Mosaic", icon: "fa-solid fa-book-open", resizable: false, minimizable: false }, position: { width: 510, height: 590 }, content: setupMarkup({ type: "door", targetUuid: null, books }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] }); this.builder = builder; this.state = { type: "door", targetUuid: null, books }; }
  _onRender(context, options) { super._onRender(context, options); const root = rootFor(this); root?.addEventListener("click", event => { const type = event.target.closest?.("[data-spine-type]"); const target = event.target.closest?.("[data-spine-target]"); const remove = event.target.closest?.("[data-spine-remove]"); if (type) { if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false); this.state.type = type.dataset.spineType; this.state.targetUuid = null; this._refresh(); return; } if (target) { if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false); this.state.targetUuid = target.dataset.spineTarget; highlightTarget(this.state.targetUuid, true); this._refresh(); return; } if (remove) { this.state.books.splice(Number(remove.dataset.spineRemove), 1); this._refresh(); return; } if (event.target.closest?.("[data-spine-add]")) { this.state.books.push(`Book ${this.state.books.length + 1}`); this._refresh(); return; } if (event.target.closest?.("[data-spine-create]")) void this._create(); }); root?.addEventListener("input", event => { const input = event.target.closest?.("[data-spine-title]"); if (input) this.state.books[Number(input.dataset.spineTitle)] = input.value; }); }
  _refresh() { const section = rootFor(this)?.querySelector(".rw-spine-setup"); if (section) section.outerHTML = setupMarkup(this.state); }
  async _create() { try { await configureSpineMosaic({ target: this.state.targetUuid, books: this.state.books }); globalThis.ui?.notifications?.info?.("Spine Mosaic added."); await this.close(); } catch (error) { globalThis.ui?.notifications?.error?.(error.message ?? "Unable to create Spine Mosaic."); } }
  async close(options = {}) { if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false); await this.builder?._restoreFromGuide?.(); return super.close(options); }
}; }
export function openSpineMosaicSetup({ builder = null } = {}) { const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); void builder?._minimizeForGuide?.(); const dialog = new (createSetupDialog(DialogV2))({ builder }); dialog.render(true); return dialog; }

export function installSpineMosaicDoorControl() { if (doorControlInstalled) return true; const Base = globalThis.CONFIG?.Canvas?.doorControlClass; if (!Base) return false; class SpineMosaicDoorControl extends Base { _onMouseDown(event) { const target = this.wall?.document; if (isConfiguredTarget(target) && globalThis.game?.user?.can?.("WALL_DOORS")) { event.stopPropagation(); void openSpineMosaicPuzzle(target).catch(() => {}); return false; } return super._onMouseDown(event); } } globalThis.CONFIG.Canvas.doorControlClass = SpineMosaicDoorControl; doorControlInstalled = true; for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); } return true; }
export function installSpineMosaicTileControl() { if (tileControlInstalled) return true; const prototype = globalThis.CONFIG?.Tile?.objectClass?.prototype; const original = prototype?._onClickLeft; if (typeof original !== "function") return false; prototype._onClickLeft = function SpineMosaicTileClick(event) { if (isConfiguredTarget(this.document)) { event?.stopPropagation?.(); void openSpineMosaicPuzzle(this.document).catch(() => {}); return false; } return original.call(this, event); }; tileControlInstalled = true; return true; }
export const previewSpineMosaic = (config, order) => evaluateSpineOrder(config, order);


