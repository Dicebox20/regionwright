# Iggwilv's Tower - Macro Installation Protocol

Every future injection macro follows this order. This is mandatory for scene, item, Region, puzzle, effect, actor, and teleport installers.

## 1. Prepare

- Create required folders, state records, and target documents when the macro owns them.
- For map installers, open a multi-file picker and upload final assets into Foundry User Data before creating Scenes.
- For item installers, create or locate the correct world Item folder before creating an Item.
- For Region installers, locate the named target Scene and create required source/arrival Regions before adding behaviors.

## 2. Validate all prerequisites before installing the payload

The macro must check every required condition in advance and stop with one readable error if any are absent.

| Payload | Required checks |
|---|---|
| Scene background | all final PNGs selected, uploaded, and visible through `FilePicker.browse` |
| Teleport Region | both scenes exist, both background textures decode, source/arrival geometry is defined, Regionwright is active, Regionwright Region writes are enabled |
| Quest Item | DND5e system active, item folder available, any required source item or art is present |
| Item-use puzzle | required quest Item documents exist and exact names resolve before binding the interaction Region |
| Ingredient Mixing | Regionwright premium API available; all four ingredient Items exist; cauldron Region exists; Regionwright puzzle and Region writes enabled |
| Bookcase arrangement | Regionwright Spine Mosaic API available; Private Library Scene and bookcase Region exist; travel threshold/arrival Regions exist but remain gated |
| Effect Region | effect Item and its Active Effect exist; target Region exists; Dungeon Master's Forge is active only if its native effect builder is being used |

## 3. Install atomically where possible

- Do not write the main payload until the validation list is clean.
- Tag every created document/behavior with `flags.iggwilvTower` and the stable Region name/ID.
- An update reruns only documents carrying that campaign tag; it does not touch unrelated user content.
- If a multi-step operation fails after a write, restore the previous tagged data or report the exact partially created documents.

## 4. Verify the installed result

- Use `console.table` and a short Foundry notification, never automatic Chat output unless it is intentionally player-facing.
- Verify created document count, UUIDs, Region behaviors, item names, and source/destination UUIDs.
- For images, verify actual `foundry.canvas.loadTexture` decoding, not only the stored path.
- For puzzle installers, verify the exact required items and puzzle configuration after binding.

## Standard macro name pattern

`IGG | NN | PREP+INSTALL | Specific payload`

Examples:

- `IGG | 01 | PREP+INSTALL | Final map Scenes`
- `IGG | 04 | PREP+INSTALL | Tower travel Regions`
- `IGG | 05 | PREP+INSTALL | Quest items`
- `IGG | 07 | PREP+INSTALL | Hidden bookcase puzzle`
- `IGG | 08 | PREP+INSTALL | Plant Food cauldron`

## Current first macro

`01C_IGGWILV_UPLOAD_AND_INSTALL_FINAL_MAPS.js` is the first compliant installer: it asks for the eleven final assets, uploads them into Foundry User Data, verifies the upload through FilePicker, and only then creates/repairs the eleven Scenes.
