/**
 * Iggwilv's Tower - 00: Read-only final-map preflight
 * Foundry Script Macro. Run this first.
 */

const maps = [
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

const results = [];
for (const [label, file, width, height] of maps) {
  const src = `Big Maps/${file}`;
  let status = "OK";
  let detail = "served";
  try {
    const response = await fetch(encodeURI(src), { method: "HEAD", cache: "no-store" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      status = "FAIL";
      detail = `HTTP ${response.status}`;
    } else if (!contentType.startsWith("image/")) {
      status = "FAIL";
      detail = `unexpected content type: ${contentType || "missing"}`;
    }
  } catch (error) {
    status = "FAIL";
    detail = error.message ?? String(error);
  }
  results.push({ label, src, canvas: `${width} x ${height}`, status, detail });
}

const failed = results.filter(entry => entry.status !== "OK");
console.table(results);
await ChatMessage.create({
  content: `<h2>Iggwilv's Tower - Final Map Preflight</h2>${results.map(entry =>
    `<p><strong>${entry.status}</strong> - ${entry.label}: <code>${entry.src}</code> (${entry.canvas}) - ${entry.detail}</p>`
  ).join("")}`,
  whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id)
});
if (failed.length) throw new Error(`Preflight failed for ${failed.length} final map(s). Copy the reported file(s) into Foundry User Data/Big Maps, then rerun this macro.`);
ui.notifications.info("All 11 Iggwilv final-draft map files are available to Foundry.");
