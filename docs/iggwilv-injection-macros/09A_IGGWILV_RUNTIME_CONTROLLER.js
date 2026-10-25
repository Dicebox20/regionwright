/**
 * IGG | Runtime Controller
 *
 * Save this entire file as a Foundry Script Macro named exactly:
 * IGG | Runtime Controller
 *
 * Do not run it manually. Region Execute Script behaviors call it with
 * { region, event }. World/Actor Items are resolved by exact name only.
 */

if (!game.user.isGM) return;

const REGION = typeof region !== "undefined" ? region : null;
const EVENT = typeof event !== "undefined" ? event : {};
if (!REGION) throw new Error("IGG Runtime Controller requires a Region.");

const MODULE_ID = "regionwright";
const STATE_JOURNAL = "IGG | Runtime State";
const CONTROLLER_NAME = "IGG | Runtime Controller";
const ACTORS = Object.freeze({
  nixie: "Actor.88UZTmEStCJvgRQA",
  adultFaerieDragon: "Actor.ZxwpNOpwal02ivlJ",
  childFaerieDragon: "Actor.6Qz6BnNqn3eegGKJ",
  vampire: "Actor.yp5N7pZJ55H7JAu1",
  treant: "Actor.p6Fe5QOVEoGfeWA9",
  cambion: "Actor.zIuxjSzp3qPbFdJF"
});
const PLANT_INGREDIENTS = Object.freeze(["Red Leaf Fern", "Epsom Salts", "Blood Meal", "Calcium-Rich Bone Meal"]);
const SUMMONING_COMPONENTS = Object.freeze(["Demon Skull", "Black Tallow Candles", "Powdered Silver"]);

const regionConfig = REGION.flags?.regionwright?.iggwilvTower ?? {};
const regionKey = String(regionConfig.regionKey ?? REGION.name?.match(/IGG\s*\|\s*([A-Z]\d{2})\s*\|/)?.[1] ?? "");
if (!regionKey) throw new Error(`Cannot determine the Tower key for ${REGION.name}.`);

const tokenDocument = EVENT?.data?.token?.document ?? EVENT?.data?.token ?? EVENT?.token?.document ?? EVENT?.token ?? null;
const triggeringActor = tokenDocument?.actor ?? (tokenDocument?.actorId ? game.actors.get(tokenDocument.actorId) : null);
const eventName = String(EVENT?.name ?? EVENT?.type ?? EVENT?.event ?? "tokenEnter");
if (!new Set(["tokenEnter", "enter", "puzzleSolved"]).has(eventName)) return;

const debounce = globalThis.__iggwilvTowerDebounce ??= new Set();
const debounceKey = `${REGION.uuid}:${tokenDocument?.uuid ?? triggeringActor?.uuid ?? "none"}:${eventName}:${Math.floor(Date.now() / 750)}`;
if (debounce.has(debounceKey)) return;
debounce.add(debounceKey);
setTimeout(() => debounce.delete(debounceKey), 1500);

let stateJournal = game.journal.getName(STATE_JOURNAL);
if (!stateJournal) stateJournal = await JournalEntry.create({ name: STATE_JOURNAL, ownership: { default: 0 } });
let state = foundry.utils.deepClone(stateJournal.flags?.regionwright?.iggwilvTowerState ?? {});

async function saveState(patch = {}) {
  const current = foundry.utils.deepClone(stateJournal.flags?.regionwright?.iggwilvTowerState ?? {});
  state = foundry.utils.mergeObject(current, patch, { inplace: false, insertKeys: true, overwrite: true });
  await stateJournal.setFlag(MODULE_ID, "iggwilvTowerState", state);
  return state;
}

async function announce(message, { whisperGM = false } = {}) {
  const content = `<p><strong>Iggwilv's Tower:</strong> ${message}</p>`;
  await ChatMessage.create({ content, whisper: whisperGM ? ChatMessage.getWhisperRecipients("GM").map(user => user.id) : [] });
}

function exactWorldItem(name) {
  return game.items.find(item => item.name === name) ?? null;
}

function actorItem(actor, name) {
  return actor?.items?.find(item => item.name === name) ?? null;
}

function quantity(item) {
  const value = Number(item?.system?.quantity ?? 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

async function grant(actor, name, amount = 1) {
  if (!actor) throw new Error(`${regionKey} needs a triggering Actor to receive ${name}.`);
  const existing = actorItem(actor, name);
  if (existing) {
    await existing.update({ "system.quantity": quantity(existing) + amount });
    return existing;
  }
  const source = exactWorldItem(name);
  if (!source) throw new Error(`Missing exact world Item: ${name}`);
  const data = source.toObject();
  delete data._id;
  delete data.folder;
  data.system ??= {};
  data.system.quantity = amount;
  return (await actor.createEmbeddedDocuments("Item", [data]))[0];
}

function has(actor, name, amount = 1) {
  const item = actorItem(actor, name);
  return Boolean(item && quantity(item) >= amount);
}

function missing(actor, names) {
  return names.filter(name => !has(actor, name));
}

async function consume(actor, name, amount = 1) {
  const item = actorItem(actor, name);
  if (!item || quantity(item) < amount) return false;
  const remaining = quantity(item) - amount;
  if (remaining > 0) await item.update({ "system.quantity": remaining });
  else await actor.deleteEmbeddedDocuments("Item", [item.id]);
  return true;
}

async function consumeAll(actor, names) {
  const absent = missing(actor, names);
  if (absent.length) return absent;
  for (const name of names) await consume(actor, name);
  return [];
}

function allTowerRegions() {
  return game.scenes.contents.flatMap(scene => Array.from(scene.regions ?? []));
}

function towerRegion(key) {
  return allTowerRegions().find(candidate => candidate.flags?.regionwright?.iggwilvTower?.regionKey === key) ?? null;
}

function ownedBehavior(behavior, role = null) {
  const data = behavior.flags?.regionwright?.iggwilvTowerBehavior;
  return Boolean(data && (!role || data.role === role));
}

async function setTeleportEnabled(key, enabled) {
  const target = towerRegion(key);
  if (!target) throw new Error(`Missing Tower Region ${key}.`);
  const behavior = Array.from(target.behaviors ?? []).find(entry => ownedBehavior(entry, "teleport"));
  if (!behavior) throw new Error(`Missing owned teleport behavior on ${key}.`);
  if (behavior.disabled === enabled) await target.updateEmbeddedDocuments("RegionBehavior", [{ _id: behavior.id, disabled: !enabled }]);
  return behavior;
}

function actorIdFromUuid(uuid) {
  return String(uuid ?? "").split(".").at(-1);
}

function sceneTokensForActor(scene, actorUuid, fallbackName = "") {
  const actorId = actorIdFromUuid(actorUuid);
  return Array.from(scene?.tokens ?? []).filter(token => token.actorId === actorId || (fallbackName && token.name === fallbackName));
}

async function ensureToken(actorUuid, targetRegion, { hidden = false, name = "" } = {}) {
  const scene = targetRegion.parent;
  let tokens = sceneTokensForActor(scene, actorUuid, name);
  if (tokens.length) return tokens;
  const actor = await fromUuid(actorUuid);
  if (!actor) throw new Error(`Missing Actor ${actorUuid}.`);
  const shape = targetRegion.shapes?.[0];
  const size = Number(scene.grid?.size ?? 64);
  const x = Number(shape?.x ?? scene.dimensions.sceneX) + Math.max(0, (Number(shape?.width ?? size) - size) / 2);
  const y = Number(shape?.y ?? scene.dimensions.sceneY) + Math.max(0, (Number(shape?.height ?? size) - size) / 2);
  const token = await actor.getTokenDocument({ x, y, hidden });
  tokens = await scene.createEmbeddedDocuments("Token", [token.toObject()]);
  return tokens;
}

async function revealTokens(tokens) {
  const updates = tokens.filter(token => token.hidden).map(token => ({ _id: token.id, hidden: false }));
  if (updates.length) await tokens[0].parent.updateEmbeddedDocuments("Token", updates);
}

function defeated(tokens) {
  return tokens.length > 0 && tokens.every(token => Number(token.actor?.system?.attributes?.hp?.value ?? 1) <= 0);
}

function regionPuzzleStatus(target, flag) {
  return target.flags?.regionwright?.[flag]?.persistent?.status ?? null;
}

function puzzleRecipientEvent() {
  if (EVENT?.userId ?? EVENT?.data?.userId) return EVENT;
  const owner = game.users.find(user => user.active && !user.isGM && triggeringActor?.testUserPermission?.(user, "OWNER"));
  return { ...EVENT, userId: owner?.id ?? game.user.id };
}

function installPuzzleWatcher(target, flag, onSolved) {
  const watchers = globalThis.__iggwilvTowerPuzzleWatchers ??= new Map();
  if (watchers.has(target.uuid)) return;
  const hookId = Hooks.on("updateRegion", async document => {
    if (document.uuid !== target.uuid || regionPuzzleStatus(document, flag) !== "solved") return;
    Hooks.off("updateRegion", hookId);
    watchers.delete(target.uuid);
    try { await onSolved(document); }
    catch (error) {
      console.error("Iggwilv puzzle completion failed", error);
      ui.notifications.error(error.message ?? "Iggwilv puzzle completion failed.");
    }
  });
  watchers.set(target.uuid, hookId);
}

async function requireItems(actor, names, message) {
  const absent = missing(actor, names);
  if (!absent.length) return true;
  await announce(`${message} Missing: ${absent.join(", ")}.`);
  return false;
}

async function handleIngredientPuzzle() {
  const status = regionPuzzleStatus(REGION, "ingredientMixing");
  if (state.plantFoodMixed || status === "solved") {
    if (!state.plantFoodMixed) {
      const absent = await consumeAll(triggeringActor, PLANT_INGREDIENTS);
      if (absent.length) return announce(`The cauldron is solved, but the ingredients are no longer together. Missing: ${absent.join(", ")}.`, { whisperGM: true });
      await grant(triggeringActor, "Fey-Infused Plant Food");
      await saveState({ plantFoodMixed: true });
    }
    return announce("The cauldron's completed mixture has already produced Fey-Infused Plant Food.");
  }
  if (!await requireItems(triggeringActor, PLANT_INGREDIENTS, "The cauldron requires all four ingredients.")) return;
  const mix = game.modules.get(MODULE_ID)?.api?.premium?.ingredientMixing;
  if (typeof mix?.handleRegionEvent !== "function") throw new Error("Regionwright Ingredient Mixing is unavailable.");
  installPuzzleWatcher(REGION, "ingredientMixing", async () => {
    const absent = await consumeAll(triggeringActor, PLANT_INGREDIENTS);
    if (absent.length) throw new Error(`Cannot finish the recipe; missing ${absent.join(", ")}.`);
    await grant(triggeringActor, "Fey-Infused Plant Food");
    await saveState({ plantFoodMixed: true });
    await announce("The balanced mixture becomes Fey-Infused Plant Food.");
  });
  await mix.handleRegionEvent(REGION, puzzleRecipientEvent());
}

async function handleBookcasePuzzle() {
  const status = regionPuzzleStatus(REGION, "spineMosaic");
  if (state.bookcaseSolved || status === "solved") {
    await saveState({ bookcaseSolved: true });
    await setTeleportEnabled("T11", true);
    return announce("The arranged book spines reveal the hidden passage. Step out and re-enter the bookcase Region to pass through.");
  }
  const spine = game.modules.get(MODULE_ID)?.api?.premium?.spineMosaic;
  if (typeof spine?.handleRegionEvent !== "function") throw new Error("Regionwright Spine Mosaic is unavailable.");
  installPuzzleWatcher(REGION, "spineMosaic", async () => {
    await saveState({ bookcaseSolved: true });
    await setTeleportEnabled("T11", true);
    await announce("The completed spine mosaic unlocks the hidden bookcase passage. Step out and re-enter to pass through.");
  });
  await spine.handleRegionEvent(REGION, puzzleRecipientEvent());
}

switch (regionKey) {
  case "T11": return handleBookcasePuzzle();
  case "P06": return handleIngredientPuzzle();

  case "P01":
    if (!state.starTaken) { await grant(triggeringActor, "Star"); await saveState({ starTaken: true }); await announce("The central Star detaches from the wall relief."); }
    return;
  case "G01":
    if (!state.studyUnlocked && await requireItems(triggeringActor, ["Star"], "The hollow socket requires its missing Star.")) {
      await consume(triggeringActor, "Star"); await saveState({ studyUnlocked: true }); await setTeleportEnabled("T09", true); await announce("The Star seats into the relief and the Private Study unlocks.");
    }
    return;
  case "P02":
    if (!state.cabinetKeyTaken) { await grant(triggeringActor, "Ingredient Cabinet Key"); await saveState({ cabinetKeyTaken: true }); await announce("The Ingredient Cabinet Key is taken from Iggwilv's desk."); }
    return;
  case "G02":
    if (!state.cabinetOpened && await requireItems(triggeringActor, ["Ingredient Cabinet Key"], "The reinforced cabinet remains locked.")) {
      await grant(triggeringActor, "Astral Water"); await grant(triggeringActor, "Demon Skull"); await saveState({ cabinetOpened: true }); await announce("The cabinet opens, yielding Astral Water and a Demon Skull.");
    }
    return;
  case "P03":
    if (!state.hourglassFound) { await grant(triggeringActor, "Hourglass Coven's Hourglass"); await saveState({ hourglassFound: true }); await announce("The Hourglass Coven's Hourglass reveals the answer hidden in its theme: HOURGLASS."); }
    return;
  case "G03":
    if (!state.hourglassSolved && await requireItems(triggeringActor, ["Hourglass Coven's Hourglass"], "The statue's riddle refers to a discovery elsewhere in the tower.")) {
      await grant(triggeringActor, "Powdered Silver"); await saveState({ hourglassSolved: true }); await announce("HOURGLASS answers the riddle. The statue releases Powdered Silver.");
    }
    return;
  case "P04": {
    const skeletons = Array.from(REGION.parent.tokens ?? []).filter(token => /skeleton/i.test(token.name));
    if (skeletons.some(token => token.hidden)) { await revealTokens(skeletons); await announce("The milk-drinking skeletons rise from their table!"); return; }
    if (!skeletons.length || defeated(skeletons)) {
      if (!state.skeletonBonesTaken) { await grant(triggeringActor, "Skeleton Bones"); await saveState({ skeletonBonesTaken: true }); await announce("The party gathers calcium-rich Skeleton Bones."); }
    } else await announce("The skeleton encounter must be resolved before their bones can be collected.");
    return;
  }
  case "P05":
    if (!state.boneMealCrafted && await requireItems(triggeringActor, ["Skeleton Bones"], "The mortar and pestle need suitable bones.")) {
      await consume(triggeringActor, "Skeleton Bones"); await grant(triggeringActor, "Calcium-Rich Bone Meal"); await saveState({ boneMealCrafted: true }); await announce("The bones are ground into Calcium-Rich Bone Meal.");
    }
    return;
  case "P07":
    if (!state.sunglobeTaken) { await grant(triggeringActor, "Sunglobe"); await saveState({ sunglobeTaken: true }); await announce("The portable Sunglobe shines with true sunlight."); }
    return;
  case "P08":
    if (!state.epsomSaltsTaken) { await grant(triggeringActor, "Epsom Salts"); await saveState({ epsomSaltsTaken: true }); await announce("The Epsom Salts are taken from beside the foot-soaking tub."); }
    return;
  case "P09":
    if (!state.redLeafFernTaken) { await grant(triggeringActor, "Red Leaf Fern"); await saveState({ redLeafFernTaken: true }); await announce("A usable Red Leaf Fern is taken from the botanical collection."); }
    return;
  case "P10":
    if (!state.vampireCooperates) { await ensureToken(ACTORS.vampire, REGION, { name: "Cowardly Vampire Ritual Assistant" }); await grant(triggeringActor, "Blood Meal"); await saveState({ vampireCooperates: true, bloodMealTaken: true }); await announce("The cowardly vampire backs down, hands over his Blood Meal, and agrees to conduct the ritual."); }
    return;
  case "P11": {
    if (!state.crowsFootKeyTaken) {
      await grant(triggeringActor, "Obsidian Crow's-Foot Key");
      const swords = Array.from(REGION.parent.tokens ?? []).filter(token => /flying sword/i.test(token.name));
      await revealTokens(swords);
      await saveState({ crowsFootKeyTaken: true, swordTrapTriggered: swords.length > 0 });
      await announce(swords.length ? "The Crow's-Foot Key comes free—and the mounted swords animate!" : "The Obsidian Crow's-Foot Key is removed from its display.");
    }
    return;
  }
  case "G04":
    if (!state.portraitOpened && await requireItems(triggeringActor, ["Obsidian Crow's-Foot Key"], "The portrait frame has a matching Crow's-Foot socket.")) {
      await grant(triggeringActor, "Iggwilv's Sovereign Seal"); await saveState({ portraitOpened: true }); await announce("The portrait releases Iggwilv's Sovereign Seal.");
    }
    return;
  case "P12":
    if (!state.candlesTaken) { await grant(triggeringActor, "Black Tallow Candles"); await saveState({ candlesTaken: true }); await announce("The Black Tallow Candles are recovered from the hidden library."); }
    return;
  case "G05":
    if (!state.treantSun && await requireItems(triggeringActor, ["Sunglobe"], "This station requires magical sunlight.")) { await saveState({ treantSun: true }); await announce("The Sunglobe bathes the dormant Astral Treant in true sunlight."); }
    return;
  case "G06":
    if (!state.treantWater && await requireItems(triggeringActor, ["Astral Water"], "The root basin is dry.")) { await consume(triggeringActor, "Astral Water"); await saveState({ treantWater: true }); await announce("Astral Water flows into the Treant's root basin."); }
    return;
  case "G07":
    if (!state.treantFood && await requireItems(triggeringActor, ["Fey-Infused Plant Food"], "The root bed needs a potent fertilizer.")) { await consume(triggeringActor, "Fey-Infused Plant Food"); await saveState({ treantFood: true }); await announce("Fey-Infused Plant Food sinks into the Treant's root bed."); }
    return;
  case "E01": {
    if (!(state.treantSun && state.treantWater && state.treantFood)) return announce("The Astral Treant remains dormant. It still needs sunlight, Astral Water, and Fey-Infused Plant Food.");
    const tokens = await ensureToken(ACTORS.treant, REGION, { hidden: true, name: "Astral Treant" });
    if (!state.treantAwake) { await revealTokens(tokens); await saveState({ treantAwake: true }); await announce("Restored by all three offerings, the Astral Treant awakens!"); return; }
    if (!state.treantResolved && defeated(tokens)) { await grant(triggeringActor, "Astral Fruit"); await saveState({ treantResolved: true }); await announce("The defeated Astral Treant produces a luminous Astral Fruit."); }
    else if (!state.treantResolved) await announce("The awakened Astral Treant must be overcome before its fruit can be claimed.");
    return;
  }
  case "P13":
    if (!state.feyWaterMade) {
      if (!has(triggeringActor, "Ordinary Water")) await grant(triggeringActor, "Ordinary Water");
      await ensureToken(ACTORS.adultFaerieDragon, REGION, { name: "Adult Faerie Dragon" });
      await ensureToken(ACTORS.childFaerieDragon, REGION, { name: "Child Faerie Dragon" });
      await consume(triggeringActor, "Ordinary Water"); await grant(triggeringActor, "Fey-Infused Water"); await saveState({ feyWaterMade: true }); await announce("The faerie dragons playfully infuse ordinary water with Feywild magic.");
    }
    return;
  case "G08":
    if (!state.nixieRevived && await requireItems(triggeringActor, ["Fey-Infused Water"], "The desiccated Nixie's vertical tank needs enchanted water.")) {
      await consume(triggeringActor, "Fey-Infused Water"); await ensureToken(ACTORS.nixie, REGION, { name: "Nixie" }); await saveState({ nixieRevived: true }); await announce("The tank fills and the two-foot-tall Nixie slowly revives.");
    }
    return;
  case "G09":
    if (!state.nixieRevived) return announce("The Nixie must first be revived with Fey-Infused Water.");
    if (!state.nixieFed && await requireItems(triggeringActor, ["Astral Fruit"], "The revived Nixie demands her favorite food.")) {
      await consume(triggeringActor, "Astral Fruit"); await grant(triggeringActor, "Arcane Lock Password"); await saveState({ nixieFed: true }); await announce("Pleased by the Astral Fruit, the Nixie reveals the Arcane Lock Password.");
    }
    return;
  case "G10": {
    if (!state.vampireCooperates) return announce("The cowardly vampire ritual assistant must first be convinced to cooperate.");
    if (!state.cambionSummoned) {
      if (!await requireItems(triggeringActor, SUMMONING_COMPONENTS, "The containment ritual requires three physical components.")) return;
      await consumeAll(triggeringActor, SUMMONING_COMPONENTS);
      const tokens = await ensureToken(ACTORS.cambion, REGION, { hidden: true, name: "Cambion" });
      await revealTokens(tokens); await saveState({ cambionSummoned: true }); await announce("The vampire completes the ritual. A Cambion manifests inside the containment ring!"); return;
    }
    const tokens = sceneTokensForActor(REGION.parent, ACTORS.cambion, "Cambion");
    if (!state.cambionResolved && defeated(tokens)) { await grant(triggeringActor, "Obsidian Thorn"); await saveState({ cambionResolved: true }); await announce("The overcome Cambion yields the Obsidian Thorn."); }
    else if (!state.cambionResolved) await announce("The Cambion must be overcome before the Obsidian Thorn can be claimed.");
    return;
  }
  case "G11":
    if (!state.vaultUnlocked && await requireItems(triggeringActor, ["Iggwilv's Sovereign Seal", "Arcane Lock Password"], "The Arcane Vault has exactly two requirements.")) {
      await saveState({ vaultUnlocked: true }); await setTeleportEnabled("T15", true); await announce("The Sovereign Seal and Arcane Lock Password release the two-part vault lock.");
    }
    return;
  case "P14":
    if (!state.ivoryThornTaken) { await grant(triggeringActor, "Ivory Thorn"); await saveState({ ivoryThornTaken: true }); await announce("The Ivory Thorn is removed from its secure reliquary."); }
    return;
  case "P15":
    if (!state.thornKeyForged && await requireItems(triggeringActor, ["Ivory Thorn", "Obsidian Thorn"], "Both thorn halves are required.")) {
      await consumeAll(triggeringActor, ["Ivory Thorn", "Obsidian Thorn"]); await grant(triggeringActor, "Thorn Key"); await saveState({ thornKeyForged: true }); await announce("The Ivory and Obsidian Thorns join into the completed Thorn Key.");
    }
    return;
  case "G12":
    if (!state.roseDoorOpened && await requireItems(triggeringActor, ["Thorn Key"], "The rose-shaped lock requires the completed Thorn Key.")) {
      await consume(triggeringActor, "Thorn Key"); await saveState({ roseDoorOpened: true }); await announce("The Thorn Key turns. Sculpted vines retract and the rose door opens toward Floor 3.");
    }
    return;
  default:
    console.warn(`IGG Runtime Controller has no action for ${regionKey}.`);
}
