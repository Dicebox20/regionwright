# Cabin in the Ashen Veil — Chat B Turn 9 / L1-I Handoff

**Date Pacific:** 2026-10-26. **Work:** Six original books, chronological Spine Mosaic, H-U05 concealed in-room reward and original Gond Emblem Half. **Disposition:** proposed pure source and tests only; NO shared module registry modifications, installed Foundry changes, or gameplay acceptance.

## Verified independent workspace and provenance
- Regionwright source branch `codex/cav-late-game-chat-b-20261026` in `C:\Users\rujie\Documents\CAV-Chat-B-Late-Game`. Source parent at start `c90a93dc7a45156dbbd1a1d93dd4ffe7afd43335`, clean.
- Read-only Chat A checkout `C:\Users\rujie\Documents\Region Editor` observed HEAD `b64771e203cbcf9b41607ebe63b12cb8fc0bb673`, not modified. Chat A remains sole active-GM integrator and world writer.
- Dicebox Bridge doctor: local PowerShell ready, canonical ChatGPT identity missing. No relay to Chat A and no native Foundry/campaign writes.

## Exact canonical storybooks (historical original Oct24 GM Item IDs)
| Published (DR) | Exact original title | Source UUID | Original puzzle source |
| --- | --- | --- | --- |
| 1442 | The Knight Who Befriended a Dragon | `Item.Qplmy8JR7plDYLiY` | Sophia's preplaced bookshelf |
| 1443 | Moonlight and the Missing Stars | `Item.DLGIhHc0RDqh0YVt` | Attic |
| 1444 | Felix Fox and the Forgotten Kingdom | `Item.TO69wBYN8sRJuxtH` | Pond hollow log |
| 1445 | Whispers of the Little Witch | `Item.c3oKW8YkklE8slnX` | Sophia's preplaced bookshelf |
| 1446 | The Clockmaker's Starless Sky | `Item.HV7XjKmgqVITSEvW` | Chimney flue |
| 1447 | Princess Penelope and the Sea of Stars | `Item.gmTsIOqc3qFBc3zA` | Sophia's **bed only after Crimson Veil** |

**Authority:** October 22 authoritative puzzle design LOCK-11 explicitly locks mapping/year, although an older October 24 Item-creation checkpoint still claims the order was not approved; the locked mapping in the canonical spec governs. Later October 26 owner/Chat B handoff overrides the older spec's external H-U06 hidden room: the reward compartment is **inside Sophia's H-U05 bedroom**, source Scene `CAVHU05Scene0001`; NO H-U06 creation/teleport. Preplaced bookshelf titles may be moved when solving; books outside Sophia must actually be recovered. World library templates alone do not certify inventory. A readable publication year in each original Journal is required; actual live handouts must be verified.

## New source-only L1-I
- `modules/regionwright/scripts/studio-cav-late-spine-books-contract.js`
- Four pure decision exports: `planVeilSixthStorybookPickup(receipt)`, `planSpineMosaicSubmission(receipt)`, `planGondHalfCompartmentPickup(receipt)`, `planSpineCompartmentRehydrate(receipt)`.
- Exact manifest `CAV_BOOK_MANIFEST`, generic-engine-validated `CAV_SPINE_CONFIG`. The source composes existing `regionwright-puzzles-locks/scripts/spine-mosaic-engine.js` collection+order functions; does NOT create a replacement UI, art, or independent drag/drop implementation.
- Original Oct24 Gond Emblem Half historical ID `Item.o9G3UJjEe2QX1ZH0`, distinct from `Item.t9uCIpsKeSvtC31w` Sune half. Real Gond half pickup is a separate, explicit owned-PC Region interaction only after the revealed compartment, not an immediate order-solve grant.
- Once-only reserved/solved/revealed/done ledgers require a native authenticated elected-GM reserve/effect/postreadback/complete adapter. Partial ledger => manual reconciliation, no duplicate or guessed reward. Scene reload may restore only safe in-room compartment visuals and must never spawn a second Item.
- Verified original Item UUID, title, year shown in readable Journal, correct placement/pickup Region provenance, physical preplaced shelf/book inventory, Veil sixth-book claim and zero duplicates are required. Incorrect order is reversible without Item consumption.

## Tests and evidence limits
- `tests/cav-late-spine-books-contract.test.mjs`: **126/126 PASS**; existing Regionwright generic engine used directly in tests.
- Entire `tests/cav-*.test.mjs` local expanded suite **722/722 PASS across 35 files**; source `node --check` PASS.
- All tests are isolated pure source fixtures, NOT live Foundry/GM execution, Sprite UI smoke, actual owned PC inventory readback, teleports or player gameplay certification.
- No original source Item, Journal description, Image assets, Actor, token, Scene, Region, Foundry module or global registry changes were made.

## Exact current-world blockers (STOP before Chat A integration)
1. Read original six Items currently in world and original Gond reward Source; check every original publication-year Journal is readable, attachment/art, actor ownership/copies and Region provenance. Historical Oct24 Item creation receipt is not sufficient for current world evidence.
2. Verify authentic H-U05 spine Mosaic interactive Region UUID and in-room concealed compartment Region/Tile and safe reveal/retention after scene reload. Do not use obsolete H-U06 portal/Scene.
3. Check source/method to acquire each book (Pond hollow log, Attic, chimney flue, Sophia shelf and Veil bed) and scene safety, including 1447 Veil phase/bed staging/actual separate pickup.
4. Authenticate real elected GM, requester, owned actor/token Region, authenticated Regionwright session and safe single-writer persistent reservation before any displayed puzzle reward; source's `origin:"elected-gm-readback"` string is NOT an auth layer.
5. Keep all interactive puzzle sprites/images/movable slots under Regionwright. No bespoke DCH HTML puzzle or regenerated art. Confirm approved cleaned book crop asset files; the older checkpoint says not verified on machine.

## Next bounded source package
L1-J: exact four-predicate Vault readiness (Basement access + charged original Gondian source + genuine Gond half + genuine Sune half), original emblem combination, and unique Vault **Keystone** (not Sune Bowl). Then distinct Undercroft outer Bowl+027, inner Keystone+lever and ending in later bounded packages.

## Turn-9 available-message reconstruction (not lossless)
User requested resume. Worker checked Bridge and independent two worktrees, reviewed locked LOCK-11 and original Oct24 six Item receipt/Regionwright generic engine, reconciled historical order publication note and latest H-U05 owner override. Built four pure contracts and 126 adversarial tests, ran 722 Cabin tests, updated evidence matrix and chronological log, and prepared this unique handoff. No registered UI, live world changes or relay.