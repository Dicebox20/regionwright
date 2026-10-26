# Cabin in the Ashen Veil — OWNER_APPROVED Rosewater Symbol Canon

**Date:** 2026-10-26 Pacific. **Owner's direct response:** "Yes I approve." This explicitly approves the set offered in the immediately preceding prompt: **Rose, Sun, Moth, Thorn**. This is a canon decision for symbol **identifiers**, not tacit approval of new icon artwork, puzzle solving, the Bowl location, or full gameplay testing.

## Approved canon

In the existing unified **drained Bathhouse** Scene `Scene.8yLMRDvxyw58dydh`, Region `CAVBROSEWATER001`, the Skyrim-inspired dragon-claw **three concentric rings** contain four symbolic medallions apiece. Exact safe machine identifiers, in panel order: `["rose","sun","moth","thorn"]`. The established solution stays **outer 90°, middle 270°, inner 180°** = quarter turns `[1,3,2]`. With the currently approved order, the glyphs at the fixed top marker in that correct state are **Sun / Thorn / Moth**. The original UI screenshot was archived while labels were merely proposed; they are now owner-approved **text names**, while custom glyph artwork remains optional/unapproved. No Skyrim graphic resources are copied.

## Live elected-GM owner approval write

Using the established Dicebox Bridge PowerShell → Chrome Dev utility harness → Foundry native GM document API, preflight confirmed `game.ready=true`, exact world `cabin-in-the-ashen-veil`, Foundry 14.367, active elected Gamemaster 1, 47 Scenes, Region `Scene.8yLMRDvxyw58dydh.Region.CAVBROSEWATER001`, exactly one native `CAVROSEWATERSCR1` **disabled** executeScript, binding `STAGED_DISABLED`, no prior approval/session flag and **no live Sluice water state**. The original drained screwdriver behavior remained enabled, original Bowl Item `Item.1n5LONw3nYIy61O9` remained in world library. A canonical preset checked `[1,3,2]`.

A **single explicit native Region.setFlag** wrote `dicebox-campaign-helper.cavRosewaterApprovedSymbols`, exactly:

```json
{"status":"OWNER_APPROVED","approvalSource":"owner","symbols":["rose","sun","moth","thorn"],"approvedDate":"2026-10-26","ownerDecision":"Yes I approve","visualReference":"Skyrim-style rotating concentric rings","scope":"Four Rosewater ring identifiers, not separate Bowl pickup or original map artwork","source":"direct campaign conversation","version":1}
```

Same elected-GM call independently read back the entire exact flag and `campaign.cabin.rosewaterRings.describe()` confirmed **symbolsApproved:true**, **status:not-commissioned**, **drained:false**, session NULL, disabled native Behavior true, original screwdriver still enabled and Bowl exists. This receipt is `utility-harness/artifacts/cav-rosewater-owner-approves-four-symbols-native-receipt-20261026.json`. Baseline before receipt is `.../cav-rosewater-owner-approved-symbols-before-20261026.json`. These are actual saved local evidence files on the owner PC.

## Canonical source guard and non-destructive tests

Added `ROSEWATER_OWNER_APPROVED_SYMBOLS` and `matchRosewaterOwnerApprovedSymbols` in the existing campaign preset `modules/regionwright-puzzles-locks/scripts/rosewater-campaign-preset.js`. Changed `studio-cav-rosewater-rings.js` GM `getCavRosewaterApprovedSymbols` to reject `OWNER_APPROVED` flags whose array differs from **exactly** `rose,sun,moth,thorn`. Existing generic Puzzles & Locks editor/engine can still use other four-symbol arrays in pure tests and previews; real campaign GM service accepts only this explicitly approved set. Tests in `tests/cav-rosewater-approved-symbols-gm-commissioning.test.mjs` now exercise exact accepted array, reordered arrays, unapproved drafts and invalid/unsafe strings. Full related suite **80 PASS / 0 FAIL**. Both revised installed module JS scripts had SHA256 equality to source and Node syntax checks pass.

A single exact elected-GM browser reload attempted to verify the *newly loaded source* but timed out (bridge receipt **outcome-unknown**). The durable receipt was inspected: no successful post-reload verification. Subsequent read-only PowerShell showed **Foundry TCP 30000 still ON**, Dev Chrome debugging TCP 9224 **OFF**, and no completed post-reload JSON receipt. **No blind replay**. These facts do not invalidate the prior exact native approval write/verification, but runtime uptake of the latest source after this reload remains **UNVERIFIED**. Future turn should restore CDP safely and recheck exact world/GM/approved array/Behavior from native documents before altering any state. Do not say fully commissioned or tested.

## Activation boundaries

Keep native Rosewater Behavior **disabled=true** and `cavUnifiedBathPuzzleBinding.status=STAGED_DISABLED` until actual Sluice water state is unambiguously OPEN, with Pond and Bath **both drained**, no pending water transaction, actual owner-approved glyph UI/hit region and screwdriver interaction verified, and current elected GM source/dispatch readback passes. The owner did NOT authorize a fabricated water stage or token placement merely by approving the symbols. Do not award Bowl, create a new Reliquary Scene, or claim the puzzle was solved.

Source records, machine manifest and the campaign-wide DCH handoff/metadata/available-message transcript form the durable chronological record. The earlier proposed-only symbol note is superseded by this approval but the archived screenshot remains labeled unapproved *art*.
