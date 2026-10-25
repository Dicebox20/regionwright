import { behaviorCatalog } from "./catalog.js";
import { buildCapabilitySnapshot } from "./capabilities.js";
import { createPlan, validatePlan, buildRegionBehaviorData } from "./plan.js";
import { captureSelection, selectedRegionDocuments, validateSelection } from "./selection.js";
import { applyPlan, buildReconciliationOperations, forgeOwnedKey } from "./write.js";
import { integrationSuiteReady, integrationTestProfile, runRegionBehaviorIntegrationTest, runRegionwrightIntegrationSuite, runSceneToSceneTeleportTest } from "./test-routine.js";
import { openBuilder } from "./ui.js";
import { clearPitfallTrap, configurePitfallTrap, createPitfallTrapConfig, evaluateAthleticsCheck, evaluatePitfallDetection, handlePitfallTrap, passivePerception, validatePitfallTrapConfig } from "./pitfall-trap.js";
import { studioService } from "./studio.js";
import { compileScenarioBlueprint } from "./studio-compiler.js";
import { createStudioDraftStore } from "./studio-storage.js";
import { createStoryFactStore } from "./studio-facts.js";
import { diagnoseStudioBlueprint } from "./studio-diagnostics.js";
import { buildPressurePlateActivityPlans, clearPressurePlateActivity, pressurePlateActivityBehaviors, publishPressurePlateActivity } from "./studio-activity.js";
import { buildSceneMomentActivityPlans, clearSceneMomentActivity, handleSceneMoment, publishSceneMomentActivity, sceneMomentActivityBehaviors } from "./studio-scene-moment.js";
import { buildStoryBeatActivityPlans, clearStoryBeatActivity, publishStoryBeatActivity, storyBeatActivityBehaviors } from "./studio-story-beat.js";
import { buildScenePortalActivityPlan, clearScenePortalActivity, publishScenePortalActivity, scenePortalActivityBehaviors } from "./studio-portal.js";
import { buildStoryFactActivityPlans, clearStoryFactActivity, handleStoryFact, publishStoryFactActivity, storyFactActivityBehaviors } from "./studio-story-fact.js";
import { buildHubUnlockActivityPlans, clearHubUnlockActivity, handleHubUnlock, hubUnlockActivityBehaviors, publishHubUnlockActivity } from "./studio-hub-unlock.js";
import { bossEngine } from "./boss-engine.js";

export function createAPI() {
  // Campaign integrations remain owned by Studio. The premium alias preserves
  // older Regionwright campaign macros while reusable puzzle games live in
  // their own optional module.
  const campaign = {};
  const puzzlesLocks = Object.freeze({
    get available() { return Boolean(globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api?.openHub); },
    catalog() { return globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api?.catalog?.() ?? []; },
    openHub(...args) {
      const open = globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api?.openHub;
      if (typeof open !== "function") throw new Error("Regionwright: Puzzles & Locks is not installed or ready.");
      return open(...args);
    },
    openSetup(id, options = {}) {
      const open = globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api?.openSetup;
      if (typeof open !== "function") throw new Error("Regionwright: Puzzles & Locks is not installed or ready.");
      return open(id, options);
    }
  });
  return Object.freeze({
    version: "0.2.0",
    openBuilder,
    capabilities: () => buildCapabilitySnapshot(),
    catalog: () => behaviorCatalog(),
    selection: Object.freeze({ capture: captureSelection, documents: selectedRegionDocuments, validate: validateSelection }),
    plan: Object.freeze({ create: createPlan, validate: validatePlan, behaviorData: buildRegionBehaviorData }),
    validate: validatePlan,
    apply: applyPlan,
    traps: Object.freeze({ createPitfall: createPitfallTrapConfig, validatePitfall: validatePitfallTrapConfig, evaluatePitfall: evaluatePitfallDetection, evaluateAthletics: evaluateAthleticsCheck, passivePerception, configurePitfall: configurePitfallTrap, clearPitfall: clearPitfallTrap, handle: handlePitfallTrap }),
    puzzlesLocks,
    campaign,
    premium: campaign,
    boss: bossEngine,
    studio: Object.freeze({ ...studioService, compile: compileScenarioBlueprint, diagnose: diagnoseStudioBlueprint, drafts: createStudioDraftStore(), facts: createStoryFactStore(), activities: Object.freeze({ buildPressurePlate: buildPressurePlateActivityPlans, publishPressurePlate: publishPressurePlateActivity, clearPressurePlate: clearPressurePlateActivity, pressurePlateBehaviors: pressurePlateActivityBehaviors, buildSceneMoment: buildSceneMomentActivityPlans, publishSceneMoment: publishSceneMomentActivity, clearSceneMoment: clearSceneMomentActivity, sceneMomentBehaviors: sceneMomentActivityBehaviors, handleSceneMoment, buildStoryBeat: buildStoryBeatActivityPlans, publishStoryBeat: publishStoryBeatActivity, clearStoryBeat: clearStoryBeatActivity, storyBeatBehaviors: storyBeatActivityBehaviors, buildScenePortal: buildScenePortalActivityPlan, publishScenePortal: publishScenePortalActivity, clearScenePortal: clearScenePortalActivity, scenePortalBehaviors: scenePortalActivityBehaviors, buildStoryFact: buildStoryFactActivityPlans, publishStoryFact: publishStoryFactActivity, clearStoryFact: clearStoryFactActivity, storyFactBehaviors: storyFactActivityBehaviors, handleStoryFact, buildHubUnlock: buildHubUnlockActivityPlans, publishHubUnlock: publishHubUnlockActivity, clearHubUnlock: clearHubUnlockActivity, hubUnlockBehaviors: hubUnlockActivityBehaviors, handleHubUnlock }) }),
    tests: Object.freeze({ run: runRegionBehaviorIntegrationTest, runAll: runRegionwrightIntegrationSuite, runSceneToSceneTeleport: runSceneToSceneTeleportTest, profile: integrationTestProfile, suiteReady: integrationSuiteReady }),
    reconciliation: Object.freeze({ build: buildReconciliationOperations, ownedKey: forgeOwnedKey })
  });
}
