# Regionwright

Regionwright is a set of three standalone Foundry VTT v14 modules. Each module has its own source folder, manifest, runtime, settings, and release ZIP.

| Module | Foundry ID | Product ownership |
| --- | --- | --- |
| [Regionwright: Studio](modules/regionwright/README.md) | regionwright | Region authoring, native behavior planning, Studio activities, traps, and campaign integrations |
| [Regionwright: Puzzles & Locks](modules/regionwright-puzzles-locks/README.md) | regionwright-puzzles-locks | Tumbler Lock, Rotation Lock, Mirror Redirect, Timing Dial, Ingredient Mixing, Spine Mosaic, Sliding Mosaic, and Puzzle HUD |
| [Regionwright: Hunting & Gathering](modules/regionwright-hunting-gathering/README.md) | regionwright-hunting-gathering | Hunting, Fishing, Mining, resource catalogs, item packs, and the H&G HUD |

The modules can be installed together. Each works independently; optional integrations use public module APIs. Stable saved-data IDs and flags remain compatible with existing worlds.

## Source and packages

The only module source folders are modules/regionwright, modules/regionwright-puzzles-locks, and modules/regionwright-hunting-gathering.

- Build all three: **npm run build:modules**
- Package all three: **npm run package:modules**
- Check module boundaries and syntax, then run the Node suite: **npm run check**
- Module folders: dist/modules/
- ZIP releases and SHA-256 sidecars: dist/packages/

Do not install the repository root or an archive snapshot as a Foundry module. Install the individual module folders or release ZIPs. Pre-split module sources are preserved in [the legacy module archive](archives/regionwright-legacy-modules-20261018.zip). Superseded project rules and release artifacts are preserved in the [workspace retirement archive](archives/regionwright-workspace-retirement-20261018.zip) and [retired project files archive](archives/regionwright-retired-project-files-20261018.zip). Extracted old module roots and generated builds are under [retired active layout](archives/retired-active-layout-20261018/).

## Current state

The source split and main-world module settings pass are complete. Studio 0.2.0, Puzzles & Locks 0.1.1, and Hunting & Gathering 0.4.2 are installed as separate modules. Testmap and The Forgotten Realms have all three active; Tuesday Campaign has Studio and Puzzles & Locks active, with Hunting & Gathering disabled. The old monolith, Fishing, and Mining folders are outside active module paths. GM startup and settings were verified; player-facing gameplay has not been tested. See [the module strategy](docs/EDITION_STRATEGY.md) for the world-by-world evidence and limits.

For ownership, compatibility rules, and the current handoff, see [the module strategy](docs/EDITION_STRATEGY.md).
