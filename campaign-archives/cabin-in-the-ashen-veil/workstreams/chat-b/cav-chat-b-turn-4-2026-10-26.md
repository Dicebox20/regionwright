# Cabin in the Ashen Veil — Chat B turn 4 late-game worker handoff

**Date:** 2026-10-26 Pacific. **Worker:** Chat B, source-only. **Integrating Foreman and live writer:** Chat A. **Disposition:** PROPOSED / PURE-TESTED, not reviewed or promoted, **no live Foundry change**.

## Source, scope, and canonical provenance
- Repository `Dicebox20/regionwright`; isolated worktree `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`; branch `codex/cav-late-game-chat-b-20261026`.
- Turn 4 starting commit `0c0ca71b2e6c13951fbb83564156a5126322323d`.
- Chat A integration worktree observed at `0a0a2896c096d8e4159fbb1af479bda581cfe2f1`. No edits, resets, branch switches, staging, runtime operations or builds in Chat A checkout.
- Canon: original 2026-10-22 approved LOCK-10: Donovan Shack oil and separate Workshop Wick install either order, explicit ignite Gazebo lantern, temporary cobweb clearing, second Rufus Glass Eye shown as explicit single pickup. Optional picnic table Rose/Cog/Star is independent, never a gate. Sophia bear gives eye #1.
- Historical 2026-10-24 original Item creation receipt `utility-harness/artifacts/cabin-puzzle-items-receipt-20261024.json` (read-only) lists Rufus Second Glass Eye `Item.QIH1ugEWGOO1U6LN`; first Glass Eye `Item.mN1dk0qlr7hyfupk`. Current GM world existence/unmodified UUID remains NOT VERIFIED. Historical October 25 Gazebo behavior inventory and Wick absence are stale.

## Delivered isolated source
- `modules/regionwright/scripts/studio-cav-late-gazebo-eye-contract.js`: pure `planGazeboPartInstallation(receipt,component)`, `planGazeboLanternIgnition(receipt)`, `planGazeboSecondEyePickup(receipt)`. Exports `GAZEBO_CONTRACT_VERSION=1`, `HISTORICAL_SECOND_EYE_SOURCE_UUID`. No Foundry UI, hooks, socket, registry, NPC, item creation, video, or scene writes.
- `tests/cav-late-gazebo-eye-contract.test.mjs`: oil-first, Wick-first and second-order installation, part ledger persistence/no repeats, original sources, absence of required table state, player token/click, custom inventory provenance, temporary effect expiry, visible eye rehydration, reserved/done state, no duplicate eye, first/second original source ID distinction and post-claim no-op.
- Evidence matrix append `docs/cabin-ashen-veil/chat-b-late-chain-evidence-matrix-2026-10-26.md`, chronological `docs/cabin-ashen-veil/chat-b-late-game-progress.md`, this unique handoff and machine metadata in Chat B archive.

## Exact contract semantics and adapter requirements
1. `planGazeboPartInstallation` evaluates one part (`oil` or `wick`) with GM-derived original source/region flags and owned token physical lantern proximity. Its output `gm-review-install` **never** installs, consumes or grants an Item. Chat A must reserve chosen part before moving any copy or changing ledger, certify resulting installed source, then mark installed; interrupted `reserved` requires manual reconciliation, not replay.
2. `planGazeboLanternIgnition` requires both installed parts matched to original sources, explicit ignite action, unique current GM-readback second eye source matching its historical UUID, zero actor-distributed reward copies and verified physical eye marker Region. Returns only `gm-review-ignite-and-reveal`. The native GM adapter must coordinate ignition and eye marker reservations, apply temporary cobweb reveal effect, persist eye-visible marker after effect expires, and support scene reload without duplicating effects or sources. No optional table state is considered.
3. `planGazeboSecondEyePickup` requires actual marker rendered/re-hydrated, lantern lit, authentic second eye (distinct from first), explicit nearby non-GM owned click, no prior global actor copy and unclaimed ledger. `gm-review-single-eye` is **not** an Item grant. Reserve BEFORE one original copy, reread and mark done, never auto-award on token entry/ignition. No silent retry for unclear transaction.
4. `origin:"elected-gm-readback"` is a **data contract label, not a security boundary**. Chat A must authenticate real ChatMessage author, elected active-GM, exact world, actor ownership/scene Region geometry, no client-authorized achievement booleans, source Item UUID/name/type, duplicate scan and native ledgers before passing receipt. Unchecked inputs MUST NOT feed a live write adapter.
5. Do not decide item consumption or visual/overlay ownership ad hoc; preserve owner-approved artwork and Regionwright puzzle UI boundary, review whether staged physical oil/wick should be consumed or retained before live install.

## Tests and verification
- Pure new Turn 4 tests: **57/57 PASS**, source syntax `node --check` PASS.
- Entire Cabin tests via Windows-expanded `node --test <tests/cav-*.test.mjs>`: **246/246 PASS across 30 files**.
- Evidence layer PURE LOCAL FIXTURE ONLY. No Foundry/GM native readback for Gazebo, no installed behavior, no player or AI token tests, no scene swap live test, no native VFX trial. Historic original Item creation does not establish current gameplay possession.
- T4 code unmerged, branch independent, shared `studio-campaign.js` and `regionwright-puzzles-locks/scripts/api.js` unmodified.

## Stop conditions and dependencies
Authentic current-world Gazebo lantern/eye marker Region UUIDs and geometry unknown; original oil/Wick Item UUIDs and provenance Regions, exact current Glass Eye world Item IDs, authenticated GM ownership/readback and one-writer transaction persistence unknown. Crooked Man actor/token and campaign-wide player commissioning remain owner-deferred. Chat A must review and bind originals. Do not duplicate Items, change world Scenes, activate optional module, or claim test acceptance.

## Next scoped package
L1-E: pure Rufus first/second eye socket provenance and once-only release of uncharged Gondian source from Allen Study; then separately Aqueduct **deliberate charge** triggers Crimson Veil once (never automatic nightfall). Continue with per-turn durability and strict single live writer.

## Available-message transcript reconstruction (NOT lossless)
User said Continue after Chat B Turn 3 handoff. Chat B read active continuity and Bridge runtime, read Chat A latest HEAD and found it had advanced to 0a0a289, read approved LOCK-10 and historical source Item-creation receipt, authored one isolated pure gazebo/eye file with adversarial tests, fixed a lit-with-missing-part fail-closed discrepancy, ran 246 Cabin passing tests, appended continuity/matrix and prepared Git handoff. No live Foundry write; Chat A checkout untouched.