# Cabin in the Ashen Veil — Chat A two original early-act reward-boundary safeguards

**Date:** October 26, 2026 Pacific (~21:29–21:38). **Workstream:** Chat A EARLY/MIDGAME. **Process:** PREPARE → INSPECT → BUILD → VERIFY → CATALOGUE. **Goal:** authentic Cabin completion before October 27 evening. No staged reward claims, player testing, Crooked Man chase, or Chat B changes.

## PREPARE / live exact context
- Before: Regionwright `codex/cav-sune-integration-20261026`, `df73f0d303983e48d67d621181672ef64f368e40`, 185 source tests.
- Dicebox Bridge persistent PowerShell available; Foundry port 30000 and existing Dev Chrome debugging port 9224 both reachable. Existing `http://127.0.0.1:30000/game` exact elected Gamemaster 1, Foundry 14.367, world `cabin-in-the-ashen-veil`. 47 Scenes, 232 Regions, 120 native Behaviors, 54 ChatMessages.
- Zero tracked source changes at start. Existing user untracked files, foundry world Scenes, and Chat B late-game scripts preserved.

## INSPECT: original award dependency continuity
Native original Rowboat Mirror `Scene.CAVEXT02Scene001.Region.CAVROWBOATREG001.Behavior.CAVMIRRORBEH0001` (one native GM-enabled Execute Script) awards `Item.CAVMIRRORSUNK001` from Oars and writes `cavPondMirrorPickup` as `reserved` then `done` with `actorId`, `sourceUuid`, `itemId`. The Mirror script was already healthy and remained unmodified. SHA256 `55205e21926418bf764081c4f2e21d372d103fec08f834a08cb44bdfdfce71a8`.

Original Dahlia's Vanity `Scene.CAVHU07Scene0001.Region.CAVVANITYREG0001.Behavior.CAVVANITYBEH0001` accepted merely a tagged Ornate Mirror. Its original paired-key transaction awards `Item.CAVBRASSKEYVAN01` and `Item.CAVCARRIAGEKEY01` and writes `cavVanityKeysClaim` `reserved`→`done`, `actorId`, `mirrorUuid`, `rewardUuids`, `embeddedItemIds`. A partial/abandoned Rowboat transaction could unlock keys despite missing DONE proof.

Original Grandfather Clock `Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q.Behavior.SAshGMH5A3AsJC0Y` accepted a tagged Brass Tiny Key #1, without requiring the paired Vanity award's completed claim. Partial Vanity transactions could unlock the Hour Hand. It correctly writes its own `cavGrandfatherClockHourHandClaim` as `reserved`→`done`. Previous Roof Clock GM and player UI already demand true completed Hour/Minute award records, so upstream provenance was the remaining gap.

Attic Minute Hand `Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG` separately inspected: its existing actual reward script requires `cavAtticLadderLowered.status=done`, matching enabled original entry+return portals and original Source Item; original `reserved`→`done` claim and unique reward. It was not changed, and remains subject to genuine non-GM acceptance.

## BUILD: two strictly pinned original native source replacements
1. Vanity script adds prior original Rowboat Mirror `cavPondMirrorPickup.status=done` with correct Actor claimant, original Mirror UUID, exact `itemId` and matching one original Item/provenance from original Rowboat Region. It refuses missing/reserved/forged/orphan/duplicated Item records. All prior mirror artwork, two original Key awards, GM controls, Item creation, private narration and once-only `reserved`→`done` sequence preserved.
2. Grandfather Clock script requires original Vanity `cavVanityKeysClaim.status=done`, same actor, original Mirror source, ordered two reward source IDs and two distinct original `embeddedItemIds`; the original Brass Key's first embedded ID, name, provenance and Region must still match the actor's Item. The Carriage Key need not remain in inventory after being properly awarded. Original clock click-to-inspect and Hour Hand once-only transaction remain unchanged.

**Original native SHA256:**
- Vanity `8be78e1904677af764b63989db85749833895fa32aa0610a7863974e2d26c182`.
- Hour `7acc56464e73dbf26527d6883154e05f928400c7b983bd646e92fe97dacd3786`.

**New installed native SHA256:**
- Vanity `744a523cc0e90b01a6ea91dc7145e7e8cfce4a9ed094b292edd4f4e845d2dfbd`.
- Hour `7964c9604084220eb7d9d83958e0351da2b2d8afcb347afec95450ea8daa96ef`.

Source-only fail-closed two-function transformer: `modules/regionwright/scripts/studio-cav-first-act-receipt-parity.js`; exact original native script snapshots in `docs/cabin-ashen-veil/native-source-snapshots/cav-{vanity,hour}-original-20261026.js.txt`. It refuses any unexpected original source hashes or ambiguous anchors. Both original live `system.source` fields were edited exactly once, no Region/Behavior replacements.

## VERIFY
- New `tests/cav-first-act-mirror-vanity-hour-done-receipt.test.mjs` contains 13 tests, all PASS. Tests exercise actual generated script proof blocks against mocked DONE, RESERVED, bogus ownership/Items, duplicate/partial/wrong-order claims, and allow legitimate consumed Carriage Key after award. Source patches parse in Foundry async scope and preserve transaction-write counts.
- Full Cabin source regression: **198/198 PASS, 0 failures** across 41 test files (prior 185).
- One combined guarded native Foundry write session: both original sources, exact region IDs and enabled events, NULL original claim preflight, exact 47 Scene/54-message state; both individual updates succeeded. Receipt `utility-harness/artifacts/cav-chat-a-vanity-hour-two-original-done-boundaries-install-20261026.json`, status `installed-gm-readback-pass`.
- Independent second GM read-only CDP process: **PASS**, five compared original/changed native SHA matches (Vanity, Hour, unmodified Rowboat Mirror, unmodified Attic Minute, previous Roof Clock). 47 Scenes, 232 Regions, 120 Behaviors, 45 valid native Execute Scripts, 75 teleportToken Behaviors, 54 messages. Mirror, Vanity, Hour, Minute and Roof claim ledgers all **NULL**; no character received those original reward Item copies. Receipt `utility-harness/artifacts/cav-chat-a-firstact-mirror-vanity-hour-independent-gm-postread-20261026.json`.
- No actual non-GM player playtests yet, no simulated or forced story progression, no new Scenes, Regions or Items, no late-game Chat B edits.

## CATALOGUE / next turn
- Preserve this source report, adjacent JSON metadata, exact native snapshots, regression suite, chronological Regionwright log append and the DCH Cabin handoff + transcript.
- Continue source/GM parity from Oars and original Ladder Hook toward larger early-game vertical slice, only correcting newly evidenced gaps. Do not re-audit healthy original Roof, Boiler, or existing Attic Minute unnecessarily.
- Progression playtest still requires genuine non-GM player interaction at owner-approved final testing stage. Roof Gear/Aqueduct route and first Crooked Man chase remain gated; Rosewater disabled pending actual synchronized Crank drain; Sune Bowl pickup exact fixture undecided; late-game Chat B independent until owner directs connection.

**Status:** 198 source tests PASS; two original Foundry RegionBehavior sources installed + independently GM-verified; NOT real-player accepted.
