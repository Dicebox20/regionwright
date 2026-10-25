# Iggwilv's Tower - Module Implementation Model

This is the actual division of responsibility confirmed from the installed module APIs. It replaces the earlier generic macro approach.

## Regionwright: campaign state, puzzles, and player travel

Use **Regionwright: Studio** as the source of truth for the tower's interactive structure.

- `game.modules.get("regionwright").api.studio.facts`
  - Persistent, GM-owned story-fact database.
  - Use for state such as `fact.study-star-unlocked`, `fact.hidden-library-revealed`, `fact.nixie-allied`, `fact.vault-opened`, and `fact.plant-food-created`.
- `game.modules.get("regionwright").api.studio.activities.publishScenePortal`
  - Publishes a native Foundry cross-scene teleport Behavior on a selected source Region.
  - Use for every reviewed T01-T20 threshold and its paired arrival Region.
- `game.modules.get("regionwright").api.premium.ingredientMixing`
  - Use only for P15, after the cauldron's carried-item gate succeeds.
- `game.modules.get("regionwright").api.premium.spineMosaic`
  - Use only for P09, the hidden-bookcase arrangement puzzle.
- `game.modules.get("regionwright").api.studio.activities.publishStoryFact`
  - Use when a simple interaction should permanently record a campaign discovery.

## Dungeon Master's Forge: world items and native effects

Use **Dungeon Master's Forge** for its audited DND5e item pipeline and its reviewed native Region effects.

- `game.modules.get("dungeon-masters-forge").api.create(...)`
  - Creates reviewed DND5e Items, including the tower's carried quest items where a DND5e item document is appropriate.
- `game.modules.get("dungeon-masters-forge").api.openSceneRegion()`
  - Applies reviewed safe native Region behaviors such as scrolling text, movement cost, darkness, or Active Effects.

It does **not** create Scenes, upload map images, or create cross-scene teleport Behaviors. Its Scene Region Forge intentionally excludes `teleportToken` and arbitrary scripts. Regionwright is the correct tool for those jobs.

## Core Foundry: scene records and map backgrounds

Core Foundry owns Scenes and their `background.src`. A script macro can create/update scenes and bind an image already visible to Foundry's FilePicker. It cannot upload a PNG from chat or read an arbitrary Windows file path because macros run in the client sandbox.

## Macro output rule

The macro configuration is the only reliable proof of whether a macro is a **Script** or **Chat** macro. A Script macro may intentionally create Chat messages; the earlier scene installer did so with `ChatMessage.create`, which caused its status report to appear in Chat. Do not infer macro type from output alone.

Future Iggwilv installer macros use Foundry notifications and `console.table` for diagnostics unless a player-facing Chat message is explicitly part of the campaign effect.

## Correct build order

1. Script canary.
2. Core Scene/map binding macro using FilePicker-resolved image paths.
3. Regionwright portal macro after visual threshold coordinates are verified.
4. Dungeon Master's Forge item macro for carried quest items.
5. Regionwright story facts plus the Bookcase and Cauldron puzzle Regions.
6. Regionwright/Foundry audit macro and player token traversal test.
