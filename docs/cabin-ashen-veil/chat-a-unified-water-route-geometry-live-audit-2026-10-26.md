# Cabin in the Ashen Veil — Chat A Live Bathhouse/Pond/Aqueduct Route Geometry and Sluice Return Safety

**Date:** 2026-10-26 Pacific, approximately 15:30–15:43.
**Assigned workstream:** **Chat A**, early/midgame, live Foundry integration and GM safeguarding; **Chat B** owns late-game source-only work on separate branch/worktree. The owner already sent the dedicated Chat B handoff.
**Evidence level:** authenticated elected-GM native **read-only map/Region audit**; source patch and installed JS hash; 87 pure/regression tests; **live GM source reload and readback passed**. No non-GM player walkthrough, original Crank fitting, water draining, token movement, item granting or first chase activation occurred.

## PREPARE / CATALOGUE SOURCE

Existing Regionwright branch `codex/cav-sune-integration-20261026`, base HEAD `508406a87f4d58df480da5461bd053a64924d820`; owner's checkout `C:\Users\rujie\Documents\Region Editor`. Read original `studio-cav-water-controller.js`, `studio-cav-unified-bath-interlock.js`, `studio-cav-aqueduct-routing.js`, `studio-cav-sluice.js` and relevant tests. No overlap with Chat B's late-game feature source. Dev Chrome 9224 initially offline; launched exactly **one** documented CFT Dev utility-harness without duplicating a listener. Bridge briefly returned MCP-not-initialized; a read-only bridge doctor showed a functioning local runspace and the next bounded PowerShell request succeeded. Foundry 30000 stayed online.

## LIVE native PREPARE → INSPECT receipt

At exact `http://127.0.0.1:30000/game`, browser CDP verified `game.ready`, `game.version=14.367`, `game.world.id=cabin-in-the-ashen-veil`, elected Gamemaster 1, original Scenes and native Regions.

Local receipt on owner PC:
`C:\Users\rujie\AppData\Local\Programs\Chrome for Testing Dev\utility-harness\artifacts\cav-chat-a-unified-bath-pond-trail-aqueduct-geometry-audit-20261026.json`.

The first draft audit had an internal JS lexical-shadow error (`Cannot access 'b' before initialization`) and did not perform a live read. Corrected the read-only audit helper and then successfully captured the actual original objects. **Twelve independent source-derived comparisons passed**:

1. Right world/GM.
2. Filled/drained Bathhouse 2160×1440 with 120-grid matching geometry.
3. Original full background art `Maps/cabin-in-the-ashen-veil/bathhouse_unified_surface_owner-approved.png` matched controller.
4. Approved dry art `Maps/cabin-in-the-ashen-veil/bathhouse_unified_surface_drained_owner-approved_2026-10-26.png` matched controller.
5. Pond Scene and its single level show the original approved *full* art `Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png`.
6. Trail portal `Scene.CAVTRAILScene001.Region.13g6uK1QrR9PFOzA.RegionBehavior.ZbrhX0nnaLvLA5Zh` is enabled and correctly enters **filled** `Scene.CAVBATHScene0001.Region.R2Pg9eHODtb1C1Yk` while stage is initial.
7. Filled/dry Bathhouse arrival shapes are identical (rectangle x1810,y345,w165,h160).
8. Filled/dry Bathhouse return shapes identical (rectangle x1920,y95,w170,h145).
9. Both original return RegionBehaviors `EK3UbdrVWwe28PmW` are enabled and point to exactly `Scene.CAVTRAILScene001.Region.N5LomZ7TrVBMoExk`.
10. Shared fixture Regions—Boiler Vessel, Boiler Controls, north/south Side Basins—have identical footprints, fixed IDs, correct flags on both variants.
11. Rosewater `CAVBROSEWATER001` exists on **DRAINED ONLY** at x976,y826,w108,h115; owner-approved rose/sun/moth/thorn flag intact, actual ring session NULL, native `CAVROSEWATERSCR1` disabled.
12. All Pond/Bath/Aqueduct target Scenes empty of tokens and initial Crank, water stage, Sluice transaction still NULL. No fake progression.

The Pond→Aqueduct entry, Aqueduct→Pond return, Aqueduct→Forest Well exit, and Forest Well→Aqueduct reentry Regions all exist with canonical stable destinations; native teleports remain disabled. A second direct import of the live Aqueduct routing module returned `checkAqueductRouteForWater("closed")={status:"ready",commissioned:false}` and `describeAqueductRouting().status="verified-topology"` with all **five** intended native entry/return/well/chase switches disabled. Receipt `utility-harness/artifacts/cav-chat-a-aqueduct-live-pregame-routing-ready-20261026.json`.

**Conclusion:** No missing map or broken portal was found; DO NOT rebuild scenes, change geometry, silently commission Aqueduct or activate chase/Forest Well.

## BUILD: narrow fail-closed source improvement

Actual `studio-cav-water-controller.js` had `geometryEqual(left,right)` testing equal rectangles and comparing `[...lb.system.destinations]` with `[...rb.system.destinations]`, but could dereference **missing return teleport Behavior** and never required either return Behavior to be enabled or to point to the original Trail. A pending Sluice drain should not crash or proceed without a verified Bathhouse escape route.

Hardened this *existing* source routine only:
- Exported `geometryEqual` for pure regression and GM source readback, preserving existing call sites.
- Required each filled/drained return `teleportToken` Behavior to exist, be `disabled:false`, expose exactly one Set-like destination, and target `Scene.CAVTRAILScene001.Region.N5LomZ7TrVBMoExk`.
- Required matching native Behavior IDs in both variants and unchanged arrival/return shapes and dimensions.
- Returns **false rather than throwing** if any required return object, Behavior, destination, or Scene is absent.
- This check is used in both Sluice preflight and the `returnRoutesSafe` input to `planCavWaterChange`; no new Region, native world flag, reward, Item, portal or stage write added.

Added **four focused tests** in `tests/cav-bathhouse-return-route-failclosed.test.mjs`: valid original route; missing/disabled/malformed Behavior; wrong target/ID/shape/grid; missing Scene/Region nonthrowing failure. Installed JS path `C:\Users\rujie\AppData\Local\FoundryVTT\Data\modules\regionwright\scripts\studio-cav-water-controller.js` matches tracked source SHA256 `331E4685418718E88E19D25C72020D6049BD7FF57185BE0D8A1A53CEB56F6551`, `node --check` PASS. Full non-browser Cabin suite **87 PASS / 0 FAIL**, up from 83.

## VERIFY: runtime reloaded and elected GM readback

Initial generated reload helper script had syntax errors and was caught by `node --check` *without accessing Foundry*. Corrected it before any live reload. Then conducted exactly **ONE** live guarded page reload. Navigation succeeded, `game.ready` returned true and current elected GM verified:
- `(await import("/modules/regionwright/scripts/studio-cav-water-controller.js")).geometryEqual(full,dry) === true`
- `inspectUnifiedBathFixtureWaterSafety() === {ok:true,reason:"single-map-geometry-verified",...}`
- `rosewaterRings.describe().status="not-commissioned"`, `sluiceProof.ready=false` with original 3 expected blockers (Crank missing, committed drained state missing, Sluice transaction missing).
- Original Crank, shared water state, transaction remain NULL; Rosewater Behavior remains disabled; symbols approved and original fixture unchanged.
- Local positive receipt: `utility-harness/artifacts/cav-chat-a-safe-bath-return-postreload-gm-receipt-20261026.json`. This turn's post-reload source runtime is **VERIFIED**, unlike earlier uncertain reloads.

## Chat A/Chat B integration boundaries and next tasks

Chat A retains original Study/587 Crank → synchronized Pond/Bath drain, Aqueduct gate and first Crooked Man chase, Boiler, Rosewater, Sophia, and live Foundry installation. Chat B owns independent late-game source, with no shared file edits or live Foundry writes. **No direct bridge message or Chat B acceptance has been claimed.**

Next safe Chat A work: inspect **original Sluice click overlap and player-accessibility** and prepare non-GM QA checklist for when the owner authorizes final gameplay testing. Do not force a player to possess a Crank, mark the gate open or place simulated player tokens as a shortcut. Once original real player-fit + committed synchronized drain proof exists, commission original disabled Rosewater Region after click-region inspection. The Sune Bowl unique original Item and exact owner-approved on-map pickup remain separate. Do not build superseded BATH-03/BATH-04 Scenes or Crooked Man Actor before owner's designated acceptance phase.
