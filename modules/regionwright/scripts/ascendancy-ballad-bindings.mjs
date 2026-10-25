const TARGET = Object.freeze({
  worldId: "the-ballad-of-chauser-bill",
  foundryVersion: "14.367",
  systemId: "dnd5e",
  systemVersion: "5.3.3",
});

export const BALLAD_BINDINGS_SOURCE = Object.freeze({
  path: "C:\\Users\\rujie\\Documents\\Codex\\2026-08-20\\dicebox-campaign-helper\\docs\\BALLAD-ASCENDANCY-REGION-BINDINGS-2026-08-22.md",
  sourceId: "SRC-M157-BALLAD-ASCENDANCY-REGION-BINDINGS",
  sha256: "3525C1DF348AD01168F804D376F9A817A2FCB74BEB5E26C95414187D96DA4B2B",
});

export const BALLAD_TELEPORT_CONFIRMATION = "Do you wish to proceed?";
export const BALLAD_UNBOUND_REGION_ID = "dbx:region:core-entry-west";

export const BALLAD_PUZZLE_CONTROLLER_AUTHORIZATION = Object.freeze({
  "dbx:puzzle:dalton-tram-repair": Object.freeze(["dbx:actor:dalton", "dbx:actor:andrew-mcconaughey"]),
  "dbx:puzzle:andrew-tram-routing": Object.freeze(["dbx:actor:andrew-mcconaughey"]),
});

const binding = (stableId, sceneId, regionUuid) => Object.freeze({ stableId, sceneId, regionUuid });

export const BALLAD_REGION_BINDINGS = Object.freeze([
  binding("dbx:region:signal-aleister-frequency", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.GJyUUBwlV0Knetw1"),
  binding("dbx:region:signal-sprocket-circuit", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.CrqjKpSGnr95sw3Q"),
  binding("dbx:region:signal-cooperative-left", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.coSluDpWkeak5np1"),
  binding("dbx:region:signal-cooperative-right", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.kjxyKFCd60ZWCr9I"),
  binding("dbx:region:signal-entry", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.31ALlkCZeThJG9it"),
  binding("dbx:region:signal-exit", "Scene.spVI07qS6NwPAKkn", "Scene.spVI07qS6NwPAKkn.Region.fywKUn5bavEGJfCT"),
  binding("dbx:region:rune-lawson-memory", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.KVEF3yLlvPQF1Z0k"),
  binding("dbx:region:rune-tactal-slotting", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.NKS9md0FksiX9id7"),
  binding("dbx:region:rune-order-left", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.cHwRROISJFJuhI2S"),
  binding("dbx:region:rune-order-right", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.djXZqAwG95vAMVIJ"),
  binding("dbx:region:rune-entry", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.LZDX4PyFfUUTFgBv"),
  binding("dbx:region:rune-exit", "Scene.Pu025lbCjgkxrUJj", "Scene.Pu025lbCjgkxrUJj.Region.dLUj203sYWZKOqX7"),
  binding("dbx:region:core-aleister-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.E1inBLaGExfbXJlH"),
  binding("dbx:region:core-sprocket-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.L9RGK4PVWFxviFKI"),
  binding("dbx:region:core-dalton-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.1hodVystymrGfXiE"),
  binding("dbx:region:core-andrew-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.IQk4ZC1kkZuU7jZz"),
  binding("dbx:region:core-lawson-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.DlEfXcy8BZrvEn92"),
  binding("dbx:region:core-tactal-station", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.ERo6ClVR9WKCKw1q"),
  binding("dbx:region:core-security-room", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.BkHBgMSkkhxJF69J"),
  binding("dbx:region:core-entry", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.XhgdHv0pBzWriD2y"),
  binding("dbx:region:core-exit", "Scene.Vk6IMQh7jTxmKBtH", "Scene.Vk6IMQh7jTxmKBtH.Region.CQWuglCQvBfrQe6L"),
]);

export const BALLAD_TELEPORTS = Object.freeze([
  Object.freeze({ teleportId: "dbx:teleport:signal-to-core", fromRegionId: "dbx:region:signal-exit", toRegionId: "dbx:region:core-entry", mode: "cross-scene" }),
  Object.freeze({ teleportId: "dbx:teleport:rune-to-core", fromRegionId: "dbx:region:rune-exit", toRegionId: "dbx:region:core-entry", mode: "cross-scene" }),
  Object.freeze({ teleportId: "dbx:teleport:core-to-signal", fromRegionId: "dbx:region:core-exit", toRegionId: "dbx:region:signal-entry", mode: "cross-scene" }),
  Object.freeze({ teleportId: "dbx:teleport:core-to-rune", fromRegionId: "dbx:region:core-exit", toRegionId: "dbx:region:rune-entry", mode: "cross-scene" }),
  Object.freeze({ teleportId: "dbx:teleport:tram-to-core", fromRegionId: "dbx:region:tram-exit", toRegionId: BALLAD_UNBOUND_REGION_ID, mode: "cross-scene" }),
]);

const bindingById = () => new Map(BALLAD_REGION_BINDINGS.map(entry => [entry.stableId, entry]));

export function validateBalladTargetGate(target = {}) {
  const observed = { ...TARGET, ...target };
  const blockers = [];
  if (observed.worldId !== TARGET.worldId) blockers.push(`Target world must be ${TARGET.worldId}.`);
  if (observed.foundryVersion !== TARGET.foundryVersion) blockers.push(`Foundry ${TARGET.foundryVersion} is required.`);
  if (observed.systemId !== TARGET.systemId || observed.systemVersion !== TARGET.systemVersion) blockers.push(`dnd5e ${TARGET.systemVersion} is required.`);
  if (observed.activeGm !== true) blockers.push("An elected active GM is required.");
  return Object.freeze({ pass: blockers.length === 0, target: Object.freeze(observed), blockers: Object.freeze(blockers) });
}

function assertKnownBinding(stableId, bindings) {
  const entry = bindings.get(stableId);
  if (!entry) throw new Error(`No manual Ballad Region binding exists for ${stableId}.`);
  return entry;
}

export function createBalladTeleportPlan(teleports = BALLAD_TELEPORTS) {
  const bindings = bindingById();
  const planned = [];
  const blocked = [];
  for (const teleport of teleports) {
    const source = bindings.get(teleport.fromRegionId);
    const destination = bindings.get(teleport.toRegionId);
    if (!source || !destination) {
      blocked.push(Object.freeze({ ...teleport, issue: teleport.toRegionId === BALLAD_UNBOUND_REGION_ID ? "unbound-core-entry-west" : "missing-manual-region-binding" }));
      continue;
    }
    planned.push(Object.freeze({
      ...teleport,
      sourceRegionUuid: source.regionUuid,
      destinationRegionUuid: destination.regionUuid,
      behavior: "native-teleport-after-confirmation",
      confirmation: Object.freeze({ required: true, text: BALLAD_TELEPORT_CONFIRMATION, cancel: "leave-token-in-place" }),
      nativeMovement: Object.freeze({ deferredUntilConfirmation: true, automatic: false }),
      activeGmRequired: true,
    }));
  }
  return Object.freeze({ planned: Object.freeze(planned), blocked: Object.freeze(blocked) });
}

export function createBalladAscendancyBindingPlan({ target = {}, behaviorBindings = [], teleports = BALLAD_TELEPORTS } = {}) {
  const gate = validateBalladTargetGate(target);
  const bindings = bindingById();
  const teleportPlan = createBalladTeleportPlan(teleports);
  const actions = behaviorBindings.map(entry => {
    const targetBinding = assertKnownBinding(entry.regionId, bindings);
    return Object.freeze({
      type: "regionwright-owned-behavior-upsert",
      stableRegionId: entry.regionId,
      regionUuid: targetBinding.regionUuid,
      sceneId: targetBinding.sceneId,
      behavior: entry.behavior,
      preserveForeignBehaviors: true,
      preserveUnknownFlags: true,
    });
  });
  const blockers = [...gate.blockers];
  if (teleportPlan.blocked.length) blockers.push("One or more teleports lack an exact manual Region UUID binding.");
  return Object.freeze({
    operation: "ascendancy.ballad.regionwright.preview",
    status: blockers.length ? "BLOCKED" : "PREVIEW",
    noWrite: true,
    target: gate.target,
    source: BALLAD_BINDINGS_SOURCE,
    mappingCoverage: Object.freeze({ expectedBoundRegions: BALLAD_REGION_BINDINGS.length, boundRegions: BALLAD_REGION_BINDINGS.length, explicitlyUnboundRegions: [BALLAD_UNBOUND_REGION_ID] }),
    actions: Object.freeze(actions),
    teleports: teleportPlan.planned,
    blockedTeleports: teleportPlan.blocked,
    controllerAuthorization: BALLAD_PUZZLE_CONTROLLER_AUTHORIZATION,
    blockers: Object.freeze(blockers),
    geometryMutation: false,
    scenesCreated: 0,
    wallsCreated: 0,
    regionsCreated: 0,
    macrosCreated: 0,
    preserveForeignBehaviors: true,
    preserveUnknownFlags: true,
    authoritativeRereadRequired: true,
  });
}

export function isBalladPuzzleControllerAuthorized(puzzleId, actorId) {
  return BALLAD_PUZZLE_CONTROLLER_AUTHORIZATION[puzzleId]?.includes(actorId) === true;
}

export function validateBalladBindingReadback(observedBindings) {
  const expected = new Map(BALLAD_REGION_BINDINGS.map(entry => [entry.stableId, entry.regionUuid]));
  const observed = new Map(observedBindings.map(entry => [entry.stableId, entry.regionUuid]));
  const errors = [];
  for (const [stableId, regionUuid] of expected) if (observed.get(stableId) !== regionUuid) errors.push({ stableId, expected: regionUuid, observed: observed.get(stableId) ?? null });
  for (const stableId of observed.keys()) if (!expected.has(stableId)) errors.push({ stableId, issue: "unexpected-binding" });
  return Object.freeze({ pass: errors.length === 0, errors: Object.freeze(errors), authoritativeReread: true });
}

export async function executeBalladTeleportAfterConfirmation({ confirm, nativeMove }) {
  if (typeof confirm !== "function" || typeof nativeMove !== "function") throw new TypeError("A confirmation function and deferred native movement function are required.");
  const confirmed = await confirm(BALLAD_TELEPORT_CONFIRMATION);
  if (confirmed !== true) return Object.freeze({ status: "CANCELLED", moved: false, confirmationText: BALLAD_TELEPORT_CONFIRMATION });
  await nativeMove();
  return Object.freeze({ status: "MOVED", moved: true, confirmationText: BALLAD_TELEPORT_CONFIRMATION });
}

export const balladAscendancyBindings = Object.freeze({
  target: TARGET,
  source: BALLAD_BINDINGS_SOURCE,
  regions: BALLAD_REGION_BINDINGS,
  teleports: BALLAD_TELEPORTS,
  controllerAuthorization: BALLAD_PUZZLE_CONTROLLER_AUTHORIZATION,
  unboundRegionIds: Object.freeze([BALLAD_UNBOUND_REGION_ID]),
});
