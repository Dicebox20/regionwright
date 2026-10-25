const MODULE_ID = "regionwright-hunting-gathering";
const LEGACY_MODULE_ID = "regionwright-fishing";
const HISTORICAL_MODULE_ID = "regionwright";
const TEST_ANGEL = Object.freeze({
  documentName: "Actor",
  uuid: "Actor.regionwright-hunting-gathering-fishing-test",
  name: "Test Angler"
});
const TEST_POND = Object.freeze({
  documentName: "Region",
  uuid: "Scene.regionwright-hunting-gathering-fishing-test.Region.test-pond",
  name: "Test Pond",
  getFlag: () => null
});
import {
  FISHING_REGION_FLAG,
  FISHING_SOCKET,
  DEFAULT_FISH,
  DEFAULT_FISHING_POLE_NAME,
  DEFAULT_FISHING_TACKLE_NAME,
  advanceFishingFight,
  chooseFishForSeed,
  createFishItemSource,
  createFishingCatalog,
  createFishingChallenge,
  createFishingFightState,
  createFishingSpotConfig,
  fishFlag,
  rollFishMarketValue,
  validateFishingSpotConfig
} from "./fishing-engine.js";
import { FISHING_BIOMES } from "./fishing-catalog.js";
import { FISH_RARITIES, normalizeFishRarity } from "./fishing-rarity.js";

export { FISHING_REGION_FLAG, FISHING_SOCKET };

const openDialogs = new Map();
const waitingRequests = new Map();
const pendingFishingTests = new Map();
let socketInstalled = false;
let fishingContainerGuardInstalled = false;
let regionInteractionInstalled = false;
let regionLayerInteractionInstalled = false;
const fishingRegionPointerTapInstalled = new WeakSet();
const fishingRegionLayerState = new WeakMap();
const TEST_FISH_BY_RARITY = new Map(FISH_RARITIES.map(rarity => [
  rarity,
  Object.values(FISHING_BIOMES).flatMap(biome => biome.fish).find(fish => fish.rarity === rarity) ?? null
]));

const clone = value => structuredClone(value);
const rootFor = application => application?.element?.[0] ?? application?.element ?? null;
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const FISHING_TACKLE_FLAG = "fishingTackle";
const FISHING_TACKLE_FLAG_VERSION = 1;
const FISHING_TACKLE_MARKER = "Regionwright fishing-only tackle box";
const FISHING_GEAR_NAME_PATTERN = /(?:fishing|bait|lure|hook|line|rod|pole|reel|net|float|bobber|minnow|worm|grub|leech|roe|shrimp|squid|chum|crayfish|frog|insect|cricket|dough|cheese|scrap|stonefly|glowworm|fungus)/i;

const fishingMovementGuards = [];
let fishingMovementListenerHost = null;

function isFishingMovementKey(event) {
  return ["KeyW", "KeyA", "KeyS", "KeyD"].includes(event?.code)
    || ["W", "A", "S", "D"].includes(String(event?.key ?? "").toUpperCase());
}

function handleFishingMovement(event) {
  if (!fishingMovementGuards.length || !isFishingMovementKey(event)) return;
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
}

function acquireFishingMovementGuard() {
  const host = globalThis.window;
  fishingMovementGuards.push(true);
  globalThis.game?.keyboard?.releaseKeys?.({ force: true });
  if (host?.addEventListener && fishingMovementListenerHost !== host) {
    fishingMovementListenerHost?.removeEventListener?.("keydown", handleFishingMovement, true);
    fishingMovementListenerHost?.removeEventListener?.("keyup", handleFishingMovement, true);
    host.addEventListener("keydown", handleFishingMovement, true);
    host.addEventListener("keyup", handleFishingMovement, true);
    fishingMovementListenerHost = host;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    fishingMovementGuards.pop();
    if (!fishingMovementGuards.length && fishingMovementListenerHost) {
      fishingMovementListenerHost.removeEventListener?.("keydown", handleFishingMovement, true);
      fishingMovementListenerHost.removeEventListener?.("keyup", handleFishingMovement, true);
      fishingMovementListenerHost = null;
    }
  };
}

function collectionDocuments(collection) {
  return Array.from(collection?.values?.() ?? collection ?? []);
}

function actorItems(actor) {
  return collectionDocuments(actor?.items);
}

function itemName(item) {
  return String(item?.name ?? "").trim();
}

function isFlagScopeActive(scope) {
  const game = globalThis.game;
  return scope === "core"
    || scope === "world"
    || scope === game?.system?.id
    || game?.modules?.get?.(scope)?.active === true;
}

function itemFlag(item, scope, key) {
  const stored = item?.flags?.[scope]?.[key]
    ?? item?._source?.flags?.[scope]?.[key];
  if (stored !== undefined) return stored;
  if (!isFlagScopeActive(scope)) return null;
  try {
    return item?.getFlag?.(scope, key) ?? null;
  } catch (_error) {
    return null;
  }
}

function itemType(item) {
  return String(item?.type ?? item?._source?.type ?? "").trim().toLowerCase();
}

export function isFishingTackle(item, config = {}) {
  const requestedName = String(config?.tackleItemName ?? DEFAULT_FISHING_TACKLE_NAME).trim().toLocaleLowerCase();
  const nameMatches = requestedName && itemName(item).toLocaleLowerCase() === requestedName;
  return Boolean(itemFlag(item, MODULE_ID, FISHING_TACKLE_FLAG)
    || itemFlag(item, LEGACY_MODULE_ID, FISHING_TACKLE_FLAG)
    || itemFlag(item, HISTORICAL_MODULE_ID, FISHING_TACKLE_FLAG)
    || nameMatches);
}

export function isFishingGearItem(item, config = {}) {
  if (!item || isFishingTackle(item, config) || itemType(item) === "container") return false;
  const baitFlag = itemFlag(item, MODULE_ID, "bait")
    ?? itemFlag(item, LEGACY_MODULE_ID, "bait")
    ?? itemFlag(item, HISTORICAL_MODULE_ID, "bait");
  if (baitFlag?.baitId) return true;
  const names = [config?.poleItemName ?? DEFAULT_FISHING_POLE_NAME, config?.baitItemName ?? "Bait"]
    .map(value => String(value ?? "").trim().toLocaleLowerCase())
    .filter(Boolean);
  const normalizedName = itemName(item).toLocaleLowerCase();
  return names.includes(normalizedName) || FISHING_GEAR_NAME_PATTERN.test(itemName(item));
}

function itemContainerId(item) {
  return item?.system?.container ?? item?._source?.system?.container ?? null;
}

export function isFishingItemContainedIn(item, container) {
  const itemContainer = itemContainerId(item);
  const containerId = container?.id ?? container?._id ?? null;
  return Boolean(itemContainer && containerId && String(itemContainer) === String(containerId));
}

function findFishingTackle(actor, config = {}) {
  return actorItems(actor).find(item => isFishingTackle(item, config)) ?? null;
}

function findActorItem(actor, itemOrUuid) {
  if (itemOrUuid?.documentName === "Item") return itemOrUuid;
  const requested = String(itemOrUuid ?? "").trim();
  if (!requested) return null;
  return actorItems(actor).find(item => String(item.uuid ?? "") === requested || String(item.id ?? "") === requested) ?? null;
}

function namedItem(actor, name) {
  const requested = String(name ?? "").trim().toLocaleLowerCase();
  return actorItems(actor).find(item => itemName(item).toLocaleLowerCase() === requested)
    ?? actorItems(actor).find(item => itemName(item).toLocaleLowerCase().includes(requested));
}

function itemQuantity(item) {
  const raw = item?.system?.quantity ?? item?.quantity;
  if (raw === undefined || raw === null || raw === "") return 1;
  return Math.max(0, Number(raw) || 0);
}

function canModifyActor(actor) {
  if (globalThis.game?.user?.isGM) return true;
  if (actor?.isOwner === true) return true;
  return actor?.testUserPermission?.(globalThis.game?.user, "OWNER") === true;
}

function changedContainerValue(source) {
  if (!source || typeof source !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(source, "system.container")) return source["system.container"];
  if (Object.prototype.hasOwnProperty.call(source.system ?? {}, "container")) return source.system.container;
  return undefined;
}

function containerFor(actor, containerId) {
  const requested = String(containerId ?? "").trim();
  if (!requested) return null;
  return actorItems(actor).find(item => String(item?.id ?? item?._id ?? "") === requested) ?? null;
}

function rejectInvalidFishingTackleContents(item, containerId) {
  const actor = item?.actor ?? item?.parent ?? null;
  if (!containerId || !actor) return true;
  const container = containerFor(actor, containerId);
  if (!container || !isFishingTackle(container)) return true;
  if (isFishingGearItem(item)) return true;
  globalThis.ui?.notifications?.warn?.("Fishing Tackle only holds fishing gear.");
  return false;
}

/** Install the native dnd5e containment guard for optional Fishing Tackle bags. */
export function installFishingContainerGuard() {
  if (fishingContainerGuardInstalled || !globalThis.Hooks?.on) return false;
  globalThis.Hooks.on("preCreateItem", (item, data) => rejectInvalidFishingTackleContents(item, changedContainerValue(data)));
  globalThis.Hooks.on("preUpdateItem", (item, changes) => rejectInvalidFishingTackleContents(item, changedContainerValue(changes)));
  fishingContainerGuardInstalled = true;
  return true;
}

/** Mark an actor's optional Fishing Tackle as a native dnd5e container. */
export async function prepareFishingTackle({ actor: actorOrUuid, item: itemOrUuid } = {}) {
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before preparing Fishing Tackle.");
  if (!canModifyActor(actor)) throw new Error("You do not have permission to prepare this actor's Fishing Tackle.");
  const item = findActorItem(actor, itemOrUuid) ?? findFishingTackle(actor);
  if (!item) return null;
  const updates = {};
  const existingFlag = itemFlag(item, MODULE_ID, FISHING_TACKLE_FLAG);
  if (!existingFlag || existingFlag.version !== FISHING_TACKLE_FLAG_VERSION || existingFlag.exclusive !== "fishing-gear") {
    updates[`flags.${MODULE_ID}.${FISHING_TACKLE_FLAG}`] = {
      version: FISHING_TACKLE_FLAG_VERSION,
      exclusive: "fishing-gear"
    };
  }
  if (itemType(item) !== "container") updates.type = "container";
  const description = String(item?.system?.description?.value ?? "");
  if (!description.includes(FISHING_TACKLE_MARKER)) {
    updates["system.description.value"] = `${description}${description ? "<hr>" : ""}<p><em>${FISHING_TACKLE_MARKER}: this optional bag accepts fishing gear only.</em></p>`;
  }
  if (Object.keys(updates).length && typeof item.update === "function") await item.update(updates);
  return item;
}

function activeGM() {
  const gm = globalThis.game?.users?.activeGM;
  return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id));
}

async function resolveUuid(uuid) {
  if (!uuid) return null;
  return globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid) ?? null;
}

async function resolveRegion(regionOrUuid) {
  if (regionOrUuid?.documentName === "Region") return regionOrUuid;
  const region = await resolveUuid(regionOrUuid);
  if (!region || region.documentName !== "Region") throw new Error("Choose a fishing Region first.");
  return region;
}

async function resolveActor(actorOrUuid) {
  if (actorOrUuid?.documentName === "Actor") return actorOrUuid;
  if (actorOrUuid) {
    const actor = await resolveUuid(actorOrUuid);
    if (actor?.documentName === "Actor") return actor;
  }
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor
    ?? globalThis.game?.user?.character
    ?? null;
}

function selectedFishingActor() {
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor
    ?? globalThis.game?.user?.character
    ?? null;
}

function documentFlag(document, scope, key) {
  const stored = document?.flags?.[scope]?.[key]
    ?? document?._source?.flags?.[scope]?.[key];
  if (stored !== undefined) return stored;
  if (!isFlagScopeActive(scope)) return null;
  try {
    return document?.getFlag?.(scope, key) ?? null;
  } catch (_error) {
    return null;
  }
}

function regionFishingData(region) {
  const raw = documentFlag(region, MODULE_ID, FISHING_REGION_FLAG)
    ?? documentFlag(region, LEGACY_MODULE_ID, FISHING_REGION_FLAG)
    ?? documentFlag(region, HISTORICAL_MODULE_ID, FISHING_REGION_FLAG);
  if (!raw) return null;
  try { return validateFishingSpotConfig(raw); } catch (_error) { return null; }
}

export function isFishingRegion(region) {
  return Boolean(regionFishingData(region));
}

function fishingKey(region, actor) {
  return `${region?.uuid ?? "region"}:${actor?.uuid ?? actor?.id ?? "actor"}`;
}

function sendSocket(payload) {
  globalThis.game?.socket?.emit?.(FISHING_SOCKET, payload);
}

async function consumeBaitDirect(actor, config) {
  const bait = namedItem(actor, config.baitItemName);
  if (!bait || itemQuantity(bait) < 1) return { success: false, message: `You need at least one ${config.baitItemName}.` };
  const quantity = itemQuantity(bait);
  if (quantity > 1) await bait.update({ "system.quantity": quantity - 1 });
  else if (typeof bait.delete === "function") await bait.delete();
  else await bait.update({ "system.quantity": 0 });
  return { success: true, remaining: Math.max(0, quantity - 1) };
}

function fishFromConfig(config, fishId) {
  return config.fish.find(fish => fish.id === String(fishId ?? "")) ?? null;
}

async function awardFishDirect(actor, fish) {
  const { value: marketValue, formula: marketValueFormula } = rollFishMarketValue(fish.rarity);
  const existing = actorItems(actor).find(item => {
    const flag = fishFlag(item);
    return flag?.fishId === fish.id && Number(flag.marketValue ?? item.system?.price?.value ?? 0) === marketValue;
  });
  if (existing) {
    const quantity = itemQuantity(existing) + 1;
    await existing.update({ "system.quantity": quantity });
    return { success: true, itemName: fish.name, quantity, stacked: true, marketValue, marketValueFormula };
  }
  const created = await actor.createEmbeddedDocuments("Item", [createFishItemSource(fish, { marketValue, marketValueFormula })]);
  return { success: true, itemName: fish.name, quantity: 1, item: created?.[0] ?? null, marketValue, marketValueFormula };
}

function requestGM(action, { actorUuid, regionUuid, fishId } = {}) {
  if (!globalThis.game?.users?.activeGM) return Promise.resolve({ success: false, message: "A GM must be connected to resolve fishing rewards." });
  installFishingSocket();
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      waitingRequests.delete(requestId);
      resolve({ success: false, message: "The active GM did not respond to the fishing request." });
    }, 7000);
    waitingRequests.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); } });
    sendSocket({ action, requestId, actorUuid, regionUuid, fishId, userId: globalThis.game?.user?.id });
  });
}

async function consumeBait(actor, region, config) {
  if (canModifyActor(actor)) return consumeBaitDirect(actor, config);
  return requestGM("fishing-consume-bait", { actorUuid: actor.uuid, regionUuid: region.uuid });
}

async function awardFish(actor, region, fish) {
  if (canModifyActor(actor)) return awardFishDirect(actor, fish);
  return requestGM("fishing-award-fish", { actorUuid: actor.uuid, regionUuid: region.uuid, fishId: fish.id });
}

function userById(userId) {
  return globalThis.game?.users?.get?.(userId)
    ?? collectionDocuments(globalThis.game?.users).find(user => user?.id === userId)
    ?? null;
}

async function launchFishingTest({ region: regionOrUuid, actor: actorOrUuid, fishRarity = "common", seed = null } = {}) {
  const rarity = String(fishRarity ?? "").trim().toLocaleLowerCase();
  if (!FISH_RARITIES.includes(rarity)) throw new Error(`Unknown fish rarity: ${fishRarity}.`);
  const region = regionOrUuid ? await resolveRegion(regionOrUuid) : TEST_POND;
  const actor = await resolveActor(actorOrUuid) ?? TEST_ANGEL;
  const configuredFish = regionFishingData(region)?.fish.filter(fish => fish.rarity === rarity) ?? [];
  const testFish = configuredFish.length ? configuredFish : [TEST_FISH_BY_RARITY.get(rarity)].filter(Boolean);
  if (!testFish.length) throw new Error(`No ${rarity} test fish is available.`);
  return openFishingSession({ region, actor, fish: testFish, seed, consumeBait: false, testMode: true });
}

async function handleRemoteFishingTest(payload, senderId) {
  const game = globalThis.game;
  if (payload.recipientUserId !== game?.user?.id) return;
  // Foundry's module socket relays arbitrary payloads; builds which don't
  // append a sender argument rely on the explicit requester id in the packet.
  const requesterId = senderId ?? payload.requesterUserId;
  const sender = userById(requesterId);
  if (!sender?.isGM || sender.active !== true) return;
  const reply = { action: "fishing-test-opened", requestId: payload.requestId, recipientUserId: requesterId, playerUserId: game.user.id };
  try {
    const dialog = await launchFishingTest({ fishRarity: payload.fishRarity, actor: game.user?.character });
    globalThis.ui?.notifications?.info?.("A GM started a fishing difficulty test for you. No bait or fish will be used.");
    sendSocket({ ...reply, success: true });
    return dialog;
  } catch (error) {
    const message = error.message ?? "Unable to start the fishing difficulty test.";
    globalThis.ui?.notifications?.error?.(message);
    sendSocket({ ...reply, success: false, message });
    return null;
  }
}

async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "fishing-result") {
    if (payload.recipientId && payload.recipientId !== globalThis.game?.user?.id) return;
    const pending = waitingRequests.get(payload.requestId);
    if (!pending) return;
    waitingRequests.delete(payload.requestId);
    pending.resolve(payload.result);
    return;
  }
  if (payload.action === "fishing-open-test") {
    await handleRemoteFishingTest(payload, senderId);
    return;
  }
  if (payload.action === "fishing-test-opened") {
    if (payload.recipientUserId !== globalThis.game?.user?.id) return;
    const playerId = senderId ?? payload.playerUserId;
    const pending = pendingFishingTests.get(payload.requestId);
    if (!pending || playerId !== pending.userId) return;
    clearTimeout(pending.timeout);
    pendingFishingTests.delete(payload.requestId);
    pending.resolve({
      success: Boolean(payload.success),
      message: payload.message ?? null,
      userId: pending.userId,
      userName: pending.userName,
      fishRarity: pending.fishRarity
    });
    return;
  }
  if (!activeGM() || !["fishing-consume-bait", "fishing-award-fish"].includes(payload.action)) return;
  let result;
  try {
    const actor = await resolveUuid(payload.actorUuid);
    const region = await resolveUuid(payload.regionUuid);
    const config = regionFishingData(region);
    const sender = globalThis.game?.users?.get?.(senderId)
      ?? collectionDocuments(globalThis.game?.users).find(user => user?.id === senderId);
    if (!actor || actor.documentName !== "Actor" || !config || !sender || !actor.testUserPermission?.(sender, "OWNER")) {
      throw new Error("The fishing actor or Region is no longer available.");
    }
    if (payload.action === "fishing-consume-bait") result = await consumeBaitDirect(actor, config);
    else {
      const fish = fishFromConfig(config, payload.fishId);
      if (!fish) throw new Error("That fish is not available at this fishing spot.");
      result = await awardFishDirect(actor, fish);
    }
  } catch (error) {
    result = { success: false, message: error.message ?? "The GM could not resolve the fishing request." };
  }
  sendSocket({ action: "fishing-result", recipientId: payload.userId ?? senderId, requestId: payload.requestId, result });
}

export function installFishingSocket() {
  installFishingContainerGuard();
  if (socketInstalled || !globalThis.game?.socket?.on) return false;
  globalThis.game.socket.on(FISHING_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
  return true;
}

export async function configureFishingRegion({ region: regionOrUuid, poleItemName = DEFAULT_FISHING_POLE_NAME, tackleItemName = DEFAULT_FISHING_TACKLE_NAME, baitItemName = "Bait", pondTier = "common", fish = DEFAULT_FISH } = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a fishing Region.");
  const region = await resolveRegion(regionOrUuid);
  const config = createFishingSpotConfig({ poleItemName, tackleItemName, baitItemName, pondTier, fish });
  await region.update({
    [`flags.${MODULE_ID}.${FISHING_REGION_FLAG}`]: clone(config),
    [`flags.${LEGACY_MODULE_ID}.${FISHING_REGION_FLAG}`]: null,
    [`flags.${HISTORICAL_MODULE_ID}.${FISHING_REGION_FLAG}`]: null
  });
  return { region, config };
}

export async function clearFishingRegion(regionOrUuid) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can clear a fishing Region.");
  const region = await resolveRegion(regionOrUuid);
  await region.update({
    [`flags.${MODULE_ID}.${FISHING_REGION_FLAG}`]: null,
    [`flags.${LEGACY_MODULE_ID}.${FISHING_REGION_FLAG}`]: null,
    [`flags.${HISTORICAL_MODULE_ID}.${FISHING_REGION_FLAG}`]: null
  });
  return region;
}

export async function configureSelectedFishingRegion(options = {}) {
  const region = globalThis.canvas?.regions?.controlled?.[0]?.document
    ?? globalThis.canvas?.regions?.placeables?.find(placeable => placeable.controlled)?.document;
  if (!region) throw new Error("Select one Region on the Regions layer first.");
  return configureFishingRegion({ ...options, region });
}

export function shouldFishingRegionHandleClick({ activeLayerName = globalThis.canvas?.activeLayer?.name, regionPlacementActive = false } = {}) {
  if (regionPlacementActive) return false;
  const layerName = String(activeLayerName ?? "").toLowerCase();
  // Fishing Regions share the canvas with every editing layer. Only let them
  // receive clicks from Token Controls so they cannot swallow Wall, Region,
  // or other canvas-tool input. Region placement always remains Foundry-owned.
  return ["tokens", "tokenlayer"].includes(layerName);
}

function interactionShouldOpen() {
  return shouldFishingRegionHandleClick({ regionPlacementActive: Boolean(globalThis.canvas?.regions?._placementContext) });
}

function handleRegionClick(region, event) {
  if (!interactionShouldOpen() || !isFishingRegion(region)) return false;
  // Token-layer click handling can clear the controlled collection after this
  // Region receives the pointer event. Capture the selected Actor first so a
  // valid token selection survives that cross-layer cleanup.
  const actor = selectedFishingActor();
  event?.stopPropagation?.();
  void openFishing({ region, actor }).catch(error => {
    const message = error instanceof Error ? error.message : String(error ?? "Unable to fish here.");
    globalThis.ui?.notifications?.warn?.(message);
  });
  return true;
}

function regionCanHandleFishingClick(region) {
  if (!region || !isFishingRegion(region.document ?? region) || !interactionShouldOpen()) return false;
  if (region.isPreview || region.document?.locked) return false;
  return region.document?.testUserPermission?.(globalThis.game?.user, "OBSERVER") ?? true;
}

function installFishingRegionPointerTap(placeable) {
  if (!placeable || fishingRegionPointerTapInstalled.has(placeable)) return;
  placeable.on("pointertap", event => {
    if (!regionCanHandleFishingClick(placeable)) return;
    handleRegionClick(placeable.document, event);
  });
  fishingRegionPointerTapInstalled.add(placeable);
}

function restoreFishingRegionLayerState(layer) {
  const state = fishingRegionLayerState.get(layer);
  if (!state) return false;
  if (state.objects && state.objects === layer.objects) {
    state.objects.eventMode = state.objectsEventMode;
    state.objects.interactiveChildren = state.objectsInteractiveChildren;
  }
  // An active Region layer has just been activated by Foundry and owns its
  // parent interaction flags. Only restore the saved parent flag while it is
  // still inactive.
  if (!layer.active) layer.interactiveChildren = state.layerInteractiveChildren;
  fishingRegionLayerState.delete(layer);
  return true;
}

function refreshRegionPlaceables(placeables) {
  for (const placeable of placeables) {
    placeable._refreshVisibility?.();
    placeable._refreshState?.();
  }
}

function refreshFishingRegionInteractivity() {
  const layer = globalThis.canvas?.regions;
  const placeables = layer?.placeables;
  if (!layer || !Array.isArray(placeables)) return false;
  const fishingRegions = placeables.filter(placeable => isFishingRegion(placeable.document));
  for (const placeable of fishingRegions) installFishingRegionPointerTap(placeable);

  // A native Region placement workflow belongs entirely to Foundry.
  if (layer._placementContext) return fishingRegions.length > 0;

  // Restore any Token-layer hit-testing before letting Foundry own an active
  // Region layer again. This matters because Foundry's deactivate() is a no-op
  // for layers which were already inactive when the other layer was selected.
  const restored = restoreFishingRegionLayerState(layer);
  if (layer.active) {
    if (restored) refreshRegionPlaceables(placeables);
    return fishingRegions.length > 0;
  }
  if (fishingRegions.length === 0 || !interactionShouldOpen()) {
    // If we are leaving Token Controls, refresh every Region, not just fishing
    // ponds: otherwise an ordinary Region can keep a stale static hit target
    // after the parent layer is re-enabled for fishing clicks.
    if (restored) refreshRegionPlaceables(placeables);
    return false;
  }

  if (!fishingRegionLayerState.has(layer)) {
    fishingRegionLayerState.set(layer, {
      layerInteractiveChildren: layer.interactiveChildren,
      objects: layer.objects,
      objectsEventMode: layer.objects?.eventMode,
      objectsInteractiveChildren: layer.objects?.interactiveChildren
    });
  }

  // RegionLayer normally disables all child interaction whenever another
  // control layer is active. Keep the parent passive but allow tagged fishing
  // Regions to receive their own click events while Token Controls are active.
  layer.interactiveChildren = true;
  if (layer.objects) {
    // A passive container traverses to interactive Regions without becoming a
    // hit target itself. It is restored to Foundry's normal mode above when
    // the Region layer is activated for editing.
    layer.objects.eventMode = "passive";
    layer.objects.interactiveChildren = true;
  }
  refreshRegionPlaceables(placeables);
  return true;
}

function installFishingRegionLayerInteraction() {
  if (regionLayerInteractionInstalled) return true;
  const hooks = globalThis.Hooks;
  if (!hooks?.on) return false;
  const refresh = () => refreshFishingRegionInteractivity();
  hooks.on("activateCanvasLayer", refresh);
  hooks.on("deactivateCanvasLayer", refresh);
  hooks.on("canvasReady", refresh);
  regionLayerInteractionInstalled = true;
  refresh();
  return true;
}

/** Make tagged Region placeables clickable for players while preserving GM editing. */
export function installFishingRegionInteraction() {
  installFishingRegionLayerInteraction();
  if (regionInteractionInstalled) return true;
  const RegionClass = globalThis.CONFIG?.Region?.objectClass;
  if (!RegionClass) return false;
  class RegionwrightFishingRegion extends RegionClass {
    get isVisible() {
      if (regionCanHandleFishingClick(this)) return true;
      return super.isVisible;
    }

    get isInteractable() {
      if (regionCanHandleFishingClick(this)) return true;
      return super.isInteractable;
    }

    _refreshState() {
      super._refreshState();
      // Pixi skips hit testing for fully transparent display objects. Keep the
      // fishing Region visually imperceptible while retaining a live hit area.
      if (regionCanHandleFishingClick(this)) this.alpha = 0.001;
    }

    _onClickLeft(event) {
      if (handleRegionClick(this.document, event)) return false;
      return super._onClickLeft(event);
    }
  }
  Object.defineProperty(RegionwrightFishingRegion, "name", { value: "RegionwrightFishingRegion" });
  globalThis.CONFIG.Region.objectClass = RegionwrightFishingRegion;
  regionInteractionInstalled = true;
  return true;
}

function percent(value) {
  return `${Math.round(Math.max(0, Math.min(100, Number(value) || 0)))}%`;
}

export function renderFishingMarkup(dialog) {
  const challenge = dialog.challenge;
  const actorName = escapeHTML(dialog.actor?.name ?? "Adventurer");
  const regionName = escapeHTML(dialog.region?.name ?? "Fishing Spot");
  if (dialog.phase === "result") {
    const caught = dialog.caughtFish;
    const testCaught = dialog.resultKind === "test-caught";
    const rationText = caught?.ration > 0
      ? `This catch counts as <strong>${caught.ration} ration${caught.ration === 1 ? "" : "s"}</strong>.`
      : `This catch is tracked as a <strong>${escapeHTML(caught?.catchType ?? "material")}</strong>.`;
    const resultTitle = dialog.testMode
      ? (testCaught ? "Difficulty test complete" : dialog.resultKind === "failed" ? "Test failed" : "Fishing test stopped")
      : (dialog.resultKind === "caught" ? "Fish on the line!" : dialog.resultKind === "failed" ? "The line goes slack" : "Fishing stopped");
    return `<main class="rw-fishing-game rw-fishing-result" tabindex="0" data-fishing-phase="result">
      <header class="rw-fishing-heading"><div><span class="rw-fishing-kicker">${regionName}${dialog.testMode ? " · DIFFICULTY TEST" : ""}</span><h2>${resultTitle}</h2></div><span class="rw-fishing-time"><i class="fa-solid fa-clock"></i> 1 hour</span></header>
      ${caught ? `<section class="rw-fishing-catch-card"><img src="${escapeHTML(caught.img)}" alt="${escapeHTML(caught.name)}"><div><span class="rw-fishing-kicker">${escapeHTML(caught.rarity ?? "common")} catch</span><h3>${escapeHTML(caught.name)}</h3><p>${dialog.testMode ? "Test catch only; no fish was added." : `Added to ${actorName}. ${rationText}`}</p>${!dialog.testMode && caught.marketValue > 0 ? `<p>Market value: <strong>${Number(caught.marketValue).toLocaleString("en-US")} gp each</strong> (${escapeHTML(caught.marketValueFormula)}).</p>` : ""}<p>${escapeHTML(caught.edibleEffect ?? "No additional eating effect recorded.")}</p></div></section>` : `<p class="rw-fishing-result-message" role="status">${escapeHTML(dialog.feedback)}</p>`}
      <p class="rw-fishing-help">${dialog.testMode ? "Test only: no bait was consumed and no fish was awarded." : dialog.resultKind === "caught" ? "The bait was used when the cast began. The catch is ready to inspect." : "The bait was used when the cast began. Try again with another bait."}</p>
    </main>`;
  }
  if (dialog.phase === "fight") {
    const state = dialog.fightState;
    const safeLeft = percent(state.safeMin);
    const safeWidth = percent(state.safeMax - state.safeMin);
    const drainingClass = state.escapePaused ? "" : " is-escape-draining";
    return `<main class="rw-fishing-game rw-fishing-fight" tabindex="0" data-fishing-phase="fight">
      <header class="rw-fishing-heading"><div><span class="rw-fishing-kicker">${regionName}${dialog.testMode ? " · TEST" : ""}</span><h2>Keep the line alive</h2></div><span class="rw-fishing-time"><i class="fa-solid fa-clock"></i> 1 hour</span></header>
      <p class="rw-fishing-help"><strong>Something is on the line.</strong> Hold <strong>Reel</strong> to gain ground while tension is green. The green band pulses red when your escape time is draining.</p>
      <section class="rw-fishing-gauge-card"><div class="rw-fishing-gauge-labels"><span>Loose</span><strong data-fishing-tension>${Math.round(state.tension)}% tension</strong><span>SNAP</span></div><div class="rw-fishing-gauge" style="--rw-safe-left:${safeLeft};--rw-safe-width:${safeWidth};--rw-tension:${percent(state.tension)}"><i class="rw-fishing-safe-band${drainingClass}" aria-hidden="true"></i><i class="rw-fishing-tension-fill"></i><b class="rw-fishing-tension-marker"></b></div></section>
      <section class="rw-fishing-progress-card"><div class="rw-fishing-stat-labels"><span>Fish tiring</span><span data-fishing-progress>${Math.round(state.progress)}%</span></div><div class="rw-fishing-progress"><i class="rw-fishing-progress-fill"></i></div></section>
      <button class="rw-fishing-reel" type="button" data-fishing-reel><span class="rw-fishing-reel-icon" aria-hidden="true"></span><span>Hold to Reel</span></button>
      <p class="rw-fishing-status" role="status" data-fishing-status>${escapeHTML(dialog.feedback)}</p>
    </main>`;
  }
  const elapsed = dialog.biteElapsed;
  const biteReady = dialog.biteReady;
  return `<main class="rw-fishing-game rw-fishing-bite" tabindex="0" data-fishing-phase="bite">
    <header class="rw-fishing-heading"><div><span class="rw-fishing-kicker">${regionName}${dialog.testMode ? " · DIFFICULTY TEST" : ""}</span><h2>Watch the bobber</h2></div><span class="rw-fishing-time"><i class="fa-solid fa-clock"></i> 1 hour</span></header>
    <p class="rw-fishing-help">Wait for the bite, then set the hook before the fish gets away.</p>
    <section class="rw-fishing-water"><div class="rw-fishing-ripple"></div><i class="rw-fishing-bobber ${biteReady ? "is-biting" : ""}"></i><span class="rw-fishing-water-label">${biteReady ? "BITE!" : "quiet water"}</span></section>
    <div class="rw-fishing-timer-labels"><span>${biteReady ? "Hook window" : "Waiting for a bite"}</span><strong data-fishing-countdown>${biteReady ? (challenge.bite.opensAt + challenge.bite.window - elapsed).toFixed(1) : Math.max(0, challenge.bite.opensAt - elapsed).toFixed(1)}s</strong></div><div class="rw-fishing-timer"><i class="rw-fishing-timer-fill"></i></div>
    <button class="rw-fishing-hook" type="button" data-fishing-hook ${biteReady ? "" : "disabled"}><i class="fa-solid fa-fish"></i> Set the Hook</button>
    <p class="rw-fishing-status" role="status" data-fishing-status>${escapeHTML(dialog.feedback)}</p>
  </main>`;
}

function createFishingDialogClass(DialogV2) {
  return class RegionwrightFishingDialog extends DialogV2 {
    constructor({ region, actor, config, catalog, challenge, hookedFish, testMode = false, dialogKey = null }) {
      super({
        classes: ["regionwright", "rw-fishing-dialog"],
        window: { title: "Fishing", icon: "fa-solid fa-fish", resizable: false, minimizable: false },
        position: { width: 500, height: 610 },
        content: "<main class=\"rw-fishing-game\"></main>",
        buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }]
      });
      this.region = region;
      this.actor = actor;
      this.config = config;
      this.catalog = catalog;
      this.challenge = challenge;
      this.hookedFish = hookedFish;
      this.testMode = testMode;
      this.dialogKey = dialogKey ?? fishingKey(region, actor);
      this.phase = "bite";
      this.biteElapsed = 0;
      this.biteReady = false;
      this.fightState = createFishingFightState(challenge);
      this.reeling = false;
      this.feedback = "The line is out. Watch the bobber.";
      this.resultKind = null;
      this.caughtFish = null;
      this.resolving = false;
      this.frameId = null;
      this.frameMode = null;
      this.lastFrame = null;
      this.listenerHost = null;
      this.movementGuardRelease = null;
    }

    _onRender(context, options) {
      super._onRender(context, options);
      this._bind();
      this._refresh();
      this._focus();
      this._start();
      this.bringToFront?.();
    }

    _bind() {
      const root = rootFor(this);
      if (!root || root === this.listenerHost) return;
      this.listenerHost = root;
      this._clickHandler = event => {
        if (event.target?.closest?.("[data-fishing-hook]")) this._hook();
      };
      this._pointerDownHandler = event => {
        if (event.target?.closest?.("[data-fishing-reel]") && this.phase === "fight") {
          event.preventDefault();
          this.reeling = true;
          try { event.target.setPointerCapture?.(event.pointerId); } catch (_error) { /* Synthetic or cancelled pointers need no capture. */ }
          this._updateLive();
        }
      };
      this._pointerUpHandler = () => { this.reeling = false; this._updateLive(); };
      this._keyDownHandler = event => {
        if (event.key !== " " && event.key !== "Enter") return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
        event.preventDefault();
        if (this.phase === "bite") this._hook();
        else if (this.phase === "fight") { this.reeling = true; this._updateLive(); }
      };
      this._keyUpHandler = event => { if (event.key === " ") { this.reeling = false; this._updateLive(); } };
      root.addEventListener("click", this._clickHandler, true);
      root.addEventListener("pointerdown", this._pointerDownHandler, true);
      root.addEventListener("pointerup", this._pointerUpHandler, true);
      root.addEventListener("pointercancel", this._pointerUpHandler, true);
      root.addEventListener("keydown", this._keyDownHandler, true);
      root.addEventListener("keyup", this._keyUpHandler, true);
      this.movementGuardRelease ??= acquireFishingMovementGuard();
    }

    _focus() { rootFor(this)?.querySelector(".rw-fishing-game")?.focus?.(); }

    _start() {
      if (this.frameId !== null || this.phase === "result") return;
      const tick = timestamp => {
        this.frameId = null;
        if (this.phase === "result") return;
        const seconds = this.lastFrame === null ? 0 : Math.min(0.25, Math.max(0, (timestamp - this.lastFrame) / 1000));
        this.lastFrame = timestamp;
        if (this.phase === "bite") this._advanceBite(seconds);
        else if (this.phase === "fight") this._advanceFight(seconds);
        if (this.phase !== "result") this._start();
      };
      if (typeof globalThis.requestAnimationFrame === "function") {
        this.frameMode = "animation";
        this.frameId = globalThis.requestAnimationFrame(tick);
      } else {
        this.frameMode = "timeout";
        this.frameId = setTimeout(() => tick(Date.now()), 16);
      }
    }

    _stop() {
      if (this.frameId === null) return;
      if (this.frameMode === "animation") globalThis.cancelAnimationFrame?.(this.frameId);
      else clearTimeout(this.frameId);
      this.frameId = null;
      this.frameMode = null;
    }

    _advanceBite(seconds) {
      this.biteElapsed += seconds;
      if (!this.biteReady && this.biteElapsed >= this.challenge.bite.opensAt) {
        this.biteReady = true;
        this.feedback = "The fish is biting! Set the hook now.";
        this._refresh();
      }
      if (this.biteReady && this.biteElapsed >= this.challenge.bite.opensAt + this.challenge.bite.window) {
        void this._finishFailure("The fish got away before you set the hook.");
        return;
      }
      this._updateLive();
    }

    _advanceFight(seconds) {
      const next = advanceFishingFight(this.fightState, this.challenge, seconds, this.reeling);
      this.fightState = next;
      if (next.status === "caught") return void this._finishCatch();
      if (next.status === "line-snap") return void this._finishFailure("The line snapped under too much pressure.");
      if (next.status === "fish-escaped") return void this._finishFailure("Time ran out before you landed the fish.");
      this._updateLive();
    }

    _hook() {
      if (this.phase !== "bite" || this.resolving) return;
      if (!this.biteReady) {
        this.feedback = "Not yet—the water is still.";
        this._refresh();
        return;
      }
      this.phase = "fight";
      this.feedback = "Keep the tension in the safe band. Release Reel to cool the line.";
      this.lastFrame = null;
      this._refresh();
      this._focus();
    }

    _refresh() {
      const root = rootFor(this);
      if (!root) return;
      const current = root.querySelector(".rw-fishing-game");
      if (current) current.outerHTML = renderFishingMarkup(this);
      else root.innerHTML = renderFishingMarkup(this);
      this._updateLive();
    }

    _updateLive() {
      const root = rootFor(this);
      if (!root) return;
      if (this.phase === "bite") {
        const fill = root.querySelector(".rw-fishing-timer-fill");
        const total = this.biteReady ? this.challenge.bite.opensAt + this.challenge.bite.window : this.challenge.bite.total;
        if (fill) fill.style.width = `${Math.max(0, 100 - ((this.biteElapsed / total) * 100))}%`;
        const countdown = root.querySelector("[data-fishing-countdown]");
        if (countdown) countdown.textContent = `${(this.biteReady ? this.challenge.bite.opensAt + this.challenge.bite.window - this.biteElapsed : this.challenge.bite.opensAt - this.biteElapsed).toFixed(1)}s`;
        const hook = root.querySelector("[data-fishing-hook]");
        if (hook) hook.disabled = !this.biteReady;
      }
      if (this.phase === "fight") {
        const state = this.fightState;
        const gauge = root.querySelector(".rw-fishing-gauge");
        gauge?.style.setProperty("--rw-tension", percent(state.tension));
        gauge?.style.setProperty("--rw-safe-left", percent(state.safeMin));
        gauge?.style.setProperty("--rw-safe-width", percent(state.safeMax - state.safeMin));
        root.querySelector(".rw-fishing-safe-band")?.classList.toggle("is-escape-draining", !state.escapePaused);
        root.querySelector(".rw-fishing-progress-fill")?.style.setProperty("width", percent(state.progress));
        const tension = root.querySelector("[data-fishing-tension]");
        if (tension) tension.textContent = `${Math.round(state.tension)}% tension`;
        const progress = root.querySelector("[data-fishing-progress]");
        if (progress) progress.textContent = `${Math.round(state.progress)}%`;
        const status = root.querySelector("[data-fishing-status]");
        if (status) status.textContent = state.escapePaused
          ? "In the green—timer paused; reeling is tiring the fish."
          : "Red pulse: your escape time is draining.";
        root.querySelector(".rw-fishing-reel")?.classList.toggle("is-held", this.reeling);
      }
    }

    async _finishFailure(message) {
      if (this.resolving || this.phase === "result") return;
      this.resolving = true;
      this._stop();
      this.phase = "result";
      this.resultKind = "failed";
      this.feedback = message;
      this._refresh();
      globalThis.ui?.notifications?.warn?.(message);
    }

    async _finishCatch() {
      if (this.resolving || this.phase === "result") return;
      this.resolving = true;
      this._stop();
      this.phase = "result";
      this.feedback = "Bringing the fish in…";
      this._refresh();
      const fish = this.hookedFish ?? chooseFishForSeed(this.catalog, this.challenge.seed, this.config.pondTier);
      try {
        if (this.testMode) {
          this.caughtFish = fish;
          this.resultKind = "test-caught";
          this.feedback = `${fish.rarity} difficulty test complete. No fish was awarded.`;
        } else {
          const result = await awardFish(this.actor, this.region, fish);
          if (!result?.success) throw new Error(result?.message ?? "The catch could not be added to the actor.");
          this.caughtFish = { ...fish, marketValue: result.marketValue, marketValueFormula: result.marketValueFormula };
          this.resultKind = "caught";
          this.feedback = `${fish.name} added to ${this.actor.name}.`;
          const catchSummary = fish.ration > 0
            ? `This catch counts as ${fish.ration} ration${fish.ration === 1 ? "" : "s"}.`
            : `This catch is tracked as a ${fish.catchType}.`;
          const valueSummary = `${Number(result.marketValue).toLocaleString("en-US")} gp market value (${result.marketValueFormula}).`;
          await globalThis.ChatMessage?.create?.({ content: `<strong>${escapeHTML(this.actor.name)} caught a ${escapeHTML(fish.name)}!</strong><br>D&D rarity: ${escapeHTML(fish.rarity)}.<br>${escapeHTML(valueSummary)}<br>${escapeHTML(catchSummary)}<br>${escapeHTML(fish.edibleEffect ?? "No additional eating effect recorded.")}`, speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor }) });
          globalThis.ui?.notifications?.info?.(`${fish.name} caught! ${valueSummary} ${catchSummary}`);
        }
      } catch (error) {
        this.resultKind = "failed";
        this.feedback = error.message ?? "The catch could not be added to the actor.";
        globalThis.ui?.notifications?.error?.(this.feedback);
      }
      this.resolving = false;
      this._refresh();
    }

    async close(options = {}) {
      this._stop();
      const root = rootFor(this);
      root?.removeEventListener?.("click", this._clickHandler, true);
      root?.removeEventListener?.("pointerdown", this._pointerDownHandler, true);
      root?.removeEventListener?.("pointerup", this._pointerUpHandler, true);
      root?.removeEventListener?.("pointercancel", this._pointerUpHandler, true);
      root?.removeEventListener?.("keydown", this._keyDownHandler, true);
      root?.removeEventListener?.("keyup", this._keyUpHandler, true);
      this.movementGuardRelease?.();
      this.movementGuardRelease = null;
      openDialogs.delete(this.dialogKey);
      return super.close(options);
    }
  };
}

async function openFishingSession({ region: regionOrUuid, actor: actorOrUuid, fish = null, seed = null, consumeBait: shouldConsumeBait = true, testMode = false } = {}) {
  const region = await resolveRegion(regionOrUuid);
  const config = regionFishingData(region) ?? (testMode ? createFishingSpotConfig({ fish: fish ?? [TEST_FISH_BY_RARITY.get("common")] }) : null);
  if (!config) throw new Error("This Region is not configured as a fishing spot.");
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before fishing.");
  const key = testMode
    ? `${fishingKey(region, actor)}:test:${fish?.[0]?.rarity ?? "difficulty"}`
    : fishingKey(region, actor);
  const existing = openDialogs.get(key);
  if (existing) {
    existing.bringToFront?.();
    return existing;
  }
  if (!testMode && !namedItem(actor, config.poleItemName)) throw new Error(`You need a ${config.poleItemName} in your inventory to fish.`);
  if (!testMode && !namedItem(actor, config.baitItemName)) throw new Error(`You need ${config.baitItemName} in your inventory to fish.`);
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  if (!testMode && shouldConsumeBait) {
    const baitResult = await consumeBait(actor, region, config);
    if (!baitResult?.success) throw new Error(baitResult?.message ?? `You need ${config.baitItemName} to fish.`);
  }
  const catalog = createFishingCatalog(fish ?? config.fish);
  const challengeSeed = seed ?? `${region.uuid}:${actor.uuid}:${Date.now()}`;
  const hookedFish = chooseFishForSeed(catalog, challengeSeed, config.pondTier);
  const challenge = createFishingChallenge({ seed: challengeSeed, fishRarity: hookedFish.rarity });
  const dialog = new (createFishingDialogClass(DialogV2))({ region, actor, config, catalog, challenge, hookedFish, testMode, dialogKey: key });
  openDialogs.set(key, dialog);
  await dialog.render({ force: true });
  return dialog;
}

export async function openFishing(options = {}) {
  return openFishingSession(options);
}

export async function openFishingTest({ region: regionOrUuid, actor: actorOrUuid, fishRarity = "common", seed = null } = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can run fishing difficulty tests.");
  return launchFishingTest({ region: regionOrUuid, actor: actorOrUuid, fishRarity, seed });
}

export function openFishingTestForPlayer({ userId, fishRarity = "common" } = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can send a fishing test to a player.");
  const rarity = String(fishRarity ?? "").trim().toLocaleLowerCase();
  if (!FISH_RARITIES.includes(rarity)) throw new Error(`Unknown fish rarity: ${fishRarity}.`);
  const user = userById(userId);
  if (!user || user.isGM || user.active !== true) throw new Error("Choose a connected, active player.");
  if (!globalThis.game?.socket?.emit || !globalThis.game?.socket?.on) throw new Error("The Foundry module socket is unavailable; the player test could not be sent.");
  installFishingSocket();
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      pendingFishingTests.delete(requestId);
      resolve({ success: false, message: `No opening confirmation came back from ${user.name}. Make sure their Foundry page is refreshed and they are still connected.` });
    }, 8000);
    pendingFishingTests.set(requestId, { userId: user.id, userName: user.name, fishRarity: rarity, timeout, resolve });
    sendSocket({ action: "fishing-open-test", requestId, requesterUserId: globalThis.game.user.id, recipientUserId: user.id, fishRarity: rarity });
  });
}
