# Cabin in the Ashen Veil — Chat A Bowl missing-fixture failure and native geometry proof

**Date:** October 26, 2026 Pacific, ~23:01–23:08. **Workstream:** Chat A early/midgame. **Owner:** continue installation, keep full compatibility diagnostic and real-player acceptance until entire campaign installed.

## PREPARE / live source and Foundry
- Dicebox Bridge doctor: 0.1.26 PowerShell/local tunnel ready, exact current chat identity unverified. Used local PowerShell only; no Bridge Foreman routing or partner chat delivery.
- Regionwright base: codex/cav-sune-integration-20261026, commit 0b4a30f0efe69642e95d81be221ad688ed54859d. Zero tracked changes before bounded repair. Existing unrelated untracked files preserved.
- Existing Chrome for Testing Dev CDP 9224 and Foundry 30000 both reachable. One exact /game tab authenticated in Foundry 14.367 world cabin-in-the-ashen-veil; elected Gamemaster 1. Concurrent Chat B installations brought native census to 47 Scenes / 234 Regions / 123 Behaviors. Did not overwrite or revert those independent changes.
- Prior Sune Bowl service source/local disk SHA: 70732E8FD211AC2BC6887EBE2EA9EEC572BBE807BDADC47F68F909F92D758C65. Bowl native fixture not installed; original owner Bowl fixture approval NULL; ring native disabled, Crank/water NULL, zero Bowl actor copies. Module API rosewaterBowl.describe function is registered in active runtime from a previous module reload.

## INSPECT: verified missing-owner-fixture null dereference
- Read-only elected-GM direct ESM import of deployed Bowl module was successful but describeOriginalCavBowlPickupGM threw TypeError: Cannot read properties of null (reading id).
- Root cause in context nativeReady: fixture?.uuid===approval?.regionUuid can be TRUE when BOTH fixture and approval are null, causing following fixture.id dereference. This is a module install-time inspection crash, not a GM reward write.
- Earlier static tests did not execute the actual function with absent approval; added authentic game-style fixture mocks to exercise the real GM describe without any side effects.

## BUILD and VERIFY
- Narrow original-source-SHA-pinned edit adds explicit !!fixture && !!approval && !!ring before native fixture UUID/Region checks. All other original owner approval, source Item, ring DONE, Crank/water, Actor authorization and once-only reward code unchanged.
- New source SHA: 180BF7800E3AC5395257373E40BABA9A6DB60479A0E5AD203D93EBBEF0D25AB0.
- Added two focused tests: missing owner approval and approval referencing a nonexistent original Region must both return owner-fixture-approval-missing with nativeReady=false, no world write; static assertion requires safe null guard.
- Focused Bowl suite 21/21 PASS. Full Cabin source suite 238/238 PASS (43 files, zero failures), previously 236.
- Copied exact corrected source to installed Regionwright module disk only after pinned old and new SHA preflight; stored original installed bytes in utility-harness/artifacts/cav-chat-a-bowl-pre-null-guard-original-20261026.js.txt. Verified deployed SHA and Node syntax. No Foundry reload, no RegionBehavior/item/flag change.
- Second elected-GM read-only FRESH versioned module import returned status owner-fixture-approval-missing, approvedFixture=false, nativeReady=false, ringNativeReady=false, ringStatus=NULL, sluiceReady=false, sourceItemReady=true, claimStatus=NULL. Rosewater Region disabled=true, zero actor Bowl copies, still 47 Scenes / 234 Regions / 123 Behaviors. Positive receipt utility-harness/artifacts/cav-chat-a-bowl-absent-owner-fixture-live-gm-readback-20261026.json.
- IMPORTANT live runtime distinction: game.modules.get(regionwright).api.campaign.cabin.rosewaterBowl.describe in the already-running page still throws the old TypeError because it holds the original module import. A full coordinated Foundry page/module reload is needed to pick up installed on-disk source; DO NOT call this corrected as active runtime API until after reload. No reload forced to avoid disrupting Chat B.

## Owner geometry pre-install evidence
- Read-only native geometry receipt utility-harness/artifacts/cav-chat-a-rosewater-screwdriver-owner-geometry-readonly-20261026.json.
- Original owner-approved drained unified Bathhouse 2160x1440 image; original Screwdriver pickup Region CAVBATHSCRDRY001 rectangle x=870,y=710,w=360,h=330.
- Original staged Rosewater ring Region CAVBROSEWATER001 rectangle x=976,y=826,w=108,h=115, COMPLETELY INSIDE Screwdriver click hit area. Thus they cannot currently operate as independent hit targets at those exact shapes. Ring disabled and ownerReviewRequired true; owner-approved ring symbols rose/sun/moth/thorn do not certify placement geometry.
- Bowl unique original World Item Item.1n5LONw3nYIy61O9 exists, but separate Bowl pickup Region/shape has not been explicitly owner-approved. No assistant inference is treated as approval to move either fixture, install Bowl RegionBehavior or activate puzzle.

## CATALOGUE / NEXT
- Preserve this source and machine receipt, Regionwright chronological log, exact new source commit and DCH dated handoff and per-turn transcript.
- Coordinate later refresh of original elected-GM module with Chat B after content installation; verify active API returns explicit blocked state without mutations.
- Owner selection required for Rosewater/Screwdriver hit-target redesign and physical Sune Bowl pickup location. Original ring/award remain staged; original Crank/water needs genuine play. Do not create duplicate Bathhouse lower rooms.
- Continue installing other approved missing campaign content without touching Chat B area; full compatibility diagnostic only after installation as owner directed.

**Classification:** 238 source tests PASS; disk source installed; corrected fresh GM module import PASS; active module API stale pending reload; Bowl gameplay uninstalled/not approved.
