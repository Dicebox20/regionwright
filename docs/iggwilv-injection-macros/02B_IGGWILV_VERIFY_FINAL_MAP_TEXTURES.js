/**
 * Iggwilv's Tower - verify actual background texture decoding
 * Foundry Script Macro. Read-only; does not create Chat messages.
 *
 * Tests Foundry's own texture loader, not just Scene configuration paths.
 * Results are printed to the browser console; the notification reports totals.
 */

const PREFIX = "Iggwilv Tower — ";
const rooms = [
  "Floor 1 Landing", "Curiosities Room", "Private Chambers", "Private Library",
  "Hidden Library", "Private Study", "Witch's Laboratory", "Floor 2 Landing",
  "Summoning Chamber", "Astral Garden", "Arcane Vault"
];

if (!game.user.isGM) throw new Error("Run this audit as a GM.");

const results = [];
for (const room of rooms) {
  const scene = game.scenes.find(entry => entry.name === `${PREFIX}${room}`);
  const src = scene?.background?.src ?? "";
  if (!scene || !src) {
    results.push({ room, status: "FAIL", source: src || "(no Scene/background)", detail: "Scene or background source missing" });
    continue;
  }

  try {
    const texture = await foundry.canvas.loadTexture(src);
    const width = texture?.width ?? texture?.baseTexture?.width ?? 0;
    const height = texture?.height ?? texture?.baseTexture?.height ?? 0;
    const valid = texture?.baseTexture?.valid !== false && width > 0 && height > 0;
    results.push({
      room,
      status: valid ? "PASS" : "FAIL",
      source: src,
      detail: valid ? `decoded ${width} x ${height}` : "loader returned an invalid/zero-size texture"
    });
  } catch (error) {
    results.push({ room, status: "FAIL", source: src, detail: error.message ?? String(error) });
  }
}

console.table(results);
const failed = results.filter(entry => entry.status !== "PASS");
if (failed.length) {
  ui.notifications.error(`Iggwilv map texture audit failed: ${failed.length} of ${results.length}. Open browser console and copy the FAIL rows.`);
} else {
  ui.notifications.info(`Iggwilv map texture audit passed: all ${results.length} final PNGs decoded.`);
}
