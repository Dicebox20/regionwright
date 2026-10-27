# Cabin in the Ashen Veil — Chat A upper gallery approved-art / native Region placement reconciliation

Date: October 27, 2026 Pacific, morning. Scope: PREPARE / STRUCTURAL_INSPECT / FEATURE_MANIFEST before any native relocation. Owner has delegated all creative/technical decision authority for Cabin, but preservation of the latest approved artwork and genuine story locks remains mandatory.

## Current verified baseline
Dicebox Bridge 0.1.26 PowerShell healthy. Regionwright branch codex/cav-sune-integration-20261026 at f8542fec3fcab9a1f84a6c015fec9cd4d33730cb, clean tracked checkout; 253/253 source tests PASS as previous recorded checkpoint, not rerun in this read-only map inspection. Existing exact elected GM in Foundry 14.367 original world cabin-in-the-ashen-veil. Shared world: 47 Scenes and 244 Regions at inspected readback, independent Chat B late-game/Undercroft data unchanged.

Original H-U02 Upper Gallery and Landing:
- Scene id gGgUHlHdI7RFrbUh, configured width 1440, height 1800, 14 native Regions, zero native walls, original stairs/Parents/Guest/Nursery/Art Studio/Sophia/Hatch portals and arrivals.
- ACTIVE approved background Maps/cabin-in-the-ashen-veil/h-u02-upper-landing-owner-approved-textfree-v006-2026-10-24.png, original physical PNG 1086x1448, SHA256 89F276946506C45CE9F9D6AA6B08664A7029D8BAF90A18D9AECD6758DC06CB6C.
- Previously documented 2026-10-24 'h-u02-owner-art-approval' predates this V006 and wrongly says owner-approved artwork not installed. Correct classification: V006 is LIVE INSTALLED but Region geometry is partly stale.
- Art visually inspected in a read-only thumbnail. It shows the northern central door, two upper diagonal/side doors, southwest descending staircase and broad walkable floor. It does not visibly represent the older five-exit/central-void blueprint in the established scene design. This is a real art-versus-navigation-topology discrepancy requiring explicit coordinate feature mapping, not permission to invent extra clickable physical doors.

## Read-only native Region bounds census

8 of 14 H-U02 Region rectangles extend beyond the scene configured 1440x1800 rectangle. The exact IDs are:
- QunJFtigwByZndFV: Staircase Down to Great Room, [630,2092,200,125] (live enabled teleport)
- xPTEg7ce2Bliz9M0: Arrival from Great Room, [632,1968,200,120] (landing)
- aZ8eagmbvZUcPJ0g: Nursery Entrance, [1503,815,150,145] (live enabled teleport)
- UOudBnxOGVlAlPoa: Attic Hatch, [1484,1988,165,145] (disabled teleport; original safe executeScript enabled)
- yXYWpil5Y5Avmy70: Art Studio Entrance, [1581,1174,240,240] (live enabled teleport)
- pL0UiBSyEoINWzZQ: Arrival from Dahlia Art Studio, [1458,1238,120,120] (landing)
- GOxaHb5OuQwPj6IC: Arrival from Nursery, [1396,945,120,120] (landing)
- 1DJ0FCse01r9J5P5: Arrival from Central Attic, [1505,1862,120,120] (landing)

Some shapes may technically be on padded Foundry canvas, so these are proven out of CONFIGURED SCENE RECT, not a claimed actual player-acceptance failure. However such Regions cannot currently be assumed aligned to the approved scene background. Preserve canonical Region UUIDs and puzzle locks.

Read-only all-scene rectangle audit: 9 rectangle shapes beyond configured scene dimensions among 244 total Regions, across TWO Scenes. Other outlier is EXT-TRAIL vOwnKQFQnVUnBymL [2473,2640,350,245] versus configured 4320x2880 (only 5 pixels over, likely minor boundary tolerance). Thus H-U02 contains 8 of 9 detected outliers. 42 of 47 Scenes have zero physical walls, so H-U02's wall absence is NOT unique; treat broader wall creation as an independent established scene-processing feature review, not permission to invent wall locations now. Detailed machine evidence: utility-harness/artifacts/cav-chat-a-original-scene-rect-bounds-geo-audit-20261027.json.

## Previous implementation evidence and potential conflict
The prior source h-u02-apply-owner-approved-map-v005-gm-macro.js explicitly expected 16 walls, older image 1122x1402, and its own Region rescaling/door placements; it was guarded for a superseded v002 image, so it MUST NOT be rerun against active V006. The older H-U02 PREPARE v004 called for four visible bedroom threshold doors, a central open void and south stairs. The current V006 approved image differs materially. The original 14 native Region identities and known portal destinations are already installed, and special Sophia/Attic locks must survive any future visual reconciliation.

## OWNER-DELEGATED IMPLEMENTATION DECISION
Preserve the actively owner-approved V006 map and all existing Region/Behavior identifiers now. Do NOT blindly resize/translate eight Regions or reuse the old V005 installer: with three visibly identifiable map doors but more functional room exits, automatic math could place active portals on invisible wall surfaces or route multiple destinations through the same hotspot. Reconcile the physical art with original campaign blueprint/door topology through a complete feature manifest, then perform exact-id guarded geometry migration with independent elected-GM postread; only alter native walls as part of the same approved feature specification. Owner's delegated authority allows making that design decision in a subsequent bounded BUILD; it does not make an uninspected geometrical guess safe.

## Status
This turn is READ-ONLY structural audit and cataloguing. No image, Region, Behavior, Item, actor, Scene, wall, lock, stage or Chat B Undercroft edits. No real non-GM player acceptance or broad compatibility diagnostic, per installation-first directive.

Next Chat A targeted work: reconcile map exit topology/door positions into a consistent player-facing H-U02 architectural plan; then guard and install only exact existing Region shapes (no duplicate Scene); re-verify Sophia locked door/Attic hook and two-way staircase after changes. Continue independent early/midgame tasks if the art mapping is not ready.
