export const MODULE_ID = "regionwright-hunting-gathering";
export const LEGACY_MODULE_ID = "regionwright-fishing";
const HISTORICAL_MODULE_ID = "regionwright";
import { FISH_MARKET_VALUE_RULES, fishingDifficultyForRarity, normalizeFishRarity, normalizePondTier, POND_TIERS } from "./fishing-rarity.js";

export const FISHING_VERSION = 3;
export const LEGACY_FISHING_VERSION = 1;
export const PREVIOUS_FISHING_VERSION = 2;
export const FISHING_REGION_FLAG = "fishingSpot";
export const FISHING_SOCKET = `module.${MODULE_ID}`;
export const DEFAULT_FISHING_POLE_NAME = "Fishing Pole";
export const DEFAULT_FISHING_TACKLE_NAME = "Fishing Tackle";

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sequence(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const DEFAULT_FISH = Object.freeze([
  Object.freeze({ id: "bluegill", name: "Bluegill", img: "modules/regionwright-hunting-gathering/assets/fishing/bluegill.svg", rarity: "common" }),
  Object.freeze({ id: "carp", name: "Common Carp", img: "modules/regionwright-hunting-gathering/assets/fishing/carp.svg", rarity: "common" }),
  Object.freeze({ id: "trout", name: "River Trout", img: "modules/regionwright-hunting-gathering/assets/fishing/trout.svg", rarity: "uncommon" }),
  Object.freeze({ id: "bass", name: "Largemouth Bass", img: "modules/regionwright-hunting-gathering/assets/fishing/bass.svg", rarity: "uncommon" }),
  Object.freeze({ id: "pike", name: "Northern Pike", img: "modules/regionwright-hunting-gathering/assets/fishing/pike.svg", rarity: "rare" }),
  Object.freeze({ id: "salmon", name: "Salmon", img: "modules/regionwright-hunting-gathering/assets/fishing/salmon.svg", rarity: "rare" })
]);

export function validateFish(fish) {
  if (!fish || typeof fish !== "object") throw new Error("Each fish needs an id, name, and image.");
  const id = String(fish.id ?? "").trim();
  const name = String(fish.name ?? "").trim();
  const img = String(fish.img ?? "").trim();
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(id)) throw new Error("Fish ids may contain only letters, numbers, hyphens, and underscores.");
  if (!name || name.length > 80) throw new Error("Fish names must be between one and eighty characters.");
  if (!img) throw new Error(`Fish ${name || id} needs an image path.`);
  const catchType = ["ration", "material", "utility"].includes(String(fish.catchType ?? "ration"))
    ? String(fish.catchType ?? "ration")
    : "ration";
  const ration = catchType === "ration"
    ? Math.max(0, Math.floor(Number(fish.ration ?? 1) || 0))
    : 0;
  const edibleEffect = String(fish.edibleEffect ?? (ration > 0 ? "No mechanical effect; this catch counts as food." : "Not intended as a ration."))
    .trim()
    .slice(0, 240);
  const purposes = Array.isArray(fish.purposes)
    ? fish.purposes.map(purpose => String(purpose ?? "").trim().slice(0, 80)).filter(Boolean).slice(0, 6)
    : [];
  const source = String(fish.source ?? "proposed homebrew").trim().slice(0, 80) || "proposed homebrew";
  const rarity = normalizeFishRarity(fish.rarity);
  return Object.freeze({ id, name, img, catchType, ration, rarity, edibleEffect, purposes, source });
}

export function createFishingCatalog(fish = DEFAULT_FISH) {
  if (!Array.isArray(fish) || fish.length < 1 || fish.length > 32) throw new Error("A fishing spot needs between one and thirty-two fish.");
  const ids = new Set();
  const catalog = fish.map(entry => {
    const normalized = validateFish(entry);
    if (ids.has(normalized.id)) throw new Error(`Fish id ${normalized.id} is duplicated.`);
    ids.add(normalized.id);
    return normalized;
  });
  return Object.freeze(catalog);
}

export function createFishingSpotConfig({ poleItemName = DEFAULT_FISHING_POLE_NAME, tackleItemName = DEFAULT_FISHING_TACKLE_NAME, baitItemName = "Bait", pondTier = "common", fish = DEFAULT_FISH } = {}) {
  const pole = String(poleItemName ?? "").trim() || DEFAULT_FISHING_POLE_NAME;
  const tackle = String(tackleItemName ?? "").trim() || DEFAULT_FISHING_TACKLE_NAME;
  const bait = String(baitItemName ?? "").trim() || "Bait";
  if (pole.length > 80 || tackle.length > 80 || bait.length > 80) throw new Error("Fishing gear names must be eighty characters or fewer.");
  return Object.freeze({
    version: FISHING_VERSION,
    enabled: true,
    poleItemName: pole,
    tackleItemName: tackle,
    baitItemName: bait,
    pondTier: normalizePondTier(pondTier),
    fish: createFishingCatalog(fish)
  });
}

export function validateFishingSpotConfig(config) {
  const version = Number(config?.version);
  if (!config || typeof config !== "object" || ![LEGACY_FISHING_VERSION, PREVIOUS_FISHING_VERSION, FISHING_VERSION].includes(version)) {
    throw new Error("This fishing spot configuration is unsupported.");
  }
  return createFishingSpotConfig({
    poleItemName: config.poleItemName,
    tackleItemName: config.tackleItemName,
    baitItemName: config.baitItemName,
    pondTier: config.pondTier,
    fish: config.fish
  });
}

export function createFishingChallenge({ seed = `${Date.now()}-${Math.random()}`, fishRarity = "common" } = {}) {
  const next = sequence(seed);
  const rarity = normalizeFishRarity(fishRarity);
  const difficulty = fishingDifficultyForRarity(rarity);
  return Object.freeze({
    version: FISHING_VERSION,
    seed: String(seed),
    fishRarity: rarity,
    bite: Object.freeze({
      total: 7,
      opensAt: Number((1.5 + (next() * 2.4)).toFixed(2)),
      window: 1.55
    }),
    fight: Object.freeze({
      duration: difficulty.duration,
      startTension: Number((34 + (next() * 10)).toFixed(2)),
      safeMin: 30,
      safeMax: 76,
      safeWidth: difficulty.safeWidth,
      safeInterval: 1.5,
      safeSpeedMin: difficulty.safeSpeedMin,
      safeSpeedMax: difficulty.safeSpeedMax,
      safeTurnChance: difficulty.safeTurnChance,
      safeTravel: difficulty.safeTravel,
      snap: 100,
      target: 100,
      fishPhase: Number((next() * 10).toFixed(2))
    })
  });
}

export function validateFishingChallenge(challenge) {
  if (!challenge || typeof challenge !== "object" || Number(challenge.version) !== FISHING_VERSION) throw new Error("This fishing challenge is unsupported.");
  const bite = challenge.bite;
  const fight = challenge.fight;
  if (!bite || !Number.isFinite(Number(bite.total)) || !Number.isFinite(Number(bite.opensAt)) || !Number.isFinite(Number(bite.window))) throw new Error("The fishing bite timer is invalid.");
  if (!fight || !Number.isFinite(Number(fight.duration)) || !Number.isFinite(Number(fight.startTension))) throw new Error("The fishing pressure challenge is invalid.");
  return Object.freeze({
    version: FISHING_VERSION,
    seed: String(challenge.seed ?? "fishing"),
    fishRarity: normalizeFishRarity(challenge.fishRarity),
    bite: Object.freeze({ total: clamp(bite.total, 1, 60), opensAt: clamp(bite.opensAt, 0, bite.total), window: clamp(bite.window, 0.2, bite.total) }),
    fight: Object.freeze({
      duration: clamp(fight.duration, 1, 120),
      startTension: clamp(fight.startTension, 0, 99),
      safeMin: clamp(fight.safeMin, 0, 99),
      safeMax: clamp(fight.safeMax, 1, 100),
      safeWidth: clamp(fight.safeWidth ?? (Number(fight.safeMax) - Number(fight.safeMin)), 10, 60),
      safeInterval: clamp(fight.safeInterval ?? 1.5, 0.75, 5),
      safeSpeedMin: clamp(fight.safeSpeedMin ?? 5, 1, 80),
      safeSpeedMax: clamp(fight.safeSpeedMax ?? 12, 1, 80),
      safeTurnChance: clamp(fight.safeTurnChance ?? 0.4, 0, 0.8),
      safeTravel: clamp(fight.safeTravel ?? 26, 0, 42),
      snap: clamp(fight.snap, 1, 100),
      target: clamp(fight.target, 1, 100),
      fishPhase: Number(fight.fishPhase) || 0
    })
  });
}

function seededUnit(value) {
  const raw = Math.sin((Number(value) || 0) * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function reflectPosition(position, direction, distance, minimum, maximum) {
  let next = position + (direction * distance);
  let nextDirection = direction;
  while (next < minimum || next > maximum) {
    if (next > maximum) {
      next = maximum - (next - maximum);
      nextDirection = -1;
    } else if (next < minimum) {
      next = minimum + (minimum - next);
      nextDirection = 1;
    }
  }
  return { position: next, direction: nextDirection };
}

function safeBandSpeed(config, intervalIndex) {
  return config.safeSpeedMin + (seededUnit(config.fishPhase + (intervalIndex * 17.17)) * (config.safeSpeedMax - config.safeSpeedMin));
}

function safeBandInterval(config, intervalIndex) {
  const variation = 0.65 + (seededUnit(config.fishPhase + 67.91 + (intervalIndex * 23.11)) * 0.7);
  return config.safeInterval * variation;
}

function movingSafeBand(config, elapsed) {
  const width = Math.min(config.safeWidth, 100);
  const travel = Math.min(config.safeTravel, Math.max(0, (100 - width) / 2 - 2));
  const minimum = -travel;
  const maximum = travel;
  let position = ((seededUnit(config.fishPhase + 19.73) * 2) - 1) * travel;
  let direction = seededUnit(config.fishPhase + 53.11) >= 0.5 ? 1 : -1;
  let remaining = Math.max(0, Number(elapsed) || 0);
  let intervalIndex = 0;
  let intervalElapsed = 0;
  let intervalDuration = safeBandInterval(config, intervalIndex);
  let speed = safeBandSpeed(config, intervalIndex);
  while (remaining > 0) {
    const intervalRemaining = intervalDuration - intervalElapsed;
    const segment = Math.min(remaining, intervalRemaining);
    speed = safeBandSpeed(config, intervalIndex);
    const moved = reflectPosition(position, direction, speed * segment, minimum, maximum);
    position = moved.position;
    direction = moved.direction;
    remaining -= segment;
    intervalElapsed += segment;
    if (intervalElapsed >= intervalDuration - 0.000001) {
      intervalIndex += 1;
      intervalElapsed = 0;
      intervalDuration = safeBandInterval(config, intervalIndex);
      // Sometimes turn before reaching an edge so the band doesn't simply
      // shuttle between the same endpoints for the whole fight.
      if (seededUnit(config.fishPhase + (intervalIndex * 31.73)) < config.safeTurnChance) direction *= -1;
    }
  }
  // At an exact interval boundary, expose the next interval's speed so player
  // response remains matched to the band immediately after its random shift.
  if (intervalElapsed === 0) speed = safeBandSpeed(config, intervalIndex);
  const center = 50 + position;
  return Object.freeze({
    safeMin: center - (width / 2),
    safeMax: center + (width / 2),
    speed
  });
}

export function createFishingFightState(challenge) {
  const config = validateFishingChallenge(challenge).fight;
  const safeBand = movingSafeBand(config, 0);
  return Object.freeze({
    elapsed: 0,
    escapeElapsed: 0,
    escapePaused: false,
    tension: config.startTension,
    progress: 0,
    safeMin: safeBand.safeMin,
    safeMax: safeBand.safeMax,
    safeSpeed: safeBand.speed,
    status: "fighting"
  });
}

/**
 * Advance the Genesis-style pressure fight. Reeling gains ground only while
 * the tension is in the safe band. Letting tension reach the snap limit
 * breaks the line.
 */
export function advanceFishingFight(state, challenge, seconds, reeling = false) {
  const current = state ?? createFishingFightState(challenge);
  const config = validateFishingChallenge(challenge).fight;
  if (current.status !== "fighting") return current;
  const delta = clamp(seconds, 0, 0.25);
  // Simulation time keeps the safe band moving, while escapeElapsed is only
  // charged when the player is not actively reeling inside the safe band.
  const elapsed = current.elapsed + delta;
  const fishPull = 7 + ((Math.sin((elapsed + config.fishPhase) * 2.35) + 1) * 1.75);
  const safeBand = movingSafeBand(config, elapsed);
  // Use the faster endpoint speed when a tick crosses an interval boundary.
  // Reeling moves at 1.35x that speed; capped fish drift means release still
  // moves down at no less than 1.25x, including across random speed changes.
  const responseSpeed = Math.max(Number(current.safeSpeed) || safeBand.speed, safeBand.speed);
  const playerResponse = responseSpeed * 1.35;
  const fishDrift = Math.min(fishPull * 0.1, responseSpeed * 0.1);
  const tensionRate = (reeling ? playerResponse : -playerResponse) + fishDrift;
  const tension = clamp(current.tension + (tensionRate * delta), 0, config.snap);
  const safe = tension >= safeBand.safeMin && tension <= safeBand.safeMax;
  const escapePaused = reeling && safe;
  const escapeElapsed = Math.min(config.duration, (Number(current.escapeElapsed) || 0) + (escapePaused ? 0 : delta));
  const progress = clamp(current.progress + ((reeling && safe ? 18 : 0) * delta), 0, config.target);
  let status = "fighting";
  if (tension >= config.snap) status = "line-snap";
  else if (progress >= config.target) status = "caught";
  else if (escapeElapsed >= config.duration) status = "fish-escaped";
  return Object.freeze({ elapsed, escapeElapsed, escapePaused, tension, progress, safeMin: safeBand.safeMin, safeMax: safeBand.safeMax, safeSpeed: safeBand.speed, status });
}

export function chooseFish(catalog = DEFAULT_FISH, random = Math.random) {
  const fish = createFishingCatalog(catalog);
  const index = Math.min(fish.length - 1, Math.max(0, Math.floor((Number(random()) || 0) * fish.length)));
  return fish[index];
}

export function chooseFishForTier(catalog = DEFAULT_FISH, pondTier = "common", random = Math.random) {
  const fish = createFishingCatalog(catalog);
  const weights = POND_TIERS[normalizePondTier(pondTier)].rarityWeights;
  const groups = Object.entries(weights)
    .map(([rarity, weight]) => ({ rarity, weight, fish: fish.filter(entry => entry.rarity === rarity) }))
    .filter(group => group.fish.length > 0);
  const totalWeight = groups.reduce((total, group) => total + group.weight, 0);
  let roll = Math.min(0.999999999, Math.max(0, Number(random()) || 0)) * totalWeight;
  for (const group of groups) {
    if (roll < group.weight) return chooseFish(group.fish, random);
    roll -= group.weight;
  }
  return chooseFish(groups.at(-1)?.fish ?? fish, random);
}

export function chooseFishForSeed(catalog = DEFAULT_FISH, seed = "fishing", pondTier = "common") {
  return chooseFishForTier(catalog, pondTier, sequence(`${seed}:fish`));
}

export function rollFishMarketValue(rarity, random = Math.random) {
  const normalizedRarity = normalizeFishRarity(rarity);
  const rule = FISH_MARKET_VALUE_RULES[normalizedRarity];
  let total = rule.bonus;
  for (let index = 0; index < rule.count; index += 1) {
    const raw = Number(random());
    const unit = Number.isFinite(raw) ? Math.min(0.999999999, Math.max(0, raw)) : 0;
    total += Math.floor(unit * rule.sides) + 1;
  }
  return Object.freeze({ value: total * rule.multiplier, formula: rule.formula });
}

export function createFishItemSource(fish, { caughtAt = Date.now(), marketValue = 0, marketValueFormula = "" } = {}) {
  const normalized = validateFish(fish);
  const value = Math.max(0, Math.floor(Number(marketValue) || 0));
  const valueText = value > 0
    ? `<p>Market value: <strong>${value.toLocaleString("en-US")} gp each</strong> (rolled ${escapeHTML(marketValueFormula || "value not recorded")}).</p>`
    : "";
  const rationText = normalized.ration > 0
    ? `This catch counts as <strong>${normalized.ration} ration${normalized.ration === 1 ? "" : "s"}</strong>.`
    : `This catch is tracked as a <strong>${escapeHTML(normalized.catchType)}</strong>, not a ration.`;
  const purposeText = normalized.purposes.length > 0
    ? `<p>Purposes: ${escapeHTML(normalized.purposes.join(", "))}.</p>`
    : "";
  const description = `<p><strong>${escapeHTML(normalized.name)}</strong></p><p>D&D rarity: <strong>${escapeHTML(normalized.rarity)}</strong>.</p>${valueText}<p>Caught during one hour of downtime. ${rationText}</p><p>Eating: ${escapeHTML(normalized.edibleEffect)}</p>${purposeText}`;
  return {
    name: normalized.name,
    type: "loot",
    img: normalized.img,
    system: {
      quantity: 1,
      weight: { value: 1, units: "lb" },
      rarity: normalized.rarity,
      description: { value: description, chat: description },
      price: { value, denomination: "gp" }
    },
    flags: {
      [MODULE_ID]: {
        fishing: {
          version: FISHING_VERSION,
          fishId: normalized.id,
          catchType: normalized.catchType,
          ration: normalized.ration,
          edibleEffect: normalized.edibleEffect,
          purposes: normalized.purposes,
          source: normalized.source,
          marketValue: value,
          marketValueFormula: value > 0 ? String(marketValueFormula || "") : "",
          caughtAt
        }
      }
    }
  };
}

export function fishFlag(item) {
  const read = scope => {
    const stored = item?.flags?.[scope]?.fishing
      ?? item?._source?.flags?.[scope]?.fishing;
    if (stored !== undefined) return stored;

    const game = globalThis.game;
    const active = scope === "core"
      || scope === "world"
      || scope === game?.system?.id
      || game?.modules?.get?.(scope)?.active === true;
    if (!active) return null;

    try {
      return item?.getFlag?.(scope, "fishing") ?? null;
    } catch (_error) {
      return null;
    }
  };

  return read(MODULE_ID) ?? read(LEGACY_MODULE_ID) ?? read(HISTORICAL_MODULE_ID);
}
