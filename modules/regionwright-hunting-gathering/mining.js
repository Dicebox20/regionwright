import {
  DEFAULT_MAX_ATTEMPTS,
  LEGACY_MODULE_ID,
  MODULE_ID,
  MINING_ORE_FLAG,
  MINING_PICKAXE_FLAG,
  MINING_REGION_FLAG,
  MINING_SOCKET,
  TIMING_STAGE_CYCLES_MS,
  TIMING_RING_BASE_DIAMETER_PX,
  accelerateTimingRatio,
  createMiningDepositConfig,
  timingCyclesForDifficulty,
  normalizeMiningDepositConfig,
  normalizeTimingScores,
  scoreTimingDiameter,
  timingLabelForScore,
  timingRingDiameterForRatio,
  timingScoreBandsForDifficulty,
  yieldForTimingScores
} from "./mining-engine.js";
import { ORE_CATALOG, createOreItemSource, formatOreValue, getOre } from "./mining-catalog.js";

const openDialogs = new Map();
const waitingRequests = new Map();
const pendingMiningTests = new Map();
const regionLocks = new Map();
const miningRegionPointerTapInstalled = new WeakSet();
const miningRegionLayerState = new WeakMap();
let socketInstalled = false;
let regionInteractionInstalled = false;
let regionLayerInteractionInstalled = false;

const rootFor = application => application?.element?.[0] ?? application?.element ?? null;
const clone = value => globalThis.foundry?.utils?.deepClone?.(value) ?? structuredClone(value);
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? Math.random().toString(36).slice(2);

function collectionDocuments(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.contents)) return collection.contents;
  try { return Array.from(collection); } catch (_error) { return []; }
}

function userById(userId) {
  return globalThis.game?.users?.get?.(userId)
    ?? collectionDocuments(globalThis.game?.users).find(user => user?.id === userId)
    ?? null;
}
function actorItems(actor) {
  return collectionDocuments(actor?.items);
}

function itemQuantity(item) {
  return Number(item?.system?.quantity ?? 1) || 0;
}

function itemFlag(item, scope, key) {
  return item?.flags?.[scope]?.[key] ?? item?._source?.flags?.[scope]?.[key] ?? null;
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PICKAXE_NAMES = new Set([
  "miner s pick",
  "miners pick",
  "miner pick",
  "mining pick",
  "pickaxe"
]);

export function isPickaxeItem(item) {
  if (!item || itemQuantity(item) <= 0) return false;
  if (itemFlag(item, MODULE_ID, MINING_PICKAXE_FLAG) || itemFlag(item, LEGACY_MODULE_ID, MINING_PICKAXE_FLAG)) return true;
  const normalized = normalizeName(item.name);
  if (PICKAXE_NAMES.has(normalized)) return true;
  return normalized.includes("pickaxe");
}

export function findPickaxe(actor) {
  return actorItems(actor).find(isPickaxeItem) ?? null;
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
  if (regionOrUuid) {
    const region = await resolveUuid(regionOrUuid);
    if (region?.documentName === "Region") return region;
  }
  const selected = globalThis.canvas?.regions?.controlled?.[0]?.document
    ?? globalThis.canvas?.regions?.placeables?.find(placeable => placeable.controlled)?.document;
  if (selected?.documentName === "Region") return selected;
  throw new Error("Select one Region on the Regions layer first.");
}

async function resolveActor(actorOrUuid) {
  if (actorOrUuid?.documentName === "Actor") return actorOrUuid;
  if (actorOrUuid) {
    const actor = await resolveUuid(actorOrUuid);
    if (actor?.documentName === "Actor") return actor;
  }
  return selectedMiningActor();
}

function selectedMiningActor() {
  return globalThis.canvas?.tokens?.controlled?.[0]?.actor
    ?? globalThis.game?.user?.character
    ?? null;
}

export function miningDepositData(region) {
  const raw = region?.flags?.[MODULE_ID]?.[MINING_REGION_FLAG]
    ?? region?._source?.flags?.[MODULE_ID]?.[MINING_REGION_FLAG]
    ?? region?.flags?.[LEGACY_MODULE_ID]?.[MINING_REGION_FLAG]
    ?? region?._source?.flags?.[LEGACY_MODULE_ID]?.[MINING_REGION_FLAG]
    ?? null;
  return normalizeMiningDepositConfig(raw);
}

export function isMiningRegion(region) {
  return Boolean(miningDepositData(region));
}

export async function configureMiningRegion({
  region: regionOrUuid,
  oreId,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  preserveAttempts = false
} = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a mining deposit.");
  const region = await resolveRegion(regionOrUuid);
  const ore = getOre(oreId);
  if (!ore) throw new Error(`Unknown ore: ${oreId}`);
  const prior = miningDepositData(region);
  const attemptsUsed = preserveAttempts && prior?.oreId === ore.id ? prior.attemptsUsed : 0;
  const config = createMiningDepositConfig({ oreId: ore.id, maxAttempts, attemptsUsed });
  await region.update({
    [`flags.${MODULE_ID}.${MINING_REGION_FLAG}`]: clone(config),
    [`flags.${LEGACY_MODULE_ID}.${MINING_REGION_FLAG}`]: null
  });
  refreshMiningRegionInteractivity();
  return { region, ore, config };
}

export async function configureSelectedMiningRegion(oreId, options = {}) {
  return configureMiningRegion({ ...options, region: await resolveRegion(), oreId });
}

export async function clearMiningRegion(regionOrUuid) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can clear a mining deposit.");
  const region = await resolveRegion(regionOrUuid);
  await region.update({
    [`flags.${MODULE_ID}.${MINING_REGION_FLAG}`]: null,
    [`flags.${LEGACY_MODULE_ID}.${MINING_REGION_FLAG}`]: null
  });
  refreshMiningRegionInteractivity();
  return region;
}

export async function resetMiningRegion(regionOrUuid) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can reset a mining deposit.");
  const region = await resolveRegion(regionOrUuid);
  const current = miningDepositData(region);
  if (!current) throw new Error("That Region is not configured as a mining deposit.");
  const config = createMiningDepositConfig({ oreId: current.oreId, maxAttempts: current.maxAttempts, attemptsUsed: 0 });
  await region.update({
    [`flags.${MODULE_ID}.${MINING_REGION_FLAG}`]: clone(config),
    [`flags.${LEGACY_MODULE_ID}.${MINING_REGION_FLAG}`]: null
  });
  return { region, config };
}

function oreItemFlag(item) {
  return itemFlag(item, MODULE_ID, MINING_ORE_FLAG) ?? itemFlag(item, LEGACY_MODULE_ID, MINING_ORE_FLAG);
}

async function awardOreDirect(actor, ore, quantity) {
  if (quantity <= 0) return { success: true, itemName: ore.name, quantity: 0, stacked: false };
  const existing = actorItems(actor).find(item => oreItemFlag(item)?.oreId === ore.id);
  if (existing) {
    const next = itemQuantity(existing) + quantity;
    await existing.update({ "system.quantity": next });
    return { success: true, itemName: ore.name, quantity, totalQuantity: next, stacked: true };
  }
  const [created] = await actor.createEmbeddedDocuments("Item", [createOreItemSource(ore, quantity)]);
  return { success: true, itemName: ore.name, quantity, totalQuantity: quantity, item: created ?? null };
}

async function withRegionLock(regionUuid, task) {
  const prior = regionLocks.get(regionUuid) ?? Promise.resolve();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const queued = prior.then(() => gate);
  regionLocks.set(regionUuid, queued);
  await prior;
  try {
    return await task();
  } finally {
    release();
    if (regionLocks.get(regionUuid) === queued) regionLocks.delete(regionUuid);
  }
}

async function resolveMiningSwingDirect({ actor, region, timingScores }) {
  return withRegionLock(region.uuid, async () => {
    const freshRegion = await resolveUuid(region.uuid) ?? region;
    const config = miningDepositData(freshRegion);
    if (!config) throw new Error("This Region is no longer configured as a mining deposit.");
    const ore = getOre(config.oreId);
    if (!ore) throw new Error("The configured ore is no longer in the mining catalog.");
    if (!findPickaxe(actor)) throw new Error("You need a Miner's Pick or pickaxe in your inventory to mine this deposit.");
    if (config.depleted || config.attemptsUsed >= config.maxAttempts) {
      return {
        success: false,
        depleted: true,
        message: "This ore vein has been depleted.",
        attemptsUsed: config.attemptsUsed,
        attemptsRemaining: 0
      };
    }

    const scores = normalizeTimingScores(timingScores);
    if (!scores) throw new Error("The mining timing result must contain exactly three scores from 0 to 5.");
    const quantity = yieldForTimingScores(scores);
    const timingAverage = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const attemptsUsed = config.attemptsUsed + 1;
    const depleted = attemptsUsed >= config.maxAttempts;
    const next = createMiningDepositConfig({
      oreId: config.oreId,
      maxAttempts: config.maxAttempts,
      attemptsUsed
    });

    // Advance shared vein state and award ore under the same GM-side Region lock.
    await freshRegion.update({
      [`flags.${MODULE_ID}.${MINING_REGION_FLAG}`]: clone(next),
      [`flags.${LEGACY_MODULE_ID}.${MINING_REGION_FLAG}`]: null
    });
    let award;
    try {
      award = await awardOreDirect(actor, ore, quantity);
    } catch (error) {
      // Reward failure should not silently eat the attempt. Roll back only if the
      // deposit still has the state written by this request.
      const latest = miningDepositData(freshRegion);
      if (latest?.attemptsUsed === attemptsUsed && latest?.oreId === config.oreId) {
        await freshRegion.update({
          [`flags.${MODULE_ID}.${MINING_REGION_FLAG}`]: clone(config),
          [`flags.${LEGACY_MODULE_ID}.${MINING_REGION_FLAG}`]: null
        });
      }
      throw error;
    }

    return {
      success: true,
      oreId: ore.id,
      oreName: ore.name,
      timingScores: [...scores],
      timingAverage,
      quantity,
      attemptsUsed,
      attemptsRemaining: Math.max(0, config.maxAttempts - attemptsUsed),
      depleted,
      award
    };
  });
}

function sendSocket(payload) {
  globalThis.game?.socket?.emit?.(MINING_SOCKET, payload);
}

function requestGM(action, { actorUuid, regionUuid, timingScores } = {}) {
  if (!globalThis.game?.users?.activeGM) {
    return Promise.resolve({ success: false, message: "A GM must be connected to resolve mining extraction." });
  }
  installMiningSocket();
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      waitingRequests.delete(requestId);
      resolve({ success: false, message: "The active GM did not respond to the mining request." });
    }, 8000);
    waitingRequests.set(requestId, {
      resolve: result => {
        clearTimeout(timeout);
        resolve(result);
      }
    });
    sendSocket({
      action,
      requestId,
      actorUuid,
      regionUuid,
      timingScores: Array.isArray(timingScores) ? [...timingScores] : timingScores,
      userId: globalThis.game?.user?.id
    });
  });
}

async function handleRemoteMiningTest(payload, senderId) {
  const game = globalThis.game;
  if (payload.recipientUserId !== game?.user?.id) return;
  const requesterId = senderId ?? payload.requesterUserId;
  const sender = userById(requesterId);
  if (!sender?.isGM || sender.active !== true) return;
  const reply = {
    action: "mining-test-opened",
    requestId: payload.requestId,
    recipientUserId: requesterId,
    playerUserId: game.user.id
  };
  try {
    await openMiningTest({ oreId: payload.oreId });
    globalThis.ui?.notifications?.info?.("A GM started a mining timing test for you. Nothing mined here changes inventory or vein state.");
    sendSocket({ ...reply, success: true });
  } catch (error) {
    const message = error.message ?? "Unable to start the mining timing test.";
    globalThis.ui?.notifications?.error?.(message);
    sendSocket({ ...reply, success: false, message });
  }
}
async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "mining-open-test") {
    await handleRemoteMiningTest(payload, senderId);
    return;
  }
  if (payload.action === "mining-test-opened") {
    if (payload.recipientUserId !== globalThis.game?.user?.id) return;
    const playerId = senderId ?? payload.playerUserId;
    const pending = pendingMiningTests.get(payload.requestId);
    if (!pending || playerId !== pending.userId) return;
    clearTimeout(pending.timeout);
    pendingMiningTests.delete(payload.requestId);
    pending.resolve({ success: Boolean(payload.success), message: payload.message ?? null, userId: pending.userId, userName: pending.userName });
    return;
  }
  if (payload.action === "mining-result") {
    if (payload.recipientId && payload.recipientId !== globalThis.game?.user?.id) return;
    const pending = waitingRequests.get(payload.requestId);
    if (!pending) return;
    waitingRequests.delete(payload.requestId);
    pending.resolve(payload.result);
    return;
  }

  if (!activeGM() || payload.action !== "mining-swing") return;
  let result;
  try {
    const actor = await resolveUuid(payload.actorUuid);
    const region = await resolveUuid(payload.regionUuid);
    const sender = globalThis.game?.users?.get?.(senderId)
      ?? collectionDocuments(globalThis.game?.users).find(user => user?.id === senderId);
    if (!actor || actor.documentName !== "Actor" || !region || region.documentName !== "Region" || !sender) {
      throw new Error("The mining actor or deposit is no longer available.");
    }
    if (!actor.testUserPermission?.(sender, "OWNER")) {
      throw new Error("You do not own the actor attempting to mine.");
    }
    result = await resolveMiningSwingDirect({
      actor,
      region,
      timingScores: payload.timingScores
    });
  } catch (error) {
    result = { success: false, message: error.message ?? "The GM could not resolve the mining request." };
  }
  sendSocket({
    action: "mining-result",
    recipientId: payload.userId ?? senderId,
    requestId: payload.requestId,
    result
  });
}

export function installMiningSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return false;
  globalThis.game.socket.on(MINING_SOCKET, (payload, senderId) => {
    void handleSocket(payload, senderId);
  });
  socketInstalled = true;
  return true;
}

async function resolveMiningSwing({ actor, region, timingScores }) {
  if (activeGM()) return resolveMiningSwingDirect({ actor, region, timingScores });
  return requestGM("mining-swing", {
    actorUuid: actor.uuid,
    regionUuid: region.uuid,
    timingScores
  });
}

function miningKey(region, actor) {
  return `${region?.uuid ?? "region"}:${actor?.uuid ?? "actor"}`;
}

function timingCyclesForOre(ore) {
  return timingCyclesForDifficulty(ore?.miningDifficulty);
}
const BASE_VISUAL_ZONE_DIAMETERS = Object.freeze({ 1: 207, 2: 168, 3: 132, 4: 100, 5: 38 });
const BASE_SCORE_THRESHOLDS = Object.freeze({ 1: 200, 2: 149, 3: 103, 4: 62, 5: 26 });
function visualZoneDiametersForOre(ore) {
  const bands = timingScoreBandsForDifficulty(ore?.miningDifficulty);
  return Object.fromEntries([1, 2, 3, 4, 5].map(score => {
    const maxDiameterPx = bands.find(band => band.score === score)?.maxDiameterPx ?? BASE_SCORE_THRESHOLDS[score];
    const scaled = BASE_VISUAL_ZONE_DIAMETERS[score] * (maxDiameterPx / BASE_SCORE_THRESHOLDS[score]);
    return [score, Math.max(score === 5 ? 31 : 1, Math.round(scaled))];
  }));
}
function miningMarkup(dialog) {
  const config = miningDepositData(dialog.region);
  const ore = getOre(config?.oreId);
  const testMode = Boolean(dialog.testMode);
  const maxAttempts = config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const attemptsUsed = dialog.lastResult?.attemptsUsed ?? config?.attemptsUsed ?? 0;
  const remaining = dialog.lastResult?.attemptsRemaining ?? Math.max(0, maxAttempts - attemptsUsed);
  const depleted = testMode ? false : (dialog.lastResult?.depleted ?? config?.depleted ?? remaining <= 0);
  const result = dialog.lastResult;
  const value = formatOreValue(ore);
  const timingCycles = timingCyclesForOre(ore);
  const zoneDiameters = visualZoneDiametersForOre(ore);
  const zoneStyle = [1, 2, 3, 4, 5].map(score => `--rw-mining-zone-${score}-size:${zoneDiameters[score]}px`).join(";");
  const stageIndex = Math.max(0, Math.min(timingCycles.length - 1, dialog.stageIndex));
  const cycleMs = timingCycles[stageIndex];
  const pips = Array.from({ length: maxAttempts }, (_, index) =>
    `<i class="${index < attemptsUsed ? "spent" : "ready"}" aria-hidden="true"></i>`
  ).join("");
  const scoreCards = Array.from({ length: timingCycles.length }, (_, index) => {
    const score = dialog.stageScores[index];
    const complete = Number.isInteger(score);
    const current = dialog.stageActive && index === dialog.stageIndex;
    const label = complete ? `${score}/5 - ${timingLabelForScore(score)}` : (current ? "NOW" : "-");
    return `<div class="rw-mining-scorecard ${current ? "current" : ""} ${complete ? "complete" : ""}">
      <small>Strike ${index + 1}</small><strong>${label}</strong>
    </div>`;
  }).join("");

  let resultHtml = `<p class="rw-mining-feedback">${dialog.feedback}</p>`;
  if (result?.success) {
    const scoreText = (result.timingScores ?? []).join(" / ");
    const yieldText = testMode
      ? `Test yield: ${result.quantity} x ${ore?.name ?? "ore"} (not awarded).`
      : (result.quantity > 0
        ? `Extracted ${result.quantity} x ${ore?.name ?? "ore"}.`
        : "No usable ore came free.");
    resultHtml = `<section class="rw-mining-result ${result.quantity > 0 ? "success" : "miss"}">
      <strong>${yieldText}</strong>
      <span>Strike scores: ${scoreText || "-"} | Average ${Number(result.timingAverage ?? 0).toFixed(2)}</span>
    </section>`;
  }

  let stageState = testMode ? "GM test" : "Ready";
  let stageDetail = testMode ? "No inventory or vein state will change" : "Three strikes per extraction attempt";
  if (depleted) {
    stageState = "Vein depleted";
    stageDetail = "No extraction attempts remain";
  } else if (dialog.resolving) {
    stageState = "Resolving extraction";
    stageDetail = "The active GM is applying the result";
  } else if (dialog.transitioning) {
    stageState = `Strike ${Math.min(dialog.stageIndex + 2, 3)} incoming`;
    stageDetail = "Get ready";
  } else if (dialog.stageActive) {
    stageState = `Strike ${stageIndex + 1} / 3`;
    stageDetail = `${(cycleMs / 1000).toFixed(2)}s full pulse`;
  } else if (result) {
    stageState = "Attempt complete";
    stageDetail = remaining > 0 ? "Start another extraction attempt" : "The vein is depleted";
  }

  let actionHtml;
  if (depleted) {
    actionHtml = `<button type="button" class="rw-mining-action" disabled><i class="fa-solid fa-ban"></i> Vein Depleted</button>`;
  } else if (dialog.resolving) {
    actionHtml = `<button type="button" class="rw-mining-action" disabled><i class="fa-solid fa-spinner fa-spin"></i> Resolving...</button>`;
  } else if (dialog.transitioning) {
    actionHtml = `<button type="button" class="rw-mining-action" disabled><i class="fa-solid fa-hourglass-half"></i> Next Strike...</button>`;
  } else if (dialog.stageActive) {
    actionHtml = `<button type="button" class="rw-mining-action" data-mining-strike><i class="fa-solid fa-hammer"></i> STRIKE NOW</button>`;
  } else {
    actionHtml = `<button type="button" class="rw-mining-action" data-mining-start><i class="fa-solid fa-rotate-right"></i> ${result ? "Mine Again" : "Start Mining"}</button>`;
  }

  return `<main class="rw-mining-game" tabindex="0">
    <header class="rw-mining-heading">
      <img src="${ore?.img ?? "icons/svg/rock.svg"}" alt="">
      <div><span>${testMode ? "Mining timing test" : "Mining deposit"}</span><h2>${ore?.name ?? "Unknown Ore"}</h2></div>
    </header>
    <section class="rw-mining-meta">
      <div><small>${testMode ? "Mode" : "Sale value"}</small><strong>${testMode ? "No-write test" : `${value} / unit`}</strong></div>
      <div><small>${testMode ? "Result" : "Attempts remaining"}</small><strong>${testMode ? "0-5 test ore" : `${remaining} / ${maxAttempts}`}</strong></div>
    </section>
    ${testMode ? "" : `<div class="rw-mining-pips" aria-label="${remaining} extraction attempts remaining">${pips}</div>`}
    <section class="rw-mining-stagebar">
      <div><small>Timing puzzle</small><strong>${stageState}</strong></div>
      <span>${stageDetail}</span>
    </section>
    <button type="button" class="rw-mining-arena" data-mining-arena data-mining-difficulty="${ore?.miningDifficulty ?? "common"}" style="${zoneStyle}" ${dialog.stageActive && !depleted && !dialog.resolving ? "" : "disabled"} aria-label="Strike timing target">
      <span class="rw-mining-zone score-1" data-score="1"></span>
      <span class="rw-mining-zone score-2" data-score="2"></span>
      <span class="rw-mining-zone score-3" data-score="3"></span>
      <span class="rw-mining-zone score-4" data-score="4"></span>
      <span class="rw-mining-zone score-5" data-score="5"></span>
      <span class="rw-mining-core"><i class="fa-solid fa-bullseye"></i></span>
      <span class="rw-mining-moving-ring" data-mining-ring></span>
      ${dialog.impactFeedback ? `<span class="rw-mining-impact-flash score-${dialog.impactFeedback.score}" aria-hidden="true"></span><span class="rw-mining-impact score-${dialog.impactFeedback.score}" role="status"><strong>${dialog.impactFeedback.text}</strong><small>${dialog.impactFeedback.score} / 5</small></span>` : ""}
    </button>
    <div class="rw-mining-scoreboard">${scoreCards}</div>
    ${resultHtml}
    ${actionHtml}
    <p class="rw-mining-help">Click the circle or press Space. Smaller ring = better strike. The pulse quickens near the center, and the outer edge is a miss.${testMode ? " Test mode never consumes a vein attempt or awards ore." : ""}</p>
  </main>`;
}

function createMiningDialogClass(DialogV2) {
  return class RegionwrightMiningDialog extends DialogV2 {
    constructor({ region, actor, testMode = false, dialogKey = null }) {
      super({
        classes: ["regionwright", "rw-mining-dialog"],
        window: { title: "Mining", icon: "fa-solid fa-hammer", resizable: false, minimizable: false },
        position: { width: 460, height: 650 },
        content: `<main class="rw-mining-game"></main>`,
        buttons: [{ action: "close", label: "Leave", icon: "fa-solid fa-xmark" }]
      });
      this.region = region;
      this.actor = actor;
      this.testMode = testMode;
      this.dialogKey = dialogKey ?? miningKey(region, actor);
      this.feedback = "Strike when the moving ring is as small as possible.";
      this.lastResult = null;
      this.resolving = false;
      this.transitioning = false;
      this.stageIndex = 0;
      this.stageScores = [];
      this.stageActive = !Boolean(miningDepositData(region)?.depleted);
      this.stageStartedAt = null;
      this.currentTimingRatio = 1;
      this.lastStrike = null;
      this.impactFeedback = null;
      this.impactTimer = null;
      this.rafId = null;
      this.transitionTimer = null;
      this.listenerHost = null;
      this._frameHandler = now => this._tick(now);
    }

    _onRender(context, options) {
      super._onRender(context, options);
      this._bind();
      this._refresh();
      if (this.stageActive && this.stageStartedAt == null) this._startStageClock();
    }

    _bind() {
      const root = rootFor(this);
      if (!root || root === this.listenerHost) return;
      this.listenerHost = root;
      this._clickHandler = event => {
        if (event.target?.closest?.("[data-mining-start]")) {
          event.preventDefault();
          void this._startAttempt();
          return;
        }
        if (event.target?.closest?.("[data-mining-strike], [data-mining-arena]")) {
          event.preventDefault();
          void this._strike();
        }
      };
      this._keyHandler = event => {
        if (event.code !== "Space" || event.repeat || !this.stageActive || this.resolving || this.transitioning) return;
        const tag = String(event.target?.tagName ?? "").toLowerCase();
        if (["input", "textarea", "select"].includes(tag)) return;
        event.preventDefault();
        void this._strike();
      };
      root.addEventListener("click", this._clickHandler, true);
      root.addEventListener("keydown", this._keyHandler, true);
    }

    _refresh() {
      const root = rootFor(this);
      if (!root) return;
      const current = root.querySelector(".rw-mining-game");
      if (current) current.outerHTML = miningMarkup(this);
      else root.innerHTML = miningMarkup(this);
      const game = root.querySelector(".rw-mining-game");
      game?.focus?.({ preventScroll: true });
      this._paintTimingRing();
    }

    _paintTimingRing() {
      const root = rootFor(this);
      const ring = root?.querySelector?.("[data-mining-ring]");
      const arena = root?.querySelector?.("[data-mining-arena]");
      if (!ring) return;
      const ratio = Math.max(0, Math.min(1, Number(this.currentTimingRatio) || 0));
      const diameterPx = timingRingDiameterForRatio(ratio);
      const scale = diameterPx / TIMING_RING_BASE_DIAMETER_PX;
      const ore = getOre(miningDepositData(this.region)?.oreId);
      const liveScore = scoreTimingDiameter(diameterPx, ore?.miningDifficulty);
      ring.style.transform = `translate(-50%, -50%) scale(${scale})`;
      ring.dataset.ratio = ratio.toFixed(4);
      ring.dataset.diameterPx = diameterPx.toFixed(2);
      ring.dataset.liveScore = String(liveScore);
      if (arena) {
        arena.dataset.liveScore = String(liveScore);
        arena.dataset.ringDiameterPx = diameterPx.toFixed(2);
      }
    }

    _startStageClock() {
      this._stopAnimation();
      this.stageStartedAt = globalThis.performance?.now?.() ?? Date.now();
      this.currentTimingRatio = 1;
      this._paintTimingRing();
      this.rafId = globalThis.requestAnimationFrame?.(this._frameHandler) ?? null;
    }

    _stopAnimation() {
      if (this.rafId != null) globalThis.cancelAnimationFrame?.(this.rafId);
      this.rafId = null;
      this.stageStartedAt = null;
    }

    _tick(now) {
      if (!this.stageActive || this.resolving || this.transitioning) {
        this.rafId = null;
        return;
      }
      if (this.stageStartedAt == null) this.stageStartedAt = now;
      const ore = getOre(miningDepositData(this.region)?.oreId);
      const timingCycles = timingCyclesForOre(ore);
      const cycleMs = timingCycles[this.stageIndex] ?? timingCycles.at(-1);
      const elapsed = Math.max(0, now - this.stageStartedAt);
      const phase = (elapsed % cycleMs) / cycleMs;
      // The pulse preserves its full cycle but deliberately quickens near the center.
      const linearRatio = Math.abs(1 - (2 * phase));
      this.currentTimingRatio = accelerateTimingRatio(linearRatio);
      this._paintTimingRing();
      this.rafId = globalThis.requestAnimationFrame?.(this._frameHandler) ?? null;
    }

    async _startAttempt() {
      if (this.resolving || this.transitioning || this.stageActive) return;
      const config = miningDepositData(this.region);
      if (!this.testMode && (!config || config.depleted || config.attemptsUsed >= config.maxAttempts || this.lastResult?.depleted)) {
        this.feedback = "This ore vein has been depleted.";
        this.lastResult = { success: false, depleted: true, attemptsUsed: config?.attemptsUsed ?? config?.maxAttempts ?? 5, attemptsRemaining: 0 };
        this._refresh();
        return;
      }
      const pickaxe = this.testMode ? null : findPickaxe(this.actor);
      if (!this.testMode && !pickaxe) {
        this.feedback = "You need a Miner's Pick or pickaxe in your inventory.";
        globalThis.ui?.notifications?.warn?.(this.feedback);
        this._refresh();
        return;
      }
      this.stageScores = [];
      this.stageIndex = 0;
      this.lastResult = null;
      this.lastStrike = null;
      this.impactFeedback = null;
      if (this.impactTimer) clearTimeout(this.impactTimer);
      this.impactTimer = null;
      this.currentTimingRatio = 1;
      this.feedback = this.testMode ? "Test mode: strike when the ring is smallest." : `Using ${pickaxe.name}. Strike when the ring is smallest.`;
      this.stageActive = true;
      this._refresh();
      this._startStageClock();
    }

    async _strike() {
      if (!this.stageActive || this.resolving || this.transitioning) return;
      const ratio = this.currentTimingRatio;
      const diameterPx = timingRingDiameterForRatio(ratio);
      const ore = getOre(miningDepositData(this.region)?.oreId);
      const score = scoreTimingDiameter(diameterPx, ore?.miningDifficulty);
      const label = timingLabelForScore(score);
      const impactText = score === 5 ? "PERFECT!" : `${label.toUpperCase()}!`;
      const impactDelay = score === 5 ? 480 : 330;
      this._stopAnimation();
      this.stageActive = false;
      this.stageScores.push(score);
      this.lastStrike = { score, label, ratio, diameterPx };
      this.impactFeedback = { score, text: impactText };
      this.feedback = `${impactText} Strike ${this.stageIndex + 1} scored ${score}/5.`;
      this._refresh();
      if (this.impactTimer) clearTimeout(this.impactTimer);
      this.impactTimer = setTimeout(() => {
        this.impactTimer = null;
        this.impactFeedback = null;
        if (!this.transitioning && !this.resolving) this._refresh();
      }, Math.max(650, impactDelay + 180));

      const timingCycles = timingCyclesForOre(ore);
      if (this.stageIndex < timingCycles.length - 1) {
        this.transitioning = true;
        this.transitionTimer = setTimeout(() => {
          this.transitionTimer = null;
          this.stageIndex += 1;
          this.transitioning = false;
          this.stageActive = true;
          this.impactFeedback = null;
          this.feedback = `Strike ${this.stageIndex + 1}: the pulse is faster now.`;
          this.currentTimingRatio = 1;
          this._refresh();
          this._startStageClock();
        }, impactDelay);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, impactDelay));
      await this._resolveCompletedAttempt();
    }
    async _resolveCompletedAttempt() {
      const scores = normalizeTimingScores(this.stageScores);
      if (!scores) {
        this.feedback = "The three-strike timing result was incomplete. No attempt was consumed.";
        this.lastResult = null;
        this._refresh();
        return;
      }

      if (this.testMode) {
        const quantity = yieldForTimingScores(scores);
        const timingAverage = scores.reduce((sum, value) => sum + value, 0) / scores.length;
        const oreId = miningDepositData(this.region)?.oreId ?? "iron-ore";
        this.lastResult = { success: true, oreId, oreName: getOre(oreId)?.name ?? "Iron Ore", timingScores: [...scores], timingAverage, quantity, attemptsUsed: 0, attemptsRemaining: DEFAULT_MAX_ATTEMPTS, depleted: false, testMode: true };
        this.feedback = `Test complete: ${quantity}/5 ore yield. Nothing was awarded or consumed.`;
        this.stageActive = false;
        this._stopAnimation();
        this._refresh();
        return;
      }
      this.resolving = true;
      this.transitioning = false;
      this.feedback = `Three strikes complete (${scores.join(" / ")}). Resolving extraction...`;
      this._refresh();

      try {
        const result = await resolveMiningSwing({
          actor: this.actor,
          region: this.region,
          timingScores: [...scores]
        });
        this.lastResult = result;
        this.feedback = result.success
          ? (result.quantity > 0 ? `${result.quantity} ${result.oreName} extracted.` : "No usable ore came free.")
          : (result.message ?? "The mining attempt could not be resolved.");

        if (result.success) {
          const scoreText = (result.timingScores ?? scores).join(" / ");
          const summary = result.quantity > 0
            ? `<strong>${this.actor.name} mines ${result.quantity} x ${result.oreName}.</strong><br>Timing ${scoreText} (avg ${Number(result.timingAverage ?? 0).toFixed(2)}). ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remain.`
            : `<strong>${this.actor.name}'s strikes free no usable ore.</strong><br>Timing ${scoreText} (avg ${Number(result.timingAverage ?? 0).toFixed(2)}). ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remain.`;
          await globalThis.ChatMessage?.create?.({
            content: summary,
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: this.actor }),
            whisper: [globalThis.game?.user?.id].filter(Boolean)
          });
          if (result.depleted) globalThis.ui?.notifications?.info?.("The ore vein is depleted.");
        } else {
          globalThis.ui?.notifications?.warn?.(this.feedback);
        }
      } catch (error) {
        this.feedback = error.message ?? "The mining attempt failed.";
        this.lastResult = null;
        globalThis.ui?.notifications?.error?.(this.feedback);
      } finally {
        this.resolving = false;
        this.stageActive = false;
        this._stopAnimation();
        this._refresh();
      }
    }

    async close(options = {}) {
      this._stopAnimation();
      if (this.transitionTimer) clearTimeout(this.transitionTimer);
      if (this.impactTimer) clearTimeout(this.impactTimer);
      this.transitionTimer = null;
      this.impactTimer = null;
      const root = rootFor(this);
      root?.removeEventListener?.("click", this._clickHandler, true);
      root?.removeEventListener?.("keydown", this._keyHandler, true);
      openDialogs.delete(this.dialogKey);
      return super.close(options);
    }
  };
}


export async function openMiningTest({ oreId = "iron-ore" } = {}) {
  const ore = getOre(oreId);
  if (!ore) throw new Error("Unknown ore selected for the mining test.");
  const region = { documentName: "Region", uuid: `Scene.regionwright-hunting-gathering-mining-test.Region.${globalThis.game?.user?.id ?? "local"}.${ore.id}`, name: `${ore.name} Timing Test`, flags: { [MODULE_ID]: { [MINING_REGION_FLAG]: createMiningDepositConfig({ oreId: ore.id, maxAttempts: DEFAULT_MAX_ATTEMPTS, attemptsUsed: 0 }) } } };
  const actor = globalThis.game?.user?.character ?? { documentName: "Actor", uuid: `Actor.regionwright-hunting-gathering-mining-test.${globalThis.game?.user?.id ?? "local"}`, name: globalThis.game?.user?.name ? `${globalThis.game.user.name} Test Miner` : "Test Miner" };
  const key = `test:${globalThis.game?.user?.id ?? "local"}:${ore.id}`;
  const existing = openDialogs.get(key);
  if (existing) { existing.bringToFront?.(); return existing; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createMiningDialogClass(DialogV2))({ region, actor, testMode: true, dialogKey: key });
  openDialogs.set(key, dialog);
  dialog.render({ force: true });
  return dialog;
}
export async function requestMiningTest(userId, { oreId = "iron-ore" } = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can launch mining tests for users.");
  const ore = getOre(oreId);
  if (!ore) throw new Error("Unknown ore selected for the mining test.");
  const user = userById(userId);
  if (!user?.active) throw new Error("That user is not currently online.");
  if (user.id === globalThis.game.user.id) {
    await openMiningTest({ oreId: ore.id });
    return { success: true, userId: user.id, userName: user.name, oreId: ore.id };
  }
  installMiningSocket();
  const requestId = randomId();
  return new Promise(resolve => {
    const timeout = setTimeout(() => { pendingMiningTests.delete(requestId); resolve({ success: false, userId: user.id, userName: user.name, oreId: ore.id, message: `${user.name} did not acknowledge the mining test.` }); }, 8000);
    pendingMiningTests.set(requestId, { resolve, timeout, userId: user.id, userName: user.name, oreId: ore.id });
    sendSocket({ action: "mining-open-test", requestId, recipientUserId: user.id, requesterUserId: globalThis.game.user.id, oreId: ore.id });
  });
}
export async function openMining({ region: regionOrUuid, actor: actorOrUuid } = {}) {
  const region = await resolveRegion(regionOrUuid);
  const config = miningDepositData(region);
  if (!config) throw new Error("This Region is not configured as a mining deposit.");
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before mining.");
  const ore = getOre(config.oreId);
  if (!ore) throw new Error("This deposit references an unknown ore.");
  if (!findPickaxe(actor)) throw new Error("You need a Miner's Pick or pickaxe in your inventory to mine this deposit.");

  const key = miningKey(region, actor);
  const existing = openDialogs.get(key);
  if (existing) {
    existing.bringToFront?.();
    return existing;
  }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createMiningDialogClass(DialogV2))({ region, actor });
  openDialogs.set(key, dialog);
  dialog.render({ force: true });
  return dialog;
}

export function shouldMiningRegionHandleClick({
  activeLayerName = globalThis.canvas?.activeLayer?.name,
  regionPlacementActive = false
} = {}) {
  if (regionPlacementActive) return false;
  const layerName = String(activeLayerName ?? "").toLowerCase();
  return ["tokens", "tokenlayer"].includes(layerName);
}

function interactionShouldOpen() {
  return shouldMiningRegionHandleClick({
    regionPlacementActive: Boolean(globalThis.canvas?.regions?._placementContext)
  });
}

function handleRegionClick(region, event) {
  if (!interactionShouldOpen() || !isMiningRegion(region)) return false;
  const actor = selectedMiningActor();
  event?.stopPropagation?.();
  void openMining({ region, actor }).catch(error => {
    globalThis.ui?.notifications?.warn?.(error.message ?? "Unable to mine here.");
  });
  return true;
}

function regionCanHandleMiningClick(placeable) {
  if (!placeable || !isMiningRegion(placeable.document ?? placeable) || !interactionShouldOpen()) return false;
  if (placeable.isPreview || placeable.document?.locked) return false;
  return placeable.document?.testUserPermission?.(globalThis.game?.user, "OBSERVER") ?? true;
}

function installMiningRegionPointerTap(placeable) {
  if (!placeable || miningRegionPointerTapInstalled.has(placeable)) return;
  placeable.on?.("pointertap", event => {
    if (!regionCanHandleMiningClick(placeable)) return;
    handleRegionClick(placeable.document, event);
  });
  miningRegionPointerTapInstalled.add(placeable);
}

function hasActiveFishingRegion(placeables) {
  return placeables.some(placeable => {
    const document = placeable.document;
    return Boolean(
      document?.flags?.[MODULE_ID]?.fishingSpot
      ?? document?._source?.flags?.[MODULE_ID]?.fishingSpot
      ?? document?.flags?.[LEGACY_MODULE_ID]?.fishingSpot
      ?? document?._source?.flags?.[LEGACY_MODULE_ID]?.fishingSpot
      ?? document?.flags?.regionwright?.fishingSpot
      ?? document?._source?.flags?.regionwright?.fishingSpot
    );
  });
}

function restoreMiningRegionLayerState(layer) {
  const state = miningRegionLayerState.get(layer);
  if (!state) return false;
  if (state.objects && state.objects === layer.objects) {
    state.objects.eventMode = state.objectsEventMode;
    state.objects.interactiveChildren = state.objectsInteractiveChildren;
  }
  if (!layer.active) layer.interactiveChildren = state.layerInteractiveChildren;
  miningRegionLayerState.delete(layer);
  return true;
}

function refreshRegionPlaceables(placeables) {
  for (const placeable of placeables) {
    placeable._refreshVisibility?.();
    placeable._refreshState?.();
  }
}

export function refreshMiningRegionInteractivity() {
  const layer = globalThis.canvas?.regions;
  const placeables = layer?.placeables;
  if (!layer || !Array.isArray(placeables)) return false;
  const miningRegions = placeables.filter(placeable => isMiningRegion(placeable.document));
  for (const placeable of miningRegions) installMiningRegionPointerTap(placeable);

  if (layer._placementContext) return miningRegions.length > 0;

  // On scenes that already contain a Fishing Region, the installed fishing module
  // owns the passive RegionLayer bridge. Mining only attaches its own placeable
  // handlers so the two modules do not save/restore conflicting parent state.
  if (hasActiveFishingRegion(placeables)) {
    const restored = restoreMiningRegionLayerState(layer);
    if (restored) refreshRegionPlaceables(placeables);
    return miningRegions.length > 0;
  }

  const restored = restoreMiningRegionLayerState(layer);
  if (layer.active) {
    if (restored) refreshRegionPlaceables(placeables);
    return miningRegions.length > 0;
  }

  if (miningRegions.length === 0 || !interactionShouldOpen()) {
    if (restored) refreshRegionPlaceables(placeables);
    return false;
  }

  if (!miningRegionLayerState.has(layer)) {
    miningRegionLayerState.set(layer, {
      layerInteractiveChildren: layer.interactiveChildren,
      objects: layer.objects,
      objectsEventMode: layer.objects?.eventMode,
      objectsInteractiveChildren: layer.objects?.interactiveChildren
    });
  }

  layer.interactiveChildren = true;
  if (layer.objects) {
    layer.objects.eventMode = "passive";
    layer.objects.interactiveChildren = true;
  }
  refreshRegionPlaceables(placeables);
  return true;
}

function installMiningRegionLayerInteraction() {
  if (regionLayerInteractionInstalled) return true;
  const hooks = globalThis.Hooks;
  if (!hooks?.on) return false;
  const refresh = () => refreshMiningRegionInteractivity();
  hooks.on("activateCanvasLayer", refresh);
  hooks.on("deactivateCanvasLayer", refresh);
  hooks.on("canvasReady", refresh);
  hooks.on("createRegion", refresh);
  hooks.on("updateRegion", refresh);
  hooks.on("deleteRegion", refresh);
  regionLayerInteractionInstalled = true;
  refresh();
  return true;
}

/** Make configured mining Regions clickable while preserving native Region editing. */
export function installMiningRegionInteraction() {
  installMiningRegionLayerInteraction();
  if (regionInteractionInstalled) return true;
  const RegionClass = globalThis.CONFIG?.Region?.objectClass;
  if (!RegionClass) return false;

  class RegionwrightMiningRegion extends RegionClass {
    get isVisible() {
      if (regionCanHandleMiningClick(this)) return true;
      return super.isVisible;
    }

    get isInteractable() {
      if (regionCanHandleMiningClick(this)) return true;
      return super.isInteractable;
    }

    _refreshState() {
      super._refreshState();
      if (regionCanHandleMiningClick(this)) this.alpha = 0.001;
    }

    _onClickLeft(event) {
      if (handleRegionClick(this.document, event)) return false;
      return super._onClickLeft(event);
    }
  }

  Object.defineProperty(RegionwrightMiningRegion, "name", { value: "RegionwrightMiningRegion" });
  globalThis.CONFIG.Region.objectClass = RegionwrightMiningRegion;
  regionInteractionInstalled = true;
  return true;
}
