import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  DIFFICULTY_PROFILES, LOCK_PHASES, advanceLock, clampPickAngle, createRuntimeState,
  effectiveTier, maximumCylinderProgress, proximityForAngle, replaceBrokenPick,
  seededTarget, setPickAngle, setTorque
} from "../modules/regionwright-puzzles-locks/scripts/rotating-lock-engine.js";
import { loadRotationLockPointBoardData, normalizeRotationLockPointBoardData, RotationLockPointBoardRenderer } from "../modules/regionwright-puzzles-locks/scripts/rotation-lock-point-art.js";

function advance(state, seconds, increment = 0.05) {
  for (let elapsed = 0; elapsed < seconds; elapsed += increment) advanceLock(state, increment);
  return state;
}

test("Rotation Lock difficulty profiles preserve proficiency reductions", () => {
  assert.equal(DIFFICULTY_PROFILES.length, 6);
  assert.equal(effectiveTier(4, 0), 4);
  assert.equal(effectiveTier(4, 1), 3);
  assert.equal(effectiveTier(4, 2), 2);
  assert.equal(effectiveTier(0, 2), 0);
});

test("Rotation Lock generates deterministic in-range targets", () => {
  const target = seededTarget("stable-door", 5);
  assert.equal(seededTarget("stable-door", 5), target);
  assert.ok(target >= -87.5 && target <= 87.5);
  assert.notEqual(seededTarget("another-door", 5), target);
});

test("Rotation Lock supplies full, partial, and minimum cylinder movement", () => {
  const profile = DIFFICULTY_PROFILES[2];
  assert.equal(proximityForAngle(10, 10, profile), 1);
  assert.equal(maximumCylinderProgress(10, 10, profile), 1);
  assert.ok(maximumCylinderProgress(25, 10, profile) > 0.025);
  assert.equal(maximumCylinderProgress(90, -90, profile), 0.025);
  assert.equal(clampPickAngle(999), 90);
  assert.equal(clampPickAngle(-999), -90);
});

test("Rotation Lock opens only after torque is held in the sweet spot", () => {
  const state = createRuntimeState({ effectiveLockTier: 2, targetAngle: 12 });
  setPickAngle(state, 12);
  setTorque(state, 1);
  advance(state, 1);
  assert.equal(state.phase, LOCK_PHASES.OPENED);
  assert.equal(state.cylinderProgress, 1);
  assert.equal(state.lastEvent, "opened");
});

test("Rotation Lock returns on release and damages only a blocked pick", () => {
  const state = createRuntimeState({ effectiveLockTier: 5, targetAngle: 0 });
  setPickAngle(state, 90);
  setTorque(state, 1);
  advance(state, 0.4);
  const damaged = state.pickDurability;
  assert.ok(damaged < 1);
  setTorque(state, 0);
  advance(state, 0.5);
  assert.equal(state.pickDurability, damaged);
  assert.equal(state.cylinderProgress, 0);
});

test("Rotation Lock breaks exactly once and retains its target for a replacement pick", () => {
  const state = createRuntimeState({ effectiveLockTier: 5, targetAngle: -33, durability: 0.01 });
  setPickAngle(state, 90);
  setTorque(state, 1);
  advance(state, 1);
  assert.equal(state.phase, LOCK_PHASES.PICK_BROKEN);
  assert.equal(state.lastEvent, "pickBroken");
  const count = state.brokenPickCount;
  advance(state, 1);
  assert.equal(state.brokenPickCount, count);
  replaceBrokenPick(state);
  assert.equal(state.targetAngle, -33);
  assert.equal(state.pickDurability, 1);
});

test("Rotation Lock uses mouse pick placement and the A key instead of a slider", () => {
  const source = fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/scripts/rotating-lock.js", import.meta.url), "utf8");
  const styles = fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/styles/rotating-lock.css", import.meta.url), "utf8");
  assert.match(source, /rw-skyrim-lock/);
  assert.match(source, /data-rw-rotation-point-board/);
  assert.match(source, /new RotationLockPointBoardRenderer/);
  assert.match(source, /await loadRotationLockPointBoardData\(\)/);
  assert.match(source, /<kbd>A<\/kbd>: turn/);
  assert.match(source, /event\.key === "a" \|\| event\.key === "A"/);
  assert.match(source, /pointermove/);
  assert.match(source, /if \(!activeGM\(\)\) return requestRemoteGM\(action, payload\)/);
  assert.match(source, /active GM/);
  assert.doesNotMatch(source, /Apply Torque/);
  assert.doesNotMatch(source, /rw-rotation-angle/);
  assert.doesNotMatch(source, /rw-rotation-keyhint/);
  assert.match(styles, /\.rw-skyrim-lock/);
  assert.doesNotMatch(styles, /rw-lock-plate|rw-rotation-housing|rw-rotation-cylinder|rw-rotation-pick/);
});

test("Rotation Lock uses the shared 240 by 160 editable point-board format", () => {
  const sourceData = JSON.parse(fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/assets/rotation-lock-point-board.json", import.meta.url), "utf8"));
  const board = normalizeRotationLockPointBoardData(sourceData);
  assert.equal(board.width, 240);
  assert.equal(board.height, 160);
  assert.deepEqual(board.layers.map(layer => layer.id), ["static", "cylinder", "wrench", "pick"]);
  for (const layer of board.layers) {
    const marks = layer.frames[0];
    assert.ok(marks.length > 0);
    for (const mark of marks) {
      assert.equal(mark.length, 3);
      assert.ok(Number.isInteger(mark[0]) && Number.isInteger(mark[1]));
      assert.ok(Number.isInteger(mark[2]) && mark[2] >= 0 && mark[2] < board.palette.length);
    }
  }
  assert.ok(board.layers.find(layer => layer.id === "static").frames[0].some(([x, y]) => x === 30 && y === 33));
});

test("Rotation Lock loads its module-local point-board once and validates the v1 layers", async () => {
  const sourceData = JSON.parse(fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/assets/rotation-lock-point-board.json", import.meta.url), "utf8"));
  let requests = 0;
  const fetchFn = async (url, options) => {
    requests += 1;
    assert.match(String(url), /\/assets\/rotation-lock-point-board\.json$/);
    assert.equal(options.credentials, "same-origin");
    return { ok: true, json: async () => sourceData };
  };
  const first = await loadRotationLockPointBoardData({ fetchFn });
  const second = await loadRotationLockPointBoardData({ fetchFn });
  assert.strictEqual(first, second);
  assert.equal(requests, 1);
  assert.deepEqual(first.layers.map(layer => layer.id), ["static", "cylinder", "wrench", "pick"]);
});

test("Rotation Lock renderer caps DPR, follows mechanical angles, and releases both canvases", () => {
  const calls = { fillRect: [], drawImage: 0, rotation: [] };
  const context = {
    clearRect() {},
    drawImage() { calls.drawImage += 1; },
    fillRect(x, y, width, height) { calls.fillRect.push({ x, y, width, height, color: this.fillStyle }); },
    setTransform() {},
    save() {},
    restore() {},
    translate() {},
    rotate(angle) { calls.rotation.push(angle); }
  };
  const makeCanvas = (width = 0, height = 0) => ({
    width, height, clientWidth: width, clientHeight: height,
    getBoundingClientRect: () => ({ width: 480, height: 320 }),
    getContext: () => context
  });
  const canvas = makeCanvas();
  const documentClass = { createElement: () => makeCanvas() };
  const board = normalizeRotationLockPointBoardData(JSON.parse(fs.readFileSync(new URL("../modules/regionwright-puzzles-locks/assets/rotation-lock-point-board.json", import.meta.url), "utf8")));
  const renderer = new RotationLockPointBoardRenderer(canvas, board, { documentClass });
  assert.equal(renderer.render({ cylinderProgress: 0.5, pickAngle: 24 }, { devicePixelRatio: 4 }), true);
  assert.equal(canvas.width, 960);
  assert.equal(canvas.height, 640);
  assert.equal(calls.drawImage, 4);
  assert.ok(calls.rotation.some(angle => Math.abs(angle - (-44 * Math.PI / 180)) < 1e-8));
  assert.ok(calls.rotation.some(angle => Math.abs(angle - (24 * Math.PI / 180)) < 1e-8));
  assert.ok(calls.fillRect.length > 1000);
  const layerCanvases = [...renderer.layerCanvases.values()];
  renderer.dispose();
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
  for (const layerCanvas of layerCanvases) {
    assert.equal(layerCanvas.width, 0);
    assert.equal(layerCanvas.height, 0);
  }
});
