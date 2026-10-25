import { validateScenarioBlueprint } from "./studio.js";

function text(value) { return String(value ?? "").trim(); }
function add(items, severity, nodeId, message) { items.push(Object.freeze({ severity, nodeId: nodeId ?? null, message })); }
function targetMatches(document, targetType) {
  if (!document) return false;
  if (targetType === "region") return document.documentName === "Region";
  if (targetType === "door") return document.documentName === "Wall" && Number(document.door ?? 0) > 0;
  if (targetType === "token") return document.documentName === "Token";
  return true;
}

/** Read-only Studio preflight with beginner-friendly repair hints. */
export function diagnoseStudioBlueprint(input, { resolveUuid = globalThis.fromUuidSync, activeSceneUuid = globalThis.canvas?.scene?.uuid, facts = null, capabilities } = {}) {
  let blueprint;
  const items = [];
  const validationCapabilities = capabilities ?? (input?.edition === "premium" ? { edition: "studio", maxNodes: Infinity, crossScene: true } : undefined);
  try { blueprint = validateScenarioBlueprint(input, { capabilities: validationCapabilities }); }
  catch (error) {
    const issue = Object.freeze({ severity: "error", nodeId: null, message: error.message ?? "This Studio activity is invalid." });
    return Object.freeze({ status: "blocked", items: Object.freeze([issue]), errors: Object.freeze([issue]), warnings: Object.freeze([]) });
  }
  const factState = facts?.facts ?? facts ?? {};
  for (const node of blueprint.nodes) {
    const targetUuid = text(node.config?.targetUuid);
    if (targetUuid) {
      const target = resolveUuid?.(targetUuid);
      if (!target) add(items, "error", node.id, `${node.label} needs a target that still exists.`);
      else if (node.config?.targetType && !targetMatches(target, node.config.targetType)) add(items, "error", node.id, `${node.label} points to the wrong kind of map object.`);
      else if (node.sceneUuid && target.parent?.uuid && node.sceneUuid !== target.parent.uuid) add(items, "error", node.id, `${node.label} points to an object on another Scene.`);
    }
    for (const uuid of node.config?.targetUuids ?? []) {
      const target = resolveUuid?.(uuid);
      if (!target) add(items, "error", node.id, `${node.label} includes a target that no longer exists.`);
      else if (node.config?.targetType && !targetMatches(target, node.config.targetType)) add(items, "error", node.id, `${node.label} includes the wrong kind of map object.`);
    }
    if (node.type === "setStoryFact" && !text(node.config?.label)) add(items, "error", node.id, "Give this story fact a name.");
    if (node.type === "allStoryFacts") {
      const ids = node.config?.factIds ?? [];
      if (!ids.length) add(items, "error", node.id, "Choose at least one objective.");
      for (const id of ids) {
        const fact = factState[id];
        if (!fact) add(items, "error", node.id, "One selected objective no longer exists.");
        else if (fact.value !== true) add(items, "warning", node.id, `${fact.label ?? "An objective"} is not complete yet. The Door will remain locked.`);
      }
    }
  }
  if (blueprint.id === "scene-portal") {
    const source = blueprint.nodes.find(node => node.id === "portal-entry")?.sceneUuid;
    const destination = blueprint.nodes.find(node => node.id === "portal-arrival")?.config?.targetSceneUuid;
    if (source && destination && source === destination) add(items, "error", "portal-arrival", "Choose a different arrival Scene.");
    if (source && activeSceneUuid && source !== activeSceneUuid) add(items, "warning", "portal-entry", "Switch to the portal entrance Scene before publishing.");
  }
  const errors = items.filter(item => item.severity === "error");
  const warnings = items.filter(item => item.severity === "warning");
  return Object.freeze({ status: errors.length ? "blocked" : warnings.length ? "ready-with-notes" : "ready", items: Object.freeze(items), errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
}
