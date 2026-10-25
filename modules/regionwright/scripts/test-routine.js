import { getBehaviorDefinition, BEHAVIOR_DEFINITIONS } from "./catalog.js";
import { MODULE_ID, WRITE_SETTING } from "./constants.js";
import { createPlan } from "./plan.js";
import { applyPlan } from "./write.js";

const TEST_FLAG = "integrationTest";
const TEST_PREFIX = "Regionwright Test";
const DEFAULT_BOUNDS = Object.freeze({ x: 200, y: 200, width: 200, height: 200, destinationX: 650, destinationY: 200 });

/**
 * A behavior only earns a passing result when its listed observable result is
 * captured. Entries marked review deliberately keep a whole-suite result from
 * claiming that visual, player-client, or custom-code behavior was verified.
 */
export const INTEGRATION_TEST_PROFILES = Object.freeze({
  darkness: { trigger: "enter", observation: "darkness", checks: ["Confirm the local darkness changes while the Token is inside."] },
  "active-effects": { trigger: "enter", observation: "active-effect", requires: ["actor", "effectUuid"], checks: ["Confirm the copied Active Effect is removed when the Token leaves."] },
  "change-level": { trigger: "move-in", observation: "level-prompt", checks: ["Confirm the Token receives the expected Scene Level prompt."] },
  "define-surface": { trigger: "enter", observation: "surface", checks: ["Confirm the surface blocks or allows the selected interactions."] },
  "scrolling-text": { trigger: "animate-in", observation: "scrolling-text", checks: ["Animate the Token into the Region and confirm the text appears for the intended audience."] },
  "difficult-terrain": { trigger: "enter", observation: "terrain", checks: ["Confirm D&D5e applies the expected terrain rule to the Token."] },
  "execute-macro": { trigger: "custom", observation: "macro", requires: ["approvedMacro"], checks: ["Run only a reviewed test Macro that records a harmless result."] },
  "execute-script": { trigger: "custom", observation: "script", requires: ["approvedScript"], checks: ["Run only a reviewed test Script that records a harmless result."] },
  "movement-cost": { trigger: "enter", observation: "terrain", checks: ["Plan a movement path through the Region and confirm the movement cost changes."] },
  pause: { trigger: "move-in", observation: "player", requires: ["playerClient"], checks: ["Move a player-owned Token in from a non-GM client and confirm the game pauses."] },
  "suppress-weather": { trigger: "enter", observation: "weather", requires: ["weather"], checks: ["Confirm the active Scene weather is hidden inside the Region."] },
  teleport: { trigger: "move-in", observation: "teleport", checks: ["Confirm the Token lands inside the destination Region."] },
  "toggle-behavior": { trigger: "enter", observation: "toggle", requires: ["targetBehaviorUuid"], checks: ["Confirm the selected target Behavior changes enabled state."] }
});

export function integrationTestProfile(behaviorKey) {
  return INTEGRATION_TEST_PROFILES[behaviorKey] ?? null;
}

export function integrationSuiteReady(results = []) {
  return results.length > 0 && results.every(result => result.status === "passed");
}

function testFlagData() {
  return { regionwright: { [TEST_FLAG]: true } };
}

function testName(behaviorKey, suffix = "") {
  return `${TEST_PREFIX} — ${behaviorKey}${suffix ? ` ${suffix}` : ""}`;
}

function rect(x, y, width, height) {
  return { type: "rectangle", x, y, width, height, hole: false };
}

function insidePosition(bounds) {
  return { x: bounds.x + Math.floor(bounds.width / 2), y: bounds.y + Math.floor(bounds.height / 2) };
}

function activeScene(scene = globalThis.canvas?.scene) {
  if (!scene?.active) throw new Error("Open an active Scene before running a Regionwright integration test.");
  return scene;
}

function requiredInputs(profile, options) {
  return (profile.requires ?? []).filter(key => !options[key]);
}

function defaultMovementAction() {
  return Object.keys(globalThis.CONFIG?.Token?.movement?.actions ?? {}).find(action => action !== "displace") ?? "";
}

function baseParameters(behaviorKey, parameters, { destinationRegion, effectUuid, targetBehaviorUuid, macroUuid, scriptSource } = {}) {
  const movementAction = defaultMovementAction();
  const defaults = {
    darkness: { mode: "override", modifier: 0.5 },
    "active-effects": { effectsText: effectUuid ?? "" },
    "change-level": { movementActionsText: movementAction },
    "define-surface": { placement: "bottom", light: true, move: true, sight: true, sound: true, occlusion: true, exposure: false, culling: false },
    "scrolling-text": { events: ["tokenAnimateIn"], text: "Regionwright test", color: "#ffffff", visibility: "gm", once: false },
    "difficult-terrain": { magical: false, typesText: "", ignoredDispositionsText: "" },
    "execute-macro": { events: ["tokenEnter"], uuid: macroUuid ?? "", everyone: false },
    "execute-script": { events: ["tokenEnter"], source: scriptSource ?? "", scriptAcknowledged: true },
    "movement-cost": { difficulties: movementAction ? { [movementAction]: 2 } : {} },
    pause: { once: false },
    "suppress-weather": {},
    teleport: { destinationsText: destinationRegion?.uuid ?? "", placement: "center", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 },
  "toggle-behavior": { events: ["tokenEnter"], enableText: "", disableText: targetBehaviorUuid ?? "" }
  };
  return { ...(defaults[behaviorKey] ?? {}), ...parameters };
}

function tokenIsInside(region, token) {
  if (region?.tokens?.has) return region.tokens.has(token);
  const center = token?.getCenterPoint?.() ?? { x: token?.x, y: token?.y };
  return Boolean(region?.testPoint?.({ ...center, elevation: token?.elevation ?? 0 }));
}

function tokenCenter(token) {
  const center = token?.getCenterPoint?.();
  if (center) return center;
  const gridSize = Number(globalThis.canvas?.grid?.size ?? globalThis.canvas?.scene?.grid?.size ?? 100);
  return {
    x: Number(token?.x ?? 0) + Number(token?.width ?? 1) * gridSize / 2,
    y: Number(token?.y ?? 0) + Number(token?.height ?? 1) * gridSize / 2
  };
}

function localDarknessAtToken(token) {
  const point = tokenCenter(token);
  const level = globalThis.canvas?.effects?.getDarknessLevel?.(point, token?.elevation ?? 0);
  return Number.isFinite(Number(level)) ? Number(level) : Number(globalThis.canvas?.darknessLevel);
}

function actorEffectIds(actor, token) {
  const runtimeActor = canvasTokenFor(token)?.actor ?? token?.actor ?? actor;
  return new Set(Array.from(runtimeActor?.effects ?? []).map(effect => effect.id));
}

async function waitForRegionEvents(behaviorKey, parameters = {}) {
  // Teleport Token honors its transition duration. Checking after the generic
  // event delay races the native transition and produces a false negative.
  const configuredDuration = Number(parameters?.transitionDuration);
  const delay = behaviorKey === "teleport"
    ? Math.max(300, Number.isFinite(configuredDuration) ? configuredDuration + 200 : 1700)
    : behaviorKey === "active-effects"
      ? 1000
    : behaviorKey === "toggle-behavior"
      ? 1000
    : ["movement-cost", "difficult-terrain"].includes(behaviorKey)
      ? 1000
    : 250;
  await new Promise(resolve => setTimeout(resolve, delay));
}

function canvasTokenFor(document) {
  if (!document?.id) return null;
  return globalThis.canvas?.tokens?.get?.(document.id)
    ?? globalThis.canvas?.tokens?.placeables?.find?.(placeable => placeable.document?.id === document.id)
    ?? null;
}

async function waitForTokenPlaceable(document, timeout = 1200) {
  const started = Date.now();
  while ((Date.now() - started) < timeout) {
    if (canvasTokenFor(document)) return true;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return Boolean(canvasTokenFor(document));
}

async function waitForScene(scene, timeout = 5000) {
  const started = Date.now();
  while ((Date.now() - started) < timeout) {
    if (globalThis.canvas?.scene?.uuid === scene?.uuid || globalThis.game?.scenes?.active?.uuid === scene?.uuid) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return globalThis.canvas?.scene?.uuid === scene?.uuid || globalThis.game?.scenes?.active?.uuid === scene?.uuid;
}

async function waitForNamedToken(scene, name, timeout = 5000) {
  const started = Date.now();
  while ((Date.now() - started) < timeout) {
    const token = Array.from(scene?.tokens ?? []).find(entry => entry.name === name && entry.flags?.[MODULE_ID]?.[TEST_FLAG]);
    if (token) return token;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return Array.from(scene?.tokens ?? []).find(entry => entry.name === name && entry.flags?.[MODULE_ID]?.[TEST_FLAG]) ?? null;
}

async function deleteArtifacts(scene, artifacts) {
  if (artifacts.token?.id) await scene.deleteEmbeddedDocuments("Token", [artifacts.token.id]);
  const regions = [artifacts.destinationRegion, artifacts.sourceRegion].filter(region => region?.id).map(region => region.id);
  if (regions.length) await scene.deleteEmbeddedDocuments("Region", regions);
}

async function deleteSceneArtifacts(scene, artifacts) {
  const currentScene = globalThis.game?.scenes?.get?.(scene?.id) ?? scene;
  const tokens = Array.from(currentScene?.tokens ?? [])
    .filter(token => token.flags?.[MODULE_ID]?.[TEST_FLAG] && String(token.name ?? "").startsWith(TEST_PREFIX))
    .map(token => token.id)
    .filter(Boolean);
  if (tokens.length) await currentScene.deleteEmbeddedDocuments("Token", [...new Set(tokens)]);
  const regions = Array.from(currentScene?.regions ?? [])
    .filter(region => region.flags?.[MODULE_ID]?.[TEST_FLAG] && String(region.name ?? "").startsWith(TEST_PREFIX))
    .map(region => region.id)
    .filter(Boolean);
  if (regions.length) await currentScene.deleteEmbeddedDocuments("Region", [...new Set(regions)]);
}

function observe(behaviorKey, { sourceRegion, destinationRegion, token, actor, actorEffectIdsBefore, actorEffectIdsInside, actorEffectIdsAfterExit, darknessBefore, darknessAfter, darknessExpected, targetBehavior, scrollingTextCalls, macroCallsBefore, scriptCallsBefore, terrainEffects, weatherSuppressionBefore, weatherSuppressionAfter, surfaceBefore, surfaceAfter, surfaceExpected }) {
  if (behaviorKey === "teleport") return {
    passed: tokenIsInside(destinationRegion, token),
    detail: "Token reached the destination Region."
  };
  if (behaviorKey === "active-effects") {
    const after = actorEffectIdsInside ?? new Set(Array.from(actor?.effects ?? []).map(effect => effect.id));
    const afterExit = actorEffectIdsAfterExit ?? after;
    const added = [...after].filter(id => !actorEffectIdsBefore.has(id));
    const removedOnExit = added.length > 0 && added.every(id => !afterExit.has(id));
    return {
      passed: added.length > 0 && removedOnExit,
      detail: removedOnExit
        ? "Token Actor received the copied Active Effect and it was removed on exit."
        : "Token Actor received a copied Active Effect, but removal on exit was not observed."
    };
  }
  if (behaviorKey === "darkness") {
    const passed = Number.isFinite(darknessAfter)
      && Number.isFinite(darknessExpected)
      && Math.abs(darknessAfter - darknessExpected) < 0.01;
    return {
      passed,
      detail: passed
        ? `Canvas darkness reached ${darknessAfter.toFixed(2)} inside the Region.`
        : `Canvas darkness changed from ${Number.isFinite(darknessBefore) ? darknessBefore.toFixed(2) : "unknown"} to ${Number.isFinite(darknessAfter) ? darknessAfter.toFixed(2) : "unknown"}; expected ${Number.isFinite(darknessExpected) ? darknessExpected.toFixed(2) : "unknown"}.`
    };
  }
  if (behaviorKey === "toggle-behavior") return {
    passed: targetBehavior?.disabled === true,
    detail: targetBehavior?.disabled === true
      ? "The target Region Behavior was disabled on Token entry."
      : "The target Region Behavior did not become disabled on Token entry."
  };
  if (behaviorKey === "scrolling-text") return {
    passed: scrollingTextCalls > 0,
    detail: scrollingTextCalls > 0
      ? "Foundry's native scrolling-text renderer was called for the Token entry."
      : "The Token entered the Region, but Foundry's scrolling-text renderer was not called."
  };
  if (behaviorKey === "execute-macro") {
    const macroCallsAfter = Number(globalThis.__regionwrightTestMacroCalls ?? 0);
    return {
      passed: macroCallsAfter > macroCallsBefore,
      detail: macroCallsAfter > macroCallsBefore
        ? "The reviewed test Macro executed once on Token entry."
        : "The reviewed test Macro did not record an execution on Token entry."
    };
  }
  if (behaviorKey === "execute-script") {
    const scriptCallsAfter = Number(globalThis.__regionwrightTestScriptCalls ?? 0);
    return {
      passed: scriptCallsAfter > scriptCallsBefore,
      detail: scriptCallsAfter > scriptCallsBefore
        ? "The explicitly approved test Script executed once on Token entry."
        : "The explicitly approved test Script did not record an execution on Token entry."
    };
  }
  if (["movement-cost", "difficult-terrain"].includes(behaviorKey)) return {
    passed: terrainEffects.length > 0,
    detail: terrainEffects.length > 0
      ? `Foundry returned ${terrainEffects.length} native terrain effect${terrainEffects.length === 1 ? "" : "s"} for the entered Token.`
      : "Foundry returned no native terrain effect for the entered Token."
  };
  if (behaviorKey === "suppress-weather") return {
    passed: weatherSuppressionAfter > weatherSuppressionBefore,
    detail: weatherSuppressionAfter > weatherSuppressionBefore
      ? "Foundry created a local weather suppression mesh for the Region."
      : "The Region entered, but no local weather suppression mesh was observed."
  };
  if (behaviorKey === "define-surface") {
    const matching = surfaceAfter.find(surface => surface.region?.uuid === sourceRegion?.uuid);
    const matchesConfiguration = matching
      && matching.light === surfaceExpected.light
      && matching.move === surfaceExpected.move
      && matching.sight === surfaceExpected.sight
      && matching.sound === surfaceExpected.sound
      && matching.occlusion === surfaceExpected.occlusion;
    return {
      passed: surfaceAfter.length > surfaceBefore.length && Boolean(matchesConfiguration),
      detail: matchesConfiguration
        ? "Foundry registered the Region surface with the reviewed interaction flags."
        : "The Region entered, but its reviewed surface flags were not observed in Scene.getSurfaces()."
    };
  }
  if (behaviorKey === "change-level") return {
    passed: false,
    detail: "The Scene Level prompt requires a user decision; complete the prompt check in the two-step browser gate."
  };
  return {
    passed: false,
    detail: "The Token entered the test Region; complete the listed visual or player-client check."
  };
}

/**
 * Create short-lived documents in the active Scene, install a native behavior,
 * and move a Token into the Region. Behaviors without a deterministic local
 * observation remain needs-review so saved data is never mistaken for proof
 * that a visual, movement, or player-client-only effect worked.
 */
export async function runRegionBehaviorIntegrationTest({
  behaviorKey,
  parameters = {},
  actor = null,
  effectUuid = "",
  targetBehaviorUuid = "",
  approvedMacro = false,
  macroUuid = "",
  approvedScript = false,
  scriptSource = "",
  playerClient = false,
  weather = false,
  bounds = DEFAULT_BOUNDS,
  cleanup = true,
  scene = globalThis.canvas?.scene,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true
} = {}) {
  const definition = getBehaviorDefinition(behaviorKey);
  const profile = integrationTestProfile(behaviorKey);
  if (!definition || !profile) throw new Error("Choose a supported Regionwright behavior to test.");
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can run Regionwright integration tests.");
  if (!writesEnabled) throw new Error("Enable Regionwright Region writes before running an integration test.");
  const resolvedScene = activeScene(scene);
  const missing = requiredInputs(profile, {
    actor, effectUuid, targetBehaviorUuid: behaviorKey === "toggle-behavior" ? true : targetBehaviorUuid,
    approvedMacro, approvedScript, playerClient, weather
  });
  if (missing.length) return {
    behaviorKey,
    status: "blocked",
    ready: false,
    reason: `This test requires: ${missing.join(", ")}.`,
    checks: profile.checks
  };
  if (behaviorKey === "execute-script" && !scriptSource) return {
    behaviorKey,
    status: "blocked",
    ready: false,
    reason: "This test requires an explicitly reviewed Script source.",
    checks: profile.checks
  };
  if (behaviorKey === "execute-macro" && !macroUuid) return {
    behaviorKey,
    status: "blocked",
    ready: false,
    reason: "This test requires the UUID of an explicitly reviewed test Macro.",
    checks: profile.checks
  };

  const artifacts = { sourceRegion: null, destinationRegion: null, token: null };
  let movementResult = null;
  let movementTokenPosition = null;
  let movementPathLength = null;
  const actorEffectIdsBefore = new Set(Array.from(actor?.effects ?? []).map(effect => effect.id));
  let darknessBefore = Number(globalThis.canvas?.darknessLevel);
  const macroCallsBefore = Number(globalThis.__regionwrightTestMacroCalls ?? 0);
  const scriptCallsBefore = Number(globalThis.__regionwrightTestScriptCalls ?? 0);
  const weatherSuppressionBefore = Number(globalThis.canvas?.weather?.suppression?.children?.length ?? 0);
  const surfaceBefore = Array.from(resolvedScene.getSurfaces?.() ?? []);
  const nativeScrollingTextRenderer = behaviorKey === "scrolling-text" ? globalThis.canvas?.interface?.createScrollingText : null;
  let scrollingTextCalls = 0;
  try {
    if (typeof nativeScrollingTextRenderer === "function") {
      globalThis.canvas.interface.createScrollingText = function (...args) {
        scrollingTextCalls += 1;
        return nativeScrollingTextRenderer.apply(this, args);
      };
    }
    const createdSource = await resolvedScene.createEmbeddedDocuments("Region", [{
      name: testName(behaviorKey), shapes: [rect(bounds.x, bounds.y, bounds.width, bounds.height)], flags: testFlagData()
    }]);
    artifacts.sourceRegion = createdSource[0];
    if (behaviorKey === "toggle-behavior" && !targetBehaviorUuid) {
      const createdTarget = await artifacts.sourceRegion.createEmbeddedDocuments("RegionBehavior", [{
        name: testName(behaviorKey, "Target"),
        type: "pauseGame",
        disabled: false,
        system: { once: false },
        flags: testFlagData()
      }]);
      targetBehaviorUuid = createdTarget[0]?.uuid ?? "";
    }
    if (behaviorKey === "teleport") {
      const createdDestination = await resolvedScene.createEmbeddedDocuments("Region", [{
        name: testName(behaviorKey, "Destination"),
        shapes: [rect(bounds.destinationX, bounds.destinationY, bounds.width, bounds.height)], flags: testFlagData()
      }]);
      artifacts.destinationRegion = createdDestination[0];
    }
    const tokenData = {
      name: testName(behaviorKey, "Token"), x: 0, y: 0, width: 1, height: 1,
      actorId: actor?.id ?? null, flags: testFlagData()
    };
    artifacts.token = (await resolvedScene.createEmbeddedDocuments("Token", [tokenData]))[0];
    await waitForTokenPlaceable(artifacts.token);
    darknessBefore = localDarknessAtToken(artifacts.token);
    const plan = createPlan({
      sceneUuid: resolvedScene.uuid,
      regions: [{ uuid: artifacts.sourceRegion.uuid, id: artifacts.sourceRegion.id, name: artifacts.sourceRegion.name, sceneUuid: resolvedScene.uuid }],
      behaviorKey,
      parameters: baseParameters(behaviorKey, parameters, { destinationRegion: artifacts.destinationRegion, effectUuid, targetBehaviorUuid, macroUuid, scriptSource })
    });
    plan.approval.gmReviewed = true;
    await applyPlan(plan, { regions: [artifacts.sourceRegion], activeSceneUuid: resolvedScene.uuid, writesEnabled: true });
    const behavior = Array.from(artifacts.sourceRegion.behaviors ?? []).find(entry => entry.type === definition.type);
    if (!behavior) throw new Error("Foundry did not create the requested Region Behavior.");

    const movementBehavior = ["movement-cost", "difficult-terrain"].includes(behaviorKey);
    if (movementBehavior) {
      const runtimeToken = canvasTokenFor(artifacts.token);
      runtimeToken?.control?.({ releaseOthers: false, pan: false });
      movementResult = await artifacts.token.move({ ...insidePosition(bounds), action: defaultMovementAction() || "walk" });
      await new Promise(resolve => setTimeout(resolve, 1000));
      movementTokenPosition = { x: artifacts.token.x, y: artifacts.token.y };
    } else {
      await artifacts.token.update(insidePosition(bounds));
    }
    await waitForRegionEvents(behaviorKey, baseParameters(behaviorKey, parameters, {
      destinationRegion: artifacts.destinationRegion, effectUuid, targetBehaviorUuid
    }));
    const entered = tokenIsInside(artifacts.sourceRegion, artifacts.token);
    if (!entered && behaviorKey !== "teleport") throw new Error("The test Token did not enter the test Region.");
    const actorEffectIdsInside = actorEffectIds(actor, artifacts.token);
    let actorEffectIdsAfterExit = actorEffectIdsInside;
    if (behaviorKey === "active-effects") {
      await artifacts.token.update({ x: 0, y: 0 });
      await waitForRegionEvents(behaviorKey);
      actorEffectIdsAfterExit = actorEffectIds(actor, artifacts.token);
    }
    const darknessAfter = localDarknessAtToken(artifacts.token);
    const weatherSuppressionAfter = Number(globalThis.canvas?.weather?.suppression?.children?.length ?? 0);
    const surfaceAfter = Array.from(resolvedScene.getSurfaces?.() ?? []);
    const surfaceExpected = {
      light: parameters?.light ?? true,
      move: parameters?.move ?? true,
      sight: parameters?.sight ?? true,
      sound: parameters?.sound ?? true,
      occlusion: parameters?.occlusion ?? true
    };
    const darknessMode = parameters?.mode ?? "override";
    const darknessModifier = Number(parameters?.modifier ?? 0.5);
    const darknessExpected = darknessMode === "brighten"
      ? Math.max(0, darknessBefore - darknessModifier)
      : darknessMode === "darken"
        ? Math.min(1, darknessBefore + darknessModifier)
        : darknessModifier;
    const targetBehavior = behaviorKey === "toggle-behavior"
      ? Array.from(artifacts.sourceRegion.behaviors ?? []).find(entry => entry.uuid === targetBehaviorUuid)
        ?? await globalThis.fromUuid?.(targetBehaviorUuid)
      : null;
    let terrainEffects = [];
    if (["movement-cost", "difficult-terrain"].includes(behaviorKey)) {
      const runtimeToken = canvasTokenFor(artifacts.token) ?? artifacts.token;
      const movementAction = defaultMovementAction() || "walk";
      if (typeof runtimeToken?.createTerrainMovementPath === "function") {
        const path = runtimeToken.createTerrainMovementPath([
          { x: 0, y: 0 },
          { ...insidePosition(bounds), action: movementAction }
        ], { preview: false });
        movementPathLength = path.length;
        terrainEffects = path.flatMap(waypoint => {
          const terrain = waypoint?.terrain;
          if (!terrain) return [];
          const serialized = terrain.toObject?.();
          if (serialized) return [serialized];
          return (terrain.effects ?? []).map(effect => effect?.toObject?.() ?? {
            action: effect?.action,
            cost: effect?.cost,
            difficult: effect?.difficult,
            regionUuid: effect?.region?.uuid ?? effect?.regionUuid
          });
        });
      }
      if (typeof behavior._getTerrainEffects === "function") {
        const shape = runtimeToken?.getShape?.() ?? runtimeToken?.shape ?? runtimeToken?.document?.getShape?.();
        const actions = Object.keys(globalThis.CONFIG?.Token?.movement?.actions ?? {}).filter(action => action !== "displace");
        for (const action of [...new Set([movementAction, ...actions].filter(Boolean))]) {
          if (terrainEffects.length) break;
          try {
            const effects = behavior._getTerrainEffects(runtimeToken.document ?? runtimeToken, {
              ...insidePosition(bounds), action, width: artifacts.token.width, height: artifacts.token.height, shape,
              elevation: artifacts.token.elevation ?? 0, level: runtimeToken.document?.level ?? "",
              preview: false
            }, {});
            if (effects?.length) {
              terrainEffects = effects.map(effect => effect?.toObject?.() ?? {
                action: effect?.action,
                cost: effect?.cost,
                difficult: effect?.difficult,
                regionUuid: effect?.region?.uuid ?? effect?.regionUuid
              });
              break;
            }
          } catch (error) {
            console.debug(`${MODULE_ID} terrain probe skipped ${action}.`, error);
          }
        }
      }
    }
    const observation = observe(behaviorKey, { ...artifacts, actor, actorEffectIdsBefore, actorEffectIdsInside, actorEffectIdsAfterExit, darknessBefore, darknessAfter, darknessExpected, targetBehavior, scrollingTextCalls, macroCallsBefore, scriptCallsBefore, terrainEffects, weatherSuppressionBefore, weatherSuppressionAfter, surfaceBefore, surfaceAfter, surfaceExpected });
    const status = observation.passed ? "passed" : "needs-review";
    return {
      behaviorKey,
      status,
      ready: observation.passed,
      behaviorUuid: behavior.uuid,
      tokenUuid: artifacts.token.uuid,
      enteredRegion: entered,
      observation: observation.detail,
      ...(behaviorKey === "darkness" ? { darknessBefore, darknessAfter, darknessExpected } : {}),
      ...(behaviorKey === "active-effects" ? {
        activeEffectIdsBefore: [...actorEffectIdsBefore],
        activeEffectIdsInside: [...actorEffectIdsInside],
        activeEffectIdsAfterExit: [...actorEffectIdsAfterExit]
      } : {}),
      ...(movementBehavior ? { movementResult, movementTokenPosition, movementPathLength } : {}),
      ...(behaviorKey === "scrolling-text" ? { scrollingTextCalls } : {}),
      ...(behaviorKey === "execute-macro" ? { macroCallsBefore, macroCallsAfter: Number(globalThis.__regionwrightTestMacroCalls ?? 0) } : {}),
      ...(behaviorKey === "execute-script" ? { scriptCallsBefore, scriptCallsAfter: Number(globalThis.__regionwrightTestScriptCalls ?? 0) } : {}),
      ...(behaviorKey === "suppress-weather" ? { weatherSuppressionBefore, weatherSuppressionAfter } : {}),
      ...(behaviorKey === "toggle-behavior" ? { targetBehaviorUuid, targetBehaviorType: targetBehavior?.type ?? null, targetBehaviorDisabled: targetBehavior?.disabled ?? null, activeGM: Boolean(globalThis.game?.user?.isActiveGM), toggleSystem: { events: [...(behavior.system?.events ?? [])], enable: [...(behavior.system?.enable ?? [])], disable: [...(behavior.system?.disable ?? [])] } } : {}),
      ...(behaviorKey === "define-surface" ? (() => {
        const surface = surfaceAfter.find(entry => entry.region?.uuid === artifacts.sourceRegion.uuid);
        return {
          surfaceBefore: surfaceBefore.length,
          surfaceAfter: surfaceAfter.length,
          surface: surface ? {
            key: surface.key,
            elevation: surface.elevation,
            light: surface.light,
            move: surface.move,
            sight: surface.sight,
            sound: surface.sound,
            occlusion: surface.occlusion,
            exposure: surface.exposure,
            culling: surface.culling
          } : null
        };
      })() : {}),
      ...(["movement-cost", "difficult-terrain"].includes(behaviorKey) ? { terrainEffects: structuredClone(terrainEffects) } : {}),
      ...(["movement-cost", "difficult-terrain"].includes(behaviorKey) ? {
        terrainActions: Object.keys(globalThis.CONFIG?.Token?.movement?.actions ?? {}),
        behaviorSystem: structuredClone(behavior.system ?? {})
      } : {}),
      checks: observation.passed ? [] : profile.checks,
      artifactsKept: !cleanup
    };
  } catch (error) {
    return { behaviorKey, status: "failed", ready: false, reason: error.message, checks: profile.checks };
  } finally {
    if (typeof nativeScrollingTextRenderer === "function") globalThis.canvas.interface.createScrollingText = nativeScrollingTextRenderer;
    if (cleanup) await deleteArtifacts(resolvedScene, artifacts);
  }
}

/**
 * Run the teleport path with source and destination Regions on different
 * Scenes. This is intentionally separate from the single-Scene routine so a
 * passing local teleport test can never hide a broken Scene transition.
 */
export async function runSceneToSceneTeleportTest({
  sourceScene = globalThis.canvas?.scene,
  destinationScene = Array.from(globalThis.game?.scenes ?? []).find(scene => scene.uuid !== sourceScene?.uuid),
  bounds = DEFAULT_BOUNDS,
  cleanup = true,
  writesEnabled = globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) === true,
  transitionDuration = 500
} = {}) {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can run Regionwright integration tests.");
  if (!writesEnabled) throw new Error("Region writes are disabled. Enable the module's opt-in world setting first.");
  if (!sourceScene?.uuid || !destinationScene?.uuid || sourceScene.uuid === destinationScene.uuid) {
    return { behaviorKey: "teleport", status: "blocked", ready: false, reason: "Choose two different Scenes with the source Scene active." };
  }
  if (globalThis.canvas?.scene?.uuid !== sourceScene.uuid) {
    return { behaviorKey: "teleport", status: "blocked", ready: false, reason: "The source Scene must be active before running the cross-Scene test." };
  }

  const artifacts = { sourceRegion: null, destinationRegion: null, token: null, destinationToken: null };
  const tokenName = testName("teleport", "Scene-to-Scene Token");
  try {
    const createdSource = await sourceScene.createEmbeddedDocuments("Region", [{
      name: testName("teleport", "Source"), shapes: [rect(bounds.x, bounds.y, bounds.width, bounds.height)], flags: testFlagData()
    }]);
    artifacts.sourceRegion = createdSource[0];
    const createdDestination = await destinationScene.createEmbeddedDocuments("Region", [{
      name: testName("teleport", "Destination"), shapes: [rect(bounds.destinationX, bounds.destinationY, bounds.width, bounds.height)], flags: testFlagData()
    }]);
    artifacts.destinationRegion = createdDestination[0];
    artifacts.token = (await sourceScene.createEmbeddedDocuments("Token", [{
      name: tokenName, x: 0, y: 0, width: 1, height: 1, flags: testFlagData()
    }]))[0];
    await waitForTokenPlaceable(artifacts.token);

    const plan = createPlan({
      sceneUuid: sourceScene.uuid,
      regions: [{ uuid: artifacts.sourceRegion.uuid, id: artifacts.sourceRegion.id, name: artifacts.sourceRegion.name, sceneUuid: sourceScene.uuid }],
      behaviorKey: "teleport",
      parameters: baseParameters("teleport", { transitionDuration }, { destinationRegion: artifacts.destinationRegion })
    });
    plan.approval.gmReviewed = true;
    await applyPlan(plan, { regions: [artifacts.sourceRegion], activeSceneUuid: sourceScene.uuid, writesEnabled: true });
    const behavior = Array.from(artifacts.sourceRegion.behaviors ?? []).find(entry => entry.type === "teleportToken");
    if (!behavior) throw new Error("Foundry did not create the cross-Scene Teleport Token Behavior.");

    await artifacts.token.update(insidePosition(bounds));
    await waitForScene(destinationScene, Math.max(5000, transitionDuration + 1500));
    artifacts.destinationToken = await waitForNamedToken(destinationScene, tokenName, Math.max(5000, transitionDuration + 1500));
    const passed = Boolean(artifacts.destinationToken && tokenIsInside(artifacts.destinationRegion, artifacts.destinationToken));
    return {
      behaviorKey: "teleport",
      status: passed ? "passed" : "failed",
      ready: passed,
      sourceSceneUuid: sourceScene.uuid,
      destinationSceneUuid: destinationScene.uuid,
      sourceRegionUuid: artifacts.sourceRegion.uuid,
      destinationRegionUuid: artifacts.destinationRegion.uuid,
      behaviorUuid: behavior.uuid,
      destinationTokenUuid: artifacts.destinationToken?.uuid ?? null,
      sceneSwitched: globalThis.canvas?.scene?.uuid === destinationScene.uuid || globalThis.game?.scenes?.active?.uuid === destinationScene.uuid,
      destinationContainsToken: Boolean(artifacts.destinationToken && tokenIsInside(artifacts.destinationRegion, artifacts.destinationToken)),
      artifactsKept: !cleanup
    };
  } catch (error) {
    return { behaviorKey: "teleport", status: "failed", ready: false, reason: error.message };
  } finally {
    if (cleanup) {
      try {
        await deleteSceneArtifacts(sourceScene, artifacts);
        await deleteSceneArtifacts(destinationScene, artifacts);
      } catch (error) {
        console.error(`${MODULE_ID} cross-Scene teleport cleanup could not remove every flagged artifact.`, error);
      }
      try {
        if (globalThis.canvas?.scene?.uuid === destinationScene.uuid) await sourceScene.view?.();
      } catch (error) {
        console.error(`${MODULE_ID} could not restore the source Scene after the cross-Scene test.`, error);
      }
    }
  }
}

export async function runRegionwrightIntegrationSuite({ cases = {}, ...options } = {}) {
  const results = [];
  for (const definition of BEHAVIOR_DEFINITIONS) {
    results.push(await runRegionBehaviorIntegrationTest({ ...options, ...(cases[definition.key] ?? {}), behaviorKey: definition.key }));
  }
  return { ready: integrationSuiteReady(results), results };
}
