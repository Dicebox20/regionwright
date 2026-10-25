const MODULE_ID = "regionwright-hunting-gathering";

export const FISHING_IMAGE_MACRO_ID = "assign-srd-images";
export const FISHING_IMAGE_MACRO_NAME = "Fishing — Assign D&D SRD Images";

const GENERIC_IMAGE_NAMES = new Set([
  "icons/svg/fish.svg",
  "icons/svg/mystery-man.svg",
  "icons/svg/item-bag.svg",
  "icons/svg/book.svg"
]);

const CREATURE_IMAGE_PATH = /(?:^|\/)icons\/creatures\//i;

const TARGET_ALIASES = Object.freeze({
  "fishing pole": ["fishing rod", "rod", "pole"],
  "fishing tackle": ["tackle", "fishing gear", "fishing kit", "fishing net"],
  worms: ["worm", "earthworm"],
  grubs: ["grub", "larva", "larvae"],
  "live minnows": ["minnow", "fish"],
  "ice minnows": ["minnow", "fish", "ice"],
  "crickets and grasshoppers": ["cricket", "grasshopper", "insect"],
  "bread dough": ["bread", "dough"],
  "cheese scraps": ["cheese"],
  "salmon roe": ["salmon", "roe", "fish eggs"],
  "stonefly nymphs": ["stonefly", "nymph"],
  shrimp: ["shrimp", "prawn"],
  "squid strips": ["squid"],
  "fish chum": ["chum", "fish", "bait"],
  "oasis grubs": ["grub", "larva", "desert"],
  "date dough": ["date", "dough"],
  "beetle larvae": ["beetle", "larva", "insect"],
  "crayfish tails": ["crayfish", "crawfish", "lobster"],
  leeches: ["leech"],
  "small frogs": ["frog", "toad"],
  "carrion chum": ["carrion", "chum", "meat"],
  glowworms: ["glowworm", "worm", "lantern"],
  "cave grubs": ["grub", "larva", "cave"],
  "fungal bait": ["fungus", "mushroom", "spore"],
  "kitchen scraps": ["scraps", "food", "meat"],
  "shiny junk": ["shiny", "trinket", "lure"]
});

const FISH_TERMS = Object.freeze([
  "fish", "trout", "salmon", "bass", "pike", "carp", "bluegill", "perch",
  "mackerel", "rockfish", "shark", "tuna", "eel", "quipper", "crayfish", "shrimp"
]);

const normalize = value => String(value ?? "")
  .toLocaleLowerCase()
  .replace(/[’']/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const tokens = value => normalize(value).split(" ").filter(Boolean);

function packageText(pack) {
  const metadata = pack?.metadata ?? {};
  return [
    metadata.packageName,
    metadata.package,
    metadata.packageId,
    metadata.label,
    metadata.name,
    metadata.title,
    pack?.collection
  ].filter(Boolean).join(" ");
}

export function isDndSrdItemPack(pack) {
  if (pack?.documentName && pack.documentName !== "Item") return false;
  const metadata = pack?.metadata ?? {};
  const packageId = String(metadata.packageName ?? metadata.package ?? metadata.packageId ?? "").toLocaleLowerCase();
  const text = packageText(pack);
  const looksLikeDnd = packageId === "dnd5e"
    || /(?:^|[.:_ -])dnd5e(?:$|[.:_ -])/i.test(text)
    || /d\s*&\s*d|dungeons?\s*(?:and|&)\s*dragons?|dnd\s*5e/i.test(text);
  if (!looksLikeDnd) return false;
  return packageId === "dnd5e" || /srd|modern\s+content|legacy\s+content/i.test(text);
}

export function isUsableSrdImage(image) {
  const value = String(image ?? "").trim();
  if (!value || GENERIC_IMAGE_NAMES.has(value.toLocaleLowerCase())) return false;
  if (/^data:/i.test(value) || /(?:^|\/)icons\/svg\//i.test(value)) return false;
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value)
    || /(?:^|\/)(?:assets|icons|images|artwork|portraits|tokens|systems|modules)\//i.test(value);
}

export function isCreatureSrdImage(image) {
  return isUsableSrdImage(image) && CREATURE_IMAGE_PATH.test(String(image ?? "").trim());
}

function targetAliases(targetName) {
  const normalized = normalize(targetName);
  return [normalized, ...(TARGET_ALIASES[normalized] ?? [])].filter(Boolean);
}

function targetKind(targetName) {
  const normalized = normalize(targetName);
  if (normalized === "fishing pole" || normalized === "fishing tackle") return "gear";
  return "bait";
}

function candidateScore(targetName, candidate) {
  const name = normalize(candidate?.name);
  if (!name || !isUsableSrdImage(candidate?.img)) return -1;
  const aliases = targetAliases(targetName);
  const targetTokens = tokens(targetName);
  const candidateTokens = new Set(tokens(candidate.name));
  const target = normalize(targetName);
  let score = 0;
  if (name === target) score += 10000;
  if (aliases.slice(1).some(alias => name === normalize(alias))) score += 7000;
  if (targetTokens.length && targetTokens.every(token => candidateTokens.has(token))) score += 5000;
  for (const alias of aliases.slice(1)) {
    const aliasTokens = tokens(alias);
    if (aliasTokens.length && aliasTokens.every(token => candidateTokens.has(token))) score += 2500;
    else if (alias && name.includes(normalize(alias))) score += 1200;
  }

  const kind = targetKind(targetName);
  const isFish = FISH_TERMS.some(term => name.includes(term) || String(candidate.img).toLocaleLowerCase().includes(term));
  if (kind === "bait" && isFish) score += 500;
  if (isFish) score += 100;
  if (kind === "gear" && /fishing|tackle|rod|pole|net|line|hook/.test(name)) score += 800;
  return score > 0 ? score : -1;
}

export function chooseSrdImage(targetName, candidates, usedImages = new Set()) {
  const ranked = Array.from(candidates ?? [])
    .map(candidate => ({ candidate, score: candidateScore(targetName, candidate) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      const unused = Number(usedImages.has(left.candidate.img)) - Number(usedImages.has(right.candidate.img));
      return right.score - left.score || unused || String(left.candidate.name).localeCompare(String(right.candidate.name));
    });
  return ranked.find(entry => !usedImages.has(entry.candidate.img))?.candidate
    ?? ranked[0]?.candidate
    ?? null;
}

export function fishingItemIdentity(item) {
  const flags = [MODULE_ID, "regionwright-fishing", "regionwright"]
    .map(scope => item?.flags?.[scope] ?? item?._source?.flags?.[scope] ?? {})
    .find(scope => scope.bait?.baitId || scope.fishingGear?.gearId || scope.fishingTackle?.itemId) ?? {};
  if (flags.bait?.baitId) return `bait:${flags.bait.baitId}`;
  if (flags.fishingGear?.gearId) return `gear:${flags.fishingGear.gearId}`;
  if (flags.fishingTackle?.itemId) return `tackle:${flags.fishingTackle.itemId}`;
  return null;
}

export function createFishingImageMacroSource() {
  return `(async () => {
  try {
    if (!game.user?.isGM) return ui.notifications.warn("Only a GM can assign fishing item images.");
    const fishing = game.modules.get("${MODULE_ID}")?.api;
     if (typeof fishing?.assignSrdImages !== "function") return ui.notifications.error("Enable Regionwright: Hunting & Gathering first.");
    const result = await fishing.assignSrdImages();
    ui.notifications.info("Fishing image assignment complete: " + result.updated + " updated, " + (result.reset ?? 0) + " reset, " + result.unchanged + " unchanged, " + result.missing.length + " unmatched.");
  } catch (error) {
    console.error("[regionwright-hunting-gathering] SRD image assignment failed.", error);
    ui.notifications.error("Fishing image assignment failed: " + (error?.message ?? error));
  }
})();`;
}
