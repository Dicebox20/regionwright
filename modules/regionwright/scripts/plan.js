import { ALLOWLISTED_BEHAVIOR_TYPES, MODULE_ID, PLAN_SCHEMA_VERSION, REGION_FLAG } from "./constants.js";
import { getBehaviorDefinition } from "./catalog.js";
import { validateSelection } from "./selection.js";

function clone(value) {
  return structuredClone(value ?? {});
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function asBoolean(value, fallback = false) {
  return value === undefined ? fallback : value === true || value === "true" || value === 1 || value === "1";
}

function asNumber(value, label, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new Error(`${label} must be a ${integer ? "whole " : ""}number between ${min} and ${max}.`);
  }
  return number;
}

function list(value) {
  const entries = Array.isArray(value) ? value : String(value ?? "").split(/[\n,]/);
  return [...new Set(entries.map(entry => String(entry).trim()).filter(Boolean))];
}

function requiredList(value, label) {
  const entries = list(value);
  if (!entries.length) throw new Error(`${label} requires at least one UUID.`);
  return entries;
}

function normalizeRegionUpdates(value, selection = []) {
  const selected = new Map((selection ?? []).map(region => [region.uuid, String(region.name ?? "Unnamed Region")]));
  const entries = Array.isArray(value)
    ? value
    : Object.entries(value ?? {}).map(([uuid, name]) => ({ uuid, name }));
  const updates = [];
  const seen = new Set();
  for (const entry of entries) {
    const uuid = String(entry?.uuid ?? "").trim();
    const name = String(entry?.name ?? "").trim();
    if (!uuid || !name || name === selected.get(uuid) || seen.has(uuid)) continue;
    if (!selected.has(uuid)) throw new Error("A Region rename must belong to the reviewed Region selection.");
    if (name.length > 100) throw new Error("A Region name must be 100 characters or fewer.");
    seen.add(uuid);
    updates.push({ uuid, name });
  }
  return updates;
}

const REGION_EVENTS = new Set([
  "regionBoundary", "regionAnimation", "behaviorActivated", "behaviorDeactivated", "behaviorViewed", "behaviorUnviewed",
  "tokenEnter", "tokenExit", "tokenMoveIn", "tokenMoveOut", "tokenMoveWithin", "tokenAnimateIn", "tokenAnimateOut",
  "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"
]);
const SCROLLING_TEXT_EVENTS = new Set(["tokenAnimateIn", "tokenAnimateOut", "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"]);
const TOGGLE_BEHAVIOR_EVENTS = new Set(["tokenEnter", "tokenExit", "tokenMoveIn", "tokenMoveOut", "tokenTurnStart", "tokenTurnEnd", "tokenRoundStart", "tokenRoundEnd"]);

function events(value, allowed = REGION_EVENTS) {
  const entries = list(value);
  if (!entries.length) throw new Error("Choose at least one Region trigger event.");
  if (entries.some(entry => !allowed.has(entry))) throw new Error("One or more Region trigger events are not supported by this behavior.");
  return entries;
}

/**
 * Convert builder-friendly values into the exact system data shape expected by
 * each registered native Region Behavior model. Foundry still validates this
 * payload again immediately before a write.
 */
export function normalizeBehaviorParameters(definition, input = {}, { requireScriptAcknowledgement = true } = {}) {
  if (!plainObject(input)) throw new Error("Behavior parameters must be a plain object.");
  switch (definition.key) {
    case "darkness": {
      const modes = { override: 0, brighten: 1, darken: 2 };
      const mode = modes[input.mode] ?? asNumber(input.mode, "Darkness mode", { min: 0, max: 2, integer: true });
      return { mode, modifier: asNumber(input.modifier, "Darkness modifier", { min: 0, max: 1 }) };
    }
    case "active-effects":
      return { effects: requiredList(input.effects ?? input.effectsText, "Apply Active Effects") };
    case "change-level":
      return { movementActions: list(input.movementActions ?? input.movementActionsText) };
    case "define-surface":
      if (!["bottom", "top", "both"].includes(input.placement)) throw new Error("Surface placement must be bottom, top, or both.");
      return {
        placement: input.placement,
        light: asBoolean(input.light, true), move: asBoolean(input.move, true), sight: asBoolean(input.sight, true),
        sound: asBoolean(input.sound, true), occlusion: asBoolean(input.occlusion, true),
        exposure: asBoolean(input.exposure), culling: asBoolean(input.culling)
      };
    case "scrolling-text": {
      const visibility = { gm: 0, observer: 1, all: 2 }[input.visibility] ?? asNumber(input.visibility, "Scrolling text visibility", { min: 0, max: 2, integer: true });
      const text = String(input.text ?? "").trim();
      if (!text) throw new Error("Scrolling text requires a message.");
      const color = String(input.color ?? "");
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Scrolling text color must be a six-digit hex color.");
      return { events: events(input.events, SCROLLING_TEXT_EVENTS), text, color, visibility, once: asBoolean(input.once) };
    }
    case "difficult-terrain":
      return { magical: asBoolean(input.magical), types: list(input.types ?? input.typesText), ignoredDispositions: list(input.ignoredDispositions ?? input.ignoredDispositionsText).map(value => asNumber(value, "Ignored disposition", { integer: true })) };
    case "execute-macro": {
      const uuid = String(input.uuid ?? "").trim();
      if (!uuid) throw new Error("Execute Macro requires an explicit Macro UUID.");
      return { events: events(input.events), uuid, everyone: asBoolean(input.everyone) };
    }
    case "execute-script": {
      const source = String(input.source ?? "").trim();
      if (!source) throw new Error("Execute Script requires GM-entered script source.");
      if (requireScriptAcknowledgement && !asBoolean(input.scriptAcknowledged)) throw new Error("Confirm that you reviewed the script source before previewing it.");
      return { events: events(input.events), source };
    }
    case "movement-cost": {
      const difficulties = input.difficulties;
      if (!plainObject(difficulties) || !Object.keys(difficulties).length) throw new Error("Configure at least one movement action multiplier.");
      return { difficulties: Object.fromEntries(Object.entries(difficulties).map(([action, value]) => [action, asNumber(value, `${action} movement multiplier`, { min: 0, max: 5 })])) };
    }
    case "pause":
      return { once: asBoolean(input.once) };
    case "suppress-weather":
      return {};
    case "teleport": {
      const placement = String(input.placement ?? "random");
      if (!["random", "center", "relative"].includes(placement)) throw new Error("Teleport placement must be random, center, or relative.");
      const transitionType = String(input.transitionType ?? input.transition?.type ?? "").trim() || null;
      return {
        destinations: requiredList(input.destinations ?? input.destinationsText, "Teleport Token"), placement,
        snap: asBoolean(input.snap, true), choice: asBoolean(input.choice), revealed: asBoolean(input.revealed),
        dialog: { revealed: String(input.dialogRevealed ?? input.dialog?.revealed ?? "").trim() || null, unrevealed: String(input.dialogUnrevealed ?? input.dialog?.unrevealed ?? "").trim() || null },
        transition: { type: transitionType, duration: asNumber(input.transitionDuration ?? input.transition?.duration ?? 1500, "Teleport transition duration", { min: 500, max: 10000, integer: true }) }
      };
    }
    case "toggle-behavior": {
      const enable = list(input.enable ?? input.enableText);
      const disable = list(input.disable ?? input.disableText);
      if (!enable.length && !disable.length) throw new Error("Toggle Behavior requires an enable or disable Behavior UUID.");
      if (enable.some(uuid => disable.includes(uuid))) throw new Error("A Region Behavior cannot be both enabled and disabled.");
      return { events: events(input.events, TOGGLE_BEHAVIOR_EVENTS), enable, disable };
    }
    default:
      return clone(input);
  }
}

export function createPlan({ sceneUuid, regions, behaviorKey, parameters = {}, regionRenames = {} } = {}) {
  const definition = getBehaviorDefinition(behaviorKey);
  if (!definition) throw new Error(`Unknown Region behavior key: ${behaviorKey ?? "missing"}.`);
  if (!sceneUuid) throw new Error("A Scene UUID is required.");
  const references = (regions ?? []).map(region => ({
    uuid: region?.uuid,
    id: region?.id,
    name: region?.name,
    sceneUuid: region?.sceneUuid ?? region?.parent?.uuid
  }));
  validateSelection(references, { sceneUuid });
  const normalizedParameters = normalizeBehaviorParameters(definition, parameters);

  const selection = references.map(region => ({
    uuid: region.uuid,
    name: String(region.name ?? "Unnamed Region"),
    sceneUuid: region.sceneUuid
  }));
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    moduleId: MODULE_ID,
    sceneUuid,
    selection,
    regionUpdates: normalizeRegionUpdates(regionRenames, selection),
    behavior: {
      key: definition.key,
      label: definition.label,
      type: definition.type,
      mode: definition.mode,
      parameters: normalizedParameters
    },
    links: [],
    warnings: [],
    assumptions: [],
    approval: { gmReviewed: false }
  };
}

export function validatePlan(plan) {
  if (!plainObject(plan)) throw new Error("A Region Behavior plan is required.");
  if (plan.schemaVersion !== PLAN_SCHEMA_VERSION) throw new Error(`Unsupported plan schema: ${plan.schemaVersion ?? "missing"}.`);
  if (plan.moduleId !== MODULE_ID) throw new Error("This plan belongs to a different module.");
  if (!plan.sceneUuid) throw new Error("The plan must identify its Scene.");
  validateSelection(plan.selection, { sceneUuid: plan.sceneUuid });
  plan.regionUpdates = normalizeRegionUpdates(plan.regionUpdates, plan.selection);
  const behavior = plan.behavior;
  if (!plainObject(behavior) || !behavior.key || !behavior.type) throw new Error("The plan must contain one behavior definition.");
  const definition = getBehaviorDefinition(behavior.key);
  if (!definition || !ALLOWLISTED_BEHAVIOR_TYPES.includes(behavior.type)) throw new Error(`Unsupported Region behavior type: ${behavior.type}.`);
  if (definition.type !== behavior.type) throw new Error(`Behavior key ${behavior.key} does not match type ${behavior.type}.`);
  if (definition.writable === false) throw new Error(`Region behavior ${behavior.label ?? behavior.key} is cataloged but not enabled for writes yet.`);
  if (!new Set(["broadcast", "advanced"]).has(behavior.mode)) throw new Error("The plan contains an unsupported Region Behavior mode.");
  if (!plainObject(behavior.parameters)) throw new Error("Behavior parameters must be a plain object.");
  behavior.parameters = normalizeBehaviorParameters(definition, behavior.parameters, { requireScriptAcknowledgement: false });
  if (!Array.isArray(plan.links) || plan.links.length !== 0) throw new Error("Linked behavior plans are not enabled in the foundation.");
  if (!plainObject(plan.approval)) throw new Error("The plan must contain an approval record.");
  return plan;
}

export function buildRegionBehaviorData(plan) {
  validatePlan(plan);
  return {
    name: `Regionwright: ${plan.behavior.label}`,
    type: plan.behavior.type,
    disabled: false,
    system: clone(plan.behavior.parameters),
    flags: {
      [MODULE_ID]: {
        [REGION_FLAG]: {
          schemaVersion: PLAN_SCHEMA_VERSION,
          behaviorKey: plan.behavior.key
        }
      }
    }
  };
}
