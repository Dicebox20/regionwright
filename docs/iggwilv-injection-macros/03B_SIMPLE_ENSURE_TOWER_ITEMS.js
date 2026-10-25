if (!game.user.isGM) {
  ui.notifications.error("Run this macro as a GM.");
} else {
  const folderName = "Iggwilv Tower — Puzzle Items";
  const names = [
    "Star",
    "Ingredient Cabinet Key",
    "Red Leaf Fern",
    "Epsom Salts",
    "Blood Meal",
    "Skeleton Bones",
    "Calcium-Rich Bone Meal",
    "Fey-Infused Plant Food",
    "Sunglobe",
    "Astral Water",
    "Ordinary Water",
    "Fey-Infused Water",
    "Astral Fruit",
    "Arcane Lock Password",
    "Hourglass Coven’s Hourglass",
    "Powdered Silver",
    "Demon Skull",
    "Black Tallow Candles",
    "Obsidian Crow’s-Foot Key",
    "Iggwilv’s Sovereign Seal",
    "Ivory Thorn",
    "Obsidian Thorn",
    "Thorn Key"
  ];

  function normalized(value) {
    return String(value)
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .trim()
      .toLowerCase();
  }

  let folder = game.folders.find(function (entry) {
    return entry.type === "Item" && entry.name === folderName;
  });

  if (!folder) {
    folder = await Folder.create({
      name: folderName,
      type: "Item",
      sorting: "a"
    });
  }

  const updates = [];
  const creates = [];

  for (const name of names) {
    const key = normalized(name);
    const existing = game.items.find(function (item) {
      return normalized(item.name) === key;
    });

    if (existing) {
      updates.push({
        _id: existing.id,
        name: name,
        folder: folder.id
      });
    } else {
      creates.push({
        name: name,
        type: "loot",
        folder: folder.id,
        img: "icons/containers/bags/pack-simple-leather-tan.webp",
        system: {
          description: { value: "<p>Iggwilv's Tower quest item.</p>" },
          quantity: 1
        }
      });
    }
  }

  if (updates.length > 0) {
    await Item.updateDocuments(updates);
  }

  if (creates.length > 0) {
    await Item.createDocuments(creates);
  }

  const installed = names.map(function (name) {
    const key = normalized(name);
    const item = game.items.find(function (entry) {
      return normalized(entry.name) === key;
    });
    return {
      name: name,
      uuid: item ? item.uuid : "MISSING"
    };
  });

  console.table(installed);
  ui.notifications.info("Iggwilv Tower items ready: " + installed.filter(function (entry) {
    return entry.uuid !== "MISSING";
  }).length + "/" + names.length + ". UUIDs are in the console.");
}
