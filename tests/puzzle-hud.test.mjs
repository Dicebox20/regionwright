import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { availablePuzzleHUDEntries, deployPuzzleHUD, puzzleHUDCatalog } from "../modules/regionwright-puzzles-locks/scripts/puzzle-hud.js";

test("Puzzle HUD lists the complete standalone Regionwright catalog", () => {
  const scene = {
    uuid: "Scene.hud",
    getFlag: () => null,
    walls: { contents: [{ uuid: "Scene.hud.Wall.lock", id: "lock", name: "Vault Door", getFlag: (moduleId, flag) => moduleId === "regionwright" && flag === "lockpicking" ? { version: 3 } : null }] },
    tiles: { contents: [{ uuid: "Scene.hud.Tile.mix", id: "mix", name: "Cauldron", getFlag: (moduleId, flag) => moduleId === "regionwright" && flag === "ingredientMixing" ? { persistent: { status: "locked" } } : null }] },
    regions: { contents: [] },
  };
  const entries = availablePuzzleHUDEntries(scene);
  assert.ok(entries.some(entry => entry.id === "dbx:puzzle:aleister-frequency"));
  const standaloneIds = ["lockpicking", "rotation-lock", "laser-grid", "timing-dial", "ingredient-mixing", "spine-mosaic", "sliding-mosaic"].map(id => `regionwright:standalone:${id}`);
  assert.deepEqual(entries.filter(entry => entry.standalone).map(entry => entry.id), standaloneIds);
  assert.ok(entries.filter(entry => entry.standalone).every(entry => entry.target === null && entry.executable === true));
  const catalog = puzzleHUDCatalog(scene);
  assert.deepEqual(catalog.filter(entry => entry.standalone).map(entry => entry.id), standaloneIds);
});

test("Puzzle HUD deployment is GM-gated and sends only fixed recipient actions", async () => {
  const previous = { game: globalThis.game, canvas: globalThis.canvas, foundry: globalThis.foundry };
  const emitted = [];
  class FakeDialogV2 { constructor() {} get state() { return {}; } get options() { return {}; } async render() { return this; } async close() {} }
  const scene = { uuid: "Scene.hud", getFlag: () => null, walls: { contents: [] }, tiles: { contents: [] }, regions: { contents: [] } };
  globalThis.game = { user: { id: "gm", isGM: true }, users: { contents: [{ id: "gm", name: "GM", isGM: true, active: true }, { id: "p1", name: "Player One", isGM: false, active: true }, { id: "offline", name: "Offline", isGM: false, active: false }], activeGM: { id: "gm" } }, socket: { emit: (...args) => emitted.push(args) } };
  globalThis.canvas = { scene };
  globalThis.foundry = { applications: { api: { DialogV2: FakeDialogV2 } } };
  try {
    const receipt = await deployPuzzleHUD("regionwright:standalone:lockpicking", null, { scope: "all" });
    assert.equal(receipt.status, "DEPLOYED");
    assert.deepEqual(receipt.recipients.map(user => user.id), ["gm", "p1"]);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0][1].action, "puzzle-hud-open");
    assert.equal(emitted[0][1].recipientId, "p1");
    assert.equal(emitted[0][1].puzzleId, "regionwright:standalone:lockpicking");
    assert.equal(typeof emitted[0][1].seed, "string");
    await assert.rejects(() => deployPuzzleHUD("regionwright:standalone:lockpicking", null, { scope: "player", playerId: "offline" }), /active player/);
  } finally {
    globalThis.game = previous.game;
    globalThis.canvas = previous.canvas;
    globalThis.foundry = previous.foundry;
  }
});

test("Puzzle HUD macro is a fixed GM-only API binding", async () => {
  const source = await readFile(new URL("../modules/regionwright-puzzles-locks/macros/regionwright-puzzle-hud.js", import.meta.url), "utf8");
  assert.match(source, /regionwright-puzzles-locks"\)\?\.api\?\.puzzleHUD/);
  assert.match(source, /modules\/regionwright-puzzles-locks\/scripts\/puzzle-hud\.js\?rw-0\.1\.5-20260822-minigames-3/);
  assert.match(await readFile(new URL("../modules/regionwright-puzzles-locks/scripts/standalone-puzzles.js", import.meta.url), "utf8"), /Mirror Redirect/);
  assert.match(source, /catalog/);
  assert.match(source, /game\.user\?\.isGM/);
  assert.doesNotMatch(source, /eval|new Function|createEmbeddedDocuments|\.socket\.emit/);
});

test("standalone HUD entries dispatch to the production visual Studio dialogs", async () => {
  const source = await readFile(new URL("../modules/regionwright-puzzles-locks/scripts/standalone-puzzles.js", import.meta.url), "utf8");
  for (const opener of [
    "openStandaloneLockpickPuzzle",
    "openStandaloneRotatingLockPuzzle",
    "openStandaloneLaserGridPuzzle",
    "openStandaloneTimingDialPuzzle",
    "openStandaloneIngredientMixingPuzzle",
    "openStandaloneSpineMosaicPuzzle",
    "openStandaloneSlidingMosaicPuzzle"
  ]) assert.match(source, new RegExp(`import \\{ ${opener} \\}`));
  assert.match(source, /visual: true/);
  assert.doesNotMatch(source, /StandalonePuzzleDialog|data-rw-pin|type=\\"range\\"/);
});

test("all-player HUD injection is fixed, GM-owned, duplicate-safe, and opens the HUD", async () => {
  const source = await readFile(new URL("../modules/regionwright-puzzles-locks/macros/inject-regionwright-puzzle-hud-all.js", import.meta.url), "utf8");
  assert.match(source, /the-lost-mine-of-phandalin/);
  assert.match(source, /Into the Feywild/);
  assert.match(source, /regionwright-puzzle-hud-v1/);
  assert.match(source, /defaultScope: \"all-active-players-plus-gm\"/);
  assert.match(source, /ownership: \{ default: 0, \[game\.user\.id\]: 3 \}/);
  assert.match(source, /duplicate owned Puzzle HUD macros/);
  assert.match(source, /foreign Macro already uses/);
  assert.match(source, /puzzleHUD\?\.open/);
  assert.match(source, /playerFacing: false/);
  assert.doesNotMatch(source, /eval|new Function|createEmbeddedDocuments|socket\.emit/);
});

test("party magic item injection is fixed, compendium-sourced, Player-owned, and duplicate-safe", async () => {
  const source = await readFile(new URL("../modules/regionwright/macros/inject-party-magic-item.js", import.meta.url), "utf8");
  assert.match(source, /the-lost-mine-of-phandalin/);
  assert.match(source, /Rod of Security/);
  assert.match(source, /pack\.documentName !== \"Item\"/);
  assert.match(source, /data\.ownership = .*default: 1/);
  assert.match(source, /\[game\.user\.id\]: 3/);
  assert.match(source, /authoritative Item ownership readback/);
  assert.match(source, /duplicate Regionwright party items/);
  assert.doesNotMatch(source, /eval|new Function|createEmbeddedDocuments|socket\.emit/);
});

test("Ingredient Mixing exposes visible current/target gauges in the module UI", async () => {
  const hud = await readFile(new URL("../modules/regionwright-puzzles-locks/scripts/puzzle-hud.js", import.meta.url), "utf8");
  const script = await readFile(new URL("../modules/regionwright-puzzles-locks/scripts/ingredient-mixing.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-puzzles-locks/styles/ingredient-mixing.css", import.meta.url), "utf8");
  assert.match(script, /Current amount/);
  assert.match(script, /ingredient\.target/);
  assert.match(css, /rw-mix-target-label/);
  assert.match(css, /min-height: 182px/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /white-space: normal/);
  assert.match(css, /height: 28px/);
  assert.match(css, /width: 6px/);
  assert.doesNotMatch(hud, /scaleIngredientMixing|puzzle-hud-scale|applyPuzzleUIScale/);
});
