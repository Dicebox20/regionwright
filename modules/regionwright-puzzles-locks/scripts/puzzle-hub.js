import { openPuzzleHUD } from "./puzzle-hud.js";
import { STANDALONE_PUZZLES } from "./standalone-puzzles.js";
import { openLockpickSetup } from "./lockpicking-setup.js";
import { openRotationLockSetup } from "./rotating-lock.js";
import { openLaserGridSetup } from "./laser-grid.js";
import { openTimingDialSetup } from "./timing-dial.js";
import { openIngredientMixingSetup } from "./ingredient-mixing.js";
import { openSpineMosaicSetup } from "./spine-mosaic.js";
import { openSlidingMosaicSetup } from "./sliding-mosaic.js";

const OPENERS = Object.freeze({
  lockpicking: openLockpickSetup,
  "rotation-lock": openRotationLockSetup,
  "laser-grid": openLaserGridSetup,
  "timing-dial": openTimingDialSetup,
  "ingredient-mixing": openIngredientMixingSetup,
  "spine-mosaic": openSpineMosaicSetup,
  "sliding-mosaic": openSlidingMosaicSetup
});
const TITLES = Object.freeze({
  lockpicking: "Tumbler Lock",
  "rotation-lock": "Rotation Lock",
  "laser-grid": "Mirror Redirect",
  "timing-dial": "Timing Dial",
  "ingredient-mixing": "Ingredient Mixing",
  "spine-mosaic": "Spine Mosaic",
  "sliding-mosaic": "Sliding Mosaic"
});
const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function puzzleSetupCatalog() {
  return Object.freeze(STANDALONE_PUZZLES.map(entry => Object.freeze({ ...entry, title: TITLES[String(entry.id).split(":").at(-1)] ?? entry.title })));
}

export async function openPuzzleSetup(id, options = {}) {
  const suffix = String(id ?? "").split(":").at(-1);
  const open = OPENERS[suffix];
  if (!open) throw new Error("That Puzzles & Locks setup is unavailable.");
  return open(options);
}

function hubContent() {
  const cards = puzzleSetupCatalog().map(entry => {
    const id = String(entry.id).split(":").at(-1);
    return `<button type="button" class="rw-pl-hub-game" data-setup="${escapeHTML(id)}"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i><span>${escapeHTML(entry.title)}</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`;
  }).join("");
  return `<section class="standard-form rw-pl-hub"><p>Choose a game to configure on the current Scene.</p><nav class="rw-pl-hub-games" aria-label="Puzzle and lock setup">${cards}</nav><footer class="form-footer"><button type="button" class="button" data-open-puzzle-hud><i class="fa-solid fa-gamepad" aria-hidden="true"></i> Open Puzzle HUD</button></footer></section>`;
}

function createHubClass(DialogV2) {
  return class PuzzlesLocksHub extends DialogV2 {
    constructor() {
      super({ classes: ["regionwright", "rw-puzzles-locks-hub-dialog"], window: { title: "Regionwright: Puzzles & Locks", icon: "fa-solid fa-puzzle-piece", resizable: true, minimizable: false }, position: { width: 470, height: 560 }, content: hubContent(), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = this.element?.[0] ?? this.element;
      root?.addEventListener("click", event => {
        const setup = event.target.closest?.("[data-setup]");
        if (setup) { event.preventDefault(); void openPuzzleSetup(setup.dataset.setup); return; }
        if (event.target.closest?.("[data-open-puzzle-hud]")) { event.preventDefault(); void openPuzzleHUD(); }
      });
    }
  };
}

export async function openPuzzleHub() {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createHubClass(DialogV2))();
  await dialog.render({ force: true });
  return dialog;
}

export function registerPuzzleHubControl(controls) {
  const region = Array.isArray(controls)
    ? controls.find(entry => ["region", "regions"].includes(entry?.name))
    : controls?.regions ?? controls?.region;
  const tools = region?.tools;
  if (!tools) return false;
  const tool = { name: "regionwright-puzzles-locks", title: "Puzzles & Locks", icon: "fa-solid fa-puzzle-piece", button: true, visible: true, onChange: () => { void openPuzzleHub(); } };
  if (Array.isArray(tools)) {
    if (tools.some(entry => entry?.name === tool.name)) return false;
    tools.push({ ...tool, order: tools.length });
  } else {
    if (tools[tool.name]) return false;
    tools[tool.name] = { ...tool, order: Object.keys(tools).length };
  }
  return true;
}
