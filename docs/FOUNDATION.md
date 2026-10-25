# Foundation decisions

## Scope

This project is a standalone Foundry VTT module for GM-reviewed effects on existing Scene Regions. The first implementation phase is deliberately smaller than the eventual behavior builder: it establishes the package contract, runtime capability detection, explicit selection capture, a versioned plan, validation, ownership flags, reconciliation, rollback, and a fixed Macro entrypoint.

## Research sources

The foundation was checked against:

- [Foundry module development](https://foundryvtt.com/article/module-development/): module folder and manifest requirements, ES module loading, hooks, settings, localization, and package metadata.
- [Foundry package management](https://foundryvtt.com/article/package-management/): versioned manifests, download archives, compatibility boundaries, and stable update URLs.
- [Foundry Scene Regions](https://foundryvtt.com/article/scene-regions/): Region/Shape/Behavior/Event concepts, native behavior scope, explicit UUID links, and Macro event context.
- [Foundry Macro Commands](https://foundryvtt.com/article/macros/): Script Macro scope, explicit arguments, Macro IDs, and execution behavior.
- [Foundry v14 Region Behavior API](https://foundryvtt.com/api/v14/modules/foundry.data.regionBehaviors.html): the version-matched native behavior registry and data-model types.
- [Foundry v14 `RegionDocument`](https://foundryvtt.com/api/classes/foundry.documents.RegionDocument.html): embedded-document operations and Region teleport/document boundaries.

The Dungeon Master's Forge repository was used as the project-specific reference, especially `docs/REGION_BEHAVIOR_BUILDER_PROJECT.md`, `docs/research/foundry-dmf-reference.md`, `docs/LEGACY_ENGINE_MACROS.md`, `testing/DMF_HARNESS_MACRO_EXECUTION.md`, `module/scripts/scene-region-forge.js`, and `module/tests/scene-region-forge.test.mjs`.

## Architecture

```text
Foundry hooks
    -> module API registration
        -> capability snapshot + local catalog
            -> explicit canvas selection capture
                -> versioned pure plan
                    -> runtime data-model validation
                        -> GM approval + opt-in setting
                            -> embedded RegionBehavior writes
                                -> Forge-owned reconciliation / rollback
```

The UI now provides the first ease-of-access editor foundation: a sketch-inspired DialogV2 shell with a task rail, focused options area, persistent UUID-backed Region selection panel, labeled linking rail, footer action, native effect selection, parameter controls, plan preview, GM review, and a Foundry settings handoff. The pure API remains authoritative for plan serialization and write safety. Live Foundry visual QA and the live adapter pass are still required before calling the editor production-ready.

## Boundaries

- The module ID is `regionwright`; the manifest folder name must stay identical.
- Foundry v14 is the initial compatibility target. The manifest uses `minimum: 14` and `verified: 14` until a specific build is live-tested.
- The core catalog covers the Foundry v14 native Region Behavior set plus the D&D5e difficult-terrain behavior currently targeted by the first system adapter. Availability is the intersection of that allowlist and `CONFIG.RegionBehavior.dataModels` at runtime. Execute Macro and Execute Script are cataloged as reserved advanced routes, not normal first-choice writes.
- `teleportToken`, `changeLevel`, `toggleBehavior`, `executeMacro`, and `executeScript` are not executable in this first foundation. Teleport may be detected as registered, but registration alone is not evidence that a linked workflow is safe.
- A plan stores selected Region UUIDs, Scene UUIDs, the allowlisted behavior key/type, and declarative parameters. It does not follow UUIDs from arbitrary text.
- All writes use embedded `RegionBehavior` document APIs. The module never directly mutates a Scene's source data.
- Reconciliation can update or remove only behavior documents carrying this module's ownership flag. Unrelated behaviors are preserved.
- A write requires a GM, the active Scene matching the plan, runtime registration, data-model validation, explicit approved plan state, and the disabled-by-default world setting enabled by a GM.
- A fixed convenience Macro may open the module API. Generated Macro source, `eval`, provider calls, and arbitrary scripts are prohibited.

System support follows the strategy in [SYSTEM_SUPPORT.md](SYSTEM_SUPPORT.md): D&D5e is the first system adapter, while the Region planner and safety boundary remain system-neutral. Dependency decisions follow [MODULE_DEPENDENCIES.md](MODULE_DEPENDENCIES.md); no third-party module is required by the core foundation.

## Next implementation phase

Live-test the ApplicationV2 parameter editor in Foundry v14, then harden the first end-to-end native adapter (`displayScrollingText`). The example-derived reveal/hide, door, puzzle-state, and combat-controller stages are sequenced in [EFFECT_ROADMAP.md](EFFECT_ROADMAP.md). Teleport remains a separately gated linked capability with its own isolated-world evidence requirements.
