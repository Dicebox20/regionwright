# Cabin in the Ashen Veil — H-U02 V006 original ten-Region native repair

Date: October 27, 2026 Pacific. Workstream: Chat A early/midgame. Owner delegated full Cabin creative and technical authority October 26; these exact coordinates are coordinator decisions. Crooked Man/haunt encounters last, manually GM-roleplayed. Full compatibility and non-GM acceptance deferred until all content installed.

## PREPARE / structural inspect

Bridge 0.1.26 PowerShell healthy, project/chat relay identity unverified (no Foreman partner send). Regionwright source codex/cav-sune-integration-20261026 prior HEAD 5f7841418268410fa39bcd3fab8b5d39f8d884f2, clean tracked source initially. Real elected Gamemaster 1 Foundry 14.367 world cabin-in-the-ashen-veil. H-U02 original Scene gGgUHlHdI7RFrbUh, 1440x1800, grid 220, 14 Regions, zero walls. Latest original owner-approved live image: Maps/cabin-in-the-ashen-veil/h-u02-upper-landing-owner-approved-textfree-v006-2026-10-24.png, native image 1086x1448, SHA256 89F276946506C45CE9F9D6AA6B08664A7029D8BAF90A18D9AECD6758DC06CB6C.

Visually inspected approved image: northwest Studio door, north-center Parents door, northeast Sophia door, southwest staircase and southeast loose floorboards for original H-U02 LOWER-RIGHT concealed attic hatch. Existing artwork does not display five distinct ordinary room doors; old V005 installer is not compatible and must not run. Original scripts/portal IDs and story locks must remain intact.

## BUILD / creative feature manifest

Ten existing native Region shapes were corrected in place. These entries are original Region IDs, original rectangle x,y,w,h -> new rectangle x,y,w,h:

- Great Room staircase QunJFtigwByZndFV: [630,2092,200,125] -> [185,1405,260,185].
- Great Room upper arrival xPTEg7ce2Bliz9M0: [632,1968,200,120] -> [170,1140,245,170].
- North-center Parents door JP0OmkgPCTtQXxpn: [1074,789,150,135] -> [620,80,220,150].
- Parents arrival CAVHU02PARENTAR1: [1068,939,148,55] -> [620,265,220,150].
- Northeast locked Sophia door UV4YAstBe0WCuLcM: [574,1258,150,135] -> [1120,115,235,170].
- Sophia return arrival CAVHU02SOPHAR001: [770,1435,125,110] -> [1100,345,230,160].
- Northwest Dahlia Art Studio door yXYWpil5Y5Avmy70: [1581,1174,240,240] -> [155,135,250,185].
- Studio return arrival pL0UiBSyEoINWzZQ: [1458,1238,120,120] -> [165,360,250,165].
- Concealed southeast attic hatch UOudBnxOGVlAlPoa: [1484,1988,165,145] -> [1090,1460,265,180].
- Central Attic return arrival 1DJ0FCse01r9J5P5: [1505,1862,120,120] -> [1065,1230,250,170].

No new Regions/Scenes created and no approved image modified. Actual four guarded native batches (2 stair, 4 north Parents/Sophia, 2 NW Art Studio, 2 concealed attic) individually preflighted exact Scene, map, original geometry, reciprocal destinations, original Behavior identities/states, Region conflicts, active non-GM viewed Scene and existing two PC tokens. Each batch preserved UUIDs, native source/events, original Stage/item flags and original reciprocal routes. All character positions unchanged. Original Sophia gate and rescue scripts remain enabled while its teleport stays DISABLED. Attic original Ladder Hook provenance script remains SHA256 6b673d12f662c0ea95570c048e32e5f0bd7da359ef1699d2931d6862b02547d0 and entry/return remain DISABLED until authentic player Hook/Carriage DONE.

Host native receipts are in Chrome for Testing Dev/utility-harness/artifacts:
1. cav-chat-a-hu02-v006-original-staircase-native-reprojection-20261027.json plus independent cav-chat-a-hu02-v006-stairs-independent-gm-postread-20261027.json
2. cav-chat-a-hu02-v006-parent-sophia-four-native-region-update-20261027.json
3. cav-chat-a-hu02-v006-dahlia-studio-native-reprojection-20261027.json
4. cav-chat-a-hu02-v006-concealed-attic-native-reprojection-20261027.json

IMPORTANT uncertainty reconciliation: Original attic write applied successfully but initial installer recorded native-attic-reconcile because AFTER return Behavior omitted its type field during JSON equality with the BEFORE record. This is a RECEIPT COMPARISON DEFECT, not verified world corruption. No replay or rollback was performed. Reconnected independent elected GM, inspected all source hashes, disabled portal states, after shapes, other Regions and tokens; SECOND receipt cav-chat-a-hu02-v006-attic-reconciliation-independent-gm-readback-20261027.json independently PASS.

## VERIFY

Four new focused source regression files, 12 new tests, full Cabin test suite 265/265 PASS, 0 failures, 49 files. Final independent elected-GM read-only all-ten inspection PASS: utility-harness/artifacts/cav-chat-a-hu02-v006-ten-region-independent-final-readback-20261027.json. All 10 exact geometry and existing reciprocal portal destinations match; original enabled/disabled locks unchanged; original two character tokens unmoved. Same shared live Foundry world 47 Scenes, 250 Regions, 140 Behaviors including independent Chat B activity; do NOT attribute world count changes to this Region-shape-only batch. No player test or campaign-wide compatibility diagnostic performed.

## Remaining H-U02 work

The original Nursery entrance aZ8eagmbvZUcPJ0g and Nursery return GOxaHb5OuQwPj6IC are the remaining TWO off-configured-scene rectangles. Original Guest entrance and return are within Scene but positioned over floor, not a clearly visible V006 doorway. Owner-approved art has only three obvious doors allocated to Parents, Sophia and Dahlia Studio. Do not invent doors or assign an enabled Nursery teleport to bare floor. Resolve the last Nursery/Guest doorway mismatch through the established PREPARE/RENDER/INSPECT/BUILD map workflow or a properly evidenced explicit secret-door redesign. Original H-U02 has no walls, like most of the current campaign; wall implementation remains a separate scene-creation workflow. Keep original Sophia and hidden-attic story gates intact. Chat B Undercroft/Silver Key untouched.

Status: 10 original H-U02 Region geometries repaired and independently GM verified. Two original Nursery Regions and Guest visual alignment remain outstanding. 265/265 source PASS. NOT final player acceptance.
