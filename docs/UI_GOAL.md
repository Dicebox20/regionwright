# UI goal: ease-of-access Regionwright

Status: **Foundation implemented; live Foundry visual QA pending**

The UI should make Region Behaviors understandable and approachable for a GM who is comfortable using Foundry but does not want to write JavaScript. Ease of access is the central product focus: the interface should reduce cognitive load, keep the main workflow visible, and automate UUID storage, native data preparation, validation, and repeated setup wherever the GM's intent is unambiguous.

The standard interaction is a short, mouse-first prompt chain:

```text
Choose a goal → click Region(s) or named documents → answer only needed questions → review → create
```

For example, a two-way portal should guide the GM to click Region A, click
Region B, choose an arrival style if needed, and review the two native Teleport
Behaviors Regionwright will create. It should never require UUID copying or
manual pairing data.

## Core layout

The main Builder window uses the sketch as its visual basis: a full-width header, a compact task rail, one focused options area, a persistent Region context area, a narrow linking rail, and a footer with the next action.

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Regionwright                                     [Settings] [Close] │
├──────────────────────┬──────────────────────────────────────────────┤
│ Effect / Link topics  │ Selected Regions and current plan            │
│                      │                                              │
│ Native Effects        │ Scene: [active Scene]                        │
│ Traversal & Linking   │ Region selection: [Add Selected] [Clear]     │
│ World Actions         │                                              │
│ Hazards & Combat      │ 1. Region A                                  │
│ Presentation          │ 2. Region B                                  │
│ Puzzles & State       │                                              │
│ Integrations          │ Selected effect configuration                │
│                      │ concise directions and parameter controls    │
│ [Help] [Diagnostics]  │ [Preview Plan] [Apply Approved Plan]          │
└──────────────────────┴──────────────────────────────────────────────┘
```

The implemented shell expands this concept into four visible work areas: the left task rail, the focused options panel, the right Selected Regions panel, and the far-right linking rail. The footer remains reserved for Settings, status, and the primary review action.

The left side answers **what kind of thing am I building?** The right side answers **where will it happen, what will it affect, and how should Regions connect?** The footer answers **what should I do next?**

The first-run interaction is deliberately simple: click a Region on the canvas, click **Add Controlled**, repeat as needed, then click the effect to add. Double-clicking the canvas while the Builder is open provides a shortcut for adding the currently controlled Regions.

## Sketch adaptation rules

- Keep the header visually quiet: identify the module and active Scene, then get out of the way.
- Keep the left rail to short task names. Put explanations in the focused panel or a tooltip.
- Keep the selected-Regions panel visible while the GM changes effects.
- Keep linking options in a dedicated right rail with visible labels; never use unlabeled checkboxes.
- Keep the footer action obvious. It starts as **Review & Create Effect** and remains unavailable until the current native plan has selected Regions and an available behavior.
- Use a single sentence of guidance near the current decision. Avoid making the GM read a manual inside the workflow.

## Main-window principles

- Keep the main window focused on one effect plan at a time.
- Use Foundry's active theme variables for surfaces, text, borders, controls, and focus states. The sketch's bright colors are layout annotations only, not the product palette.
- Show the active Scene and selected Region count at all times.
- Make the Region selection window persistent on the right.
- Allow the GM to add the current controlled canvas Regions without losing the existing list.
- Open with an empty plan; the GM explicitly adds the current controlled canvas Regions without losing the existing list.
- Make **Add Controlled** the primary selection action and preserve each selected document's full UUID in the plan.
- Offer a double-click shortcut on the open canvas: after a Region is controlled, double-clicking the canvas adds the current controlled Region list without requiring the GM to move back to the Builder.
- Preserve selection order for linked workflows.
- Use short labels and one-sentence instructions.
- Reveal advanced options progressively instead of showing every field at once.
- Disable unavailable behaviors with a short reason rather than hiding them silently.
- Make Preview the natural next step before Apply.
- Keep Apply unavailable until validation and explicit GM review succeed.
- Keep destructive or broad actions visually distinct and require confirmation.

## Left-side topic menus

### Native Effects

Core Foundry Region Behaviors:

- Darkness and light;
- Weather and surfaces;
- Movement and terrain;
- Scrolling text;
- Pause;
- Active Effects.

Each option should show a small icon, a plain-language description, an availability badge, and whether it is continuous or event-based.

### Traversal and Linking

- Teleport between Regions;
- Change Scene Level;
- Toggle another Behavior;
- One-way or bidirectional links;
- Destination groups and future random/ordered links.

The link workflow should favor selecting a Region from a picker or the canvas over copying UUID text. The plan should show arrows and source/destination names. For the first linking pass, the GM adds two or more Regions to the right-side list, chooses **Traversal & Linking**, and assigns source/destination roles before any teleport behavior is enabled.

### World Actions

- Show/hide Token or Tile;
- Open/close/toggle a Door;
- Change selected Wall properties;
- Move or change Token elevation;
- Open Journal, Actor sheet, or Scene;
- Add Combatant or manipulate an Item.

These actions must clearly display target type, target name, Scene, current state, and proposed state.

### Hazards and Combat

- Trap;
- Save/check;
- Damage;
- Condition or Active Effect;
- Combat turn/round action;
- Encounter controller.

Advanced system integrations should show their dependency and compatibility status before configuration begins.

### Presentation

- Chat or scrolling text;
- Music and sound;
- Visual effects;
- Ping and camera focus;
- Fog-of-war or Scene transition helpers;
- Journals and player-facing prompts.

Mechanic actions and presentation actions should be visually grouped so a failed sound or animation does not look like a failed gameplay effect.

### Puzzles and State

- All-required conditions;
- Any-required conditions;
- Ordered sequence;
- Counter or threshold;
- Delay, cooldown, or timer;
- Reset and repair.

Start with simple recipes such as four Regions complete -> reveal one target. Do not expose general state-machine authoring in the first UI.

### Integrations

Optional adapters such as MATT, MidiQOL, Sequencer, Levels, Terrain Mapper, Lock & Key, Tagger, and system-specific behaviors belong here. The UI must show:

- installed or missing;
- version detected;
- required dependencies;
- native fallback, if any;
- evidence status;
- whether the adapter changes mechanics or presentation only.

## Right-side Region selection window

The right panel is the persistent context area. It should include:

- active Scene name and UUID;
- Add Controlled Regions button as the primary action;
- Add Region picker;
- clear, remove, reorder, and refresh controls;
- Region name, color, UUID, elevation, lock state, and behavior count;
- stale or cross-Scene warning badges;
- source/destination arrows for linked workflows;
- explicit UUID-backed source and destination roles for teleport links;
- quick link health and repair action;
- a compact summary of the selected effect.

The user should never need to leave the Builder just to confirm which Regions are currently in the plan.

## Guidance style

Directions should be short and action-oriented:

- “Select one or more Regions on the canvas.”
- “Choose what happens when a Token enters.”
- “Choose the Door that should open.”
- “Review the exact change before applying.”
- “This behavior is unavailable in the current runtime.”

Avoid long paragraphs inside the workflow. Use tooltips, help icons, examples, and expandable “Why?” sections for additional explanation.

## Visual aids

Use visuals when they reduce ambiguity:

- effect-category icons;
- native versus adapter badges;
- trigger timeline or event icon;
- source-to-destination arrows;
- small Region geometry preview;
- target document type icon;
- current-state -> proposed-state comparison;
- once/repeat/timed badges;
- dependency and warning icons;
- simple four-lock condition diagram;
- color-coded validation states.

Visuals should supplement labels, not replace them. Do not rely on color alone for meaning.

## Foundry settings integration

Utility and policy settings belong in Foundry's Configure Settings menu, not in the main effect workflow. The main Builder window should provide a direct Settings link that opens the relevant module settings page.

Settings candidates:

- enable experimental Region writes;
- default execution policy;
- diagnostic logging;
- default preview verbosity;
- confirmation requirements;
- optional integration toggles;
- visual density and accessibility preferences;
- reset/cleanup policy where a safe default exists.

The main window may show the current status of important settings, but changing those settings should route the user to Foundry's standard configuration UI.

## Accessibility and ease-of-access requirements

- keyboard-navigable topic menu and controls;
- visible focus states;
- readable contrast in Foundry light and dark themes;
- no color-only status indicators;
- concise labels with accessible names for icons;
- tooltips for unfamiliar Foundry terms;
- responsive layout for smaller windows;
- scrollable panes without hidden critical controls;
- clear error text adjacent to the field or action that needs correction;
- no reliance on tiny UUID text as the primary identity of a document.

## Acceptance criteria

The UI goal is met for the first native editor when a GM can:

1. Open the Builder from the checked-in Macro.
2. See the active Scene and an empty Region selection panel.
3. Select a Region on the canvas, click Add Controlled, and see its name plus UUID in the persistent right-side list.
4. Add multiple Regions without replacing earlier selections, reorder or remove them, and see the selection count update.
5. While the Builder is open, double-click the canvas after controlling a Region and add it through the shortcut.
6. Choose a major topic and one available effect from the left side.
7. Understand the trigger and result from short instructions.
8. Configure only the parameters relevant to that effect.
9. See unavailable capabilities and missing dependencies clearly.
10. Preview the exact source Region, event, behavior, parameters, and proposed change.
11. Open Foundry's module settings from the main window.
12. Apply only after explicit review and validation.

## Later UI work

- visual recipe cards for common effects;
- a link graph for multi-Region workflows;
- a state inspector for puzzle and encounter controllers;
- a repair queue for stale UUIDs;
- reusable presets and export/import;
- a compact “play mode” view for GM controls;
- a visual timeline for delayed, timed, and combat-bound effects;
- optional canvas overlays for source, target, and affected area preview.
