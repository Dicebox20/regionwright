import {
  BALLISTIC_PROFILES,
  BALLISTICS_LAB_AIMING_MODES,
  BALLISTICS_LAB_DRAW_STRENGTHS,
  BALLISTICS_LAB_RANGES_YARDS,
  DEER_HEIGHT_M,
  mpsToFps,
  simulateBallisticsLabShot
} from "./hunting-engine.js";

const MODULE_ID = "regionwright-hunting-gathering";
const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === globalThis.game?.user?.id));
const inches = meters => Number(meters || 0) * 39.37007874015748;
const degrees = radians => Number(radians || 0) * 180 / Math.PI;
const signText = (value, positive, negative, digits = 2) => {
  const n = Number(value) || 0;
  if (Math.abs(n) < 0.0005) return `0.00 ${positive}`;
  return `${Math.abs(n).toFixed(digits)} ${n > 0 ? positive : negative}`;
};
const profileOptions = () => Object.values(BALLISTIC_PROFILES).map(profile => `<option value="${escapeHTML(profile.id)}">${escapeHTML(profile.label)}</option>`).join("");
const rangeOptions = values => values.map(value => `<option value="${value}"${value === 35 ? " selected" : ""}>${value} yd</option>`).join("");
const drawOptions = () => BALLISTICS_LAB_DRAW_STRENGTHS.map(value => `<option value="${value}"${value === 1 ? " selected" : ""}>${Math.round(value * 100)}%</option>`).join("");
const aimingOptions = () => [
  ["traditional", "Horizontal reference"],
  ["holdover", "Trained holdover"],
  ["pin", "Automatic pin sight"],
  ["zero", "Explicit fixed zero"]
].map(([value, label]) => `<option value="${value}"${value === "pin" ? " selected" : ""}>${label}</option>`).join("");

export function createBallisticsLabMarkup() {
  return `<section class="rw-ballistics-lab standard-form" data-rw-ballistics-root>
    <div class="rw-ballistics-controls">
      <label>Profile<select data-rw-ballistics="profile">${profileOptions()}</select></label>
      <label>Range<select data-rw-ballistics="range">${rangeOptions(BALLISTICS_LAB_RANGES_YARDS)}</select></label>
      <label>Draw<select data-rw-ballistics="draw">${drawOptions()}</select></label>
      <label>Aiming<select data-rw-ballistics="aiming">${aimingOptions()}</select></label>
      <label data-rw-ballistics-zero-wrap>Explicit zero<select data-rw-ballistics="zero">${rangeOptions([20, 25, 30, 35, 40, 45, 50, 55, 60])}</select></label>
    </div>
    <p class="hint rw-ballistics-note" data-rw-ballistics-note></p>
    <div class="rw-ballistics-legend-row">
      <div class="rw-ballistics-legend" aria-label="Trajectory legend"><span class="los">Line of sight</span><span class="axis">Launch axis</span><span class="path">RK4 trajectory</span></div>
      <button type="button" class="secondary rw-ballistics-graph-toggle" data-rw-ballistics-action="graph-toggle" aria-expanded="true"><i class="fa-solid fa-eye-slash"></i> <span>Hide Graph</span></button>
    </div>
    <div class="rw-ballistics-plot-wrap" data-rw-ballistics-plot-wrap>
      <div class="rw-ballistics-plot-mount" data-rw-ballistics-plot-mount aria-live="polite"><canvas class="rw-ballistics-plot" data-rw-ballistics-canvas width="720" height="330" role="img" aria-label="Arrow trajectory calibration plot"></canvas></div>
      <div class="rw-ballistics-scale" data-rw-ballistics-scale></div>
    </div>
    <div class="rw-ballistics-diagnostics">
      <div><span>Arrow mass</span><strong data-rw-ballistics-out="mass"></strong></div>
      <div><span>Launch speed</span><strong data-rw-ballistics-out="launchSpeed"></strong></div>
      <div><span>Launch energy</span><strong data-rw-ballistics-out="launchEnergy"></strong></div>
      <div><span>Flight time</span><strong data-rw-ballistics-out="flightTime"></strong></div>
      <div><span>Impact speed</span><strong data-rw-ballistics-out="impactSpeed"></strong></div>
      <div><span>Impact energy</span><strong data-rw-ballistics-out="impactEnergy"></strong></div>
      <div><span>Launch elevation</span><strong data-rw-ballistics-out="elevation"></strong></div>
      <div><span>Sight zero</span><strong data-rw-ballistics-out="zero"></strong></div>
      <div><span>Raw horizontal fall</span><strong data-rw-ballistics-out="rawFall"></strong></div>
      <div><span>Point-of-aim error</span><strong data-rw-ballistics-out="poaError"></strong></div>
      <div><span>Projection scale</span><strong data-rw-ballistics-out="projection"></strong></div>
      <div><span>Rendered offset</span><strong data-rw-ballistics-out="pixelOffset"></strong></div>
    </div>
    <p class="hint rw-ballistics-explain">Raw fall is the gravity/drag trajectory from a horizontal launch. Point-of-aim error is where the configured aiming solution actually crosses the target plane.</p>
    <div class="rw-ballistics-actions"><button type="button" data-rw-ballistics-action="copy"><i class="fa-solid fa-copy"></i> Copy Diagnostic Report</button></div>
    <p class="rw-ballistics-status" data-rw-ballistics-status>Ready.</p>
  </section>`;
}

export function ensureBallisticsLabCanvas(root) {
  const mount = root?.querySelector?.('[data-rw-ballistics-plot-mount]') ?? null;
  if (!mount) return null;
  const existing = mount.querySelector?.('[data-rw-ballistics-canvas]') ?? null;
  if (existing) return existing;
  const documentRef = mount.ownerDocument ?? globalThis.document;
  if (!documentRef?.createElement) return null;
  const canvas = documentRef.createElement("canvas");
  canvas.className = "rw-ballistics-plot";
  canvas.setAttribute("data-rw-ballistics-canvas", "");
  canvas.setAttribute("width", "720");
  canvas.setAttribute("height", "330");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Arrow trajectory calibration plot");
  mount.append(canvas);
  return canvas;
}
function graphVisible(root) {
  const wrap = root?.querySelector?.('[data-rw-ballistics-plot-wrap]');
  return Boolean(wrap && !wrap.hidden);
}
function syncGraphToggle(root, visible) {
  const button = root?.querySelector?.('[data-rw-ballistics-action="graph-toggle"]');
  if (!button) return;
  button.setAttribute("aria-expanded", visible ? "true" : "false");
  const icon = button.querySelector?.("i");
  if (icon) icon.className = visible ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  const label = button.querySelector?.("span");
  if (label) label.textContent = visible ? "Hide Graph" : "Show Graph";
}
function setGraphVisible(root, visible) {
  const wrap = root?.querySelector?.('[data-rw-ballistics-plot-wrap]');
  if (!wrap) return false;
  wrap.hidden = !visible;
  syncGraphToggle(root, visible);
  if (visible) ensureBallisticsLabCanvas(root);
  return visible;
}
function cssColor(root, variable, fallback) {
  const styles = globalThis.getComputedStyle?.(root);
  return styles?.getPropertyValue?.(variable)?.trim?.() || fallback;
}
export function drawBallisticsLabCanvas(root, projection) {
  const canvas = ensureBallisticsLabCanvas(root);
  if (!canvas || !projection) return false;
  const mount = root?.querySelector?.('[data-rw-ballistics-plot-mount]') ?? canvas;
  const rect = mount?.getBoundingClientRect?.() ?? { width: 720, height: 330 };
  const width = Math.max(1, Number(rect.width) || 720);
  const height = Math.max(1, Number(rect.height) || 330);
  const dpr = Math.max(1, Math.min(2, Number(globalThis.devicePixelRatio) || 1));
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext?.("2d");
  if (!ctx) return false;
  ctx.setTransform?.(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const x = percent => (Number(percent) || 0) / 100 * width;
  const y = percent => (Number(percent) || 0) / 100 * height;
  const lineOfSight = cssColor(root, "--color-text-primary", "#efe6d8");
  const warm = cssColor(root, "--color-warm-1", "#ee9b3a");
  const success = cssColor(root, "--color-level-success", "#26b231");
  const border = cssColor(root, "--color-border", "#665866");
  const accent = cssColor(root, "--color-text-accent", "#ee9b3a");
  const error = cssColor(root, "--color-level-error", "#b94a48");
  const strokeLine = (x1, y1, x2, y2, color, lineWidth = 1, dash = []) => {
    ctx.beginPath(); ctx.setLineDash?.(dash); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
    ctx.moveTo(x(x1), y(y1)); ctx.lineTo(x(x2), y(y2)); ctx.stroke();
  };
  strokeLine(0, 50, 100, 50, lineOfSight, 1.25);
  strokeLine(0, projection.launchAxisStartYPercent, 100, projection.launchAxisEndYPercent, warm, 1.5, [6, 5]);
  strokeLine(98, 2, 98, 98, border, 1.5);
  strokeLine(95, projection.deerTopYPercent, 95, projection.deerBottomYPercent, accent, 4);
  if (projection.pointPairs?.length) {
    ctx.beginPath(); ctx.setLineDash?.([]); ctx.strokeStyle = success; ctx.lineWidth = 2.25;
    projection.pointPairs.forEach(([px, py], index) => index ? ctx.lineTo(x(px), y(py)) : ctx.moveTo(x(px), y(py)));
    ctx.stroke();
  }
  ctx.beginPath(); ctx.fillStyle = error; ctx.strokeStyle = lineOfSight; ctx.lineWidth = 1;
  ctx.arc(x(98), y(projection.impactYPercent), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  canvas.dataset.rwBallisticsDrawn = "true";
  return true;
}

export function ballisticsLabProjection(shot, plotHeightPx = 360) {
  const trajectoryYs = shot?.trajectory?.samples?.map(sample => Number(sample.yM) || 0) ?? [0];
  const maxAbs = Math.max(0.75, Math.abs(Number(shot?.pointOfAimErrorM) || 0), ...trajectoryYs.map(Math.abs));
  const halfHeightM = Math.ceil((maxAbs * 1.15) / 0.25) * 0.25;
  const viewHeightM = Math.max(1.5, halfHeightM * 2);
  const heightPx = Math.max(1, Number(plotHeightPx) || 360);
  const pixelsPerMeter = heightPx / viewHeightM;
  const pixelOffsetPx = -(Number(shot?.pointOfAimErrorM) || 0) * pixelsPerMeter;
  const yPercent = valueM => 50 - ((Number(valueM) || 0) / viewHeightM * 100);
  const pointPairs = (shot?.trajectory?.samples ?? []).map(sample => {
    const px = shot.trajectory.distanceM > 0 ? (sample.zM / shot.trajectory.distanceM) * 98 : 0;
    return Object.freeze([px, yPercent(sample.yM)]);
  });
  const points = pointPairs.map(([px, py]) => `${px.toFixed(3)},${py.toFixed(3)}`).join(" ");
  const launchAxisEndM = -(Number(shot?.profile?.sightHeightM) || 0) + Math.tan(Number(shot?.elevationRadians) || 0) * Number(shot?.trajectory?.distanceM || 0);
  const deerHalf = DEER_HEIGHT_M / 2;
  return Object.freeze({
    viewHeightM,
    halfHeightM,
    pixelsPerMeter,
    pixelOffsetPx,
    impactYPercent: yPercent(shot?.pointOfAimErrorM),
    launchAxisStartYPercent: yPercent(-(Number(shot?.profile?.sightHeightM) || 0)),
    launchAxisEndYPercent: yPercent(launchAxisEndM),
    deerTopYPercent: yPercent(deerHalf),
    deerBottomYPercent: yPercent(-deerHalf),
    pointPairs: Object.freeze(pointPairs),
    points
  });
}

export function ballisticsLabDiagnosticReport(shot, projection) {
  const profile = shot.profile;
  const zero = shot.aimingMode === "holdover"
    ? `none (trained holdover at ${shot.holdoverRangeYards} yd)`
    : shot.sightZeroYards === null
      ? "none (horizontal reference)"
      : `${shot.sightZeroYards} yd`;
  const poaDirection = shot.pointOfAimErrorM < 0 ? "low" : shot.pointOfAimErrorM > 0 ? "high" : "on aim";
  return [
    "Regionwright Ballistics Lab v0.3.20",
    `Profile: ${profile.label} (${profile.id})`,
    `Profile note: ${profile.note}`,
    `Range: ${shot.distanceYards} yd`,
    `Draw: ${(shot.drawStrength * 100).toFixed(0)}%`,
    `Aiming: ${shot.aimingMode}`,
    `Sight zero: ${zero}`,
    `Arrow mass: ${(profile.arrowMassKg * 1000).toFixed(2)} g`,
    `Launch: ${shot.launchSpeedMps.toFixed(2)} m/s (${shot.launchSpeedFps.toFixed(1)} fps), ${shot.launchKineticEnergyJ.toFixed(1)} J`,
    `Flight time: ${shot.flightTimeSeconds.toFixed(3)} s`,
    `Impact: ${shot.impactSpeedMps.toFixed(2)} m/s (${shot.impactSpeedFps.toFixed(1)} fps), ${shot.impactKineticEnergyJ.toFixed(1)} J`,
    `Launch elevation: ${shot.elevationDegrees.toFixed(3)} deg`,
    `Raw horizontal fall: ${shot.rawHorizontalFallM.toFixed(3)} m (${inches(shot.rawHorizontalFallM).toFixed(1)} in)`,
    `Point-of-aim error: ${Math.abs(shot.pointOfAimErrorM).toFixed(3)} m ${poaDirection} (${Math.abs(inches(shot.pointOfAimErrorM)).toFixed(1)} in)`,
    `Projection: ${projection.pixelsPerMeter.toFixed(2)} px/m across ${projection.viewHeightM.toFixed(2)} m vertical view`,
    `Rendered impact offset: ${Math.abs(projection.pixelOffsetPx).toFixed(1)} px ${projection.pixelOffsetPx > 0 ? "down" : projection.pixelOffsetPx < 0 ? "up" : "center"}`
  ].join("\n");
}

function readLabState(root) {
  return {
    profileId: root?.querySelector?.('[data-rw-ballistics="profile"]')?.value ?? "current",
    distanceYards: Number(root?.querySelector?.('[data-rw-ballistics="range"]')?.value ?? 35),
    drawStrength: Number(root?.querySelector?.('[data-rw-ballistics="draw"]')?.value ?? 1),
    aimingMode: root?.querySelector?.('[data-rw-ballistics="aiming"]')?.value ?? "pin",
    explicitZeroYards: Number(root?.querySelector?.('[data-rw-ballistics="zero"]')?.value ?? 30)
  };
}
function setOutput(root, name, value) { const node = root?.querySelector?.(`[data-rw-ballistics-out="${name}"]`); if (node) node.textContent = value; }
function currentPlotHeight(root) { return root?.querySelector?.('[data-rw-ballistics-plot-mount]')?.getBoundingClientRect?.().height || 330; }

function renderLab(root) {
  if (graphVisible(root)) ensureBallisticsLabCanvas(root);
  const state = readLabState(root);
  const shot = simulateBallisticsLabShot(state);
  const projection = ballisticsLabProjection(shot, currentPlotHeight(root));
  const zeroWrap = root?.querySelector?.('[data-rw-ballistics-zero-wrap]');
  if (zeroWrap) zeroWrap.hidden = state.aimingMode !== "zero";
  const note = root?.querySelector?.('[data-rw-ballistics-note]');
  if (note) note.textContent = shot.profile.note;
  if (graphVisible(root)) drawBallisticsLabCanvas(root, projection);
  const scale = root?.querySelector?.('[data-rw-ballistics-scale]');
  if (scale) scale.textContent = `Vertical view ${projection.viewHeightM.toFixed(2)} m ? deer-height reference ${DEER_HEIGHT_M.toFixed(1)} m`;
  setOutput(root, "mass", `${(shot.profile.arrowMassKg * 1000).toFixed(2)} g`);
  setOutput(root, "launchSpeed", `${shot.launchSpeedMps.toFixed(2)} m/s ? ${shot.launchSpeedFps.toFixed(0)} fps`);
  setOutput(root, "launchEnergy", `${shot.launchKineticEnergyJ.toFixed(1)} J`);
  setOutput(root, "flightTime", `${shot.flightTimeSeconds.toFixed(3)} s`);
  setOutput(root, "impactSpeed", `${shot.impactSpeedMps.toFixed(2)} m/s ? ${shot.impactSpeedFps.toFixed(0)} fps`);
  setOutput(root, "impactEnergy", `${shot.impactKineticEnergyJ.toFixed(1)} J`);
  setOutput(root, "elevation", `${shot.elevationDegrees.toFixed(3)}?`);
  setOutput(root, "zero", shot.aimingMode === "holdover"
    ? `None ? trained ${shot.holdoverRangeYards} yd holdover`
    : shot.sightZeroYards === null ? "None" : `${shot.sightZeroYards} yd`);
  setOutput(root, "rawFall", `${shot.rawHorizontalFallM.toFixed(3)} m ? ${inches(shot.rawHorizontalFallM).toFixed(1)} in`);
  setOutput(root, "poaError", `${Math.abs(shot.pointOfAimErrorM).toFixed(3)} m ${shot.pointOfAimErrorM < 0 ? "low" : shot.pointOfAimErrorM > 0 ? "high" : "on aim"} ? ${Math.abs(inches(shot.pointOfAimErrorM)).toFixed(1)} in`);
  setOutput(root, "projection", `${projection.pixelsPerMeter.toFixed(2)} px/m`);
  setOutput(root, "pixelOffset", `${Math.abs(projection.pixelOffsetPx).toFixed(1)} px ${projection.pixelOffsetPx > 0 ? "down" : projection.pixelOffsetPx < 0 ? "up" : "center"}`);
  root._rwBallisticsShot = shot;
  root._rwBallisticsProjection = projection;
  return { shot, projection };
}

async function copyReport(root) {
  const shot = root?._rwBallisticsShot;
  const projection = root?._rwBallisticsProjection;
  if (!shot || !projection) throw new Error("Run a Ballistics Lab calculation first.");
  const report = ballisticsLabDiagnosticReport(shot, projection);
  if (globalThis.navigator?.clipboard?.writeText) await globalThis.navigator.clipboard.writeText(report);
  else throw new Error("Clipboard access is unavailable in this Foundry client.");
  const status = root?.querySelector?.('[data-rw-ballistics-status]');
  if (status) status.textContent = "Diagnostic report copied.";
  globalThis.ui?.notifications?.info?.("Ballistics diagnostic copied.");
  return report;
}

function createBallisticsLabDialog(DialogV2) {
  return class RegionwrightBallisticsLab extends DialogV2 {
    constructor() {
      super({
        classes: ["rw-ballistics-dialog"],
        window: { title: "Regionwright Ballistics Lab", icon: "fa-solid fa-chart-line", resizable: true, minimizable: false },
        position: { width: 760, height: 760 },
        content: createBallisticsLabMarkup(),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }]
      });
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.element?.[0] ?? this.element;
      renderLab(root);
      root?.addEventListener?.("change", event => {
        if (!event.target?.closest?.('[data-rw-ballistics]')) return;
        renderLab(root);
      });
      root?.addEventListener?.("click", event => {
        const button = event.target?.closest?.('[data-rw-ballistics-action]');
        if (!button) return;
        const action = button.dataset.rwBallisticsAction;
        if (action === "graph-toggle") {
          event.preventDefault();
          const visible = !graphVisible(root);
          setGraphVisible(root, visible);
          if (visible) renderLab(root);
          const status = root?.querySelector?.('[data-rw-ballistics-status]');
          if (status) status.textContent = visible ? "Graph shown and redrawn." : "Graph hidden. Diagnostics remain active.";
          return;
        }
        if (action !== "copy") return;
        event.preventDefault();
        button.disabled = true;
        void copyReport(root).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          const status = root?.querySelector?.('[data-rw-ballistics-status]');
          if (status) status.textContent = message;
          globalThis.ui?.notifications?.error?.(message);
        }).finally(() => { button.disabled = false; });
      });
      const mount = root?.querySelector?.('[data-rw-ballistics-plot-mount]') ?? null;
      const observer = globalThis.ResizeObserver ? new globalThis.ResizeObserver(() => { if (graphVisible(root)) renderLab(root); }) : null;
      const isElement = Boolean(globalThis.Element && mount instanceof globalThis.Element);
      if (observer && isElement) {
        observer.observe(mount);
        this._rwBallisticsObserver = observer;
      } else {
        observer?.disconnect?.();
        this._rwBallisticsObserver = null;
      }
    }
    async close(options = {}) {
      this._rwBallisticsObserver?.disconnect?.();
      this._rwBallisticsObserver = null;
      return super.close(options);
    }
  };
}

let activeLab = null;
export async function openBallisticsLab() {
  if (!activeGM()) throw new Error("Only the active GM can open Regionwright Ballistics Lab.");
  if (activeLab) { activeLab.bringToFront?.(); return activeLab; }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  activeLab = new (createBallisticsLabDialog(DialogV2))();
  const originalClose = activeLab.close.bind(activeLab);
  activeLab.close = async options => { const result = await originalClose(options); activeLab = null; return result; };
  await activeLab.render({ force: true });
  return activeLab;
}
