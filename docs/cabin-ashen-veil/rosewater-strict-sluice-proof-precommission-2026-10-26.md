# Cabin in the Ashen Veil — Rosewater original Sluice drain proof and commissioning preflight

**Date:** 2026-10-26 Pacific. **Owner:** "Lets continue" following Rose/Sun/Moth/Thorn owner approval. **Status:** Approved symbol flag and existing native Region script verified in recovered elected-GM world. Strict GM water-proof source deployed and 83 pure/regression tests passed. **No Rosewater puzzle activation or player gameplay test**, because water has not actually drained.

## Established workflow and authentic progression

Current owner canon uses the installed single unified Bathhouse map, not separate BATH-03/BATH-04 Scenes. Existing actual script `CAVROSEWATERSCR1` is on the drained-only Region `Scene.8yLMRDvxyw58dydh.Region.CAVBROSEWATER001`, originally disabled. Approved text symbol machine IDs `["rose","sun","moth","thorn"]`; solution outer 90° / middle 270° / inner 180° = [1,3,2]. Original screwdriver Region remains enabled, original unique world Sune Bowl Item `Item.1n5LONw3nYIy61O9` remains unawarded and its on-map pickup spot undecided. The owner postponed full gameplay tests and Crooked Man actor work.

Owner campaign progression **requires** the original Study key → Donovan’s 587 lockbox → authentic `Item.g3VYdgc1qkgkHGvn` Sluice Crank → player-owned character physically fits Crank → player operates Sluice → elected GM synchronously drains Pond and Bath with one committed transaction and maps/routes. Existing `studio-cav-sluice.js` handles the one-time Crank fitting; `studio-cav-water-controller.js` handles synchronized water transaction. A NULL water flag is the initial full/wet state, **not proof of a drained Bathhouse**.

## Live recovered elected-GM PREPARE/INSPECT

Initially Foundry TCP 30000 responding but Dev Chrome CDP 9224 offline. Launched exactly ONE documented `Chrome for Testing Dev/utility-harness/Start-Harness.cmd` after detecting no running harness, without restarting Foundry or killing unrelated browser processes. Foundry Join page displayed no active users. Logged into existing `Gamemaster 1` (password empty per owner's previously established setting); verified game.ready true, `game.world.id==="cabin-in-the-ashen-veil"`, elected `Gamemaster 1`, Foundry 14.367, exactly 47 Scenes.

Live read-only exact receipt `utility-harness/artifacts/cav-owner-symbols-recovered-elected-gm-exact-readback-20261026.json` confirmed `cavRosewaterApprovedSymbols.status=OWNER_APPROVED`, exact `rose/sun/moth/thorn`, original `CAVROSEWATERSCR1` **disabled**, `cavUnifiedBathPuzzleBinding.status=STAGED_DISABLED`, ring session NULL. `cavPondBathWaterState=null`, `cavSluiceStageTransaction=null`, crank fitted ledger NULL. Original full Bathhouse six Regions, drained eight, Pond and Aqueduct eight each; all targeted Scenes zero tokens. Original Sluice native script is inspection-only until genuine player Crank progression; original screwdriver still enabled and Bowl Item present; Boiler GM service ready. No Foundry world documents modified during this turn.

## Source improvement — no fake water permission

New pure `evaluateRosewaterSluiceProof({water,transition,crank,controller})` in `modules/regionwright/scripts/studio-cav-rosewater-state.js` requires **ALL** exact receipts:

- Fitted Crank `status=done` with authentic source UUID `Item.g3VYdgc1qkgkHGvn`.
- Original Sluice controller `drainEnabled===true`.
- Authoritative shared water `version=1,status=open,pond=drained,bath=drained,stage=committed,source=sluice`.
- Completed Sluice transaction `version=1,status=done,operation=open,committedState=open`. A `reserved` receipt is explicit unsafe reconciliation.

The changed `studio-cav-rosewater-rings.js` uses this pure proof for the GM-side `drained()` authorization before any player ring rotation/submit; `describe().sluiceProof` exposes the current blocker list to elected GM without world writes. Former implementation accepted a plausible open/drained water flag when no matching completed transaction existed; that path now fails closed. Tests `tests/cav-rosewater-sluice-commissioning-proof.test.mjs` cover authentic full proof, missing crank/controller/transaction, manual/stale fake stage, reserved receipt and later refilled state. **83 of 83 non-destructive Cabin tests PASS**. Both modified installed Regionwright script SHA hashes match source; syntax check passes.

## Runtime verification limit

Attempted ONE guarded authenticated GM page reload to pick up the new strict receipt service. It timed out and the Dicebox Bridge recorded `outcome-unknown`; inspected durable `powershell_receipt` and **did not replay**. Follow-up read-only check found Foundry TCP 30000 **ON**, Dev Chrome TCP 9224 **OFF**, no completed new-runtime receipt. Therefore current source has been deployed and tested, but **new GM runtime uptake after this failed reload remains unverified**. The earlier owner-approved symbol native flag and disabled script state were conclusively verified before the reload; no new native change was attempted or claimed. Do not loop process restarts.

## Next in authentic player order

1. Recover one stable Dev Chrome session when host resources permit; elected GM re-read exact symbols, native disabled Behavior, `sluiceProof` reasons and original maps.
2. Do not mark Crank as fitted or force `cavPondBathWaterState`. During actual gameplay, the proper original Crank from box 587 must be obtained/installed, then the elected GM synchronously commits the open/drain operation. Existing Sluice service already owns these mechanics. The owner has deferred full player gameplay interaction, so keep the prerequisite pending, not skipped.
3. With **genuine** committed drain and geometry/hit-zone review, install or activate Rosewater Region under established Regionwright GM commissioning and preserve its once-only session. Do not invent new Boiler escape portals or separate room Scenes.
4. Resolve Bowl pickup on unified Bathhouse as separate owner decision. Later full gameplay tests and Crooked Man actor remain deferred.

**Classification:** SOURCE HARDENING COMPLETE + NATIVE READ-ONLY DEPENDENCY VERIFIED, RUNTIME POST-RELOAD UNCONFIRMED, ROSEWATER NOT ACTIVATED.
