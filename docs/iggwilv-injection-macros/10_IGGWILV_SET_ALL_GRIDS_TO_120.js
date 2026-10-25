/** Iggwilv's Tower — Set all 11 Scene grids to 120 px / 5 ft. */

if (!game.user.isGM) throw new Error("Run this macro as a GM.");

const towerScenes = game.scenes.contents.filter(scene =>
  Array.from(scene.regions ?? []).some(region =>
    region.flags?.regionwright?.iggwilvTower?.campaign === "iggwilvs-tower"
  )
);

if (towerScenes.length !== 11) {
  throw new Error(`Expected 11 active Iggwilv Tower Scenes with region metadata; found ${towerScenes.length}. No grids were changed.`);
}

await Scene.updateDocuments(towerScenes.map(scene => ({
  _id: scene.id,
  "grid.size": 120,
  "grid.distance": 5,
  "grid.units": "ft"
})));

const failed = towerScenes.filter(scene =>
  scene.grid.size !== 120 || scene.grid.distance !== 5 || scene.grid.units !== "ft"
);
if (failed.length) throw new Error(`Grid verification failed: ${failed.map(scene => scene.name).join(", ")}`);

console.table(towerScenes.map(scene => ({
  scene: scene.name,
  uuid: scene.uuid,
  gridPixels: scene.grid.size,
  distance: scene.grid.distance,
  units: scene.grid.units
})));
ui.notifications.info("All 11 Iggwilv Tower Scenes now use a 120 px / 5 ft grid.");

