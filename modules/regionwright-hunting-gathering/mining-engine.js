export const MODULE_ID = "regionwright-hunting-gathering";
export const LEGACY_MODULE_ID = "regionwright-mining";
export const MINING_REGION_FLAG = "miningDeposit";
export const MINING_ORE_FLAG = "ore";
export const MINING_PICKAXE_FLAG = "pickaxe";
export const MINING_SOCKET = `module.${MODULE_ID}`;
export const DEFAULT_MAX_ATTEMPTS = 5;

// Legacy Athletics resolver retained for public-API compatibility. The default
// gameplay resolver is the three-strike timing puzzle below.
export const YIELD_BANDS = Object.freeze([
  Object.freeze({ min: 30, yield: 5 }),
  Object.freeze({ min: 25, yield: 4 }),
  Object.freeze({ min: 20, yield: 3 }),
  Object.freeze({ min: 15, yield: 2 }),
  Object.freeze({ min: 10, yield: 1 }),
  Object.freeze({ min: -Infinity, yield: 0 })
]);

export function yieldForAthletics(total) {
  const value = Number(total);
  if (!Number.isFinite(value)) return 0;
  return YIELD_BANDS.find(band => value >= band.min)?.yield ?? 0;
}

export const MINING_DIFFICULTY_PROFILES = Object.freeze({
  common: Object.freeze([1500, 1350, 1200]),
  uncommon: Object.freeze([1400, 1250, 1100]),
  rare: Object.freeze([1300, 1150, 1000]),
  "very-rare": Object.freeze([1100, 950, 800]),
  exceptional: Object.freeze([950, 800, 675]),
  legendary: Object.freeze([825, 700, 600]),
  "legendary-plus": Object.freeze([750, 625, 525])
});
export const TIMING_STAGE_CYCLES_MS = MINING_DIFFICULTY_PROFILES.common;
export function timingCyclesForDifficulty(value) {
  const key = String(value ?? "common").trim().toLowerCase().replaceAll(" ", "-");
  return MINING_DIFFICULTY_PROFILES[key] ?? MINING_DIFFICULTY_PROFILES.common;
}
export const TIMING_RING_BASE_DIAMETER_PX = 250;
export const TIMING_RING_MIN_SCALE = 0.08;
export const TIMING_RING_SCALE_RANGE = 1 - TIMING_RING_MIN_SCALE;
export const TIMING_CENTER_ACCELERATION = 0.30;

export function accelerateTimingRatio(rawRatio, strength = TIMING_CENTER_ACCELERATION) {
  const value = Number(rawRatio);
  const ratio = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
  const amountValue = Number(strength);
  const amount = Number.isFinite(amountValue) ? Math.max(0, Math.min(0.95, amountValue)) : TIMING_CENTER_ACCELERATION;
  return Math.max(0, Math.min(1, ratio + (amount * ratio * (1 - ratio))));
}
const scoreBands = thresholds => Object.freeze([
  Object.freeze({ maxDiameterPx: thresholds[0], score: 5, label: "Perfect" }),
  Object.freeze({ maxDiameterPx: thresholds[1], score: 4, label: "Excellent" }),
  Object.freeze({ maxDiameterPx: thresholds[2], score: 3, label: "Great" }),
  Object.freeze({ maxDiameterPx: thresholds[3], score: 2, label: "Good" }),
  Object.freeze({ maxDiameterPx: thresholds[4], score: 1, label: "Glancing" }),
  Object.freeze({ maxDiameterPx: Infinity, score: 0, label: "Miss" })
]);
export const TIMING_SCORE_PROFILES = Object.freeze({
  common: scoreBands([26, 62, 103, 149, 200]),
  uncommon: scoreBands([26, 62, 103, 149, 200]),
  rare: scoreBands([25, 56, 92, 132, 175]),
  "very-rare": scoreBands([24, 52, 84, 120, 160]),
  exceptional: scoreBands([23, 48, 76, 108, 145]),
  legendary: scoreBands([22, 44, 70, 98, 132]),
  "legendary-plus": scoreBands([22, 40, 64, 90, 120])
});
export const TIMING_SCORE_BANDS = TIMING_SCORE_PROFILES.common;
export function timingScoreBandsForDifficulty(value) {
  const key = String(value ?? "common").trim().toLowerCase().replaceAll(" ", "-");
  return TIMING_SCORE_PROFILES[key] ?? TIMING_SCORE_PROFILES.common;
}

export function timingRingDiameterForRatio(ratio) {
  const value = Number(ratio);
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
  const scale = TIMING_RING_MIN_SCALE + (normalized * TIMING_RING_SCALE_RANGE);
  return TIMING_RING_BASE_DIAMETER_PX * scale;
}

export function scoreTimingDiameter(diameterPx, difficulty = "common") {
  const value = Number(diameterPx);
  if (!Number.isFinite(value)) return 0;
  const diameter = Math.max(0, value);
  return timingScoreBandsForDifficulty(difficulty).find(band => diameter <= band.maxDiameterPx)?.score ?? 0;
}

// Compatibility helper: callers may still submit the normalized pulse ratio,
// but scoring is derived from the rendered ring diameter and may be tightened by difficulty.
export function scoreTimingRatio(ratio, difficulty = "common") {
  return scoreTimingDiameter(timingRingDiameterForRatio(ratio), difficulty);
}

export function timingLabelForScore(score) {
  const value = Math.max(0, Math.min(5, Math.trunc(Number(score) || 0)));
  return TIMING_SCORE_BANDS.find(band => band.score === value)?.label ?? "Miss";
}

export function normalizeTimingScores(scores) {
  if (!Array.isArray(scores) || scores.length !== TIMING_STAGE_CYCLES_MS.length) return null;
  const normalized = scores.map(value => Number(value));
  if (normalized.some(value => !Number.isInteger(value) || value < 0 || value > 5)) return null;
  return Object.freeze(normalized);
}

export function yieldForTimingScores(scores) {
  const normalized = normalizeTimingScores(scores);
  if (!normalized) return 0;
  const average = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return Math.max(0, Math.min(5, Math.round(average)));
}

export function normalizeAttempts(value, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const max = Math.max(1, Math.trunc(Number(maxAttempts) || DEFAULT_MAX_ATTEMPTS));
  return Math.max(0, Math.min(max, Math.trunc(Number(value) || 0)));
}

export function createMiningDepositConfig({ oreId, maxAttempts = DEFAULT_MAX_ATTEMPTS, attemptsUsed = 0 } = {}) {
  if (!oreId) throw new Error("A mining deposit requires an oreId.");
  const max = Math.max(1, Math.trunc(Number(maxAttempts) || DEFAULT_MAX_ATTEMPTS));
  const used = normalizeAttempts(attemptsUsed, max);
  return Object.freeze({
    version: 1,
    oreId: String(oreId),
    maxAttempts: max,
    attemptsUsed: used,
    depleted: used >= max
  });
}

export function normalizeMiningDepositConfig(raw) {
  if (!raw || typeof raw !== "object" || !raw.oreId) return null;
  return createMiningDepositConfig(raw);
}
