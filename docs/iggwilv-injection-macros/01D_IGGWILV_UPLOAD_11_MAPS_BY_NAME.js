/**
 * Iggwilv's Tower — Upload 11 Maps By Name
 * Foundry Script Macro. Run as GM.
 *
 * Prompts for one map at a time so visually similar maps cannot be confused.
 * Uploads each under a canonical filename and binds it to its matching Scene.
 */

const DIRECTORY = "Big Maps/Iggwilvs Tower";
const maps = [
  { room: "Floor 1 Landing", scene: "Iggwilv Tower — Floor 1 Landing", file: "01-floor-1-landing.png", tower: true },
  { room: "Curiosities Room", scene: "Iggwilv Tower — Curiosities Room", file: "02-curiosities-room.png", tower: true },
  { room: "Private Chambers", scene: "Iggwilv Tower — Private Chambers", file: "03-private-chambers.png", tower: true },
  { room: "Private Library", scene: "Iggwilv Tower — Private Library", file: "04-private-library.png", tower: true },
  { room: "Hidden Library", scene: "Iggwilv Tower — Hidden Library", file: "05-hidden-library.png", tower: true },
  { room: "Private Study", scene: "Iggwilv Tower — Private Study", file: "06-private-study.png", tower: true },
  { room: "Witch's Laboratory", scene: "Iggwilv Tower — Witch's Laboratory", file: "07-witches-laboratory.png", tower: true },
  { room: "Floor 2 Landing", scene: "Iggwilv Tower — Floor 2 Landing", file: "08-floor-2-landing.png", tower: true },
  { room: "Summoning Chamber", scene: "Iggwilv Tower — Summoning Chamber", file: "09-summoning-chamber.png", tower: true },
  { room: "Astral Garden", scene: "Iggwilv Tower — Astral Garden", file: "10-astral-garden.png", tower: true },
  { room: "Arcane Vault", scene: "Iggwilv Tower — Arcane Vault", file: "11-arcane-vault.png", tower: true }
];

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
if (!globalThis.FilePicker || !foundry?.applications?.api?.DialogV2) throw new Error("Foundry's upload dialog is unavailable.");

const escape = value => foundry.utils.escapeHTML(String(value));
async function chooseMap(entry, index) {
  return new Promise(resolve => {
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: `${index + 1}/11 — ${entry.room}`, icon: "fa-solid fa-map" },
      position: { width: 600 },
      content: `<form class="standard-form">
        <h2>${escape(entry.room)}</h2>
        <p>Select only the map for <strong>${escape(entry.room)}</strong>.</p>
        <p class="notes">It will be uploaded as <code>${escape(entry.file)}</code>.</p>
        <div class="form-group stacked">
          <label>${escape(entry.room)} image</label>
          <input type="file" name="mapFile" accept="image/png,image/jpeg,image/webp" required>
        </div>
      </form>`,
      buttons: [
        {
          action: "select",
          label: `Use This as ${entry.room}`,
          icon: "fa-solid fa-check",
          default: true,
          callback: (_event, button, instance) => {
            const file = button.form?.elements?.namedItem("mapFile")?.files?.[0] ?? null;
            void instance.close();
            resolve(file);
          }
        },
        {
          action: "cancel",
          label: "Cancel All",
          icon: "fa-solid fa-xmark",
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

async function imageSize(file) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

// Collect every required file before changing Foundry data.
const selected = [];
for (let i = 0; i < maps.length; i++) {
  const file = await chooseMap(maps[i], i);
  if (!file) {
    ui.notifications.warn("Iggwilv map upload cancelled. Nothing was uploaded.");
    return;
  }
  selected.push({ ...maps[i], sourceFile: file, ...(await imageSize(file)) });
}

try { await FilePicker.createDirectory("data", "Big Maps"); } catch (_error) {}
try { await FilePicker.createDirectory("data", DIRECTORY); } catch (_error) {}

const results = [];
for (const entry of selected) {
  const renamed = new File([entry.sourceFile], entry.file, { type: entry.sourceFile.type, lastModified: entry.sourceFile.lastModified });
  const upload = await FilePicker.upload("data", DIRECTORY, renamed, { notify: false });
  const src = upload?.path ?? `${DIRECTORY}/${entry.file}`;
  let scene = game.scenes.find(s => s.name === entry.scene);
  if (scene) {
    const update = { background: { src, offsetX: 0, offsetY: 0 }, width: entry.width, height: entry.height, padding: 0 };
    if (entry.tower) update.grid = { type: CONST.GRID_TYPES.SQUARE, size: 64, distance: 5, units: "ft" };
    await scene.update(update);
  } else {
    scene = await Scene.create({
      name: entry.scene,
      background: { src, offsetX: 0, offsetY: 0 },
      width: entry.width,
      height: entry.height,
      padding: 0,
      grid: { type: CONST.GRID_TYPES.SQUARE, size: 64, distance: 5, units: "ft" },
      tokenVision: true,
      fog: { exploration: true }
    });
  }
  results.push({ map: entry.room, uploadedAs: src, scene: scene.name });
}

console.table(results);
ui.notifications.info("All 11 maps were uploaded by name and bound to their Scenes.");
