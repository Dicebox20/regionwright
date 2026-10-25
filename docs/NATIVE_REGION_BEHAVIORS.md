# Native Region Behavior menu map

This is the first menu map for the Regionwright Builder. It is based on the Foundry v14 native Region Behavior registry and the official Scene Regions guide. The v14 registry currently exposes thirteen concrete core and system behavior classes (plus the abstract base type): darkness, Active Effects, level changes, surfaces, scrolling text, Macro, Script, movement cost, pause, weather suppression, teleport, behavior toggling, and D&D5e difficult terrain. [Foundry v14 behavior registry](https://foundryvtt.com/api/v14/modules/foundry.data.regionBehaviors.html)

Foundry separates continuous behaviors from event-based behaviors. Continuous behaviors affect the Region while enabled; event-based behaviors react to subscribed Region events. [Foundry Scene Regions](https://foundryvtt.com/article/scene-regions/)

## Builder menu map

### Native Effects

#### Environment & Movement

- **Adjust Darkness Level** — brighten, darken, or override the Region's darkness level.
- **Suppress Weather** — stop weather effects inside the Region.
- **Modify Movement Cost** — change movement cost through the Region, using Foundry's movement terrain model.
- **Define Surface** — define surface behavior that can affect light, movement, sight, and sound.

These are the first environment-focused menu options because they describe what the Region does to the space itself. Darkness, weather suppression, and movement cost are continuous behaviors. Define Surface is also spatial/environmental, but its field details must be read from the active runtime data model before we expose all controls.

#### Feedback & Game Flow

- **Display Scrolling Text** — show text when a subscribed Region event occurs; supports text, color, visibility, and once-only behavior.
- **Pause Game** — pause when the Region event is triggered for a non-GM-controlled Token; supports once-only behavior.

These are the simplest player-facing feedback and pacing tools. Display Scrolling Text is the first live end-to-end implementation target.

#### Effects & Conditions

- **Apply Active Effect** — apply configured Active Effects to Tokens while they are inside the Region and remove them when they leave.

This is a native behavior, but its effect fields are system-sensitive. The menu should show the active system, selected Item/Effect UUIDs, and compatibility state before allowing configuration.

#### System Behaviors

- **D&D5e Difficult Terrain** — a D&D5e-registered behavior for difficult terrain and its system-specific options.
- Future system behaviors — discovered from `CONFIG.RegionBehavior.dataModels` and placed here or in a system adapter menu according to their runtime metadata.

System-specific behaviors must never be presented as universal core behavior. Pathfinder, Warhammer, and other systems may register different behavior types or different fields.

### Traversal & Linking

#### Native traversal behaviors

- **Teleport Token** — move a Token entering one Region to a destination Region identified by UUID.
- **Change Level** — prompt a Token to move between Scene Levels.
- **Toggle Behavior** — enable or disable another Region Behavior identified by UUID.

These belong together because they connect Regions, Levels, or Behavior states rather than changing the local environment.

#### Teleport recipes

The native Teleport Token behavior is one behavior with several useful recipes:

- **One-way portal:** source Region points to a destination Region; no return link is created.
- **Return portal:** two Regions each point to the other by UUID.
- **Cross-Scene portal:** the destination UUID belongs to a Region on another Scene.
- **Choice portal:** the Token can be prompted before the teleport proceeds.
- **Level transition:** use Change Level when the goal is moving between Levels rather than moving to a different Region destination.

Random destinations, ordered destination groups, conditions, cooldowns, loop protection, arrival effects, and multi-step travel remain module recipes or advanced Macro/Script routes. They are not separate native Teleport Token behaviors.

### Advanced Actions — available from every menu

These are native Region behaviors, but they are deliberately displayed as a reserved advanced route rather than normal first-choice effects:

- **Execute Macro** — run one existing Macro selected by explicit UUID when a Region event occurs.
- **Execute Script** — run one existing Script selected by explicit UUID when a Region event occurs.

The Builder should show this route below every menu's native options with the same explanation: use it only when native behavior and a bounded module adapter cannot express the desired result. The route must require:

- an existing, explicitly selected UUID;
- a documented event/context contract;
- a no-write context probe before gameplay use;
- permission and player/GM behavior review;
- a preview that names the Macro or Script and Region;
- reset and repeat behavior;
- no generated code, arbitrary source, or automatic Macro creation.

The official Region guide documents that Macro and Script execution receives `behavior`, `event`, `region`, and `scene` context, making these useful extension points without making them the default authoring path. [Foundry Scene Regions](https://foundryvtt.com/article/scene-regions/)

## Menu treatment

The Builder should use the following ordering:

1. Native Effects
   - Environment & Movement
   - Feedback & Game Flow
   - Effects & Conditions
   - System Behaviors
2. Traversal & Linking
   - Teleport Token
   - Change Level
   - Toggle Behavior
3. Advanced Actions
   - Execute Macro
   - Execute Script

Advanced Actions are visually available from every menu, but the actual configuration route remains gated until the pre-Macro checklist and isolated-world evidence are complete.

## Catalog implementation rule

The code catalog must retain, for every behavior:

- stable builder key;
- Foundry behavior type;
- menu category;
- continuous or event-based classification;
- system or module dependency;
- runtime availability;
- whether the option is currently writable or reserved;
- parameter hint and validation source.

Availability is determined by the active runtime's registered behavior data models. The menu map is a user-facing grouping, not a replacement for runtime capability detection.
