# Regionwright: Studio module plan

Status: the three-module source split and standalone release packages are complete (2026-10-18). See [Module Strategy](EDITION_STRATEGY.md) for the current Foundry installation and runtime verification level.

Community signals, current ecosystem comparison, candidate setup stages, and a first compatibility taxonomy are in the [2026-10-05 Studio research brief](REGION_STUDIO_COMMUNITY_RESEARCH_2026-10-05.md).

## Studio scope

Regionwright: Studio uses the existing Foundry ID regionwright. It owns Region authoring, native behavior planning, Studio activities, traps, and campaign-specific Region automation. It remains usable when either companion module is absent.

Puzzles & Locks owns reusable lock and puzzle games and can be opened through Studio's optional public API bridge. Hunting & Gathering owns its own hunting, fishing, mining, resource catalog, item packs, and HUD. These products have independent source roots, manifests, settings, and release packages.

The puzzle-to-Door or puzzle-to-Region activation contract remains future composition work. The source split does not claim that a generic cross-module composition engine is finished.

## GM combat-tracker Scene follow

Roadmap request (2026-10-19): add an on/off toggle to the Combat Tracker menu that makes the GM's view follow the Scene containing the current combatant's token. It should work for both player-character and NPC combatants. When disabled, turn changes should not move the GM to another Scene.

During implementation, confirm how Foundry can change the GM's viewed Scene without changing the Scene shown to players. Combatants without a usable token or Scene should be skipped safely. This is a GM navigation convenience and does not change combat, token, or Region state.

## Product problem and goal

The current Region selection, wizard, and ease-of-use are working well. The setup process is too specialized and constrains what users can build. Studio should keep the wizard as a necessary guided path while adding modular composition, so users can follow a clear flow and still build beyond narrow, feature-specific recipes.

Users should be able to attach or inject compatible scripts into Regions, then connect Regions to one another using Studio to create larger experiences.

## Agreed product boundaries

- Preserve the existing regionwright package ID and saved-data compatibility.
- Studio is the place to select Regions, compose their behavior from compatible scripts, and connect Regions into larger experiences.
- Traps belong to Studio, but traps are activation games—not autonomous hazards—and are used exclusively to unlock Doors or activate Regions.
- Reusable puzzles and locks are owned by the separate Regionwright: Puzzles & Locks module. Studio reaches those games through the optional public API.
- Keep the currently effective Region selection, wizard, and ease-of-use. The wizard and modular composition are complementary paths; modularity should expand user freedom without requiring users to hand-author identifiers or code.

## Candidate composition model

This is a design model to evaluate, not a finalized technical specification:

1. The wizard guides users through a clear setup. Adding/injecting a script is a setup step; the order of added scripts matters, and later scripts may extend the prompts or behavior established by earlier ones.
2. Users select one or more Regions using the existing approachable selection workflow.
3. Users attach compatible behavior scripts to selected Regions and configure the options those scripts expose.
4. Users connect Regions so a defined outcome in one Region can lead to another Region becoming active or to a Door unlocking.
5. Studio presents a review of the composed behavior, reports compatibility problems, and makes activation/reset behavior understandable before changes are applied.

The visual representation could be a graph or another connected-flow UI; the current direction requires Region-to-Region composition, not a particular visual metaphor. Not every script must be compatible with every other script, so Studio will need compatibility and composition rules.

## Illustrative composition scenario

Not a finalized specification: a user first adds **“Scroll text when walking in”** and then **“Required item.”** The wizard lets them enter the text shown when a player enters the Region, then configure the item requirement; the player can click the relevant item in their inventory to activate or satisfy that requirement. This demonstrates how injection order can shape both the setup questions and the composed in-game flow. The exact trigger, item-use, and success semantics remain to be designed.

## Candidate script compatibility contract

Before implementation, define the minimum information a script must expose so Studio can safely list, configure, attach, connect, and remove it. Candidate fields include:

- supported host/module versions and required capabilities;
- eligible Region/document types and activation trigger;
- compatible or required scripts, including any ordering or composition constraints;
- configuration UI or schema and defaults;
- typed success outcomes that Studio may connect to an allowed target (Door unlock or Region activation);
- reset, disable, and removal behavior;
- permission authority and saved-state compatibility requirements.

These are planning prompts, not approved field names or API shapes. A script must not gain arbitrary world-editing authority merely by being attachable.

## Decisions to resolve with the product owner

- Can users order multiple scripts within one Region, or combine them in parallel?
- What exactly does “inject” mean in Foundry terms: persist configuration on the Region, install script code, or register a reusable behavior reference? Prefer preserving data/configuration rather than executing arbitrary injected code unless a reviewed technical design justifies otherwise.
- Are connections directed, conditional, reusable, or limited to one next Region?
- How do puzzle/trap game outcomes connect to Region activation and Door unlocking, and what are the reset/failure paths?
- Which module supplies and owns each script: Studio, Puzzles & Locks, or other compatible modules?
- How are missing modules, incompatible versions, invalid connections, and deleted Regions shown and repaired?
- Which current Builder concepts can be generalized, and which specialized setup paths should be retired?
- How should existing Region flags and trap configurations map into the modular model without breaking worlds?

## Next-stage acceptance criteria

Before broad composition implementation proceeds, the product owner and maintainers should agree on:

1. The core composition workflow, including how scripts attach to and leave Regions.
2. The compatibility and permission contract for scripts.
3. How Regions connect and which outcomes are permitted.
4. The relationship between Studio and Puzzles & Locks, including optional-dependency behavior.
5. A migration/compatibility approach for existing Region selection, trap, and puzzle data.
6. A small set of representative user scenarios that demonstrates the guided wizard and modular composition working together.

The owner-approved source separation supersedes the former no-runtime-change note. This roadmap records remaining composition design questions; it does not record a live-world installation or migration.
