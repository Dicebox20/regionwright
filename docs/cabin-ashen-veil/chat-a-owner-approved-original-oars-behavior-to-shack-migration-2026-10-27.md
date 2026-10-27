# Cabin in the Ashen Veil — Owner-approved original Oars pickup moved inside Donovan's Shack

**Date:** October 27, 2026 Pacific. **Owner QA workflow:** Proceed ONE puzzle/Region at a time; owner reports whether a Region activated, is missing, or failed. **Always ask owner before initiating ANY further repair.** This repair was explicitly approved after owner specified exact new destination \`Scene.CAVEXT03Scene001.Region.TWKOyz83JjJu94E7\`, named "Shack Interior Oars". Only this repair is authorized; it does not confer automatic approval for adjacent repairs.

## Actual playtest facts supplied by owner
- Family Carriage initial inspection: PASS.
- Carriage Yard -> Donovan's Shack teleport: PASS.
- Owner could not find Wooden Oars region inside Donovan's Shack: FAIL / misplaced pickup.
- Original Oars behavior resided on Yard \`Scene.CAVEXT01Yard0001.Region.CAV01R0000000006\`, named "EXT-01 - Donovan Shack Approach", not inside the Shack.

## PREPARE / INSPECT live originals

Using original authenticated elected Gamemaster Foundry 14.367, world \`cabin-in-the-ashen-veil\`, and exact existing Chrome game tab:
- Original Yard Region \`CAV01R0000000006\` has enabled native ExecuteScript Behavior \`CAVOARSBEHAV0001\`, \`tokenMoveIn\`, exact old source SHA256 \`fdfe8b39afa1fb4bf77416b05fefc11aae8936eef9436a1a593e96fbc17888e2\`. Historical installed confirmation flag on Yard remains. Original \`cavOarsPickup\` flag is genuine DONE for Skaal Tel actor \`xO3hc9r0vR6CqU1W\`, exact embedded Oars Item \`Ggb9lJYYtaXsZS8e\`, world template \`Item.CAVOARSPOND00001\`.
- Original Item's provenance \`cavPickupSourceUuid\` equals the canonical world template, and its \`cavPickupRegionUuid\` points at the historical Yard location. **Preserve the true historical origin. Do NOT forge a new award/receipt, reset, or silently rewrite the existing Item.**
- Original \`Scene.CAVEXT03Scene001.Region.TWKOyz83JjJu94E7\` exists, name "Shack Interior Oars", original rectangle x908,y84,w120,h300, no Behaviors and no claim flag.
- Original Pond Rowboat Region \`Scene.CAVEXT02Scene001.Region.CAVROWBOATREG001\` Behavior \`CAVMIRRORBEH0001\` originally verified exact old source SHA256 \`e310f3684eb4299cd4cc9171c0d4098e5a5c87548505f5edeac252eaac65ad09\`; its old proof tested the completed original Yard Oars claim and Actor's exact Oars embedded Item.
- Live non-GM Dyscid was viewing and had a token in the Shack, so no token movements, scene reload, or reward actions were performed during repair.

## Owner-approved BUILD

Immutable exact migration source/claim payload:
\`docs/cabin-ashen-veil/cav-owner-approved-oars-shack-interior-migration-payload-2026-10-27.json\`.

Four strictly guarded original elected-GM Foundry writes, with a receipt after EACH stage:
1. **Carry original DONE claim onto Shack Region** preserving original actor/item/source receipt fields; add an explicit \`migratedFromRegionUuid=Scene.CAVEXT01Yard0001.Region.CAV01R0000000006\` with owner-approved migration metadata. Original Yard claim/status and all historical Region flags preserved.
2. **Copy original native pickup Behavior** \`CAVOARSBEHAV0001\` to owner's exact "Shack Interior Oars" Region, unchanged original Behavior ID, type, enabled state, tokenMoveIn event and flags. Set source's hardcoded SCENE and REGION to exact Shack target and change only as needed to protect against duplicates from either old or new claim location. Current player text now describes worn oars resting against the Shack wall rather than instructing a solution.
3. **Update original Rowboat mirror Behavior in place** to require exact authenticated new Shack DONE claim, matching Actor and embedded Item ID, world Item source provenance and either actual new Shack Item provenance or verified historic Yard Item provenance **only when a matching original historic DONE ledger exists**. Neither loose inventory tags nor a forged claimant suffice. Original mirror award/reward/source/GM authority and events unchanged.
4. **Delete only original Oars RegionBehavior** from Yard. Keep the original Yard Region and its genuine DONE claim as historical record. No destination portal, token, Item, Actor, Scene, or other Region created/deleted.

New exact native Oars Behavior SHA256 \`70c3a180a15e83aa0c5fd0b19dc8245d1d28ec6cdfd2a46f0841619659f3367e\`.
New exact Rowboat Behavior SHA256 \`44739c30f0dc05062a5dc501175157becfa3d0baaffca1f38ca66ad94e985242\`.

All **FOUR native stages PASS**, with exact per-step guards and same-call readbacks:
\`utility-harness/artifacts/cav-owner-approved-oars-yard-to-shack-original-behavior-migration-20261027.json\`.
Historical baseline/backup:
\`utility-harness/artifacts/cav-owner-oars-shack-migration-original-live-preflight-20261027.json\`.

## VERIFY

Source helper test \`tests/cav-oars-shack-interior-owner-approved-migration.test.mjs\` adds SIX tests:
- Exact new source SHA and native script compile.
- Prevent pickup duplication from canonical source Item globally.
- Preserve historical Skaal Tel DONE Oars.
- Allow genuine fresh Shack grant when no historic Item exists.
- Reject forged source/region ledger, duplicate Item, reserved claim and wrong embedded Item IDs.
- Keep Rowboat Mirror transaction/reward behavior unchanged.

Full Cabin source regression **284/284 PASS, 0 failures across 53 files**, previous 278/278. No player item was created by testing.

An **independent second authenticated elected-GM read-only live inspection** verified PASS:
- Original Yard Region still exists with **zero Oars Behaviors**, original Region flags/historical DONE claim unchanged.
- Shack Interior Oars Region now contains **one original-enabled** \`CAVOARSBEHAV0001\`, correct exact source SHA, tokenMoveIn event and unchanged Region rectangle, with migrated truthful DONE ledger.
- Rowboat Mirror Behavior still enabled, exact new proof source SHA and original event types.
- Exactly **one** genuine Actor Oars Item from source Item remains, on Skaal Tel, with original unmodified historic Yard pickup provenance.
- No source template, Story progression, current player Items or chat messages changed.

Independent native machine readback:
\`utility-harness/artifacts/cav-owner-oars-shack-migration-independent-elected-GM-postread-20261027.json\`.

## Acceptance status / next step

**INSTALLATION REPAIR VERIFIED, PLAYER ACTIVATION NOT YET TESTED.** The owner explicitly wants to test ONE Region at a time and report pass/missing/failure. The real connected player Dyscid currently lacks the original Oars because they belong to Skaal Tel. Because the original DONE award is genuine and one-time, re-entering the migrated Region with a different actor does **NOT** grant duplicate Oars; do not call that a broken test or reset actor/claim without a separate owner approval. A user can confirm the correct Shack Region and presence/trigger without minting extra Item. If owner wants to replay award from zero with a different actor, propose a separate safe, reversible fixture/playtest reset and REQUEST APPROVAL FIRST.

Next: ask owner to identify/enter Shack Interior Oars \`Scene.CAVEXT03Scene001.Region.TWKOyz83JjJu94E7\`, then report whether it activates, appears missing, or fails. Do not modify the next Region until owner specifically authorizes it.

**Preserve historical source patcher** \`studio-cav-opening-triple-claim-proof.js\` and original snapshot tests; those test a 2026-10-26 source migration at its original historical location, and are not the live new Shack runtime. New versioned migration payload/test record today's modification separately.