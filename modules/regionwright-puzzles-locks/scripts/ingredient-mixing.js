import { MODULE_ID, PUZZLE_FLAG_SCOPE, PUZZLE_WRITE_SETTING, regionWritesEnabled } from "./constants.js";
import { acquirePuzzleMovementGuard } from "./puzzle-input.js";
import { INGREDIENT_MIXING_VERSION, INGREDIENT_TARGET_TYPES, createIngredientMixingConfig, evaluateIngredientMix, validateIngredientMixingConfig } from "./ingredient-mixing-engine.js";

export const INGREDIENT_MIXING_FLAG = "ingredientMixing";
export const INGREDIENT_MIXING_SOCKET = `module.${MODULE_ID}`;

const openDialogs = new Map();
const remoteMixes = new Map();
const waitingRequests = new Map();
let socketInstalled = false;
let doorControlInstalled = false;
let tileControlInstalled = false;

const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const clone = value => structuredClone(value);
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const rootFor = application => application?.element?.[0] ?? application?.element ?? null;
const doorStates = () => globalThis.CONST?.WALL_DOOR_STATES ?? { CLOSED: 0, OPEN: 1, LOCKED: 2 };

function activeGM() { const gm = globalThis.game?.users?.activeGM; return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id)); }
function targetType(target) { return target?.documentName === "Wall" ? "door" : target?.documentName === "Tile" ? "tile" : target?.documentName === "Region" ? "region" : null; }
function targetLabel(target) { return String(target?.name ?? "").trim() || `${targetType(target) === "door" ? "Door" : targetType(target) === "tile" ? "Tile" : "Region"} ${String(target?.id ?? "").slice(0, 5)}`; }
function targetData(target) { return target?.getFlag?.(PUZZLE_FLAG_SCOPE, INGREDIENT_MIXING_FLAG) ?? target?.flags?.[PUZZLE_FLAG_SCOPE]?.[INGREDIENT_MIXING_FLAG] ?? remoteMixes.get(target?.uuid) ?? null; }
function normalizeMix(data) {
  if (!data || typeof data !== "object" || Number(data.version) !== INGREDIENT_MIXING_VERSION || !data.config || !data.persistent) return null;
  try { return { version: INGREDIENT_MIXING_VERSION, config: validateIngredientMixingConfig(data.config), persistent: clone(data.persistent) }; } catch (_error) { return null; }
}
function isConfiguredTarget(target) {
  const type = targetType(target); const data = normalizeMix(targetData(target));
  if (!type || !data || data.persistent.status !== "locked") return false;
  return type !== "door" || Number(target?.ds) === doorStates().LOCKED || (!globalThis.game?.user?.isGM && remoteMixes.has(target.uuid));
}
async function resolveTarget(targetOrUuid) {
  if (targetType(targetOrUuid)) return targetOrUuid;
  const uuid = String(targetOrUuid ?? "").trim();
  const target = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  const type = targetType(target);
  if (!target || !INGREDIENT_TARGET_TYPES.includes(type) || (type === "door" && Number(target.door ?? 0) <= 0)) throw new Error("Choose a Door, Tile, or Region.");
  return target;
}
function requireWrite(target) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure Ingredient Mixing.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, PUZZLE_WRITE_SETTING) !== true) throw new Error("Enable Regionwright Puzzle writes before creating Ingredient Mixing.");
  if (targetType(target) === "region" && !regionWritesEnabled()) throw new Error("Enable Regionwright: Studio Region writes before placing Ingredient Mixing on a Region.");
}
function regionBehaviorData() {
  return { type: "executeScript", system: { events: ["tokenEnter"], source: `await game.modules.get("${MODULE_ID}")?.api?.ingredientMixing?.handleRegionEvent(region, event);` }, flags: { [PUZZLE_FLAG_SCOPE]: { [INGREDIENT_MIXING_FLAG]: { region: true } } } };
}
function ownedBehavior(behavior) { return Boolean(behavior?.flags?.[PUZZLE_FLAG_SCOPE]?.[INGREDIENT_MIXING_FLAG]?.region); }

export function createIngredientMixingPuzzleConfig(options = {}) { return createIngredientMixingConfig(options); }
export function isIngredientMixingTarget(target) { return Boolean(normalizeMix(targetData(target))); }

export async function configureIngredientMixing({ target: targetOrUuid, ingredients, tolerance = 0 } = {}) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  const config = createIngredientMixingPuzzleConfig({ ingredients, tolerance });
  const data = { version: INGREDIENT_MIXING_VERSION, config, persistent: { status: "locked", solvedAt: null, lastUpdatedAt: Date.now() } };
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${INGREDIENT_MIXING_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().LOCKED;
  await target.update(updates);
  if (targetType(target) === "region") {
    const behavior = Array.from(target.behaviors ?? []).find(ownedBehavior);
    if (behavior) await target.updateEmbeddedDocuments("RegionBehavior", [{ _id: behavior.id, ...regionBehaviorData() }]);
    else await target.createEmbeddedDocuments("RegionBehavior", [regionBehaviorData()]);
  }
  globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-config", targetUuid: target.uuid, data: clone(data) });
  return { target, config, data };
}

export async function clearIngredientMixing(targetOrUuid) {
  const target = await resolveTarget(targetOrUuid);
  requireWrite(target);
  if (targetType(target) === "region") {
    const ids = Array.from(target.behaviors ?? []).filter(ownedBehavior).map(entry => entry.id).filter(Boolean);
    if (ids.length) await target.deleteEmbeddedDocuments("RegionBehavior", ids);
  }
  await target.update({ [`flags.${PUZZLE_FLAG_SCOPE}.${INGREDIENT_MIXING_FLAG}`]: null });
  remoteMixes.delete(target.uuid);
  return target;
}

async function finishIngredientMixing({ targetUuid, amounts } = {}) {
  const target = await resolveTarget(targetUuid);
  const data = normalizeMix(targetData(target));
  if (!data || !isConfiguredTarget(target)) return { success: false, message: "That mixture is no longer available." };
  if (!evaluateIngredientMix(data.config, amounts).success) return { success: false, message: "The mixture is not balanced." };
  data.persistent.status = "solved"; data.persistent.solvedAt = Date.now(); data.persistent.lastUpdatedAt = Date.now();
  const updates = { [`flags.${PUZZLE_FLAG_SCOPE}.${INGREDIENT_MIXING_FLAG}`]: data };
  if (targetType(target) === "door") updates.ds = doorStates().CLOSED;
  await target.update(updates);
  return { success: true, message: targetType(target) === "door" ? "The reaction unlocks the Door." : "The mixture is complete." };
}

function sceneTargets() {
  const scene = globalThis.canvas?.scene;
  return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0).concat([...(scene?.tiles ?? [])], [...(scene?.regions ?? [])]);
}
function requestConfigs() { if (!globalThis.game?.user?.isGM) globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-request-config", userId: globalThis.game?.user?.id }); }
async function openForUser(targetUuid, recipientId = null) {
  if (!recipientId || recipientId === globalThis.game?.user?.id) return openIngredientMixingPuzzle(targetUuid);
  globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-open", targetUuid, recipientId });
  return null;
}
async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "ingredient-config" && (!payload.recipientId || payload.recipientId === globalThis.game?.user?.id)) { if (payload.targetUuid && normalizeMix(payload.data)) remoteMixes.set(payload.targetUuid, clone(payload.data)); return; }
  if (payload.action === "ingredient-request-config" && activeGM()) {
    const recipientId = payload.userId ?? senderId;
    for (const target of sceneTargets()) { const data = normalizeMix(targetData(target)); if (data?.persistent?.status === "locked") globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-config", recipientId, targetUuid: target.uuid, data: clone(data) }); }
    return;
  }
  if (payload.action === "ingredient-region-event" && activeGM()) { void openForUser(payload.targetUuid, payload.recipientId ?? senderId).catch(() => {}); return; }
  if (payload.action === "ingredient-open" && payload.recipientId === globalThis.game?.user?.id) { void openIngredientMixingPuzzle(payload.targetUuid).catch(() => {}); return; }
  if (payload.action === "ingredient-result") { if (payload.result?.success && payload.targetUuid) remoteMixes.delete(payload.targetUuid); const pending = waitingRequests.get(payload.requestId); if (pending) { waitingRequests.delete(payload.requestId); pending.resolve(payload.result); } return; }
  if (payload.action === "ingredient-finish" && activeGM()) {
    try { const result = await finishIngredientMixing(payload); globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result }); }
    catch (error) { globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, targetUuid: payload.targetUuid, result: { success: false, message: error.message ?? "The GM could not resolve the mixture." } }); }
  }
}
export function installIngredientMixingSocket() { if (socketInstalled || !globalThis.game?.socket?.on) return; globalThis.game.socket.on(INGREDIENT_MIXING_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); }); socketInstalled = true; setTimeout(requestConfigs, 0); }
function requestFinish(targetUuid, amounts) {
  if (activeGM()) return finishIngredientMixing({ targetUuid, amounts });
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to complete the mixture." });
  const requestId = randomId();
  return new Promise(resolve => { const timeout = setTimeout(() => { waitingRequests.delete(requestId); resolve({ success: true, message: "The mixture is sent to the GM." }); }, 900); waitingRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } }); globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-finish", requestId, targetUuid, amounts: clone(amounts), userId: globalThis.game?.user?.id }); });
}

function puzzleMarkup(config, amounts, message = "", tossedIndex = null) {
  const jars = config.ingredients.map((ingredient, index) => {
    const amount = amounts[ingredient.id] ?? 0;
    return `<button type="button" class="rw-mix-jar rw-mix-jar--${index}" data-mix-ingredient="${escapeHTML(ingredient.id)}" aria-label="Add ${escapeHTML(ingredient.name)}. Current amount ${amount}; target ${ingredient.target}. Shift-click removes one."><span>${escapeHTML(ingredient.name)}</span><i style="--rw-mix-fill:${amount * 10}%;--rw-mix-target:${ingredient.target * 10}%"><b>${amount}/${ingredient.target}</b></i><small class="rw-mix-target-label">Target ${ingredient.target}</small></button>`;
  }).join("");
  const toss = Number.isInteger(tossedIndex) ? `<i class="rw-mix-toss rw-mix-toss--${tossedIndex}"></i>` : "";
  return `<section class="rw-ingredient-mixing" tabindex="0"><header><strong>Balance the mix.</strong><span>${config.ingredients.length} ingredients</span></header><div class="rw-mix-scene"><div class="rw-mix-cauldron"><i></i><b></b>${toss}</div></div><div class="rw-mix-jars">${jars}</div><div class="rw-mix-actions"><button type="button" data-mix-empty>Empty</button><button type="button" data-mix-submit>Mix</button></div><p role="status">${escapeHTML(message || "Click an ingredient to toss it in. Shift-click removes one.")}</p></section>`;
}
function createMixDialog(DialogV2) { return class IngredientMixingDialog extends DialogV2 {
  constructor({ target, config, standalone = false }) { const amounts = Object.fromEntries(config.ingredients.map(ingredient => [ingredient.id, 0])); super({ classes: ["regionwright", "rw-ingredient-mixing-dialog"], window: { title: "Ingredient Mixing", icon: "fa-solid fa-flask", resizable: false, minimizable: false }, position: { width: 460, height: 620 }, content: puzzleMarkup(config, amounts), buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }] }); this.target = target; this.config = config; this.standalone = standalone; this.amounts = amounts; this.message = ""; this.tossedIndex = null; this.resolving = false; this.listenerHost = null; this.releaseGuard = null; }
  _onRender(context, options) { super._onRender(context, options); this._bind(); rootFor(this)?.querySelector(".rw-ingredient-mixing")?.focus?.(); this.bringToFront?.(); }
  _bind() { const root = rootFor(this); if (!root || root === this.listenerHost) return; this.listenerHost = root; root.addEventListener("click", event => { const jar = event.target.closest?.("[data-mix-ingredient]"); if (jar && !this.resolving) { const index = this.config.ingredients.findIndex(ingredient => ingredient.id === jar.dataset.mixIngredient); this.amounts[jar.dataset.mixIngredient] = Math.max(0, Math.min(10, Number(this.amounts[jar.dataset.mixIngredient] ?? 0) + (event.shiftKey ? -1 : 1))); this.tossedIndex = index; this._refresh(); return; } if (event.target.closest?.("[data-mix-empty]")) { for (const ingredient of this.config.ingredients) this.amounts[ingredient.id] = 0; this.tossedIndex = null; this._refresh("The cauldron is empty."); return; } if (event.target.closest?.("[data-mix-submit]")) void this._submit(); }); this.releaseGuard ??= acquirePuzzleMovementGuard(); }
  async _submit() { if (this.resolving) return; const evaluation = evaluateIngredientMix(this.config, this.amounts); if (!evaluation.success) { this.message = "Not balanced. Adjust the mix."; this._refresh(); return; } this.resolving = true; this._refresh("Completing…"); const result = this.standalone ? { success: true, message: "The mixture is balanced." } : await requestFinish(this.target.uuid, this.amounts); if (result?.success) { globalThis.ui?.notifications?.info?.(result.message); await this.close(); return; } this.resolving = false; this._refresh(result?.message ?? "The mixture could not complete."); }
  _refresh(message = this.message) { this.message = message; const section = rootFor(this)?.querySelector(".rw-ingredient-mixing"); if (section) section.outerHTML = puzzleMarkup(this.config, this.amounts, message, this.tossedIndex); }
  async close(options = {}) { this.releaseGuard?.(); this.releaseGuard = null; openDialogs.delete(this.target?.uuid); return super.close(options); }
}; }
export async function openIngredientMixingPuzzle(targetOrUuid) { const target = await resolveTarget(targetOrUuid); const data = normalizeMix(targetData(target)); if (!data || !isConfiguredTarget(target)) return null; const existing = openDialogs.get(target.uuid); if (existing) { existing.bringToFront?.(); return existing; } const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); const dialog = new (createMixDialog(DialogV2))({ target, config: data.config }); openDialogs.set(target.uuid, dialog); dialog.render(true); return dialog; }

export async function openStandaloneIngredientMixingPuzzle({ seed = `${Date.now()}` } = {}) { const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); const target = { uuid: `Regionwright.Standalone.IngredientMixing.${seed}`, name: "Standalone Ingredient Mixing", documentName: "Region" }; const config = createIngredientMixingPuzzleConfig({ seed }); const dialog = new (createMixDialog(DialogV2))({ target, config, standalone: true }); await dialog.render({ force: true }); return dialog; }

export async function handleRegionEvent(region, event = {}) { const target = await resolveTarget(region); if (!isConfiguredTarget(target)) return null; const userId = event?.userId ?? event?.user?.id ?? event?.data?.userId ?? globalThis.game?.user?.id ?? null; if (!activeGM()) { globalThis.game?.socket?.emit?.(INGREDIENT_MIXING_SOCKET, { action: "ingredient-region-event", targetUuid: target.uuid, recipientId: userId }); return null; } return openForUser(target.uuid, userId); }
function highlightTarget(uuid, active) { const placeable = [...(globalThis.canvas?.walls?.placeables ?? []), ...(globalThis.canvas?.tiles?.placeables ?? []), ...(globalThis.canvas?.regions?.placeables ?? [])].find(entry => entry.document?.uuid === uuid); if (placeable) placeable.hover = active; }
function availableTargets(type) { const scene = globalThis.canvas?.scene; if (type === "door") return [...(scene?.walls ?? [])].filter(wall => Number(wall.door ?? 0) > 0); if (type === "tile") return [...(scene?.tiles ?? [])]; return [...(scene?.regions ?? [])]; }
function setupMarkup(state) { const types = INGREDIENT_TARGET_TYPES.map(type => `<button type="button" data-mix-target-type="${type}" class="${state.type === type ? "is-selected" : ""}">${type[0].toUpperCase() + type.slice(1)}</button>`).join(""); const targets = availableTargets(state.type).map(target => `<button type="button" data-mix-target="${escapeHTML(target.uuid)}" class="${state.targetUuid === target.uuid ? "is-selected" : ""}">${escapeHTML(targetLabel(target))}</button>`).join("") || "<p>No ${state.type}s are available on this Scene.</p>"; const ingredients = state.ingredients.map((ingredient, index) => `<div class="rw-mix-setup-ingredient"><input data-mix-name="${index}" value="${escapeHTML(ingredient.name)}" aria-label="Ingredient ${index + 1} name"><input data-mix-target="${index}" type="number" min="0" max="10" value="${ingredient.target}" aria-label="Ingredient ${index + 1} recipe amount">${state.ingredients.length > 2 ? `<button type="button" data-mix-remove="${index}" aria-label="Remove ingredient ${index + 1}">−</button>` : ""}</div>`).join(""); return `<section class="rw-mix-setup"><div class="rw-mix-target-types">${types}</div><div class="rw-mix-target-list">${targets}</div><div class="rw-mix-setup-ingredients">${ingredients}</div><button type="button" data-mix-add ${state.ingredients.length >= 4 ? "disabled" : ""}>Add ingredient</button><button type="button" data-mix-create ${state.targetUuid ? "" : "disabled"}>Create mixing puzzle</button></section>`; }
function createSetupDialog(DialogV2) {
  return class IngredientMixingSetup extends DialogV2 {
    constructor({ builder = null } = {}) {
      const ingredients = [{ name: "Moonwater", target: 4 }, { name: "Ember Salt", target: 6 }, { name: "Nightshade", target: 3 }];
      super({ classes: ["regionwright", "rw-mix-setup-dialog"], window: { title: "Ingredient Mixing", icon: "fa-solid fa-flask", resizable: false, minimizable: false }, position: { width: 500, height: 580 }, content: setupMarkup({ type: "region", targetUuid: null, ingredients }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
      this.builder = builder;
      this.state = { type: "region", targetUuid: null, ingredients };
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = rootFor(this);
      root?.addEventListener("click", event => {
        const type = event.target.closest?.("[data-mix-target-type]");
        const target = event.target.closest?.("button[data-mix-target]");
        const remove = event.target.closest?.("[data-mix-remove]");
        if (type) {
          if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false);
          this.state.type = type.dataset.mixTargetType;
          this.state.targetUuid = null;
          this._refresh();
          return;
        }
        if (target) {
          if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false);
          this.state.targetUuid = target.dataset.mixTarget;
          highlightTarget(this.state.targetUuid, true);
          this._refresh();
          return;
        }
        if (remove) {
          this.state.ingredients.splice(Number(remove.dataset.mixRemove), 1);
          this._refresh();
          return;
        }
        if (event.target.closest?.("[data-mix-add]")) {
          this.state.ingredients.push({ name: `Ingredient ${this.state.ingredients.length + 1}`, target: 5 });
          this._refresh();
          return;
        }
        if (event.target.closest?.("[data-mix-create]")) void this._create();
      });
      root?.addEventListener("input", event => {
        const name = event.target.closest?.("[data-mix-name]");
        const amount = event.target.closest?.("input[data-mix-target]");
        if (name) this.state.ingredients[Number(name.dataset.mixName)].name = name.value;
        if (amount) this.state.ingredients[Number(amount.dataset.mixTarget)].target = Number(amount.value);
      });
    }
    _refresh() { const section = rootFor(this)?.querySelector(".rw-mix-setup"); if (section) section.outerHTML = setupMarkup(this.state); }
    async _create() {
      try {
        await configureIngredientMixing({ target: this.state.targetUuid, ingredients: this.state.ingredients });
        globalThis.ui?.notifications?.info?.("Ingredient Mixing added.");
        await this.close();
      } catch (error) { globalThis.ui?.notifications?.error?.(error.message ?? "Unable to create Ingredient Mixing."); }
    }
    async close(options = {}) {
      if (this.state.targetUuid) highlightTarget(this.state.targetUuid, false);
      await this.builder?._restoreFromGuide?.();
      return super.close(options);
    }
  };
}
export function openIngredientMixingSetup({ builder = null } = {}) { const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2; if (!DialogV2) throw new Error("Foundry's dialog system is unavailable."); void builder?._minimizeForGuide?.(); const dialog = new (createSetupDialog(DialogV2))({ builder }); dialog.render(true); return dialog; }

export function installIngredientMixingDoorControl() { if (doorControlInstalled) return true; const Base = globalThis.CONFIG?.Canvas?.doorControlClass; if (!Base) return false; class IngredientDoorControl extends Base { _onMouseDown(event) { const target = this.wall?.document; if (isConfiguredTarget(target) && globalThis.game?.user?.can?.("WALL_DOORS")) { event.stopPropagation(); void openIngredientMixingPuzzle(target).catch(() => {}); return false; } return super._onMouseDown(event); } } globalThis.CONFIG.Canvas.doorControlClass = IngredientDoorControl; doorControlInstalled = true; for (const wall of globalThis.canvas?.walls?.placeables ?? []) { wall.clearDoorControl?.(); wall.createDoorControl?.(); } return true; }
export function installIngredientMixingTileControl() { if (tileControlInstalled) return true; const prototype = globalThis.CONFIG?.Tile?.objectClass?.prototype; const original = prototype?._onClickLeft; if (typeof original !== "function") return false; prototype._onClickLeft = function IngredientMixingTileClick(event) { if (isConfiguredTarget(this.document)) { event?.stopPropagation?.(); void openIngredientMixingPuzzle(this.document).catch(() => {}); return false; } return original.call(this, event); }; tileControlInstalled = true; return true; }
export function previewIngredientMixing(config, amounts = {}) { return evaluateIngredientMix(config, amounts); }


