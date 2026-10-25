# System support strategy

Regionwright will expand system support through small, explicit adapters rather than duplicating the Region builder for every game system.

## Support layers

### Core Region layer

This layer is shared across supported systems:

- Region selection and UUID capture;
- Scene and Region validation;
- native Region Behavior discovery;
- preview, approval, reconciliation, and rollback;
- effects that Foundry defines without a game-system rules dependency, such as scrolling text, darkness, weather, pause, and teleport where registered by the active runtime.

The builder reads the active runtime's registered `CONFIG.RegionBehavior.dataModels` entries. A behavior is only offered as available when the runtime exposes the corresponding data model.

### System adapter layer

Adapters provide system-specific behavior definitions and parameter forms for effects such as:

- Active Effects;
- damage and saving throws;
- conditions and immunities;
- movement rules;
- Actor, Item, and combat interactions.

An adapter must declare its system identity, supported version range, required behavior types, and fallback behavior where one exists. Missing or incompatible adapters must be visible in the UI rather than silently approximated.

## Support order

1. **D&D5e** — first complete system adapter and the initial system-specific live test target.
2. **Pathfinder** — add after the D&D5e adapter has a stable contract and evidence-backed tests.
3. **Warhammer** — choose and name the exact Foundry system before implementation. “Warhammer” is a family label, not one universal adapter.
4. **Other Foundry systems** — add adapters according to demand and documented runtime capabilities.

## Adapter promotion gate

Every system adapter must pass the same checks:

- exact Foundry system package and version range recorded;
- behavior types confirmed in the active runtime;
- parameters validated against the system's data model;
- permissions and player/GM behavior tested;
- repeat, reset, and reconciliation behavior documented;
- unrelated Region Behaviors preserved;
- no system dependency added to the core module unless unavoidable.

The core UI should remain usable when no system adapter is installed. System-specific options should be marked with their dependency and availability status.
