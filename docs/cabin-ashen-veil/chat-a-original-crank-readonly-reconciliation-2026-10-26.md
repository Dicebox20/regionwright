# Cabin in the Ashen Veil — Chat A original 587 Crank award/fitting reconciliation diagnostic

**2026-10-26 Pacific, ~16:57–17:06. Owner:** "resume". **Scope:** established Chat A PREPARE → INSPECT → BUILD → VERIFY → CATALOGUE. Chat B's late-game branch and files untouched. **Outcome:** a new GM-only, read-only diagnostic is installed, live verified, and covered by 110/110 source regressions; no native campaign advancement was performed.

## 1. PREPARE / INSPECT original authority

Source: `Dicebox20/regionwright`, branch `codex/cav-sune-integration-20261026`, initial HEAD `fb8ef607d4cf892557db402e5041c93294b3a79d`. Read original `studio-cav-587.js`, `studio-cav-sluice.js`, `studio-cav-water-state.js`, `studio-cav-water-controller.js`, `studio-campaign.js` and source tests before modifying. The owner-approved chain remains Brass Study Key → Study 587 note → Donovan 587 lockbox → authentic world `Item.g3VYdgc1qkgkHGvn` → once-only Crank fit → synchronized Pond/Bath Stage. The GM 587 service first writes the lockbox claim as `reserved`, creates a player-owned Item with exact source/Region/note flags, then writes DONE with the embedded Item ID. The Sluice fit similarly reserves, deletes the original player's Item, writes DONE with consumed Item ID, then records initial full/closed water. All reserved/uncertain statuses **must not automatically replay**.

Authenticated elected-GM (Foundry 14.367, world `cabin-in-the-ashen-veil`, Gamemaster 1) live read-only baseline found:
- Original source `Item.g3VYdgc1qkgkHGvn` and original `Scene.CAVEXT03Scene001.Region.CAVEXT03BOXREG01`, `Scene.CAVHG05Scene0001.Region.CAVB3E32BD6B01BD` present.
- All three original 587, Crank and Sluice-water GM listeners registered.
- `cavDonovan587LockboxClaim=null`, `cavStudy587Learned=null`, Study door unlock flag null, fitted Crank flag null, synchronized water flag null, water transaction flag null.
- **Zero tagged Crank Items** across the six world Actors; world ChatMessage count 54. No reserved ledger or duplicate Item exists in this genuine starting state.
- Baseline saved locally `utility-harness/artifacts/cav-chat-a-study587-crank-claim-readonly-baseline-20261026.json`. No native writes, token movement or actual player gameplay.

## 2. BUILD — read-only authoritative recovery classification

Created `modules/regionwright/scripts/studio-cav-crank-reconciliation.js` with a pure evaluator `assessCavCrankReconciliation({claim,fitting,water,transaction,items,boxUuid,noteUuid,sourceVerified})` and elected-GM-only adapter `describeCavCrankReconciliationGM()`. Exposed through Chat A-owned `studio-campaign.js` as:

`game.modules.get("regionwright").api.campaign.cabin.crankReconciliation.describe()`

This **only reads** existing Region flags and world Actor Item provenance (Item source UUID, original Box Region UUID, Study Note UUID, type/name/quantity, actor and Item IDs). It has **NO** calls to `setFlag`, Item creation/deletion, Scene/Token updates, ChatMessage creation, force solve, automatic refund, rollback or retry. Non-GM/wrong-world/unready access returns `{status:"denied",requiresGM:true}`.

Classification outcomes (illustrative):
- `not-claimed` — legitimate untouched original puzzle; `requiresGM:false`.
- `reserved-award-item-not-found` vs `reserved-award-item-visible` — GM must verify whether original 587 embedded creation did or did not occur; do not assume absence implies safe replay.
- `claimed-crank-held` — DONE original 587 claim; exactly one correctly tagged source Item held by the same Actor and Item ID as claim; normal player progression, no diagnostic mutation.
- `claimed-crank-item-not-found`, `claimed-item-identity-conflict`, `tagged-item-without-claim`, `duplicate-tagged-cranks` or `item-provenance-conflict` — manual GM reconciliation.
- `reserved-fit-item-visible` vs `reserved-fit-item-not-found` — distinguish whether the original Item is still present after fit RESERVE; no automatic second deletion.
- `fitted-water-receipt-unverified` — fitted DONE, consumed Item absent but initial full/closed water missing or previous committed water transition inconsistent; uses already-installed strict `evaluateSluiceRecordedPrestate`, preserves **the previous turn's** fail-closed GM water protection.
- `fitted-initial-stage-consistent` / `fitted-committed-stage-consistent` — matched authentic original consumed Item ID, source and Actor, original Box Region, and strict recorded initial or completed water stage; `requiresGM:false`.
- More malformed mixed states such as reserved claim with downstream water, fitting with no completed claim, wrong actor or consumed Item ID are always flagged for GM review.

Returned GM diagnostics include stable current source, note/box UUIDs, claim/fitting/water/transaction statuses, count of original tagged Items, and selected Actor/Item ID references as GM-only evidence, without names/player dialogue.

No original `studio-cav-587.js`, `studio-cav-sluice.js`, GM transaction action, source Item, original Region ID, Scene/teleport geometry or water flags changed.

## 3. VERIFY — tests, installed source and actual elected-GM API

Added `tests/cav-original-crank-readonly-reconciliation.test.mjs` with **9 new pure/contract tests** for non-GM denial, untouched state, reserved award both item cases, valid claimed Crank Item, wrong actor/Item ID, both fit reservation windows, fitted initial water, prior completed water, duplicate/foreign provenance and static no-mutation API guarantees. **Full relevant non-destructive Cabin suite 110 PASS / 0 FAIL**, up from 101. Both JS syntax checks PASS.

Installed only the new read-only module and Chat A-owned shared `studio-campaign.js` registration to the owner's installed `regionwright` module. Exact file SHA256 source/installed equality:
- `studio-campaign.js`: `BCF4855989A63E33C703D40D52FD8652E74104C59D75C7B282BC310F12F3774C`.
- `studio-cav-crank-reconciliation.js`: `7AB389895C05B766CD889E17C3DE4428A5B786AE4BE4601424595EE1D628E620`.

Performed **one** guarded existing Dev Chrome `/game` reload after checking current elected GM and absent ledger flags; reload emitted `SINGLE_GAME_PAGE_RELOAD_NAVIGATION_COMMITTED`. Independent new CDP read-only elected-GM check positively verified `api.campaign.cabin.crankReconciliation.describe()` is present and returns `status:"not-claimed",requiresGM:false,taggedItemCount:0`, correct Box/Note and original Crank UUIDs, and all original flags NULL. Pure synthetic reserved-award input returns `status:"reserved-award-item-not-found",requiresGM:true` without creating a world actor/Item/flag. Original Study/587, Crank and water GM listeners remain registered, Sluice Behavior enabled, Rosewater native Behavior disabled, ChatMessages 54.
- Current native read-only proof: `utility-harness/artifacts/cav-chat-a-crank-readonly-reconciliation-postreload-gm-20261026.json`.
- No world Item, Actor, Region, Token, Scene, ChatMessage, quest or water-state changes.

## 4. Owner-approved boundaries / NEXT

The Crank remains unclaimed and the Pond/Bath full; no actual completion of Study/587, Crank fit or drain has been forced. Boiler and Rosewater remain under their existing safety/owner-approval status (owner-approved `rose/sun/moth/thorn`, ring solve [1,3,2], native ring disabled until real original Crank+Sluice drain). Aqueduct/first Crooked Man chase and actual ordinary-player acceptance tests remain intentionally deferred by owner. Chat B's isolated late-game source branch is not modified; this read-only GM diagnostic is an upstream inspection API, not permission to bypass source authority.

**Next Chat A feature candidate:** bounded source audit of original 587 player client request authenticity and reserved claim handling, or prepare player-side acceptance fixtures for the owner's later testing window. Any manual reconciliation must first preserve saved world evidence, verify owned Item/actor provenance, and require the owner's explicit direction; do not delete/restore/replay based only on a diagnostic status.

**Classification:** Source BUILT and DEPLOYED; 110 pure tests PASS; elected-GM live diagnostic VERIFIED; no player interaction ACCEPTANCE.
