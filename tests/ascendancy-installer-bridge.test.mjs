import assert from "node:assert/strict";
import test from "node:test";
import { createAscendancyRegionwrightInstallerBindingPlan, createAscendancyRegionwrightInstallerBindingReceipt, validateAscendancyRegionwrightInstallerBindingPlan, validateGamemasterHarnessReceipt, validateHelperNativeReadback } from "../scripts/ascendancy-installer-bridge.mjs";
import { loadCompiledCampaignPackage } from "../scripts/ascendancy-region-plan.mjs";

const plan = createAscendancyRegionwrightInstallerBindingPlan();

test("installer bridge consumes helper-owned Regions without duplicate creation", () => {
  assert.equal(plan.baseRegionOwner, "dicebox-campaign-helper");
  assert.equal(plan.duplicateRegionCreateCount, 0);
  assert.equal(plan.bindings.popupBindings.length, 5);
  assert.equal(plan.bindings.cooperativeBindings.length, 5);
  assert.equal(plan.bindings.finalBindings.length, 7);
  assert.equal(plan.bindings.teleports.length, 5);
  assert.deepEqual(plan.bindings.andrew, { semanticId: "dbx:puzzle:andrew-tram-routing", owner: "dicebox-scene-engine", popup: false, regionBehaviorCount: 0 });
});

test("installer bridge preserves popup, cooperative, final, teleport, and Macro ownership boundaries", () => {
  assert.ok(plan.bindings.popupBindings.every((entry) => entry.permissionBoundary === "active-gm-listener"));
  assert.ok(plan.bindings.cooperativeBindings.every((entry) => entry.popup === false && entry.config.entryHook === "regionwright.ascendancyCooperativeStage" && entry.config.completionSource.includes("cooperativeComplete")));
  assert.ok(plan.bindings.finalBindings.every((entry) => entry.popup === false));
  assert.ok(plan.bindings.teleports.every((entry) => entry.activeGMRequired === true && entry.behavior === "native-teleport"));
  assert.deepEqual(plan.playerFacingMacros, []);
  assert.equal(plan.macroPolicy.foundryField, "ownership.default");
});

test("core security binding uses the final/core path instead of cooperative entry semantics", () => {
  const core = plan.bindings.finalBindings.find((entry) => entry.semanticId === "dbx:stage:six-person-simultaneous-activation");
  assert.ok(core);
  assert.equal(core.kind, "physical-cooperative");
  assert.deepEqual(core.config, { stage: "core", finalStageId: "dbx:stage:six-person-simultaneous-activation", permissionBoundary: "active-gm-listener" });
});

test("installer bridge requires the exact mutation-free Gamemaster harness contract", () => {
  assert.deepEqual(plan.gmHarness, {
    operation: "gm-chrome-harness.select",
    targetUrl: "http://localhost:30000/game",
    requiredAccountLabel: "Gamemaster [GM]",
    excludedAccountLabel: "Assistant Gamemaster [GM]",
    exactFields: ["providerTabId", "title", "url"],
    noChromeMutation: true,
    noWorldMutation: true,
    failClosed: true,
  });
  const receipt = {
    operation: "gm-chrome-harness.select",
    status: "PASS",
    noChromeMutation: true,
    noWorldMutation: true,
    targetUrl: "http://localhost:30000/game",
    selected: { tabId: "gm", providerTabId: "provider-gm", title: "Foundry Virtual Tabletop", url: "http://localhost:30000/game", accountLabel: "Gamemaster [GM]" },
    preserved: [{ tabId: "assistant", providerTabId: "provider-assistant", title: "Foundry Virtual Tabletop", url: "http://localhost:30000/game", accountLabel: "Assistant Gamemaster [GM]" }],
    blockers: [],
  };
  assert.equal(validateGamemasterHarnessReceipt(receipt).selected.accountLabel, "Gamemaster [GM]");
  assert.throws(() => validateGamemasterHarnessReceipt({ ...receipt, selected: { ...receipt.selected, accountLabel: "Assistant Gamemaster [GM]" } }), /Gamemaster/);
});

test("installer bridge rejects binding drift", () => {
  const moved = structuredClone(plan);
  moved.bindings.andrew.regionBehaviorCount = 1;
  assert.throws(() => validateAscendancyRegionwrightInstallerBindingPlan(moved), /Andrew/);
  const popup = structuredClone(plan);
  popup.bindings.popupBindings[0].permissionBoundary = "player-local";
  assert.throws(() => validateAscendancyRegionwrightInstallerBindingPlan(popup), /popup binding/);
});

test("installer bridge receipt remains blocked until helper PASS receipt and target reread exist", () => {
  const receipt = createAscendancyRegionwrightInstallerBindingReceipt(plan);
  assert.equal(receipt.status, "blocked");
  assert.equal(receipt.noWrite, true);
  assert.equal(receipt.helperInstallerReceiptStatus, "blocked-missing-helper-installer-receipt");
  assert.deepEqual(receipt.gmHarness, plan.gmHarness);
  assert.equal(receipt.nativeReadbackStatus, "blocked-missing-helper-native-readback");
  assert.equal(receipt.popupBehaviorCount, 5);
  assert.equal(receipt.cooperativeRegionBindingCount, 5);
  assert.equal(receipt.finalRegionBindingCount, 7);
  assert.equal(receipt.teleportBehaviorCount, 5);
  assert.equal(receipt.duplicateRegionCreateCount, 0);
});

test("installer bridge consumes only helper install receipt plus redacted ascendancy snapshot", () => {
  const campaignPackage = loadCompiledCampaignPackage();
  const installerReceipt = {
    operation: "ascendancy.install",
    status: "PASS",
    readyClaim: false,
    noWrite: false,
    packageId: campaignPackage.packageId,
    target: { foundryVersion: "14.367", systemId: "dnd5e", systemVersion: "5.3.3" },
    playerFacingMacroCount: 0,
    scenes: campaignPackage.campaign.rooms.map((room) => {
      const plan = campaignPackage.regionPlans.find((candidate) => candidate.roomId === room.roomId);
      const blueprint = campaignPackage.spatialBlueprints.find((candidate) => candidate.blueprintId === room.spatialBlueprintId);
      return { roomId: room.roomId, sceneUuid: `Scene.${room.roomId}`, wallCount: blueprint.walls.length + blueprint.anchors.filter((anchor) => anchor.kind === "door").length, regionCount: plan.regions.length, reread: true };
    }),
  };
  const snapshot = {
    status: "observed",
    packageId: "dicebox-campaign-helper",
    scenes: campaignPackage.campaign.rooms.map((room) => {
      const plan = campaignPackage.regionPlans.find((candidate) => candidate.roomId === room.roomId);
      const blueprint = campaignPackage.spatialBlueprints.find((candidate) => candidate.blueprintId === room.spatialBlueprintId);
      return {
        semanticId: room.roomId,
        binding: "redacted:scene",
        walls: [...blueprint.walls.map((wall) => wall.wallId), ...blueprint.anchors.filter((anchor) => anchor.kind === "door").map((anchor) => anchor.anchorId)].map((semanticId) => ({ kind: "wall", semanticId, binding: "redacted:wall" })),
        regions: plan.regions.map((region) => ({ kind: "region", semanticId: region.regionId, binding: "redacted:region" })),
      };
    }),
  };
  const evidence = validateHelperNativeReadback({ installerReceipt, snapshot, campaignPackage });
  assert.equal(evidence.status, "observed");
  assert.equal(evidence.scenes.length, 4);
  const drifted = structuredClone(snapshot);
  drifted.scenes[0].regions[0].binding = "Region.real-uuid";
  assert.throws(() => validateHelperNativeReadback({ installerReceipt, snapshot: drifted, campaignPackage }), /Region readback drifted/);
});
