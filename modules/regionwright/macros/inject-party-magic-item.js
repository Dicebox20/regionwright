/*
 * Regionwright package-owned GM injection: Party Reserve Magic Item v1.
 * Fixed source item: Rod of Security. The macro searches installed Item
 * compendia by exact name, creates one world Item, and never fabricates data.
 */
const expectedWorldId = "the-lost-mine-of-phandalin";
const expectedFoundry = "14.367";
const expectedSystem = "dnd5e@5.3.3";
const sourceItemName = "Rod of Security";
const createdItemName = "Rod of Security (Party Reserve)";
const injectionId = "regionwright-party-magic-item-rod-of-security-v1";

const foundryVersion = String(game.version ?? game.release?.version ?? "");
const systemVersion = `${game.system?.id ?? ""}@${game.system?.version ?? ""}`;
if (game.world?.id !== expectedWorldId || foundryVersion !== expectedFoundry || systemVersion !== expectedSystem) {
  ui.notifications.error(`Blocked: this item injection is only for Into the Feywild (${expectedWorldId}), Foundry ${expectedFoundry}, ${expectedSystem}.`);
} else if (!game.user?.isGM) {
  ui.notifications.error("Blocked: the party item injection requires a GM.");
} else {
  const owned = game.items.contents.filter(item => item.flags?.regionwright?.partyMagicItem?.injectionId === injectionId);
  const sameName = game.items.contents.filter(item => item.name === createdItemName);
  if (owned.length > 1) {
    ui.notifications.error("Blocked: duplicate Regionwright party items detected; no change made.");
  } else if (owned.length === 0 && sameName.some(item => item.flags?.regionwright?.partyMagicItem?.injectionId !== injectionId)) {
    ui.notifications.error("Blocked: a foreign Item already uses the party reserve name; no change made.");
  } else if (owned.length === 1) {
    const readback = owned[0];
    const ownership = readback.ownership?.toObject?.() ?? readback.ownership ?? {};
    if (ownership.default !== 1) {
      ui.notifications.error("Blocked: the existing party item does not have explicit Player ownership.");
    } else {
      ui.notifications.info(`Party Reserve item already exists (${readback.uuid}).`);
      console.info("Regionwright party magic item receipt", { operation: "regionwright.partyMagicItem.inject", status: "PASS", created: 0, updated: 0, sourceItemName, itemName: readback.name, uuid: readback.uuid, ownership, playerUsable: true });
    }
  } else {
    let source = null;
    let sourcePack = null;
    for (const pack of game.packs) {
      if (pack.documentName !== "Item") continue;
      const index = await pack.getIndex();
      const row = index.find(entry => entry.name === sourceItemName && (entry.type === "loot" || entry.type === "equipment" || entry.type === "consumable" || entry.type === "weapon" || entry.type === "feat" || !entry.type));
      if (row) {
        source = await pack.getDocument(row._id);
        sourcePack = pack.collection;
        break;
      }
    }
    if (!source) {
      ui.notifications.error(`Blocked: exact library Item '${sourceItemName}' was not found in an installed Item compendium.`);
    } else {
      const data = source.toObject();
      delete data._id;
      delete data.folder;
      data.name = createdItemName;
      data.ownership = { ...(data.ownership ?? {}), default: 1, [game.user.id]: 3 };
      data.flags = { ...(data.flags ?? {}), regionwright: { ...(data.flags?.regionwright ?? {}), partyMagicItem: { injectionId, version: "1.0.0", sourceItemName, sourcePack, playerUsable: true } } };
      const created = await Item.create(data, { renderSheet: false });
      const readback = game.items.contents.find(item => item.uuid === created.uuid || item.flags?.regionwright?.partyMagicItem?.injectionId === injectionId);
      const ownership = readback?.ownership?.toObject?.() ?? readback?.ownership ?? {};
      if (!readback || ownership.default !== 1 || ownership[game.user.id] !== 3) {
        ui.notifications.error("Party item injection failed authoritative Item ownership readback.");
      } else {
        const receipt = { operation: "regionwright.partyMagicItem.inject", status: "PASS", worldId: game.world.id, sourceItemName, sourcePack, itemName: readback.name, uuid: readback.uuid, created: 1, ownership, playerUsable: true, partyUtility: "group shelter and emergency refuge" };
        console.info("Regionwright party magic item receipt", receipt);
        ui.notifications.info(`Created ${readback.name}. Players have explicit ownership and may use it as a shared party resource.`);
      }
    }
  }
}
