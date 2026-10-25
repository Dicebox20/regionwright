import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FISH,
  FISHING_VERSION,
  advanceFishingFight,
  chooseFish,
  chooseFishForSeed,
  chooseFishForTier,
  createFishItemSource,
  createFishingCatalog,
  createFishingChallenge,
  createFishingFightState,
  createFishingSpotConfig,
  fishFlag,
  rollFishMarketValue,
  validateFishingSpotConfig
} from "../modules/regionwright-hunting-gathering/fishing-engine.js";
import { FISH_RARITIES, FISH_MARKET_VALUE_RULES, POND_TIERS } from "../modules/regionwright-hunting-gathering/fishing-rarity.js";
import { installFishingContainerGuard, isFishingGearItem, isFishingItemContainedIn, isFishingRegion, isFishingTackle, renderFishingMarkup, shouldFishingRegionHandleClick } from "../modules/regionwright-hunting-gathering/fishing.js";

test("Fishing ships with distinct, named fish that each count as one ration", () => {
  const catalog = createFishingCatalog();
  assert.equal(catalog.length, DEFAULT_FISH.length);
  assert.equal(new Set(catalog.map(fish => fish.id)).size, catalog.length);
  assert.equal(new Set(catalog.map(fish => fish.img)).size, catalog.length);
  assert.ok(catalog.every(fish => FISH_RARITIES.includes(fish.rarity)));
  assert.deepEqual(catalog.map(fish => fish.rarity), ["common", "common", "uncommon", "uncommon", "rare", "rare"]);
  const source = createFishItemSource(catalog[0], { caughtAt: 123 });
  assert.equal(source.name, catalog[0].name);
  assert.equal(source.img, catalog[0].img);
  assert.equal(source.system.quantity, 1);
  assert.equal(source.flags["regionwright-hunting-gathering"].fishing.ration, 1);
  assert.equal(source.system.rarity, "common");
});

test("Fishing spot configuration keeps pole, bait, and fish catalog explicit", () => {
  const config = createFishingSpotConfig({ poleItemName: "Rod", baitItemName: "Worms", fish: [{ id: "perch", name: "Perch", img: "perch.svg" }] });
  assert.equal(config.version, FISHING_VERSION);
  assert.equal(config.poleItemName, "Rod");
  assert.equal(config.tackleItemName, "Fishing Tackle");
  assert.equal(config.baitItemName, "Worms");
  assert.equal(config.pondTier, "common");
  assert.deepEqual(config.fish.map(fish => fish.name), ["Perch"]);
  assert.doesNotThrow(() => validateFishingSpotConfig(config));
  const migrated = validateFishingSpotConfig({ version: 1, poleItemName: "Old Rod", baitItemName: "Old Bait", fish: config.fish });
  assert.equal(migrated.poleItemName, "Old Rod");
  assert.equal(migrated.tackleItemName, "Fishing Tackle");
  assert.equal(migrated.pondTier, "common");
  assert.equal(validateFishingSpotConfig({ ...config, version: 2, pondTier: undefined }).pondTier, "common");
});

test("Every catalog fish has a D&D rarity and rarity-stamped catch item", () => {
  const fish = createFishingCatalog([
    { id: "rare-fish", name: "Rare Fish", img: "rare.svg", rarity: "rare" }
  ])[0];
  assert.ok(FISH_RARITIES.includes(fish.rarity));
  const source = createFishItemSource(fish);
  assert.equal(source.system.rarity, "rare");
  assert.match(source.system.description.value, /D&D rarity: <strong>rare<\/strong>/);
});

test("Fish sale values roll the one-tenth rarity formulas and are stored on the item", () => {
  const expectedBounds = {
    common: [2, 7],
    uncommon: [10, 60],
    rare: [200, 2000],
    "very rare": [2000, 5000],
    legendary: [5000, 30000]
  };
  for (const [rarity, [minimum, maximum]] of Object.entries(expectedBounds)) {
    assert.equal(rollFishMarketValue(rarity, () => 0).value, minimum);
    assert.equal(rollFishMarketValue(rarity, () => 0.999999).value, maximum);
    assert.equal(rollFishMarketValue(rarity, () => 0.999999).formula, FISH_MARKET_VALUE_RULES[rarity].formula);
  }

  const fish = { id: "priced-carp", name: "Priced Carp", img: "carp.svg", rarity: "common" };
  const source = createFishItemSource(fish, { caughtAt: 123, marketValue: 7, marketValueFormula: "(1d6 + 1) × 1 gp" });
  assert.equal(source.system.price.value, 7);
  assert.equal(source.system.price.denomination, "gp");
  assert.equal(source.flags["regionwright-hunting-gathering"].fishing.marketValue, 7);
  assert.match(source.system.description.value, /Market value: <strong>7 gp each<\/strong>/);
});

test("Pond rarity odds are complete and Common Pond retains its lower-risk catch mix", () => {
  for (const [tier, pond] of Object.entries(POND_TIERS)) {
    assert.equal(Object.values(pond.rarityWeights).reduce((sum, weight) => sum + weight, 0), 100, `${tier} odds must total 100%`);
  }
  assert.deepEqual(POND_TIERS.common.rarityWeights, { common: 72, uncommon: 25, rare: 3 });
  assert.deepEqual(POND_TIERS.uncommon.rarityWeights, { common: 45, uncommon: 40, rare: 14, "very rare": 1 });
  assert.deepEqual(POND_TIERS.rare.rarityWeights, { common: 30, uncommon: 37, rare: 24, "very rare": 7, legendary: 2 });
  assert.equal(POND_TIERS.common.rarityWeights["very rare"], undefined);
  assert.equal(POND_TIERS.uncommon.rarityWeights.legendary, undefined);
});

test("Common-pond expected market value reflects the revised odds", () => {
  const averageValue = Object.fromEntries(Object.entries(FISH_MARKET_VALUE_RULES).map(([rarity, rule]) => [
    rarity,
    ((rule.count * (rule.sides + 1) / 2) + rule.bonus) * rule.multiplier
  ]));
  const commonPondExpected = Object.entries(POND_TIERS.common.rarityWeights).reduce(
    (sum, [rarity, weight]) => sum + (weight / 100) * averageValue[rarity],
    0
  );
  const weeklyAtPerfectSuccess = commonPondExpected * 10 * 7;
  assert.equal(commonPondExpected, 44.99);
  assert.equal(weeklyAtPerfectSuccess, 3149.3);
});

test("Fishing Tackle is an optional fishing-only container", () => {
  const config = createFishingSpotConfig({ poleItemName: "Rod", baitItemName: "Worms" });
  const tackle = { id: "tackle", name: "Fishing Tackle", type: "container" };
  const bait = { id: "bait", name: "Worms", system: { container: "tackle" }, flags: { "regionwright-fishing": { bait: { baitId: "worms" } } } };
  const rope = { id: "rope", name: "Rope", system: { container: "tackle" } };
  assert.equal(isFishingTackle(tackle, config), true);
  assert.equal(isFishingGearItem(bait, config), true);
  assert.equal(isFishingGearItem({ name: "Rod", type: "weapon" }, config), true);
  assert.equal(isFishingGearItem(rope, config), false);
  assert.equal(isFishingGearItem({ name: "Rope in Tackle", type: "loot" }, config), false);
  assert.equal(isFishingItemContainedIn(bait, tackle), true);
  assert.equal(isFishingItemContainedIn(rope, tackle), true);
});

test("Fishing Tackle rejects non-fishing items through the native item hooks", () => {
  const previousHooks = globalThis.Hooks;
  const previousUI = globalThis.ui;
  const callbacks = new Map();
  globalThis.Hooks = { on: (name, callback) => callbacks.set(name, callback) };
  globalThis.ui = { notifications: { warn: () => undefined } };
  try {
    assert.equal(installFishingContainerGuard(), true);
    const tackle = { id: "tackle", name: "Fishing Tackle", type: "container" };
    const actor = { items: new Map([[tackle.id, tackle]]) };
    assert.equal(callbacks.get("preUpdateItem")({ actor, name: "Rope" }, { "system.container": "tackle" }), false);
    assert.equal(callbacks.get("preCreateItem")({ parent: actor, name: "Rope" }, { "system.container": "tackle" }), false);
    assert.notEqual(callbacks.get("preUpdateItem")({ actor, name: "Worms" }, { "system.container": "tackle" }), false);
  } finally {
    if (previousHooks === undefined) delete globalThis.Hooks;
    else globalThis.Hooks = previousHooks;
    if (previousUI === undefined) delete globalThis.ui;
    else globalThis.ui = previousUI;
  }
});

test("Fishing challenges are deterministic and open a bounded hook window", () => {
  const first = createFishingChallenge({ seed: "pond-at-dusk" });
  const second = createFishingChallenge({ seed: "pond-at-dusk" });
  assert.deepEqual(first, second);
  assert.ok(first.bite.opensAt > 0 && first.bite.opensAt < first.bite.total);
  assert.ok(first.bite.opensAt + first.bite.window < first.bite.total);
  assert.ok(first.fight.safeMin < first.fight.safeMax);
  assert.ok(first.fight.safeWidth < first.fight.safeMax - first.fight.safeMin);
  assert.equal(first.fight.safeInterval, 1.5, "safe-band direction and speed intervals should be shorter");

  let state = createFishingFightState(first);
  const initialBand = [state.safeMin, state.safeMax];
  state = advanceFishingFight(state, first, 0.25, false);
  assert.notDeepEqual([state.safeMin, state.safeMax], initialBand);
});

test("The moving safe band can reverse direction before reaching an edge", () => {
  const turnsMidLane = seed => {
    const challenge = createFishingChallenge({ seed, fishRarity: "legendary" });
    let state = createFishingFightState(challenge);
    let previousCenter = state.safeMin + (challenge.fight.safeWidth / 2);
    let previousDirection = 0;
    for (let index = 0; index < 60 && state.status === "fighting"; index += 1) {
      state = advanceFishingFight(state, challenge, 0.25, false);
      const center = state.safeMin + (challenge.fight.safeWidth / 2);
      const direction = Math.sign(center - previousCenter);
      if (direction && previousDirection && direction !== previousDirection
        && Math.abs(center - 50) < challenge.fight.safeTravel - 1
        && Math.abs(previousCenter - 50) < challenge.fight.safeTravel - 1) return true;
      if (direction) previousDirection = direction;
      previousCenter = center;
    }
    return false;
  };

  assert.ok(["safe-band-midgame-turn-1", "safe-band-midgame-turn-2", "safe-band-midgame-turn-3"].some(turnsMidLane));
});

test("Direction-change timing varies by seed but remains deterministic", () => {
  const firstMidLaneTurn = seed => {
    const challenge = createFishingChallenge({ seed, fishRarity: "legendary" });
    let state = createFishingFightState(challenge);
    let previousCenter = (state.safeMin + state.safeMax) / 2;
    let previousDirection = 0;
    for (let index = 1; index <= 160; index += 1) {
      state = advanceFishingFight(state, challenge, 0.05, false);
      const center = (state.safeMin + state.safeMax) / 2;
      const direction = Math.sign(center - previousCenter);
      if (direction && previousDirection && direction !== previousDirection
        && Math.abs(center - 50) < challenge.fight.safeTravel - 1
        && Math.abs(previousCenter - 50) < challenge.fight.safeTravel - 1) return Number((index * 0.05).toFixed(2));
      if (direction) previousDirection = direction;
      previousCenter = center;
    }
    return null;
  };
  const seeds = ["random-turn-a", "random-turn-b", "random-turn-c", "random-turn-d", "random-turn-e"];
  const turnTimes = seeds.map(firstMidLaneTurn);
  assert.equal(firstMidLaneTurn(seeds[0]), turnTimes[0], "the same fish seed must repeat its turn schedule");
  assert.ok(turnTimes.filter(Number.isFinite).length >= 4, "most seeds should turn before reaching an edge");
  assert.ok(new Set(turnTimes.filter(Number.isFinite)).size >= 3, "different fish seeds should not share one fixed turn time");
});

test("Fish rarity increases pressure difficulty and seeded fish selection is stable", () => {
  const common = createFishingChallenge({ seed: "rarity-test", fishRarity: "common" });
  const rare = createFishingChallenge({ seed: "rarity-test", fishRarity: "rare" });
  const legendary = createFishingChallenge({ seed: "rarity-test", fishRarity: "legendary" });
  assert.equal(common.fishRarity, "common");
  assert.equal(legendary.fishRarity, "legendary");
  assert.equal(rare.fight.safeWidth, 23.4);
  assert.ok(Math.abs((rare.fight.safeWidth / 26) - 0.9) < 0.00001, "Rare safe band should be 10% narrower than before");
  assert.ok(legendary.fight.duration < common.fight.duration);
  assert.ok(legendary.fight.safeWidth < common.fight.safeWidth);
  assert.ok(legendary.fight.safeSpeedMax > common.fight.safeSpeedMax);
  assert.ok(legendary.fight.safeTurnChance > common.fight.safeTurnChance);
  assert.deepEqual(chooseFishForSeed(DEFAULT_FISH, "stable-fish-seed"), chooseFishForSeed(DEFAULT_FISH, "stable-fish-seed"));
});

test("The active fight screen keeps the hooked fish identity and rarity hidden until the result", () => {
  const markup = renderFishingMarkup({
    phase: "fight",
    region: { name: "Blackwater Sink" },
    actor: { name: "Fisher" },
    challenge: { fishRarity: "legendary", fight: { duration: 14 } },
    hookedFish: { name: "Blind Eel", rarity: "legendary" },
    fightState: { elapsed: 4.25, escapeElapsed: 4.25, escapePaused: false, safeMin: 25, safeMax: 50, tension: 40, progress: 10 },
    testMode: false,
    feedback: "Releasing pressure…"
  });
  assert.match(markup, /Blackwater Sink/);
  assert.match(markup, /Something is on the line\./);
  assert.match(markup, /green band pulses red when your escape time is draining/i);
  assert.match(markup, /rw-fishing-safe-band is-escape-draining/);
  assert.match(markup, /Fish tiring/);
  assert.doesNotMatch(markup, /Line stress|data-fishing-stress|rw-fishing-line/);
  assert.doesNotMatch(markup, /Escape time left|data-fishing-escape|rw-fishing-escape-fill/);
  assert.doesNotMatch(markup, /Blind Eel|legendary/i);

  const pausedMarkup = renderFishingMarkup({
    phase: "fight",
    region: { name: "Blackwater Sink" },
    actor: { name: "Fisher" },
    challenge: { fishRarity: "legendary", fight: { duration: 14 } },
    hookedFish: { name: "Blind Eel", rarity: "legendary" },
    fightState: { elapsed: 4.25, escapeElapsed: 4.25, escapePaused: true, safeMin: 25, safeMax: 50, tension: 40, progress: 10 },
    testMode: false,
    feedback: "In the green—timer paused; reeling is tiring the fish."
  });
  assert.match(pausedMarkup, /rw-fishing-safe-band"/);
  assert.doesNotMatch(pausedMarkup, /rw-fishing-safe-band is-escape-draining/);
});

test("Fishing escape result explains that time expired, not that the player ran out of stamina", () => {
  const markup = renderFishingMarkup({
    phase: "result",
    region: { name: "Test Pond" },
    actor: { name: "Fisher" },
    challenge: {},
    testMode: true,
    resultKind: "failed",
    feedback: "Time ran out before you landed the fish."
  });
  assert.match(markup, /Time ran out before you landed the fish\./);
  assert.doesNotMatch(markup, /tired you out|stamina/i);
});

test("Escape time pauses only while Reel is held inside the safe band", () => {
  const base = createFishingChallenge({ seed: "pause-escape-clock" });
  const stable = {
    ...base,
    fight: {
      ...base.fight,
      duration: 10,
      startTension: 50,
      safeWidth: 60,
      safeTravel: 1,
      safeSpeedMin: 1,
      safeSpeedMax: 1,
      safeTurnChance: 0,
      snap: 100
    }
  };
  let state = createFishingFightState(stable);
  state = advanceFishingFight(state, stable, 0.25, true);
  assert.equal(state.escapePaused, true);
  assert.equal(state.escapeElapsed, 0);
  assert.equal(state.elapsed, 0.25, "the moving challenge continues while the escape clock is paused");
  assert.ok(state.progress > 0);

  state = advanceFishingFight(state, stable, 0.25, false);
  assert.equal(state.escapePaused, false);
  assert.equal(state.escapeElapsed, 0.25, "releasing Reel drains time even while tension is in the band");

  const outside = { ...stable, fight: { ...stable.fight, startTension: 5, safeWidth: 20 } };
  let outsideState = createFishingFightState(outside);
  outsideState = advanceFishingFight(outsideState, outside, 0.25, true);
  assert.equal(outsideState.escapePaused, false, "holding Reel outside the safe band does not pause escape time");
  assert.equal(outsideState.escapeElapsed, 0.25);
  assert.equal(outsideState.progress, 0);

});

test("Rare green-band speed is 5% faster and Very Rare 6% slower without validation clipping", () => {
  const challenges = FISH_RARITIES.map(fishRarity => createFishingChallenge({ seed: `speed-curve-${fishRarity}`, fishRarity }));
  const means = challenges.map(({ fight }) => (fight.safeSpeedMin + fight.safeSpeedMax) / 2);
  const turnChances = challenges.map(({ fight }) => fight.safeTurnChance);
  const relativeSpeedSpread = challenges.map(({ fight }) => (fight.safeSpeedMax - fight.safeSpeedMin) / ((fight.safeSpeedMin + fight.safeSpeedMax) / 2));

  assert.deepEqual(means.map(value => Math.round(value * 100) / 100), [13, 15.02, 34.66, 38.86, 29.67]);
  assert.ok(Math.abs((means[1] / 13.65) - 1.1) < 0.00001, "Uncommon green-band speed should be 10% faster");
  assert.equal(challenges[1].fight.safeSpeedMin, 9.24);
  assert.equal(challenges[1].fight.safeSpeedMax, 20.79);
  assert.ok(Math.abs((means[2] / 33.005) - 1.05) < 0.00001, "Rare should be 5% faster than its current speed");
  assert.ok(Math.abs((means[3] / 41.3402) - 0.94) < 0.00001, "Very Rare should be 6% slower than its current speed");
  assert.equal(challenges[2].fight.safeSpeedMax, 48.0585, "Rare maximum speed must survive challenge validation");
  assert.equal(challenges[3].fight.safeSpeedMax, 55.126676, "Very Rare maximum speed must survive challenge validation");
  assert.ok(challenges.at(-1).fight.safeSpeedMax > 40, "Legendary speed must not be clipped by validation");
  for (let index = 1; index < turnChances.length; index += 1) assert.ok(turnChances[index] > turnChances[index - 1], `${FISH_RARITIES[index]} should be less predictable`);
  assert.deepEqual(turnChances, [0.34, 0.43, 0.56, 0.7, 0.78]);
  assert.ok(turnChances.at(-1) <= 0.8, "Legendary turns should remain unpredictable without becoming constant reversals");
  assert.ok(relativeSpeedSpread[2] > relativeSpeedSpread[1], "Rare speed samples should have proportionate variation");
});

test("The tension marker outruns the active green-band speed at every rarity", () => {
  for (const rarity of FISH_RARITIES) {
    const challenge = createFishingChallenge({ seed: `responsive-pressure-${rarity}`, fishRarity: rarity });
    const state = createFishingFightState(challenge);
    const reeling = advanceFishingFight(state, challenge, 0.25, true);
    const releasing = advanceFishingFight(state, challenge, 0.25, false);
    const intervalDistance = state.safeSpeed * 0.25;

    assert.ok(reeling.tension - state.tension > intervalDistance, `${rarity}: reeling must outrun the green band`);
    assert.ok(state.tension - releasing.tension >= (intervalDistance * 1.25) - 1e-9, `${rarity}: release must retain at least a 25% speed margin`);
  }
});

test("Player tension response scales with Uncommon green-band speed", () => {
  const challenge = createFishingChallenge({ seed: "uncommon-player-speed" , fishRarity: "uncommon" });
  const state = createFishingFightState(challenge);
  const result = advanceFishingFight(state, challenge, 0.01, true);
  const fishPull = 7 + ((Math.sin((result.elapsed + challenge.fight.fishPhase) * 2.35) + 1) * 1.75);
  const responseSpeed = Math.max(state.safeSpeed, result.safeSpeed);
  const fishDrift = Math.min(fishPull * 0.1, responseSpeed * 0.1);
  const expectedGaugeMovement = ((responseSpeed * 1.35) + fishDrift) * 0.01;
  assert.ok(Math.abs((result.tension - state.tension) - expectedGaugeMovement) < 1e-9);
});

test("Responsive reel timing can still land a fish at every rarity, including Legendary", () => {
  for (const rarity of FISH_RARITIES) {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const challenge = createFishingChallenge({ seed: `reachable-${rarity}-${attempt}`, fishRarity: rarity });
      let state = createFishingFightState(challenge);
      let reeling = true;
      for (let tick = 0; tick < 250 && state.status === "fighting"; tick += 1) {
        const safeCenter = (state.safeMin + state.safeMax) / 2;
        if (state.tension < safeCenter - 2) reeling = true;
        else if (state.tension > safeCenter + 2) reeling = false;
        state = advanceFishingFight(state, challenge, 0.1, reeling);
      }
      assert.equal(state.status, "caught", `${rarity} should remain winnable with timely reel/release control`);
    }
  }
});

test("Pond tiers progressively improve rarity odds and reserve Legendary for the rare tier", () => {
  const catalog = FISH_RARITIES.map((rarity, index) => ({ id: `fish-${index}`, name: `Fish ${rarity}`, img: `${index}.svg`, rarity }));
  assert.equal(chooseFishForTier(catalog, "common", () => 0.999).rarity, "rare");
  assert.equal(chooseFishForTier(catalog, "uncommon", () => 0.999).rarity, "very rare");
  assert.equal(chooseFishForTier(catalog, "rare", () => 0.985).rarity, "legendary");
  assert.equal(chooseFishForTier(catalog, "rare", () => 0.975).rarity, "very rare");

  const commonOnlyCatalog = catalog.filter(fish => fish.rarity !== "legendary");
  assert.notEqual(chooseFishForTier(commonOnlyCatalog, "uncommon", () => 0.999).rarity, "legendary");
});

test("Fishing pressure rewards controlled reeling and exposes a line-snap failure", () => {
  const challenge = createFishingChallenge({ seed: "pressure-test" });
  let state = createFishingFightState(challenge);
  assert.equal(Object.hasOwn(state, "lineStress"), false, "obsolete line-stress state is not tracked");
  for (let index = 0; index < 30 && state.status === "fighting"; index += 1) state = advanceFishingFight(state, challenge, 0.1, true);
  assert.ok(state.progress > 0 || state.status === "line-snap");

  const snapChallenge = { ...challenge, fight: { ...challenge.fight, startTension: 99, snap: 99 } };
  let snap = createFishingFightState(snapChallenge);
  snap = advanceFishingFight(snap, snapChallenge, 0.25, true);
  assert.equal(snap.status, "line-snap");
});

test("Fishing pressure can be won by alternating reel and release inside the safe band", () => {
  const challenge = createFishingChallenge({ seed: "winnable-pressure-test" });
  let state = createFishingFightState(challenge);
  let reeling = true;
  for (let index = 0; index < 140 && state.status === "fighting"; index += 1) {
    if (state.tension <= state.safeMin + 2) reeling = true;
    if (state.tension >= state.safeMax - 2) reeling = false;
    state = advanceFishingFight(state, challenge, 0.15, reeling);
  }
  assert.equal(state.status, "caught");
});

test("Fishing chooses only from the configured catalog", () => {
  const catalog = [{ id: "one", name: "One Fish", img: "one.svg" }, { id: "two", name: "Two Fish", img: "two.svg" }];
  assert.equal(chooseFish(catalog, () => 0).id, "one");
  assert.equal(chooseFish(catalog, () => 0.999).id, "two");
  assert.throws(() => createFishingCatalog([{ id: "same", name: "A", img: "a" }, { id: "same", name: "B", img: "b" }]), /duplicated/i);
});

test("Fishing Regions only intercept clicks from Token Controls, never canvas editing tools", () => {
  assert.equal(shouldFishingRegionHandleClick({ activeLayerName: "tokens" }), true);
  assert.equal(shouldFishingRegionHandleClick({ activeLayerName: "TokenLayer" }), true);
  for (const activeLayerName of ["regions", "RegionLayer", "ShapeLayer", "walls", "WallLayer", "lighting", "templates", null]) {
    assert.equal(shouldFishingRegionHandleClick({ activeLayerName }), false, `${activeLayerName} must retain native canvas input`);
  }
  assert.equal(shouldFishingRegionHandleClick({ activeLayerName: "tokens", regionPlacementActive: true }), false);
});

test("Fishing ignores inactive legacy flag scopes but still recognizes stored legacy pond data", () => {
  const attemptedScopes = [];
  const inactiveScopeRegion = {
    flags: {},
    getFlag(scope) {
      attemptedScopes.push(scope);
      if (scope === "regionwright") throw new Error('Flag scope "regionwright" is not valid or not currently active');
      return null;
    }
  };
  assert.doesNotThrow(() => isFishingRegion(inactiveScopeRegion));
  assert.equal(isFishingRegion(inactiveScopeRegion), false);
  assert.deepEqual(attemptedScopes, [], "inactive scopes are read from stored flags only");

  const legacyRegion = {
    flags: { regionwright: { fishingSpot: createFishingSpotConfig() } },
    getFlag(scope) {
      attemptedScopes.push(scope);
      if (scope === "regionwright") throw new Error('Flag scope "regionwright" is not valid or not currently active');
      return null;
    }
  };
  assert.equal(isFishingRegion(legacyRegion), true, "legacy pond metadata is read directly without the inactive-scope API");
  assert.deepEqual(attemptedScopes, [], "stored legacy data does not invoke the inactive-scope API");
});

test("fishFlag skips getFlag for an inactive legacy module but reads saved legacy data", () => {
  const attemptedScopes = [];
  const inactiveScopeItem = {
    flags: {},
    getFlag(scope) {
      attemptedScopes.push(scope);
      if (scope === "regionwright") throw new Error('Flag scope "regionwright" is not valid or not currently active');
      return null;
    }
  };

  assert.equal(fishFlag(inactiveScopeItem), null);
  assert.deepEqual(attemptedScopes, [], "inactive module scope is never passed to getFlag");

  const legacyFish = { fishId: "old-catch" };
  const storedLegacyItem = { flags: { regionwright: { fishing: legacyFish } } };
  assert.deepEqual(fishFlag(storedLegacyItem), legacyFish);
});

test("fishFlag uses getFlag for the active standalone fishing module", () => {
  const previousGame = globalThis.game;
  const attemptedScopes = [];
  globalThis.game = {
    system: { id: "dnd5e" },
    modules: new Map([["regionwright-fishing", { active: true }], ["regionwright", { active: false }]])
  };

  try {
    const currentFish = { fishId: "current-catch" };
    const activeScopeItem = {
      flags: {},
      getFlag(scope, key) {
        attemptedScopes.push(scope);
        return scope === "regionwright-fishing" && key === "fishing" ? currentFish : null;
      }
    };

    assert.deepEqual(fishFlag(activeScopeItem), currentFish);
    assert.deepEqual(attemptedScopes, ["regionwright-fishing"]);
  } finally {
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("Fishing Region hit-testing restores native Region state across layer switches", async () => {
  const previousGlobals = Object.fromEntries(["Hooks", "game", "canvas", "CONFIG"].map(key => [key, globalThis[key]]));
  const callbacks = new Map();
  const fakeHooks = {
    on(name, callback) {
      const listeners = callbacks.get(name) ?? [];
      listeners.push(callback);
      callbacks.set(name, listeners);
      return listeners.length;
    }
  };
  class FakeRegion {
    constructor(document) {
      this.document = document;
      this.eventMode = "static";
      this.alpha = 1;
    }

    get isVisible() { return Boolean(globalThis.canvas?.regions?.active); }
    get isInteractable() { return Boolean(globalThis.canvas?.regions?.active); }
    on() {}
    _refreshVisibility() { this.visible = this.isVisible; }
    _refreshState() {
      this.eventMode = this.isInteractable ? "static" : "none";
      this.alpha = 1;
    }
  }
  const layer = {
    active: false,
    interactiveChildren: false,
    objects: { eventMode: "auto", interactiveChildren: true },
    placeables: []
  };
  globalThis.Hooks = fakeHooks;
  globalThis.game = { user: { isGM: true } };
  globalThis.canvas = { regions: layer, activeLayer: { name: "tokens" }, tokens: {} };
  globalThis.CONFIG = { Region: { objectClass: FakeRegion } };

  try {
    const module = await import(`../modules/regionwright-hunting-gathering/fishing.js?layer-lifecycle=${Date.now()}`);
    module.installFishingRegionInteraction();
    const makeDocument = (id, fishing) => ({
      id,
      locked: false,
      flags: fishing ? { "regionwright-fishing": { fishingSpot: createFishingSpotConfig() } } : {},
      testUserPermission: () => true
    });
    const RegionClass = globalThis.CONFIG.Region.objectClass;
    const fishingRegion = new RegionClass(makeDocument("pond", true));
    const ordinaryRegion = new RegionClass(makeDocument("ordinary", false));
    layer.placeables = [fishingRegion, ordinaryRegion];

    callbacks.get("activateCanvasLayer")[0](globalThis.canvas.tokens);
    assert.equal(layer.interactiveChildren, true, "Token Controls temporarily traverse the Region layer");
    assert.equal(layer.objects.eventMode, "passive");
    assert.equal(fishingRegion.eventMode, "static", "tagged ponds remain clickable");
    assert.equal(ordinaryRegion.eventMode, "none", "ordinary Regions cannot become stale hit targets");

    globalThis.canvas.activeLayer = { name: "walls" };
    callbacks.get("deactivateCanvasLayer")[0](globalThis.canvas.tokens);
    assert.equal(layer.interactiveChildren, false, "leaving Tokens restores the inactive layer state");
    assert.equal(layer.objects.eventMode, "auto", "the objects container returns to its original mode");
    assert.equal(fishingRegion.eventMode, "none");
    assert.equal(ordinaryRegion.eventMode, "none");

    layer.active = true;
    layer.eventMode = "static";
    layer.interactiveChildren = true;
    globalThis.canvas.activeLayer = { name: "regions" };
    callbacks.get("activateCanvasLayer")[0](layer);
    for (const region of layer.placeables) region._refreshState();
    assert.equal(layer.interactiveChildren, true, "Foundry retains native active-layer interactivity");
    assert.equal(layer.objects.eventMode, "auto");
    assert.equal(fishingRegion.eventMode, "static");
    assert.equal(ordinaryRegion.eventMode, "static", "ordinary Regions are selectable in Region Controls");
  } finally {
    for (const [key, value] of Object.entries(previousGlobals)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
