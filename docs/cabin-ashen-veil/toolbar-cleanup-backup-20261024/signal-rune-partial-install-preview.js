const FIXED = Object.freeze([
  Object.freeze({ roomId: "dbx:room:signal-frequency-chamber", sceneName: "Signal / Frequency Chamber", assetId: "dbx:asset:map-signal-frequency-chamber", bytes: 2935616, sha256: "DB9307932865B0D3A23C5A8AA61082D520206443318658DE7E03C773A1A9972E" }),
  Object.freeze({ roomId: "dbx:room:rune-mechanism-chamber", sceneName: "Rune Mechanism Chamber", assetId: "dbx:asset:map-rune-mechanism-chamber", bytes: 2748729, sha256: "F45922E219A12FBA6B79A26AD0D6B5EBBAF51ADD86C025E9B676DA24707D507B" }),
]);
const CONTROL_ID = "dicebox-signal-rune-partial-install-preview";

function scenes(runtime) { return runtime?.game?.scenes?.contents ?? []; }
function activeGm(runtime) { return Boolean(runtime?.game?.user?.isGM && runtime.game?.user?.id && runtime.game?.users?.activeGM?.id === runtime.game.user.id); }

/** Fixed no-write candidate preview; it intentionally exposes no apply operation. */
export function previewSignalRunePartialInstall(runtime) {
  const blockers = [];
  const game = runtime?.game;
  if (game?.version !== "14.367") blockers.push("exact-foundry-version-required");
  if (game?.system?.id !== "dnd5e" || game?.system?.version !== "5.3.3") blockers.push("exact-system-version-required");
  if (!game?.user?.isGM || game?.users?.activeGM?.id !== game?.user?.id) blockers.push("elected-active-gm-required");
  const candidates = FIXED.map((item) => ({ item, matches: scenes(runtime).filter((scene) => scene?.name === item.sceneName) }));
  for (const candidate of candidates) if (candidate.matches.length !== 1) blockers.push(`${candidate.item.roomId}:exactly-one-scene-required`);
  return Object.freeze({
    receiptVersion: 1, operation: "dicebox.ascendancy.signal-rune.partial-install.preview", status: blockers.length ? "BLOCKED" : "PASS",
    evidenceClass: "deterministic", noWrite: true, apply: false, blockers: Object.freeze(blockers),
    candidates: Object.freeze(candidates.map(({ item, matches }) => Object.freeze({ roomId: item.roomId, sceneIdRuntime: matches[0]?.id ?? null, assetId: item.assetId, byteLength: item.bytes, sha256: item.sha256, operation: "candidate-only" }))),
    excluded: Object.freeze(["dbx:room:ascendancy-tram-depot", "dbx:room:central-core-control-chamber"]),
  });
}

/** Installs exactly one fixed, read-only preview operation; it exposes no apply/export method. */
export function installSignalRunePartialInstallPreviewApi(runtime = globalThis) {
  if (!runtime.game || "diceboxSignalRunePartialInstallPreview" in runtime.game) return runtime.game?.diceboxSignalRunePartialInstallPreview ?? null;
  const api = Object.freeze({ preview: () => previewSignalRunePartialInstall(runtime) });
  Object.defineProperty(runtime.game, "diceboxSignalRunePartialInstallPreview", { configurable: false, enumerable: false, writable: false, value: api });
  return api;
}

/** Opens a receipt-only dialog with the sole Close action. */
export async function openSignalRunePartialInstallPreviewControl(runtime = globalThis) {
  const receipt = runtime.game?.diceboxSignalRunePartialInstallPreview?.preview?.();
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!receipt || typeof DialogV2?.wait !== "function") throw new Error("Fixed Signal/Rune partial-preview control is unavailable.");
  const escape = runtime.foundry?.utils?.escapeHTML ?? ((value) => String(value));
  await DialogV2.wait({ window: { title: "DiceBox Signal/Rune Partial-Install Preview" }, content: `<pre style="max-height:420px;overflow:auto;white-space:pre-wrap;">${escape(JSON.stringify(receipt, null, 2))}</pre>`, buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return receipt;
}

/** Registers a current-GM-only fixed control; candidate preview remains non-mutating. */
export function registerSignalRunePartialInstallPreviewControl(runtime = globalThis) {
  if (!runtime.Hooks?.on || !activeGm(runtime)) return false;
  installSignalRunePartialInstallPreviewApi(runtime);
  runtime.Hooks.on("getSceneControlButtons", (controls) => {
    const tools = controls?.tokens?.tools;
    if (!tools || tools[CONTROL_ID]) return;
    tools[CONTROL_ID] = { name: CONTROL_ID, title: "Preview DiceBox Signal/Rune Partial Install", icon: "fa-solid fa-eye", button: true, visible: activeGm(runtime), onChange: () => openSignalRunePartialInstallPreviewControl(runtime) };
  });
  return true;
}

if (globalThis.Hooks?.once) globalThis.Hooks.once("ready", () => registerSignalRunePartialInstallPreviewControl(globalThis));
