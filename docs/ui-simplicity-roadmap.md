# Regionwright UI Simplicity Roadmap

## Goal

Let a new GM create a safe Region Behavior without knowing Foundry terminology,
UUIDs, or scripting. The normal path should be: choose a goal, click the
relevant Regions or named documents, answer a few guided questions, review,
and create. Regionwright should automate compatible native setup whenever the
GM's intent is unambiguous.

## Implementation status

The native visual foundation was implemented on 2026-08-02. The guided-recipe
redesign is now the required interaction model for every current native
Behavior: each Behavior has an explicit Region-selection prompt, shows one
required decision at a time, and places secondary native controls in Fine tune.
There is no generic-form fallback. A new Behavior remains unavailable until it
has a short recipe and a task test. These rules are the acceptance criteria for
every future Regionwright UI patch. A change must preserve the beginner path
and add or update a task test when it changes navigation, selection, form
wording, or the review/create workflow.

The automated novice-path check lives in `tests/foundation.test.mjs` and
verifies the common-goal screen, visual portal destination selection, no manual
UUID field, and plain-English review summary. Human table testing is
the next iteration input whenever a new capability is introduced.

The full audit and adopted guided-recipe redesign are in
`docs/ease-of-access-redesign.md`. Its recipe model and acceptance criteria
govern the next implementation pass.

## Design rules

1. Show one decision at a time. Every Behavior starts by confirming its
   Region(s), even when the GM already selected them before choosing a goal.
2. Use familiar Foundry and TTRPG labels: "Portals & Travel", "Choose
   Regions", and "Review Behavior" instead of internal implementation terms.
3. Keep every visible label next to the control it explains.
4. Make the safe, common path prominent. Store UUIDs internally from named
   Foundry document pickers; put scripts and registry details behind an
   explicit Advanced or Technical details disclosure.
5. Keep navigation short, predictable, and in the same place. Show unfinished
   tools only under "More tools".
6. Explain the result of an option before a GM creates a Behavior.
7. Use Foundry's theme variables, dividers, icon-and-text buttons, side rails,
   focus states, and dark/light theme support rather than inventing a separate
   visual system.
8. Automate unambiguous, reversible setup; preserve a visible review step for
   every Scene write.
9. Use the persistent right rail as a document browser, not an "Add selected"
   staging area. Clicking a named row chooses it for the active prompt. The
   rail offers Scene, Region, Actor, Door, and Tile browsing; Actors include a
   direct World Actors list for persistent documents.
10. A Region rename is a draft change beside its selected name. It is included
    in the same review and rollback boundary as the Behavior; it never changes
    the Scene merely because the GM typed a name.
11. Keep each box to one clear instruction. The selected Behavior already
    titles the guided window, so prompt boxes have no titles or progress
    counters of their own: show only the next action and the needed control.
    Omit empty-state filler and optional help text unless it changes that
    next action.
12. Keep every popup window stable while a dropdown is open. Dropdown option lists overlay their
    control and scroll within a capped menu; they never resize the popup or
    create a scrollbar on the popup window. The GM can still move and resize
    the popup manually.
13. Guided popups suppress their visible title bar, guide header, and
    full-width footer. The GM can drag any blank prompt area with the normal
    cursor; controls and readable instruction text remain interactive. Scale
    text and controls with the window width and place only essential
    navigation in a compact action row inside the content.

## Native Foundry aesthetic to preserve

- A window header with concise title and standard close/minimize controls.
- Narrow side navigation for major sections and a narrow document-selection
  rail, like Foundry Game Settings and directory windows.
- Translucent panels that allow the Scene to remain subtly visible.
- Strong text hierarchy and one-pixel dividers instead of many nested cards.
- Familiar Foundry buttons, selects, checkboxes, lists, and disclosure rows.
- System-aware dark/light colors and existing Foundry focus treatment.

## Roadmap

### 1. Foundation: native appearance and orientation

- Replace custom hard-coded colors with the active Foundry Theme V2 variables.
- Keep the left rail to the two working tools: Region Behaviors and Portals & Travel.
- Keep future work under a collapsed More tools section.
- Add a short, persistent summary showing the selected Region count and Behavior.
- Make the main heading always describe the current decision, not a broad
  section name.

Success measure: a GM can tell what to do next within five seconds.

### 2. Beginner start screen: common goals first

Present common Region goals as plain-language rows before the complete catalog:

- Darkness & Light
- Floating Text
- Difficult Terrain
- Suppress Weather
- Teleport Token
- All Region Behaviors

Each choice opens the existing native behavior form. "All Region Behaviors" keeps the
complete Foundry catalog available for experienced users without making it the
first decision for everyone.

Success measure: a new GM can locate a common task without recognizing terms
such as "displayScrollingText" or "adjustDarknessLevel".

### 3. Choose, do not paste

Raw UUID text boxes are not part of the Regionwright workflow. Every document
reference uses a named visual picker:

- Destination Regions: Choose Regions button plus selected-name chips.
- Active Effects: Choose Active Effects button plus selected-name chips.
- Macro: Choose Macro button plus the selected Macro name.
- Toggle Behavior: Choose Behaviors button with separate turn-on and turn-off
  lists.
- Actor, Wall, and Tile references: keep under More selection options until an
  implemented effect needs them.

Store the UUID internally after a choice. Do not expose a manual UUID field in
the Builder.

The right rail is always open: choose a Scene from its dropdown, then browse
the available document type. Documents outside the active Scene can be viewed,
but current native Behavior writes remain restricted to the active Scene until
their recipe explicitly supports a cross-Scene reference. Hover highlighting
for current-Scene placeables is the next visual-selection enhancement.

Success measure: the Builder contains no UUID text field.

### 4. Forms: defaults, short labels, and advanced choices

- Use familiar Foundry labels where possible: "Trigger" and "Visibility".
- Use sliders for bounded amounts and show the live value.
- Prefer the game term when it is clearer: "Difficult Terrain" and "Darken"
  are more familiar than longer paraphrases.
- Provide one sensible default per effect.
- Move rare options into a collapsed "More options" section.
- Mark only truly required choices and explain what is missing beside the
  control, not in a generic error toast.

Success measure: a common effect form fits in one calm screen without scrolling
past options the GM does not need.

### 5. Review and create

- The footer action remains "Review Behavior"; it never implies an immediate
  write.
- After review, automatically reveal a plain-English summary: what will happen,
  where, and when.
- Leave JSON and behavior type data under Technical plan details.
- Enable "Create Behavior" only after the GM confirms the visible summary.
- After creation, confirm the number and names of changed Regions and provide a
  direct link to the native Region configuration.

Success measure: no GM is surprised by what gets written to a Region.

### 6. Validate with task tests

Ask people unfamiliar with Regionwright to complete these tasks without help:

1. Add two Regions and stop weather inside them.
2. Display Floating Text when a Token enters a Region.
3. Make a cave darker using the slider.
4. Teleport a Token by choosing its destination Region, without copying a UUID.
5. Review the Behavior and identify the Regions it will change.

Record where people hesitate, use the wrong menu, or ask what a word means.
Fix the earliest repeated point of confusion before adding more capability.

## Research basis

- W3C recommends visible, nearby labels in common language and recognizable
  controls, particularly for cognitive accessibility.
  https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p06-clear-labels/
  https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p05-clear-controls/
- W3C recommends removing or explaining jargon in headings, instructions, and
  errors. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p01-clear-words/
- GOV.UK's form pattern starts by placing one decision on each page so people
  can focus on what is being asked.
  https://design-system.service.gov.uk/get-started/labels-legends-headings/
- Fluent's navigation guidance calls for brief, plain-language labels,
  prioritized main categories, and collapsed subcategories for complexity.
  https://fluent2.microsoft.design/components/web/react/core/nav/usage
- Foundry V13's UI refresh emphasizes a more approachable interface, system
  dark/light adaptation, and a collapsible sidebar that keeps attention on the
  canvas. https://foundryvtt.com/releases/13.341
