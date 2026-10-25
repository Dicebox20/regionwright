# Regionwright Pixel-Board Art System Roadmap

**Status:** The Hunting point-board is integrated, built, and installed in the disposable Foundry v14.367 / D&D5e 5.3.3 / H&G 0.4.2 clone on port 30002. At DPR 1, GM test mode rendered and moved the deer/forest at 25/45/65 yd, showed anatomy zones, survived close/reopen, and returned held-click diagnostics. A connected disposable player with Fisherman assigned received a GM-requested 25 yd calibration dialog, saw the point-board, and completed a held-click test shot. No post-fix point-board console error appeared; an unrelated missing Florissax token image error remains. DPR 2, responsive resize, player close/reopen, and human visual acceptance remain unverified. The separate live Foundry listener on port 30000 remains down. The latest projectile-loop cleanup source is built but not installed. Rotation Lock is source-staged (240 × 160; four layers, 1,167 cells, 13,314 bytes), not installed or Foundry-tested. The intended scope remains artwork across Studio, Puzzles & Locks, and Hunting & Gathering, including every puzzle game; shared controls, labels, navigation, and forms remain native UI. See the deep research brief (PIXEL_BOARD_RESEARCH.md).

Last real Hunting interaction: 2026-10-18 local, in the disposable GM and connected-player clients at DPR 1. The disposable player account exists only in the port-30002 clone and has Observer access to Fisherman. A GM-requested 25 yd calibration opened for the player, rendered the point-board, and resolved a held-click test shot with no reward. The installed hunting.js matches the workspace build at SHA-256 88EC4402F0F898215DEA9F16B8A7444C0732C2AB3AE3B2820DDB1707B1755535; a newer projectile-loop cleanup is built but not installed. Port 30000 remains down; the disposable app and Chrome Dev tabs are open. Next: check DPR 2, responsive resize, and player close/reopen, then review readability with the user.

### Rotation Lock point-board pilot acceptance

- [x] Store the artwork in the shared v1 editor JSON format: 240 × 160, four layers, 1,167 active cells, 13,314 bytes; the module build validator accepts it.
- [x] Source-staged module-local loader and Canvas renderer rasterize four layers once, independently rotate the cylinder/wrench/pick, cap DPR at 2, and release the visible and cached canvases on close.
- [x] Mechanics remain in the existing lock engine; mouse placement, A-key torque, keyboard focus, and native status text remain separate from the canvas artwork.
- [x] Focused renderer/engine tests pass 10/10; module build and local-import checker pass. HeadlessChrome preview was inspected at 496 × 331 CSS pixels / DPR 2; 600 synchronous layer-transform renders averaged 0.0145 ms with 0.1 ms p95. These are not Foundry measurements.
- [ ] Open the JSON in the manual editor and review/edit the four layers; the data format is compatible, but the editor workflow has not yet been exercised.
- [ ] Decide whether animated layer-transform semantics should remain module-owned or be represented in a future shared schema version.
- [ ] Install in a disposable Foundry world and verify rendering, lock movement, pointer and keyboard controls, DPR/resize, close/reopen cleanup, GM unlock, and player flow. Do not mark this pilot accepted from the preview or unit suite.

## Direction and vocabulary

Use sparse, human-authored marks on a logical grid to create the point-cloud / dot-matrix look. The authored board is the art source: each cell is empty or references a point style. A style defines its color and brightness, with optional mark shape and size. JavaScript lights the selected cells in Foundry Canvas; the board is a code-rendered light-bright. Most cells stay empty so forms emerge from points and negative space.

- **Pixel board / point board** means the editable grid of authored cells.
- **Point-cloud look** means the visible style made by those marks. Here it is a two-dimensional image, not a 3D scan or particle simulation.
- **Frame** means one complete authored board state. Animation cycles through a short sequence of states.
- **Layer** means a separately positioned board, such as a fixed forest behind a moving deer.

The v1 JSON schema stores cells, palette, and frame selection; it does not prescribe gameplay transforms. Modules may render layers independently and map existing game state to their transforms. Rotation Lock keeps that mapping in module code while reusing the shared board data/editor format. Do not add transform metadata to v1; any cross-module transform contract requires a versioned schema change and tests.

The deer’s points stay fixed in its local board coordinates. The game moves the deer as an object, selects a walking frame while it walks, holds an idle frame when it pauses, and mirrors the art when it turns. The same model can represent a still puzzle illustration, a rotating lock component, or other small animated game element.

Apply this style to all artwork across the current modules: game illustrations and scenes, puzzle mechanisms, decorative imagery, and art-specific feedback. Puzzles & Locks is a full migration target, including every puzzle game; Tumbler and Rotation are only the first lock-puzzle pilot cases. Keep shared Foundry controls, labels, navigation, and standard forms native and readable. A complete inventory will identify each current art surface before the broader rollout.

## What we can borrow from handheld graphics

The goal is to reuse useful display and authoring ideas, not emulate console CPUs, memory maps, registers, or hardware limitations.

| Reference | Verified model | Useful ideas for Regionwright | What we do not need to reproduce |
| --- | --- | --- | --- |
| **Game Boy Color** | 160 × 144 display. Its graphics use 8 × 8 background tiles and 8 × 8 or 8 × 16 object pieces. Color mode has four colors per palette, with eight selectable palettes for background/object characters. | A clear logical grid, reusable motifs, a small deliberate palette, and explicit separation between fixed scenery and movable objects. | The 160 × 144 screen limit, hardware tile limits, palette registers, or cartridge memory layout. |
| **Game Boy Advance** | 240 × 160 display. The programming manual describes both 8 × 8 character/tile modes and bitmap modes, with layered backgrounds, object sprites, palette formats, scaling, and rotation. | Layered scenes, independently moving sprites, flipping, simple scaling, and the option to use a whole pre-authored frame where tile reuse is not helpful. | GBA graphics modes, registers, memory timing, or a hardware emulator. |
| **LED / dot-matrix displays** | An image is a set of addressable cells, each off or assigned a light/color value. | This is the closest authoring metaphor: switch cells on, choose a restrained color/intensity, and compose a sequence of boards. | A simulated physical display or per-cell runtime objects. |
| **Segmented LCD displays** | A display is assembled from fixed shapes that can be activated independently. | Useful for small puzzle-state indicators, lock readouts, or icons built from a few authored marks. | Fixed segment geometry as the main art style for full scenes. |
| **Browser Canvas 2D** | Foundry modules are web packages using JavaScript, HTML, CSS, and JSON. Canvas can draw points and cached images; MDN recommends pre-rendering repeated drawing to an offscreen canvas when it helps performance. | A small, dependency-free renderer for dialog and game-window art. Render point data into cached canvases, then draw the cached frame as one image. | A custom WebGL renderer for the initial use case. |

Foundry also bundles PixiJS for its main scene canvas. Use that only if a later feature needs to draw directly into the Foundry scene. The current Hunting and puzzle play areas are application UI, so Canvas 2D is the simpler first fit.

## Proposed architecture

### 1. Human-authored source and first authoring workflow

For the first authoring spike, treat a human-composed grid or coordinate list as the canonical artwork. Store named layers and animation frames as data, then use JavaScript to draw active cells to Canvas 2D. A lightweight in-project preview/editor may help place points and compare frames. Pixelorama remains an optional manual art editor and PNG export path if it proves easier for creating or revising frames; it is not required and does not determine whether this is generative AI art.

If the first pilot proves that standard sprite editors cannot express the workflow, build a small development-only browser editor with only these features:

- Choose an asset’s logical width and height; show a zoomable cell grid.
- Draw, erase, and recolor cells; choose a restrained palette and point style for the selected marks.
- Separate static scenery, subject, and effect layers.
- Add, duplicate, reorder, and preview frames.
- Show the previous or next frame faintly while drawing, so anatomical landmarks stay aligned.
- Preview timing, facing flips, and pause/idle behavior.
- Undo edits and export a versioned, human-readable active-cell file plus a PNG preview for visual review.
- Validate coordinates, palette indexes, frame timing, anchors, and file size before export.

If we build an authoring tool, keep it small until it has produced the Hunting asset. Its source of truth should remain the manually authored point-board data; a PNG can be an optional preview or optimized runtime export.

### 2. Asset source and runtime export

Represent an authored board with logical dimensions, a restrained palette, named layers, and per-frame active-cell values (coordinate triples or a compact row/mask representation). The versioned [coded-board v1 format](POINT_BOARD_DATA_SCHEMA_V1.json), runtime validator, and layer renderer are now used by the Hunting pilot; the older [PNG/JSON format](POINT_BOARD_ASSET_FORMAT.md) remains an optional alternative for sprite sheets. Pre-render authored frames to cached canvases and draw those cached frames as single images. Keep game movement and hit zones separate from the art data; the deer art fills the existing target box, and the 180 × 150 shot-zone coordinates remain owned by gameplay code.

Keep human-authored board JSON and provenance notes in repository-level `art-source/<Foundry module ID>/` folders, outside `modules/` so ordinary module builds exclude working drafts. Put accepted runtime board JSON under the owning module’s `assets/` tree. Each module’s installed package must contain its board data and local renderer so it works alone. Do not import runtime code from a sibling module.

Compare readable coordinate data, row bitmasks, and PNG sheets for authoring ease, package size, and draw cost. The user’s desired coded-board model makes active-cell data a first-class option even when gameplay does not mutate points. Measure actual package size and one-time rasterization from the Hunting pilot before adding a custom packed format.

### 3. Module-local Canvas 2D renderer

Each module’s renderer loads its coded board data once and rasterizes each layer’s complete frame set to an in-memory canvas once. During play it draws a fixed scene layer and the selected subject frame. Static scenery is drawn once when beneficial. Motion changes object position and frame index; it does not create a DOM node per point or rebuild point coordinates each animation tick. The PNG sheet loader remains as an optional alternative.

Use the logical art dimensions independently from the displayed CSS size. Keep the existing target sizing behavior and test crispness at actual window sizes, device-pixel ratios, and browser zoom before setting any renderer-wide scale policy. Start with integer 2× scaling at the 35-yard reference size.

## Initial style and performance values

These values provide a bounded first experiment; none is a measured performance limit or final art rule.

| Area | Hunting starting value | Reason |
| --- | --- | --- |
| Logical board | 240 × 160 cells | User-selected Game Boy Advance display resolution; this is the shared Hunting scene board. |
| Deer source area | Centered 192 × 160 crop (x=24–215) | Contains the authored deer bounds (about 149 × 151 cells) and matches the existing 180 × 150 target ratio; render the forest from the uncropped board. |
| Reference display size | 230 × 192 CSS px at 35 yards | Preserves the current target box size and maps the crop uniformly; visually verify it in Foundry. |
| Deer animation | Six walking frames and one idle frame; start around 8 frames per second while walking | Enough poses to test a readable gait without a large asset set. Freeze on idle when motion pauses. |
| Point density | Deer: 1,493–1,527 cells per frame; bear: 12,668–13,341; 255 static forest cells per board | Bear uses about 8.7× the active points per pose and a roughly 998 KB JSON export. Both fit the v1 data limits and cache the same 240 × 160 frames; assess the denser bear at Foundry sizes before adding more high-density assets. |
| Static scenery | Start around 200–400 forest points in one fixed layer | Keeps scene detail secondary to the moving target. |
| Visible point budget | No hard runtime limit yet | Keep source boards sparse and pre-render each authored frame once; measure the code-data size, rasterization cost, and Foundry runtime. Avoid a DOM element or animation object per cell. |
| Palette | Start with a small per-asset palette; test a few warm brightness levels for the deer | Borrow GBC palette discipline without imposing one global palette on every module. |
| Background | Blank or dark negative space behind a restrained point forest | Follows the user’s reference and keeps the target legible. |

At 240 × 160, seven deer frames plus one static forest frame use 307,200 logical RGBA pixels, about 1.17 MiB raw before browser-side copies. One deer-sized 460 × 384 RGBA display canvas backing (230 × 192 CSS pixels at DPR 2) is about 0.67 MiB. These are capacity estimates, not runtime measurements; the pilot should record actual coded-data bytes, canvas allocation, rasterization time, and Foundry performance on a representative client. Sparse active-cell JSON should be much smaller than the raw raster cache.

## Rollout

1. **Research, code-native renderer, and editor — source-tested.** The deep research brief records platform/tool/game references and implementation questions. Versioned active-cell data, Canvas rasterization, build validation, and a blank development editor are source-tested.
2. **Hunting animal boards — staged and build-validated.** The user's 240 × 160 deer export has seven deer frames and a static sparse forest (10,784 active cells, 120,683 JSON bytes). The bear export has seven bear frames and the forest (91,604 active cells, 997,913 JSON bytes; about 223 KB in a local gzip -9 probe). The source files and code-rendered contact sheets are under `art-source/regionwright-hunting-gathering/point-board/`; the 115 × 96 deer-only alternate remains a comparison. Point density, forest readability, and apparent animal sizes have not been accepted in Foundry.
3. **Hunting art pilot — integrated, built, locally installed, and runtime-verified at DPR 1.** The user-provided deer board is cropped to the existing target box and rendered with a separate static forest. GM test mode and one connected player diagnostic shot now render in Foundry v14.367; see the execution protocol below for measured ranges, roles, and remaining gaps. Source cleanup for projectile-loop disposal is built but not yet installed.
4. **Foundry display/lifecycle checks — next.** Verify the actual Hunting dialog at DPR 2 and after resizing, then check player close/reopen behavior and shot accuracy. Preserve the distinction between diagnostic shots and normal rewards; visual acceptance remains with the user.
    **Current gate:** the GM and connected-player diagnostic paths work at DPR 1. DPR 2, responsive resizing, player close/reopen, normal reward behavior, and human visual acceptance remain unverified. The disposable world and Chrome Dev tabs are open on port 30002; the separate live server on port 30000 remains down.
5. **Lock-puzzle pilot.** Refine Tumbler Lock (the current lockpicking game) and Rotation Lock in Puzzles & Locks as the first puzzle conversion. They are pilot cases only; the intended result is point-board artwork throughout every Puzzles & Locks game. Preserve each game’s input behavior, completion state, Door interaction, IDs, and data contracts.
6. **Complete the current-module art migration.** Inventory all artwork in Studio, Puzzles & Locks, and Hunting & Gathering. Convert every in-scope art surface, including every remaining Puzzles & Locks game and the bespoke scenes, activities, backgrounds, and feedback in the other modules. Track each surface to a reviewed board source so the migration can be checked for omissions.
7. **Future modules.** Use the coded point-board data convention and module-local Canvas renderer. Keep any editor development-only unless a module needs an in-game authoring feature. Keep each new module independently installable; adopt additional visual treatments only when they fit its gameplay.

## Acceptance and evidence

| Acceptance area | Required evidence |
| --- | --- |
| Human authorship | Editable source and revision history show a human-created composition. Keep source files and export provenance with the project. Do not use AI-generated images or AI-generated point layouts. |
| Scope coverage | Maintain an inventory of artwork in all three current modules. Confirm that every Puzzles & Locks game and every other in-scope art surface has a corresponding point-board source and review result before calling the migration complete. |
| Visual clarity | A human reviewer can identify the subject, distinguish foreground from background, and read important feedback at actual Foundry window sizes and supported scaling. |
| Motion and gameplay | Deer movement/facing remain synchronized with shot resolution; walking frames cycle while moving and idle holds while paused. Puzzle input and win/fail behavior match the existing mechanics. |
| Data and performance | Record source and packaged asset sizes. Verify the art uses cached frames and static layers, no per-point DOM, and acceptable interaction smoothness in Foundry on a representative client. Replace provisional point counts only with observed evidence. |
| Accessibility | Contrast does not depend on hue alone. Keep labels, focus behavior, keyboard interaction, and non-visual feedback usable. Respect reduced-motion preferences where motion is decorative; preserve required gameplay motion cues. |
| Release state | Record source-staged, built, installed, real-use tested, and user-accepted status separately. A rendered preview or GM startup does not prove player-facing acceptance. |

The point-grid style is code-rendered: JavaScript draws the explicit cell data supplied by a board, and movement selects a different authored frame. That deterministic Canvas rendering does not invoke generative AI. Keep the editable board data as the visual source and do not source its point arrangement from an AI image or layout generator. Recheck Foundry’s current policy before any official package submission because it can change. Do not treat pixel-grid authorship alone as grounds for the separate “Zero AI” designation; eligibility requires review of the full package content and creation history.

### Hunting pilot Foundry execution protocol

**Status (2026-10-18):** GM and player diagnostic workflows have been exercised in the disposable Foundry v14.367 / D&D5e 5.3.3 clone on port 30002 using Chrome for Testing Dev (H&G 0.4.2). The installed hunting.js matches the workspace build (SHA-256 88EC4402F0F898215DEA9F16B8A7444C0732C2AB3AE3B2820DDB1707B1755535). GM test mode rendered the forest/deer, anatomy overlay, movement/turning, close/reopen, and held-click shot diagnostics at 25/45/65 yd. A connected disposable player with Fisherman assigned received a GM-requested 25 yd movement-calibration dialog, rendered the art, and completed a held-click shot returning test-mode miss diagnostics without rewards. At DPR 1, player viewport was 1920 × 919 CSS pixels; forest and deer canvases were 866 × 577 and 322 × 268 CSS/backing pixels. DPR 2, resizing, player close/reopen, normal reward behavior, and human visual acceptance remain unverified.

The initial blank dialog was caused by Foundry DialogV2 sanitizing `canvas` and `svg` elements out of string content. `ensureHuntingShotDrawingElements` now creates the drawing nodes after render. No new point-board error appeared after the fix; the browser's captured console retains one earlier pre-fix error.

1. **GM render and motion:** log in as GM, choose a disposable test Actor, and open the movement calibration with the H&G API. In the browser console, replace `ACTOR_ID` with that Actor's document ID:

   ```js
   const hunting = game.modules.get("regionwright-hunting-gathering").api.hunting;
   await hunting.testMode({ actor: game.actors.get("ACTOR_ID"), mode: "movement", distanceYards: 25, seed: "point-board-gm-smoke" });
   ```

   GM test mode has verified the rendered forest/deer, movement and turns, anatomy overlay, and a held-click shot at 25, 45, and 65 yards at DPR 1. Repeat at DPR 2, verify exact walk/idle cadence and resize behavior, and record any console exception and the status text verbatim.

2. **Player workflow — smoke verified:** a connected disposable player with Fisherman assigned received the GM-requested 25 yd test dialog, saw the point-board, and completed a held-click diagnostic shot. The GM-side request returned success, and no post-fix point-board console error appeared. This verifies the diagnostic player route only; normal hunt rewards, DPR 2, resizing, and the full player-initiated UI remain unverified.

   ```js
   await hunting.requestTestMode("PLAYER_ID", { mode: "movement", distanceYards: 25, seed: "point-board-player-smoke" });
   ```

   The procedure can be rerun with another disposable player. The previous run used seed point-board-player-smoke; the GM macro returned success and the shot resolved on the player client.

3. **Lifecycle and evidence:** one GM close/reopen succeeded and the point-board rendered again. Still verify that the old animation and resize observer stop, the new dialog renders once, and no point-board error returns across resize/DPR changes. Record each check by role, distance, viewport, DPR, canvas backing size, console result, and screenshot. Keep human visual acceptance separate from technical load/draw success.

**API basis:** api.hunting.testMode and api.hunting.requestTestMode are exposed by the current H&G module. Movement-calibration ranges are 25, 45, and 65 yd; holdover-calibration ranges are 20, 35, 50, and 65 yd. The player request requires an active GM, a connected active player, and an assigned character. The 25 yd movement-calibration player diagnostic has been executed; repeat it to reproduce, and keep normal reward behavior as a separate check.

## Research references

- [Nintendo Game Boy and Game Boy Color technical data](https://www.nintendo.com/en-gb/Support/Legacy-system/Technical-data-619585.html)
- [Nintendo Game Boy Programming Manual, archival scan](https://www.manualslib.com/manual/1627081/Nintendo-Game-Boy.html)
- [Nintendo Game Boy Advance technical data](https://www.nintendo.com/en-gb/Support/Legacy-system/Technical-data-619479.html)
- [Nintendo Game Boy Advance Programming Manual, archival scan](https://www.manualslib.com/manual/3342081/Nintendo-Game-Boy-Advance.html)
- [Foundry module development](https://foundryvtt.com/article/module-development/) and [Foundry packaged frameworks, including PixiJS](https://foundryvtt.com/article/frameworks/)
- [MDN Canvas optimization guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Foundry AI Content Policy](https://foundryvtt.com/article/ai-policy/)
- [Pixel-board / 2D point-cloud deep research brief](PIXEL_BOARD_RESEARCH.md)



