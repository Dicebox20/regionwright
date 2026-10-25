# Regionwright: Puzzles & Locks

Status: Puzzles & Locks 0.1.2 is installed in the main Foundry data profile and GM-tested in the clean `Regionwright Puzzle Test` world created on 2026-10-19. That world uses Foundry v14.367 and D&D5e 5.3.3; only Studio and Puzzles & Locks are active, with puzzle writes enabled for this test world. No Ascendency campaign content was copied. The custom-image board, Door flow, and Region setup/handler were exercised there. See [Module Strategy](EDITION_STRATEGY.md) for the earlier world audit and this runtime pass.

## Product scope

Foundry ID: `regionwright-puzzles-locks`.

Puzzles & Locks is installable without Studio or Hunting & Gathering. It owns seven reusable games, their setup and play runtimes, puzzle input guard, styles, Scene Control hub, and GM Puzzle HUD:

| Stable ID suffix | Player-facing title |
| --- | --- |
| `lockpicking` | Tumbler Lock |
| `rotation-lock` | Rotation Lock |
| `laser-grid` | Mirror Redirect |
| `timing-dial` | Timing Dial |
| `ingredient-mixing` | Ingredient Mixing |
| `spine-mosaic` | Spine Mosaic |
| `sliding-mosaic` | Sliding Mosaic |

Source is `modules/regionwright-puzzles-locks/`. Public API version 1.1.0 is available at `game.modules.get("regionwright-puzzles-locks").api`; it exposes the catalog, setup hub/openers, standalone dispatch, individual game APIs, and Puzzle HUD.

## Compatibility and permissions

- Existing document flags stay under `regionwright`, and stable `regionwright:standalone:*` catalog identifiers remain unchanged. No document-flag namespace migration is part of this split.
- New settings and socket traffic use `regionwright-puzzles-locks`.
- The active GM can migrate the old `regionwright.enablePuzzleWrites` value once. Studio retains the old setting in hidden form for that read. Region writes remain Studio-owned.
- Player requests that change documents continue through the active-GM authority already used by the games.
- Studio optionally opens this module through its public API. Studio is not a required dependency. Studio's Boss Engine uses the optional Rotation Lock/Mirror Redirect openers and retains a local fallback.
- The completion-to-activation contract for connecting a puzzle result to another Region or a Door is still open. The extraction keeps current game behavior and saved configuration; it does not introduce a new generic composition engine.

## HUD and release

The Scene Control hub and Puzzle HUD use Foundry DialogV2 and native form/window styling. CSS is limited to puzzle canvases and layout. Use `npm run build:puzzles-locks` to build the module or `npm run package:puzzles-locks` to create the standalone ZIP and checksum under `dist/packages/`.

## Evidence and remaining work

The 0.1.2 source checker validates JavaScript syntax, manifest ownership, and local imports. The packaged ZIP at `dist/packages/regionwright-puzzles-locks-v0.1.2.zip` includes the Sliding Mosaic runtime, engine, stylesheet, and demo image; its current SHA-256 is `F126DC0AA90828B947C2401E8CABEB3E27AADDDF7C18FCA4A19399004F8C746D`. The live GM pass used the user's attached 1024 × 1024 PNG: a 3 × 3 Door puzzle opened from the Door control, accepted tile moves, solved in 26 moves, and unlocked the Door; a 4 × 4 Region puzzle saved one `tokenEnter` behavior, opened through its Region handler, loaded the image, and accepted a move. Screenshot review found and fixed relative image URL resolution and Foundry's global button-height clipping; the final board rendered 151 × 151 image tiles with no Sliding Mosaic page errors. Still to verify: a connected non-GM player, actual token movement into the Region, Tile setup/play, and a complete 5 × 5 solve. The full repository test run reports 305/311 passing; its six failures are in existing Boss Engine/Studio/Hunting & Gathering/catalog assertions outside this Sliding Mosaic change.
