/**
 * Iggwilv's Tower - upload final PNGs into Foundry and install the Scenes
 * Foundry Script Macro. Run as GM.
 *
 * 1. Click Select 11 Final PNGs.
 * 2. Choose all eleven files from the final-drafts folder.
 * 3. The macro uploads them to Foundry User Data/Big Maps.
 * 4. It then creates or repairs the eleven Scene backgrounds.
 *
 * No Regions are added, changed, or removed.
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

const requiredNames = new Set(specs.map(([, file]) => file));
const escapeHTML = value => foundry.utils.escapeHTML(String(value ?? ""));

const selectedFiles = await new Promise(resolve => {
  const dialog = new foundry.applications.api.DialogV2({
    window: { title: "Iggwilv's Tower - Upload Final Maps", icon: "fa-solid fa-images" },
    position: { width: 640 },
    content: `<form class="standard-form">
      <p>Select all eleven final-draft PNGs. They will be uploaded to <code>Foundry User Data/${escapeHTML(MAP_DIRECTORY)}</code>.</p>
      <div class="form-group stacked">
        <label>Final map PNG files</label>
        <input type="file" name="finalMaps" accept="image/png" multiple required>
      </div>
      <p class="notes">Expected: ${specs.length} files. Existing files of the same name will be refreshed by Foundry's upload handler.</p>
    </form>`,
    buttons: [
      {
        action: "upload",
        label: "Select 11 Final PNGs",
        icon: "fa-solid fa-upload",
        default: true,
        callback: (_event, button, instance) => {
          const input = button.form?.elements?.namedItem("finalMaps");
          const files = Array.from(input?.files ?? []);
          void instance.close();
          resolve(files);
        }
      },
      {
        action: "cancel",
        label: "Cancel",
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

if (!selectedFiles) return;

const suppliedNames = new Set(selectedFiles.map(file => file.name));
const missingSelection = [...requiredNames].filter(name => !suppliedNames.has(name));
const unexpectedSelection = [...suppliedNames].filter(name => !requiredNames.has(name));
if (missingSelection.length || unexpectedSelection.length || selectedFiles.length !== specs.length) {
  throw new Error([
    `Choose exactly these ${specs.length} final PNGs.`,
    missingSelection.length ? `Missing: ${missingSelection.join(", ")}` : "",
    unexpectedSelection.length ? `Unexpected: ${unexpectedSelection.join(", ")}` : "",
    selectedFiles.length !== specs.length ? `Selected ${selectedFiles.length} file(s).` : ""
  ].filter(Boolean).join("\n"));
}

try { await FilePicker.createDirectory("data", MAP_DIRECTORY); } catch (_error) { /* directory already exists */ }

const uploads = [];
for (const file of selectedFiles) {
  const response = await FilePicker.upload("data", MAP_DIRECTORY, file, { notify: false });
  uploads.push({ file: file.name, path: response?.path ?? `${MAP_DIRECTORY}/${file.name}` });
}

const listing = await FilePicker.browse("data", MAP_DIRECTORY);
const normalize = value => decodeURIComponent(String(value).replaceAll("\\", "/"));
const basename = path => normalize(path).split("/").pop();
const assets = new Map((listing.files ?? []).map(path => [basename(path), normalize(path)]));
const missingAfterUpload = [...requiredNames].filter(file => !assets.has(file));
if (missingAfterUpload.length) throw new Error(`Upload completed but Foundry cannot browse: ${missingAfterUpload.join(", ")}`);

let folder = game.folders.find(entry => entry.type === "Scene" && entry.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Scene", sorting: "a" });

const installed = [];
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
    grid: { type: CONST.GRID_TYPES.SQUARE, size: 64, distance: 5, units: "ft" },
    tokenVision: true,
    fog: { exploration: true },
    environment: { darknessLevel: 0.25 },
    initial: { x: width / 2, y: height / 2, scale: 1 }
  };
  const existing = game.scenes.find(scene => scene.name === name || scene.name === alternateName);
  if (existing) await existing.update(data);
  else await Scene.create(data);
  installed.push({ scene: name, image: src, result: existing ? "repaired" : "created" });
}

console.table(installed);
ui.notifications.info(`Iggwilv complete: uploaded ${uploads.length} final PNGs and installed ${installed.length} Scene backgrounds. Open a tower Scene to verify rendering.`);
