/** Iggwilv's Tower — Force-center all 11 visible maps. Foundry Script Macro. */
const FLAG_SCOPE = "iggwilvTower";
const specs = [
  ["Floor 1 Landing",2048,2048], ["Curiosities Room",1792,1408],
  ["Private Chambers",1792,1408], ["Private Library",2304,1920],
  ["Hidden Library",1024,768], ["Private Study",1664,1408],
  ["Witch's Laboratory",1920,1920], ["Floor 2 Landing",2176,2176],
  ["Summoning Chamber",2048,2048], ["Astral Garden",2560,1920],
  ["Arcane Vault",1792,1408]
];
if (!game.user.isGM) throw new Error("Run this macro as a GM.");
let firstScene = null;
let firstView = null;
for (const [room,width,height] of specs) {
  const scene = game.scenes.find(s => s.name === `Iggwilv Tower — ${room}` || s.name === `Iggwilv Tower - ${room}`);
  if (!scene) throw new Error(`Missing Scene: ${room}`);
  const src = scene.background?.src;
  if (!src) throw new Error(`${room} has no installed map source.`);
  await scene.update({
    width, height, padding: 0,
    background: { src, offsetX: 0, offsetY: 0 },
    grid: { type: CONST.GRID_TYPES.SQUARE, size: 64, distance: 5, units: "ft" }
  });
  const d = scene.dimensions;
  const mapX = d.sceneX;
  const mapY = d.sceneY;
  const centerX = mapX + width / 2;
  const centerY = mapY + height / 2;
  const availableWidth = Math.max(400, window.innerWidth - 360);
  const availableHeight = Math.max(300, window.innerHeight - 180);
  const scale = Math.max(0.1, Math.min(1, availableWidth / width, availableHeight / height) * 0.92);
  const ownedTiles = Array.from(scene.tiles ?? []).filter(tile => tile.getFlag(FLAG_SCOPE,"mapFallback") === true);
  const tileData = {
    name: `${room} — Centered Map`,
    x: mapX, y: mapY, width, height,
    z: -10000, sort: -10000, rotation: 0, alpha: 1,
    hidden: false, locked: true, overhead: false,
    texture: { src, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, rotation: 0 },
    flags: { [FLAG_SCOPE]: { mapFallback: true, centered: true } }
  };
  if (ownedTiles.length) {
    await scene.updateEmbeddedDocuments("Tile", [{ _id: ownedTiles[0].id, ...tileData }]);
    if (ownedTiles.length > 1) await scene.deleteEmbeddedDocuments("Tile", ownedTiles.slice(1).map(tile => tile.id));
  } else await scene.createEmbeddedDocuments("Tile", [tileData]);
  await scene.update({ initial: { x: centerX, y: centerY, scale } });
  if (!firstScene) { firstScene = scene; firstView = { x:centerX, y:centerY, scale }; }
}
ui.notifications.info("All 11 maps were force-centered inside Foundry's canvas.");
if (firstScene) {
  await firstScene.view();
  await new Promise(resolve => setTimeout(resolve, 500));
  await canvas.animatePan(firstView);
}
