# Cabin in the Ashen Veil — Chat A drained Pond/Bath pickup original water-proof gate

**Date:** 2026-10-26 Pacific, about 19:55–20:04. **Owner:** “Lets continue.” **Chat:** A (early/midgame, current live Foundry and shared Regionwright source). **Workflow:** PREPARE→INSPECT→BUILD→VERIFY→CATALOGUE. Chat B isolated late game unchanged.

## PREPARE / INSPECT
Regionwright repository `Dicebox20/regionwright` integration branch `codex/cav-sune-integration-20261026`, starting HEAD **`7f7b9b1efabe5ce4943214b9e4c539875f6be1f0`**. Foundry VTT **14.367** world `cabin-in-the-ashen-veil` elected **Gamemaster 1** ready, Chrome Dev CDP and Foundry ports running. No original Crank fitted, original Pond/Bath water flag NULL, native Sluice transaction NULL. Actual Pond art remains `Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png`. Trail original return teleport `Scene.CAVTRAILScene001.Region.13g6uK1QrR9PFOzA.Behavior.ZbrhX0nnaLvLA5Zh` is enabled to **FULL** Bathhouse `Scene.CAVBATHScene0001.Region.R2Pg9eHODtb1C1Yk`. Existing unified DRY Bathhouse `Scene.8yLMRDvxyw58dydh` exists. The two original pickup Regions are already installed with one enabled native Behavior each:
- Weathered Key `Scene.CAVEXT02Scene001.Region.CAVPONDWEATHER01.Behavior.CAVPONDWEATHB001`, original world `Item.CAVWEATHERKEY001`.
- Bathhouse Screwdriver `Scene.8yLMRDvxyw58dydh.Region.CAVBATHSCRDRY001.Behavior.CAVBATHSCRBEH001`, original world `Item.CAVBATHSCREW0001`.
No provenance-tagged embedded pickup Items among world Actors, 54 original ChatMessages, native Rosewater region `CAVROSEWATERSCR1` disabled. No new Region/Scene/Item needed.

INSPECT found `modules/regionwright/scripts/studio-cav-drained-pickups.js` shared function `DRY()` only checked prior water transaction `status=done`, water `status=open,bath=drained`, Pond drained artwork and that the Trail had a destination **including** drained Bath. It did NOT prove authentic consumed Crank, **current open transaction operation**, exact prior completed `next` Pond/Bath state or exclusivity of original Trail route. A stale previous CLOSED transaction or extra Route destination combined with altered water flags could expose original once-only Weathered Key/Screwdriver without a legitimate committed drain. This is a source safety hardening finding; no forged world state or actual player interaction was created.

## BUILD — reuse authoritative original Sluice stage proof, no duplicate item workflow

Added exported pure `assessCavDrainedPickupWaterReady({crank,water,transaction,pondBackground,trailPortal,dryBathLandingExists})` to existing `studio-cav-drained-pickups.js`, importing previously tested `evaluateSluiceRecordedPrestate` from `studio-cav-water-state.js`. For *both* player-side original closeup and elected-GM original Item-grant service, `DRY()` now calls this same pure predicate. It requires:
1. Exact original fitted consumed Crank source `Item.g3VYdgc1qkgkHGvn` and original consumed embedded Item receipt.
2. Strict current Pond/Bath water `status=open,pond=drained,bath=drained,stage=committed,source=sluice`, with matching previous DONE Sluice Stage transaction `operation=open,committedState=open`, exact `next` values.
3. Existing approved drained Pond artwork and real original DRY Bath landing region `Scene.8yLMRDvxyw58dydh.Region.R2Pg9eHODtb1C1Yk`.
4. Enabled original Trail `teleportToken` ID `ZbrhX0nnaLvLA5Zh`, **exactly one** original DRY Bath destination, not merely `.has()` among extra destinations.
5. Every missing/reserved/contradictory proof returns `{ready:false,reason}`, with no world writes.
The original Weathered Key/Screwdriver Region IDs, behaviors, approved map art, once-only source/provenance tagging, actor ownership requirements, pickup dialog and player's `cavDrainedPickupRequest` are preserved. This does not unlock a Region, move a token, drain a pond, create/consume an Item or change a puzzle flag.

Initial Python patch failed on exact whitespace matching inside `DRY()` BEFORE changing source or tests. Inspected durable Bridge receipt, validated source untouched, adjusted to target unique function body, patched successfully; original source and installed-before backups preserved locally under `docs/cabin-ashen-veil/backups/chat-a-20261026-drained-pickup-stale-water-guard`.

## VERIFY

New `tests/cav-drained-pickup-water-receipt-proof.test.mjs` includes **7** pure/contract cases: genuinely committed synchronized drain permits both items; missing Crank/water/transaction blocked; reserved/stale/mismatched prior transaction blocked; conflicting Pond/Bath/manual water states blocked; full art blocked; original dry Trail exact enabled one-target route and landing required; player closeup/GM Item grant share guard before reserve. All seven PASS, and **full 144/144 non-destructive Cabin source tests PASS** (137 previous). Installed modified original `studio-cav-drained-pickups.js` to existing Foundry Regionwright module with matching SHA256 and Node syntax:
**`305D50CDD6EFBEA963C30EFB8A2DBA0FEB82BE48E203B1ABDB1E88D5AE7BCC7E`**.

One authenticated elected-GM world-state guarded Foundry `/game` page reload committed. Fresh independent GM read-only import check verified the new helper loaded: pure valid original committed drain returns `ready:true`; no fitted Crank returns `ready:false`, stale operation `close` rejected, extra Trail destination rejected. Actual current Pond art FULL, Trail to FULL Bath, native original Sluice/Weathered Key/Screwdriver Behaviors remain enabled, native Rosewater Behavior disabled; original Crank/water/transaction still NULL, zero tagged pickups, original GM pickup listener active, 54 ChatMessages unchanged. No ordinary-player click/playtest or live reward grant.

Positive current elected-GM receipt on owner's machine:
`C:\Users\rujie\AppData\Local\Programs\Chrome for Testing Dev\utility-harness\artifacts\cav-chat-a-drained-pickup-after-reload-gm-proof-20261026.json`.
Original fixture route read-only evidence `...\utility-harness\artifacts\cav-chat-a-pond-bath-pickup-original-topology-audit-20261026.cjs`. Guarded reload script preserved alongside.

## CATALOGUE, classification and next

**SOURCE BUILT/INSTALLED, 144/144 non-destructive PASS, elected-GM module runtime VERIFIED.** Original player side not PLAYTESTED. Chat B independent late-game branch not touched. Owner deferred full ordinary-player acceptance, Crooked Man actor/chase and original Rosewater commissioning; **do not** bypass actual Study→587→Crank→Sluice steps or create fake drained flags. Owner-approved `rose,sun,moth,thorn` Rosewater ring solution `[1,3,2]`, original Native ring stays disabled until actual source proof; unique original Sune Scrying Bowl Item pickup location still undecided.

Next Chat A: remaining early/midgame sequence source dependency audit around approved Weathered Key/Screwdriver downstream Boiler or other uncovered actor/Item handoffs. Repeat no already-proven audits unless new evidence, and preserve real owner-approved locations and existing Regions. Update chronological log, archive handoff and machine metadata every bounded turn.
