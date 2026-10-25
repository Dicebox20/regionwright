import assert from "node:assert/strict";
import {
  DEFAULT_MAX_ATTEMPTS,
  MINING_DIFFICULTY_PROFILES,
  TIMING_STAGE_CYCLES_MS,
  TIMING_RING_BASE_DIAMETER_PX,
  TIMING_CENTER_ACCELERATION,
  TIMING_RING_MIN_SCALE,
  TIMING_SCORE_PROFILES,
  accelerateTimingRatio,
  createMiningDepositConfig,
  normalizeMiningDepositConfig,
  normalizeTimingScores,
  scoreTimingDiameter,
  scoreTimingRatio,
  timingCyclesForDifficulty,
  timingLabelForScore,
  timingRingDiameterForRatio,
  timingScoreBandsForDifficulty,
  yieldForAthletics,
  yieldForTimingScores
} from "../modules/regionwright-hunting-gathering/mining-engine.js";

// Legacy API remains stable.
assert.equal(yieldForAthletics(1), 0);
assert.equal(yieldForAthletics(9), 0);
assert.equal(yieldForAthletics(10), 1);
assert.equal(yieldForAthletics(14), 1);
assert.equal(yieldForAthletics(15), 2);
assert.equal(yieldForAthletics(19), 2);
assert.equal(yieldForAthletics(20), 3);
assert.equal(yieldForAthletics(24), 3);
assert.equal(yieldForAthletics(25), 4);
assert.equal(yieldForAthletics(29), 4);
assert.equal(yieldForAthletics(30), 5);
assert.equal(yieldForAthletics(99), 5);
assert.equal(yieldForAthletics("bad"), 0);

assert.deepEqual(TIMING_STAGE_CYCLES_MS, [1500, 1350, 1200]);
assert.deepEqual(timingCyclesForDifficulty("common"), [1500, 1350, 1200]);
assert.deepEqual(timingCyclesForDifficulty("uncommon"), [1400, 1250, 1100]);
assert.deepEqual(timingCyclesForDifficulty("rare"), [1300, 1150, 1000]);
assert.deepEqual(timingCyclesForDifficulty("very rare"), [1100, 950, 800]);
assert.deepEqual(timingCyclesForDifficulty("exceptional"), [950, 800, 675]);
assert.deepEqual(timingCyclesForDifficulty("legendary"), [825, 700, 600]);
assert.deepEqual(timingCyclesForDifficulty("legendary-plus"), [750, 625, 525]);
assert.equal(Object.keys(MINING_DIFFICULTY_PROFILES).length, 7);
assert.equal(TIMING_RING_BASE_DIAMETER_PX, 250);
assert.equal(TIMING_RING_MIN_SCALE, 0.08);
assert.equal(TIMING_CENTER_ACCELERATION, 0.30);
assert.equal(accelerateTimingRatio(0), 0);
assert.equal(accelerateTimingRatio(1), 1);
assert.equal(Number(accelerateTimingRatio(0.5).toFixed(4)), 0.575);
assert.equal(Number(accelerateTimingRatio(0.25).toFixed(4)), 0.3063);
assert.equal(Number(accelerateTimingRatio(0.75).toFixed(4)), 0.8063);
assert.equal(accelerateTimingRatio(Number.NaN), 1);
assert.ok((accelerateTimingRatio(0.01) - accelerateTimingRatio(0)) / 0.01 > 1.25);
assert.ok((accelerateTimingRatio(1) - accelerateTimingRatio(0.99)) / 0.01 < 0.75);
assert.equal(timingRingDiameterForRatio(0), 20);
assert.equal(timingRingDiameterForRatio(1), 250);
assert.equal(timingRingDiameterForRatio(Number.NaN), 250);
assert.equal(Number(timingRingDiameterForRatio(0.025).toFixed(2)), 25.75);
assert.equal(scoreTimingDiameter(20), 5);
assert.equal(scoreTimingDiameter(26), 5);
assert.equal(scoreTimingDiameter(26.01), 4);
assert.equal(scoreTimingDiameter(62), 4);
assert.equal(scoreTimingDiameter(62.01), 3);
assert.equal(scoreTimingDiameter(103), 3);
assert.equal(scoreTimingDiameter(103.01), 2);
assert.equal(scoreTimingDiameter(149), 2);
assert.equal(scoreTimingDiameter(149.01), 1);
assert.equal(scoreTimingDiameter(200), 1);
assert.equal(scoreTimingDiameter(200.01), 0);
assert.equal(scoreTimingDiameter(Number.NaN), 0);
assert.equal(scoreTimingRatio(0), 5);
assert.equal(scoreTimingRatio(0.5), 2);
assert.equal(scoreTimingRatio(1), 0);
assert.equal(scoreTimingRatio(Number.NaN), 0);
assert.deepEqual(timingScoreBandsForDifficulty("rare").slice(0, 5).map(band => band.maxDiameterPx), [25, 56, 92, 132, 175]);
assert.deepEqual(timingScoreBandsForDifficulty("very rare").slice(0, 5).map(band => band.maxDiameterPx), [24, 52, 84, 120, 160]);
assert.deepEqual(timingScoreBandsForDifficulty("exceptional").slice(0, 5).map(band => band.maxDiameterPx), [23, 48, 76, 108, 145]);
assert.deepEqual(timingScoreBandsForDifficulty("legendary").slice(0, 5).map(band => band.maxDiameterPx), [22, 44, 70, 98, 132]);
assert.deepEqual(timingScoreBandsForDifficulty("legendary-plus").slice(0, 5).map(band => band.maxDiameterPx), [22, 40, 64, 90, 120]);
assert.equal(Object.keys(TIMING_SCORE_PROFILES).length, 7);
assert.equal(scoreTimingDiameter(176, "rare"), 0);
assert.equal(scoreTimingDiameter(175, "rare"), 1);
assert.equal(scoreTimingDiameter(121, "legendary-plus"), 0);
assert.equal(scoreTimingDiameter(120, "legendary-plus"), 1);
assert.equal(scoreTimingDiameter(41, "legendary-plus"), 3);
assert.equal(scoreTimingDiameter(40, "legendary-plus"), 4);
assert.equal(scoreTimingDiameter(22, "legendary-plus"), 5);
assert.equal(scoreTimingDiameter(23, "legendary-plus"), 4);
assert.equal(timingLabelForScore(5), "Perfect");
assert.equal(timingLabelForScore(0), "Miss");
assert.deepEqual(normalizeTimingScores([5, 3, 4]), [5, 3, 4]);
assert.equal(normalizeTimingScores([5, 3]), null);
assert.equal(normalizeTimingScores([5, 3, 9]), null);
assert.equal(normalizeTimingScores([5, 3, 4.5]), null);
assert.equal(yieldForTimingScores([5, 5, 5]), 5);
assert.equal(yieldForTimingScores([5, 3, 4]), 4);
assert.equal(yieldForTimingScores([5, 0, 5]), 3);
assert.equal(yieldForTimingScores([1, 1, 0]), 1);
assert.equal(yieldForTimingScores([0, 0, 0]), 0);
assert.equal(yieldForTimingScores([5, 5]), 0);

const fresh = createMiningDepositConfig({ oreId: "iron-ore" });
assert.equal(fresh.maxAttempts, DEFAULT_MAX_ATTEMPTS);
assert.equal(fresh.attemptsUsed, 0);
assert.equal(fresh.depleted, false);

const last = createMiningDepositConfig({ oreId: "iron-ore", attemptsUsed: 5 });
assert.equal(last.attemptsUsed, 5);
assert.equal(last.depleted, true);

const clamped = normalizeMiningDepositConfig({ oreId: "gold-ore", maxAttempts: 5, attemptsUsed: 99 });
assert.equal(clamped.attemptsUsed, 5);
assert.equal(clamped.depleted, true);

import { ORE_ORDER, getOre, createOreItemSource } from "../modules/regionwright-hunting-gathering/mining-catalog.js";

assert.deepEqual(ORE_ORDER, [
  "iron-ore", "tin-ore", "copper-ore", "silver-ore", "gold-ore", "platinum-ore", "mithral-ore", "hizagkuur", "arandur-ore"
]);
assert.equal(getOre("iron-ore").price.value, 1);
assert.equal(getOre("iron-ore").price.denomination, "sp");
assert.equal(getOre("tin-ore").price.value, 3);
assert.equal(getOre("platinum-ore").price.value, 25);
assert.equal(getOre("mithral-ore").price.value, 100);
assert.equal(getOre("hizagkuur").price.value, 625);
assert.equal(getOre("arandur-ore").price.value, 1000);
assert.equal(getOre("mithral-ore").miningDifficulty, "exceptional");
assert.equal(getOre("hizagkuur").miningDifficulty, "legendary");
assert.equal(getOre("arandur-ore").miningDifficulty, "legendary-plus");
assert.equal(getOre("adamantine-ore"), null);
const stack = createOreItemSource("gold-ore", 3);
assert.equal(stack.type, "loot");
assert.equal(stack.system.quantity, 3);
assert.equal(stack.system.weight.value, 1);
assert.equal(stack.flags["regionwright-hunting-gathering"].ore.oreId, "gold-ore");
assert.equal(stack.flags["regionwright-hunting-gathering"].ore.tier, "rare");

console.log("regionwright-hunting-gathering mining pure tests: PASS");
