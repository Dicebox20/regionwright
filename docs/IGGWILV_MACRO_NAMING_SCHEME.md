# Iggwilv's Tower - Macro Naming Scheme

Use this exact Foundry macro name format:

`IGG | NN | CATEGORY | Short purpose`

- `IGG` - Iggwilv's Tower campaign namespace.
- `NN` - two-digit execution order within a category. Leave gaps for revisions.
- `CATEGORY` - one of `SETUP`, `AUDIT`, `TRAVEL`, `ITEM`, `PUZZLE`, `STATE`, `TEST`, or `RESET`.
- `Short purpose` - specific scene, item, or effect. Use the final scene name without the `Iggwilv Tower -` prefix where useful.

## Initial macro sequence

| Foundry macro name | Purpose |
|---|---|
| `IGG | 00 | SETUP | Preflight final maps` | Confirms all eleven final-draft PNGs are readable from `Big Maps`. |
| `IGG | 01 | SETUP | Install final-draft scenes` | Creates or repairs all eleven scenes and their grids. |
| `IGG | 02 | AUDIT | Scenes and Regions` | Reports scene source, dimensions, grid, and existing Regions. |
| `IGG | 03 | AUDIT | Door coordinate survey` | Captures verified threshold / arrival coordinates from the repaired maps. |
| `IGG | 04 | TRAVEL | Install tower teleports` | Creates only the reviewed T01-T20 door/stair Regions. |
| `IGG | 05 | ITEM | Create quest items` | Creates every carried quest item with consistent names and flags. |
| `IGG | 06 | STATE | Initialize campaign state` | Creates the `flags.iggwilvTower` state defaults. |
| `IGG | 07 | PUZZLE | Hidden bookcase arrangement` | Installs the Regionwright Spine Mosaic and unlock behavior. |
| `IGG | 08 | PUZZLE | Cauldron ingredient mixing` | Installs the gated four-ingredient cauldron puzzle. |
| `IGG | 09 | PUZZLE | Quest interaction Regions` | Installs the remaining item-use, clue, and lock Regions. |
| `IGG | 10 | TEST | Player traversal` | Tests every available player route and identifies loops/broken destinations. |
| `IGG | 11 | TEST | Quest progression` | Checks the item/state dependency chain end to end. |
| `IGG | 90 | RESET | Puzzle states` | GM-only reset for repeat testing; never deletes scenes or maps. |
| `IGG | 91 | RESET | Tower teleport Regions` | Removes/rebuilds only `Iggwilv:`-prefixed travel Regions. |

## Per-scene optional macros

Use these only when a scene requires a separately testable interaction. Keep the global number and add a scene suffix:

- `IGG | 09 | PUZZLE | F1 Landing star relief`
- `IGG | 09 | PUZZLE | Private Study hourglass riddle`
- `IGG | 09 | PUZZLE | Witch's Laboratory cabinet`
- `IGG | 09 | PUZZLE | Astral Garden activations`
- `IGG | 09 | PUZZLE | Arcane Vault seal and password`
- `IGG | 09 | PUZZLE | Summoning Chamber ritual`

## Related document and Region names

- Scene: `Iggwilv Tower - <Room>`
- Item: exact PDF-facing name, for example `Red Leaf Fern`
- State flag: `flags.iggwilvTower.<camelCaseState>`
- Travel Region: `Iggwilv: TNN <Source> to <Destination>`
- Arrival Region: `Iggwilv: ANNN <Destination> arrival from <Source>`
- Interaction Region: `Iggwilv: PNN <Interaction name>`

Never use a generic name such as `Teleport`, `Puzzle`, or `Region Macro`; they make auditing and targeted resets unsafe.
