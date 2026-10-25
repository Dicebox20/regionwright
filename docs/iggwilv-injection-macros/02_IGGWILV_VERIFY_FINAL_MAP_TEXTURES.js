/**
 * Iggwilv's Tower - verify the installed final map textures
 * Foundry Script Macro. Read-only. Run as GM after 01C.
 *
 * This verifies that every expected PNG is in Foundry storage, that every
 * tower Scene points to that exact uploaded file, and that the browser can
 * decode each PNG. It changes nothing and writes no Chat messages.
 */

const MAP_DIRECTORY = "Big Maps";
const TITLE_PREFIX = "Iggwilv Tower — ";
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
if (!globalThis.FilePicker || !globalThis.Image) throw new Error("Foundry's file and image APIs are unavailable. Run this inside Foundry's world view.");

const listing = await FilePicker.browse("data", MAP_DIRECTORY);
const normalize = value => decodeURIComponent(String(value).replaceAll("\\", "/"));
const basename = path => normalize(path).split("/").pop();
const assets = new Map((listing.files ?? []).map(path => [basename(path), normalize(path)]));

const decode = src => new Promise(resolve => {
  const image = new Image();
  const finish = result => { image.onload = null; image.onerror = null; resolve(result); };
  image.onload = () => finish({ ok: true, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
  image.onerror = () => finish({ ok: false, naturalWidth: 0, naturalHeight: 0 });
  image.src = src + (src.includes("?") ? "&" : "?") + `iggwilvVerify=${Date.now()}`;
});

const report = [];
for (const [room, file, width, height] of specs) {
  const scene = game.scenes.find(entry => entry.name === `${TITLE_PREFIX}${room}`);
  const uploaded = assets.get(file) ?? null;
  const src = scene?.background?.src ?? "";
  const image = uploaded ? await decode(uploaded) : { ok: false, naturalWidth: 0, naturalHeight: 0 };
  const dimensionsMatch = image.naturalWidth === width && image.naturalHeight === height;
  const gridMatch = scene?.grid?.size === 64 && scene?.grid?.distance === 5 && scene?.grid?.units === "ft";
  report.push({
    room,
    scene: Boolean(scene),
    uploaded: Boolean(uploaded),
    backgroundBound: Boolean(uploaded && normalize(src) === uploaded),
    pngDecoded: image.ok,
    pngSize: `${image.naturalWidth}×${image.naturalHeight}`,
    expectedSize: `${width}×${height}`,
    dimensionsMatch,
    grid5ft: gridMatch,
    pass: Boolean(scene && uploaded && normalize(src) === uploaded && image.ok && dimensionsMatch && gridMatch)
  });
}

console.table(report);
const failed = report.filter(entry => !entry.pass);
if (failed.length) {
  ui.notifications.error(`Iggwilv texture audit: ${failed.length} of ${report.length} Scenes need attention. Open F12 Console for the exact failures.`);
  throw new Error(`Texture audit failed: ${failed.map(entry => entry.room).join(", ")}. Do not install Regions yet.`);
}
ui.notifications.info(`Iggwilv texture audit passed: ${report.length}/${report.length} final PNGs decode and are bound to their Scenes.`);
