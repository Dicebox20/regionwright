import { LOCKPICK_DIFFICULTIES, configureLockpickDoor } from "./lockpicking.js";

const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const rootFor = dialog => dialog.element?.[0] ?? dialog.element ?? null;

function availableDoors() {
  return [...(globalThis.canvas?.scene?.walls?.values?.() ?? [])]
    .filter(door => Number(door.door ?? 0) > 0)
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, { sensitivity: "base" }))
    .map((door, index) => ({ door, label: String(door.name ?? "").trim() || `Door ${String.fromCharCode(65 + index)}` }));
}

function highlight(uuid, active) {
  const wall = globalThis.canvas?.walls?.placeables?.find?.(placeable => placeable.document?.uuid === uuid);
  if (wall) wall.hover = active;
}

function setupMarkup(state) {
  const doors = availableDoors();
  const doorRows = doors.length
    ? doors.map(({ door, label }) => `<button type="button" class="rw-lockpick-setup-door ${state.doorUuid === door.uuid ? "is-selected" : ""}" data-door="${escapeHTML(door.uuid)}" aria-pressed="${state.doorUuid === door.uuid}"><i class="fa-solid fa-door-closed" aria-hidden="true"></i><span>${escapeHTML(label)}</span>${state.doorUuid === door.uuid ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ""}</button>`).join("")
    : "<p>No Doors are available on the active Scene.</p>";
  const difficulties = Object.entries(LOCKPICK_DIFFICULTIES).map(([key, entry]) => `<option value="${escapeHTML(key)}" ${state.difficulty === key ? "selected" : ""}>${escapeHTML(entry.label)}</option>`).join("");
  return `<section class="standard-form rw-lockpick-setup"><p>Choose a Door and lock difficulty.</p><div class="rw-lockpick-setup-doors">${doorRows}</div><div class="form-group"><label for="rw-lockpick-difficulty">Difficulty</label><select id="rw-lockpick-difficulty" data-difficulty>${difficulties}</select></div><div class="form-footer"><button type="button" class="button" data-create ${state.doorUuid ? "" : "disabled"}><i class="fa-solid fa-key" aria-hidden="true"></i> Add Tumbler Lock</button></div></section>`;
}

function createSetupClass(DialogV2) {
  return class TumblerLockSetup extends DialogV2 {
    constructor() {
      super({ classes: ["regionwright", "rw-lockpick-setup-dialog"], window: { title: "Add Tumbler Lock", icon: "fa-solid fa-key", resizable: true, minimizable: false }, position: { width: 430, height: 480 }, content: setupMarkup({ doorUuid: null, difficulty: "average" }), buttons: [{ action: "close", label: "Close", icon: "fa-solid fa-xmark" }] });
      this.state = { doorUuid: null, difficulty: "average" };
    }
    _onRender(context, options) {
      super._onRender(context, options);
      const root = rootFor(this);
      root?.addEventListener("click", event => {
        const selected = event.target.closest?.("[data-door]");
        if (selected) {
          if (this.state.doorUuid) highlight(this.state.doorUuid, false);
          this.state.doorUuid = selected.dataset.door;
          highlight(this.state.doorUuid, true);
          this._refresh();
          return;
        }
        if (event.target.closest?.("[data-create]")) void this._create();
      });
      root?.addEventListener("change", event => {
        if (event.target.matches?.("[data-difficulty]")) this.state.difficulty = event.target.value;
      });
      root?.addEventListener("pointerover", event => { const door = event.target.closest?.("[data-door]"); if (door) highlight(door.dataset.door, true); });
      root?.addEventListener("pointerout", event => { const door = event.target.closest?.("[data-door]"); if (door && door.dataset.door !== this.state.doorUuid) highlight(door.dataset.door, false); });
    }
    _refresh() {
      const section = rootFor(this)?.querySelector?.(".rw-lockpick-setup");
      if (section) section.outerHTML = setupMarkup(this.state);
    }
    async _create() {
      if (!this.state.doorUuid) return;
      const select = rootFor(this)?.querySelector?.("[data-difficulty]");
      if (select) this.state.difficulty = select.value;
      try {
        await configureLockpickDoor({ door: this.state.doorUuid, difficulty: this.state.difficulty });
        globalThis.ui?.notifications?.info?.("Tumbler Lock added to the Door.");
        await this.close();
      } catch (error) {
        globalThis.ui?.notifications?.error?.(error.message ?? "Unable to add Tumbler Lock.");
      }
    }
    async close(options = {}) {
      if (this.state.doorUuid) highlight(this.state.doorUuid, false);
      return super.close(options);
    }
  };
}

export async function openLockpickSetup() {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Foundry's dialog system is unavailable.");
  const dialog = new (createSetupClass(DialogV2))();
  await dialog.render({ force: true });
  return dialog;
}
