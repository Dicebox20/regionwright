/**
 * Iggwilv's Tower - Create scenes and bind final-draft map backgrounds
 * Foundry Script Macro. Run as GM.
 *
 * Finds the actual file path through Foundry's FilePicker, creates or repairs
 * all eleven scenes, and assigns the resolved PNG to every background.
 * It makes no Region changes.
 */

const FOLDER_NAME = "Iggwilv's Tower — Final Drafts";
const TITLE_PREFIX = "Iggwilv Tower — ";
const MAP_DIRECTORY = "Big Maps";
const specs = [
  ["Floor 1 Landing", "01-f1-landing-final-draft-v2.png", 2048, 2048],
  ["Curiosities Room", "02-curiosities-room-final-draft-v1.png", 1792, 1408],
  ["Private Chambers", "03-private-chambers-final-draft-v1.png", 1792, 1408],
  ["Private Library", "04-private-library-final-draft-v1.png", 2304, 1920],
  ["Hidden Library", "05-hidden-library-final-draft-v1.png", 1024, 768],
  ["Private Study", "06-private-study-final-draft-v1.png", 1664, 1408],
  ["Witch's Laboratory", "07-witches-laboratory-final-draft-v1.png", 1920, 1920],
  ["Floor 2 Landing", "08-f2-forbidden-ascent-landing-final-draft-v1.png", 2176, 2176],
  ["Summoning Chamber", "09-summoning-chamber-final-draft-v1.png", 2048, 2048],
  ["Astral Garden", "10-astral-garden-final-draft-v1.png", 2560, 1920],
  ["Arcane Vault", "11-arcane-vault-final-draft-v1.png", 1792, 1408]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");

const listing = await FilePicker.browse("data", MAP_DIRECTORY);
const normalize = value => decodeURIComponent(String(value).replaceAll("\\", "/"));
const basename = path => normalize(path).split("/").pop();
const assets = new Map(listing.files.map(path => [basename(path), normalize(path)]));

const missing = specs.map(([, file]) => file).filter(file => !assets.has(file));
if (missing.length) {
  throw new Error(
    `No scenes were changed. Foundry cannot see these final maps in data/${MAP_DIRECTORY}:\n\n${missing.join("\n")}`
  );
}

let folder = game.folders.find(entry => entry.type === "Scene" && entry.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Scene", sorting: "a" });

const results = [];
for (const [room, file, width, height] of specs) {
  const name = `${TITLE_PREFIX}${room}`;
  const alternateName = `Iggwilv Tower - ${room}`;
  const src = assets.get(file);
  const data = {
    name,
    folder: folder.id,
    navigation: false,
    background: { src, offsetX: 0, offsetY: 0 },
    backgroundColor: "#000000",
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
    environment: { darknessLevel: 0.25 },
    initial: { x: width / 2, y: height / 2, scale: 1 }
  };

  const scene = game.scenes.find(entry => entry.name === name || entry.name === alternateName);
  if (scene) {
    await scene.update(data);
    results.push(`${name}: repaired and bound to ${src}`);
  } else {
    await Scene.create(data);
    results.push(`${name}: created and bound to ${src}`);
  }
}

console.table(results.map(entry => ({ result: entry })));
ui.notifications.info("Iggwilv: 11 final-draft maps bound to their scenes. Full result list is in the browser console.");
