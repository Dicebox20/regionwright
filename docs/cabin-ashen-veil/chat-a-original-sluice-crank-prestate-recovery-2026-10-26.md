# Cabin in the Ashen Veil — Chat A original 587 Crank and Sluice recovery hardening

**2026-10-26 Pacific ~16:32–16:42. Owner direction:** “resume.” **Scope:** Chat A existing Study 587 → authentic Donovan Crank → Sluice synchronized Pond/Bath water authority. Chat B continues source-only late game, no shared checkout or live world writes.

## PREPARE / INSPECT

Verified Regionwright source branch `codex/cav-sune-integration-20261026` at **`ca177160fd5721eb721da40652f8b389d3340a1b`** prechange; full Foundry 14.367 game world `cabin-in-the-ashen-veil` and Dev Chrome CDP initially available, current live GM stage previously read back. Other local untracked assets and Chat B source untouched.

Read `modules/regionwright/scripts/studio-cav-587.js`, `studio-cav-sluice.js`, `studio-cav-water-state.js`, `studio-cav-water-controller.js`, and related tests. Owner's original one-time 587 lockbox awards unique source `Item.g3VYdgc1qkgkHGvn`, Crank installation reserves/consumes the genuine Item and records `cavSluiceCrankInstall.status=done`, then creates `cavPondBathWaterState` at `{version:1,status:"closed",pond:"full",bath:"full",stage:"initial",source:"cav-sluice-crank-install"}`. Later actual elected-GM water change writes reserved `cavSluiceStageTransaction`, synchronized Pond and Trail destination, committed `cavPondBathWaterState`, and `cavSluiceStageTransaction.status="done"`/committedState.

**Reproducible source vulnerability found:** the water controller only checked `cavSluiceCrankInstall.status==="done"` and accepted `normalizeCavWaterState(null)` as initial closed/full. A fitting crash AFTER writing done but BEFORE writing initial water stage leaves a misleading “valid” default, so subsequent opening could proceed despite missing source receipt. Also an already opened/closed stage could be honored without the matching prior completed transaction. A native world mutation was **not performed** to reproduce this; it was demonstrated by reading call paths and in pure tests.

## BUILD — minimal fail-closed original receipt validator

Added **`evaluateSluiceRecordedPrestate({crank,water,transaction})`** pure helper to `modules/regionwright/scripts/studio-cav-water-state.js`:
- Requires original one-time consumed Crank receipt `version=1,status=done,sourceUuid=Item.g3VYdgc1qkgkHGvn`, nonempty `consumedActorItemId` and `boxRegionUuid`. A reserved/partial/mismatched source does not qualify.
- For the **FIRST** opening, requires a real stored `version1` `closed/full/full` **initial** record from `cav-sluice-crank-install`, with **no previous transaction**. NULL water is explicitly unsafe even though the legacy pure water-normalizer can display a default closed/full state.
- For subsequent opening or closing, requires the stored water `stage="committed"` and `source="sluice"` plus exact prior `cavSluiceStageTransaction`: version1, status DONE, matching operation/committedState and next Pond/Bath statuses. Reserved, stale, conflicting or manually faked stages fail closed.
- Returns structured `{ready,reason}` for auditing. It performs no world writes and changes no role/owner/scene requirements.

`modules/regionwright/scripts/studio-cav-water-controller.js` now calls this helper **before** map/portal inspection and `cavSluiceStageTransaction.status=reserved` world write. Failure returns existing GM **reconcile** path; no special reward, automatic rollback or silent retry.

Added **six** regression cases in `tests/cav-sluice-prestate-recovery.test.mjs`: genuine first stage, missing/partial Crank, invalid first-stage prior transaction, valid completed open/close, forged/reserved/mismatched transition, GM source integration ordering. No arbitrary synthetic Crank/Item is ever created in the live world. Original source's existing Crank fit and two-body water logic remains intact.

Initial automated patch partially updated the pure helper but failed an exact whitespace anchor **before changing the controller**. Diagnosed from the durable Bridge receipt, completed the controller patch against a stable unique source line, then added tests. No unverified retry of native/Foundry writes.

## VERIFY — source, installed module and live elected GM

- Node check passed for both modules, 16 targeted tests PASS including 6 new tests.
- Full Cabin non-destructive regression suite **101 PASS / 0 FAIL** (95 → 101) using single-concurrency Node due fluctuating machine RAM. Both source JS files copied to existing installed Regionwright module, exact SHA256 equality:
  - `studio-cav-water-state.js`: `379E53BEC1B3E67CA5283F01197BA88E891B4C97FD30C948AD6601ADE7E8DF8E`
  - `studio-cav-water-controller.js`: `454C974214658F0D1BFB430777F41D8CFC3743AE6FBE991952E2E76F1BDC53B4`.
- **ONE** guarded existing Dev Chrome `/game` page reload passed native preflight and `SINGLE_RELOAD_NAVIGATION_COMMITTED`, then finished without Bridge ambiguity. Fresh, separate authenticated elected-GM live CDP readback verified current `game.ready`, world, Foundry version and GM, import of **new helper from loaded module**, plus pure synthetic argument assertions: missing water denied, authentic initial accepted, previously opened committed accepted, reserved prior transaction denied.
- Current elected-GM water listener registered, paired Bathhouse fixture preflight OK. Native original Sluice Behavior enabled, Rosewater disabled. Live Crank flag `null`, shared water `null`, stage transaction `null`, ring session `null`, approved `rose,sun,moth,thorn`, ChatMessages **54**. No scene/item/actor/token/journal/world-state write, and no actual non-GM click/playtest.
- Positive evidence `C:\Users\rujie\AppData\Local\Programs\Chrome for Testing Dev\utility-harness\artifacts\cav-chat-a-original-crank-water-prestate-after-reload-electedgm-20261026.json`. Guarded reload helper archived alongside in utility-harness artifacts.

## CATALOGUE / next Chat A boundary

Chat A retains live Foundry + shared water/Gear/Crank/Rosewater authority; Chat B remains isolated late-game source. This change **does not commission Rosewater or the Aqueduct**, advance the Crank, populate a player actor with the Item, drain/fill any pool, spawn Crooked Man or conduct owner-deferred ordinary-player gameplay tests. The early/midgame vertical slice is ready for later real Player 1 acceptance when owner authorizes it, using genuine Study key → Study 587 note → Donovan lockbox → fitted Crank → safe synchronized Sluice open and actual dry Bath/Boiler/Rosewater Region tests.

**Next worthwhile bounded source task:** investigate conservative recovery of `reserved` 587 Crank **claim** and `reserved` Sluice fit after uncertain embedded Item creation/deletion, keeping manual GM reconciliation and original Item provenance; do not automatic replay. Other current source documentation remains authoritative for the fixed Bathhouse return geometry and stalled native Rosewater commissioning.
