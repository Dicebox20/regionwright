const imageCache = new Map();
const metadataCache = new Map();
const boardDataCache = new Map();
const normalizedBoardData = new WeakSet();
export const POINT_BOARD_SCHEMA_VERSION = 1;
export const POINT_BOARD_DATA_FORMAT = "regionwright.point-board";
export const POINT_BOARD_DATA_FORMAT_VERSION = 1;

const MAX_POINT_BOARD_DATA_DIMENSION = 512;
const MAX_POINT_BOARD_DATA_LAYERS = 16;
const MAX_POINT_BOARD_DATA_FRAMES = 64;
const MAX_POINT_BOARD_DATA_TOTAL_FRAMES = 128;
const MAX_POINT_BOARD_DATA_RASTER_PIXELS = 4_194_304;
const MAX_POINT_BOARD_DATA_POINTS = 250_000;
const POINT_BOARD_ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

const positiveInteger = (value, label, max = Number.MAX_SAFE_INTEGER) => {
  const number = value;
  if (!Number.isInteger(number) || number <= 0 || number > max) throw new TypeError(`${label} must be a positive integer no greater than ${max}.`);
  return number;
};

function validateModuleRelativePath(value, extension, label) {
  if (typeof value !== "string") throw new TypeError(`${label} must be a safe, module-relative .${extension} path.`);
  const source = value;
  const segments = source.split("/");
  if (!source || source !== source.trim() || source.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(source) || /[\\%?#]/.test(source) || !source.endsWith(`.${extension}`) || segments.some(segment => !segment || segment === "." || segment === "..")) {
    throw new TypeError(`${label} must be a safe, module-relative .${extension} path.`);
  }
  return source;
}

const validateSpriteSheetPath = value => validateModuleRelativePath(value, "png", "spriteSheet");

export function normalizePointBoardMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new TypeError("Point-board metadata must be an object.");
  const allowedKeys = new Set(["schemaVersion", "spriteSheet", "frameWidth", "frameHeight", "frameCount", "animation"]);
  if (Object.keys(metadata).some(key => !allowedKeys.has(key))) throw new TypeError("Point-board metadata contains an unknown v1 field.");
  const schemaVersion = metadata.schemaVersion;
  if (schemaVersion !== POINT_BOARD_SCHEMA_VERSION) throw new RangeError(`Unsupported point-board schemaVersion: ${metadata.schemaVersion}.`);
  const spriteSheet = validateSpriteSheetPath(metadata.spriteSheet);
  const frameWidth = positiveInteger(metadata.frameWidth, "frameWidth", 4096);
  const frameHeight = positiveInteger(metadata.frameHeight, "frameHeight", 4096);
  const frameCount = positiveInteger(metadata.frameCount, "frameCount", 64);
  const animation = metadata.animation ?? {};
  if (!animation || typeof animation !== "object" || Array.isArray(animation)) throw new TypeError("animation must be an object when provided.");
  const allowedAnimationKeys = new Set(["idleFrame", "walk"]);
  if (Object.keys(animation).some(key => !allowedAnimationKeys.has(key))) throw new TypeError("animation contains an unknown v1 field.");
  const idleFrame = animation.idleFrame ?? 0;
  if (!Number.isInteger(idleFrame) || idleFrame < 0 || idleFrame >= frameCount) {
    throw new RangeError("idleFrame must identify a frame in the sheet.");
  }
  let walk = null;
  if (animation.walk !== undefined) {
    if (!animation.walk || typeof animation.walk !== "object" || Array.isArray(animation.walk)) throw new TypeError("animation.walk must be an object.");
    const allowedWalkKeys = new Set(["startFrame", "frameCount", "fps"]);
    if (Object.keys(animation.walk).some(key => !allowedWalkKeys.has(key))) throw new TypeError("animation.walk contains an unknown v1 field.");
    const startFrame = animation.walk.startFrame;
    const walkFrameCount = positiveInteger(animation.walk.frameCount, "animation.walk.frameCount", 64);
    const fps = animation.walk.fps;
    if (!Number.isInteger(startFrame) || startFrame < 0 || startFrame + walkFrameCount > frameCount) {
      throw new RangeError("Walking frames must fit inside the sheet.");
    }
    if (!Number.isFinite(fps) || fps <= 0 || fps > 30) {
      throw new RangeError("animation.walk.fps must be greater than 0 and no more than 30.");
    }
    walk = Object.freeze({ startFrame, frameCount: walkFrameCount, fps });
  }

  return Object.freeze({ schemaVersion, spriteSheet, frameWidth, frameHeight, frameCount, animation: Object.freeze({ idleFrame, walk }) });
}

export function pointBoardFrameAt(metadata, { elapsedMs = 0, moving = false } = {}) {
  return frameAtSettings(normalizePointBoardMetadata(metadata), { elapsedMs, moving });
}

function freezeLayer(layer) {
  const frames = Object.freeze(layer.frames.map(frame => Object.freeze(frame.map(point => Object.freeze(point)))));
  return Object.freeze({ ...layer, frames });
}

function normalizeDataAnimation(animation, frameCount, label) {
  if (animation === undefined) animation = {};
  if (!animation || typeof animation !== "object" || Array.isArray(animation)) throw new TypeError(`${label}.animation must be an object.`);
  const allowedKeys = new Set(["idleFrame", "walk"]);
  if (Object.keys(animation).some(key => !allowedKeys.has(key))) throw new TypeError(`${label}.animation contains an unknown field.`);
  const idleFrame = animation.idleFrame ?? 0;
  if (!Number.isInteger(idleFrame) || idleFrame < 0 || idleFrame >= frameCount) throw new RangeError(`${label}.animation.idleFrame must identify a frame.`);
  let walk = null;
  if (animation.walk !== undefined) {
    if (!animation.walk || typeof animation.walk !== "object" || Array.isArray(animation.walk)) throw new TypeError(`${label}.animation.walk must be an object.`);
    const allowedWalkKeys = new Set(["startFrame", "frameCount", "fps"]);
    if (Object.keys(animation.walk).some(key => !allowedWalkKeys.has(key))) throw new TypeError(`${label}.animation.walk contains an unknown field.`);
    const startFrame = animation.walk.startFrame;
    const walkFrameCount = positiveInteger(animation.walk.frameCount, `${label}.animation.walk.frameCount`, MAX_POINT_BOARD_DATA_FRAMES);
    const fps = animation.walk.fps;
    if (!Number.isInteger(startFrame) || startFrame < 0 || startFrame + walkFrameCount > frameCount) throw new RangeError(`${label}.animation.walk frames must fit inside the layer.`);
    if (!Number.isFinite(fps) || fps <= 0 || fps > 30) throw new RangeError(`${label}.animation.walk.fps must be greater than 0 and no more than 30.`);
    walk = Object.freeze({ startFrame, frameCount: walkFrameCount, fps });
  }
  return Object.freeze(walk ? { idleFrame, walk } : { idleFrame });
}

/** Validate and freeze a human-authored point board whose art is stored as active X/Y/color cells. */
export function normalizePointBoardData(data = {}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new TypeError("Point-board data must be an object.");
  const allowedKeys = new Set(["format", "formatVersion", "width", "height", "palette", "layers"]);
  if (Object.keys(data).some(key => !allowedKeys.has(key))) throw new TypeError("Point-board data contains an unknown v1 field.");
  if (data.format !== POINT_BOARD_DATA_FORMAT) throw new TypeError(`Unsupported point-board format: ${data.format}.`);
  if (data.formatVersion !== POINT_BOARD_DATA_FORMAT_VERSION) throw new RangeError(`Unsupported point-board formatVersion: ${data.formatVersion}.`);

  const width = positiveInteger(data.width, "width", MAX_POINT_BOARD_DATA_DIMENSION);
  const height = positiveInteger(data.height, "height", MAX_POINT_BOARD_DATA_DIMENSION);
  if (width * height > 262_144) throw new RangeError("Point-board cell area must not exceed 262144 cells.");
  if (!Array.isArray(data.palette) || data.palette.length < 1 || data.palette.length > 16) throw new RangeError("palette must contain between 1 and 16 colors.");
  const palette = data.palette.map((color, index) => {
    if (typeof color !== "string" || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)) throw new TypeError(`palette[${index}] must be a #RRGGBB or #RRGGBBAA color.`);
    return color.toLowerCase();
  });
  if (!Array.isArray(data.layers) || data.layers.length < 1 || data.layers.length > MAX_POINT_BOARD_DATA_LAYERS) throw new RangeError(`layers must contain between 1 and ${MAX_POINT_BOARD_DATA_LAYERS} layers.`);

  let totalPoints = 0;
  let totalFrames = 0;
  const layerIds = new Set();
  const layers = data.layers.map((layer, layerIndex) => {
    const label = `layers[${layerIndex}]`;
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) throw new TypeError(`${label} must be an object.`);
    if (Object.keys(layer).some(key => !["id", "frames", "animation"].includes(key))) throw new TypeError(`${label} contains an unknown field.`);
    if (typeof layer.id !== "string" || !POINT_BOARD_ID_PATTERN.test(layer.id)) throw new TypeError(`${label}.id must be a lowercase identifier.`);
    if (layerIds.has(layer.id)) throw new TypeError(`Duplicate point-board layer id: ${layer.id}.`);
    layerIds.add(layer.id);
    if (!Array.isArray(layer.frames) || layer.frames.length < 1 || layer.frames.length > MAX_POINT_BOARD_DATA_FRAMES) throw new RangeError(`${label}.frames must contain between 1 and ${MAX_POINT_BOARD_DATA_FRAMES} frames.`);
    totalFrames += layer.frames.length;
    if (totalFrames > MAX_POINT_BOARD_DATA_TOTAL_FRAMES) throw new RangeError(`Point-board data exceeds ${MAX_POINT_BOARD_DATA_TOTAL_FRAMES} cached frames.`);
    if (width * height * totalFrames > MAX_POINT_BOARD_DATA_RASTER_PIXELS) throw new RangeError("Point-board cached raster area must not exceed 4194304 cells.");
    const frames = layer.frames.map((frame, frameIndex) => {
      if (!Array.isArray(frame)) throw new TypeError(`${label}.frames[${frameIndex}] must be an array of active cells.`);
      const occupied = new Set();
      const normalized = frame.map((point, pointIndex) => {
        if (!Array.isArray(point) || point.length !== 3) throw new TypeError(`${label}.frames[${frameIndex}][${pointIndex}] must be [x, y, paletteIndex].`);
        const [x, y, paletteIndex] = point;
        if (!Number.isInteger(x) || x < 0 || x >= width) throw new RangeError(`${label}.frames[${frameIndex}] has an x coordinate outside the board.`);
        if (!Number.isInteger(y) || y < 0 || y >= height) throw new RangeError(`${label}.frames[${frameIndex}] has a y coordinate outside the board.`);
        if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= palette.length) throw new RangeError(`${label}.frames[${frameIndex}] has an invalid palette index.`);
        const cell = y * width + x;
        if (occupied.has(cell)) throw new TypeError(`${label}.frames[${frameIndex}] contains duplicate cell (${x}, ${y}).`);
        occupied.add(cell);
        totalPoints += 1;
        if (totalPoints > MAX_POINT_BOARD_DATA_POINTS) throw new RangeError(`Point-board data exceeds ${MAX_POINT_BOARD_DATA_POINTS} active cells.`);
        return [x, y, paletteIndex];
      });
      return normalized;
    });
    const animation = normalizeDataAnimation(layer.animation, frames.length, label);
    return freezeLayer({ id: layer.id, frames, animation });
  });

  const normalized = Object.freeze({
    format: POINT_BOARD_DATA_FORMAT,
    formatVersion: POINT_BOARD_DATA_FORMAT_VERSION,
    width,
    height,
    palette: Object.freeze(palette),
    layers: Object.freeze(layers)
  });
  normalizedBoardData.add(normalized);
  return normalized;
}

export function loadCodedPointBoardData(source, { baseURL = import.meta.url, fetchFn = globalThis.fetch } = {}) {
  if (typeof fetchFn !== "function") return Promise.reject(new Error("This browser does not provide the Fetch API."));
  let url;
  try {
    url = new URL(validateModuleRelativePath(source, "json", "point-board data"), baseURL).href;
  } catch {
    return Promise.reject(new TypeError("A valid module-relative point-board data URL is required."));
  }
  if (boardDataCache.has(url)) return boardDataCache.get(url);
  const promise = Promise.resolve()
    .then(() => fetchFn(url, { credentials: "same-origin" }))
    .then(response => {
      if (!response?.ok) throw new Error(`Could not load point-board data (${response?.status ?? "network error"}): ${url}`);
      return response.json();
    })
    .then(normalizePointBoardData);
  boardDataCache.set(url, promise);
  promise.catch(() => boardDataCache.delete(url));
  return promise;
}

function normalizeBoardLayer(boardData, layerId) {
  const board = boardData && typeof boardData === "object" && normalizedBoardData.has(boardData) ? boardData : normalizePointBoardData(boardData);
  const layer = board.layers.find(candidate => candidate.id === layerId);
  if (!layer) throw new RangeError(`Unknown point-board layer: ${layerId}.`);
  return { board, layer };
}

export function pointBoardDataFrameAt(boardData, layerId, { elapsedMs = 0, moving = false } = {}) {
  const { layer } = normalizeBoardLayer(boardData, layerId);
  return frameAtSettings({ frameCount: layer.frames.length, animation: layer.animation }, { elapsedMs, moving });
}

function defaultBoardCanvasFactory(width, height) {
  if (typeof globalThis.OffscreenCanvas === "function") return new globalThis.OffscreenCanvas(width, height);
  const canvas = globalThis.document?.createElement?.("canvas");
  if (!canvas) throw new Error("A Canvas or OffscreenCanvas implementation is required to rasterize point-board data.");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Rasterize each authored layer once into a horizontal in-memory frame sheet. */
export function rasterizePointBoardData(boardData, { canvasFactory = defaultBoardCanvasFactory } = {}) {
  const board = boardData && typeof boardData === "object" && normalizedBoardData.has(boardData) ? boardData : normalizePointBoardData(boardData);
  if (typeof canvasFactory !== "function") throw new TypeError("canvasFactory must be a function.");
  const layers = new Map();
  for (const layer of board.layers) {
    const frames = layer.frames.map((points, frameIndex) => {
      const canvas = canvasFactory(board.width, board.height, layer.id, frameIndex);
      if (!canvas || typeof canvas.getContext !== "function") throw new TypeError(`Canvas factory did not return a canvas for ${layer.id} frame ${frameIndex}.`);
      canvas.width = board.width;
      canvas.height = board.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context || typeof context.fillRect !== "function") throw new Error(`Could not create a 2D context for ${layer.id} frame ${frameIndex}.`);
      context.clearRect?.(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      for (const [x, y, colorIndex] of points) {
        context.fillStyle = board.palette[colorIndex];
        context.fillRect(x, y, 1, 1);
      }
      return canvas;
    });
    layers.set(layer.id, Object.freeze({ id: layer.id, frames: Object.freeze(frames), frameWidth: board.width, frameHeight: board.height, frameCount: layer.frames.length, animation: layer.animation }));
  }
  return Object.freeze({ format: board.format, width: board.width, height: board.height, layers });
}

export async function loadCodedPointBoardAsset(source, { canvasFactory = defaultBoardCanvasFactory, ...options } = {}) {
  const board = await loadCodedPointBoardData(source, options);
  return Object.freeze({ board, cache: rasterizePointBoardData(board, { canvasFactory }) });
}

export function drawPointBoardDataLayer(context, layerCache, frameIndex, { x = 0, y = 0, width = layerCache?.frameWidth, height = layerCache?.frameHeight } = {}) {
  const frame = Number(frameIndex);
  if (!layerCache || !Number.isInteger(frame) || frame < 0 || frame >= layerCache.frameCount) throw new RangeError("frameIndex must identify a frame in the point-board layer.");
  const targetWidth = Number(width);
  const targetHeight = Number(height);
  if (!Number.isFinite(targetWidth) || targetWidth <= 0 || !Number.isFinite(targetHeight) || targetHeight <= 0) throw new TypeError("Point-board draw dimensions must be positive numbers.");
  if (!context || typeof context.drawImage !== "function") return false;
  context.imageSmoothingEnabled = false;
  context.drawImage(layerCache.frames[frame], 0, 0, layerCache.frameWidth, layerCache.frameHeight, Number(x) || 0, Number(y) || 0, targetWidth, targetHeight);
  return true;
}

/** Draw one coded layer to a responsive canvas, redrawing only when its frame or backing size changes. */
export class PointBoardDataLayerRenderer {
  constructor(canvas, layerCache, { maxPixelRatio = 2, sourceRect = null } = {}) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("A canvas element is required.");
    if (!layerCache || !Array.isArray(layerCache.frames) || layerCache.frames.length < 1) throw new TypeError("A rasterized point-board layer is required.");
    this.canvas = canvas;
    this.layer = layerCache;
    const source = sourceRect ?? { x: 0, y: 0, width: layerCache.frameWidth, height: layerCache.frameHeight };
    if (!source || ![source.x, source.y, source.width, source.height].every(Number.isInteger)
      || source.x < 0 || source.y < 0 || source.width < 1 || source.height < 1
      || source.x + source.width > layerCache.frameWidth || source.y + source.height > layerCache.frameHeight) {
      throw new RangeError("sourceRect must be an integer crop inside the point-board layer.");
    }
    this.sourceRect = Object.freeze({ x: source.x, y: source.y, width: source.width, height: source.height });
    const requestedPixelRatio = Number(maxPixelRatio);
    this.maxPixelRatio = Math.min(2, Math.max(1, Number.isFinite(requestedPixelRatio) ? requestedPixelRatio : 2));
    this.lastRenderKey = null;
  }

  render({ elapsedMs = 0, moving = false, devicePixelRatio = globalThis.devicePixelRatio || 1 } = {}) {
    const canvas = this.canvas;
    const layer = this.layer;
    if (!canvas || !layer) return false;
    const rect = canvas.getBoundingClientRect?.();
    const cssWidth = Number(rect?.width || canvas.clientWidth || 0);
    const cssHeight = Number(rect?.height || canvas.clientHeight || 0);
    if (!cssWidth || !cssHeight) return false;

    const ratio = Math.min(this.maxPixelRatio, Math.max(1, Number(devicePixelRatio) || 1));
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const frame = frameAtSettings({ frameCount: layer.frameCount, animation: layer.animation }, { elapsedMs, moving });
    const key = `${frame}:${width}:${height}`;
    if (key === this.lastRenderKey) return false;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return false;
    context.clearRect?.(0, 0, width, height);
    const { x, y, width: sourceWidth, height: sourceHeight } = this.sourceRect;
    context.imageSmoothingEnabled = false;
    context.drawImage(layer.frames[frame], x, y, sourceWidth, sourceHeight, 0, 0, width, height);
    this.lastRenderKey = key;
    return true;
  }

  dispose() {
    this.canvas = null;
    this.layer = null;
    this.lastRenderKey = null;
  }
}

export function disposePointBoardDataCache(cache) {
  if (!cache?.layers || typeof cache.layers.values !== "function") return false;
  for (const layer of cache.layers.values()) {
    for (const canvas of layer.frames ?? []) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  cache.layers.clear();
  return true;
}

function frameAtSettings(settings, { elapsedMs = 0, moving = false } = {}) {
  if (!moving) return settings.animation.idleFrame;
  if (!settings.animation.walk) return settings.animation.idleFrame;
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const step = Math.floor((elapsed / 1000) * settings.animation.walk.fps);
  return settings.animation.walk.startFrame + (step % settings.animation.walk.frameCount);
}

export function validatePointBoardSheet(image, metadata) {
  const settings = normalizePointBoardMetadata(metadata);
  const width = Number(image?.naturalWidth || image?.width || 0);
  const height = Number(image?.naturalHeight || image?.height || 0);
  const expectedWidth = settings.frameWidth * settings.frameCount;
  if (width !== expectedWidth || height !== settings.frameHeight) {
    throw new RangeError(`Point-board sheet must be exactly ${expectedWidth} × ${settings.frameHeight}px.`);
  }
  return settings;
}

export function loadPointBoardSheet(source, { ImageClass = globalThis.Image } = {}) {
  const url = String(source ?? "").trim();
  if (!url) return Promise.reject(new TypeError("A point-board sheet URL is required."));
  if (imageCache.has(url)) return imageCache.get(url);
  if (typeof ImageClass !== "function") return Promise.reject(new Error("This browser does not provide the Image API."));

  const image = new ImageClass();
  image.decoding = "async";
  const promise = new Promise((resolve, reject) => {
    let settled = false;
    let decoding = false;
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(`Could not load point-board sheet: ${url}`));
    };
    const succeed = async () => {
      if (settled || decoding) return;
      decoding = true;
      try {
        if (typeof image.decode === "function") await image.decode();
        if (!(image.naturalWidth || image.width) || !(image.naturalHeight || image.height)) {
          throw new Error(`Point-board sheet has no decoded image dimensions: ${url}`);
        }
        settled = true;
        resolve(image);
      } catch (error) {
        fail(error);
      }
    };
    image.onload = () => { void succeed(); };
    image.onerror = () => fail(new Error(`Could not load point-board sheet: ${url}`));
    image.src = url;
    if (image.complete && (image.naturalWidth || image.width)) void succeed();
  });

  imageCache.set(url, promise);
  promise.catch(() => imageCache.delete(url));
  return promise;
}

export function loadPointBoardMetadata(source, { baseURL = import.meta.url, fetchFn = globalThis.fetch } = {}) {
  if (typeof fetchFn !== "function") return Promise.reject(new Error("This browser does not provide the Fetch API."));
  let url;
  try {
    url = new URL(validateModuleRelativePath(source, "json", "metadata"), baseURL).href;
  } catch {
    return Promise.reject(new TypeError("A valid module-relative point-board metadata URL is required."));
  }
  if (metadataCache.has(url)) return metadataCache.get(url);

  const promise = Promise.resolve()
    .then(() => fetchFn(url, { credentials: "same-origin" }))
    .then(response => {
      if (!response?.ok) throw new Error(`Could not load point-board metadata (${response?.status ?? "network error"}): ${url}`);
      return response.json();
    })
    .then(normalizePointBoardMetadata);
  metadataCache.set(url, promise);
  promise.catch(() => metadataCache.delete(url));
  return promise;
}

export async function loadPointBoardAsset(metadata, { baseURL = import.meta.url, ImageClass = globalThis.Image } = {}) {
  const settings = normalizePointBoardMetadata(metadata);
  const url = new URL(settings.spriteSheet, baseURL).href;
  const image = await loadPointBoardSheet(url, { ImageClass });
  validatePointBoardSheet(image, settings);
  return Object.freeze({ image, metadata: settings, url });
}

export async function loadPointBoardAssetFromManifest(source, options = {}) {
  const metadata = await loadPointBoardMetadata(source, options);
  return loadPointBoardAsset(metadata, options);
}

export function drawPointBoardFrame(context, image, metadata, frameIndex, width, height) {
  const settings = validatePointBoardSheet(image, metadata);
  const frame = Number(frameIndex);
  if (!Number.isInteger(frame) || frame < 0 || frame >= settings.frameCount) {
    throw new RangeError("frameIndex must identify a frame in the sheet.");
  }
  const targetWidth = positiveInteger(width, "width");
  const targetHeight = positiveInteger(height, "height");
  if (!context || typeof context.drawImage !== "function") return false;

  context.imageSmoothingEnabled = false;
  context.clearRect?.(0, 0, targetWidth, targetHeight);
  context.drawImage(
    image,
    frame * settings.frameWidth,
    0,
    settings.frameWidth,
    settings.frameHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );
  return true;
}

export class PointBoardCanvasRenderer {
  constructor(canvas, image, metadata, { maxPixelRatio = 2 } = {}) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("A canvas element is required.");
    this.canvas = canvas;
    this.image = image;
    this.metadata = validatePointBoardSheet(image, metadata);
    const requestedPixelRatio = Number(maxPixelRatio);
    this.maxPixelRatio = Math.min(2, Math.max(1, Number.isFinite(requestedPixelRatio) ? requestedPixelRatio : 2));
    this.lastRenderKey = null;
  }

  render({ elapsedMs = 0, moving = false, devicePixelRatio = globalThis.devicePixelRatio || 1 } = {}) {
    const canvas = this.canvas;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect?.();
    const cssWidth = Number(rect?.width || canvas.clientWidth || 0);
    const cssHeight = Number(rect?.height || canvas.clientHeight || 0);
    if (!cssWidth || !cssHeight) return false;

    const ratio = Math.min(this.maxPixelRatio, Math.max(1, Number(devicePixelRatio) || 1));
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const frame = frameAtSettings(this.metadata, { elapsedMs, moving });
    const key = `${frame}:${width}:${height}`;
    if (key === this.lastRenderKey) return false;
    const context = canvas.getContext("2d", { alpha: true });
    if (!drawPointBoardFrame(context, this.image, this.metadata, frame, width, height)) return false;
    this.lastRenderKey = key;
    return true;
  }

  dispose() {
    this.canvas = null;
    this.image = null;
    this.lastRenderKey = null;
  }
}
