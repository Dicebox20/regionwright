# Cabin in the Ashen Veil — Chat A enlarged batch: drained pickup successors, Aqueduct parts and Boiler inspection

**Date:** 2026-10-26 Pacific, ~20:07–20:18. **Owner instruction:** “Lets start installing slightly larger batches, start doing installations and instpections in one turn.” **Scope:** owner-authorized multi-feature batch; Chat A early/midgame and shared Foundry/Regionwright authority. Chat B isolated late-game. **Workflow:** PREPARE → INSPECT → BUILD (three related safeguards) → VERIFY (one integrated 162-test suite and one guarded reload) → CATALOGUE. No fabricated player gameplay, Crank/water stages or chase.

## PREPARE / INSPECT verified original state
Source repository `Dicebox20/regionwright`, integration branch `codex/cav-sune-integration-20261026`, pre-batch pushed head `ef569be1d4da7355f5a4499e54ec135947b8255f`. Tracked files clean; untracked owner art, archives and experimental files excluded from staging. Foundry 14.367 port30000, Dev Chrome9224, elected Gamemaster 1 world `cabin-in-the-ashen-veil`, 47 Scenes, 54 ChatMessages. Machine memory occasionally less than 1 GiB; use single-concurrency Node testing.

**Inspected native original dependencies in one GM read-only batch** (`utility-harness/artifacts/cav-chat-a-batch-original-boiler-weathered-basement-nightstand-baseline-20261026.json`):
- **Weathered Key** from original drained Pond Region `Scene.CAVEXT02Scene001.Region.CAVPONDWEATHER01`; **Screwdriver** from original drained unified Bath `Scene.8yLMRDvxyw58dydh.Region.CAVBATHSCRDRY001`. Both pickup Regions have one existing enabled player source script. Their `cavDrainedPickupClaim` records are NULL; no actual original tagged item is held.
- **Basement** `Scene.CAVHG02Scene0001.Region.CAVFOYERBASEDR01`, one original enabled click script and disabled `CAVFOYERBASPORT1` teleport to original Basement. `cavWeatheredBasementUnlocked=null`.
- **Parents' Nightstand** `Scene.CAVHU04Scene0001.Region.CAVPARENTNIGHT01`, one enabled native click script; repair `cavNightstandRepaired=null`, Handle claim `cavNightstandHandleClaim=null`. Original Aqueduct Handle source `Item.nRVZJL9JOwEwfnLq` exists.
- **Original Pond Aqueduct gate** `Scene.CAVEXT02Scene001.Region.CAVPONDAQGATE001`, existing native player script enabled, traversal teleport `CAVPONDAQPORT001` disabled; gear, handle, ready mechanic flags NULL. Roof Clock Region `Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001` Gear award `cavRoofClockClaim=null`. Original Gear source `Item.wDKqETOykWEdKF1Z` and Handle source exist as loot quantity1. Roof Gear, Nightstand Handle and Pickup sources inspected for exact UUID/name/type/quantity.
- **Boiler pressure** existing Region `CAVBBOILERCTRL01` on both `Scene.CAVBATHScene0001` and `Scene.8yLMRDvxyw58dydh`, same 365/938/280/250 rectangle, one enabled `CAVBOILERSCRPT01` executeScript per variant, `cavUnifiedBathPuzzleBinding.status=ENABLED` and empty mirrored GM sessions. Elected-GM `boiler.describe()` reports `ready` and canon `[2,1]`. **No defect requiring Boiler reinstall; preserved both Behaviors and exact state.**
- Original Crank `cavSluiceCrankInstall`, Pond/Bath water `cavPondBathWaterState` and transaction `cavSluiceStageTransaction` all NULL; actual Pond background still FULL and Trail teleport still routes solely to FULL Bath; Rosewater native RegionBehavior remains disabled. Crooked Man NPC/first chase and all real PC acceptance tests remain owner-deferred.

## INSPECT findings addressed within one deployment batch
1. **Basement Weathered Key unlock** in `studio-cav-basement-nightstand.js` formerly only required a held provenance-tagged Weathered Key Item. The original drained-Pond grant writes `cavDrainedPickupClaim=reserved`, then creates the Item, then writes DONE with `embeddedItemId`. An interrupted award could leave a tagged Item and incorrectly unlock the Basement before the original claim actually completed.
2. **Nightstand Screwdriver repair** likewise trusted a tagged embedded Screwdriver without requiring the original drained Bath pickup DONE ledger. Downstream **Gate Handle award** trusted `cavNightstandRepaired.status=done` but did not reconcile the repair ledger with the completed original Screwdriver pickup. This could allow mistaken prerequisite proof.
3. **Aqueduct Gear and Handle fitting** in `studio-cav-aqueduct-gate.js` trusted source tags but did not require corresponding original Roof Clock or Nightstand Handle DONE award/embedded Item IDs; also used only broad Pond water=open and transaction.status=done, not the already established original completed Sluice Crank + committed open two-body drained proof. Incomplete item grant or stale CLOSED water transaction could prematurely consume the original mechanical part. AQ traversal itself was already properly disabled, and remains so.

## BUILD — four source files, three related hardening changes, no new native Regions
NEW pure `modules/regionwright/scripts/studio-cav-successor-pickup-proof.js`:
- `assessCavSuccessorPickup` requires exact world original Weathered Key/Screwdriver Item template (loot, quantity1), original pickup Region, DONE `cavDrainedPickupClaim` with actor/source/embeddedItemId; exactly one provenance-tagged owned Item across world Actors, matching the claimant Actor and exact original embedded Item ID/name/quantity/origin/special flag. Any missing/reserved/duplicate/mismatched or transferred record requires manual GM reconciliation, not auto-grant.
- `assessCavNightstandRepairProof` requires completed original Screwdriver pickup matching the original DONE Nightstand repair actor/tool source. Does **not** demand the Screwdriver still be held after its legitimate repair.

UPDATED existing `studio-cav-basement-nightstand.js`:
- Replaced the shared `exactItem` predicate with authoritative source+original pickup proof, used by **both elected GM** unlock/repair handler and **non-GM player** click eligibility; original Foyer/Parents' native Region IDs/art/events unchanged.
- Before the original one-time `cavNightstandHandleClaim=reserved` Item creation, requires genuine completed repair tied to original DONE Screwdriver pickup. Client “Take Gate Handle” button also fails closed if that recovery proof is absent. No automatic Item/door writes from verification.

NEW pure `modules/regionwright/scripts/studio-cav-aqueduct-part-proof.js`:
- `assessCavAqueductPartProof` requires original Roof Clock Gear/Parents' Nightstand Handle world source, original source Region and DONE grant `cavRoofClockClaim` / `cavNightstandHandleClaim` with exact actor+embedded Item ID, unique matching provenance-tagged Item, quantity1, and original clock or repaired drawer flag. For Handle also requires completed original repair/Screwdriver receipt. No automatic re-creation/consumption of ambiguous reserved claims.

UPDATED existing `studio-cav-aqueduct-gate.js`:
- Shared original `sourceCopy` now enforces exact part receipt for both client choice and GM consumption.
- Shared `gateWaterDrained()` uses the **already installed** pure `assessCavDrainedPickupWaterReady`; requires original fitted consumed Crank `Item.g3VYdgc1qkgkHGvn`, committed OPEN Sluice transaction with both Pond/Bath drained, owner approved drained Pond art, exact enabled one-target Trail→DRY Bath route and landing. Both UI and GM stage call that same guard before any `cavAqueductGearInstalled/HandleInstalled` RESERVE or owned Item deletion. AQ route commissioning and first chase remain disabled and outside this task.

All four changes affect **existing Regionwright source only**. No replacement/duplicate Boiler, Bath, Foyer, Parents, Roof, Pond, AQ or region/behavior modules. No direct native Foundry writes. Source original and installed backups under untracked local `docs/cabin-ashen-veil/backups/chat-a-batched-successors-20261026`.

## VERIFY — 162 PASS plus fresh elected-GM postreload readback
Added tests:
- `tests/cav-successor-original-drained-pickup-proof.test.mjs`: **10** pure+source-contract tests for original Weathered/Screwdriver rewards, each reserved or DONE grant, missing/mismatched/duplicate items, actor IDs, required original Region and Handle repair provenance and both client/GM integration.
- `tests/cav-aqueduct-original-parts-and-drain-proof.test.mjs`: **8** pure/source-contract tests for original Roof Gear and Nightstand Handle DONE, reserved grants, wrong source or item identity, duplicate Items, real Screwdriver repair prerequisite and both client+GM use of original committed drain.

Focused tests all PASS. Full Cabin non-destructive Node source suite **162 PASS / 0 FAIL**, previously 144. All four scripts installed into the existing regionwright Foundry module with `node --check` and **exact source/installed SHA256**:
- `studio-cav-successor-pickup-proof.js`: `C62F4652A3BBACE1BC9610407278A4CF54617CDF2338ACF2DC7371F2CD32E3D2`
- `studio-cav-aqueduct-part-proof.js`: `A830DB8DF52CD5D5558C2E354F615C98C99F50D570062EFAAD8F9ED33FE0F408`
- `studio-cav-basement-nightstand.js`: `D33D5A9970C8E2930093F5FB1A4ED3A2A9177B40B5F886D74012796570533C2E`
- `studio-cav-aqueduct-gate.js`: `0DFA3CD107AF2D33FABDCE04096ED7449B8D89EABD3195CFBAB1E84A42BDEE05`

**ONE** elected-GM-preflight-guarded existing Foundry `/game` page reload completed after verifying 47 Scenes, 54 original ChatMessages, zero original reward/repair/gear/handle/water flags, Aqueduct portal DISABLED, and Boiler both variants `ready` with session NULL. A separate fresh active elected-GM read-only browser inspection confirms all four source imports live; the original Weathered Key DONE receipt pure scenario allowed, reserved Weathered Key denied, original Handle DONE+repair allowed, reserved Handle and missing repair denied. Actual original gate/repair/reward/water statuses all NULL, original basement/Aqueduct teleports still disabled, enabled original click Behaviors unchanged, Pond FULL art and Trail→FULL Bath intact. **Boiler ready on both native variants, both sessions NULL and canon [2,1]**. Sune, pickup, basement, AQ and Boiler GM services still registered. Rosewater disabled, 54 ChatMessages, zero world-owned provenance-tagged successors.

**Positive immutable on-host receipt** `utility-harness/artifacts/cav-chat-a-large-batch-three-downstream-guard-and-boiler-postreload-gm-20261026.json`.

No actual token movement, original Item grant or consumption, water change, native Region/Scene/Behavior edit, puzzle solve, Aqueduct route commissioning, Crooked Man spawn, or non-GM gameplay test.

## CATALOGUE — new owner-directed batch convention
Owner directs slightly larger batches with **inspection and multiple related installations in a single turn**. Within each bounded ~25-minute turn, group **2–3 adjacent dependency fixes, one integrated source regression sweep, one guarded Foundry reload and independent live GM readback** where applicable, then chronological log/JSON/Chat A handoff, while retaining all established PREPARE/INSPECT/BUILD/VERIFY/CATALOGUE safety and no fake progression. Reinstall only if evidence shows a defect; the healthy dual Boiler was inspected, not replaced. This batch consolidates **3 downstream safeguards + independent Boiler live inspection**.

**Next Chat A:** continue dependency graph at roof Clock→Aqueduct mechanically-ready receipt and Boiler result downstream, prioritizing genuinely incomplete source edges over re-auditing these four already verified modules. Chat B remains late-game source-only, and the first Crooked Man Actor/chase and full Player 1 acceptance remain owner-deferred. Rosewater remains disabled until true 587 Crank committed drain, with owner-approved `rose,sun,moth,thorn` [1,3,2]; original Sune Bowl `Item.1n5LONw3nYIy61O9` pickup site still undecided.

**Classification:** Built+installed original source, **162/162 source tests PASS**, **GM live loaded and inspected**, player-playable not asserted. Chat B no shared-world write or merge this turn.
