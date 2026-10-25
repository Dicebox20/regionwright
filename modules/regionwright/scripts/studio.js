import { MODULE_ID } from "./constants.js";

export const STUDIO_SCHEMA_VERSION = "1.0";
export const STUDIO_NODE_KINDS = Object.freeze(["trigger", "condition", "action", "state"]);

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const BASE_CAPABILITIES = Object.freeze({
  edition: "assistant",
  preview: true,
  visualGraph: false,
  scenarioAuthoring: false,
  maxNodes: 4,
  maxSavedBlueprints: 1,
  crossScene: false,
  conditions: false,
  state: false,
  playtestTrace: false,
  importExport: false
});

const PREMIUM_CAPABILITIES = Object.freeze({
  edition: "studio",
  preview: true,
  visualGraph: true,
  scenarioAuthoring: true,
  maxNodes: Infinity,
  maxSavedBlueprints: Infinity,
  crossScene: true,
  conditions: true,
  state: true,
  playtestTrace: true,
  importExport: true
});

function clone(value) {
  return structuredClone(value ?? {});
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function text(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function stableId(value, label) {
  const id = text(value);
  if (!ID_PATTERN.test(id)) throw new Error(`${label} must use letters, numbers, dots, dashes, or underscores.`);
  return id;
}

function normalizeScene(scene, index) {
  if (!plainObject(scene)) throw new Error(`Studio Scene ${index + 1} must be an object.`);
  const uuid = text(scene.uuid);
  if (!uuid) throw new Error(`Studio Scene ${index + 1} requires a UUID.`);
  return { uuid, name: text(scene.name, "Unnamed Scene") };
}

function normalizeNode(node, index) {
  if (!plainObject(node)) throw new Error(`Studio node ${index + 1} must be an object.`);
  const id = stableId(node.id, `Studio node ${index + 1} id`);
  const kind = text(node.kind).toLowerCase();
  if (!STUDIO_NODE_KINDS.includes(kind)) throw new Error(`Studio node ${id} has an unsupported kind.`);
  const config = node.config ?? node.parameters ?? {};
  if (!plainObject(config)) throw new Error(`Studio node ${id} configuration must be an object.`);
  return {
    id,
    kind,
    type: text(node.type, kind),
    label: text(node.label, id),
    sceneUuid: text(node.sceneUuid) || null,
    config: clone(config),
    position: {
      x: Number.isFinite(Number(node.position?.x)) ? Number(node.position.x) : 0,
      y: Number.isFinite(Number(node.position?.y)) ? Number(node.position.y) : 0
    }
  };
}

function normalizeEdge(edge, index) {
  if (!plainObject(edge)) throw new Error(`Studio edge ${index + 1} must be an object.`);
  const from = stableId(edge.from, `Studio edge ${index + 1} source`);
  const to = stableId(edge.to, `Studio edge ${index + 1} destination`);
  if (from === to) throw new Error(`Studio edge ${from} cannot connect a node to itself.`);
  return { id: text(edge.id) || `${from}->${to}`, from, to, label: text(edge.label) };
}

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeDeep(child);
  return value;
}

/**
 * Normalize and validate the portable document used by Regionwright Studio.
 * This is intentionally separate from a native Region Behavior plan: a
 * blueprint describes intent and references, while the Assistant plan is the
 * reviewed, one-behavior write payload.
 */
export function validateScenarioBlueprint(input, { capabilities = BASE_CAPABILITIES } = {}) {
  if (!plainObject(input)) throw new Error("A Studio scenario blueprint is required.");
  if (input.schemaVersion !== STUDIO_SCHEMA_VERSION) throw new Error(`Unsupported Studio blueprint schema: ${input.schemaVersion ?? "missing"}.`);
  if (input.moduleId !== MODULE_ID) throw new Error("This Studio blueprint belongs to a different module.");
  const id = stableId(input.id, "Studio blueprint id");
  const name = text(input.name);
  if (!name) throw new Error("A Studio blueprint needs a name.");
  const scenes = (input.scenes ?? []).map(normalizeScene);
  const sceneUuids = new Set(scenes.map(scene => scene.uuid));
  const nodes = (input.nodes ?? []).map(normalizeNode);
  if (!nodes.length) throw new Error("A Studio blueprint needs at least one node.");
  if (Number.isFinite(capabilities.maxNodes) && nodes.length > capabilities.maxNodes) {
    throw new Error(`This edition supports at most ${capabilities.maxNodes} Studio nodes.`);
  }
  const nodeIds = new Set();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Studio node id ${node.id} is duplicated.`);
    nodeIds.add(node.id);
    if (node.sceneUuid && sceneUuids.size && !sceneUuids.has(node.sceneUuid)) throw new Error(`Studio node ${node.id} references an unlisted Scene.`);
  }
  const edges = (input.edges ?? []).map(normalizeEdge);
  const edgeIds = new Set();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Studio edge id ${edge.id} is duplicated.`);
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) throw new Error(`Studio edge ${edge.id} references a missing node.`);
    edgeIds.add(edge.id);
  }
  const edition = input.edition === "premium" ? "premium" : "free";
  if (edition === "premium" && capabilities.edition !== "studio") throw new Error("This Studio blueprint requires the Studio module.");
  if (!capabilities.crossScene && new Set(nodes.map(node => node.sceneUuid).filter(Boolean)).size > 1) {
    throw new Error("Cross-Scene Studio blueprints require Regionwright Studio.");
  }
  return freezeDeep({
    schemaVersion: STUDIO_SCHEMA_VERSION,
    moduleId: MODULE_ID,
    id,
    name,
    description: text(input.description),
    edition,
    status: ["draft", "ready", "published"].includes(input.status) ? input.status : "draft",
    scenes,
    nodes,
    edges,
    variables: clone(input.variables ?? {}),
    metadata: clone(input.metadata ?? {})
  });
}

export function createScenarioBlueprint(input = {}, options = {}) {
  return validateScenarioBlueprint({
    schemaVersion: STUDIO_SCHEMA_VERSION,
    moduleId: MODULE_ID,
    status: "draft",
    ...clone(input)
  }, options);
}

export function serializeScenarioBlueprint(input, options = {}) {
  return JSON.stringify(validateScenarioBlueprint(input, options), null, 2);
}

/** The included, publishable included Studio activity. */
export function createStarterScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "pressure-plate-alarm",
    name: "Pressure Plate Alarm",
    description: "A pressure plate displays a warning and pauses the game once.",
    edition: "free",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "plate", kind: "trigger", type: "tokenEnter", label: "Token enters pressure plate", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "warning", kind: "action", type: "displayScrollingText", label: "Display warning", sceneUuid, config: { text: "A hidden mechanism clicks.", once: true }, position: { x: 360, y: 80 } },
      { id: "pause", kind: "action", type: "pauseGame", label: "Pause for the GM", sceneUuid, config: { once: true }, position: { x: 360, y: 220 } }
    ],
    edges: [
      { id: "plate-warning", from: "plate", to: "warning" },
      { id: "plate-pause", from: "plate", to: "pause" }
    ],
    metadata: { starter: true, source: "regionwright-assistant" }
  });
}

/** The useful, publishable included Studio sample: a reveal-and-narration moment. */
export function createSceneMomentScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "scene-moment",
    name: "Scene Moment",
    description: "Enter an area, reveal hidden creatures, and show a short message.",
    edition: "free",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "moment-region", kind: "trigger", type: "tokenEnter", label: "Player enters the area", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "reveal", kind: "action", type: "revealHiddenTokens", label: "Reveal hidden creatures", sceneUuid, config: { targetType: "token", targetUuids: [] }, position: { x: 360, y: 80 } },
      { id: "narration", kind: "action", type: "displayScrollingText", label: "Show a message", sceneUuid, config: { text: "The shadows stir.", once: true }, position: { x: 360, y: 220 } }
    ],
    edges: [{ id: "area-reveal", from: "moment-region", to: "reveal" }, { id: "reveal-narration", from: "reveal", to: "narration" }],
    metadata: { starter: true, source: "regionwright-assistant" }
  });
}

/** A beginner-friendly named template for the included hidden-creature reveal. */
export function createSecretRevealScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  const base = structuredClone(createSceneMomentScenarioBlueprint({ sceneUuid, sceneName }));
  return createScenarioBlueprint({
    ...base,
    name: "Reveal a Secret",
    description: "Enter an area, reveal hidden creatures, and show a clue.",
    nodes: base.nodes.map(node => node.id === "narration" ? { ...node, config: { ...node.config, text: "A secret is revealed." } } : node),
    metadata: { ...base.metadata, template: "secret-reveal" }
  });
}

/** Free room-change template built from the bounded hidden-object reveal path. */
export function createRoomTransformationScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  const base = structuredClone(createSecretRevealScenarioBlueprint({ sceneUuid, sceneName }));
  return createScenarioBlueprint({
    ...base,
    name: "Room Transformation",
    description: "Enter an area, reveal hidden room features, and show a message.",
    nodes: base.nodes.map(node => node.id === "narration" ? { ...node, config: { ...node.config, text: "The room changes." } } : node),
    metadata: { ...base.metadata, template: "room-transformation" }
  });
}

/**
 * The first Studio-only building block. It deliberately stays small: one
 * clearly marked area, one message, and one optional pause. The same portable
 * graph shape is used by the later multi-scene storyboard tools.
 */
export function createStoryBeatScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "story-beat",
    name: "Story Beat",
    description: "Enter an area, show a message, and pause for the table.",
    edition: "premium",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "beat-region", kind: "trigger", type: "tokenEnter", label: "Player enters the area", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "beat-message", kind: "action", type: "displayScrollingText", label: "Show a message", sceneUuid, config: { text: "Something changes.", once: true }, position: { x: 360, y: 80 } },
      { id: "beat-pause", kind: "action", type: "pauseGame", label: "Pause for the table", sceneUuid, config: { once: true }, position: { x: 360, y: 220 } }
    ],
    edges: [{ id: "beat-message-edge", from: "beat-region", to: "beat-message" }, { id: "beat-pause-edge", from: "beat-region", to: "beat-pause" }],
    metadata: { starter: true, source: "regionwright-studio", template: "story-beat" }
  }, { capabilities: PREMIUM_CAPABILITIES });
}

/** Premium cross-Scene portal template. The destination Scene is chosen in the guided UI. */
export function createPortalScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "scene-portal",
    name: "Scene Portal",
    description: "Enter an area and travel to an arrival area on another Scene.",
    edition: "premium",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "portal-entry", kind: "trigger", type: "tokenEnter", label: "Player enters the portal", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "portal-arrival", kind: "action", type: "teleportToken", label: "Move to the arrival area", sceneUuid: null, config: { targetType: "region", targetSceneUuid: null }, position: { x: 360, y: 140 } }
    ],
    edges: [{ id: "portal-travel", from: "portal-entry", to: "portal-arrival" }],
    metadata: { starter: true, source: "regionwright-studio", template: "scene-portal" }
  }, { capabilities: PREMIUM_CAPABILITIES });
}

/** Premium progress-marker template used by key gates and hub restoration. */
export function createStoryFactScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "story-fact",
    name: "Story Fact",
    description: "Enter an area, mark a named story fact, and show a message.",
    edition: "premium",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "fact-region", kind: "trigger", type: "tokenEnter", label: "Player enters the area", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "set-fact", kind: "action", type: "setStoryFact", label: "Mark a story fact", sceneUuid, config: { factId: "", label: "" }, position: { x: 360, y: 80 } },
      { id: "fact-message", kind: "action", type: "displayScrollingText", label: "Show a message", sceneUuid, config: { text: "Something has changed.", once: true }, position: { x: 360, y: 220 } }
    ],
    edges: [{ id: "fact-set", from: "fact-region", to: "set-fact" }, { id: "fact-message-edge", from: "set-fact", to: "fact-message" }],
    metadata: { starter: true, source: "regionwright-studio", template: "story-fact" }
  }, { capabilities: PREMIUM_CAPABILITIES });
}

/** Premium multi-objective gate: every selected story fact unlocks one Door. */
export function createHubUnlockScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  return createScenarioBlueprint({
    id: "hub-unlock",
    name: "Hub Unlock",
    description: "When all named objectives are complete, unlock a Door.",
    edition: "premium",
    scenes: [{ uuid: sceneUuid, name: sceneName }],
    nodes: [
      { id: "hub-region", kind: "trigger", type: "tokenEnter", label: "Player enters the final area", sceneUuid, config: { targetType: "region" }, position: { x: 80, y: 140 } },
      { id: "hub-facts", kind: "condition", type: "allStoryFacts", label: "All objectives are complete", sceneUuid, config: { factIds: [] }, position: { x: 330, y: 80 } },
      { id: "hub-door", kind: "action", type: "openDoor", label: "Unlock the Door", sceneUuid, config: { targetType: "door", targetUuid: "" }, position: { x: 600, y: 80 } },
      { id: "hub-message", kind: "action", type: "displayScrollingText", label: "Show a message", sceneUuid, config: { text: "The way forward opens.", once: true }, position: { x: 600, y: 220 } }
    ],
    edges: [{ id: "hub-check", from: "hub-region", to: "hub-facts" }, { id: "hub-unlock-door", from: "hub-facts", to: "hub-door" }, { id: "hub-message-edge", from: "hub-door", to: "hub-message" }],
    metadata: { starter: true, source: "regionwright-studio", template: "hub-unlock" }
  }, { capabilities: PREMIUM_CAPABILITIES });
}

/** Premium single-objective gate: use one named Story Fact as a symbolic key. */
export function createKeyGateScenarioBlueprint({ sceneUuid = "Scene.demo", sceneName = "Demo Scene" } = {}) {
  const base = structuredClone(createHubUnlockScenarioBlueprint({ sceneUuid, sceneName }));
  return createScenarioBlueprint({
    ...base,
    name: "Symbolic Key Gate",
    description: "When a named key is found, unlock a selected Door.",
    nodes: base.nodes.map(node => node.id === "hub-facts" ? { ...node, label: "The key has been found" } : node),
    metadata: { ...base.metadata, template: "key-gate" }
  }, { capabilities: PREMIUM_CAPABILITIES });
}

export function createStudioService() {
  const extensions = new Map();
  const capabilities = () => {
    const premium = [...extensions.values()].find(extension => extension.edition === "premium");
    return Object.freeze({ ...(premium ? PREMIUM_CAPABILITIES : BASE_CAPABILITIES), extensions: [...extensions.keys()] });
  };
  return Object.freeze({
    schemaVersion: STUDIO_SCHEMA_VERSION,
    nodeKinds: STUDIO_NODE_KINDS,
    create: (input = {}, options = {}) => createScenarioBlueprint(input, { ...options, capabilities: capabilities() }),
    validate: (input, options = {}) => validateScenarioBlueprint(input, { ...options, capabilities: capabilities() }),
    serialize: (input, options = {}) => serializeScenarioBlueprint(input, { ...options, capabilities: capabilities() }),
    starter: createStarterScenarioBlueprint,
    sceneMoment: createSceneMomentScenarioBlueprint,
    secretReveal: createSecretRevealScenarioBlueprint,
    roomTransformation: createRoomTransformationScenarioBlueprint,
    storyBeat: createStoryBeatScenarioBlueprint,
    portal: createPortalScenarioBlueprint,
    storyFact: createStoryFactScenarioBlueprint,
    hubUnlock: createHubUnlockScenarioBlueprint,
    keyGate: createKeyGateScenarioBlueprint,
    capabilities,
    register(extension) {
      if (!plainObject(extension) || !ID_PATTERN.test(text(extension.id))) throw new Error("A Studio extension needs a stable id.");
      if (extensions.has(extension.id)) throw new Error(`Studio extension ${extension.id} is already registered.`);
      const stored = Object.freeze({
        id: text(extension.id),
        title: text(extension.title, extension.id),
        edition: extension.edition === "premium" ? "premium" : "free",
        open: typeof extension.open === "function" ? extension.open : null
      });
      extensions.set(stored.id, stored);
      return () => extensions.delete(stored.id);
    },
    extensions() {
      return Object.freeze([...extensions.values()]);
    },
    async open(extensionId, context = {}) {
      const extension = extensions.get(text(extensionId));
      if (!extension?.open) throw new Error("That Studio extension is not available.");
      return extension.open(context);
    }
  });
}

export const studioService = createStudioService();
