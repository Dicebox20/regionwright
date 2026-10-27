# Cabin in the Ashen Veil — Chat A global RegionBehavior contract + Roof Clock player receipt parity

**2026-10-26 Pacific ~21:10–21:22.** User requested completion work ahead of October 27 evening. Chat A retained scope of early/midgame and source branch `codex/cav-sune-integration-20261026`; Chat B late-game kept separate. Workflow: PREPARE → INSPECT → BUILD → VERIFY → CATALOGUE. No synthetic puzzle/Item claims or ordinary-player acceptance.

## PREPARE: exact verified source/runtime
- Starting Regionwright HEAD `a500b0d058f9adf6240188c2b37d3e9834971359`, previous 177 Cabin tests. No tracked changes before this bounded work unit; owner untracked artifacts retained.
- Foundry 14.367 world `cabin-in-the-ashen-veil`; active elected Gamemaster 1, Chrome for Testing Dev utility harness at local CDP 9224 and Foundry 30000.
- Corrected Dev Chrome lifecycle: launch existing `Start-Harness.cmd` from persistent `cmd /k` console rather than detached `cmd /c`; latter closed harness stdin and terminated browser. One verified persistent launcher, no Foundry server restart.
- Latest live native count **47 Scenes / 232 Regions / 120 Behaviors** (45 executeScript, 75 teleportToken). A prior inventory read 231/118; preserve both chronological snapshots because live world has changed independently.

## INSPECT: world-wide native RegionBehavior contracts
- Read-only actual elected-GM snapshot saved as `utility-harness/artifacts/cav-chat-a-all-behavior-contract-readonly-20261026.json`.
- Compiled all **45 native Execute Scripts** in asynchronous JavaScript parsing context: **zero syntax failures**.
- Inspected original Foundry Scene/Region UUIDs rather than incorrectly requiring a destination Region to have a Behavior: **75/75 teleportToken targets resolve to real Regions**, no broken destination and no duplicate Behavior key in that census.
- An initial checker incorrectly validated destinations only against Regions with behaviors and reported 74 false mismatches; fixed to use **every original native Region UUID** before publishing positive proof. No underlying teleport configuration altered.
- This is STRUCTURAL/SYNTAX PASS, not validation of route landing safety, player acceptance or every independent puzzle state transition.

## Roof player defect and approved constraints
- Original playable Roof Chimney Clock `Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001`, one enabled native `executeScript` `i6UNtWSFFaZgkdZD`.
- Original native source SHA256 `60136c5c25faf8de4a9931889a0e6efe1468c4790dd088cc77cd9fbaa2d6a55c`; exact unmodified snapshot in `docs/cabin-ashen-veil/native-source-snapshots/cav-roof-player-original-20261026.js.txt`.
- Previous GM Roof Gear handler was hardened at HEAD `a500b0d` to require completed Hour/Minute hand award and Item identity, but the original *player close-up* still merely inspected provenance-tagged Actor Items, so reserved/interrupted awards showed an Engage action GM would deny. It did not enforce the GM's 400px reach limit. The legitimate Clock solution **12:00** and one-time Gear claim must not change.

## BUILD: one narrowly scoped original native script correction
- New Node-only fail-closed source transformer `modules/regionwright/scripts/studio-cav-roof-player-parity.js` pins original source SHA, applies unique exact anchors, replaces UI-only hand eligibility with original Hour/Minute `status=done`, exact source UUID, claimant Actor ID, embedded Actor Item ID and genuine provenance flags, and mirrors the elected GM's original 400px clock-center reach.
- Player close-up remains available; control choices and Engage only when two original completed award receipts plus proximity qualify. GM controller remains authoritative for global uniqueness and actual Gear grant. No native script source now mutates reward/world flags; the existing request goes to elected GM for revalidation.
- Exactly **one** existing Roof RegionBehavior `system.source` changed in elected GM Foundry; same exact Region/Behavior ID, events, enabled state and clock art. Checked original SHA, world, active elected GM, Region counts, expected events and original claim null before write. No new Scene, Region, Behavior, Item, token or reward was created.
- New installed native source SHA256 `212584fe6c6eb0780a711b5e9ee23a34cf854c4518cd91d53175af15158a840d`; original is retained exactly for rollback.

## VERIFY: tests, native write receipt, independent GM readback
- Added eight focused tests `tests/cav-roof-player-done-receipt-ui-parity.test.mjs`: 8/8 PASS. Combined Cabin source suite **185/185 PASS, zero failures**, previously 177.
- The first snapshot attempt copied JSON via Windows PowerShell text conversion and changed Unicode bytes. Its SHA mismatch failed closed (8 tests initially red); corrected by copying *exact native JavaScript string bytes* with Node, independently SHA-checked, then reran tests 8/8 and 185/185 green before any world write.
- One elected-GM native source edit receipt: `utility-harness/artifacts/cav-chat-a-roof-player-done-claim-native-install-20261026.json`, status `installed-readback-pass`.
- Separate fresh GM read-only harness process: `utility-harness/artifacts/cav-chat-a-roof-player-parity-native-independent-postread-20261026.json`, PASS. Readback: native SHA matches intended, 47 Scenes, 232 Regions, 120 Behaviors, 45 syntax-valid scripts, 75 teleports, 54 messages; Hour claim NULL, Minute claim NULL, Roof claim NULL, real Pond water NULL. No actual player claim, Gear grant, token movement or story progression.

## Open next work / checkpoint discipline
- **Player 1 acceptance still deferred by previous owner direction.** Structural success does not certify the Roof interaction for a real non-GM token. Exact test should confirm authorized player close-up with completed source grants and 400px reach under authentic in-game progression.
- Next source/native batch should inspect remaining early/midgame click/GM proof parity (Grandfather/Attic award and Study, Rosewater proof when water genuinely drained) and open-route safety without fabricating original flags.
- Unique original Sune Scrying Bowl pickup fixture remains owner-undecided. Crooked Man actor/first-chase remains deferred. Rosewater remains disabled until actual original Crank and synchronous drain. Do not create separate BATH-03/BATH-04 scenes or Boiler reward consumer.
- Chat B handles independent late-game source and any independently documented native late-game additions. Its source branch was not modified during this batch.
- Record further changes chronologically in Regionwright log and DCH archive handoff, metadata and conversation transcript.

**Status:** Native RegionBehavior BUILT/INSTALLED/INDEPENDENT-GM-READBACK PASS; 185/185 source tests PASS; player acceptance NOT TESTED.
