# Regionwright Puzzle Implementation Handoff — Cabin in the Ashen Veil

**Date:** 2026-10-24  
**Scope:** Five owner-approved *static artwork references* in this package. Integration planning only; no permission implied to mutate the live Foundry world.  
**Owner's newest rule:** Each work turn is limited to **15 minutes**; preserve a short checkpoint. More recent owner-approved decisions supersede older contradictory designs.  
**Source of truth:** Reconcile the original Cabin recovery handoff and 2026-10-20 Puzzle Chain Audit with later owner approvals, repository workflow/AGENTS.md, Regionwright primary knowledge DB, current module code, and exact live Foundry evidence. The original 29-map plan is superseded.

## Pack contents and approval status

| File | Puzzle | Owner-approved art | Technical completion |
|---|---|---|---|
| `01-book-spine-mosaic.png` | Sophia's bookshelf | Yes | Static illustration only; no inventory/slots verified |
| `02-greenhouse-mixing.png` | Greenhouse mixing apparatus | Yes | Static illustration only; interactive reservoirs not separated |
| `03-waterworks-pressure.png` | Aqueduct Waterworks pressure panel | Yes (owner's attachment) | Static illustration only; pressure logic needs designing |
| `04-sune-sliding-portrait.png` | Sune statue's base relief | Yes | Artwork includes tile frame; engine needs a clean **complete** portrait source for programmable slicing |
| `05-roof-chimney-clock.png` | Roof clock | Yes | Static illustration only; add distinct hand sprites and controls |

No composite puzzle-reference sheet, nonapproved Rufus illustration, or Four Busts standalone graphic should enter implementation. Do not infer that an approved image is a final production sprite atlas, a solved state, or a runtime PASS.

## Existing Regionwright code: verified starting point

Repo: `C:\Users\rujie\Documents\Region Editor\modules\regionwright-puzzles-locks`  
Installed: `C:\Users\rujie\AppData\Local\FoundryVTT\Data\modules\regionwright-puzzles-locks`  
Observed module version: **0.1.2**; repo's Spine Mosaic, Ingredient Mixing, and Sliding Mosaic engine files matched installed copies by SHA-256 calculation on 2026-10-24. Core module public API is under `scripts/api.js` (`game.modules.get('regionwright-puzzles-locks')?.api` after exact live confirmation).

Reusable features: `spineMosaic`, `ingredientMixing`, `slidingMosaic`, `rotatingLock`, `timingDial`, `laserGrid`, `lockpicking`; setup/preview/open/clear methods exist for relevant engines. Puzzle-specific configuration of Doors/Tiles/Regions requires the module's Puzzle-write setting; Region writes additionally require Regionwright: Studio's opt-in setting. **Do not enable write settings or install puzzle scripts without exact active GM, world, document-scope, backup/preview, and approval gates.**

Tests: `tests/spine-mosaic.test.mjs` and `tests/ingredient-mixing.test.mjs` — **7/7 passed on 2026-10-24** using `node --test`. They test engine logic; they do **not** prove a playable Cabin installation. The generic ingredient engine currently handles **2–4** ingredients with targets **0–10** and optional tolerance **0–2**. Its example Moonwater/Ember Salt/Nightshade is not campaign canon.

## Individual artwork-to-gameplay tasks

### 1. Book Spine Mosaic — Sophia's bedroom (H-U05)
**Canonical purpose:** Six collectible *Miss Lulubug's Wondrous Tales* volumes are inserted into a bookshelf; arranging them by publication chronology reveals the hidden room and **Gond's semicircular emblem half**.

**Six named books:**
1. *The Knight Who Befriended a Dragon*
2. *Moonlight and the Missing Stars*
3. *Felix Fox and the Forgotten Kingdom*
4. *Whispers of the Little Witch*
5. *The Clockmaker's Starless Sky*
6. *Princess Penelope and the Sea of Stars*

**Placements:** Two initially on Sophia's shelf; one in the pond's hollow log; one in the attic; one in the chimney flue; the sixth appears **on Sophia's bed at Crimson Veil onset** (not at the Gazebo). Exact title-to-location mapping and chronological solution have **not** been verified; do not infer them from the order listed or from the art.

**Artwork work:** Inspect lettering quality; crop/isolate six spines with consistent anchor coordinates, frame, hover/selected states; account for long names and UI readability. Preserve unmodified master PNG. No bake-in of correct order unless later approved.

**Logic gap:** Existing `spine-mosaic-engine.js` validates and shuffles a configured array of books and checks the complete order; `spine-mosaic.js` supports UI swapping/dragging. Implement persistent book acquisition/insertion, prevent unknown/uncollected volumes from appearing as already acquired, secure the GM authority for reward/state transitions, and build idempotent reread. Define reset/re-entry/player convergence behavior. Publication clues and order require owner approval.

### 2. Greenhouse Ingredient Mixing
**Canonical purpose:** Players restore water supply through Aqueduct Waterworks, obtain **lye** from the Bathhouse soap-room case (after receiving the Copper Tiny Key during the Crimson Veil), and combine the recipe to produce the fictional **plant killer** needed to clear vegetation at the far dock/Boathouse access.

**Artwork work:** Separate reservoirs, controls, gauges, water inlet, mixing vessel, result container and indicator lights into layered graphics or coordinate-defined overlays. Keep labels, values and required ingredient icons replaceable. Avoid hard-coded fictional ingredients from draft images.

**Logic gap:** Reuse Regionwright Ingredient Mixing's 2–4-ingredient quantity validation. **Explicit prerequisites must be implemented outside or as a safe adapter around the generic engine:** running Greenhouse water, possess/consume lye per approved rule, approved recipe/quantities, inventory validation, unique completion reward. These recipe details remain undecided. Verify failures cannot consume resources or grant duplicate rewards. No real-world chemical handling instructions are needed.

### 3. Waterworks Pressure Balancing — Aqueduct Utility Room
**Canonical purpose:** With the sluice closed, redistribute water pressure; ordinary dirt, stones, and debris obstruct the Greenhouse sprinkler branch. Clearing debris and successfully balancing pressure restores Greenhouse water and permits access to the inner compartment containing the father's journal and **Rufus's Collar**.

**Artwork work:** Extract individual valve wheels/needles/gauges, reservoir water animation layers, branching path indicators, obstruction state, and output channel highlight masks. Register named interaction hotspots and clear inactive/active/solved visual states. This panel is **not** proof of the underlying pipe geometry.

**Logic gap:** No dedicated pressure-balancing Regionwright puzzle engine was found in the current Puzzles & Locks public API. Design a deterministic valve/flow model with explicit inputs, bounded states, hints and solution, failure/reset policies, co-op concurrency and idempotent rewards. Make obstruction clearing a separate interaction with accepted tools or approved physical skill approaches. Do not invent numerical valve solutions or make lye necessary to restore the water.

### 4. Sune Sliding Portrait Relief — Sune's Grove central statue base
**Canonical purpose:** Clockwork Winder operates four Sune busts in **SW → NE → NW → SE** order and reveals the separate sliding-picture relief. Completing the relief opens the stash: **1,000 gp**, with the **Brass Study Key** accidentally concealed beneath the coin bag. Statue's outstretched hands are reserved for the later **Scrying Bowl**, not this reward.

**Artwork work:** The approved reference already depicts a 3×3 frame with one empty cell. Regionwright's sliding engine expects an input **complete image** and generates the missing tile/move states at runtime. Produce a seamless complete-portrait master and a separate frame overlay, based on the approved appearance, before installation; avoid uploading only the pre-sliced layout as the engine's source. Confirm Sune iconography and avoid solution spoilers in art.

**Logic gap:** Reuse `slidingMosaic` engine and its 3×3 option, not a duplicate sliding-game engine. Four busts are **Regions on the four corner maps**, not custom illustrated bust interfaces; verify each Scene/Region target and cross-scene progression. Bust sequence and picture puzzle are distinct phases. Final reward must be verified as idempotent.

### 5. Roof Chimney Clock — H-R01
**Canonical purpose:** Brass Tiny Key #1 unlocks grandfather-clock glass for its **Hour Hand**; separate **Minute Hand** comes from attic. Insert both into rooftop chimney clock, set **12:00**, press center button, obtain **Replacement Gear** used with **Aqueduct Gate Handle** to open the Aqueduct gate.

**Artwork work:** Separate clock dial, hour/minute hands, center spindle, pressable center button, closed/open gear compartment, and hover/active feedback. Keep readable Roman numerals but do not depict the correct noon arrangement as the initial state.

**Logic gap:** Evaluate reusing `rotatingLock` or `timingDial` only if their semantics fit the two inserted-hand state. Otherwise implement a narrowly scoped existing-API extension or campaign adapter, not an entirely new module. Validate item insertion/withdrawal, hand placement, button gate, and one-time Replacement Gear award. Preserve separate item provenance of each hand.

## Additional campaign interaction — NOT in this artwork pack

**Four Busts of Sune:** OWNER RULE: implement solely via Regions on the four corner Sune's Grove scenes. No four-bust art asset. Sequence SW → NE → NW → SE. Needs exact Region identifiers and Clockwork Winder item gate.

**Rufus's Eyes, fishing, lockboxes, pond sluice, vault, and bowl:** campaign interactions may require assets later, but they are not in this five-image approved Regionwright art pack. Rufus art was generated but **not explicitly approved**. Do not install or mislabel it as approved.

## Inventory / document work ledger (not created by this handoff)

**Books:** six separate named collectible storybook Items, a persistence record for acquired/inserted volumes, and the Gond emblem half reward.

**Water/mixing:** Copper Tiny Key, soap-room lye, recipe ingredient Items **only after approved names and quantities**, plant-killer result, father's journal, Rufus's Collar, state for Greenhouse water, Waterworks valve/debris transitions.

**Grove:** Clockwork Winder, Brass Study Key, 1,000 gp stash, four bust Regions, sliding-relief target and solved-state receipt.

**Roof:** Brass Tiny Key #1, Hour Hand, Minute Hand, Replacement Gear, Aqueduct Gate Handle.

**Live world-level item inventory on 2026-10-24:** 36 Items, primarily Regionwright hunting/fishing/mining content. No exact-name matches for these campaign puzzle Items were reported in that top-level list; check Actor-embedded Items and compendia before creating duplicates.

## Stop / acceptance conditions

1. Before work, identify branch, working tree, exact Foundry world/user/active GM, expected objects and module versions. Preserve all unrelated state.
2. Keep each user-directed work turn **≤15 minutes**, leaving a verified checkpoint of changed files, tests, source hashes, blockers and next operation.
3. Prefer owner-approved art as visual reference; do not destroy the originals when making cropped layers. Confirm every generated asset's exact version and hash.
4. `PREPARE → RENDER → INSPECT → BUILD → VERIFY → CATALOGUE`; for code/docs use established preview→approve→apply→reread. An art approval is not a Foundry write authorization.
5. Require engine unit tests, image/interaction tests, GM and player checks, puzzle failure/reset tests, persistent-state reread, reward idempotency, and cross-scene checks before marking a puzzle playtested.
6. Block where missing canon governs solution or reward (book chronology, Greenhouse recipe, Waterworks valve design). Track them as OWNER_DECISION_REQUIRED rather than hallucinating.

## Verified historical sources

- Cabin archive `campaign-handoff.md` (2026-10-20 recovery of original chat; source transcript preserved).
- `artifacts/library-files/Cabin_in_the_Ashen_Veil_Puzzle_Chain_Audit_2026-10-20.md` (later puzzle reconciliation; takes priority where older plans conflict).
- DiceBox repository `AGENTS.md`, including database-first, provenance, newer-workflow-supersession and exact-runtime checks; owner's 2026-10-24 **15-minute** exception supersedes its old 20-minute cap.
- Regionwright `modules/regionwright-puzzles-locks/README.md`, `scripts/api.js`, `scripts/spine-mosaic-engine.js`, `scripts/ingredient-mixing-engine.js`, `scripts/sliding-mosaic-engine.js`.

**Status:** PLANNING/HANDOFF ONLY — no image sprite extraction, Foundry installation, Region setup, module build, or player playtest performed by this document.
