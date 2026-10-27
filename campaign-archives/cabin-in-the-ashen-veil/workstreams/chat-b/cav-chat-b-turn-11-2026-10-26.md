# Cabin in the Ashen Veil — Chat B Turn 11 / L1-K outer Undercroft handoff
**Pacific date:** 2026-10-26. **Status:** ISOLATED SOURCE / PURE FIXTURE TESTED ONLY. No live world install, non-GM acceptance or stage promotion. **Integrator and sole live Foundry writer:** Chat A.

## Source and checkpoint
- Regionwright repo `Dicebox20/regionwright`, isolated worker branch `codex/cav-late-game-chat-b-20261026`; worktree `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game` was clean at parent `9fb7ec14914244d63ff3e093f7f46bde45ffc635`.
- Chat A separate checkout `C:\Users\rujie\Documents\Region Editor` observed HEAD `55d4c233b2267e7f960ea902cab7bd25ca999e7f`, read-only; existing untracked files belong to Chat A and were not modified.
- Bridge doctor `ready_locally_identity_unverified`, PowerShell ready; no exact peer-chat identity, no native relay attempted. One worker session only, no installed Foundry changes.

## Owner canon, provenance and superseded source caveats
- Canon LOCK-03: Studio painting reveals digits **027**; Great Room original `H-G06` lockbox accepts exact **string 027**, then opens separately for one water-filled **Dust of Dryness pellet** pickup. October 26 Chat A notes older **024/027 collision/discrepancy** remains unresolved. Oct24 Great Room source Scene `CAVHG06GreatRoom` has 8 Regions but none dedicated to 027 box.
- Original GM Item `Dust of Dryness` `Item.VjdQNwil7pPKzkHU` from Oct24 original item creation, loot. The “water-filled 027 pellet” is the quest role/state of that original Dust source, not a new guessed Item UUID. Current exact original and filled status need live GM readback.
- Original `Sune's Scrying Bowl` `Item.1n5LONw3nYIy61O9`, original GM Item and read-only offline later confirmation of GM_LIBRARY_ONLY. Bowl is from **Rosewater puzzle on the unified Bathhouse full/drained maps**; separate prior BATH-04 Reliquary room and BATH-03 Boiler scene proposals were superseded. Do not copy Bowl from the Vault (Keystone is Vault prize).
- SG-05 original `Scene.CAVSG05Scene0001` has a Sune statue with **cupped hands**, and separate early sliding mosaic Region `L15BdSqcbCOLPnIN` behind/north statue. Late Bowl/chamber/outer entrance must not occupy the early mosaic click target by assumption.
- Actual original `UND-01` Approach Scene `CN5fkK2QLUELBGGR` had **zero Regions** in Oct24 census; original `UND-02` Refuge `ywpIpQDrkMLIgUP0` exists as distinct sealed inner space. Outer pedestal opened by Bowl+pellet; inner Keystone/stone lever opens much later. No direct entrance to inner Refuge, no Voss teleport or final combat.
- No current-world GM item/scene/region geometry readback was performed during Turn 11; historical Oct24 data informs required identity checks only.

## New pure source, no native effect
- `modules/regionwright/scripts/studio-cav-late-outer-undercroft-contract.js` pure exports:
  - `planGreatRoom027Unlock(receipt)`: authentic Great Room lockbox + exact 027 GM-submitted code and painting clue, retryable wrong code, no auto pellet reward.
  - `planGreatRoomFilledPelletClaim(receipt)`: separately open original 027 box, explicit owned-PC pickup of once-only filled original Dust of Dryness.
  - `planSuneScryingBowlPlacement(receipt)`: explicit original Bowl from **unified Bathhouse** into SG-05 statue hands; independent of SG-05 early four-bust mosaic.
  - `planSuneFilledPelletPlacement(receipt)`: Bowl installed first, original 027 filled pellet explicit subsequent chamber insertion; never counterfeit.
  - `planSuneOuterUndercroftOpening(receipt)`: two separately verified original installations open **only** native SG-05↔UND-01 dry/safe paired portals, retain inner UND-01 Keystone door locked and UND-02 sealed; no auto teleport or extra rewarded item.
  - `planOuterUndercroftRehydrate(receipt)`: scene-swap/reload restores only safe outer bidirectional route after verified persistent gate open, no loot, no inner-door mutation.
- Tests `tests/cav-late-outer-undercroft-contract.test.mjs` exercise exact zero-prefixed 027, reject 024, missing 027 Region, unique Dust source and filled state, genuine unified Bowl origin, original SG-05 target, independent installation order Bowl-first then pellet, complete outer-only route, inner-door remains sealed, reservations/partial ledgers, already-done source identity verification, and reload without extra rewards.
- Source strings that describe `origin:"elected-gm-readback"` are **not authentication**; real active GM must verify sender, game/world, acting player/owner and token physical Region, source template provenance and actual custody/Item type and one-writer transaction.
- NO modification to `studio-campaign.js`, Regionwright shared Puzzle API, original Bowl/Dust Item, installed module, native Foundry world, Regions, Actors, Tokens, map images, or peer chat.

## Tests and limits
- **133/133 new pure tests PASS**; full Cabin local `node --test` across all `tests/cav-*.test.mjs` on Windows **999/999 PASS across 37 files**; new source `node --check` PASS.
- This is not real Foundry runtime, safe portal simulation, current GM readback, non-GM gameplay acceptance or owner approval to write world.

## Chat A blockers and integration boundaries
1. Find/reverify *actual* Great Room 027 chest Region and readable Studio painting. Resolve the earlier 024/027 behavior discrepancy before any player source Item grants. Preserve leading zero. Authenticated distinct unlock then pickup.
2. Verify original Dust of Dryness world Item/actor transaction state as **filled 027 pellet**; only one source, no invented second Dust/pellet reward. Verify original Scrying Bowl current world, its on-map unified Bathhouse Rosewater once-only claim, authentic actor custody, no duplicate.
3. Current SG-05 actual Bowl/Hands Region, pellet chamber Region and dry outer hatch geometry, keeping early mosaic Region unmodified. Verify owner-approved art/Regionwright hit-zone rules.
4. Current SG-05↔UND-01 native RegionBehaviors and paired safe landing/return, no accidentally enabled inner UND-01→UND-02 passage. Oct24 UND-01 has 0 Regions, not current proof. Must keep Keystone recess and stone lever locked for later L1-L.
5. Native GM adapter must reserve/effect/readback/done with auth and exact original source IDs; reconcile unsure transactions manually, not replay. Bowl installation does not itself open Undercroft; pellet installation triggers subsequent outer-gate commit.
6. Chat A alone reviews/merges draft PR, then native commissioning and future ordinary-player acceptance. Chat B cannot claim source proposed logic is installed.

## Next bounded L1-L source
INNER Undercroft Keystone recess + separate Press Stone Lever; preserve permanent locked-before-state, safe UND-02 Refuge/Donovan-Sophia visible evidence and no Voss bypass or final map invention. After that, final sequence only according to established owner canon with deferred combat map work.

## Available-message reconstruction (NOT lossless)
Owner said "that's all I needed to know, please continue" after being told Study Door is an existing teleport Region. Worker began L1-K, checked Bridge and independent worktrees, researched controlling LOCK-03/LOCK-13 and owner unified Bath map override, recovered SG-05/Great Room/UND-01/UND-02 Scene IDs and original Dust/Bowl Item IDs. Wrote one isolated pure six-plan source and adversarial tests. Tightened already-installed/out-of-sync item/portal readbacks, ran 999 full Cabin tests, recorded evidence matrix and dated continuity. No peer chat relay or native Foundry/world writes.