import { TRAM_ACCESS, TYPE, resolveActorStableId } from "./tram-access-behavior.js?dbx=0.1.16";

const MODULE_ID = "dicebox-campaign-helper";
const PACKAGE_ID = "dbx:package:fixture-tram-routing-projection";
const PLAN_ID = "dbx:plan:fixture-tram-routing-projection";
const SCENE_ID = "dbx:scene:fixture-tram-routing-projection";
const TTL_MS = 5 * 60 * 1000;

function contents(collection) { return Array.isArray(collection?.contents) ? collection.contents : []; }
function marker(document) { return document?.flags?.[MODULE_ID]?.managed ?? null; }
function owned(document, kind, semanticId) {
  const value = marker(document);
  return value?.owner === MODULE_ID && value?.packageId === PACKAGE_ID && value?.planId === PLAN_ID && value?.kind === kind && value?.semanticId === semanticId;
}
function managed(kind, semanticId) {
  return { flags: { [MODULE_ID]: { managed: { owner: MODULE_ID, packageId: PACKAGE_ID, planId: PLAN_ID, kind, semanticId, schemaVersion: "0.1.0" } } } };
}
function activeGm(runtime) { return Boolean(runtime.game?.user?.isGM && runtime.game?.users?.activeGM?.id === runtime.game.user.id); }
function exact(runtime) { return runtime.game?.world?.id === "dbx-test-world" && runtime.game?.version === "14.367" && runtime.game?.system?.id === "dnd5e" && runtime.game?.system?.version === "5.3.3"; }
function scene(runtime) { return contents(runtime.game?.scenes).find((candidate) => owned(candidate, "scene", SCENE_ID)) ?? null; }
function region(sceneDocument) { return contents(sceneDocument?.regions).find((candidate) => owned(candidate, "region", TRAM_ACCESS.regionStableId)) ?? null; }
function behaviors(regionDocument) { return contents(regionDocument?.behaviors); }
function accessBehavior(regionDocument) { return behaviors(regionDocument).find((candidate) => owned(candidate, "behavior", TRAM_ACCESS.behaviorStableId)) ?? null; }
function actors(runtime) { return contents(runtime.game?.actors).filter((actor) => TRAM_ACCESS.actorStableIds.includes(resolveActorStableId(actor))); }
function readBehavior(document) {
  if (!document) return null;
  return Object.freeze({
    id: document.id,
    uuid: document.uuid ?? null,
    type: document.type,
    disabled: Boolean(document.disabled),
    events: Object.freeze(Array.from(document.system?.events ?? [])),
    action: document.system?.action ?? null,
    regionStableId: document.system?.regionStableId ?? null,
    actorStableIds: Object.freeze(Array.from(document.system?.actorStableIds ?? [])),
  });
}
function readback(runtime) {
  const targetScene = scene(runtime); const targetRegion = region(targetScene); const behavior = accessBehavior(targetRegion);
  return Object.freeze({
    sceneId: targetScene?.id ?? null,
    sceneUuid: targetScene?.uuid ?? null,
    regionId: targetRegion?.id ?? null,
    regionUuid: targetRegion?.uuid ?? null,
    regionBounds: targetRegion?.shapes?.[0] ? Object.freeze({ ...targetRegion.shapes[0] }) : null,
    behavior: readBehavior(behavior),
    matchingActors: Object.freeze(actors(runtime).map((actor) => ({ id: actor.id, uuid: actor.uuid ?? null, stableId: resolveActorStableId(actor) }))),
  });
}
function complete(value) {
  return value?.sceneId && value?.regionId && value?.behavior?.type === TYPE && value.behavior.disabled === false
    && value.behavior.action === TRAM_ACCESS.action && value.behavior.regionStableId === TRAM_ACCESS.regionStableId
    && value.behavior.events.includes("tokenEnter") && value.behavior.actorStableIds.length === 1
    && value.behavior.actorStableIds[0] === TRAM_ACCESS.actorStableIds[0]
    && value.regionBounds?.x === 420 && value.regionBounds?.y === 210 && value.regionBounds?.width === 660 && value.regionBounds?.height === 570;
}
function gate(runtime) {
  const blockers = [];
  if (!exact(runtime)) blockers.push("Exact dbx-test-world / Foundry 14.367 / D&D5e 5.3.3 target is required.");
  if (!activeGm(runtime)) blockers.push("The current user must be the elected active GM.");
  if (!runtime.CONFIG?.RegionBehavior?.dataModels?.[TYPE]) blockers.push(`Native RegionBehavior subtype ${TYPE} is not registered.`);
  if (!scene(runtime)) blockers.push("The owned Tram routing fixture Scene is missing.");
  if (actors(runtime).length !== 1) blockers.push("Exactly one helper-bound Andrew McConaughey Actor is required for the live token-entry exercise.");
  return Object.freeze({ pass: blockers.length === 0, blockers: Object.freeze(blockers) });
}
function regionData() {
  return { name: "Andrew Rush Hour routing board", shapes: [{ type: "rectangle", x: 420, y: 210, width: 660, height: 570, rotation: 0 }], locked: true, color: "#4f8aad", ...managed("region", TRAM_ACCESS.regionStableId) };
}
function behaviorData() {
  return { name: "Andrew Rush Hour entry", type: TYPE, disabled: false, system: { events: ["tokenEnter"], action: TRAM_ACCESS.action, regionStableId: TRAM_ACCESS.regionStableId, actorStableIds: [...TRAM_ACCESS.actorStableIds] }, ...managed("behavior", TRAM_ACCESS.behaviorStableId) };
}

export class TramAccessFixtureInstaller {
  constructor({ runtime = globalThis, now = () => Date.now() } = {}) { this.runtime = runtime; this.now = now; this.preview = null; }
  status() { return Object.freeze({ operation: "tram-access.fixture.status", status: "OBSERVED", noWrite: true, gate: gate(this.runtime), readback: readback(this.runtime), authoritativeReread: true }); }
  previewAndrew() {
    const currentGate = gate(this.runtime);
    if (!currentGate.pass) return Object.freeze({ operation: "tram-access.fixture.preview", status: "BLOCKED", noWrite: true, blockers: currentGate.blockers, readback: readback(this.runtime) });
    const before = readback(this.runtime);
    if (before.regionId && !complete(before)) return Object.freeze({ operation: "tram-access.fixture.preview", status: "BLOCKED", noWrite: true, blockers: ["Owned Andrew access documents are partial or drifted; recover before retry."], readback: before });
    const token = `${this.now().toString(36)}-andrew-routing`;
    this.preview = { token, expiresAt: this.now() + TTL_MS };
    return Object.freeze({ operation: "tram-access.fixture.preview", status: "PASS", noWrite: true, planToken: token, alreadyApplied: complete(before), creates: complete(before) ? Object.freeze([]) : Object.freeze([TRAM_ACCESS.regionStableId, TRAM_ACCESS.behaviorStableId]), foundryApis: Object.freeze(['scene.createEmbeddedDocuments("Region", ...)', 'region.createEmbeddedDocuments("RegionBehavior", ...)']), preservationScope: "Only the two helper-owned Andrew routing documents; no Scene/Wall/Tile/foreign document mutation.", readback: before });
  }
  async applyAndrew({ approved = false, planToken } = {}) {
    const currentGate = gate(this.runtime);
    if (!currentGate.pass) return Object.freeze({ operation: "tram-access.fixture.apply", status: "BLOCKED", noWrite: true, blockers: currentGate.blockers, readback: readback(this.runtime) });
    if (!approved || this.preview?.token !== planToken || this.preview.expiresAt <= this.now()) return Object.freeze({ operation: "tram-access.fixture.apply", status: "BLOCKED", noWrite: true, blockers: ["Apply requires the current reviewed preview token."] });
    this.preview = null;
    let wrote = false;
    try {
      const targetScene = scene(this.runtime); let targetRegion = region(targetScene);
      if (targetRegion && !complete(readback(this.runtime))) throw new Error("Owned Andrew access documents are partial or drifted.");
      if (!targetRegion) {
        const created = await targetScene.createEmbeddedDocuments("Region", [regionData()]); wrote = true;
        targetRegion = created?.[0] ?? region(await Promise.resolve(this.runtime.game.scenes.get(targetScene.id)));
      }
      if (!targetRegion || typeof targetRegion.createEmbeddedDocuments !== "function") throw new Error("Foundry RegionBehavior embedded create surface is unavailable.");
      if (!accessBehavior(targetRegion)) { await targetRegion.createEmbeddedDocuments("RegionBehavior", [behaviorData()]); wrote = true; }
      const after = readback(this.runtime);
      if (!complete(after)) throw new Error("Andrew routing access authoritative reread failed.");
      return Object.freeze({ operation: "tram-access.fixture.apply", status: "PASS", evidenceClass: wrote ? "created_document" : "observed", noWrite: !wrote, readback: after, authoritativeReread: true, foreignStatePreserved: true });
    } catch (error) {
      return Object.freeze({ operation: "tram-access.fixture.apply", status: "UNKNOWN", evidenceClass: "unknown", noWrite: !wrote, error: String(error?.message ?? error), partialReadback: readback(this.runtime), recovery: "Reread before any retry." });
    }
  }
}

export function installTramAccessFixtureApi(runtime = globalThis) {
  if (!runtime.game || "diceboxTramAccessFixture" in runtime.game) return runtime.game?.diceboxTramAccessFixture ?? null;
  const installer = new TramAccessFixtureInstaller({ runtime });
  const api = Object.freeze({ status: () => installer.status(), previewAndrew: () => installer.previewAndrew(), applyAndrew: (approval) => installer.applyAndrew(approval) });
  Object.defineProperty(runtime.game, "diceboxTramAccessFixture", { configurable: false, enumerable: false, writable: false, value: api });
  return api;
}

function receiptHtml(receipt) {
  const escape = globalThis.foundry?.utils?.escapeHTML ?? ((value) => String(value));
  return `<section><p><strong>${escape(receipt.operation)}</strong>: ${escape(receipt.status)}</p><pre style="max-height:420px;overflow:auto;white-space:pre-wrap;">${escape(JSON.stringify(receipt, null, 2))}</pre></section>`;
}

export async function openTramAccessFixtureControl(runtime = globalThis) {
  const api = runtime.game?.diceboxTramAccessFixture;
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!api || typeof DialogV2?.wait !== "function" || typeof DialogV2?.confirm !== "function") throw new Error("Tram access fixture control is unavailable.");
  const preview = api.previewAndrew();
  if (preview.status !== "PASS") {
    await DialogV2.wait({ window: { title: "DiceBox Andrew Routing Preview" }, content: receiptHtml(preview), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
    return preview;
  }
  const approved = await DialogV2.confirm({
    window: { title: "Apply Andrew Rush Hour Entry" },
    content: `${receiptHtml(preview)}<p>This creates only the reviewed Andrew board Region and its native tokenEnter behavior in dbx-test-world.</p>`,
    yes: { label: "Apply reviewed delta", icon: "fa-solid fa-check" },
    no: { label: "Cancel", icon: "fa-solid fa-xmark" },
  });
  if (!approved) return Object.freeze({ ...preview, status: "CANCELLED" });
  const receipt = await api.applyAndrew({ approved: true, planToken: preview.planToken });
  await DialogV2.wait({ window: { title: "DiceBox Andrew Routing Receipt" }, content: receiptHtml(receipt), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return receipt;
}

function registerControl(runtime) {
  if (typeof runtime.Hooks?.on !== "function") return;
  runtime.Hooks.on("getSceneControlButtons", (controls) => {
    if (!runtime.game?.user?.isGM) return;
    const tools = controls?.regions?.tools;
    if (!tools || typeof tools !== "object" || Array.isArray(tools) || tools["dicebox-tram-andrew-access"]) return;
    tools["dicebox-tram-andrew-access"] = {
      name: "dicebox-tram-andrew-access", title: "Preview/apply Andrew Rush Hour entry", icon: "fa-solid fa-train-tram",
      order: Object.keys(tools).length, button: true, visible: true,
      onChange: () => openTramAccessFixtureControl(runtime).catch((error) => runtime.ui?.notifications?.error?.(`DiceBox Tram access blocked: ${error.message}`)),
    };
  });
}

if (typeof globalThis.Hooks?.once === "function") {
  globalThis.Hooks.once("init", () => registerControl(globalThis));
  globalThis.Hooks.once("ready", () => installTramAccessFixtureApi(globalThis));
}

export { behaviorData, readback };
