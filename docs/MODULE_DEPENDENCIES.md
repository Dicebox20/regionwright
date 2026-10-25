# Module dependency policy

## Module relationships

The three Regionwright packages are separate Foundry modules and can be enabled together. None requires another Regionwright module.

| Module | Foundry ID | System requirement |
| --- | --- | --- |
| Regionwright: Studio | regionwright | No system dependency declared |
| Regionwright: Puzzles & Locks | regionwright-puzzles-locks | No system dependency declared |
| Regionwright: Hunting & Gathering | regionwright-hunting-gathering | D&D5e 5.3.3 or later, as declared in its manifest |

Studio may use the Puzzles & Locks public API when that module is installed. If it is absent, Studio remains available and puzzle openers are unavailable. Puzzles & Locks and Hunting & Gathering do not depend on Studio.

## Optional integrations

Third-party integrations remain optional unless a module manifest and a documented feature contract declare otherwise.

| Integration | Intended use | Rule |
| --- | --- | --- |
| socketlib | Cross-client requests | Use only for a reviewed feature that needs it; current modules use their own bounded socket routes. |
| Midi-QOL | D&D5e combat automation | Do not require it for native Region effects or puzzle correctness. |
| Dynamic Active Effects | Extended D&D5e Active Effects | Use only when detected and compatible; retain a safe fallback where possible. |
| Sequencer | Visual and audio presentation | Never make it necessary for mechanic correctness. |
| Monk's Active Tile Triggers | Existing tile-trigger workflows | Keep Regionwright Region-first and do not require this integration. |
| Levels | Elevation-aware workflows | Detect supported versions before exposing a feature. |
| libWrapper | Compatibility wrapping | Add only for a reviewed integration that needs to wrap another package or core method. |
| Tagger | Named groups and tag discovery | Keep it optional; do not make tags the only selection path. |
| Item Piles | Container and inventory workflows | Treat as roadmap work until its API and system bridge are verified. |

## Runtime behavior

Show an integration as available, missing, incompatible, or not needed. List optional dependencies in the plan review. A missing required adapter must fail safely and explain the limitation; it must not silently choose a different automation path.

## Promotion rule

Support an optional integration only after recording its package ID, tested version range, Foundry range, system compatibility, API contract, failure behavior, and reset or rollback behavior. A companion module must not become a hard prerequisite because it is convenient.
