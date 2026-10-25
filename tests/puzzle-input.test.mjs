import assert from "node:assert/strict";
import test from "node:test";
import { isPuzzleMovementKey, suppressPuzzleMovementEvent } from "../modules/regionwright-puzzles-locks/scripts/puzzle-input.js";

function keyEvent({ type = "keydown", code, key }) {
  return {
    type, code, key,
    defaultPrevented: false,
    stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopImmediatePropagation() { this.stopped = true; }
  };
}

test("puzzle movement guard recognizes only WASD movement input", () => {
  assert.equal(isPuzzleMovementKey(keyEvent({ code: "KeyW", key: "w" })), true);
  assert.equal(isPuzzleMovementKey(keyEvent({ code: "KeyA", key: "A" })), true);
  assert.equal(isPuzzleMovementKey(keyEvent({ code: "ArrowUp", key: "ArrowUp" })), false);
  assert.equal(isPuzzleMovementKey(keyEvent({ code: "KeyQ", key: "q" })), false);
});

test("puzzle movement guard blocks WASD and gives the puzzle first access to its control key", () => {
  let down = 0;
  let up = 0;
  const handlers = { onKeyDown: () => { down += 1; }, onKeyUp: () => { up += 1; } };
  const keydown = keyEvent({ type: "keydown", code: "KeyA", key: "a" });
  const keyup = keyEvent({ type: "keyup", code: "KeyA", key: "a" });
  const unrelated = keyEvent({ type: "keydown", code: "KeyQ", key: "q" });

  assert.equal(suppressPuzzleMovementEvent(keydown, handlers), true);
  assert.equal(suppressPuzzleMovementEvent(keyup, handlers), true);
  assert.equal(suppressPuzzleMovementEvent(unrelated, handlers), false);
  assert.equal(down, 1);
  assert.equal(up, 1);
  assert.equal(keydown.defaultPrevented, true);
  assert.equal(keydown.stopped, true);
  assert.equal(keyup.defaultPrevented, true);
  assert.equal(keyup.stopped, true);
  assert.equal(unrelated.defaultPrevented, false);
});
