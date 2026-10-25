const BOARD_FORMAT = "regionwright.point-board";
const BOARD_VERSION = 1;
const BOARD_WIDTH = 240;
const BOARD_HEIGHT = 160;
const REQUIRED_LAYERS = Object.freeze(["static", "cylinder", "wrench", "pick"]);

let boardDataPromise = null;

/** Validate the shared, editor-compatible point-board format for the Rotation Lock composition. */
export function normalizeRotationLockPointBoardData(data = {}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new TypeError("Rotation Lock point-board data must be an object.");
  if (data.format !== BOARD_FORMAT || data.formatVersion !== BOARD_VERSION) throw new TypeError("Rotation Lock point-board data must use regionwright.point-board v1.");
  if (data.width !== BOARD_WIDTH || data.height !== BOARD_HEIGHT) throw new RangeError("Rotation Lock point-board data must be 240 × 160.");
  if (!Array.isArray(data.palette) || data.palette.length < 1 || data.palette.length > 16 || data.palette.some(color => typeof color !== "string" || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color))) {
    throw new TypeError("Rotation Lock point-board data has an invalid palette.");
  }
  if (!Array.isArray(data.layers) || data.layers.length !== REQUIRED_LAYERS.length) throw new RangeError("Rotation Lock point-board data must contain static, cylinder, wrench, and pick layers.");

  const layerIds = new Set();
  const layers = [];
  for (const layer of data.layers) {
    if (!layer || !REQUIRED_LAYERS.includes(layer.id) || layerIds.has(layer.id)) throw new TypeError("Rotation Lock point-board data contains an unknown or duplicate layer.");
    if (!Array.isArray(layer.frames) || layer.frames.length !== 1 || !Array.isArray(layer.frames[0])) throw new TypeError(`Rotation Lock layer ${layer.id} must have one frame.`);
    layerIds.add(layer.id);
    const occupied = new Set();
    const cells = Object.freeze(layer.frames[0].map((cell, index) => {
      if (!Array.isArray(cell) || cell.length !== 3) throw new TypeError(`Rotation Lock layer ${layer.id} cell ${index} must be [x, y, paletteIndex].`);
      const [x, y, paletteIndex] = cell;
      if (!Number.isInteger(x) || x < 0 || x >= BOARD_WIDTH || !Number.isInteger(y) || y < 0 || y >= BOARD_HEIGHT) throw new RangeError(`Rotation Lock layer ${layer.id} has an out-of-range cell.`);
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= data.palette.length) throw new RangeError(`Rotation Lock layer ${layer.id} has an invalid palette index.`);
      const key = y * BOARD_WIDTH + x;
      if (occupied.has(key)) throw new TypeError(`Rotation Lock layer ${layer.id} contains duplicate cell (${x}, ${y}).`);
      occupied.add(key);
      return Object.freeze([x, y, paletteIndex]);
    }));
    layers.push(Object.freeze({ id: layer.id, frames: Object.freeze([cells]), animation: Object.freeze({ idleFrame: 0 }) }));
  }
  if (REQUIRED_LAYERS.some(id => !layerIds.has(id))) throw new TypeError("Rotation Lock point-board data is missing a required layer.");

  return Object.freeze({
    format: BOARD_FORMAT,
    formatVersion: BOARD_VERSION,
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    palette: Object.freeze(data.palette.map(color => color.toLowerCase())),
    layers: Object.freeze(layers)
  });
}

/** Fetch the editable board JSON from this module; failed loads can be retried. */
export function loadRotationLockPointBoardData({ fetchFn = globalThis.fetch } = {}) {
  if (typeof fetchFn !== "function") return Promise.reject(new Error("This browser does not provide the Fetch API."));
  if (boardDataPromise) return boardDataPromise;
  const url = new URL("../assets/rotation-lock-point-board.json", import.meta.url).href;
  const promise = Promise.resolve()
    .then(() => fetchFn(url, { credentials: "same-origin" }))
    .then(response => {
      if (!response?.ok) throw new Error(`Could not load Rotation Lock point-board data (${response?.status ?? "network error"}).`);
      return response.json();
    })
    .then(normalizeRotationLockPointBoardData);
  boardDataPromise = promise;
  promise.catch(() => { if (boardDataPromise === promise) boardDataPromise = null; });
  return promise;
}

function createRasterLayer(board, layerId, documentClass) {
  const canvas = documentClass?.createElement?.("canvas")
    ?? (typeof globalThis.OffscreenCanvas === "function" ? new globalThis.OffscreenCanvas(BOARD_WIDTH, BOARD_HEIGHT) : null);
  if (!canvas || typeof canvas.getContext !== "function") throw new Error("Canvas 2D is required to render the Rotation Lock point board.");
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context || typeof context.fillRect !== "function") throw new Error(`Could not rasterize the Rotation Lock ${layerId} layer.`);
  context.clearRect?.(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  context.imageSmoothingEnabled = false;
  const cells = board.layers.find(layer => layer.id === layerId)?.frames[0] ?? [];
  for (const [x, y, paletteIndex] of cells) {
    context.fillStyle = board.palette[paletteIndex];
    context.fillRect(x, y, 1, 1);
  }
  return canvas;
}

/** Cache the authored cells as four transparent canvases and transform them as moving lock parts. */
export class RotationLockPointBoardRenderer {
  constructor(canvas, boardData, { documentClass = globalThis.document, maxPixelRatio = 2 } = {}) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("A rotation-lock canvas is required.");
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.board = normalizeRotationLockPointBoardData(boardData);
    this.maxPixelRatio = Math.min(2, Math.max(1, Number(maxPixelRatio) || 2));
    this.layerCanvases = new Map(REQUIRED_LAYERS.map(id => [id, createRasterLayer(this.board, id, documentClass)]));
  }

  render(state, { devicePixelRatio = globalThis.devicePixelRatio || 1 } = {}) {
    const canvas = this.canvas;
    const context = this.context;
    if (!canvas || !context) return false;
    const rect = canvas.getBoundingClientRect?.();
    const cssWidth = Number(rect?.width || canvas.clientWidth || 0);
    const cssHeight = Number(rect?.height || canvas.clientHeight || 0);
    if (!(cssWidth > 0 && cssHeight > 0)) return false;

    const pixelRatio = Math.min(this.maxPixelRatio, Math.max(1, Number(devicePixelRatio) || 1));
    const width = Math.max(1, Math.round(cssWidth * pixelRatio));
    const height = Math.max(1, Math.round(cssHeight * pixelRatio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    context.setTransform(width / BOARD_WIDTH, 0, 0, height / BOARD_HEIGHT, 0, 0);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    context.drawImage(this.layerCanvases.get("static"), 0, 0);

    const centerX = 148;
    const centerY = 80;
    const cylinderAngle = -(Number(state?.cylinderProgress) || 0) * 88 * Math.PI / 180;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(cylinderAngle);
    context.drawImage(this.layerCanvases.get("cylinder"), -centerX, -centerY);
    context.drawImage(this.layerCanvases.get("wrench"), -centerX, -centerY);
    context.restore();

    context.save();
    context.translate(centerX, centerY);
    context.rotate((Number(state?.pickAngle) || 0) * Math.PI / 180);
    context.drawImage(this.layerCanvases.get("pick"), -centerX, -centerY);
    context.restore();
    return true;
  }

  dispose() {
    for (const canvas of this.layerCanvases.values()) { canvas.width = 0; canvas.height = 0; }
    this.layerCanvases.clear();
    if (this.canvas) { this.canvas.width = 0; this.canvas.height = 0; }
    this.canvas = null;
    this.context = null;
    this.board = null;
  }
}

