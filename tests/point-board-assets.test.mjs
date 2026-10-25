import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { readPngDimensions, validatePointBoardAssetsForModule } from "../scripts/point-board-assets.mjs";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBytes, data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return chunk;
}

function minimalPng(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rowLength = 1 + (width * 4);
  const pixels = deflateSync(Buffer.alloc(rowLength * height));
  return Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", pixels),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

const metadata = Object.freeze({
  schemaVersion: 1,
  spriteSheet: "assets/hunting/deer.png",
  frameWidth: 8,
  frameHeight: 4,
  frameCount: 2,
  animation: { idleFrame: 0, walk: { startFrame: 1, frameCount: 1, fps: 8 } }
});

async function createModuleFixture(t, { image = minimalPng(16, 4), manifest = metadata } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "regionwright-point-board-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const assetDirectory = path.join(root, "assets", "hunting");
  await mkdir(assetDirectory, { recursive: true });
  await writeFile(path.join(assetDirectory, "deer-point-board.json"), JSON.stringify(manifest));
  if (image !== null) await writeFile(path.join(assetDirectory, "deer.png"), image);
  return root;
}

test("PNG reader validates chunk checksums and returns logical dimensions", () => {
  assert.deepEqual(readPngDimensions(minimalPng(16, 4)), { width: 16, height: 4 });
  const damaged = minimalPng(16, 4);
  damaged[damaged.length - 6] ^= 1;
  assert.throws(() => readPngDimensions(damaged), /checksum/);
  assert.throws(() => readPngDimensions(Buffer.from("not a PNG")), /must be a PNG/);
});

test("module build validator checks manifests, sheet dimensions, and records byte size", async t => {
  const root = await createModuleFixture(t);
  const [asset] = await validatePointBoardAssetsForModule(root);
  assert.equal(asset.manifest, "assets/hunting/deer-point-board.json");
  assert.equal(asset.spriteSheet, metadata.spriteSheet);
  assert.equal(asset.width, 16);
  assert.equal(asset.height, 4);
  assert.equal(asset.frameCount, 2);
  assert.ok(asset.bytes > 0);
});

test("module build validator accepts code-native point-board data without a PNG sheet", async t => {
  const manifest = {
    format: "regionwright.point-board",
    formatVersion: 1,
    width: 4,
    height: 3,
    palette: ["#ffffff"],
    layers: [{ id: "forest", frames: [[[2, 1, 0]]] }]
  };
  const root = await createModuleFixture(t, { manifest, image: null });
  const [asset] = await validatePointBoardAssetsForModule(root);
  assert.equal(asset.kind, "coded-data");
  assert.equal(asset.width, 4);
  assert.equal(asset.height, 3);
  assert.equal(asset.layerCount, 1);
  assert.equal(asset.frameCount, 1);
  assert.equal(asset.activeCells, 1);
  assert.ok(asset.bytes > 0);
});

test("module build validator rejects mismatched sheets, missing files, and non-assets paths", async t => {
  const mismatchRoot = await createModuleFixture(t, { image: minimalPng(15, 4) });
  await assert.rejects(validatePointBoardAssetsForModule(mismatchRoot), /exactly 16 × 4/);

  const missingRoot = await createModuleFixture(t, { image: null });
  await assert.rejects(validatePointBoardAssetsForModule(missingRoot), /missing sprite sheet/);

  const invalidRoot = await createModuleFixture(t, {
    manifest: { ...metadata, spriteSheet: "textures/deer.png" }
  });
  await assert.rejects(validatePointBoardAssetsForModule(invalidRoot), /must be stored under the module assets\//);
});

test("modules without point-board manifests pass with no generated assets", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "regionwright-point-board-empty-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await validatePointBoardAssetsForModule(root), []);
});
