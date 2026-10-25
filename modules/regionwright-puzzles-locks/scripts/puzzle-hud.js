import { MODULE_ID } from "./constants.js";
import { isStandalonePuzzleId, openStandalonePuzzle, standalonePuzzleCatalog } from "./standalone-puzzles.js";

const HUD_SOCKET = `module.${MODULE_ID}`;
const PUZZLE_HUD_VERSION = "1.2.0";
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const contents = collection => Array.isArray(collection) ? collection : Array.isArray(collection?.contents) ? collection.contents : collection?.values ? [...collection.values()] : [];
const activeGM = () => Boolean(globalThis.game?.user?.isGM && (!globalThis.game?.users?.activeGM || globalThis.game.users.activeGM.id === globalThis.game.user.id));
const currentUserId = () => globalThis.game?.user?.id ?? null;

function activeRecipients(scope, playerId) {
  const users = contents(globalThis.game?.users).filter(user => user?.active !== false);
  if (scope === "player") return users.filter(user => user.id === playerId && !user.isGM);
  const gm = users.find(user => user.id === currentUserId());
  return [gm, ...users.filter(user => !user.isGM)].filter(Boolean);
}
function recipientSummary(users) { return users.map(user => ({ id: user.id, name: user.name, isGM: Boolean(user.isGM) })); }
export function puzzleHUDCatalog() { return Object.freeze(standalonePuzzleCatalog().map(puzzle => ({ ...puzzle, standalone: true, state: "ready", executable: true, targets: [] }))); }
export function availablePuzzleHUDEntries() { return Object.freeze(puzzleHUDCatalog().map(entry => ({ ...entry, target: null }))); }

async function handleHUDSocket(payload = {}) {
  if (payload.recipientId !== currentUserId() || payload.action !== "puzzle-hud-open") return;
  try {
    if (!isStandalonePuzzleId(payload.puzzleId)) throw new Error("That Puzzles & Locks catalog entry is unavailable.");
    await openStandalonePuzzle(payload.puzzleId, { seed: payload.seed });
  } catch (error) {
    globalThis.ui?.notifications?.error?.(`Puzzles & Locks HUD: ${error.message}`);
  }
}
let socketInstalled = false;
export function installPuzzleHUDSocket() {
  if (socketInstalled || !globalThis.game?.socket?.on) return false;
  globalThis.game.socket.on(HUD_SOCKET, payload => { void handleHUDSocket(payload); });
  socketInstalled = true;
  return true;
}
export async function deployPuzzleHUD(puzzleId, targetUuid, { scope = "all", playerId = null } = {}) {
  if (!activeGM()) throw new Error("Only the active GM can deploy a puzzle from the HUD.");
  if (targetUuid || !isStandalonePuzzleId(puzzleId)) throw new Error("Choose a valid standalone puzzle.");
  const recipients = activeRecipients(scope, playerId);
  if (!recipients.length) throw new Error("Choose an active player or keep the GM included.");
  const seed = globalThis.foundry?.utils?.randomID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  for (const recipient of recipients) {
    if (recipient.id === currentUserId()) await openStandalonePuzzle(puzzleId, { seed });
    else globalThis.game?.socket?.emit?.(HUD_SOCKET, { action: "puzzle-hud-open", recipientId: recipient.id, puzzleId, seed });
  }
  return Object.freeze({ status: "DEPLOYED", version: PUZZLE_HUD_VERSION, puzzleId, seed, recipients: recipientSummary(recipients) });
}

function renderHUDContent() {
  const entries = availablePuzzleHUDEntries();
  const players = contents(globalThis.game?.users).filter(user => user?.active !== false && !user.isGM);
  const rows = entries.map(entry => `<div class="form-group rw-hud-test-row" data-rw-test-row="${escapeHTML(entry.id)}"><span>${escapeHTML(entry.title)}</span><button type="button" data-rw-hud-test="${escapeHTML(entry.id)}">Test</button><button type="button" data-rw-hud-reset="${escapeHTML(entry.id)}" title="Start a fresh standalone test session (does not change any live puzzle)">Reset test</button></div>`).join("");
  return `<section class="standard-form rw-puzzle-hud"><p>GM-controlled player-context testing. Choose an active non-GM player; Test and Reset test open on their client without granting GM permissions.</p><div class="form-group"><label for="rw-pl-test-player">Test as player</label><select id="rw-pl-test-player" data-rw-hud="test-player"><option value="">Choose a non-GM player</option>${contents(globalThis.game?.users).filter(user => !user.isGM).map(user => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name)}${user.active ? " (online)" : " (offline)"}</option>`).join("")}</select></div><div class="rw-hud-test-list">${rows}</div><hr><p>Optional: deploy a fresh standalone test to players.</p><div class="form-group"><label for="rw-pl-hud-puzzle">Puzzle</label><select id="rw-pl-hud-puzzle" data-rw-hud="puzzle">${entries.map(entry => `<option value="${escapeHTML(entry.id)}">${escapeHTML(entry.title)}</option>`).join("")}</select></div><div class="form-group"><label for="rw-pl-hud-scope">Deploy to</label><select id="rw-pl-hud-scope" data-rw-hud="scope"><option value="all">All active players + this GM</option><option value="player">One active player</option></select></div><div class="form-group" data-rw-hud="player-wrap" hidden><label for="rw-pl-hud-player">Active player</label><select id="rw-pl-hud-player" data-rw-hud="player">${players.map(user => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name)}</option>`).join("")}</select></div><div class="form-footer"><button type="button" class="button" data-rw-hud="deploy"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> Deploy puzzle</button></div><p role="status" data-rw-hud="status">No activation made.</p></section>`;
}function createPuzzleHUD(DialogV2) {
  return class PuzzleHUD extends DialogV2 {
    constructor() { super({ classes: ["regionwright", "rw-puzzle-hud-dialog"], window: { title: "Puzzles & Locks HUD", icon: "fa-solid fa-gamepad", resizable: true, minimizable: false }, position: { width: 600, height: 700 }, content: renderHUDContent(), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] }); }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.element?.[0] ?? this.element;
      root?.addEventListener("click", event => {
                const test = event.target.closest?.("[data-rw-hud-test]");
        const reset = event.target.closest?.("[data-rw-hud-reset]");
        if (test || reset) { event.preventDefault(); void this.testEntry((test ?? reset).dataset.rwHudTest ?? reset?.dataset.rwHudReset, Boolean(reset)); return; }
        if (!event.target.closest?.('[data-rw-hud="deploy"]')) return;
        event.preventDefault();
        void this.deploy();
      });
      root?.addEventListener("change", event => {
        if (event.target.matches?.('[data-rw-hud="scope"]')) {
          const wrap = root.querySelector?.('[data-rw-hud="player-wrap"]');
          if (wrap) wrap.hidden = event.target.value !== "player";
        }
      });
    }
    async testEntry(puzzleId, reset = false) {
      if (!activeGM() || !isStandalonePuzzleId(puzzleId)) return;
      const root = this.element?.[0] ?? this.element;
      const status = root?.querySelector?.('[data-rw-hud="status"]');
      const playerId = root?.querySelector?.('[data-rw-hud="test-player"]')?.value;
      try {
        if (!playerId) throw new Error("Select a non-GM player to test the real player-facing puzzle UI.");
        const player = contents(globalThis.game?.users).find(user => user.id === playerId && !user.isGM);
        if (!player?.active) throw new Error("The selected player is offline. Log in to their non-GM Foundry session first.");
        const receipt = await deployPuzzleHUD(puzzleId, null, { scope: "player", playerId });
        if (status) status.textContent = `${reset ? "Fresh player test" : "Player test"} sent to ${player.name}. World documents and actor permissions unchanged.`;
        return receipt;
      } catch (error) {
        if (status) status.textContent = error.message;
        globalThis.ui?.notifications?.error?.(error.message);
      }
    }    async deploy() {
      const root = this.element?.[0] ?? this.element;
      try {
        const receipt = await deployPuzzleHUD(root?.querySelector?.('[data-rw-hud="puzzle"]')?.value, null, { scope: root?.querySelector?.('[data-rw-hud="scope"]')?.value, playerId: root?.querySelector?.('[data-rw-hud="player"]')?.value });
        const status = root?.querySelector?.('[data-rw-hud="status"]');
        if (status) status.textContent = `Deployed to ${receipt.recipients.map(user => user.name).join(", ")}.`;
      } catch (error) {
        const status = root?.querySelector?.('[data-rw-hud="status"]');
        if (status) status.textContent = error.message;
        globalThis.ui?.notifications?.error?.(error.message);
      }
    }
  };
}
export async function openPuzzleHUD() {
  if (!activeGM()) throw new Error("Only the active GM can open the Puzzles & Locks HUD.");
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createPuzzleHUD(DialogV2))();
  await dialog.render({ force: true });
  return dialog;
}
export const puzzleHUD = Object.freeze({ version: PUZZLE_HUD_VERSION, catalog: puzzleHUDCatalog, available: availablePuzzleHUDEntries, deploy: deployPuzzleHUD, open: openPuzzleHUD, installSocket: installPuzzleHUDSocket });
