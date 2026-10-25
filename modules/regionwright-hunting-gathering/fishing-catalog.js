import { normalizeFishRarity } from "./fishing-rarity.js";

/*
 * Regionwright Fishing Biomes
 *
 * The environment keys follow the official 2024 travel-terrain list, with
 * Underwater retained as an alias used by the 2014/Xanathar's encounter
 * tables. Fish and bait entries below are intentionally homebrew proposals;
 * only entries marked "official creature" borrow an official creature name.
 */

const FISH_ASSET_ROOT = "modules/regionwright-hunting-gathering/assets/fishing";

const freeze = value => Object.freeze(value);

function fish(id, name, image, options = {}) {
  return freeze({
    id,
    name,
    img: `${FISH_ASSET_ROOT}/${image}`,
    catchType: "ration",
    ration: 1,
    edibleEffect: "No mechanical effect; this catch counts as food when cooked.",
    purposes: ["downtime meal"],
    ...options,
    rarity: normalizeFishRarity(options.rarity)
  });
}

function bait(id, name, options = {}) {
  return freeze({
    id,
    name,
    img: "icons/svg/fish.svg",
    description: "A mundane fishing bait proposed for the Regionwright fishing catalog.",
    purpose: "Improves the odds of a suitable catch in its listed environments.",
    ...options
  });
}

function biome(id, label, summary, fishEntries, baitIds, officialBasis) {
  return freeze({ id, label, summary, fish: freeze(fishEntries), baitIds: freeze(baitIds), officialBasis });
}

export const OFFICIAL_ENVIRONMENT_SOURCES = freeze({
  core2014: "https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes",
  xanathar: "https://www.dndbeyond.com/sources/dnd/xgte",
  core2024: "https://www.dndbeyond.com/sources/dnd/br-2024/dms-toolbox",
  fishingTackle: "https://www.dndbeyond.com/equipment/44-fishing-tackle",
  piranha: "https://www.dndbeyond.com/monsters/5195160-piranha",
  quipper: "https://www.dndbeyond.com/monsters/16989-quipper",
  reefShark: "https://www.dndbeyond.com/monsters/16994-reef-shark"
});

export const BAIT_CATALOG = freeze({
  worms: bait("worms", "Worms", { purpose: "Reliable freshwater bait." }),
  grubs: bait("grubs", "Grubs", { purpose: "Works in leaf litter, banks, and slow water." }),
  minnows: bait("minnows", "Live Minnows", { purpose: "Draws predatory freshwater fish." }),
  insects: bait("insects", "Crickets and Grasshoppers", { purpose: "A lightweight surface bait for warm freshwater." }),
  dough: bait("dough", "Bread Dough", { purpose: "Cheap bait for carp, bream, and urban water." }),
  cheese: bait("cheese", "Cheese Scraps", { purpose: "A strong-smelling bait for murky or fast water." }),
  "ice-minnows": bait("ice-minnows", "Ice Minnows", { purpose: "Cold-water bait that stays active under thin ice." }),
  "alpine-roe": bait("alpine-roe", "Salmon Roe", { purpose: "A compact, premium bait for mountain streams." }),
  stoneflies: bait("stoneflies", "Stonefly Nymphs", { purpose: "Natural bait for cold, clear mountain water." }),
  shrimp: bait("shrimp", "Shrimp", { purpose: "Versatile bait for coastal and underwater fishing." }),
  "squid-strips": bait("squid-strips", "Squid Strips", { purpose: "Durable saltwater bait for larger catches." }),
  chum: bait("chum", "Fish Chum", { purpose: "Attracts aggressive or opportunistic aquatic creatures." }),
  "oasis-grubs": bait("oasis-grubs", "Oasis Grubs", { purpose: "A scarce bait found near desert springs." }),
  "date-dough": bait("date-dough", "Date Dough", { purpose: "Sweet bait for warm-water fish." }),
  "beetle-larvae": bait("beetle-larvae", "Beetle Larvae", { purpose: "A hardy bait collected from dry soil and reeds." }),
  "crayfish-tail": bait("crayfish-tail", "Crayfish Tails", { purpose: "A meaty bait for pike and other ambush predators." }),
  leeches: bait("leeches", "Leeches", { purpose: "Strong bait for swamp and slow-moving water." }),
  frogs: bait("frogs", "Small Frogs", { purpose: "A risky but effective swamp bait." }),
  "carrion-chum": bait("carrion-chum", "Carrion Chum", { purpose: "Attracts scavengers; foul, noticeable, and dangerous." }),
  "glow-worms": bait("glow-worms", "Glowworms", { purpose: "Visible bait for dark water and cavern pools." }),
  "cave-grubs": bait("cave-grubs", "Cave Grubs", { purpose: "Blind-water bait gathered from damp stone." }),
  "fungus-bait": bait("fungus-bait", "Fungal Bait", { purpose: "A strange spore-scented bait for Underdark pools." }),
  scraps: bait("scraps", "Kitchen Scraps", { purpose: "Common bait around docks, mills, and settlements." }),
  "shiny-junk": bait("shiny-junk", "Shiny Junk", { purpose: "Improvised lure for curious fish in urban canals." })
});

export const FISHING_BIOMES = freeze({
  arctic: biome(
    "arctic",
    "Arctic",
    "Cold rivers, glacial lakes, and polar shores. Fishing is limited by ice and short thaw seasons.",
    [
      fish("arctic-char", "Arctic Char", "trout.svg", { rarity: "common" }),
      fish("icefin", "Icefin", "bluegill.svg", { rarity: "uncommon", purposes: ["downtime meal", "cold-weather trade"] }),
      fish("coldwater-salmon", "Coldwater Salmon", "salmon.svg", { rarity: "rare", purposes: ["downtime meal", "smoked provisions"] }),
      fish("frostback-sturgeon", "Frostback Sturgeon", "game-icons/cathelineau/flying-trout.svg", { rarity: "very rare", purposes: ["downtime meal", "winter market trade"] }),
      fish("aurora-whale", "Aurora Whale", "game-icons/delapouite/sperm-whale.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this immense catch is chiefly a trophy and source of rare materials.", purposes: ["trophy", "bone and oil", "legendary catch"] })
    ],
    ["ice-minnows", "alpine-roe", "shiny-junk"],
    "Official 2024 travel terrain; the 2014 rules also use Arctic as favored terrain."
  ),
  coastal: biome(
    "coastal",
    "Coastal",
    "Shorelines, tidal pools, estuaries, and shallow reefs. The catch changes with tide and weather.",
    [
      fish("coastal-mackerel", "Coastal Mackerel", "bass.svg", { rarity: "common", purposes: ["downtime meal", "smoked provisions"] }),
      fish("red-rockfish", "Red Rockfish", "bluegill.svg", { rarity: "uncommon", purposes: ["downtime meal", "dockside trade"] }),
      fish("bluefin-tuna", "Bluefin Tuna", "game-icons/various-artists/salmon.svg", { rarity: "rare", purposes: ["downtime meal", "salted provisions", "trade"] }),
      fish("reef-shark", "Reef Shark", "pike.svg", { rarity: "very rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; treat as a dangerous rare catch.", purposes: ["shark teeth", "hide and oil", "trophy"], source: "official creature" }),
      fish("tidecaller-leviathan", "Tidecaller Leviathan", "game-icons/delapouite/giant-squid.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; its size and danger make it a legendary trophy catch.", purposes: ["trophy", "rare materials", "legendary catch"] })
    ],
    ["shrimp", "squid-strips", "chum"],
    "Official 2024 travel terrain and Xanathar's coastal encounter environment."
  ),
  desert: biome(
    "desert",
    "Desert",
    "Oases, wadis, irrigation channels, and rare underground springs are the only practical fishing sites.",
    [
      fish("oasis-carp", "Oasis Carp", "carp.svg", { rarity: "uncommon", purposes: ["downtime meal", "water-route trade"] }),
      fish("sunbaked-sunfish", "Sunbaked Sunfish", "bluegill.svg", { rarity: "common" }),
      fish("dune-catfish", "Dune Catfish", "pike.svg", { rarity: "rare", purposes: ["downtime meal", "oil and leather scraps"] }),
      fish("mirage-eel", "Mirage Eel", "game-icons/delapouite/eel.svg", { rarity: "very rare", purposes: ["downtime meal", "springwater trade"] }),
      fish("sandswimmer", "Sandswimmer", "game-icons/delapouite/manta-ray.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this enormous spring-dweller is prized as a trophy.", purposes: ["trophy", "hide and oil", "legendary catch"] })
    ],
    ["oasis-grubs", "date-dough", "beetle-larvae"],
    "Official 2024 travel terrain and 2014/Xanathar's desert environment; fish require a water feature."
  ),
  forest: biome(
    "forest",
    "Forest",
    "Shaded streams, woodland ponds, and beaver pools favor small freshwater fish and patient casting.",
    [
      fish("brook-trout", "Brook Trout", "trout.svg", { rarity: "common" }),
      fish("woodland-bass", "Woodland Bass", "bass.svg", { rarity: "common" }),
      fish("leafscale-perch", "Leafscale Perch", "bluegill.svg", { rarity: "uncommon", purposes: ["downtime meal", "local trade"] }),
      fish("silverfin-pike", "Silverfin Pike", "pike.svg", { rarity: "rare", purposes: ["downtime meal", "local trade"] }),
      fish("moonlit-koi", "Moonlit Koi", "game-icons/delapouite/tropical-fish.svg", { rarity: "very rare", purposes: ["downtime meal", "ornamental pond trade"] }),
      fish("elderwood-koi", "Elderwood Koi", "game-icons/delapouite/circling-fish.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this storied fish is usually released or kept as a trophy.", purposes: ["trophy", "ornamental trade", "legendary catch"] })
    ],
    ["worms", "grubs", "minnows"],
    "Official 2024 travel terrain and 2014/Xanathar's forest environment."
  ),
  grassland: biome(
    "grassland",
    "Grassland",
    "Broad rivers, farm ponds, and seasonal creeks support easy, common catches near travel routes.",
    [
      fish("river-carp", "River Carp", "carp.svg", { rarity: "common" }),
      fish("prairie-bluegill", "Prairie Bluegill", "bluegill.svg", { rarity: "common" }),
      fish("channel-catfish", "Channel Catfish", "pike.svg", { rarity: "uncommon", purposes: ["downtime meal", "smoked provisions"] }),
      fish("stormrun-sturgeon", "Stormrun Sturgeon", "game-icons/cathelineau/flying-trout.svg", { rarity: "rare", purposes: ["downtime meal", "smoked provisions", "river trade"] }),
      fish("golden-banner-salmon", "Golden Banner Salmon", "game-icons/various-artists/salmon.svg", { rarity: "very rare", purposes: ["downtime meal", "festival trade"] }),
      fish("prairie-river-king", "Prairie River King", "game-icons/delapouite/double-fish.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this famous giant is prized as a trophy and local legend.", purposes: ["trophy", "rare materials", "legendary catch"] })
    ],
    ["insects", "dough", "minnows"],
    "Official 2024 travel terrain and 2014/Xanathar's grassland environment."
  ),
  hill: biome(
    "hill",
    "Hill",
    "Fast creeks, millponds, and rocky streams reward bait that stays on the hook.",
    [
      fish("creek-minnow", "Creek Minnow", "game-icons/delapouite/school-of-fish.svg", { rarity: "common" }),
      fish("creek-trout", "Creek Trout", "trout.svg", { rarity: "uncommon" }),
      fish("hill-pike", "Hill Pike", "pike.svg", { rarity: "rare", purposes: ["downtime meal", "hook and tooth components"] }),
      fish("stream-crayfish", "Stream Crayfish", "bluegill.svg", { rarity: "uncommon", catchType: "utility", ration: 0, edibleEffect: "Edible when cooked, but tracked as a utility catch in this module.", purposes: ["bait", "downtime meal", "trade"] }),
      fish("stonepool-eel", "Stonepool Eel", "game-icons/delapouite/eel.svg", { rarity: "very rare", purposes: ["downtime meal", "oil and bait"] }),
      fish("graniteback-pike", "Graniteback Pike", "game-icons/delapouite/fish-monster.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this powerful fish is a trophy and source of rare materials.", purposes: ["trophy", "teeth and hide", "legendary catch"] })
    ],
    ["worms", "crayfish-tail", "cheese"],
    "Official 2024 travel terrain; Hill is also a standard encounter environment in Xanathar's."
  ),
  mountain: biome(
    "mountain",
    "Mountain",
    "Cold, clear alpine streams are difficult to reach but can yield premium trout and salmon.",
    [
      fish("alpine-minnow", "Alpine Minnow", "game-icons/delapouite/school-of-fish.svg", { rarity: "common" }),
      fish("mountain-trout", "Mountain Trout", "trout.svg", { rarity: "uncommon" }),
      fish("alpine-salmon", "Alpine Salmon", "salmon.svg", { rarity: "rare", purposes: ["downtime meal", "smoked provisions", "mountain trade"] }),
      fish("stoneback-char", "Stoneback Char", "bass.svg", { rarity: "rare", purposes: ["downtime meal", "cold-weather trade"] }),
      fish("crownridge-trout", "Crownridge Trout", "game-icons/cathelineau/flying-trout.svg", { rarity: "very rare", purposes: ["downtime meal", "mountain trade"] }),
      fish("stormpeak-salmon", "Stormpeak Salmon", "game-icons/various-artists/salmon.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this massive fish is a legendary trophy catch.", purposes: ["trophy", "rare materials", "legendary catch"] })
    ],
    ["stoneflies", "alpine-roe", "shiny-junk"],
    "Official 2024 travel terrain and 2014/Xanathar's mountain environment."
  ),
  swamp: biome(
    "swamp",
    "Swamp",
    "Warm, slow, murky water produces hearty fish and a higher chance of dangerous or foul catches.",
    [
      fish("bog-minnow", "Bog Minnow", "game-icons/delapouite/school-of-fish.svg", { rarity: "common" }),
      fish("blackwater-catfish", "Blackwater Catfish", "pike.svg", { rarity: "uncommon", purposes: ["downtime meal", "oil and leather scraps"] }),
      fish("marsh-gar", "Marsh Gar", "bass.svg", { rarity: "rare", purposes: ["downtime meal", "teeth and hide"] }),
      fish("witchlight-gar", "Witchlight Gar", "game-icons/lorc/angler-fish.svg", { rarity: "very rare", purposes: ["downtime meal", "glowing lure", "marsh trade"] }),
      fish("piranha", "Piranha", "pike.svg", { rarity: "rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; use the catch for teeth, bait, or a dangerous specimen.", purposes: ["predator bait", "teeth", "trophy"], source: "official creature" }),
      fish("swamp-eel", "Swamp Eel", "trout.svg", { rarity: "uncommon", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; handle as a slippery material catch.", purposes: ["oil", "bait", "alchemical ingredient"] }),
      fish("blackfen-leviathan", "Blackfen Leviathan", "game-icons/delapouite/fish-monster.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this dangerous giant is a legendary trophy catch.", purposes: ["trophy", "rare materials", "legendary catch"] })
    ],
    ["leeches", "frogs", "carrion-chum"],
    "Official 2024 travel terrain and 2014/Xanathar's swamp environment; Piranha is an official Underwater creature that fits swamp water."
  ),
  underdark: biome(
    "underdark",
    "Underdark",
    "Blind subterranean lakes and rivers support pale fish, eels, and aggressive carnivores.",
    [
      fish("glowcave-minnow", "Glowcave Minnow", "game-icons/delapouite/school-of-fish.svg", { rarity: "common" }),
      fish("cavefish", "Cavefish", "bluegill.svg", { rarity: "uncommon", edibleEffect: "No mechanical effect; cook thoroughly before eating.", purposes: ["downtime meal", "cave settlement trade"] }),
      fish("blind-eel", "Blind Eel", "trout.svg", { rarity: "rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; useful as oil or bait.", purposes: ["oil", "bait", "alchemical ingredient"] }),
      fish("quipper", "Quipper", "pike.svg", { rarity: "rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; treat as a dangerous carnivorous catch.", purposes: ["predator bait", "teeth", "trophy"], source: "official creature" }),
      fish("glowbass", "Glowbass", "bass.svg", { rarity: "very rare", edibleEffect: "No mechanical effect; cook thoroughly before eating.", purposes: ["downtime meal", "dim natural lure"] }),
      fish("blind-lake-leviathan", "Blind Lake Leviathan", "game-icons/delapouite/fish-monster.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this enormous cavern predator is a legendary trophy.", purposes: ["trophy", "teeth and hide", "legendary catch"] })
    ],
    ["glow-worms", "cave-grubs", "fungus-bait"],
    "Official 2024 travel terrain and 2014/Xanathar's Underdark environment; the official Quipper description specifically allows cold subterranean lakes."
  ),
  urban: biome(
    "urban",
    "Urban",
    "Canals, reservoirs, dockyards, and sewer outflows produce common catches with unpredictable quality.",
    [
      fish("canal-carp", "Canal Carp", "carp.svg", { rarity: "common" }),
      fish("dockside-bream", "Dockside Bream", "bluegill.svg", { rarity: "common", purposes: ["downtime meal", "street trade"] }),
      fish("sewer-eel", "Sewer Eel", "trout.svg", { rarity: "uncommon", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; contamination makes this a material catch.", purposes: ["oil", "bait", "evidence"] }),
      fish("lockjaw-gar", "Lockjaw Gar", "game-icons/delapouite/eel.svg", { rarity: "rare", purposes: ["downtime meal", "teeth and hide"] }),
      fish("gilded-canal-koi", "Gilded Canal Koi", "game-icons/delapouite/clownfish.svg", { rarity: "very rare", purposes: ["ornamental trade", "festival prize"] }),
      fish("sewer-leviathan", "Sewer Leviathan", "game-icons/delapouite/fish-monster.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this notorious giant is a legendary trophy catch.", purposes: ["trophy", "rare materials", "legendary catch"] })
    ],
    ["dough", "cheese", "scraps", "shiny-junk"],
    "Official 2024 travel terrain and Xanathar's urban encounter environment."
  ),
  underwater: biome(
    "underwater",
    "Underwater",
    "Open water and submerged habitats support specialized catches; some are creatures rather than food fish.",
    [
      fish("silver-sprat", "Silver Sprat", "game-icons/delapouite/school-of-fish.svg", { rarity: "common" }),
      fish("sea-snapper", "Sea Snapper", "bass.svg", { rarity: "uncommon", purposes: ["downtime meal", "salted provisions"] }),
      fish("deepwater-tuna", "Deepwater Tuna", "salmon.svg", { rarity: "rare", purposes: ["downtime meal", "salted provisions", "trade"] }),
      fish("quipper-schooler", "Quipper Schooler", "pike.svg", { rarity: "rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; the catch represents a dangerous aquatic specimen.", purposes: ["predator bait", "teeth", "trophy"], source: "official creature" }),
      fish("reef-shark", "Reef Shark", "pike.svg", { rarity: "very rare", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; treat as a dangerous rare catch.", purposes: ["shark teeth", "hide and oil", "trophy"], source: "official creature" }),
      fish("abyssal-leviathan", "Abyssal Leviathan", "game-icons/delapouite/sperm-whale.svg", { rarity: "legendary", catchType: "material", ration: 0, edibleEffect: "Not intended as a ration; this immense deepwater creature is a legendary trophy catch.", purposes: ["trophy", "bone and oil", "legendary catch"] })
    ],
    ["shrimp", "squid-strips", "chum"],
    "Official Xanathar's Underwater encounter environment; 2024 travel rules use Waterborne for travel across water."
  )
});

export const BIOME_ALIASES = freeze({ waterborne: "underwater", water: "underwater", aquatic: "underwater" });
export const BIOME_ORDER = freeze(Object.keys(FISHING_BIOMES));

export function normalizeBiomeId(value) {
  const key = String(value ?? "").trim().toLocaleLowerCase().replaceAll(" ", "-");
  return BIOME_ALIASES[key] ?? key;
}

export function getFishingBiome(value) {
  return FISHING_BIOMES[normalizeBiomeId(value)] ?? null;
}

export function getBiomeBait(biomeDefinition, value = null) {
  const biomeData = typeof biomeDefinition === "string" ? getFishingBiome(biomeDefinition) : biomeDefinition;
  if (!biomeData) return null;
  const requested = String(value ?? "").trim();
  const baitId = requested && biomeData.baitIds.includes(requested) ? requested : biomeData.baitIds[0];
  return BAIT_CATALOG[baitId] ?? null;
}

export function createBaitItemSource(baitDefinition, quantity = 1, { containerId = null } = {}) {
  const baitData = typeof baitDefinition === "string" ? BAIT_CATALOG[baitDefinition] : baitDefinition;
  if (!baitData) throw new Error("Choose a bait from the fishing catalog.");
  const description = `<p><strong>${baitData.name}</strong></p><p>${baitData.description}</p><p>${baitData.purpose}</p>`;
  return {
    name: baitData.name,
    type: "loot",
    img: baitData.img,
    system: {
      ...(containerId ? { container: String(containerId) } : {}),
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      weight: { value: 0, units: "lb" },
      description: { value: description, chat: description },
      price: { value: 0, denomination: "gp" }
    },
    flags: {
      "regionwright-hunting-gathering": {
        bait: { version: 1, baitId: baitData.id }
      }
    }
  };
}

export function createFishingGearItemSource(name, { type = "loot", quantity = 1, weight = 1, description, container = false, gearId = null } = {}) {
  const gearFlag = container
    ? { fishingTackle: { version: 1, itemId: gearId ?? "fishing-tackle", exclusive: "fishing-gear" } }
    : { fishingGear: { version: 1, gearId: gearId ?? "fishing-pole", gearType: "pole" } };
  return {
    name,
    type,
    img: "icons/containers/bag-sack-leather-brown.webp",
    system: {
      quantity,
      weight: { value: weight, units: "lb" },
      description: { value: `<p>${description}</p>`, chat: `<p>${description}</p>` },
      price: { value: 1, denomination: "gp" },
      ...(container ? { capacity: { type: "weight", value: 20, units: "lb" } } : {})
    },
    flags: { "regionwright-hunting-gathering": gearFlag }
  };
}

export function createFishingItemSources() {
  return [
    createFishingGearItemSource("Fishing Pole", {
      gearId: "fishing-pole",
      weight: 4,
      description: "A simple pole, line, hook, and bobber for freshwater or coastal fishing. Required to cast in the Fishing Biomes & Minigame."
    }),
    createFishingGearItemSource("Fishing Tackle", {
      gearId: "fishing-tackle",
      type: "container",
      weight: 4,
      container: true,
      description: "An optional tackle box for fishing gear only. The module prevents unrelated items from being stored inside."
    }),
    ...Object.values(BAIT_CATALOG).map(bait => createBaitItemSource(bait, 3))
  ];
}
