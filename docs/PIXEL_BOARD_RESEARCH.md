# Pixel-Board / 2D Point-Cloud Research Brief

**Prepared:** 2026-10-18  
**Status:** The reusable H&G Canvas 2D renderer and manual editor are built; the user-authored 240 × 160 deer/forest board is integrated and installed in Hunting, and bear is staged. In the disposable Foundry v14.367 / D&D5e 5.3.3 / H&G 0.4.2 clone on port 30002, GM checks passed at DPR 1 for 25/45/65 yd, including motion, anatomy, close/reopen, and held-click diagnostics. A connected disposable player with Fisherman assigned received a GM-requested 25 yd calibration dialog, saw the point-board, and resolved a held-click test shot without rewards. Player viewport was 1920 × 919 CSS pixels at DPR 1; forest/deer canvases were 866 × 577 and 322 × 268 CSS/backing pixels. No post-fix point-board error appeared; the console retains an unrelated missing Florissax token image error. DPR 2, resizing, player close/reopen, human visual acceptance, and normal reward behavior remain open. Port 30000 remains down. Hunting projectile-loop cleanup is built but not installed; Rotation Lock is source-staged but not installed or Foundry-tested. Browser-only performance measurements remain documented below. Next: verify DPR 2 and resizing, then review readability with the user.

**Accepted project scope:** the user intends the pixel-board system to replace all artwork across Studio, Puzzles & Locks, and Hunting & Gathering, including all Puzzles & Locks games. The deer/forest pilot is integrated and locally installed in Hunting; bear is staged. Rotation Lock now has a source-staged 240 × 160 board in the shared v1 JSON format, with static plate/housing and separately transformed cylinder, wrench, and pick layers. It passes the data validator but is not installed, user-accepted, or Foundry-tested. Its dynamic transform mapping remains module-local. No point-board art is integrated into Studio or other puzzle types. Shared functional controls, labels, navigation, and forms remain native UI.

## Project continuity

- Latest Hunting interaction: GM and connected disposable player have both seen the point-board in the v14.367 Testmap at DPR 1. The player received a 25 yd calibration request and resolved one test-mode shot; the player account and Observer/Fisherman assignment exist only in the disposable clone on port 30002. Installed hunting.js matches the source fix, while newer projectile-loop cleanup remains built but not installed. The desktop launcher is C:/Users/rujie/Desktop/Regionwright Disposable Testmap + Chrome Dev.lnk; live port 30000 remains down.
- A fresh disposable `Point Board Runtime Probe` world launched successfully at `127.0.0.1:30001` and reached the join form, but no account was provisioned. Foundry rejected the blank administrator credentials on “Return to Setup.” The disposable process was stopped through PowerShell; live Foundry port 30000 remained listening. The Chrome Dev utility-bridge doctor returned MCP SSE 429. A disposable-only auth reset was blocked by local runtime policy; the clone now has an unknown generated Setup credential. Next: restore a working browser bridge or prepare a fresh disposable with known Setup credentials, provision a GM through Foundry, then run the Hunting test mode and capture its diagnostic.
- Historical first-launch state for the clean Testmap clone: it initially reached the join form with no authenticated GM. The current state and subsequent GM/player checks are summarized in the first continuity bullet above.
- A one-off browser-only performance probe measured the actual deer and bear boards with the module renderer in HeadlessChrome 151. The timings do not establish Foundry frame rate, startup cost, network transfer, or client performance; details and limits are below.
- Hunting source is wired to render the user-authored deer on a 240 × 160 board, cropped into the existing 180 × 150 hitbox space. A separate static forest canvas stays behind the moving target. Hunting movement, facing, hit zones, and shot calculations remain owned by existing game code. The actual Foundry render and a player-side diagnostic shot are verified at DPR 1 in the disposable clone; normal rewards, DPR 2, resizing, and visual acceptance remain open.
- The renderer fetches and validates versioned coded-board data, rasterizes each authored frame to a cached canvas, selects idle/walk frames, and retains an optional horizontal PNG-sheet path. `PointBoardDataLayerRenderer` now accepts a bounds-checked crop. The user's [240 × 160 deer](../modules/regionwright-hunting-gathering/assets/hunting/deer-walk-point-board.json) is integrated and installed; the [bear](../modules/regionwright-hunting-gathering/assets/hunting/bear-walk-point-board.json) remains staged for visual and performance review.
- Rotation Lock now has a source-staged point-board pilot. The [240 × 160 board JSON](../modules/regionwright-puzzles-locks/assets/rotation-lock-point-board.json) uses the shared v1 editor format with four layers, 1,167 active cells, and a 13,314-byte file. The module-local loader validates and rasterizes it once; Canvas 2D rotates cached cylinder/wrench and pick layers from the existing mechanical state, caps display DPR at 2, and releases all backing canvases on close. Every point is explicit data with no image or model input. A headless preview is at [rotation-lock-point-board-preview.png](../outputs/rotation-lock-point-board-preview.png). This source change is built and browser-previewed, but not installed, visually accepted, or tested in Foundry. The JSON schema remains shared; only the mapping from its layer IDs to mechanical transforms is specialized. Decide whether a future schema version should describe those transforms or if module code should continue to own them.
- The deer has 1,493–1,527 active cells per frame and the bear 12,668–13,341; each board also has a 255-cell static forest layer, one idle frame, and six walk frames. Source JSON, code-rendered previews, and the 115 × 96 deer comparison are under `art-source/regionwright-hunting-gathering/point-board/`. The forest is a sparse pair of branch forms and a ground line; readability, apparent scale, and point contrast remain provisional until reviewed at actual Foundry display sizes. Raw and gzip results for alternative encodings are recorded in section C.
- Human visual acceptance, point contrast, browser zoom/DPR behavior, normal reward behavior, and DPR-2 rendering remain unverified. A DPR-1 diagnostic shot is verified on GM and player clients. The old deer silhouette SVG has been removed from the live shot scene; the test anatomy overlay remains a separate SVG layer.
- The current roadmap is [ART_DIRECTION_ROADMAP.md](ART_DIRECTION_ROADMAP.md). The next milestone is DPR-2/responsive rendering and player close/reopen checks; then review deer and bear readability/performance before expanding the point-board art to puzzles.

## Recommendation in one page

1. Treat the look as a **human-authored 2D sparse dot-field sprite**: selected cells are lit, most are empty, and the subject is formed by silhouette, gaps, and a small palette. “Point cloud” is a useful art-direction name here, but this is not a 3D scan, LiDAR cloud, particle simulation, or photogrammetry asset.
2. For motion, draw a small set of complete transparent sprite frames. Move the deer as one target using the existing motion logic; switch the sprite frame while it walks and hold the idle frame while paused. The forest stays a separate, fixed layer. Do not update every point independently.
3. For the Hunting pilot, use the selected **240 × 160 logical board**, matching the Game Boy Advance display resolution. The authored deer bounds are about 149 × 151 cells across all frames (x=53–201, y=4–154). Crop the moving deer layer to the centered **192 × 160** region (x=24–215) to match the existing 180 × 150 target ratio; render the forest layer separately at the full-board ratio as fixed scenery. The existing target is 230 CSS pixels wide at the 35-yard reference, so this crop yields about 230 × 192 CSS pixels and maps hit-zone coordinates uniformly. Confirm this mapping in the actual Foundry display. Use the same seven poses at every distance and scale them with the target.
4. Compose the artwork as **human-authored active-cell data**: coordinates or row masks for deer poses and forest layers. Use a small editor/preview if it helps, with Pixelorama and a transparent PNG export as optional alternatives. Retain the editable source and revisions.
5. Render in a small **module-local JavaScript Canvas 2D layer**. Read the authored board once, rasterize frames to cached canvases, and draw the current deer frame and fixed forest layer. Keep controls, labels, and hit zones in existing DOM/game logic. Foundry’s bundled PixiJS is available if a later module needs artwork in the actual Foundry scene canvas; it is not needed for current modal game windows.
6. The art source of truth should be a human-composed point board: a grid or list of active X/Y cells organized into named frames and layers. JavaScript deterministically draws those authored marks into a Foundry canvas; animation changes the selected frame. This is a computer-rendered human-authored image, like a light-bright board. Foundry’s current policy says ordinary procedural-generation algorithms are not restricted and prepared visual media must originate from human creative work. Keep the editable board and revisions to demonstrate who composed its points. Re-encoding AI-generated imagery as coordinates would not change its origin.

## What “point cloud” means for this project

There are two techniques that share the name but solve different problems:

| Technique | What its data represents | Fit for Regionwright |
| --- | --- | --- |
| **3D point cloud** | Many XYZ samples, often captured from sensors or reconstructed from photographs; points carry depth and may be culled, sorted, or shaded. | Not needed. It adds 3D projection and data-handling work without improving the 2D deer target or puzzle panels. |
| **2D sparse point-board / dot-field** | A fixed grid of cells. A cell is transparent or contains a deliberately placed colored mark. A frame is one complete board state. | Recommended. It matches the “lights turning on and off” mental model and the supplied deer reference. |
| **Pixel-art sprite sheet** | A raster grid of pixels, with multiple images/frames packed into a single image. | Best initial runtime/export representation. A human-authored single-cell mark is one pixel (or a few pixels); the sheet stores the completed frame states. |

The simplest animation is therefore not a separate simulation of thousands of lights. It is a handful of authored images with transparent backgrounds. A browser canvas blits the selected image as one sprite. Position updates can remain smooth while the deer pose changes at a lower animation rate, as in a conventional sprite game.

## What Java games and tools contribute

Research did **not** find a well-documented Java game that uses this exact sparse luminous 2D dot-field as its central art style. Java examples instead show three adjacent patterns. These are useful references, not a reason to put Java into Foundry.

| Public Java reference | What it actually demonstrates | Transferable lesson |
| --- | --- | --- |
| [Processing `point()`](https://processing.org/reference/point_) and [off-screen `PGraphics`](https://processing.org/reference/PGraphics) | Processing is Java-based; `point(x,y)` draws a pixel-sized point, and `PGraphics` draws into an off-screen buffer. The docs warn that a 1-pixel stroke can disappear on some graphics settings. | Useful to understand drawing individual marks and pre-rendering a point board. For Foundry, use a canvas or already-rasterized sprite, not Processing as a bundled runtime. |
| [libGDX shape rendering](https://libgdx.com/wiki/graphics/opengl-utils/rendering-shapes) and [simple game](https://libgdx.com/wiki/start/a-simple-game) | libGDX is a Java game framework. It has simple shape drawing and recommends batching image draw calls through `SpriteBatch`; the tutorial explains that excessive texture draw calls can hurt FPS. | The conceptual model maps well: animate entities, batch artwork, keep logical position separate from display resolution. The actual Java library cannot run inside Foundry’s browser module. |
| Google’s Java [ARCore `PointCloudRenderer`](https://chromium.googlesource.com/external/github.com/google-ar/arcore-android-sdk/%2B/v1.2.0/samples/cloud_anchor_java/app/src/main/java/com/google/ar/core/examples/java/common/rendering/PointCloudRenderer.java) | A Java/OpenGL sample buffers live XYZ plus confidence values and draws them with shaders as a spatial point cloud. It is an AR sensor visualization, not a 2D game-art pipeline. | Shows how native GPU point buffers work when a real 3D cloud is required; this project does not need that complexity. |
| [LWJGL Space Invaders example](https://github.com/LWJGL/lwjgl/blob/master/src/java/org/lwjgl/examples/spaceinvaders/Game.java) | A Java game loop updates entities and draws positioned sprites; it is not point-cloud art. | Illustrates that movement/game state and drawing are separate responsibilities, which is how the deer artwork should integrate. |

### What the point-rendering examples do and do not show

The official Processing [Pointillism example](https://processing.org/examples/pointillism) repeatedly samples random coordinates from a loaded image and paints translucent circles using the sampled colors. Its [pixel tutorial](https://processing.org/tutorials/pixels/) demonstrates direct pixel-array access. These are useful demonstrations that code can draw or manipulate points, but they start from an existing image and do not provide a human-authored sparse board or an animation asset workflow. For our art, a person should decide which logical cells are lit, their colors, and how each authored pose changes.

libGDX's [2D particle effects](https://libgdx.com/wiki/graphics/2d/2d-particleeffects) model independent emitters and particles, while its [3D particle effects](https://libgdx.com/wiki/graphics/3d/3d-particle-effects) describe point sprites as sprites attached to 3D points and facing the camera. That model suits sparks, smoke, and other effects; it would make each deer mark an independently updated particle. The deer instead needs a small set of complete, authored poses: move one target with the existing game logic and draw one selected frame. This avoids per-dot simulation and keeps anatomy, hit zones, and art aligned.

The source review did not locate a documented Java game whose primary look is this exact sparse, luminous 2D point-board. The Java material above is therefore an implementation analogy, not evidence that the style is common in Java games. The transferable pattern is logical coordinates plus authored frames/layers and separation of game state from rendering. Foundry should render a selected pre-authored frame as one Canvas 2D image draw, rather than issuing a draw call or animation update for every lit point.

**Runtime distinction:** Foundry modules are browser packages whose behavior is loaded as JavaScript/ES modules. Foundry documents PixiJS as a bundled JavaScript/WebGL library powering its main scene canvas. Our existing mini-games are UI surfaces, so a local Canvas 2D renderer is the smallest fit; it avoids a Java runtime, native bindings, and a new library dependency.

## What to borrow from Game Boy Color and Game Boy Advance

The useful borrowing is the **asset model**, not a hardware emulator.

| System | Public specifications and documented model | Useful ideas | Leave behind |
| --- | --- | --- | --- |
| Game Boy Color | 160 × 144 display; its character-based graphics use 8 × 8 tiles and 8 × 8 / 8 × 16 objects; limited colors are organized in small palettes. Nintendo’s support page and programming manual describe the display and CGB features. | Restrained palettes; repeated small motifs; independent fixed background and moving subject; a small logical grid that scales up. | Emulating CPU, VRAM, tile registers, OAM limits, palette registers, or exact console resolution. |
| Game Boy Advance | 240 × 160 display; character modes use 8 × 8 background tiles, and bitmap modes offer full-frame artwork. Its hardware supports layered backgrounds and sprites. | Mix reusable background motifs with a complete sprite-sheet subject; separate layers by movement/occlusion needs; flip the deer when facing changes. | Recreating modes, registers, DMA, VRAM, or GBA scaling math in Foundry. |

The proposed Regionwright composition is:

```text
Native Foundry/game UI (labels, controls, focus, keyboard help)
               ↓
Game feedback overlay (reticle, hit/miss marks, puzzle states)
               ↓
Moving subject sprite sheet (deer; authored frame selected by JS)
               ↓
Fixed point-board scenery (dark/blank field, sparse trees/ground)
```

For the deer: one transparent frame sheet; local anchor and facing are explicit; the existing game moves the complete target and resolves hit zones in its existing coordinate contract. If foreground grass must cover its feet, add one authored occlusion/foreground layer. Lock art can use the same frame/sheet/layer conventions for static tumblers, dials, pins, and feedback states without turning puzzle mechanics into pixels.

## Resolution, scale, and point-density proposal

The current target has a 180 × 150 coordinate box and is displayed about 230 CSS px wide at the 35-yard reference point. Retaining its ratio gives an image about 230 × 192 CSS px tall. The selected 240 × 160 board uses the GBA 3:2 logical resolution. In the supplied export, the deer bounds (x=53–201, y=4–154) fit inside a centered 192 × 160 crop (x=24–215). Use that crop for the moving target and keep the full 240 × 160 forest as a separate fixed scene layer. The crop and the existing target box both have a 1.2:1 ratio, so their coordinate mapping can stay uniform.

| Pilot value | Recommendation | Why / status |
| --- | --- | --- |
| Logical board | 240 × 160 cells | User-selected GBA resolution. At eight total cached frames (seven deer, one forest), raw RGBA raster cache is about 1.17 MiB. |
| Deer source area | Centered 192 × 160 crop (x=24–215) from the board | Contains the authored deer bounds and matches the existing 180 × 150 target ratio without stretching; keep the forest on the uncropped 240 × 160 layer. |
| Display size | 230 × 192 CSS px at the 35-yard reference | Preserves the current target box size and maps the crop uniformly; actual Foundry scaling will be visually reviewed. |
| Other assets | Choose dimensions per asset, not one global canvas | Lock mechanisms and small status marks need different proportions and detail. Share grid/palette/layer rules, not identical size. |
| Walking animation | Six walk poses plus one idle pose; begin around 8 pose changes/second | Enough to check gait readability; movement position stays governed by existing logic. Provisional. |
| Lit deer points | User export: 1,493–1,527 cells per pose | About 3.9–4.0% of the full board and 6.7–6.8% of the deer bounds. Density is provisional until reviewed at Foundry sizes. |
| Static scenery | Begin around 200–400 points across the visible forest layer | Keep the background subordinate and largely static. The original “400” is retained as the upper starting comparison, not a tested budget. |
| Palette | 2–4 carefully chosen colors/brightness values per asset | Borrow handheld palette discipline. Test point contrast against the dark/blank field; do not encode critical feedback by hue alone. |
| Scaling | Keep point cells crisp at integer 2× reference size; test narrow/large windows and high-DPI displays | At non-integer responsive sizes, edges can look uneven. Check nearest-neighbor scaling versus pre-rendered size variants before committing globally. |

The coded renderer’s proposed seven deer frames and one forest frame occupy 307,200 logical RGBA pixels (1,228,800 bytes, about 1.17 MiB) before browser-side copies. A single active deer-sized canvas at 460 × 384 backing pixels (230 × 192 CSS px at DPR 2) is about 0.67 MiB of pixel storage. These are raw capacity estimates, not measured module performance; active-cell JSON is likely smaller for sparse compositions. The runtime draws one cached frame per layer, not hundreds of point draw calls per animation tick.

Measure the exported active-cell JSON bytes and browser canvas allocation in the first pilot. The current renderer caches the eight logical 240 × 160 layer frames once (about 1.17 MiB raw RGBA), then redraws the chosen frame into responsive display canvases capped at DPR 2. Do not expand every cached frame to display resolution; the deer display canvas alone is about 0.67 MiB at 230 × 192 CSS pixels and DPR 2. The forest backing size depends on the actual arena dimensions, so record it during Foundry testing.

## Free tools and reusable building blocks

| Candidate | Free status / what it provides | Recommendation and licensing note |
| --- | --- | --- |
| [Pixelorama](https://pixelorama.org/) | Free/open-source pixel editor under MIT; supports layers, animation frames, onion skin, per-frame timing, PNG/APNG/GIF, and spritesheet export. Keeps an editable `.pxo` project. | **First choice for pilot authoring.** It can create the on/off board frames now, avoiding custom editor work. The editor’s software license is separate from licensing/AI provenance of any bundled sample art. Keep our own source project and export. |
| [LibreSprite](https://github.com/LibreSprite/LibreSprite) | Free sprite editor under GPL-2.0; supports layers, frames, palettes, onion skin, and multiple image formats. | Good desktop fallback if we prefer its workflow. The GPL covers the editor code; keep artwork licensing/provenance recorded separately. |
| [Piskel](https://www.piskelapp.com/) | Free browser-based/offline sprite and animation editor with live preview and PNG/spritesheet export; source code is public. | Good quick prototype option. Prefer local exports/source backups; this project does not need an account or external editor runtime. |
| [Tiled](https://www.mapeditor.org/) | Free/open-source map editor; layered tile maps, reusable tile stamps, tile animations, and JSON export. | Optional if the forest or later scenes become larger repeated tile layouts. Overkill for a single fixed Hunting backdrop and not an art editor for the deer. |
| Native Canvas 2D | Built into browsers. MDN recommends off-screen prerendering for repeated objects, layered canvases for separately changing areas, and integer coordinates where practical. | **Runtime first choice.** No added package, CDN, or framework dependency. |
| Foundry-bundled PixiJS | Foundry’s official docs say PixiJS powers its main scene canvas and is available to modules. | Use for future Foundry-scene effects only when needed. Don’t build the modal renderer on a different abstraction without a concrete requirement. |

### Build-versus-buy conclusion

Start with Pixelorama (or LibreSprite) and PNG sheets. The first artifact should be a human-authored deer idle pose, a small walking loop, and one simple forest layer. Retain the editable project file in the source repository. Export only what runtime needs. Make a small custom editor only if the authoring experiment proves we need capabilities standard sprite editors do not provide, such as semantic point styles, validated hit-zone anchors, shared palettes across frames, or automated size checks.

If a custom editor is later justified, its first release should do only: grid setup, draw/erase/recolor, named layers, frame clone/reorder, onion skin, timing preview, and sprite-sheet/PNG export. Keep its output compatible with ordinary images so no end-user has to install the editor.

## Free games for study

No freely playable hunting game with the exact sparse luminous point-cloud art style was found. These are useful for neighboring ideas. **Free to play is not permission to copy or redistribute artwork/code.** I found no explicit asset reuse license on these game pages, so treat their visuals as reference only and redraw all Regionwright art by hand.

| Game | Why it is relevant | How to use the reference |
| --- | --- | --- |
| [Pixel Hunt](https://skind.itch.io/pixel-hunt) | Free/name-your-price, LOWREZJAM first-person hunt-the-beast game; it leans on low resolution, distant visibility, target clues, and an aim/scope step. | Study how limited visual information supports target discovery. It is 3D low-resolution pixel art, not our 2D dot-field and not an asset source. |
| [EARL GREY](https://justwall.itch.io/earlgrey) | Explicitly offered free/name-your-price; 2D grayscale pixel survival game with hunting, forest exploration, and a cursor-directed rifle. The page credits its concept/art/programming to the maker and collaborators. | Study restrained grayscale use, forest readability, and the way hunting sits inside a broader loop. Don’t copy its sprites/UI. |
| [DEER](https://dantalionfreake.itch.io/deer) | Browser-playable 2D pixel game whose direct loop is tracking and shooting a deer in a forest. The page discloses AI assistance for graphics. | Useful for mechanics/pacing only. Exclude its art from the human-authored visual reference set. |
| [Deer, You Are Being Hunted](https://irog.itch.io/deer-you-are-being-hunted) | Top-down pixel-art game that reverses the role: you play a deer evading hunters, tracking threats, and surviving. The author’s page says no generative AI was used and lists Windows/Linux downloads. | Useful for deer motion, concealment, alert cues, and reverse-perspective ideas. The page doesn’t expose a reuse license; confirm the download’s price and terms before treating it as a no-cost player reference. |
| [The Trees Can Bleed](https://hgsc45.itch.io/the-trees-can-bleed) | Short, 2D pixel-art forest hunting shooter made with Aseprite and Godot; downloadable prototype. | Study the foreground/background layering and changing scene mood. Not a direct static-target match; reuse permissions not shown. |

Duck Hunt is a useful **mechanic and composition reference**, but Nintendo’s game is commercial and its sprites, screenshots, music, and characters are not free assets. A GitHub Duck Hunt clone can explain layering and movement, but the inspected [EaselJS clone](https://github.com/eulow/DucksHunter) has no license declaration on its repository page and is not suitable for code/art reuse without permission. Its README describes static background, moving ducks, foreground grass, and game UI as separate layers—an unusually close architecture analogy to our forest/deer/feedback stack.

### Free deer asset candidates and provenance

These are asset sources rather than games, so they may be useful as a pilot base if the visual direction fits. They are not currently in the Regionwright source tree.

| Candidate | Evidence and fit | Decision |
| --- | --- | --- |
| [Animated Wild Animals by ScratchIO](https://opengameart.org/content/animated-wild-animals) | OpenGameArt lists the deer pack as CC0, dates the upload to 2019, and describes idle, walk, and run animations. I inspected its 5.4 kB deer ZIP in a temporary review folder: it contains 72 × 52 frames arranged as 10 idle, 8 walk, and 6 run poses. | Best free movement-ready source located so far. The listing names an artist and gives a 2019 upload date, but has no explicit no-generative-AI statement; date and license alone do not prove process. Do not present it as provenance-confirmed for Foundry until a human reviews/accepts that evidence or obtains confirmation from the artist. Keep the original page, license, and any permitted source files if adopted. |
| [Animal Icons by Ydo4ki](https://ydo4ki.itch.io/animalicons) | The creator lists a 16 × 16 deer icon, CC0 1.0, and explicitly states that no generative AI was used. | Static reference/test candidate. Third-party art still needs explicit no-AI evidence under the user’s source preference; animation is not included. |
| [Deer Pixel Art by Mattar Productions](https://mattar-productions.itch.io/deer-pixel-art) | Name-your-price download; the author says it is free for commercial use, credits are optional, and itch.io lists “No generative AI was used.” The downloadable ZIP is listed as 1.6 kB. The author says they may make animations later. | A free, static, provenance-stated candidate if a third-party pixel silhouette is useful for a test. It is not a walk cycle, and it has not been adopted. |
| [Animated deer by gamedeveloperstudio.com](https://gamedeveloperstudio.itch.io/animated-deer) | The author lists idle, walk, run, jump, eating, and death animations, PNG frame sequences, and “No generative AI was used.” The minimum price is £5 and the ZIP is 22 MB. | Animation-ready paid option; outside the free-asset preference and not adopted. |

These are optional third-party references. Under the user’s source preference, an external art asset needs an explicit no-generative-AI statement and permission for the intended use. The preferred art source remains a point layout composed directly by a human for this project; no prebuilt deer image is required. If an external image is converted into point cells, retain its author, license, statement, and transformation notes. A conversion does not change the source image’s authorship.

## Foundry policy and authorship evidence

Foundry’s [current AI Content Policy](https://foundryvtt.com/article/ai-policy/) was revised on 2026-03-18. It says prepared visual media must originate from human creative work, prohibits AI-generated prepared illustrations/UI art, and places the burden on the package author to demonstrate a human creative process if questioned. It explicitly excludes ordinary procedural-generation algorithms from its restrictions. The policy also prohibits abusing SVG as code to evade the visual-media rule and permits AI-assisted code only if the author understands, can explain, modify, and maintain it.

Practical effect for this art direction:

- Manually selecting each active X/Y cell is human image composition. Writing those selections into arrays, coordinate lists, or a compact frame format and using JavaScript to light the corresponding canvas cells does not make the art AI-generated.
- Keep the editable point data, dated revisions, and a brief authoring note. This documents the human composition; it does not guarantee how Foundry staff will rule on a submission.
- AI-assisted code is governed separately from the point layout. Do not describe the board itself as human-composed if a generative model selected or authored its visual point pattern.
- Don’t trace AI-generated deer imagery into dot coordinates and label the result non-AI art. Don’t treat vector/SVG encoding as an exemption.
- The separate “Zero AI” category is stricter than “the visual assets are human-made”: it requires no AI at any stage of the user-facing content or its development. Confirm the whole package history before making that claim; AI-assisted code can still be permitted without qualifying for that label.

## Implementation checklist: what we still need to understand

**Code-backed v1 choices from the user-authored boards (visual acceptance is still pending):** the board's explicit X/Y cells are rendered as square 1 × 1 logical marks from an explicitly encoded board palette; the current deer and bear use the same eight colors. Each animal uses one idle frame and six walk frames at 8 fps; the same board is scaled at every hunt distance; existing hunting motion and hit logic remain authoritative while the renderer selects frames and mirrors facing. The fixed forest is a separate layer. The current renderer adds no independent per-cell flicker, blur, or glow. These choices describe the implemented pilot; they do not establish readability or player acceptance in Foundry.

### A. Visual rules

- [x] Define the v1 mark as one square logical cell. Canvas renders each authored cell as 1 × 1; defer mixed mark shapes until a visual need is demonstrated.
- [x] Use explicit per-board palettes for color and brightness; the current Canvas renderer adds no blur, glow, or shadow.
- [ ] Review point contrast and density at final Foundry display sizes before accepting them.
- [x] Use point boards for illustrative scene art: wildlife, scenery, lock faces, mechanisms, puzzle scenes, and decorative imagery. Keep interactive controls, readable text, reticle, hit feedback, and state logic accessible through the existing UI/game code; inventory all art surfaces before calling migration complete.
- [x] Reuse the same coded-cell/layer/frame convention across modules while keeping each module's runtime renderer and assets local. Palette and point density can follow the subject; verify module independence after the Hunting pilot.

### B. Frames and movement

- [x] Set the initial deer/bear pilot to one idle and six walk poses; reuse those poses at all distances and mirror for opposite facing. The current boards contain no startled, fall, or disappear poses.
- [ ] Decide whether any additional animal poses are needed after Foundry review; define lock-state frame equivalents per puzzle after the Hunting client gate.
- [x] Keep movement, facing, hit geometry, and shot resolution in existing game code. GM test mode rendered and produced held-click shot diagnostics at 25/45/65 yd at DPR 1; a connected player received a 25 yd calibration dialog and resolved one held-click test shot. Human visual acceptance remains pending.
- [ ] Whether a front grass layer must occlude deer feet, and whether poses keep a consistent anchor/overall silhouette.
- [x] Use deterministic authored frame changes for gait; do not flicker individual cells independently. Reduced-motion preference holds the art on idle while gameplay motion and hit logic continue.

### C. Asset format and editor

- [x] Prototype human-authored coordinate-list data with named layers/frames, runtime validation, cached Canvas rasterization, and a blank manual editor. The user-authored deer/forest board is integrated into Hunting and installed; bear is staged for later visual/performance review.
- [x] Compare coordinate triples with row-grouped pairs, row runs, and per-color row bitmasks on the real deer and bear exports for serialized size; results are below. The visual editor's ease of editing each representation remains untested, so no cross-module encoding change is selected yet.

Encoding comparison: Node `JSON.stringify` with gzip level 9, using the current deer and bear source boards. Row-pair candidates group each row as `[y,[x,color,...]]`; row runs store `[y,[[x,length,color],...]]`; color masks store each nonempty color row as a base-36 bitset. These are format experiments, not shipped schema variants.

| Encoding | Deer bytes (raw / gzip-9) | Bear bytes (raw / gzip-9) | Result |
| --- | ---: | ---: | --- |
| Coordinate triples (current v1) | 120,683 / 23,375 | 997,913 / 222,875 | Direct, editor-native representation. |
| Row-grouped X/color pairs | 68,025 / 8,200 | 518,558 / 75,928 | Smallest compressed candidate for both boards. |
| Same-color row runs | 101,190 / 9,093 | 480,044 / 84,374 | Smallest raw candidate for bear, but larger when compressed. |
| Per-color row bitmasks | 120,221 / 24,447 | 188,120 / 102,007 | Smaller raw bear, but compresses worse than row pairs and is less readable. |

The row-pair form round-tripped all eight frames of each board exactly and is about 65–66% smaller under gzip for these assets. Editing ergonomics and Foundry's actual HTTP compression are unmeasured. Keep v1 for the active Hunting pilot; consider row pairs as a future v2/build export only after player-side Foundry checks and a human authoring walkthrough confirm the workflow.

- [x] Retain the original PNG-sheet metadata scaffold as an optional fallback in [POINT_BOARD_ASSET_FORMAT.md](POINT_BOARD_ASSET_FORMAT.md). Coded active-cell JSON v1 is the selected source format; the Hunting art fills the existing target box, so it does not need a new gameplay anchor or hit-zone mapping.
- [x] Keep editable point-board source and provenance under `art-source/<Foundry module ID>/`, outside package builds; accepted runtime board JSON stays in its owning module.
- [x] Stage a blank, standalone point-board editor for manually placing cells, arranging frames/layers, and exporting JSON. Headless-browser checks cover draw, erase, layer/frame operations, and JSON export; the deer is integrated and installed, while bear integration and visual review remain pending.
- [x] Version the coded board convention as [data schema v1](POINT_BOARD_DATA_SCHEMA_V1.json). The older [PNG metadata schema](POINT_BOARD_ASSET_SCHEMA_V1.json) remains an optional path; future changes require an explicit new version.
- [ ] Confirm each packaged module uses its own local renderer/assets after a successful Hunting pilot; do not add sibling runtime imports.

### D. Renderer and performance

**Preliminary browser-only measurement.** HeadlessChrome 151 on Windows, 1440 × 900 viewport, DPR 2, using a local HTTP fixture for the actual JSON and renderer. The script loaded and normalized each board, rasterized all eight canvases (seven animal frames plus one forest frame), then made 600 sequential draw calls while advancing the animation clock by 125 ms per call (an 8 fps cadence simulation). The canvases displayed the full 240 × 160 board at 230 × 153 CSS pixels (460 × 306 backing); Hunting's production deer crop is 230 × 192 CSS pixels (460 × 384 backing), so the deer redraw probe used a smaller output surface than the integrated scene.

| Board | Active points across layers/frames | JSON load + validation | Rasterize all frames | Cached frame draw average / p95 | Estimated cached RGBA frame memory |
| --- | ---: | ---: | ---: | ---: | ---: |
| Deer | 10,784 | 16.8 ms | 7.8 ms | 0.018 ms / 0.1 ms | 1.172 MiB |
| Bear | 91,604 | 62.8 ms | 50.9 ms | 0.071 ms / 0.1 ms | 1.172 MiB |

The draw figures measure synchronous `render()` calls, not an observed real-time frame rate. The fixture did not include Foundry/Electron, browser startup, server compression, or player interaction. Gzip-9 sizes in the encoding comparison are Node measurements, not verified Foundry HTTP transfer sizes. Use these only as a baseline; repeat with the actual Foundry dialog at the production target crop before setting performance budgets.

A separate deer-only probe applied the integrated Hunting crop (`x=24, y=0, width=192, height=160`) at 230 × 192 CSS pixels (460 × 384 backing at DPR 2), with the forest at 288 × 192 CSS/backing pixels. It measured 16.9 ms load/validation, 8.7 ms to rasterize all frames, 0.8 ms for the forest's first draw, and 0.0135 ms average / 0.1 ms p95 for 600 deer frame draws. This is a distinct run from the full-board deer/bear comparison above; it remains browser-only evidence.

**Rotation Lock browser-only probe:** the shared v1 JSON asset is 13,314 bytes with 1,167 active cells across the static, cylinder, wrench, and pick layers. HeadlessChrome 151 fetched and rasterized the asset through the module-local loader, then rendered 600 transforms at the intended 496 × 331 CSS display size with DPR 2 (992 × 662 backing). Synchronous canvas rendering averaged 0.0145 ms per call with 0.1 ms p95. Estimated raw canvas storage is 0.59 MiB for four 240 × 160 cached layers plus 2.50 MiB for the DPR-2 display canvas, about 3.09 MiB total for one open dialog. These figures exclude Foundry/Electron compositor cost and do not establish real client frame rate or network compression.

- [ ] How Foundry modal windows resize and rerender; test current target 230 px, narrow windows, DPR 1/2, browser zoom, and retina displays.
- [ ] Choose Canvas 2D scaling and smoothing settings from actual renders; avoid fractional animation frame coordinates where crispness suffers.
- [ ] Load/decode artwork once per open game, draw a static forest once if worthwhile, and draw only the current deer frame plus changing feedback.
- [x] Record preliminary board-data, rasterization, backing-size, and per-frame draw timings for the actual deer and bear boards in headless Chromium (see table above); the data are browser-only and do not establish Foundry performance.
- [ ] Measure actual Foundry frame rate, browser/network startup, and HTTP transfer/compression on representative clients; compare optional PNG export.
- [x] Source-level cleanup: closing/replacing the Hunting dialog cancels the deer and projectile animation frames plus arrow/tracer timers; a focused regression assertion passes. This does not establish close/reopen behavior in Foundry.
- [ ] In Foundry, verify the frame cache, resize observer, animation loops, and point-board renderer lifecycle across close/reopen and resize. GM DPR-1 close/reopen and a DPR-1 player shot are verified; player close/reopen, resize behavior, and DPR 2 remain unverified.
- [ ] Decide if animation frame cadence is fixed or delta-time based; keep movement timing independent from art frame cadence.

### E. Gameplay, accessibility, and policy

- [ ] Preserve shot geometry, clickability, hit zones, range/scale behavior, facing, and all lock-puzzle inputs/outputs independently of visible points.
- [ ] Ensure point sparsity does not make hit targets too hard to see; art silhouette and mechanical hit area may differ but must not mislead.
- [ ] Check contrast and focus/keyboard behavior at every scale. Keep labels and non-visual state native and readable.
- [ ] Keep only gameplay-required motion. Reduce decorative flicker for reduced-motion preferences without silently changing hunt difficulty.
- [ ] Preserve human-authored sources and review current Foundry policy before any official package submission.

## Suggested build order and acceptance gates

1. **Reference pass:** play or inspect Pixel Hunt and EARL GREY; inspect DEER mechanics without using its AI-assisted graphics; inspect Irog’s reverse-role deer game if the download terms and price are acceptable. Collect only notes, not copied assets.
2. **Coded-board authoring:** the user has supplied the 240 × 160 GBA board and 115 × 96 alternate; both validate as active-cell data. Review the 240 × 160 contact sheet, including deer crop and forest placement, before broadening the editor or asset format.
3. **Renderer spike:** rasterize the authored deer crop into cached Canvas 2D frames at the existing target size and draw the full forest layer as static scenery. Move the deer with current code and cycle pose frames separately. Map hit zones through the same 1.2:1 crop and verify the actual aiming interaction.
4. **Foundry interaction gate:** GM DPR-1 test-mode rendering, movement/turning, anatomy overlay, close/reopen, and held-click diagnostics at 25/45/65 yd are verified in the disposable v14.367 world. A connected player also received the 25 yd calibration dialog and completed one held-click diagnostic shot at DPR 1. Still perform DPR-2/resize checks, player close/reopen, full shot-accuracy review, and human visual acceptance. Static preview is not acceptance.
5. **Reuse gate:** if art source and render are easy to maintain, document shared style/asset conventions and use Tumbler Lock and Rotation Lock as the first Puzzles & Locks conversion. They are pilots for the full puzzle-art migration, not the whole target.
6. **Complete current-module migration:** inventory every art surface in Studio, Puzzles & Locks, and Hunting & Gathering; apply the accepted point-board rules to every Puzzles & Locks game and all remaining module artwork. Record source and review status for each item. Keep ordinary Foundry controls/forms accessible and native.
7. **Future modules:** reuse the coded point-board data convention and a module-local renderer, with the same human-authorship and performance checks.

## Sources

### First-party platform and display references

- [Foundry module development](https://foundryvtt.com/article/module-development/)
- [Foundry bundled frameworks (PixiJS)](https://foundryvtt.com/article/frameworks/)
- [Foundry AI Content Policy](https://foundryvtt.com/article/ai-policy/)
- [MDN: optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Nintendo: Game Boy / Game Boy Color technical data](https://www.nintendo.com/en-gb/Support/Legacy-system/Technical-data-619585.html)
- [Nintendo Game Boy programming manual, archival scan](https://www.manualslib.com/manual/1627081/Nintendo-Game-Boy.html)
- [Nintendo: Game Boy Advance technical data](https://www.nintendo.com/en-gb/Support/Legacy-system/Technical-data-619479.html)
- [Nintendo Game Boy Advance programming manual, archival scan](https://www.manualslib.com/manual/3342081/Nintendo-Game-Boy-Advance.html)

### Rendering, authoring, and map references

- [Processing `point()` reference](https://processing.org/reference/point_)
- [Processing `PGraphics` off-screen reference](https://processing.org/reference/PGraphics)
- [Processing Pointillism example](https://processing.org/examples/pointillism) and [pixel-array tutorial](https://processing.org/tutorials/pixels/)
- [libGDX shape rendering](https://libgdx.com/wiki/graphics/opengl-utils/rendering-shapes)
- [libGDX simple game tutorial](https://libgdx.com/wiki/start/a-simple-game)
- [libGDX 2D particle effects](https://libgdx.com/wiki/graphics/2d/2d-particleeffects) and [3D particle effects](https://libgdx.com/wiki/graphics/3d/3d-particle-effects)
- [Google ARCore Java point-cloud sample](https://chromium.googlesource.com/external/github.com/google-ar/arcore-android-sdk/%2B/v1.2.0/samples/cloud_anchor_java/app/src/main/java/com/google/ar/core/examples/java/common/rendering/PointCloudRenderer.java)
- [Pixelorama FAQ and MIT licensing](https://pixelorama.org/faq/)
- [Pixelorama timeline and frames](https://pixelorama.org/user_manual/user_interface/timeline/)
- [Pixelorama save/export/spritesheet guide](https://pixelorama.org/user_manual/save_and_export/)
- [LibreSprite repository and GPL-2.0 license](https://github.com/LibreSprite/LibreSprite)
- [Piskel editor and export overview](https://www.piskelapp.com/)
- [Tiled editor](https://www.mapeditor.org/) and [JSON export](https://docs.mapeditor.org/en/stable/manual/export-generic/)

### Game references

- [Pixel Hunt](https://skind.itch.io/pixel-hunt)
- [EARL GREY](https://justwall.itch.io/earlgrey)
- [DEER](https://dantalionfreake.itch.io/deer)
- [Deer, You Are Being Hunted](https://irog.itch.io/deer-you-are-being-hunted)
- [The Trees Can Bleed](https://hgsc45.itch.io/the-trees-can-bleed)
- [Nintendo Duck Hunt overview](https://www.nintendo.com/en-gb/Games/NES/Duck-Hunt-946955.html)
- [EaselJS Ducks Hunter clone and its implementation notes](https://github.com/eulow/DucksHunter)
