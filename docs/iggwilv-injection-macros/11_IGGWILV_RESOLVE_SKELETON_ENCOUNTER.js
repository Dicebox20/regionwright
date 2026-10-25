/**
 * Iggwilv's Tower — Resolve Skeleton Encounter and Collect Bones
 * Select exactly one player token to receive the bones, then run as GM.
 */

if (!game.user.isGM) throw new Error("Run this macro as a GM.");

const selected = canvas.tokens.controlled.filter(token => token.actor);
if (selected.length !== 1) {
  throw new Error(`Select exactly one character token to collect the Skeleton Bones; currently selected: ${selected.length}.`);
}

const actor = selected[0].actor;
let source = game.items.find(item => item.name === "Skeleton Bones");
if (!source) {
  source = await Item.create({
    name: "Skeleton Bones",
    type: "loot",
    img: "icons/commodities/bones/bones-stack-tan.webp",
    system: {
      quantity: 1,
      description: { value: "<p>Calcium-rich bones recovered from the milk-drinking skeletons in Iggwilv's Private Library.</p>" }
    }
  });
}

const existing = actor.items.find(item => item.name === "Skeleton Bones");
if (existing) {
  const quantity = Math.max(1, Number(existing.system?.quantity ?? 1));
  await existing.update({ "system.quantity": quantity + 1 });
} else {
  const data = source.toObject();
  delete data._id;
  delete data.folder;
  data.system ??= {};
  data.system.quantity = 1;
  await actor.createEmbeddedDocuments("Item", [data]);
}

let journal = game.journal.getName("IGG | Runtime State");
if (!journal) journal = await JournalEntry.create({ name: "IGG | Runtime State", ownership: { default: 0 } });
const state = foundry.utils.deepClone(journal.flags?.regionwright?.iggwilvTowerState ?? {});
state.skeletonEncounterResolved = true;
state.skeletonBonesTaken = true;
state.skeletonBonesCollector = actor.uuid;
state.skeletonEncounterResolvedAt = Date.now();
await journal.setFlag("regionwright", "iggwilvTowerState", state);

ui.notifications.info(`${actor.name} collects the Skeleton Bones. The Private Library encounter is resolved.`);

