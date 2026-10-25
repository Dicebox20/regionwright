import assert from "node:assert/strict";
import test from "node:test";
import { createAscendancyRegionPlan, createAscendancyRegionPlanReceipt, validateAscendancyRegionPlan } from "../scripts/ascendancy-region-plan.mjs";

const plan = createAscendancyRegionPlan();

test("Ascendancy Region plan consumes the compiled helper package and exact tram coordinates", () => {
  assert.equal(plan.regionPlans.length, 4);
  const tram = plan.regionPlans.find((room) => room.roomId === "dbx:room:ascendancy-tram-depot");
  assert.equal(tram.regions.filter((region) => region.interaction === "tram-anchor").length, 36);
  assert.deepEqual(tram.regions.find((region) => region.regionId === "dbx:region:tram-slot-r1-c1").bounds, { x: 420, y: 210, width: 110, height: 95 });
  assert.equal(tram.regions.find((region) => region.regionId === "dbx:region:tram-slot-r6-c6").bounds.x, 970);
  assert.deepEqual(tram.regions.find((region) => region.regionId === "dbx:region:tram-dalton-repair").bounds, { x: 1120, y: 120, width: 300, height: 220 });
  assert.deepEqual(tram.regions.find((region) => region.regionId === "dbx:region:tram-cooperative").bounds, { x: 1120, y: 640, width: 300, height: 220 });
});

test("Region wiring preserves popup, Scene-owned, cooperative, and final ownership", () => {
  assert.equal(plan.wiring.personalPuzzles.filter((entry) => entry.popup).length, 5);
  assert.equal(plan.wiring.personalPuzzles.find((entry) => entry.semanticId === "dbx:puzzle:dalton-tram-repair").status, "reviewable");
  assert.equal(plan.wiring.cooperativeStages.find((entry) => entry.semanticId === "dbx:cooperative:dalton-andrew-tram-troubleshooting").status, "reviewable");
  const andrew = plan.wiring.personalPuzzles.find((entry) => entry.semanticId === "dbx:puzzle:andrew-tram-routing");
  assert.deepEqual(andrew, { semanticId: "dbx:puzzle:andrew-tram-routing", owner: "dicebox-scene", interaction: "foundry-scene-controller", popup: false, regionwrightEntryPoint: null, bindings: [], permissionBoundary: "dicebox-scene-controller", status: "scene-owned", mutation: "disabled-until-exact-runtime-gate" });
  assert.ok(plan.wiring.cooperativeStages.every((entry) => entry.popup === false && entry.interaction === "physical-scene-region"));
  assert.equal(plan.wiring.cooperativeStages.find((entry) => entry.semanticId === "dbx:cooperative:dalton-andrew-tram-troubleshooting").status, "reviewable");
  assert.equal(plan.wiring.finalActivation.activationRound, "event.activationRound");
  assert.ok(plan.teleports.every((teleport) => teleport.activeGMRequired === true && teleport.permissionBoundary === "active-gm-listener"));
  assert.deepEqual(plan.playerFacingMacros, []);
});

test("Region plan rejects coordinate and ownership drift", () => {
  const moved = structuredClone(plan);
  moved.regionPlans[1].regions[0].bounds.x += 1;
  assert.throws(() => validateAscendancyRegionPlan(moved), /drifted/);
  const popup = structuredClone(plan);
  popup.wiring.personalPuzzles.find((entry) => entry.semanticId === "dbx:puzzle:andrew-tram-routing").popup = true;
  assert.throws(() => validateAscendancyRegionPlan(popup), /popup puzzle ownership/);
});

test("Region plan receipt remains review-only and reports the canonical geometry", () => {
  const receipt = createAscendancyRegionPlanReceipt(plan);
  const expectedRegionCount = plan.regionPlans.reduce((total, regionPlan) => total + regionPlan.regions.length, 0);
  assert.equal(receipt.noWrite, true);
  assert.equal(receipt.readyClaim, false);
  assert.equal(expectedRegionCount, 61);
  assert.equal(receipt.regionCount, expectedRegionCount);
  assert.equal(receipt.popupPuzzleCount, 5);
  assert.equal(receipt.blockedPopupCount, 0);
  assert.equal(receipt.cooperativePhysicalRegionCount, 5);
  assert.equal(receipt.blockedCooperativeStageCount, 0);
  assert.equal(receipt.teleportCount, 5);
  assert.equal(receipt.playerFacingMacroCount, 0);
  assert.equal(receipt.macroOwnershipGate, "verified-no-player-facing-macros");
  assert.deepEqual(receipt.macroOwnershipEvidence, {
    mode: "none-in-current-campaign",
    macroIds: [],
    regionMacroBindingCount: 0,
    explicitPlayerOwnershipRequiredIfAdded: true,
    inheritedPermissionsAccepted: false,
    foundryField: "ownership.default",
    readbackRequired: true,
    source: "campaignPackage.regionwrightHandoff.contract.macroOwnership + regionPlans[*].regions[*].macroBinding",
  });
});
