# Iggwilv’s Tower — Region Behavior Injection Plan

## Objective

Turn the 68 existing Tower Regions into a reliable, player-explorable Foundry VTT dungeon while preserving the PDF’s progression. The installation is prerequisite-first, idempotent, and GM-authoritative.

Current live baseline: 11 Scenes, 68 Regions, and zero RegionBehavior documents. The Region set is complete as `T01–T20`, `A01–A20`, `G01–G12`, `P01–P15`, and `E01`.

## Non-negotiable implementation rules

- Use the valid module flag scope `regionwright`, never `iggwilvTower` as a top-level scope.
- Store ownership under `flags.regionwright.iggwilvTowerBehavior` and region metadata under `flags.regionwright.iggwilvTower`.
- Resolve Regions by their unique region key, not display name or array position.
- Resolve quest Items by exact Item name. Item UUIDs and flags are optional audit metadata and must never be prerequisites for behavior installation.
- Every macro must preflight all prerequisites before writing anything.
- Every macro must update its own owned documents instead of duplicating them.
- Arrival Regions are destinations, not triggers. They intentionally receive no behaviors.
- Item and puzzle results are persistent and idempotent; re-entry must report the completed state rather than award duplicates.
- The triggering token’s Actor is the default item recipient. Multi-item gates may draw from player-character Actors on the same Scene when the party has split the components.

## Runtime architecture

### Native Foundry behaviors

- `teleportToken` on `T01–T20`.
- `executeScript` for a one-line call into the Tower runtime controller.
- `toggleBehavior` is optional; the controller can directly enable the owned teleport behavior after a gate is solved.

Teleport parameters:

```js
{
  destinations: [arrivalRegion.uuid],
  placement: "center",
  snap: true,
  choice: false,
  revealed: false,
  dialog: { revealed: null, unrevealed: null },
  transition: { type: null, duration: 1500 }
}
```

### Tower runtime controller

Create one World Script Macro named `IGG | Runtime Controller`. Every Tower interaction Region calls it with a short reviewed Execute Script behavior:

```js
await game.macros.getName("IGG | Runtime Controller")?.execute({ region, event });
```

The controller reads the region key, finds the entering token and Actor, checks/consumes/grants Items, maintains campaign state, controls owned teleport behaviors, and activates prepared encounter tokens. This keeps the behavior documents small and makes later fixes occur in one place.

Persistent campaign state belongs in a single world setting or Journal flag, not independently on player clients. Suggested state keys:

```text
starTaken, studyUnlocked, cabinetOpened, hourglassSolved,
bookcaseSolved, boneMealCrafted, plantFoodMixed,
treantSun, treantWater, treantFood, treantAwake, treantResolved,
nixieRevived, nixieFed, portraitOpened, vaultUnlocked,
cambionSummoned, cambionResolved, thornKeyForged, roseDoorOpened
```

## Macro series and execution order

### 09A — Preflight and migration

1. Require an active GM, Foundry v14-compatible Region behavior models, active Regionwright, Region Writes enabled, and Puzzle Writes enabled.
2. Confirm all 11 Scenes and all 68 unique region keys.
3. Confirm the 23 quest Items by exact name. Create any missing names (`Star`, `Skeleton Bones`, or `Ordinary Water`) before installing behaviors. Item UUIDs are not required.
4. Confirm the six dedicated Actor UUIDs:
   - Nixie — `Actor.88UZTmEStCJvgRQA`
   - Cowardly Vampire Ritual Assistant — `Actor.yp5N7pZJ55H7JAu1`
   - Child Faerie Dragon — `Actor.6Qz6BnNqn3eegGKJ`
   - Cambion — `Actor.zIuxjSzp3qPbFdJF`
   - Astral Treant — `Actor.p6Fe5QOVEoGfeWA9`
   - Adult Faerie Dragon — `Actor.ZxwpNOpwal02ivlJ`
5. Resolve one Flying Sword and one Skeleton source Actor, then clone them into a dedicated Tower Actors folder to obtain stable, unambiguous UUIDs.
6. Confirm the runtime controller Macro exists before attaching Execute Script behaviors.
7. Abort without writes if any prerequisite is missing.

#### Exact quest Item name manifest

The first 20 names below are confirmed directly from the Foundry Items directory. The final three are PDF-required Items to create under exactly the names shown. Name lookup is case-sensitive and punctuation-sensitive.

```text
Arcane Lock Password
Astral Fruit
Astral Water
Black Tallow Candles
Blood Meal
Calcium-Rich Bone Meal
Demon Skull
Epsom Salts
Fey-Infused Plant Food
Fey-Infused Water
Hourglass Coven's Hourglass
Iggwilv's Sovereign Seal
Ingredient Cabinet Key
Ivory Thorn
Obsidian Crow's-Foot Key
Obsidian Thorn
Powdered Silver
Red Leaf Fern
Sunglobe
Thorn Key
Star
Skeleton Bones
Ordinary Water
```

### 09B — Geometry repair

1. Move each `A01–A20` arrival rectangle at least two grid squares inside its destination room and clear of the reverse-direction `T` Region.
2. Move `G01` from inside the Private Study to the Private Library side of the star-socket door.
3. Separate `G08` and `G09` into adjacent non-overlapping interaction zones on the vertical Nixie tank: water-filling control and feeding/access point.
4. Separate `G11` from `T15`; `G11` must be reachable before the vault teleport can fire.
5. Keep `T11` at the puzzle bookcase, but start its teleport disabled.
6. Validate that no arrival overlaps any travel trigger after the repair.

### 09C — Travel behaviors

Attach one owned `teleportToken` behavior to every `T` Region:

| Source | Destination | Initial state |
|---|---|---|
| T01 | A01 | Enabled |
| T02 | A02 | Enabled |
| T03 | A03 | Enabled |
| T04 | A04 | Enabled |
| T05 | A05 | Enabled |
| T06 | A06 | Enabled |
| T07 | A07 | Enabled |
| T08 | A08 | Enabled |
| T09 | A09 | **Disabled until G01** |
| T10 | A10 | Enabled |
| T11 | A11 | **Disabled until bookcase puzzle** |
| T12 | A12 | Enabled |
| T13 | A13 | Enabled; this is the two-floor spiral staircase |
| T14 | A14 | Enabled; this is the reverse staircase route |
| T15 | A15 | **Disabled until G11** |
| T16 | A16 | Enabled |
| T17 | A17 | Enabled |
| T18 | A18 | Enabled |
| T19 | A19 | Enabled |
| T20 | A20 | Enabled |

`A01–A20` remain behavior-free destination anchors. This is intentional loop prevention, not an omission.

### 09D — Pickups, crafting, clues, and simple gates

Attach one owned controller behavior to each listed Region:

| Region | Controller action |
|---|---|
| P01 | Take the wall-mounted Star once and grant `Star`; set `starTaken`. Hide a separate Star overlay Tile if one exists; a Star baked into the background image cannot be removed by a Region behavior. |
| G01 | Require/present `Star`; set `studyUnlocked`; enable T09. The Star may remain fitted in the socket rather than return to inventory. |
| P02 | Grant `Ingredient Cabinet Key` once. |
| G02 | Require the key; set `cabinetOpened`; grant `Astral Water` and `Demon Skull`. These are cabinet contents, not separate map fixtures. |
| P03 | Inspect the Hourglass Coven’s Hourglass and record the clue. The physical clue need not be carried to answer G03. |
| G03 | Open an exact-answer riddle dialog; normalized answer `HOURGLASS` grants `Powdered Silver` once. |
| P04 | Start the prepared Skeleton encounter on first entry; grant `Skeleton Bones` only after the encounter is resolved. |
| P05 | Consume `Skeleton Bones`; grant `Calcium-Rich Bone Meal`; set `boneMealCrafted`. |
| P07 | Grant `Sunglobe` once. |
| P08 | Grant `Epsom Salts` once. |
| P09 | Grant `Red Leaf Fern` once. |
| P10 | Run the cowardly vampire interaction; grant `Blood Meal` after intimidation, persuasion, bargain, or GM-approved resolution. |
| P11 | Offer trap-disarm handling; if the key is removed while armed, activate prepared Flying Swords. Grant `Obsidian Crow’s-Foot Key` once. |
| G04 | Require the Crow’s-Foot Key; open the portrait; grant `Iggwilv’s Sovereign Seal`; set `portraitOpened`. |
| P12 | Grant `Black Tallow Candles` once. |
| P13 | Use the garden water source or require carried `Ordinary Water`, then require a successful faerie-dragon social resolution and transform it into `Fey-Infused Water`. |
| P14 | Grant `Ivory Thorn` once after vault access. |
| P15 | Require and consume `Ivory Thorn` plus `Obsidian Thorn`; grant `Thorn Key`; set `thornKeyForged`. |
| G12 | Require/insert `Thorn Key`; set `roseDoorOpened`; reveal the Floor 3 passage. Do not create a destination teleport until the Floor 3 Scene exists. |

### 09E — Regionwright puzzles

#### P06 — Four-Ingredient Cauldron

1. Configure Regionwright Ingredient Mixing on P06 with:
   - Red Leaf Fern — target 2
   - Epsom Salts — target 3
   - Blood Meal — target 2
   - Calcium-Rich Bone Meal — target 3
   - tolerance 0
2. Remove or disable the adapter-created auto-open behavior so inventory gating cannot be bypassed.
3. The controller first verifies all four exact Items, then opens Regionwright Ingredient Mixing.
4. Register a one-session completion watcher before opening the puzzle. When Regionwright changes P06’s persistent status to `solved`, the GM controller consumes the four ingredients, grants `Fey-Infused Plant Food`, and sets `plantFoodMixed` exactly once.
5. On later entry, display the solved state without reopening or re-awarding.

#### T11 — Hidden bookcase Spine Mosaic

1. Configure Regionwright Spine Mosaic directly on T11, whose teleport remains disabled.
2. Use the established six-book thematic set and seed, but treat book titles/order as campaign configuration because the PDF specifies an arrangement puzzle without prescribing exact titles.
3. Register a completion watcher. When Regionwright marks the mosaic solved, set `bookcaseSolved` and enable T11.
4. Either teleport the triggering token immediately after success or prompt it to step out and re-enter; immediate teleport is preferred.

### 09F — Linked progression and encounters

| Region | State machine |
|---|---|
| G05 | Require/present `Sunglobe`; set `treantSun`. Do not consume the lamp. |
| G06 | Require and pour `Astral Water`; set `treantWater`; consume the water. |
| G07 | Require and apply `Fey-Infused Plant Food`; set `treantFood`; consume the food. |
| E01 | Remain inert until all three Treant states are true. Then reveal/activate the prepared Astral Treant and set `treantAwake`. Grant `Astral Fruit` only after defeat or GM-approved noncombat resolution. |
| G08 | Require and pour `Fey-Infused Water` into the vertical tank; consume it; set `nixieRevived`; reveal/activate the Nixie. |
| G09 | Require `nixieRevived` and `Astral Fruit`; consume the fruit; set `nixieFed`; grant `Arcane Lock Password` once. |
| G10 | Require vampire cooperation and the Demon Skull, Black Tallow Candles, and Powdered Silver. Consume the three components, activate the prepared Cambion, and set `cambionSummoned`. Grant `Obsidian Thorn` only after the Cambion is defeated or otherwise overcome. |
| G11 | Require/present `Iggwilv’s Sovereign Seal` and `Arcane Lock Password`—exactly two requirements. Set `vaultUnlocked` and enable T15. Do not add a third requirement. |

The controller must never equate “encounter started” with “encounter won.” Rewards at P04, E01, and G10 are awarded only after the GM confirms resolution or the prepared hostile tokens are defeated.

### 09G — Actor and token preparation

Prepare hidden tokens before behaviors are enabled:

- Private Library: Skeleton group at P04.
- Floor 2 Landing: Flying Swords associated with P11.
- Summoning Chamber: visible cowardly vampire assistant; hidden Cambion in the containment ring.
- Astral Garden: dormant Astral Treant; visible Adult and Child Faerie Dragons.
- Curiosities Room: desiccated Nixie in the vertical tank, initially hidden or visually dormant.

Behavior execution should reveal/activate existing tokens instead of calculating spawn coordinates during play.

### 09H — Validation and reset

Validation macro checks:

1. Exactly one owned teleport behavior on every T Region.
2. Correct destination UUID for all 20 routes.
3. T09, T11, and T15 disabled before their gates and enabled after them.
4. No behavior on A Regions and no arrival/travel overlap.
5. One owned controller behavior on every applicable G, P, and E Region.
6. Regionwright puzzle flags exist on P06 and T11.
7. All exact Item names and Actor UUIDs resolve.
8. Re-running installers produces zero duplicates.
9. A complete player-token walkthrough succeeds in progression order.

Reset macro removes only documents carrying `flags.regionwright.iggwilvTowerBehavior`, clears only the Tower campaign-state record and Regionwright puzzle state for P06/T11, restores prepared token visibility, and resets T09/T11/T15 to disabled. It must preserve unrelated Scene, Region, Item, Token, and module data.

## Recommended smoke-test route

1. Traverse T01–T08 and T13–T20 in both directions; confirm no bounce-back.
2. Take P01, solve G01, and verify T09 unlocks.
3. Take P02; open G02; solve G03; collect P07–P09.
4. Resolve P04, craft P05, obtain P10, and solve P06.
5. Solve the T11 bookcase and collect P12.
6. Resolve P13; complete G05–G07; trigger and resolve E01.
7. Complete G08 then G09 in that order.
8. Resolve P11 and G04.
9. Complete G10 and verify its reward is delayed until resolution.
10. Complete G11 and verify only then T15 works; collect P14.
11. Complete P15 and G12; confirm the door opens but no nonexistent Floor 3 teleport fires.

## Source-of-truth decisions from the PDF

- The Star belongs on the Floor 1 Landing wall relief; the central Landing feature is the two-floor spiral staircase.
- The Nixie is a two-foot creature in a vertical tank and has two sequential interactions: rehydration, then Astral Fruit.
- The cabinet is one cabinet interaction; its Astral Water and Demon Skull are granted only after unlocking it.
- The Arcane Vault has exactly two requirements: the Sovereign Seal and Arcane Lock Password.
- The hidden bookcase uses an arrangement puzzle; the PDF does not define exact book titles or order.
- The final rose door is part of the Floor 2 Landing, but Floor 3 has not yet been finalized.
