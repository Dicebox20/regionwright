/**
 * Iggwilv's Tower — Create 11 Scenes
 * Foundry Script Macro. Run as GM after uploading the maps with 01D.
 * Existing embedded walls, lights, tokens, and Regions are preserved.
 */

const DIRECTORY = "Big Maps/Iggwilvs Tower";
const FOLDER_NAME = "Iggwilv's Tower — Final Scenes";
const specs = [
  ["Floor 1 Landing", "01-floor-1-landing.png", 2048, 2048],
  ["Curiosities Room", "02-curiosities-room.png", 1792, 1408],
  ["Private Chambers", "03-private-chambers.png", 1792, 1408],
  ["Private Library", "04-private-library.png", 2304, 1920],
  ["Hidden Library", "05-hidden-library.png", 1024, 768],
  ["Private Study", "06-private-study.png", 1664, 1408],
  ["Witch's Laboratory", "07-witches-laboratory.png", 1920, 1920],
  ["Floor 2 Landing", "08-floor-2-landing.png", 2176, 2176],
  ["Summoning Chamber", "09-summoning-chamber.png", 2048, 2048],
  ["Astral Garden", "10-astral-garden.png", 2560, 1920],
  ["Arcane Vault", "11-arcane-vault.png", 1792, 1408]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (!globalThis.FilePicker || !globalThis.Scene) throw new Error("Foundry's Scene and file APIs are unavailable.");

const listing = await FilePicker.browse("data", DIRECTORY);
const normalize = value => decodeURIComponent(String(value).replaceAll("\\", "/"));
const basename = path => normalize(path).split("/").pop();
const uploaded = new Map((listing.files ?? []).map(path => [basename(path), normalize(path)]));
const missing = specs.filter(([, file]) => !uploaded.has(file)).map(([, file]) => file);
if (missing.length) throw new Error(`Upload these maps first with macro 01D:\n${missing.join("\n")}`);

let folder = game.folders.find(entry => entry.type === "Scene" && entry.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Scene", sorting: "a" });

const results = [];
for (const [room, file, width, height] of specs) {
  const name = `Iggwilv Tower — ${room}`;
  const src = uploaded.get(file);
  const data = {
    name,
    folder: folder.id,
    navigation: false,
    background: { src, offsetX: 0, offsetY: 0 },
    backgroundColor: "#08070b",
    width,
    height,
    padding: 0,
    grid: {
      type: CONST.GRID_TYPES.SQUARE,
      size: 64,
      distance: 5,
      units: "ft"
    },
    tokenVision: true,
    fog: { exploration: true },
    environment: { darknessLevel: 0.2 },
    initial: { x: width / 2, y: height / 2, scale: 1 }
  };

  let scene = game.scenes.find(entry => entry.name === name || entry.name === `Iggwilv Tower - ${room}`);
  if (scene) {
    await scene.update(data);
    results.push({ scene: name, map: file, result: "updated" });
  } else {
    scene = await Scene.create(data);
    results.push({ scene: name, map: file, result: "created" });
  }
}

console.table(results);
ui.notifications.info(`Iggwilv scenes ready: ${results.length}/${specs.length}. Maps are installed at 64 px per 5-foot square.`);
