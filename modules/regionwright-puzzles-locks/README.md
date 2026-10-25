# Regionwright: Puzzles & Locks

A standalone Foundry VTT module for reusable lock and puzzle games. It can be installed without Regionwright: Studio or Hunting & Gathering. Studio can optionally open this module's setup hub through its public API; Puzzles & Locks does not require Studio.

## Included games

- Tumbler Lock
- Rotation Lock
- Mirror Redirect (Laser Grid)
- Timing Dial
- Ingredient Mixing
- Spine Mosaic
- Sliding Mosaic

Open **Region Controls → Puzzles & Locks** to configure a game on the active Scene. Sliding Mosaic accepts an image path or URL, slices it into a 3 × 3, 4 × 4, or 5 × 5 sliding puzzle, and can be solved with clicks, WASD, or arrow keys. Region targets require Regionwright: Studio's opt-in Region-write setting. Open the Puzzle HUD to deploy a standalone game to the GM or players for testing.

Puzzles & Locks retains the existing `regionwright` document-flag scope and stable `regionwright:standalone:*` identifiers so saved locks and puzzle configurations remain readable. Socket traffic and new module settings use `regionwright-puzzles-locks`. On first active-GM startup, the module copies the former `regionwright.enablePuzzleWrites` value into its own puzzle-write setting when it was enabled. Studio retains the separate Region-write setting.

The module uses Foundry DialogV2 and native Foundry form styling for the shared HUD. Puzzle-specific CSS only handles the game canvas and layout.

On first active-GM startup, existing Puzzle HUD macros are updated from the former Premium script path to this module's bundled HUD script. Failed macro updates are logged individually and retried on a later active-GM startup.

Designed for Foundry VTT v14.
