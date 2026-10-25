/**
 * EMERGENCY: Upload and visibly install all 11 Iggwilv maps.
 * Foundry Script Macro. Run as GM.
 * Select each image when its room name appears.
 */

const DIRECTORY = "Big Maps/Iggwilvs Tower";
const FOLDER_NAME = "Iggwilv's Tower — Final Scenes";
const FLAG_SCOPE = "iggwilvTower";
const maps = [
  ["Floor 1 Landing", "01-floor-1-landing.png"],
  ["Curiosities Room", "02-curiosities-room.png"],
  ["Private Chambers", "03-private-chambers.png"],
  ["Private Library", "04-private-library.png"],
  ["Hidden Library", "05-hidden-library.png"],
  ["Private Study", "06-private-study.png"],
  ["Witch's Laboratory", "07-witches-laboratory.png"],
  ["Floor 2 Landing", "08-floor-2-landing.png"],
  ["Summoning Chamber", "09-summoning-chamber.png"],
  ["Astral Garden", "10-astral-garden.png"],
  ["Arcane Vault", "11-arcane-vault.png"]
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");

async function selectFile(room, index) {
  return new Promise(resolve => {
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: `${index + 1}/11 — SELECT ${room}`, icon: "fa-solid fa-map" },
      position: { width: 620 },
      content: `<form class="standard-form">
        <h2 style="text-align:center">${foundry.utils.escapeHTML(room)}</h2>
        <input type="file" name="map" accept="image/png,image/jpeg,image/webp" required>
      </form>`,
      buttons: [
        {
          action: "use",
          label: `Install ${room}`,
          icon: "fa-solid fa-upload",
          default: true,
          callback: (_event, button, instance) => {
            const file = button.form?.elements?.namedItem("map")?.files?.[0] ?? null;
            void instance.close();
            resolve(file);
          }
        },
        {
          action: "cancel",
          label: "Cancel",
          callback: (_event, _button, instance) => {
            void instance.close();
            resolve(null);
          }
        }
      ]
    });
    dialog.render(true);
  });
}

async function decodeImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error(`Foundry uploaded the file but cannot display it: ${source}`));
    image.src = `${source}${source.includes("?") ? "&" : "?"}cache=${Date.now()}`;
  });
}

// Select every file before changing the world.
const selected = [];
for (let index = 0; index < maps.length; index++) {
  const [room, canonicalName] = maps[index];
  const file = await selectFile(room, index);
  if (!file) {
    ui.notifications.warn("Cancelled. No scenes were changed.");
    return;
  }
  selected.push({ room, canonicalName, file });
}

try { await FilePicker.createDirectory("data", "Big Maps"); } catch (_error) {}
try { await FilePicker.createDirectory("data", DIRECTORY); } catch (_error) {}

let folder = game.folders.find(f => f.type === "Scene" && f.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Scene", sorting: "a" });

const installed = [];
for (const entry of selected) {
  const renamed = new File([entry.file], entry.canonicalName, {
    type: entry.file.type || "image/png",
    lastModified: entry.file.lastModified
  });
  const upload = await FilePicker.upload("data", DIRECTORY, renamed, { notify: false });

  // Resolve the real path from Foundry's own file listing instead of assuming it.
  const listing = await FilePicker.browse("data", DIRECTORY);
  const normalize = value => decodeURIComponent(String(value).replaceAll("\\", "/"));
  const src = (listing.files ?? []).map(normalize).find(path => path.split("/").pop() === entry.canonicalName)
    ?? normalize(upload?.path ?? "");
  if (!src) throw new Error(`Foundry did not retain ${entry.canonicalName}.`);

  // Refuse to bind a broken path. This also supplies the actual image dimensions.
  const { width, height } = await decodeImage(src);
  const sceneName = `Iggwilv Tower — ${entry.room}`;
  let scene = game.scenes.find(s => s.name === sceneName || s.name === `Iggwilv Tower - ${entry.room}`);
  const sceneData = {
    name: sceneName,
    folder: folder.id,
    navigation: false,
    background: { src, offsetX: 0, offsetY: 0 },
    backgroundColor: "#000000",
    width,
    height,
    padding: 0,
    grid: { type: CONST.GRID_TYPES.SQUARE, size: 64, distance: 5, units: "ft" },
    tokenVision: true,
    fog: { exploration: true },
    initial: { x: width / 2, y: height / 2, scale: 1 }
  };
  if (scene) await scene.update(sceneData);
  else scene = await Scene.create(sceneData);

  // Locked base-tile fallback guarantees visibility even if a Foundry build
  // fails to render Scene.background. Only this macro's previous tile is replaced.
  const oldTiles = Array.from(scene.tiles ?? []).filter(tile => tile.getFlag(FLAG_SCOPE, "mapFallback") === true);
  if (oldTiles.length) await scene.deleteEmbeddedDocuments("Tile", oldTiles.map(tile => tile.id));
  await scene.createEmbeddedDocuments("Tile", [{
    name: `${entry.room} — Map Background Fallback`,
    x: 0,
    y: 0,
    width,
    height,
    z: -10000,
    sort: -10000,
    rotation: 0,
    alpha: 1,
    hidden: false,
    locked: true,
    overhead: false,
    texture: { src, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, rotation: 0, tint: null },
    flags: { [FLAG_SCOPE]: { mapFallback: true, canonicalName: entry.canonicalName } }
  }]);

  installed.push({ room: entry.room, scene: scene.name, map: src, size: `${width}×${height}` });
}

console.table(installed);
ui.notifications.info("All 11 maps are installed as Scene backgrounds and locked base tiles.");
const first = game.scenes.find(scene => scene.name === "Iggwilv Tower — Floor 1 Landing");
if (first) await first.view();
