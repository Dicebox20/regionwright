import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { migrateLegacyFlags } from "../modules/regionwright-hunting-gathering/migration.js";

function applyUpdate(document, data) {
  for (const [path, value] of Object.entries(data)) {
    const keys = path.split(".");
    let target = document;
    for (const key of keys.slice(0, -1)) target = target[key] ??= {};
    const last = keys.at(-1);
    if (value === null) delete target[last];
    else target[last] = value;
  }
}

function document(source) {
  return {
    ...source,
    async update(data) { applyUpdate(this, data); }
  };
}

test("H&G migrates legacy flags and rewrites saved asset and macro paths", async () => {
  const scene = document({
    uuid: "Scene.test",
    flags: { "regionwright-fishing": { splashImage: "modules/regionwright-fishing/assets/fishing/splash.webp" } },
    regions: [document({ uuid: "Scene.test.Region.spot", flags: { "regionwright-fishing": { fishingSpot: { pondTier: "rare" } } } })]
  });
  const actor = document({ uuid: "Actor.test", img: "modules/regionwright-fishing/assets/fishing/fisher.webp", items: [] });
  const macro = document({ uuid: "Macro.test", command: 'import("modules/regionwright/scripts/fishing-engine.js");' });

  const result = await migrateLegacyFlags({ user: { isGM: true }, scenes: [scene], actors: [actor], items: [], macros: [macro] });

  assert.deepEqual(result.failed, []);
  assert.equal(result.moved, 1);
  assert.equal(result.assetPaths, 3);
  assert.equal(scene.flags["regionwright-fishing"].splashImage, "modules/regionwright-hunting-gathering/assets/fishing/splash.webp");
  assert.equal(scene.regions[0].flags["regionwright-hunting-gathering"].fishingSpot.pondTier, "rare");
  assert.equal(actor.img, "modules/regionwright-hunting-gathering/assets/fishing/fisher.webp");
  assert.equal(macro.command, 'import("modules/regionwright-hunting-gathering/scripts/fishing-engine.js");');
});

test("H&G migration skips non-GMs and records document failures for the next startup", async () => {
  const skipped = await migrateLegacyFlags({ user: { isGM: false }, scenes: [] });
  assert.equal(skipped.skipped, true);

  const broken = { uuid: "Scene.broken", flags: { "regionwright-fishing": { fishingSpot: { pondTier: "common" } } }, async update() { throw new Error("write failed"); } };
  const previousError = console.error;
  console.error = () => undefined;
  let result;
  try {
    result = await migrateLegacyFlags({ user: { isGM: true }, scenes: [{ regions: [broken] }], actors: [], items: [], macros: [] });
  } finally { console.error = previousError; }
  assert.deepEqual(result.failed, ["Scene.broken"]);
});

test("installed Puzzles & Locks macro resolves its HUD from its own module", async () => {
  const source = await readFile(new URL("../modules/regionwright-puzzles-locks/macros/regionwright-puzzle-hud.js", import.meta.url), "utf8");
  assert.match(source, /game\.modules\.get\("regionwright-puzzles-locks"\)/);
  assert.match(source, /modules\/regionwright-puzzles-locks\/scripts\/puzzle-hud\.js/);
  assert.doesNotMatch(source, /modules\/regionwright\/premium/);
});
