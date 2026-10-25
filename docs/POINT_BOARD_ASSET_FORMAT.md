# Regionwright point-board image fallback format v1

This convention describes the optional transparent PNG spritesheet path. The current canonical direction is manually authored active-cell data rendered by JavaScript; see [coded point-board data v1](POINT_BOARD_DATA_SCHEMA_V1.json). The PNG convention remains useful for manually authored raster art, previews, or a measured optimization, but it is not required for the code-native light-board artwork.

## Coded point-board data

The canonical art source is a JSON board containing its logical dimensions, palette, layers, animation frames, and active cells as `[x, y, paletteIndex]` tuples. A frame is the set of cells that are lit at that moment. The human-composed positions are the artwork; the renderer rasterizes each layer’s frames once into cached canvases, then draws the selected frame during play. No image-generation step is part of this pipeline.

The v1 runtime validator is `normalizePointBoardData` in `point-board-renderer.js`. Module builds scan `*-point-board.json` files and validate coded data without requiring a PNG file. The separate JSON Schema is [POINT_BOARD_DATA_SCHEMA_V1.json](POINT_BOARD_DATA_SCHEMA_V1.json). Limits are 512 cells per dimension, a maximum board area of 262,144 cells, 16 palette colors, 16 layers, 64 frames per layer, 128 cached frames and 4,194,304 cached raster cells per asset, and 250,000 active cells across the complete asset. The current Hunting sources are two user-supplied 240 × 160 exports. Deer has seven frames (one idle and six walk poses at 8 fps) plus a 255-cell static forest, totaling 10,784 active cells and 120,683 JSON bytes. Bear has the same palette and exact forest layer plus seven frames (one idle and six walk poses at 8 fps), totaling 91,604 active cells and 997,913 JSON bytes. Both pass the module build validator but are not yet connected to the Hunting UI or reviewed in Foundry.

Keep point positions human-composed and retain readable source revisions. A small editor or preview can make cell placement easier; it changes no authorship rule. If third-party artwork is used as a base or reference in the asset, record its author, usage license, explicit no-generative-AI statement, and any transformation.

## Optional PNG spritesheet

The adjacent metadata describes a module-owned horizontal PNG spritesheet. Frame indexes start at zero. The sheet has no padding or spacing: its exact dimensions are `frameWidth * frameCount` by `frameHeight`.

## Runtime files

Each asset uses a module-relative horizontal PNG spritesheet and an adjacent metadata JSON file. Frame indexes start at zero. The sheet has no padding or spacing: its exact dimensions are `frameWidth * frameCount` by `frameHeight`.

```json
{
  "schemaVersion": 1,
  "spriteSheet": "assets/hunting/deer-point-board.png",
  "frameWidth": 115,
  "frameHeight": 96,
  "frameCount": 7,
  "animation": {
    "idleFrame": 0,
    "walk": {
      "startFrame": 1,
      "frameCount": 6,
      "fps": 8
    }
  }
}
```

`animation` is optional for static boards. `walk` is optional; when omitted, a moving entity holds its idle frame. Scenes compose separate boards as independent layers, so a fixed forest sheet can be drawn once while the deer sheet changes frames. Hit zones, object movement, and puzzle rules remain in game logic.

The module-local renderer can load the manifest and its PNG together:

```js
const { image, metadata } = await loadPointBoardAssetFromManifest(
  "assets/hunting/deer-point-board.json"
);
```

The helper resolves both paths from the module root, validates the manifest and exact sheet dimensions, caches the metadata/image promises, and leaves frame scheduling to the caller’s existing game loop.

## Export validation

Name runtime manifests `*-point-board.json` and store them under the owning module's `assets/` tree. `npm run check` and each module build distinguish coded point-board data from PNG metadata: coded data is validated directly and has no image dependency; PNG metadata validates the v1 schema, requires the sheet to resolve inside that module's `assets/` directory, verifies PNG structure and chunk checksums, and checks exact sheet dimensions. The build report includes board dimensions/layers/active-cell count or sheet dimensions/frame count, along with bytes. These checks cannot verify authorship, visual readability, or in-Foundry performance; those remain separate acceptance checks.

## Source and provenance

Keep human-authored source revisions and concise provenance notes under `art-source/<Foundry module ID>/`, outside `modules/` so the build does not ship working files. For coded boards, the runtime JSON is itself the active-cell artwork. For the optional raster path, keep only the PNG sheet and metadata required at runtime in the owning module’s `assets/` tree. Record the human author and any third-party asset/license alongside the source. Never create prepared point layouts by tracing AI-generated art.

Suggested provenance note fields:

- Asset name and owning module
- Human artist / author
- Editable board/data or `.pxo` project path and revision date
- Optional PNG export path and export date
- Any references or third-party material and their licenses
- Confirmation that the point placement and composition were made by a person

## Hunting pilot

Use the selected 240 × 160 logical board. Across the deer frames, active bounds are about 149 × 151 cells (x=53–201, y=4–154); the forest spans the full board width. Frame 0 is idle; frames 1–6 are the walk loop at 8 fps. For Hunting, crop the deer to x=24–215, y=0–159 (192 × 160), which matches the existing 180 × 150 target ratio. Render the forest separately from the full board as fixed scenery. A full-board PNG fallback would pack the seven deer frames into a 1,680 × 160 sheet, plus a separate forest sheet. Keep the crop-to-target coordinate mapping uniform so hit zones remain aligned. Treat scale and contrast as provisional until reviewed at actual Foundry sizes.
