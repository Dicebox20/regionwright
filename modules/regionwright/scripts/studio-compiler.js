import { MODULE_ID } from "./constants.js";
import { STUDIO_SCHEMA_VERSION, validateScenarioBlueprint } from "./studio.js";

export const STUDIO_COMPILATION_SCHEMA_VERSION = "1.0";

const TRIGGER_TYPES = new Set([
  "regionBoundary", "behaviorActivated", "behaviorDeactivated", "behaviorViewed", "behaviorUnviewed",
  "tokenEnter", "tokenExit", "tokenMoveIn", "tokenMoveOut", "tokenMoveWithin", "tokenAnimateIn", "tokenAnimateOut",
  "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"
]);

const ACTION_BEHAVIORS = Object.freeze({
  adjustDarknessLevel: "darkness",
  applyActiveEffect: "active-effects",
  changeLevel: "change-level",
  defineSurface: "define-surface",
  displayScrollingText: "scrolling-text",
  dnd5eDifficultTerrain: "difficult-terrain",
  executeMacro: "execute-macro",
  executeScript: "execute-script",
  modifyMovementCost: "movement-cost",
  pauseGame: "pause",
  suppressWeather: "suppress-weather",
  teleportToken: "teleport",
  toggleBehavior: "toggle-behavior"
});
const MODULE_ACTIONS = new Set(["revealHiddenTokens", "setStoryFact", "openDoor"]);

function clone(value) {
  return structuredClone(value ?? {});
}

function text(value) {
  return String(value ?? "").trim();
}

function actionBehaviorKey(node) {
  return text(node?.config?.behaviorKey) || ACTION_BEHAVIORS[node?.type] || null;
}

function graphOrder(blueprint) {
  const incoming = new Map(blueprint.nodes.map(node => [node.id, 0]));
  const outgoing = new Map(blueprint.nodes.map(node => [node.id, []]));
  for (const edge of blueprint.edges) {
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    outgoing.get(edge.from).push(edge.to);
  }
  const queue = blueprint.nodes.filter(node => incoming.get(node.id) === 0).map(node => node.id);
  const order = [];
  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const next of outgoing.get(current)) {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
  }
  return order.length === blueprint.nodes.length ? order : null;
}

function referencesFromConfig(config = {}) {
  const references = [];
  const visit = (value, path = "config") => {
    if (typeof value === "string") {
      if (/uuid/i.test(path) && value.trim()) references.push({ path, uuid: value.trim() });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, entry]) => visit(entry, `${path}.${key}`));
    }
  };
  visit(config);
  return references;
}

/**
 * Compile a Studio blueprint into a review-only execution artifact.
 * Compilation never calls Foundry APIs and never mutates world documents.
 */
export function compileScenarioBlueprint(input, {
  capabilities = { edition: "assistant", maxNodes: 4, crossScene: false },
  availableBehaviorTypes = null
} = {}) {
  const blueprint = validateScenarioBlueprint(input, { capabilities });
  const order = graphOrder(blueprint);
  const errors = [];
  const warnings = [];
  if (!order) errors.push("The Studio graph contains a cycle. Add a reset or state boundary before compiling it.");
  const nodeById = new Map(blueprint.nodes.map(node => [node.id, node]));
  const operations = [];
  for (const nodeId of order ?? blueprint.nodes.map(node => node.id)) {
    const node = nodeById.get(nodeId);
    if (node.kind === "trigger") {
      if (!TRIGGER_TYPES.has(node.type)) errors.push(`Trigger node ${node.id} uses an unsupported Region event.`);
      operations.push({ id: node.id, kind: "trigger", type: node.type, sceneUuid: node.sceneUuid, config: clone(node.config) });
      continue;
    }
    if (node.kind === "condition") {
      warnings.push(`Condition node ${node.id} is included in the review artifact; runtime condition execution is not enabled yet.`);
      operations.push({ id: node.id, kind: "condition", type: node.type, sceneUuid: node.sceneUuid, config: clone(node.config) });
      continue;
    }
    if (node.kind === "state") {
      warnings.push(`State node ${node.id} is included in the review artifact; persistent Studio state is not enabled yet.`);
      operations.push({ id: node.id, kind: "state", type: node.type, sceneUuid: node.sceneUuid, config: clone(node.config) });
      continue;
    }
    if (MODULE_ACTIONS.has(node.type)) {
      operations.push({ id: node.id, kind: "module-action", type: node.type, sceneUuid: node.sceneUuid, references: referencesFromConfig(node.config), config: clone(node.config) });
      continue;
    }
    const behaviorKey = actionBehaviorKey(node);
    if (!behaviorKey) {
      errors.push(`Action node ${node.id} does not identify a supported native behavior.`);
      continue;
    }
    const behaviorType = node.type;
    if (availableBehaviorTypes && !availableBehaviorTypes.has?.(behaviorType) && !availableBehaviorTypes.includes?.(behaviorType)) {
      errors.push(`The active Foundry runtime has not registered ${behaviorType} for action node ${node.id}.`);
    }
    operations.push({
      id: node.id,
      kind: "native-action",
      type: behaviorType,
      behaviorKey,
      sceneUuid: node.sceneUuid,
      references: referencesFromConfig(node.config),
      config: clone(node.config)
    });
  }
  if (!operations.some(operation => operation.kind === "native-action")) errors.push("The scenario needs at least one native action node.");
  return Object.freeze({
    schemaVersion: STUDIO_COMPILATION_SCHEMA_VERSION,
    blueprintSchemaVersion: STUDIO_SCHEMA_VERSION,
    moduleId: MODULE_ID,
    blueprintId: blueprint.id,
    order: order ?? blueprint.nodes.map(node => node.id),
    operations,
    warnings,
    errors,
    execution: Object.freeze({
      status: errors.length ? "blocked" : "ready-for-approval",
      readyForReview: errors.length === 0,
      writesWorld: false,
      requiresGMApproval: true,
      writer: "regionwright-assistant-plan"
    })
  });
}

export { ACTION_BEHAVIORS, MODULE_ACTIONS, TRIGGER_TYPES };
