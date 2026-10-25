export const LASER_GRID_VERSION = 1;

/** Clockwise octants: north, north-east, east, and so on. */
export const LASER_DIRECTIONS = Object.freeze([
  Object.freeze({ row: -1, col: 0, label: "North" }),
  Object.freeze({ row: -1, col: 1, label: "North-east" }),
  Object.freeze({ row: 0, col: 1, label: "East" }),
  Object.freeze({ row: 1, col: 1, label: "South-east" }),
  Object.freeze({ row: 1, col: 0, label: "South" }),
  Object.freeze({ row: 1, col: -1, label: "South-west" }),
  Object.freeze({ row: 0, col: -1, label: "West" }),
  Object.freeze({ row: -1, col: -1, label: "North-west" })
]);

const modulo = (value, size) => ((Number(value) % size) + size) % size;
const keyFor = (row, col) => `${row},${col}`;
const clone = value => structuredClone(value);
const boundedInteger = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

/** A mirror uses its four physical axes; a diode rotates through all eight. */
export function orientationCount(piece) {
  return piece?.kind === "diode" ? 8 : 4;
}

export function normalizeOrientation(piece, orientation) {
  return modulo(Math.trunc(Number(orientation) || 0), orientationCount(piece));
}

/** Reflect a travelling octant across one of the four mirror axes. */
export function reflectDirection(direction, orientation) {
  return modulo((2 * modulo(orientation, 4)) - modulo(direction, 8), 8);
}

/** A diode accepts a beam at its rear and redirects it one octant clockwise. */
export function routePiece(piece, incomingDirection, orientation) {
  const facing = normalizeOrientation(piece, orientation);
  if (piece.kind === "diode") return modulo(incomingDirection, 8) === facing ? modulo(facing + 1, 8) : null;
  return reflectDirection(incomingDirection, facing);
}

const TEMPLATE_BY_TIER = Object.freeze([
  Object.freeze({
    rows: 5,
    cols: 6,
    emitter: { row: 4, col: 0, direction: 2 },
    receivers: [{ id: "receiver-1", row: 0, col: 4 }],
    pieces: [
      { id: "mirror-a", row: 4, col: 2, kind: "mirror", orientation: 3 },
      { id: "mirror-b", row: 0, col: 2, kind: "mirror", orientation: 0 }
    ]
  }),
  Object.freeze({
    rows: 6,
    cols: 6,
    emitter: { row: 5, col: 0, direction: 2 },
    receivers: [{ id: "receiver-1", row: 0, col: 3 }],
    pieces: [
      { id: "mirror-a", row: 5, col: 2, kind: "mirror", orientation: 2 },
      { id: "diode-a", row: 3, col: 2, kind: "diode", orientation: 4 },
      { id: "mirror-b", row: 1, col: 4, kind: "mirror", orientation: 2 }
    ]
  }),
  Object.freeze({
    rows: 7,
    cols: 7,
    emitter: { row: 6, col: 0, direction: 2 },
    receivers: [{ id: "receiver-1", row: 0, col: 5 }],
    blockers: [{ row: 5, col: 4 }, { row: 3, col: 5 }, { row: 1, col: 1 }],
    pieces: [
      { id: "mirror-a", row: 6, col: 2, kind: "mirror", orientation: 0 },
      { id: "diode-a", row: 3, col: 2, kind: "diode", orientation: 6 },
      { id: "diode-b", row: 1, col: 4, kind: "diode", orientation: 2 },
      { id: "mirror-b", row: 1, col: 5, kind: "mirror", orientation: 2 }
    ]
  })
]);

function seededOffset(seed, index, count) {
  const source = String(seed ?? "laser-grid");
  let hash = 2166136261;
  for (const character of `${source}:${index}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return modulo(hash >>> 0, count);
}

/**
 * Create a deterministic, authored routing board. The intended arrangement is
 * never stored: the authoritative GM validates the player's submitted state
 * by tracing the beam through this public board configuration.
 */
export function createLaserGridConfig({ tier = 1, seed = "laser-grid" } = {}) {
  const selectedTier = Math.max(0, Math.min(TEMPLATE_BY_TIER.length - 1, Math.trunc(Number(tier) || 0)));
  const template = clone(TEMPLATE_BY_TIER[selectedTier]);
  const pieces = template.pieces.map((piece, index) => ({
    ...piece,
    orientation: normalizeOrientation(piece, piece.orientation + seededOffset(seed, index, orientationCount(piece)))
  }));
  // A deterministic offset can occasionally land on the authored solution.
  // Always present a real puzzle by moving the first relay one valid turn.
  const draft = { version: LASER_GRID_VERSION, tier: selectedTier, seed: String(seed), rows: template.rows, cols: template.cols, emitter: template.emitter, receivers: template.receivers, blockers: template.blockers ?? [], pieces };
  if (traceLaserGrid(draft).solved) pieces[0].orientation = normalizeOrientation(pieces[0], pieces[0].orientation + 1);
  return Object.freeze({
    version: LASER_GRID_VERSION,
    tier: selectedTier,
    seed: String(seed),
    rows: template.rows,
    cols: template.cols,
    emitter: Object.freeze(template.emitter),
    receivers: Object.freeze(template.receivers.map(receiver => Object.freeze(receiver))),
    blockers: Object.freeze((template.blockers ?? []).map(blocker => Object.freeze(blocker))),
    pieces: Object.freeze(pieces.map(piece => Object.freeze(piece)))
  });
}

export function validateLaserGridConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== LASER_GRID_VERSION) throw new Error("This Laser Grid configuration is unsupported.");
  if (!boundedInteger(config.rows, 3, 9) || !boundedInteger(config.cols, 3, 9)) throw new Error("The Laser Grid size is invalid.");
  if (!boundedInteger(config.emitter?.row, 0, config.rows - 1) || !boundedInteger(config.emitter?.col, 0, config.cols - 1) || !boundedInteger(config.emitter?.direction, 0, 7)) throw new Error("The Laser Grid emitter is invalid.");
  if (!Array.isArray(config.receivers) || !config.receivers.length || config.receivers.length > 4) throw new Error("The Laser Grid needs at least one receiver.");
  if (!Array.isArray(config.pieces) || !config.pieces.length || config.pieces.length > 12) throw new Error("The Laser Grid pieces are invalid.");
  const occupied = new Set([keyFor(config.emitter.row, config.emitter.col)]);
  for (const receiver of config.receivers) {
    if (!receiver?.id || !boundedInteger(receiver.row, 0, config.rows - 1) || !boundedInteger(receiver.col, 0, config.cols - 1)) throw new Error("The Laser Grid receiver is invalid.");
    const key = keyFor(receiver.row, receiver.col);
    if (occupied.has(key)) throw new Error("Laser Grid components cannot overlap.");
    occupied.add(key);
  }
  for (const blocker of config.blockers ?? []) {
    if (!boundedInteger(blocker?.row, 0, config.rows - 1) || !boundedInteger(blocker?.col, 0, config.cols - 1)) throw new Error("The Laser Grid blocker is invalid.");
    const key = keyFor(blocker.row, blocker.col);
    if (occupied.has(key)) throw new Error("Laser Grid components cannot overlap.");
    occupied.add(key);
  }
  const pieceIds = new Set();
  for (const piece of config.pieces) {
    if (!piece?.id || pieceIds.has(piece.id) || !["mirror", "diode"].includes(piece.kind) || !boundedInteger(piece.row, 0, config.rows - 1) || !boundedInteger(piece.col, 0, config.cols - 1)) throw new Error("The Laser Grid relay is invalid.");
    if (!boundedInteger(piece.orientation, 0, orientationCount(piece) - 1)) throw new Error("The Laser Grid relay orientation is invalid.");
    const key = keyFor(piece.row, piece.col);
    if (occupied.has(key)) throw new Error("Laser Grid components cannot overlap.");
    occupied.add(key);
    pieceIds.add(piece.id);
  }
  return clone(config);
}

function orientationsFor(config, supplied = {}) {
  const values = supplied instanceof Map ? supplied : new Map(Object.entries(supplied ?? {}));
  return new Map(config.pieces.map(piece => [piece.id, normalizeOrientation(piece, values.get(piece.id) ?? piece.orientation)]));
}

/** Trace the visible beam. Cycles are bounded by a component-direction state. */
export function traceLaserGrid(config, suppliedOrientations = {}) {
  const board = validateLaserGridConfig(config);
  const orientations = orientationsFor(board, suppliedOrientations);
  const pieces = new Map(board.pieces.map(piece => [keyFor(piece.row, piece.col), piece]));
  const receivers = new Map(board.receivers.map(receiver => [keyFor(receiver.row, receiver.col), receiver]));
  const blockers = new Set((board.blockers ?? []).map(blocker => keyFor(blocker.row, blocker.col)));
  const litReceivers = new Set();
  const segments = [];
  const visited = new Set();
  const queue = [{ row: board.emitter.row, col: board.emitter.col, direction: board.emitter.direction }];
  const limit = board.rows * board.cols * 8;
  let traversed = 0;

  while (queue.length && traversed++ < limit) {
    const current = queue.shift();
    const direction = LASER_DIRECTIONS[modulo(current.direction, 8)];
    let row = current.row;
    let col = current.col;
    while (true) {
      const nextRow = row + direction.row;
      const nextCol = col + direction.col;
      if (nextRow < 0 || nextRow >= board.rows || nextCol < 0 || nextCol >= board.cols) break;
      segments.push(Object.freeze({ from: Object.freeze({ row, col }), to: Object.freeze({ row: nextRow, col: nextCol }) }));
      row = nextRow;
      col = nextCol;
      const coordinate = keyFor(row, col);
      if (blockers.has(coordinate)) break;
      const receiver = receivers.get(coordinate);
      if (receiver) { litReceivers.add(receiver.id); break; }
      const piece = pieces.get(coordinate);
      if (!piece) continue;
      const outgoing = routePiece(piece, current.direction, orientations.get(piece.id));
      if (outgoing === null) break;
      const state = `${piece.id}:${outgoing}`;
      if (visited.has(state)) break;
      visited.add(state);
      queue.push({ row, col, direction: outgoing });
      break;
    }
  }
  return Object.freeze({
    segments: Object.freeze(segments),
    litReceiverIds: Object.freeze([...litReceivers]),
    orientations: Object.freeze(Object.fromEntries(orientations)),
    solved: litReceivers.size === board.receivers.length
  });
}

export function rotateLaserPiece(config, orientations, pieceId, amount = 1) {
  const board = validateLaserGridConfig(config);
  const piece = board.pieces.find(entry => entry.id === pieceId);
  if (!piece) throw new Error("That Laser Grid relay no longer exists.");
  const next = { ...(orientations ?? {}) };
  next[piece.id] = normalizeOrientation(piece, Number(next[piece.id] ?? piece.orientation) + Number(amount || 0));
  return Object.freeze(next);
}
