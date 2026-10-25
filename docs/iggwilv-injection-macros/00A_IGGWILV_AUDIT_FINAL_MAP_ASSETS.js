/**
 * Iggwilv's Tower - authoritative map asset audit
 * Foundry Script Macro. Read-only except for a GM-only chat report.
 *
 * This does NOT claim that an image works merely because a Scene exists.
 * It compares every Scene's configured background against the files Foundry's
 * own FilePicker can currently see in User Data/Big Maps.
 */

const PREFIX = "Iggwilv Tower - ";
const required = [
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

if (!game.user.isGM) throw new Error("Run this audit as a GM.");

let browseError = null;
let files = [];
try {
  const listing = await FilePicker.browse("data", "Big Maps");
  files = listing.files ?? [];
} catch (error) {
  browseError = error.message ?? String(error);
}

const filename = path => decodeURIComponent(String(path).replaceAll("\\", "/").split("/").pop() ?? "");
const available = new Set(files.map(filename));
const esc = value => foundry.utils.escapeHTML(String(value ?? ""));

const rows = required.map(([room, file, width, height]) => {
  const scene = game.scenes.find(entry => entry.name === `${PREFIX}${room}`);
  const expectedSrc = `Big Maps/${file}`;
  const asset = available.has(file);
  const actualSrc = scene?.background?.src ?? "";
  const sourceMatches = actualSrc === expectedSrc;
  const canvasMatches = scene?.width === width && scene?.height === height;
  const grid = scene?.grid ?? {};
  const gridMatches = grid.size === 64 && grid.distance === 5 && grid.units === "ft";
  const status = !asset ? "MISSING ASSET" : !scene ? "MISSING SCENE" : !sourceMatches ? "WRONG SOURCE" : !canvasMatches ? "WRONG CANVAS" : !gridMatches ? "WRONG GRID" : "READY";
  return { room, file, asset, scene: Boolean(scene), actualSrc, sourceMatches, canvasMatches, gridMatches, status };
});

console.table(rows);
const htmlRows = rows.map(row => `<tr>
  <td>${esc(row.room)}</td>
  <td>${esc(row.status)}</td>
  <td>${row.asset ? "yes" : "NO"}</td>
  <td>${row.scene ? "yes" : "NO"}</td>
  <td><code>${esc(row.actualSrc || "-")}</code></td>
</tr>`).join("");

await ChatMessage.create({
  content: `<h2>Iggwilv's Tower - Final Map Asset Audit</h2>
  <p><strong>FilePicker folder:</strong> <code>data / Big Maps</code><br>
  <strong>Browse result:</strong> ${browseError ? `<span style="color:#c22">${esc(browseError)}</span>` : `${files.length} file(s) visible`}</p>
  <table><thead><tr><th>Room</th><th>Status</th><th>PNG visible</th><th>Scene exists</th><th>Configured background</th></tr></thead><tbody>${htmlRows}</tbody></table>
  <p>Copy this GM chat report back into the campaign chat. Do not run the scene installer until every row says <strong>READY</strong>.</p>`,
  whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id)
});

const failures = rows.filter(row => row.status !== "READY");
if (failures.length) ui.notifications.warn(`Iggwilv asset audit: ${failures.length} issue(s). See GM chat.`);
else ui.notifications.info("Iggwilv asset audit passed: all 11 final-draft maps are correctly configured.");
