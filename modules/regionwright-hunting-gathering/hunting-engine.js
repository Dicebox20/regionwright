export const HUNTING_VERSION = 1;
export const HUNTING_BOW_FLAG = "huntingBow";
export const HUNTING_BOW_ID = "hunting-bow";
export const HUNTING_BOW_NAME = "Hunting Bow";
export const FULL_DRAW_MS = 2500;
export const DRAW_TIME_LINEAR_WEIGHT = 0;
export const DRAW_TIME_POWER = 2;
export const DRAW_MILESTONES = Object.freeze([0.5, 0.75, 1]);
export const STAMINA_MAX = 100;
export const STAMINA_DRAW_BASE_DRAIN_PER_SEC = 1;
export const STAMINA_DRAW_EXTRA_DRAIN_PER_SEC = 23;
export const STAMINA_RECOVERY_PER_SEC = 24;
export const STAMINA_RECOVERY_DELAY_MS = 600;
export const FATIGUE_START_MS = FULL_DRAW_MS + 1000;
export const FULL_DRAW_SPEED_MPS = 74.5;
export const MPS_TO_FPS = 3.280839895013123;
export const BOW_SIGHT_PINS_YARDS = Object.freeze([20, 30, 40, 50, 60]);
export const SIGHT_HEIGHT_M = 0.07;
export const ARROW_DRAG_KAPPA_M_INV = 0.00231;
export const GRAVITY_MPS2 = 9.80665;
export const DEER_WIDTH_M = 1.8;
export const DEER_HEIGHT_M = 1.5;
export const MOVING_AIM_ASSIST_MAX_M = 0.12;
export const BALLISTICS_LAB_RANGES_YARDS = Object.freeze([18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]);
export const BALLISTICS_LAB_DRAW_STRENGTHS = Object.freeze([0.5, 0.75, 0.9, 1]);
export const BALLISTICS_LAB_AIMING_MODES = Object.freeze(["traditional", "holdover", "pin", "zero"]);
export const BALLISTIC_PROFILES = Object.freeze({
  current: Object.freeze({
    id: "current",
    label: "Current Hybrid",
    arrowMassKg: 0.02062,
    fullDrawSpeedMps: FULL_DRAW_SPEED_MPS,
    kappa: ARROW_DRAG_KAPPA_M_INV,
    sightHeightM: SIGHT_HEIGHT_M,
    note: "Live Hunting exterior constants; 20.62 g mass is a diagnostic proxy inherited from the Meyer reference, not a live Hunting mass parameter."
  }),
  meyer: Object.freeze({
    id: "meyer",
    label: "Meyer Reference",
    arrowMassKg: 0.02062,
    fullDrawSpeedMps: 74.5,
    kappa: 0.00231,
    sightHeightM: 0.07,
    note: "Modern compound/carbon-arrow experimental reference: 20.62 g, 74.5 m/s, kappa 0.00231 m^-1."
  }),
  warbow: Object.freeze({
    id: "warbow",
    label: "Heavy Warbow Reference",
    arrowMassKg: 0.085,
    fullDrawSpeedMps: 55.1,
    kappa: 0.00231,
    sightHeightM: 0.07,
    note: "160 lb self-yew / 85 g war-arrow launch reference at 55.1 m/s. Drag kappa is provisional and intentionally reuses 0.00231 m^-1 until fitted from the downrange dataset."
  })
});
export const DEER_MOTION_MIN_WALK_MS = 3200;
export const DEER_MOTION_WALK_VARIANCE_MS = 700;
export const DEER_MOTION_MIN_PAUSE_MS = 1500;
export const DEER_MOTION_PAUSE_VARIANCE_MS = 800;
export const DEER_MOTION_LANE_M = 4.8;
export function projectDeerCenterU(positionM, { arenaWidthPx, targetWidthPx } = {}) {
  const arenaWidth = Number(arenaWidthPx);
  const targetWidth = Number(targetWidthPx);
  if (!(arenaWidth > 0) || !(targetWidth > 0)) return 0.5;
  const pixelsPerMeter = targetWidth / DEER_WIDTH_M;
  const halfU = Math.min(0.49, (targetWidth / 2) / arenaWidth);
  const projected = 0.5 + (((Number(positionM) || 0) * pixelsPerMeter) / arenaWidth);
  return clamp(projected, halfU, 1 - halfU);
}
export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

export const QUARRY_TIERS = Object.freeze([
  Object.freeze({ id: "poor", min: -Infinity, max: 5, label: "Sparse Signs", quarry: Object.freeze({ id: "young-whitetail-doe", name: "Young Whitetail Doe", meatLb: 32, hide: 1, antlers: 0 }) }),
  Object.freeze({ id: "common", min: 6, max: 9, label: "Common Game", quarry: Object.freeze({ id: "whitetail-doe", name: "Whitetail Doe", meatLb: 46, hide: 1, antlers: 0 }) }),
  Object.freeze({ id: "good", min: 10, max: 13, label: "Good Signs", quarry: Object.freeze({ id: "whitetail-buck", name: "Whitetail Buck", meatLb: 58, hide: 1, antlers: 2 }) }),
  Object.freeze({ id: "uncommon", min: 14, max: 17, label: "Strong Trail", quarry: Object.freeze({ id: "mature-whitetail-buck", name: "Mature Whitetail Buck", meatLb: 68, hide: 1, antlers: 2 }) }),
  Object.freeze({ id: "rare", min: 18, max: 21, label: "Exceptional Signs", quarry: Object.freeze({ id: "large-whitetail-buck", name: "Large Whitetail Buck", meatLb: 78, hide: 1, antlers: 2 }) }),
  Object.freeze({ id: "exceptional", min: 22, max: Infinity, label: "Trophy Trail", quarry: Object.freeze({ id: "trophy-whitetail-buck", name: "Trophy Whitetail Buck", meatLb: 88, hide: 1, antlers: 2 }) })
]);

export function quarryTierForSurvival(total) {
  const value = Number(total);
  const score = Number.isFinite(value) ? value : 0;
  return QUARRY_TIERS.find(tier => score >= tier.min && score <= tier.max) ?? QUARRY_TIERS[0];
}

export const STEALTH_RANGES = Object.freeze([
  Object.freeze({ min: -Infinity, max: 5, yards: 65, label: "Long shot" }),
  Object.freeze({ min: 6, max: 9, yards: 55, label: "Distant shot" }),
  Object.freeze({ min: 10, max: 13, yards: 45, label: "Moderate shot" }),
  Object.freeze({ min: 14, max: 17, yards: 35, label: "Good approach" }),
  Object.freeze({ min: 18, max: 21, yards: 25, label: "Close approach" }),
  Object.freeze({ min: 22, max: Infinity, yards: 18, label: "Exceptional approach" })
]);

export function distanceForStealth(total) {
  const value = Number(total);
  const score = Number.isFinite(value) ? value : 0;
  return STEALTH_RANGES.find(entry => score >= entry.min && score <= entry.max) ?? STEALTH_RANGES[0];
}

export function targetWidthForDistance(distanceYards, { referenceYards = 35, referencePixels = 230, minPixels = 108, maxPixels = 420 } = {}) {
  const distance = clamp(distanceYards, 5, 200);
  return clamp(referencePixels * referenceYards / distance, minPixels, maxPixels);
}

function seededUnit(seed, salt = "") {
  let hash = 2166136261;
  for (const character of `${seed}:${salt}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}
export function deerMovementProfile(seed = "hunt") {
  const walkMs = DEER_MOTION_MIN_WALK_MS + Math.round(seededUnit(seed, "walk") * DEER_MOTION_WALK_VARIANCE_MS);
  const pauseMs = DEER_MOTION_MIN_PAUSE_MS + Math.round(seededUnit(seed, "pause") * DEER_MOTION_PAUSE_VARIANCE_MS);
  const cycleMs = 2 * (walkMs + pauseMs);
  const phaseOffsetMs = Math.round(seededUnit(seed, "phase") * cycleMs);
  const reverse = seededUnit(seed, "direction") < 0.5;
  return Object.freeze({ walkMs, pauseMs, cycleMs, phaseOffsetMs, reverse });
}
function smoothstep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - (2 * t));
}
export function deerMotionAtMs(elapsedMs, profile = deerMovementProfile()) {
  const walkMs = Math.max(1, Number(profile?.walkMs) || DEER_MOTION_MIN_WALK_MS);
  const pauseMs = Math.max(0, Number(profile?.pauseMs) || DEER_MOTION_MIN_PAUSE_MS);
  const cycleMs = Math.max(1, Number(profile?.cycleMs) || (2 * (walkMs + pauseMs)));
  const phaseOffsetMs = Number(profile?.phaseOffsetMs) || 0;
  const raw = ((Math.max(0, Number(elapsedMs) || 0) + phaseOffsetMs) % cycleMs + cycleMs) % cycleMs;
  let position;
  let facing;
  let moving;
  let velocityPerSecond = 0;
  let phase;
  if (raw < walkMs) {
    const p = raw / walkMs;
    const eased = smoothstep01(p);
    position = eased;
    facing = 1;
    moving = true;
    velocityPerSecond = (6 * p * (1 - p)) * (1000 / walkMs);
    phase = "walk-right";
  } else if (raw < walkMs + pauseMs) {
    position = 1;
    facing = 1;
    moving = false;
    phase = "pause-right";
  } else if (raw < (2 * walkMs) + pauseMs) {
    const local = raw - walkMs - pauseMs;
    const p = local / walkMs;
    const eased = smoothstep01(p);
    position = 1 - eased;
    facing = -1;
    moving = true;
    velocityPerSecond = -(6 * p * (1 - p)) * (1000 / walkMs);
    phase = "walk-left";
  } else {
    position = 0;
    facing = -1;
    moving = false;
    phase = "pause-left";
  }
  if (profile?.reverse) {
    position = 1 - position;
    facing *= -1;
    velocityPerSecond *= -1;
    phase = phase.endsWith("-right")
      ? phase.replace(/-right$/, "-left")
      : phase.endsWith("-left")
        ? phase.replace(/-left$/, "-right")
        : phase;
  }
  const positionM = (position - 0.5) * DEER_MOTION_LANE_M;
  const velocityMps = velocityPerSecond * DEER_MOTION_LANE_M;
  return Object.freeze({ position, positionM, facing, moving, velocityPerSecond, velocityMps, phase, elapsedInCycleMs: raw });
}
export function adjustImpactForTargetMovement(impact, targetDeltaM = 0) {
  const delta = Number(targetDeltaM) || 0;
  return Object.freeze({ ...impact, impactXM: (Number(impact?.impactXM) || 0) - delta, targetDeltaM: delta });
}

export function drawElapsedMsForStrength(drawStrength) {
  const strength = clamp(drawStrength, 0, 1);
  const linearWeight = clamp(DRAW_TIME_LINEAR_WEIGHT, 0, 1);
  const poweredWeight = 1 - linearWeight;
  return FULL_DRAW_MS * ((linearWeight * strength) + (poweredWeight * Math.pow(strength, DRAW_TIME_POWER)));
}
export function drawStrengthForMs(drawMs) {
  const target = clamp(Number(drawMs) / FULL_DRAW_MS, 0, 1);
  if (target <= 0) return 0;
  if (target >= 1) return 1;
  const linearWeight = clamp(DRAW_TIME_LINEAR_WEIGHT, 0, 1);
  const poweredWeight = 1 - linearWeight;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 28; index += 1) {
    const mid = (low + high) / 2;
    const normalizedTime = (linearWeight * mid) + (poweredWeight * Math.pow(mid, DRAW_TIME_POWER));
    if (normalizedTime < target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function drawForceFractionForStrength(drawStrength) {
  const strength = clamp(drawStrength, 0, 1);
  const linearWeight = clamp(DRAW_TIME_LINEAR_WEIGHT, 0, 1);
  const poweredWeight = 1 - linearWeight;
  const exponent = Math.max(1, Number(DRAW_TIME_POWER) || 1);
  const force = linearWeight + (poweredWeight * exponent * Math.pow(strength, exponent - 1));
  const fullDrawForce = linearWeight + (poweredWeight * exponent);
  return clamp(force / fullDrawForce, 0, 1);
}
export function storedEnergyFractionForDrawStrength(drawStrength) {
  const strength = clamp(drawStrength, 0, 1);
  if (strength <= 0) return 0;
  if (strength >= 1) return 1;
  return clamp(drawElapsedMsForStrength(strength) / FULL_DRAW_MS, 0, 1);
}
export function arrowSpeedForDraw(drawStrength) {
  const energyFraction = storedEnergyFractionForDrawStrength(drawStrength);
  return FULL_DRAW_SPEED_MPS * Math.sqrt(energyFraction);
}
export function mpsToFps(speedMps) {
  return Math.max(0, Number(speedMps) || 0) * MPS_TO_FPS;
}

export function ballisticProfile(profileId = "current") {
  return BALLISTIC_PROFILES[profileId] ?? BALLISTIC_PROFILES.current;
}
export function kineticEnergyJoules(massKg, speedMps) {
  const mass = Math.max(0, Number(massKg) || 0);
  const speed = Math.max(0, Number(speedMps) || 0);
  return 0.5 * mass * speed * speed;
}
export function profileArrowSpeedForDraw(profileOrId = "current", drawStrength = 1) {
  const profile = typeof profileOrId === "string" ? ballisticProfile(profileOrId) : (profileOrId ?? BALLISTIC_PROFILES.current);
  return Math.max(0.1, Number(profile.fullDrawSpeedMps) || FULL_DRAW_SPEED_MPS) * Math.sqrt(storedEnergyFractionForDrawStrength(drawStrength));
}

export function staminaDrainPerSecond(drawStrength) {
  const strength = clamp(drawStrength, 0, 1);
  return STAMINA_DRAW_BASE_DRAIN_PER_SEC + (STAMINA_DRAW_EXTRA_DRAIN_PER_SEC * strength * strength);
}
export function staminaAfterDrawing(stamina, drawStrength, elapsedMs) {
  const current = clamp(stamina, 0, STAMINA_MAX);
  const seconds = Math.max(0, Number(elapsedMs) || 0) / 1000;
  return clamp(current - (staminaDrainPerSecond(drawStrength) * seconds), 0, STAMINA_MAX);
}
export function staminaAfterRecovery(stamina, elapsedMs) {
  const current = clamp(stamina, 0, STAMINA_MAX);
  const seconds = Math.max(0, Number(elapsedMs) || 0) / 1000;
  return clamp(current + (STAMINA_RECOVERY_PER_SEC * seconds), 0, STAMINA_MAX);
}

export function fatigueForDrawMs(drawMs) {
  const elapsed = Math.max(0, Number(drawMs) || 0);
  if (elapsed <= FATIGUE_START_MS) return 0;
  return clamp((elapsed - FATIGUE_START_MS) / 2200, 0, 1);
}

export function swayOffsetAtMs(elapsedMs, drawMs = 0) {
  const t = Math.max(0, Number(elapsedMs) || 0) / 1000;
  const fatigue = fatigueForDrawMs(drawMs);
  const amplitude = 3.2 + (fatigue * 18);
  const x = (Math.sin(t * 3.1) + 0.46 * Math.sin((t * 6.7) + 1.4)) * amplitude;
  const y = (0.82 * Math.cos((t * 2.7) + 0.5) + 0.38 * Math.sin((t * 5.3) + 2.1)) * amplitude;
  return Object.freeze({ x, y, fatigue, amplitude });
}

export function mphToMps(mph) {
  return (Number(mph) || 0) * 0.44704;
}

export function yardsToMeters(yards) {
  return (Number(yards) || 0) * 0.9144;
}

export function sightPinForDistance(distanceYards) {
  const distance = Math.max(0, Number(distanceYards) || 0);
  let pin = BOW_SIGHT_PINS_YARDS[0];
  for (const candidate of BOW_SIGHT_PINS_YARDS) {
    if (candidate <= distance) pin = candidate;
    else break;
  }
  return pin;
}

function rk4Derivative(state, { windMps = 0, gravity = GRAVITY_MPS2, kappa = ARROW_DRAG_KAPPA_M_INV } = {}) {
  const [x, y, z, vx, vy, vz] = state;
  const rvx = vx - windMps;
  const rvy = vy;
  const rvz = vz;
  const relativeSpeed = Math.hypot(rvx, rvy, rvz);
  const drag = Math.max(0, Number(kappa) || 0) * relativeSpeed;
  return [vx, vy, vz, -drag * rvx, -Math.max(0, Number(gravity) || GRAVITY_MPS2) - (drag * rvy), -drag * rvz];
}

function rk4Step(state, dt, options) {
  const scaleAdd = (base, derivative, scale) => base.map((value, index) => value + derivative[index] * scale);
  const k1 = rk4Derivative(state, options);
  const k2 = rk4Derivative(scaleAdd(state, k1, dt / 2), options);
  const k3 = rk4Derivative(scaleAdd(state, k2, dt / 2), options);
  const k4 = rk4Derivative(scaleAdd(state, k3, dt), options);
  return state.map((value, index) => value + (dt / 6) * (k1[index] + (2 * k2[index]) + (2 * k3[index]) + k4[index]));
}

export function simulateArrowShot({
  distanceYards,
  speedMps,
  launchElevationRadians = 0,
  launchAzimuthRadians = 0,
  windMph = 0,
  gravity = GRAVITY_MPS2,
  kappa = ARROW_DRAG_KAPPA_M_INV,
  sightHeightM = SIGHT_HEIGHT_M,
  stepSeconds = 1 / 240,
  sampleEverySeconds = 1 / 60,
  collectSamples = true
} = {}) {
  const distanceM = Math.max(0.1, yardsToMeters(distanceYards));
  const speed = Math.max(0.1, Number(speedMps) || 0.1);
  const cosElevation = Math.cos(launchElevationRadians);
  let state = [
    0,
    -Math.max(0, Number(sightHeightM) || 0),
    0,
    speed * cosElevation * Math.sin(launchAzimuthRadians),
    speed * Math.sin(launchElevationRadians),
    speed * cosElevation * Math.cos(launchAzimuthRadians)
  ];
  let previous = state;
  let elapsed = 0;
  const dt = clamp(stepSeconds, 1 / 1000, 1 / 60);
  const sampleDt = clamp(sampleEverySeconds, dt, 0.1);
  const options = { windMps: mphToMps(windMph), gravity, kappa };
  const samples = [];
  const freezeSample = (source, timeSeconds) => Object.freeze({
    timeSeconds,
    xM: source[0],
    yM: source[1],
    zM: source[2],
    vxMps: source[3],
    vyMps: source[4],
    vzMps: source[5],
    speedMps: Math.hypot(source[3], source[4], source[5])
  });
  if (collectSamples) samples.push(freezeSample(state, 0));
  let nextSampleAt = sampleDt;
  while (state[2] < distanceM && elapsed < 5) {
    previous = state;
    state = rk4Step(state, dt, options);
    elapsed += dt;
    if (state[2] <= previous[2]) break;
    if (collectSamples && elapsed + 1e-9 >= nextSampleAt && state[2] < distanceM) {
      samples.push(freezeSample(state, elapsed));
      nextSampleAt += sampleDt;
    }
  }
  const dz = state[2] - previous[2];
  const fraction = dz > 0 ? clamp((distanceM - previous[2]) / dz, 0, 1) : 0;
  const crossing = previous.map((value, index) => value + ((state[index] - value) * fraction));
  const crossingTime = Math.max(0, elapsed - dt + (dt * fraction));
  const impact = Object.freeze({
    xM: crossing[0],
    yM: crossing[1],
    zM: distanceM,
    vxMps: crossing[3],
    vyMps: crossing[4],
    vzMps: crossing[5],
    speedMps: Math.hypot(crossing[3], crossing[4], crossing[5]),
    timeSeconds: crossingTime
  });
  if (collectSamples) {
    const last = samples[samples.length - 1];
    if (!last || Math.abs(last.timeSeconds - crossingTime) > 1e-9) samples.push(Object.freeze({ ...impact }));
  }
  return Object.freeze({ distanceM, impact, samples: Object.freeze(samples) });
}

export function simulateArrowToDistance(options = {}) {
  return simulateArrowShot({ ...options, collectSamples: false }).impact;
}

export function sampleArrowTrajectoryToDistance(options = {}) {
  return simulateArrowShot({ ...options, collectSamples: true });
}

const launchElevationCache = new Map();
export function launchElevationForTarget({
  distanceYards,
  targetYM = 0,
  speedMps = FULL_DRAW_SPEED_MPS,
  gravity = GRAVITY_MPS2,
  kappa = ARROW_DRAG_KAPPA_M_INV,
  sightHeightM = SIGHT_HEIGHT_M
} = {}) {
  const distance = Math.max(1, Number(distanceYards) || BOW_SIGHT_PINS_YARDS[0]);
  const target = Number(targetYM) || 0;
  const speed = Math.max(0.1, Number(speedMps) || FULL_DRAW_SPEED_MPS);
  const cacheKey = `${distance}|${target}|${speed}|${gravity}|${kappa}|${sightHeightM}`;
  if (launchElevationCache.has(cacheKey)) return launchElevationCache.get(cacheKey);
  let low = -0.15;
  let high = 0.5;
  for (let index = 0; index < 42; index += 1) {
    const mid = (low + high) / 2;
    const result = simulateArrowToDistance({
      distanceYards: distance,
      speedMps: speed,
      launchElevationRadians: mid,
      windMph: 0,
      gravity,
      kappa,
      sightHeightM
    });
    if (result.yM < target) low = mid;
    else high = mid;
  }
  const solved = (low + high) / 2;
  launchElevationCache.set(cacheKey, solved);
  return solved;
}
export function sightAngleForZero({
  zeroYards,
  fullDrawSpeedMps = FULL_DRAW_SPEED_MPS,
  gravity = GRAVITY_MPS2,
  kappa = ARROW_DRAG_KAPPA_M_INV,
  sightHeightM = SIGHT_HEIGHT_M
} = {}) {
  return launchElevationForTarget({
    distanceYards: zeroYards,
    targetYM: 0,
    speedMps: fullDrawSpeedMps,
    gravity,
    kappa,
    sightHeightM
  });
}

export function calculateArrowImpact({
  distanceYards,
  drawStrength,
  aimXM = 0,
  aimYM = 0,
  windMph = 0,
  gravity = GRAVITY_MPS2,
  kappa = ARROW_DRAG_KAPPA_M_INV,
  sightHeightM = SIGHT_HEIGHT_M,
  sightPinYards = sightPinForDistance(distanceYards),
  aimingMode = "pin"
} = {}) {
  const distanceM = Math.max(0.1, yardsToMeters(distanceYards));
  const speedMps = arrowSpeedForDraw(drawStrength);
  const mode = aimingMode === "holdover" ? "holdover" : "pin";
  const playerAzimuth = Math.atan2(Number(aimXM) || 0, distanceM);
  const playerElevation = Math.atan2(Number(aimYM) || 0, distanceM);
  const elevationRadians = mode === "holdover"
    ? launchElevationForTarget({
      distanceYards,
      targetYM: aimYM,
      speedMps,
      gravity,
      kappa,
      sightHeightM
    })
    : playerElevation + sightAngleForZero({
      zeroYards: sightPinYards,
      fullDrawSpeedMps: FULL_DRAW_SPEED_MPS,
      gravity,
      kappa,
      sightHeightM
    });
  const sightAngleRadians = elevationRadians - playerElevation;
  const result = simulateArrowToDistance({
    distanceYards,
    speedMps,
    launchElevationRadians: elevationRadians,
    launchAzimuthRadians: playerAzimuth,
    windMph,
    gravity,
    kappa,
    sightHeightM
  });
  const calmResult = simulateArrowToDistance({
    distanceYards,
    speedMps,
    launchElevationRadians: elevationRadians,
    launchAzimuthRadians: playerAzimuth,
    windMph: 0,
    gravity,
    kappa,
    sightHeightM
  });
  const windDriftM = result.xM - calmResult.xM;
  const verticalErrorM = result.yM - (Number(aimYM) || 0);
  return Object.freeze({
    distanceM,
    launchSpeedMps: speedMps,
    impactSpeedMps: result.speedMps,
    timeSeconds: result.timeSeconds,
    windDriftM,
    verticalErrorM,
    impactXM: result.xM,
    impactYM: result.yM,
    azimuthRadians: playerAzimuth,
    playerElevationRadians: playerElevation,
    sightAngleRadians,
    elevationRadians,
    aimingMode: mode,
    sightPinYards: mode === "holdover" ? null : sightPinYards,
    sightHeightM,
    kappa
  });
}

export function simulateBallisticsLabShot({
  profileId = "current",
  distanceYards = 35,
  drawStrength = 1,
  aimingMode = "pin",
  explicitZeroYards = 30,
  gravity = GRAVITY_MPS2
} = {}) {
  const profile = ballisticProfile(profileId);
  const distance = Math.max(1, Number(distanceYards) || 35);
  const strength = clamp(drawStrength, 0.01, 1);
  const mode = BALLISTICS_LAB_AIMING_MODES.includes(aimingMode) ? aimingMode : "pin";
  const speedMps = profileArrowSpeedForDraw(profile, strength);
  const sightZeroYards = mode === "pin"
    ? sightPinForDistance(distance)
    : mode === "zero"
      ? Math.max(1, Number(explicitZeroYards) || 30)
      : null;
  const holdoverRangeYards = mode === "holdover" ? distance : null;
  const elevationRadians = mode === "holdover"
    ? launchElevationForTarget({
      distanceYards: distance,
      targetYM: 0,
      speedMps,
      gravity,
      kappa: profile.kappa,
      sightHeightM: profile.sightHeightM
    })
    : sightZeroYards === null
      ? 0
      : sightAngleForZero({
        zeroYards: sightZeroYards,
        fullDrawSpeedMps: profile.fullDrawSpeedMps,
        gravity,
        kappa: profile.kappa,
        sightHeightM: profile.sightHeightM
      });
  const actual = simulateArrowShot({
    distanceYards: distance,
    speedMps,
    launchElevationRadians: elevationRadians,
    launchAzimuthRadians: 0,
    windMph: 0,
    gravity,
    kappa: profile.kappa,
    sightHeightM: profile.sightHeightM,
    collectSamples: true
  });
  const rawHorizontal = simulateArrowShot({
    distanceYards: distance,
    speedMps,
    launchElevationRadians: 0,
    launchAzimuthRadians: 0,
    windMph: 0,
    gravity,
    kappa: profile.kappa,
    sightHeightM: 0,
    collectSamples: false
  });
  return Object.freeze({
    profile,
    distanceYards: distance,
    drawStrength: strength,
    aimingMode: mode,
    sightZeroYards,
    holdoverRangeYards,
    launchSpeedMps: speedMps,
    launchSpeedFps: mpsToFps(speedMps),
    launchKineticEnergyJ: kineticEnergyJoules(profile.arrowMassKg, speedMps),
    impactSpeedMps: actual.impact.speedMps,
    impactSpeedFps: mpsToFps(actual.impact.speedMps),
    impactKineticEnergyJ: kineticEnergyJoules(profile.arrowMassKg, actual.impact.speedMps),
    flightTimeSeconds: actual.impact.timeSeconds,
    elevationRadians,
    elevationDegrees: elevationRadians * 180 / Math.PI,
    rawHorizontalFallM: -rawHorizontal.impact.yM,
    pointOfAimErrorM: actual.impact.yM,
    trajectory: actual
  });
}

export const DEER_HIT_ZONES = Object.freeze([
  Object.freeze({ id: "heart", label: "Heart", lethal: true, quality: "perfect", cx: 79, cy: 88, rx: 8, ry: 9 }),
  Object.freeze({ id: "lungs", label: "Lungs", lethal: true, quality: "clean", cx: 91, cy: 78, rx: 23, ry: 18 }),
  Object.freeze({ id: "head-neck", label: "Head / Neck", lethal: true, quality: "rough", cx: 145, cy: 54, rx: 22, ry: 19 }),
  Object.freeze({ id: "body", label: "Body", lethal: false, quality: "wounded", cx: 92, cy: 82, rx: 50, ry: 29 }),
  Object.freeze({ id: "front-leg", label: "Front Leg", lethal: false, quality: "wounded", cx: 120, cy: 119, rx: 12, ry: 31 }),
  Object.freeze({ id: "rear-leg", label: "Rear Leg", lethal: false, quality: "wounded", cx: 58, cy: 118, rx: 13, ry: 31 })
]);
export const DEER_TEST_HIT_ZONES = Object.freeze([
  Object.freeze({ id: "heart", label: "Heart", lethal: true, quality: "perfect", cx: 113, cy: 91, rx: 7, ry: 8, anatomyClass: "heart" }),
  Object.freeze({ id: "lungs", label: "Lungs", lethal: true, quality: "clean", cx: 105, cy: 79, rx: 23, ry: 18, anatomyClass: "lungs" }),
  Object.freeze({ id: "head-neck", label: "Head / Neck", lethal: true, quality: "rough", cx: 145, cy: 54, rx: 22, ry: 19, anatomyClass: "head-neck" }),
  Object.freeze({ id: "abdomen", label: "Abdomen / Gut", lethal: false, quality: "wounded", cx: 67, cy: 84, rx: 27, ry: 22, anatomyClass: "abdomen" }),
  Object.freeze({ id: "body", label: "Body", lethal: false, quality: "wounded", cx: 92, cy: 82, rx: 50, ry: 29, anatomyClass: "body" }),
  Object.freeze({ id: "front-leg", label: "Front Leg", lethal: false, quality: "wounded", cx: 120, cy: 119, rx: 12, ry: 31, anatomyClass: "leg" }),
  Object.freeze({ id: "rear-leg", label: "Rear Leg", lethal: false, quality: "wounded", cx: 58, cy: 118, rx: 13, ry: 31, anatomyClass: "leg" })
]);

function insideEllipse(x, y, zone) {
  const dx = (x - zone.cx) / zone.rx;
  const dy = (y - zone.cy) / zone.ry;
  return (dx * dx) + (dy * dy) <= 1;
}

export function deerPointForImpact({ impactXM = 0, impactYM = 0 } = {}) {
  return Object.freeze({
    x: 90 + ((Number(impactXM) || 0) / DEER_WIDTH_M) * 180,
    y: 75 - ((Number(impactYM) || 0) / DEER_HEIGHT_M) * 150
  });
}

export function classifyDeerImpact(impact, { facing = 1, zones = DEER_HIT_ZONES } = {}) {
  const point = deerPointForImpact(impact);
  const anatomyPoint = Number(facing) < 0 ? { x: 180 - point.x, y: point.y } : point;
  const zoneSet = Array.isArray(zones) ? zones : DEER_HIT_ZONES;
  const zone = zoneSet.find(candidate => insideEllipse(anatomyPoint.x, anatomyPoint.y, candidate));
  return Object.freeze({
    point,
    anatomyPoint: Object.freeze({ x: anatomyPoint.x, y: anatomyPoint.y }),
    zone: zone?.id ?? "miss",
    label: zone?.label ?? "Miss",
    lethal: Boolean(zone?.lethal),
    quality: zone?.quality ?? "miss"
  });
}

export function applyMovingTargetAimForgiveness(impact, {
  facing = 1,
  moving = false,
  velocityPerSecond = 0,
  aimXM = 0,
  maxCorrectionM = MOVING_AIM_ASSIST_MAX_M,
  zones = DEER_HIT_ZONES
} = {}) {
  const physicalHit = classifyDeerImpact(impact, { facing, zones });
  const velocity = Number(velocityPerSecond) || 0;
  const aim = Number(aimXM) || 0;
  const maxCorrection = clamp(Number(maxCorrectionM) || 0, 0, MOVING_AIM_ASSIST_MAX_M);
  const direction = Math.sign(velocity);
  if (!moving || direction === 0 || maxCorrection <= 0 || physicalHit.zone !== "miss") {
    return Object.freeze({ impact, hit: physicalHit, applied: false, correctionM: 0 });
  }
  if (Math.sign(aim) !== direction || Math.abs(aim) < 0.03) {
    return Object.freeze({ impact, hit: physicalHit, applied: false, correctionM: 0 });
  }
  for (let correction = 0.01; correction <= maxCorrection + 1e-9; correction += 0.01) {
    const correctionM = Math.min(maxCorrection, Number(correction.toFixed(2)));
    const candidateImpact = Object.freeze({
      ...impact,
      impactXM: (Number(impact?.impactXM) || 0) + (direction * correctionM),
      aimAssistCorrectionM: direction * correctionM
    });
    const candidateHit = classifyDeerImpact(candidateImpact, { facing, zones });
    if (candidateHit.zone !== "miss") {
      return Object.freeze({ impact: candidateImpact, hit: candidateHit, applied: true, correctionM: direction * correctionM });
    }
  }
  return Object.freeze({ impact, hit: physicalHit, applied: false, correctionM: 0 });
}

export function harvestForSurvival({ total, quarry, shotQuality = "clean" } = {}) {
  const score = Number.isFinite(Number(total)) ? Number(total) : 0;
  const specimen = quarry ?? QUARRY_TIERS[2].quarry;
  const skillEfficiency = score < 6 ? 0.4 : score < 10 ? 0.6 : score < 15 ? 0.8 : 1;
  const shotEfficiency = shotQuality === "perfect" ? 1 : shotQuality === "clean" ? 0.95 : shotQuality === "rough" ? 0.82 : 0.55;
  const efficiency = clamp(skillEfficiency * shotEfficiency, 0, 1);
  const meatLb = Math.max(1, Math.floor(specimen.meatLb * efficiency));
  const hide = score >= 10 && shotQuality !== "wounded" ? Number(specimen.hide ?? 0) : 0;
  const antlers = score >= 15 ? Number(specimen.antlers ?? 0) : 0;
  const rank = score < 6 ? "Botched" : score < 10 ? "Poor" : score < 15 ? "Serviceable" : score < 20 ? "Clean" : "Expert";
  return Object.freeze({ rank, efficiency, meatLb, hide, antlers });
}

export function deterministicWind(seed = "hunt") {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = ((hash >>> 0) / 4294967295) * 2 - 1;
  const mph = Math.round(normalized * 12);
  return Object.freeze({ mph, label: mph === 0 ? "Calm" : `${Math.abs(mph)} mph ${mph < 0 ? "left" : "right"}` });
}
