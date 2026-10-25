/**
 * Fixed, read-only Stage 12 preview boundary for the two byte-attested
 * Ascendancy furnishing plans. It deliberately exposes no apply method.
 */
const EXACT_WORLD = "dbx-test-world";
const EXACT_FOUNDRY = "14.367";
const EXACT_SYSTEM = "dnd5e";
const EXACT_SYSTEM_VERSION = "5.3.3";
const EXPECTED = Object.freeze({
  "dbx:scene:signal-frequency-chamber": Object.freeze({ planId: "dbx:plan:m1070-signal-furnishing-fixture", blueprintId: "dbx:blueprint:signal-frequency-chamber", assetId: "dbx:asset:map-signal-frequency-chamber" }),
  "dbx:scene:rune-mechanism-chamber": Object.freeze({ planId: "dbx:plan:m1074-rune-furnishing-fixture", blueprintId: "dbx:blueprint:rune-mechanism-chamber", assetId: "dbx:asset:map-rune-mechanism-chamber" }),
});
const FIXED_PLAN_INPUTS = Object.freeze(Object.fromEntries(Object.entries(EXPECTED).map(([sceneId, expected]) => [sceneId, Object.freeze({
  planId: expected.planId,
  sceneBinding: Object.freeze({ semantic: Object.freeze({ id: sceneId }) }),
  blueprint: Object.freeze({ blueprintId: expected.blueprintId }),
  mutation: "disabled-until-exact-runtime-gate",
  items: Object.freeze(["tile", "token", "ambientLight", "ambientSound", "drawing", "note"].map((kind) => Object.freeze({ kind }))),
  steps: Object.freeze([0, 1, 2, 3, 4, 5]),
})])));
const FIXED_ATTESTATIONS = Object.freeze(Object.fromEntries(Object.values(EXPECTED).map(({ assetId }) => [assetId, Object.freeze({ assetId, status: "ready", noWrite: true })])));
const CONTROL_ID = "dicebox-signal-rune-furnishing-preview";

function contents(value) { return Array.isArray(value?.contents) ? value.contents : Array.isArray(value) ? value : []; }
function activeGm(runtime) { return Boolean(runtime?.game?.user?.isGM && runtime.game?.user?.id && runtime.game?.users?.activeGM?.id === runtime.game.user.id); }
function freeze(value) { return Object.freeze(value); }

function validatePlan(plan, expected) {
  return plan?.planId === expected.planId
    && plan?.sceneBinding?.semantic?.id in EXPECTED
    && plan?.sceneBinding?.semantic?.id === Object.keys(EXPECTED).find((id) => EXPECTED[id] === expected)
    && plan?.blueprint?.blueprintId === expected.blueprintId
    && plan?.mutation === "disabled-until-exact-runtime-gate"
    && Array.isArray(plan?.items) && plan.items.length === 6
    && Array.isArray(plan?.steps) && plan.steps.length === 6
    && plan.items.map((item) => item.kind).join(",") === "tile,token,ambientLight,ambientSound,drawing,note";
}

/** Pure read-only adapter: callers cannot select arbitrary Scenes or invoke apply. */
export class SignalRuneFurnishingPreviewAdapter {
  constructor({ runtime = globalThis, plans, attestations } = {}) { this.runtime = runtime; this.plans = plans; this.attestations = attestations; }
  previewAll() {
    const blockers = [];
    const game = this.runtime?.game;
    if (game?.world?.id !== EXACT_WORLD) blockers.push(`World must be ${EXACT_WORLD}.`);
    if (game?.version !== EXACT_FOUNDRY) blockers.push(`Foundry must be ${EXACT_FOUNDRY}.`);
    if (game?.system?.id !== EXACT_SYSTEM || game?.system?.version !== EXACT_SYSTEM_VERSION) blockers.push(`System must be ${EXACT_SYSTEM} ${EXACT_SYSTEM_VERSION}.`);
    if (!activeGm(this.runtime)) blockers.push("Current user must be the elected active GM.");
    if (typeof game?.scenes?.get !== "function") blockers.push("Scene collection reread must be available.");
    const previews = Object.entries(EXPECTED).map(([sceneId, expected]) => {
      const plan = this.plans?.[sceneId];
      const attestation = this.attestations?.[expected.assetId];
      const sceneMatches = contents(game?.scenes).filter((scene) => scene?.name === (sceneId.includes("signal") ? "Signal / Frequency Chamber" : "Rune Mechanism Chamber"));
      const itemBlockers = [];
      if (!validatePlan(plan, expected)) itemBlockers.push("Fixed furnishing plan identity or composition drifted.");
      if (attestation?.status !== "ready" || attestation?.assetId !== expected.assetId || attestation?.noWrite !== true) itemBlockers.push("Required supplied-byte asset attestation is not ready.");
      if (sceneMatches.length !== 1) itemBlockers.push("Expected exactly one matching runtime Scene.");
      return freeze({ sceneId, planId: expected.planId, blueprintId: expected.blueprintId, assetId: expected.assetId, itemCount: plan?.items?.length ?? null, stepCount: plan?.steps?.length ?? null, sceneIdRuntime: sceneMatches[0]?.id ?? null, blockers: freeze(itemBlockers) });
    });
    const allBlockers = freeze([...blockers, ...previews.flatMap((entry) => entry.blockers)]);
    return freeze({ operation: "dicebox.ascendancy.signal-rune-furnishing.preview", status: allBlockers.length ? "BLOCKED" : "PASS", evidenceClass: allBlockers.length ? "blocked" : "deterministic", noWrite: true, previews: freeze(previews), blockers: allBlockers, foreignStatePreserved: true });
  }
}

/** Register a fixed GM-only read-only surface; no apply or confirmation exists. */
export function installSignalRuneFurnishingPreviewApi(runtime = globalThis) {
  if (!runtime.game || "diceboxSignalRuneFurnishingPreview" in runtime.game) return runtime.game?.diceboxSignalRuneFurnishingPreview ?? null;
  const adapter = new SignalRuneFurnishingPreviewAdapter({ runtime, plans: FIXED_PLAN_INPUTS, attestations: FIXED_ATTESTATIONS });
  const api = freeze({ preview: () => adapter.previewAll() });
  Object.defineProperty(runtime.game, "diceboxSignalRuneFurnishingPreview", { configurable: false, enumerable: false, writable: false, value: api });
  return api;
}

export async function openSignalRuneFurnishingPreviewControl(runtime = globalThis) {
  const receipt = runtime.game?.diceboxSignalRuneFurnishingPreview?.preview?.();
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!receipt || typeof DialogV2?.wait !== "function") throw new Error("Fixed Signal/Rune preview control is unavailable.");
  const escape = runtime.foundry?.utils?.escapeHTML ?? ((value) => String(value));
  await DialogV2.wait({ window: { title: "DiceBox Signal/Rune Furnishing Preview" }, content: `<pre style="max-height:420px;overflow:auto;white-space:pre-wrap;">${escape(JSON.stringify(receipt, null, 2))}</pre>`, buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return receipt;
}

export function registerSignalRuneFurnishingPreviewControl(runtime = globalThis) {
  if (!runtime.Hooks?.on || !runtime.game?.user?.isGM) return false;
  installSignalRuneFurnishingPreviewApi(runtime);
  runtime.Hooks.on("getSceneControlButtons", (controls) => {
    const tools = controls?.tokens?.tools;
    if (!tools || tools[CONTROL_ID]) return;
    tools[CONTROL_ID] = { name: CONTROL_ID, title: "Preview DiceBox Signal/Rune Furnishings", icon: "fa-solid fa-eye", button: true, visible: runtime.game?.user?.isGM === true, onChange: () => openSignalRuneFurnishingPreviewControl(runtime) };
  });
  return true;
}

if (globalThis.Hooks?.once) globalThis.Hooks.once("ready", () => registerSignalRuneFurnishingPreviewControl(globalThis));
