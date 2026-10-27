# Cabin in the Ashen Veil — Chat A Rowboat / Carriage / Attic Hatch original DONE-proof batch

October 26, 2026 Pacific, approximately 21:40–21:50. Owner request: "Lets continue." Chat A early/midgame; PREPARE → INSPECT → BUILD → VERIFY → CATALOGUE. October 27 evening completion is a goal, not player-verified readiness.

## PREPARE / INSPECT
- Prior Regionwright HEAD 830d48788bcfae13a760c73ad2cbc129be68c63c, source branch codex/cav-sune-integration-20261026. No tracked source modifications at start; preserve other owner files.
- Foundry 14.367 world cabin-in-the-ashen-veil, elected Gamemaster 1, exact Dev Chrome browser. Before additions, 47 Scenes, 232 Regions, 120 Behaviors.
- Original EXT-01 Oars region CAV01R0000000006 has authentic cavOarsPickup claim status DONE. Actor, original Wooden Oars embedded Item ID and pickup-source/provenance match exactly ONCE. Preserved without modifying or duplicating that reward. Original Oars source SHA fdfe8b39afa1fb4bf77416b05fefc11aae8936eef9436a1a593e96fbc17888e2.
- Found three additional existing consumer authorization gaps: EXT-02 original Rowboat accepted Oars tags without completed original Oars claim; EXT-01 original Family Carriage accepted Carriage Key tags without completed paired Vanity Key claim; H-U02 original Attic Hatch accepted Hook tags without completed Carriage Hook claim.
- Original native Region IDs, behavior UUIDs, event subscriptions, GM-authorization and reward transaction status fields inspected; no new Scenes or Regions needed.

## BUILD — three original behaviors, source pinned
- New Node-only strict original-source-SHA transformer modules/regionwright/scripts/studio-cav-opening-triple-claim-proof.js; exact original source snapshots docs/cabin-ashen-veil/native-source-snapshots/cav-{rowboat,carriage,hatch}-original-20261026.js.txt.
- Rowboat original CAVMIRRORBEH0001 now requires original Oars cavOarsPickup.status DONE, same actor, original source UUID and exact embedded Oars Item ID/provenance. New installed SHA e310f3684eb4299cd4cc9171c0d4098e5a5c87548505f5edeac252eaac65ad09, old SHA 55205e21926418bf764081c4f2e21d372d103fec08f834a08cb44bdfdfce71a8.
- Carriage original 3nhNHvdSWo9ix10a now requires original Vanity cavVanityKeysClaim.status DONE, same actor, Mirror source, both ordered original Key sources and two distinct embedded item IDs, plus matching Carriage Key ID/provenance. New SHA c0623e82535d9b0c372e31fd74a9dfd95a4e6149c0599b5b8ad0c82bd62e31, old SHA a8b0ffc1037c5d0c65fb812bed1230a0dd22a1d00102c261d0766d9714f00d77.
- Attic Hatch original 8gISLbFWqUhxy9e8 now requires original Carriage cavFamilyCarriageHookClaim.status DONE with actor, exact embedded Ladder Hook Item ID and original provenance. Original safeguard (enable RETURN before ENTRY) remains unchanged and both travel Behaviors stay disabled pending genuine gameplay. New SHA 6b673d12f662c0ea95570c048e32e5f0bd7da359ef1699d2931d6862b02547d0, old SHA 160447535fe8d31d77270c7a2b2971dab18eaa879a415115fa721f1fde739c69.

## VERIFY
- Added tests/cav-opening-oars-carriage-hatch-done-claims.test.mjs. 19 new tests passed after respecting original Rowboat CRLF formatting; authentic DONE positive, reserved/orphan/forged/duplicate negative, legitimate Vanity pair and original Attic return-first checks. Full source test suite 217/217 PASS, 0 FAIL, 42 test files.
- First command-wrapper parse failed before remote tool call or Foundry write. Corrected and executed one guarded three-behavior installation session, exact SHA/precondition per original Region, each native source updated exactly once. Receipt utility-harness/artifacts/cav-chat-a-original-rowboat-carriage-hatch-three-native-install-20261026.json: installed-gm-readback-pass.
- Independent GM readback initially classified FAIL because shared live world grew from 120 to 121 Behaviors (45 to 46 scripts), while all three expected script SHA matches were PASS. Read-only delta identified a NEW Chat B-controlled Greenhouse Lye Behavior CAVEXT06LYEMIX01 in EXT-06, not a Chat A regression. No Chat B edits. Reran readback with the positively classified additive count: PASS, 47 Scenes, 232 Regions, 121 Behaviors, 46 scripts all syntax-valid, 75 teleports, 54 chat messages.
- Independent record utility-harness/artifacts/cav-chat-a-opening-triple-native-independent-postread-20261026.json: 3 new script hashes match, prior Oars/Vanity/Hour/Minute/Roof sources unchanged, original Oars DONE and exact one matching actor Item, seven downstream stage claims NULL, Attic entry/return disabled, zero new puzzle actions. No real non-GM acceptance.

## CATALOGUE / NEXT
- Append to Regionwright puzzle log; add dated DCH handoff, structured metadata and between-turn conversation transcript. The owner prioritizes campaign playable before October 27 evening, but late-game integration and genuine player acceptance remain unverified.
- Next early/midgame work: inspect actual player click/token approach and original travel landing, prioritizing novel issues, without forcing original claim flags. Crooked Man chase remains owner-deferred, Rosewater disabled until original Crank/Pond+Bath drain, original Sune Bowl placement undecided; independent Chat B late-game remains separate.

STATUS: 217 source PASS; 3 native original Behaviors installed and independently elected-GM-verified; no fabricated rewards, player playtest NOT performed.
