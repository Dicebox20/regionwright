# Cabin in the Ashen Veil — Chat A enlarged Roof Clock, Aqueduct route and Boiler batch

**Date:** 2026-10-26 Pacific, ~20:22–20:45 (bounded owner-directed enlarged continuation). **Owner:** “continue next turn.” **Chat A scope:** early/midgame original Regionwright GM scripts and current elected Foundry world; Chat B late-game source remains separate. **Workflow:** PREPARE → INSPECT → BUILD (two related source safeguards) → VERIFY (one full suite + one guarded reload + independent GM readback) → CATALOGUE. Ordinary-player gameplay remains deferred.

## PREPARE / INSPECT — original sources, IDs and reason for changes

Regionwright repository `Dicebox20/regionwright`, branch `codex/cav-sune-integration-20261026`, starting verified SHA `0e83bfdbdd3c13e45fc8f619e8c43a1d073f771b`. Tracked source clean; unrelated untracked user art/archives excluded.

Original elected Gamemaster 1 on Foundry VTT **14.367**, world `cabin-in-the-ashen-veil`, **47 Scenes** and **54 ChatMessages**. Native read-only inspection of actual original RegionBehavior scripts and source Items (machine receipt `utility-harness/artifacts/cav-chat-a-roof-original-hour-minute-player-native-sources-20261026.json`):
- Grandfather Clock original award Region `Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q`, enabled original Behavior `SAshGMH5A3AsJC0Y`, awards `Item.HVZnNaV2SxNWck6H` by `cavGrandfatherClockHourHandClaim=reserved`, then creates original tagged Actor Item, then `done` with `embeddedItemId`. Current original award NULL.
- Attic original Storage Crate Region `Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG`, original enabled Behavior `whiZBUmM3mbZEOwF`, awards `Item.smvovibxtjJ9NW56` by `cavAtticMinuteHandClaim=reserved` with `itemUuid`, creates tagged Item, then `done` and `embeddedItemId`. Current award NULL.
- Roof original handless Chimney Clock `Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001`, player clickable RegionBehavior `i6UNtWSFFaZgkdZD` remains enabled/unchanged, artwork original. Original `cavRoofClockClaim` NULL. Original source `Item.wDKqETOykWEdKF1Z` Replacement Gear loot qty1 exists. Prior original elected-GM handler `studio-cav-roof-clock.js` checked held source-tagged Hour and Minute hands, not whether the native awards were really DONE. An Item could exist after interrupted reserve-before-create-before-DONE without being valid proof of reward completion.
- Original Pond Aqueduct gate `Scene.CAVEXT02Scene001.Region.CAVPONDAQGATE001`, mechanical Gear/Handle/Ready and route transaction NULL; Pond entrance teleport `CAVPONDAQPORT001` disabled. Crooked Man first chase trigger remains disabled; owner deferred NPC Actor and actual player acceptance. The future GM `commissionAqueductForGameplay` already required GM confirmation, genuine Crooked Man Actor, disabled transit and empty AQ but checked only broad prior Sluice transaction DONE + water OPEN, Gear/Handle DONE. It did not reconcile the **consumed Item IDs** against original DONE Roof Gear / Parents Nightstand Handle grants, nor verify original Crank provenance, last transaction operation OPEN, exact Pond/Bath drained topology and Trail to dry Bath.
- Original full and drained unified Bathhouse Boiler `CAVBATHScene0001` and `8yLMRDvxyw58dydh`, each original enabled `CAVBBOILERCTRL01.RegionBehavior.CAVBOILERSCRPT01`, approved `[left2,right1]` target, mirrored session NULL, active binding status ENABLED. `boiler.describe().status=ready`. Source inspection shows no separate Boiler reward or other downstream lock consumer; **no new Boiler dependency invented**.

## BUILD — source safeguards only, original world actors/Regions preserved

NEW pure `modules/regionwright/scripts/studio-cav-roof-hands-proof.js`:
- `assessCavRoofClockHands({actorId,hands})` requires original Hour/Minute World Item templates loot qty1, exact original Regions and DONE original award receipts (`sourceUuid` for Hour, `itemUuid` for Minute), same authentic Actor ID/embedded Item ID, exactly one original provenance-tagged Item per source across Actors, exact names/types/quantity/origins. RESERVED/unknown/missing/duplicate/transferred/foreign grants fail closed.
- `assessCavRoofClockHandsGM(actor)` reads only exact original Regions, Item templates and provenance-tagged embedded Items. Denies without active elected GM and exact Cabin world; source has no reward or world writes.
- Existing original elected GM `studio-cav-roof-clock.js` now uses this guard **BEFORE** the original `cavRoofClockClaim=reserved` Gear grant. Original actual Gear Item creation, approved 12:00 answer, source flags, one-time reservation and feedback preserved. Existing native player click script/approved art left completely intact; a premature client attempt is safely denied by elected GM, although real Player UX acceptance is still deferred.

NEW pure `modules/regionwright/scripts/studio-cav-aqueduct-route-proof.js`:
- `assessCavAqueductCommissioningProof` requires original mechanical READY/traversal false and original `cavAqueductGearInstalled`/ `cavAqueductHandleInstalled` **DONE** with exact source UUID, consumedActorItemId and claiming Actor matching respective original Roof Gear `cavRoofClockClaim DONE` / Parents' Nightstand `cavNightstandHandleClaim DONE` embedded award IDs. Nightstand Handle must have matching completed original Screwdriver pickup and repair receipts.
- Reuses existing verified pure `assessCavDrainedPickupWaterReady` for genuine consumed Crank `Item.g3VYdgc1qkgkHGvn`, synchronized `cavPondBathWaterState` committed OPEN Pond/Bath both drained, last Sluice transaction DONE OPEN and matching next states, approved drained Pond art, exact enabled one-target Trail→DRY Bath landing. Inconsistent history/route fails closed.
- Existing `studio-cav-aqueduct-routing.js` future GM explicit commissioning inserts this proof **AFTER existing owner-deferred Actor/route checks but BEFORE** native route transaction `setFlag(status=reserved)`, portal writes and chase trigger. `commissionAqueductForGameplay` was **not invoked**. All four original Pond/AQ/Well portal Behaviors remain unchanged and uncommissioned.

Two initial source edit helper failures came from original 1-vs-2 leading spaces; each was receipt-checked and corrected before file mutation; no native world operation was attempted. The targeted tests also caught a non-Foundry `game` undefined guard and a test’s incorrect `setFlag` identifier; both corrected before deployment.

## VERIFY — 177 PASS, four installed files, one guarded reload, independent GM

Added 7 source/contract tests `tests/cav-roof-hour-minute-completed-receipts.test.mjs` and 8 `tests/cav-aqueduct-future-route-commissioning-proof.test.mjs`. Combined existing source tests **177 PASS / 0 FAIL**, previously 162. No browser or actual Player click test was counted. All four source files copied into existing installed Regionwright module with Node syntax + exact SHA256 match:
- `studio-cav-roof-hands-proof.js` SHA **F70358F9FB1B6ED0E919D2707C89CF3EA299970BA9623A3A0DB776FB07C3E2AF**
- `studio-cav-roof-clock.js` SHA **8E1893E01810ECF0B3B3EB043D6E742704F885AFDCBB11E55D7E565C6A3D3A66**
- `studio-cav-aqueduct-route-proof.js` SHA **6C178202673F7E6965295321F5FD3E87A6543D5D3CEFFCE533CDE44CFBFB930E**
- `studio-cav-aqueduct-routing.js` SHA **93E0709F01C3178D22B09A943BF0496E10C695A458B40536FE9DCBD0D972A93E**

Exactly **ONE** GM preflight-guarded current `/game` page reload committed after checking 47 Scenes, 54 messages, all Hour/Minute/Roof/AQ part/mechanical/route/Crank/water/transaction original flags NULL, AQ entry disabled, first chase disabled, Rosewater disabled and both Boiler native sessions NULL/readiness `ready`.

Independent elected GM **after-reload read-only** browser check imported both pure proof modules and GM source modules; confirmed original Roof Clock GM listener and Aqueduct listener still armed, synthetic correct Hour+Minute DONE accepted; RESERVED Hour rejected, actual original no-award state rejected. Synthetic authentic consumed Gear+Handle/repair/committed drain accepted; RESERVED Handle and stale CLOSE transaction rejected. Actual all original award, mechanic, route and water flags NULL, 47 Scenes, 54 messages. AQ entrance, chase trigger and Rosewater remained **DISABLED**. Boiler both original Regions status `ready`, 2/1, enabled, mirrored sessions NULL, no native duplicate or modifications. Positive on-host receipt:
`utility-harness/artifacts/cav-chat-a-roof-aqueduct-boiler-batch-postreload-gm-verified-20261026.json`.

## CATALOGUE / next batch

**Classify:** source BUILT+DEPLOYED, elected GM module VERIFIED, **177/177 tests**, genuine ordinary Player gameplay **NOT PLAYTESTED**. No token movements, Items granted/consumed, water flags fabricated, puzzle stages forced, native Scenes/Regions/Behaviors modified, AQ route/crooked chase commissioned or Boiler reward invented. Chat B late-game separate, no concurrent live Foundry writes.

Owner's enlarged batching instruction remains active: in each bounded turn inspect connected original features, install ~2–3 adjacent safe source fixes, one combined test suite, one guarded reload/readback, one chronology+handoff. Next Chat A: remaining real upstream Hour/Minute player UX consistency or Boiler provenance/state reconciliation if novel evidence, without redoing healthy native installation; preserve initial campaign. Crooked Man first chase and Rosewater original Region remain gated. Unique original Sune Bowl `Item.1n5LONw3nYIy61O9` pickup position remains undecided. Original owner-approved Rosewater symbols Rose/Sun/Moth/Thorn and solution [1,3,2] preserved.

**Continuity and transcript:** evidence-backed available-message reconstruction rather than lossless ChatGPT native transcript.
