import { DIAGNOSTIC_SETTING, LEGACY_PUZZLE_WRITE_SETTING, MODULE_ID, PREVIEW_SETTING, STUDIO_DRAFT_SETTING, STUDIO_FACTS_SETTING, WRITE_SETTING } from "./constants.js";
import { createAPI } from "./api.js";
import { installPitfallSocket } from "./pitfall-trap.js";
import { installSceneMomentSocket } from "./studio-scene-moment.js";
import { installStoryFactSocket } from "./studio-story-fact.js";
import { installHubUnlockSocket } from "./studio-hub-unlock.js";
import { installBossEngine } from "./boss-engine.js";
import { installStudioCampaign } from "./studio-campaign.js";

const api = createAPI();

function exposeAPI() {
  const module = globalThis.game?.modules?.get?.(MODULE_ID);
  if (module) module.api = api;
  installStudioCampaign(api);
}

/** Socket listeners are local to each client, including clients loading late. */
function installRuntimeSockets() {
  installPitfallSocket();
  installSceneMomentSocket();
  installStoryFactSocket();
  installHubUnlockSocket();
  installBossEngine();
  installStudioCampaign(api);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, WRITE_SETTING, {
    name: "Regionwright Studio: Enable Region writes",
    hint: "Allow approved Studio plans and traps to create, update, or remove only Region data owned by this module. Disabled by default.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Keep the former setting readable for Puzzles & Locks' one-time migration.
  game.settings.register(MODULE_ID, LEGACY_PUZZLE_WRITE_SETTING, {
    name: "Regionwright legacy puzzle write setting",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, DIAGNOSTIC_SETTING, {
    name: "Regionwright Studio: Enable diagnostic logging",
    hint: "Show non-mutating capability and selection diagnostics in the browser console when requested from the Builder.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, PREVIEW_SETTING, {
    name: "Regionwright Studio: Preview detail",
    hint: "Choose how much serialized plan detail the Builder shows during review.",
    scope: "client",
    config: true,
    type: String,
    choices: { compact: "Compact", detailed: "Detailed" },
    default: "detailed"
  });

  game.settings.register(MODULE_ID, STUDIO_DRAFT_SETTING, {
    name: "Regionwright Studio: Draft",
    hint: "Module-owned Studio blueprint draft storage. This does not modify Regions or other Scene documents.",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register(MODULE_ID, STUDIO_FACTS_SETTING, {
    name: "Regionwright Studio: Story Facts",
    hint: "Module-owned progress facts for Studio activities. Only Regionwright Studio changes this setting.",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  exposeAPI();
  installRuntimeSockets();
  console.info(`${MODULE_ID} Studio initialized. Region writes remain disabled until explicitly enabled by a GM.`);
});

Hooks.once("ready", () => {
  exposeAPI();
  installRuntimeSockets();
  Hooks.callAll(`${MODULE_ID}.ready`, api);
  console.info(`${MODULE_ID} Studio ready.`, api.capabilities());
});

Hooks.on("canvasReady", () => {
  installRuntimeSockets();
});
