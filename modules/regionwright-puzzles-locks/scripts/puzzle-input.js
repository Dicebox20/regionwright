/**
 * Puzzle dialogs are modal play surfaces. Foundry listens for movement keys on
 * the window, so a dialog-local handler is too late to stop a controlled Token
 * from moving. This guard runs in the capture phase while a puzzle is open.
 */
export const PUZZLE_MOVEMENT_CODES = Object.freeze(new Set(["KeyW", "KeyA", "KeyS", "KeyD"]));

const activeGuards = [];
let listenerHost = null;

export function isPuzzleMovementKey(event) {
  return PUZZLE_MOVEMENT_CODES.has(event?.code)
    || ["W", "A", "S", "D"].includes(String(event?.key ?? "").toUpperCase());
}

/** Block a movement event and optionally pass it to the active puzzle first. */
export function suppressPuzzleMovementEvent(event, { onKeyDown = null, onKeyUp = null } = {}) {
  if (!isPuzzleMovementKey(event)) return false;
  if (event.type === "keydown") onKeyDown?.(event);
  if (event.type === "keyup") onKeyUp?.(event);
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
  return true;
}

function activeGuard() {
  return activeGuards.at(-1) ?? null;
}

function handleMovementInput(event) {
  const guard = activeGuard();
  if (guard) suppressPuzzleMovementEvent(event, guard);
}

function ensureListener() {
  const host = globalThis.window;
  if (!host?.addEventListener || listenerHost === host) return;
  listenerHost?.removeEventListener?.("keydown", handleMovementInput, true);
  listenerHost?.removeEventListener?.("keyup", handleMovementInput, true);
  host.addEventListener("keydown", handleMovementInput, true);
  host.addEventListener("keyup", handleMovementInput, true);
  listenerHost = host;
}

function removeListenerIfUnused() {
  if (activeGuards.length || !listenerHost) return;
  listenerHost.removeEventListener?.("keydown", handleMovementInput, true);
  listenerHost.removeEventListener?.("keyup", handleMovementInput, true);
  listenerHost = null;
}

/**
 * Acquire a scoped movement lock for an open puzzle. The release function is
 * idempotent and is safe to call during an application close lifecycle.
 */
export function acquirePuzzleMovementGuard(handlers = {}) {
  const guard = Object.freeze({
    onKeyDown: typeof handlers.onKeyDown === "function" ? handlers.onKeyDown : null,
    onKeyUp: typeof handlers.onKeyUp === "function" ? handlers.onKeyUp : null
  });
  activeGuards.push(guard);
  // If the player was already holding a movement key while opening the puzzle,
  // reset Foundry's key state immediately instead of waiting for a keyup.
  globalThis.game?.keyboard?.releaseKeys?.({ force: true });
  ensureListener();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const index = activeGuards.lastIndexOf(guard);
    if (index >= 0) activeGuards.splice(index, 1);
    removeListenerIfUnused();
  };
}
