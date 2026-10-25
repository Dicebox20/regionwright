import test from "node:test";
import assert from "node:assert/strict";
import {
  BALLAD_BINDINGS_SOURCE,
  BALLAD_REGION_BINDINGS,
  BALLAD_TELEPORT_CONFIRMATION,
  BALLAD_UNBOUND_REGION_ID,
  createBalladAscendancyBindingPlan,
  createBalladTeleportPlan,
  executeBalladTeleportAfterConfirmation,
  isBalladPuzzleControllerAuthorized,
  validateBalladBindingReadback,
  validateBalladTargetGate,
} from "../scripts/ascendancy-ballad-bindings.mjs";

const target = { worldId: "the-ballad-of-chauser-bill", foundryVersion: "14.367", systemId: "dnd5e", systemVersion: "5.3.3", activeGm: true };

test("Ballad adapter consumes the exact manual mapping source and has 21 bound Regions", () => {
  assert.equal(BALLAD_BINDINGS_SOURCE.sourceId, "SRC-M157-BALLAD-ASCENDANCY-REGION-BINDINGS");
  assert.equal(BALLAD_REGION_BINDINGS.length, 21);
  assert.equal(new Set(BALLAD_REGION_BINDINGS.map(entry => entry.stableId)).size, 21);
  assert.ok(BALLAD_REGION_BINDINGS.every(entry => entry.regionUuid.startsWith(`${entry.sceneId}.Region.`)));
});

test("target gate requires the official Ballad stack and elected active GM", () => {
  assert.equal(validateBalladTargetGate(target).pass, true);
  assert.equal(validateBalladTargetGate({ ...target, worldId: "dbx-test-world" }).pass, false);
  assert.equal(validateBalladTargetGate({ ...target, activeGm: false }).pass, false);
});

test("Ballad preview never discovers or creates geometry and blocks unbound Tram west entry", () => {
  const preview = createBalladAscendancyBindingPlan({ target, behaviorBindings: [{ regionId: "dbx:region:core-dalton-station", behavior: "popup:dbx:puzzle:dalton-tram-repair" }] });
  assert.equal(preview.status, "BLOCKED");
  assert.equal(preview.noWrite, true);
  assert.equal(preview.mappingCoverage.boundRegions, 21);
  assert.deepEqual(preview.mappingCoverage.explicitlyUnboundRegions, [BALLAD_UNBOUND_REGION_ID]);
  assert.equal(preview.blockedTeleports.length, 1);
  assert.equal(preview.blockedTeleports[0].toRegionId, BALLAD_UNBOUND_REGION_ID);
  assert.equal(preview.scenesCreated, 0);
  assert.equal(preview.wallsCreated, 0);
  assert.equal(preview.regionsCreated, 0);
  assert.equal(preview.macrosCreated, 0);
  assert.equal(preview.actions[0].preserveForeignBehaviors, true);
  assert.equal(preview.actions[0].preserveUnknownFlags, true);
});

test("teleport plans require exact confirmation and never use choice:false auto-teleport", () => {
  const plan = createBalladTeleportPlan();
  assert.equal(plan.planned.length, 4);
  assert.equal(plan.blocked.length, 1);
  for (const teleport of plan.planned) {
    assert.equal(teleport.confirmation.required, true);
    assert.equal(teleport.confirmation.text, BALLAD_TELEPORT_CONFIRMATION);
    assert.equal(teleport.confirmation.cancel, "leave-token-in-place");
    assert.equal(teleport.nativeMovement.automatic, false);
    assert.notEqual(teleport.choice, false);
  }
});

test("cancelled teleport leaves the token in place", async () => {
  let moved = false;
  const receipt = await executeBalladTeleportAfterConfirmation({
    confirm: async text => {
      assert.equal(text, BALLAD_TELEPORT_CONFIRMATION);
      return false;
    },
    nativeMove: async () => { moved = true; },
  });
  assert.equal(receipt.status, "CANCELLED");
  assert.equal(receipt.moved, false);
  assert.equal(moved, false);
});

test("confirmed teleport defers native movement until after confirmation", async () => {
  const events = [];
  const receipt = await executeBalladTeleportAfterConfirmation({
    confirm: async text => { events.push(["confirm", text]); return true; },
    nativeMove: async () => { events.push(["move"]); },
  });
  assert.deepEqual(events, [["confirm", BALLAD_TELEPORT_CONFIRMATION], ["move"]]);
  assert.equal(receipt.status, "MOVED");
});

test("binding reread rejects drift and unexpected Regions", () => {
  const observed = BALLAD_REGION_BINDINGS.map(entry => ({ stableId: entry.stableId, regionUuid: entry.regionUuid }));
  assert.equal(validateBalladBindingReadback(observed).pass, true);
  const drifted = observed.map(entry => entry.stableId === "dbx:region:core-entry" ? { ...entry, regionUuid: "Scene.Vk6IMQh7jTxmKBtH.Region.WRONG" } : entry);
  assert.equal(validateBalladBindingReadback([...drifted, { stableId: "dbx:region:core-entry-west", regionUuid: "Scene.Vk6IMQh7jTxmKBtH.Region.GUESS" }]).pass, false);
});

test("Andrew is authorized for Dalton without replacing Dalton identity", () => {
  assert.equal(isBalladPuzzleControllerAuthorized("dbx:puzzle:dalton-tram-repair", "dbx:actor:dalton"), true);
  assert.equal(isBalladPuzzleControllerAuthorized("dbx:puzzle:dalton-tram-repair", "dbx:actor:andrew-mcconaughey"), true);
  assert.equal(isBalladPuzzleControllerAuthorized("dbx:puzzle:andrew-tram-routing", "dbx:actor:andrew-mcconaughey"), true);
  assert.equal(isBalladPuzzleControllerAuthorized("dbx:puzzle:dalton-tram-repair", "dbx:actor:lawson"), false);
});
