# Cabin in the Ashen Veil — H-U02 V006 Nursery and Guest side-door completion

Date: October 27, 2026 Pacific, afternoon. Owner authorization: full Cabin creative/technical decisions delegated 2026-10-26. Chat A early/midgame only, Chat B Undercroft and Silver Tiny Key untouched. Crooked Man haunts installed last and GM roleplayed. Comprehensive compatibility and real player acceptance deferred until content installed.

## PREPARE / STRUCTURAL_INSPECT

Regionwright branch codex/cav-sune-integration-20261026, prior HEAD 8f2cac8cea2c20305bc99472f6b644186761d4d4, tracked checkout clean. Bridge PowerShell healthy. Foundry original world cabin-in-the-ashen-veil v14.367, unique active elected Gamemaster 1, 47 Scenes. H-U02 original Scene gGgUHlHdI7RFrbUh remains 1440x1800 with grid 220, 14 Regions, 0 walls. Existing owner-approved image Maps/cabin-in-the-ashen-veil/h-u02-upper-landing-owner-approved-textfree-v006-2026-10-24.png unchanged, original bitmap 1086x1448.

Decisive visual correction: enlarged cropped BOTH exterior side walls of ACTUAL owner-approved V006 artwork and discovered wooden door panels recessed in the WEST and EAST side walls. Earlier whole-map view made them easy to miss and led to the superseded conclusion that only three room doors were painted. Original canonical H-U02 PREPARE v003 spatial layout explicitly assigns Nursery H-U01 to WEST/SW doorway and Guest Bedroom H-U03 to EAST/SE doorway. V006 therefore supports FIVE ordinary room doors: NW Dahlia Studio, north-center Parents, NE Sophia, WEST Nursery, EAST Guest. The south staircase and hidden southeast attic hatch also remain. No image editing, new scenes, extra decorative doors or speculative bare-floor teleports required.

## FEATURE MANIFEST / GUARDED BUILD

One exact elected-GM native Foundry Scene.updateEmbeddedDocuments(Region) call reprojected FOUR existing H-U02 Region rectangles in place (no duplicate Region or Behavior; no player claims or Items):

- Nursery WEST source aZ8eagmbvZUcPJ0g: original [1503,815,150,145] -> [80,530,230,210]. Original enabled teleport Behavior nTpDUuUliqNzcwRs and original destination Scene.CAVHU01Scene0001.Region.CAVB1656B3C61F9A preserved.
- Nursery return GOxaHb5OuQwPj6IC: original [1396,945,120,120] -> [360,560,220,200]. Passive landing remains Behavior-free.
- Guest EAST source M2fZhuvFmw1yZQS9: original [642,773,150,145] -> [1110,535,235,205]. Original enabled teleport jB3CaIKquyf29FwX and destination Scene.CAVHU03Scene0001.Region.CAVB1B94A45D7219 preserved.
- Guest return dMdq36QOZUhvttza: original [708,863,120,120] -> [850,550,220,200]. Passive landing remains Behavior-free.

Original Nursery reciprocal on Scene.CAVHU01Scene0001.Region.JSvNdpeSZruKop1S Behavior uGz9xpoIXm9mTvvf still targets original GOxaHb5OuQwPj6IC landing. Original Guest reciprocal on Scene.CAVHU03Scene0001.Region.m7PexMjDlz5wgPoS Behavior zoYviwvwVSJ1kMZ4 still targets original dMdq36QOZUhvttza. Both reciprocal Behaviors remain enabled.

Before any edit exact GM/world/map/Scene/14 Regions/image size/grid/old Region rectangles/original enabled Behavior IDs/destinations/return routes verified; chosen rectangles do not collide with other 10 original H-U02 Regions, each other or two unmoved original player token centers. Connected non-GM user Dyscid was viewing Yard, not H-U02. Original Region flags including historical artStage PROVISIONAL and teleportPending were preserved unchanged as historical data; this report plus receipts provide current verified installation evidence. Source/behavior/flags/UUIDs unchanged.

## VERIFY

Native guarded same-call source/Behavior/flag/geometry/other-Region/token readback status native-four-original-side-doors-pass: utility-harness/artifacts/cav-chat-a-hu02-v006-side-nursery-guest-four-region-guarded-native-install-20261027.json.

An independent second separately connected elected-GM process READ ONLY confirms all original new rectangles, source outgoing Behavior ID, disabled state, original destinations and reciprocal room teleports, two unmodified player tokens, zero Region collisions, and ZERO rectangles outside the Scene's dimensions. H-U02 remains 14 Regions. Shared live world 47 Scenes, 250 Regions, 140 Behaviors (including Chat B concurrent work; no new Regions/Behaviors created in Chat A). Machine receipt PASS: utility-harness/artifacts/cav-chat-a-hu02-v006-nursery-guest-independent-gm-postread-20261027.json. First readback utility script had a JS syntax error before connection because outer reduce was not closed; corrected and independently passed. No game state changes occurred during failed readback utility.

New test file tests/cav-hu02-v006-west-nursery-east-guest-side-doors.test.mjs has 3 geometry/canonical tests. FULL Cabin suite 268/268 PASS, 0 failed, 50 files; prior 265/265.

## CATALOGUE / NEXT

H-U02 original five-room-door Region geometry is now COMPLETE at the installed native-config level, including previously installed original stair, Sophia lock, Dahlia Studio, Parents, hidden authentic-Ladder-Hook attic, Nursery and Guest. Earlier 8 off-scene Regions are now ZERO. The latest owner-approved map remains unmodified. Earlier handoff assertions saying Nursery/Guest doors are invisible and their Regions remain off scene are SUPERSEDED by enlarged visual proof and this genuine guarded installation.

Still NOT true non-GM player-playtested; exact token scene-change/landing behavior and practical door use await owner's end-of-install compatibility diagnostic. H-U02 currently has zero physical Foundry walls, like many other existing scenes: wall/collision pass remains separate established scene workflow, not silently performed as part of this Region coordinate repair. Crooked Man encounters remain dormant last. No Chat B late-game/Undercroft/Silver Key work altered. Earlier Forest Well active API still needs coordinated safe module reload; shape-only H-U02 edits themselves require no reload.