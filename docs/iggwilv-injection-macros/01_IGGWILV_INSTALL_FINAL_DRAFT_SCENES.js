/**
 * Iggwilv's Tower - 01: Create/repair all final-draft scenes
 * Foundry Script Macro. Run only after macro 00 succeeds.
 *
 * Rerunnable: updates a scene with the same name rather than duplicating it.
 * It does not create, edit, or delete Regions; door traversal is installed only
 * after the per-scene visual/door audit.
 */

const FOLDER_NAME = "Iggwilv's Tower - Final Drafts";
const PREFIX = "Iggwilv Tower - ";
const GRID_SIZE = 64;
const GRID_DISTANCE = 5;
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

if (!game.user.isGM) throw new Error("Run this as a GM.");

// Fail before any world writes if a final image is missing or not an image.
const missing = [];
for (const [, file] of specs) {
  const src = `Big Maps/${file}`;
  const response = await fetch(encodeURI(src), { method: "HEAD", cache: "no-store" });
  if (!response.ok || !(response.headers.get("content-type") ?? "").startsWith("image/")) missing.push(src);
}
if (missing.length) throw new Error(`No scene changes made. Missing/unreadable final map files:\n${missing.join("\n")}`);

let folder = game.folders.find(entry => entry.type === "Scene" && entry.name === FOLDER_NAME);
if (!folder) folder = await Folder.create({ name: FOLDER_NAME, type: "Scene", sorting: "a" });

const sceneData = ([room, file, width, height]) => ({
  name: `${PREFIX}${room}`,
  folder: folder.id,
  navigation: false,
  background: { src: `Big Maps/${file}`, offsetX: 0, offsetY: 0 },
  backgroundColor: "#000000",
  width,
  height,
  padding: 0,
  grid: {
    type: CONST.GRID_TYPES.SQUARE,
    size: GRID_SIZE,
    distance: GRID_DISTANCE,
    units: "ft"
  },
  tokenVision: true,
  fog: { exploration: true },
  environment: { darknessLevel: 0.25 },
  initial: { x: width / 2, y: height / 2, scale: 1 }
});

const created = [];
const repaired = [];
for (const spec of specs) {
  const data = sceneData(spec);
  const existing = game.scenes.find(scene => scene.name === data.name);
  if (existing) {
    await existing.update(data);
    repaired.push(data.name);
  } else {
    await Scene.create(data);
    created.push(data.name);
  }
}

const report = [
  `<p><strong>Created:</strong> ${created.length || "none"}${created.length ? `<br>${created.join("<br>")}` : ""}</p>`,
  `<p><strong>Repaired:</strong> ${repaired.length || "none"}${repaired.length ? `<br>${repaired.join("<br>")}` : ""}</p>`,
  "<p>Every scene now points at its final-draft image, has zero padding, and uses 64 px squares at 5 ft.</p>"
].join("");
await ChatMessage.create({
  content: `<h2>Iggwilv's Tower - Scene Installation</h2>${report}`,
  whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id)
});
ui.notifications.info(`Iggwilv scene installer complete: ${created.length} created, ${repaired.length} repaired.`);
