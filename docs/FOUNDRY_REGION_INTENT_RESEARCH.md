# Foundry Region Behavior intent research

Research date: 2026-08-01

This document separates what Foundry has shipped from what Foundry has explicitly described as a design goal. The official terms are **Scene Regions** and **Region Behaviors**. The project examples call them Region Behavior Effects; both refer to the same feature family here.

## Executive conclusion

Foundry intended Regions to be a general spatial-interaction framework: a named area of a Scene that can continuously affect the environment, react to token events, control traversal, represent an area of effect, and provide an extension point for macros, scripts, systems, and modules.

That is broader than “run a macro when a token enters.” Macros and scripts are the escape hatch. The product direction is a growing set of safe, reusable behaviors that make common environmental mechanics declarative and inspectable.

The priority implication for Regionwright is:

1. Make native Region Behaviors easy to choose, configure, preview, validate, and reconcile.
2. Add the small interaction primitives that turn a Region into an understandable Scene mechanic: feedback, pause, environment, movement, and traversal.
3. Add explicit target adapters for common world changes such as visibility and doors.
4. Add puzzle state and combat controllers only after the primitives have reliable reset, idempotency, and rollback behavior.

## What the original design was trying to solve

### 1. Give parts of a Scene meaning

Foundry's Scene Regions guide describes Regions as areas with meaning or behaviors: stairs, dark caves, magical portals, and traps. A Region can contain multiple shapes, elevation ranges, holes, and a shared set of behaviors. This makes a Region a spatial semantic object rather than just a drawing.

The first product question is therefore not “which Macro should run?” It is “what does this area mean, and for how long?”

### 2. Support both continuous effects and event reactions

Foundry's built-in examples divide naturally into two groups:

- **Continuous or passive environment:** adjust darkness, suppress weather, modify movement cost, and define a surface.
- **Event-driven interaction:** display scrolling text, pause the game, teleport a Token, change level, toggle another behavior, apply an Active Effect, or execute a Macro/Script.

The v12 release notes describe Behaviors as responding when a Token enters or exits a Region, or when a combat turn starts or ends. The model is therefore an event subscription plus an effect, with passive behaviors that do not need a discrete event.

### 3. Make common mechanics work without custom code

The v12 feature preview says Event Triggers were chosen by a community vote and were designed to lay groundwork for future Terrain and Cover work. Its examples were a pressure-plate trap that reveals a boulder, functional teleporters, and lights going out when an eldritch creature awakens.

That is strong evidence of the intended workflow:

```text
spatial condition -> selected event -> bounded behavior -> visible Scene consequence
```

The preview also explicitly calls for out-of-the-box presets, with macros and scripts available for customization. This argues for a declarative builder with an advanced escape hatch, not a tool whose main output is generated JavaScript.

### 4. Turn Regions into the general area-of-effect and template system

For v14, Foundry described Scene Regions v2 as a “workhorse component” for future goals. The geometry overhaul added better support for circles, cones, rays, grid and conventional measurement, elevation, wall constraints, and mouse interaction. Foundry also described moving away from the old Measured Templates layer toward specialized Scene Regions and behaviors.

The long-term object is consequently useful for both persistent map areas and temporary mechanically relevant shapes. Token attachment and region-powered measured templates in the v14 stable release reinforce this direction.

### 5. Leave room for systems and modules to extend the model

The Region Behavior API exposes a `RegionBehaviorType` data model that receives Region events and has references to the Region and Scene. The current v14 API includes behaviors for darkness, Active Effects, level changes, surfaces, scrolling text, movement cost, pausing, teleportation, toggling, and macro/script execution.

Foundry's own API is the extensibility boundary. A module should use the active runtime's registered behavior types and data models instead of assuming that every behavior exists in every system or version.

## Explicit developer wish list versus shipped behavior

The v14 Patreon feature vote is especially useful because it records desired direction rather than only released functionality. The proposed “Special Effect Regions” would provide animated environmental effects without changing illumination, including fire, smoke, fog, water, lava, electricity, and acid. It also mentions shader APIs, footstep sounds based on surface, particle emitters, localized ambient audio, Region-token visual interaction, and localized weather.

These are important signals, but they must be labeled as aspirations. They are not all core behaviors we should assume are available in a target Foundry build.

The safe distinction is:

| Evidence | What it means for this project |
| --- | --- |
| Shipped native behaviors and the v14 API | First-class compatibility targets |
| Official feature previews and release notes | Strong evidence of product direction |
| Patreon proposals | Future-facing ideas; optional adapters only until verified |
| MATT, Region Active Effects, and Enhanced Region Behavior | Ecosystem patterns and integration opportunities, not Foundry core guarantees |

## Prioritization derived from Foundry's intent

### P0 - Native behavior foundation

This is the most faithful first milestone and the lowest-risk path:

- Display Scrolling Text on token entry.
- Pause Game, including the GM/player distinction and once-only behavior.
- Suppress Weather.
- Adjust Darkness Level.
- Modify Movement Cost / difficult terrain when the active system registers it.
- Define Surface and Apply Active Effect when the active v14 runtime exposes and validates them.

Every behavior needs a trigger or passive mode, explicit parameters, runtime capability detection, preview, validation, reset semantics, and reconciliation of only module-owned data.

### P1 - Traversal and behavior orchestration

Next add the behaviors that make map navigation and traps composable:

- Teleport Token, same Scene first and cross-Scene only after explicit live tests.
- Change Level for Scene Levels.
- Toggle Behavior for pressure plates, one-shot traps, and “enable this after that” mechanics.

Teleport should include loop protection and clear destination evidence. Foundry's v12.321 notes even recorded a teleport-loop issue for linked Regions, so the module should not treat reciprocal links as harmless.

### P2 - Explicit world-target adapters

The shared Glass Eye example needs a selected target that changes in the Scene. Build these as narrow, reviewable adapters:

- reveal or hide one selected Token or Tile;
- open, close, or toggle one selected Wall door;
- optionally show a message or pause alongside the change.

These are not native Region Behaviors in the same way as darkness or weather. They should remain explicit target operations, with exact UUIDs captured from the active Scene, current-state evidence, idempotency, and reset. An optional MATT integration can broaden actions later, but MATT should not be an invisible required dependency.

### P3 - Shape, elevation, surface, and presentation tools

Once basic effects are dependable, expose the geometry capabilities that v14 emphasizes:

- cone, ray, circle, polygon, grid, and conventional measurements;
- elevation ranges, holes, and wall constraints;
- attaching Regions to Tokens;
- region-powered area-of-effect/template recipes;
- optional audiovisual adapters such as Sequencer, particles, screen shake, footsteps, and localized audio.

This is where the module can begin to serve both persistent environmental zones and temporary spell/ability areas without conflating them.

### P4 - Multi-Region puzzle state

Implement the four-lock example as a bounded condition set, not a general state-machine language:

```text
Region A complete + Region B complete + Region C complete + Region D complete
    -> reveal selected target or open selected door
```

State should be module-owned structured data with a visible reset. The first version should support all-required conditions and one final action. OR conditions, ordered sequences, timers, branching, and arbitrary counters can follow only when reset and rollback are proven.

### P5 - Encounter and combat controllers

The Autognome/turret example is a valid long-term target, but it belongs after the primitives above. Its requirements include combat lifecycle events, Active Effect timing, multiple Actors/Tokens, persistent flags, duplicate controller prevention, timers, repairs, legendary actions, and a primary-GM protocol. Model it as a bounded controller with explicit references; do not generate an opaque Script Macro as the default implementation.

## What this changes in the existing roadmap

The existing roadmap's order is sound, with one refinement: native `Toggle Behavior`, `Teleport Token`, `Change Level`, `Define Surface`, and `Apply Active Effect` should be treated as core-direction features when the active runtime exposes them. Reveal/hide and door actions remain important because they are required by the product examples, but they are explicit module adapters rather than evidence that arbitrary document mutation should be opened up.

The project should measure success by these outcomes:

- a GM can understand the spatial meaning of an effect before applying it;
- the effect uses a native behavior whenever Foundry provides one;
- the target, trigger, state, and reset are visible;
- repeated application is safe;
- a failed multi-document operation can be rolled back;
- unsupported system/version capabilities are surfaced instead of guessed;
- custom code remains an intentional, reviewed escape hatch.

## Primary official sources

- [Scene Regions](https://foundryvtt.com/article/scene-regions/) - user-facing model, built-in behaviors, shapes, triggers, and examples.
- [Version 12 Feature Preview](https://foundryvtt.com/article/v12-preview/) - Event Trigger rationale, pressure plates, teleporters, lights-out effects, and customization direction.
- [Release 12.317](https://foundryvtt.com/releases/12.317) and [Release 12.319](https://foundryvtt.com/releases/12.319) - community-voted Region framework and initial behavior/event model.
- [Release 12.321](https://foundryvtt.com/releases/12.321) - Teleport Token and Region behavior API details.
- [Release 14.349](https://foundryvtt.com/releases/14.349) - Scene Regions v2 geometry and “workhorse component” direction.
- [Release 14.359](https://foundryvtt.com/releases/14.359) - stable v14 Regions, Token attachment, and Template Regions.
- [Version 14 Patreon Feature Vote](https://foundryvtt.com/article/v14-patreon-vote/) - proposed Special Effect Regions and environmental audiovisual goals.
- [v14 Region Behavior API](https://foundryvtt.com/api/v14/modules/foundry.data.regionBehaviors.html) - current core behavior data models.
