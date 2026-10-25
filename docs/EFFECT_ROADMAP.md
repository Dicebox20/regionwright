# Effect roadmap

The product examples for this project share a common goal: entering a Region should cause an intentional, visible change in the Scene, and a collection of Regions may coordinate a larger puzzle or encounter. The module should reach that goal through small, reviewable effect primitives instead of starting with a general-purpose Macro generator.

The priority order below is informed by the official Foundry design direction documented in [Foundry Region intent research](FOUNDRY_REGION_INTENT_RESEARCH.md). Foundry's intended center of gravity is a general spatial interaction framework: passive environment, event reactions, traversal, area-of-effect geometry, and extensibility. Macro and Script behaviors remain customization escape hatches rather than the default product surface.

## The effect model

Every effect should eventually be represented as five explicit pieces:

1. **Trigger** — for example `tokenEnter`, `tokenExit`, or `tokenMoveIn`.
2. **Target** — a GM-selected Foundry document with an exact UUID and visible Scene/world context.
3. **Action** — a bounded operation such as display text, show/hide a Token or Tile, change a Wall door state, or apply an Active Effect.
4. **State** — whether it is once-only, repeatable, timed, combat-bound, or part of a required-condition set.
5. **Reset** — the reviewed way to restore the original state or clear the puzzle state.

The planner must show all five pieces before approval. A natural-language request may help describe intent later, but it must not invent UUIDs, target documents, Macro code, or hidden state transitions.

## Simple-first implementation order

### Signature slice - Lockpicking Door

Before broad multi-Region puzzle state, build one self-contained Door puzzle: select one locked Wall Door, choose a difficulty, then let a player solve a pick-driven tumbler challenge to unlock that exact Door. The configuration and outcome must use explicit UUIDs and module-owned Wall flags; it must never generate a Macro or Script. The first version has no external asset or module dependency.

Item Piles chest support is a later optional adapter. It must use the installed Item Piles API only after version and system-bridge validation; missing Item Piles can never disable the standard Door lock workflow.

### Slice 1 — Native Region feedback

Start with one Region and one native behavior. `Display Scrolling Text` and the guided `Pause Game` setup are implemented; next are `Suppress Weather`, movement cost, and darkness. These effects stay inside Foundry's native Region Behavior model and are already represented in the local allowlist.

Acceptance evidence:

- the selected Region and event are visible in the preview;
- the exact native behavior data validates in the active Foundry runtime;
- canceling the preview performs zero writes;
- applying the approved plan creates or reconciles one Forge-owned behavior;
- the effect is observed in an isolated v14 test world.

Foundry-direction additions to this slice are `Define Surface` and `Apply Active Effect` when the active runtime exposes them. They should be capability-gated because behavior registration is system/version dependent.

### Foundry-direction follow-on order

After the native feedback slice, prioritize `Teleport Token`, `Change Level`, and `Toggle Behavior` before expanding arbitrary world-document mutation. These are core Region concepts for portals, Scene Levels, pressure plates, and one-shot traps. Then add the explicit Token/Tile visibility and Wall-door adapters required by the shared examples. Shape and template tooling, audiovisual effects, puzzle state, and encounter controllers follow in that order.

### Slice 1.5 — Native traversal and behavior orchestration

Add the core Region behaviors that make portals, Scene Levels, pressure plates, and one-shot traps composable:

- `Teleport Token`, same Scene first and cross-Scene only after explicit live tests;
- `Change Level` when Scene Levels are available;
- `Toggle Behavior` for enabling or disabling another reviewed behavior.

Teleport plans must show the source and destination Regions, include loop protection, and validate the active runtime. Toggle plans must show the linked behavior and its current state. These are preferred before arbitrary world-document mutation because they are core Region concepts and are already represented by the v14 behavior model.

### Slice 2 — One explicit reveal/hide target

Implement the smallest example-derived world change: a token enters a Region and one GM-selected Token or Tile becomes visible or hidden. The target must be selected by the GM, resolved to an exact UUID, and restricted to the active Scene unless a later capability explicitly proves cross-Scene handling.

This may use a native module-owned adapter or an optional Monk's Active Tile Triggers route. MATT is a real Foundry v14-compatible module whose documented actions include token/tile visibility, wall/token/tile alteration, door state changes, notifications, chat messages, and Macro execution; it should remain an advertised optional capability rather than an implicit dependency. See the [official MATT package page](https://foundryvtt.com/packages/monks-active-tiles).

The complete native behavior menu grouping, including Teleport Token recipes and the reserved Execute Macro/Execute Script route, is maintained in [NATIVE_REGION_BEHAVIORS.md](NATIVE_REGION_BEHAVIORS.md).

Acceptance evidence:

- the target document type, UUID, name, Scene, current state, and proposed new state are shown;
- unrelated Tokens, Tiles, Walls, Regions, and Actors are unchanged;
- a second application is idempotent or explicitly rejected;
- reset restores only the module-owned change;
- player-token and GM-token trigger behavior are tested separately.

### Slice 3 — One door action

Add a single selected Wall door action: open, close, or toggle. Treat this as a separate adapter from visibility because the Wall document schema and permissions differ from Token/Tile visibility. Do not accept a wall UUID pasted into free text; capture it from the active Scene and validate the door type/state in the installed runtime.

The Glass Eye example becomes a supported recipe only after this slice: `tokenEnter -> optional message -> selected door opens`.

### Slice 4 — Explicit multi-Region puzzle state

Support four selected Regions, each with its own explicit completion signal, and one final selected target. The first version should use a simple all-required condition set:

```text
Region A completed
Region B completed
Region C completed
Region D completed
    -> reveal selected target
```

The state must be stored as module-owned structured data, not in generated Macro source. It must have a visible reset action, a preview of all Regions and the final target, and a transaction/rollback boundary for the final reveal.

### Slice 5 — Encounter and combat controllers

Only after the Scene puzzle slices are proven should the module support the more advanced example-derived effects: switch Regions disabling shield Active Effects, combat-turn timers, repairs, legendary-action resources, and a GM-started encounter controller. These require combat lifecycle hooks, persistent state, multi-document updates, duplicate-controller prevention, and a much larger live evidence matrix.

They should be modeled as bounded declarative controllers with explicit Actor, Token, Combat, and Active Effect references. They should not be implemented as arbitrary generated Script Macros.

## What is intentionally deferred

- Generated Script Macro or JavaScript source.
- Hidden UUIDs copied from a prompt or provider response.
- Cross-Scene target mutation.
- Automatic discovery of doors, Tokens, Tiles, Actors, or Items.
- Multi-step state machines before the one-target reveal/hide adapter is proven.
- Automatic combat hooks and controller startup before isolated duplicate-GM and rollback tests exist.

The current module foundation supports the native Slice 1 plan and write boundary. The first end-to-end target is now being prepared as `Display Scrolling Text`, with one selected Region, one event, and the native message/visibility/color/once fields.

Before any gameplay Macro is introduced, follow the [Pre-Macro checklist](PRE_MACRO_CHECKLIST.md). The first Macro milestone is a temporary Region Event Context Probe that performs no world writes and verifies the documented `behavior`, `event`, `region`, and `scene` context in an isolated v14 world. The first production Macro must wait until that probe, permission matrix, reset procedure, and no-code baseline are proven.
