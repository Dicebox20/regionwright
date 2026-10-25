# Regionwright: Studio - Time-Efficient Codex Execution Roadmap

**Status:** Planning only; no implementation or installation authorized by this document.
**Prepared:** 2026-10-24
**Repo:** C:\Users\rujie\Documents\Region Editor
**Authoritative technical plan and status ledger:** docs/STUDIO_MODULAR_SEQUENCE_IMPLEMENTATION_PLAN.md
**Project standards:** docs/PROJECT_STANDARDS.md; docs/STUDIO_MODULE_PLAN.md; docs/EDITION_STRATEGY.md

This roadmap optimizes the ORDER and SIZE of tasks under the existing CP0-CP6 plan. It does not replace that plan's architectural rules, product boundaries, or three review boundaries. Codex should read both files, but update implementation status only in the existing plan's section 8 ledger.

## 1. Comparison to published Codex engineering workflows

These references are published engineering case studies or guidance, not controlled measurements of the speed achievable for Regionwright.

| Published example | What was effective | Regionwright adaptation |
| --- | --- | --- |
| OpenAI 25-hour long-horizon Codex run: https://developers.openai.com/blog/run-long-horizon-tasks-with-codex | Frozen goal/constraints, small verified milestones, runbook, living log | Retain checkpoint gates; add specific action-sized tickets and concise turn handoffs |
| OpenAI ExecPlans cookbook: https://github.com/openai/openai-cookbook/blob/main/articles/codex_exec_plans.md | Self-contained living plans, prototype risky interfaces, additive migration instead of wholesale replacement | Build an early end-to-end walking skeleton; leave old publishers and saved flags intact |
| OpenAI harness engineering: https://openai.com/index/harness-engineering/ | Repository knowledge as index, isolated tests, feedback loops, mechanical checks | Reuse the completed source audit; test the changed behavior, not the whole engine repeatedly |
| OpenAI engineering usage guide: https://openai.com/business/guides-and-resources/how-openai-uses-codex/ | Focused issue-like tasks (roughly one hour of human-sized work is a useful heuristic); durable instructions | Each task has specific dependencies, files, proof, and stop condition; divide oversized changes |
| Codex iterative workflow cookbook: https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex | Phase instructions, context capture, reliable handoff and validation | Keep the existing single plan and checkpoint ledger, not an unnecessary directory tree of duplicate records |
| OpenAI Symphony orchestration: https://openai.com/index/open-source-codex-orchestration-symphony/ | Issue-centric task selection reduces context switching in large agent teams | One small authoritative queue and a single source writer by default; optional parallel read-only exploration only |

**What the original plan got right:** seven checkpoints, clear modular ownership, rollback requirements, limited full audits, legacy compatibility, explicit GM authority, no blind retries, and a source-of-truth ledger.

**What to optimize:** The original plan postpones the actual UI until CP5, risking an engine that cannot drive the desired wizard; doing all runtime abstractions before a working pilot prolongs feedback; review/approval after each tiny task wastes attention; overlapping Codex writers add reconciliation cost.

**Correction:** Prove the sequence-to-wizard contract in CP2, deliver a small installable vertical slice by CP4, then add actual player input and branching. Preserve three major review boundaries: CP0, CP3, CP6.

## 2. Product delivery targets

**Main UX:** GM builds an ordered script sequence first, activates the wizard second, chooses/draws Regions and configures Doors/Items via visual pickers third, reviews full execution and permissions fourth, and publishes only after explicit approval. Never force Region selection before sequence design.

**Thin slice A (first working value):** Token enters Region -> show message -> one GM-authoritative Door-state result. This tests serial composition, native event integration, publication, instance ownership, and removal. This does not validate inventory interactions.

**Thin slice B (first complete modular feature):** Region entry -> text -> wait for player to present or use a required inventory item -> verify sender, Actor, item, and run context -> emit success/fail/cancel -> unlock Door or activate a linked Region. This proves typed branches, persistent continuation, permissions, and the generated wizard.

**Not in initial slices:** arbitrary JavaScript injection; free-form visual graph canvas; generic parallel execution; universal system item hook; all puzzle catalogs; automatic campaign migrations; cross-Scene concurrency. Build each only after its precise requirement has a working proof.

**Critical path:** recoverable snapshot -> owned behavior stacking -> step registry -> deterministic serial compiler + tiny wizard probe -> GM coordinator -> safe publisher -> slice A smoke -> waiting player input and branch -> generated wizard -> slice B multiplayer -> optional integrations -> final package.

## 3. Checkpoint schedule and acceptance

| Checkpoint | Efficient implementation focus | Observable gate |
| --- | --- | --- |
| **CP0 - Baseline** | Freeze descriptor, typed result, run ownership, source recovery strategy. Create two fixture flows. Reuse the prior audit; perform no additional broad code inventory. | Decisions and baseline recorded, source backup/recovery verified. First owner review. |
| **CP1 - Safe composition ownership** | Introduce opt-in instance-scoped reconciliation while preserving legacy single-behavior replacement. Test stacking before implementing the generalized engine. | Two independent compositions and an old Studio activity coexist; removing one affects only its owned artifacts. |
| **CP2 - Registry/compiler/wizard probe** | A few registered built-in steps, serial graph IR, branch-type validation and a minimal test renderer for wizard questions derived from step descriptors. No full GUI polishing. | Predictable order independent of node storage order; changing step list changes questions; unknown steps fail safely. |
| **CP3 - GM-authoritative coordinator** | A thin dispatcher, deduplication, forged-event rejection, run context, trace. Run changed runtime tests and one midpoint security review. | Duplicate or unauthorized client messages cannot cause duplicate world writes. Midpoint review, not full project audit. |
| **CP4 - Publisher, persistence, slice A** | Opt-in publisher, instance-scoped state, rollback, reset/remove. Demonstrate entry -> message -> Door on an approved isolated world. Implement headless wait/resume/branch next. | Slice A publishes/runs/uninstalls with old activities intact; slice B headless outcomes testable. |
| **CP5 - Sequence-first wizard, slice B** | Ordered step cards; wizard questions generated from descriptor contracts; visually bind Regions, Items, Doors; real item adapter verified for the active game system; multiplayer UX. | GM completes slice B without manually entering UUID/code; only legitimate player completes, failed/cancelled input does not unlock. |
| **CP6 - Optional providers and release** | Puzzles & Locks and H&G optional provider contracts; Region-to-Region/cross-Scene where supported; migration/compatibility; one final broad test/build/package/in-world review. | Studio works alone; companions fail gracefully; full approved release gate and owner deployment decision. |

**Important early adjustment:** CP2 contains a narrowly scoped wizard-question proof only. The real UI stays in CP5. This reduces expensive UI/engine rework without introducing a second editor.

## 4. Single Codex task queue, in priority order

Each R## is an issue-sized unit with one main deliverable and explicit proof. Small (S) should fit a brief focused coding pass; Medium (M) is roughly one ordinary scoped Codex issue; split Large tasks rather than hand Codex an ambiguous multi-file refactor. These are relative budgets, not calendar-time promises.

| Task | Depends on | Size | Required deliverable / proof |
| --- | --- | --- | --- |
| **R00** | none | S | Investigate the current baseline non-destructively: Git branch exists but HEAD could not be resolved and repository files appear untracked. Agree to and verify an owner-approved recoverable source snapshot or authorized initial commit **before application edits**. Do not git clean/reset/stage/commit without approval. |
| **R01** | R00 | S | Freeze 4-5 built-in step contract examples, outcomes, per-run scope, ownership marker, and feature flag; record decisions in CP0 ledger. |
| **R02** | R01 | M | Red tests for instance-specific reconciliation: different compositions, old Studio behavior, native behavior all coexist; expose old replaceOwned collision without changing legacy semantics. |
| **R03** | R02 | M | Implement isolated composition-owned create/update/delete/restore adapter behind opt-in flag; focused ownership tests pass. |
| **R04** | R01 | S | Registry descriptors for enter, text, Door outcome, Region activation, placeholder wait/condition; verify type and version fields. |
| **R05** | R04 | M | Deterministic serial graph IR compiler; reject unsafe cycles/invalid edges/unknown provider, preserve old blueprint readability. |
| **R06** | R04,R05 | S | Tiny wizard-question renderer driven by descriptors; change steps in fixture, questions update; no production world edits. |
| **R07** | R03,R05 | M | GM execution coordinator with trace, instance context, one allowed effect, dedup; simulated Region event reaches a mock Door once. |
| **R08** | R07 | M | Negative/replay tests: wrong player/Actor/Region, stale instance, duplicated socket request, missing GM/target; fix failures before CP3. |
| **R09** | R03,R08 | M | Publish/disable/remove one compositional instance, snapshot/readback/rollback, preserving other behaviors and flags. |
| **R10** | R09 | M | Slice A smoke in an owner-approved isolated Foundry world; source unit tests alone are not an in-world success claim. |
| **R11** | R08,R09 | M | Persisted wait/resume with scoped run state, typed success/fail/cancel, timeout/reentry/reset tests in headless runtime. |
| **R12** | R11 | M | Prove the active system's real inventory use/present interaction as a small adapter; check sender, Actor, item identity and permission. If hook absent, choose a documented dialog-based fallback rather than inventing an API. |
| **R13** | R06,R12 | M | Sequence-first step UI plus wizard built from descriptors; reuse visual Region/Scene/Item/Door pickers, accessibility/reduced-motion support. |
| **R14** | R09,R13 | M | Complete slice B using UI: save draft separately, preview, publish, inspect, reset/remove without raw IDs. |
| **R15** | R14 | M | Isolated GM+two-player acceptance; duplicate requests or incorrect item responses never produce a second world mutation; legacy templates work. |
| **R16** | R14 | S | Puzzles & Locks optional provider handshake; typed success result and safe absent/incompatible state, no sibling source imports. |
| **R17** | R14 | S | H&G optional provider-registration surface for minigames injected into existing Regions, without moving or duplicating its gameplay. |
| **R18** | R15,R16 | M | Directed Region activation links and tested cross-Scene handoff/reset with explicit bounded loop policy. |
| **R19** | R15,R17,R18 | M | Integration checks: existing activities, native Assistant, multiple composed instances, provider missing/version mismatch, saved-data preservation. Compare with original three known failing foundation UI tests. |
| **R20** | R19 | M | One final source/security/migration review; npm run check, npm run build:modules, npm run package:modules; approved Foundry multiplayer QA and release decision. |

**Milestone M1:** R00-R10 proves a publishable slice A. **Milestone M2:** R00-R15 proves the true item-gated flow. **Milestone M3:** R00-R20 demonstrates release readiness. Completion of M1/M2 does not imply full release readiness.

**Dependency order:** R00 -> R01 -> (R02 then R03; R04 then R05 then R06) -> R07 -> R08 -> R09 -> R10 -> R11 -> R12 -> R13 -> R14 -> R15 -> (R16 and R17) -> R18 -> R19 -> R20. Ownership work and registry design may proceed as isolated non-overlapping work, but there should be one integrated source writer by default.

## 5. Time-efficiency operating rules

**Bounded turns:** Use roughly 15-minute work intervals as the user's established handoff rhythm, not as promises that a task finishes in 15 minutes. A scoped issue can span multiple turns. At each boundary record what concretely changed, tests, blocker, and the next single action.

**Tasks not audits:** At each turn read the master checkpoint ledger, this queue, relevant tests, and directly touched source files. No generalized repo map, fresh feature survey, or repeat architectural essay. Only a blocker supported by failed evidence permits ONE targeted inspection of its direct dependencies; otherwise advance the task.

**Verification ladder:** closest unit/test file on every changed task; adjacent legacy regression test where write/publish paths changed; broad Studio/foundation suite at CP3; full check/build/package at CP6. Earlier builds only if a specific modified contract needs them. Repair actual new red tests before opening unrelated work.

**Source recovery is the first gate:** The 2026-10-24 preflight reported an unborn/unresolvable Git HEAD and all repository files untracked. Therefore the original plan's Git rollback assumption is not established. Do not make application edits until a non-destructive snapshot or owner-approved Git baseline exists. Preserve unrelated data, local modules and installs.

**Avoid premature infrastructure:** Do not install Symphony, create a custom orchestration server, generate 20 individual planning documents, require a task tracker, or add a giant AGENTS file for this one program. This roadmap + master ledger + focused tests are sufficient to start. A short AGENTS index may be added only after checking existing instructions and obtaining approval.

**Safe concurrency:** One Codex writer at a time unless independent worktrees, exact scopes, and reconciliation owner are established. R02 ownership tests and R04 registry drafting may be isolated; R16/R17 can be investigated read-only independently. Never run multiple uncontrolled PowerShell writes or assume Dicebox partner delivery is verified.

**Approval economy:** Three owner-level reviews: CP0 contract/source recovery, CP3 runtime permissions/security, CP6 deployment/release. Routine task verification proceeds within the approved implementation scope and each CP gate is recorded. A live Foundry world, credentials, Git history, installations, pushing, and releases always need separate explicit permission.

**Stop conditions:** Block on source-recovery failure, uncertain Bridge receipt, unauthorized write, inability to verify item sender, or test evidence of changed legacy behavior. Log one bounded diagnosis and the next testable hypothesis; do not spin into repeat audits.

## 6. Measurement, progress, and handoff

**At CP2, CP4, CP5, CP6 record:** task cards passed/blocked; focused minutes actually used per card; time spent rediscovering context; failed tests vs known baseline; number of repeated broad audits (target 0); number of conflicting edits (target 0); time to first isolated slice A and fully interactive slice B. Adapt future time budgets based on observed data, not other companies' claims.

**Baseline as of 2026-10-24:** targeted Studio/foundation test run 84 tests, 81 passed, 3 failed. All three failures were in foundation.test.mjs: optional Puzzles & Locks launch expectation, prompt-first Region/Door selection guidance, and Builder UI expectation. Do not falsely credit or blame new tasks for those failures without baseline comparison.

**Progress ledger:** update section 8 of docs/STUDIO_MODULAR_SEQUENCE_IMPLEMENTATION_PLAN.md, not a second progress file. Per turn: R##/CP#/status, modified files, precise test command/result, observation, safety/rollback, and one next task.

**Codex kickoff prompt (replace R## with one task ID):**

Work in C:\Users\rujie\Documents\Region Editor. Read docs/PROJECT_STANDARDS.md, docs/STUDIO_MODULAR_SEQUENCE_IMPLEMENTATION_PLAN.md, and docs/STUDIO_CODEX_EFFICIENT_EXECUTION_ROADMAP.md. Execute only R##. Check the checkpoint ledger, source recoverability, and directly relevant files. Do not repeat the previous full-engine audit. Make the smallest safe change, run focused tests, and record observed evidence in the master ledger. Preserve existing Studio activities and companion independence. Do not commit, push, install, or touch live Foundry without separate authorization. If command outcome is uncertain, inspect the durable receipt or readback before retrying. Stop at the scoped task's acceptance.

**Completion standard:** In a test world, a GM assembles a script sequence and then uses a generated wizard to bind Region, Item, and Door; the authorized player's item presentation resumes that run and unlocks once; wrong/cancelled input cannot unlock; reset/remove preserves other Region behaviors; companions are optional; legacy content works. Record demonstrated in-world outcomes separately from unit tests.

## 7. Dicebox Bridge: Foreman and Switchboard integration policy (2026-10-24)

**Use the Bridge as optional coordination infrastructure, not a new dependency of Regionwright's code or development process.** These rules operationalize the existing one-writer, bounded-work, no-blind-retry workflow.

**Verified read-only Bridge status at planning time:** local journal/runtime, tunnel readiness, and persistent PowerShell were ready; current chat identity was not canonically verified; active live Codex sessions were zero; this Bridge server lacked Codex native app control. Therefore native Foreman/Switchboard delivery is NOT confirmed. Never describe these features as connected until exact endpoint/session verification and transcript-confirmed delivery succeed.

### Roles and state ownership

- **Codex Foreman: implementing worker.** Owns exactly one R## task at a time, defines a bounded work unit, records tests/evidence, maintains a local work-unit checkpoint and the next action. Once the canonical Codex endpoint is actually bound, it may use bridge_foreman_work_claim, bridge_foreman_work_heartbeat and bridge_foreman_checkpoint for leases and durable local progress. These actions do not depend on partner-chat message delivery. Do not guess an endpoint ID.
- **Codex Switchboard: coordinator, distinct from any ChatGPT chat nicknamed 'B'.** Optionally sequences R## assignments, checks checkpoint completeness, and passes read-only evidence to an authorized peer. It does NOT become the source-of-truth plan, rewrite files concurrently, approve a risky operation on the user's behalf, or replay unknown actions. One integrated source writer remains the default.
- **Review peers:** use only for bounded, non-overlapping, read-only review work, especially the CP3 runtime/security gate and CP6 integration gate. A peer may report findings but cannot declare a merged implementation or authorization without repository readback.
- **Repository:** source code, tests, plans, and the master CP0-CP6 checkpoint ledger are authoritative for project state. Bridge journal, local work checkpoints, messages, receipts, and context packs are supplementary transport/evidence. Recovery never depends on a remote chat reply.

### Fast-path protocol for a bounded R## task

1. Switchboard, if available, names **one exact** R## and commit SHA; Codex Foreman validates local checkout and the master ledger before claiming. Without Switchboard, Foreman reads the master ledger directly and continues the approved task locally.
2. Foreman claims a local work unit with a stable workUnitId and claimId; does small implementation/test work; heartbeats only if the lease actually needs extending. Never use a lease as permission to operate on the wrong repo or world.
3. At completion or block, Foreman records a durable local checkpoint with completed/blocked status, concrete evidence and one next action; mirrors a concise handoff to the repository master ledger. A remote message is optional, not a blocking prerequisite.
4. If sending a handoff, use exact verified source and destination endpoints, an active authorized session, stable operation/correlation IDs, and references that identify the commit, file, task and checkpoint. For context packs, pin repository files to the full commit SHA. An INFORMATION_PACKAGE conveys facts, not permission for source changes.
5. Before ANY retry of a send or PowerShell call with uncertain result, inspect the exact receipt, transcript/journal, and/or destination state. No blind relay retries, recreated sessions, or duplicate writes. Pending, unknown, active or unreadable delivery is not failure.
6. If Bridge fails while work is local, continue through the saved local checkpoint and repository ledger. Use a local file/status note as evidence only, never as proof another agent saw it.
7. Switchboard schedules read-only peers only for an actual bottleneck, large independent evidence packet or CP3/CP6 review. Otherwise skip coordination overhead and execute the next R##.

### Safety and availability gates

- **No Foreman auto-activation here:** exact current-chat identity/host metadata was unavailable, and the native Codex app-control channel was not configured at audit time. Do not invent IDs, infer binding from an anonymized session correlation, or call send/dispatch to test this path.
- **One writer is a performance safeguard.** Read-only parallel reviews may shorten waits; multiple writers require isolated worktrees, explicit file scope, one merge owner, and readback-confirmed state.
- **No extra audits or obligatory roundtrips.** CP0, CP3, and CP6 stay the only broad review boundaries. Bridge health/status checks are justified when a specific relay is needed or failed; do not poll on every microtask.
- **No hidden authority escalation.** Foreman leases, Switchboard assignments, Bridge messages, and context packs do not authorize Git pushes, live Foundry writes, world changes, installation, or data deletion.
- **Near-term improvement:** Use local Foreman claims/checkpoints on the *Codex host* once its canonical identity can be verified, while using Switchboard only to coordinate review boundaries and independent tasks. Do not make the unverified native-chat path a prerequisite to R01.

### Source recovery and initial HEAD

The initial HEAD should preserve the operational source baseline (source modules, tests, scripts, documentation, and project tooling) rather than indiscriminately snapshotting large archives, temporary or diagnostic output, and campaign media. Do not treat this limited source commit as a backup of all excluded files. Do not push to the remote without explicit authorization. Verify the commit and clean index after creation; for each future R##, record an exact commit SHA or other immutable snapshot reference if Bridge context is shared.

**Work status:** This roadmap is a planning document. R00-R20 are not started. No runtime code, installations, Git history, or world state is changed by its creation.
