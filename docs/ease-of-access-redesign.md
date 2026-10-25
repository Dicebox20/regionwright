# Ease-of-access audit and redesign

Status: **Adopted design direction — implementation begins with guided native recipes and mouse-first portal linking.**

## Product decision

Regionwright is a guided visual authoring tool, not a Region Behavior form
editor. The GM should mostly click familiar Foundry documents and answer short
questions. Regionwright owns UUID storage, compatible native payloads,
defaults, validation, duplicate reconciliation, and repeated setup.

The standard flow is:

```text
Choose a goal → click the relevant document(s) → answer the next question → review → create
```

The GM must still review every Scene write. Automation applies only when the
intent is unambiguous and the proposed result can be shown clearly.

## Audit findings

| Current area | What works | Friction to remove | Redesign rule |
| --- | --- | --- | --- |
| Common goals | Large icon-led goal buttons make the first choice easy. | The full catalog adds an extra navigation layer before configuration. | Keep goals as the default start and take the GM straight into a recipe. |
| Region selection | Named Region picker, controlled-Region shortcut, and double-click shortcut preserve UUIDs internally. | The GM still has to translate a canvas action into an “Add Region” action; selection has no source/destination role. | Give the active prompt a selection role: affected Regions, source, destination, or target. Capture named documents into that role. |
| Named references | Regions, Active Effects, Macros, and Behaviors can be chosen by name. | Pickers are nested in technical-looking form sections and multi-select stays open after every click. | Treat a picker as the current prompt, show a short selected list, and auto-close it when the choice is complete. |
| Native configuration | All writable core Behavior types are available. | Many forms show every native field at once, including rare and technical controls. | Divide forms into defaults, required prompts, and optional Fine tune settings. |
| Teleport | Destination Regions can be chosen by name. | A source/destination pair is not modeled as a guided workflow; a true two-way portal is not yet a reviewed atomic write. | Add one-way and two-way portal recipes with visual pairing, compound review, and atomic rollback. |
| Review and creation | Existing plan review, GM acknowledgement, validation, and rollback protect writes. | Review is exposed in more than one place and uses the same shape for simple and compound work. | Use one persistent next action: Review. The review card adapts to the recipe and names every document and Behavior to be created. |
| Future tools | Planned topics show the intended scope. | Disabled future menus compete with usable tasks. | Keep unfinished tools collapsed until they offer a working guided recipe. |

## Redesigned interaction model

Every recipe uses the same six states. A recipe skips states that do not need a
GM decision, but never falls back to a generic configuration form. Every
native Behavior must declare its own short recipe before it becomes usable.

1. **Choose goal** — icon-led common goal or all Region Behaviors.
2. **Choose documents** — the prompt states exactly what to click, such as
   “Choose the Region affected” or “Choose the destination Region.”
3. **Answer the next question** — one decision per screen or panel.
4. **Fine tune (optional)** — collapsed native options for experienced GMs.
5. **Review** — a plain-language result, affected document names, and the
   proposed native Behaviors.
6. **Create** — a single acknowledged Scene write, followed by a useful
   confirmation and Undo when available.

The selected-document rail remains visible, but its heading changes with the
active step. For a portal it becomes **Source Region** or **Destination
Region** instead of the generic **Selected Regions**.

## Recipe defaults and prompt chains

### Simple continuous Region Behaviors

Use this for **Difficult Terrain**, **Suppress Weather**, and most
environmental Behaviors.

```text
Choose goal → click Region(s) → review → create
```

Defaults are native, system-aware, and visible in the review. Optional
exceptions, such as magical terrain or terrain-type filters, live in Fine tune.

### Darkness and light

```text
Choose Darkness & Light → click Region(s) → set Darkness Level → review → create
```

The default is “Set darkness.” Brighten and Darken are a compact secondary
choice, not a separate form section.

### Floating Text

```text
Choose Floating Text → click Region(s) → type message → choose trigger → review → create
```

Use an appropriate default trigger and visibility. Text color and once-only
behavior move to Fine tune.

The message step uses a visible multi-line text box with the prompt "Type the
message players should see." The Region browser can also stage a clearer Region
name; that rename is shown in the final review and is committed or rolled back
with the Behavior.

### Active Effects and Macros

```text
Choose goal → click Region(s) → click the named Active Effect or Macro → choose trigger if needed → review → create
```

The picker stores the UUID internally. It must never ask the GM to copy one.

### One-way portal

```text
Choose One-way Portal → click source Region → click destination Region → choose arrival style → review → create
```

The destination picker excludes the source Region. Standard defaults are token
enter, random destination location, snap to grid, and a short transition.

### Two-way portal

```text
Choose Two-way Portal → click Region A → click Region B → choose arrival style → review both directions → create
```

Regionwright creates the paired native Teleport Behaviors:

```text
Region A — Token Enters → Region B
Region B — Token Enters → Region A
```

This requires a compound plan and one atomic write boundary: if either Region
cannot be updated, both Regions return to their prior Regionwright-owned
Behavior state.

## Automation contract

- Capture and retain UUIDs automatically from named Foundry documents.
- Pre-fill compatible defaults and omit steps that have one safe answer.
- Exclude impossible choices, such as a portal source as its own destination.
- Update a matching Regionwright-owned Behavior instead of creating duplicates.
- Batch identical continuous Behaviors across selected Regions.
- Create paired or grouped Behaviors only through a compound, reviewable plan.
- Keep native technical fields behind Fine tune; never hide a required choice.
- Put errors at the unresolved step and preserve prior completed choices.
- Keep the player-facing result separate from GM configuration. Players should
  only interact with the native Behavior after it is created.

## Implementation sequence

1. **Guided-recipe foundation**
   - Add recipe state, step progress, prompt copy, and selection roles.
   - Keep the current plan/write API for single-Behavior recipes.
   - Move nonessential native fields into Fine tune.

2. **Simple recipe pass**
   - Convert Difficult Terrain, Suppress Weather, Darkness & Light, and
     Floating Text to the guided model.
   - Add tests for each shortest successful path.

3. **Document recipe pass**
   - Convert Active Effects, Macros, and Toggle Behavior to named-pick
     prompts with automatic UUID capture.

4. **Portal-link foundation**
   - Add source/destination selection roles and canvas-oriented prompts.
   - Add reviewed one-way portal creation.
   - Add a compound two-way portal plan, atomic reconciliation, rollback, and
     task tests.

5. **Advanced recipes and recovery**
   - Convert Surface, Movement Cost, Change Level, and advanced script routes.
   - Add a last-change undo/revert path for Regionwright-owned Behaviors.

## Acceptance criteria for every new recipe

- A new GM can complete the common path with mouse clicks and short text only.
- No UUID, raw behavior data, or unneeded native option appears on the normal
  path.
- The number of visible decisions is as small as the Behavior safely allows.
- The review names the affected documents and explains the resulting gameplay
  behavior in plain language.
- Creation remains opt-in, validated, and recoverable when a multi-document
  write fails.
- A task test covers the happy path and an invalid or unavailable state.
