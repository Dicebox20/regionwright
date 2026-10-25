/**
 * Exact fixture adapter for the first Campaign Helper-authored Foundry Scene.
 *
 * The generated package is the only plan input. This adapter is create-only:
 * it never deletes, cleans up, accepts arbitrary payloads, or targets Ballad.
 */

const MODULE_ID = "dicebox-campaign-helper";
const PACKAGE_PATH = `modules/${MODULE_ID}/program-scene-vertical-slice-package.json`;
const PACKAGE_ID = "dbx:package:program-scene-vertical-slice-v1";
const ADAPTER_VERSION = "0.1.0";
const EXACT_WORLD_ID = "dbx-test-world";
const EXACT_FOUNDRY_VERSION = "14.367";
const EXACT_SYSTEM_ID = "dnd5e";
const EXACT_SYSTEM_VERSION = "5.3.3";
const PLAN_TTL_MS = 5 * 60 * 1000;
const TILE_MARKER_PATH = `modules/${MODULE_ID}/assets/maps/ascendancy-tram-calibration-marker-v1.svg`;
const UPDATE_WITNESS_KEY = "stage11UpdateWitness";

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function contents(collection) {
  if (Array.isArray(collection?.contents)) return collection.contents;
  if (Array.isArray(collection)) return collection;
  if (collection && typeof collection.values === "function") return [...collection.values()];
  return [];
}

function managedMarker(document) {
  return document?.flags?.[MODULE_ID]?.managed ?? null;
}

function stableId(document) {
  return document?.flags?.[MODULE_ID]?.stableId
    ?? managedMarker(document)?.stableId
    ?? null;
}

function isOwned(document, packageData, kind, expectedStableId) {
  const marker = managedMarker(document);
  return marker?.owner === MODULE_ID
    && marker.packageId === PACKAGE_ID
    && marker.planSha256 === packageData.plan.planSha256
    && marker.adapterVersion === ADAPTER_VERSION
    && marker.kind === kind
    && marker.stableId === expectedStableId;
}

function marker(packageData, candidate, kind) {
  return {
    flags: {
      [MODULE_ID]: {
        ...(candidate.data?.flags?.[MODULE_ID] ?? {}),
        managed: {
          owner: MODULE_ID,
          packageId: PACKAGE_ID,
          planSha256: packageData.plan.planSha256,
          adapterVersion: ADAPTER_VERSION,
          kind,
          stableId: candidate.stableId,
          sourceRevision: packageData.plan.sourceRevision,
        },
      },
    },
  };
}

function mergeCandidateData(packageData, candidate, kind) {
  return {
    ...candidate.data,
    ...marker(packageData, candidate, kind),
  };
}

function documentKind(candidate) {
  return candidate.documentType.toLowerCase();
}

function candidateOf(packageData, documentType) {
  const matches = packageData.plan.documents.filter((candidate) => candidate.documentType === documentType);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${documentType} candidate.`);
  return matches[0];
}

function candidatesOf(packageData, documentType) {
  return packageData.plan.documents.filter((candidate) => candidate.documentType === documentType);
}

function activeGm(runtime) {
  return Boolean(runtime.game?.user?.isGM
    && runtime.game?.user?.id
    && runtime.game?.users?.activeGM?.id === runtime.game.user.id);
}

function readRuntimeGate(runtime, packageData) {
  const checks = [
    [runtime.game?.world?.id === EXACT_WORLD_ID, `World must be ${EXACT_WORLD_ID}.`],
    [runtime.game?.version === EXACT_FOUNDRY_VERSION, `Foundry must be ${EXACT_FOUNDRY_VERSION}.`],
    [runtime.game?.system?.id === EXACT_SYSTEM_ID && runtime.game?.system?.version === EXACT_SYSTEM_VERSION, `System must be ${EXACT_SYSTEM_ID} ${EXACT_SYSTEM_VERSION}.`],
    [packageData.target.worldId === EXACT_WORLD_ID, "Package world target is exact."],
    [typeof runtime.game?.user?.id === "string", "A current Foundry User is required."],
    [Array.isArray(runtime.game?.scenes?.contents) && typeof runtime.game?.scenes?.get === "function", "Scene collection reread must be available."],
  ].map(([pass, reason]) => ({ pass: Boolean(pass), reason }));
  return Object.freeze({ pass: checks.every((check) => check.pass), checks: Object.freeze(checks), failed: Object.freeze(checks.filter((check) => !check.pass).map((check) => check.reason)) });
}

function runtimeGate(runtime, packageData) {
  const readGate = readRuntimeGate(runtime, packageData);
  const checks = [
    ...readGate.checks,
    { pass: activeGm(runtime), reason: "Current user must be the elected active GM." },
    { pass: typeof runtime.Scene?.create === "function", reason: "Scene.create must be available." },
  ];
  return Object.freeze({ pass: checks.every((check) => check.pass), checks: Object.freeze(checks), failed: Object.freeze(checks.filter((check) => !check.pass).map((check) => check.reason)) });
}

function userContext(runtime) {
  return Object.freeze({
    context: runtime.game?.user?.isGM === true ? "GM" : "Player3",
    userId: typeof runtime.game?.user?.id === "string" ? runtime.game.user.id : null,
    isGm: runtime.game?.user?.isGM === true,
    isActiveGm: activeGm(runtime),
  });
}

async function attestDeployedAsset(packageData, fetcher) {
  const expected = Object.freeze({
    path: packageData.assetDeployment.foundryPath,
    bytes: packageData.assetDeployment.sourceBytes,
    sha256: packageData.assetDeployment.sourceSha256,
  });
  if (typeof fetcher !== "function") return Object.freeze({ operation: "program-scene.asset-attestation", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, expected, observed: null, blockers: ["A read-only asset fetch surface is required before Scene creation."] });
  try {
    const response = await fetcher(expected.path, { cache: "no-store" });
    if (!response?.ok || typeof response.arrayBuffer !== "function") return Object.freeze({ operation: "program-scene.asset-attestation", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, expected, observed: { httpStatus: Number(response?.status) || null }, blockers: ["The exact served renderer could not be fetched before Scene creation."] });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const observed = Object.freeze({ httpStatus: Number(response.status) || 200, bytes: bytes.byteLength, sha256: await sha256Bytes(bytes) });
    const blockers = [];
    if (observed.bytes !== expected.bytes) blockers.push("The served renderer byte length differs from the reviewed package.");
    if (observed.sha256 !== expected.sha256) blockers.push("The served renderer SHA-256 differs from the reviewed package.");
    return Object.freeze({ operation: "program-scene.asset-attestation", status: blockers.length ? "BLOCKED" : "PASS", evidenceClass: blockers.length ? "blocked" : "fixture", noWrite: true, expected, observed, blockers: Object.freeze(blockers) });
  } catch {
    return Object.freeze({ operation: "program-scene.asset-attestation", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, expected, observed: null, blockers: ["The served renderer fetch outcome is unknown; no Scene creation is permitted."] });
  }
}

function initialLevel(scene) {
  if (scene?.initialLevel) return scene.initialLevel;
  if (scene?.firstLevel) return scene.firstLevel;
  const levels = contents(scene?.levels);
  return levels.length === 1 ? levels[0] : null;
}

function findStable(collection, expectedStableId) {
  return contents(collection).filter((document) => stableId(document) === expectedStableId);
}

function findOwnedScene(runtime, packageData) {
  const sceneCandidate = candidateOf(packageData, "Scene");
  const matches = contents(runtime.game?.scenes).filter((scene) => isOwned(scene, packageData, "scene", sceneCandidate.stableId));
  const collisions = contents(runtime.game?.scenes).filter((scene) => stableId(scene) === sceneCandidate.stableId && !isOwned(scene, packageData, "scene", sceneCandidate.stableId));
  if (matches.length > 1) throw new Error("Duplicate helper-owned fixture Scenes were found.");
  if (collisions.length > 0) throw new Error("A Scene stable-ID collision exists outside this exact package/plan.");
  return matches[0] ?? null;
}

function collectionFor(scene, documentType) {
  if (documentType === "Wall") return scene?.walls;
  if (documentType === "Region") return scene?.regions;
  if (documentType === "Tile") return scene?.tiles;
  return null;
}

function runtimeIdentity(document) {
  return typeof document?.uuid === "string" ? document.uuid : typeof document?.id === "string" ? document.id : null;
}

function expectedRenderer(packageData) {
  return packageData.assetDeployment.foundryPath;
}

function childReadback(scene, packageData, candidate) {
  const matches = findStable(collectionFor(scene, candidate.documentType), candidate.stableId);
  const owned = matches.filter((document) => isOwned(document, packageData, documentKind(candidate), candidate.stableId));
  return {
    stableId: candidate.stableId,
    documentType: candidate.documentType,
    matches: matches.length,
    ownedMatches: owned.length,
    runtimeId: owned.length === 1 ? runtimeIdentity(owned[0]) : null,
  };
}

function foreignCounts(scene, packageData) {
  const count = (collection) => contents(collection).filter((document) => managedMarker(document)?.packageId !== PACKAGE_ID
    || managedMarker(document)?.planSha256 !== packageData.plan.planSha256).length;
  return Object.freeze({ walls: count(scene?.walls), regions: count(scene?.regions), tiles: count(scene?.tiles) });
}

function sameCounts(left, right) {
  return left.walls === right.walls && left.regions === right.regions && left.tiles === right.tiles;
}

function foreignWorldSceneCount(runtime, packageData) {
  return contents(runtime.game?.scenes).filter((scene) => !isOwned(scene, packageData, "scene", candidateOf(packageData, "Scene").stableId)).length;
}

function snapshot(scene, packageData) {
  const children = packageData.plan.documents
    .filter((candidate) => ["Wall", "Region", "Tile"].includes(candidate.documentType))
    .map((candidate) => childReadback(scene, packageData, candidate));
  const sceneCandidate = candidateOf(packageData, "Scene");
  const levelCandidate = candidateOf(packageData, "Level");
  const level = initialLevel(scene);
  const renderer = level?.background?.src ?? null;
  const sceneOwned = Boolean(scene && isOwned(scene, packageData, "scene", sceneCandidate.stableId));
  const levelOwned = Boolean(level && isOwned(level, packageData, "level", levelCandidate.stableId));
  const complete = sceneOwned
    && levelOwned
    && renderer === expectedRenderer(packageData)
    && children.every((child) => child.matches === 1 && child.ownedMatches === 1);
  return Object.freeze({
    scene: scene ? { stableId: sceneCandidate.stableId, runtimeId: runtimeIdentity(scene), owned: sceneOwned } : null,
    initialLevel: level ? { stableId: levelCandidate.stableId, runtimeId: runtimeIdentity(level), owned: levelOwned, renderer } : null,
    children: Object.freeze(children),
    counts: Object.freeze({
      walls: children.filter((child) => child.documentType === "Wall" && child.ownedMatches === 1).length,
      regions: children.filter((child) => child.documentType === "Region" && child.ownedMatches === 1).length,
      tiles: children.filter((child) => child.documentType === "Tile" && child.ownedMatches === 1).length,
    }),
    complete,
  });
}

async function rereadScene(runtime, scene) {
  const current = runtime.game?.scenes?.get?.(scene?.id);
  if (current) return current;
  if (typeof runtime.fromUuid === "function" && scene?.uuid) return runtime.fromUuid(scene.uuid);
  return null;
}

async function validatePackage(packageData) {
  if (packageData?.schemaVersion !== "0.1.0"
    || packageData.packageId !== PACKAGE_ID
    || packageData.adapterVersion !== ADAPTER_VERSION
    || packageData.target?.worldId !== EXACT_WORLD_ID
    || packageData.target?.foundryVersion !== EXACT_FOUNDRY_VERSION
    || packageData.target?.systemId !== EXACT_SYSTEM_ID
    || packageData.target?.systemVersion !== EXACT_SYSTEM_VERSION
    || packageData.plan?.schemaVersion !== "0.1.0"
    || packageData.plan?.target?.foundryVersion !== EXACT_FOUNDRY_VERSION
    || packageData.plan?.target?.systemId !== EXACT_SYSTEM_ID
    || packageData.plan?.target?.systemVersion !== EXACT_SYSTEM_VERSION
    || packageData.plan?.mutation !== "disabled-until-exact-runtime-gate"
    || packageData.plan?.noWrite !== true
    || packageData.plan?.preservation?.foreign !== "preserve"
    || packageData.plan?.preservation?.unknown !== "preserve"
    || packageData.plan?.preservation?.runtimeOwned !== "preserve"
    || packageData.plan?.preservation?.cleanup !== "disabled"
    || packageData.assetDeployment?.foundryPath !== `modules/${MODULE_ID}/assets/maps/ascendancy-tram-calibration-graybox-v1.png`
    || !/^[0-9a-f]{64}$/.test(packageData.assetDeployment?.sourceSha256 ?? "")) {
    throw new Error("Program Scene package identity, target, preservation, or asset deployment is invalid.");
  }
  const allowedTypes = new Set(["Scene", "Level", "Wall", "Region", "Tile"]);
  const stableIds = new Set();
  for (const candidate of packageData.plan.documents ?? []) {
    if (!allowedTypes.has(candidate.documentType)
      || !["create-candidate", "update-candidate"].includes(candidate.operation)
      || typeof candidate.stableId !== "string"
      || stableIds.has(candidate.stableId)
      || candidate.runtimeId !== null
      || candidate.ownership?.moduleId !== MODULE_ID
      || candidate.ownership?.stableId !== candidate.stableId) throw new Error("Program Scene candidate contract is invalid or ambiguous.");
    stableIds.add(candidate.stableId);
  }
  if ((packageData.plan.documents ?? []).length !== 10
    || candidatesOf(packageData, "Wall").length !== 5
    || candidatesOf(packageData, "Region").length !== 2
    || candidatesOf(packageData, "Tile").length !== 1) throw new Error("Program Scene candidate count has drifted.");
  const unsigned = { ...packageData.plan };
  delete unsigned.planSha256;
  if (await sha256(canonicalJson(unsigned)) !== packageData.plan.planSha256) throw new Error("Program Scene plan SHA-256 does not match its canonical content.");
  return packageData;
}

function scenePayload(packageData) {
  const candidate = candidateOf(packageData, "Scene");
  return mergeCandidateData(packageData, candidate, "scene");
}

function childPayload(packageData, candidate) {
  const data = mergeCandidateData(packageData, candidate, documentKind(candidate));
  if (candidate.documentType === "Tile") return { ...data, texture: { ...(data.texture ?? {}), src: TILE_MARKER_PATH }, locked: true };
  return data;
}

function levelPayload(packageData) {
  const candidate = candidateOf(packageData, "Level");
  return { ...mergeCandidateData(packageData, candidate, "level"), background: { ...(candidate.data.background ?? {}), src: expectedRenderer(packageData) } };
}

export class ProgramSceneVerticalSliceAdapter {
  constructor({ runtime = globalThis, packageData, assetAttestation, now = () => Date.now() } = {}) {
    this.runtime = runtime;
    this.packageData = packageData;
    this.assetAttestation = assetAttestation;
    this.now = now;
    this.previewToken = null;
    this.inversePreviewToken = null;
    this.updateWitnessPreviewToken = null;
    this.lastOperationReceipt = null;
    this.pendingUnknown = null;
  }

  static async create(options = {}) {
    const packageData = await validatePackage(options.packageData);
    const fetcher = options.fetcher ?? options.runtime?.fetch ?? globalThis.fetch;
    const assetAttestation = await attestDeployedAsset(packageData, fetcher);
    return new ProgramSceneVerticalSliceAdapter({ ...options, packageData, assetAttestation });
  }

  status() {
    const gate = readRuntimeGate(this.runtime, this.packageData);
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      return Object.freeze({ operation: "program-scene.status", status: gate.pass ? "OBSERVED" : "BLOCKED", evidenceClass: gate.pass ? "fixture" : "blocked", noWrite: true, gate, authority: userContext(this.runtime), planSha256: this.packageData.plan.planSha256, assetAttestation: this.assetAttestation, readback });
    } catch (error) {
      return Object.freeze({ operation: "program-scene.status", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), rereadRequired: true, gate });
    }
  }

  lastReceipt() {
    return this.lastOperationReceipt;
  }

  preview() {
    const gate = runtimeGate(this.runtime, this.packageData);
    const blockers = [...gate.failed, ...(this.assetAttestation?.status === "PASS" ? [] : this.assetAttestation?.blockers ?? ["Exact served renderer attestation is required."])];
    if (blockers.length) return Object.freeze({ operation: "program-scene.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: Object.freeze(blockers), gate, assetAttestation: this.assetAttestation });
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (scene && !readback.complete) return Object.freeze({ operation: "program-scene.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["The helper-owned fixture Scene is partial or drifted. Recovery requires authoritative review; apply will not retry."], gate, readback });
      const token = `${this.now().toString(36)}-${this.packageData.plan.planSha256.slice(0, 12)}`;
      this.previewToken = { token, expiresAt: this.now() + PLAN_TTL_MS };
      const receipt = Object.freeze({ operation: "program-scene.preview", status: "PASS", evidenceClass: "deterministic", noWrite: true, planToken: token, expiresAt: new Date(this.previewToken.expiresAt).toISOString(), planSha256: this.packageData.plan.planSha256, existingComplete: Boolean(readback?.complete), candidates: Object.freeze(this.packageData.plan.documents.map((candidate) => ({ stableId: candidate.stableId, documentType: candidate.documentType, foundryApi: candidate.foundryApi }))), preservation: this.packageData.plan.preservation, assetAttestation: this.assetAttestation, gate });
      this.lastOperationReceipt = receipt;
      return receipt;
    } catch (error) {
      return Object.freeze({ operation: "program-scene.preview", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), rereadRequired: true, gate });
    }
  }

  previewInverse() {
    const gate = runtimeGate(this.runtime, this.packageData);
    const blockers = [...gate.failed, ...(this.assetAttestation?.status === "PASS" ? [] : this.assetAttestation?.blockers ?? ["Exact served renderer attestation is required."])];
    if (blockers.length) return Object.freeze({ operation: "program-scene.inverse.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: Object.freeze(blockers), gate, assetAttestation: this.assetAttestation });
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (!scene || !readback?.complete) return Object.freeze({ operation: "program-scene.inverse.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Inverse requires one complete helper-owned fixture Scene after authoritative reread."], gate, readback });
      if (typeof scene.delete !== "function") return Object.freeze({ operation: "program-scene.inverse.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["The exact helper-owned Scene does not expose an instance delete method."], gate, readback });
      const token = `${this.now().toString(36)}-inverse-${this.packageData.plan.planSha256.slice(0, 12)}`;
      this.inversePreviewToken = { token, expiresAt: this.now() + PLAN_TTL_MS };
      const receipt = Object.freeze({ operation: "program-scene.inverse.preview", status: "PASS", evidenceClass: "deterministic", noWrite: true, inverseToken: token, expiresAt: new Date(this.inversePreviewToken.expiresAt).toISOString(), planSha256: this.packageData.plan.planSha256, authoritativeReread: true, foreignWorldScenesBefore: foreignWorldSceneCount(this.runtime, this.packageData), assetAttestation: this.assetAttestation, gate, readback });
      this.lastOperationReceipt = receipt;
      return receipt;
    } catch (error) {
      return Object.freeze({ operation: "program-scene.inverse.preview", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), rereadRequired: true, retryAllowed: false, gate });
    }
  }

  async applyInverse({ approved = false, inverseToken } = {}) {
    const gate = runtimeGate(this.runtime, this.packageData);
    const blockers = [...gate.failed, ...(this.assetAttestation?.status === "PASS" ? [] : this.assetAttestation?.blockers ?? ["Exact served renderer attestation is required."])];
    if (blockers.length) return Object.freeze({ operation: "program-scene.inverse.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: Object.freeze(blockers), gate, assetAttestation: this.assetAttestation });
    if (!approved || inverseToken !== this.inversePreviewToken?.token || this.inversePreviewToken.expiresAt <= this.now()) return Object.freeze({ operation: "program-scene.inverse.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Inverse requires approved: true and the unexpired token from the current exact inverse preview."], gate });
    this.inversePreviewToken = null;
    let deleteAttempted = false;
    let beforeForeignWorldScenes = null;
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (!scene || !readback?.complete) return Object.freeze({ operation: "program-scene.inverse.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Inverse requires one complete helper-owned fixture Scene after authoritative reread."], readback });
      if (typeof scene.delete !== "function") return Object.freeze({ operation: "program-scene.inverse.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["The exact helper-owned Scene does not expose an instance delete method."], readback });
      beforeForeignWorldScenes = foreignWorldSceneCount(this.runtime, this.packageData);
      deleteAttempted = true;
      await scene.delete();
      const remaining = findOwnedScene(this.runtime, this.packageData);
      const foreignWorldScenesAfter = foreignWorldSceneCount(this.runtime, this.packageData);
      if (remaining !== null || beforeForeignWorldScenes !== foreignWorldScenesAfter) throw new Error("Post-delete authoritative reread did not prove exact owned-scene absence and foreign Scene preservation.");
      const receipt = Object.freeze({ operation: "program-scene.inverse.apply", status: "PASS", evidenceClass: "fixture", noWrite: false, sceneDeleted: true, planSha256: this.packageData.plan.planSha256, authoritativeReread: true, foreignStatePreserved: true, foreignWorldScenesBefore: beforeForeignWorldScenes, foreignWorldScenesAfter, deletedScene: readback.scene });
      this.lastOperationReceipt = receipt;
      return receipt;
    } catch (error) {
      let partialReadback = null;
      let foreignWorldScenesAfter = null;
      try {
        const remaining = findOwnedScene(this.runtime, this.packageData);
        partialReadback = remaining ? snapshot(remaining, this.packageData) : null;
        foreignWorldScenesAfter = foreignWorldSceneCount(this.runtime, this.packageData);
      } catch { /* an unavailable reread is itself outcome-unknown */ }
      const receipt = Object.freeze({ operation: "program-scene.inverse.apply", status: "UNKNOWN", evidenceClass: "unknown", noWrite: !deleteAttempted, deleteAttempted, error: String(error?.message ?? error), partialReadback, authoritativeReread: foreignWorldScenesAfter !== null, retryAllowed: false, recovery: "Do not retry. Review the authoritative owned-scene absence/partial reread and foreign-state count before any recovery decision.", foreignWorldScenesBefore: beforeForeignWorldScenes, foreignWorldScenesAfter, planSha256: this.packageData.plan.planSha256 });
      this.lastOperationReceipt = receipt;
      return receipt;
    }
  }

  async apply({ approved = false, planToken } = {}) {
    const gate = runtimeGate(this.runtime, this.packageData);
    const blockers = [...gate.failed, ...(this.assetAttestation?.status === "PASS" ? [] : this.assetAttestation?.blockers ?? ["Exact served renderer attestation is required."])];
    if (blockers.length) return Object.freeze({ operation: "program-scene.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: Object.freeze(blockers), gate, assetAttestation: this.assetAttestation });
    if (!approved || planToken !== this.previewToken?.token || this.previewToken.expiresAt <= this.now()) return Object.freeze({ operation: "program-scene.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Apply requires approved: true and the unexpired token from the current exact preview."], gate });
    this.previewToken = null;
    let scene = null;
    let sceneCreated = false;
    const beforeForeignWorldScenes = foreignWorldSceneCount(this.runtime, this.packageData);
    try {
      scene = findOwnedScene(this.runtime, this.packageData);
      if (scene) {
        const existing = snapshot(scene, this.packageData);
        if (existing.complete) {
          const receipt = Object.freeze({ operation: "program-scene.apply", status: "PASS", evidenceClass: "fixture", noWrite: true, alreadyApplied: true, authoritativeReread: true, foreignStatePreserved: true, planSha256: this.packageData.plan.planSha256, assetAttestation: this.assetAttestation, readback: existing });
          this.lastOperationReceipt = receipt;
          return receipt;
        }
        return Object.freeze({ operation: "program-scene.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["The helper-owned fixture Scene is partial or drifted. No retry was attempted."], readback: existing });
      }

      scene = await this.runtime.Scene.create(scenePayload(this.packageData));
      sceneCreated = true;
      scene = await rereadScene(this.runtime, scene);
      if (!scene || typeof scene.createEmbeddedDocuments !== "function") throw new Error("Created Scene could not be authoritatively reread.");
      const beforeForeign = foreignCounts(scene, this.packageData);

      const walls = candidatesOf(this.packageData, "Wall");
      await scene.createEmbeddedDocuments("Wall", walls.map((candidate) => childPayload(this.packageData, candidate)));

      const level = initialLevel(scene);
      if (!level || typeof level.update !== "function") throw new Error("Foundry 14 initial Level is missing or ambiguous.");
      if (level.background?.src && level.background.src !== expectedRenderer(this.packageData)) throw new Error("Initial Level already has an unexpected renderer; refusing replacement.");
      const payload = levelPayload(this.packageData);
      await level.update({ ...payload, background: { ...(level.background?.toObject?.() ?? level.background ?? {}), ...payload.background } });
      scene = await rereadScene(this.runtime, scene);
      if (!scene || initialLevel(scene)?.background?.src !== expectedRenderer(this.packageData)) throw new Error("Initial-Level renderer reread failed before Tile/Region projection.");

      const tile = candidateOf(this.packageData, "Tile");
      await scene.createEmbeddedDocuments("Tile", [childPayload(this.packageData, tile)]);
      const regions = candidatesOf(this.packageData, "Region");
      await scene.createEmbeddedDocuments("Region", regions.map((candidate) => childPayload(this.packageData, candidate)));

      scene = await rereadScene(this.runtime, scene);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (!readback?.complete) throw new Error("Authoritative post-write Scene reread does not match the reviewed package.");
      const preserved = sameCounts(beforeForeign, foreignCounts(scene, this.packageData))
        && beforeForeignWorldScenes === foreignWorldSceneCount(this.runtime, this.packageData);
      if (!preserved) throw new Error("Foreign child counts changed during the bounded operation.");
      const receipt = Object.freeze({ operation: "program-scene.apply", status: "PASS", evidenceClass: "created_document", noWrite: false, sceneCreated, planSha256: this.packageData.plan.planSha256, assetSha256: this.packageData.assetDeployment.sourceSha256, assetAttestation: this.assetAttestation, authoritativeReread: true, foreignStatePreserved: true, foreignWorldScenesBefore: beforeForeignWorldScenes, foreignWorldScenesAfter: foreignWorldSceneCount(this.runtime, this.packageData), readback });
      this.lastOperationReceipt = receipt;
      return receipt;
    } catch (error) {
      const reread = scene ? await rereadScene(this.runtime, scene).catch(() => null) : null;
      const receipt = Object.freeze({ operation: "program-scene.apply", status: "UNKNOWN", evidenceClass: "unknown", noWrite: !sceneCreated, sceneCreated, error: String(error?.message ?? error), partialReadback: reread ? snapshot(reread, this.packageData) : null, authoritativeReread: Boolean(reread), recovery: "Do not retry. Review this authoritative partial reread and create an explicit recovery plan.", planSha256: this.packageData.plan.planSha256 });
      this.lastOperationReceipt = receipt;
      return receipt;
    }
  }

  async applyForRecoveryDrill(approval = {}) {
    const committed = await this.apply(approval);
    if (committed.status !== "PASS" || committed.noWrite !== false || committed.sceneCreated !== true) return committed;
    this.pendingUnknown = Object.freeze({ planSha256: committed.planSha256, foreignWorldScenesBefore: committed.foreignWorldScenesBefore });
    const receipt = Object.freeze({ operation: "program-scene.apply-recovery-drill", status: "UNKNOWN", evidenceClass: "unknown", noWrite: false, sceneCreated: true, planSha256: committed.planSha256, assetSha256: committed.assetSha256, assetAttestation: committed.assetAttestation, responseDisposition: "intentionally-discarded-after-commit", rereadRequired: true, retryAllowed: false, recovery: "Do not retry. Run the fixed authoritative reread recovery once." });
    this.lastOperationReceipt = receipt;
    return receipt;
  }

  previewUpdateWitness() {
    const gate = runtimeGate(this.runtime, this.packageData);
    if (!gate.pass) return Object.freeze({ operation: "program-scene.update-witness.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: gate.failed, gate });
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      const managed = scene?.flags?.[MODULE_ID];
      if (!readback?.complete || !managed || Object.hasOwn(managed, UPDATE_WITNESS_KEY) || typeof scene.update !== "function" || typeof scene.unsetFlag !== "function") return Object.freeze({ operation: "program-scene.update-witness.preview", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Update witness requires one complete owned Scene with an absent witness baseline and exact update/unsetFlag surfaces."], readback });
      const token = `${this.now().toString(36)}-update-witness-${this.packageData.plan.planSha256.slice(0, 12)}`;
      this.updateWitnessPreviewToken = { token, expiresAt: this.now() + PLAN_TTL_MS };
      return Object.freeze({ operation: "program-scene.update-witness.preview", status: "PASS", evidenceClass: "deterministic", noWrite: true, updateWitnessToken: token, planSha256: this.packageData.plan.planSha256, stableId: "dbx:scene:desktop-shell-fixture", baseline: "absent", authoritativeReread: true, foreignWorldScenesBefore: foreignWorldSceneCount(this.runtime, this.packageData), gate });
    } catch (error) { return Object.freeze({ operation: "program-scene.update-witness.preview", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), retryAllowed: false }); }
  }

  async rereadUpdateWitnessState() {
    const gate = runtimeGate(this.runtime, this.packageData);
    if (!gate.pass) return Object.freeze({ operation: "program-scene.update-witness.reread", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: gate.failed, gate, stage11Accepted: false, stage12Started: false, readyClaim: false });
    try {
      const selected = findOwnedScene(this.runtime, this.packageData);
      const scene = await rereadScene(this.runtime, selected);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (!scene || !readback?.complete) return Object.freeze({ operation: "program-scene.update-witness.reread", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, stableId: candidateOf(this.packageData, "Scene").stableId, readback, blockers: Object.freeze(["The exact helper-owned fixture Scene is absent, partial, or drifted; no update or retry was attempted."]), gate, stage11Accepted: false, stage12Started: false, readyClaim: false });
      const baseline = Object.hasOwn(scene.flags?.[MODULE_ID] ?? {}, UPDATE_WITNESS_KEY) ? "present" : "absent";
      return Object.freeze({ operation: "program-scene.update-witness.reread", status: "OBSERVED", evidenceClass: "fixture", noWrite: true, stableId: readback.scene.stableId, complete: true, counts: readback.counts, updateWitnessBaseline: baseline, foreignWorldScenes: foreignWorldSceneCount(this.runtime, this.packageData), authoritativeReread: true, noGenericQuery: true, noUpdateInvoked: true, retryPerformed: false, gate, stage11Accepted: false, stage12Started: false, readyClaim: false });
    } catch (error) {
      return Object.freeze({ operation: "program-scene.update-witness.reread", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), rereadRequired: true, retryPerformed: false, gate, stage11Accepted: false, stage12Started: false, readyClaim: false });
    }
  }

  async applyUpdateWitness({ approved = false, updateWitnessToken } = {}) {
    const preview = this.updateWitnessPreviewToken;
    if (!approved || updateWitnessToken !== preview?.token || preview.expiresAt <= this.now()) return Object.freeze({ operation: "program-scene.update-witness.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Update witness requires approved: true and the unexpired token from the exact current preview."] });
    this.updateWitnessPreviewToken = null;
    let scene = null;
    let witnessWritten = false;
    try {
      scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      if (!readback?.complete || Object.hasOwn(scene.flags?.[MODULE_ID] ?? {}, UPDATE_WITNESS_KEY) || typeof scene.update !== "function" || typeof scene.unsetFlag !== "function") return Object.freeze({ operation: "program-scene.update-witness.apply", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Update witness baseline or exact owned Scene surface drifted after preview."], readback });
      const beforeForeign = foreignWorldSceneCount(this.runtime, this.packageData);
      const witness = `m840:${this.packageData.plan.planSha256.slice(0, 16)}`;
      await scene.update({ flags: { [MODULE_ID]: { ...scene.flags[MODULE_ID], [UPDATE_WITNESS_KEY]: witness } } });
      witnessWritten = true;
      scene = await rereadScene(this.runtime, scene);
      if (!scene || scene.flags?.[MODULE_ID]?.[UPDATE_WITNESS_KEY] !== witness || !snapshot(scene, this.packageData)?.complete) throw new Error("Update witness authoritative reread failed.");
      await scene.unsetFlag(MODULE_ID, UPDATE_WITNESS_KEY);
      scene = await rereadScene(this.runtime, scene);
      const restored = scene && !Object.hasOwn(scene.flags?.[MODULE_ID] ?? {}, UPDATE_WITNESS_KEY) && snapshot(scene, this.packageData)?.complete;
      const foreignStatePreserved = beforeForeign === foreignWorldSceneCount(this.runtime, this.packageData);
      if (!restored || !foreignStatePreserved) throw new Error("Update witness restoration or foreign-state reread failed.");
      return Object.freeze({ operation: "program-scene.update-witness.apply", status: "PASS", evidenceClass: "fixture", noWrite: false, stableId: "dbx:scene:desktop-shell-fixture", managedField: `${MODULE_ID}.${UPDATE_WITNESS_KEY}`, witnessRedacted: true, updateInvoked: true, authoritativeReread: true, restorationReread: true, foreignStatePreserved: true, retryPerformed: false, stage11Accepted: false, stage12Started: false, readyClaim: false });
    } catch (error) { return Object.freeze({ operation: "program-scene.update-witness.apply", status: "UNKNOWN", evidenceClass: "unknown", noWrite: !witnessWritten, error: String(error?.message ?? error), authoritativeReread: Boolean(scene), retryAllowed: false, recovery: "Do not retry. Reread the exact owned Scene and preserve all foreign state." }); }
  }

  recoverUnknown({ planSha256 } = {}) {
    const gate = runtimeGate(this.runtime, this.packageData);
    if (!gate.pass) return Object.freeze({ operation: "program-scene.recover-unknown", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: gate.failed, gate });
    if (!this.pendingUnknown || planSha256 !== this.pendingUnknown.planSha256 || planSha256 !== this.packageData.plan.planSha256) return Object.freeze({ operation: "program-scene.recover-unknown", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: ["Recovery requires the exact pending UNKNOWN plan SHA-256 and never starts a new apply."] });
    try {
      const scene = findOwnedScene(this.runtime, this.packageData);
      const readback = scene ? snapshot(scene, this.packageData) : null;
      const foreignStatePreserved = this.pendingUnknown.foreignWorldScenesBefore === foreignWorldSceneCount(this.runtime, this.packageData);
      if (!readback?.complete || !foreignStatePreserved) return Object.freeze({ operation: "program-scene.recover-unknown", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, planSha256, authoritativeReread: true, retryAllowed: false, foreignStatePreserved, readback, blockers: ["Authoritative reread is incomplete or foreign-state counts changed; do not retry or clean up."] });
      this.pendingUnknown = null;
      const receipt = Object.freeze({ operation: "program-scene.recover-unknown", status: "PASS", evidenceClass: "fixture", noWrite: true, recoveredFromUnknown: true, planSha256, assetSha256: this.packageData.assetDeployment.sourceSha256, assetAttestation: this.assetAttestation, authoritativeReread: true, retryPerformed: false, foreignStatePreserved: true, readback });
      this.lastOperationReceipt = receipt;
      return receipt;
    } catch (error) {
      return Object.freeze({ operation: "program-scene.recover-unknown", status: "UNKNOWN", evidenceClass: "unknown", noWrite: true, error: String(error?.message ?? error), authoritativeReread: false, retryAllowed: false });
    }
  }
}

export async function loadProgramSceneVerticalSlicePackage(fetcher = globalThis.fetch) {
  if (typeof fetcher !== "function") throw new Error("Foundry fetch is unavailable.");
  const response = await fetcher(PACKAGE_PATH, { cache: "no-store" });
  if (!response?.ok) throw new Error("Program Scene package could not be loaded.");
  return validatePackage(await response.json());
}

export async function bootstrapProgramSceneVerticalSlice(runtime = globalThis) {
  if (!runtime.game || Object.prototype.hasOwnProperty.call(runtime.game, "diceboxProgramSceneVerticalSlice")) return false;
  try {
    const packageData = await loadProgramSceneVerticalSlicePackage(runtime.fetch ?? globalThis.fetch);
    const adapter = await ProgramSceneVerticalSliceAdapter.create({ runtime, packageData, fetcher: runtime.fetch ?? globalThis.fetch });
    Object.defineProperty(runtime.game, "diceboxProgramSceneVerticalSlice", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze({ status: () => adapter.status(), preview: () => adapter.preview(), apply: (approval) => adapter.apply(approval), applyRecoveryDrill: (approval) => adapter.applyForRecoveryDrill(approval), recoverUnknown: (recovery) => adapter.recoverUnknown(recovery), previewInverse: () => adapter.previewInverse(), applyInverse: (approval) => adapter.applyInverse(approval), previewUpdateWitness: () => adapter.previewUpdateWitness(), rereadUpdateWitnessState: () => adapter.rereadUpdateWitnessState(), applyUpdateWitness: (approval) => adapter.applyUpdateWitness(approval), lastReceipt: () => adapter.lastReceipt() }),
    });
    return true;
  } catch (error) {
    Object.defineProperty(runtime.game, "diceboxProgramSceneVerticalSlice", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze({ status: () => Object.freeze({ operation: "program-scene.status", status: "BLOCKED", evidenceClass: "blocked", noWrite: true, blockers: [String(error?.message ?? error)] }) }),
    });
    return false;
  }
}

function receiptHtml(runtime, receipt) {
  const escape = runtime.foundry?.utils?.escapeHTML ?? ((value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
  return `<pre style="white-space:pre-wrap;max-height:60vh;overflow:auto">${escape(JSON.stringify(receipt, null, 2))}</pre>`;
}

export async function openProgramSceneVerticalSliceControl(runtime = globalThis) {
  const api = runtime.game?.diceboxProgramSceneVerticalSlice;
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!api?.preview || !api?.applyRecoveryDrill || !api?.recoverUnknown || !DialogV2?.confirm || !DialogV2?.wait) throw new Error("Program Scene adapter or Foundry DialogV2 is unavailable.");
  const preview = api.preview();
  if (preview.status !== "PASS") {
    await DialogV2.wait({ window: { title: "DiceBox Program Scene Preview" }, content: receiptHtml(runtime, preview), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
    return preview;
  }
  const approved = await DialogV2.confirm({
    window: { title: "Apply DiceBox Program Scene Vertical Slice" },
    content: `${receiptHtml(runtime, preview)}<p>This creates exactly one helper-owned Scene in <strong>dbx-test-world</strong>: five Walls, one initial-Level renderer, one Tile, and two Regions. The served renderer hash is attested before creation. The fixture drill then discards the commit response and recovers only by authoritative reread. It never targets Ballad or deletes data.</p>`,
    yes: { label: "Apply and run recovery drill", icon: "fa-solid fa-check" },
    no: { label: "Cancel", icon: "fa-solid fa-xmark" },
  });
  if (!approved) return Object.freeze({ ...preview, status: "CANCELLED" });
  const unknown = await api.applyRecoveryDrill({ approved: true, planToken: preview.planToken });
  await DialogV2.wait({ window: { title: "DiceBox Program Scene Outcome-Unknown Receipt" }, content: receiptHtml(runtime, unknown), buttons: [{ action: "reread", label: "Run authoritative reread", icon: "fa-solid fa-rotate" }] });
  if (unknown.status !== "UNKNOWN") return unknown;
  const recovery = api.recoverUnknown({ planSha256: unknown.planSha256 });
  await DialogV2.wait({ window: { title: "DiceBox Program Scene Recovery Receipt" }, content: receiptHtml(runtime, recovery), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return recovery;
}

export async function openProgramSceneInverseControl(runtime = globalThis) {
  const api = runtime.game?.diceboxProgramSceneVerticalSlice;
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!api?.previewInverse || !api?.applyInverse || !DialogV2?.confirm || !DialogV2?.wait) throw new Error("Program Scene inverse adapter or Foundry DialogV2 is unavailable.");
  const preview = api.previewInverse();
  if (preview.status !== "PASS") {
    await DialogV2.wait({ window: { title: "DiceBox Program Scene Inverse Preview" }, content: receiptHtml(runtime, preview), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
    return preview;
  }
  const approved = await DialogV2.confirm({
    window: { title: "Reverse DiceBox Program Scene Vertical Slice" },
    content: `${receiptHtml(runtime, preview)}<p>This removes only the complete helper-owned DiceBox Program Scene from <strong>dbx-test-world</strong>. It first rereads ownership and then rereads owned-scene absence and foreign Scene counts. It never targets Ballad, accepts arbitrary document IDs, or retries an uncertain deletion.</p>`,
    yes: { label: "Reverse exact helper-owned Scene", icon: "fa-solid fa-rotate-left" },
    no: { label: "Cancel", icon: "fa-solid fa-xmark" },
  });
  if (!approved) return Object.freeze({ ...preview, status: "CANCELLED" });
  const outcome = await api.applyInverse({ approved: true, inverseToken: preview.inverseToken });
  await DialogV2.wait({ window: { title: "DiceBox Program Scene Inverse Receipt" }, content: receiptHtml(runtime, outcome), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return outcome;
}

export async function openProgramSceneUpdateWitnessControl(runtime = globalThis) {
  const api = runtime.game?.diceboxProgramSceneVerticalSlice;
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!api?.previewUpdateWitness || !api?.applyUpdateWitness || !DialogV2?.confirm || !DialogV2?.wait) throw new Error("Program Scene update-witness adapter or Foundry DialogV2 is unavailable.");
  const preview = api.previewUpdateWitness();
  if (preview.status !== "PASS") {
    await DialogV2.wait({ window: { title: "DiceBox Owned-Scene Update Witness Preview" }, content: receiptHtml(runtime, preview), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
    return preview;
  }
  const approved = await DialogV2.confirm({ window: { title: "Run DiceBox Owned-Scene Update Witness" }, content: `${receiptHtml(runtime, preview)}<p>This fixture-only control updates exactly one package-managed flag on the complete DiceBox-owned Scene, rereads it, restores the absent baseline, and rereads again. It never accepts arbitrary documents, fields, or payloads and never targets Ballad.</p>`, yes: { label: "Approve fixed update and restore", icon: "fa-solid fa-check" }, no: { label: "Cancel", icon: "fa-solid fa-xmark" } });
  if (!approved) return Object.freeze({ ...preview, status: "CANCELLED" });
  const outcome = await api.applyUpdateWitness({ approved: true, updateWitnessToken: preview.updateWitnessToken });
  await DialogV2.wait({ window: { title: "DiceBox Owned-Scene Update Witness Receipt" }, content: receiptHtml(runtime, outcome), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return outcome;
}

export async function openProgramSceneUpdateWitnessRereadControl(runtime = globalThis) {
  const api = runtime.game?.diceboxProgramSceneVerticalSlice;
  const DialogV2 = runtime.foundry?.applications?.api?.DialogV2;
  if (!api?.rereadUpdateWitnessState || !DialogV2?.wait) throw new Error("Program Scene update-witness reread adapter or Foundry DialogV2 is unavailable.");
  const receipt = await api.rereadUpdateWitnessState();
  await DialogV2.wait({ window: { title: "DiceBox Owned-Scene Witness Reread" }, content: receiptHtml(runtime, receipt), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
  return receipt;
}

export function registerProgramSceneVerticalSliceControl(runtime = globalThis) {
  if (typeof runtime.Hooks?.on !== "function") return false;
  runtime.Hooks.on("getSceneControlButtons", (controls) => {
    if (!runtime.game?.user?.isGM) return;
    const tools = controls?.tokens?.tools;
    if (!tools || typeof tools !== "object" || Array.isArray(tools)) return;
    if (!tools["dicebox-program-scene-slice"]) {
      tools["dicebox-program-scene-slice"] = {
        name: "dicebox-program-scene-slice",
        title: "Apply DiceBox Program Scene vertical slice",
        icon: "fa-solid fa-cubes-stacked",
        order: Object.keys(tools).length,
        button: true,
        visible: true,
        onChange: () => openProgramSceneVerticalSliceControl(runtime).catch((error) => runtime.ui?.notifications?.error?.(`DiceBox Program Scene blocked: ${error.message}`)),
      };
    }
    if (!tools["dicebox-program-scene-inverse"]) {
      tools["dicebox-program-scene-inverse"] = {
        name: "dicebox-program-scene-inverse",
        title: "Review and reverse DiceBox Program Scene vertical slice",
        icon: "fa-solid fa-rotate-left",
        order: Object.keys(tools).length,
        button: true,
        visible: true,
        onChange: () => openProgramSceneInverseControl(runtime).catch((error) => runtime.ui?.notifications?.error?.(`DiceBox Program Scene inverse blocked: ${error.message}`)),
      };
    }
    if (!tools["dicebox-program-scene-update-witness"]) {
      tools["dicebox-program-scene-update-witness"] = {
        name: "dicebox-program-scene-update-witness",
        title: "Run DiceBox owned-Scene update witness",
        icon: "fa-solid fa-pen-to-square",
        order: Object.keys(tools).length,
        button: true,
        visible: true,
        onChange: () => openProgramSceneUpdateWitnessControl(runtime).catch((error) => runtime.ui?.notifications?.error?.(`DiceBox update witness blocked: ${error.message}`)),
      };
    }
    if (!tools["dicebox-program-scene-update-witness-reread"]) {
      tools["dicebox-program-scene-update-witness-reread"] = {
        name: "dicebox-program-scene-update-witness-reread",
        title: "Show DiceBox owned-Scene witness reread",
        icon: "fa-solid fa-magnifying-glass",
        order: Object.keys(tools).length,
        button: true,
        visible: true,
        onChange: () => openProgramSceneUpdateWitnessRereadControl(runtime).catch((error) => runtime.ui?.notifications?.error?.(`DiceBox update-witness reread blocked: ${error.message}`)),
      };
    }
  });
  return true;
}

if (typeof globalThis.Hooks?.once === "function") {
  globalThis.Hooks.once("init", () => registerProgramSceneVerticalSliceControl(globalThis));
  globalThis.Hooks.once("ready", () => void bootstrapProgramSceneVerticalSlice(globalThis));
}

export { PACKAGE_ID, PACKAGE_PATH, TILE_MARKER_PATH, attestDeployedAsset, validatePackage };
