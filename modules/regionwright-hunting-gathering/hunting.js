import {
  BOW_SIGHT_PINS_YARDS,
  DRAW_MILESTONES,
  STAMINA_MAX,
  STAMINA_RECOVERY_DELAY_MS,
  staminaAfterDrawing,
  staminaAfterRecovery,
  sightPinForDistance,
  HUNTING_BOW_FLAG,
  HUNTING_BOW_ID,
  HUNTING_BOW_NAME,
  DEER_WIDTH_M,
  DEER_MOTION_LANE_M,
  DEER_HIT_ZONES,
  DEER_TEST_HIT_ZONES,
  adjustImpactForTargetMovement,
  applyMovingTargetAimForgiveness,
  calculateArrowImpact,
  classifyDeerImpact,
  deerMovementProfile,
  deerMotionAtMs,
  distanceForStealth,
  drawStrengthForMs,
  harvestForSurvival,
  mpsToFps,
  quarryTierForSurvival,
  projectDeerCenterU,
  sampleArrowTrajectoryToDistance,
  targetWidthForDistance
} from "./hunting-engine.js";
import { loadCodedPointBoardAsset, PointBoardDataLayerRenderer } from "./point-board-renderer.js";

const MODULE_ID = "regionwright-hunting-gathering";
const HUNTING_SOCKET = `module.${MODULE_ID}`;
const HUNTING_POINT_BOARD_PATH = "assets/hunting/deer-walk-point-board.json";
const DEER_POINT_BOARD_SOURCE_RECT = Object.freeze({ x: 24, y: 0, width: 192, height: 160 });
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const pendingTests = new Map();
let huntingPointBoardAssetPromise = null;
export const HUNTING_TEST_MODES = Object.freeze({
  normal: Object.freeze({ id: "normal", label: "Normal Test Hunt", ranges: Object.freeze([]), description: "Uses Survival and Stealth to choose quarry and range." }),
  holdover: Object.freeze({ id: "holdover", label: "Live Trained Holdover", ranges: Object.freeze([20, 35, 50, 65]), description: "Fixed-range live shot with expert vertical compensation." }),
  movement: Object.freeze({ id: "movement", label: "Movement Calibration", ranges: Object.freeze([25, 45, 65]), description: "Fixed-range moving-target calibration with expanded motion diagnostics." })
});
export const HUNTING_TEST_MODE_ORDER = Object.freeze(["normal", "holdover", "movement"]);
export const HUNTING_HOLDOVER_CALIBRATION_RANGES_YARDS = HUNTING_TEST_MODES.holdover.ranges;
let socketInstalled = false;
const randomId = () => globalThis.foundry?.utils?.randomID?.() ?? Math.random().toString(36).slice(2);
const actorItems = actor => Array.isArray(actor?.items) ? actor.items : actor?.items?.contents ?? (actor?.items?.values ? Array.from(actor.items.values()) : []);
const itemQuantity = item => Math.max(0, Number(item?.system?.quantity ?? item?.quantity ?? 1) || 0);
const itemFlag = (item, key) => item?.getFlag?.(MODULE_ID, key) ?? item?.flags?.[MODULE_ID]?.[key] ?? item?._source?.flags?.[MODULE_ID]?.[key] ?? null;
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === globalThis.game.user.id));
const userById = id => globalThis.game?.users?.get?.(id) ?? (globalThis.game?.users?.contents ?? []).find(user => user.id === id) ?? null;
const formatModifier = value => `${Number(value) >= 0 ? "+" : ""}${Number(value) || 0}`;
const normalizeTestMode = value => HUNTING_TEST_MODES[value] ? value : "normal";
const normalizeTestModeRange = (mode, value) => {
  const id = normalizeTestMode(mode);
  const ranges = HUNTING_TEST_MODES[id].ranges;
  if (!ranges.length) return null;
  const yards = Number(value);
  if (!ranges.includes(yards)) throw new Error(`${HUNTING_TEST_MODES[id].label} range must be one of: ${ranges.join(", ")} yd.`);
  return yards;
};
const normalizeHoldoverCalibrationRange = value => normalizeTestModeRange("holdover", value);
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function createHuntingBowItemSource() {
  const description = `<p>A dedicated field bow balanced for Regionwright hunting. This exact item is required for real Hunting sessions.</p><p><strong>Hunting controls:</strong> aim with the mouse, hold left click to draw, release to fire, and right click while drawing to lower the bow.</p>`;
  return {
    name: HUNTING_BOW_NAME,
    type: "loot",
    img: "icons/weapons/bows/shortbow-recurve.webp",
    system: {
      quantity: 1,
      weight: { value: 2, units: "lb" },
      price: { value: 25, denomination: "gp" },
      description: { value: description, chat: description }
    },
    flags: { [MODULE_ID]: { [HUNTING_BOW_FLAG]: { version: 1, itemId: HUNTING_BOW_ID } } }
  };
}

export function isHuntingBow(item) {
  if (!item || itemQuantity(item) <= 0) return false;
  const flag = itemFlag(item, HUNTING_BOW_FLAG);
  return flag?.itemId === HUNTING_BOW_ID;
}

export function findHuntingBow(actor) {
  return actorItems(actor).find(isHuntingBow) ?? null;
}

export async function installHuntingBow() {
  if (!activeGM()) return { created: false, item: null, reason: "not-active-gm" };
  const items = globalThis.game?.items?.contents ?? (globalThis.game?.items?.values ? Array.from(globalThis.game.items.values()) : []);
  const existing = items.find(isHuntingBow);
  if (existing) return { created: false, item: existing };
  const ItemClass = globalThis.CONFIG?.Item?.documentClass ?? globalThis.Item;
  if (typeof ItemClass?.create !== "function") throw new Error("Foundry's Item document class is unavailable.");
  const item = await ItemClass.create(createHuntingBowItemSource(), { renderSheet: false });
  return { created: true, item };
}

function resolveActor(actorOrUuid) {
  if (actorOrUuid?.documentName === "Actor" || actorOrUuid?.rollSkill) return Promise.resolve(actorOrUuid);
  if (actorOrUuid) {
    const direct = globalThis.fromUuidSync?.(actorOrUuid);
    if (direct?.documentName === "Actor") return Promise.resolve(direct);
    if (typeof globalThis.fromUuid === "function") return globalThis.fromUuid(actorOrUuid).then(actor => actor?.documentName === "Actor" ? actor : null);
  }
  return Promise.resolve(globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? globalThis.game?.user?.character ?? null);
}

export function huntingSkillModifier(actor, skill) {
  const data = actor?.system?.skills?.[skill];
  for (const value of [data?.total, data?.mod, data?.value]) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

export async function rollHuntingSkill(actor, skill) {
  if (typeof actor?.rollSkill !== "function") throw new Error(`${actor?.name ?? "This Actor"} cannot make D&D5e skill rolls.`);
  const normalMode = globalThis.CONFIG?.Dice?.D20Roll?.ADV_MODE?.NORMAL ?? 0;
  const rolled = await actor.rollSkill({
    skill,
    advantage: false,
    disadvantage: false,
    rolls: [{ options: { advantageMode: normalMode } }]
  }, { configure: false });
  const roll = Array.isArray(rolled) ? rolled[0] : rolled;
  const total = Number(roll?.total ?? roll?._total ?? roll?.result);
  if (!Number.isFinite(total)) throw new Error("The skill roll was canceled.");
  return { roll, total };
}

function anatomyZoneMarkup(zones) {
  return zones.map(zone => {
    const cssClass = escapeHTML(zone.anatomyClass ?? zone.id);
    return `<ellipse class="rw-hunt-zone rw-hunt-zone-${cssClass}" data-rw-hunt-zone="${escapeHTML(zone.id)}" cx="${zone.cx}" cy="${zone.cy}" rx="${zone.rx}" ry="${zone.ry}"><title>${escapeHTML(zone.label)}</title></ellipse>`;
  }).join("");
}
function deerHitboxOverlayMarkup({ testAnatomy = false } = {}) {
  const overlayZones = testAnatomy ? DEER_TEST_HIT_ZONES : DEER_HIT_ZONES;
  return `<g class="rw-hunt-hitboxes${testAnatomy ? " rw-hunt-test-anatomy" : ""}">${anatomyZoneMarkup(overlayZones)}</g>`;
}
function huntingPointBoardAsset() {
  if (!huntingPointBoardAssetPromise) {
    huntingPointBoardAssetPromise = loadCodedPointBoardAsset(HUNTING_POINT_BOARD_PATH).catch(error => {
      huntingPointBoardAssetPromise = null;
      throw error;
    });
  }
  return huntingPointBoardAssetPromise;
}
function setText(root, selector, value) {
  const element = root?.querySelector?.(selector);
  if (element) element.textContent = value;
}
function show(root, selector, visible = true) {
  const element = root?.querySelector?.(selector);
  if (element) element.hidden = !visible;
  return element;
}

function trackingMarkup(actor, { testMode = false } = {}) {
  const survival = formatModifier(huntingSkillModifier(actor, "sur"));
  const stealth = formatModifier(huntingSkillModifier(actor, "ste"));
  return `<section class="rw-hunt-root rw-hunt-roll-root standard-form" data-rw-hunt-roll-root>
    <div class="rw-hunt-roll-intro"><strong>${escapeHTML(actor?.name ?? "Hunter")}</strong><small>${testMode ? "Hunting test - no inventory rewards" : `Requires ${HUNTING_BOW_NAME}`}</small></div>
    <section class="rw-hunt-stage" data-rw-hunt-stage="track">
      <h3>1. Track Quarry</h3>
      <p>Use Survival to follow the trail and determine what quarry you find.</p>
      <button type="button" data-rw-hunt-action="track"><i class="fa-solid fa-dice-d20"></i> Roll Survival (${survival})</button>
      <p class="rw-hunt-result" data-rw-hunt-track-result>Waiting for your Survival roll.</p>
    </section>
    <section class="rw-hunt-stage" data-rw-hunt-stage="sneak" hidden>
      <h3>2. Approach Quarry</h3>
      <p>Stealth determines how close you get before the shot.</p>
      <button type="button" data-rw-hunt-action="sneak"><i class="fa-solid fa-dice-d20"></i> Roll Stealth (${stealth})</button>
      <p class="rw-hunt-result" data-rw-hunt-sneak-result>Waiting for your Stealth roll.</p>
    </section>
    <button type="button" class="bright" data-rw-hunt-action="begin-shot" hidden><i class="fa-solid fa-crosshairs"></i> Take the Shot</button>
  </section>`;
}

function shotMarkup({ quarryTier, range, testMode = false, calibrationMode = null } = {}) {
  const sightPin = sightPinForDistance(range.yards);
  const trainedHoldover = calibrationMode === "holdover";
  const movementCalibration = calibrationMode === "movement";
  const isCalibration = trainedHoldover || movementCalibration;
  const rangeText = trainedHoldover
    ? `${range.yards} yd ? trained holdover`
    : movementCalibration
      ? `${range.yards} yd ? movement calibration`
      : `${range.yards} yd ? ${sightPin} yd pin`;
  const modeText = trainedHoldover ? "GM holdover calibration" : movementCalibration ? "GM movement calibration" : "Calm calibration";
  const instructions = trainedHoldover
    ? "Aim directly at the anatomical point you want to hit. Hold left click to draw, release to fire, and right click while drawing to lower the bow. Trained Holdover automatically solves only the vertical range compensation; you still lead moving quarry yourself."
    : movementCalibration
      ? "Movement test: keep a fixed crosshair and use a repeatable release cue such as the center of the head crossing the center of the reticle. Hold to the desired draw and release. The result reports physical release speed, travel, lead, and horizontal miss."
      : `Aim with the mouse. Hold left click to draw. Release to fire. Right click while drawing to lower the bow. Lead moving quarry by aiming ahead of its travel; use the tracer to judge misses. Calibrate vertical aim for arrow drop. Sight pin: ${sightPin} yd.`;
  return `<section class="rw-hunt-root rw-hunt-shot-root standard-form" data-rw-hunt-shot-root data-rw-hunt-calibration="${isCalibration ? calibrationMode : "none"}">
    <div class="rw-hunt-shot-bar"><span>${escapeHTML(quarryTier.quarry.name)}</span><strong>${rangeText}</strong><span>${modeText}</span></div>
    <p class="rw-hunt-instructions">${instructions}</p>
    ${testMode ? '<label class="rw-hunt-hitbox-toggle"><input type="checkbox" data-rw-hunt-hitbox-toggle> Show anatomical target</label><small class="rw-hunt-anatomy-note">Test anatomy: lungs sit behind the front shoulder, heart is the small low/front chest zone, abdomen is farther rearward.</small>' : ""}
    <div class="rw-hunt-arena" data-rw-hunt-arena tabindex="0" aria-label="Hunting bow shooting range">
      <canvas class="rw-hunt-point-forest" data-rw-hunt-point-forest aria-hidden="true"></canvas>
      <svg class="rw-hunt-tracer" data-rw-hunt-tracer viewBox="0 0 100 100" preserveAspectRatio="none" hidden aria-hidden="true"><polyline data-rw-hunt-tracer-line points=""></polyline></svg>
      <div class="rw-hunt-target" data-rw-hunt-target>
        <div class="rw-hunt-deer-art" data-rw-hunt-deer-art>
          <canvas class="rw-hunt-point-deer" data-rw-hunt-point-deer role="img" aria-label="Moving deer target"></canvas>
          <svg class="rw-hunt-hitbox-overlay" data-rw-hunt-hitbox-overlay viewBox="0 0 180 150" aria-hidden="true" hidden></svg>
        </div>
        <div class="rw-hunt-impact" data-rw-hunt-impact hidden></div>
      </div>
      <div class="rw-hunt-reticle" data-rw-hunt-reticle><span></span></div>
      <div class="rw-hunt-arrow" data-rw-hunt-arrow hidden></div>
    </div>
    <p class="rw-hunt-point-board-status" data-rw-hunt-point-board-status role="status" aria-live="polite" hidden></p>
    <div class="rw-hunt-draw"><span>Draw</span><div class="rw-hunt-draw-track"><i data-rw-hunt-draw-meter></i><b data-rw-hunt-milestone="50" style="--rw-threshold:0.5" aria-label="50 percent draw"></b><b data-rw-hunt-milestone="75" style="--rw-threshold:0.75" aria-label="75 percent draw"></b><b data-rw-hunt-milestone="100" style="--rw-threshold:1" aria-label="100 percent draw"></b></div><strong data-rw-hunt-draw-label>0%</strong></div>
    <div class="rw-hunt-stamina"><span>Stamina</span><div><i data-rw-hunt-stamina-meter></i></div><strong data-rw-hunt-stamina-label>100%</strong></div>
    <p class="rw-hunt-result" data-rw-hunt-shot-result>Make your shot.</p>
    ${testMode ? '<p class="rw-hunt-result rw-hunt-diagnostic" data-rw-hunt-shot-diagnostic>Shot diagnostics will appear here.</p>' : ""}
    <div class="rw-hunt-shot-actions">
      <button type="button" data-rw-hunt-action="harvest-next" hidden><i class="fa-solid fa-knife-kitchen"></i> Continue to Harvest</button>
      <button type="button" data-rw-hunt-action="restart" hidden><i class="fa-solid fa-rotate-right"></i> Restart Hunt</button>
    </div>
  </section>`;
}
function harvestMarkup(actor, { quarryTier, shot, testMode = false } = {}) {
  const survival = formatModifier(huntingSkillModifier(actor, "sur"));
  return `<section class="rw-hunt-root rw-hunt-harvest-root standard-form" data-rw-hunt-harvest-root>
    <div class="rw-hunt-roll-intro"><strong>${escapeHTML(quarryTier.quarry.name)}</strong><small>${escapeHTML(shot.hit.label)} hit - ${escapeHTML(shot.hit.quality)} carcass</small></div>
    <section class="rw-hunt-stage">
      <h3>Harvest Carcass</h3>
      <p>Use Survival to determine how much usable material you recover.</p>
      <button type="button" data-rw-hunt-action="harvest"><i class="fa-solid fa-dice-d20"></i> Roll Survival (${survival})</button>
      <p class="rw-hunt-result" data-rw-hunt-harvest-result>Waiting for your Survival roll.</p>
    </section>
    <button type="button" data-rw-hunt-action="new-hunt" hidden><i class="fa-solid fa-rotate-right"></i> New Hunt</button>
    ${testMode ? '<small class="rw-hunt-test-note">Test mode does not create inventory rewards.</small>' : ""}
  </section>`;
}

function createHarvestItemSources(quarry, harvest) {
  const sources = [];
  if (harvest.meatLb > 0) sources.push({
    name: `${quarry.name} Venison`, type: "loot", img: "icons/consumables/meat/steak-raw-red.webp",
    system: { quantity: harvest.meatLb, weight: { value: 1, units: "lb" }, price: { value: 0, denomination: "gp" }, description: { value: `<p>Usable meat harvested from a ${escapeHTML(quarry.name)}.</p>`, chat: "" } },
    flags: { [MODULE_ID]: { huntingHarvest: { version: 1, quarryId: quarry.id, resource: "meat" } } }
  });
  if (harvest.hide > 0) sources.push({
    name: `${quarry.name} Hide`, type: "loot", img: "icons/commodities/leather/leather-patch-tan.webp",
    system: { quantity: harvest.hide, weight: { value: 5, units: "lb" }, price: { value: 0, denomination: "gp" }, description: { value: `<p>A field-dressed hide from a ${escapeHTML(quarry.name)}.</p>`, chat: "" } },
    flags: { [MODULE_ID]: { huntingHarvest: { version: 1, quarryId: quarry.id, resource: "hide" } } }
  });
  if (harvest.antlers > 0) sources.push({
    name: `${quarry.name} Antler`, type: "loot", img: "icons/commodities/bones/horn-antler-brown.webp",
    system: { quantity: harvest.antlers, weight: { value: 1, units: "lb" }, price: { value: 0, denomination: "gp" }, description: { value: `<p>Recovered antler from a ${escapeHTML(quarry.name)}.</p>`, chat: "" } },
    flags: { [MODULE_ID]: { huntingHarvest: { version: 1, quarryId: quarry.id, resource: "antler" } } }
  });
  return sources;
}

function dialogRoot(dialog, selector) {
  const element = dialog.element?.[0] ?? dialog.element;
  return element?.querySelector?.(selector) ?? element;
}

function ensureHuntingShotDrawingElements(root) {
  const arena = root?.querySelector?.("[data-rw-hunt-arena]");
  const target = root?.querySelector?.("[data-rw-hunt-deer-art]");
  if (!arena || !target || typeof globalThis.document?.createElement !== "function") return false;

  // Foundry DialogV2 sanitizes string content through cleanHTML, which removes
  // canvas and SVG tags. Create these trusted renderer surfaces after render.
  if (!arena.querySelector("[data-rw-hunt-point-forest]")) {
    const forest = globalThis.document.createElement("canvas");
    forest.className = "rw-hunt-point-forest";
    forest.dataset.rwHuntPointForest = "";
    forest.setAttribute("aria-hidden", "true");
    arena.prepend(forest);
  }

  if (!arena.querySelector("[data-rw-hunt-tracer]")) {
    const tracer = globalThis.document.createElementNS(SVG_NAMESPACE, "svg");
    tracer.classList.add("rw-hunt-tracer");
    tracer.dataset.rwHuntTracer = "";
    tracer.setAttribute("viewBox", "0 0 100 100");
    tracer.setAttribute("preserveAspectRatio", "none");
    tracer.setAttribute("aria-hidden", "true");
    tracer.hidden = true;
    const line = globalThis.document.createElementNS(SVG_NAMESPACE, "polyline");
    line.dataset.rwHuntTracerLine = "";
    line.setAttribute("points", "");
    tracer.append(line);
    arena.append(tracer);
  }

  if (!target.querySelector("[data-rw-hunt-point-deer]")) {
    const deer = globalThis.document.createElement("canvas");
    deer.className = "rw-hunt-point-deer";
    deer.dataset.rwHuntPointDeer = "";
    deer.setAttribute("role", "img");
    deer.setAttribute("aria-label", "Moving deer target");
    target.prepend(deer);
  }

  if (!target.querySelector("[data-rw-hunt-hitbox-overlay]")) {
    const overlay = globalThis.document.createElementNS(SVG_NAMESPACE, "svg");
    overlay.classList.add("rw-hunt-hitbox-overlay");
    overlay.dataset.rwHuntHitboxOverlay = "";
    overlay.setAttribute("viewBox", "0 0 180 150");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    target.append(overlay);
  }
  return true;
}

function createTrackingDialogClass(DialogV2) {
  return class HuntingTrackingDialog extends DialogV2 {
    constructor({ actor, testMode = false, seed = null } = {}) {
      super({
        classes: ["rw-hunt-dialog", "rw-hunt-roll-dialog"],
        window: { title: "Regionwright Hunting Rolls", icon: "fa-solid fa-dice-d20", resizable: true, minimizable: false },
        position: { width: 520, height: 430 },
        content: trackingMarkup(actor, { testMode }),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }]
      });
      this.actor = actor;
      this.testMode = testMode;
      this.seed = seed ?? `${actor?.uuid ?? actor?.id ?? actor?.name ?? "hunter"}:${Date.now()}`;
      this.wind = Object.freeze({ mph: 0, label: "Calm" });
      this.quarryTier = null;
      this.range = null;
      this.trackTotal = null;
      this.stealthTotal = null;
    }
    root() { return dialogRoot(this, "[data-rw-hunt-roll-root]"); }
    _onRender(context, options) {
      super._onRender(context, options);
      this.root()?.addEventListener("click", event => {
        const button = event.target?.closest?.("[data-rw-hunt-action]");
        if (!button) return;
        event.preventDefault();
        if (button.dataset.rwHuntAction === "track") void this.rollTrack(button);
        else if (button.dataset.rwHuntAction === "sneak") void this.rollSneak(button);
        else if (button.dataset.rwHuntAction === "begin-shot") void this.beginShot();
      });
    }
    async rollTrack(button) {
      button.disabled = true;
      try {
        const { total } = await rollHuntingSkill(this.actor, "sur");
        this.trackTotal = total;
        this.quarryTier = quarryTierForSurvival(total);
        setText(this.root(), "[data-rw-hunt-track-result]", `Survival ${total}: ${this.quarryTier.label}. You find a ${this.quarryTier.quarry.name}.`);
        show(this.root(), '[data-rw-hunt-stage="sneak"]', true);
      } catch (error) {
        button.disabled = false;
        globalThis.ui?.notifications?.warn?.(error.message);
      }
    }
    async rollSneak(button) {
      button.disabled = true;
      try {
        const { total } = await rollHuntingSkill(this.actor, "ste");
        this.stealthTotal = total;
        this.range = distanceForStealth(total);
        setText(this.root(), "[data-rw-hunt-sneak-result]", `Stealth ${total}: ${this.range.label}. You get within ${this.range.yards} yards.`);
        const begin = show(this.root(), '[data-rw-hunt-action="begin-shot"]', true);
        if (begin) begin.innerHTML = `<i class="fa-solid fa-crosshairs"></i> Take the Shot - ${this.range.yards} yd`;
      } catch (error) {
        button.disabled = false;
        globalThis.ui?.notifications?.warn?.(error.message);
      }
    }
    async beginShot() {
      if (!this.quarryTier || !this.range) return;
      const data = {
        actor: this.actor,
        testMode: this.testMode,
        seed: this.seed,
        wind: this.wind,
        quarryTier: this.quarryTier,
        range: this.range,
        trackTotal: this.trackTotal,
        stealthTotal: this.stealthTotal
      };
      await this.close();
      await openHuntingShot(data);
    }
  };
}

function createShotDialogClass(DialogV2) {
  return class HuntingShotDialog extends DialogV2 {
    constructor({ actor, testMode = false, seed, wind, quarryTier, range, trackTotal, stealthTotal, calibrationMode = null } = {}) {
      super({
        classes: ["rw-hunt-dialog", "rw-hunt-shot-dialog"],
        window: { title: "Regionwright Hunt", icon: "fa-solid fa-crosshairs", resizable: true, minimizable: false },
        position: { width: 900, height: 690 },
        content: shotMarkup({ quarryTier, range, testMode, calibrationMode }),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }]
      });
      Object.assign(this, { actor, testMode, seed, wind, quarryTier, range, trackTotal, stealthTotal, calibrationMode });
      this.shot = null;
      this.mouse = { u: 0.5, v: 0.42 };
      this.drawStartedAt = null;
      this.animationFrame = null;
      this.arrowAnimationFrame = null;
      this.arrowHideTimeout = null;
      this.shotResolved = false;
      this.reticleAnchored = false;
      this.drawMilestones = new Set();
      this.motionProfile = deerMovementProfile(`${this.seed}:quarry`);
      this.motionStartedAt = globalThis.performance?.now?.() ?? Date.now();
      this.motionFrozenAtMs = null;
      this.stamina = STAMINA_MAX;
      this.lastStaminaTickAt = this.motionStartedAt;
      this.staminaRecoveryAt = this.motionStartedAt;
      this.tracerTimeout = null;
      this.pointBoardGeneration = 0;
      this.pointBoardCache = null;
      this.forestRenderer = null;
      this.deerRenderer = null;
      this.forestResizeObserver = null;
      this.prefersReducedMotion = Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    }
    root() { return dialogRoot(this, "[data-rw-hunt-shot-root]"); }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.root();
      ensureHuntingShotDrawingElements(root);
      this.disposePointBoardRenderers();
      const pointBoardGeneration = ++this.pointBoardGeneration;
      this.renderDeer(false);
      void this.loadPointBoardArt(pointBoardGeneration);
      const target = root?.querySelector?.("[data-rw-hunt-target]");
      if (target) target.style.width = `${targetWidthForDistance(this.range.yards)}px`;
      this.paintDeerMotion(0);
      this.paintStamina();
      root?.querySelector?.("[data-rw-hunt-hitbox-toggle]")?.addEventListener("change", event => this.renderDeer(Boolean(event.target.checked)));
      root?.addEventListener("click", event => {
        const button = event.target?.closest?.("[data-rw-hunt-action]");
        if (!button) return;
        event.preventDefault();
        if (button.dataset.rwHuntAction === "restart") void this.restartHunt();
        else if (button.dataset.rwHuntAction === "harvest-next") void this.continueToHarvest();
      });
      const arena = root?.querySelector?.("[data-rw-hunt-arena]");
      arena?.addEventListener("pointermove", event => this.onPointerMove(event));
      arena?.addEventListener("pointerdown", event => this.onPointerDown(event));
      arena?.addEventListener("pointerup", event => this.onPointerUp(event));
      arena?.addEventListener("pointercancel", () => this.cancelDraw());
      arena?.addEventListener("contextmenu", event => { if (this.drawStartedAt !== null) { event.preventDefault(); this.cancelDraw(); } });
      this.startAnimation();
    }
    renderDeer(showHitboxes) {
      const overlay = this.root()?.querySelector?.("[data-rw-hunt-hitbox-overlay]");
      if (!overlay) return;
      overlay.hidden = !showHitboxes;
      overlay.innerHTML = showHitboxes ? deerHitboxOverlayMarkup({ testAnatomy: this.testMode }) : "";
    }
    async loadPointBoardArt(generation) {
      try {
        const asset = await huntingPointBoardAsset();
        if (generation !== this.pointBoardGeneration) return;
        const root = this.root();
        const arena = root?.querySelector?.("[data-rw-hunt-arena]");
        const forestCanvas = root?.querySelector?.("[data-rw-hunt-point-forest]");
        const deerCanvas = root?.querySelector?.("[data-rw-hunt-point-deer]");
        const forestLayer = asset.cache.layers.get("forest");
        const deerLayer = asset.cache.layers.get("deer");
        if (!arena || !forestCanvas || !deerCanvas || !forestLayer || !deerLayer) throw new Error("The Hunting board is missing its forest or deer layer.");

        this.pointBoardCache = asset.cache;
        this.forestRenderer = new PointBoardDataLayerRenderer(forestCanvas, forestLayer, { maxPixelRatio: 1 });
        this.deerRenderer = new PointBoardDataLayerRenderer(deerCanvas, deerLayer, { maxPixelRatio: 2, sourceRect: DEER_POINT_BOARD_SOURCE_RECT });
        if (typeof globalThis.ResizeObserver === "function") {
          this.forestResizeObserver = new globalThis.ResizeObserver(() => this.resizePointBoardForest());
          this.forestResizeObserver.observe(arena);
        }
        this.resizePointBoardForest();
        this.paintDeerMotion();
        const status = root.querySelector?.("[data-rw-hunt-point-board-status]");
        if (status) { status.hidden = true; status.textContent = ""; }
      } catch (error) {
        if (generation !== this.pointBoardGeneration) return;
        globalThis.console?.error?.("Regionwright Hunting point-board art could not be loaded.", error);
        const status = this.root()?.querySelector?.("[data-rw-hunt-point-board-status]");
        if (status) {
          const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "Unknown error");
          status.textContent = this.testMode
            ? `The point-board art could not load: ${detail.replace(/\s+/g, " ").slice(0, 220)}`
            : "The point-board art could not load. Ask the GM to check the Hunting module assets.";
          status.hidden = false;
        }
      }
    }
    resizePointBoardForest() {
      const root = this.root();
      const arena = root?.querySelector?.("[data-rw-hunt-arena]");
      const forestCanvas = root?.querySelector?.("[data-rw-hunt-point-forest]");
      const layer = this.pointBoardCache?.layers.get("forest");
      const rect = arena?.getBoundingClientRect?.();
      if (!forestCanvas || !layer || !rect?.width || !rect?.height) return;
      const scale = Math.max(rect.width / layer.frameWidth, rect.height / layer.frameHeight);
      forestCanvas.style.width = `${layer.frameWidth * scale}px`;
      forestCanvas.style.height = `${layer.frameHeight * scale}px`;
      this.forestRenderer?.render({ moving: false, devicePixelRatio: 1 });
    }
    disposePointBoardRenderers() {
      this.forestResizeObserver?.disconnect?.();
      this.forestResizeObserver = null;
      this.forestRenderer?.dispose?.();
      this.deerRenderer?.dispose?.();
      this.forestRenderer = null;
      this.deerRenderer = null;
      this.pointBoardCache = null;
    }
    motionElapsedMs(now = globalThis.performance?.now?.() ?? Date.now()) {
      return this.motionFrozenAtMs ?? Math.max(0, now - this.motionStartedAt);
    }
    motionCenterU(state, arenaRect, targetRect) {
      if (!arenaRect?.width || !targetRect?.width) return 0.5;
      const positionM = Number.isFinite(Number(state?.positionM)) ? Number(state.positionM) : ((Number(state?.position) || 0) - 0.5) * DEER_MOTION_LANE_M;
      return projectDeerCenterU(positionM, { arenaWidthPx: arenaRect.width, targetWidthPx: targetRect.width });
    }
    paintDeerMotion(elapsedMs = this.motionElapsedMs()) {
      const root = this.root();
      const arena = root?.querySelector?.("[data-rw-hunt-arena]");
      const target = root?.querySelector?.("[data-rw-hunt-target]");
      const art = root?.querySelector?.("[data-rw-hunt-deer-art]");
      const arenaRect = arena?.getBoundingClientRect?.();
      const targetRect = target?.getBoundingClientRect?.();
      if (!target || !arenaRect?.width || !targetRect?.width) return null;
      const state = deerMotionAtMs(elapsedMs, this.motionProfile);
      const centerU = this.motionCenterU(state, arenaRect, targetRect);
      target.style.left = `${centerU * 100}%`;
      target.dataset.motion = state.moving ? "moving" : "paused";
      target.dataset.facing = String(state.facing);
      if (art) art.style.setProperty("--rw-deer-facing", String(state.facing));
      this.deerRenderer?.render({ elapsedMs, moving: state.moving && !this.prefersReducedMotion });
      return { ...state, centerU };
    }
    onPointerMove(event) {
      if (this.shotResolved) return;
      const arena = this.root()?.querySelector?.("[data-rw-hunt-arena]");
      const rect = arena?.getBoundingClientRect?.();
      if (!rect?.width || !rect?.height) return;
      this.mouse.u = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      this.mouse.v = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      this.paintAim();
    }
    onPointerDown(event) {
      if (event.button !== 0 || this.shotResolved || this.drawStartedAt !== null) return;
      event.preventDefault();
      if (this.stamina <= 0.01) {
        setText(this.root(), "[data-rw-hunt-shot-result]", "Too exhausted to draw. Let your arms recover.");
        return;
      }
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      this.drawStartedAt = globalThis.performance?.now?.() ?? Date.now();
      this.lastStaminaTickAt = this.drawStartedAt;
      this.staminaRecoveryAt = Number.POSITIVE_INFINITY;
      this.drawMilestones.clear();
      this.root()?.querySelectorAll?.("[data-rw-hunt-milestone]")?.forEach?.(marker => marker.classList.remove("pulse", "reached"));
      setText(this.root(), "[data-rw-hunt-shot-result]", "Drawing...");
    }
    onPointerUp(event) {
      if (event.button !== 0 || this.drawStartedAt === null || this.shotResolved) return;
      event.preventDefault();
      const now = globalThis.performance?.now?.() ?? Date.now();
      const drawMs = now - this.drawStartedAt;
      this.drawStartedAt = null;
      this.staminaRecoveryAt = now + STAMINA_RECOVERY_DELAY_MS;
      void this.fire(drawMs);
    }
    cancelDraw(message = "Bow lowered. Take your time.") {
      if (this.drawStartedAt === null) return;
      const now = globalThis.performance?.now?.() ?? Date.now();
      this.drawStartedAt = null;
      this.staminaRecoveryAt = now + STAMINA_RECOVERY_DELAY_MS;
      setText(this.root(), "[data-rw-hunt-shot-result]", message);
      this.drawMilestones.clear();
      this.root()?.querySelectorAll?.("[data-rw-hunt-milestone]")?.forEach?.(marker => marker.classList.remove("pulse", "reached"));
      this.paintDraw(0);
    }
    paintAim() {
      if (this.reticleAnchored) return;
      const root = this.root();
      const arena = root?.querySelector?.("[data-rw-hunt-arena]");
      const reticle = root?.querySelector?.("[data-rw-hunt-reticle]");
      const rect = arena?.getBoundingClientRect?.();
      if (!rect || !reticle) return;
      const x = Math.max(10, Math.min(rect.width - 10, this.mouse.u * rect.width));
      const y = Math.max(10, Math.min(rect.height - 10, this.mouse.v * rect.height));
      reticle.style.left = `${x}px`;
      reticle.style.top = `${y}px`;
      reticle.dataset.x = String(x);
      reticle.dataset.y = String(y);
    }
    paintStamina() {
      const percent = Math.max(0, Math.min(100, this.stamina));
      const meter = this.root()?.querySelector?.("[data-rw-hunt-stamina-meter]");
      const label = this.root()?.querySelector?.("[data-rw-hunt-stamina-label]");
      if (meter) {
        meter.style.width = `${percent}%`;
        const warning = percent <= 50;
        meter.dataset.level = percent <= 15 ? "critical" : warning ? "strained" : "normal";
        if (warning) {
          const urgency = Math.max(0, Math.min(1, (50 - percent) / 50));
          const pulseMs = Math.round(1100 - (750 * urgency));
          meter.style.setProperty("--rw-stamina-pulse-ms", `${pulseMs}ms`);
        } else {
          meter.style.removeProperty("--rw-stamina-pulse-ms");
        }
      }
      if (label) label.textContent = `${Math.round(percent)}%`;
    }
    projectTrajectorySamples(trajectory, { releaseCenterU, releaseCenterV, arenaWidth, arenaHeight, pixelsPerMeter, startU = 0.5, startV = 0.92 } = {}) {
      if (!trajectory?.samples?.length || !trajectory.distanceM || !arenaWidth || !arenaHeight) return [];
      const xScale = pixelsPerMeter / arenaWidth;
      const yScale = pixelsPerMeter / arenaHeight;
      return trajectory.samples.map(sample => {
        const progress = Math.max(0, Math.min(1, sample.zM / trajectory.distanceM));
        return Object.freeze({
          timeSeconds: sample.timeSeconds,
          u: startU + ((releaseCenterU - startU) * progress) + (sample.xM * xScale),
          v: startV + ((releaseCenterV - startV) * progress) - (sample.yM * yScale)
        });
      });
    }
    projectedPointAtTime(samples, timeSeconds) {
      if (!samples?.length) return null;
      if (timeSeconds <= samples[0].timeSeconds) return samples[0];
      const last = samples[samples.length - 1];
      if (timeSeconds >= last.timeSeconds) return last;
      let low = 0;
      let high = samples.length - 1;
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (samples[mid].timeSeconds <= timeSeconds) low = mid;
        else high = mid;
      }
      const a = samples[low];
      const b = samples[high];
      const span = Math.max(1e-9, b.timeSeconds - a.timeSeconds);
      const t = Math.max(0, Math.min(1, (timeSeconds - a.timeSeconds) / span));
      return { timeSeconds, u: a.u + ((b.u - a.u) * t), v: a.v + ((b.v - a.v) * t) };
    }
    paintTracer(samples, timeSeconds, currentPoint = null) {
      const tracer = this.root()?.querySelector?.("[data-rw-hunt-tracer]");
      const line = tracer?.querySelector?.("[data-rw-hunt-tracer-line]");
      if (!tracer || !line || !samples?.length) return;
      tracer.hidden = false;
      tracer.classList.remove("fading");
      const visible = samples.filter(sample => sample.timeSeconds <= timeSeconds).map(sample => `${(sample.u * 100).toFixed(3)},${(sample.v * 100).toFixed(3)}`);
      if (currentPoint) visible.push(`${(currentPoint.u * 100).toFixed(3)},${(currentPoint.v * 100).toFixed(3)}`);
      line.setAttribute("points", visible.join(" "));
    }
    pulseMilestone(percent) {
      const marker = this.root()?.querySelector?.(`[data-rw-hunt-milestone="${percent}"]`);
      if (!marker) return;
      marker.classList.remove("pulse");
      void marker.offsetWidth;
      marker.classList.add("reached", "pulse");
      setTimeout(() => marker.classList.remove("pulse"), 340);
    }
    paintDraw(drawMs) {
      const strength = drawStrengthForMs(drawMs);
      const percent = Math.round(strength * 100);
      const meter = this.root()?.querySelector?.("[data-rw-hunt-draw-meter]");
      const label = this.root()?.querySelector?.("[data-rw-hunt-draw-label]");
      if (meter) meter.style.width = `${percent}%`;
      if (label) label.textContent = `${percent}%`;
      for (const milestone of DRAW_MILESTONES) {
        const markerPercent = Math.round(milestone * 100);
        if (strength >= milestone && !this.drawMilestones.has(markerPercent)) {
          this.drawMilestones.add(markerPercent);
          this.pulseMilestone(markerPercent);
        }
      }
    }
    startAnimation() {
      this.stopAnimation();
      const tick = () => {
        if (this.shotResolved) return;
        const now = globalThis.performance?.now?.() ?? Date.now();
        const deltaMs = Math.max(0, Math.min(100, now - this.lastStaminaTickAt));
        this.lastStaminaTickAt = now;
        const drawMs = this.drawStartedAt === null ? 0 : now - this.drawStartedAt;
        if (this.drawStartedAt !== null) {
          const strength = drawStrengthForMs(drawMs);
          this.stamina = staminaAfterDrawing(this.stamina, strength, deltaMs);
          if (this.stamina <= 0.001) {
            this.stamina = 0;
            this.paintStamina();
            this.cancelDraw("Your arms give out and you lower the bow.");
          }
        } else if (now >= this.staminaRecoveryAt) {
          this.stamina = staminaAfterRecovery(this.stamina, deltaMs);
        }
        this.paintDraw(this.drawStartedAt === null ? 0 : drawMs);
        this.paintStamina();
        this.paintDeerMotion(now - this.motionStartedAt);
        this.animationFrame = globalThis.requestAnimationFrame?.(tick) ?? null;
      };
      this.animationFrame = globalThis.requestAnimationFrame?.(tick) ?? null;
    }
    stopAnimation() {
      if (this.animationFrame !== null) globalThis.cancelAnimationFrame?.(this.animationFrame);
      this.animationFrame = null;
    }
    anchorReticleToArena(reticle, reticleX, reticleY, arenaRect) {
      const arena = this.root()?.querySelector?.("[data-rw-hunt-arena]");
      if (!arena || !reticle || !arenaRect.width || !arenaRect.height) return;
      arena.appendChild(reticle);
      reticle.style.left = `${(reticleX / arenaRect.width) * 100}%`;
      reticle.style.top = `${(reticleY / arenaRect.height) * 100}%`;
      this.reticleAnchored = true;
    }
    async fire(drawMs) {
      const root = this.root();
      const arena = root?.querySelector?.("[data-rw-hunt-arena]");
      const target = root?.querySelector?.("[data-rw-hunt-target]");
      const reticle = root?.querySelector?.("[data-rw-hunt-reticle]");
      const arenaRect = arena?.getBoundingClientRect?.();
      const targetRect = target?.getBoundingClientRect?.();
      if (!arenaRect || !targetRect || !reticle) return;
      const releasedAt = globalThis.performance?.now?.() ?? Date.now();
      const releaseElapsedMs = Math.max(0, releasedAt - this.motionStartedAt);
      const releaseMotion = this.paintDeerMotion(releaseElapsedMs) ?? deerMotionAtMs(releaseElapsedMs, this.motionProfile);
      const releaseTargetRect = target.getBoundingClientRect();
      this.stopAnimation();
      const drawStrength = drawStrengthForMs(drawMs);
      const reticleX = Number(reticle.dataset.x ?? (this.mouse.u * arenaRect.width));
      const reticleY = Number(reticle.dataset.y ?? (this.mouse.v * arenaRect.height));
      const targetCenterX = (releaseTargetRect.left - arenaRect.left) + releaseTargetRect.width / 2;
      const targetCenterY = (releaseTargetRect.top - arenaRect.top) + releaseTargetRect.height / 2;
      const pixelsPerMeter = releaseTargetRect.width / DEER_WIDTH_M;
      const aimXM = (reticleX - targetCenterX) / pixelsPerMeter;
      const aimYM = (targetCenterY - reticleY) / pixelsPerMeter;
      const basePhysics = calculateArrowImpact({
        distanceYards: this.range.yards,
        drawStrength,
        aimXM,
        aimYM,
        windMph: 0,
        aimingMode: this.calibrationMode === "holdover" ? "holdover" : "pin"
      });
      const trajectory = sampleArrowTrajectoryToDistance({
        distanceYards: this.range.yards,
        speedMps: basePhysics.launchSpeedMps,
        launchElevationRadians: basePhysics.elevationRadians,
        launchAzimuthRadians: basePhysics.azimuthRadians,
        windMph: 0,
        kappa: basePhysics.kappa,
        sightHeightM: basePhysics.sightHeightM
      });
      const synchronizedBasePhysics = Object.freeze({
        ...basePhysics,
        timeSeconds: trajectory.impact.timeSeconds,
        impactSpeedMps: trajectory.impact.speedMps,
        impactXM: trajectory.impact.xM,
        impactYM: trajectory.impact.yM,
        verticalErrorM: trajectory.impact.yM - aimYM
      });
      const impactElapsedMs = releaseElapsedMs + (synchronizedBasePhysics.timeSeconds * 1000);
      const impactMotionRaw = deerMotionAtMs(impactElapsedMs, this.motionProfile);
      const impactCenterU = this.motionCenterU(impactMotionRaw, arenaRect, releaseTargetRect);
      const targetDeltaPx = (impactCenterU - releaseMotion.centerU) * arenaRect.width;
      const targetDeltaM = (Number(impactMotionRaw.positionM) || 0) - (Number(releaseMotion.positionM) || 0);
      const physicalPhysics = adjustImpactForTargetMovement(synchronizedBasePhysics, targetDeltaM);
      const forgiveness = applyMovingTargetAimForgiveness(physicalPhysics, {
        facing: impactMotionRaw.facing,
        moving: releaseMotion.moving,
        velocityPerSecond: releaseMotion.velocityMps,
        aimXM,
        zones: this.testMode ? DEER_TEST_HIT_ZONES : DEER_HIT_ZONES
      });
      const physics = forgiveness.impact;
      const hit = forgiveness.hit;
      this.shot = {
        drawMs, drawStrength, physics, hit, calibrationMode: this.calibrationMode,
        aimAssistApplied: forgiveness.applied, aimAssistCorrectionM: forgiveness.correctionM,
        movement: {
          releaseElapsedMs, impactElapsedMs, targetDeltaM, targetDeltaPx,
          releaseMotion, impactMotion: impactMotionRaw,
          releaseVelocityMps: Number(releaseMotion.velocityMps) || 0,
          releasePhase: releaseMotion.phase,
          aimLeadM: aimXM,
          physicalHorizontalMissM: Number(physicalPhysics.impactXM) || 0,
          resolvedHorizontalMissM: Number(physics.impactXM) || 0
        }
      };
      this.shotResolved = true;
      this.anchorReticleToArena(reticle, reticleX, reticleY, arenaRect);
      const impact = root?.querySelector?.("[data-rw-hunt-impact]");
      if (impact) {
        impact.hidden = true;
        impact.style.left = `${(hit.point.x / 180) * 100}%`;
        impact.style.top = `${(hit.point.y / 150) * 100}%`;
        impact.dataset.quality = hit.quality;
      }
      const releaseCenterU = (((releaseTargetRect.left - arenaRect.left) + (releaseTargetRect.width / 2)) / arenaRect.width);
      const releaseCenterV = (((releaseTargetRect.top - arenaRect.top) + (releaseTargetRect.height / 2)) / arenaRect.height);
      const projectedTrajectory = this.projectTrajectorySamples(trajectory, {
        releaseCenterU,
        releaseCenterV,
        arenaWidth: arenaRect.width,
        arenaHeight: arenaRect.height,
        pixelsPerMeter
      });
      this.animateArrow(projectedTrajectory, { releaseElapsedMs, impactElapsedMs, onImpact: () => { if (impact) impact.hidden = false; } });
      const drawText = `${Math.round(drawStrength * 100)}% draw`;
      const vertical = physics.verticalErrorM < 0 ? `${Math.abs(physics.verticalErrorM).toFixed(2)}m low` : `${physics.verticalErrorM.toFixed(2)}m high`;
      const movementText = Math.abs(physics.targetDeltaM ?? 0) < 0.03 ? "quarry paused" : `quarry moved ${Math.abs(physics.targetDeltaM).toFixed(2)}m ${physics.targetDeltaM < 0 ? "left" : "right"}`;
      const aimingText = this.calibrationMode === "holdover" ? `trained ${this.range.yards} yd holdover` : this.calibrationMode === "movement" ? "movement calibration" : `${physics.sightPinYards} yd pin`;
      const ballisticText = `${Math.round(mpsToFps(physics.launchSpeedMps))} fps launch, ${physics.timeSeconds.toFixed(2)}s flight, ${vertical}, ${movementText}, ${aimingText}`;
      if (this.testMode) {
        const velocity = Number(releaseMotion.velocityMps) || 0;
        const velocityText = Math.abs(velocity) < 0.01 ? "0.00 m/s paused" : `${Math.abs(velocity).toFixed(2)} m/s ${velocity < 0 ? "left" : "right"}`;
        const lead = Number(aimXM) || 0;
        const leadText = Math.abs(lead) < 0.005 ? "0.00 m centered" : `${Math.abs(lead).toFixed(2)} m ${lead < 0 ? "left" : "right"}`;
        const rawMiss = Number(physicalPhysics.impactXM) || 0;
        const rawMissText = Math.abs(rawMiss) < 0.005 ? "0.00 m centered" : `${Math.abs(rawMiss).toFixed(2)} m ${rawMiss < 0 ? "left" : "right"}`;
        const assistText = forgiveness.applied ? `; forgiveness ${Math.abs(forgiveness.correctionM).toFixed(2)} m ${forgiveness.correctionM < 0 ? "left" : "right"}` : "";
        setText(root, "[data-rw-hunt-shot-diagnostic]", `Release ${velocityText} (${releaseMotion.phase}); target travel ${Math.abs(targetDeltaM).toFixed(2)} m ${targetDeltaM < 0 ? "left" : targetDeltaM > 0 ? "right" : "none"}; release aim offset ${leadText}; physical horizontal miss ${rawMissText}${assistText}.`);
      }
      if (hit.lethal) {
        setText(root, "[data-rw-hunt-shot-result]", `${hit.label} hit - ${hit.quality === "perfect" ? "exceptional" : hit.quality} kill. ${drawText}; ${ballisticText}.`);
        if (this.calibrationMode) show(root, '[data-rw-hunt-action="restart"]', true);
        else show(root, '[data-rw-hunt-action="harvest-next"]', true);
      } else {
        setText(root, "[data-rw-hunt-shot-result]", `${hit.label}. The quarry escapes. ${drawText}; ${ballisticText}.`);
        show(root, '[data-rw-hunt-action="restart"]', true);
      }
    }
    animateArrow(projectedTrajectory, { releaseElapsedMs = this.motionElapsedMs(), impactElapsedMs = releaseElapsedMs, onImpact = null } = {}) {
      const arrow = this.root()?.querySelector?.("[data-rw-hunt-arrow]");
      const arena = this.root()?.querySelector?.("[data-rw-hunt-arena]");
      const tracer = this.root()?.querySelector?.("[data-rw-hunt-tracer]");
      if (!arrow || !arena || !projectedTrajectory?.length) return;
      this.cancelProjectileAnimation();
      const finalPoint = projectedTrajectory[projectedTrajectory.length - 1];
      const duration = Math.max(1, finalPoint.timeSeconds * 1000);
      const started = globalThis.performance?.now?.() ?? Date.now();
      if (tracer) { tracer.hidden = false; tracer.classList.remove("fading"); }
      arrow.hidden = false;
      const step = now => {
        this.arrowAnimationFrame = null;
        const elapsedMs = Math.max(0, Math.min(duration, now - started));
        const flightSeconds = elapsedMs / 1000;
        const current = this.projectedPointAtTime(projectedTrajectory, flightSeconds);
        const previous = this.projectedPointAtTime(projectedTrajectory, Math.max(0, flightSeconds - (1 / 60)));
        const arenaRect = arena.getBoundingClientRect();
        if (current) {
          arrow.style.left = `${current.u * 100}%`;
          arrow.style.top = `${current.v * 100}%`;
          if (previous) {
            const dx = (current.u - previous.u) * arenaRect.width;
            const dy = (current.v - previous.v) * arenaRect.height;
            arrow.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
          }
          this.paintTracer(projectedTrajectory, flightSeconds, current);
        }
        this.paintDeerMotion(releaseElapsedMs + elapsedMs);
        if (elapsedMs < duration) this.arrowAnimationFrame = globalThis.requestAnimationFrame?.(step) ?? null;
        else {
          this.motionFrozenAtMs = impactElapsedMs;
          this.paintDeerMotion(impactElapsedMs);
          this.paintTracer(projectedTrajectory, finalPoint.timeSeconds, finalPoint);
          if (typeof onImpact === "function") onImpact();
          this.arrowHideTimeout = setTimeout(() => {
            arrow.hidden = true;
            this.arrowHideTimeout = null;
          }, 250);
          if (tracer) {
            tracer.classList.add("fading");
            this.tracerTimeout = setTimeout(() => {
              tracer.hidden = true;
              tracer.classList.remove("fading");
              this.tracerTimeout = null;
            }, 1400);
          }
        }
      };
      this.arrowAnimationFrame = globalThis.requestAnimationFrame?.(step) ?? null;
    }
    cancelProjectileAnimation() {
      if (this.arrowAnimationFrame !== null) globalThis.cancelAnimationFrame?.(this.arrowAnimationFrame);
      this.arrowAnimationFrame = null;
      if (this.arrowHideTimeout !== null) clearTimeout(this.arrowHideTimeout);
      this.arrowHideTimeout = null;
      if (this.tracerTimeout !== null) clearTimeout(this.tracerTimeout);
      this.tracerTimeout = null;
    }
    async continueToHarvest() {
      if (this.calibrationMode || !this.shot?.hit?.lethal) return;
      const data = { actor: this.actor, testMode: this.testMode, seed: this.seed, quarryTier: this.quarryTier, shot: this.shot };
      await this.close();
      await openHarvestRoll(data);
    }
    async restartHunt() {
      const retrySeed = `${this.seed}:retry:${Date.now()}`;
      await this.close();
      if (this.calibrationMode) {
        await openHuntingCalibrationShot({ actor: this.actor, distanceYards: this.range.yards, mode: this.calibrationMode, seed: retrySeed });
        return;
      }
      await openTrackingRolls({ actor: this.actor, testMode: this.testMode, seed: retrySeed });
    }
    async close(options = {}) {
      this.stopAnimation();
      this.cancelProjectileAnimation();
      this.pointBoardGeneration += 1;
      this.disposePointBoardRenderers();
      return super.close(options);
    }
  };
}

function createHarvestDialogClass(DialogV2) {
  return class HuntingHarvestDialog extends DialogV2 {
    constructor({ actor, testMode = false, seed, quarryTier, shot } = {}) {
      super({
        classes: ["rw-hunt-dialog", "rw-hunt-roll-dialog"],
        window: { title: "Regionwright Harvest Roll", icon: "fa-solid fa-dice-d20", resizable: true, minimizable: false },
        position: { width: 500, height: 330 },
        content: harvestMarkup(actor, { quarryTier, shot, testMode }),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }]
      });
      Object.assign(this, { actor, testMode, seed, quarryTier, shot });
    }
    root() { return dialogRoot(this, "[data-rw-hunt-harvest-root]"); }
    _onRender(context, options) {
      super._onRender(context, options);
      this.root()?.addEventListener("click", event => {
        const button = event.target?.closest?.("[data-rw-hunt-action]");
        if (!button) return;
        event.preventDefault();
        if (button.dataset.rwHuntAction === "harvest") void this.rollHarvest(button);
        else if (button.dataset.rwHuntAction === "new-hunt") void this.newHunt();
      });
    }
    async rollHarvest(button) {
      button.disabled = true;
      try {
        const { total } = await rollHuntingSkill(this.actor, "sur");
        const harvest = harvestForSurvival({ total, quarry: this.quarryTier.quarry, shotQuality: this.shot.hit.quality });
        const parts = [`${harvest.meatLb} lb venison`];
        if (harvest.hide) parts.push(`${harvest.hide} hide`);
        if (harvest.antlers) parts.push(`${harvest.antlers} antlers`);
        setText(this.root(), "[data-rw-hunt-harvest-result]", `Survival ${total}: ${harvest.rank} harvest - ${parts.join(", ")}.`);
        if (!this.testMode) {
          if (typeof this.actor?.createEmbeddedDocuments !== "function") throw new Error("This Actor cannot receive harvested Items.");
          await this.actor.createEmbeddedDocuments("Item", createHarvestItemSources(this.quarryTier.quarry, harvest));
        }
        show(this.root(), '[data-rw-hunt-action="new-hunt"]', true);
      } catch (error) {
        button.disabled = false;
        globalThis.ui?.notifications?.warn?.(error.message);
      }
    }
    async newHunt() {
      const data = { actor: this.actor, testMode: this.testMode, seed: `${this.seed}:new:${Date.now()}` };
      await this.close();
      await openTrackingRolls(data);
    }
  };
}

async function openTrackingRolls({ actor, testMode = false, seed = null } = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createTrackingDialogClass(DialogV2))({ actor, testMode, seed });
  await dialog.render({ force: true });
  return dialog;
}

async function openHuntingShot(data = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createShotDialogClass(DialogV2))(data);
  await dialog.render({ force: true });
  return dialog;
}

async function openHuntingCalibrationShot({ actor, distanceYards = 20, mode = "holdover", seed = null } = {}) {
  const calibrationMode = normalizeTestMode(mode);
  if (calibrationMode === "normal") return openHuntingTest({ actor, seed });
  const yards = normalizeTestModeRange(calibrationMode, distanceYards);
  const quarryTier = quarryTierForSurvival(12);
  return openHuntingShot({
    actor,
    testMode: true,
    seed: seed ?? `${calibrationMode}:${actor?.uuid ?? actor?.id ?? actor?.name ?? "hunter"}:${yards}:${Date.now()}`,
    wind: Object.freeze({ mph: 0, label: "Calm" }),
    quarryTier,
    range: Object.freeze({ yards, label: HUNTING_TEST_MODES[calibrationMode].label }),
    trackTotal: null,
    stealthTotal: null,
    calibrationMode
  });
}
export async function openHuntingTestMode({ actor: actorOrUuid, mode = "normal", distanceYards = null, seed = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can launch Hunting test modes.");
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before launching a Hunting test mode.");
  const id = normalizeTestMode(mode);
  if (id === "normal") return openHuntingTest({ actor, seed });
  return openHuntingCalibrationShot({ actor, distanceYards, mode: id, seed });
}
export async function openHuntingCalibration({ actor: actorOrUuid, distanceYards = 20, seed = null } = {}) {
  return openHuntingTestMode({ actor: actorOrUuid, mode: "holdover", distanceYards, seed });
}
async function openHarvestRoll(data = {}) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createHarvestDialogClass(DialogV2))(data);
  await dialog.render({ force: true });
  return dialog;
}

export async function openHunting({ actor: actorOrUuid, testMode = false, seed = null } = {}) {
  const actor = await resolveActor(actorOrUuid);
  if (!actor) throw new Error("Select a token or assign a character before hunting.");
  if (!testMode && !findHuntingBow(actor)) throw new Error(`You need the dedicated ${HUNTING_BOW_NAME} in your inventory to hunt.`);
  return openTrackingRolls({ actor, testMode, seed });
}

export async function openHuntingTest({ actor: actorOrUuid, seed = null } = {}) {
  return openHunting({ actor: actorOrUuid, testMode: true, seed });
}

function sendSocket(payload) { globalThis.game?.socket?.emit?.(HUNTING_SOCKET, payload); }
async function handleRemoteTest(payload, senderId) {
  const game = globalThis.game;
  if (payload.recipientUserId !== game?.user?.id) return;
  const requesterId = senderId ?? payload.requesterUserId;
  const sender = userById(requesterId);
  if (!sender?.isGM || sender.active !== true) return;
  const active = game.users?.activeGM;
  if (active && active.id !== sender.id) return;
  const reply = { action: "hunting-test-opened", requestId: payload.requestId, recipientUserId: requesterId, playerUserId: game.user.id };
  try {
    const actor = game.user?.character;
    if (!actor) throw new Error("Assign a character to this player before launching a hunting test.");
    await openHuntingTest({ actor, seed: payload.seed });
    sendSocket({ ...reply, success: true, userName: game.user?.name });
  } catch (error) {
    sendSocket({ ...reply, success: false, message: error.message });
    globalThis.ui?.notifications?.error?.(error.message);
  }
}
async function handleRemoteTestMode(payload, senderId) {
  const game = globalThis.game;
  if (payload.recipientUserId !== game?.user?.id) return;
  const requesterId = senderId ?? payload.requesterUserId;
  const sender = userById(requesterId);
  if (!sender?.isGM || sender.active !== true) return;
  const active = game.users?.activeGM;
  if (active && active.id !== sender.id) return;
  const reply = { action: "hunting-test-mode-opened", requestId: payload.requestId, recipientUserId: requesterId, playerUserId: game.user.id };
  try {
    const actor = game.user?.character;
    if (!actor) throw new Error("Assign a character to this player before launching a Hunting test mode.");
    const mode = normalizeTestMode(payload.mode);
    if (mode === "normal") await openHuntingTest({ actor, seed: payload.seed });
    else await openHuntingCalibrationShot({ actor, distanceYards: payload.distanceYards, mode, seed: payload.seed });
    sendSocket({ ...reply, success: true, userName: game.user?.name });
  } catch (error) {
    sendSocket({ ...reply, success: false, message: error.message });
    globalThis.ui?.notifications?.error?.(error.message);
  }
}
async function handleRemoteCalibration(payload, senderId) {
  const game = globalThis.game;
  if (payload.recipientUserId !== game?.user?.id) return;
  const requesterId = senderId ?? payload.requesterUserId;
  const sender = userById(requesterId);
  if (!sender?.isGM || sender.active !== true) return;
  const active = game.users?.activeGM;
  if (active && active.id !== sender.id) return;
  const reply = { action: "hunting-calibration-opened", requestId: payload.requestId, recipientUserId: requesterId, playerUserId: game.user.id };
  try {
    const actor = game.user?.character;
    if (!actor) throw new Error("Assign a character to this player before launching live Hunting holdover calibration.");
    await openHuntingCalibrationShot({ actor, distanceYards: payload.distanceYards, seed: payload.seed });
    sendSocket({ ...reply, success: true, userName: game.user?.name });
  } catch (error) {
    sendSocket({ ...reply, success: false, message: error.message });
    globalThis.ui?.notifications?.error?.(error.message);
  }
}
async function handleSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "hunting-open-test") return handleRemoteTest(payload, senderId);
  if (payload.action === "hunting-open-test-mode") return handleRemoteTestMode(payload, senderId);
  if (payload.action === "hunting-open-calibration") return handleRemoteCalibration(payload, senderId);
  if (payload.action === "hunting-test-opened" || payload.action === "hunting-test-mode-opened" || payload.action === "hunting-calibration-opened") {
    if (payload.recipientUserId !== globalThis.game?.user?.id) return;
    const pending = pendingTests.get(payload.requestId);
    if (!pending) return;
    pendingTests.delete(payload.requestId);
    clearTimeout(pending.timeout);
    pending.resolve({ success: Boolean(payload.success), message: payload.message, userName: payload.userName ?? pending.userName });
  }
}
export function installHuntingSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return false;
  globalThis.game.socket.on(HUNTING_SOCKET, (payload, senderId) => { void handleSocket(payload, senderId); });
  socketInstalled = true;
  return true;
}
export function requestHuntingTest(userId, { seed = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can send a hunting test to a player.");
  const user = userById(userId);
  if (!user || user.isGM || user.active !== true) throw new Error("Choose a connected, active player.");
  installHuntingSocket();
  const requestId = randomId();
  const actualSeed = seed ?? `${requestId}:${userId}`;
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      pendingTests.delete(requestId);
      resolve({ success: false, message: `No opening confirmation came back from ${user.name}.` });
    }, 8000);
    pendingTests.set(requestId, { resolve, timeout, userName: user.name });
    sendSocket({ action: "hunting-open-test", requestId, requesterUserId: globalThis.game.user.id, recipientUserId: user.id, seed: actualSeed });
  });
}
export function requestHuntingTestMode(userId, { mode = "normal", distanceYards = null, seed = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can send Hunting test modes to a player.");
  const id = normalizeTestMode(mode);
  const yards = id === "normal" ? null : normalizeTestModeRange(id, distanceYards);
  const user = userById(userId);
  if (!user || user.isGM || user.active !== true) throw new Error("Choose a connected, active player.");
  installHuntingSocket();
  const requestId = randomId();
  const actualSeed = seed ?? `${id}:${requestId}:${userId}:${yards ?? "rolled"}`;
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      pendingTests.delete(requestId);
      resolve({ success: false, message: `No ${HUNTING_TEST_MODES[id].label} opening confirmation came back from ${user.name}.` });
    }, 8000);
    pendingTests.set(requestId, { resolve, timeout, userName: user.name });
    sendSocket({ action: "hunting-open-test-mode", requestId, requesterUserId: globalThis.game.user.id, recipientUserId: user.id, mode: id, distanceYards: yards, seed: actualSeed });
  });
}
export function requestHuntingCalibration(userId, { distanceYards = 20, seed = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can send live Hunting holdover calibration to a player.");
  const yards = normalizeHoldoverCalibrationRange(distanceYards);
  const user = userById(userId);
  if (!user || user.isGM || user.active !== true) throw new Error("Choose a connected, active player.");
  installHuntingSocket();
  const requestId = randomId();
  const actualSeed = seed ?? `holdover:${requestId}:${userId}:${yards}`;
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      pendingTests.delete(requestId);
      resolve({ success: false, message: `No live calibration opening confirmation came back from ${user.name}.` });
    }, 8000);
    pendingTests.set(requestId, { resolve, timeout, userName: user.name });
    sendSocket({ action: "hunting-open-calibration", requestId, requesterUserId: globalThis.game.user.id, recipientUserId: user.id, distanceYards: yards, seed: actualSeed });
  });
}

