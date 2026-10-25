import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createAscendancyCampaignSource } from "./ascendancy-campaign-source.mjs";

const REGION_PLAN_SCHEMA_VERSION = "0.1.0";
const MUTATION = "disabled-until-exact-runtime-gate";
const POPUP_PUZZLES = Object.freeze([
  "dbx:puzzle:aleister-frequency",
  "dbx:puzzle:sprocket-circuit",
  "dbx:puzzle:dalton-tram-repair",
  "dbx:puzzle:lawson-rune-memory",
  "dbx:puzzle:tactal-rune-slotting",
]);
const ANDREW_PUZZLE = "dbx:puzzle:andrew-tram-routing";
const COOPERATIVE_STAGES = Object.freeze([
  "dbx:cooperative:aleister-sprocket-frequency-circuit",
  "dbx:cooperative:dalton-andrew-tram-troubleshooting",
  "dbx:cooperative:lawson-tactal-rune-order",
]);
const FINAL_STAGE = "dbx:stage:six-person-simultaneous-activation";
const ROOM_IDS = Object.freeze([
  "dbx:room:signal-frequency-chamber",
  "dbx:room:ascendancy-tram-depot",
  "dbx:room:rune-mechanism-chamber",
  "dbx:room:central-core-control-chamber",
]);
const REGION_EDITOR_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function clone(value) {
  return structuredClone(value);
}

export function loadCompiledCampaignPackage(source = createAscendancyCampaignSource()) {
  const tsxLoader = path.join(source.helperRoot, "node_modules", "tsx", "dist", "esm", "index.mjs");
  const compilerScript = path.join(source.helperRoot, "tools", "print-campaign-package.ts");
  if (!existsSync(tsxLoader) || !existsSync(compilerScript)) throw new Error(`DiceBox campaign compiler is missing: ${compilerScript}`);
  const output = execFileSync(process.execPath, ["--import", pathToFileURL(tsxLoader).href, compilerScript], {
    cwd: source.helperRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(output);
}

function regionByBinding(regionPlans, binding) {
  return regionPlans.flatMap((plan) => plan.regions.filter((region) => region.behaviorBinding === binding).map((region) => ({ roomId: plan.roomId, sceneId: plan.sceneId, regionId: region.regionId })));
}

function createWiring(packageData) {
  const regionPlans = packageData.regionPlans;
  const handoff = packageData.regionwrightHandoff;
  const personalPuzzles = handoff.personalPuzzles.map((entry) => {
    const bindings = regionByBinding(regionPlans, entry.puzzleId);
    const sceneOwned = entry.puzzleId === ANDREW_PUZZLE;
    return {
      semanticId: entry.puzzleId,
      owner: entry.owner,
      interaction: entry.interaction,
      popup: entry.popup,
      regionwrightEntryPoint: entry.regionwrightEntryPoint,
      bindings,
      permissionBoundary: sceneOwned ? "dicebox-scene-controller" : "active-gm-listener",
      status: sceneOwned ? "scene-owned" : (bindings.length ? "reviewable" : "blocked-missing-region-binding"),
      mutation: MUTATION,
    };
  });
  const cooperativeStages = handoff.cooperativeStages.map((entry) => ({
    semanticId: entry.cooperativeId,
    pairId: entry.pairId,
    owner: entry.owner,
    interaction: entry.interaction,
    popup: entry.popup,
    bindings: regionByBinding(regionPlans, entry.cooperativeId),
    entryHook: "regionwright.ascendancyCooperativeStage",
    completionSource: `pairs[${entry.pairId}].cooperativeComplete after advanceCooperativeStage`,
    permissionBoundary: "active-gm-listener",
    status: regionByBinding(regionPlans, entry.cooperativeId).length ? "reviewable" : "blocked-missing-region-binding",
    mutation: MUTATION,
  }));
  const finalBindings = regionByBinding(regionPlans, FINAL_STAGE);
  return {
    personalPuzzles,
    cooperativeStages,
    finalActivation: {
      semanticId: handoff.finalActivation.stageId,
      owner: handoff.finalActivation.owner,
      popup: handoff.finalActivation.popup,
      stationBindings: handoff.finalActivation.stationCharacterIds.map((actorId) => ({ actorId, bindings: regionByBinding(regionPlans, actorId) })),
      regionBindings: finalBindings,
      activationRound: "event.activationRound",
      permissionBoundary: "active-gm-listener",
      status: finalBindings.length ? "reviewable" : "blocked-missing-region-binding",
      mutation: MUTATION,
    },
  };
}

function createTransitions(packageData) {
  return packageData.regionwrightHandoff.progressionEdges.map((edge) => ({
    edgeId: edge.edgeId,
    kind: edge.kind,
    fromId: edge.fromId,
    toId: edge.toId,
    destinationRegionId: null,
    status: "semantic-transition-only",
    mutation: MUTATION,
  }));
}

function createMacroOwnershipEvidence(campaignPackage) {
  const macroOwnership = campaignPackage.regionwrightHandoff?.contract?.macroOwnership;
  const regionMacroBindings = campaignPackage.regionPlans.flatMap((regionPlan) => regionPlan.regions.map((region) => region.macroBinding));
  if (!macroOwnership || macroOwnership.mode !== "none-in-current-campaign" || macroOwnership.macroIds.length !== 0 || regionMacroBindings.some((binding) => binding !== null)) {
    throw new Error("Ascendancy campaign package macro invariant drifted: expected zero player-facing Macros and null Region macroBinding values.");
  }
  return {
    mode: macroOwnership.mode,
    macroIds: [...macroOwnership.macroIds],
    regionMacroBindingCount: regionMacroBindings.filter((binding) => binding !== null).length,
    explicitPlayerOwnershipRequiredIfAdded: macroOwnership.policy === "explicit-player-owner-if-introduced",
    inheritedPermissionsAccepted: macroOwnership.inheritedPermissionsAccepted,
    foundryField: macroOwnership.foundryField,
    readbackRequired: macroOwnership.readbackRequired,
    source: "campaignPackage.regionwrightHandoff.contract.macroOwnership + regionPlans[*].regions[*].macroBinding",
  };
}

export function createAscendancyRegionPlan({ campaignPackage = loadCompiledCampaignPackage() } = {}) {
  if (campaignPackage.mutation !== MUTATION) throw new Error("Ascendancy campaign package is not mutation-gated.");
  if (!Array.isArray(campaignPackage.regionPlans) || campaignPackage.regionPlans.length !== 4) throw new Error("Compiled campaign package is missing the four authoritative Ascendancy Region plans.");
  const plan = {
    schemaVersion: REGION_PLAN_SCHEMA_VERSION,
    packageId: campaignPackage.packageId,
    source: {
      mode: "read-only",
      helperCompiler: "npm run compile:campaign",
      regionEditorRoot: REGION_EDITOR_ROOT,
      geometryAuthority: "helper createAscendancyRegionPlans()",
      coordinateSource: "campaign-helper-orthogonal-coordinate-plan",
    },
    mutation: MUTATION,
    regionPlans: clone(campaignPackage.regionPlans),
    wiring: createWiring(campaignPackage),
    transitions: createTransitions(campaignPackage),
    teleports: campaignPackage.regionPlans.flatMap((regionPlan) => regionPlan.teleports.map((teleport) => ({ ...teleport, permissionBoundary: "active-gm-listener", listener: "Regionwright active-GM listener / DiceBox Scene controller" }))),
    playerFacingMacros: [],
    macroOwnershipPolicy: "none-in-current-campaign; explicit-player-owner-if-introduced",
    macroOwnershipEvidence: createMacroOwnershipEvidence(campaignPackage),
    blockers: [
      "Foundry target reconciliation is blocked: the local Data path contains only the-ballad-of-chauser-bill at Foundry 14.365 / dnd5e 5.3.3; dbx-test-world on Foundry 14.367 and modules/dicebox-campaign-helper are absent. Regionwright 0.1.4 is present, but no write may target the Ballad world without user-selected target track.",
      "Package-bound renderer asset installation and target-world read-back remain unexercised at the exact Foundry target.",
      "All Region, behavior, and teleport mutation remains disabled until the exact runtime gate and authoritative reread pass.",
    ],
  };
  return validateAscendancyRegionPlan(plan, { campaignPackage });
}

function assertCanonicalRegionPlans(regionPlans, canonicalPlans) {
  if (regionPlans.length !== canonicalPlans.length) throw new Error("Ascendancy Region plan count drifted from the helper package.");
  for (const canonical of canonicalPlans) {
    const actual = regionPlans.find((candidate) => candidate.roomId === canonical.roomId);
    if (!actual || JSON.stringify(actual) !== JSON.stringify(canonical)) throw new Error(`Ascendancy Region plan drifted for ${canonical.roomId}.`);
  }
}

export function validateAscendancyRegionPlan(input, { campaignPackage = loadCompiledCampaignPackage() } = {}) {
  const plan = clone(input);
  if (plan.schemaVersion !== REGION_PLAN_SCHEMA_VERSION || plan.mutation !== MUTATION) throw new Error("Ascendancy Region plan schema or mutation gate is invalid.");
  if (plan.macroOwnershipPolicy !== "none-in-current-campaign; explicit-player-owner-if-introduced") throw new Error("Ascendancy macro ownership policy drifted.");
  const expectedMacroEvidence = createMacroOwnershipEvidence(campaignPackage);
  if (JSON.stringify(plan.macroOwnershipEvidence) !== JSON.stringify(expectedMacroEvidence)) throw new Error("Ascendancy macro ownership evidence drifted.");
  if (!Array.isArray(plan.playerFacingMacros)) throw new Error("Ascendancy player-facing macro inventory is invalid.");
  for (const macro of plan.playerFacingMacros) {
    if (macro.permission !== "explicit-player" || macro.canUse !== true || macro.bindingType !== "approved-stable-id-or-regionwright-hook" || macro.readBackEvidence !== true) throw new Error("A player-facing macro lacks explicit Player ownership or read-back evidence.");
  }
  if (!Array.isArray(plan.regionPlans) || plan.regionPlans.length !== ROOM_IDS.length) throw new Error("Ascendancy Region plan must contain exactly four campaign rooms.");
  if (JSON.stringify(plan.regionPlans.map((entry) => entry.roomId)) !== JSON.stringify(ROOM_IDS)) throw new Error("Ascendancy campaign room IDs drifted from the helper package.");
  assertCanonicalRegionPlans(plan.regionPlans, campaignPackage.regionPlans);
  for (const regionPlan of plan.regionPlans) {
    if (regionPlan.canvas.width !== 1536 || regionPlan.canvas.height !== 1024) throw new Error(`Scene dimensions drifted for ${regionPlan.roomId}.`);
    if (regionPlan.geometryOwner !== "spatial-blueprint" || regionPlan.coordinateSource !== "campaign-helper-orthogonal-coordinate-plan") throw new Error(`Geometry authority drifted for ${regionPlan.roomId}.`);
    if (regionPlan.teleports.some((teleport) => teleport.activeGMRequired !== true || teleport.mutation !== MUTATION)) throw new Error(`Teleport authority drifted for ${regionPlan.roomId}.`);
  }
  const popups = plan.wiring.personalPuzzles.filter((entry) => entry.popup);
  if (popups.length !== POPUP_PUZZLES.length || JSON.stringify(popups.map((entry) => entry.semanticId)) !== JSON.stringify(POPUP_PUZZLES)) throw new Error("Regionwright popup puzzle ownership drifted.");
  if (popups.some((entry) => entry.bindings.length > 1 || entry.owner !== "regionwright-popup" || entry.interaction !== "regionwright-browser-minigame" || entry.permissionBoundary !== "active-gm-listener")) throw new Error("A Regionwright popup puzzle has invalid GM-mediated ownership or multiple Region bindings.");
  if (popups.some((entry) => entry.bindings.length === 0 && entry.status !== "blocked-missing-region-binding")) throw new Error("A popup puzzle without authoritative geometry was not marked blocked.");
  const andrew = plan.wiring.personalPuzzles.find((entry) => entry.semanticId === ANDREW_PUZZLE);
  if (!andrew || andrew.popup !== false || andrew.owner !== "dicebox-scene" || andrew.bindings.length !== 0) throw new Error("Andrew routing must remain Scene-owned and popup=false.");
  if (plan.wiring.cooperativeStages.length !== COOPERATIVE_STAGES.length || plan.wiring.cooperativeStages.some((entry, index) => entry.semanticId !== COOPERATIVE_STAGES[index] || entry.popup !== false || entry.interaction !== "physical-scene-region" || entry.bindings.length > 2 || entry.entryHook !== "regionwright.ascendancyCooperativeStage" || !entry.completionSource.includes("cooperativeComplete") || entry.permissionBoundary !== "active-gm-listener" || (entry.bindings.length === 0 && entry.status !== "blocked-missing-region-binding"))) throw new Error("Cooperative Region wiring drifted.");
  if (plan.wiring.finalActivation.popup !== false || plan.wiring.finalActivation.activationRound !== "event.activationRound" || plan.wiring.finalActivation.regionBindings.length !== 1 || plan.wiring.finalActivation.permissionBoundary !== "active-gm-listener") throw new Error("Final activation Region wiring drifted from the explicit activationRound and GM-listener contract.");
  if (plan.wiring.finalActivation.stationBindings.some((entry) => entry.bindings.length !== 1)) throw new Error("A final activation station is not bound to exactly one helper Region.");
  if (plan.teleports.length < 1 || plan.teleports.some((teleport) => teleport.activeGMRequired !== true || teleport.permissionBoundary !== "active-gm-listener" || teleport.listener !== "Regionwright active-GM listener / DiceBox Scene controller")) throw new Error("Authoritative active-GM teleport edges are missing.");
  return Object.freeze(plan);
}

export function createAscendancyRegionPlanReceipt(plan = createAscendancyRegionPlan()) {
  const validated = validateAscendancyRegionPlan(plan);
  return {
    schemaVersion: REGION_PLAN_SCHEMA_VERSION,
    operation: "ascendancy.regionwright.region-plan.preview",
    status: "reviewable",
    evidenceClass: "deterministic",
    readyClaim: false,
    noWrite: true,
    packageId: validated.packageId,
    roomCount: validated.regionPlans.length,
    regionCount: validated.regionPlans.reduce((total, entry) => total + entry.regions.length, 0),
    popupPuzzleCount: validated.wiring.personalPuzzles.filter((entry) => entry.popup).length,
    blockedPopupCount: validated.wiring.personalPuzzles.filter((entry) => entry.popup && entry.status === "blocked-missing-region-binding").length,
    cooperativePhysicalRegionCount: validated.wiring.cooperativeStages.reduce((total, entry) => total + entry.bindings.length, 0),
    cooperativeStageCount: validated.wiring.cooperativeStages.length,
    blockedCooperativeStageCount: validated.wiring.cooperativeStages.filter((entry) => entry.status === "blocked-missing-region-binding").length,
    finalStationCount: validated.wiring.finalActivation.stationBindings.length,
    teleportCount: validated.teleports.length,
    blockerCount: validated.blockers.length,
    playerFacingMacroCount: validated.playerFacingMacros.length,
    macroOwnershipGate: validated.playerFacingMacros.length ? "verified-explicit-player" : "verified-no-player-facing-macros",
    macroOwnershipEvidence: validated.macroOwnershipEvidence,
    gmListenerCount: validated.teleports.length + validated.wiring.personalPuzzles.filter((entry) => entry.permissionBoundary === "active-gm-listener").length + validated.wiring.cooperativeStages.length + 1,
    mutation: MUTATION,
  };
}
