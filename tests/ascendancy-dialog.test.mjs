import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PERSONAL_PUZZLES } from "../modules/regionwright/scripts/ascendancy-engine.js";
import { openAscendancyPuzzle } from "../modules/regionwright/scripts/ascendancy.js";

test("Ascendancy puzzle dialogs use Foundry v14 DialogV2 force rendering", async () => {
  const source = await readFile(new URL("../modules/regionwright/scripts/ascendancy.js", import.meta.url), "utf8");
  assert.match(source, /await dialog\.render\(\{ force: true \}\)/);
  assert.doesNotMatch(source, /dialog\.render\(true\)/);
});

test("Ascendancy dialog keeps puzzle state out of ApplicationV2's read-only state getter", async () => {
  const source = await readFile(new URL("../modules/regionwright/scripts/ascendancy.js", import.meta.url), "utf8");
  assert.match(source, /this\.ascendancyState = state/);
  assert.match(source, /this\.ascendancyState = result\.state/);
  assert.match(source, /renderBody\(this\.puzzleId, this\.ascendancyState, this\.ascendancyOptions\)/);
  assert.doesNotMatch(source, /this\.state\s*=/);
  assert.doesNotMatch(source, /this\.options\s*=/);
});

test("Ballad behavior scripts expose bounded relay diagnostics", async () => {
  const source = await readFile(new URL("../modules/regionwright/scripts/ascendancy-ballad-runtime.js", import.meta.url), "utf8");
  assert.match(source, /phase: "player-adapter-absent"/);
  assert.match(source, /phase: "behavior-dispatch-rejected"/);
  assert.match(source, /await adapter\.handleRegionEvent\(region, event\)/);
  assert.doesNotMatch(source, /choice:\s*false/);
});

test("Ascendancy puzzle controls cannot submit and close the DialogV2 form", async () => {
  const source = await readFile(new URL("../modules/regionwright/scripts/ascendancy.js", import.meta.url), "utf8");
  const controls = [...source.matchAll(/<button[^>]*data-ascendancy-action[^>]*>/g)].map(match => match[0]);
  assert.ok(controls.length >= 6);
  assert.ok(controls.every(control => /\btype="button"/.test(control)));
  assert.match(source, /event\.preventDefault\(\); event\.stopPropagation\(\); void this\.act/);
});

test("Ascendancy puzzle opens against an ApplicationV2-style read-only state getter", async () => {
  const previous = { game: globalThis.game, canvas: globalThis.canvas, foundry: globalThis.foundry };
  class FakeDialogV2 {
    constructor() { this.element = null; }
    get state() { return Object.freeze({ framework: true }); }
    get options() { return Object.freeze({ framework: true }); }
    async render(options) { this.renderOptions = options; return this; }
    async close() { return this; }
  }
  const scene = { uuid: "Scene.dialog-test", getFlag: () => null };
  globalThis.game = { user: { id: "gm", isGM: true }, users: { activeGM: { id: "gm" } } };
  globalThis.canvas = { scene };
  globalThis.foundry = { applications: { api: { DialogV2: FakeDialogV2 } } };
  try {
    const dialog = await openAscendancyPuzzle(PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY);
    assert.deepEqual(dialog.renderOptions, { force: true });
    assert.ok(dialog.ascendancyState?.puzzles?.[PERSONAL_PUZZLES.LAWSON_RUNE_MEMORY]);
    assert.deepEqual(dialog.options, { framework: true });
    assert.deepEqual(dialog.ascendancyOptions, {});
    await dialog.close();
  } finally {
    globalThis.game = previous.game;
    globalThis.canvas = previous.canvas;
    globalThis.foundry = previous.foundry;
  }
});
