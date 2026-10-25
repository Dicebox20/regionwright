import { behaviorCatalog, getBehaviorDefinition } from "./catalog.js";
import { buildCapabilitySnapshot } from "./capabilities.js";
import { captureSelection } from "./selection.js";
import { createPlan } from "./plan.js";
import { applyPlan } from "./write.js";
import { configurePitfallTrap, PITFALL_TRAP_KEY } from "./pitfall-trap.js";
import { studioService } from "./studio.js";
import { createStoryFactStore, storyFactId } from "./studio-facts.js";
import { compileScenarioBlueprint } from "./studio-compiler.js";
import { createStudioDraftStore } from "./studio-storage.js";
import { buildPressurePlateActivityPlans, clearPressurePlateActivity, publishPressurePlateActivity } from "./studio-activity.js";
import { buildSceneMomentActivityPlans, clearSceneMomentActivity, publishSceneMomentActivity } from "./studio-scene-moment.js";
import { buildStoryBeatActivityPlans, clearStoryBeatActivity, publishStoryBeatActivity } from "./studio-story-beat.js";
import { buildScenePortalActivityPlan, clearScenePortalActivity, publishScenePortalActivity } from "./studio-portal.js";
import { buildStoryFactActivityPlans, clearStoryFactActivity, publishStoryFactActivity } from "./studio-story-fact.js";
import { buildHubUnlockActivityPlans, clearHubUnlockActivity, publishHubUnlockActivity } from "./studio-hub-unlock.js";
import { diagnoseStudioBlueprint } from "./studio-diagnostics.js";
import { bossEngine } from "./boss-engine.js";

export const TOPICS = Object.freeze([
  { id: "home", label: "Start", icon: "fa-solid fa-compass", description: "Choose what you want to build.", status: "home" },
  { id: "puzzles", label: "Traps", icon: "fa-solid fa-person-falling", description: "Configure Studio-owned traps and open the optional Puzzles & Locks module.", status: "available" },
  { id: "native", label: "Region Assistant", icon: "fa-solid fa-wand-sparkles", description: "Add built-in behaviors to a Region.", status: "available" },
  { id: "traversal", label: "Portals & Travel", icon: "fa-solid fa-route", description: "Teleport Tokens, change Scene Levels, or link Regions.", status: "available" },
  { id: "boss", label: "Boss Engine", icon: "fa-solid fa-spider", description: "Prepare and run the Prime Arachnid encounter.", status: "available" },
  { id: "studio", label: "Studio", icon: "fa-solid fa-diagram-project", description: "Create and save a simple visual scenario draft.", status: "available" },
  { id: "world", label: "Scene Tools", icon: "fa-solid fa-cubes", description: "Change selected Tokens, Tiles, Doors, Walls, or Documents.", status: "planned" },
  { id: "hazards", label: "Advanced Traps", icon: "fa-solid fa-shield-halved", description: "Build damage, saves, encounter triggers, and combat actions.", status: "planned" },
  { id: "presentation", label: "Text & Visuals", icon: "fa-solid fa-eye", description: "Add text, sound, visuals, Journals, and Scene focus.", status: "planned" },
  { id: "integrations", label: "System & Module Tools", icon: "fa-solid fa-plug", description: "Use optional system and module capabilities.", status: "planned" }
]);

export function mergeSelection(current = [], additions = []) {
  const byUuid = new Map(current.map(region => [region.uuid, region]));
  for (const region of additions) if (region?.uuid) byUuid.set(region.uuid, region);
  return [...byUuid.values()];
}

export function reorderSelection(selection = [], uuid, direction) {
  const index = selection.findIndex(region => region.uuid === uuid);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= selection.length) return [...selection];
  const result = [...selection];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}

/**
 * Build lightweight, UUID-backed references from the active Scene. This is the
 * explicit picker path: it does not alter a Region or depend on the canvas
 * control state, so it remains reliable when the Builder covers the canvas.
 */
export function sceneRegionReferences(canvasState = globalThis.canvas) {
  return regionReferencesForScene(canvasState?.scene);
}

/**
 * Region references grouped by Scene for prompt-based choices such as a
 * teleport destination. UUIDs stay in state; the player only sees names.
 */
export function sceneGroupedRegionReferences(canvasState = globalThis.canvas, gameState = globalThis.game) {
  return scenesForBrowser(canvasState, gameState).map(scene => ({
    sceneUuid: scene.uuid,
    sceneName: String(scene.name ?? "Unnamed Scene"),
    regions: regionReferencesForScene(scene)
  }));
}

function regionReferencesForScene(scene) {
  const collection = scene?.regions;
  const documents = Array.from(collection?.values?.() ?? collection ?? []);
  return documents
    .filter(region => region?.documentName === "Region" && region?.uuid)
    .map(region => ({
      uuid: region.uuid,
      id: region.id,
      name: region.name?.trim?.() || `Region ${region.id}`,
      sceneUuid: scene?.uuid
    }))
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: "base" }));
}

function scenesForBrowser(canvasState = globalThis.canvas, gameState = globalThis.game) {
  const activeScene = canvasState?.scene;
  const scenes = Array.from(gameState?.scenes?.values?.() ?? gameState?.scenes ?? []);
  if (activeScene && !scenes.some(scene => scene?.uuid === activeScene.uuid)) scenes.push(activeScene);
  return scenes.filter(scene => scene?.uuid).sort((first, second) => {
    if (first.uuid === activeScene?.uuid) return -1;
    if (second.uuid === activeScene?.uuid) return 1;
    return String(first.name ?? "").localeCompare(String(second.name ?? ""), undefined, { sensitivity: "base" });
  });
}

function browserScene(state, canvasState = globalThis.canvas, gameState = globalThis.game) {
  const scenes = scenesForBrowser(canvasState, gameState);
  return scenes.find(scene => scene.uuid === state.browserSceneUuid) ?? canvasState?.scene ?? scenes[0] ?? null;
}

const TARGET_TYPES = Object.freeze([
  { id: "region", label: "Region", icon: "fa-draw-polygon", collection: "regions", documentName: "Region" },
  { id: "actor", label: "Actor", icon: "fa-user", collection: "actors", documentName: "Actor" },
  { id: "token", label: "Creature", icon: "fa-chess-pawn", collection: "tokens", documentName: "Token" },
  { id: "door", label: "Door", icon: "fa-door-closed", collection: "walls", documentName: "Wall" },
  { id: "wall", label: "Wall", icon: "fa-grip-lines-vertical", collection: "walls", documentName: "Wall" },
  { id: "tile", label: "Tile", icon: "fa-image", collection: "tiles", documentName: "Tile" }
]);

function targetTypeById(id) {
  return TARGET_TYPES.find(type => type.id === id) ?? TARGET_TYPES[0];
}

const LOCATOR_COLORS = Object.freeze({
  region: 0xe6b85c,
  door: 0xff6b5f,
  tile: 0x65b7ff,
  actor: 0xc58cff,
  token: 0xc58cff,
  wall: 0xff9f5f
});

function numericPoint(value) {
  if (!value || !Number.isFinite(Number(value.x)) || !Number.isFinite(Number(value.y))) return null;
  return { x: Number(value.x), y: Number(value.y) };
}

/** Honor the operating system motion preference for map locator feedback. */
export function usesReducedMotion(matchMedia = globalThis.matchMedia) {
  try { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)")?.matches === true; } catch { return false; }
}

function placeableBounds(placeable) {
  const bounds = placeable?.bounds;
  if (bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every(value => Number.isFinite(Number(value)))) {
    return { x: Number(bounds.x), y: Number(bounds.y), width: Number(bounds.width), height: Number(bounds.height) };
  }
  const document = placeable?.document;
  if (document && [document.x, document.y, document.width, document.height].every(value => Number.isFinite(Number(value)))) {
    return { x: Number(document.x), y: Number(document.y), width: Number(document.width), height: Number(document.height) };
  }
  return null;
}

function locatorAnchor(placeable, type) {
  const coordinates = placeable?.document?.c;
  if (type === "door" && Array.isArray(coordinates) && coordinates.length >= 4 && coordinates.every(value => Number.isFinite(Number(value)))) {
    return { x: (Number(coordinates[0]) + Number(coordinates[2])) / 2, y: (Number(coordinates[1]) + Number(coordinates[3])) / 2 };
  }
  // Foundry offsets the Door-control icon from the actual Wall. The Wall
  // midpoint is the unambiguous location users see on the Scene.
  const controlPosition = type === "door" ? numericPoint(placeable?.doorControl?.position) : null;
  if (controlPosition) return controlPosition;
  // Tile placeables can report bounds in local texture space, offset from the
  // Scene document. Their document rectangle is the stable Scene-space source.
  const tile = placeable?.document;
  if (type === "tile" && [tile?.x, tile?.y, tile?.width, tile?.height].every(value => Number.isFinite(Number(value)))) {
    return { x: Number(tile.x) + (Number(tile.width) / 2), y: Number(tile.y) + (Number(tile.height) / 2) };
  }
  const bounds = placeableBounds(placeable);
  if (bounds) return { x: bounds.x + (bounds.width / 2), y: bounds.y + (bounds.height / 2) };
  const center = numericPoint(placeable?.center);
  if (center) return center;
  return null;
}

function drawLocatorShape(graphics, placeable, type, anchor, color) {
  const bounds = placeableBounds(placeable);
  if ((type === "region" || type === "tile" || type === "actor") && bounds) {
    graphics.lineStyle(5, color, 0.95);
    graphics.drawRoundedRect(bounds.x - anchor.x, bounds.y - anchor.y, Math.max(24, bounds.width), Math.max(24, bounds.height), 10);
  }
  if (type === "door") {
    const coordinates = placeable?.document?.c;
    if (Array.isArray(coordinates) && coordinates.length >= 4) {
      graphics.lineStyle(7, color, 0.95);
      graphics.moveTo(Number(coordinates[0]) - anchor.x, Number(coordinates[1]) - anchor.y);
      graphics.lineTo(Number(coordinates[2]) - anchor.x, Number(coordinates[3]) - anchor.y);
    }
  }
}

function createLocatorBeacon({ uuid, type, label, placeable }) {
  const canvas = globalThis.canvas;
  const PIXI = globalThis.PIXI;
  const parent = canvas?.interface;
  const anchor = locatorAnchor(placeable, type);
  if (!PIXI?.Container || !PIXI?.Graphics || !parent?.addChild || !anchor) return null;
  const color = LOCATOR_COLORS[type] ?? LOCATOR_COLORS.region;
  const root = new PIXI.Container();
  root.name = `RegionwrightLocator:${type}:${uuid}`;
  root.position.set(anchor.x, anchor.y);
  root.zIndex = 100000;
  const shape = new PIXI.Graphics();
  drawLocatorShape(shape, placeable, type, anchor, color);
  shape.beginFill(color, 0.22);
  shape.lineStyle(4, color, 1);
  shape.drawCircle(0, 0, 32);
  shape.lineStyle(3, 0xffffff, 0.9);
  shape.drawCircle(0, 0, 40);
  shape.endFill();
  const text = new PIXI.Text(String(label ?? type).trim() || type, {
    fontFamily: "Candara, Segoe UI, sans-serif",
    fontSize: 22,
    fontWeight: "700",
    fill: 0xffffff,
    stroke: 0x1a1113,
    strokeThickness: 5,
    align: "center"
  });
  text.anchor.set(0.5, 0);
  text.position.set(0, -72);
  root.addChild(shape, text);
  parent.addChild(root);
  return { root, shape, text, color, baseScale: 1 };
}

function collectionDocuments(collection) {
  return Array.from(collection?.values?.() ?? collection ?? []);
}

function documentReference(document, type, sceneUuid) {
  if (!document?.uuid) return null;
  const fallback = `${type.label} ${document.id ?? ""}`.trim();
  return {
    uuid: document.uuid,
    id: document.id,
    name: String(document.name ?? document.label ?? fallback),
    type: type.id,
    sceneUuid: document.parent?.uuid ?? sceneUuid ?? null
  };
}

/**
 * UUID-only references for documents that may be used by later adapters.
 * Only Regions are sent to the native Region Behavior plan or write pipeline.
 */
export function targetReferences(typeId, { canvasState = globalThis.canvas, gameState = globalThis.game } = {}) {
  const type = targetTypeById(typeId);
  const scene = canvasState?.scene;
  const collection = type.id === "actor" ? gameState?.actors : scene?.[type.collection];
  const documents = collectionDocuments(collection)
    .filter(document => document?.documentName === type.documentName && document?.uuid && (type.id !== "door" || Number(document.door ?? 0) > 0))
    .sort((first, second) => String(first.id ?? "").localeCompare(String(second.id ?? ""), undefined, { sensitivity: "base" }));
  return documents
    .map((document, index) => {
      const reference = documentReference(document, type, scene?.uuid);
      const hasName = String(document.name ?? document.label ?? "").trim().length > 0;
      if (reference && type.id === "door" && !hasName) reference.name = `Door ${String.fromCharCode(65 + index)}`;
      return reference;
    })
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: "base" }));
}

/** Visible Scene Token references for bounded Studio reveal recipes. */
export function sceneTokenReferences(canvasState = globalThis.canvas) {
  const scene = canvasState?.scene;
  return collectionDocuments(scene?.tokens)
    .filter(token => token?.documentName === "Token" && token?.uuid)
    .map((token, index) => ({ uuid: token.uuid, id: token.id, name: String(token.name ?? token.actor?.name ?? `Creature ${index + 1}`), type: "token", sceneUuid: scene?.uuid, hidden: token.hidden === true }))
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: "base" }));
}

/** Visible Scene Tile references for Secret Reveal. */
export function sceneTileReferences(canvasState = globalThis.canvas) {
  const scene = canvasState?.scene;
  return collectionDocuments(scene?.tiles)
    .filter(tile => tile?.documentName === "Tile" && tile?.uuid)
    .map((tile, index) => ({ uuid: tile.uuid, id: tile.id, name: String(tile.name ?? `Tile ${index + 1}`), type: "tile", sceneUuid: scene?.uuid, hidden: tile.hidden === true }))
    .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: "base" }));
}

function sceneActorReferences(scene) {
  const actors = new Map();
  for (const token of collectionDocuments(scene?.tokens)) {
    const actor = token?.actor;
    if (actor?.uuid && !actors.has(actor.uuid)) actors.set(actor.uuid, {
      uuid: actor.uuid,
      id: actor.id,
      name: actor.name?.trim?.() || `Actor ${actor.id}`,
      type: "actor",
      sceneUuid: scene?.uuid
    });
  }
  return [...actors.values()].sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: "base" }));
}

const EVENTS = Object.freeze([
  ["tokenEnter", "Token Enters"],
  ["tokenExit", "Token Exits"],
  ["tokenMoveIn", "Token Moves In"],
  ["tokenMoveOut", "Token Moves Out"],
  ["tokenMoveWithin", "Token Moves Within"],
  ["tokenAnimateIn", "Token Animates In"],
  ["tokenAnimateOut", "Token Animates Out"],
  ["tokenTurnStart", "Token Starts Turn"],
  ["tokenTurnEnd", "Token Ends Turn"],
  ["tokenRoundStart", "Token Starts Round"],
  ["tokenRoundEnd", "Token Ends Round"],
  ["behaviorActivated", "Behavior Activates"],
  ["behaviorDeactivated", "Behavior Deactivates"],
  ["behaviorViewed", "Behavior Is Viewed"],
  ["behaviorUnviewed", "Behavior Is Unviewed"],
  ["regionBoundary", "Region Boundary Changes"],
  ["regionAnimation", "Region Animation Changes"]
]);

const SCROLLING_TEXT_EVENTS = Object.freeze(["tokenAnimateIn", "tokenAnimateOut", "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"]);
const TOGGLE_BEHAVIOR_EVENTS = Object.freeze(["tokenEnter", "tokenExit", "tokenMoveIn", "tokenMoveOut", "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"]);

const NATIVE_CATEGORY_ORDER = Object.freeze([
  ["environment", "Environment & Terrain"],
  ["feedback", "Messages & Game Flow"],
  ["effects", "Conditions & Active Effects"],
  ["system", "System Behaviors"],
  ["advanced", "Macros & Scripts (GM review)"]
]);

const NATIVE_CATEGORY_GUIDANCE = Object.freeze({
  environment: {
    icon: "fa-mountain-sun",
    question: "Shape the environment",
    description: "Darkness, barriers, weather, and movement."
  },
  feedback: {
    icon: "fa-comment-dots",
    question: "Send a message or pause",
    description: "Display Floating Text or pause the game when a Region triggers."
  },
  effects: {
    icon: "fa-wand-magic-sparkles",
    question: "Apply a condition",
    description: "Apply existing Active Effects while Tokens are in the Region."
  },
  system: {
    icon: "fa-dice-d20",
    question: "Apply a system rule",
    description: "Use rules supplied by the active game system."
  },
  advanced: {
    icon: "fa-code",
    question: "Run a Macro or Script",
    description: "Use an existing Macro or a reviewed GM script."
  }
});

const FRIENDLY_BEHAVIOR_HINTS = Object.freeze({
  darkness: "Set this Region's local darkness level.",
  "active-effects": "Apply existing Active Effects while Tokens are in this Region.",
  "define-surface": "Make this Region act like a floor, ceiling, or barrier.",
  "scrolling-text": "Display Floating Text when a Token moves or takes a turn.",
  "difficult-terrain": "Apply D&D5e Difficult Terrain to this Region.",
  "execute-macro": "Run a Macro you already created and reviewed.",
  "execute-script": "Run GM-only script you personally reviewed.",
  "movement-cost": "Change Movement Cost for each Token action in this Region.",
  pause: "Pause the game when the Region is triggered.",
  "suppress-weather": "Hide weather effects inside this Region.",
  "change-level": "Move Tokens between Scene Levels.",
  teleport: "Teleport Tokens to another Region.",
  "toggle-behavior": "Enable or disable other Region Behaviors."
});

const QUICK_START_EFFECTS = Object.freeze([
  { key: "darkness", label: "Darkness & Light", description: "Set a Region's local darkness level.", icon: "fa-moon" },
  { key: "define-surface", label: "Floor, Ceiling, or Barrier", description: "Make a Region act like a floor, ceiling, or barrier.", icon: "fa-cube" },
  { key: "scrolling-text", label: "Floating Text", description: "Display text when a Token moves or starts a turn.", icon: "fa-comment-dots" },
  { key: "pause", label: "Pause Game", description: "Pause the game when a Token triggers this Region.", icon: "fa-pause" },
  { key: "active-effects", label: "Apply a Condition", description: "Give Tokens a selected condition or effect while they are in a Region.", icon: "fa-wand-magic-sparkles" },
  { key: "difficult-terrain", label: "D&D5e Difficult Terrain", description: "Use D&D5e's Difficult Terrain rule in this Region.", icon: "fa-mountain" },
  { key: "movement-cost", label: "Custom Movement Cost", description: "Set a custom movement penalty for this Region.", icon: "fa-person-walking" },
  { key: "suppress-weather", label: "Suppress Weather", description: "Hide weather effects inside a Region.", icon: "fa-cloud-sun" }
]);

const BEHAVIOR_ICONS = Object.freeze({
  darkness: "fa-moon",
  "active-effects": "fa-wand-magic-sparkles",
  "change-level": "fa-layer-group",
  "define-surface": "fa-cube",
  "scrolling-text": "fa-comment-dots",
  "difficult-terrain": "fa-mountain",
  "execute-macro": "fa-scroll",
  "execute-script": "fa-code",
  "movement-cost": "fa-person-walking",
  pause: "fa-pause",
  "suppress-weather": "fa-cloud-sun",
  teleport: "fa-door-open",
  "toggle-behavior": "fa-toggle-on"
});

/**
 * The beginner path is a product contract, not a convenience layer. Every
 * Region Behavior in the catalog must declare its own short prompt chain.
 * That keeps a newly added native behavior from silently becoming a dense,
 * all-fields form.
 */
export const REGION_BEHAVIOR_RECIPES = Object.freeze({
  darkness: [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should become darker or brighter." },
    { id: "darkness", title: "Set darkness", prompt: "Use the slider to set the local darkness level." }
  ],
  "scrolling-text": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should show Floating Text." },
    { id: "trigger", title: "", prompt: "Choose when the Floating Text should appear." },
    { id: "message", title: "Write the message", prompt: "Type the short message players should see." }
  ],
  "active-effects": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should apply a condition." },
    { id: "reference", title: "", prompt: "Choose the condition or effect Tokens gain while they are in this Region." }
  ],
  "change-level": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region where Tokens can change Scene Level." },
    { id: "actions", title: "Choose movement", prompt: "Choose which movement action can change the Token's Scene Level." }
  ],
  "define-surface": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should become a surface or barrier." },
    { id: "surface", title: "", prompt: "Choose whether this Region is a floor, ceiling, or both." }
  ],
  "difficult-terrain": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should use Difficult Terrain." },
    { id: "terrain-kind", title: "", prompt: "Is this ordinary or magical Difficult Terrain?" }
  ],
  "execute-macro": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should run a Macro." },
    { id: "reference", title: "Choose the Macro", prompt: "Choose a Macro you already created and reviewed." },
    { id: "trigger", title: "Choose the trigger", prompt: "Choose when the Macro should run." }
  ],
  "execute-script": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should run this GM script." },
    { id: "script", title: "Add the script", prompt: "Paste only script source you personally reviewed." },
    { id: "trigger", title: "Choose the trigger", prompt: "Choose when the script should run." }
  ],
  "movement-cost": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region with a different Movement Cost." },
    { id: "movement", title: "Set Movement Cost", prompt: "Set how much each movement action costs in this Region." }
  ],
  pause: [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should pause the game." },
    { id: "frequency", title: "", prompt: "How often should the game pause?" }
  ],
  "suppress-weather": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should block weather effects." }
  ],
  teleport: [
    { id: "regions", title: "Choose the source Region", prompt: "" },
    { id: "destination", title: "Choose the destination", prompt: "" },
    { id: "arrival", title: "Choose arrival style", prompt: "Choose where inside the destination Region Tokens should arrive." }
  ],
  "toggle-behavior": [
    { id: "regions", title: "Choose the Region", prompt: "Click the Region that should control another Behavior." },
    { id: "reference", title: "Choose Behaviors", prompt: "Choose the Region Behaviors this Region should turn on or off." },
    { id: "trigger", title: "Choose the trigger", prompt: "Choose when the Region should change those Behaviors." }
  ]
});

export function recipeForBehavior(entry) {
  return REGION_BEHAVIOR_RECIPES[entry?.key] ?? null;
}

function recipeStep(state, entry) {
  const steps = recipeForBehavior(entry);
  if (!steps?.length) return { steps: [], index: 0, step: null };
  const index = Math.max(0, Math.min(Number(state.recipeStep ?? 0), steps.length - 1));
  return { steps, index, step: steps[index] };
}

/**
 * A guided route describes the controls a GM follows outside the prompt.
 * Add future cross-menu paths here so the Builder can highlight the menu,
 * document tab, and list in that order instead of merely naming a target.
 */
function guideRouteFor(state, recipe) {
  if (state.pitfallGuideOpen && Number(state.pitfallStep) === 0) return { topic: "puzzles", pickerType: "region" };
  if (!state.guideOpen || !recipe?.step) return null;
  if (recipe.step.id === "regions") return { topic: state.topic, pickerType: "region" };
  return null;
}

function entriesForTopic(topicId, catalog) {
  if (topicId === "native") return catalog.filter(entry => NATIVE_CATEGORY_ORDER.some(([category]) => category === entry.category));
  if (topicId === "traversal") return catalog.filter(entry => entry.category === "traversal");
  return [];
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function eventParameters(parameters = {}) {
  return {
    ...parameters,
    events: Array.isArray(parameters.events) && parameters.events.length ? parameters.events : ["tokenEnter"]
  };
}

function defaultParameters(key) {
  const parameters = eventParameters({});
  if (key === "scrolling-text") parameters.events = ["tokenAnimateIn"];
  if (["scrolling-text", "pause"].includes(key)) parameters.once = false;
  if (key === "scrolling-text") {
    parameters.text = "A Region Behavior is triggered.";
    parameters.visibility = "all";
    parameters.color = "#ffffff";
  }
  if (key === "darkness") {
    parameters.mode = "override";
    parameters.modifier = 0;
  }
  if (key === "active-effects") parameters.effectsText = "";
  if (key === "change-level") parameters.movementActionsText = Object.keys(globalThis.CONFIG?.Token?.movement?.actions ?? {})[0] ?? "move";
  if (key === "define-surface") Object.assign(parameters, { placement: "bottom", light: true, move: true, sight: true, sound: true, occlusion: true, exposure: false, culling: false });
  if (key === "movement-cost") parameters.difficulties = {};
  if (key === "difficult-terrain") Object.assign(parameters, { magical: false, typesText: "", ignoredDispositionsText: "" });
  if (key === "execute-macro") Object.assign(parameters, { uuid: "", everyone: false });
  if (key === "execute-script") Object.assign(parameters, { source: "", scriptAcknowledged: false });
  if (key === "teleport") Object.assign(parameters, { destinationsText: "", placement: "random", snap: true, choice: false, revealed: false, dialogRevealed: "", dialogUnrevealed: "", transitionType: "", transitionDuration: 1500 });
  if (key === "toggle-behavior") Object.assign(parameters, { enableText: "", disableText: "" });
  return parameters;
}

export function createBuilderState({ canvasState = globalThis.canvas, config = globalThis.CONFIG } = {}) {
  const catalog = behaviorCatalog({ config });
  const nativeEntries = entriesForTopic("native", catalog);
  const preferred = nativeEntries.find(entry => entry.key === "scrolling-text");
  const firstAvailable = preferred?.available && preferred.writable !== false
    ? preferred
    : nativeEntries.find(entry => entry.available && entry.writable !== false) ?? nativeEntries[0] ?? catalog[0];
  return {
    topic: "home",
    // Keep the plan empty on open. The GM explicitly adds the currently
    // controlled canvas documents so the right-side list is always deliberate.
    selection: [],
    behaviorKey: firstAvailable?.key ?? "scrolling-text",
    parameters: defaultParameters(firstAvailable?.key ?? "scrolling-text"),
    effectChosen: false,
    nativeView: "start",
    nativeCategory: null,
    traversalView: "effects",
    recipeStep: 0,
    regionPickerMode: "create",
    regionReferenceMode: {},
    referenceSceneUuid: canvasState?.scene?.uuid ?? "",
    regionCreatePending: null,
    referencePicker: null,
    link: { sourceUuid: "", targetUuid: "", enabled: false, bidirectional: false, teleport: false, preserveOrder: true },
    pickerOpen: false,
    pickerType: "region",
    browserSceneUuid: canvasState?.scene?.uuid ?? "",
    actorScope: "scene",
    regionRenames: {},
    renameRegionUuid: null,
    targets: [],
    pitfallGuideOpen: false,
    pitfallStep: 0,
    pitfallDc: 15,
    pitfallDamage: "2d6",
    studioView: "home",
    studioBlueprint: null,
    studioSelectedNodeId: null,
    studioCompilation: null,
    studioDirty: false,
    plan: null,
    lastApply: null,
    guideOpen: false,
    openDropdown: null,
    previewed: false,
    gmReviewed: false,
    status: { kind: "info", text: "Start with a trap or choose a Region Behavior. You can do either first." }
  };
}

/** Return a completed guided workflow to its uncluttered starting menu. */
export function resetAfterGuidedApply(state) {
  state.effectChosen = false;
  if (state.topic === "native") state.nativeView = "start";
  if (state.topic === "traversal") state.traversalView = "start";
  return state;
}

function topicById(id) {
  return TOPICS.find(topic => topic.id === id) ?? TOPICS[0];
}

function renderTopicNav(state, guideRoute = null) {
  const topicButton = topic => `<button type="button" class="rbb-topic ${topic.id === state.topic ? "is-active" : ""} ${guideRoute?.topic === topic.id ? "is-guided-target" : ""}" data-action="topic" data-topic="${escapeHTML(topic.id)}" title="${escapeHTML(topic.description)}" aria-label="${escapeHTML(topic.label)}"><span class="rbb-topic-icon"><i class="${escapeHTML(topic.icon)}" aria-hidden="true"></i></span><span class="rbb-topic-copy"><strong>${escapeHTML(topic.label)}</strong></span></button>`;
  const home = TOPICS.find(topic => topic.status === "home");
  const ready = TOPICS.filter(topic => topic.status === "available");
  const future = TOPICS.filter(topic => topic.status === "planned");
  const futureOpen = future.some(topic => topic.id === state.topic);
  return `${home ? topicButton(home) : ""}${ready.map(topicButton).join("")}<details class="rbb-future-menu" ${futureOpen ? "open" : ""}><summary>More tools</summary><div>${future.map(topicButton).join("")}</div></details>`;
}

function helpTooltip(text) {
  const escaped = escapeHTML(text);
  return `<span class="rbb-help-tooltip" tabindex="0" role="note" title="${escaped}" data-tooltip="${escaped}" aria-label="${escaped}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>`;
}

function renderDropdown({ label = "", value, options, state, key, binding = "parameter", ariaLabel = label }) {
  const id = `${binding}:${key}`;
  const selected = options.find(option => String(option.value) === String(value)) ?? options[0] ?? { value: "", label: "Choose" };
  const open = state.openDropdown === id;
  const hidden = binding === "parameter" ? `data-parameter="${escapeHTML(key)}"` : `data-input="${escapeHTML(key)}"`;
  const menu = open
    ? `<div class="rbb-dropdown-menu" role="listbox" aria-label="${escapeHTML(ariaLabel)}">${options.map(option => `<button type="button" class="rbb-dropdown-option ${String(option.value) === String(selected.value) ? "is-selected" : ""}" role="option" aria-selected="${String(option.value) === String(selected.value)}" data-action="choose-dropdown" data-dropdown-id="${escapeHTML(id)}" data-dropdown-binding="${escapeHTML(binding)}" data-dropdown-key="${escapeHTML(key)}" data-dropdown-value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</button>`).join("")}</div>`
    : "";
  return `<div class="rbb-field rbb-dropdown">${label ? `<span>${escapeHTML(label)}</span>` : ""}<input type="hidden" ${hidden} value="${escapeHTML(selected.value)}"><button type="button" class="rbb-dropdown-toggle" data-action="toggle-dropdown" data-dropdown-id="${escapeHTML(id)}" aria-haspopup="listbox" aria-expanded="${open}" aria-label="${escapeHTML(ariaLabel)}"><span>${escapeHTML(selected.label)}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>${menu}</div>`;
}

function renderEventField(parameters, state, allowedEvents = EVENTS.map(([value]) => value)) {
  const selected = parameters.events?.[0] ?? "tokenEnter";
  const options = EVENTS.filter(([value]) => allowedEvents.includes(value)).map(([value, label]) => ({ value, label }));
  return renderDropdown({ label: "Trigger", value: selected, options, state, key: "events", ariaLabel: "Behavior trigger" });
}

function eventLabel(value) {
  return EVENTS.find(([event]) => event === value)?.[1] ?? "the selected trigger";
}

function plainEffectSummary(state, entry) {
  if (!state.effectChosen) return "Choose a Region Behavior to see what Regionwright will create.";
  const regions = state.selection.map(region => region.name).filter(Boolean);
  if (!regions.length) return `“${entry?.label ?? "This Behavior"}” is ready. Choose one or more Regions next.`;
  const continuous = ["darkness", "define-surface", "movement-cost", "suppress-weather", "difficult-terrain"].includes(entry?.key);
  const when = continuous ? "It stays active while the Behavior is enabled." : `It starts when ${eventLabel(state.parameters.events?.[0])}.`;
  const targets = regions.length === 1 ? regions[0] : `${regions.slice(0, -1).join(", ")} and ${regions.at(-1)}`;
  return `“${entry?.label}” will affect ${targets}. ${when}`;
}

function uuidValues(value = "") {
  return String(value).split(/\r?\n/).map(value => value.trim()).filter(Boolean);
}

function referenceOptions(type, canvasState = globalThis.canvas) {
  const gameState = globalThis.game;
  if (type === "region") return sceneRegionReferences(canvasState);
  if (type === "macro") return collectionDocuments(gameState?.macros).filter(document => document?.uuid).map(document => ({ uuid: document.uuid, name: document.name?.trim?.() || "Unnamed Macro" }));
  if (type === "behavior") {
    return collectionDocuments(canvasState?.scene?.regions).flatMap(region => collectionDocuments(region?.behaviors)
      .filter(behavior => behavior?.uuid)
      .map(behavior => ({ uuid: behavior.uuid, name: `${region.name?.trim?.() || "Unnamed Region"} — ${behavior.name?.trim?.() || behavior.type || "Behavior"}` })));
  }
  if (type === "active-effect") {
    const actors = collectionDocuments(gameState?.actors);
    const sources = [...collectionDocuments(gameState?.items), ...actors, ...actors.flatMap(actor => collectionDocuments(actor?.items))];
    return sources.flatMap(source => collectionDocuments(source?.effects)
      .filter(effect => effect?.uuid)
      .map(effect => ({ uuid: effect.uuid, name: `${source.name?.trim?.() || "Document"} — ${effect.name?.trim?.() || "Active Effect"}` })));
  }
  return [];
}

function renderReferenceField({ label, key, value, hint, type, chooseLabel, single = false, excludeUuids = [], state, canvasState, minimal = false }) {
  const selected = uuidValues(value);
  const excluded = new Set(excludeUuids);
  const options = referenceOptions(type, canvasState).filter(option => !excluded.has(option.uuid));
  const byUuid = new Map(options.map(option => [option.uuid, option]));
  const pickerOpen = state.referencePicker?.key === key;
  const chips = selected.length
    ? selected.map(uuid => `<span class="rbb-reference-chip"><span>${escapeHTML(byUuid.get(uuid)?.name ?? uuid)}</span><button type="button" data-action="remove-reference" data-reference-key="${escapeHTML(key)}" data-reference-uuid="${escapeHTML(uuid)}" title="Remove"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span class="sr-only">Remove</span></button></span>`).join("")
    : minimal ? "" : `<span class="rbb-reference-empty">Nothing chosen yet.</span>`;
  const rows = options.length
    ? options.map(option => `<button type="button" class="rbb-picker-row" data-action="pick-reference" data-reference-key="${escapeHTML(key)}" data-reference-uuid="${escapeHTML(option.uuid)}" data-reference-single="${single}" ${!single && selected.includes(option.uuid) ? "disabled" : ""}><span><strong>${escapeHTML(option.name)}</strong></span><i class="fa-solid ${selected.includes(option.uuid) ? "fa-check" : "fa-plus"}" aria-hidden="true"></i></button>`).join("")
    : `<p class="rbb-picker-empty">Nothing is available to choose in this world yet.</p>`;
  const picker = pickerOpen ? `<div class="rbb-reference-picker" role="region" aria-label="Choose ${escapeHTML(label)}"><div class="rbb-picker-heading"><span>Choose ${escapeHTML(label)}</span><button type="button" data-action="close-reference-picker" title="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span class="sr-only">Close</span></button></div><div class="rbb-picker-list">${rows}</div></div>` : "";
  return `<section class="rbb-reference-field"><span class="rbb-field-label">${escapeHTML(label)} ${minimal ? "" : helpTooltip(hint)}</span>${chips ? `<div class="rbb-reference-list">${chips}</div>` : ""}<button type="button" class="rbb-button rbb-button-secondary" data-action="open-reference-picker" data-reference-key="${escapeHTML(key)}" data-reference-type="${escapeHTML(type)}" data-reference-single="${single}"><i class="fa-solid fa-list-check" aria-hidden="true"></i> ${escapeHTML(chooseLabel)}</button>${picker}</section>`;
}

function renderParameterFields(entry, parameters, state, canvasState, { stepId = "", fineTune = false, minimal = false } = {}) {
  const fields = [];
  const add = (step, markup, { advanced = false } = {}) => {
    if (fineTune ? advanced : step === stepId) fields.push(markup);
  };
  const textList = (label, key, value, hint) => `<label class="rbb-field"><span>${label} ${helpTooltip(hint)}</span><textarea data-parameter="${key}" rows="3" spellcheck="false" placeholder="One value per line">${escapeHTML(value ?? "")}</textarea></label>`;
  const check = (key, label) => `<label class="rbb-check"><input type="checkbox" data-parameter="${key}" ${parameters[key] ? "checked" : ""}><span>${label}</span></label>`;
  const choice = (key, options) => `<div class="rbb-guide-choice-list" role="group">${options.map(option => `<button type="button" class="rbb-guide-choice ${parameters[key] === option.value ? "is-selected" : ""}" data-action="choose-parameter-option" data-parameter-key="${escapeHTML(key)}" data-parameter-value="${escapeHTML(String(option.value))}" aria-pressed="${parameters[key] === option.value}">${option.icon ? `<span class="rbb-guide-choice-icon"><i class="fa-solid ${escapeHTML(option.icon)}" aria-hidden="true"></i></span>` : ""}<span>${escapeHTML(option.label)}</span><i class="fa-solid ${parameters[key] === option.value ? "fa-check" : "fa-chevron-right"}" aria-hidden="true"></i></button>`).join("")}</div>`;
  if (entry.key === "scrolling-text") {
    add("trigger", renderEventField(parameters, state, SCROLLING_TEXT_EVENTS));
    add("message", `<label class="rbb-field">${minimal ? '<span class="sr-only">Floating Text</span>' : `<span>Floating Text ${helpTooltip("Keep it short enough to read at the table.")}</span>`}<textarea data-parameter="text" rows="3" maxlength="240" aria-label="Floating Text" placeholder="Type the message">${escapeHTML(parameters.text)}</textarea></label>`);
    add("advanced", `${renderDropdown({ label: "Visibility", value: parameters.visibility, options: [{ value: "all", label: "Everyone" }, { value: "gm", label: "GM only" }, { value: "observer", label: "Observers" }], state, key: "visibility" })}<label class="rbb-field"><span>Text Color ${helpTooltip("This changes the Floating Text, not Regionwright's colors.")}</span><input type="color" data-parameter="color" value="${escapeHTML(parameters.color ?? "#ffffff")}" aria-label="Text color"></label>${check("once", "Disable this Behavior after it triggers once")}`, { advanced: true });
  }
  if (["execute-macro", "execute-script"].includes(entry.key)) add("trigger", renderEventField(parameters, state));
  if (entry.key === "toggle-behavior") add("trigger", renderEventField(parameters, state, TOGGLE_BEHAVIOR_EVENTS));
  if (entry.key === "pause") {
    add("frequency", choice("once", [
      { value: false, label: "Every time", icon: "fa-repeat" },
      { value: true, label: "Only once", icon: "fa-1" }
    ]));
  }
  if (entry.key === "darkness") {
    const modifier = Math.min(1, Math.max(0, Number(parameters.modifier ?? 0)));
    add("darkness", `<div class="rbb-field-row">${renderDropdown({ label: "Darkness Mode", value: parameters.mode, options: [{ value: "override", label: "Set darkness" }, { value: "brighten", label: "Brighten" }, { value: "darken", label: "Darken" }], state, key: "mode" })}<label class="rbb-field rbb-range-field"><span>Darkness Level <output data-range-value="modifier">${modifier.toFixed(2)}</output> ${minimal ? "" : helpTooltip("0 is unchanged; 1 is the strongest adjustment.")}</span><input type="range" data-parameter="modifier" value="${modifier}" min="0" max="1" step="0.05" aria-label="Darkness level"></label></div>`);
  }
  if (entry.key === "active-effects") add("reference", renderReferenceField({ label: "Active Effects", key: "effectsText", value: parameters.effectsText, hint: "Choose existing Active Effects. They apply on entry and clear on exit.", type: "active-effect", chooseLabel: "Choose Active Effects", state, canvasState, minimal }));
  if (entry.key === "change-level") {
    const actions = Object.entries(globalThis.CONFIG?.Token?.movement?.actions ?? {})
      .filter(([action]) => action !== "displace")
      .map(([value, action]) => ({ value, label: globalThis.game?.i18n?.localize?.(action.label) ?? action.label ?? value }));
    add("actions", renderDropdown({ label: "Movement Action", value: parameters.movementActionsText, options: actions, state, key: "movementActionsText", ariaLabel: "Level change movement action" }));
  }
  if (entry.key === "define-surface") {
    add("surface", choice("placement", [{ value: "bottom", label: "Floor", icon: "fa-arrow-down" }, { value: "top", label: "Ceiling", icon: "fa-arrow-up" }, { value: "both", label: "Floor and ceiling", icon: "fa-arrows-up-down" }]));
    add("advanced", `${check("light", "Block light")}${check("move", "Block movement")}${check("sight", "Block sight")}${check("sound", "Block sound")}${check("occlusion", "Hide things behind it")}${check("exposure", "Expose things behind it")}${check("culling", "Hide unseen parts")}`, { advanced: true });
  }
  if (entry.key === "movement-cost") {
    const actions = Object.keys(globalThis.CONFIG?.Token?.movement?.actions ?? { move: "Move" });
    add("movement", `<div class="rbb-field-row">${actions.map((action, index) => `<label class="rbb-field"><span>${escapeHTML(action)} ${index === 0 && !minimal ? helpTooltip("Set each action's movement-cost multiplier. 1 is normal cost.") : ""}</span><input type="number" data-movement-action="${escapeHTML(action)}" value="${escapeHTML(parameters.difficulties?.[action] ?? 1)}" min="0" max="5" step="0.25"></label>`).join("")}</div>`);
  }
  if (entry.key === "difficult-terrain") {
    add("terrain-kind", choice("magical", [
      { value: false, label: "Ordinary Difficult Terrain", icon: "fa-shoe-prints" },
      { value: true, label: "Magical Difficult Terrain", icon: "fa-wand-magic-sparkles" }
    ]));
    add("advanced", `${textList("Terrain Types", "typesText", parameters.typesText, "Enter D&D5e terrain types, separated by commas. Leave blank for all types.")}${textList("Creatures that ignore terrain", "ignoredDispositionsText", parameters.ignoredDispositionsText, "Enter Foundry Token disposition numbers, separated by commas.")}`, { advanced: true });
  }
  if (entry.key === "execute-macro") {
    add("reference", renderReferenceField({ label: "Macro to run", key: "uuid", value: parameters.uuid, hint: "Choose a Macro you already created and reviewed.", type: "macro", chooseLabel: "Choose Macro", single: true, state, canvasState, minimal }));
    add("advanced", check("everyone", "Run it for every connected user who can use this Macro"), { advanced: true });
  }
  if (entry.key === "execute-script") add("script", `<label class="rbb-field"><span>Script to run</span><textarea data-parameter="source" rows="8" spellcheck="false" placeholder="Paste script source you personally reviewed">${escapeHTML(parameters.source ?? "")}</textarea><small>Foundry runs this as GM-only JavaScript. Only paste code you understand and trust.</small></label>${check("scriptAcknowledged", "I reviewed this script and understand it runs as the GM")}`);
  if (entry.key === "teleport") {
    add("destination", renderTeleportDestinationField({ state, parameters, canvasState }));
    add("arrival", renderDropdown({ label: "Arrival Location", value: parameters.placement, options: [{ value: "random", label: "Random location" }, { value: "center", label: "Region center" }, { value: "relative", label: "Matching location" }], state, key: "placement" }));
    add("advanced", `<label class="rbb-field"><span>Transition Duration (ms)</span><input type="number" data-parameter="transitionDuration" value="${escapeHTML(parameters.transitionDuration)}" min="500" max="10000" step="100"></label>${check("snap", "Snap the Token to the grid")}${check("choice", "Let the player choose a destination")}${check("revealed", "Include hidden destinations in that choice")}<label class="rbb-field"><span>Known Destination Prompt</span><input type="text" data-parameter="dialogRevealed" value="${escapeHTML(parameters.dialogRevealed)}"></label><label class="rbb-field"><span>Hidden Destination Prompt</span><input type="text" data-parameter="dialogUnrevealed" value="${escapeHTML(parameters.dialogUnrevealed)}"></label><label class="rbb-field"><span>Scene Transition</span><input type="text" data-parameter="transitionType" value="${escapeHTML(parameters.transitionType)}" placeholder="Leave blank for none"></label>`, { advanced: true });
  }
  if (entry.key === "toggle-behavior") add("reference", `${renderReferenceField({ label: "Behaviors to turn on", key: "enableText", value: parameters.enableText, hint: "Choose Region Behaviors to activate.", type: "behavior", chooseLabel: "Choose Behaviors", state, canvasState, minimal })}${renderReferenceField({ label: "Behaviors to turn off", key: "disableText", value: parameters.disableText, hint: "Choose Region Behaviors to deactivate.", type: "behavior", chooseLabel: "Choose Behaviors", state, canvasState, minimal })}`);
  return fields.join("");
}

function renderBehaviorOption(entry, { selected = false, reserved = false } = {}) {
  const available = entry.available && entry.writable !== false && !reserved;
  const status = reserved ? "Reserved" : entry.writable === false ? "Planned" : entry.available ? "Available" : "Unavailable";
  const hint = FRIENDLY_BEHAVIOR_HINTS[entry.key] ?? entry.parameterHint;
  const icon = reserved || !entry.available ? "fa-lock" : BEHAVIOR_ICONS[entry.key] ?? "fa-wand-magic-sparkles";
  return `<button type="button" class="rbb-category-option rbb-behavior-option ${selected ? "is-selected" : ""}" data-action="behavior" data-behavior-key="${escapeHTML(entry.key)}" ${available ? "" : "disabled"} title="${escapeHTML(`${entry.label} — ${hint} (${status})`)}"><span class="rbb-category-icon"><i class="fa-solid ${escapeHTML(icon)}" aria-hidden="true"></i></span><span><strong>${escapeHTML(entry.label)}</strong></span><span class="rbb-status-dot ${available ? "is-live" : "is-muted"}" title="${escapeHTML(status)}"><span class="sr-only">${escapeHTML(status)}</span></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`;
}

function recipeStepError(entry, stepId, state) {
  if (!entry) return "Choose a Region Behavior first.";
  if (!recipeForBehavior(entry)) return `${entry.label} does not have a guided setup yet.`;
  const parameters = state.parameters ?? {};
  if (stepId === "regions" && !state.selection.length) return "Draw a new Region or choose an existing one.";
  if (entry.key === "scrolling-text" && stepId === "message" && !String(parameters.text ?? "").trim()) return "Write the Floating Text before continuing.";
  if (entry.key === "active-effects" && stepId === "reference" && !uuidValues(parameters.effectsText).length) return "Choose at least one Active Effect.";
  if (entry.key === "execute-macro" && stepId === "reference" && !String(parameters.uuid ?? "").trim()) return "Choose a Macro before continuing.";
  if (entry.key === "execute-script" && stepId === "script") {
    if (!String(parameters.source ?? "").trim()) return "Add the script source before continuing.";
    if (!parameters.scriptAcknowledged) return "Confirm that you reviewed the GM script before continuing.";
  }
  if (entry.key === "teleport" && stepId === "destination" && !uuidValues(parameters.destinationsText).length) return "Choose a destination Region before continuing.";
  if (entry.key === "toggle-behavior" && stepId === "reference" && !uuidValues(parameters.enableText).length && !uuidValues(parameters.disableText).length) return "Choose at least one Region Behavior to change.";
  return null;
}

function recipeReadyToReview(state, entry) {
  if (!entry) return false;
  const { steps, index } = recipeStep(state, entry);
  return Boolean(steps.length) && index === steps.length - 1 && !recipeStepError(entry, steps[index].id, state);
}

function conciseGuidePrompt(step = {}, selected = {}) {
  if (step.id === "reference") {
    const references = {
      "active-effects": "Choose Active Effects.",
      "execute-macro": "Choose a Macro.",
      "toggle-behavior": "Choose Behaviors."
    };
    return references[selected.key] ?? "Choose an option.";
  }
  const prompts = {
    regions: "Choose a Region.",
    darkness: "Set darkness.",
    trigger: "Choose a trigger.",
    message: "Write the message.",
    actions: "Choose movement.",
    surface: "Choose a surface.",
    "terrain-kind": "Choose terrain.",
    script: "Add script.",
    movement: "Set movement cost.",
    frequency: "Choose frequency.",
    destination: "Choose a destination.",
    arrival: "Choose arrival."
  };
  return prompts[step.id] ?? (String(step.title ?? "").trim() ? `${String(step.title).trim()}.` : "Choose an option.");
}

function renderConfigCard(selected, state, capabilities, canvasState, { simple = false, showPrompt = true } = {}) {
  const { steps, index, step } = recipeStep(state, selected);
  if (!step) return `<section class="rbb-config-card"><div class="rbb-card-heading"><div><span class="rbb-kicker">Guided setup required</span><h3>${escapeHTML(selected.label)}</h3></div></div><p class="rbb-step-error"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> This Behavior is unavailable until it has a short, guided setup recipe.</p></section>`;
  const stepError = step.id === "regions" ? null : recipeStepError(selected, step.id, state);
  const fields = step.id === "regions"
    ? state.selection.length ? `<div class="rbb-recipe-selection"><i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i><span>${state.selection.length} selected. Continue when this is correct.</span></div>` : ""
    : renderParameterFields(selected, state.parameters, state, canvasState, { stepId: step.id, minimal: simple });
  const fineTune = simple ? "" : renderParameterFields(selected, state.parameters, state, canvasState, { fineTune: true });
  const fineTuneDetails = step.id !== "regions" && fineTune ? `<details class="rbb-fine-tune"><summary>Fine tune (optional)</summary>${fineTune}</details>` : "";
  const technicalDetails = simple ? "" : `<details class="rbb-technical-details"><summary>Technical details</summary><p>This creates Foundry behavior type <code>${escapeHTML(selected.type)}</code>. ${capabilities.regionBehaviorRegistry ? "It is available in this active world." : "The active Region Behavior registry is unavailable."}</p></details>`;
  const promptText = simple ? conciseGuidePrompt(step, selected) : String(step.prompt ?? "").trim();
  const prompt = showPrompt && promptText
    ? `<p class="rbb-recipe-prompt">${escapeHTML(promptText)}</p>`
    : "";
  return `<section class="rbb-config-card" data-recipe-step="${escapeHTML(step.id)}">${prompt}${fields}${stepError ? `<p class="rbb-step-error"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> ${escapeHTML(stepError)}</p>` : ""}${fineTuneDetails}${technicalDetails}</section>`;
}

function renderNativeTopic(state, catalog, capabilities, canvasState) {
  const nativeEntries = entriesForTopic("native", catalog);
  const selected = nativeEntries.find(entry => entry.key === state.behaviorKey) ?? nativeEntries.find(entry => entry.available && entry.writable !== false) ?? nativeEntries[0];
  if (!selected) return `<div class="rbb-empty-state"><i class="fa-solid fa-wand-sparkles" aria-hidden="true"></i><h3>No native behaviors found</h3><p>The current runtime did not register any allowlisted Region Behaviors.</p></div>`;
  if (state.nativeView === "configure") {
    const guideControl = state.guideOpen
      ? `<p class="rbb-guide-open"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Setup prompt is open.</p>`
      : `<button type="button" class="rbb-button rbb-button-primary" data-action="open-guide"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Resume setup</button>`;
     return `<div class="rbb-flow-header rbb-guide-launch"><h2>${escapeHTML(selected.label)}</h2><p>The setup prompt will ask for each Region and option in order.</p>${guideControl}</div>`;
  }
  if (state.nativeView === "start") {
    const quickStarts = QUICK_START_EFFECTS.map(effect => {
      const entry = catalog.find(item => item.key === effect.key);
      const available = entry?.available && entry.writable !== false;
      return `<button type="button" class="rbb-category-option" data-action="quick-start" data-topic="${escapeHTML(effect.topic ?? "native")}" data-behavior-key="${escapeHTML(effect.key)}" ${available ? "" : "disabled"} title="${escapeHTML(effect.description)}"><span class="rbb-category-icon"><i class="fa-solid ${escapeHTML(effect.icon)}" aria-hidden="true"></i></span><span><strong>${escapeHTML(effect.label)}</strong></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`;
    }).join("");
    return `<div class="rbb-flow-header"><span class="rbb-kicker">Start here</span><h2>What should this Region do? ${helpTooltip("Choose a common goal, or browse every available Region Behavior.")}</h2></div><section class="rbb-category-list" aria-label="Common Region goals">${quickStarts}</section><button type="button" class="rbb-back-link rbb-browse-effects" data-action="show-all-effects"><i class="fa-solid fa-list" aria-hidden="true"></i> Browse all Region Behaviors</button>`;
  }
  if (state.nativeCategory) {
    const [category, label] = NATIVE_CATEGORY_ORDER.find(([id]) => id === state.nativeCategory) ?? NATIVE_CATEGORY_ORDER[0];
    const guidance = NATIVE_CATEGORY_GUIDANCE[category];
    const entries = nativeEntries.filter(entry => entry.category === category);
    return `<div class="rbb-flow-header"><button type="button" class="rbb-back-link" data-action="back-to-categories"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All Behavior groups</button><h2>${escapeHTML(guidance?.question ?? label)} ${helpTooltip(guidance?.description ?? "Choose the closest Behavior.")}</h2></div><section class="rbb-category-list" aria-label="${escapeHTML(label)} Behaviors">${entries.map(entry => renderBehaviorOption(entry, { selected: entry.key === state.behaviorKey })).join("")}</section>`;
  }
  const categories = NATIVE_CATEGORY_ORDER.filter(([category]) => category !== "advanced").map(([category, label]) => {
    const entries = nativeEntries.filter(entry => entry.category === category);
    const guidance = NATIVE_CATEGORY_GUIDANCE[category];
    if (!entries.length) return "";
    return `<button type="button" class="rbb-category-option" data-action="native-category" data-native-category="${escapeHTML(category)}" title="${escapeHTML(guidance.description)}"><span class="rbb-category-icon"><i class="fa-solid ${escapeHTML(guidance.icon)}" aria-hidden="true"></i></span><span><strong>${escapeHTML(guidance.question)}</strong></span><span class="rbb-category-count">${entries.length}</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`;
  }).join("");
  const advanced = nativeEntries.filter(entry => entry.category === "advanced");
  const advancedChoice = advanced.length ? `<details class="rbb-advanced-choice"><summary>Advanced: use a Macro or Script ${helpTooltip("Only use this when a native Behavior cannot do the job. You will supply the existing Macro UUID or script source.")}</summary><div class="rbb-category-list">${advanced.map(entry => renderBehaviorOption(entry)).join("")}</div></details>` : "";
  return `<div class="rbb-flow-header"><button type="button" class="rbb-back-link" data-action="back-to-start"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Common goals</button><h2>Choose a Behavior group ${helpTooltip("Pick the closest answer. You will only see the details needed for that choice.")}</h2></div><section class="rbb-category-list" aria-label="Region Behavior groups">${categories}</section>${advancedChoice}`;
}

function renderAdvancedRoutes(catalog) {
  const entries = catalog.filter(entry => entry.advanced);
  return `<section class="rbb-advanced-routes"><div class="rbb-card-heading"><div><span class="rbb-kicker"><i class="fa-solid fa-code" aria-hidden="true"></i> Advanced route</span><h3>Macro or Script ${helpTooltip("If a native option cannot express the idea, use one existing, reviewed Macro or Script. Regionwright will never generate or run unreviewed code.")}</h3></div><span class="rbb-badge rbb-badge-muted">Reserved</span></div><div class="rbb-category-list">${entries.map(entry => renderBehaviorOption(entry, { reserved: true })).join("")}</div><p class="rbb-runtime-note"><i class="fa-solid fa-lock" aria-hidden="true"></i> This route will require an explicit UUID, context verification, permission review, and a no-write test before it can be enabled.</p></section>`;
}

function renderPlannedTopic(topic) {
  const planned = {
    world: ["Select a specific target document", "Review current state and proposed state", "Apply only the selected, module-owned change"],
    hazards: ["Choose a trigger and eligible Token filter", "Configure check, damage, or effect", "Set reset and once-only behavior"],
    presentation: ["Choose local or global presentation", "Add text, sound, visuals, or Journal output", "Keep presentation separate from mechanic success"],
    puzzles: ["Add explicit Regions to a condition set", "Choose all-required, sequence, counter, or timer", "Preview final action and reset"],
    integrations: ["See installed capabilities and versions", "Choose a native fallback where available", "Review dependency and evidence status"]
  }[topic.id] ?? [];
  return `<div class="rbb-flow-header rbb-coming-soon"><span class="rbb-kicker">Coming soon</span><h2>${escapeHTML(topic.label)}</h2><p>${escapeHTML(topic.description)} This area is shown now so its future purpose is easy to find, but it cannot change your world yet.</p></div><details class="rbb-future-details"><summary>What this menu will do</summary><ol>${planned.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ol></details>`;
}

function renderGuideProgress(step, total) {
  return `<div class="rbb-guide-progress" role="progressbar" aria-label="Guided setup progress" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${step + 1}"><ol class="rbb-guide-step-track">${Array.from({ length: total }, (_, index) => `<li class="${index < step ? "is-complete" : ""} ${index === step ? "is-current" : ""}"><span aria-hidden="true">${index < step ? '<i class="fa-solid fa-check"></i>' : index + 1}</span><span class="sr-only">${index === step ? "Current: " : ""}Step ${index + 1}${index < step ? ", complete" : ""}</span></li>`).join("")}</ol><span class="rbb-guide-progress-label">Step ${step + 1} of ${total}</span></div>`;
}

function renderGuideHeader({ instruction = "Choose an option." } = {}) {
  return `<header class="rbb-guide-header"><h2>${escapeHTML(instruction)}</h2></header>`;
}

function renderGuideProgressFooter(step, total) {
  return `<div class="rbb-guide-progress-footer">${renderGuideProgress(step, total)}</div>`;
}

function renderGuideActions({ closeAction, backAction = "", action, step, total }) {
  return `<div class="rbb-guide-actions"><div class="rbb-guide-action-start">${closeAction}${backAction}</div>${renderGuideProgressFooter(step, total)}<div class="rbb-guide-action-end">${action}</div></div>`;
}

function selectedPitfallRegion(state) {
  return state.selection.length === 1 ? state.selection[0] : null;
}

function renderPitfallGuideContent(state, canvasState) {
  const region = selectedPitfallRegion(state);
  const step = Number(state.pitfallStep ?? 0);
  const instruction = step === 0
    ? "Draw a Region."
    : step === 1
      ? "Set difficulty and damage."
      : `Add pitfall to ${region?.name ?? "this Region"}?`;
  const body = step === 0
    ? renderGuidedRegionStep(state, canvasState, { key: PITFALL_TRAP_KEY }, { showPrompt: false })
    : step === 1
      ? `<label class="rbb-field"><span>DC</span><input type="number" min="1" max="30" step="1" data-pitfall-dc value="${escapeHTML(state.pitfallDc)}"></label><label class="rbb-field"><span>Damage</span><input type="text" maxlength="12" data-pitfall-damage value="${escapeHTML(state.pitfallDamage)}" placeholder="2d6"></label>`
      : "";
  const back = step ? `<button type="button" class="rbb-button rbb-button-quiet" data-action="pitfall-back"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back</button>` : "";
  const action = step === 2
    ? `<button type="button" class="rbb-button rbb-button-primary" data-action="pitfall-create">Add pitfall <i class="fa-solid fa-person-falling" aria-hidden="true"></i></button>`
    : `<button type="button" class="rbb-button rbb-button-primary" data-action="pitfall-next" ${step === 0 && !region ? "disabled" : ""}>Continue <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`;
  const guideActions = renderGuideActions({ closeAction: `<button type="button" class="rbb-button rbb-button-quiet" data-action="close-guide">Close</button>`, backAction: back, action, step, total: 3 });
  return `<div class="rbb-guide-content" data-topic="traps">${renderGuideHeader({ instruction })}<div class="rbb-guide-task"><div class="rbb-guide-step-content">${body}</div>${guideActions}</div></div>`;
}

function renderPuzzlesTopic(state) {
  if (state.pitfallGuideOpen) return `<div class="rbb-flow-header rbb-guide-launch"><h2>Pitfall Trap</h2><p>Follow the guided prompt to draw or choose the pit's Region.</p><p class="rbb-guide-open"><i class="fa-solid fa-person-falling" aria-hidden="true"></i> Setup prompt is open.</p></div>`;
  const puzzlesLocksAvailable = Boolean(globalThis.game?.modules?.get?.("regionwright-puzzles-locks")?.api?.openHub);
  const puzzleLauncher = puzzlesLocksAvailable
    ? `<button type="button" class="rbb-category-option" data-action="open-puzzles-locks"><span class="rbb-category-icon"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i></span><span><strong>Open Puzzles & Locks</strong><small>Open the separate module's game catalog and setup.</small></span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>`
    : `<div class="rbb-category-option rbb-premium-preview"><span class="rbb-category-icon"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i></span><span><strong>Puzzles & Locks is optional</strong><small>Install Regionwright: Puzzles & Locks to configure player-facing puzzle games.</small></span></div>`;
  return `<div class="rbb-flow-header"><span class="rbb-kicker">Studio traps</span><h2>Configure a trap</h2><p>Reusable lock and puzzle games are provided by their separate optional module.</p></div><section class="rbb-category-list" aria-label="Trap and optional puzzle tools"><button type="button" class="rbb-category-option" data-action="start-pitfall"><span class="rbb-category-icon"><i class="fa-solid fa-person-falling" aria-hidden="true"></i></span><span><strong>Pitfall Trap</strong><small>Spot the pit with passive Perception, then use Athletics to cross.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>${puzzleLauncher}</section>`;
}

function renderBossTopic() {
  return `<div class="rbb-flow-header"><span class="rbb-kicker">Ballad of Chauser Bill</span><h2>Prime Arachnid Boss Engine</h2><p>Creates the two NPC actors, tracks the encounter objectives, and opens the live GM control panel.</p></div><section class="rbb-category-list" aria-label="Boss Engine controls"><button type="button" class="rbb-category-option" data-action="boss-prepare"><span class="rbb-category-icon"><i class="fa-solid fa-robot" aria-hidden="true"></i></span><span><strong>Prepare encounter</strong><small>Create or refresh The Prime Arachnid and The Prime Directive.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button><button type="button" class="rbb-category-option" data-action="boss-open"><span class="rbb-category-icon"><i class="fa-solid fa-sliders" aria-hidden="true"></i></span><span><strong>Open GM control panel</strong><small>Control phases, shields, LINK LOAD, Anchor, Expose, and the final destruction.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button><button type="button" class="rbb-category-option" data-action="boss-start"><span class="rbb-category-icon"><i class="fa-solid fa-play" aria-hidden="true"></i></span><span><strong>Start encounter</strong><small>Reset the automated state and begin Phase 1.</small></span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></section>`;
}

/** The main window is a visual launchpad; detailed wording belongs only in its guided prompts. */
function renderVisualLaunchpad() {
  const choices = TOPICS.filter(topic => topic.status === "available");
  return `<section class="rbb-visual-launchpad" aria-labelledby="rbb-launchpad-title"><header class="rbb-visual-launchpad-header"><span class="rbb-kicker"><i class="fa-solid fa-compass" aria-hidden="true"></i> Regionwright</span><h2 id="rbb-launchpad-title">What would you like to make?</h2></header><div class="rbb-visual-launchpad-grid" role="list">${choices.map(topic => `<button type="button" class="rbb-visual-launchpad-card rbb-visual-launchpad-card--${escapeHTML(topic.id)}" data-action="topic" data-topic="${escapeHTML(topic.id)}" role="listitem" aria-label="${escapeHTML(topic.label)}: ${escapeHTML(topic.description)}"><span class="rbb-visual-launchpad-icon"><i class="${escapeHTML(topic.icon)}" aria-hidden="true"></i></span><strong>${escapeHTML(topic.label)}</strong><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`).join("")}</div></section>`;
}

export function buildStudioContent({ state = {}, canvasState = globalThis.canvas } = {}) {
  const scene = canvasState?.scene;
  const hasStudio = studioService.capabilities().edition === "studio";
  const facts = hasStudio ? createStoryFactStore().list() : [];
  const keyGateCard = hasStudio ? `<div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-key" aria-hidden="true"></i></span><div><h3>Symbolic Key Gate</h3><p>Use a named key to unlock a Door.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-key-gate">Create Key Gate</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span><div><h3>Room Transformation</h3><p>Reveal hidden room features and show a message.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-room-transformation">Create Room Transformation</button></div>` : "";
  const factProgress = `${keyGateCard}${facts.length ? `<section class="rbb-studio-editor" aria-label="Story progress"><div class="rbb-studio-editor-heading"><span class="rbb-kicker">Story progress</span><strong>${facts.filter(fact => fact.value).length}/${facts.length}</strong></div>${facts.map(fact => `<div class="rbb-studio-reference ${fact.value ? "is-selected" : ""}"><span>${escapeHTML(fact.label)}</span><button type="button" class="rbb-button rbb-button-quiet" data-action="studio-reset-fact" data-fact-id="${escapeHTML(fact.id)}" ${fact.value ? "" : "disabled"}>Reset</button></div>`).join("")}</section>` : ""}`;
  if (!state.studioBlueprint) return `<div class="rbb-flow-header"><span class="rbb-kicker">Included activities</span><h2>Studio</h2><p>Choose what should happen on the map.</p></div><section class="rbb-studio-preview" aria-label="Studio activities">${hasStudio ? `<div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-unlock-keyhole" aria-hidden="true"></i></span><div><h3>Hub Unlock</h3><p>Complete objectives, then unlock a Door.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-primary" data-action="studio-start-hub-unlock">Create Hub Unlock</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-flag" aria-hidden="true"></i></span><div><h3>Story Fact</h3><p>Enter an area to mark a named piece of progress.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-story-fact">Create Story Fact</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-route" aria-hidden="true"></i></span><div><h3>Scene Portal</h3><p>Travel from an entrance area to another Scene.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-portal">Create Scene Portal</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i></span><div><h3>Story Beat</h3><p>Enter an area, show a message, and pause for the table.</p></div><span class="rbb-badge rbb-badge-live">Studio</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-story-beat">Create Story Beat</button></div>${factProgress}` : ""}<div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-eye" aria-hidden="true"></i></span><div><h3>Reveal a Secret</h3><p>Enter an area, reveal hidden creatures, and show a clue.</p></div><span class="rbb-badge rbb-badge-live">Included</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-primary" data-action="studio-start-secret-reveal">Create Secret Reveal</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-masks-theater" aria-hidden="true"></i></span><div><h3>Scene Moment</h3><p>Enter an area, reveal hidden creatures, and show a message.</p></div><span class="rbb-badge rbb-badge-live">Included</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-primary" data-action="studio-start-scene-moment">Create Scene Moment</button></div><div class="rbb-studio-preview-heading"><span class="rbb-category-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span><div><h3>Pressure Plate</h3><p>Enter an area, show a warning, and pause once.</p></div><span class="rbb-badge rbb-badge-live">Included</span></div><div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-start-sample">Create Pressure Plate</button><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-load-draft">Load saved draft</button></div></section>`;
  const sample = state.studioBlueprint;
  const sceneMoment = sample.id === "scene-moment";
  const secretReveal = ["secret-reveal", "room-transformation"].includes(sample.metadata?.template);
  const storyBeat = sample.id === "story-beat";
  const portal = sample.id === "scene-portal";
  const storyFact = sample.id === "story-fact";
  const hubUnlock = sample.id === "hub-unlock";
  const nodes = sample.nodes.map((node, index) => `<li class="rbb-studio-preview-node"><button type="button" class="rbb-studio-preview-node-button ${state.studioSelectedNodeId === node.id ? "is-selected" : ""}" data-action="studio-select-node" data-studio-node-id="${escapeHTML(node.id)}"><span class="rbb-studio-preview-index">${index + 1}</span><span><strong>${escapeHTML(node.label)}</strong></span></button></li>`).join("");
  const selected = sample.nodes.find(node => node.id === state.studioSelectedNodeId) ?? sample.nodes[0];
  const sourceSceneUuid = sample.nodes.find(node => node.id === "portal-entry")?.sceneUuid ?? null;
  const requestedSceneUuid = portal && selected?.id === "portal-arrival" ? selected.config?.targetSceneUuid : selected?.sceneUuid;
  const requestedScene = scenesForBrowser(canvasState).find(scene => scene.uuid === requestedSceneUuid) ?? null;
  const portalSceneChoices = portal && selected?.id === "portal-arrival" && !requestedSceneUuid
    ? `<div class="rbb-studio-reference-picker"><strong>Choose the destination Scene</strong>${scenesForBrowser(canvasState).filter(candidate => candidate.uuid !== sourceSceneUuid).map(candidate => `<button type="button" class="rbb-studio-reference" data-action="studio-set-portal-scene" data-scene-uuid="${escapeHTML(candidate.uuid)}"><span>${escapeHTML(candidate.name ?? "Unnamed Scene")}</span><small>Choose arrival Scene</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Create another Scene first.</p>`}</div>` : "";
  const regionChoices = selected?.config?.targetType === "region" ? portalSceneChoices || (requestedSceneUuid && requestedSceneUuid !== scene?.uuid ? `<div class="rbb-studio-reference-picker"><strong>Go to ${escapeHTML(requestedScene?.name ?? "the required Scene")}</strong><button type="button" class="rbb-button rbb-button-primary" data-action="switch-scene" data-scene-uuid="${escapeHTML(requestedSceneUuid)}">Switch Scene</button></div>` : `<div class="rbb-studio-reference-picker"><strong>Choose the area</strong>${sceneRegionReferences(canvasState).map(region => `<button type="button" class="rbb-studio-reference ${selected.config.targetUuid === region.uuid ? "is-selected" : ""}" data-action="studio-pick-region" data-studio-uuid="${escapeHTML(region.uuid)}" data-highlight-target="${escapeHTML(region.uuid)}" data-highlight-type="region"><span>${escapeHTML(region.name)}</span><small>${selected.config.targetUuid === region.uuid ? "Selected - pulsing on map" : "Locate on map"}</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Draw an area to continue.</p>`}<button type="button" class="rbb-button rbb-button-secondary" data-action="studio-create-region">Draw a new Region</button></div>`) : "";
  const tokenChoices = selected?.type === "revealHiddenTokens" ? `<div class="rbb-studio-reference-picker"><strong>Choose hidden creatures</strong>${sceneTokenReferences(canvasState).filter(token => token.hidden).map(token => `<button type="button" class="rbb-studio-reference ${(selected.config?.targetUuids ?? []).includes(token.uuid) ? "is-selected" : ""}" data-action="studio-pick-token" data-studio-uuid="${escapeHTML(token.uuid)}" data-highlight-target="${escapeHTML(token.uuid)}" data-highlight-type="token"><span>${escapeHTML(token.name)}</span><small>${(selected.config?.targetUuids ?? []).includes(token.uuid) ? "Selected - pulsing on map" : "Hidden creature"}</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Hide a creature on this Scene to choose it here.</p>`}</div>` : "";
  const tileChoices = secretReveal && selected?.type === "revealHiddenTokens" ? `<div class="rbb-studio-reference-picker"><strong>Choose hidden Tiles</strong>${sceneTileReferences(canvasState).filter(tile => tile.hidden).map(tile => `<button type="button" class="rbb-studio-reference ${(selected.config?.targetTileUuids ?? []).includes(tile.uuid) ? "is-selected" : ""}" data-action="studio-pick-tile" data-studio-uuid="${escapeHTML(tile.uuid)}" data-highlight-target="${escapeHTML(tile.uuid)}" data-highlight-type="tile"><span>${escapeHTML(tile.name)}</span><small>${(selected.config?.targetTileUuids ?? []).includes(tile.uuid) ? "Selected - pulsing on map" : "Hidden Tile"}</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Hide a Tile on this Scene to choose it here.</p>`}</div>` : "";
  const hubFactChoices = selected?.type === "allStoryFacts" ? `<div class="rbb-studio-reference-picker"><strong>Choose objectives</strong>${facts.map(fact => `<button type="button" class="rbb-studio-reference ${(selected.config?.factIds ?? []).includes(fact.id) ? "is-selected" : ""}" data-action="studio-toggle-fact" data-fact-id="${escapeHTML(fact.id)}"><span>${escapeHTML(fact.label)}</span><small>${(selected.config?.factIds ?? []).includes(fact.id) ? "Required" : "Add objective"}</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Create Story Facts first.</p>`}</div>` : "";
  const hubDoorChoices = selected?.type === "openDoor" ? `<div class="rbb-studio-reference-picker"><strong>Choose the Door</strong>${targetReferences("door", { canvasState }).map(door => `<button type="button" class="rbb-studio-reference ${selected.config?.targetUuid === door.uuid ? "is-selected" : ""}" data-action="studio-pick-door" data-studio-uuid="${escapeHTML(door.uuid)}" data-highlight-target="${escapeHTML(door.uuid)}" data-highlight-type="door"><span>${escapeHTML(door.name)}</span><small>${selected.config?.targetUuid === door.uuid ? "Selected - pulsing on map" : "Locate on map"}</small></button>`).join("") || `<p class="rbb-studio-empty-reference">Add a Door to this Scene first.</p>`}</div>` : "";
  const editor = `<section class="rbb-studio-editor" aria-label="Studio step"><div class="rbb-studio-editor-heading"><span class="rbb-kicker">This step</span><strong>${escapeHTML(selected.label)}</strong></div>${selected.type === "setStoryFact" ? `<label>Story fact<input type="text" data-studio-field="factLabel" maxlength="80" placeholder="West Orb Placed" value="${escapeHTML(selected.config?.label ?? "")}"></label>` : ""}${selected.type === "displayScrollingText" ? `<label>Message<textarea data-studio-field="text" rows="2">${escapeHTML(selected.config?.text ?? "")}</textarea></label>` : ""}${regionChoices}${tokenChoices}${tileChoices}${hubFactChoices}${hubDoorChoices}</section>`;
  const published = sample.status === "published";
  const compilation = state.studioCompilation ?? { errors: [] };
  const diagnostics = state.studioDiagnostics ?? { errors: [], warnings: [] };
  const reviewText = sceneMoment ? "Publishing reveals the selected hidden creatures and shows this message once." : hubUnlock ? "Publishing unlocks the selected Door when every objective is complete." : storyFact ? "Publishing marks this named story fact when a player enters the area." : portal ? "Publishing sends players from this entrance to the selected arrival area." : storyBeat ? "Publishing adds this message and a one-time pause to the selected area." : "Publishing adds a warning and a one-time pause to the selected area.";
  const portalNeedsSourceScene = portal && sourceSceneUuid && scene?.uuid !== sourceSceneUuid;
  const portalReturn = portalNeedsSourceScene ? `<div class="rbb-studio-reference-picker"><strong>Go back to the portal entrance Scene</strong><button type="button" class="rbb-button rbb-button-primary" data-action="switch-scene" data-scene-uuid="${escapeHTML(sourceSceneUuid)}">Switch Scene</button></div>` : "";
  const diagnosticNotes = diagnostics.errors.length || diagnostics.warnings.length ? `<div class="rbb-studio-review-errors ${diagnostics.errors.length ? "" : "rbb-studio-review-notes"}"><strong>${diagnostics.errors.length ? "Fix this" : "Before play"}</strong><ul>${[...diagnostics.errors, ...diagnostics.warnings].map(note => `<li>${escapeHTML(note.message)}</li>`).join("")}</ul></div>` : "";
  const review = `<section class="rbb-studio-review" aria-label="Studio review"><div class="rbb-studio-editor-heading"><span class="rbb-kicker">Check it</span><strong>${published ? "Published" : "Ready"}</strong></div><p>${published ? "This activity is active. Remove it to reset Regionwright changes." : reviewText}</p>${compilation.errors.length ? `<div class="rbb-studio-review-errors"><strong>Fix this</strong><ul>${compilation.errors.map(error => `<li>${escapeHTML(error)}</li>`).join("")}</ul></div>` : `<p class="rbb-studio-review-success">Ready to publish.</p>`}${diagnosticNotes}${portalReturn}<div class="rbb-studio-preview-actions">${published ? `<button type="button" class="rbb-button rbb-button-secondary" data-action="studio-unpublish">Remove and reset</button>` : `<button type="button" class="rbb-button rbb-button-primary" data-action="studio-publish" ${compilation.errors.length || diagnostics.errors.length || portalNeedsSourceScene ? "disabled" : ""}>Publish</button>`}<button type="button" class="rbb-button rbb-button-secondary" data-action="studio-back">Back</button></div></section>`;
  return `<div class="rbb-flow-header"><span class="rbb-kicker">Studio activity</span><h2>${escapeHTML(sample.name)}</h2><p>${escapeHTML(sample.description)}</p></div><section class="rbb-studio-preview" aria-label="Studio activity"><ol class="rbb-studio-preview-list">${nodes}</ol>${state.studioView === "review" ? review : editor}<div class="rbb-studio-preview-actions"><button type="button" class="rbb-button rbb-button-secondary" data-action="studio-save-draft">Save draft</button><button type="button" class="rbb-button rbb-button-primary" data-action="studio-review">Check it</button><button type="button" class="rbb-button rbb-button-quiet" data-action="studio-reset">Choose another</button></div></section>`;
}

function renderTraversalTopic(state, catalog, capabilities, canvasState) {
  const entries = entriesForTopic("traversal", catalog);
  const selected = entries.find(entry => entry.key === state.behaviorKey) ?? entries.find(entry => entry.available && entry.writable !== false) ?? entries[0];
  if (!selected) return `<div class="rbb-empty-state"><h3>No traversal behaviors found</h3><p>The active runtime did not register an allowlisted traversal behavior.</p></div>`;
  if (state.traversalView === "configure") {
    const guideControl = state.guideOpen
      ? `<p class="rbb-guide-open"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Setup prompt is open.</p>`
      : `<button type="button" class="rbb-button rbb-button-primary" data-action="open-guide"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Resume setup</button>`;
     return `<div class="rbb-flow-header rbb-guide-launch"><h2>${escapeHTML(selected.label)}</h2><p>The setup prompt will ask for each Region and option in order.</p>${guideControl}</div>`;
  }
  return `<div class="rbb-flow-header"><h2>How should Tokens move? ${helpTooltip("Choose the closest option. Regionwright will then show only the settings needed for that kind of travel.")}</h2></div><section class="rbb-category-list" aria-label="Travel Behaviors">${entries.map(renderBehaviorOption).join("")}</section>`;
}

function renderSelection(state, canvasState, guideRoute = null) {
  const guidedTargetType = guideRoute?.pickerType ?? null;
  if (guidedTargetType === "region") {
    return `<section class="rbb-selection-panel rbb-guided-selection-quiet"><p>Follow the setup prompt to draw or choose a Region.</p></section>`;
  }
  const pickerType = targetTypeById(state.pickerType);
  const selectedScene = browserScene(state, canvasState);
  const activeSceneUuid = canvasState?.scene?.uuid;
  const browserCanvasState = { ...canvasState, scene: selectedScene };
  const available = pickerType.id === "region"
    ? regionReferencesForScene(selectedScene)
    : pickerType.id === "actor" && state.actorScope === "scene"
      ? sceneActorReferences(selectedScene)
      : targetReferences(pickerType.id, { canvasState: browserCanvasState });
  const selected = pickerType.id === "region" ? state.selection : state.targets;
  const canChoose = selectedScene?.uuid === activeSceneUuid || pickerType.id === "actor" && state.actorScope === "world";
  const pickerRows = available.length
    ? available.map(reference => {
      const isSelected = selected.some(item => item.uuid === reference.uuid);
      if (pickerType.id === "region") {
        const proposedName = String(state.regionRenames?.[reference.uuid] ?? reference.name);
        if (isSelected) return `<div class="rbb-region-choice is-selected" data-highlight-target="${escapeHTML(reference.uuid)}" data-highlight-type="region"><div class="rbb-picker-row rbb-region-edit-row"><input type="text" data-region-rename="${escapeHTML(reference.uuid)}" value="${escapeHTML(proposedName)}" maxlength="100" aria-label="Name for ${escapeHTML(reference.name)}"><button type="button" class="rbb-region-select-toggle" data-action="toggle-region-selection" data-region-uuid="${escapeHTML(reference.uuid)}" aria-pressed="true" ${!canChoose ? "disabled" : ""} title="Remove ${escapeHTML(reference.name)}"><i class="fa-solid fa-check" aria-hidden="true"></i><span class="sr-only">Remove ${escapeHTML(reference.name)}</span></button></div></div>`;
        return `<div class="rbb-region-choice"><button type="button" class="rbb-picker-row" data-action="toggle-region-selection" data-region-uuid="${escapeHTML(reference.uuid)}" data-highlight-target="${escapeHTML(reference.uuid)}" data-highlight-type="region" aria-pressed="false" ${!canChoose ? "disabled" : ""} title="${escapeHTML(canChoose ? `Select ${reference.name}` : "Switch to this Scene before choosing documents for this current-scene Behavior.")}"><span><strong>${escapeHTML(reference.name)}</strong></span><i class="fa-solid fa-plus" aria-hidden="true"></i></button></div>`;
      }
      return `<button type="button" class="rbb-picker-row" data-action="pick-target" data-target-type="${pickerType.id}" data-target-uuid="${escapeHTML(reference.uuid)}" data-highlight-target="${escapeHTML(reference.uuid)}" data-highlight-type="${pickerType.id}" ${isSelected || !canChoose ? "disabled" : ""} title="${escapeHTML(canChoose ? `Choose ${reference.name}` : "Switch to this Scene before choosing documents from it.")}"><span><strong>${escapeHTML(reference.name)}</strong></span><i class="fa-solid ${isSelected ? "fa-check" : "fa-plus"}" aria-hidden="true"></i></button>`;
    }).join("")
    : `<p class="rbb-picker-empty">No ${pickerType.label}s are available in this context.</p>`;
  const scenes = scenesForBrowser(canvasState);
  const sceneOptions = scenes.map(scene => ({ value: scene.uuid, label: `${scene.name?.trim?.() || "Unnamed Scene"}${scene.uuid === activeSceneUuid ? " (Current)" : ""}` }));
  const actorScope = pickerType.id === "actor" ? `<div class="rbb-picker-types rbb-actor-scope"><button type="button" class="${state.actorScope === "scene" ? "is-active" : ""}" data-action="actor-scope" data-actor-scope="scene">Scene Actors</button><button type="button" class="${state.actorScope === "world" ? "is-active" : ""}" data-action="actor-scope" data-actor-scope="world">World Actors</button></div>` : "";
  const picker = `<div class="rbb-region-picker rbb-document-browser ${guidedTargetType ? "is-guided-target" : ""}" role="region" aria-label="${guidedTargetType ? "Choose a Region in the highlighted list" : "Choose a document"}" data-guided-target="${guidedTargetType ?? ""}"><div class="rbb-picker-types">${TARGET_TYPES.filter(type => type.id !== "wall").map(type => `<button type="button" class="${type.id === pickerType.id ? "is-active" : ""} ${type.id === guidedTargetType ? "is-guided-target" : ""}" data-action="picker-type" data-picker-type="${type.id}"><i class="fa-solid ${type.icon}" aria-hidden="true"></i>${escapeHTML(type.label)}</button>`).join("")}</div><div class="rbb-picker-heading"><div class="rbb-browser-scene">${renderDropdown({ label: "Scene", value: selectedScene?.uuid, options: sceneOptions, state, key: "browserScene", binding: "input", ariaLabel: "Scene" })}</div></div>${actorScope}${selectedScene?.uuid !== activeSceneUuid && pickerType.id !== "actor" ? `<p class="rbb-picker-empty">You are browsing another Scene. Switch to it before choosing a document for this current-scene Behavior.</p>` : ""}<div class="rbb-picker-list">${pickerRows}</div></div>`;
  const targetRows = state.targets.length ? `<div class="rbb-target-references"><span class="rbb-list-label">Other selected references</span>${state.targets.map(target => `<div class="rbb-target-row" title="Selected ${escapeHTML(targetTypeById(target.type).label)}"><i class="fa-solid ${targetTypeById(target.type).icon}" aria-hidden="true"></i><span><strong>${escapeHTML(target.name)}</strong></span><button type="button" data-action="remove-target" data-target-uuid="${escapeHTML(target.uuid)}" title="Remove ${escapeHTML(target.name)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i><span class="sr-only">Remove</span></button></div>`).join("")}</div>` : "";
  return `<section class="rbb-selection-panel">${picker}<details class="rbb-more-selection"><summary>More ${helpTooltip("Actors, Doors, and Tiles can be saved as references when an effect uses them. Double-clicking the canvas remains an optional shortcut for the currently controlled Regions.")}</summary><div class="rbb-selection-toolbar"><button type="button" class="rbb-button rbb-button-quiet" data-action="add-controlled" title="Add controlled Regions from the canvas">Add controlled Regions</button></div>${targetRows}</details></section>`;
}

function renderLinkRail(state) {
  const enoughRegions = state.selection.length >= 2;
  const link = state.link ?? {};
  return `<aside class="rbb-link-rail" aria-label="Region linking options"><div class="rbb-rail-heading"><span class="rbb-kicker">Link</span><h2>Connect ${helpTooltip("Optional. Select two or more Regions first.")}</h2></div><div class="rbb-link-options"><label class="rbb-link-option"><input type="checkbox" data-link="enabled" ${link.enabled ? "checked" : ""} ${enoughRegions ? "" : "disabled"}><span><strong>Link Regions ${helpTooltip("Use the selected list as a group.")}</strong></span></label><label class="rbb-link-option"><input type="checkbox" data-link="bidirectional" ${link.bidirectional ? "checked" : ""} ${enoughRegions ? "" : "disabled"}><span><strong>Two-way ${helpTooltip("Allow travel in both directions.")}</strong></span></label><label class="rbb-link-option"><input type="checkbox" data-link="teleport" ${link.teleport ? "checked" : ""} ${enoughRegions ? "" : "disabled"}><span><strong>Teleport ${helpTooltip("Prepare a Token destination link.")}</strong></span></label><label class="rbb-link-option"><input type="checkbox" data-link="preserveOrder" ${link.preserveOrder !== false ? "checked" : ""} ${state.selection.length ? "" : "disabled"}><span><strong>Keep order ${helpTooltip("Use the list order for the link.")}</strong></span></label></div><div class="rbb-link-rail-note"><i class="fa-solid ${enoughRegions ? "fa-circle-check" : "fa-hand-pointer"}" aria-hidden="true"></i><span>${enoughRegions ? "Choose a link style. Source and destination are set in Portals & Travel." : "Add two Regions to unlock linking."}</span></div></aside>`;
}

function renderPlanSummary(state, catalog) {
  const entry = catalog.find(item => item.key === state.behaviorKey);
  const plan = state.plan;
  const planStatus = plan ? "Ready to create" : "Not ready";
  const statusClass = plan ? "is-success" : "is-muted";
  const behaviorTopic = ["native", "traversal"].includes(state.topic);
  const readyToReview = behaviorTopic && state.effectChosen && entry?.available && recipeReadyToReview(state, entry);
  const success = state.lastApply ? `<p class="rbb-created-note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Created this Behavior on ${state.lastApply.count} Region${state.lastApply.count === 1 ? "" : "s"}. <button type="button" data-action="open-first-region">Open a Region</button></p>` : "";
  const renameSummary = plan?.regionUpdates?.length ? `<div class="rbb-review-renames"><span>Region names</span>${plan.regionUpdates.map(update => {
    const original = plan.selection.find(region => region.uuid === update.uuid)?.name ?? "Selected Region";
    return `<strong>${escapeHTML(original)} → ${escapeHTML(update.name)}</strong>`;
  }).join("")}</div>` : "";
  const reviewAction = plan ? "" : `<button type="button" class="rbb-button rbb-button-secondary" data-action="preview" ${readyToReview ? "" : "disabled"}><i class="fa-solid fa-eye" aria-hidden="true"></i> Review Behavior</button>`;
  return `<section class="rbb-panel rbb-plan-panel"><div class="rbb-panel-heading"><div><h2>Your Region Behavior</h2></div><span class="rbb-status-pill ${statusClass}"><i class="fa-solid ${plan ? "fa-check" : "fa-minus"}" aria-hidden="true"></i>${planStatus}</span></div><p class="rbb-review-summary">${escapeHTML(plainEffectSummary(state, entry))}</p>${renameSummary}${success}<div class="rbb-plan-facts"><div><span>Behavior</span><strong>${escapeHTML(state.effectChosen ? entry?.label : "Not chosen")}</strong></div><div><span>Regions</span><strong>${state.selection.length || "None"}</strong></div></div>${plan ? `<details class="rbb-plan-details"><summary>Show technical plan details</summary><pre>${escapeHTML(JSON.stringify(plan, null, 2))}</pre></details>` : ""}<div class="rbb-button-row rbb-plan-actions">${reviewAction}<button type="button" class="rbb-button rbb-button-apply" data-action="apply" ${behaviorTopic && state.plan ? "" : "disabled"}><i class="fa-solid fa-check-double" aria-hidden="true"></i> Create Behavior</button></div></section>`;
}

function renderGuidedRegionStep(state, canvasState, entry, { showPrompt = true } = {}) {
  const creating = state.regionCreatePending?.kind === "selection";
  const mode = state.regionPickerMode ?? "create";
  const groups = sceneGroupedRegionReferences(canvasState);
  const activeSceneUuid = canvasState?.scene?.uuid ?? "";
  const selectedSceneUuid = groups.some(group => group.sceneUuid === state.referenceSceneUuid) ? state.referenceSceneUuid : activeSceneUuid;
  const selectedScene = groups.find(group => group.sceneUuid === selectedSceneUuid) ?? groups[0] ?? { sceneUuid: activeSceneUuid, sceneName: "Current Scene", regions: [] };
  const onActiveScene = selectedScene.sceneUuid === activeSceneUuid;
  const regions = selectedScene.regions ?? [];
  const selected = new Set(state.selection.map(region => region.uuid));
  const teleport = entry?.key === "teleport";
  const targetName = teleport ? "Entry Region" : "Region";
  const drawLabel = teleport ? "Draw Entry Region" : "Draw New Region";
  const prompt = teleport ? "Draw the entry Region." : "Draw a Region.";
  const multiRegionReminder = state.selection.length ? `<p class="rbb-region-draw-reminder"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Deselect the last Region before drawing another.</p>` : "";
  const sceneOptions = groups.map(group => ({ value: group.sceneUuid, label: `${group.sceneName}${group.sceneUuid === activeSceneUuid ? " (Current)" : ""}` }));
  const sceneChooser = sceneOptions.length > 1 ? renderDropdown({ label: "Scene", value: selectedScene.sceneUuid, options: sceneOptions, state, key: "regionScene", binding: "input", ariaLabel: "Region Scene" }) : "";
  const sceneNotice = onActiveScene
    ? `<p class="rbb-scene-guidance is-ready"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Select from <strong>${escapeHTML(selectedScene.sceneName)}</strong>. The matching area will pulse on the map.</p>`
    : `<div class="rbb-scene-guidance"><i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i><span>Switch to <strong>${escapeHTML(selectedScene.sceneName)}</strong> before choosing a Region on that Scene.</span><button type="button" class="rbb-button rbb-button-secondary" data-action="switch-scene" data-scene-uuid="${escapeHTML(selectedScene.sceneUuid)}"><i class="fa-solid fa-hexagon-nodes" aria-hidden="true"></i> Switch Scene</button></div>`;
  const existing = regions.length
    ? regions.map(region => `<button type="button" class="rbb-picker-row ${selected.has(region.uuid) ? "is-selected" : ""}" data-action="toggle-region-selection" data-region-uuid="${escapeHTML(region.uuid)}" data-highlight-target="${escapeHTML(region.uuid)}" data-highlight-type="region" aria-pressed="${selected.has(region.uuid)}" ${onActiveScene ? "" : "disabled"} title="${escapeHTML(onActiveScene ? `Highlight and select ${region.name}` : `Switch to ${selectedScene.sceneName} first`)}"><span><strong>${escapeHTML(region.name)}</strong><small>${selected.has(region.uuid) ? "Selected — pulsing on map" : "Click to highlight on map"}</small></span><i class="fa-solid ${selected.has(region.uuid) ? "fa-check" : "fa-plus"}" aria-hidden="true"></i></button>`).join("")
    : `<p class="rbb-picker-empty">No Regions exist on ${escapeHTML(selectedScene.sceneName)} yet.</p>`;
  const createPrompt = showPrompt ? `<p class="rbb-recipe-prompt">${prompt}</p>` : "";
  const choosePrompt = showPrompt ? `<p class="rbb-recipe-prompt">Choose a ${targetName}.</p>` : "";
  const create = `${sceneChooser}${sceneNotice}${createPrompt}${multiRegionReminder}${onActiveScene ? `<button type="button" class="rbb-button rbb-button-primary" data-action="begin-region-create" data-region-create-kind="selection" ${creating ? "disabled" : ""}><i class="fa-solid fa-draw-polygon" aria-hidden="true"></i> ${creating ? "Waiting for Region" : drawLabel}</button>${creating ? `<button type="button" class="rbb-button rbb-button-quiet" data-action="cancel-region-create">Cancel</button>` : ""}` : ""}<button type="button" class="rbb-back-link" data-action="set-region-picker-mode" data-region-picker-mode="existing">Use an existing ${targetName}</button>`;
  const choose = `${sceneChooser}${sceneNotice}${choosePrompt}<div class="rbb-picker-list">${existing}</div><button type="button" class="rbb-back-link" data-action="set-region-picker-mode" data-region-picker-mode="create">Draw a new ${targetName} instead</button>`;
  const summary = state.selection.length ? `<p class="rbb-guide-selection-status"><i class="fa-solid fa-check" aria-hidden="true"></i> ${state.selection.length} Region${state.selection.length === 1 ? "" : "s"} ready.</p>` : "";
  return `<section class="rbb-guide-step rbb-guided-region-step ${mode === "existing" ? "is-existing" : "is-drawing"}">${mode === "existing" ? choose : create}${summary}</section>`;
}

function renderTeleportDestinationField({ state, parameters, canvasState }) {
  const excluded = new Set(state.selection.map(region => region.uuid));
  const groups = sceneGroupedRegionReferences(canvasState).map(group => ({ ...group, regions: group.regions.filter(region => !excluded.has(region.uuid)) }));
  const activeSceneUuid = canvasState?.scene?.uuid;
  const selectedSceneUuid = groups.some(group => group.sceneUuid === state.referenceSceneUuid) ? state.referenceSceneUuid : activeSceneUuid;
  const group = groups.find(entry => entry.sceneUuid === selectedSceneUuid) ?? groups[0];
  const selected = uuidValues(parameters.destinationsText);
  const selectedNames = new Map(groups.flatMap(entry => entry.regions).map(region => [region.uuid, region.name]));
  const mode = state.regionReferenceMode?.destinationsText ?? "create";
  const creating = state.regionCreatePending?.kind === "reference" && state.regionCreatePending?.referenceKey === "destinationsText";
  const sceneOptions = groups.map(entry => ({ value: entry.sceneUuid, label: `${entry.sceneName}${entry.sceneUuid === activeSceneUuid ? " (Current)" : ""}` }));
  const selectedSummary = selected.length ? `<p class="rbb-guide-selection-status"><i class="fa-solid fa-check" aria-hidden="true"></i> ${escapeHTML(selectedNames.get(selected[0]) ?? "Destination")} selected.</p>` : "";
  const canChoose = group?.sceneUuid === activeSceneUuid;
  const sceneNotice = canChoose
    ? `<p class="rbb-scene-guidance is-ready"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Select the arrival Region from <strong>${escapeHTML(group?.sceneName ?? "this Scene")}</strong>. The matching area will pulse on the map.</p>`
    : `<div class="rbb-scene-guidance"><i class="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i><span>Teleport setup continues on <strong>${escapeHTML(group?.sceneName ?? "the destination Scene")}</strong>. Switch Scenes, then choose the arrival Region.</span><button type="button" class="rbb-button rbb-button-secondary" data-action="switch-scene" data-scene-uuid="${escapeHTML(group?.sceneUuid ?? "")}"><i class="fa-solid fa-hexagon-nodes" aria-hidden="true"></i> Switch Scene</button></div>`;
  const rows = group?.regions?.length
    ? group.regions.map(region => `<button type="button" class="rbb-picker-row ${selected.includes(region.uuid) ? "is-selected" : ""}" data-action="pick-reference" data-reference-key="destinationsText" data-reference-uuid="${escapeHTML(region.uuid)}" data-reference-single="true" data-highlight-target="${escapeHTML(region.uuid)}" data-highlight-type="region" ${canChoose ? "" : "disabled"} title="${escapeHTML(canChoose ? `Highlight and choose ${region.name}` : `Switch to ${group.sceneName} first`)}"><span><strong>${escapeHTML(region.name)}</strong><small>${selected.includes(region.uuid) ? "Selected — pulsing on map" : "Click to highlight on map"}</small></span><i class="fa-solid ${selected.includes(region.uuid) ? "fa-check" : "fa-plus"}" aria-hidden="true"></i></button>`).join("")
    : `<p class="rbb-picker-empty">No Regions exist on this Scene yet.</p>`;
  const sceneChooser = renderDropdown({ label: "Scene", value: group?.sceneUuid ?? "", options: sceneOptions, state, key: "referenceScene", binding: "input", ariaLabel: "Destination Scene" });
  const create = group?.sceneUuid === activeSceneUuid
    ? `${sceneNotice}<p class="rbb-recipe-prompt">Draw the Region where Tokens should arrive.</p><button type="button" class="rbb-button rbb-button-primary" data-action="begin-region-create" data-region-create-kind="reference" data-reference-key="destinationsText" data-reference-single="true" ${creating ? "disabled" : ""}><i class="fa-solid fa-draw-polygon" aria-hidden="true"></i> ${creating ? "Waiting for Region" : "Draw Arrival Region"}</button>${creating ? `<button type="button" class="rbb-button rbb-button-quiet" data-action="cancel-region-create">Cancel</button>` : ""}`
    : `${sceneNotice}<p class="rbb-recipe-prompt">Switch to the destination Scene before drawing the Region where Tokens should arrive.</p>`;
  const existing = `${sceneChooser}${sceneNotice}<p class="rbb-recipe-prompt">Choose an existing arrival Region.</p><div class="rbb-picker-list">${rows}</div>`;
  return `<section class="rbb-reference-field rbb-destination-picker">${mode === "existing" ? existing : create}<button type="button" class="rbb-back-link" data-action="set-region-reference-mode" data-reference-key="destinationsText" data-region-reference-mode="${mode === "existing" ? "create" : "existing"}">${mode === "existing" ? "Draw a new Arrival Region instead" : "Use an existing Arrival Region"}</button>${selectedSummary}</section>`;
}

function renderGuideDialogContent({ state, capabilities, catalog, canvasState, topic, selectedEntry, recipe, stepError }) {
  const recipeBack = recipe?.index ? `<button type="button" class="rbb-button rbb-button-quiet" data-action="recipe-back"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back</button>` : "";
  const nextLabel = recipe && recipe.index === recipe.steps.length - 1 ? "Finalize" : "Continue";
  const nextIcon = recipe && recipe.index === recipe.steps.length - 1 ? "fa-eye" : "fa-arrow-right";
  const nextAction = recipe ? `<button type="button" class="rbb-button rbb-button-primary" data-action="recipe-next" ${stepError ? "disabled" : ""}>${escapeHTML(nextLabel)} <i class="fa-solid ${nextIcon}" aria-hidden="true"></i></button>` : "";
  const closeAction = `<button type="button" class="rbb-button rbb-button-quiet" data-action="close-guide">Close</button>`;
  const activeStep = recipe?.step ?? (selectedEntry ? recipeStep(state, selectedEntry).step : null);
  const instruction = activeStep ? conciseGuidePrompt(activeStep, selectedEntry) : "Choose an option.";
  const stepContent = activeStep?.id === "regions"
    ? renderGuidedRegionStep(state, canvasState, selectedEntry, { showPrompt: false })
    : renderConfigCard(selectedEntry, state, capabilities, canvasState, { simple: true, showPrompt: false });
  const step = recipe?.index ?? 0;
  const total = recipe?.steps?.length ?? 1;
  const guideActions = renderGuideActions({ closeAction, backAction: recipeBack, action: nextAction, step, total });
  return `<div class="rbb-guide-content" data-topic="${escapeHTML(topic.id)}">${renderGuideHeader({ instruction })}<div class="rbb-guide-task"><div class="rbb-guide-step-content">${stepContent}</div>${guideActions}</div></div>`;
}

export function buildGuideContent({ state, capabilities, catalog, canvasState = globalThis.canvas } = {}) {
  if (state.pitfallGuideOpen) return renderPitfallGuideContent(state, canvasState);
  const topic = topicById(state.topic);
  const selectedEntry = catalog.find(entry => entry.key === state.behaviorKey);
  const configuring = state.effectChosen && ((topic.id === "native" && state.nativeView === "configure") || (topic.id === "traversal" && state.traversalView === "configure"));
  const recipe = configuring && selectedEntry ? recipeStep(state, selectedEntry) : null;
  const stepError = recipe ? recipeStepError(selectedEntry, recipe.step.id, state) : null;
  return renderGuideDialogContent({ state, capabilities, catalog, canvasState, topic, selectedEntry, recipe, stepError });
}

export function buildBuilderContent({ state, capabilities, catalog, canvasState = globalThis.canvas } = {}) {
  const topic = topicById(state.topic);
  const topicBody = topic.id === "home" ? renderVisualLaunchpad() : topic.id === "native" ? renderNativeTopic(state, catalog, capabilities, canvasState) : topic.id === "traversal" ? renderTraversalTopic(state, catalog, capabilities, canvasState) : topic.id === "puzzles" ? renderPuzzlesTopic(state) : topic.id === "studio" ? buildStudioContent({ state, canvasState }) : topic.id === "boss" ? renderBossTopic() : renderPlannedTopic(topic);
  const behaviorTopic = ["native", "traversal"].includes(state.topic);
  const selectedEntry = catalog.find(entry => entry.key === state.behaviorKey);
  const configuring = state.effectChosen && ((topic.id === "native" && state.nativeView === "configure") || (topic.id === "traversal" && state.traversalView === "configure"));
  const recipe = configuring && selectedEntry ? recipeStep(state, selectedEntry) : null;
  const guideRoute = guideRouteFor(state, recipe);
  const stepError = recipe ? recipeStepError(selectedEntry, recipe.step.id, state) : null;
  const recipeAction = "";
  const recipeBack = "";
  const alert = ["warning", "error", "success"].includes(state.status.kind) ? `<span class="rbb-footer-status is-${escapeHTML(state.status.kind)}"><i class="fa-solid ${state.status.kind === "error" ? "fa-triangle-exclamation" : state.status.kind === "success" ? "fa-circle-check" : "fa-circle-exclamation"}" aria-hidden="true"></i> ${escapeHTML(state.status.text)}</span>` : "";
  const reviewPanel = "";
  return `<div class="rbb-shell" data-topic="${escapeHTML(topic.id)}"><div class="rbb-body"><aside class="rbb-sidebar"><div class="rbb-sidebar-label">Tools</div><nav class="rbb-topic-nav" aria-label="Regionwright tools">${renderTopicNav(state, guideRoute)}</nav><div class="rbb-sidebar-footer"><button type="button" class="rbb-sidebar-action" data-action="help"><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Help</button><button type="button" class="rbb-sidebar-action" data-action="diagnostics"><i class="fa-solid fa-stethoscope" aria-hidden="true"></i> Diagnostics</button></div></aside><main class="rbb-main"><div class="rbb-workspace"><section class="rbb-options-column">${topicBody}</section></div></main></div>${reviewPanel}<footer class="rbb-footer"><button type="button" class="rbb-sidebar-action" data-action="settings"><i class="fa-solid fa-gear" aria-hidden="true"></i> Settings</button>${recipeBack}${alert}${recipeAction}</footer></div>`;
}

function settingsSheet() {
  return globalThis.game?.settings?.sheet ?? null;
}

export function openModuleSettings() {
  const sheet = settingsSheet();
  if (typeof sheet?.render === "function") {
    sheet.render(true);
    return true;
  }
  globalThis.ui?.notifications?.info?.("Open Configure Settings to manage Regionwright utilities.");
  return false;
}

function rootFor(application) {
  return application?.element?.[0] ?? application?.element ?? null;
}

function createGuideDialogClass(DialogV2, builder) {
  return class RegionBehaviorGuideDialog extends DialogV2 {
    constructor() {
      super({
        classes: ["regionwright", "regionwright-guide"],
        window: { title: "Regionwright: Studio Setup", icon: "fa-solid fa-puzzle-piece", resizable: true, minimizable: true },
        position: { width: 520, height: 300 },
        modal: false,
        content: builder._guideContent(),
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark", default: true }]
      });
      this._rbbListenerHost = null;
      this._rbbDragHost = null;
      this._rbbChangeHandler = event => builder._handleGuideChange(event, rootFor(this));
      this._rbbInputHandler = event => builder._readGuideFormState(rootFor(this));
      this._rbbDragMoveHandler = null;
      this._rbbDragEndHandler = null;
      this._rbbPointerDownHandler = event => this._startGuideDrag(event);
    }

    activateListeners(element) {
      this._bindGuideListeners(rootFor(this) ?? (element?.[0] ?? element));
    }

    _onRender(context, options) {
      super._onRender(context, options);
      this._bindGuideListeners(rootFor(this));
      this.bringToFront?.();
    }

    _bindGuideListeners(root) {
      if (!root) return;
      if (this._rbbListenerHost !== root) {
        this._rbbListenerHost?.removeEventListener("change", this._rbbChangeHandler, true);
        this._rbbListenerHost?.removeEventListener("input", this._rbbInputHandler, true);
        root.addEventListener("change", this._rbbChangeHandler, true);
        root.addEventListener("input", this._rbbInputHandler, true);
        this._rbbListenerHost = root;
      }
      const dragHost = root.querySelector?.(".rbb-guide-content") ?? null;
      if (this._rbbDragHost !== dragHost) {
        this._rbbDragHost?.removeEventListener("pointerdown", this._rbbPointerDownHandler);
        dragHost?.addEventListener("pointerdown", this._rbbPointerDownHandler);
        this._rbbDragHost = dragHost;
      }
    }

    _startGuideDrag(event) {
      if (event.button !== 0 || event.target?.closest?.("button, input, textarea, select, label, a, [role='option'], [role='listbox'], .rbb-dropdown, .rbb-reference-field, .rbb-guide-actions, .rbb-plan-panel, p")) return;
      const root = rootFor(this);
      if (!root) return;
      const bounds = root.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const left = bounds.left;
      const top = bounds.top;
      this._rbbDragMoveHandler = moveEvent => {
        const position = { left: Math.round(left + moveEvent.clientX - startX), top: Math.round(top + moveEvent.clientY - startY) };
        if (this.position) Object.assign(this.position, position);
        this.setPosition?.(position);
        Object.assign(root.style, { left: `${position.left}px`, top: `${position.top}px` });
      };
      this._rbbDragEndHandler = () => {
        globalThis.removeEventListener("pointermove", this._rbbDragMoveHandler);
        globalThis.removeEventListener("pointerup", this._rbbDragEndHandler);
        this._rbbDragMoveHandler = null;
        this._rbbDragEndHandler = null;
      };
      globalThis.addEventListener("pointermove", this._rbbDragMoveHandler);
      globalThis.addEventListener("pointerup", this._rbbDragEndHandler, { once: true });
    }

    _refreshGuide() {
      const content = rootFor(this)?.querySelector?.(".rbb-guide-content");
      if (content) {
        content.outerHTML = builder._guideContent();
        this._bindGuideListeners(rootFor(this));
      }
    }

    async close(options = {}) {
      this._rbbListenerHost?.removeEventListener("change", this._rbbChangeHandler, true);
      this._rbbListenerHost?.removeEventListener("input", this._rbbInputHandler, true);
      this._rbbDragHost?.removeEventListener("pointerdown", this._rbbPointerDownHandler);
      this._rbbDragEndHandler?.();
      this._rbbListenerHost = null;
      this._rbbDragHost = null;
      builder._guideClosed(this);
      return super.close(options);
    }

    async _onClickAction(event, target) {
      event.preventDefault();
      return builder._handleGuideAction(target, rootFor(this));
    }
  };
}

function createBuilderDialogClass(DialogV2) {
  return class RegionBehaviorBuilderDialog extends DialogV2 {
    constructor(options = {}) {
      const { state, capabilities, catalog, canvasState } = options;
      super({
        classes: ["regionwright"],
        window: { title: "Regionwright: Studio", icon: "fa-solid fa-puzzle-piece", resizable: true, minimizable: true },
        position: { width: 1250, height: 790 },
        content: buildBuilderContent({ state, capabilities, catalog, canvasState }),
        // DialogV2 requires a button definition. The generated footer is
        // hidden by our stylesheet; the window X remains the visible close UI.
        buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark", default: true }]
      });
      this._rbbState = state;
      this._rbbCapabilities = capabilities;
      this._rbbCatalog = catalog;
      this._rbbCanvasState = canvasState;
      this._rbbGuide = null;
      this._rbbMinimizedForGuide = false;
      this._rbbMinimizedForDrawing = null;
      this._rbbHoveredTarget = null;
      this._rbbDocumentHighlights = new Map();
      this._rbbHighlightFrame = null;
      this._rbbListenerHost = null;
      this._rbbClickHandler = event => { void this._handleClick(event); };
      this._rbbChangeHandler = event => this._handleChange(event);
      this._rbbTargetPointerOverHandler = event => this._handleTargetPointer(event, true);
      this._rbbTargetPointerOutHandler = event => this._handleTargetPointer(event, false);
      this._rbbKeepGuideFront = () => {
        if (!this._rbbGuide) return;
        const bringForward = () => this._rbbGuide?.bringToFront?.();
        if (typeof globalThis.requestAnimationFrame === "function") globalThis.requestAnimationFrame(bringForward);
        else bringForward();
      };
      this._rbbInputHandler = event => {
        if (event.target?.matches?.("[data-parameter]")) {
          const output = event.target.closest?.(".rbb-range-field")?.querySelector?.(`[data-range-value="${event.target.dataset.parameter}"]`);
          if (output) output.textContent = Number(event.target.value).toFixed(2);
          this._readFormState();
        }
      };
      this._rbbCreatedRegionHandler = (region, _options, userId) => this._captureCreatedRegion(region, userId);
      this._rbbCreatedRegionHook = globalThis.Hooks?.on?.("createRegion", this._rbbCreatedRegionHandler) ?? null;
      this._rbbCanvasReadyHandler = () => {
        this._rbbCanvasState = globalThis.canvas ?? this._rbbCanvasState;
        if (this._rbbState.regionCreatePending?.kind === "reference") this._rbbState.referenceSceneUuid = this._rbbCanvasState?.scene?.uuid ?? this._rbbState.referenceSceneUuid;
        this._reapplyDocumentHighlights();
        this._refresh();
      };
      this._rbbCanvasReadyHook = globalThis.Hooks?.on?.("canvasReady", this._rbbCanvasReadyHandler) ?? null;
    }

    activateListeners(element) {
      this._bindDOMListeners(rootFor(this) ?? (element?.[0] ?? element));
      this._bindCanvasDoubleClick();
    }

    /**
     * DialogV2 uses the ApplicationV2 render lifecycle rather than the
     * legacy activateListeners hook. Keep the latter for compatibility, but
     * bind from _onRender so controls work in Foundry v14.
     */
    _onRender(context, options) {
      super._onRender(context, options);
      this._bindDOMListeners(rootFor(this));
      this._bindCanvasDoubleClick();
    }

    _bindDOMListeners(root) {
      if (!root || this._rbbListenerHost === root) return;
      this._unbindDOMListeners();
      root.addEventListener("click", this._rbbClickHandler);
      root.addEventListener("change", this._rbbChangeHandler);
      root.addEventListener("input", this._rbbInputHandler);
      root.addEventListener("pointerover", this._rbbTargetPointerOverHandler);
      root.addEventListener("pointerout", this._rbbTargetPointerOutHandler);
      root.addEventListener("pointerdown", this._rbbKeepGuideFront, true);
      root.addEventListener("focusin", this._rbbKeepGuideFront, true);
      this._rbbListenerHost = root;
    }

    _unbindDOMListeners() {
      if (!this._rbbListenerHost) return;
      this._rbbListenerHost.removeEventListener("click", this._rbbClickHandler);
      this._rbbListenerHost.removeEventListener("change", this._rbbChangeHandler);
      this._rbbListenerHost.removeEventListener("input", this._rbbInputHandler);
      this._rbbListenerHost.removeEventListener("pointerover", this._rbbTargetPointerOverHandler);
      this._rbbListenerHost.removeEventListener("pointerout", this._rbbTargetPointerOutHandler);
      this._rbbListenerHost.removeEventListener("pointerdown", this._rbbKeepGuideFront, true);
      this._rbbListenerHost.removeEventListener("focusin", this._rbbKeepGuideFront, true);
      this._rbbListenerHost = null;
    }

    async close(options = {}) {
      this._unbindDOMListeners();
      this._unbindCanvasDoubleClick();
      this._clearAllDocumentHighlights();
      if (this._rbbCreatedRegionHook !== null) globalThis.Hooks?.off?.("createRegion", this._rbbCreatedRegionHook);
      this._rbbCreatedRegionHook = null;
      if (this._rbbCanvasReadyHook !== null) globalThis.Hooks?.off?.("canvasReady", this._rbbCanvasReadyHook);
      this._rbbCanvasReadyHook = null;
      await this._closeGuide();
      return super.close(options);
    }

    _root() {
      return rootFor(this)?.querySelector?.(".rbb-shell") ?? null;
    }

    _readFormState() {
      const root = this._root();
      if (!root) return;
      const parameters = { ...this._rbbState.parameters };
      for (const control of root.querySelectorAll("[data-parameter]")) {
        const key = control.dataset.parameter;
        if (key === "events") parameters.events = [control.value];
        else if (control.type === "checkbox") parameters[key] = control.checked;
        else if (control.type === "number") parameters[key] = Number(control.value);
        else parameters[key] = control.value;
      }
      const difficulties = {};
      for (const control of root.querySelectorAll("[data-movement-action]")) {
        difficulties[control.dataset.movementAction] = Number(control.value);
      }
      if (Object.keys(difficulties).length) parameters.difficulties = difficulties;
      const regionRenames = { ...this._rbbState.regionRenames };
      for (const control of root.querySelectorAll("[data-region-rename]")) {
        regionRenames[control.dataset.regionRename] = control.value;
      }
      this._rbbState.regionRenames = regionRenames;
      const link = { ...this._rbbState.link };
      for (const control of root.querySelectorAll("[data-link]")) link[control.dataset.link] = control.type === "checkbox" ? control.checked : control.value;
      this._rbbState.parameters = parameters;
      this._rbbState.link = link;
      const approval = root.querySelector('[data-input="gmReviewed"]');
      if (approval) this._rbbState.gmReviewed = Boolean(approval.checked);
    }

    _readGuideFormState(root) {
      if (!root) return;
      const parameters = { ...this._rbbState.parameters };
      for (const control of root.querySelectorAll("[data-parameter]")) {
        const key = control.dataset.parameter;
        if (key === "events") parameters.events = [control.value];
        else if (control.type === "checkbox") parameters[key] = control.checked;
        else if (control.type === "number") parameters[key] = Number(control.value);
        else parameters[key] = control.value;
      }
      const difficulties = {};
      for (const control of root.querySelectorAll("[data-movement-action]")) {
        difficulties[control.dataset.movementAction] = Number(control.value);
      }
      if (Object.keys(difficulties).length) parameters.difficulties = difficulties;
      this._rbbState.parameters = parameters;
      const approval = root.querySelector('[data-input="gmReviewed"]');
      if (approval) this._rbbState.gmReviewed = Boolean(approval.checked);
    }

    _toggleDropdown(id) {
      this._rbbState.openDropdown = this._rbbState.openDropdown === id ? null : id;
      this._refresh();
    }

    async _switchToScene(uuid) {
      const scene = globalThis.game?.scenes?.get?.(uuid)
        ?? Array.from(globalThis.game?.scenes?.values?.() ?? globalThis.game?.scenes ?? []).find(candidate => candidate?.uuid === uuid);
      if (!scene) return this._setStatus("error", "That Scene is no longer available.");
      if (scene.uuid === globalThis.canvas?.scene?.uuid) return this._setStatus("info", `${scene.name ?? "This Scene"} is already active.`);
      if (typeof scene.view !== "function") return this._setStatus("error", "Foundry could not switch to that Scene from this prompt.");
      try {
        this._rbbState.referenceSceneUuid = scene.uuid;
        await scene.view();
        this._setStatus("info", `Switched to ${scene.name ?? "the selected Scene"}. Choose the highlighted Region to continue.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Scene could not be activated.");
      }
    }

    _chooseDropdown(action) {
      const { dropdownBinding: binding, dropdownKey: key, dropdownValue: value } = action.dataset;
      if (binding === "input" && key === "browserScene") this._rbbState.browserSceneUuid = value;
      if (binding === "input" && ["referenceScene", "regionScene"].includes(key)) this._rbbState.referenceSceneUuid = value;
      if (binding === "parameter") {
        const parameters = { ...this._rbbState.parameters };
        parameters[key] = key === "events" ? [value] : value;
        this._rbbState.parameters = parameters;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
      }
      this._rbbState.openDropdown = null;
      this._refresh();
    }

    _chooseParameterOption(action) {
      const parameters = { ...this._rbbState.parameters };
      const value = action.dataset.parameterValue;
      parameters[action.dataset.parameterKey] = value === "true" ? true : value === "false" ? false : value;
      this._rbbState.parameters = parameters;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._refresh();
    }

    _guideContent() {
      return buildGuideContent({ state: this._rbbState, capabilities: this._rbbCapabilities, catalog: this._rbbCatalog, canvasState: this._rbbCanvasState });
    }

    _openGuide() {
      if (!this._rbbState.effectChosen) return;
      if (this._rbbGuide) return this._rbbGuide._refreshGuide();
      const entry = getBehaviorDefinition(this._rbbState.behaviorKey);
      if (recipeStep(this._rbbState, entry).step?.id === "regions") this._rbbState.pickerType = "region";
      this._rbbState.guideOpen = true;
      this._refresh();
      const GuideDialog = createGuideDialogClass(DialogV2, this);
      this._rbbGuide = new GuideDialog();
      this._rbbGuide.render({ force: true });
      void this._minimizeForGuide();
    }

    _openPitfallGuide() {
      this._rbbState.selection = [];
      this._rbbState.regionRenames = {};
      this._rbbState.pitfallDc = 15;
      this._rbbState.pitfallDamage = "2d6";
      this._rbbState.pitfallStep = 0;
      this._rbbState.pitfallGuideOpen = true;
      this._rbbState.guideOpen = true;
      this._rbbState.pickerType = "region";
      this._rbbState.regionPickerMode = "create";
      if (this._rbbGuide) return this._rbbGuide._refreshGuide();
      this._refresh();
      const GuideDialog = createGuideDialogClass(DialogV2, this);
      this._rbbGuide = new GuideDialog();
      this._rbbGuide.render({ force: true });
      void this._minimizeForGuide();
    }

    _readPitfallGuideFormState(root) {
      const dc = root?.querySelector?.("[data-pitfall-dc]");
      const damage = root?.querySelector?.("[data-pitfall-damage]");
      if (dc) this._rbbState.pitfallDc = Number(dc.value);
      if (damage) this._rbbState.pitfallDamage = damage.value;
    }

    _pitfallNext() {
      if (this._rbbState.pitfallStep === 0 && !selectedPitfallRegion(this._rbbState)) {
        this._setStatus("warning", "Draw or choose one Region for the pit.");
        return;
      }
      if (this._rbbState.pitfallStep === 1 && (!Number.isInteger(this._rbbState.pitfallDc) || this._rbbState.pitfallDc < 1 || this._rbbState.pitfallDc > 30)) {
        this._setStatus("warning", "Set a DC from 1 to 30.");
        return;
      }
      this._rbbState.pitfallStep = Math.min(2, Number(this._rbbState.pitfallStep) + 1);
      this._refresh();
    }

    _pitfallBack() {
      this._rbbState.pitfallStep = Math.max(0, Number(this._rbbState.pitfallStep) - 1);
      if (this._rbbState.pitfallStep === 0) this._rbbState.pickerType = "region";
      this._refresh();
    }

    async _createPitfallTrap() {
      const region = selectedPitfallRegion(this._rbbState);
      if (!region) return this._setStatus("warning", "Draw or choose one Region for the pit.");
      try {
        await configurePitfallTrap({ region: region.uuid, dc: this._rbbState.pitfallDc, damage: this._rbbState.pitfallDamage });
        this._clearGuidedSelections();
        await this._closeGuide();
        this._setStatus("success", `Pitfall Trap added to ${region.name}.`);
      } catch (error) {
        this._setStatus("error", error.message);
      }
    }

    _refreshGuide() {
      this._rbbGuide?._refreshGuide?.();
      this._rbbGuide?.bringToFront?.();
    }

    _guideClosed(guide) {
      if (this._rbbGuide !== guide) return;
      this._rbbGuide = null;
      this._rbbState.guideOpen = false;
      this._rbbState.pitfallGuideOpen = false;
      void this._restoreFromGuide();
      this._refresh();
    }

    async _closeGuide() {
      const guide = this._rbbGuide;
      this._rbbGuide = null;
      this._rbbState.guideOpen = false;
      this._rbbState.pitfallGuideOpen = false;
      if (guide) await guide.close({ force: true });
      await this._restoreFromGuide();
    }

    async _minimizeForDrawing() {
      if (this._rbbMinimizedForDrawing) return;
      const target = this._rbbGuide ?? this;
      if (typeof target?.minimize !== "function") return;
      await target.minimize();
      this._rbbMinimizedForDrawing = target;
    }

    async _restoreAfterDrawing() {
      const target = this._rbbMinimizedForDrawing;
      this._rbbMinimizedForDrawing = null;
      if (!target || typeof target.maximize !== "function") return;
      await target.maximize();
      target.bringToFront?.();
    }

    async _minimizeForGuide() {
      if (this._rbbMinimizedForGuide || typeof this.minimize !== "function") return;
      await this.minimize();
      this._rbbMinimizedForGuide = true;
    }

    async _restoreFromGuide() {
      if (!this._rbbMinimizedForGuide) return;
      this._rbbMinimizedForGuide = false;
      if (typeof this.maximize === "function") await this.maximize();
    }

    _refresh() {
      const shell = this._root();
      if (shell) shell.outerHTML = buildBuilderContent({ state: this._rbbState, capabilities: this._rbbCapabilities, catalog: this._rbbCatalog, canvasState: this._rbbCanvasState });
      this._refreshGuide();
    }

    _setStatus(kind, text) {
      this._rbbState.status = { kind, text };
      this._refresh();
    }

    _studioStore() {
      return createStudioDraftStore({ capabilities: studioService.capabilities() });
    }

    _studioUpdate(mutator) {
      const source = this._rbbState.studioBlueprint ?? studioService.starter({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      const draft = structuredClone(source);
      mutator(draft);
      this._rbbState.studioBlueprint = studioService.create(draft);
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDiagnostics = null;
      this._rbbState.studioDirty = true;
    }

    _readStudioFormState() {
      if (this._rbbState.topic !== "studio" || !this._rbbState.studioBlueprint) return;
      const root = this._root();
      const selectedId = this._rbbState.studioSelectedNodeId;
      const controls = root?.querySelectorAll?.("[data-studio-field]") ?? [];
      if (!selectedId || !controls.length) return;
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === selectedId);
        if (!node) return;
        for (const control of controls) {
          if (control.dataset.studioField === "label") node.label = control.value;
          if (control.dataset.studioField === "text") node.config.text = control.value;
          if (control.dataset.studioField === "factLabel") {
            node.config.label = control.value;
            try { node.config.factId = storyFactId(control.value); } catch { node.config.factId = ""; }
          }
        }
      });
    }

    _studioStartSample() {
      this._rbbState.studioBlueprint = studioService.starter({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "plate";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Pressure Plate Alarm loaded. Choose its Region, edit the warning, then review the activity.");
    }

    _studioStartSceneMoment() {
      this._rbbState.studioBlueprint = studioService.sceneMoment({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "moment-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Scene Moment loaded. Choose an area, hidden creatures, and a message.");
    }

    _studioStartSecretReveal() {
      this._rbbState.studioBlueprint = studioService.secretReveal({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "moment-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Secret Reveal loaded. Choose an area, hidden creatures, and a clue.");
    }

    _studioStartRoomTransformation() {
      this._rbbState.studioBlueprint = studioService.roomTransformation({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "moment-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Room Transformation loaded. Choose an area and hidden room features.");
    }

    _studioStartStoryBeat() {
      this._rbbState.studioBlueprint = studioService.storyBeat({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "beat-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Story Beat loaded. Choose an area, edit the message, then check it.");
    }

    _studioStartPortal() {
      this._rbbState.studioBlueprint = studioService.portal({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "portal-entry";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Scene Portal loaded. Choose an entrance, then an arrival Scene and area.");
    }

    _studioStartStoryFact() {
      this._rbbState.studioBlueprint = studioService.storyFact({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "fact-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Story Fact loaded. Choose an area, name the progress, then check it.");
    }

    _studioStartHubUnlock() {
      this._rbbState.studioBlueprint = studioService.hubUnlock({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "hub-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Hub Unlock loaded. Choose the final area, objectives, and Door.");
    }

    _studioStartKeyGate() {
      this._rbbState.studioBlueprint = studioService.keyGate({ sceneUuid: globalThis.canvas?.scene?.uuid ?? "Scene.demo", sceneName: globalThis.canvas?.scene?.name ?? "Demo Scene" });
      this._rbbState.studioView = "edit";
      this._rbbState.studioSelectedNodeId = "hub-region";
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = true;
      this._setStatus("info", "Key Gate loaded. Choose its area, named key, and Door.");
    }

    async _studioResetFact(id) {
      try {
        await createStoryFactStore().reset(id);
        this._setStatus("success", "Story fact reset.");
      } catch (error) { this._setStatus("error", error.message ?? "That story fact could not be reset."); }
    }

    async _studioLoadDraft() {
      try {
        const draft = await this._studioStore().load();
        if (!draft) return this._setStatus("warning", "No valid Studio draft was found in this world.");
        this._rbbState.studioBlueprint = draft;
        this._rbbState.studioView = "edit";
        this._rbbState.studioSelectedNodeId = draft.nodes[0]?.id ?? null;
        this._rbbState.studioCompilation = null;
        this._rbbState.studioDiagnostics = null;
        this._rbbState.studioDirty = false;
        this._setStatus("success", `Loaded Studio draft: ${draft.name}.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Studio draft could not be loaded.");
      }
    }

    async _studioSaveDraft() {
      this._readStudioFormState();
      if (!this._rbbState.studioBlueprint) return this._setStatus("warning", "Create the Pressure Plate Alarm before saving a draft.");
      try {
        const saved = await this._studioStore().save(this._rbbState.studioBlueprint);
        this._rbbState.studioBlueprint = saved;
        this._rbbState.studioDirty = false;
        this._setStatus("success", `Saved Studio draft: ${saved.name}. No Scene documents were changed.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Studio draft could not be saved.");
      }
    }

    _studioSelectNode(id) {
      this._rbbState.studioSelectedNodeId = id;
      const node = this._rbbState.studioBlueprint?.nodes?.find(candidate => candidate.id === id);
      const uuid = node?.config?.targetUuid;
      if (uuid) this._setDocumentHighlight(uuid, node?.type === "openDoor" ? "door" : "region", true);
      for (const targetUuid of node?.config?.targetUuids ?? []) this._setDocumentHighlight(targetUuid, "token", true);
      for (const targetUuid of node?.config?.targetTileUuids ?? []) this._setDocumentHighlight(targetUuid, "tile", true);
      this._refresh();
    }

    _studioPickRegion(uuid) {
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === this._rbbState.studioSelectedNodeId);
        if (!node) return;
        node.config.targetUuid = uuid;
        node.config.targetSceneUuid = globalThis.canvas?.scene?.uuid ?? null;
        if (draft.id === "scene-portal" && node.id === "portal-arrival") node.sceneUuid = node.config.targetSceneUuid;
      });
      this._setDocumentHighlight(uuid, "region", true);
      this._locateDocument(uuid, "region");
      this._setStatus("success", "Region selected for the Studio trigger. Its area is pulsing on the map.");
    }

    _studioSetPortalScene(sceneUuid) {
      const scene = scenesForBrowser(this._rbbCanvasState).find(candidate => candidate.uuid === sceneUuid);
      const sourceSceneUuid = this._rbbState.studioBlueprint?.nodes?.find(node => node.id === "portal-entry")?.sceneUuid;
      if (!scene || sceneUuid === sourceSceneUuid) return this._setStatus("warning", "Choose a different destination Scene.");
      this._studioUpdate(draft => {
        const arrival = draft.nodes.find(node => node.id === "portal-arrival");
        if (!arrival) return;
        arrival.sceneUuid = scene.uuid;
        arrival.config.targetSceneUuid = scene.uuid;
        delete arrival.config.targetUuid;
        const index = draft.scenes.findIndex(entry => entry.uuid === scene.uuid);
        if (index >= 0) draft.scenes[index] = { uuid: scene.uuid, name: String(scene.name ?? "Unnamed Scene") };
        else draft.scenes.push({ uuid: scene.uuid, name: String(scene.name ?? "Unnamed Scene") });
      });
      this._setStatus("info", `Destination set to ${scene.name ?? "the selected Scene"}. Switch Scenes to choose its arrival area.`);
    }

    _studioPickToken(uuid) {
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === this._rbbState.studioSelectedNodeId);
        if (!node) return;
        const selected = new Set(node.config.targetUuids ?? []);
        if (selected.has(uuid)) selected.delete(uuid); else selected.add(uuid);
        node.config.targetUuids = [...selected];
      });
      this._setDocumentHighlight(uuid, "token", true);
      this._locateDocument(uuid, "token");
      this._setStatus("success", "Creature selection updated. It is pulsing on the map.");
    }

    _studioPickTile(uuid) {
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === this._rbbState.studioSelectedNodeId);
        if (!node) return;
        const selected = new Set(node.config.targetTileUuids ?? []);
        if (selected.has(uuid)) selected.delete(uuid); else selected.add(uuid);
        node.config.targetTileUuids = [...selected];
      });
      this._setDocumentHighlight(uuid, "tile", true);
      this._locateDocument(uuid, "tile");
      this._setStatus("success", "Tile selection updated. It is pulsing on the map.");
    }

    _studioPickDoor(uuid) {
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === this._rbbState.studioSelectedNodeId);
        if (!node) return;
        node.config.targetUuid = uuid;
      });
      this._setDocumentHighlight(uuid, "door", true);
      this._locateDocument(uuid, "door");
      this._setStatus("success", "Door selected. Its location is pulsing on the map.");
    }

    _studioToggleFact(id) {
      this._studioUpdate(draft => {
        const node = draft.nodes.find(candidate => candidate.id === this._rbbState.studioSelectedNodeId);
        if (!node) return;
        const selected = new Set(node.config.factIds ?? []);
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        node.config.factIds = [...selected];
      });
      this._setStatus("success", "Hub objectives updated.");
    }

    _locateDocument(uuid, type) {
      const placeable = this._documentPlaceables(uuid, type)[0];
      const anchor = locatorAnchor(placeable, type);
      if (!anchor || typeof globalThis.canvas?.animatePan !== "function") return false;
      globalThis.canvas.animatePan({ x: anchor.x, y: anchor.y, scale: Math.max(0.8, Number(globalThis.canvas?.stage?.scale?.x) || 1) });
      return true;
    }

    _studioReview() {
      this._readStudioFormState();
      if (!this._rbbState.studioBlueprint) return this._setStatus("warning", "Choose a Studio activity before checking it.");
      try {
        const activityId = this._rbbState.studioBlueprint.id;
        const sceneMoment = activityId === "scene-moment";
        const storyBeat = activityId === "story-beat";
        const portal = activityId === "scene-portal";
        const storyFact = activityId === "story-fact";
        const hubUnlock = activityId === "hub-unlock";
        if (sceneMoment) buildSceneMomentActivityPlans(this._rbbState.studioBlueprint);
        else if (storyBeat) buildStoryBeatActivityPlans(this._rbbState.studioBlueprint);
        else if (portal) buildScenePortalActivityPlan(this._rbbState.studioBlueprint);
        else if (storyFact) buildStoryFactActivityPlans(this._rbbState.studioBlueprint);
        else if (hubUnlock) buildHubUnlockActivityPlans(this._rbbState.studioBlueprint);
        else buildPressurePlateActivityPlans(this._rbbState.studioBlueprint);
        this._rbbState.studioCompilation = compileScenarioBlueprint(this._rbbState.studioBlueprint, { capabilities: studioService.capabilities(), availableBehaviorTypes: this._rbbCapabilities.supportedBehaviorTypes });
        this._rbbState.studioDiagnostics = diagnoseStudioBlueprint(this._rbbState.studioBlueprint, { activeSceneUuid: globalThis.canvas?.scene?.uuid, facts: createStoryFactStore().load() });
        this._rbbState.studioView = "review";
        const label = sceneMoment ? "Scene Moment" : hubUnlock ? "Hub Unlock" : storyFact ? "Story Fact" : portal ? "Scene Portal" : storyBeat ? "Story Beat" : "Pressure Plate";
        const ready = this._rbbState.studioCompilation.execution.readyForReview && !this._rbbState.studioDiagnostics.errors.length;
        this._setStatus(ready ? "success" : "warning", ready ? `${label} is ready to publish.` : `${label} needs attention before publishing.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Studio activity could not be checked.");
      }
    }

    async _studioPublish() {
      this._readStudioFormState();
      if (!this._rbbState.studioBlueprint) return this._setStatus("warning", "Choose a Studio activity before publishing it.");
      try {
        const activityId = this._rbbState.studioBlueprint.id;
        const sceneMoment = activityId === "scene-moment";
        const storyBeat = activityId === "story-beat";
        const portal = activityId === "scene-portal";
        const storyFact = activityId === "story-fact";
        const hubUnlock = activityId === "hub-unlock";
        const result = sceneMoment ? await publishSceneMomentActivity(this._rbbState.studioBlueprint) : hubUnlock ? await publishHubUnlockActivity(this._rbbState.studioBlueprint) : storyFact ? await publishStoryFactActivity(this._rbbState.studioBlueprint) : portal ? await publishScenePortalActivity(this._rbbState.studioBlueprint) : storyBeat ? await publishStoryBeatActivity(this._rbbState.studioBlueprint) : await publishPressurePlateActivity(this._rbbState.studioBlueprint);
        this._studioUpdate(draft => { draft.status = "published"; });
        this._rbbState.studioBlueprint = await this._studioStore().save(this._rbbState.studioBlueprint);
        this._rbbState.studioDirty = false;
        this._rbbState.studioCompilation = compileScenarioBlueprint(this._rbbState.studioBlueprint, { capabilities: studioService.capabilities(), availableBehaviorTypes: this._rbbCapabilities.supportedBehaviorTypes });
        this._rbbState.studioView = "review";
        this._setStatus("success", `${sceneMoment ? "Scene Moment" : hubUnlock ? "Hub Unlock" : storyFact ? "Story Fact" : portal ? "Scene Portal" : storyBeat ? "Story Beat" : "Pressure Plate"} published to ${result.region.name}.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Studio activity could not be published.");
      }
    }

    async _studioUnpublish() {
      if (!this._rbbState.studioBlueprint) return;
      try {
        const activityId = this._rbbState.studioBlueprint.id;
        const sceneMoment = activityId === "scene-moment";
        const storyBeat = activityId === "story-beat";
        const portal = activityId === "scene-portal";
        const storyFact = activityId === "story-fact";
        const hubUnlock = activityId === "hub-unlock";
        const result = sceneMoment ? await clearSceneMomentActivity(this._rbbState.studioBlueprint) : hubUnlock ? await clearHubUnlockActivity(this._rbbState.studioBlueprint) : storyFact ? await clearStoryFactActivity(this._rbbState.studioBlueprint) : portal ? await clearScenePortalActivity(this._rbbState.studioBlueprint) : storyBeat ? await clearStoryBeatActivity(this._rbbState.studioBlueprint) : await clearPressurePlateActivity(this._rbbState.studioBlueprint);
        this._studioUpdate(draft => { draft.status = "draft"; });
        this._rbbState.studioBlueprint = await this._studioStore().save(this._rbbState.studioBlueprint);
        this._rbbState.studioDirty = false;
        this._rbbState.studioCompilation = compileScenarioBlueprint(this._rbbState.studioBlueprint, { capabilities: studioService.capabilities(), availableBehaviorTypes: this._rbbCapabilities.supportedBehaviorTypes });
        this._rbbState.studioView = "review";
        this._setStatus("success", `Removed ${result.removed} Studio behavior${result.removed === 1 ? "" : "s"} from ${result.region.name}.`);
      } catch (error) {
        this._setStatus("error", error.message ?? "The Studio activity could not be removed.");
      }
    }

    _studioReset() {
      this._rbbState.studioBlueprint = null;
      this._rbbState.studioView = "home";
      this._rbbState.studioSelectedNodeId = null;
      this._rbbState.studioCompilation = null;
      this._rbbState.studioDirty = false;
      this._setStatus("info", "Pressure Plate Alarm reset. Published activities remain on the Scene until removed from the activity review.");
    }

    _canvasView() {
      return this._rbbCanvasState?.app?.view ?? this._rbbCanvasState?.view ?? null;
    }

    _bindCanvasDoubleClick() {
      const view = this._canvasView();
      if (!view || this._rbbDoubleClickView) return;
      this._rbbDoubleClickHandler = event => {
        if (event.defaultPrevented) return;
        this._addControlled("double-click");
      };
      view.addEventListener?.("dblclick", this._rbbDoubleClickHandler, { capture: true });
      this._rbbDoubleClickView = view;
    }

    _unbindCanvasDoubleClick() {
      this._rbbDoubleClickView?.removeEventListener?.("dblclick", this._rbbDoubleClickHandler, { capture: true });
      this._rbbDoubleClickView = null;
      this._rbbDoubleClickHandler = null;
    }

    _selectBehavior(key) {
      const entry = getBehaviorDefinition(key);
      if (!entry) return;
      this._rbbState.behaviorKey = key;
      this._rbbState.parameters = defaultParameters(key);
      this._rbbState.regionPickerMode = "create";
      this._rbbState.regionReferenceMode = {};
      this._rbbState.referenceSceneUuid = globalThis.canvas?.scene?.uuid ?? this._rbbState.referenceSceneUuid;
      this._rbbState.regionCreatePending = null;
      // Always begin with the document prompt. Existing selected Regions stay
      // visible, but the GM explicitly confirms that they are the intended
      // targets before moving to the next question.
      this._rbbState.recipeStep = 0;
      if (this._rbbState.topic === "native") {
        this._rbbState.nativeCategory = entry.category;
        this._rbbState.nativeView = "configure";
      }
      if (this._rbbState.topic === "traversal") this._rbbState.traversalView = "configure";
      this._rbbState.effectChosen = true;
      this._rbbState.plan = null;
      this._rbbState.previewed = false;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      this._setStatus("info", `${entry.label} selected. Configure the options, then preview the exact plan.`);
      this._openGuide();
    }

    _addReference(key, uuid, single = false) {
      const parameters = { ...this._rbbState.parameters };
      const current = uuidValues(parameters[key]);
      parameters[key] = single ? uuid : [...new Set([...current, uuid])].join("\n");
      this._rbbState.parameters = parameters;
      if (key === "destinationsText") this._setDocumentHighlight(uuid, "region", true);
      this._rbbState.referencePicker = single ? null : this._rbbState.referencePicker;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      this._refresh();
    }

    _setRegionPickerMode(mode) {
      this._rbbState.regionPickerMode = mode === "existing" ? "existing" : "create";
      this._refresh();
    }

    _setRegionReferenceMode(key, mode) {
      this._rbbState.regionReferenceMode = { ...this._rbbState.regionReferenceMode, [key]: mode === "existing" ? "existing" : "create" };
      this._refresh();
    }

    async _beginRegionCreate({ kind = "selection", referenceKey = "", single = false } = {}) {
      const activeScene = globalThis.canvas?.scene;
      if (!activeScene?.uuid) return this._setStatus("warning", "Open the Scene where the new Region belongs first.");
      if (!globalThis.game?.user?.can?.("REGION_CREATE")) return this._setStatus("error", "You do not have permission to create Regions.");
      this._rbbCanvasState = globalThis.canvas;
      this._rbbState.regionCreatePending = { kind, referenceKey, single, sceneUuid: activeScene.uuid, userId: globalThis.game?.user?.id ?? null };
      try {
        await this._minimizeForDrawing();
        await globalThis.ui?.controls?.activate?.({ control: "regions", tool: "rectangle" });
      } catch (error) {
        this._rbbState.regionCreatePending = null;
        await this._restoreAfterDrawing();
        this._setStatus("error", error.message ?? "Region drawing could not be started.");
      }
    }

    _cancelRegionCreate() {
      if (!this._rbbState.regionCreatePending) return;
      this._rbbState.regionCreatePending = null;
      void this._restoreAfterDrawing();
      this._setStatus("info", "Region drawing canceled.");
    }

    _captureCreatedRegion(region, userId) {
      const pending = this._rbbState.regionCreatePending;
      if (!pending || !region?.uuid || region.parent?.uuid !== pending.sceneUuid) return;
      if (pending.userId && userId && userId !== pending.userId) return;
      const reference = regionReferencesForScene(region.parent).find(entry => entry.uuid === region.uuid);
      if (!reference) return;
      this._rbbCanvasState = globalThis.canvas ?? this._rbbCanvasState;
      this._rbbState.regionCreatePending = null;
      void this._restoreAfterDrawing();
      if (pending.kind === "studio") {
        this._studioPickRegion(reference.uuid);
        return;
      } else if (pending.kind === "reference") {
        const parameters = { ...this._rbbState.parameters };
        const values = uuidValues(parameters[pending.referenceKey]);
        parameters[pending.referenceKey] = pending.single ? reference.uuid : [...new Set([...values, reference.uuid])].join("\n");
        this._rbbState.parameters = parameters;
      } else this._rbbState.selection = mergeSelection(this._rbbState.selection, [reference]);
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      this._setStatus("success", `${reference.name} added to this setup.`);
      this._refresh();
    }

    _clearGuidedSelections() {
      this._rbbState.selection = [];
      this._rbbState.targets = [];
      this._rbbState.regionRenames = {};
      this._rbbState.referencePicker = null;
      this._rbbState.openDropdown = null;
      this._rbbHoveredTarget = null;
      this._clearAllDocumentHighlights();
    }

    _removeReference(key, uuid) {
      const parameters = { ...this._rbbState.parameters };
      parameters[key] = uuidValues(parameters[key]).filter(value => value !== uuid).join("\n");
      this._rbbState.parameters = parameters;
      if (key === "destinationsText") this._clearDocumentHighlight(uuid, "region");
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      this._refresh();
    }

    _addControlled(source = "button") {
      const fresh = captureSelection({ canvasState: this._rbbCanvasState });
      const previousCount = this._rbbState.selection.length;
      this._rbbState.selection = mergeSelection(this._rbbState.selection, fresh);
      for (const region of fresh) this._setDocumentHighlight(region.uuid, "region", true);
      const addedCount = this._rbbState.selection.length - previousCount;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      const sourceLabel = source === "double-click" ? "Double-click shortcut" : "Add Controlled";
      this._setStatus(addedCount ? "success" : "warning", addedCount ? `${sourceLabel} added ${addedCount} Region${addedCount === 1 ? "" : "s"}.` : "No new controlled Regions found. Select a Region on the canvas first.");
    }

    _addSceneRegion(uuid) {
      const region = sceneRegionReferences(this._rbbCanvasState).find(reference => reference.uuid === uuid);
      if (!region) return this._setStatus("error", "That Region is no longer available in the active Scene.");
      const previousCount = this._rbbState.selection.length;
      this._rbbState.selection = mergeSelection(this._rbbState.selection, [region]);
      this._setDocumentHighlight(region.uuid, "region", true);
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      this._rbbState.pickerOpen = false;
      const added = this._rbbState.selection.length > previousCount;
      this._setStatus(added ? "success" : "info", added ? `Added ${region.name} to this Behavior.` : `${region.name} is already selected.`);
    }

    _toggleSceneRegion(uuid) {
      if (this._rbbState.selection.some(region => region.uuid === uuid)) return this._removeRegion(uuid);
      this._addSceneRegion(uuid);
    }

    _addTarget(typeId, uuid) {
      if (typeId === "region") return this._addSceneRegion(uuid);
      const type = targetTypeById(typeId);
      const reference = targetReferences(type.id, { canvasState: this._rbbCanvasState }).find(item => item.uuid === uuid);
      if (!reference) return this._setStatus("error", `That ${type.label} is no longer available.`);
      const before = this._rbbState.targets.length;
      this._rbbState.targets = mergeSelection(this._rbbState.targets, [reference]);
      this._setDocumentHighlight(reference.uuid, type.id, true);
      this._rbbState.pickerOpen = false;
      const added = this._rbbState.targets.length > before;
      this._setStatus(added ? "success" : "info", added ? `Added ${reference.name} as a ${type.label} reference. It will not be changed by this Region Behavior.` : `${reference.name} is already selected.`);
    }

    _removeTarget(uuid) {
      const target = this._rbbState.targets.find(item => item.uuid === uuid);
      this._rbbState.targets = this._rbbState.targets.filter(item => item.uuid !== uuid);
      this._setDocumentHighlight(uuid, target?.type ?? "door", false);
      this._setStatus("info", "Reference removed. No document was changed.");
    }

    _handleTargetPointer(event, active) {
      const target = event.target?.closest?.("[data-highlight-target]");
      if (!target) return;
      const uuid = target.dataset.highlightTarget;
      const type = target.dataset.highlightType;
      if (active) {
        if (this._rbbHoveredTarget && this._rbbHoveredTarget.uuid !== uuid) this._setDocumentHighlight(this._rbbHoveredTarget.uuid, this._rbbHoveredTarget.type, false);
        this._rbbHoveredTarget = { uuid, type };
        this._setDocumentHighlight(uuid, type, true);
      } else if (this._rbbHoveredTarget?.uuid === uuid) {
        this._rbbHoveredTarget = null;
        this._setDocumentHighlight(uuid, type, false);
      }
    }

    _setDocumentHighlight(uuid, type, requested) {
      const studioSelected = this._rbbState.studioBlueprint?.nodes?.some(node => node.config?.targetUuid === uuid || node.config?.targetUuids?.includes?.(uuid) || node.config?.targetTileUuids?.includes?.(uuid));
      const selected = type === "region"
        ? this._rbbState.selection.some(region => region.uuid === uuid) || uuidValues(this._rbbState.parameters?.destinationsText).includes(uuid) || studioSelected
        : this._rbbState.targets.some(target => target.uuid === uuid);
      const active = Boolean(selected || requested && this._rbbHoveredTarget?.uuid === uuid);
      const key = `${type}:${uuid}`;
      if (!active) {
        this._restoreDocumentHighlight(key);
        return;
      }
      const highlight = this._rbbDocumentHighlights.get(key) ?? { uuid, type, placeables: [], originalAlpha: new Map() };
      highlight.placeables = this._documentPlaceables(uuid, type);
      for (const placeable of highlight.placeables) {
        placeable.hover = true;
        if (!highlight.originalAlpha.has(placeable)) highlight.originalAlpha.set(placeable, Number.isFinite(placeable.alpha) ? placeable.alpha : 1);
      }
      this._replaceLocatorBeacon(highlight, type);
      this._rbbDocumentHighlights.set(key, highlight);
      this._startDocumentHighlightPulse();
    }

    _clearDocumentHighlight(uuid, type) {
      this._restoreDocumentHighlight(`${type}:${uuid}`);
    }

    _restoreDocumentHighlight(key) {
      const highlight = this._rbbDocumentHighlights.get(key);
      if (!highlight) return;
      for (const placeable of highlight.placeables) {
        placeable.hover = false;
        const originalAlpha = highlight.originalAlpha.get(placeable);
        if (Number.isFinite(originalAlpha)) placeable.alpha = originalAlpha;
      }
      this._destroyLocatorBeacon(highlight);
      this._rbbDocumentHighlights.delete(key);
      if (!this._rbbDocumentHighlights.size && this._rbbHighlightFrame !== null) {
        globalThis.cancelAnimationFrame?.(this._rbbHighlightFrame);
        this._rbbHighlightFrame = null;
      }
    }

    _reapplyDocumentHighlights() {
      for (const highlight of this._rbbDocumentHighlights.values()) {
        highlight.placeables = this._documentPlaceables(highlight.uuid, highlight.type);
        for (const placeable of highlight.placeables) {
          placeable.hover = true;
          if (!highlight.originalAlpha.has(placeable)) highlight.originalAlpha.set(placeable, Number.isFinite(placeable.alpha) ? placeable.alpha : 1);
        }
        this._replaceLocatorBeacon(highlight, highlight.type);
      }
      if (this._rbbDocumentHighlights.size) this._startDocumentHighlightPulse();
    }

    _startDocumentHighlightPulse() {
      if (usesReducedMotion()) {
        for (const highlight of this._rbbDocumentHighlights.values()) {
          for (const placeable of highlight.placeables) {
            placeable.hover = true;
            placeable.alpha = highlight.originalAlpha.get(placeable) ?? 1;
          }
          if (highlight.locator?.root) {
            highlight.locator.root.alpha = 1;
            highlight.locator.root.scale.set(1.08);
          }
        }
        return;
      }
      if (this._rbbHighlightFrame !== null || typeof globalThis.requestAnimationFrame !== "function") return;
      const tick = timestamp => {
        this._rbbHighlightFrame = null;
        if (!this._rbbDocumentHighlights.size) return;
        const brightness = 0.72 + (0.28 * ((Math.sin(timestamp / 260) + 1) / 2));
        for (const highlight of this._rbbDocumentHighlights.values()) {
          for (const placeable of highlight.placeables) {
            const originalAlpha = highlight.originalAlpha.get(placeable) ?? 1;
            placeable.hover = true;
            placeable.alpha = originalAlpha * brightness;
          }
          if (highlight.locator?.root) {
            const beaconBrightness = 0.78 + (0.22 * ((Math.sin(timestamp / 260) + 1) / 2));
            highlight.locator.root.alpha = beaconBrightness;
            const scale = 0.94 + (0.12 * ((Math.sin(timestamp / 260) + 1) / 2));
            highlight.locator.root.scale.set(scale);
          }
        }
        this._rbbHighlightFrame = globalThis.requestAnimationFrame(tick);
      };
      this._rbbHighlightFrame = globalThis.requestAnimationFrame(tick);
    }

    _clearAllDocumentHighlights() {
      for (const key of [...this._rbbDocumentHighlights.keys()]) this._restoreDocumentHighlight(key);
      if (this._rbbHighlightFrame !== null) globalThis.cancelAnimationFrame?.(this._rbbHighlightFrame);
      this._rbbHighlightFrame = null;
    }

    _replaceLocatorBeacon(highlight, type) {
      this._destroyLocatorBeacon(highlight);
      const placeable = highlight.placeables?.[0];
      if (!placeable) return;
      const document = placeable.document;
      const reference = targetReferences(type, { canvasState: this._rbbCanvasState }).find(entry => entry.uuid === highlight.uuid);
      highlight.locator = createLocatorBeacon({
        uuid: highlight.uuid,
        type,
        label: reference?.name || document?.name?.trim?.() || (type === "door" ? "Door" : type[0].toUpperCase() + type.slice(1)),
        placeable
      });
    }

    _destroyLocatorBeacon(highlight) {
      const root = highlight?.locator?.root;
      if (root) {
        root.parent?.removeChild?.(root);
        root.destroy?.({ children: true });
      }
      if (highlight) delete highlight.locator;
    }

    _documentPlaceables(uuid, type) {
      if (type === "actor") {
        const actorId = globalThis.fromUuidSync?.(uuid)?.id ?? null;
        return (globalThis.canvas?.tokens?.placeables ?? []).filter(token => token.actor?.uuid === uuid || token.document?.actor?.uuid === uuid || (actorId && token.document?.actorId === actorId));
      }
      if (type === "token") return (globalThis.canvas?.tokens?.placeables ?? []).filter(token => token.document?.uuid === uuid);
      const layer = type === "region" ? globalThis.canvas?.regions : type === "tile" ? globalThis.canvas?.tiles : globalThis.canvas?.walls;
      return (layer?.placeables ?? []).filter(placeable => placeable.document?.uuid === uuid);
    }

    _saveRegionRename(uuid) {
      const region = this._rbbState.selection.find(entry => entry.uuid === uuid);
      const name = String(this._rbbState.regionRenames?.[uuid] ?? "").trim();
      if (!region) return;
      if (!name) return this._setStatus("warning", "Give the Region a name before saving the rename.");
      if (name.length > 100) return this._setStatus("warning", "Region names can be at most 100 characters.");
      const regionRenames = { ...this._rbbState.regionRenames };
      if (name === region.name) delete regionRenames[uuid];
      else regionRenames[uuid] = name;
      this._rbbState.regionRenames = regionRenames;
      this._rbbState.renameRegionUuid = null;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._setStatus("info", name === region.name ? "Region name change removed." : `Rename planned: ${region.name} to ${name}. Review before creating.`);
    }

    _removeRegion(uuid) {
      this._rbbState.selection = this._rbbState.selection.filter(region => region.uuid !== uuid);
      this._setDocumentHighlight(uuid, "region", false);
      const regionRenames = { ...this._rbbState.regionRenames };
      delete regionRenames[uuid];
      this._rbbState.regionRenames = regionRenames;
      if (this._rbbState.renameRegionUuid === uuid) this._rbbState.renameRegionUuid = null;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._rbbState.lastApply = null;
      if (!this._rbbState.selection.length) this._rbbState.recipeStep = 0;
      this._setStatus("info", "Region removed from the plan. The Scene was not changed.");
    }

    _moveRegion(uuid, direction) {
      const index = this._rbbState.selection.findIndex(region => region.uuid === uuid);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= this._rbbState.selection.length) return;
      this._rbbState.selection = reorderSelection(this._rbbState.selection, uuid, direction);
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._refresh();
    }

    _preview({ announce = true } = {}) {
      this._readFormState();
      const entry = getBehaviorDefinition(this._rbbState.behaviorKey);
      if (!entry) return;
      if (!recipeReadyToReview(this._rbbState, entry)) {
        const { step } = recipeStep(this._rbbState, entry);
        this._setStatus("warning", recipeStepError(entry, step.id, this._rbbState) ?? "Complete the current step before reviewing this Behavior.");
        return;
      }
      try {
        const plan = createPlan({
          sceneUuid: this._rbbCanvasState?.scene?.uuid,
          regions: this._rbbState.selection,
          behaviorKey: this._rbbState.behaviorKey,
          parameters: this._rbbState.parameters,
          regionRenames: this._rbbState.regionRenames
        });
        this._rbbState.plan = plan;
        this._rbbState.previewed = true;
        this._rbbState.gmReviewed = true;
        if (announce) this._setStatus("success", "Your Region Behavior is ready to create.");
        return true;
      } catch (error) {
        this._setStatus("error", error.message);
        return false;
      }
    }

    async _recipeNext() {
      const entry = getBehaviorDefinition(this._rbbState.behaviorKey);
      if (!entry) return;
      const { steps, index, step } = recipeStep(this._rbbState, entry);
      const error = recipeStepError(entry, step.id, this._rbbState);
      if (error) return this._setStatus("warning", error);
      if (index >= steps.length - 1) {
        if (this._preview({ announce: false })) await this._apply({ closeGuide: true });
        return;
      }
      this._rbbState.recipeStep = index + 1;
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._setStatus("info", steps[index + 1].prompt);
    }

    _recipeBack() {
      const entry = getBehaviorDefinition(this._rbbState.behaviorKey);
      if (!entry) return;
      const { index } = recipeStep(this._rbbState, entry);
      if (!index) return;
      this._rbbState.recipeStep = index - 1;
      if (recipeStep(this._rbbState, entry).step?.id === "regions") this._rbbState.pickerType = "region";
      this._rbbState.plan = null;
      this._rbbState.gmReviewed = false;
      this._refresh();
    }

    async _apply({ closeGuide = false } = {}) {
      this._readFormState();
      if (!this._rbbState.plan || !this._rbbState.gmReviewed) return;
      this._rbbState.plan.approval.gmReviewed = true;
      try {
        const regions = this._rbbState.plan.selection.map(reference => globalThis.fromUuidSync?.(reference.uuid)).filter(Boolean);
        if (regions.length !== this._rbbState.plan.selection.length) throw new Error("One or more reviewed Regions could not be resolved from their UUID.");
        const result = await applyPlan(this._rbbState.plan, { regions, config: globalThis.CONFIG });
        const count = result.results.length;
        const renamed = new Map(this._rbbState.plan.regionUpdates.map(update => [update.uuid, update.name]));
        this._rbbState.selection = this._rbbState.selection.map(region => renamed.has(region.uuid) ? { ...region, name: renamed.get(region.uuid) } : region);
        this._rbbState.regionRenames = {};
        this._rbbState.lastApply = { count, firstRegionUuid: this._rbbState.selection[0]?.uuid ?? null };
        this._rbbState.plan = null;
        this._rbbState.previewed = false;
        this._rbbState.gmReviewed = false;
        if (closeGuide) {
          await this._closeGuide();
          this._clearGuidedSelections();
          resetAfterGuidedApply(this._rbbState);
        }
        this._setStatus("success", `Created this Behavior on ${count} Region${count === 1 ? "" : "s"}.`);
      } catch (error) {
        this._setStatus("error", error.message);
      }
    }

    _openFirstRegion() {
      const uuid = this._rbbState.lastApply?.firstRegionUuid ?? this._rbbState.selection[0]?.uuid;
      const region = uuid ? globalThis.fromUuidSync?.(uuid) : null;
      if (typeof region?.sheet?.render === "function") {
        region.sheet.render(true);
        return;
      }
      this._setStatus("info", "Open the Region's Behaviors tab from the Scene to inspect this Behavior.");
    }

    _handleGuideChange(event, root) {
      if (event.target?.matches?.('[data-input="gmReviewed"]')) {
        this._readGuideFormState(root);
        this._refreshGuide();
      }
    }

    async _handleGuideAction(action, root) {
      if (!action) return;
      this._readGuideFormState(root);
      this._readPitfallGuideFormState(root);
      switch (action.dataset.action) {
      case "close-guide":
        await this._closeGuide();
        break;
      case "toggle-dropdown":
        this._toggleDropdown(action.dataset.dropdownId);
        break;
      case "choose-dropdown":
        this._chooseDropdown(action);
        break;
      case "switch-scene":
        await this._switchToScene(action.dataset.sceneUuid);
        break;
      case "begin-region-create":
        await this._beginRegionCreate({ kind: action.dataset.regionCreateKind, referenceKey: action.dataset.referenceKey, single: action.dataset.referenceSingle === "true" });
        break;
      case "cancel-region-create":
        this._cancelRegionCreate();
        break;
      case "set-region-picker-mode":
        this._setRegionPickerMode(action.dataset.regionPickerMode);
        break;
      case "set-region-reference-mode":
        this._setRegionReferenceMode(action.dataset.referenceKey, action.dataset.regionReferenceMode);
        break;
      case "toggle-region-selection":
        this._toggleSceneRegion(action.dataset.regionUuid);
        break;
      case "pick-target":
        this._addTarget(action.dataset.targetType, action.dataset.targetUuid);
        break;
      case "choose-parameter-option":
        this._chooseParameterOption(action);
        break;
      case "recipe-next":
        await this._recipeNext();
        break;
      case "recipe-back":
        this._recipeBack();
        break;
      case "pitfall-next":
        this._pitfallNext();
        break;
      case "pitfall-back":
        this._pitfallBack();
        break;
      case "pitfall-create":
        await this._createPitfallTrap();
        break;
      case "open-reference-picker":
        this._rbbState.referencePicker = { key: action.dataset.referenceKey, type: action.dataset.referenceType, single: action.dataset.referenceSingle === "true" };
        this._refresh();
        break;
      case "close-reference-picker":
        this._rbbState.referencePicker = null;
        this._refresh();
        break;
      case "pick-reference":
        this._addReference(action.dataset.referenceKey, action.dataset.referenceUuid, action.dataset.referenceSingle === "true");
        break;
      case "remove-reference":
        this._removeReference(action.dataset.referenceKey, action.dataset.referenceUuid);
        break;
      case "open-first-region":
        this._openFirstRegion();
        break;
      case "apply":
        await this._apply();
        break;
      default:
        break;
      }
    }

    _handleChange(event) {
      if (event.target?.matches?.('[data-input="gmReviewed"]')) {
        this._readFormState();
        this._refresh();
      } else if (event.target?.matches?.('[data-input="browserScene"]')) {
        this._readFormState();
        this._rbbState.browserSceneUuid = event.target.value;
        this._refresh();
      } else if (event.target?.matches?.("[data-link]")) {
        this._readFormState();
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._setStatus("info", "Linking options updated. Review the link choices before creating a Behavior.");
      }
    }

    async _handleClick(event) {
      const action = event.target?.closest?.("[data-action]");
      if (!action) return;
      event.preventDefault();
      this._readFormState();
      this._readStudioFormState();
      switch (action.dataset.action) {
      case "toggle-dropdown":
        this._toggleDropdown(action.dataset.dropdownId);
        break;
      case "choose-dropdown":
        this._chooseDropdown(action);
        break;
      case "switch-scene":
        await this._switchToScene(action.dataset.sceneUuid);
        break;
      case "begin-region-create":
        await this._beginRegionCreate({ kind: action.dataset.regionCreateKind, referenceKey: action.dataset.referenceKey, single: action.dataset.referenceSingle === "true" });
        break;
      case "cancel-region-create":
        this._cancelRegionCreate();
        break;
      case "set-region-picker-mode":
        this._setRegionPickerMode(action.dataset.regionPickerMode);
        break;
      case "set-region-reference-mode":
        this._setRegionReferenceMode(action.dataset.referenceKey, action.dataset.regionReferenceMode);
        break;
      case "choose-parameter-option":
        this._chooseParameterOption(action);
        break;
      case "topic":
        await this._closeGuide();
        this._rbbState.topic = action.dataset.topic;
        this._rbbState.effectChosen = false;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._rbbState.lastApply = null;
        if (this._rbbState.topic === "native") {
          this._rbbState.nativeView = "start";
          this._rbbState.nativeCategory = null;
        }
        if (this._rbbState.topic === "traversal") this._rbbState.traversalView = "effects";
        if (["native", "traversal"].includes(this._rbbState.topic)) {
          const entries = entriesForTopic(this._rbbState.topic, this._rbbCatalog);
          if (!entries.some(entry => entry.key === this._rbbState.behaviorKey)) {
            const next = entries.find(entry => entry.available && entry.writable !== false) ?? entries[0];
            if (next) {
              this._rbbState.behaviorKey = next.key;
              this._rbbState.parameters = defaultParameters(next.key);
            }
          }
        } else {
          this._rbbState.plan = null;
          this._rbbState.gmReviewed = false;
        }
        this._refresh();
        break;
      case "native-category":
        this._rbbState.nativeCategory = action.dataset.nativeCategory;
        this._rbbState.nativeView = "effects";
        this._refresh();
        break;
      case "quick-start":
        this._rbbState.topic = action.dataset.topic;
        this._selectBehavior(action.dataset.behaviorKey);
        break;
      case "show-all-effects":
        this._rbbState.nativeCategory = null;
        this._rbbState.nativeView = "categories";
        this._refresh();
        break;
      case "back-to-start":
      case "back-to-effects":
        await this._closeGuide();
        this._rbbState.nativeCategory = null;
        this._rbbState.nativeView = "start";
        this._rbbState.effectChosen = false;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._refresh();
        break;
      case "back-to-categories":
        await this._closeGuide();
        this._rbbState.nativeCategory = null;
        this._rbbState.nativeView = "categories";
        this._rbbState.effectChosen = false;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._refresh();
        break;
      case "back-to-traversal-effects":
        await this._closeGuide();
        this._rbbState.traversalView = "effects";
        this._rbbState.effectChosen = false;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._refresh();
        break;
      case "start-pitfall":
        this._openPitfallGuide();
        break;
      case "open-puzzles-locks":
        try {
          const bridge = globalThis.game?.modules?.get?.("regionwright")?.api?.puzzlesLocks;
          if (!bridge?.available) throw new Error("Regionwright: Puzzles & Locks is not installed or ready.");
          await bridge.openHub();
        } catch (error) {
          this._setStatus("error", error.message ?? "Puzzles & Locks could not be opened.");
        }
        break;
      case "boss-prepare":
        try {
          await bossEngine.ensureActors();
          this._setStatus("success", "Prime Arachnid and Prime Directive are ready.");
        } catch (error) {
          this._setStatus("error", error.message ?? "Boss actors could not be prepared.");
        }
        break;
      case "boss-open":
        bossEngine.open();
        break;
      case "boss-start":
        try {
          await bossEngine.start();
          this._setStatus("success", "Prime Arachnid encounter started.");
        } catch (error) {
          this._setStatus("error", error.message ?? "Boss Engine could not start.");
        }
        break;
      case "studio-start-sample":
        this._studioStartSample();
        break;
      case "studio-start-scene-moment":
        this._studioStartSceneMoment();
        break;
      case "studio-start-story-beat":
        this._studioStartStoryBeat();
        break;
      case "studio-start-secret-reveal":
        this._studioStartSecretReveal();
        break;
      case "studio-start-room-transformation":
        this._studioStartRoomTransformation();
        break;
      case "studio-start-portal":
        this._studioStartPortal();
        break;
      case "studio-start-story-fact":
        this._studioStartStoryFact();
        break;
      case "studio-start-hub-unlock":
        this._studioStartHubUnlock();
        break;
      case "studio-start-key-gate":
        this._studioStartKeyGate();
        break;
      case "studio-set-portal-scene":
        this._studioSetPortalScene(action.dataset.sceneUuid);
        break;
      case "studio-reset-fact":
        await this._studioResetFact(action.dataset.factId);
        break;
      case "studio-pick-door":
        this._studioPickDoor(action.dataset.studioUuid);
        break;
      case "studio-toggle-fact":
        this._studioToggleFact(action.dataset.factId);
        break;
      case "studio-load-draft":
        await this._studioLoadDraft();
        break;
      case "studio-select-node":
        this._studioSelectNode(action.dataset.studioNodeId);
        break;
      case "studio-pick-region":
        this._studioPickRegion(action.dataset.studioUuid);
        break;
      case "studio-pick-token":
        this._studioPickToken(action.dataset.studioUuid);
        break;
      case "studio-pick-tile":
        this._studioPickTile(action.dataset.studioUuid);
        break;
      case "studio-create-region":
        await this._beginRegionCreate({ kind: "studio", single: true });
        break;
      case "studio-save-draft":
        await this._studioSaveDraft();
        break;
      case "studio-review":
        this._studioReview();
        break;
      case "studio-publish":
        await this._studioPublish();
        break;
      case "studio-unpublish":
        await this._studioUnpublish();
        break;
      case "studio-back":
        this._rbbState.studioView = "edit";
        this._refresh();
        break;
      case "studio-reset":
        this._studioReset();
        break;
      case "behavior":
        if (!action.disabled) this._selectBehavior(action.dataset.behaviorKey);
        break;
      case "open-guide":
        this._openGuide();
        break;
      case "recipe-next":
        await this._recipeNext();
        break;
      case "recipe-back":
        this._recipeBack();
        break;
      case "open-reference-picker":
        this._rbbState.referencePicker = { key: action.dataset.referenceKey, type: action.dataset.referenceType, single: action.dataset.referenceSingle === "true" };
        this._refresh();
        break;
      case "close-reference-picker":
        this._rbbState.referencePicker = null;
        this._refresh();
        break;
      case "pick-reference":
        this._addReference(action.dataset.referenceKey, action.dataset.referenceUuid, action.dataset.referenceSingle === "true");
        break;
      case "remove-reference":
        this._removeReference(action.dataset.referenceKey, action.dataset.referenceUuid);
        break;
      case "open-first-region":
        this._openFirstRegion();
        break;
      case "add-controlled":
        this._addControlled();
        break;
      case "add-region":
        this._rbbState.pickerType = "region";
        this._rbbState.pickerOpen = !this._rbbState.pickerOpen;
        this._refresh();
        break;
      case "close-picker":
        this._rbbState.pickerOpen = false;
        this._refresh();
        break;
      case "picker-type":
        this._rbbState.pickerType = targetTypeById(action.dataset.pickerType).id;
        this._rbbState.pickerOpen = true;
        this._refresh();
        break;
      case "actor-scope":
        this._rbbState.actorScope = action.dataset.actorScope === "world" ? "world" : "scene";
        this._refresh();
        break;
      case "pick-target":
        this._addTarget(action.dataset.targetType, action.dataset.targetUuid);
        break;
      case "toggle-region-selection":
        this._toggleSceneRegion(action.dataset.regionUuid);
        break;
      case "teleport-link":
        if (this._rbbState.selection.length < 2) {
          this._setStatus("warning", "Add at least two Regions before preparing a teleport link.");
        } else if (!this._rbbState.link.sourceUuid || !this._rbbState.link.targetUuid) {
          this._setStatus("warning", "Choose both a source and destination Region before preparing the link.");
        } else if (this._rbbState.link.sourceUuid === this._rbbState.link.targetUuid) {
          this._setStatus("warning", "Choose different source and destination Regions.");
        } else {
          this._rbbState.link = { ...this._rbbState.link, enabled: true, teleport: true };
          this._setStatus("info", "Teleport link captured by UUID for review. The write adapter remains gated until isolated-world validation is complete.");
        }
        break;
      case "clear-selection":
        this._rbbState.selection = [];
        this._rbbState.targets = [];
        this._rbbState.regionRenames = {};
        this._rbbState.renameRegionUuid = null;
        this._rbbState.plan = null;
        this._rbbState.gmReviewed = false;
        this._setStatus("info", "Selection cleared. The Scene was not changed.");
        break;
      case "remove-region":
        this._removeRegion(action.dataset.regionUuid);
        break;
      case "rename-region":
        this._rbbState.renameRegionUuid = action.dataset.regionUuid;
        this._refresh();
        break;
      case "save-region-rename":
        this._saveRegionRename(action.dataset.regionUuid);
        break;
      case "cancel-region-rename":
        this._rbbState.renameRegionUuid = null;
        this._refresh();
        break;
      case "move-region-up":
        this._moveRegion(action.dataset.regionUuid, -1);
        break;
      case "move-region-down":
        this._moveRegion(action.dataset.regionUuid, 1);
        break;
      case "settings":
        openModuleSettings();
        break;
      case "help":
        globalThis.ui?.notifications?.info?.("Select Regions on the canvas, add them to the right-side list, choose a Behavior, review the plan, and approve it before creating it.");
        break;
      case "diagnostics":
        globalThis.ui?.notifications?.info?.("Diagnostics will report runtime capabilities without changing the Scene.");
        break;
      case "preview":
        this._preview();
        break;
      case "apply":
        await this._apply();
        break;
      default:
        break;
      }
    }
  };
}

export async function openBuilder({ canvasState = globalThis.canvas, config = globalThis.CONFIG } = {}) {
  if (!globalThis.game?.user?.isGM) {
    globalThis.ui?.notifications?.error?.("Only a GM can open Regionwright.");
    return null;
  }
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2 !== "function") throw new Error("Foundry DialogV2 is unavailable in this runtime.");
  const capabilities = buildCapabilitySnapshot({ config });
  const catalog = behaviorCatalog({ config });
  const state = createBuilderState({ canvasState, config });
  const BuilderDialog = createBuilderDialogClass(DialogV2);
  const dialog = new BuilderDialog({ state, capabilities, catalog, canvasState });
  dialog.render({ force: true });
  return dialog;
}

export { EVENTS };
