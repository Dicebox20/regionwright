import assert from "node:assert/strict";
import test from "node:test";
import { TIMING_DIAL_VERSION, circularDistance, createTimingDialConfig, isTimingHit, timingDifficulty, timingPresentation, validateTimingDialConfig } from "../modules/regionwright-puzzles-locks/scripts/timing-dial-engine.js";

test("Timing Dial creates deterministic multi-stop sequences with per-stop difficulty", () => {
  const first = createTimingDialConfig({ difficulties: [0, 2, 3], seed: "clockwork" });
  const second = createTimingDialConfig({ difficulties: [0, 2, 3], seed: "clockwork" });
  assert.deepEqual(first, second);
  assert.equal(first.version, TIMING_DIAL_VERSION);
  assert.deepEqual(first.steps.map(step => step.difficulty), [0, 2, 3]);
  assert.doesNotThrow(() => validateTimingDialConfig(first));
});

test("Timing Dial makes higher difficulty windows smaller and the hand faster", () => {
  const easy = timingDifficulty(0);
  const expert = timingDifficulty(3);
  assert.ok(easy.window > expert.window);
  assert.ok(easy.speed < expert.speed);
  assert.equal(timingPresentation({ difficulty: 2, targetAngle: 405 }).targetAngle, 45);
});

test("Timing Dial recognises a hit across the zero-degree boundary", () => {
  const step = { difficulty: 2, targetAngle: 2 };
  assert.ok(circularDistance(358, 2) < 10);
  assert.equal(isTimingHit(step, 358), true);
  assert.equal(isTimingHit(step, 30), false);
});

test("Timing Dial rejects empty, oversized, and malformed sequences", () => {
  const empty = { version: TIMING_DIAL_VERSION, steps: [] };
  const oversized = { version: TIMING_DIAL_VERSION, steps: Array.from({ length: 9 }, (_, index) => ({ id: `stop-${index}`, difficulty: 1, targetAngle: 40 })) };
  const duplicate = { version: TIMING_DIAL_VERSION, steps: [{ id: "same", difficulty: 1, targetAngle: 40 }, { id: "same", difficulty: 1, targetAngle: 80 }] };
  assert.throws(() => validateTimingDialConfig(empty), /one and eight/i);
  assert.throws(() => validateTimingDialConfig(oversized), /one and eight/i);
  assert.throws(() => validateTimingDialConfig(duplicate), /unique/i);
});
