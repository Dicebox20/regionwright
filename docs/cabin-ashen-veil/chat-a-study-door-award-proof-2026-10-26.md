# Cabin in the Ashen Veil — Chat A Original Brass Study Key → Study Door Recovery Safety

**Date:** 2026-10-26 Pacific, approximately 19:12–19:34.
**Owner instruction:** “resume.”
**Workstream:** Chat A early/midgame and shared live Foundry installation. Chat B is responsible for separate late-game source. **Evidence:** PREPARE → INSPECT → BUILD → VERIFY → CATALOGUE, elected-GM native read-only audit, one exact native-script update, one guarded reload, independent GM readback and full pure regression tests. Actual Player 1 interaction was **not** conducted.

## PREPARE / authoritative original world

Regionwright integration branch `codex/cav-sune-integration-20261026`, starting HEAD `a3e880d35d06d2616fdac231620a25798f478edb`. Existing Foundry server TCP30000 online. Dev Chrome CDP9224 was initially seen listening but closed before the first browser audit; inspected the durable Bridge error receipt (ECONNREFUSED). Started exactly **one documented Chrome for Testing Dev utility-harness** after checking for duplicate harness processes. Foundry server was not restarted; Chrome recovered from `/join` to the original `/game` automatically with no duplicate GM login.

Actual post-recovery authenticated elected GM Foundry VTT **14.367**, world `cabin-in-the-ashen-veil` revealed:
- Original Sune Grove relief `Scene.CAVSG05Scene0001.Region.L15BdSqcbCOLPnIN`, regionwright sliding Mosaic status `locked`; original Gold `cavSuneGoldClaim=null` and original Brass Study Key `cavSuneBrassKeyClaim=null`.
- Original world source `Item.CAVSTUDYBRASS001` `Brass Key`, loot, quantity 1; **zero provenance-tagged player keys** across Actor collections.
- Original Study door `Scene.CAVHG06GreatRoom.Region.CAV06R0000000003`, native elected-GM unlock `RegionBehavior.CAVHG06STUDYG001` enabled for `tokenMoveIn` and `tokenMoveWithin`; original locked `teleportToken` `RegionBehavior.CAVHG06STUDYT001` disabled, sole existing canonical destination `Scene.CAVHG05Scene0001.Region.CAVB9AA3D7BE9560`; exact landing exists. Door unlock ledger `cavStudyDoorUnlocked=null`. Three original Great Room tokens were not touched.
- Original Sune reward GM service and Study 587 elected-GM service registered; messages 54. Original Study note, Crank, Sluice and Rosewater have not advanced.
- Native prior audited original source and Region object captured in `utility-harness/artifacts/cav-chat-a-study-door-brass-key-live-preflight-20261026.json`.

## INSPECT — authentic reserved award could unlock the Study door

The original gate checked that a nearby owned character possessed an embedded Item named `Brass Key` carrying source UUID and Sune Region flags. But original `studio-cav-sune-relief.js` **reserves the Key reward ledger, then creates the player Item, then records `done`**. A crash after Item creation could leave a provenance-tagged key while Sune `cavSuneBrassKeyClaim.status=reserved`. The old door source did not validate this completed award receipt or match the key's actual ID/Actor against the Sune ledger, and accepted a portal if its `Set` of destinations merely **included** the Study landing even with extras.

The existing door script correctly fails closed on its own `cavStudyDoorUnlocked.status=reserved/done` and preserves uncertainty after a failed reserved/native teleport commit; do not remove this logic, auto-retry an Item award or auto-enable a reserved portal.

## BUILD — pure proof + exact original native Behavior patch

NEW `modules/regionwright/scripts/studio-cav-study-door-preflight.js`: exported read-only `assessCavStudyDoorUnlock`, requiring:
1. Study Door ledger remains truly unstarted (no reserved/DONE/unknown ledger).
2. Original Source Key `Item.CAVSTUDYBRASS001`, loot, `Brass Key`, quantity 1; selected Character Actor and Token IDs.
3. Original Sune Gold reward DONE and original `cavSuneBrassKeyClaim.status=done` with `actorId`, original Key source UUID and nonempty `embeddedItemId`.
4. Exactly **one** candidate original source/provenance-tagged Brass Study Key across world Actors; same Actor and embedded Item ID as the DONE receipt, exact Grove/Source flags and `cavSuneReliefReward="key"`, name/type/quantity intact.
5. The actual original Study landing exists; original `CAVHG06STUDYT001` is `teleportToken`, disabled and has **one and only one** exact approved Study target. No extra destinations.
6. Every missing, reserved, duplicated, mislabeled, mismatched or unknown state returns `{ready:false,reason:"..."}`, with no world writes.

NEW `tests/cav-study-door-original-key-recovery.test.mjs`: 7 pure+static tests covering valid authentic award, missing/reserved reward, reserved/done door ledger, wrong/duplicate/missing Item, wrong/multiple portal destinations, invalid Actor/Source/Token and ensuring the native guard precedes the existing elected-GM `reserved` write. **Full source regression suite 125 PASS / 0 FAIL**, up from 118.

Original gate script `Scene.CAVHG06GreatRoom.Region.CAV06R0000000003.RegionBehavior.CAVHG06STUDYG001` retained every existing owner-token, event, GM, original Item, reserved ledger, portal enable and success message path. Its old loose portal `destinations.includes(...)` check was replaced with an async import of the pure proof function and validation before the original `setFlag(status:"reserved")`. It is still the **same one** native GM executeScript behavior; no new Region, Item, Scene, behavior or teleport. Original and patched source strings with original and new SHA256 and original locked portal description preserved in `docs/cabin-ashen-veil/study-door-original-gate-source-2026-10-26.json`:
- Original executeScript SHA256 `32243D17D8B7E93AE77535223952AAA88F72FAB852198B8D6B1D5DE6101692DE`.
- Revised executeScript SHA256 `4B1D0F90277912FB16B7948F6A14C233C4509FEF1D6C69C8A447E7DC281DAE11`.
- Installed/source new pure module SHA256 `50AB48FBCE3E81708A926A778D740A55BDCD065DCBA2CA293EA7BCB3CD33D888`.

## VERIFY — elected GM runtime and no campaign progression

NEW pure module installed to existing Regionwright module with exact source/installed SHA match and Node syntax PASS. Source proof manifest Node VM compiled the patched native code before any Foundry edit.

Performed exactly **ONE source-guarded native RegionBehavior update**: elected GM/right world, exact original gate script source, original Region ID/events, original disabled canonical portal, Gold/Key/door flags null, original landing exists, correct Item source. After write, read back exact new native `system.source`, original enabled gate and locked portal, all original story flags unchanged and chat count **54**. Receipt `utility-harness/artifacts/cav-chat-a-study-door-brass-key-gate-install-receipt-20261026.json`.

Performed **ONE** guarded Foundry game-tab reload after the native update. Independent post-reload authenticated elected GM read-only CDP checked new source import and the exact installed native gate, locked original teleport/destination, real World Key and zero tagged Actor keys, no reward/door flags. Pure synthetic canonical DONE key receipt passes; a RESERVED award and duplicate Item proof both deny. Sune relief and 587 GM listeners present. All 54 messages intact. Positive `utility-harness/artifacts/cav-chat-a-study-door-after-reload-elected-gm-verified-20261026.json`. No actual World Item grant/deletion, token movement, portal enable, quest flag, Study 587 note read, water-state change, or real player-side test.

## NEXT / continuity boundaries

The current original Sune Mosaic remains `locked`, the Gold and Brass Key are unclaimed, the Great Room Study Door remains locked. Until owner-authorized ordinary-player gameplay acceptance, only source-based and native read-only testing. Do not fabricate `cavSuneGoldClaim`, `cavSuneBrassKeyClaim` or `cavStudyDoorUnlocked`, replay uncertain reward creation, enable the portal, or stage a synthetic character.

Next Chat A safe task: expand the existing GM-only Crank reconciliation diagnostic or create a separate read-only **Sune Brass Key / Study Door ledger topology report**, classifying interrupted Gold/Key awards and door portal reserved/done mismatches while respecting owner approval. That could help final player acceptance without altering the state. Chat B retains isolated late-game code and does not touch Chat A shared live Foundry/early chain.

**Classification:** CODE + NATIVE GATE BUILT/DEPLOYED, source and GM live state VERIFIED, `125/125` regression PASS; ordinary-player end-to-end acceptance remains **NOT PLAYTESTED**.
