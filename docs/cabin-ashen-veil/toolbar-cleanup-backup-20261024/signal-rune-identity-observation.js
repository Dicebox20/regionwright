const EXACT_WORLD = "dbx-test-world";
const EXACT_FOUNDRY = "14.367";
const EXACT_SYSTEM = "dnd5e";
const EXACT_SYSTEM_VERSION = "5.3.3";
const PACKAGE_ID = "dicebox-campaign-helper";
const CONTROL_ID = "dicebox-signal-rune-identity-observation";
const OPERATION = "dicebox.ascendancy.signal-rune.native-document.identity-observation";
const EMBEDDED_TYPES = Object.freeze(["Level", "Wall", "Region", "Tile", "Token", "AmbientLight", "AmbientSound", "Drawing", "Note"]);
const TARGETS = Object.freeze([
  Object.freeze({ roomId: "dbx:room:signal-frequency-chamber", sceneIdRuntime: "AneddhKAAfk5HlsA" }),
  Object.freeze({ roomId: "dbx:room:rune-mechanism-chamber", sceneIdRuntime: "p9Mbi0CJWe9KvJhH" }),
]);

function freeze(value) { return Object.freeze(value); }
function text(value) { return typeof value === "string" && value.length > 0 ? value : null; }
function entries(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.contents) ? value.contents : null;
}
function marker(document) {
  const value = document?.flags?.[PACKAGE_ID];
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function ownership(document) {
  const value = marker(document);
  if (!value) return "unknown";
  return value.managed === true && value.owner === PACKAGE_ID && value.packageId === PACKAGE_ID ? "owned" : "foreign";
}
function generation(document) {
  const value = marker(document)?.generation;
  return Number.isInteger(value) && value >= 0 ? value : "unresolved";
}
function blocked(reason, code = "BLOCKED") {
  return freeze({
    schemaVersion: "0.1.0",
    operation: OPERATION,
    status: code,
    evidenceClass: "blocked",
    target: freeze({ worldId: EXACT_WORLD, foundryVersion: EXACT_FOUNDRY, systemId: EXACT_SYSTEM, systemVersion: EXACT_SYSTEM_VERSION }),
    redacted: true,
    noWrite: true,
    apply: false,
    runtimeBinding: "not-created",
    payload: "not-materialized",
    dispatch: "disabled",
    foreignState: "preserve",
    retryAfterUnknown: false,
    readyClaim: false,
    blockers: freeze([reason]),
  });
}

function exactAuthority(runtime) {
  const game = runtime?.game;
  if (game?.world?.id !== EXACT_WORLD) return blocked(`World must be ${EXACT_WORLD}.`);
  if (game?.version !== EXACT_FOUNDRY || game?.system?.id !== EXACT_SYSTEM || game?.system?.version !== EXACT_SYSTEM_VERSION) return blocked("Exact Foundry/system target mismatch.");
  if (game?.user?.name !== "Gamemaster" || game?.user?.isGM !== true || !game.user.id || game.users?.activeGM?.id !== game.user.id) return blocked("Current user must be the exact active Gamemaster.");
  if (typeof game.scenes?.get !== "function") return blocked("Fixed Scene collection reread is unavailable.", "UNAVAILABLE");
  return null;
}

function readParent(scene, target) {
  const documentId = text(scene?.id) ?? text(scene?._id);
  if (scene?.documentName !== "Scene" || documentId !== target.sceneIdRuntime) return null;
  const uuid = text(scene.uuid) ?? "unresolved";
  const observedGeneration = generation(scene);
  return freeze({ documentType: "Scene", documentId, uuid, generation: observedGeneration, status: uuid !== "unresolved" && observedGeneration !== "unresolved" ? "observed" : "partial", ownership: ownership(scene) });
}

function identityShapeSummary(documentType, values) {
  if (!Array.isArray(values)) return freeze({ documentType, status: "unresolved", count: "unresolved", fieldPresence: "unresolved", ownershipPresence: "unresolved" });
  const fieldCounts = { documentName: 0, id: 0, uuid: 0, generation: 0 };
  const ownershipCounts = { owned: 0, foreign: 0, unknown: 0 };
  for (const document of values) {
    if (document?.documentName === documentType) fieldCounts.documentName += 1;
    if (text(document?.id) ?? text(document?._id)) fieldCounts.id += 1;
    if (text(document?.uuid)) fieldCounts.uuid += 1;
    if (generation(document) !== "unresolved") fieldCounts.generation += 1;
    ownershipCounts[ownership(document)] += 1;
  }
  const count = values.length;
  return freeze({
    documentType,
    status: "observed",
    count,
    fieldPresence: freeze({
      documentName: count > 0 && fieldCounts.documentName > 0,
      id: count > 0 && fieldCounts.id > 0,
      uuid: count > 0 && fieldCounts.uuid > 0,
      generation: count > 0 && fieldCounts.generation > 0,
    }),
    fieldCompleteness: freeze({
      documentName: count > 0 && fieldCounts.documentName === count,
      id: count > 0 && fieldCounts.id === count,
      uuid: count > 0 && fieldCounts.uuid === count,
      generation: count > 0 && fieldCounts.generation === count,
    }),
    ownershipPresence: freeze({ owned: ownershipCounts.owned > 0, foreign: ownershipCounts.foreign > 0, unknown: ownershipCounts.unknown > 0 }),
  });
}

function readChildren(scene) {
  if (typeof scene?.getEmbeddedCollection !== "function") return freeze({ status: "unresolved", entries: "unresolved", shapeSummary: "unresolved", reason: "scene.getEmbeddedCollection was not observed" });
  const result = [];
  const shapeSummary = [];
  let unresolvedReason = null;
  for (const documentType of EMBEDDED_TYPES) {
    let collection;
    try { collection = scene.getEmbeddedCollection(documentType); } catch { shapeSummary.push(freeze({ documentType, status: "unresolved", count: "unresolved", fieldPresence: "unresolved", ownershipPresence: "unresolved" })); unresolvedReason ??= `embedded ${documentType} collection outcome unknown`; continue; }
    const values = entries(collection);
    shapeSummary.push(identityShapeSummary(documentType, values));
    if (!values) { unresolvedReason ??= `embedded ${documentType} collection shape unknown`; continue; }
    for (const document of values) {
      const documentId = text(document?.id) ?? text(document?._id);
      const uuid = text(document?.uuid);
      const observedGeneration = generation(document);
      if (document?.documentName !== documentType || !documentId || !uuid || observedGeneration === "unresolved") { unresolvedReason ??= `embedded ${documentType} identity incomplete`; continue; }
      result.push(freeze({ documentType, documentId, uuid, generation: observedGeneration, ownership: ownership(document) }));
    }
  }
  result.sort((left, right) => `${left.documentType}:${left.documentId}`.localeCompare(`${right.documentType}:${right.documentId}`));
  return freeze({ status: unresolvedReason ? "unresolved" : "observed", entries: unresolvedReason ? "unresolved" : freeze(result), shapeSummary: freeze(shapeSummary), reason: unresolvedReason ?? "all allowlisted embedded identity fields observed" });
}

export function readSignalRuneIdentityObservation(runtime = globalThis) {
  const blocker = exactAuthority(runtime);
  if (blocker) return blocker;
  const game = runtime.game;
  const scenes = [];
  for (const target of TARGETS) {
    let scene;
    try { scene = game.scenes.get(target.sceneIdRuntime); } catch { return blocked(`Parent Scene ${target.sceneIdRuntime} reread outcome unknown.`, "UNKNOWN_OUTCOME"); }
    if (!scene) {
      scenes.push(freeze({ ...target, parent: freeze({ documentType: "Scene", documentId: target.sceneIdRuntime, uuid: "unresolved", generation: "unresolved", status: "unresolved", ownership: "unknown" }), children: freeze({ status: "unresolved", entries: "unresolved", reason: "parent Scene not found" }) }));
      continue;
    }
    const parent = readParent(scene, target);
    if (!parent) return blocked(`Parent Scene ${target.sceneIdRuntime} identity did not match the fixed target.`, "UNKNOWN_OUTCOME");
    scenes.push(freeze({ ...target, parent, children: readChildren(scene) }));
  }
  return freeze({
    schemaVersion: "0.1.0",
    operation: OPERATION,
    status: "OBSERVED",
    evidenceClass: "runtime-observation",
    target: freeze({ worldId: EXACT_WORLD, foundryVersion: EXACT_FOUNDRY, systemId: EXACT_SYSTEM, systemVersion: EXACT_SYSTEM_VERSION }),
    activeGm: freeze({ userName: "Gamemaster", userId: game.user.id }),
    redacted: true,
    scenes: freeze(scenes),
    foreignState: "preserve",
    retryAfterUnknown: false,
    runtimeBinding: "not-created",
    noWrite: true,
    apply: false,
    payload: "not-materialized",
    dispatch: "disabled",
    readyClaim: false,
  });
}

export async function openSignalRuneIdentityObservationControl(runtime = globalThis) {
  const receipt = readSignalRuneIdentityObservation(runtime);
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.wait !== "function") return blocked("Foundry DialogV2 is unavailable; no identity receipt was rendered.", "UNAVAILABLE");
  const escape = runtime.foundry?.utils?.escapeHTML ?? ((value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
  await DialogV2.wait({ window: { title: "DiceBox Signal/Rune Identity Observation" }, content: `<pre style="max-height:60vh;overflow:auto;white-space:pre-wrap">${escape(JSON.stringify(receipt, null, 2))}</pre>`, buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return receipt;
}

export function registerSignalRuneIdentityObservationControl(runtime = globalThis) {
  if (typeof runtime.Hooks?.on !== "function" || runtime.game?.user?.isGM !== true) return false;
  runtime.Hooks.on("getSceneControlButtons", (controls) => {
    const tools = controls?.tokens?.tools;
    if (!tools || tools[CONTROL_ID]) return;
    tools[CONTROL_ID] = { name: CONTROL_ID, title: "Show DiceBox Signal/Rune Identity Observation", icon: "fa-solid fa-magnifying-glass", button: true, visible: runtime.game?.user?.isGM === true, onChange: () => openSignalRuneIdentityObservationControl(runtime) };
  });
  return true;
}

if (globalThis.Hooks?.once) globalThis.Hooks.once("ready", () => registerSignalRuneIdentityObservationControl(globalThis));
