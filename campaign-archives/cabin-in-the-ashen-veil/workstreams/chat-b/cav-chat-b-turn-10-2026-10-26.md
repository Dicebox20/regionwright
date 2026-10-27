# Cabin in the Ashen Veil — Chat B Turn 10 / L1-J Vault and Keystone Handoff

**Date Pacific:** 2026-10-26. **Disposition:** PROPOSED source-only pure-local tests pass, no live Foundry write, installation, non-GM acceptance or product stage change. **Only integrating Foreman and live writer:** Chat A.

## Independent checkout and repository evidence
- Source `Dicebox20/regionwright`, worker branch `codex/cav-late-game-chat-b-20261026`; isolated checkout `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game` starting clean HEAD `36ca21bbd727f51227f1572d45e7ffcbf5b5dee9`.
- Chat A separate checkout read-only at `a3e880d35d06d2616fdac231620a25798f478edb`. No native world/installed module/shared Studio registry or Chat A file changes by Chat B.
- Dicebox Bridge doctor ready locally, PowerShell ready; canonical ChatGPT identity unavailable. No cross-chat relay or native game write.
- Approved Oct22 LOCK-13: **four and ONLY four Vault prerequisites**: Weathered Key legitimate Basement access, already charged Gondian source, recovered Gond half, recovered Sune half. Physical control has three item sockets and distinct `Turn Joined Emblem`. No extra fifth item or additional puzzle to count Basement.
- Existing `studio-cav-basement-nightstand.js` source: `cavWeatheredBasementUnlocked` ledger at original Weathered Key entrance; Basement Workshop `Scene.G6NMonfCwMvNzipL`. Oct24 historical live scene census shows H-B02 Secured Keystone Vault `Scene.tjTpG2RVZNoCqRLh` and **zero Regions** at time of census; today must be reread.
- Original Oct24 GM Item creation receipt proves historical world-source identities: Gondian original `Item.pbmUZPfC3WnsBRgi`, Gond half `Item.o9G3UJjEe2QX1ZH0`, Sune half `Item.t9uCIpsKeSvtC31w`, Completed Gond–Sune Emblem `Item.vbDWTbnAZg65ErSS`, and separate Sune's Scrying Bowl `Item.1n5LONw3nYIy61O9`. The Completed Emblem is **NOT** a fifth earned item required in inventory.
- **Critical blocker:** original Oct24 26-Item GM creation receipt contains **zero Keystone Items**, and no exact Keystone UUID was recovered in the local source search. This is NOT proof none exists today and NOT authorization to invent/create one. Chat A must search current world, preserve originals and only if genuinely missing pursue owner-authorized established Item creation workflow.

## New isolated L1-J source and API
- `modules/regionwright/scripts/studio-cav-late-vault-keystone-contract.js` exports `planVaultSocketInstall(receipt,kind)`, `planVaultTurnJoinedEmblem(receipt)`, `planVaultKeystonePickup(receipt)`, `planVaultDoorRehydrate(receipt)`.
- Allowed physical socket `kind` values EXACTLY `charged-source`, `gond-half`, `sune-half`. Each verifies actual GM-authenticated actor in original H-B01, Weathered Basement entry, matching original Item/source/actor custody and provenance, correct charge/Veil or H-U05/Studio acquisition flags, original socket Region and once-only pending ledger.
- Separate player `Turn Joined Emblem` after exactly those three original sockets installs, independently verified identities, charged source and secured door/safe H-B01→H-B02 native portal and return. Plans reserve/door open/plinth marker visible only, **no automatic Keystone loot**. Existing historical Completed Emblem Item need not be transferred as a fifth prerequisite.
- Explicit player Ke​​ystone plinth pickup from H-B02 after real open door requires independently verified current-world, canon/owner-approved ORIGINAL Keystone source Item UUID/name/type, safe plinth Region and zero distributed reward copies. The single test fixture source ID is labelled **INERT TEST ONLY**, not a real Keystone source; missing current-world source fails closed.
- Already-installed/already-open/already-claimed branches require independent readback proof of correct original Item or effect; reserved/inconsistent transactions stop manual GM reconciliation. Native route rehydration after reload is limited to original paired portals with no reward mutation.
- Source does NOT implement inner or outer Undercroft, Sune Bowl, 027 pellet, Keystone door lever, Rosewater Bowl, final Voss encounter, or any invented alternate entrance. Keep separate in later units.

## Tests
- `tests/cav-late-vault-keystone-contract.test.mjs` **144/144** adversarial cases pass: independently installed sources/any order, original source/actor flag counterfeits, four-only condition, no fifth combined inventory Item, final Turn, safe portal/return/geometry, missing/unresolved Keystone source, reserved/done receipt semantics and scene rehydrate.
- Entire `node --test <Windows-expanded tests/cav-*.test.mjs>`: **866/866 PASS across 36 test files**. New source `node --check` PASS.
- This is local pure-fixture evidence only; no live GM/Foundry, player-owned token, actor inventory, interactive Regionwright UI, Keystone plinth or item creation happened.

## Chat A integration STOP list
1. Actual current Basement unlock ledger, Weathered Key origin, active elected GM/owner actor, real H-B01 actuator/three socket/turn Regions and H-B02 native plinth/route/return geometry; historical H-B02 inventory had no Regions.
2. Authentic original actor Item instances/charge in-place/Veil activation/H-U05 Gond pickup/Studio Sune pickup and any native installed item custody policy. Uncertainties require reconciliation, never consumption by guess.
3. Existing Keystone Item current-world search; if absent, owner-authorized established Item creation workflow, not a made-up ID. Confirm approved source naming, game item type and once-only plinth binding before any claim.
4. Safe portal/arrival/return, original approved artwork, Regionwright widget ownership, single authenticated elected-GM reserve/effect/readback/done; no bypass by client data or assumed multi-document ACID.
5. Vault prize remains Keystone. Bath Reliquary's Sune Bowl plus real 027 pellet opens outer Undercroft later; Keystone+stone lever opens inner door separately. Never auto-start endgame.

## Next bounded package
**L1-K**: Sune Bowl at SG-05 statue and correct 027 Great Room pellet as two distinct explicit actions, safe outer Undercroft Approach opening (not inner door). Follow with L1-L inner Keystone recess and stone lever, safe Refuge/hall and deferred Voss arena/ending. If Chat A reprioritizes, retain these as isolated proposals.

## Available-message transcript reconstruction (not lossless)
User requested resume. Chat B preflighted Bridge and both source branches, recovered LOCK-13, original 26-item creation receipt and Oct24 H-B02 Scene ID/inventory, identified real Keystone source provenance gap, created one new isolated pure source and 144 adversarial tests, ran 866 full Cabin tests and checked syntax, produced Turn 10 evidence matrix and continuity records. No live world/module/Chat A writes or native chat relay. This describes available evidence, not a lossless transcript.