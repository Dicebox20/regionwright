# Regionwright Studio: community research and composition map

Research snapshot: 2026-10-05. Planning research only; no runtime or package changes.

This is an update for the newer direction: Studio is both a necessary setup wizard and a modular Region-authoring module. Users add compatible scripts in a meaningful order, and use Studio to connect Regions. The earlier [Community Region research](COMMUNITY_REGION_RESEARCH.md) remains a broad capability inventory, but its recipe-only and general trap recommendations are not product decisions for this direction.

## Short conclusion

Foundry users already build rich Region interactions, but public examples repeatedly show the cost of wiring them: UUIDs, multiple setup screens, unclear event/token context, inventory filters, optional-module conflicts, and version changes. There is also direct competition: Glyph now offers node-based Region programs, flow control, module-provided actions, and recipes; simpler tools specialize in teleport linking and reference selection.

The promising distinction is not “more effects” or “a graph editor.” It is a wizard that remains the primary setup path while each added, versioned script contributes the right questions and composes with compatible earlier/later scripts. The wizard should make the chain and its Region links legible, then validate, test, reset, and repair it.

Two constraints matter immediately:

- Foundry supports multiple Behaviors per Region, but its Region sheet displays them alphabetically. Insertion order cannot safely be treated as runtime order. If a composed sequence promises “first this, then wait for that,” Studio must store and orchestrate that order explicitly.
- The sources reviewed establish no useful universal maximum number of connected Regions. Model connection count per script/flow type, and validate readability, cycles, and runtime cost instead of choosing an arbitrary global cap now.

## Research scope and confidence

Reviewed Foundry's current Scene Region documentation and v14 API catalog; Foundry package pages and module documentation for Region automation tools; Foundry issue #11467; and public Reddit help/showcase threads about Region setup, item gates, token targeting, and cross-Scene links. Also inspected the workspace's current Studio plans, reusable puzzle code, and `database/regionwright_primary_knowledge.sqlite` in read-only mode.

This is qualitative product research, not a representative survey. Package descriptions show what tools offer, not which features are most popular. Individual Reddit threads show real tasks and friction, not market-wide demand. A few newer releases (especially Glyph and Quick Teleporters) have limited time to accumulate usage evidence.

## Community needs indicated by the evidence

| Repeated job or friction | Evidence observed | Product implication |
| --- | --- | --- |
| Link the intended Region without copying IDs or losing the map context | Foundry's UUID-linking issue #11467 explicitly asks for easier Region/Behavior drag-and-drop. Easy Regions adds searchable UUID fields and automatic named teleport pairing. Quick Teleporters automates linked Region creation; its recent announcement received strong early interest, but is not a representative poll. | Region selection should be visual, named, Scene-aware, highlighted, and repairable. For connections, show source → destination and provide an unmistakable map-pick step. |
| Build a multi-action sequence without writing macros | MATT supports multiple ordered actions, filters, and triggers. Help threads show users who cannot find its trigger/action setup or end up writing scripts for a simple trap. Glyph now markets sequences, branches, loops, calls, delays, and recipes. | Keep the wizard; make each script a small, understandable step. Offer an advanced view only as a synchronized representation of the same plan, not a prerequisite. |
| Check or use an inventory item as a gate | Threads describe item-presence checks, consuming a key, and opening a Door only on success; other threads show the filter itself can be confusing or appear not to work. Lock & Key supplies a specialized key/lock interaction. | Distinguish “has item,” “selects/presents item,” “uses item,” and “consumes item.” They are different script capabilities and need explicit feedback and failure behavior. Inventory access may require a game-system/module adapter. |
| Specify which token/player triggers an interaction | Users ask how to limit behavior to selected token classes; Region Script examples can execute on every connected client and duplicate chat/checks if execution audience is not controlled. | Every script should declare its triggering token/user scope and execution authority. The wizard should explain whether it applies to the entering token, all tokens in a Region, token owners, players, or GM. |
| Understand when an event actually fires | Core distinguishes enters, exits, move-in/out/within, animation-in/out, and turn/round events. “Token Enters” may also occur for token creation, Region-boundary changes, or enabling a behavior while a token is inside. Click and other interaction events may be added by modules. | Ask in plain language whether the setup means “walks into,” “appears in,” “moves within,” or “clicks/uses.” Label core versus optional events and their edge cases. |
| Recover when the environment changes | Community posts report trigger behavior changing or interacting with movement/version changes. Foundry warns that incompatible or outdated modules can cause instability. | Compatibility needs Foundry/system/module versions, capability checks, visible warnings, and a safe missing-dependency state—not just a static supported/not-supported label. |

These are observed use cases and friction points, not a final feature priority ranking.

## Existing ecosystem and the competitive bar

| Tool | What it already does well | What it means for Studio |
| --- | --- | --- |
| Foundry core Regions | Multiple Behaviors on a Region; spatial shapes; event subscriptions; scrolling text, pause, teleport, toggle, and other native behaviors. Teleport links can cross Scenes. | Studio should orchestrate and explain the native capability set, not duplicate the Region editor. A Region's multiple shapes share its Behaviors, which affects when one Region should be split into several. |
| Monk's Active Tile Triggers (MATT) | Broad action chains, token filters, trigger controls, macros, and many integrations. | Powerful but configuration-heavy workflows are a user pain signal. Studio can curate discoverable steps and preserve needed flexibility. |
| Glyph: Active Region Triggers | As of this snapshot, a new Foundry v14 module with a node-tree editor, sequences, if/else, loops, calls, delays, module-registered actions, and 20+ recipes. It is the closest direct overlap with modular Region scripting. | Study its actual UI and compatibility contract before final positioning. A wizard-led ordered script catalog, clear Region connection handoff, and stronger diagnostics may be a differentiator; this is a hypothesis, not proven market separation. |
| Region Behaviour Adjustments | Focused actions for Doors, Walls, visibility, items, conditional/delayed triggers, and triggering Behaviors in other Regions. | These are candidate actions/adapters, not proof that every pair composes safely. Capability and target checks are needed. |
| Enhanced Region Behavior | Packaged traps, system-aware saves/damage, music/sound/visual effects, elevation, journals, and a custom click event. Some features have optional dependencies. | A script catalog must declare dependencies and keep optional presentations from breaking core outcomes. Regionwright's trap direction remains activation-game-only; do not inherit this package's autonomous damage-trap product assumption. |
| Easy Regions / Quick Teleporters | Searchable references, named pairing, and fast creation of connected teleport Regions. | Region connection setup is a distinct, high-value workflow. Make directionality, return links, Scene, and selected endpoint visible. |
| Region Active Effects | Enter/exit effect lifetimes and event-specific add/remove/enable/disable/reset operations, including system-specific adaptations. | Pairing and cleanup are essential composition stages; “on enter” without a matching exit/reset plan can leave state behind. |
| Lock & Key | A dedicated inventory key to Door/container workflow and lock interactions. | Item-gated doors have established demand and a specialist alternative. Regionwright can compose an item gate with puzzle/Region progression, but should not assume it can replace every system's item UX. |

Foundry's module guidance also warns that too many or outdated modules can cause instability. Optional integrations therefore need graceful fallback and explicit support status.

## First-pass stages for the wizard and script catalog

This is a brainstorming taxonomy to refine together, not an approved specification. A single script may participate in more than one stage, but its role and inputs/outputs should be declared.

| Stage | User-facing question | Candidate script roles | Important requirements |
| --- | --- | --- | --- |
| 1. Start / trigger | “What starts this?” | Walks into Region; exits; clicks/uses; turn/round; behavior activated | Exact event semantics; core vs module event; once/repeat; re-entry rule. |
| 2. Who / context | “Who is this for?” | Entering token; player character; selected actor; item owner; all eligible tokens | Token/user identity; ownership; multiple simultaneous tokens; GM/player audience. |
| 3. Tell / present | “What should they see or hear?” | Scrolling text; prompt; journal; sound/visual cue | Visibility; timing; local vs public; continue immediately or wait for response. |
| 4. Ask / interact | “What can the player do?” | Click item; present item; choose option; solve a puzzle; make a check | Input event, timeout/cancel, retry, accessibility, supported system/module. |
| 5. Require / decide | “What counts as success?” | Has item; correct item used; check passes; puzzle completes; all/any requirements | Exact condition; item identity vs name; consume or retain; pass/fail outputs. |
| 6. Change / outcome | “What happens next?” | Unlock Door; activate Region; reveal/open/toggle a supported target; emit a completion result | Explicit target and current state; allowed outcome; active-GM authority when needed; duplicate protection. |
| 7. Connect / route | “Which Region follows?” | Continue to one Region; choose among several; return link; cross-Scene route | Directionality; map highlight; target Region/Scene; landing/loop policy; number/cardinality supported by this script. |
| 8. Remember / recover | “How does it repeat or reset?” | Once; repeat; cooldown; counter; stage state; reset/disable/cleanup | State owner; idempotence; dependencies between derived progress; safe reset and repair. |
| 9. Review / test / publish | “Does this whole chain do what I expect?” | Wizard validation, preview, player/GM test, trace, publish/undo | Missing/incompatible scripts; stale links; proposed effects; actual actor/event context; recovery path. |

The wizard can make stages appear only when needed, but should preserve a readable ordered storyboard. Script setup order should be visible and reorderable only when the compatibility contract allows it.

## Candidate script families to sort into that stage catalog

This is a broad candidate inventory from core Foundry, the reviewed modules, community examples, and Regionwright's own work. Inclusion means “worth evaluating,” not “promised for Studio.”

| Script family | Examples | Likely stage(s) | Compatibility questions to record |
| --- | --- | --- | --- |
| Region selection and linking | Select/draw Region; connect an existing Region; create return link; select next Region | Placement; Connect / route | Does one script own one endpoint, a pair, or a group? Same Scene or cross-Scene? Does linking teleport, activate, or merely continue a sequence? |
| Spatial/event triggers | Token walks in/out; moves within; appears inside; starts turn/round; behavior activates | Start / trigger | Core event or optional event? Does a boundary edit or token creation count? Re-entry/once behavior? |
| Explicit interaction triggers | Click Region/lever; Door interaction; use/present an item | Ask / interact | Core or provider module? Which user's click? Is an inventory item use event exposed by the active game system? |
| Actor/token selectors | Triggering Token; player character; NPC; token owner; selected Actor; all Tokens currently inside | Who / context | Is the identity the initiating token, selected token, token owner, or every occupant? Can multiple users trigger at once? |
| Story and feedback | Scrolling text; message/dialog; player choice; Journal/page; sound/music; visual effect; ping | Tell / present | Is it private or public? Does it finish immediately or wait for player input? Which optional presentation modules are required? |
| Item gates and inventory actions | Has item; choose/present item; use item; consume item; give/remove item | Ask; Require / decide; Change | Name match or stable item identity? Quantity? Consume when attempted or only on success? Actor inventory owner? System/module dependency? |
| Checks and simple conditions | Skill/save/roll; Door/behavior state; item/effect/status; all/any/none; chance | Require / decide | Which game system provides the roll? Who rolls? What are success/failure/cancel outputs? Can conditions be tested without changing state? |
| Puzzle and lock challenges | Tumbler, rotation, mirror/laser, timing, mixing, mosaic; future sequence/riddle challenges | Ask; Require / decide | Is it a player-facing game or passive check? What outputs and reset states exist? Project boundary: puzzle/trap success unlocks a Door or activates a Region. |
| Door and Region outcomes | Unlock/open Door; activate/deactivate/toggle linked Region; trigger a defined next step | Change / outcome; Connect | Target must be selected and visible; current state and allowed transition; one vs many targets; active-GM authority; duplicate prevention. |
| Core environment and movement | Darkness, weather, surface, movement cost, elevation/level, teleport | Change / outcome; Connect | Native Behavior/version available? Does entry, exit, or ongoing presence apply? Landing and loop rules? Region shapes share their Behaviors. |
| Stateful progression | Once/repeat; cooldown; counter; ordered stage; all-required group; cooperative/same-round group | Remember / recover | Is state scoped per token, Actor, Region, Scene, party, or world? What dependent state must reset together? |
| Cleanup and recovery | Remove effect on exit; re-arm trap/puzzle; restore Door/Region; disable/remove only owned configuration | Remember / recover | Is cleanup paired and idempotent? What happens after interrupted/partial execution or missing target? |
| Test and diagnostics | Preview, player/GM test, trace, link health, repair stale reference | Review / test / publish | Can the test be no-write? Does it show the actual triggering token and each branch? Can the user safely undo/reset? |

This inventory intentionally separates script family from its stage. For example, an item script could be an optional interaction input, a passive condition, or an outcome that consumes an item; those versions have different inputs and compatibility.

## Example composition to use as a design test

```text
Token enters Threshold Region
  → show the configured entry text
  → wait for the player to choose/use an item from inventory
  → validate the selected item (and optionally consume it)
  → on success, unlock Door or activate the connected Region
  → on failure/cancel, show the configured response and keep/reset state
```

This separates three things that are easy to blur: a Region-entry trigger, a non-blocking presentation action, and an item-use interaction that returns success/failure/cancel. Foundry's native scrolling-text Behavior can display text, but it is not itself an item-use input or a “wait for player” node. To promise this flow, Studio needs explicit continuation/wait/branch semantics and a compatible item-interaction provider. Passive inventory possession is not equivalent to clicking or presenting an item.

## Compatibility dimensions to catalogue

Each script card should eventually declare:

- **Stage and control shape:** trigger, display, wait/input, condition, action, connection, cleanup; terminal, continue, wait, branch, or parallel.
- **Accepted inputs and emitted outcomes:** for example `RegionEnter<Token>` → `ItemPresented<Item,Token>` → `success | wrong-item | cancelled`.
- **Composition rules:** may follow, must precede, requires, excludes, or may run alongside named script types; whether it shares the same Region/trigger/token.
- **Target kinds and cardinality:** no target, one Door, one Region, one-to-many destinations, or paired return Regions; same/cross-Scene support.
- **Who and when:** event semantics, token/user filters, execution audience, and whether the interaction is GM-authoritative.
- **Lifecycle:** once/repeat/cooldown, persisted state, failure/retry, disable, remove, reset, and recovery behavior.
- **Compatibility:** minimum/verified Foundry version, game-system requirements, optional-module IDs and versions, missing-dependency behavior, and evidence level.

For a first compatibility pass, use relationship labels rather than pretending all scripts are compatible:

- **Compatible in sequence** — prior output satisfies the next script's required input.
- **Compatible in parallel** — both observe the same trigger without consuming/altering each other's input.
- **Requires** — the named provider or earlier state must exist.
- **Exclusive** — conflicting trigger, target write, or state ownership; choose one.
- **Conditionally compatible** — allowed only with a stated event, target, system, or ordering constraint.
- **Unsupported** — explain why and offer a safe alternative.

## How many Regions can be linked?

No numeric cap is justified by the sources reviewed. Foundry supports Regions as teleport targets across Scenes, and the ecosystem demonstrates pairs, multi-level routes, and randomized destination patterns. That establishes demand for different topologies, not a safe maximum.

Catalog the topology per script/connection instead:

- one-way pair and optional return pair;
- ordered chain;
- one-to-many branch;
- many-to-one convergence/hub;
- loop/cycle with an explicit stopping rule;
- shared destination or group/choice route;
- same-Scene versus cross-Scene.

Studio should show the count and edges, validate direction and return behavior, detect unintended cycles, and warn when a flow becomes hard to follow. A runtime/performance ceiling can be set after testing; it should not be confused with the number a GM is allowed to connect.

## What Regionwright already contributes

### Reusable puzzle games in the current source

The current code-defined standalone catalog contains six games, not a separate generic JSON puzzle database:

| Current game | Reusable interaction pattern | Current target evidence |
| --- | --- | --- |
| Tumbler Lock | Pick/tension skill-style lock interaction | Door |
| Rotation Lock | Angular alignment and controlled progression | Door |
| Mirror Redirect (Laser Grid) | Spatial route/reflection puzzle | Door |
| Timing Dial | Timed, multi-step precision | Door |
| Ingredient Mixing | Multi-input recipe/tolerance puzzle | Door, Tile, or Region |
| Spine Mosaic | Ordered-symbol/permutation puzzle | Door, Tile, or Region |

These span different challenge interfaces but currently return a completion outcome against selected targets. This is useful for defining a common “challenge completed” output and for identifying which target types each game can support; it does not imply all games are interchangeable in every Region chain. Source inventory is in [Puzzles & Locks module plan](PUZZLES_LOCKS_MODULE_PLAN.md) and modules/regionwright-puzzles-locks/.

### Knowledge database patterns

The workspace database `database/regionwright_primary_knowledge.sqlite` is a structured knowledge base, not a reusable script catalog. Its campaign-specific Ascendancy records provide patterns worth generalizing—personal puzzle gates, cooperative stages, and a multi-station same-round activation finale—while explicitly keeping those campaign IDs, topology, and ownership out of the general catalog. It also records a concrete partial-reset failure where derived pair/co-op/final progress remained stale after one puzzle reset. The reusable lesson is to model dependency-aware state and reset, not to copy campaign content.

Other local documents contain broad capability and architecture research, especially [Community Region research](COMMUNITY_REGION_RESEARCH.md) and the current [Studio module plan](STUDIO_MODULE_PLAN.md). The earlier Studio feature plan is archived; its blueprint and capability ideas remain research inputs, not active product rules.

## Recommendations for the next brainstorming pass

1. Agree on the plain-language stage names and decide which stages are required versus optional.
2. Classify a small starter set—entry text, item present/use, puzzle challenge, Door unlock, Region activation, and reset—against the compatibility labels above.
3. Decide what “inject” means in product language and stored data. Prefer selecting/registering validated behavior modules with declared inputs/outputs over arbitrary executable code in the normal wizard.
4. Define the Region-link button as a discrete selection step: enter map-pick mode, highlight valid Regions, show `source → destination`, and announce which Region the wizard will edit next.
5. Test one small chain, one branch, one cross-Scene link, and one resettable cooperative sequence before deciding any practical region-count cap.
6. Choose supported Foundry/system versions and decide how optional dependencies are represented before declaring scripts compatible.

## Follow-up evidence audit — 2026-10-05

This pass rechecked current Foundry documentation and package listings, then added newer and more specific community examples. It sharpens the evidence grades; it does not turn qualitative posts into a representative survey.

### What the additional evidence changes

1. **Region linking is a verified friction point, but some low-level friction is already being addressed.** Foundry issue [#11467](https://github.com/foundryvtt/foundryvtt/issues/11467) explicitly requested drag-and-drop linking to avoid copying Region/Behavior UUIDs, and Foundry completed that work for v13. [Easy Regions](https://foundryvtt.com/packages/easy-regions) adds searchable UUID selectors and automatic paired teleport linking. A September 2026 [Quick Teleporters announcement](https://www.reddit.com/r/FoundryVTT/comments/1waxrpu/quick_teleporters_free_system_agnostic/) described automatic Region pairing and received 166 upvotes at the time of review. This is the strongest recent interest signal found, but it is one release post—not a representative poll. Studio should compete on the complete map-pick-to-configure workflow, not claim UUID copy/paste remains universally unsolved.

2. **Connected routes and interactive maps are distinct jobs.** A 2025 [interactive-map request](https://www.reddit.com/r/FoundryVTT/comments/1lljte4/) asks for clickable map areas that navigate to another Scene and return links. Foundry's own Region guide describes teleport destinations as UUID-linked landing Regions and supports cross-Scene targets. These sources justify researching one-way, paired-return, and cross-Scene routing; they do not establish a universal maximum number of linked Regions.

3. **Users are already trying to build ordered puzzle/door and trap interactions.** A March 2026 [four-door puzzle help thread](https://www.reddit.com/r/FoundryVTT/comments/1rva770/) describes checking a particular combination of open/closed Doors before opening a fifth. A recent [trapped-door question](https://www.reddit.com/r/FoundryVTT/comments/1vvczdk/) asks for a clear click → pause → saving throw → damage flow. A [MATT setup-help thread](https://www.reddit.com/r/FoundryVTT/comments/1j3pdqo/) shows a user asking for help with trigger/action configuration and a community answer breaking the setup into trigger, target selection, scene change, and journal steps. These are concrete workflows and usability signals, not proof of broad prevalence. The trapped-door damage outcome also exceeds Regionwright's agreed boundary: Studio traps are activation games that resolve to Door unlock or Region activation, not autonomous damage hazards.

4. **Ordered flow is now a competitive baseline, not a presumed differentiator.** The current [Glyph package page](https://foundryvtt.com/packages/glyph) advertises sequences, branches, loops, calls, delays, module-registered actions, MATT import, and more than 20 recipes; it is verified for Foundry v14. [MATT](https://foundryvtt.com/packages/monks-active-tiles) already offers multiple ordered actions, trigger filters, token restrictions, and a broad action set. Therefore, modular scripts in an order alone are unlikely to distinguish Studio. The stronger product hypothesis is the wizard that builds/configures the chosen sequence in order, keeps the next Region handoff explicit, explains compatibility, and guides testing/recovery. That hypothesis still needs usability testing.

5. **Wizard injection order must not be mistaken for runtime order.** Foundry documents that Behavior rows in a Region sheet are sorted alphabetically by name. The native documentation also describes multiple Behaviors per Region and distinct event subscriptions; token-enter events can occur through movement, token creation, geometry changes, or enabling a Behavior while a token is inside. Consequently, the order in which Studio injects/configures Behaviors is not, by itself, a guarantee of the order in which a player experiences them. The product will need to distinguish setup order from explicit runtime continuation/wait/branch semantics.

6. **Scope and authority need first-class catalog fields.** Community reports include scripts firing on every connected client and duplicating checks/messages ([PF2e Region script example](https://www.reddit.com/r/FoundryVTT/comments/1f5qjlz/)), and users ask how to restrict a behavior to selected token types ([token-scope question](https://www.reddit.com/r/FoundryVTT/comments/1l28ufc/)). Record triggering token, eligible actors, user audience, and who performs world-changing writes. These reports are anecdotes, but the failure modes are concrete and should inform the compatibility contract.

### Catalog implications from the current ecosystem

The source scan supports a broad **candidate** action inventory: event triggers; actor/token filters; text, journal, audio, and visual presentation; item checks/presentation/consumption; checks and conditional branches; Door/Wall state; Region activation and teleport routing; token visibility/movement/elevation; effects/statuses; counters, delays, once/repeat, reset, and diagnostics. The inventory is not a list of promised Regionwright features. Package pages establish that capabilities exist in the ecosystem, not that users rank them equally highly or that every capability belongs in Studio.

For the next classification pass, label evidence and compatibility separately:

- **Demand evidence:** direct request; repeated independent requests; high-engagement discussion; or merely an available feature/workaround.
- **Composition relation:** compatible in sequence; compatible in parallel; requires a provider/output; exclusive; conditional on context/version; unsupported.
- **Target cardinality:** none; one Door; one Region; paired Regions; one-to-many choice; many-to-one; or group/cycle with an explicit stop rule.
- **Runtime contract:** triggering event/token/user, expected input/output, blocking or waiting behavior, authority for writes, dependency versions, and failure/reset handling.

### Evidence limits and prioritization

- Strongest direct signals: Region-reference/link setup friction; the desire for map-first/cross-Scene links; and requests for complete item/door/puzzle/trap interactions without hand-wiring many screens.
- Strongest technical constraints: native Region events are more nuanced than “walked in”; Region Behaviors are displayed alphabetically; system/module providers determine some click, item, save, and effect capabilities; and writes may need an authorized GM route.
- Exploratory catalog material: environment, ambience, status effects, visibility, combat/spawn actions, and rich VFX are present in adjacent modules and examples. Research demand for each before ranking it for Studio.
- Sparse or missing evidence: a defensible global Region-count limit; measured preference for wizard versus graph authoring; community consensus on one shared script catalog; and demand for Regionwright's exact trap-as-unlock/activation-game boundary.

Treat those last items as open research questions. The local knowledge database and current six-game puzzle catalog are useful design inputs, but the database's campaign progressions are authored project data—not independent Foundry-community demand evidence.

## Sources

### Foundry documentation and feature requests

- [Scene Regions](https://foundryvtt.com/article/scene-regions/) — multiple Behaviors per Region, shapes, event semantics, native Behavior descriptions, and cross-Scene teleport.
- [Foundry v14 Region Behaviors API](https://foundryvtt.com/api/v14/modules/foundry.data.regionBehaviors.html) — current native registered Behavior types.
- [Foundry module management guidance](https://foundryvtt.com/article/modules/) — compatibility warnings and module-conflict troubleshooting.
- [Foundry issue #11467](https://github.com/foundryvtt/foundryvtt/issues/11467) — user request to simplify Region/Behavior UUID linking; completed for v13.

### Current module capabilities

- [Glyph: Active Region Triggers](https://foundryvtt.com/packages/glyph)
- [Monk's Active Tile Triggers](https://foundryvtt.com/packages/monks-active-tiles)
- [Enhanced Region Behavior](https://foundryvtt.com/packages/enhanced-region-behavior)
- [Region Behaviour Adjustments](https://foundryvtt.com/packages/regionba)
- [Easy Regions](https://foundryvtt.com/packages/easy-regions)
- [Region Active Effects](https://foundryvtt.com/packages/region-active-effects)
- [Lock & Key](https://foundryvtt.com/packages/locknkey)

### Community discussions and examples

- [Quick Teleporters community announcement](https://www.reddit.com/r/FoundryVTT/comments/1waxrpu/quick_teleporters_free_system_agnostic/) — automated pairing, names, and map-first setup; early engagement only.
- [Help with trapped doors](https://www.reddit.com/r/FoundryVTT/comments/1vvczdk/help_with_trapped_doors/) — novice asks for an understandable click → check → outcome flow without code.
- [MATT setup confusion](https://www.reddit.com/r/FoundryVTT/comments/1k3ymy4/cant_seem_to_get_monks_active_tiles_to_work/) — trouble locating trigger configuration and uncertainty about macro/action setup.
- [Inventory item filter troubleshooting](https://www.reddit.com/r/FoundryVTT/comments/138wpf5/detecting_item_in_inventory_using_monks_active_tiles/) — key/item gate, item consumption, and condition-routing example.
- [Region behavior token scope](https://www.reddit.com/r/FoundryVTT/comments/1l28ufc/applying_region_behaviors_to_certain_tokens_v12/) — request to limit a Region's behavior to selected tokens.
- [Duplicate Region script execution](https://www.reddit.com/r/FoundryVTT/comments/1f5qjlz/pf2e_foundry_region_behavior_script/) — event script runs on connected clients, causing duplicate output without audience control.
- [Region trigger and wall movement issue](https://www.reddit.com/r/FoundryVTT/comments/1oftqg2/v13dnd5e_possibly_bugged_region_trigger/) — reports version-sensitive interaction between Region entry/elevation and wall movement.
