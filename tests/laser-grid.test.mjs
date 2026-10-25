import assert from "node:assert/strict";
import test from "node:test";
import { LASER_GRID_VERSION, createLaserGridConfig, rotateLaserPiece, traceLaserGrid, validateLaserGridConfig } from "../modules/regionwright-puzzles-locks/scripts/laser-grid-engine.js";

function solve(config) {
  const pieces = config.pieces;
  let found = null;
  const search = (index, orientations = {}) => {
    if (found) return;
    if (index === pieces.length) {
      if (traceLaserGrid(config, orientations).solved) found = { ...orientations };
      return;
    }
    const piece = pieces[index];
    const count = piece.kind === "diode" ? 8 : 4;
    for (let orientation = 0; orientation < count; orientation += 1) search(index + 1, { ...orientations, [piece.id]: orientation });
  };
  search(0);
  return found;
}

test("Laser Grid creates deterministic authored boards with bounded components", () => {
  const first = createLaserGridConfig({ tier: 2, seed: "archive" });
  const second = createLaserGridConfig({ tier: 2, seed: "archive" });
  assert.deepEqual(first, second);
  assert.equal(first.version, LASER_GRID_VERSION);
  assert.equal(first.pieces.filter(piece => piece.kind === "diode").length, 2);
  assert.doesNotThrow(() => validateLaserGridConfig(first));
});

test("Laser Grid traces cardinal and diagonal routes through four-way mirrors and eight-way diodes", () => {
  for (const tier of [0, 1, 2]) {
    const config = createLaserGridConfig({ tier, seed: "test-board" });
    const solution = solve(config);
    assert.ok(solution, `tier ${tier} needs a valid route`);
    assert.equal(traceLaserGrid(config).solved, false);
    const trace = traceLaserGrid(config, solution);
    assert.equal(trace.solved, true);
    assert.equal(trace.litReceiverIds.length, config.receivers.length);
    if (tier >= 1) assert.ok(trace.segments.some(segment => Math.abs(segment.to.row - segment.from.row) === 1 && Math.abs(segment.to.col - segment.from.col) === 1), `tier ${tier} should use diagonal beam movement`);
  }
});

test("Laser Grid rotation wraps mirrors at four positions and diodes at eight", () => {
  const config = createLaserGridConfig({ tier: 2, seed: "rotation" });
  const mirror = config.pieces.find(piece => piece.kind === "mirror");
  const diode = config.pieces.find(piece => piece.kind === "diode");
  const mirrors = rotateLaserPiece(config, {}, mirror.id, -1);
  const diodes = rotateLaserPiece(config, {}, diode.id, -1);
  assert.equal(mirrors[mirror.id], (mirror.orientation + 3) % 4);
  assert.equal(diodes[diode.id], (diode.orientation + 7) % 8);
});

test("Laser Grid rejects overlapping or malformed board data", () => {
  const malformed = structuredClone(createLaserGridConfig({ tier: 0, seed: "invalid" }));
  malformed.pieces[0].row = malformed.emitter.row;
  malformed.pieces[0].col = malformed.emitter.col;
  assert.throws(() => validateLaserGridConfig(malformed), /cannot overlap/);
});
