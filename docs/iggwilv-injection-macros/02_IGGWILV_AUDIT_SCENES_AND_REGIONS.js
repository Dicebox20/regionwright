/**
 * Iggwilv's Tower - 02: Read-only scene and Region audit
 * Foundry Script Macro. Run immediately after macro 01 and again after each
 * later Region installer. It is intentionally read-only.
 */

const PREFIX = "Iggwilv Tower - ";
const expected = [
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

const rows = expected.map(([room, file, width, height]) => {
  const scene = game.scenes.find(entry => entry.name === `${PREFIX}${room}`);
  if (!scene) return { room, status: "MISSING SCENE", source: "-", grid: "-", regions: "-" };
  const source = scene.background?.src ?? "";
  const correct = source === `Big Maps/${file}` && scene.width === width && scene.height === height;
  const grid = scene.grid ?? {};
  const regions = [...scene.regions].map(region => region.name || region.id).join(" | ") || "none";
  return {
    room,
    status: correct && grid.size === 64 && grid.distance === 5 ? "OK" : "CONFIG MISMATCH",
    source,
    grid: `${grid.size}px / ${grid.distance}${grid.units || ""}`,
    regions
  };
});

console.table(rows);
await ChatMessage.create({
  content: `<h2>Iggwilv's Tower - Scene / Region Audit</h2><table><thead><tr><th>Room</th><th>Status</th><th>Grid</th><th>Regions</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.room}</td><td>${row.status}</td><td>${row.grid}</td><td>${row.regions}</td></tr>`).join("")}</tbody></table><p>Full source data is in the browser console table.</p>`,
  whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id)
});
if (rows.some(row => row.status !== "OK")) ui.notifications.warn("Iggwilv audit found scene issues. Rerun macro 01 before installing door Regions.");
else ui.notifications.info("Iggwilv scene audit passed. Ready for the door-location audit and Region installer.");
