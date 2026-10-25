import { MODULE_ID, REGION_FLAG, WRITE_SETTING } from "./constants.js";

export const PITFALL_TRAP_FLAG = "pitfallTrap";
export const PITFALL_TRAP_KEY = "pitfall-trap";
export const PITFALL_TRAP_VERSION = 1;
export const PITFALL_TRAP_SOURCE = `await game.modules.get("${MODULE_ID}")?.api?.traps?.handle(region, event);`;
export const PITFALL_SOCKET = `module.${MODULE_ID}`;

const processing = new Set();
const pendingRequests = new Map();
let socketInstalled = false;

function activeGM() {
  const gm = globalThis.game?.users?.activeGM;
  return Boolean(globalThis.game?.user?.isGM && (!gm || gm.id === globalThis.game.user.id));
}

function requestId() {
  return globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function integer(value, label, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return parsed;
}

function trapData(region) {
  return region?.getFlag?.(MODULE_ID, PITFALL_TRAP_FLAG)
    ?? region?.flags?.[MODULE_ID]?.[PITFALL_TRAP_FLAG]
    ?? null;
}

function behaviorFlag(behavior) {
  return behavior?.flags?.[MODULE_ID]?.[REGION_FLAG]?.behaviorKey
    ?? behavior?.getFlag?.(MODULE_ID, `${REGION_FLAG}.behaviorKey`)
    ?? "";
}

function chatRecipients(event) {
  const ids = new Set();
  if (event?.user?.id) ids.add(event.user.id);
  for (const user of globalThis.game?.users ?? []) if (user?.isGM && user.active) ids.add(user.id);
  return [...ids];
}

async function announce({ event, actor, text, whisper = false } = {}) {
  const content = `<p>${escapeHTML(text)}</p>`;
  if (globalThis.ChatMessage?.create) {
    const data = { content, speaker: globalThis.ChatMessage.getSpeaker?.({ actor }) ?? {} };
    if (whisper) data.whisper = chatRecipients(event);
    await globalThis.ChatMessage.create(data);
    return;
  }
  globalThis.ui?.notifications?.info?.(text);
}

function damageFormula(value) {
  const formula = String(value ?? "2d6").trim().toLowerCase();
  if (!/^\d{1,2}d\d{1,3}(?:\s*[+-]\s*\d{1,3})?$/.test(formula)) throw new Error("Pitfall damage must use a simple dice formula, such as 2d6.");
  return formula.replaceAll(/\s+/g, "");
}

export function createPitfallTrapConfig({ dc = 15, once = true, damage = "2d6" } = {}) {
  return Object.freeze({
    version: PITFALL_TRAP_VERSION,
    dc: integer(dc, "Passive Perception DC", { min: 1, max: 30 }),
    once: Boolean(once),
    damage: { formula: damageFormula(damage), type: "bludgeoning" },
    state: { triggered: false, detectedBy: [], crossedBy: [], lastUpdatedAt: Date.now() }
  });
}

export function validatePitfallTrapConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== PITFALL_TRAP_VERSION) throw new Error("This Pitfall Trap configuration is unsupported.");
  const validated = createPitfallTrapConfig({ dc: config.dc, once: config.once, damage: config.damage?.formula });
  return {
    ...validated,
    state: {
      triggered: Boolean(config.state?.triggered),
      detectedBy: [...new Set((config.state?.detectedBy ?? []).map(String).filter(Boolean))],
      crossedBy: [...new Set((config.state?.crossedBy ?? []).map(String).filter(Boolean))],
      lastUpdatedAt: Number(config.state?.lastUpdatedAt) || 0
    }
  };
}

export function passivePerception(actor) {
  const skill = actor?.system?.skills?.prc ?? actor?.system?.skills?.per ?? null;
  const candidates = [
    skill?.passive,
    actor?.system?.attributes?.passive?.perception,
    actor?.system?.attributes?.passivePerception
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
  }
  const modifier = Number(skill?.mod ?? skill?.total ?? 0);
  return 10 + (Number.isFinite(modifier) ? Math.floor(modifier) : 0);
}

export function evaluatePitfallDetection(config, actor) {
  const trap = validatePitfallTrapConfig(config);
  const passive = passivePerception(actor);
  return Object.freeze({ passive, dc: trap.dc, detected: passive >= trap.dc });
}

export function evaluateAthleticsCheck(total, dc) {
  const result = Number(total);
  return Object.freeze({ total: Number.isFinite(result) ? result : null, dc: integer(dc, "Athletics DC", { min: 1, max: 30 }), success: Number.isFinite(result) && result >= dc });
}

export function pitfallBehaviorData() {
  return {
    type: "executeScript",
    system: { events: ["tokenEnter"], source: PITFALL_TRAP_SOURCE },
    flags: { [MODULE_ID]: { [REGION_FLAG]: { behaviorKey: PITFALL_TRAP_KEY } } }
  };
}

function requireTrapWriteAccess() {
  if (!globalThis.game?.user?.isGM) throw new Error("Only a GM can configure a Pitfall Trap.");
  if (globalThis.game?.settings?.get?.(MODULE_ID, WRITE_SETTING) !== true) throw new Error("Enable Regionwright Region writes in Configure Settings before creating a Pitfall Trap.");
}

async function resolveRegion(regionOrUuid) {
  if (regionOrUuid?.documentName === "Region") return regionOrUuid;
  const uuid = String(regionOrUuid ?? "").trim();
  const region = globalThis.fromUuidSync?.(uuid) ?? await globalThis.fromUuid?.(uuid);
  if (!region || region.documentName !== "Region") throw new Error("Choose a Region first.");
  return region;
}

export async function configurePitfallTrap({ region: regionOrUuid, dc = 15, once = true, damage = "2d6" } = {}) {
  requireTrapWriteAccess();
  const region = await resolveRegion(regionOrUuid);
  const config = createPitfallTrapConfig({ dc, once, damage });
  const behavior = Array.from(region.behaviors ?? []).find(entry => behaviorFlag(entry) === PITFALL_TRAP_KEY);
  const previous = trapData(region);
  try {
    await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: config });
    if (behavior) await region.updateEmbeddedDocuments("RegionBehavior", [{ _id: behavior.id, ...pitfallBehaviorData() }]);
    else await region.createEmbeddedDocuments("RegionBehavior", [pitfallBehaviorData()]);
  } catch (error) {
    await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: previous ?? null });
    throw error;
  }
  return { region, config };
}

export async function clearPitfallTrap(regionOrUuid) {
  requireTrapWriteAccess();
  const region = await resolveRegion(regionOrUuid);
  const ids = Array.from(region.behaviors ?? []).filter(entry => behaviorFlag(entry) === PITFALL_TRAP_KEY).map(entry => entry.id).filter(Boolean);
  if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
  await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: null });
  return region;
}

function movementOrigin(event) {
  const origin = event?.data?.movement?.origin;
  if (!origin || !Number.isFinite(Number(origin.x)) || !Number.isFinite(Number(origin.y))) return null;
  return { x: Number(origin.x), y: Number(origin.y), elevation: Number.isFinite(Number(origin.elevation)) ? Number(origin.elevation) : undefined };
}

async function pushBack(token, origin) {
  if (!origin || typeof token?.update !== "function") return false;
  const update = { x: origin.x, y: origin.y };
  if (origin.elevation !== undefined) update.elevation = origin.elevation;
  await token.update(update);
  return true;
}

async function athleticsCheck(actor, dc) {
  if (typeof actor?.rollSkill !== "function") return { available: false, canceled: false, total: null };
  const rolled = await actor.rollSkill({ skill: "ath", targetValue: dc });
  const roll = Array.isArray(rolled) ? rolled[0] : rolled;
  const total = Number(roll?.total ?? roll?._total);
  return { available: true, canceled: !Number.isFinite(total), total: Number.isFinite(total) ? total : null };
}

async function applyPitfallDamage(actor, config) {
  const Roll = globalThis.Roll;
  if (!Roll) return { total: null, applied: false };
  const roll = Roll.create ? Roll.create(config.damage.formula) : new Roll(config.damage.formula);
  await roll.evaluate({ async: true });
  const total = Math.max(0, Number(roll.total) || 0);
  if (typeof actor?.applyDamage === "function") await actor.applyDamage([{ value: total, type: config.damage.type }], { isDelta: true });
  return { total, applied: typeof actor?.applyDamage === "function" };
}

async function handlePitfallTrapOnGM(region, event) {
  if (!globalThis.game?.user?.isGM || event?.name !== "tokenEnter") return { status: "ignored" };
  const token = event?.data?.token;
  const actor = token?.actor ?? token?.object?.actor ?? null;
  const tokenUuid = String(token?.uuid ?? token?.document?.uuid ?? token?.id ?? "");
  if (!region?.uuid || !tokenUuid || !actor) return { status: "ignored" };
  const key = `${region.uuid}:${tokenUuid}`;
  if (processing.has(key)) return { status: "busy" };
  processing.add(key);
  try {
    const config = validatePitfallTrapConfig(trapData(region));
    if (config.once && config.state.triggered) return { status: "already-triggered" };
    if (config.state.crossedBy.includes(tokenUuid)) return { status: "crossed", ...evaluatePitfallDetection(config, actor) };
    const result = evaluatePitfallDetection(config, actor);
    if (result.detected) {
      if (!config.state.detectedBy.includes(tokenUuid)) config.state.detectedBy.push(tokenUuid);
      config.state.lastUpdatedAt = Date.now();
      await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: config });
      await announce({ event, actor, whisper: true, text: `${actor.name ?? "The character"} notices a concealed pit.` });
      const origin = movementOrigin(event);
      const returned = await pushBack(token, origin);
      if (!returned) return { status: "detected", ...result, returned: false };
      const athletics = await athleticsCheck(actor, config.dc);
      if (athletics.canceled) return { status: "athletics-canceled", ...result, athletics, returned: true };
      const crossing = evaluateAthleticsCheck(athletics.total, config.dc);
      if (crossing.success) {
        config.state.crossedBy.push(tokenUuid);
        config.state.lastUpdatedAt = Date.now();
        await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: config });
        await announce({ event, actor, whisper: true, text: `${actor.name ?? "The character"} finds a way across the pit.` });
        return { status: "crossed", ...result, athletics: crossing, returned: true };
      }
      if (config.once) config.state.triggered = true;
      config.state.lastUpdatedAt = Date.now();
      await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: config });
      const damage = await applyPitfallDamage(actor, config);
      await announce({ event, actor, text: `${actor.name ?? "The character"} fails to cross the pit and takes ${damage.total ?? config.damage.formula} bludgeoning damage.` });
      return { status: "fell", ...result, athletics: crossing, damage, returned: true };
    }
    if (config.once) config.state.triggered = true;
    config.state.lastUpdatedAt = Date.now();
    await region.update({ [`flags.${MODULE_ID}.${PITFALL_TRAP_FLAG}`]: config });
    const damage = await applyPitfallDamage(actor, config);
    await announce({ event, actor, text: `${actor.name ?? "The character"} falls into a hidden pit and takes ${damage.total ?? config.damage.formula} bludgeoning damage.` });
    return { status: "triggered", ...result, damage };
  } finally {
    processing.delete(key);
  }
}

async function handlePitfallSocket(payload, senderId) {
  if (!payload || typeof payload !== "object") return;
  if (payload.action === "pitfall-response" && payload.recipientId === globalThis.game?.user?.id) {
    const pending = pendingRequests.get(payload.requestId);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingRequests.delete(payload.requestId);
    pending.resolve(payload.result);
    return;
  }
  if (payload.action !== "pitfall" || !activeGM()) return;
  const recipientId = payload.userId ?? senderId;
  try {
    const region = globalThis.fromUuidSync?.(payload.regionUuid) ?? await globalThis.fromUuid?.(payload.regionUuid);
    const token = globalThis.fromUuidSync?.(payload.tokenUuid) ?? await globalThis.fromUuid?.(payload.tokenUuid);
    if (!region || region.documentName !== "Region") throw new Error("The trap Region could not be found on the GM client.");
    if (!token || token.documentName !== "Token") throw new Error("The triggering Token could not be found on the GM client.");
    const result = await handlePitfallTrapOnGM(region, {
      name: "tokenEnter",
      user: globalThis.game?.users?.get?.(recipientId) ?? null,
      data: { token, movement: { origin: payload.origin ?? null } }
    });
    globalThis.game?.socket?.emit?.(PITFALL_SOCKET, { action: "pitfall-response", recipientId, requestId: payload.requestId, result });
  } catch (error) {
    globalThis.game?.socket?.emit?.(PITFALL_SOCKET, { action: "pitfall-response", recipientId, requestId: payload.requestId, result: { status: "error", message: error.message ?? "The GM could not resolve the trap." } });
  }
}

export function installPitfallSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return;
  globalThis.game.socket.on(PITFALL_SOCKET, (payload, senderId) => { void handlePitfallSocket(payload, senderId); });
  socketInstalled = true;
}

export async function handlePitfallTrap(region, event) {
  if (globalThis.game?.user?.isGM) return handlePitfallTrapOnGM(region, event);
  if (event?.name !== "tokenEnter") return { status: "ignored" };
  if (!globalThis.game?.users?.activeGM) return { status: "error", message: "A GM must be connected to resolve this trap." };
  const token = event?.data?.token;
  const tokenUuid = String(token?.uuid ?? token?.document?.uuid ?? "");
  if (!region?.uuid || !tokenUuid) return { status: "ignored" };
  const id = requestId();
  const timeout = globalThis.setTimeout?.(() => {
    const pending = pendingRequests.get(id);
    if (!pending) return;
    pendingRequests.delete(id);
    pending.resolve({ status: "error", message: "The active GM did not respond to the trap." });
  }, 8000);
  const result = new Promise(resolve => pendingRequests.set(id, { resolve, timeout }));
  const origin = movementOrigin(event);
  globalThis.game?.socket?.emit?.(PITFALL_SOCKET, { action: "pitfall", requestId: id, regionUuid: region.uuid, tokenUuid, origin, userId: globalThis.game.user.id });
  return result;
}
