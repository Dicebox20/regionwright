import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  POINT_BOARD_SCHEMA_VERSION,
  PointBoardCanvasRenderer,
  PointBoardDataLayerRenderer,
  disposePointBoardDataCache,
  drawPointBoardDataLayer,
  drawPointBoardFrame,
  loadCodedPointBoardAsset,
  loadCodedPointBoardData,
  loadPointBoardAsset,
  loadPointBoardAssetFromManifest,
  loadPointBoardMetadata,
  loadPointBoardSheet,
  normalizePointBoardData,
  normalizePointBoardMetadata,
  pointBoardDataFrameAt,
  pointBoardFrameAt,
  rasterizePointBoardData,
  validatePointBoardSheet
} from "../modules/regionwright-hunting-gathering/point-board-renderer.js";

const metadata = Object.freeze({
  schemaVersion: 1,
  spriteSheet: "assets/hunting/deer-point-board.png",
  frameWidth: 115,
  frameHeight: 96,
  frameCount: 7,
  animation: Object.freeze({
    idleFrame: 0,
    walk: Object.freeze({ startFrame: 1, frameCount: 6, fps: 8 })
  })
});

const codedBoard = {
  format: "regionwright.point-board",
  formatVersion: 1,
  width: 4,
  height: 3,
  palette: ["#FFFFFF", "#ffcc88"],
  layers: [
    { id: "forest", frames: [[[1, 2, 0]]] },
    {
      id: "deer",
      frames: [[[0, 0, 1]], [[1, 0, 1], [2, 0, 0]]],
      animation: { idleFrame: 0, walk: { startFrame: 1, frameCount: 1, fps: 8 } }
    }
  ]
};

test("point-board metadata validates frame ranges and animation rate", () => {
  assert.deepEqual(normalizePointBoardMetadata(metadata), metadata);
  assert.equal(pointBoardFrameAt(metadata, { moving: false, elapsedMs: 9000 }), 0);
  assert.equal(pointBoardFrameAt(metadata, { moving: true, elapsedMs: 0 }), 1);
  assert.equal(pointBoardFrameAt(metadata, { moving: true, elapsedMs: 125 }), 2);
  assert.equal(pointBoardFrameAt(metadata, { moving: true, elapsedMs: 750 }), 1);
  assert.equal(pointBoardFrameAt({ ...metadata, frameCount: 1, animation: { idleFrame: 0 } }, { moving: true, elapsedMs: 9000 }), 0);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, schemaVersion: 2 }), /Unsupported point-board schemaVersion/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, schemaVersion: "1" }), /Unsupported point-board schemaVersion/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, spriteSheet: "../deer.png" }), /module-relative \.png path/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, spriteSheet: "assets/./deer.png" }), /module-relative \.png path/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, spriteSheet: "assets/%2e%2e/deer.png" }), /module-relative \.png path/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, frameWidth: "115" }), /frameWidth must be a positive integer/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, animation: { idleFrame: 0, walk: { startFrame: 2, frameCount: 6, fps: 8 } } }), /Walking frames/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, animation: { idleFrame: 0, walk: { startFrame: 1, frameCount: 6, fps: 31 } } }), /animation.walk.fps/);
  assert.throws(() => normalizePointBoardMetadata({ ...metadata, unexpected: true }), /unknown v1 field/);
});

test("coded point-board data validates authored cells, layers, palettes, and frames", async () => {
  const normalized = normalizePointBoardData(codedBoard);
  assert.equal(normalized.width, 4);
  assert.equal(normalized.palette[0], "#ffffff");
  assert.equal(Object.isFrozen(normalized.layers[1].frames[1][0]), true);
  assert.equal(pointBoardDataFrameAt(codedBoard, "deer", { moving: false, elapsedMs: 9000 }), 0);
  assert.equal(pointBoardDataFrameAt(codedBoard, "deer", { moving: true, elapsedMs: 0 }), 1);
  assert.equal(pointBoardDataFrameAt(codedBoard, "deer", { moving: true, elapsedMs: 125 }), 1);
  assert.equal(pointBoardDataFrameAt(codedBoard, "forest", { moving: true, elapsedMs: 9000 }), 0);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, formatVersion: 2 }), /Unsupported point-board formatVersion/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, width: 513 }), /width must be a positive integer/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, palette: ["red"] }), /#RRGGBB/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, layers: [{ id: "bad id", frames: [[]] }] }), /lowercase identifier/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, layers: [{ id: "deer", frames: [[[4, 0, 0]]] }] }), /x coordinate outside/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, layers: [{ id: "deer", frames: [[[0, 3, 0]]] }] }), /y coordinate outside/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, layers: [{ id: "deer", frames: [[[0, 0, 2]]] }] }), /invalid palette index/);
  assert.throws(() => normalizePointBoardData({ ...codedBoard, layers: [{ id: "deer", frames: [[[0, 0, 0], [0, 0, 1]]] }] }), /duplicate cell/);
  assert.throws(() => pointBoardDataFrameAt(codedBoard, "missing"), /Unknown point-board layer/);

  const schema = JSON.parse(await readFile(new URL("../docs/POINT_BOARD_DATA_SCHEMA_V1.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.format.const, normalized.format);
  assert.equal(schema.properties.formatVersion.const, normalized.formatVersion);
});

test("coded board rasterizes each layer once and draws the chosen cached frame", () => {
  const made = [];
  const canvasFactory = (width, height, layerId) => {
    const calls = [];
    let fillStyle = "#000000";
    const context = {
      clearRect: (...args) => calls.push(["clear", ...args]),
      fillRect: (...args) => calls.push(["fill", fillStyle, ...args]),
      set fillStyle(value) { fillStyle = value; },
      get fillStyle() { return fillStyle; }
    };
    const canvas = { width, height, layerId, calls, getContext: () => context };
    made.push(canvas);
    return canvas;
  };
  const cache = rasterizePointBoardData(codedBoard, { canvasFactory });
  assert.equal(cache.layers.size, 2);
  assert.equal(cache.layers.get("deer").frames.length, 2);
  assert.equal(cache.layers.get("deer").frames[0].width, 4);
  assert.equal(cache.layers.get("deer").frames[0].height, 3);
  assert.equal(made.filter(canvas => canvas.layerId === "deer").flatMap(canvas => canvas.calls).filter(call => call[0] === "fill").length, 3);

  const drawCalls = [];
  const context = { drawImage: (...args) => drawCalls.push(args), imageSmoothingEnabled: true };
  assert.equal(drawPointBoardDataLayer(context, cache.layers.get("deer"), 1, { x: 12, y: 20, width: 8, height: 6 }), true);
  assert.equal(context.imageSmoothingEnabled, false);
  assert.deepEqual(drawCalls[0], [cache.layers.get("deer").frames[1], 0, 0, 4, 3, 12, 20, 8, 6]);
  assert.throws(() => drawPointBoardDataLayer(context, cache.layers.get("deer"), 2), /frameIndex/);
  const deerLayer = cache.layers.get("deer");
  assert.equal(disposePointBoardDataCache(cache), true);
  assert.equal(cache.layers.size, 0);
  assert.equal(drawPointBoardDataLayer(null, deerLayer, 0), false);
});

test("coded layer renderer scales for DPR and redraws only for animation or canvas size changes", () => {
  const draws = [];
  const clears = [];
  const canvas = {
    width: 0,
    height: 0,
    cssWidth: 8,
    cssHeight: 6,
    getBoundingClientRect() { return { width: this.cssWidth, height: this.cssHeight }; },
    getContext() {
      return {
        clearRect: (...args) => clears.push(args),
        drawImage: (...args) => draws.push(args)
      };
    }
  };
  const layer = {
    frameWidth: 4,
    frameHeight: 3,
    frameCount: 2,
    frames: [{ id: "idle" }, { id: "walk" }],
    animation: { idleFrame: 0, walk: { startFrame: 1, frameCount: 1, fps: 8 } }
  };
  const renderer = new PointBoardDataLayerRenderer(canvas, layer, { maxPixelRatio: 2 });

  assert.equal(renderer.render({ moving: false, devicePixelRatio: 3 }), true);
  assert.equal(canvas.width, 16);
  assert.equal(canvas.height, 12);
  assert.equal(draws[0][0], layer.frames[0]);
  assert.equal(renderer.render({ moving: false, elapsedMs: 1000, devicePixelRatio: 3 }), false);
  assert.equal(renderer.render({ moving: true, elapsedMs: 0, devicePixelRatio: 3 }), true);
  assert.equal(draws[1][0], layer.frames[1]);

  canvas.cssWidth = 10;
  assert.equal(renderer.render({ moving: true, elapsedMs: 125, devicePixelRatio: 3 }), true);
  assert.equal(canvas.width, 20);
  assert.equal(draws.length, 3);
  assert.equal(clears.length, 3);
  renderer.dispose();
  assert.equal(renderer.render(), false);
});

test("coded layer renderer supports a validated source crop for gameplay-aligned art", () => {
  const draws = [];
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 8, height: 12 }),
    getContext: () => ({ clearRect() {}, drawImage: (...args) => draws.push(args) })
  };
  const layer = {
    frameWidth: 4,
    frameHeight: 3,
    frameCount: 2,
    frames: [{ id: "idle" }, { id: "walk" }],
    animation: { idleFrame: 0, walk: { startFrame: 1, frameCount: 1, fps: 8 } }
  };
  const sourceRect = { x: 1, y: 0, width: 2, height: 3 };
  const renderer = new PointBoardDataLayerRenderer(canvas, layer, { sourceRect });

  assert.equal(renderer.render(), true);
  assert.deepEqual(draws[0], [layer.frames[0], 1, 0, 2, 3, 0, 0, 8, 12]);
  assert.throws(() => new PointBoardDataLayerRenderer(canvas, layer, { sourceRect: { x: 3, y: 0, width: 2, height: 3 } }), /integer crop inside/);
  assert.throws(() => new PointBoardDataLayerRenderer(canvas, layer, { sourceRect: { x: 0.5, y: 0, width: 2, height: 3 } }), /integer crop inside/);
  renderer.dispose();
});

test("coded board loader caches validated module-local data and prepares canvas layers", async () => {
  let fetchCount = 0;
  const baseURL = "https://foundry.example/modules/regionwright-hunting-gathering/point-board-renderer.js";
  const fetchFn = async (url, options) => {
    fetchCount += 1;
    assert.equal(url, "https://foundry.example/modules/regionwright-hunting-gathering/assets/hunting/coded-test-point-board.json");
    assert.equal(options.credentials, "same-origin");
    return { ok: true, status: 200, json: async () => codedBoard };
  };
  const options = { baseURL, fetchFn };
  const [first, second] = await Promise.all([
    loadCodedPointBoardData("assets/hunting/coded-test-point-board.json", options),
    loadCodedPointBoardData("assets/hunting/coded-test-point-board.json", options)
  ]);
  assert.equal(fetchCount, 1);
  assert.equal(first, second);
  await assert.rejects(loadCodedPointBoardData("../outside.json", options), /module-relative point-board data URL/);

  const asset = await loadCodedPointBoardAsset("assets/hunting/coded-test-point-board.json", {
    ...options,
    canvasFactory: (width, height) => ({ width, height, getContext: () => ({ clearRect() {}, fillRect() {} }) })
  });
  assert.equal(asset.cache.layers.size, 2);
  assert.equal(asset.cache.layers.get("deer").frameCount, 2);
});

test("v1 metadata schema example matches the runtime validator", async () => {
  const schema = JSON.parse(await readFile(new URL("../docs/POINT_BOARD_ASSET_SCHEMA_V1.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.schemaVersion.const, POINT_BOARD_SCHEMA_VERSION);
  for (const example of schema.examples) assert.deepEqual(normalizePointBoardMetadata(example), normalizePointBoardMetadata(metadata));
  const pathPattern = new RegExp(schema.properties.spriteSheet.pattern);
  assert.equal(pathPattern.test(metadata.spriteSheet), true);
  assert.equal(pathPattern.test("../deer.png"), false);
  assert.equal(pathPattern.test("assets/./deer.png"), false);
  assert.equal(pathPattern.test("assets/%2e%2e/deer.png"), false);
  assert.equal(pathPattern.test("https://example.test/deer.png"), false);
});

test("point-board sheet rejects undersized exports", () => {
  assert.deepEqual(validatePointBoardSheet({ width: 805, height: 96 }, metadata), metadata);
  assert.throws(() => validatePointBoardSheet({ width: 804, height: 96 }, metadata), /exactly 805 × 96/);
  assert.throws(() => validatePointBoardSheet({ width: 806, height: 96 }, metadata), /exactly 805 × 96/);
  assert.throws(() => validatePointBoardSheet({ width: 805, height: 95 }, metadata), /exactly 805 × 96/);
});

test("frame drawing blits only the selected sheet frame with smoothing disabled", () => {
  const calls = [];
  const context = {
    imageSmoothingEnabled: true,
    clearRect: (...args) => calls.push(["clear", ...args]),
    drawImage: (...args) => calls.push(["draw", ...args])
  };
  const image = { width: 805, height: 96 };

  assert.equal(drawPointBoardFrame(context, image, metadata, 4, 460, 384), true);
  assert.equal(context.imageSmoothingEnabled, false);
  assert.deepEqual(calls[0], ["clear", 0, 0, 460, 384]);
  assert.deepEqual(calls[1], ["draw", image, 460, 0, 115, 96, 0, 0, 460, 384]);
  assert.throws(() => drawPointBoardFrame(context, image, metadata, 7, 460, 384), /frameIndex/);
});

test("canvas renderer caps DPR, draws only when frame or size changes, and releases its references", () => {
  const draws = [];
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 230, height: 192 }),
    getContext: () => ({
      clearRect() {},
      drawImage: (...args) => draws.push(args)
    })
  };
  const image = { width: 805, height: 96 };
  const renderer = new PointBoardCanvasRenderer(canvas, image, metadata, { maxPixelRatio: 5 });

  assert.equal(renderer.render({ moving: true, elapsedMs: 0, devicePixelRatio: 3 }), true);
  assert.equal(canvas.width, 460);
  assert.equal(canvas.height, 384);
  assert.equal(renderer.render({ moving: true, elapsedMs: 80, devicePixelRatio: 3 }), false);
  assert.equal(renderer.render({ moving: true, elapsedMs: 125, devicePixelRatio: 3 }), true);
  assert.equal(draws.length, 2);
  renderer.dispose();
  assert.equal(renderer.render(), false);
});

test("point-board image loader caches a decoded sheet", async () => {
  let imageCount = 0;
  class FakeImage {
    constructor() {
      imageCount += 1;
      this.complete = false;
      this.onload = null;
      this.onerror = null;
    }
    set src(value) {
      this._src = value;
      this.width = 805;
      this.height = 96;
      this.complete = true;
      queueMicrotask(() => this.onload?.());
    }
    get src() { return this._src; }
    async decode() {}
  }

  const [first, second] = await Promise.all([
    loadPointBoardSheet("asset://renderer-test", { ImageClass: FakeImage }),
    loadPointBoardSheet("asset://renderer-test", { ImageClass: FakeImage })
  ]);
  assert.equal(first, second);
  assert.equal(imageCount, 1);
});

test("v1 asset loader resolves a safe module-relative path and validates the sheet", async () => {
  class FakeImage {
    constructor() { this.complete = false; }
    set src(value) {
      this._src = value;
      this.width = 805;
      this.height = 96;
      this.complete = true;
      queueMicrotask(() => this.onload?.());
    }
    get src() { return this._src; }
    async decode() {}
  }

  const asset = await loadPointBoardAsset(metadata, {
    baseURL: "https://foundry.example/modules/regionwright-hunting-gathering/point-board-renderer.js",
    ImageClass: FakeImage
  });
  assert.equal(asset.url, "https://foundry.example/modules/regionwright-hunting-gathering/assets/hunting/deer-point-board.png");
  assert.deepEqual(asset.metadata, metadata);
  assert.equal(asset.image.width, 805);
});

test("manifest loader fetches validated metadata once and shares the sheet image", async () => {
  let fetchCount = 0;
  let imageCount = 0;
  class FakeImage {
    constructor() { imageCount += 1; this.complete = false; }
    set src(value) {
      this._src = value;
      this.width = 805;
      this.height = 96;
      this.complete = true;
      queueMicrotask(() => this.onload?.());
    }
    get src() { return this._src; }
    async decode() {}
  }
  const baseURL = "https://foundry.example/manifest-test/modules/regionwright-hunting-gathering/point-board-renderer.js";
  const fetchFn = async (url, options) => {
    fetchCount += 1;
    assert.equal(url, "https://foundry.example/manifest-test/modules/regionwright-hunting-gathering/assets/hunting/deer-point-board.json");
    assert.equal(options.credentials, "same-origin");
    return { ok: true, status: 200, json: async () => metadata };
  };
  const options = { baseURL, fetchFn, ImageClass: FakeImage };
  const [first, second] = await Promise.all([
    loadPointBoardAssetFromManifest("assets/hunting/deer-point-board.json", options),
    loadPointBoardAssetFromManifest("assets/hunting/deer-point-board.json", options)
  ]);

  assert.equal(fetchCount, 1);
  assert.equal(imageCount, 1);
  assert.equal(first.image, second.image);
  assert.deepEqual(first.metadata, metadata);
  await assert.rejects(
    loadPointBoardMetadata("../outside.json", options),
    /module-relative point-board metadata URL/
  );
});
