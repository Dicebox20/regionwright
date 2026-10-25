// Iggwilv's Tower — Foundry VTT v14 map-tile centering repair
// In v14, Tile x/y locates its texture anchor. With a 0.5 anchor, the map
// belongs at the center of the Scene rather than at its top-left corner.

const maps = [
  ["Floor 1 Landing", 2048, 2048, "01-floor-1-landing.png"],
  ["Curiosities Room", 1792, 1408, "02-curiosities-room.png"],
  ["Private Chambers", 1792, 1408, "03-private-chambers.png"],
  ["Private Library", 2304, 1920, "04-private-library.png"],
  ["Hidden Library", 1024, 768, "05-hidden-library.png"],
  ["Private Study", 1664, 1408, "06-private-study.png"],
  ["Witch's Laboratory", 1920, 1920, "07-witches-laboratory.png"],
  ["Floor 2 Landing", 2176, 2176, "08-floor-2-landing.png"],
  ["Summoning Chamber", 2048, 2048, "09-summoning-chamber.png"],
  ["Astral Garden", 2560, 1920, "10-astral-garden.png"],
  ["Arcane Vault", 1792, 1408, "11-arcane-vault.png"]
];

if (!game.user.isGM) {
  return ui.notifications.error("Run this macro as a GM.");
}

const results = [];

for (const [room, width, height, filename] of maps) {
  try {
    const scene = game.scenes.find(entry => entry.name.endsWith(room));
    if (!scene) throw new Error("scene not found");

    const src = `Big Maps/Iggwilvs Tower/${filename}`;

    await scene.update({
      width,
      height,
      padding: 0,
      "grid.type": 1,
      "grid.size": 64,
      "grid.distance": 5,
      "grid.units": "ft"
    });

    const sceneX = scene.dimensions.sceneX;
    const sceneY = scene.dimensions.sceneY;
    const centerX = sceneX + width / 2;
    const centerY = sceneY + height / 2;

    let tile = scene.tiles.find(entry => entry.texture?.src === src);
    if (!tile) {
      tile = scene.tiles.find(entry =>
        entry.name?.endsWith("Map Background Fallback") ||
        entry.name?.endsWith("Centered Map")
      );
    }

    const tileData = {
      name: `${room} — Centered Map`,
      x: centerX,
      y: centerY,
      width,
      height,
      sort: -10000,
      rotation: 0,
      alpha: 1,
      hidden: false,
      locked: true,
      texture: {
        src,
        scaleX: 1,
        scaleY: 1,
        anchorX: 0.5,
        anchorY: 0.5,
        fit: "fill"
      }
    };

    if (tile) {
      await scene.updateEmbeddedDocuments("Tile", [{ _id: tile.id, ...tileData }]);
    } else {
      await scene.createEmbeddedDocuments("Tile", [tileData]);
    }

    await scene.update({ initial: { x: centerX, y: centerY, scale: 1 } });

    if (canvas.scene?.id === scene.id) {
      canvas.pan({ x: centerX, y: centerY, scale: 1 });
    }

    results.push(`✓ ${room}`);
  } catch (error) {
    console.error(`Iggwilv centering failed for ${room}`, error);
    results.push(`✗ ${room}: ${error.message}`);
  }
}

const failures = results.filter(line => line.startsWith("✗"));
console.table(results);

if (failures.length) {
  ui.notifications.warn(`Centered ${11 - failures.length}/11 maps. See console for ${failures.length} failure(s).`);
} else {
  ui.notifications.info("All 11 Iggwilv Tower maps are centered.");
}
