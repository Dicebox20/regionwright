/** Independent, create-only Scene setup. No desktop, relay, or fixture installer. */
const ID = "dicebox-campaign-helper";
const WORLD = "regionwright-puzzle-test";
const CONTROL = "dicebox-scene-setup";
const LEVEL = "diceboxMapLevel1";
const drafts = new Map();
const receipts = new Map();
const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function gate(r) {
  const g = r.game;
  if (r.location?.origin !== "http://127.0.0.1:30000" || g?.world?.id !== WORLD
    || g.version !== "14.367" || g.system?.id !== "dnd5e" || g.system?.version !== "5.3.3"
    || !g.ready || !g.user?.isGM || g.users?.activeGM?.id !== g.user.id
    || !g.modules?.get(ID)?.active) throw Error("Scene setup requires Regionwright on port 30000, Foundry 14.367, dnd5e 5.3.3, and the current active Gamemaster.");
}

function integer(value, min, max, label) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw Error(`${label} must be an integer from ${min} to ${max}.`);
  return value;
}

export function validateSceneSetup(input) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw Error("Scene settings are required.");
  const allowed = ["name", "width", "height", "gridSize", "gridType", "distance", "units", "map"];
  if (Object.keys(input).some(k => !allowed.includes(k))) throw Error("Unsupported scene setting.");
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 120) throw Error("Enter a scene name of 1–120 characters.");
  const map = typeof input.map === "string" ? input.map.trim() : "";
  if (map && (map.length > 1024 || /[?#\\]/.test(map) || /(^|\/)\.\.(\/|$)/.test(map)
    || !/^(?:worlds|modules|assets|maps|uploads|data)\//.test(map)
    || !/\.(png|jpe?g|webp|avif)$/i.test(map))) throw Error("Choose a served local PNG, JPEG, WebP or AVIF map path (for example worlds/your-world/maps/map.webp).");
  const units = typeof input.units === "string" ? input.units.trim() : "ft";
  if (units.length > 20) throw Error("Grid units must be at most 20 characters.");
  const distance = input.distance;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance <= 0 || distance > 10000) throw Error("Grid distance must be positive and at most 10000.");
  return Object.freeze({ name, map, units, distance,
    width: integer(input.width, 200, 40000, "Width"), height: integer(input.height, 200, 40000, "Height"),
    gridSize: integer(input.gridSize, 50, 500, "Grid size"), gridType: integer(input.gridType, 0, 1, "Grid type") });
}

async function asset(r, path) {
  if (!path) return null;
  const url = new URL(path, r.location.origin + "/");
  if (url.origin !== r.location.origin) throw Error("Map must be served by this Foundry instance.");
  const response = await r.fetch(url.href, { cache: "no-store", redirect: "error" });
  if (!response.ok) throw Error(`Map is unavailable (${response.status}).`);
  if (Number(response.headers.get("content-length")) > 50 * 1024 * 1024) throw Error("Map exceeds 50 MiB.");
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 50 * 1024 * 1024) throw Error("Map must be nonempty and at most 50 MiB.");
  const bitmap = await r.createImageBitmap(new Blob([bytes]));
  const dimensions = { width: bitmap.width, height: bitmap.height }; bitmap.close();
  const digest = await r.crypto.subtle.digest("SHA-256", bytes);
  return Object.freeze({ path, bytes: bytes.byteLength, ...dimensions, sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("") });
}

function owned(r, operationId) {
  return r.game.scenes.contents.filter(s => s.flags?.[ID]?.sceneSetup?.operationId === operationId);
}

function read(r, operationId, spec) {
  const matches = owned(r, operationId);
  if (matches.length !== 1) return { complete: false, matches: matches.length };
  const s = matches[0];
  const level = s.levels?.get(LEVEL);
  return { complete: s.name === spec.name && s.width === spec.width && s.height === spec.height
    && s.grid.type === spec.gridType && s.grid.size === spec.gridSize && s.grid.distance === spec.distance
    && s.grid.units === spec.units && s.initialLevel?.id === LEVEL
    && (level?.background?.src || "") === spec.map,
  matches: 1, sceneId: s.id, name: s.name, width: s.width, height: s.height,
  grid: { type: s.grid.type, size: s.grid.size, distance: s.grid.distance, units: s.grid.units },
  initialLevelId: s.initialLevel?.id, map: level?.background?.src || "" };
}

export function createSceneSetupApi(r = globalThis) {
  return Object.freeze({
    async preview(input) {
      gate(r);
      const spec = validateSceneSetup(input);
      if (r.game.scenes.contents.some(s => s.name === spec.name)) throw Error("A scene with this name already exists. Choose a new name; existing scenes are never overwritten.");
      const attestation = await asset(r, spec.map);
      gate(r);
      const operationId = r.crypto.randomUUID();
      const draft = { spec, attestation, userId: r.game.user.id, expires: Date.now() + 300000, state: "preview", before: r.game.scenes.contents.map(s => s.id).sort() };
      drafts.set(operationId, draft);
      for (const [id, d] of drafts) if (d.expires < Date.now() && d.state === "preview") drafts.delete(id);
      return { status: "PREVIEW", operationId, spec, asset: attestation, expires: draft.expires, noWrite: true,
        warnings: attestation && (attestation.width !== spec.width || attestation.height !== spec.height) ? ["Map will be stretched to the explicitly selected scene dimensions."] : [] };
    },
    async create({ operationId, approved } = {}) {
      gate(r);
      const d = drafts.get(operationId);
      if (!d || approved !== true || d.state !== "preview" || d.expires < Date.now() || d.userId !== r.game.user.id) throw Error("Create requires an approved, unexpired, unused preview from this active GM.");
      d.state = "checking";
      try {
        const currentAsset = await asset(r, d.spec.map);
        gate(r);
        if (JSON.stringify(currentAsset) !== JSON.stringify(d.attestation)) throw Error("Map bytes changed after preview. Review a new preview.");
        if (JSON.stringify(r.game.scenes.contents.map(s => s.id).sort()) !== JSON.stringify(d.before)
          || r.game.scenes.contents.some(s => s.name === d.spec.name)) throw Error("Scene list changed after preview. Review a new preview.");
        const data = { name: d.spec.name, width: d.spec.width, height: d.spec.height,
          padding: 0, active: false, navigation: false, tokenVision: false,
          grid: { type: d.spec.gridType, size: d.spec.gridSize, distance: d.spec.distance, units: d.spec.units },
          initialLevel: LEVEL, levels: [{ _id: LEVEL, name: "Map", background: { src: d.spec.map || null } }],
          flags: { [ID]: { stableId: `dbx:scene:${operationId}`, sceneSetup: { operationId, worldId: WORLD, version: "1.0.0", asset: d.attestation } } }
        };
        // Validate with the exact native schema before requesting persistence.
        new r.CONFIG.Scene.documentClass(data, { strict: true });
        d.state = "executing";
        await r.CONFIG.Scene.documentClass.create(data, { renderSheet: false });
        const observed = read(r, operationId, d.spec);
        const foreignPreserved = d.before.every(id => r.game.scenes.has(id));
        const receipt = { status: observed.complete && foreignPreserved ? "CREATED" : "NEEDS_REVIEW", operationId, observed, foreignPreserved, asset: d.attestation, noWrite: false };
        d.state = receipt.status; receipts.set(operationId, receipt); return receipt;
      } catch (error) {
        const attempted = d.state === "executing";
        d.state = attempted ? "outcome-unknown" : "rejected";
        const receipt = { status: attempted ? "OUTCOME_UNKNOWN" : "REJECTED", operationId, noWrite: !attempted, retryAllowed: false, error: String(error.message), observed: read(r, operationId, d.spec) };
        receipts.set(operationId, receipt); return receipt;
      }
    },
    reread(operationId) {
      gate(r);
      const d = drafts.get(operationId);
      if (d) return { operationId, state: d.state, observed: read(r, operationId, d.spec), lastReceipt: receipts.get(operationId) ?? null };
      const matches = owned(r, operationId);
      return { operationId, persistedMatches: matches.length, sceneIds: matches.map(s => s.id), retryAllowed: false };
    }
  });
}

export async function openSceneSetup(r = globalThis) {
  gate(r);
  const D = r.foundry.applications.api.DialogV2;
  const api = r.game.diceboxSceneSetup;
  const value = await D.wait({ window: { title: "DiceBox — Set up a scene" },
    content: `<p>Create a new scene. Existing scenes are preserved. A map is optional; upload it using Foundry's File Browser first.</p><div class="standard-form"><label>Name <input name="sceneName" required maxlength="120" value="New DiceBox Scene"></label><label>Map image path <input name="map" placeholder="worlds/regionwright-puzzle-test/maps/map.webp"></label><button type="button" data-action="choose-map">Browse maps</button><div class="form-group"><label>Width (px) <input name="width" type="number" value="3000" min="200" max="40000"></label><label>Height (px) <input name="height" type="number" value="2000" min="200" max="40000"></label></div><label>Grid <select name="gridType"><option value="1">Square</option><option value="0">Gridless</option></select></label><label>Grid size (px) <input name="gridSize" type="number" value="100" min="50" max="500"></label><label>Distance per square <input name="distance" type="number" value="5" min="0.01" step="any"></label><label>Units <input name="units" value="ft" maxlength="20"></label></div>`,
    render: (_event, app) => app.element.querySelector('[data-action="choose-map"]').addEventListener("click", () => {
      const Picker = r.foundry.applications.apps.FilePicker.implementation;
      new Picker({ type: "image", callback: path => { app.element.querySelector('[name="map"]').value = path; } }).browse();
    }),
    buttons: [{ action: "preview", label: "Preview scene", default: true, callback: (_event, button) => {
      const form = button.form;
      return { name: form.elements.sceneName.value, map: form.elements.map.value, width: Number(form.elements.width.value), height: Number(form.elements.height.value), gridType: Number(form.elements.gridType.value), gridSize: Number(form.elements.gridSize.value), distance: Number(form.elements.distance.value), units: form.elements.units.value };
    } }, { action: "cancel", label: "Cancel" }], rejectClose: false });
  if (!value || typeof value !== "object") return { status: "CANCELLED", noWrite: true };
  const preview = await api.preview(value);
  const s = preview.spec;
  const approved = await D.confirm({ window: { title: "DiceBox — Preview scene" }, content: `<h3>${esc(s.name)}</h3><p>${s.width} × ${s.height} pixels; ${s.gridType ? "square" : "no"} grid, ${s.gridSize}px; ${s.distance} ${esc(s.units)} per square.</p><p>Map: ${esc(s.map || "None (blank scene)")}</p>${preview.asset ? `<p>Image: ${preview.asset.width} × ${preview.asset.height}; SHA-256 <code>${preview.asset.sha256}</code></p>` : ""}<p>${preview.warnings.map(esc).join("<br>")}</p><p>Creates one new inactive scene. No existing scene is changed.</p>`, yes: { label: "Create scene" }, no: { label: "Cancel" }, rejectClose: false });
  if (!approved) return { status: "CANCELLED", noWrite: true };
  const receipt = await api.create({ operationId: preview.operationId, approved: true });
  if (receipt.status === "CREATED") r.ui.notifications.info(`Created ${s.name}. Open it from the Scenes sidebar.`);
  else r.ui.notifications.warn(`DiceBox scene setup: ${receipt.status}. Inspect the receipt before retrying.`);
  return receipt;
}

if (typeof globalThis.Hooks?.once === "function") {
  globalThis.Hooks.once("init", () => {
    globalThis.Hooks.on("getSceneControlButtons", controls => {
      if (!game.user?.isGM || game.world?.id !== WORLD) return;
      const tools = controls?.tokens?.tools;
      if (!tools || Array.isArray(tools)) return;
      tools[CONTROL] = { name: CONTROL, title: "DiceBox: Set up a scene or map", icon: "fa-solid fa-map", button: true, visible: true, order: Object.keys(tools).length,
        onChange: () => openSceneSetup().catch(e => ui.notifications.error(e.message)) };
    });
  });
  globalThis.Hooks.once("ready", () => {
    if (!Object.hasOwn(game, "diceboxSceneSetup")) Object.defineProperty(game, "diceboxSceneSetup", { value: createSceneSetupApi(), writable: false });
  });
}
