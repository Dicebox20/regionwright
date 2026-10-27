# Cabin in the Ashen Veil — Chat B Turn 14: Native Batch 1 guarded interaction installation

**Date:** 2026-10-26 20:31 Pacific. **Worker:** Chat B, owner-authorized for disjoint late-game native writes to one SHARED live Foundry world; Chat A continues early/midgame. **Status:** 3 native executeScript Region Behaviors INSTALLED, source/ledger readback verified; NOT ordinary-player tested or full puzzle completion.

## PREPARE / source control
- Source checkout: `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`, branch `codex/cav-late-game-chat-b-20261026` initially clean at `adfee26b987739de4c0dc5cbf32b82d9c65192b1`.
- Separate Chat A HEAD observed `0e83bfdbdd3c13e45fc8f619e8c43a1d073f771b`; Chat A untracked files left untouched. No edits to its checkout, shared Studio registry, module manifest, world Items or prior native behaviors.
- Dicebox Bridge locally ready; canonical chat identity missing, no peer chat relay. Foundry 14.367 `cabin-in-the-ashen-veil` elected `Gamemaster 1` exact localhost /game verified. 47 Scenes. Chrome for Testing Dev utility harness/Playwright CDP.
- Previous T13 native originals found unchanged: Silver Tiny Key `Item.IY8fuUG5P0yWIZIh`, Ornate Music Box `Item.YaKs6z2AWlEAlyzx`, Prayer of Protection `Item.5jwy75XyFezukf3b`, Wick `Item.o0g8PyGRIbdwVM3m`, Lamp Oil `Item.CAVLAMPOIL000001`, original Eye #2 `Item.QIH1ugEWGOO1U6LN`. No copies of the new four on player Actors.

## New native source and three INSTALLED enabled Behaviors
- Reusable isolated source `modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js` dynamically generates a self-contained native Foundry Region `executeScript` source for each original fixture; NO shared Studio registry import needed.
- Each enabled native Behavior has `behaviorViewed`, `behaviorUnviewed`, `behaviorDeactivated`, `tokenMoveIn`, `tokenMoveWithin` events. Non-GM fixture pointer click offers read-only inspection. A possible progress action requires an elected active GM, owned active player character and real token centered within original Region, original Item source/provenance, separate elected-GM Dialog confirmation of deliberate player action. Native reserve→effect→independent reread→done; uncertain stage remains reserved for manual reconciliation. Neither player flags nor world Item membership alone unlocks the stage.

| Stage | Exact native RegionBehavior UUID (and parent) | What can function after genuine upstream prerequisites |
| --- | --- | --- |
| H-U04 Hope Chest | `Scene.CAVHU04Scene0001.Region.CAVHU04HOPECHST1.RegionBehavior.CAVHOPECHSTBEH01` | Confirms the original Silver Tiny Key `Item.IY8fuUG5P0yWIZIh` carried with verified SG-01 second chase marker source receipt; discrete unlock then separate original Music Box `Item.YaKs6z2AWlEAlyzx` once-only grant. Key is not consumed. No Prayer claim until complete original readable Journal. |
| H-U08 Candle Workshop shelf | `Scene.CAVHU08Scene0001.Region.CAVBE5639AEC2179.RegionBehavior.CAVWICKSHELFBEH1` | Original Wick `Item.o0g8PyGRIbdwVM3m` single pickup only AFTER original Studio Protection passage Region read ledger `cavStudioProtectionPassage.status=open` with `Item.5jwy75XyFezukf3b` and genuine Prayer read provenance. Passage adapter not yet installed; therefore currently fail-closed. |
| EXT-05 Hanging Gazebo lantern | `Scene.CAVEXT05Scene001.Region.CAVEXT05LANTERN1.RegionBehavior.CAVLANTERNBEH001` | Independently verified original Donovan Shack Lamp Oil source, and/or authentic claimed Wick; elected GM and explicit action can install either in any order and persist separate records. Material source is deleted from character only after reservation. The lantern IGNITION/cobwebs/Eye #2 pickup still requires separate approved visual effect and pickup Region; intentionally NOT enabled. |

All three native Behaviors are enabled and installed **without changing upstream puzzle state**; predicates remain unmet, so nothing is auto-awarded. Names remain late-game owned only.

## Native partial-write incident — resolved, do NOT blindly replay
- First installer `cav-chatb-turn14-three-native-behaviors-install-20261026.mjs` preflighted 3 Regions exactly, all zero Behaviors; attempt committed Hope Chest Behavior and then threw on strict source equality because Foundry **automatically trims one leading and one trailing newline** from the saved `executeScript.system.source` (native 9609 chars vs generated 9611).
- First install receipt output was uncertain and not treated as failure/no effect. Explicit independent readback confirmed EXACT existing Hope Behavior ID, type, enabled status and events. `cav-chatb-turn14-normalization-proof-20261026.mjs` compared full normalized source and SHA256: trimmed source **EXACT MATCH** `c1db0b18787cb3b47f9e3a3e53454f123dbb267296867e5b6bf46b7aa1886186`.
- Installer was NOT replayed; a separate continuation script commissioned ONLY missing Wick and Lantern Behaviors, using normalized canonical source comparison, and verified each in Foundry.
- New fully separate independent elected-GM readback report `cav-chatb-turn14-native-independent-postread-20261026.json` yielded `pass:true`: three exact native Behavior source hashes, enabled flags, events, zero late claim/installation ledgers, four original library Items unique as GM_LIBRARY_ONLY, **0 actor copies**, and existing Study return plus NW bust Winder RegionBehaviors still present.
- Exact native source SHA256 (after canonical Foundry trimming):
  - Hope `c1db0b18787cb3b47f9e3a3e53454f123dbb267296867e5b6bf46b7aa1886186`
  - Workshop Wick `ec40a5c37bab7b6bd167fcd8c9820e6172d0b44e399b08853d1ae8070fe5b8c7`
  - Gazebo `3cd7547b4f941a7f7a707bb86d6977f96d45e38563fc9b247d02ef0242e8029b`

## Tests, next requirements, boundaries
- New source file syntax + three compiled native async Region bodies PASS. 15 new adversarial/static tests `tests/cav-late-batch1-native-region-scripts.test.mjs` PASS. Entire Cabin suite **1170/1170 PASS across 39 files**; no false claim this is genuine nonGM UI/gameplay acceptance.
- Native script persistence as RegionBehavior document readback verified. **After actual browser reload and actual non-GM token/pointer/GM confirmation is still UNTESTED**; require safe acceptance playtest.
- Outstanding story blockers: SG-01 second Crooked Man chase and its original Silver Key drop Region/source provenance, owner-complete Prayer of Protection readable full Journal, original Studio Sune altar/Protection passage and paired Workshop portals, Gazebo temporary cobweb effect and persistent original second eye explicit pickup, Rufus H-G05 interactive geometry overlaps existing Study doorway Region and must not be placed blindly. Original eye1/bear and native oil pickup unchanged.
- No direct activation of late second chase, Prayer reward, gazebo ignition or 2nd eye; no Chat A early/midworld writes, no cross-scene teleport, Actor, Item, progression flags or global GM ledger mutations during installation.
- Archived native installer/proof/source and independent readback under `docs/cabin-ashen-veil/native-install-evidence/2026-10-26-chat-b-batch1-turn14/`. These are reproducible forensic artifacts, **NOT safe rerun** scripts.

**Next bounded turn (T15):** Resolve SG-01 original second chase/capture prerequisites and persistent drop Region safely, then owner-approved Prayer Journal/Studio altar and physical route, and staged Gazebo Eye #2 marker. Do not bypass first-chase completion or modify Chat A's active Regions. Priority is finish actual gameplay steps, then controlled non-GM testing, not more inert structures.