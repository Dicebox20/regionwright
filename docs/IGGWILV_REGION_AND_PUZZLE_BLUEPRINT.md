# Iggwilv's Tower - Region, Door, and Puzzle Blueprint

This is the macro-first implementation plan for the eleven final-draft maps. It follows the campaign guide: exploration is interconnected, puzzle objects are handled physically, locks precede their required items, and backtracking is purposeful.

## Implementation rules

- Every physical doorway receives a **1x1 source Region** centered just inside the doorway. Its destination is a **2x2 arrival Region** at least 10 feet inside the target room. Arrival Regions have no teleport Behavior.
- The shared stair is a separate paired pair of Regions: one 2x2 threshold on each central stair, with arrivals offset one square from the opposing threshold to prevent loops.
- Puzzle/interact Regions never overlap travel Regions or their 10-foot receiving zone.
- All macro-created Region names begin `Iggwilv:`. Reinstall macros remove/update only Regions with that prefix.
- Macro state is stored on the world under `flags.iggwilvTower`; item delivery state is stored on the acting token/actor. This avoids requiring a GM to change a scene.
- A failed item check displays an in-world clue or list of missing components. It never removes the carried item and never strands the party.
- Exact pixel coordinates are intentionally deferred until every repaired scene is inspected at 100% scale. The placement zones below are authoritative; the later door-coordinate audit macro will convert each zone to pixels.

## Traversal Region plan

| ID | Source Region (place here) | Arrival Region (place here) | State/gate |
|---|---|---|---|
| T01 | F1 Landing - west door, room side | Curiosities - east doorway, 10 ft inside | always open |
| T02 | Curiosities - east door, room side | F1 Landing - west doorway, 10 ft inside | always open |
| T03 | F1 Landing - north door, room side | Private Chambers - south doorway, 10 ft inside | always open |
| T04 | Private Chambers - south door, room side | F1 Landing - north doorway, 10 ft inside | always open |
| T05 | F1 Landing - east door, room side | Private Library - west doorway, 10 ft inside | always open |
| T06 | Private Library - west door, room side | F1 Landing - east doorway, 10 ft inside | always open |
| T07 | F1 Landing - south door, room side | Witch's Laboratory - north doorway, 10 ft inside | always open |
| T08 | Witch's Laboratory - north door, room side | F1 Landing - south doorway, 10 ft inside | always open |
| T09 | Private Library - north Study door | Private Study - south doorway, 10 ft inside | requires `starSocketUnlocked` |
| T10 | Private Study - south door | Private Library - north doorway, 10 ft inside | always open after entry |
| T11 | Private Library - secret-bookcase face | Hidden Library - entrance, 10 ft inside | requires `hiddenLibraryRevealed` |
| T12 | Hidden Library - concealed exit/bookcase | Private Library - bookcase receiving zone | always open after entry |
| T13 | F1 Landing - central stair, upper/ascending end | F2 Landing - central stair, lower-arrival edge | always open |
| T14 | F2 Landing - central stair, descending end | F1 Landing - central stair, upper-arrival edge | always open |
| T15 | F2 Landing - north Vault door | Arcane Vault - south doorway, 10 ft inside | requires `vaultOpened` |
| T16 | Arcane Vault - south door | F2 Landing - north doorway, 10 ft inside | always open after entry |
| T17 | F2 Landing - southwest/west Summoning door | Summoning Chamber - northeast entrance, 10 ft inside | always open |
| T18 | Summoning Chamber - northeast entrance | F2 Landing - southwest/west receiving zone | always open |
| T19 | F2 Landing - southeast/east Garden door | Astral Garden - northwest entrance, 10 ft inside | always open |
| T20 | Astral Garden - northwest entrance | F2 Landing - southeast/east receiving zone | always open |

Do **not** create a Rose Door teleport. Floor 3 is not part of the supplied map set. Its Region is an interaction gate that reports the missing Thorn Key until a Floor 3 scene is built.

## Scene-by-scene interaction Regions

### Floor 1 Landing

- `P01 Wall Star Relief`: place on the northwestern wall relief, offset from the north Private Chambers doorway. First interaction awards **Removable Star Emblem**. Subsequent use describes its vacant socket. No Region belongs on the central floor except the stair pair.
- `P02 Study Door Star Socket`: place on the Private Library side of the locked north Study door, not in the F1 Landing. Accepts **Removable Star Emblem**, sets `starSocketUnlocked`, and enables T09.

### Curiosities Room

- `P03 Nixie Tank`: place over the vertical 2x2 tank. Requires **Fey-Infused Water** to set `nixieRevived` and change the discovery text; then requires **Astral Fruit** to set `nixieAllied` and award the hidden **Arcane Vault Password** state.
- `P04 Hourglass Coven Display`: place on the 2x2 hourglass/display. It becomes productive only after the Study riddle is solved. It awards **Powdered Silver** without showing it in advance.

### Private Chambers

- `P05 Sunglobe`: portable-interaction Region. Awards **Sunglobe**.
- `P06 Epsom Salt Foot Bath`: portable-interaction Region. Awards **Epsom Salts**.
- `P07 Iggwilv Portrait Socket`: place on the portrait frame/socket, never in the south door's receiving area. Accepts **Obsidian Crow's-Foot Key**, awards **Sovereign Seal**.

### Private Library

- `P08 Red Leaf Fern Display`: awards **Red Leaf Fern**.
- `P09 Calcium Source`: milk skeleton table / obvious source; awards **Calcium-Rich Bone Meal** or the raw bones, depending on the final item macro.
- `P10 Enchanted Secret Bookcase`: runs the Regionwright **Spine Mosaic / book-arrangement puzzle**. The book titles/spine motifs must be configured in the picture order shown on the final bookcase, while players see them shuffled. On success it sets `hiddenLibraryRevealed`, changes the bookshelf's discovery text to describe the revealed seam/passage, and enables T11. P10 is an interaction Region; T11 is the separate newly usable travel threshold. Do not teleport a token in the instant the puzzle closes.

### Hidden Library

- `P11 Black Tallow Candle Rack`: requires `hiddenLibraryRevealed`; awards **Black Tallow Candles**. Do not put them on an oversized pedestal.

### Private Study

- `P12 Ingredient Cabinet Key Desk`: awards **Ingredient Cabinet Key**.
- `P13 Statue Riddle`: prompt answer is `HOURGLASS`; successful answer sets `hourglassRiddleSolved`, enabling P04 in Curiosities. It does not reveal Powdered Silver itself.

### Witch's Laboratory

- `P14 Reinforced Cabinet`: accepts **Ingredient Cabinet Key** and awards **Astral Water** plus **Demon Skull**. The cabinet remains a normal functional cabinet on the map.
- `P15 Bone-Grinding Bench`: optional conversion interaction if the library item is raw bones; converts them to **Calcium-Rich Bone Meal**.
- `P16 Fey-Infused Plant Food Cauldron`: a two-stage Region. **Stage 1** runs when a token enters/interacts with the cauldron and checks that *that token's actor* carries one each of **Red Leaf Fern**, **Epsom Salts**, **Blood Meal**, and **Calcium-Rich Bone Meal**. If anything is absent, it reports the missing ingredient names and does not open a puzzle. **Stage 2** opens the Regionwright four-ingredient mixing puzzle only after the inventory check passes. Its exact recipe is one measure of each of those four ingredients. A success consumes the four items, awards **Fey-Infused Plant Food**, and sets `plantFoodCreated`. Failure leaves the components intact for another attempt.

### Floor 2 Landing

- `P17 Obsidian Crow's-Foot Pedestal`: obvious open display; awards **Obsidian Crow's-Foot Key** and triggers the Flying Sword trap/encounter state.
- `P18 Rose-and-Thorn Door`: requires both **Ivory Thorn** and **Obsidian Thorn**. Success awards **Thorn Key** but reports that its destination, Floor 3, is deliberately not yet mapped.

### Summoning Chamber

- `P19 Vampire Assistant Workstation`: awards **Blood Meal** after the assistant encounter/interaction state is resolved.
- `P20 Three-Component Binding Circle`: requires **Demon Skull**, **Black Tallow Candles**, and **Powdered Silver**. Success sets `summoningReady`, starts the Cambion resolution, and awards **Obsidian Thorn** only after resolution.

### Astral Garden

- `P21 Sunglobe Activation Plinth`: accepts **Sunglobe**, sets `gardenSunglobeActive`.
- `P22 Astral Water Activation Plinth`: accepts **Astral Water**, sets `gardenWaterActive`.
- `P23 Plant Food Activation Plinth`: accepts **Fey-Infused Plant Food**, sets `gardenFoodActive`.
- `P24 Dormant Astral Treant`: activates only when all three Garden flags are true. The completed encounter/negotiation awards **Astral Fruit**.
- `P25 Faerie-Dragon Water Source`: after the dragon interaction is resolved, awards **Fey-Infused Water**. Keep dragon dialogue and the exact favor as a configurable macro prompt.

### Arcane Vault

- `P26 Sovereign Seal Interface`: accepts **Sovereign Seal**, sets `vaultSealPresented`.
- `P27 Arcane Password Interface`: checks `nixieAllied` / **Arcane Vault Password** state. When both P26 and P27 are complete, sets `vaultOpened` and enables T15.
- `P28 Ivory Thorn Reliquary`: requires `vaultOpened`; awards **Ivory Thorn** once.

## Item and state dependencies

| Result | Required item/state | Interaction Region |
|---|---|---|
| Study unlocked | Removable Star Emblem | P02 |
| Hidden Library route | Spine Mosaic solved | P10 / T11 |
| Powdered Silver | Statue answer + Hourglass display | P13 then P04 |
| Astral Water + Demon Skull | Ingredient Cabinet Key | P14 |
| Fey-Infused Plant Food | Fern + salts + blood meal + bone meal | P16 |
| Astral Fruit | three Garden activations + Treant resolution | P21-P24 |
| Fey-Infused Water | faerie-dragon resolution | P25 |
| Vault password | Fey-Infused Water + Astral Fruit via Nixie | P03 |
| Sovereign Seal | Obsidian Crow's-Foot Key | P07 |
| Ivory Thorn | Seal + password | P26-P28 |
| Obsidian Thorn | Skull + candles + silver | P20 |
| Thorn Key | Ivory Thorn + Obsidian Thorn | P18 |

## Macro series after scene installation

1. `03_IGGWILV_VISUAL_DOOR_AUDIT` - screenshots / coordinate report only. It establishes exact source and arrival rectangles from the repaired maps.
2. `04_IGGWILV_INSTALL_TRAVERSAL_REGIONS` - installs T01-T20 from the reviewed coordinate table; rerunnable and prefix-safe.
3. `05_IGGWILV_CREATE_CAMPAIGN_ITEMS_AND_STATE` - creates items, state helpers, and GM-visible cards.
4. `06_IGGWILV_INSTALL_PUZZLE_REGIONS` - installs P01-P28 and their item/state checks; no travel Regions are touched.
5. `07_IGGWILV_TEST_AND_AUDIT` - reports scene backgrounds, grid, Region count, gated routes, item chain, and malformed links.

## Coordinate audit checklist

For every source/arrival pair, record this before writing macro 04:

- Scene name and image dimensions.
- Door or stair location in pixel coordinates and its facing direction.
- Source rectangle: 64x64 pixels, fully on the room side of the threshold.
- Arrival rectangle: 128x128 pixels, fully inside the destination room and clear of furniture.
- Whether the door is always open, puzzle-gated, secret, or one-way.
- A screenshot with Region overlays visible.

## Regionwright ingredient-puzzle contract

The later `06_IGGWILV_INSTALL_PUZZLE_REGIONS` macro must configure P16 with this exact flow:

1. Bind an `executeScript` Region Behavior to the cauldron's small interaction Region.
2. Resolve the entering token and its actor; never inspect a different player's inventory.
3. Look for the four exact quest Item names: `Red Leaf Fern`, `Epsom Salts`, `Blood Meal`, and `Calcium-Rich Bone Meal`.
4. If one or more are absent, display only the missing-name list and stop.
5. If all are present, call Regionwright's `premium.ingredientMixing` puzzle bound to this Region, with targets of `1` for all four ingredients and tolerance `0`.
6. On a successful Regionwright result, delete/mark spent one instance of each carried item, create **Fey-Infused Plant Food** on the same actor, and set `plantFoodCreated`.
7. If the puzzle is cancelled or failed, preserve all four carried items and allow another attempt.

## Regionwright hidden-bookcase arrangement contract

The later `06_IGGWILV_INSTALL_PUZZLE_REGIONS` macro must configure P10 as the other quest puzzle:

1. Bind a Regionwright `premium.spineMosaic` puzzle to the bookcase interaction Region in the Private Library.
2. Use four to nine distinctive titles/spine motifs that visually correspond to the final map art. Their declared sequence is the solution; Regionwright shuffles them for play.
3. Until the Spine Mosaic succeeds, T11 reports that the bookcase is sealed and does not teleport the token.
4. On success, set `hiddenLibraryRevealed`, mark the Spine Mosaic as solved, and update the bookcase interaction text to reveal the passage.
5. The party must then move onto T11, a separate 1x1 Region immediately in front of the opened bookcase, to travel to the Hidden Library's 2x2 safe arrival Region.
6. `P11 Black Tallow Candle Rack` becomes available only after `hiddenLibraryRevealed`; it awards **Black Tallow Candles** without exposing them before the puzzle resolves.
