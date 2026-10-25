import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  ARROW_DRAG_KAPPA_M_INV,
  DEER_MOTION_MIN_PAUSE_MS,
  DEER_MOTION_MIN_WALK_MS,
  DEER_MOTION_LANE_M,
  DEER_WIDTH_M,
  DEER_HEIGHT_M,
  DEER_HIT_ZONES,
  DEER_TEST_HIT_ZONES,
  BOW_SIGHT_PINS_YARDS,
  MOVING_AIM_ASSIST_MAX_M,
  DRAW_MILESTONES,
  DRAW_TIME_LINEAR_WEIGHT,
  DRAW_TIME_POWER,
  STAMINA_DRAW_BASE_DRAIN_PER_SEC,
  STAMINA_DRAW_EXTRA_DRAIN_PER_SEC,
  STAMINA_MAX,
  STAMINA_RECOVERY_DELAY_MS,
  STAMINA_RECOVERY_PER_SEC,
  FATIGUE_START_MS,
  FULL_DRAW_MS,
  drawElapsedMsForStrength,
  drawForceFractionForStrength,
  sightPinForDistance,
  storedEnergyFractionForDrawStrength,
  mpsToFps,
  staminaAfterDrawing,
  staminaAfterRecovery,
  staminaDrainPerSecond,
  FULL_DRAW_SPEED_MPS,
  adjustImpactForTargetMovement,
  applyMovingTargetAimForgiveness,
  arrowSpeedForDraw,
  calculateArrowImpact,
  classifyDeerImpact,
  deerMovementProfile,
  deerMotionAtMs,
  distanceForStealth,
  drawStrengthForMs,
  harvestForSurvival,
  quarryTierForSurvival,
  projectDeerCenterU,
  sampleArrowTrajectoryToDistance,
  swayOffsetAtMs,
  targetWidthForDistance
} from "../modules/regionwright-hunting-gathering/hunting-engine.js";
import { createHuntingBowItemSource, findHuntingBow, huntingSkillModifier, isHuntingBow, rollHuntingSkill } from "../modules/regionwright-hunting-gathering/hunting.js";

test("tracking Survival chooses progressively better quarry tiers", () => {
  assert.equal(quarryTierForSurvival(1).id, "poor");
  assert.equal(quarryTierForSurvival(8).id, "common");
  assert.equal(quarryTierForSurvival(12).quarry.name, "Whitetail Buck");
  assert.equal(quarryTierForSurvival(16).id, "uncommon");
  assert.equal(quarryTierForSurvival(20).id, "rare");
  assert.equal(quarryTierForSurvival(24).id, "exceptional");
});

test("Stealth directly sets shot range and stronger rolls get closer", () => {
  const ranges = [1, 7, 11, 15, 19, 25].map(total => distanceForStealth(total).yards);
  assert.deepEqual(ranges, [65, 55, 45, 35, 25, 18]);
  for (let index = 1; index < ranges.length; index += 1) assert.ok(ranges[index] < ranges[index - 1]);
  assert.ok(targetWidthForDistance(18) > targetWidthForDistance(35));
  assert.ok(targetWidthForDistance(35) > targetWidthForDistance(65));
});

test("deer movement is deterministic and alternates smooth walks with stationary windows", () => {
  const a = deerMovementProfile("movement-seed");
  const b = deerMovementProfile("movement-seed");
  assert.deepEqual(a, b);
  assert.ok(a.walkMs >= DEER_MOTION_MIN_WALK_MS);
  assert.ok(a.pauseMs >= DEER_MOTION_MIN_PAUSE_MS);
  const normalized = { ...a, phaseOffsetMs: 0, reverse: false };
  const start = deerMotionAtMs(0, normalized);
  const midWalk = deerMotionAtMs(a.walkMs / 2, normalized);
  const rightPause = deerMotionAtMs(a.walkMs + (a.pauseMs / 2), normalized);
  const leftWalk = deerMotionAtMs(a.walkMs + a.pauseMs + (a.walkMs / 2), normalized);
  const leftPause = deerMotionAtMs((2 * a.walkMs) + a.pauseMs + (a.pauseMs / 2), normalized);
  assert.equal(start.position, 0);
  assert.equal(start.positionM, -DEER_MOTION_LANE_M / 2);
  assert.ok(midWalk.position > 0.45 && midWalk.position < 0.55);
  assert.ok(Math.abs(midWalk.positionM) < 1e-12);
  assert.ok(midWalk.velocityMps > 0);
  assert.equal(midWalk.moving, true);
  assert.ok(midWalk.velocityPerSecond > 0);
  assert.equal(rightPause.position, 1);
  assert.equal(rightPause.positionM, DEER_MOTION_LANE_M / 2);
  assert.equal(rightPause.moving, false);
  assert.equal(rightPause.velocityPerSecond, 0);
  assert.equal(leftWalk.moving, true);
  assert.ok(leftWalk.velocityPerSecond < 0);
  assert.equal(leftPause.position, 0);
  assert.equal(leftPause.moving, false);
});

test("physical deer projection makes arrow endpoint and deer-local impact marker converge", () => {
  const arenaWidthPx = 900;
  const releasePositionM = 0;
  const targetTravelM = 0.5;
  const arrowWorldXM = 0.52;
  const deerRelativeImpactXM = arrowWorldXM - targetTravelM;
  for (const distanceYards of [20, 45, 65]) {
    const targetWidthPx = targetWidthForDistance(distanceYards);
    const pixelsPerMeter = targetWidthPx / DEER_WIDTH_M;
    const releaseCenterU = projectDeerCenterU(releasePositionM, { arenaWidthPx, targetWidthPx });
    const impactCenterU = projectDeerCenterU(releasePositionM + targetTravelM, { arenaWidthPx, targetWidthPx });
    const arrowEndpointU = releaseCenterU + ((arrowWorldXM * pixelsPerMeter) / arenaWidthPx);
    const markerWorldU = impactCenterU + ((deerRelativeImpactXM * pixelsPerMeter) / arenaWidthPx);
    assert.ok(Math.abs(arrowEndpointU - markerWorldU) < 1e-12, `${distanceYards} yd endpoint mismatch`);
  }
});

test("quarry physical motion is range-independent and no longer derived from rendered deer pixels", async () => {
  assert.equal(DEER_MOTION_LANE_M, 4.8);
  const profile = { ...deerMovementProfile("physical-lane"), phaseOffsetMs: 0, reverse: false };
  const release = deerMotionAtMs(profile.walkMs * 0.35, profile);
  const impact = deerMotionAtMs(profile.walkMs * 0.55, profile);
  const physicalDelta = impact.positionM - release.positionM;
  assert.ok(physicalDelta > 0);
  for (const distanceYards of [25, 45, 65]) {
    const renderedWidth = targetWidthForDistance(distanceYards);
    assert.ok(renderedWidth > 0);
    assert.ok(Math.abs((impact.positionM - release.positionM) - physicalDelta) < 1e-12);
  }
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /targetDeltaM = \(Number\(impactMotionRaw\.positionM\) \|\| 0\) - \(Number\(releaseMotion\.positionM\) \|\| 0\)/);
  assert.doesNotMatch(source, /targetDeltaM = targetDeltaPx \/ pixelsPerMeter/);
  assert.match(source, /releaseVelocityMps/);
  assert.match(source, /physicalHorizontalMissM/);
});

test("reversed deer motion phase labels agree with physical velocity and mirrored pauses", () => {
  const base = { ...deerMovementProfile("phase-label"), phaseOffsetMs: 0, reverse: false };
  const reversed = { ...base, reverse: true };
  const rightWalk = deerMotionAtMs(base.walkMs / 2, base);
  const reversedRightWalk = deerMotionAtMs(base.walkMs / 2, reversed);
  assert.equal(rightWalk.phase, "walk-right");
  assert.ok(rightWalk.velocityMps > 0);
  assert.equal(reversedRightWalk.phase, "walk-left");
  assert.ok(reversedRightWalk.velocityMps < 0);
  const rightPause = deerMotionAtMs(base.walkMs + (base.pauseMs / 2), base);
  const reversedRightPause = deerMotionAtMs(base.walkMs + (base.pauseMs / 2), reversed);
  assert.equal(rightPause.phase, "pause-right");
  assert.equal(reversedRightPause.phase, "pause-left");
  assert.ok(Math.abs(reversedRightPause.velocityMps) < 1e-12);
  const leftWalkTime = base.walkMs + base.pauseMs + (base.walkMs / 2);
  const leftWalk = deerMotionAtMs(leftWalkTime, base);
  const reversedLeftWalk = deerMotionAtMs(leftWalkTime, reversed);
  assert.equal(leftWalk.phase, "walk-left");
  assert.ok(leftWalk.velocityMps < 0);
  assert.equal(reversedLeftWalk.phase, "walk-right");
  assert.ok(reversedLeftWalk.velocityMps > 0);
});

test("moving quarry displacement changes the anatomical impact and creates lead", () => {
  const centered = { impactXM: 0, impactYM: 0 };
  const stationary = adjustImpactForTargetMovement(centered, 0);
  const deerMovesRight = adjustImpactForTargetMovement(centered, 0.6);
  const deerMovesLeft = adjustImpactForTargetMovement(centered, -0.6);
  assert.equal(stationary.impactXM, 0);
  assert.equal(deerMovesRight.impactXM, -0.6);
  assert.equal(deerMovesLeft.impactXM, 0.6);
  const canonical = classifyDeerImpact({ impactXM: 0.55, impactYM: 0.3 }, { facing: 1 });
  const mirrored = classifyDeerImpact({ impactXM: -0.55, impactYM: 0.3 }, { facing: -1 });
  assert.equal(canonical.zone, mirrored.zone);
});

test("moving-target aim forgiveness only rescues a tiny correct-direction horizontal near miss", () => {
  assert.equal(MOVING_AIM_ASSIST_MAX_M, 0.12);
  const nearMiss = { impactXM: -0.55, impactYM: -0.07 };
  assert.equal(classifyDeerImpact(nearMiss, { facing: 1 }).zone, "miss");
  const assisted = applyMovingTargetAimForgiveness(nearMiss, {
    facing: 1,
    moving: true,
    velocityPerSecond: 0.5,
    aimXM: 0.2
  });
  assert.equal(assisted.applied, true);
  assert.equal(assisted.hit.zone, "body");
  assert.ok(assisted.correctionM > 0 && assisted.correctionM <= MOVING_AIM_ASSIST_MAX_M);
  assert.ok(Math.abs(assisted.correctionM - 0.07) < 1e-9);

  const trailing = applyMovingTargetAimForgiveness(nearMiss, {
    facing: 1,
    moving: true,
    velocityPerSecond: 0.5,
    aimXM: -0.2
  });
  assert.equal(trailing.applied, false);
  assert.equal(trailing.hit.zone, "miss");

  const paused = applyMovingTargetAimForgiveness(nearMiss, {
    facing: 1,
    moving: false,
    velocityPerSecond: 0,
    aimXM: 0.2
  });
  assert.equal(paused.applied, false);

  const verticalMiss = applyMovingTargetAimForgiveness({ impactXM: -0.55, impactYM: 0.7 }, {
    facing: 1,
    moving: true,
    velocityPerSecond: 0.5,
    aimXM: 0.2
  });
  assert.equal(verticalMiss.applied, false);

  const largeMiss = applyMovingTargetAimForgiveness({ impactXM: -0.8, impactYM: -0.07 }, {
    facing: 1,
    moving: true,
    velocityPerSecond: 0.5,
    aimXM: 0.2
  });
  assert.equal(largeMiss.applied, false);

  const alreadyHit = applyMovingTargetAimForgiveness({ impactXM: 0, impactYM: -0.07 }, {
    facing: 1,
    moving: true,
    velocityPerSecond: 0.5,
    aimXM: 0.2
  });
  assert.equal(alreadyHit.applied, false);
  assert.equal(alreadyHit.hit.zone, "lungs");
});

test("moving-target forgiveness mirrors for leftward travel", () => {
  const nearMiss = { impactXM: 0.59, impactYM: -0.07 };
  assert.equal(classifyDeerImpact(nearMiss, { facing: 1 }).zone, "miss");
  const assisted = applyMovingTargetAimForgiveness(nearMiss, {
    facing: 1,
    moving: true,
    velocityPerSecond: -0.5,
    aimXM: -0.2
  });
  assert.equal(assisted.applied, true);
  assert.ok(assisted.correctionM < 0);
  assert.ok(Math.abs(assisted.correctionM) <= MOVING_AIM_ASSIST_MAX_M);
  assert.notEqual(assisted.hit.zone, "miss");
});

test("realistic heavy-self-bow draw uses linear force and quadratic work-time", () => {
  assert.equal(FULL_DRAW_MS, 2500);
  assert.equal(DRAW_TIME_LINEAR_WEIGHT, 0);
  assert.equal(DRAW_TIME_POWER, 2);
  assert.deepEqual(DRAW_MILESTONES, [0.5, 0.75, 1]);
  assert.equal(FATIGUE_START_MS, 3500);
  assert.equal(drawStrengthForMs(0), 0);
  assert.ok(Math.abs(drawElapsedMsForStrength(0.5) - 625) < 0.001);
  assert.ok(Math.abs(drawElapsedMsForStrength(0.75) - 1406.25) < 0.001);
  assert.ok(Math.abs(drawElapsedMsForStrength(0.9) - 2025) < 0.001);
  assert.ok(Math.abs(drawElapsedMsForStrength(0.95) - 2256.25) < 0.001);
  assert.equal(drawElapsedMsForStrength(1), 2500);
  for (const strength of [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 1]) {
    assert.ok(Math.abs(drawStrengthForMs(drawElapsedMsForStrength(strength)) - strength) < 1e-7);
    assert.ok(Math.abs(drawForceFractionForStrength(strength) - strength) < 1e-12);
    assert.ok(Math.abs(storedEnergyFractionForDrawStrength(strength) - (strength * strength)) < 1e-12);
  }
  const full = calculateArrowImpact({ distanceYards: 35, drawStrength: 1 });
  const partial = calculateArrowImpact({ distanceYards: 35, drawStrength: 0.75 });
  assert.equal(full.launchSpeedMps, FULL_DRAW_SPEED_MPS);
  assert.ok(partial.launchSpeedMps < full.launchSpeedMps);
  assert.ok(partial.timeSeconds > full.timeSeconds);
  assert.equal(full.sightPinYards, sightPinForDistance(35));
});

test("linear warbow force makes launch speed follow draw fraction through stored energy", () => {
  assert.equal(storedEnergyFractionForDrawStrength(0), 0);
  assert.equal(storedEnergyFractionForDrawStrength(1), 1);
  for (const strength of [0.25, 0.5, 0.75, 0.9, 0.95, 1]) {
    const expectedEnergy = strength * strength;
    assert.ok(Math.abs(storedEnergyFractionForDrawStrength(strength) - expectedEnergy) < 1e-12);
    assert.ok(Math.abs(arrowSpeedForDraw(strength) - (FULL_DRAW_SPEED_MPS * strength)) < 1e-8);
  }
  assert.ok(Math.abs(arrowSpeedForDraw(0.5) - 37.25) < 0.001);
  assert.ok(Math.abs(arrowSpeedForDraw(0.75) - 55.875) < 0.001);
  assert.ok(Math.abs(arrowSpeedForDraw(0.9) - 67.05) < 0.001);
  assert.equal(arrowSpeedForDraw(1), FULL_DRAW_SPEED_MPS);
  assert.equal(Math.round(mpsToFps(FULL_DRAW_SPEED_MPS)), 244);
  const half65 = calculateArrowImpact({ distanceYards: 65, drawStrength: 0.5, aimXM: 0, aimYM: 0, windMph: 0 });
  const threeQuarter65 = calculateArrowImpact({ distanceYards: 65, drawStrength: 0.75, aimXM: 0, aimYM: 0, windMph: 0 });
  const full65 = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0 });
  assert.ok(half65.timeSeconds > full65.timeSeconds * 1.9);
  assert.ok(threeQuarter65.timeSeconds > full65.timeSeconds * 1.3);
  assert.ok(full65.timeSeconds < 0.9);
});

test("stamina reflects the shorter realistic draw without hidden retuning", () => {
  assert.equal(STAMINA_MAX, 100);
  assert.equal(STAMINA_DRAW_BASE_DRAIN_PER_SEC, 1);
  assert.equal(STAMINA_DRAW_EXTRA_DRAIN_PER_SEC, 23);
  assert.equal(STAMINA_RECOVERY_PER_SEC, 24);
  assert.equal(STAMINA_RECOVERY_DELAY_MS, 600);
  assert.equal(staminaDrainPerSecond(0), 1);
  assert.ok(Math.abs(staminaDrainPerSecond(0.5) - 6.75) < 1e-9);
  assert.ok(Math.abs(staminaDrainPerSecond(0.75) - 13.9375) < 1e-9);
  assert.equal(staminaDrainPerSecond(1), 24);
  let stamina = STAMINA_MAX;
  for (let elapsed = 0; elapsed < FULL_DRAW_MS; elapsed += 10) {
    const strength = drawStrengthForMs(elapsed + 10);
    stamina = staminaAfterDrawing(stamina, strength, 10);
  }
  assert.ok(stamina > 68 && stamina < 69);
  const holdSeconds = stamina / staminaDrainPerSecond(1);
  assert.ok(holdSeconds > 2.8 && holdSeconds < 2.9);
  assert.equal(staminaAfterDrawing(5, 1, 1000), 0);
  assert.equal(staminaAfterRecovery(0, 1000), 24);
  assert.equal(staminaAfterRecovery(95, 1000), 100);
});

test("sampled RK4 trajectory lands at the exact calculated impact time and position", () => {
  for (const drawStrength of [0.5, 0.75, 1]) {
    const physics = calculateArrowImpact({ distanceYards: 65, drawStrength, aimXM: 0.2, aimYM: 0.1, windMph: 8 });
    const trajectory = sampleArrowTrajectoryToDistance({
      distanceYards: 65,
      speedMps: physics.launchSpeedMps,
      launchElevationRadians: physics.elevationRadians,
      launchAzimuthRadians: physics.azimuthRadians,
      windMph: 8,
      kappa: physics.kappa,
      sightHeightM: physics.sightHeightM
    });
    assert.ok(trajectory.samples.length > 10);
    assert.ok(Math.abs(trajectory.impact.timeSeconds - physics.timeSeconds) < 1e-10);
    assert.ok(Math.abs(trajectory.impact.xM - physics.impactXM) < 1e-10);
    assert.ok(Math.abs(trajectory.impact.yM - physics.impactYM) < 1e-10);
    assert.equal(trajectory.samples.at(-1).timeSeconds, trajectory.impact.timeSeconds);
  }
});

test("gravity drops the arrow and crosswind direction and speed control lateral drift", () => {
  const calm = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0 });
  const right4 = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 4 });
  const right8 = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 8 });
  const left8 = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: -8 });
  assert.ok(calm.verticalErrorM < 0);
  assert.ok(right4.windDriftM > 0);
  assert.ok(right8.windDriftM > right4.windDriftM);
  assert.ok(left8.windDriftM < 0);
  assert.ok(Math.abs(Math.abs(left8.windDriftM) - right8.windDriftM) < 0.02);
});

test("aim angle can compensate for gravity instead of applying an accuracy percentage", () => {
  const flat = calculateArrowImpact({ distanceYards: 45, drawStrength: 1, aimYM: 0 });
  const heldHigh = calculateArrowImpact({ distanceYards: 45, drawStrength: 1, aimYM: 1.5 });
  assert.ok(heldHigh.impactYM > flat.impactYM);
  assert.ok(heldHigh.elevationRadians > flat.elevationRadians);
});

test("aim sway remains deterministic and fatigue still widens it after the draw", () => {
  const normalA = swayOffsetAtMs(1500, 1300);
  const normalB = swayOffsetAtMs(1500, 1300);
  const tired = swayOffsetAtMs(1500, 7000);
  assert.deepEqual(normalA, normalB);
  assert.ok(tired.amplitude > normalA.amplitude);
  assert.ok(tired.fatigue > 0);
});

test("full-draw Hunting Bow uses practical 20-60 yard sight pins", () => {
  assert.deepEqual(BOW_SIGHT_PINS_YARDS, [20, 30, 40, 50, 60]);
  assert.equal(sightPinForDistance(18), 20);
  assert.equal(sightPinForDistance(35), 30);
  assert.equal(sightPinForDistance(65), 60);
  const at20 = calculateArrowImpact({ distanceYards: 20, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0, sightPinYards: 20 });
  const at35 = calculateArrowImpact({ distanceYards: 35, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0 });
  const at65 = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0 });
  assert.ok(Math.abs(at20.verticalErrorM) < 0.01);
  assert.ok(at35.verticalErrorM < 0 && at35.verticalErrorM > -0.2);
  assert.ok(at65.verticalErrorM < -0.2 && at65.verticalErrorM > -0.4);
});

test("live trained holdover crosses the exact anatomy point at fixed calibration ranges", () => {
  for (const distanceYards of [20, 35, 50, 65]) {
    for (const drawStrength of [0.75, 1]) {
      for (const aimYM of [-0.2, 0, 0.2]) {
        const shot = calculateArrowImpact({ distanceYards, drawStrength, aimXM: 0, aimYM, windMph: 0, aimingMode: "holdover" });
        assert.equal(shot.aimingMode, "holdover");
        assert.equal(shot.sightPinYards, null);
        assert.ok(Math.abs(shot.verticalErrorM) < 1e-8, `${distanceYards} yd / ${drawStrength} draw / ${aimYM}m aim had ${shot.verticalErrorM}m vertical error`);
      }
    }
  }
});

test("normal live Hunting remains on the existing pin calculation unless calibration explicitly requests holdover", () => {
  const implicit = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0.1, aimYM: 0.15, windMph: 0 });
  const explicit = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0.1, aimYM: 0.15, windMph: 0, aimingMode: "pin" });
  assert.equal(implicit.aimingMode, "pin");
  assert.equal(implicit.sightPinYards, 60);
  assert.ok(Math.abs(implicit.elevationRadians - explicit.elevationRadians) < 1e-12);
  assert.ok(Math.abs(implicit.impactYM - explicit.impactYM) < 1e-12);
  assert.ok(Math.abs(implicit.timeSeconds - explicit.timeSeconds) < 1e-12);
});

test("GM Hunting test-mode framework keeps bounded holdover and movement calibration paths", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /holdover: Object\.freeze\(\{ id: "holdover"[\s\S]*Object\.freeze\(\[20, 35, 50, 65\]\)/);
  assert.match(source, /movement: Object\.freeze\(\{ id: "movement"[\s\S]*Object\.freeze\(\[25, 45, 65\]\)/);
  assert.match(source, /Only the active GM can launch Hunting test modes/);
  assert.match(source, /calibrationMode/);
  assert.match(source, /testMode: true/);
  assert.match(source, /deerMovementProfile/);
  assert.match(source, /staminaAfterDrawing/);
  assert.match(source, /sampleArrowTrajectoryToDistance/);
  assert.match(source, /applyMovingTargetAimForgiveness/);
  assert.match(source, /Aim directly at the anatomical point you want to hit/);
  assert.match(source, /Movement test: keep a fixed crosshair/);
});

test("published arrow drag calibration drives the RK4 model", () => {
  assert.equal(ARROW_DRAG_KAPPA_M_INV, 0.00231);
  const calm = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 0 });
  const windy = calculateArrowImpact({ distanceYards: 65, drawStrength: 1, aimXM: 0, aimYM: 0, windMph: 12 });
  assert.ok(calm.timeSeconds > 0.8 && calm.timeSeconds < 0.9);
  assert.ok(calm.impactSpeedMps < calm.launchSpeedMps);
  assert.ok(windy.windDriftM > 0.25 && windy.windDriftM < 0.4);
});

test("Hunting skill buttons suppress the D&D5e dialog and force a normal d20", async () => {
  const previousConfig = globalThis.CONFIG;
  const calls = [];
  try {
    globalThis.CONFIG = { Dice: { D20Roll: { ADV_MODE: { NORMAL: 0, ADVANTAGE: 1, DISADVANTAGE: -1 } } } };
    const actor = {
      name: "Hunter",
      async rollSkill(config, dialog) {
        calls.push({ config, dialog });
        return [{ total: 17 }];
      }
    };
    const result = await rollHuntingSkill(actor, "sur");
    assert.equal(result.total, 17);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].dialog.configure, false);
    assert.equal(calls[0].config.advantage, false);
    assert.equal(calls[0].config.disadvantage, false);
    assert.equal(calls[0].config.rolls[0].options.advantageMode, 0);
  } finally { globalThis.CONFIG = previousConfig; }
});

test("testing anatomy moves vitals forward while production zones remain unchanged", () => {
  assert.notDeepEqual(DEER_TEST_HIT_ZONES, DEER_HIT_ZONES);
  const byId = id => DEER_TEST_HIT_ZONES.find(zone => zone.id === id);
  const lungs = byId("lungs");
  const heart = byId("heart");
  const abdomen = byId("abdomen");
  assert.ok(lungs.cx > DEER_HIT_ZONES.find(zone => zone.id === "lungs").cx);
  assert.ok(heart.cx > DEER_HIT_ZONES.find(zone => zone.id === "heart").cx);
  assert.ok(abdomen.cx < lungs.cx);
  const impactForZone = zone => ({
    impactXM: ((zone.cx - 90) / 180) * DEER_WIDTH_M,
    impactYM: ((75 - zone.cy) / 150) * DEER_HEIGHT_M
  });
  assert.equal(classifyDeerImpact(impactForZone(lungs), { zones: DEER_TEST_HIT_ZONES }).zone, "lungs");
  assert.equal(classifyDeerImpact(impactForZone(heart), { zones: DEER_TEST_HIT_ZONES }).zone, "heart");
  assert.equal(classifyDeerImpact(impactForZone(abdomen), { zones: DEER_TEST_HIT_ZONES }).zone, "abdomen");
  const oldHeart = DEER_HIT_ZONES.find(zone => zone.id === "heart");
  assert.equal(classifyDeerImpact(impactForZone(oldHeart)).zone, "heart");
  assert.notEqual(classifyDeerImpact(impactForZone(oldHeart), { zones: DEER_TEST_HIT_ZONES }).zone, "heart");
});

test("GM test overlay and test-mode resolution use the same isolated anatomy zone source", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /const overlayZones = testAnatomy \? DEER_TEST_HIT_ZONES : DEER_HIT_ZONES/);
  assert.match(source, /anatomyZoneMarkup\(overlayZones\)/);
  assert.match(source, /zones: this\.testMode \? DEER_TEST_HIT_ZONES : DEER_HIT_ZONES/);
  assert.match(source, /Show anatomical target/);
  assert.match(source, /lungs sit behind the front shoulder/);
});

test("deer hit zones distinguish clean vital hits from wounded body hits and misses", () => {
  assert.equal(classifyDeerImpact({ impactXM: 0, impactYM: 0 }).zone, "lungs");
  assert.equal(classifyDeerImpact({ impactXM: -0.11, impactYM: -0.13 }).zone, "heart");
  assert.equal(classifyDeerImpact({ impactXM: -0.55, impactYM: 0 }).lethal, false);
  assert.equal(classifyDeerImpact({ impactXM: 4, impactYM: 4 }).zone, "miss");
});

test("harvest Survival recovers more without creating meat beyond the carcass", () => {
  const quarry = quarryTierForSurvival(20).quarry;
  const poor = harvestForSurvival({ total: 4, quarry, shotQuality: "clean" });
  const expert = harvestForSurvival({ total: 24, quarry, shotQuality: "perfect" });
  assert.ok(poor.meatLb < expert.meatLb);
  assert.ok(expert.meatLb <= quarry.meatLb);
  assert.equal(poor.hide, 0);
  assert.equal(expert.hide, 1);
  assert.equal(expert.antlers, 2);
});

test("only the dedicated flagged Hunting Bow satisfies the equipment gate", () => {
  const genericLongbow = { name: "Longbow", system: { quantity: 1 }, flags: {} };
  const fakeNamedBow = { name: "Hunting Bow", system: { quantity: 1 }, flags: {} };
  const source = createHuntingBowItemSource();
  assert.equal(isHuntingBow(genericLongbow), false);
  assert.equal(isHuntingBow(fakeNamedBow), false);
  assert.equal(isHuntingBow(source), true);
  assert.equal(findHuntingBow({ items: [genericLongbow, fakeNamedBow] }), null);
  assert.equal(findHuntingBow({ items: [genericLongbow, source] }), source);
  assert.equal(source.flags["regionwright-hunting-gathering"].huntingBow.itemId, "hunting-bow");
});

test("Hunting UI reads the actor's current skill totals for button labels", () => {
  const actor = { system: { skills: { sur: { total: 7 }, ste: { mod: 4 } } } };
  assert.equal(huntingSkillModifier(actor, "sur"), 7);
  assert.equal(huntingSkillModifier(actor, "ste"), 4);
});


test("Hunting keeps roll UI and shooting UI in separate dialogs", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /Regionwright Hunting Rolls/);
  assert.match(source, /Regionwright Hunt/);
  assert.match(source, /Regionwright Harvest Roll/);
  assert.match(source, /data-rw-hunt-action="begin-shot"/);
  assert.match(source, /await this\.close\(\);\s*await openHuntingShot/);
  assert.match(source, /await this\.close\(\);\s*await openHarvestRoll/);
});

test("shooting window renders the coded point-board scene and overlays hitboxes independently", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /loadCodedPointBoardAsset, PointBoardDataLayerRenderer/);
  assert.match(source, /assets\/hunting\/deer-walk-point-board\.json/);
  assert.match(source, /data-rw-hunt-point-forest/);
  assert.match(source, /data-rw-hunt-point-deer/);
  assert.match(source, /sourceRect: DEER_POINT_BOARD_SOURCE_RECT/);
  assert.match(source, /this\.deerRenderer\?\.render\(\{ elapsedMs, moving: state\.moving && !this\.prefersReducedMotion \}\)/);
  assert.match(source, /this\.renderDeer\(false\)/);
  assert.match(source, /data-rw-hunt-deer-art/);
  assert.match(source, /overlay\.innerHTML = showHitboxes \? deerHitboxOverlayMarkup\(\{ testAnatomy: this\.testMode \}\) : ""/);
  assert.doesNotMatch(source, /function deerSvg|rw-hunt-deer-shape/);
  assert.doesNotMatch(source, /target\.innerHTML = deerSvg/);
});

test("Hunt rendering projects quarry metres with the same target-scale pixels-per-meter basis as the arrow", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /return projectDeerCenterU\(positionM, \{ arenaWidthPx: arenaRect\.width, targetWidthPx: targetRect\.width \}\)/);
  assert.doesNotMatch(source, /physicalFraction = Math\.max/);
});

test("moving-shot aim stays arena-local while impact uses synchronized trajectory time", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /arena\.appendChild\(reticle\)/);
  assert.match(source, /reticle\.style\.left = `\$\{\(reticleX \/ arenaRect\.width\) \* 100\}%`/);
  assert.match(source, /impact\.style\.left = `\$\{\(hit\.point\.x \/ 180\) \* 100\}%`/);
  assert.match(source, /sampleArrowTrajectoryToDistance\(\{/);
  assert.match(source, /impactElapsedMs = releaseElapsedMs \+ \(synchronizedBasePhysics\.timeSeconds \* 1000\)/);
  assert.match(source, /adjustImpactForTargetMovement\(synchronizedBasePhysics, targetDeltaM\)/);
});






test("draw markers pulse at 50 75 and 100 without staged bow art", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.match(source, /data-rw-hunt-milestone="50"/);
  assert.match(source, /data-rw-hunt-milestone="75"/);
  assert.match(source, /data-rw-hunt-milestone="100"/);
  assert.match(source, /for \(const milestone of DRAW_MILESTONES\)/);
  assert.match(source, /pulseMilestone\(markerPercent\)/);
  assert.match(css, /@keyframes rw-hunt-draw-pulse/);
  assert.doesNotMatch(source, /rw-hunt-bow-visual|data-rw-bow-stage/);
  assert.doesNotMatch(css, /\.rw-hunt-bow-visual/);
});


test("live Hunting is calm-only while dormant engine wind physics remains available", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const engine = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting-engine.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.doesNotMatch(source, /data-rw-hunt-wind-visual|rw-hunt-wind-visual|Wind pushes|windDriftM|driftText|deterministicWind/);
  assert.doesNotMatch(css, /\.rw-hunt-wind-visual/);
  assert.match(source, /this\.wind = Object\.freeze\(\{ mph: 0, label: "Calm" \}\)/);
  assert.match(source, /calculateArrowImpact\(\{[\s\S]*?distanceYards: this\.range\.yards,[\s\S]*?windMph: 0,[\s\S]*?aimingMode: this\.calibrationMode === "holdover" \? "holdover" : "pin"/);
  assert.match(source, /sampleArrowTrajectoryToDistance\(\{[\s\S]*?windMph: 0,/);
  assert.match(source, /Calm calibration/);
  assert.match(source, /Calibrate vertical aim for arrow drop/);
  assert.match(engine, /export function deterministicWind/);
  assert.match(engine, /const rvx = vx - windMps/);
  assert.doesNotMatch(source, /swayOffsetAtMs/);
  assert.doesNotMatch(source, /currentSway\(/);
  assert.doesNotMatch(source, /this\.sway/);
  assert.match(source, /const x = Math\.max\(10, Math\.min\(rect\.width - 10, this\.mouse\.u \* rect\.width\)\)/);
  assert.match(source, /const y = Math\.max\(10, Math\.min\(rect\.height - 10, this\.mouse\.v \* rect\.height\)\)/);
});


test("Hunt runtime keeps quarry motion on the same real flight clock as the projectile", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.match(source, /deerMovementProfile\(`\$\{this\.seed\}:quarry`\)/);
  assert.match(source, /this\.paintDeerMotion\(now - this\.motionStartedAt\)/);
  assert.match(source, /this\.paintDeerMotion\(releaseElapsedMs \+ elapsedMs\)/);
  assert.match(source, /this\.motionFrozenAtMs = impactElapsedMs/);
  assert.match(source, /this\.deerRenderer\?\.render\(\{ elapsedMs, moving: state\.moving && !this\.prefersReducedMotion \}\)/);
  assert.doesNotMatch(source, /Math\.min\(1100, flightSeconds \* 1000\)/);
  assert.doesNotMatch(css, /\.rw-hunt-target\[data-motion="moving"\].*rw-hunt-deer-svg/);
});


test("Hunt dialog cancels projectile animation and its timers when replaced or closed", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /this\.arrowAnimationFrame = null/);
  assert.match(source, /this\.arrowHideTimeout = null/);
  assert.match(source, /this\.arrowAnimationFrame = globalThis\.requestAnimationFrame\?\.\(step\) \?\? null/);
  assert.match(source, /if \(this\.arrowAnimationFrame !== null\) globalThis\.cancelAnimationFrame\?\.\(this\.arrowAnimationFrame\)/);
  assert.match(source, /if \(this\.arrowHideTimeout !== null\) clearTimeout\(this\.arrowHideTimeout\)/);
  assert.match(source, /async close\(options = \{\}\) \{\s*this\.stopAnimation\(\);\s*this\.cancelProjectileAnimation\(\);/);
});


test("Hunt stamina UI drains while drawing, recovers lowered, and exhaustion never fires", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.match(source, /data-rw-hunt-stamina-meter/);
  assert.match(source, /data-rw-hunt-stamina-label>100%/);
  assert.match(source, /staminaAfterDrawing\(this\.stamina, strength, deltaMs\)/);
  assert.match(source, /staminaAfterRecovery\(this\.stamina, deltaMs\)/);
  assert.match(source, /this\.staminaRecoveryAt = now \+ STAMINA_RECOVERY_DELAY_MS/);
  assert.match(source, /this\.cancelDraw\("Your arms give out and you lower the bow\."\)/);
  assert.doesNotMatch(source, /this\.fire\([^\)]*exhaust/i);
  assert.match(css, /\.rw-hunt-stamina/);
  assert.match(css, /data-level="critical"/);
});


test("shot result and visual flight use the synchronized physical flight time", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  assert.match(source, /Math\.round\(mpsToFps\(physics\.launchSpeedMps\)\)\} fps launch/);
  assert.match(source, /physics\.timeSeconds\.toFixed\(2\)\}s flight/);
  assert.match(source, /const duration = Math\.max\(1, finalPoint\.timeSeconds \* 1000\)/);
  assert.doesNotMatch(source, /Math\.min\(1100/);
});


test("live Hunting removes predictive lead UI, keeps tracer, and applies only hidden bounded forgiveness", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.doesNotMatch(source, /data-rw-hunt-lead-cue|paintLeadCue|leadFlightSeconds|leadFlightCache/);
  assert.doesNotMatch(css, /\.rw-hunt-lead-cue/);
  assert.match(source, /data-rw-hunt-tracer-line/);
  assert.match(source, /projectTrajectorySamples\(trajectory/);
  assert.match(source, /this\.paintTracer\(projectedTrajectory, flightSeconds, current\)/);
  assert.match(source, /applyMovingTargetAimForgiveness\(physicalPhysics, \{/);
  assert.match(source, /moving: releaseMotion\.moving/);
  assert.match(source, /velocityPerSecond: releaseMotion\.velocityMps/);
  assert.match(source, /aimAssistApplied: forgiveness\.applied/);
  assert.match(css, /\.rw-hunt-tracer/);
});


test("stamina warning pulse accelerates toward depletion while draw milestones pulse green", async () => {
  const source = await readFile(new URL("../modules/regionwright-hunting-gathering/hunting.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.match(source, /const warning = percent <= 50/);
  assert.match(source, /const urgency = Math\.max\(0, Math\.min\(1, \(50 - percent\) \/ 50\)\)/);
  assert.match(source, /const pulseMs = Math\.round\(1100 - \(750 \* urgency\)\)/);
  assert.match(source, /--rw-stamina-pulse-ms/);
  assert.match(source, /percent <= 15 \? "critical" : warning \? "strained" : "normal"/);
  assert.match(css, /rw-hunt-stamina-pulse var\(--rw-stamina-pulse-ms, 900ms\)/);
  assert.match(css, /var\(--color-level-error, #b94a48\)/);
  assert.match(css, /rw-hunt-draw-track > b\.reached[\s\S]*var\(--color-level-success, #6aa84f\)/);
  assert.match(css, /rw-hunt-draw-pulse[\s\S]*var\(--color-level-success, #6aa84f\)/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*rw-hunt-stamina/);
});

