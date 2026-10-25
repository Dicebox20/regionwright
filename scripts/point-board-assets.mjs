import { access, readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import {
  normalizePointBoardData,
  normalizePointBoardMetadata,
  POINT_BOARD_DATA_FORMAT,
  validatePointBoardSheet
} from "../modules/regionwright-hunting-gathering/point-board-renderer.js";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

function crc32(buffer, start, end) {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function assertInside(root, candidate, label) {
  const relative = path.relative(root, candidate);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the owning module.`);
  }
}

export function readPngDimensions(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input ?? []);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new TypeError("Point-board sprite sheet must be a PNG image.");
  }
  if (buffer.readUInt32BE(8) !== 13 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new TypeError("Point-board PNG must begin with a valid IHDR chunk.");
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) throw new RangeError("Point-board PNG dimensions must be greater than zero.");

  let offset = 8;
  let chunkIndex = 0;
  let sawImageData = false;
  let sawEnd = false;
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) throw new TypeError("Point-board PNG contains a truncated chunk.");
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    const end = crcOffset + 4;
    if (end > buffer.length) throw new TypeError(`Point-board PNG has a truncated ${type} chunk.`);
    if (crc32(buffer, offset + 4, crcOffset) !== buffer.readUInt32BE(crcOffset)) {
      throw new TypeError(`Point-board PNG has an invalid ${type} chunk checksum.`);
    }
    if (chunkIndex === 0 && type !== "IHDR") throw new TypeError("Point-board PNG must begin with IHDR.");
    if (type === "IHDR" && (chunkIndex !== 0 || length !== 13)) throw new TypeError("Point-board PNG has an invalid IHDR chunk.");
    if (type === "IDAT") sawImageData = true;
    if (type === "IEND") {
      if (length !== 0) throw new TypeError("Point-board PNG has an invalid IEND chunk.");
      sawEnd = true;
      if (end !== buffer.length) throw new TypeError("Point-board PNG contains data after IEND.");
      break;
    }
    chunkIndex += 1;
    offset = end;
  }
  if (!sawImageData || !sawEnd) throw new TypeError("Point-board PNG is missing IDAT or IEND.");
  return Object.freeze({ width, height });
}

async function findPointBoardManifests(assetsRoot) {
  let entries;
  try {
    entries = await readdir(assetsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const manifests = [];
  for (const entry of entries) {
    const fullPath = path.join(assetsRoot, entry.name);
    if (entry.isDirectory()) manifests.push(...await findPointBoardManifests(fullPath));
    else if (entry.isFile() && /-point-board\.json$/i.test(entry.name)) manifests.push(fullPath);
  }
  return manifests.sort((left, right) => left.localeCompare(right));
}

export async function validatePointBoardAssetsForModule(moduleRoot) {
  const root = path.resolve(moduleRoot);
  await access(root);
  const assetsRoot = path.join(root, "assets");
  const manifestPaths = await findPointBoardManifests(assetsRoot);
  const validated = [];

  for (const manifestPath of manifestPaths) {
    const relativeManifest = path.relative(root, manifestPath).split(path.sep).join("/");
    let raw;
    try {
      raw = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      throw new Error(`${relativeManifest}: ${error.message}`, { cause: error });
    }
    if (raw?.format === POINT_BOARD_DATA_FORMAT) {
      let board;
      try {
        board = normalizePointBoardData(raw);
      } catch (error) {
        throw new Error(`${relativeManifest}: ${error.message}`, { cause: error });
      }
      validated.push(Object.freeze({
        kind: "coded-data",
        manifest: relativeManifest,
        width: board.width,
        height: board.height,
        layerCount: board.layers.length,
        frameCount: Math.max(...board.layers.map(layer => layer.frames.length)),
        activeCells: board.layers.reduce((total, layer) => total + layer.frames.reduce((count, frame) => count + frame.length, 0), 0),
        bytes: (await stat(manifestPath)).size
      }));
      continue;
    }

    let metadata;
    try {
      metadata = normalizePointBoardMetadata(raw);
    } catch (error) {
      throw new Error(`${relativeManifest}: ${error.message}`, { cause: error });
    }
    if (!metadata.spriteSheet.startsWith("assets/")) {
      throw new Error(`${relativeManifest}: spriteSheet must be stored under the module assets/ directory.`);
    }

    const spritePath = path.resolve(root, ...metadata.spriteSheet.split("/"));
    assertInside(root, spritePath, `${relativeManifest} spriteSheet`);
    try {
      await access(spritePath);
    } catch {
      throw new Error(`${relativeManifest}: missing sprite sheet ${metadata.spriteSheet}.`);
    }
    const [resolvedRoot, resolvedSprite] = await Promise.all([realpath(root), realpath(spritePath)]);
    assertInside(resolvedRoot, resolvedSprite, `${relativeManifest} spriteSheet`);

    const [imageBytes, imageStat] = await Promise.all([readFile(spritePath), stat(spritePath)]);
    const dimensions = readPngDimensions(imageBytes);
    try {
      validatePointBoardSheet({ naturalWidth: dimensions.width, naturalHeight: dimensions.height }, metadata);
    } catch (error) {
      throw new Error(`${relativeManifest}: ${error.message}`, { cause: error });
    }

    validated.push(Object.freeze({
      manifest: relativeManifest,
      spriteSheet: metadata.spriteSheet,
      width: dimensions.width,
      height: dimensions.height,
      frameCount: metadata.frameCount,
      bytes: imageStat.size
    }));
  }

  return validated;
}
