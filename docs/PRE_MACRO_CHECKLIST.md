# Pre-Macro checklist

Research date: 2026-08-01

This is the gate that must be completed before writing a gameplay Macro for Regionwright. It combines Foundry's official Macro and Scene Region guidance with the Dungeon Master's Forge evidence standard.

## The first decision: do we need a Macro?

Foundry's Region system already provides declarative behaviors for darkness, weather, movement cost, scrolling text, pausing, teleportation, level changes, Active Effects, and behavior toggling. It also provides a simple trap recipe using Pause Game and Display Scrolling Text without custom code.

Use this decision order:

1. Use a native Region Behavior if it completely satisfies the requirement.
2. Use a narrow module adapter if the action is a common, bounded world change that the core Region model does not provide.
3. Use an existing documented module integration only when its dependency, version, permissions, and behavior are verified.
4. Write a Macro only when custom logic is genuinely required: custom state, a calculation, a random landing choice, a special target policy, or orchestration that cannot be expressed by the first three options.

The Macro should be the smallest custom layer around a stable, explicit contract. It should not become a substitute for a missing design decision.

## Phase 1 - Freeze the runtime

Record the exact environment before researching code:

- Foundry VTT version and build;
- active game system and version;
- enabled modules and versions, especially any module the Macro would call;
- world ID and the isolated test-world policy;
- active Scene and whether the Scene is viewed by the executing user;
- executing user role, ownership, and whether the action is GM-only;
- whether the Macro will run manually, from a Region Execute Macro behavior, from an Item/Activity, or from another Macro.

Foundry's official Macro API is broad, but a Macro can only do what the current user's role and permissions allow. The same source code can therefore succeed for a GM and fail for a player.

## Phase 2 - Write the behavior contract

Before code, write one sentence that can be tested:

> When [specific event] occurs for [eligible token/user] in [specific Region], [specific action] happens once or repeatedly, and [reset/failure behavior] applies.

Then specify these fields:

| Field | Required decision |
| --- | --- |
| Trigger | Exact Region event: Token Enters, Token Exits, Token Moves In/Out/Within, Token Animates In/Out, viewed/unviewed, behavior status, turn, or round |
| Subject | Which Token or user qualifies; what happens for a GM-controlled Token, player-controlled Token, Token creation, deletion, or no Token |
| Scope | One Region, multiple Regions, one Scene, cross-Scene, or world-level |
| Action | The exact visible or document change |
| State | Once, repeatable, cooldown, active/inactive, combat-bound, or persistent |
| Reset | Manual reset, exit reset, turn/round expiry, deletion, or no reset |
| Failure | What the GM sees if a reference is missing, permission is insufficient, or the target is already in the desired state |
| Evidence | What proves the effect worked in the isolated world |

Do not begin with prose such as “make the puzzle work.” Convert it into one narrow contract first.

## Phase 3 - Choose the exact Region event

Event names are not interchangeable:

- `Token Enters` includes tokens created inside the Region and tokens affected by a Region becoming active; it does not fire merely because a token was already inside when the Scene loaded.
- `Token Moves In` describes a movement whose destination is inside the Region while the token was outside before the movement began.
- `Token Animates In` is tied to the movement animation and only occurs while the Region is being viewed.
- `Token Exits`, `Token Moves Out`, and `Token Animates Out` have corresponding differences.
- Turn and round events require a Combat encounter.
- Viewed/unviewed events are appropriate for presentation or canvas-local effects, not ordinary gameplay state.

For each candidate event, write a small matrix covering token drag, measured movement, token creation, Scene activation, Region activation, and a token already standing inside the Region. This prevents a Macro from appearing unreliable when it is actually subscribed to the wrong event.

## Phase 4 - Inventory exact documents and references

Capture the real documents before coding:

- source Scene UUID;
- source Region UUID;
- source Region Behavior UUID if another behavior is being toggled;
- target Token, Tile, Wall, Item, Actor, Macro, or destination Region UUID;
- current names, types, Scene parents, ownership, and current state.

Use Foundry's Copy Document UUID control or explicit in-world selection. Do not infer an ID from a name, paste an ID from a prompt without verification, use partial-name searches for a write target, or silently follow arbitrary UUIDs.

Foundry's current document guidance treats UUIDs as full document paths and validates document data against the active schema. A reference is not evidence that the target exists, belongs to the expected Scene, or is writable.

## Phase 5 - Prove the no-code baseline

Create the smallest native or adapter-only test first. For example:

```text
Region -> Token Enters -> Display Scrolling Text
```

If that proves the trigger and visible consequence needed by the feature, stop there. If the feature needs a custom consequence, document exactly what the native behavior cannot express and why a Macro is justified.

This phase also checks whether a Macro is being used to mutate a document that should instead be handled by a native Region Behavior such as Teleport Token or Toggle Behavior.

## Phase 6 - Build a safe diagnostic probe

The first Macro should be a temporary diagnostic probe, not a production puzzle controller. Attach it to a known Region Execute Macro behavior and have it report only safe context:

- `behavior` - the triggering Region Behavior;
- `event` - the event object;
- `event.data.token` - the Token associated with the event, when present;
- `region` - the source Region;
- `scene` - the containing Scene.

The probe should log or display document names, UUIDs, event type, and whether a Token exists. It should perform no world writes, no movement, no deletion, no target selection, no provider call, and no generated-code execution.

Foundry documents this Region-specific Macro context explicitly. Ordinary manually executed Macros also have different built-in values such as the selected `token` and `actor`, so never assume that a Region-triggered Macro has the same context as a hotbar Macro.

## Phase 7 - Define the implementation boundary

Before the production Macro, decide:

- what inputs are passed through `scope` versus resolved from the explicit Region context;
- whether the Macro is a world Macro, module-owned fixed entrypoint, or an existing reviewed Macro referenced by UUID;
- whether the Macro needs `async` and which document operations must be awaited;
- whether the operation uses a Foundry Document API method rather than direct source-data mutation;
- what the Macro returns and how the caller reports success or failure;
- whether the operation is idempotent, repeatable, once-only, or guarded by a module-owned flag;
- how re-entry, double-triggering, simultaneous Tokens, and a second GM are handled.

For Regionwright, the default boundary is a checked-in, reviewed module entrypoint or an existing GM-selected Macro UUID. Generated Macro source is not a normal output of the builder.

## Phase 8 - Add safety checks before the effect

The production Macro must fail closed:

- verify GM or required permission before any write;
- verify the active World and expected Scene context;
- verify source Region, triggering Behavior, and target documents still exist;
- verify document types and parent Scenes;
- handle `event.data.token === null`;
- handle deleted, hidden, locked, disabled, or already-processed targets;
- avoid fuzzy name matching and arbitrary UUID traversal;
- avoid `eval`, `Function`, remote code, or code assembled from untrusted text;
- prevent recursion and trigger loops, especially with teleport or linked Regions;
- perform no partial multi-document update without a rollback or a clearly documented recovery path;
- report a concise GM-facing error without exposing private credentials or unnecessary world data.

If a Macro is created at runtime, readable code must be presented and the user must explicitly confirm before it runs. Keep runtime-created code outside the normal Region builder path.

## Phase 9 - Test in the isolated world

Use a dedicated test Scene with tagged fixture Regions, Tokens, and targets. Keep the world and module stack versioned. Test with both a GM and a player account where the event or action is permission-sensitive.

The minimum evidence sequence is:

1. **Structural:** Macro and Region Behavior data parse and validate.
2. **Context:** the diagnostic probe receives the expected event and documents.
3. **Safe-use:** the production Macro performs the intended action in a controlled case.
4. **Negative cases:** missing Token, wrong Scene, missing target, denied permission, disabled behavior, repeated trigger, simultaneous triggers, and stale UUID.
5. **Reset/replay:** the fixture can be restored and the same test can be run again without accumulating hidden state.
6. **Full-function:** the exact user-facing example works with the stated versions and dependencies.

Do not call a Macro proven because it parses, opens a dialog, or creates a Chat Message. For this project, created-document and safe-use evidence are the minimum promotion threshold.

## Phase 10 - Package and document it

Before exposing the Macro to users, record:

- the Macro name and stable identity;
- exact prerequisite Foundry/system/module versions;
- required ownership and permissions;
- required Region shape and event configuration;
- all referenced UUIDs and how the GM captures or replaces them;
- expected success message and failure behavior;
- reset instructions;
- test-world evidence and known limitations.

If it is a module-owned helper, load it through the module manifest and keep the user-facing Macro thin. Foundry's module-development guidance recommends a valid root `module.json`, explicit JavaScript loading, and version compatibility metadata before functionality is expanded.

## First Macro gate for this project

We should not begin the first gameplay Macro yet. The immediate next artifact should be a temporary **Region Event Context Probe** that proves the active v14 runtime passes the documented context through `Execute Macro`.

The probe is ready to be written only after we have:

- an isolated v14 test world;
- one test Scene and one test Region;
- a known Region Behavior configured for `Execute Macro`;
- a controlled test Token;
- a GM test login and a player test login;
- a written choice between `Token Enters` and `Token Animates In`;
- a cleanup/reset procedure.

After that probe passes, the first real custom Macro should target one bounded example-derived action, such as revealing one explicitly selected Token/Tile or changing one selected Wall door. Native scrolling text, pause, darkness, weather, movement, teleport, level changes, and behavior toggles should remain native behavior work rather than Macro work.

## Sources

- [Foundry Macro Commands](https://foundryvtt.com/article/macros/) - Macro types, permissions, built-in values, arguments, and execution.
- [Foundry Scene Regions](https://foundryvtt.com/article/scene-regions/) - Region Behavior context, UUID links, event semantics, and native examples.
- [Foundry Module Development](https://foundryvtt.com/article/module-development/) - manifest, script loading, hooks, and package structure.
- [Foundry v14 Document API](https://foundryvtt.com/api/v14/modules/foundry.documents.html) - UUID resolution, embedded documents, schema validation, and document operations.
- [Foundry Macro Commands](https://foundryvtt.com/article/macros/) - readable commands and explicit execution.
- Dungeon Master's Forge `docs/research/foundry-automation-deep-research-2026-07-23.md` - evidence order and runtime inventory.
- Dungeon Master's Forge `docs/REGION_BEHAVIOR_BUILDER_PROJECT.md` - Region selection, approval, rollback, and Macro safety boundaries.
- Dungeon Master's Forge `docs/LEGACY_ENGINE_MACROS.md` - legacy Macro migration and isolated-run boundaries.
