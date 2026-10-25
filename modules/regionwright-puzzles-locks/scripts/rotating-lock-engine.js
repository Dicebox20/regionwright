export const ROTATING_LOCK_VERSION = 1;
export const LOCK_PHASES = Object.freeze({
  IDLE: "idle", PROBING: "probing", BLOCKED: "blocked", OPENING: "opening",
  OPENED: "opened", PICK_BROKEN: "pickBroken", JAMMED: "jammed", ABORTED: "aborted"
});

export const DIFFICULTY_PROFILES = Object.freeze([
  Object.freeze({ label: "Trivial", totalSuccessWidth: 46, probeRadius: 78, stressRate: 0.45, resistanceCurve: 1.10 }),
  Object.freeze({ label: "Simple", totalSuccessWidth: 32, probeRadius: 68, stressRate: 0.60, resistanceCurve: 1.20 }),
  Object.freeze({ label: "Standard", totalSuccessWidth: 22, probeRadius: 58, stressRate: 0.80, resistanceCurve: 1.35 }),
  Object.freeze({ label: "Difficult", totalSuccessWidth: 14, probeRadius: 48, stressRate: 1.05, resistanceCurve: 1.50 }),
  Object.freeze({ label: "Masterwork", totalSuccessWidth: 8, probeRadius: 39, stressRate: 1.35, resistanceCurve: 1.70 }),
  Object.freeze({ label: "Legendary", totalSuccessWidth: 5, probeRadius: 32, stressRate: 1.70, resistanceCurve: 1.90 })
]);

export const ENGINE_DEFAULTS = Object.freeze({
  openingSpeed: 1.65,
  returnSpeed: 2.25,
  minimumVisibleMovement: 0.025,
  successThreshold: 0.98,
  successDwell: 0.08,
  contactThreshold: 0.08,
  pickMovementTorqueLockout: 0.12,
  maxDeltaSeconds: 0.05
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (from, to, amount) => from + ((to - from) * amount);

export function normalizeTier(value) {
  return clamp(Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 2, 0, DIFFICULTY_PROFILES.length - 1);
}

export function effectiveTier(baseTier, proficiencyRank = 0) {
  return Math.max(0, normalizeTier(baseTier) - clamp(Math.trunc(Number(proficiencyRank) || 0), 0, 2));
}

export function profileForTier(tier) {
  return DIFFICULTY_PROFILES[normalizeTier(tier)];
}

export function clampPickAngle(angle) {
  return clamp(Number(angle) || 0, -90, 90);
}

export function angularError(pickAngle, targetAngle) {
  return Math.abs(clampPickAngle(pickAngle) - clampPickAngle(targetAngle));
}

export function proximityForAngle(pickAngle, targetAngle, profile) {
  const error = angularError(pickAngle, targetAngle);
  const halfWidth = profile.totalSuccessWidth / 2;
  if (error <= halfWidth) return 1;
  if (error >= profile.probeRadius) return 0;
  const distance = (error - halfWidth) / Math.max(0.001, profile.probeRadius - halfWidth);
  return Math.pow(1 - distance, profile.resistanceCurve);
}

export function maximumCylinderProgress(pickAngle, targetAngle, profile) {
  const proximity = proximityForAngle(pickAngle, targetAngle, profile);
  return proximity === 1 ? 1 : ENGINE_DEFAULTS.minimumVisibleMovement + (proximity * (1 - ENGINE_DEFAULTS.minimumVisibleMovement));
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededTarget(seed, tier) {
  const profile = profileForTier(tier);
  const halfWidth = profile.totalSuccessWidth / 2;
  const min = -90 + halfWidth;
  const max = 90 - halfWidth;
  const fraction = (hashSeed(seed) || 1) / 4294967296;
  return Number((min + ((max - min) * fraction)).toFixed(2));
}

export function createRuntimeState({ baseTier = 2, effectiveLockTier = baseTier, targetAngle = 0, durability = 1 } = {}) {
  const tier = normalizeTier(effectiveLockTier);
  return {
    version: ROTATING_LOCK_VERSION,
    phase: LOCK_PHASES.IDLE,
    baseTier: normalizeTier(baseTier),
    effectiveTier: tier,
    pickAngle: 0,
    targetAngle: clampPickAngle(targetAngle),
    cylinderProgress: 0,
    torqueInput: 0,
    pickDurability: clamp(Number(durability) || 1, 0, 1),
    openingDwell: 0,
    brokenPickCount: 0,
    lastEvent: null
  };
}

export function setPickAngle(state, angle) {
  if (state.torqueInput >= ENGINE_DEFAULTS.pickMovementTorqueLockout || [LOCK_PHASES.OPENED, LOCK_PHASES.PICK_BROKEN].includes(state.phase)) return state;
  state.pickAngle = clampPickAngle(angle);
  if (state.phase === LOCK_PHASES.IDLE) state.phase = LOCK_PHASES.PROBING;
  return state;
}

export function setTorque(state, value) {
  if ([LOCK_PHASES.OPENED, LOCK_PHASES.PICK_BROKEN, LOCK_PHASES.JAMMED, LOCK_PHASES.ABORTED].includes(state.phase)) return state;
  state.torqueInput = clamp(Number(value) || 0, 0, 1);
  if (!state.torqueInput && state.phase !== LOCK_PHASES.OPENED) state.phase = LOCK_PHASES.IDLE;
  return state;
}

export function replaceBrokenPick(state) {
  if (state.phase !== LOCK_PHASES.PICK_BROKEN) return state;
  state.phase = LOCK_PHASES.IDLE;
  state.pickDurability = 1;
  state.torqueInput = 0;
  state.cylinderProgress = 0;
  state.openingDwell = 0;
  state.lastEvent = null;
  return state;
}

export function advanceLock(state, rawDeltaSeconds) {
  if (!state || typeof state !== "object") throw new Error("A rotating lock runtime state is required.");
  const delta = clamp(Number(rawDeltaSeconds) || 0, 0, ENGINE_DEFAULTS.maxDeltaSeconds);
  if (!delta || [LOCK_PHASES.OPENED, LOCK_PHASES.PICK_BROKEN, LOCK_PHASES.JAMMED, LOCK_PHASES.ABORTED].includes(state.phase)) return state;
  const profile = profileForTier(state.effectiveTier);
  const error = angularError(state.pickAngle, state.targetAngle);
  const halfWidth = profile.totalSuccessWidth / 2;
  const maxProgress = maximumCylinderProgress(state.pickAngle, state.targetAngle, profile);
  const desired = state.torqueInput;
  const allowed = Math.min(desired, maxProgress);
  state.lastEvent = null;

  if (state.torqueInput >= ENGINE_DEFAULTS.contactThreshold) {
    state.cylinderProgress = Math.min(allowed, state.cylinderProgress + (ENGINE_DEFAULTS.openingSpeed * delta));
    state.phase = state.cylinderProgress + 0.0001 >= allowed && maxProgress < 1 ? LOCK_PHASES.BLOCKED : LOCK_PHASES.OPENING;
  } else {
    state.cylinderProgress = Math.max(0, state.cylinderProgress - (ENGINE_DEFAULTS.returnSpeed * delta));
    state.openingDwell = 0;
    state.phase = state.cylinderProgress > 0 ? LOCK_PHASES.PROBING : LOCK_PHASES.IDLE;
    return state;
  }

  const blocked = state.cylinderProgress + 0.0001 >= allowed && maxProgress < 1;
  if (blocked) {
    const blockedAmount = clamp((desired - maxProgress) / Math.max(0.001, 1 - maxProgress), 0, 1);
    const severity = clamp((error - halfWidth) / Math.max(0.001, profile.probeRadius - halfWidth), 0, 1);
    const loss = profile.stressRate * Math.pow(state.torqueInput, 1.5) * mix(0.45, 1, blockedAmount) * mix(0.55, 1, severity) * delta;
    state.pickDurability = clamp(state.pickDurability - loss, 0, 1);
    if (state.pickDurability <= 0) {
      state.torqueInput = 0;
      state.phase = LOCK_PHASES.PICK_BROKEN;
      state.brokenPickCount += 1;
      state.lastEvent = "pickBroken";
      return state;
    }
  }

  if (state.cylinderProgress >= ENGINE_DEFAULTS.successThreshold && error <= halfWidth) {
    state.openingDwell += delta;
    if (state.openingDwell >= ENGINE_DEFAULTS.successDwell) {
      state.phase = LOCK_PHASES.OPENED;
      state.cylinderProgress = 1;
      state.torqueInput = 0;
      state.lastEvent = "opened";
    }
  } else state.openingDwell = 0;
  return state;
}

export function presentationForState(state) {
  const profile = profileForTier(state.effectiveTier);
  const error = angularError(state.pickAngle, state.targetAngle);
  const maximum = maximumCylinderProgress(state.pickAngle, state.targetAngle, profile);
  return Object.freeze({
    error,
    maximumCylinderProgress: maximum,
    resistance: 1 - maximum,
    inSweetSpot: error <= profile.totalSuccessWidth / 2,
    isBlocked: state.phase === LOCK_PHASES.BLOCKED
  });
}
