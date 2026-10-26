export const SLIDING_MOSAIC_VERSION = 1;
export const SLIDING_MOSAIC_TARGET_TYPES = Object.freeze(["door", "tile", "region"]);
export const SLIDING_MOSAIC_SIZES = Object.freeze([3, 4, 5]);

const clampSize = value => {
  const size = Math.trunc(Number(value));
  if (!SLIDING_MOSAIC_SIZES.includes(size)) throw new Error("Choose a 3 × 3, 4 × 4, or 5 × 5 grid.");
  return size;
};
const cleanImage = value => String(value ?? "").trim().slice(0, 2048);

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value ?? "sliding-mosaic")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function random(seed) {
  let state = hashSeed(seed) || 1;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

function goalOrder(size) {
  return Array.from({ length: size * size }, (_entry, index) => index === size * size - 1 ? 0 : index + 1);
}

function adjacentCells(index, size) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [
    row > 0 ? index - size : -1,
    column < size - 1 ? index + 1 : -1,
    row < size - 1 ? index + size : -1,
    column > 0 ? index - 1 : -1
  ].filter(cell => cell >= 0);
}

function validateFixedOrder(size, order) {
  if (order == null) return null;
  if (!Array.isArray(order) || order.length !== size * size ||
      new Set(order).size !== order.length ||
      order.some(n => !Number.isInteger(n) || n < 0 || n >= size * size)) throw new Error("Invalid fixed sliding-puzzle starting order.");
  const nonzero = order.filter(n => n !== 0);
  let inversions = 0;
  for (let i = 0; i < nonzero.length; i++)
    for (let j = i + 1; j < nonzero.length; j++)
      if (nonzero[i] > nonzero[j]) inversions++;
  const blankFromBottom = size - Math.floor(order.indexOf(0) / size);
  const solvable = size % 2 === 1 ? inversions % 2 === 0 : (inversions + blankFromBottom) % 2 === 1;
  if (!solvable) throw new Error("Fixed sliding-puzzle starting order is not solvable.");
  return Object.freeze([...order]);
}
export function createSlidingMosaicConfig({ image = "", size = 4, seed = "", initialOrder = null } = {}) {
  const path = cleanImage(image);
  if (!path) throw new Error("Choose an image for the sliding puzzle.");
  const gridSize = clampSize(size);
  const fixed = validateFixedOrder(gridSize, initialOrder);
  return Object.freeze({
    version: SLIDING_MOSAIC_VERSION,
    image: path,
    size: gridSize,
    seed: String(seed ?? "").trim().slice(0, 80),
    ...(fixed ? { initialOrder: fixed } : {})
  });
}

export function validateSlidingMosaicConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== SLIDING_MOSAIC_VERSION) throw new Error("This Sliding Mosaic configuration is unsupported.");
  return createSlidingMosaicConfig(config);
}

export function shuffledSlidingOrder(config, seed = "", moveCount = null) {
  const checked = validateSlidingMosaicConfig(config);
  if (checked.initialOrder) return Object.freeze([...checked.initialOrder]);
  const order = goalOrder(checked.size);
  const next = random(`${checked.seed}:${seed}`);
  const moves = Math.max(1, Math.min(2000, Math.trunc(Number(moveCount) || checked.size * checked.size * 12)));
  let blank = order.length - 1;
  let previousBlank = -1;

  for (let turn = 0; turn < moves; turn += 1) {
    let choices = adjacentCells(blank, checked.size);
    if (choices.length > 1 && previousBlank >= 0) choices = choices.filter(index => index !== previousBlank);
    const tile = choices[Math.floor(next() * choices.length)];
    [order[blank], order[tile]] = [order[tile], order[blank]];
    previousBlank = blank;
    blank = tile;
  }

  if (evaluateSlidingOrder(checked, order).success) {
    const tile = adjacentCells(blank, checked.size)[0];
    [order[blank], order[tile]] = [order[tile], order[blank]];
  }
  return Object.freeze(order);
}

export function slideMosaicTile(order, tileIndex, size) {
  const gridSize = clampSize(size);
  if (!Array.isArray(order) || order.length !== gridSize * gridSize) return null;
  const blank = order.indexOf(0);
  const index = Math.trunc(Number(tileIndex));
  if (blank < 0 || index < 0 || index >= order.length || !adjacentCells(blank, gridSize).includes(index)) return null;
  const moved = [...order];
  [moved[blank], moved[index]] = [moved[index], moved[blank]];
  return Object.freeze(moved);
}

export function evaluateSlidingOrder(config, order) {
  const checked = validateSlidingMosaicConfig(config);
  const goal = goalOrder(checked.size);
  const attempted = Array.isArray(order) ? order.map(value => Number(value)) : [];
  const valid = attempted.length === goal.length
    && new Set(attempted).size === goal.length
    && attempted.every(value => Number.isInteger(value) && value >= 0 && value < goal.length);
  return Object.freeze({ valid, success: valid && attempted.every((value, index) => value === goal[index]) });
}
