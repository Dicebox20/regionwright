import assert from "node:assert/strict";
import test from "node:test";
import { SPINE_MOSAIC_VERSION, createSpineMosaicConfig, evaluateSpineOrder, shuffledSpineOrder, validateSpineMosaicConfig } from "../modules/regionwright-puzzles-locks/scripts/spine-mosaic-engine.js";

test("Spine Mosaic keeps the GM's book titles in their intended picture order", () => {
  const config = createSpineMosaicConfig({ books: ["Moon", "Crown", "Rose", "Key"], seed: "library" });
  assert.equal(config.version, SPINE_MOSAIC_VERSION);
  assert.deepEqual(config.books.map(book => book.title), ["Moon", "Crown", "Rose", "Key"]);
  assert.deepEqual(config.solution, ["book-1", "book-2", "book-3", "book-4"]);
  assert.doesNotThrow(() => validateSpineMosaicConfig(config));
});

test("Spine Mosaic shuffles a playable shelf and accepts only the completed mural", () => {
  const config = createSpineMosaicConfig({ books: ["A", "B", "C", "D"], seed: "fixed" });
  const shuffled = shuffledSpineOrder(config, "player-one");
  assert.notDeepEqual(shuffled, config.solution);
  assert.equal(evaluateSpineOrder(config, shuffled).success, false);
  assert.equal(evaluateSpineOrder(config, config.solution).success, true);
});

test("Spine Mosaic rejects incomplete and duplicate bookshelf orders", () => {
  const config = createSpineMosaicConfig({ books: ["A", "B", "C", "D"] });
  assert.equal(evaluateSpineOrder(config, ["book-1", "book-2"]).valid, false);
  assert.equal(evaluateSpineOrder(config, ["book-1", "book-1", "book-3", "book-4"]).valid, false);
  assert.throws(() => validateSpineMosaicConfig({ version: SPINE_MOSAIC_VERSION, books: config.books.slice(0, 3), solution: ["book-1", "book-2", "book-3"] }), /four to nine/i);
});
