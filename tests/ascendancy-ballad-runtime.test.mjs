import test from "node:test";
import assert from "node:assert/strict";
import { BALLAD_REGION_BINDINGS, BALLAD_TELEPORT_CONFIRMATION } from "../scripts/ascendancy-ballad-bindings.mjs";
import { applyBalladAscendancy, auditBalladAscendancy, BALLAD_INJECTION_MACRO_DEFINITIONS, createBalladRegionEventConfig, dispatchBalladRegionEvent, ensureBalladInjectionMacros, previewBalladAscendancy } from "../modules/regionwright/scripts/ascendancy-ballad-runtime.js";

function fixtureRuntime({ assistant = true } = {}) {
  const regions = new Map();
  for (const binding of BALLAD_REGION_BINDINGS) {
    const region = {
      id: binding.regionUuid.split(".").at(-1),
      uuid: binding.regionUuid,
      parent: { uuid: binding.sceneId },
      flags: { regionwright: { foreignState: { keep: true }, ascendancy: { foreignState: { keep: true } } } },
      behaviors: [{ id: `foreign-${binding.stableId}`, uuid: `RegionBehavior.foreign-${binding.stableId}`, flags: { foreign: { keep: true } }, _source: { id: `foreign-${binding.stableId}`, flags: { foreign: { keep: true } } } }],
      async update(data) {
        const value = data["flags.regionwright.ascendancy.balladBinding"];
        if (value) this.flags.regionwright.ascendancy.balladBinding = value;
      },
      async createEmbeddedDocuments(type, documents) {
        assert.equal(type, "RegionBehavior");
        const created = documents.map((document, index) => ({ ...document, id: `owned-${this.id}-${index}`, uuid: `${this.uuid}.RegionBehavior.owned-${index}` }));
        this.behaviors.push(...created);
        return created;
      },
      getEmbeddedCollection() { return { contents: this.behaviors }; },
    };
    regions.set(binding.regionUuid, region);
  }
  return {
    game: {
      world: { id: "the-ballad-of-chauser-bill" },
      version: "14.367",
      system: { id: "dnd5e", version: "5.3.3" },
      user: { id: "assistant", name: assistant ? "Assistant Gamemaster" : "Gamemaster", isGM: true },
      users: { activeGM: { id: "assistant" } },
    },
    async fromUuid(uuid) { return regions.get(uuid) ?? null; },
    regions,
  };
}

test("Ballad runtime preview verifies all 21 exact UUIDs and performs no writes", async () => {
  const runtime = fixtureRuntime();
  const receipt = await previewBalladAscendancy({ runtime, assistantGamemasterConfirmed: true });
  assert.equal(receipt.status, "BLOCKED");
  assert.equal(receipt.noWrite, true);
  assert.equal(receipt.mappingCoverage.verifiedBoundRegions, 21);
  assert.equal(receipt.blockedTeleports[0].teleportId, "dbx:teleport:tram-to-core");
  assert.equal(receipt.scenesCreated, 0);
  assert.equal(receipt.regionsCreated, 0);
  assert.equal(receipt.macrosCreated, 0);
  assert.equal(runtime.regions.get(BALLAD_REGION_BINDINGS[0].regionUuid).behaviors.length, 1);
});

test("Ballad runtime requires explicit Assistant Gamemaster confirmation and exact target", async () => {
  const runtime = fixtureRuntime({ assistant: false });
  const receipt = await previewBalladAscendancy({ runtime });
  assert.equal(receipt.status, "BLOCKED");
  assert.ok(receipt.blockers.some(blocker => blocker.includes("Assistant Gamemaster")));
});

test("Ballad runtime audit is authoritative and rejects a UUID drift", async () => {
  const runtime = fixtureRuntime();
  const pass = await auditBalladAscendancy({ runtime, assistantGamemasterConfirmed: true });
  assert.equal(pass.status, "PASS");
  assert.equal(pass.readback.length, 21);
  const drifted = runtime.regions.get(BALLAD_REGION_BINDINGS[2].regionUuid);
  drifted.uuid = `${drifted.uuid}.drift`;
  const blocked = await auditBalladAscendancy({ runtime, assistantGamemasterConfirmed: true });
  assert.equal(blocked.status, "BLOCKED");
});

test("Ballad apply is approval-gated and preserves foreign Region state", async () => {
  const runtime = fixtureRuntime();
  const blocked = await applyBalladAscendancy({ runtime, assistantGamemasterConfirmed: true, approved: false });
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.noWrite, true);
  const receipt = await applyBalladAscendancy({ runtime, assistantGamemasterConfirmed: true, approved: true });
  assert.equal(receipt.status, "PASS");
  assert.equal(receipt.writes.length, 19);
  assert.equal(receipt.ownedBehaviorCount, 19);
  assert.equal(receipt.behaviorReadback.length, 19);
  assert.ok(receipt.behaviorReadback.every(behavior => behavior.type === "executeScript" && behavior.events.includes("tokenEnter") && behavior.behaviorId && behavior.behaviorUuid));
  assert.ok(receipt.behaviorReadback.filter(behavior => behavior.handoffKey.includes("popup") || behavior.handoffKey.includes("region:")).every(behavior => behavior.source.includes("player-adapter-absent") && behavior.source.includes("behavior-dispatch-rejected")));
  assert.equal(receipt.blockedTeleports[0].issue, "unbound-core-entry-west");
  const first = runtime.regions.get(BALLAD_REGION_BINDINGS[0].regionUuid);
  assert.equal(first.flags.regionwright.foreignState.keep, true);
  assert.equal(first.behaviors[0].flags.foreign.keep, true);
  assert.ok(first.behaviors.some(behavior => behavior.flags?.regionwright?.ascendancy?.handoffKey));
});

test("Ballad teleport integration exposes exact prompt and never auto-moves", async () => {
  assert.equal(BALLAD_TELEPORT_CONFIRMATION, "Do you wish to proceed?");
});

test("Ballad injection macros are fixed GM-owned transports and never duplicate", async () => {
  const runtime = fixtureRuntime();
  const macros = [];
  runtime.game.macros = {
    contents: macros,
    documentClass: { create: async data => { const macro = { ...data, uuid: `Macro.${macros.length + 1}`, async update(next) { Object.assign(this, next); } }; macros.push(macro); return macro; } },
  };
  const first = await ensureBalladInjectionMacros({ runtime, assistantGamemasterConfirmed: true });
  assert.equal(first.status, "PASS");
  assert.equal(first.writes.filter(write => write.action === "created").length, 3);
  assert.equal(first.macrosCreated, 3);
  assert.equal(first.macrosUpdated, 0);
  assert.equal(first.readback.length, 3);
  assert.equal(first.playerFacingMacroCount, 0);
  assert.ok(macros.every(macro => macro.ownership.default === 0 && macro.ownership.assistant === 3));
  assert.ok(macros.every(macro => !macro.command.includes("eval") && !macro.command.includes("new Function") && !macro.command.includes("choice: false")));
  assert.deepEqual(macros.map(macro => macro.flags.regionwright.balladInjection.macroId), BALLAD_INJECTION_MACRO_DEFINITIONS.map(definition => definition.macroId));
  const second = await ensureBalladInjectionMacros({ runtime, assistantGamemasterConfirmed: true });
  assert.equal(second.status, "PASS");
  assert.equal(macros.length, 3);
  assert.equal(second.macrosCreated, 0);
  assert.equal(second.macrosUpdated, 3);
  assert.equal(second.writes.filter(write => write.action === "created").length, 0);
  const conflictRuntime = fixtureRuntime();
  conflictRuntime.game.macros = { contents: [{ name: BALLAD_INJECTION_MACRO_DEFINITIONS[0].name }], documentClass: { create: async () => { throw new Error("must not create"); } } };
  const conflict = await ensureBalladInjectionMacros({ runtime: conflictRuntime, assistantGamemasterConfirmed: true });
  assert.equal(conflict.status, "BLOCKED");
  assert.equal(conflictRuntime.game.macros.contents.length, 1);
});

test("Ballad Region behaviors dispatch canonical popup, cooperative, final, and core events", async () => {
  const runtime = fixtureRuntime();
  const cases = [
    ["dbx:region:signal-aleister-frequency", "personal", "dbx:puzzle:aleister-frequency"],
    ["dbx:region:signal-cooperative-left", "cooperative", "dbx:cooperative:signal-left"],
    ["dbx:region:core-aleister-station", "final", "dbx:actor:aleister"],
    ["dbx:region:core-security-room", "core", "dbx:stage:six-person-simultaneous-activation"],
  ];
  for (const [stableRegionId, stage, semanticId] of cases) {
    const region = runtime.regions.get(BALLAD_REGION_BINDINGS.find(binding => binding.stableId === stableRegionId).regionUuid);
    region.flags.regionwright.ascendancy.stableRegionId = stableRegionId;
    assert.equal(createBalladRegionEventConfig(region).stage, stage);
    let received = null;
    const result = await dispatchBalladRegionEvent({ region, event: { type: "tokenEnter", activationRound: "round-1" }, engine: { handleRegionEvent: async (configuredRegion, event) => { received = { config: configuredRegion.getFlag("regionwright", "ascendancy").region, event }; return { status: "dispatched" }; } } });
    assert.equal(result.status, "dispatched");
    assert.equal(received.config.stage, stage);
    assert.equal(received.config[stage === "personal" ? "puzzleId" : stage === "cooperative" ? "cooperativeId" : stage === "final" ? "characterId" : "finalStageId"], semanticId);
    assert.equal(received.event.activationRound, "round-1");
  }
});

test("Ballad dispatch resolves the stable Region ID from the installed balladBinding marker", async () => {
  const runtime = fixtureRuntime();
  const region = runtime.regions.get(BALLAD_REGION_BINDINGS.find(binding => binding.stableId === "dbx:region:rune-lawson-memory").regionUuid);
  region.flags.regionwright.ascendancy.balladBinding = { stableRegionId: "dbx:region:rune-lawson-memory" };
  assert.equal(createBalladRegionEventConfig(region).puzzleId, "dbx:puzzle:lawson-rune-memory");
  const result = await dispatchBalladRegionEvent({ region, event: { type: "tokenEnter" }, engine: { handleRegionEvent: async () => ({ status: "dispatched" }) } });
  assert.equal(result.status, "dispatched");
});
