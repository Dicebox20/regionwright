# Community Region research and finished-product capability map

Research date: 2026-08-01

This research looks at public community examples, Macro guides, Reddit problem-solving threads, Foundry package listings, and feature requests. It is intended to show the full capability space of a finished Regionwright, not to imply that every capability belongs in the first release.

## Executive synthesis

The community is using Regions as five things at once:

1. **Environmental volumes:** darkness, weather, terrain, movement, surfaces, elevation, sound, and visual atmosphere.
2. **Navigation and spatial logic:** stairs, portals, level changes, map-to-map travel, hidden routes, random teleport mazes, and scene focus.
3. **Gameplay triggers:** traps, saves, damage, conditions, Active Effects, item exchange, doors, walls, visibility, combatants, and movement control.
4. **Presentation layers:** messages, journals, character sheets, music, sound effects, visual effects, pings, camera focus, and fog-of-war changes.
5. **Stateful orchestration:** pressure plates, toggled behaviors, delays, cooldowns, conditional branches, counters, multi-lock puzzles, and encounter controllers.

The recurring community pain is not a lack of imaginative use cases. It is the difficulty of authoring and safely connecting them. Users repeatedly struggle with UUID fields, event context, client duplication, permissions, Region behavior enable/disable, click interactions, and cross-Scene links. The module should therefore be both an effect builder and a reference/state-management tool.

## What the community is already doing

### Native environment and movement

Community users build dark interiors, weather-protected areas, difficult terrain, stairways, level transitions, and surfaces with core Region Behaviors. Terrain Mapper extends the idea to plateaus, ramps, steps, elevation-aware movement, and region drawing from grids, lines of sight, or enclosed walls. Zone Movement uses Regions marked with Modify Movement Cost as a zone-based movement system.

Product implication: the finished module needs a strong native capability catalog, system-aware movement options, elevation and surface awareness, and clear handling of overlaps. It should not force a Macro when the active runtime already provides the effect.

### Teleportation and map navigation

Users use linked Regions for stairways, portals, open-world travel, nested maps, scene-to-scene travel, and multi-level buildings. Other users want randomized destinations for puzzle mazes or a choice dialog at a teleporter. Community examples also combine teleport with a Macro to reset fog, close notifications, focus the map, or alter the destination experience.

Product implication: linked Regions, destination selection, one-way/bidirectional links, random destination groups, player choice, cross-Scene validation, landing policy, and loop protection belong in the long-term capability map. They should remain separate adapters because teleport is high-risk.

### Traps and hazards

A common community pattern is a Region with Execute Script on Token Enters, retrieving `event.data.token` and its Actor, then rolling a chance, saving throw, or damage effect. Enhanced Region Behavior packages this pattern into Trap Regions with save ability, DC, damage on failure/success, damage type, messages, and disable-after-trigger.

Product implication: a finished module should support a declarative trap recipe with eligible-token filters, detection chance, save, damage, condition, message, once-only behavior, disable/reset, and optional MidiQOL routing. The core should remain system-agnostic; D&D5e, PF2e, and other systems need adapters.

### Active Effects and statuses

Region Active Effects demonstrates a highly reusable enter/exit pattern: add an Active Effect while a Token is inside and remove or disable it on exit. Its advanced form adds, resets, enables, disables, or deletes effects on specific Region events, including turn and round events. Community use cases include cursed zones, buffs, hazards, duration refreshes, and status changes.

Product implication: effect lifetime is a first-class concept. The builder needs enter/exit pairing, add/remove versus enable/disable choice, duration policy, combat timing, duplicate prevention, and cleanup ownership.

### Door, wall, visibility, item, and combat changes

Region Behaviour Adjustments adds community-requested actions for changing door state, changing walls, changing visibility of Tokens/Tiles/Doors, changing movement type, preventing movement, giving or taking items, rolling tables, moving Tokens, pinging, playing sounds, and adding combatants. Lock & Key connects doors and lockable Tokens to keys, pick attempts, break attempts, passwords, item consumption, and MATT triggers.

Product implication: these are valuable adapters, but they are not all native core behavior. Each needs explicit document selection, current-state preview, permission routing, system/module dependency checks, and reset behavior.

### Presentation and local interaction

Community Macro examples open the triggering player's character sheet, an Actor sheet, a Journal or Journal page, or a Scene. Enhanced Region Behavior adds music, sound, visual effects, elevation, open journals, and a custom region-clicked event. Other requests ask for clickable Regions that open journals, reveal map information, or act as world-map navigation controls.

Product implication: the finished module should support local versus global presentation, player versus GM visibility, click versus movement activation, scene/view focus, and journal/map handoffs. A click trigger should be treated as a capability supplied by a module or system unless the active runtime proves it natively.

### Authoring and management tools

Easy Regions focuses on UUID discovery, searchable UUID pickers, automatic teleport pairing by naming convention, Region icons, and highlighting Regions without behaviors. Region Enchantment and a Foundry core issue show demand for drag-and-drop links from the Region Legend into Teleport and Toggle Behavior UUID fields. Indy Regions and Terrain Mapper show demand for painting, flood fill, additive/subtractive editing, smoothing, holes, and geometry generation from map structure.

Product implication: authoring UX is not secondary. The finished builder should offer canvas capture, searchable document pickers, drag/drop references, link health, bulk editing, presets, naming conventions, and visual diagnostics without silently guessing targets.

## Finished-product capability map

### A. Authoring and geometry

The finished module should be able to:

- create or configure Regions from canvas selection;
- select one or many Regions in an ordered injection list;
- edit rectangles, ellipses, polygons, circles, cones, rays, grids, holes, elevation ranges, and wall-constrained shapes when the runtime supports them;
- provide optional paint, flood-fill, smoothing, shrink/grow, and erase tools through a dedicated geometry adapter;
- attach Regions to Tokens when supported;
- create region-powered temporary templates or area-of-effect recipes;
- show Region names, colors, visibility, elevation, lock state, behavior count, and link health;
- bulk apply, update, disable, enable, duplicate, reset, and remove only module-owned behaviors.

### B. Reference and connection management

- searchable pickers for Region, Region Behavior, Macro, Scene, Token, Tile, Wall, Door, Actor, Item, Journal, Playlist, Roll Table, and Active Effect;
- drag-and-drop UUID links where Foundry supports them;
- exact UUID capture from the active world and Scene;
- same-Scene and cross-Scene link validation;
- automatic pairing by explicit naming convention, opt-in only;
- one-way, bidirectional, ordered, grouped, and user-authored links;
- stale-reference detection and repair suggestions;
- link graph view showing sources, destinations, toggled behaviors, and dependency edges.

### C. Trigger and condition engine

The builder should expose the event model without hiding its semantics:

- Region and Behavior activated/deactivated;
- Region viewed/unviewed;
- Token enters/exits;
- Token moves in/out/within;
- Token animates in/out;
- Token starts/ends turn;
- Token starts/ends round;
- module-provided click or interaction events;
- system/module-provided events when capability-detected.

Conditions should include:

- player character only, NPC only, GM-controlled, player-controlled, token owner, or explicit Token/Actor filter;
- item/key/effect/status possession;
- door or behavior state;
- elevation, movement type, scene/level, visibility, and combat state;
- chance/roll table;
- all/any/none logic;
- once, cooldown, delay, duration, and reset conditions;
- active-GM or triggering-client execution policy.

### D. Native Region effects

First-class native compiler targets should include:

- Adjust Darkness Level;
- Suppress Weather;
- Modify Movement Cost;
- Define Surface;
- Apply Active Effect;
- Display Scrolling Text;
- Pause Game;
- Teleport Token;
- Change Level;
- Toggle Behavior;
- Execute Macro and Execute Script only as explicit reviewed escape hatches.

Each target needs a version-matched schema adapter, parameter form, event form, preview, runtime capability check, and live evidence status.

### E. Navigation and spatial movement

- same-Scene teleport;
- cross-Scene teleport;
- Scene Level changes;
- destination Region landing zones;
- destination coordinate or position adapters where supported;
- player confirmation or GM-only routing;
- random destination groups;
- ordered destination cycles;
- conditional destinations;
- token elevation and movement-type changes;
- prevent movement, stop movement, slide, push, pull, and move-relative-to-region adapters;
- scene activation/viewing, camera focus, zoom, and transition presentation;
- fog-of-war reset or focus as an optional explicitly labeled adapter.

Teleport and movement must have re-entry protection, loop detection, landing validation, token-size checks, and multi-Scene permission handling.

### F. Gameplay actions

- reveal, hide, show, or toggle selected Tokens, Tiles, Doors, and other supported Placeables;
- open, close, lock, unlock, or toggle selected doors;
- modify selected Wall movement, sight, light, and sound settings;
- spawn or remove selected Token templates;
- add or remove Combatants;
- give, remove, set, or consume Items;
- apply, remove, enable, disable, reset, or delete Active Effects;
- apply, remove, or toggle system status conditions;
- open Actor sheets, character sheets, Journals, Journal pages, Scenes, Roll Tables, and playlists;
- roll a selected Roll Table;
- ping positions or selected Tokens;
- issue a notification, chat message, scrolling text, pause, prompt, or player choice.

Every action must be an explicit adapter with target selection and current-state evidence. “Find everything nearby and change it” should not be a default capability.

### G. Hazards, checks, and combat

- trap detection chance;
- ability checks and saving throws;
- damage on failure and success;
- damage type and resistance/immuity-aware system routing;
- condition and Active Effect riders;
- failure/success chat messages;
- disable after trigger;
- trap reset;
- combat encounter creation or combatant addition;
- combat turn/round timers;
- shield, repair, resource, legendary action, and phase state;
- encounter controller startup, duplicate prevention, and restart recovery.

The first version should expose simple trap recipes. Encounter controllers are a later declarative state-machine layer.

### H. Audio, visual, and environmental presentation

- scrolling text with color and visibility;
- localized music, playlist start/stop, crossfade, and region ambience;
- one-shot and looping sound effects;
- sound radius, position, volume, easing, and wall interaction;
- suppress, mute, or muffle scene/weather sounds;
- static images, animations, particles, shader or Sequencer effects;
- effect duration, persistence, layer, scale, and token-location playback;
- screen shake, pings, camera motion, and transition effects;
- footsteps and surface-based sound;
- localized weather, fog, fire, smoke, water, lava, electricity, and acid presentation;
- separation of visual/audio failure from mechanic failure.

These should be optional integration adapters and must not make core mechanic correctness depend on a presentation module.

### I. Puzzle and state orchestration

- all-required and any-required conditions;
- ordered sequences;
- counters and threshold conditions;
- timed windows and delayed consequences;
- mutually exclusive active Regions;
- resettable four-lock and multi-switch puzzles;
- hidden behavior activation after discovery;
- random or cyclical destinations;
- state variables stored in module-owned structured flags;
- visible state inspector, reset, repair, and audit history;
- reusable presets for pressure plates, secret doors, elevators, locks, portals, and encounter phases.

The state engine should remain bounded and inspectable. It should not become a free-form visual programming language until the simpler forms are proven.

### J. System and module integrations

The finished module should use a capability registry rather than hard-code every ecosystem feature:

- D&D5e traps, saves, damage, conditions, and MidiQOL workflows;
- PF2e conditions, effects, saves, and system-specific actions;
- Active Effects and Region Active Effects patterns;
- Sequencer and animation/audio integrations;
- Monk's Active Tile Triggers as an optional world-action route;
- Region Behaviour Adjustments;
- Enhanced Region Behavior;
- Easy Regions and geometry/UUID helpers;
- Terrain Mapper and elevation systems;
- Levels, Token Attacher, Lock & Key, Tagger, and related integrations;
- future system/module Region Behaviors and Events discovered from runtime registration.

Every integration needs version, dependency, permission, and evidence status. The native path remains valid when an optional module is missing.

### K. Reliability, safety, and portability

- GM-only or explicit user ownership policy;
- active-GM or triggering-client execution routing;
- duplicate execution prevention across connected clients;
- idempotent apply/update/reset;
- loop and recursion protection;
- stale UUID and deleted-document repair;
- snapshot/rollback for multi-document changes;
- preview of source, target, event, condition, action, state, reset, dependencies, and affected users;
- audit log of created, updated, disabled, enabled, deleted, and rolled-back documents;
- world export/import with reference repair;
- compatibility warnings and capability snapshots;
- diagnostics that redact credentials and unnecessary world data;
- no arbitrary generated code in the normal builder path.

## Recommended finished-product tiers

### Tier 1 - Core product

- native behavior builder;
- event and condition picker;
- explicit UUID/document picker;
- preview, approval, apply, reset, and reconciliation;
- scrolling text, pause, darkness, weather, movement, surface, Active Effect, teleport, level, and toggle behaviors;
- simple Token/Tile visibility and Wall-door adapters;
- one-shot, repeat, disabled, once-only, and reset behavior;
- diagnostics and link health.

### Tier 2 - High-value community coverage

- trap recipes;
- enter/exit Active Effects and status effects;
- journal, Actor sheet, Scene, playlist, sound, visual effect, and ping actions;
- elevation and movement-type adapters;
- item give/take, roll tables, combatant creation;
- click/interaction events where available;
- drag/drop and searchable reference workflows;
- presets for stairs, portals, pressure plates, secret doors, and environmental zones.

### Tier 3 - Advanced orchestration

- conditional triggers, AND/OR logic, delays, cooldowns, counters, sequences, cycles, random destinations, and puzzle state;
- cross-Scene navigation and scene presentation;
- system-specific trap and combat workflows;
- optional MATT, MidiQOL, Sequencer, Levels, Terrain Mapper, Lock & Key, and Tagger integrations;
- state inspector, repair, migration, and reusable recipe export/import.

### Tier 4 - Specialist and future-facing

- complex encounter controllers;
- localized weather and environmental simulation;
- shader/particle/screen effects;
- map-scale campaign navigation and world-map interaction;
- advanced geometry painting and terrain compilation;
- composable custom Behavior and Event APIs for other modules.

## Product boundary revealed by the research

The finished module should not try to replace every specialist module. Its central value should be:

```text
discover capability -> select explicit references -> compose a reviewed recipe
-> preview affected state -> apply safely -> observe -> reset or repair
```

Specialist features should enter through a capability registry and adapters. That lets the builder be the reliable authoring, validation, state, and safety layer while remaining useful when users have only core Foundry enabled.

## Community lessons that affect implementation

- Macro and Script behaviors have different execution and permission behavior. Script examples often need an early return so every connected client does not perform the same write.
- Region-triggered code should use the triggering event Token, usually `event.data.token`, rather than `canvas.tokens.controlled`.
- User requests repeatedly expose the cost of manually copying UUIDs. Pickers, drag/drop, and link health are high-value features.
- Token entry is not the same as click interaction. Click events need a separate capability.
- World writes such as Tiles, Walls, Playlists, and Scene activation frequently require an active GM route.
- Cross-Scene teleport and imported adventure content are vulnerable to stale IDs and broken links, so link repair and migration are core product concerns.
- Community code examples are useful intent evidence, not production-safe code. They should be rewritten into validated adapters with explicit permissions and target selection.

## Research sources

### Community guides and examples

- [GamerFlix Region Macros Guide](https://github.com/GamerFlix/foundryvtt-api-guide/blob/main/region_macros_guide.md) - Macro versus Script execution, event arguments, one-client/GM routing, sheets, Journals, Scenes, and elevation examples.
- [Baileywiki Ultimate Guide to Regions](https://baileywiki.com/videos/ultimate-guide-to-regions-in-foundry-vtt-including-new-modules) - community workflow covering Regions, Region Enchantment, Easy Regions, Region Active Effects, Terrain Mapper, Levels, MATT, and Token Attacher.
- [Foundry drag/drop UUID issue #11467](https://github.com/foundryvtt/foundryvtt/issues/11467) - user request for easier Region and Behavior linking.

### Community modules

- [Enhanced Region Behavior](https://foundryvtt.com/packages/enhanced-region-behavior) - traps, saves, damage, music, sound, visual effects, elevation, Journals, and click events.
- [Region Behaviour Adjustments](https://foundryvtt.com/packages/regionba) - door, wall, visibility, movement type, prevention, item, combatant, ping, sound, roll table, conditional, delay, and spawn behaviors.
- [Region Active Effects](https://foundryvtt.com/packages/region-active-effects) - enter/exit Active Effects and event-specific effect/status operations.
- [Easy Regions](https://foundryvtt.com/packages/easy-regions) - UUID pickers, teleport pairing, Region icons, and link-oriented authoring.
- [Region Enchantment](https://foundryvtt.com/packages/regionenchantment) - Region configuration and teleport-linking UX improvements.
- [Indy Regions](https://foundryvtt.com/packages/indy-regions) - paint, flood fill, additive/subtractive editing, smoothing, holes, and undo/redo.
- [Terrain Mapper](https://foundryvtt.com/packages/terrainmapper) - elevation-aware terrain and advanced region drawing.
- [Delayed Teleport Region](https://foundryvtt.com/packages/fvtt-delayed-teleport-region) - delayed teleport with countdown text.
- [Lock & Key](https://foundryvtt.com/packages/locknkey) - doors, tokens, keys, lockpicking, passwords, and MATT integration.

### Community discussion examples

- [Region trap with chance and damage](https://www.reddit.com/r/FoundryVTT/comments/1n7kuyb/help_with_traps/) - Execute Script, chance, Actor lookup, and damage-trap intent.
- [Region event Token access](https://www.reddit.com/r/FoundryVTT/comments/1gd49hx/regions_macros_and_targeting_token_the_entered_the_region/) - `event.data.token` as the triggering Token.
- [Region elevation on enter/exit](https://www.reddit.com/r/FoundryVTT/comments/1eobe42/system_agnostic_scene_regions_set_token_elevation/) - enter/exit elevation and avoiding all-controlled-token mistakes.
- [Region behavior enable/disable](https://www.reddit.com/r/FoundryVTT/comments/1gcl12s/enablingdisabling_a_regions_behaviors_is_there_a/) - hidden teleporter activation, behavior toggling, and state control.
- [Random teleport puzzle idea](https://www.reddit.com/r/FoundryVTT/comments/1p368vd/teleportation_module/) - cycling or random destinations for an Escher-style maze.
- [Scene-to-scene navigation](https://www.reddit.com/r/FoundryVTT/comments/1o7e5a2/is_there_a_way_to_make_a_clickable_element_that_moves_a_player_to_another_map/) - nested maps and clickable travel needs.
- [Fog reset after Region teleport](https://www.reddit.com/r/FoundryVTT/comments/1da5b5n/teleporting_and_resetting_fog_without_a_notification/) - teleport plus presentation/fog management.
- [Clickable Journal/map interactions](https://www.reddit.com/r/FoundryVTT/comments/1t45s59/triggering_a_journal_page_to_open/) - demand for click-triggered Region interactions.
