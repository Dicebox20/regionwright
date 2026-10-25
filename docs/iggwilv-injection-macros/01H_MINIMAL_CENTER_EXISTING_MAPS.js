if (!game.user.isGM) {
  ui.notifications.error("Run this macro as a GM.");
} else {
  const scenes = game.scenes.filter(function (scene) {
    return scene.name.startsWith("Iggwilv Tower");
  });

  let fixed = 0;

  for (const scene of scenes) {
    const tile = scene.tiles.find(function (entry) {
      return entry.name.includes("Map Background") || entry.name.includes("Centered Map");
    });

    if (!tile) {
      console.warn("No map tile found in " + scene.name);
      continue;
    }

    const x = scene.width / 2;
    const y = scene.height / 2;

    await scene.updateEmbeddedDocuments("Tile", [{
      _id: tile.id,
      x: x,
      y: y,
      width: scene.width,
      height: scene.height,
      "texture.anchorX": 0.5,
      "texture.anchorY": 0.5,
      "texture.scaleX": 1,
      "texture.scaleY": 1
    }]);

    await scene.update({
      padding: 0,
      initial: {
        x: x,
        y: y,
        scale: 1
      }
    });

    if (canvas.scene && canvas.scene.id === scene.id) {
      canvas.pan({ x: x, y: y, scale: 1 });
    }

    fixed = fixed + 1;
  }

  ui.notifications.info("Centered " + fixed + " Iggwilv Tower maps.");
}
