# Regionwright: Studio — Modular Sequence Implementation Plan

**Status:** Approved direction to implement, but implementation NOT started. This is an execution plan, not authorization to change runtime code.
**Prepared:** 2026-10-24 (America/Los_Angeles)
**Source of truth:** C:\Users\rujie\Documents\Region Editor
**Existing governing plans:** docs/STUDIO_MODULE_PLAN.md, docs/REGION_STUDIO_COMMUNITY_RESEARCH_2026-10-05.md, docs/PROJECT_STANDARDS.md, docs/EDITION_STRATEGY.md
**Module ownership:** Studio = regionwright; Puzzles & Locks = regionwright-puzzles-locks; Hunting & Gathering = regionwright-hunting-gathering.
**Project objective:** A GM builds an ordered modular sequence first; then the wizard asks the questions implied by the selected steps, binds Regions/Doors/Items, validates the whole sequence, and safely publishes it. Optional companions contribute reusable activities without becoming required dependencies.

## 1. Durable execution rules

1. **Implement only one named checkpoint at a time.** A checkpoint has a goal, narrowly scoped files, acceptance tests, a rollback route, and a written handoff. Do not begin the next checkpoint until its evidence is recorded.
2. **No audit loops.** Treat the 2026-10-24 source-engine inspection and this plan as the baseline. Do not repeat a full source audit at every checkpoint. If a blocking discrepancy appears, perform at most ONE targeted inspection of the affected path and capture the result; then implement or explicitly pause. Do not reopen settled architecture questions just to produce another audit.
3. **Three review boundaries only:** baseline/design contract (CP0), one integrated runtime safety review (CP3), and final integrated acceptance review (CP6). Between boundaries use focused tests and ordinary code review of changed files, not broad reassessment.
4. **Work in bounded turns.** Favor ~15-minute focused implementation turns with one task per turn; the checkpoint can span several turns. Never imply that an unexecuted future turn has been completed.
5. **Preserve unrelated changes.** Before changes, check the working tree; stop and report unexpected edits or external activity that could conflict. Do not reset, clean, overwrite, or modify unrelated files. Preserve the module ID and existing flags/settings. Do not make live Foundry changes without explicit authorization.
6. **No blind retries.** On uncertain bridge, command, install, or write results, inspect the receipt, file state, or document readback before replaying. When using Dicebox Bridge, keep one stable request ID for each operation.
7. **Test proportionately:** run the smallest relevant test(s) after each change; run the wider Studio/foundation set on integration boundaries; reserve npm run check, build:modules, and package:modules for CP6 unless an earlier change specifically requires a build. A test run is not a substitute for in-world multiplayer QA.
8. **Each checkpoint leaves a runnable or safely isolated state.** New behavior stays behind a disabled-by-default/opt-in feature path until publication semantics and authorization are tested. Do not delete legacy behavior paths in this program.
9. **Record evidence in the checkpoint ledger below** immediately when a checkpoint is complete or blocked: date, files changed, tests (commands and counts), observed behavior, residual risks, rollback, and next exact task.
10. **No unsupported success claims.** Distinguish pure source tests, Foundry in-world verification, and multiplayer validation. Never mark a phase complete based only on an API name or a compile result.

## 2. Agreed product behavior

**Authoring order is sequence-first, wizard-second.**

1. GM chooses a new blank sequence or a reusable template.
2. GM adds or reorders modular script/behavior steps and connects typed outcomes (success, failure, cancel, timeout, continuation).
3. GM activates the guided wizard. The selected steps generate a short question chain in their intended order; later steps can contribute configuration questions to earlier steps when a declared contract supports it.
4. GM visually binds the sequence to existing or newly drawn Region(s), Door(s), Item(s), and optional module-provided games. Bindings are Scene-aware and use named pickers and map highlights, not hand-typed UUIDs.
5. GM reviews the actual runtime order, permissions, dependencies, triggers, targets, reset/once/retry behavior, and warnings. Preview/dry-run before world writes.
6. GM explicitly approves and publishes. Studio deploys only its **own managed composition instance**, never silently replacing unrelated behaviors, including other Regionwright activities.
7. GM can inspect execution traces, disable, repair missing references, reset state, or remove only this composition.

**Keep two concepts distinct:** composing/ordering behavior scripts in an editor vs. the precise event execution schedule in Foundry. Native Region Behavior list order is not a sequencing guarantee. Studio must coordinate dependent steps.

**Example acceptance path:** Token enters Region -> show scrolling text -> wait for inventory item presentation/use -> validate the intended Actor/item -> branch success/failure/cancel -> unlock selected Door OR activate a linked Region. Item possession alone is not a click/use event.

**Traps boundary:** Studio traps are activation games that lead to Door unlock or Region activation, not generalized autonomous damage hazards. Reusable lock/puzzle games are owned by the optional Puzzles & Locks module. Hunting & Gathering injects its resource minigames into existing Regions and remains independent.

## 3. Existing source: verified design baseline

- modules/regionwright/scripts/studio.js: portable schemaVersion 1.0 blueprint with trigger, condition, action, state nodes, edges, Scene references, and templates.
- studio-compiler.js: topological node order, cycle and availability checks, **review-only compilation**; condition/state execution not active. It does not install or execute a generic graph.
- ui.js: both a goal/behavior-first native assistant and Studio activity/template-first editor, visual reference selectors, guided behavior recipes, review/publish controls. Studio's displayed ordered node list is not yet an arbitrary add/reorder/remove graph authoring UI.
- plan.js and write.js: one-behavior native plan and reconciler; links explicitly disabled. By default replacement currently deletes other owned behavior keys; this must not occur for independently managed modular compositions.
- studio-activity.js, studio-scene-moment.js, studio-story-beat.js, studio-portal.js, studio-story-fact.js, studio-hub-unlock.js: specialized activity publishers/handlers with their own flags, snapshot logic, and some GM socket paths. Preserve behavior until migrated and retested.
- studio-storage.js: world-setting-backed draft slot; not yet a general library of multiple independent compositions.
- studio-facts.js: GM-only world-setting progress facts; useful semantics, but not a complete per-run continuation/state store.
- api.js: optional Puzzles & Locks hub bridge; not yet a typed action-provider registration/dispatch contract.
- module.js: registration/initialization, optional Region writes setting, runtime sockets and public API.
- docs/STUDIO_MODULE_PLAN.md and community research (2026-10-05): sequence ordering, optional modules, wizard, links, compatibility, reset, missing dependencies, and migration are planned; final technical contract not approved.

**Known test baseline** (2026-10-24 source audit): targeted Studio + foundation test run was 84 total, 81 passed, 3 failed. All three failures were in tests/foundation.test.mjs, under UI/puzzle navigation or prompt/selection expectation tests:
- "Studio traps link to optional Puzzles & Locks without embedding its games"
- "prompt-first selection owns Door and Region lists and advertises map highlighting"
- "builder UI keeps a quiet options, features, and selected Regions workflow"
Do not relabel these as newly introduced regressions. Capture changes against this exact baseline and investigate only if touched or if a test gate depends on them. No Foundry multiplayer validation occurred in that audit.

## 4. Proposed minimum technical contract (final names are provisional)

**Compositions:** Stable compositionId, schemaVersion, editor revision, steps/nodes, typed edges, context/Scene bindings, dependency versions, reset policy, execution policy, and per-instance ownership marker. Keep old schema 1.0 readable; introduce migration only with roundtrip tests.

**Step descriptors:** Stable namespaced ID and version; owner module; title/category; editor/wizard configuration schema + defaults; supported Foundry/system/provider capabilities; event/Actor context; required and emitted typed inputs/outcomes; target type/cardinality; execution authority; setup ordering and runtime ordering constraints; cancellation/retry; reset/cleanup semantics; and optional preview adapter.

**Flow semantics:** A normal chain executes **serially**. Success/failure/cancel/timeout edges are explicit typed branches. Two paths run in parallel only if the designer chooses a fork with a defined join or independent execution. Waiting for player input persists continuation state and does not mean replaying entry actions. Reject accidental cycles; allow only an explicitly bounded or externally rearmed loop in a later milestone.

**Authority:** One elected active GM verifies every world-changing request; a client request alone never confers permission. The GM derives actor/token identity from reliable context, checks scenario instance and target permissions, and records an idempotency key. Reject unrecognized action IDs, stale runs, cross-user replays, unauthorized item interactions, and missing/incompatible capabilities. Prefer a registered execution adapter over generated arbitrary JavaScript. Native script/Macro actions remain separately reviewed advanced capabilities.

**Ownership:** Mark installed artifacts by composition instance + step ID + version. Update/delete only exact instance-owned documents. Protect existing non-Studio Behaviors and other Studio activities. Use readback/snapshots for rollback; report partial restoration rather than claiming perfect atomicity.

**Persistence:** Separate design-time composition/drafts from deployed versions and from runtime state. Runtime state must support per actor/token/party/world scoping, waiting step, once/repeat, cooldown, reset, and cleanup. Do not silently mutate or migrate a live installed sequence on draft save.

**Missing dependencies:** Studio works without Puzzles & Locks and Hunting & Gathering. Provider actions are discoverable only when installed/enabled/compatible; previously saved unknown actions stay visible as disabled/unresolved with repair guidance, not discarded.

**Wizard:** Script descriptors generate the questions. Region and Door selection is a binding stage, not the user's forced first operation. Reuse map selection, highlight, named search, and Scene-switch path already present.

## 5. Checkpoints and acceptance gates

### CP0 — Architecture and safety contract
**State: PLAN RECORDED; DESIGN CONTRACT PROPOSED, NOT YET FROZEN**

Scope: This document and the existing plans. Confirm the sequencing semantics, component descriptor fields, feature flag, composition ownership key, persisted data scopes, and first acceptance scenario. Record defaults in the decision register; seek owner approval for choices that materially affect behavior.

Acceptance: one implementable contract, explicit non-goals and migration constraints, known test baseline. No runtime edits. No additional general audit. **Gate:** approve the first pilot design and its safety constraints.

### CP1 — Non-destructive stacking and ownership
**State: NOT STARTED**

Scope: write.js, plan.js, ownership metadata helpers, relevant foundation/write tests. Preserve the legacy single-behavior apply behavior where expected; create an opt-in composition-aware reconcile path that creates/updates/deletes only the exact managed instance and never touches unrelated or other activity-owned behaviors.

Acceptance: tests show two compositions and pre-existing native/Studio behaviors coexist on one Region; edit and remove one composition leaves others intact; forced failure restores only the touched instance; GM/write permission gates remain intact. Narrow source inspection only if a specific ownership bug blocks this.

**Gate:** safe coexistence demonstrated; recorded proof and fallback to legacy publisher.

### CP2 — Script registry and executable graph compiler
**State: NOT STARTED**

Scope: catalog.js, studio.js, studio-compiler.js, studio-diagnostics.js, api.js, new focused registry/compiler tests. Add namespaced/versioned script descriptors and typed connection validation; compile serial path, branch, wait/resume, and allowed side effects into a deterministic **runtime IR**. Keep compilation read-only.

Acceptance: serial order is invariant to node storage/display order; incompatible edges, missing providers, unsafe cycles, and illegal targets block publish; deterministic output for same input; old blueprints still validate/serialize; absent companions do not break Studio.

**Gate:** independently validated, testable IR for the item-gate example. No world writes.

### CP3 — Runtime coordinator and security boundary
**State: NOT STARTED**

Scope: new Studio runtime coordinator + persistent run-state adapter, module.js/api.js integration, event and security tests. One elected GM handles side effects; client input resumes a specific waiting run only after authorization and context checks. Implement request deduplication, cancellation, timeout, and bounded retry or failure behavior. Keep existing specialized handlers operational.

Acceptance: 2-player concurrent entry and duplicate/replayed socket requests cannot duplicate a Door unlock or item consumption; wrong Actor/item/player and stale/deleted target are rejected; interrupted runs have clear recoverable state; run trace identifies instance/node/outcome without leaking private item data.

**MIDPOINT REVIEW BOUNDARY:** review **only** changed runtime/security/ownership contracts and the named risks. Run the wider Studio/foundation tests once here. If blocked, document one targeted diagnosis, not a new project audit.

**Gate:** GM authority, idempotence, continuation, and recovery demonstrated in pure tests and, if an approved isolated world is available, a bounded smoke test.

### CP4 — Composition publisher and backward compatibility
**State: NOT STARTED**

Scope: versioned composition storage and deployment adapter, instance-scoped flags, non-destructive update/remove, rollback, compatibility checks; existing activity publishing remains supported. Migrate a single small template **optionally**, using a separate copy/test path first.

Acceptance: publishing the pilot creates/updates only owned artifacts; saved draft does not automatically deploy; disable/remove/reset can be repeated safely; missing target/module results in a disabled/reparable composition; old templates/flags and current installed worlds still work. Record exact rollback and recovery readback.

**Gate:** pilot installs, runs, updates, and uninstalls without altering another Region behavior.

### CP5 — Sequence-first workspace and generated wizard
**State: NOT STARTED**

Scope: ui.js and focused UI tests. Reuse existing guided recipe controls, named pickers, Region/Scene highlights, and review experience. Provide visible ordered script steps with add, remove, reorder where valid, and typed success/failure connections. Launch wizard **after** sequence design; ask only questions required by selected scripts, then bind targets.

Acceptance: blank sequence -> text -> required item -> Door unlock can be authored without raw UUID/code; wizard questions adapt when a step is inserted/removed; successful review is blocked by unresolved contracts; preview and rollback controls are understandable; keyboard navigation and reduced-motion handling remain available.

**Gate:** successful complete GM authoring flow in an approved isolated Foundry test world. Keep native assistant and activity templates accessible.

### CP6 — Optional companions, full integration, and release gate
**State: NOT STARTED**

Scope: public provider adapter(s) for Puzzles & Locks and optionally Hunting & Gathering; no sibling-runtime imports. Confirm owned outcome contracts, version handshake, absent-module graceful path, cross-Scene linked Region activation, and state reset. Test one simple chain, one branch, one puzzle-to-Region or puzzle-to-Door handoff, and one cross-Scene continuation.

Acceptance: Studio works independently; companion missing/disabled/mismatched is shown without corrupting drafts; visual bind/link flow is repairable; multiplayer GM and player views behave correctly; existing module manifests/IDs/data survive. Use controlled samples, not the live campaign.

**FINAL REVIEW BOUNDARY:** one integrated source/security/migration review, then npm run check, npm run build:modules, npm run package:modules and approved in-world QA. Compare results with the CP0 baseline; distinguish pre-existing test failures from new failures.

**Gate:** tests/builds pass or all exceptions are documented and owner-approved; packaging ready; compatibility/readback recorded. Production installation only after separate owner approval.

## 6. One-checkpoint working procedure

At the beginning of each turn:
1. Read this plan's checkpoint ledger and last handoff ONLY, plus the directly relevant files. Verify working-tree safety.
2. Choose one specific subtask of the active checkpoint; make minimal changes, respecting existing uncommitted work.
3. Run focused tests and inspect only the changed contract. Do not re-audit unrelated modules.
4. Record observed result, file paths, tests, remaining blocker, and next bounded task in the ledger/handoff. Stop when the checkpoint gate is reached; do not silently start the next phase.
5. If work cannot be completed, mark BLOCKED with actual failure evidence and safe resumption instructions. Do not claim completion.

**Escalation rule:** a broad audit is permitted only for a demonstrated systemic regression that cannot be localized after one targeted diagnostic, or for the CP3/CP6 planned review boundary. Explain the reason before widening scope.

**Build/run safety:** source first; do not touch live Foundry installs, world data, or deployed modules until the specifically named integration phase and explicit authorization. No unrelated feature work (Boss Engine, Ascendancy campaign specifics, separate resource-game implementation) in this plan.

## 7. Decision register (proposed defaults until approved)

| ID | Question | Proposed default | Freeze by |
| --- | --- | --- | --- |
| D1 | Begin with Region selection or sequence? | **Sequence first**, wizard and bindings later | CP0 |
| D2 | Runtime ordering? | Serial by typed connections; explicit fork/join only | CP0 |
| D3 | What does script "injection" mean? | Stored reference/configuration to approved registered behavior; **not** arbitrary injected JS | CP0 |
| D4 | Item requirement? | Distinguish has/present/use/consume; first pilot uses player-presented item and explicit success/cancel | CP0 |
| D5 | What can trap/puzzle outcomes change? | Door unlock or Region activation, per agreed boundaries | CP0 |
| D6 | Who is authoritative? | Elected active GM, identity and event validation, deduped requests | CP0 |
| D7 | Can missing optional providers break Studio? | No; preserve unresolved steps and offer repair | CP0 |
| D8 | How is state scoped and reset? | Declared per-step scope, explicit reset/once/retry, safe recovery | CP2 |
| D9 | Is cross-Scene supported initially? | Same-Scene pilot first; cross-Scene in CP6 after validated runtime | CP0 |
| D10 | Existing specialized publishers? | Keep intact; migrate one at a time only after parity | CP0 |

## 8. Checkpoint ledger — update in place, no separate audit documents

| Checkpoint | State | Evidence / result | Next action |
| --- | --- | --- | --- |
| CP0 | Plan recorded; contract approval pending | Read-only source audit 2026-10-24; focused tests 81/84 pass, 3 existing foundation UI failures; no runtime edits | Freeze proposed contracts, agree to pilot |
| CP1 | Not started | — | Start ownership-scoped stacking |
| CP2 | Not started | — | Script registry and compiler |
| CP3 | Not started | — | GM runtime and one midpoint review |
| CP4 | Not started | — | Deploy/store/migrate pilot |
| CP5 | Not started | — | Sequence-first UI and wizard |
| CP6 | Not started | — | Companion contracts, full QA and final review |

### Handoff format (append one short entry per bounded turn)

**Timestamp / agent / checkpoint:**
**Exactly what changed:** file paths and intent.
**Tests / evidence:** command, outcome, known pre-existing failures; Foundry world if applicable.
**Safety / rollback:** what is still untouched; how to recover.
**Blocker / owner decision:** only if material.
**Next exact bounded task:** one action, no generalized "audit everything" instruction.

## 9. Definition of done

A GM can build a sequence before selecting Regions, activate a wizard whose questions are driven by that sequence, bind existing/new Regions and targets visually, see/repair incompatible components, preview and publish an ordered multi-step interaction, allow one player's authorized input to resume only that run, branch on typed results, and remove/reset it without harming any unrelated Region configuration. Puzzles & Locks and Hunting & Gathering remain independently installable. Old Regionwright activities, saved data, and standalone native behavior workflows remain functional. Proven with focused unit/integration tests, documented multiplayer in-world QA, and one final release check.

**Important:** This file is the durable implementation plan and checkpoint ledger, not proof that CP1–CP6 have been performed.
