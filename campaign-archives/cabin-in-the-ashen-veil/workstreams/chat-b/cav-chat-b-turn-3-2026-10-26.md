# CAV Chat B — Turn 3 late-game source handoff (2026-10-26 Pacific)

**Status:** LOCAL PURE-TESTED / PROPOSED, **NOT** installed, GM-reviewed or player-accepted. **Change owner:** Chat B, independent worktree; **Foreman integrator:** Chat A.

## Scope and recorded source
- Regionwright repo `Dicebox20/regionwright`, branch `codex/cav-late-game-chat-b-20261026`.
- Turn 3 parent/base `d5c9be286daca7fd3d4ad438fa0dc09cee3adc66`.
- Chat A live integration branch observed at `54faf5c29b75cd8ef4b3ea26eda6d3ed0f2db9a8`, with independent uncommitted first-party Sluice source changes (read-only observation; absolutely no Chat B changes in that checkout).
- All four L1-C contracts are isolated new code and do not import or write shared `studio-campaign.js`, `regionwright-puzzles-locks/scripts/api.js`, installed module, original actors/items or native Foundry world documents.

## Delivered code/APIs
1. `modules/regionwright/scripts/studio-cav-late-music-prayer-contract.js`
   - `planMusicBoxClaim(receipt)`: only from authentic unlocked Parents Hope Chest (`Scene.CAVHU04Scene0001`), elected-GM-derived owner/click, original Box source UUID and no worldwide prior reward copy. Handles `none/reserved/done` ledgers with no duplicate.
   - `planPrayerProtectionClaim(receipt)`: authentic previously claimed Ornate Music Box with chest Region provenance and original Silver Tiny Key carried; explicit opening; original Prayer source check and global duplication guard. Box opened and Prayer claimed are distinct ledgers. Does not read the Prayer automatically.
2. `modules/regionwright/scripts/studio-cav-late-workshop-wick-contract.js`
   - `planStudioPrayerPassage(receipt)`: only authentic Prayer in actor inventory via original Music Box, explicit GM-verified "Read prayer?" Journal action physically at H-G07 Studio Sune altar, certified H-G07↔H-G08 Workshop native passage with safe arrival/return and initially sealed state. A `read`/sealed split or `reserved` requires manual reconciliation, not silent rerun.
   - `planWorkshopWickPickup(receipt)`: one actual original Wick source claim at H-G08 after genuine passage-open ledger; owned physical interaction, no world duplicates. The Gazebo Rose/Cog/Star optional puzzle never gates this Wick.
3. New pure tests `tests/cav-late-music-prayer-contract.test.mjs`, `tests/cav-late-workshop-wick-contract.test.mjs`.
4. Updated `docs/cabin-ashen-veil/chat-b-late-chain-evidence-matrix-2026-10-26.md`, ongoing `docs/cabin-ashen-veil/chat-b-late-game-progress.md`, this immutable turn handoff and machine metadata.

## Acceptance, tests and evidence layers
- L1-C new tests: **68/68 PASS**. Total `node --test <all tests/cav-*.test.mjs expanded on Windows>`: **189/189 PASS across 29 files**, at this exact Chat B branch.
- Both new source files: `node --check` PASS.
- Evidence: **SOURCE + LOCAL FIXTURE ONLY**. No live Foundry readback, no native registration, item creation, teleport changes, original map edits, actor/token interaction, or actual player acceptance.
- Provisional `origin:"elected-gm-readback"` is **NOT an authentication mechanism** on its own. Chat A must implement an authenticated server-known sender, item/ledger readback, actor ownership/position checks and serialization/GM transaction on actual Foundry IDs. It is unsafe to pass player-controlled JSON directly into these helpers and then perform writes.

## Missing provenance and authorized integration
- Exact original Silver Tiny Key, Ornate Music Box, Prayer of Protection and Wick Item source UUIDs; verify existence before deciding whether any new GM-library source is required.
- Actual Hope Chest Region UUID/behaviors; Art Studio altar Scene/Region UUID; H-G07–H-G08 passage and return Region/Behavior UUIDs and collision/arrival; Workshop Wick pickup Region; existing item Journal read trigger.
- Confirm item/ledger flags against Chat A's current source; genuine Waterworks restoration != Pond/Bath sluice drain. First/second chase Actor and live playtest deferred.
- Once-only adapter must `reserved` before effects, check actual source name/type and duplicate player copies, perform one explicit claim/unlock, reread destination/actor/scene, then `done`. After uncertain completion stop for elected-GM reconciliation.
- When remaining original IDs read back, Chat A reviews/imports new source contract modules, adds only approved shared Studio registration, performs safe live commissioning and later actual non-GM acceptance. Chat B must not deploy.

## Next bounded source package
**L1-D:** Gazebo Lantern Oil + Wick (either order) → light lantern → temporary cobweb reveal → distinct Rufus eye #2 once-only, keeping Rose/Cog/Star table independent. Can be planned and pure-tested before Chat A commissions L1-B/C IDs. Then Rufus two authentic eyes and deliberate Aqueduct charge/Crimson Veil in later bounded units.

## Available-message transcript reconstruction (NOT lossless)
Owner said "Continue" following Turn 2 handoff. Worker read Chat B T2 continuity and branch HEAD; observed Chat A Sluice work in progress and did not modify it; read House blueprint, canonical LOCK-09/10 and approved art-attachment source without interpreting art names as authentic world inventory. Added pure Music Box/Prayer and Studio passage/Wick contracts and adversarial tests. Fixed one fail-closed missing-Workshop-scene guard; ran 189 passing Cabin tests and Node syntax; prepared T3 continuity and isolated source Git review handoff. No native Bridge chat-to-chat delivery claimed.