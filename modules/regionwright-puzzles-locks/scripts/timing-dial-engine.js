export const TIMING_DIAL_VERSION = 1;

export const TIMING_DIFFICULTIES = Object.freeze([
  Object.freeze({ id: 0, label: "Easy", speed: 115, window: 76 }),
  Object.freeze({ id: 1, label: "Standard", speed: 165, window: 54 }),
  Object.freeze({ id: 2, label: "Hard", speed: 235, window: 34 }),
  Object.freeze({ id: 3, label: "Expert", speed: 325, window: 22 })
]);

function hash(value) {
  let state = 2166136261;
  for (const character of String(value)) { state ^= character.charCodeAt(0); state = Math.imul(state, 16777619); }
  return state >>> 0;
}
function random(seed) {
  let state = hash(seed) || 1;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeAngle = value => ((Number(value) % 360) + 360) % 360;

export function timingDifficulty(value) {
  const id = clamp(Math.trunc(Number(value) || 0), 0, TIMING_DIFFICULTIES.length - 1);
  return TIMING_DIFFICULTIES[id];
}

export function circularDistance(first, second) {
  const difference = Math.abs(normalizeAngle(first) - normalizeAngle(second));
  return Math.min(difference, 360 - difference);
}

export function isTimingHit(step, angle) {
  const difficulty = timingDifficulty(step?.difficulty);
  return circularDistance(angle, step?.targetAngle) <= difficulty.window / 2;
}

export function createTimingDialConfig({ difficulties = [1], seed = "timing-dial" } = {}) {
  const requested = Array.isArray(difficulties) ? difficulties : [difficulties];
  const list = requested.slice(0, 8).map(value => timingDifficulty(value).id);
  if (!list.length) list.push(1);
  const next = random(seed);
  return Object.freeze({
    version: TIMING_DIAL_VERSION,
    seed: String(seed),
    steps: Object.freeze(list.map((difficulty, index) => Object.freeze({
      id: `stop-${index + 1}`,
      difficulty,
      targetAngle: Math.round((next() * 280) + 40)
    })))
  });
}

export function validateTimingDialConfig(config) {
  if (!config || typeof config !== "object" || Number(config.version) !== TIMING_DIAL_VERSION) throw new Error("This Timing Dial configuration is unsupported.");
  if (!Array.isArray(config.steps) || config.steps.length < 1 || config.steps.length > 8) throw new Error("Choose between one and eight timing stops.");
  const ids = new Set();
  const steps = config.steps.map((step, index) => {
    const id = String(step?.id ?? `stop-${index + 1}`).trim();
    if (!id || ids.has(id)) throw new Error("Each timing stop must be unique.");
    ids.add(id);
    const difficulty = timingDifficulty(step?.difficulty).id;
    const targetAngle = Number(step?.targetAngle);
    if (!Number.isFinite(targetAngle)) throw new Error("Each timing stop needs a valid target.");
    return Object.freeze({ id, difficulty, targetAngle: normalizeAngle(targetAngle) });
  });
  return Object.freeze({ version: TIMING_DIAL_VERSION, seed: String(config.seed ?? "timing-dial"), steps: Object.freeze(steps) });
}

export function timingPresentation(step) {
  const difficulty = timingDifficulty(step?.difficulty);
  return Object.freeze({ ...difficulty, targetAngle: normalizeAngle(step?.targetAngle) });
}
